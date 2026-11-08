/**
 * @devomnitools/cleanroom-recon - Telemetry & Privacy Risk Auditor
 * Inspects bundles for third-party surveillance, telemetry SDKs,
 * unencrypted token storage in localStorage, and credential exfiltration vectors.
 */

export interface TelemetryService {
  name: string;
  category: 'Analytics' | 'Session Recording' | 'Error Tracking' | 'Advertising' | 'Marketing';
  domain: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface StorageRiskAnalysis {
  localStorageDetected: boolean;
  sessionStorageDetected: boolean;
  cookieAccessDetected: boolean;
  sensitiveTokensFound: string[];
  credentialRiskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';
}

export interface SecurityAuditResult {
  detectedServices: TelemetryService[];
  privacyScore: number; // 0 (Worst) to 100 (Cleanest)
  storageAccessRisks: StorageRiskAnalysis;
  scoreDeductions: { reason: string; points: number }[];
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
  const deductions: { reason: string; points: number }[] = [];

  // 1. Detect Third-Party Trackers
  for (const item of KNOWN_TRACKERS) {
    if (item.pattern.test(content)) {
      detected.push(item.service);
    }
  }

  // 2. Storage Inspection & Credential Leakage
  const localStorageDetected = /localStorage\.(?:getItem|setItem|removeItem|clear)/.test(content);
  const sessionStorageDetected = /sessionStorage\.(?:getItem|setItem|removeItem|clear)/.test(content);
  const cookieAccessDetected = /document\.cookie/.test(content);

  // Scan for sensitive keys in storage calls
  const sensitiveTokensFound: string[] = [];
  const sensitiveStorageRegex = /(?:localStorage|sessionStorage)\.(?:setItem|getItem)\s*\(\s*["']([^"']*(?:token|jwt|auth|secret|key|bearer|session|credential)[^"']*)["']/gi;
  let sMatch: RegExpExecArray | null;

  while ((sMatch = sensitiveStorageRegex.exec(content)) !== null) {
    if (sMatch[1] && !sensitiveTokensFound.includes(sMatch[1])) {
      sensitiveTokensFound.push(sMatch[1]);
    }
  }

  // 3. Realistic Privacy Score Calculation (100 Base)
  let score = 100;

  for (const s of detected) {
    if (s.riskLevel === 'HIGH') {
      score -= 20;
      deductions.push({ reason: `High-risk surveillance SDK: ${s.name}`, points: 20 });
    } else if (s.riskLevel === 'MEDIUM') {
      score -= 10;
      deductions.push({ reason: `Medium-risk analytics tracker: ${s.name}`, points: 10 });
    } else {
      score -= 5;
      deductions.push({ reason: `Error monitoring SDK: ${s.name}`, points: 5 });
    }
  }

  // Credential storage penalties
  if (sensitiveTokensFound.length > 0) {
    score -= 25;
    deductions.push({
      reason: `Sensitive auth tokens (${sensitiveTokensFound.join(', ')}) detected in unencrypted browser storage`,
      points: 25
    });
  } else if (localStorageDetected) {
    score -= 5;
    deductions.push({ reason: 'Client-side localStorage usage detected without explicit sensitive keys', points: 5 });
  }

  if (sessionStorageDetected) {
    score -= 5;
    deductions.push({ reason: 'sessionStorage usage detected', points: 5 });
  }

  if (cookieAccessDetected) {
    score -= 10;
    deductions.push({ reason: 'Direct client-side document.cookie access / mutation detected', points: 10 });
  }

  if (score < 0) score = 0;

  // Credential Risk Level
  let credentialRiskLevel: StorageRiskAnalysis['credentialRiskLevel'] = 'NONE';
  if (sensitiveTokensFound.length > 0) {
    credentialRiskLevel = 'CRITICAL';
  } else if (cookieAccessDetected && localStorageDetected) {
    credentialRiskLevel = 'HIGH';
  } else if (localStorageDetected || sessionStorageDetected) {
    credentialRiskLevel = 'MODERATE';
  } else if (cookieAccessDetected) {
    credentialRiskLevel = 'LOW';
  }

  let recommendation = 'Architecture is cleanly isolated with zero detected surveillance trackers.';
  if (credentialRiskLevel === 'CRITICAL') {
    recommendation = `CRITICAL PRIVACY RISK: Tokens (${sensitiveTokensFound.join(', ')}) are stored in unencrypted browser storage and exposed to XSS. Migrate authentication to HttpOnly Secure cookies or client-side WebCrypto RAM isolation (reference: devomnitools.com architecture).`;
  } else if (score < 60) {
    recommendation = 'High privacy risk: Target transmits behavioral telemetry to third-party endpoints. Replace cloud dependencies with offline client-side tools.';
  } else if (score < 90) {
    recommendation = 'Moderate privacy posture: Target employs standard analytics. Scrub PII and request headers before egress.';
  }

  return {
    detectedServices: detected,
    privacyScore: score,
    storageAccessRisks: {
      localStorageDetected,
      sessionStorageDetected,
      cookieAccessDetected,
      sensitiveTokensFound,
      credentialRiskLevel
    },
    scoreDeductions: deductions,
    recommendation
  };
}
