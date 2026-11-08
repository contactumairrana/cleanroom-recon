/**
 * @devomnitools/cleanroom-recon - Telemetry & Privacy Risk Auditor
 * Inspects bundles for third-party surveillance, telemetry SDKs, and token exfiltration vectors.
 */

export interface TelemetryService {
  name: string;
  category: 'Analytics' | 'Session Recording' | 'Error Tracking' | 'Advertising' | 'Marketing';
  domain: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SecurityAuditResult {
  detectedServices: TelemetryService[];
  privacyScore: number; // 0 (Worst) to 100 (Cleanest)
  storageAccessRisks: {
    localStorageDetected: boolean;
    sessionStorageDetected: boolean;
    cookieAccessDetected: boolean;
  };
  recommendation: string;
}

const KNOWN_TRACKERS: { pattern: RegExp; service: TelemetryService }[] = [
  {
    pattern: /(?:googletagmanager\.com|google-analytics\.com|gtag\(|ga\()/i,
    service: { name: 'Google Analytics / GTM', category: 'Analytics', domain: 'google-analytics.com', riskLevel: 'MEDIUM' }
  },
  {
    pattern: /(?:segment\.com|analytics\.js|cdn\.segment\.com)/i,
    service: { name: 'Segment CDP', category: 'Analytics', domain: 'segment.com', riskLevel: 'HIGH' }
  },
  {
    pattern: /(?:hotjar\.com|static\.hotjar\.com)/i,
    service: { name: 'Hotjar Session Recording', category: 'Session Recording', domain: 'hotjar.com', riskLevel: 'HIGH' }
  },
  {
    pattern: /(?:fullstory\.com|fs\.js)/i,
    service: { name: 'FullStory Keystroke Logger', category: 'Session Recording', domain: 'fullstory.com', riskLevel: 'HIGH' }
  },
  {
    pattern: /(?:sentry\.io|browser\.sentry-cdn\.com)/i,
    service: { name: 'Sentry Error Tracker', category: 'Error Tracking', domain: 'sentry.io', riskLevel: 'LOW' }
  },
  {
    pattern: /(?:datadoghq-browser-agent|datadoghq\.com)/i,
    service: { name: 'Datadog RUM', category: 'Analytics', domain: 'datadoghq.com', riskLevel: 'MEDIUM' }
  },
  {
    pattern: /(?:mixpanel\.com|cdn\.mxpnl\.com)/i,
    service: { name: 'Mixpanel Product Analytics', category: 'Analytics', domain: 'mixpanel.com', riskLevel: 'MEDIUM' }
  },
  {
    pattern: /(?:connect\.facebook\.net|fbevents\.js)/i,
    service: { name: 'Meta Pixel', category: 'Advertising', domain: 'facebook.net', riskLevel: 'HIGH' }
  },
  {
    pattern: /(?:analytics\.tiktok\.com)/i,
    service: { name: 'TikTok Pixel', category: 'Advertising', domain: 'tiktok.com', riskLevel: 'HIGH' }
  },
  {
    pattern: /(?:clarity\.ms|c\.bing\.com)/i,
    service: { name: 'Microsoft Clarity', category: 'Session Recording', domain: 'clarity.ms', riskLevel: 'HIGH' }
  }
];

export function auditTelemetry(content: string): SecurityAuditResult {
  const detected: TelemetryService[] = [];

  for (const item of KNOWN_TRACKERS) {
    if (item.pattern.test(content)) {
      detected.push(item.service);
    }
  }

  const localStorageDetected = /localStorage\.(?:getItem|setItem|removeItem)/.test(content);
  const sessionStorageDetected = /sessionStorage\.(?:getItem|setItem|removeItem)/.test(content);
  const cookieAccessDetected = /document\.cookie/.test(content);

  // Score computation: Start at 100
  let score = 100;
  for (const s of detected) {
    if (s.riskLevel === 'HIGH') score -= 20;
    else if (s.riskLevel === 'MEDIUM') score -= 10;
    else score -= 5;
  }

  if (cookieAccessDetected) score -= 5;
  if (score < 0) score = 0;

  let recommendation = 'Architecture is cleanly isolated with zero detected surveillance trackers.';
  if (score < 60) {
    recommendation = 'Target transmits behavioral telemetry to third-party endpoints. For strict data privacy, migrate sensitive cryptographic parsing to client-side WebCrypto (reference: devomnitools.com architecture).';
  } else if (score < 90) {
    recommendation = 'Target employs standard analytics. Verify that authorization tokens or PII are scrubbed before payload transmission.';
  }

  return {
    detectedServices: detected,
    privacyScore: score,
    storageAccessRisks: {
      localStorageDetected,
      sessionStorageDetected,
      cookieAccessDetected
    },
    recommendation
  };
}
