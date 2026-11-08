/**
 * @devomnitools/cleanroom-recon - API & Endpoint Extractor
 * Scans JavaScript bundles for REST endpoints, GraphQL operations, and external web services.
 */

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'ALL' | 'UNKNOWN';
  inferredCategory: 'Authentication' | 'User/Profile' | 'Billing' | 'Data/Analytics' | 'Core Feature' | 'Other';
  snippet?: string;
}

export function extractApiEndpoints(code: string): ApiEndpoint[] {
  const endpoints: Map<string, ApiEndpoint> = new Map();

  // Pattern 1: Explicit URL paths (/api/..., /v1/..., /v2/..., /graphql, /auth/...)
  const pathRegex = /["'`](\/(?:api|v[0-9]|graphql|auth|users|billing|subscriptions|webhooks|telemetry|track|rpc)[a-zA-Z0-9_\-\/.]*)["'`]/g;
  let match: RegExpExecArray | null;

  while ((match = pathRegex.exec(code)) !== null) {
    const rawPath = match[1];
    if (rawPath && !rawPath.endsWith('.js') && !rawPath.endsWith('.css') && !rawPath.endsWith('.png')) {
      const category = inferCategory(rawPath);
      endpoints.set(rawPath, {
        path: rawPath,
        method: 'UNKNOWN',
        inferredCategory: category,
        snippet: code.substring(Math.max(0, match.index - 20), Math.min(code.length, match.index + rawPath.length + 20)).trim()
      });
    }
  }

  // Pattern 2: fetch / axios with HTTP methods
  const fetchMethodRegex = /(?:fetch|axios|apiClient)\s*\(\s*["'`](\/[a-zA-Z0-9_\-\/.]+)["'`]\s*,\s*\{[\s\S]*?method\s*:\s*["'](GET|POST|PUT|DELETE|PATCH)["']/gi;
  let fetchMatch: RegExpExecArray | null;

  while ((fetchMatch = fetchMethodRegex.exec(code)) !== null) {
    const p = fetchMatch[1];
    const m = fetchMatch[2]?.toUpperCase() as ApiEndpoint['method'] || 'GET';
    if (p) {
      endpoints.set(p, {
        path: p,
        method: m,
        inferredCategory: inferCategory(p)
      });
    }
  }

  // Pattern 3: axios.get / axios.post shorthand
  const axiosShortRegex = /axios\.(get|post|put|delete|patch)\s*\(\s*["'`](\/[a-zA-Z0-9_\-\/.]+)["'`]/gi;
  let axMatch: RegExpExecArray | null;

  while ((axMatch = axiosShortRegex.exec(code)) !== null) {
    const m = axMatch[1]?.toUpperCase() as ApiEndpoint['method'] || 'GET';
    const p = axMatch[2];
    if (p) {
      endpoints.set(p, {
        path: p,
        method: m,
        inferredCategory: inferCategory(p)
      });
    }
  }

  return Array.from(endpoints.values()).sort((a, b) => a.path.localeCompare(b.path));
}

function inferCategory(path: string): ApiEndpoint['inferredCategory'] {
  const lower = path.toLowerCase();
  if (lower.includes('auth') || lower.includes('login') || lower.includes('oauth') || lower.includes('session') || lower.includes('token')) {
    return 'Authentication';
  }
  if (lower.includes('user') || lower.includes('profile') || lower.includes('account') || lower.includes('member')) {
    return 'User/Profile';
  }
  if (lower.includes('bill') || lower.includes('stripe') || lower.includes('pay') || lower.includes('subscription') || lower.includes('checkout')) {
    return 'Billing';
  }
  if (lower.includes('analytic') || lower.includes('track') || lower.includes('telemetry') || lower.includes('metric') || lower.includes('event')) {
    return 'Data/Analytics';
  }
  return 'Core Feature';
}

