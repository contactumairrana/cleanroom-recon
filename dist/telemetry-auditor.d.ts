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
    privacyScore: number;
    storageAccessRisks: StorageRiskAnalysis;
    scoreDeductions: {
        reason: string;
        points: number;
    }[];
    recommendation: string;
}
export declare function auditTelemetry(content: string): SecurityAuditResult;
//# sourceMappingURL=telemetry-auditor.d.ts.map