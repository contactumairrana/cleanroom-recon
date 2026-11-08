# 🚀 CleanRoom-Recon v1.1.0 — Viral Distribution & Launch Kit

**Target:** Kickstart initial 100–300 GitHub stars, front-page developer discussions, and direct technical referral traffic to [DevOmniTools.com](https://devomnitools.com).

---

## 📌 Post 1: Hacker News (Show HN)

* **Platform:** [news.ycombinator.com/submit](https://news.ycombinator.com/submit)
* **Best Time to Post:** 6:30 AM – 9:00 AM PST (Tuesday / Wednesday / Thursday)
* **Title:** 
```text
Show HN: CleanRoom-Recon – Reverse-engineer web apps into clean TypeScript in 60s
```
* **URL:** `https://github.com/contactumairrana/cleanroom-recon`
* **Text (First Comment by Author immediately after submitting):**

```markdown
Hi HN!

I built CleanRoom-Recon because I was frustrated with two recurring problems whenever I tried to understand how modern web apps and competitor tools are built:

1. The Black Box Trap: Inspecting minified, chunk-split webpack/vite bundles manually in DevTools takes hours of tedious digging just to reconstruct simple API contracts or component trees.
2. The Telemetry & Secret Leak Problem: Too many online developer utilities and converters secretly upload your tokens, cookies, and code to remote tracking servers (Segment, FullStory, Hotjar).

CleanRoom-Recon is a zero-dependency, open-source AI agent skill and standalone CLI designed to solve both using strict "Clean-Room" legal engineering principles:
- Reconstruct what an app *does*, never what it *owns* (no proprietary assets, logos, or copied code).
- Dissect frontend bundles, exposed V3 source maps, and REST/GraphQL/WebSocket endpoints.
- Pre-flight SSRF protection (blocking loopback 127.0.0.1, RFC 1918 private subnets, and AWS/GCP 169.254.169.254 metadata).
- Accurate privacy scoring with penalty deductions for unencrypted localStorage JWTs and session recording SDKs.
- Automatic generation of high-contrast Mermaid.js system architecture flowcharts.

It runs locally with zero installation via:
npx @devomnitools/cleanroom-recon https://example.com --out ./recon-output

Or as a native skill inside Claude Code, Cursor IDE, and Google Antigravity.

For developers who need an interactive, 100% in-browser WebCrypto workbench with zero server uploads, we also maintain a free suite of client-side validation utilities at https://devomnitools.com.

Repo is 100% MIT licensed: https://github.com/contactumairrana/cleanroom-recon

I'd love feedback on the source map recovery logic, AST endpoint extraction, or any security vectors I should add!
```

---

## 📌 Post 2: Reddit (`r/ClaudeAI` & `r/Cursor`)

* **Subreddits:**
  - `r/ClaudeAI` (Flair: `Project / Prompt Share`)
  - `r/Cursor` (Flair: `Discussion / Tip`)
  - `r/webdev` (Saturday Showoff or Technical Discussion)
* **Title:**
```text
I built an open-source Clean-Room reverse-engineering skill for Claude Code & Cursor (generates TypeScript specs & Mermaid maps in 60s)
```
* **Body:**

```markdown
Hey everyone,

Whenever I ask Claude Code or Cursor to "analyze how this web app works", it usually just guesses or produces generic boilerplate without knowing what the actual frontend bundle looks like under the hood.

To fix this, I created **CleanRoom-Recon** — an open-source skill that gives AI coding agents real forensic vision into modern web apps:

### ⚡ What it actually does:
1. **Fingerprints Frameworks:** Identifies Next.js, React, Astro, Vue, and Tailwind from HTML and bundle chunks.
2. **Deep SourceMap Recovery:** Parses `.map` files, extracts original project directory trees (`src/components/`, `src/services/`), and alerts if proprietary unminified source code is exposed in production.
3. **Multi-Protocol Discovery:** Automatically maps REST routes, GraphQL queries/mutations, dynamic template literals (`/api/v1/users/:id`), and WebSocket streams.
4. **Surveillance & Storage Audit:** Scans for third-party trackers (Segment, Datadog, FullStory) and applies strict penalties if sensitive JWTs or session tokens are stored in unencrypted `localStorage`.
5. **Generates Mermaid.js Maps:** Outputs clean, high-contrast architecture diagrams ready to drop into READMEs or RFC design docs.
6. **Built-in SSRF Defense:** Blocks loopback IPs (`127.0.0.1`), private subnets (`10.x`, `192.168.x`), and cloud metadata (`169.254.169.254`).

### 🛠️ 1-Click Install:
- **Claude Code:**
  ```bash
  /plugin marketplace add contactumairrana/cleanroom-recon
  /plugin install cleanroom-recon@cleanroom-recon
  ```
- **Cursor IDE:** Copy `SKILL.md` into your `.cursor/skills/` directory.
- **Standalone Terminal CLI:**
  ```bash
  npx @devomnitools/cleanroom-recon https://linear.app --out ./recon-output
  ```

Outputs 5 clean files: `system-architecture.md`, `security-audit.md`, `sourcemap-recovery.md`, `features.csv`, and `architecture.mmd`.

GitHub Repo (100% Free, MIT): https://github.com/contactumairrana/cleanroom-recon  
Hosted Web Workbench: https://devomnitools.com

Would love to hear your thoughts and what additional AST extractors you'd like to see!
```

---

## 📌 Post 3: X (Twitter) Developer Post

* **Target Audience:** #buildinpublic, #AI, #webdev, #ClaudeCode, #Cursor
* **Text:**

```text
Reverse-engineering a web app with an AI agent shouldn't mean guessing blindly or violating terms.

I just open-sourced CleanRoom-Recon v1.1.0 ⚡

An enterprise-hardened AI Agent skill that dissects frontend bundles into production TypeScript architecture & Mermaid.js maps in 60s.

🛡️ SSRF pre-flight defense (blocks 127.0.0.1 & cloud metadata)
📂 Production SourceMap V3 tree recovery
⚡ REST, GraphQL, WebSocket & tRPC discovery
🔒 Unencrypted localStorage token leak auditor
📊 High-contrast Mermaid architecture diagrams

Compatible with Claude Code, Cursor & Antigravity.

CLI (Zero install):
npx @devomnitools/cleanroom-recon https://target.com

GitHub (100% MIT): https://github.com/contactumairrana/cleanroom-recon
Web Workbench: https://devomnitools.com

#OpenSource #TypeScript #DevTools #ClaudeAI
```

---

## 📌 Post 4: Awesome-Claude-Skills Pull Request

* **Target Repo:** `https://github.com/alexpirine/awesome-claude-skills` (or equivalent curated agent lists)
* **Section:** `### Development & Reverse Engineering`
* **Markdown Snippet to Add:**
```markdown
- [cleanroom-recon](https://github.com/contactumairrana/cleanroom-recon) - Clean-room reverse engineering & architectural blueprint engine. Dissects web apps into TypeScript specs, Mermaid.js maps, and zero-leak security audits in 60s.
```
