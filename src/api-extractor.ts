/**
 * @devomnitools/cleanroom-recon - Advanced API & Route Extractor
 * Dissects JavaScript bundles for REST endpoints, GraphQL operations,
 * WebSocket channels, Next.js App Router actions, and dynamic route patterns.
 */

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS' | 'GQL' | 'RPC' | 'UNKNOWN';
  inferredCategory: 'Authentication' | 'User/Profile' | 'Billing' | 'Data/Analytics' | 'GraphQL' | 'Realtime/WebSocket' | 'Core Feature' | 'Other';
  snippet?: string;
}

export function extractApiEndpoints(code: string): ApiEndpoint[] {
  const endpoints: Map<string, ApiEndpoint> = new Map();

  // Pattern 1: Static and REST Path Strings (/api/..., /v1/..., /v2/..., /auth/...)
  const pathRegex = /["'`](\/(?:api|v[0-9]|graphql|auth|users|billing|subscriptions|webhooks|telemetry|track|rpc)[a-zA-Z0-9_\-\/.]*)["'`]/g;
  let match: RegExpExecArray | null;

  while ((match = pathRegex.exec(code)) !== null) {
    const rawPath = match[1];
    if (rawPath && !rawPath.endsWith('.js') && !rawPath.endsWith('.css') && !rawPath.endsWith('.png') && !rawPath.endsWith('.svg')) {
      const category = inferCategory(rawPath);
      endpoints.set(rawPath, {
        path: rawPath,
        method: rawPath.includes('graphql') ? 'GQL' : 'UNKNOWN',
        inferredCategory: category,
        snippet: code.substring(Math.max(0, match.index - 20), Math.min(code.length, match.index + rawPath.length + 20)).trim()
      });
    }
  }

  // Pattern 2: Dynamic Template Literal URLs: `/api/v1/users/${id}/details` -> `/api/v1/users/:param/details`
  const dynamicUrlRegex = /`(\/(?:api|v[0-9]|auth|billing)[^`\n]+)`/g;
  let dynMatch: RegExpExecArray | null;

  while ((dynMatch = dynamicUrlRegex.exec(code)) !== null) {
    const rawTemplate = dynMatch[1];
    // Replace ${...} with :param
    const normalized = rawTemplate.replace(/\$\{[^}]+\}/g, ':param');
    if (!endpoints.has(normalized)) {
      endpoints.set(normalized, {
        path: normalized,
        method: 'UNKNOWN',
        inferredCategory: inferCategory(normalized),
        snippet: rawTemplate
      });
    }
  }

  // Pattern 3: fetch / axios with explicit HTTP methods
  const fetchMethodRegex = /(?:fetch|axios|apiClient)\s*\(\s*["'`](\/[a-zA-Z0-9_\-\/.:]+)["'`]\s*,\s*\{[\s\S]*?method\s*:\s*["'](GET|POST|PUT|DELETE|PATCH)["']/gi;
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

  // Pattern 4: axios.get / axios.post / axios.delete shorthand
  const axiosShortRegex = /axios\.(get|post|put|delete|patch)\s*\(\s*["'`](\/[a-zA-Z0-9_\-\/.:]+)["'`]/gi;
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

  // Pattern 5: GraphQL Queries and Mutations
  const gqlRegex = /(?:gql`|graphql`|\bquery\b|\bmutation\b)[\s\S]*?(query|mutation)\s+([a-zA-Z0-9_]+)\b/g;
  let gqlMatch: RegExpExecArray | null;

  while ((gqlMatch = gqlRegex.exec(code)) !== null) {
    const opType = gqlMatch[1]?.toLowerCase();
    const opName = gqlMatch[2];
    if (opName && opName !== 'function' && opName !== 'const') {
      const gqlPath = `/graphql#${opType}:${opName}`;
      endpoints.set(gqlPath, {
        path: gqlPath,
        method: 'GQL',
        inferredCategory: 'GraphQL',
        snippet: `${opType} ${opName}`
      });
    }
  }

  // Pattern 6: WebSocket endpoints (wss:// or ws://)
  const wsRegex = /["'`](wss?:\/\/[a-zA-Z0-9_\-\/.:]+)["'`]/gi;
  let wsMatch: RegExpExecArray | null;

  while ((wsMatch = wsRegex.exec(code)) !== null) {
    const wsUrl = wsMatch[1];
    endpoints.set(wsUrl, {
      path: wsUrl,
      method: 'WS',
      inferredCategory: 'Realtime/WebSocket',
      snippet: wsUrl
    });
  }

  // Pattern 7: Next.js App Router Server Actions / tRPC
  const trpcRegex = /\btrpc\.([a-zA-Z0-9_.]+)\.(?:useQuery|useMutation|query|mutate)\b/g;
  let trpcMatch: RegExpExecArray | null;

  while ((trpcMatch = trpcRegex.exec(code)) !== null) {
    const rpcPath = `/trpc/${trpcMatch[1]}`;
    endpoints.set(rpcPath, {
      path: rpcPath,
      method: 'RPC',
      inferredCategory: inferCategory(rpcPath),
      snippet: rpcPath
    });
  }

  return Array.from(endpoints.values()).sort((a, b) => a.path.localeCompare(b.path));
}

function inferCategory(path: string): ApiEndpoint['inferredCategory'] {
  const lower = path.toLowerCase();
  if (lower.startsWith('ws://') || lower.startsWith('wss://')) {
    return 'Realtime/WebSocket';
  }
  if (lower.includes('graphql') || lower.includes('#query:') || lower.includes('#mutation:')) {
    return 'GraphQL';
  }
  if (lower.includes('auth') || lower.includes('login') || lower.includes('oauth') || lower.includes('session') || lower.includes('token') || lower.includes('signup')) {
    return 'Authentication';
  }
  if (lower.includes('user') || lower.includes('profile') || lower.includes('account') || lower.includes('member')) {
    return 'User/Profile';
  }
  if (lower.includes('bill') || lower.includes('stripe') || lower.includes('pay') || lower.includes('subscription') || lower.includes('checkout') || lower.includes('invoice')) {
    return 'Billing';
  }
  if (lower.includes('analytic') || lower.includes('track') || lower.includes('telemetry') || lower.includes('metric') || lower.includes('event')) {
    return 'Data/Analytics';
  }
  return 'Core Feature';
}
