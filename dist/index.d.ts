/**
 * @devomnitools/cleanroom-recon - Master Recon Engine
 * Clean-Room AI Agent Reverse Engineering & Architectural Blueprint Suite.
 */
import { inspectHtml, type BundleInspectionResult } from './bundle-inspector.js';
import { extractApiEndpoints, type ApiEndpoint } from './api-extractor.js';
import { auditTelemetry, type SecurityAuditResult } from './telemetry-auditor.js';
import { generateArchitectureReport, type ArchitectureReport } from './architecture-mapper.js';
export interface CleanroomReconOptions {
    url?: string;
    html?: string;
    scriptContents?: string[];
}
export interface CleanroomReconOutput {
    targetUrl: string;
    bundle: BundleInspectionResult;
    endpoints: ApiEndpoint[];
    security: SecurityAuditResult;
    report: ArchitectureReport;
}
export declare function runCleanroomRecon(options: CleanroomReconOptions): Promise<CleanroomReconOutput>;
export { inspectHtml, extractApiEndpoints, auditTelemetry, generateArchitectureReport };
//# sourceMappingURL=index.d.ts.map