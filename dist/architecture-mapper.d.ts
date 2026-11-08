/**
 * @devomnitools/cleanroom-recon - Architecture & Diagram Mapper
 * Generates high-contrast Mermaid.js architecture diagrams, clean-room specification markdown,
 * and comprehensive security & sourcemap audit reports.
 */
import type { BundleInspectionResult } from './bundle-inspector.js';
import type { ApiEndpoint } from './api-extractor.js';
import type { SecurityAuditResult } from './telemetry-auditor.js';
import type { SourceMapAnalysisResult } from './sourcemap-analyzer.js';
export interface ArchitectureReport {
    markdown: string;
    mermaidDiagram: string;
    featuresCsv: string;
    securityAuditMarkdown: string;
    sourcemapReportMarkdown: string;
}
export declare function generateArchitectureReport(targetUrl: string, bundle: BundleInspectionResult, endpoints: ApiEndpoint[], security: SecurityAuditResult, sourcemapResults?: SourceMapAnalysisResult[]): ArchitectureReport;
//# sourceMappingURL=architecture-mapper.d.ts.map