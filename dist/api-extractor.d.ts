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
export declare function extractApiEndpoints(code: string): ApiEndpoint[];
//# sourceMappingURL=api-extractor.d.ts.map