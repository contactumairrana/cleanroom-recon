/**
 * @devomnitools/cleanroom-recon - Master Recon Engine (Enterprise Hardened)
 * Clean-Room AI Agent Reverse Engineering & Architectural Blueprint Suite.
 * Enforces SSRF protection, accurate storage penalty scoring, sourcemap recovery,
 * and GraphQL/WebSocket route extraction.
 */
import { inspectHtml, type BundleInspectionResult } from './bundle-inspector.js';
import { extractApiEndpoints, type ApiEndpoint } from './api-extractor.js';
import { auditTelemetry, type SecurityAuditResult } from './telemetry-auditor.js';
import { analyzeSourceMap, type SourceMapAnalysisResult } from './sourcemap-analyzer.js';
import { generateArchitectureReport, type ArchitectureReport } from './architecture-mapper.js';
import { validateSafeUrl, safeFetch } from './ssrf-filter.js';
export interface CleanroomReconOptions {
    url?: string;
    html?: string;
    scriptContents?: string[];
    maxBundlesToFetch?: number;
    skipSourcemapFetch?: boolean;
}
export interface CleanroomReconOutput {
    targetUrl: string;
    bundle: BundleInspectionResult;
    endpoints: ApiEndpoint[];
    security: SecurityAuditResult;
    sourcemaps: SourceMapAnalysisResult[];
    report: ArchitectureReport;
}
export declare function runCleanroomRecon(options: CleanroomReconOptions): Promise<CleanroomReconOutput>;
export { inspectHtml, extractApiEndpoints, auditTelemetry, analyzeSourceMap, generateArchitectureReport, validateSafeUrl, safeFetch };
//# sourceMappingURL=index.d.ts.map