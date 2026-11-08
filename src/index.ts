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

export async function runCleanroomRecon(options: CleanroomReconOptions): Promise<CleanroomReconOutput> {
  let targetUrl = options.url || 'http://localhost';
  let html = options.html || '';

  // 1. Validate Target URL for SSRF protection
  if (options.url) {
    const check = validateSafeUrl(options.url);
    if (!check.isValid) {
      throw new Error(`[cleanroom-recon SSRF Block]: ${check.reason} (Target: ${options.url})`);
    }
  }

  // 2. Fetch HTML safely if URL provided and HTML is empty
  if (options.url && !html) {
    try {
      const res = await safeFetch(options.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 CleanRoomRecon/1.1'
        }
      });
      if (res.ok) {
        html = await res.text();
      }
    } catch (err: any) {
      console.warn(`[cleanroom-recon] Warning: Could not fetch URL (${targetUrl}):`, err?.message || err);
    }
  }

  // 3. Inspect HTML & Bundles
  const bundle = inspectHtml(html, targetUrl);

  // 4. Collect all code chunks
  let aggregateCode = html;
  if (options.scriptContents) {
    aggregateCode += '\n' + options.scriptContents.join('\n');
  }
  for (const s of bundle.scripts) {
    if (s.content) {
      aggregateCode += '\n' + s.content;
    }
  }

  // 5. Deep Concurrent Forensic Fetch for External Script Bundles (SSRF Safe)
  const sourcemapRefs: { scriptUrl: string; mapUrl: string }[] = [];

  if (options.url && bundle.scripts.length > 0) {
    const limit = options.maxBundlesToFetch || 8;
    const externalScripts = bundle.scripts
      .filter(s => !s.isInline && s.url.startsWith('http'))
      .slice(0, limit);

    if (externalScripts.length > 0) {
      const fetched = await Promise.allSettled(
        externalScripts.map(async (s) => {
          // SSRF check on script URL
          const sCheck = validateSafeUrl(s.url);
          if (!sCheck.isValid) return '';

          try {
            const res = await safeFetch(s.url, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CleanRoomRecon/1.1' }
            });
            if (res.ok) {
              const text = await res.text();
              s.content = text;

              const smMatch = text.match(/\/\/#\s*sourceMappingURL=([^\s]+)/);
              if (smMatch && smMatch[1]) {
                s.hasSourceMap = true;
                s.sourceMapUrl = smMatch[1];
                bundle.hasSourceMaps = true;
                sourcemapRefs.push({ scriptUrl: s.url, mapUrl: smMatch[1] });
              }
              return text;
            }
          } catch {
            // gracefully fallback
          }
          return '';
        })
      );

      for (const item of fetched) {
        if (item.status === 'fulfilled' && item.value) {
          aggregateCode += '\n' + item.value;
        }
      }
    }
  }

  // Also collect inline sourcemap references
  for (const s of bundle.scripts) {
    if (s.isInline && s.sourceMapUrl) {
      sourcemapRefs.push({ scriptUrl: targetUrl, mapUrl: s.sourceMapUrl });
    }
  }

  // 6. Deep SourceMap Recovery Analysis
  const sourcemapResults: SourceMapAnalysisResult[] = [];
  if (!options.skipSourcemapFetch && sourcemapRefs.length > 0) {
    for (const ref of sourcemapRefs.slice(0, 3)) { // analyze up to 3 sourcemaps
      const smRes = await analyzeSourceMap(ref.scriptUrl, ref.mapUrl, targetUrl);
      sourcemapResults.push(smRes);
    }
  }

  // 7. Extract Endpoints (REST, GraphQL, WebSocket) & Audit Telemetry
  const endpoints = extractApiEndpoints(aggregateCode);
  const security = auditTelemetry(aggregateCode);

  // 8. Generate Architecture, Mermaid & Security Report
  const report = generateArchitectureReport(targetUrl, bundle, endpoints, security, sourcemapResults);

  return {
    targetUrl,
    bundle,
    endpoints,
    security,
    sourcemaps: sourcemapResults,
    report
  };
}

export {
  inspectHtml,
  extractApiEndpoints,
  auditTelemetry,
  analyzeSourceMap,
  generateArchitectureReport,
  validateSafeUrl,
  safeFetch
};
