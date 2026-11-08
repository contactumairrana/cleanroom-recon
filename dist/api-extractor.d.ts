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
export declare function extractApiEndpoints(code: string): ApiEndpoint[];
//# sourceMappingURL=api-extractor.d.ts.map