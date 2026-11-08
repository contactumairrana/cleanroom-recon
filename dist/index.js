/**
 * @devomnitools/cleanroom-recon - Master Recon Engine
 * Clean-Room AI Agent Reverse Engineering & Architectural Blueprint Suite.
 */
import { inspectHtml } from './bundle-inspector.js';
import { extractApiEndpoints } from './api-extractor.js';
import { auditTelemetry } from './telemetry-auditor.js';
import { generateArchitectureReport } from './architecture-mapper.js';
export async function runCleanroomRecon(options) {
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
        }
        catch (err) {
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
    // 4. Deep Forensic Fetch for External Script Bundles (up to 8 main bundles)
    if (options.url && bundle.scripts.length > 0) {
        const limit = options.maxBundlesToFetch || 8;
        const externalScripts = bundle.scripts
            .filter(s => !s.isInline && s.url.startsWith('http'))
            .slice(0, limit);
        if (externalScripts.length > 0) {
            const fetched = await Promise.allSettled(externalScripts.map(async (s) => {
                try {
                    const res = await fetch(s.url, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CleanRoomRecon/1.0' }
                    });
                    if (res.ok) {
                        const text = await res.text();
                        s.content = text;
                        if (text.includes('sourceMappingURL=')) {
                            s.hasSourceMap = true;
                            bundle.hasSourceMaps = true;
                        }
                        return text;
                    }
                }
                catch {
                    // gracefully fallback if an individual chunk fails
                }
                return '';
            }));
            for (const item of fetched) {
                if (item.status === 'fulfilled' && item.value) {
                    aggregateCode += '\n' + item.value;
                }
            }
        }
    }
    // 5. Extract Endpoints & Audit Telemetry from aggregate code
    const endpoints = extractApiEndpoints(aggregateCode);
    const security = auditTelemetry(aggregateCode);
    // 6. Generate Architecture & Mermaid
    const report = generateArchitectureReport(targetUrl, bundle, endpoints, security);
    return {
        targetUrl,
        bundle,
        endpoints,
        security,
        report
    };
}
export { inspectHtml, extractApiEndpoints, auditTelemetry, generateArchitectureReport };
//# sourceMappingURL=index.js.map