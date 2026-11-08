/**
 * @devomnitools/cleanroom-recon - SSRF & Network Security Filter
 * Enterprise-grade validation to prevent Server-Side Request Forgery (SSRF),
 * blocking loopback, RFC 1918 private subnets, cloud metadata endpoints, and internal TLDs.
 */

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  'instance-data'
]);

const BLOCKED_TLDS = [
  '.local',
  '.internal',
  '.localhost',
  '.lan',
  '.corp',
  '.home',
  '.onion'
];

export interface SsrfValidationResult {
  isValid: boolean;
  reason?: string;
  normalizedUrl?: string;
}

export function validateSafeUrl(rawUrl: string): SsrfValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, reason: 'URL must be a non-empty string' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { isValid: false, reason: 'Malformed URL format' };
  }

  // 1. Protocol Restriction: Only HTTP and HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, reason: `Forbidden protocol: ${parsed.protocol}. Only http: and https: are permitted.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Blocked Exact Hostnames
  if (BLOCKED_HOSTS.has(hostname)) {
    return { isValid: false, reason: `Forbidden host: "${hostname}" is a reserved loopback or metadata host.` };
  }

  // 3. Blocked Internal TLDs
  for (const tld of BLOCKED_TLDS) {
    if (hostname.endsWith(tld)) {
      return { isValid: false, reason: `Forbidden TLD: "${tld}" indicates a private/internal network domain.` };
    }
  }

  // 4. IP-Based SSRF Check (IPv4)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipMatch = hostname.match(ipv4Regex);

  if (ipMatch) {
    const octets = [
      parseInt(ipMatch[1], 10),
      parseInt(ipMatch[2], 10),
      parseInt(ipMatch[3], 10),
      parseInt(ipMatch[4], 10)
    ];

    for (const oct of octets) {
      if (oct < 0 || oct > 255) {
        return { isValid: false, reason: 'Invalid IP address octets.' };
      }
    }

    const [a, b] = octets;

    // Loopback: 127.0.0.0/8
    if (a === 127) {
      return { isValid: false, reason: 'Forbidden IP: 127.0.0.0/8 loopback range.' };
    }

    // Zero / Current Network: 0.0.0.0/8
    if (a === 0) {
      return { isValid: false, reason: 'Forbidden IP: 0.0.0.0/8 non-routable range.' };
    }

    // RFC 1918 Private Class A: 10.0.0.0/8
    if (a === 10) {
      return { isValid: false, reason: 'Forbidden IP: 10.0.0.0/8 private network range.' };
    }

    // RFC 1918 Private Class B: 172.16.0.0/12 (172.16 - 172.31)
    if (a === 172 && b >= 16 && b <= 31) {
      return { isValid: false, reason: 'Forbidden IP: 172.16.0.0/12 private network range.' };
    }

    // RFC 1918 Private Class C: 192.168.0.0/16
    if (a === 192 && b === 168) {
      return { isValid: false, reason: 'Forbidden IP: 192.168.0.0/16 private network range.' };
    }

    // Cloud Metadata / Link-Local: 169.254.0.0/16 (e.g. AWS 169.254.169.254)
    if (a === 169 && b === 254) {
      return { isValid: false, reason: 'Forbidden IP: 169.254.0.0/16 link-local and cloud metadata range.' };
    }

    // Carrier-Grade NAT: 100.64.0.0/10 (100.64 - 100.127)
    if (a === 100 && b >= 64 && b <= 127) {
      return { isValid: false, reason: 'Forbidden IP: 100.64.0.0/10 shared CGNAT range.' };
    }

    // Broadcast: 255.255.255.255
    if (octets[0] === 255 && octets[1] === 255 && octets[2] === 255 && octets[3] === 255) {
      return { isValid: false, reason: 'Forbidden IP: 255.255.255.255 broadcast address.' };
    }
  }

  // 5. IPv6 Check
  if (hostname.startsWith('[') || hostname.includes(':')) {
    const cleanIpv6 = hostname.replace(/[\[\]]/g, '');
    if (cleanIpv6 === '::1' || cleanIpv6.startsWith('fe80:') || cleanIpv6.startsWith('fc00:') || cleanIpv6.startsWith('fd00:')) {
      return { isValid: false, reason: 'Forbidden IPv6: Local/Private/Link-Local address.' };
    }
  }

  return { isValid: true, normalizedUrl: parsed.toString() };
}

export async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  const check = validateSafeUrl(url);
  if (!check.isValid) {
    throw new Error(`[cleanroom-recon SSRF Block]: ${check.reason} (Target: ${url})`);
  }

  return fetch(check.normalizedUrl || url, {
    ...init,
    redirect: 'follow'
  });
}

