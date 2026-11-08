/**
 * @devomnitools/cleanroom-recon - Architecture & Diagram Mapper
 * Generates high-contrast Mermaid.js architecture diagrams and clean-room specification markdown.
 */
import type { BundleInspectionResult } from './bundle-inspector.js';
import type { ApiEndpoint } from './api-extractor.js';
import type { SecurityAuditResult } from './telemetry-auditor.js';
export interface ArchitectureReport {
    markdown: string;
    mermaidDiagram: string;
    featuresCsv: string;
    securityAuditMarkdown: string;
}
export declare function generateArchitectureReport(targetUrl: string, bundle: BundleInspectionResult, endpoints: ApiEndpoint[], security: SecurityAuditResult): ArchitectureReport;
//# sourceMappingURL=architecture-mapper.d.ts.map