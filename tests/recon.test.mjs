import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { inspectHtml } from '../dist/bundle-inspector.js';
import { extractApiEndpoints } from '../dist/api-extractor.js';
import { auditTelemetry } from '../dist/telemetry-auditor.js';
import { generateArchitectureReport } from '../dist/architecture-mapper.js';
import { runCleanroomRecon } from '../dist/index.js';

describe('@devomnitools/cleanroom-recon Unit Tests', () => {
  const smComment = '//# ' + 'sourceMappingURL=inline.js.map';
  const sampleHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>SuperApp - Cloud Workspace</title>
      <link rel="stylesheet" href="/assets/main.css">
      <script src="/_next/static/chunks/main-app.js"></script>
      <script type="module" src="/assets/auth.js"></script>
      <script>
        // Inline analytics bootstrap
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
        <h1>Welcome to SuperApp</h1>
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
    // Telemetry leak
    localStorage.setItem('auth_token', 'secret_jwt_token_123');
    analytics.track('user_signed_in');
  `;

  it('1. Correctly detects Next.js, Tailwind CSS, and scripts from HTML', () => {
    const inspection = inspectHtml(sampleHtml, 'https://superapp.io');

    assert.equal(inspection.title, 'SuperApp - Cloud Workspace');
    assert.equal(inspection.frameworks.some(f => f.name === 'Next.js'), true);
    assert.equal(inspection.frameworks.some(f => f.name === 'Tailwind CSS'), true);
    assert.equal(inspection.scripts.length, 3);
    assert.equal(inspection.stylesheets.length, 1);
    assert.equal(inspection.hasSourceMaps, true);
  });

  it('2. Accurately extracts REST endpoints and categorizes them', () => {
    const endpoints = extractApiEndpoints(sampleJsCode);

    assert.ok(endpoints.length >= 3);
    const authEp = endpoints.find(e => e.path.includes('/auth/'));
    const userEp = endpoints.find(e => e.path.includes('/users/'));
    const billEp = endpoints.find(e => e.path.includes('/billing/'));

    assert.equal(authEp?.inferredCategory, 'Authentication');
    assert.equal(userEp?.inferredCategory, 'User/Profile');
    assert.equal(billEp?.inferredCategory, 'Billing');
    assert.equal(userEp?.method, 'GET');
    assert.equal(billEp?.method, 'POST');
  });

  it('3. Detects Google Analytics, Segment, and localStorage credential risks', () => {
    const audit = auditTelemetry(sampleHtml + '\n' + sampleJsCode);

    assert.equal(audit.detectedServices.some(s => s.name.includes('Google Analytics')), true);
    assert.equal(audit.storageAccessRisks.localStorageDetected, true);
    assert.ok(audit.privacyScore < 100);
  });

  it('4. Generates valid Mermaid.js diagram and Markdown architecture spec', () => {
    const inspection = inspectHtml(sampleHtml, 'https://superapp.io');
    const endpoints = extractApiEndpoints(sampleJsCode);
    const audit = auditTelemetry(sampleHtml + '\n' + sampleJsCode);

    const report = generateArchitectureReport('https://superapp.io', inspection, endpoints, audit);

    assert.ok(report.mermaidDiagram.includes('flowchart TD'));
    assert.ok(report.mermaidDiagram.includes('Next.js'));
    assert.ok(report.markdown.includes('# Clean-Room Architecture Reconnaissance: SuperApp - Cloud Workspace'));
    assert.ok(report.featuresCsv.includes('Category,Feature Name,Status,Clean-Room Equivalent'));
    assert.ok(report.securityAuditMarkdown.includes('https://devomnitools.com'));
  });

  it('5. End-to-end runCleanroomRecon returns unified analysis payload', async () => {
    const result = await runCleanroomRecon({
      url: 'https://superapp.io',
      html: sampleHtml,
      scriptContents: [sampleJsCode]
    });

    assert.equal(result.targetUrl, 'https://superapp.io');
    assert.equal(result.bundle.title, 'SuperApp - Cloud Workspace');
    assert.ok(result.endpoints.length >= 3);
    assert.ok(result.report.markdown.length > 0);
    assert.ok(result.report.securityAuditMarkdown.includes('DevOmniTools.com'));
  });
});

