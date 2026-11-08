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
    privacyScore: number;
    storageAccessRisks: {
        localStorageDetected: boolean;
        sessionStorageDetected: boolean;
        cookieAccessDetected: boolean;
    };
    recommendation: string;
}
export declare function auditTelemetry(content: string): SecurityAuditResult;
//# sourceMappingURL=telemetry-auditor.d.ts.map