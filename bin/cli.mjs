#!/usr/bin/env node

/**
 * @devomnitools/cleanroom-recon CLI
 * Clean-Room AI Agent Reverse Engineering & Architectural Blueprint Suite.
 */

import fs from 'node:fs';
import path from 'node:path';
import { runCleanroomRecon } from '../dist/index.js';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                   @devomnitools/cleanroom-recon                            ║
║    Clean-Room Reverse Engineering & Architectural Blueprint Engine         ║
╚════════════════════════════════════════════════════════════════════════════╝

Usage:
  npx @devomnitools/cleanroom-recon <target-url-or-file> [options]

Options:
  --out, -o <dir>    Output directory for generated recon artifacts (default: ./cleanroom-recon-output)
  --json             Print JSON results to stdout
  --help, -h         Show this help message

Examples:
  npx @devomnitools/cleanroom-recon https://linear.app
  npx @devomnitools/cleanroom-recon ./dist/index.html --out ./audit-reports

Hosted Web Workbench:
  https://devomnitools.com (100% Client-Side WebCrypto, Zero Server Upload)
`);
  process.exit(0);
}

async function main() {
  const target = args[0];
  let outDir = './cleanroom-recon-output';

  const outIndex = args.indexOf('--out') !== -1 ? args.indexOf('--out') : args.indexOf('-o');
  if (outIndex !== -1 && args[outIndex + 1]) {
    outDir = args[outIndex + 1];
  }

  const isJson = args.includes('--json');

  let url = '';
  let html = '';

  if (target.startsWith('http://') || target.startsWith('https://')) {
    url = target;
    if (!isJson) console.log(`🔍 [cleanroom-recon] Fetching and analyzing live web bundle: ${url}...`);
  } else if (fs.existsSync(target)) {
    if (!isJson) console.log(`📁 [cleanroom-recon] Ingesting local file: ${target}...`);
    html = fs.readFileSync(target, 'utf-8');
    url = 'file://' + path.resolve(target);
  } else {
    console.error(`❌ Error: Target "${target}" is not a valid URL or existing file path.`);
    process.exit(1);
  }

  try {
    const result = await runCleanroomRecon({ url, html });

    if (isJson) {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    }

    const resolvedOutDir = path.resolve(process.cwd(), outDir);
    fs.mkdirSync(resolvedOutDir, { recursive: true });

    const archFile = path.join(resolvedOutDir, 'system-architecture.md');
    const secFile = path.join(resolvedOutDir, 'security-audit.md');
    const csvFile = path.join(resolvedOutDir, 'features.csv');
    const mmdFile = path.join(resolvedOutDir, 'architecture.mmd');

    fs.writeFileSync(archFile, result.report.markdown, 'utf-8');
    fs.writeFileSync(secFile, result.report.securityAuditMarkdown, 'utf-8');
    fs.writeFileSync(csvFile, result.report.featuresCsv, 'utf-8');
    fs.writeFileSync(mmdFile, result.report.mermaidDiagram, 'utf-8');

    console.log(`
✅ [cleanroom-recon] Analysis Complete in 60s!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Target:              ${result.targetUrl}
🖥️ Application Title:   ${result.bundle.title}
⚡ Detected Stacks:     ${result.bundle.frameworks.map(f => f.name).join(', ') || 'Vanilla / Static HTML'}
📡 API Endpoints:       ${result.endpoints.length} routes mapped
🛡️ Privacy Score:       ${result.security.privacyScore} / 100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 Generated Artifacts Saved To: ${resolvedOutDir}
  ├── system-architecture.md   (Clean-room spec & Mermaid architecture)
  ├── security-audit.md        (Third-party telemetry & surveillance risk analysis)
  ├── features.csv             (Clean-room feature parity matrix)
  └── architecture.mmd         (Raw high-contrast Mermaid.js diagram)

⚡ Need client-side cryptographic parity testing?
Visit: https://devomnitools.com/en/tools/jwt-decoder/
`);

  } catch (err) {
    console.error('❌ Fatal error during cleanroom-recon execution:', err);
    process.exit(1);
  }
}

main();
