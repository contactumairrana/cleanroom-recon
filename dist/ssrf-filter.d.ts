/**
 * @devomnitools/cleanroom-recon - SSRF & Network Security Filter
 * Enterprise-grade validation to prevent Server-Side Request Forgery (SSRF),
 * blocking loopback, RFC 1918 private subnets, cloud metadata endpoints, and internal TLDs.
 */
export interface SsrfValidationResult {
    isValid: boolean;
    reason?: string;
    normalizedUrl?: string;
}
export declare function validateSafeUrl(rawUrl: string): SsrfValidationResult;
export declare function safeFetch(url: string, init?: RequestInit): Promise<Response>;
//# sourceMappingURL=ssrf-filter.d.ts.map