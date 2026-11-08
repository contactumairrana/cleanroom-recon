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

export async function runCleanroomRecon(options: CleanroomReconOptions): Promise<CleanroomReconOutput> {
  let targetUrl = options.url || 'http://localhost';
  let html = options.html || '';

  // 1. Fetch HTML if URL provided and HTML is empty
  if (options.url && !html) {
    try {
      const res = await fetch(options.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 CleanRoomRecon/1.0'
        }
      });
      if (res.ok) {
        html = await res.text();
      }
    } catch (err) {
      console.warn(`[cleanroom-recon] Warning: Could not fetch URL (${targetUrl}):`, err);
    }
  }

  // 2. Inspect HTML & Bundles
  const bundle = inspectHtml(html, targetUrl);

  // 3. Collect all code chunks
  let aggregateCode = html;
  if (options.scriptContents) {
    aggregateCode += '\n' + options.scriptContents.join('\n');
  }
  for (const s of bundle.scripts) {
    if (s.content) {
      aggregateCode += '\n' + s.content;
    }
  }

  // 4. Extract Endpoints & Audit Telemetry
  const endpoints = extractApiEndpoints(aggregateCode);
  const security = auditTelemetry(aggregateCode);

  // 5. Generate Architecture & Mermaid
  const report = generateArchitectureReport(targetUrl, bundle, endpoints, security);

  return {
    targetUrl,
    bundle,
    endpoints,
    security,
    report
  };
}

export {
  inspectHtml,
  extractApiEndpoints,
  auditTelemetry,
  generateArchitectureReport
};
