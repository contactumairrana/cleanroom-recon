import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { inspectHtml } from '../dist/bundle-inspector.js';
import { extractApiEndpoints } from '../dist/api-extractor.js';
import { auditTelemetry } from '../dist/telemetry-auditor.js';
import { validateSafeUrl } from '../dist/ssrf-filter.js';
import { parseSourceMapJson } from '../dist/sourcemap-analyzer.js';
import { generateArchitectureReport } from '../dist/architecture-mapper.js';
import { runCleanroomRecon } from '../dist/index.js';

describe('@devomnitools/cleanroom-recon Enterprise Test Suite', () => {
  const smComment = '//# ' + 'sourceMappingURL=inline.js.map';
  const sampleHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Enterprise Workspace</title>
      <link rel="stylesheet" href="/assets/main.css">
      <script src="/_next/static/chunks/main-app.js"></script>
      <script type="module" src="/assets/auth.js"></script>
      <script>
        (function() {
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXXXXX');
        })();
        ${smComment}
      </script>
    </head>
    <body>
      <div id="__next" class="flex min-h-screen p-4 bg-gray-50">
        <h1>Welcome</h1>
      </div>
    </body>
    </html>
  `;

  const sampleJsCode = `
    const API_BASE = '/api/v1/auth/session';
    async function getUserData() {
      const res = await fetch('/api/v2/users/profile', { method: 'GET' });
      return res.json();
    }
    async function updateBilling() {
      return axios.post('/api/billing/subscriptions', { plan: 'pro' });
    }
    // Dynamic Template Route
    const userSettingsUrl = \`/api/v1/users/\${userId}/settings\`;

    // GraphQL Operation
    const GET_ACCOUNTS = gql\`
      query GetAccounts {
        accounts { id name balance }
      }
    \`;

    // WebSocket Channel
    const ws = new WebSocket('wss://realtime.enterprise.com/v1/stream');

    // Telemetry & Storage Leak
    localStorage.setItem('auth_token', 'eyJhbGciOi...');
    sessionStorage.setItem('temp_state', '1');
    document.cookie = "sessionId=xyz";
    analytics.track('user_signed_in');
  `;

  // --- 1. SSRF Filter Tests ---
  it('1. SSRF Filter: Blocks loopback addresses (127.0.0.1, localhost, ::1, 0.0.0.0)', () => {
    assert.equal(validateSafeUrl('http://127.0.0.1/admin').isValid, false);
    assert.equal(validateSafeUrl('http://localhost:3000').isValid, false);
    assert.equal(validateSafeUrl('http://0.0.0.0').isValid, false);
    assert.equal(validateSafeUrl('http://[::1]/status').isValid, false);
  });

  it('2. SSRF Filter: Blocks RFC 1918 private subnets (10.x, 172.16.x, 192.168.x)', () => {
    assert.equal(validateSafeUrl('http://10.0.0.1:8080/internal').isValid, false);
    assert.equal(validateSafeUrl('http://172.16.0.100').isValid, false);
    assert.equal(validateSafeUrl('http://172.31.255.255').isValid, false);
    assert.equal(validateSafeUrl('http://192.168.1.1').isValid, false);
  });

  it('3. SSRF Filter: Blocks AWS/GCP cloud metadata endpoints and internal TLDs', () => {
    assert.equal(validateSafeUrl('http://169.254.169.254/latest/meta-data/').isValid, false);
    assert.equal(validateSafeUrl('http://metadata.google.internal/computeMetadata/v1/').isValid, false);
    assert.equal(validateSafeUrl('http://server.local/api').isValid, false);
    assert.equal(validateSafeUrl('http://database.internal/').isValid, false);
  });

  it('4. SSRF Filter: Accepts valid public web targets', () => {
    assert.equal(validateSafeUrl('https://example.com').isValid, true);
    assert.equal(validateSafeUrl('https://devomnitools.com/en/tools/jwt-decoder/').isValid, true);
    assert.equal(validateSafeUrl('http://8.8.8.8/test').isValid, true);
  });

  // --- 2. Advanced API & GraphQL Extraction Tests ---
  it('5. API Extractor: Discovers REST, Dynamic Templates, GraphQL, and WebSockets', () => {
    const endpoints = extractApiEndpoints(sampleJsCode);

    const hasAuth = endpoints.some(e => e.path.includes('/auth/'));
    const hasDynamic = endpoints.some(e => e.path.includes(':param'));
    const hasGql = endpoints.some(e => e.method === 'GQL' && e.path.includes('GetAccounts'));
    const hasWs = endpoints.some(e => e.method === 'WS' && e.path.startsWith('wss://'));

    assert.equal(hasAuth, true);
    assert.equal(hasDynamic, true);
    assert.equal(hasGql, true);
    assert.equal(hasWs, true);
  });

  // --- 3. Accurate Privacy Scoring & Storage Penalty Tests ---
  it('6. Privacy Auditor: Applies realistic penalties for unencrypted token storage', () => {
    const audit = auditTelemetry(sampleJsCode);

    assert.equal(audit.storageAccessRisks.credentialRiskLevel, 'CRITICAL');
    assert.ok(audit.storageAccessRisks.sensitiveTokensFound.includes('auth_token'));
    assert.ok(audit.privacyScore <= 60); // Significant deduction due to token + cookie + sessionStorage
    assert.ok(audit.scoreDeductions.some(d => d.reason.includes('auth_token')));
  });

  // --- 4. SourceMap Parser & Directory Tree Tests ---
  it('7. SourceMap Analyzer: Recovers original directory tree and flags code exposure', () => {
    const mockMapData = {
      version: 3,
      sources: [
        'webpack://client/src/components/Header.tsx',
        'webpack://client/src/services/apiClient.ts',
        'webpack://client/src/utils/crypto.ts'
      ],
      sourcesContent: [
        'export const Header = () => <nav>Logo</nav>;',
        'export const apiClient = axios.create();',
        'export function encrypt(data: string) { return data; }'
      ]
    };

    const parsed = parseSourceMapJson(mockMapData, 'https://example.com/bundle.js.map');

    assert.equal(parsed.hasSourceMap, true);
    assert.equal(parsed.sourceCount, 3);
    assert.equal(parsed.isSourceCodeExposed, true);
    assert.ok(parsed.directoryTree['src/components'].includes('Header.tsx'));
    assert.ok(parsed.directoryTree['src/services'].includes('apiClient.ts'));
  });

  // --- 5. Framework Inspection Tests ---
  it('8. Bundle Inspector: Accurately identifies Next.js and Tailwind CSS', () => {
    const inspection = inspectHtml(sampleHtml, 'https://workspace.io');

    assert.equal(inspection.title, 'Enterprise Workspace');
    assert.equal(inspection.frameworks.some(f => f.name === 'Next.js'), true);
    assert.equal(inspection.frameworks.some(f => f.name === 'Tailwind CSS'), true);
    assert.equal(inspection.hasSourceMaps, true);
  });

  // --- 6. End-to-End Orchestrator & SSRF Defense ---
  it('9. runCleanroomRecon: Throws immediate SSRF exception on private targets', async () => {
    await assert.rejects(
      async () => {
        await runCleanroomRecon({ url: 'http://127.0.0.1:8080/admin' });
      },
      /SSRF Block/
    );
  });

  it('10. runCleanroomRecon: Generates unified 5-part architecture and security report', async () => {
    const result = await runCleanroomRecon({
      url: 'https://workspace.io',
      html: sampleHtml,
      scriptContents: [sampleJsCode]
    });

    assert.equal(result.targetUrl, 'https://workspace.io');
    assert.ok(result.endpoints.length >= 4);
    assert.ok(result.report.markdown.includes('Enterprise Workspace'));
    assert.ok(result.report.securityAuditMarkdown.includes('CRITICAL'));
    assert.ok(result.report.sourcemapReportMarkdown.length > 0);
    assert.ok(result.report.securityAuditMarkdown.includes('DevOmniTools.com'));
  });
});
