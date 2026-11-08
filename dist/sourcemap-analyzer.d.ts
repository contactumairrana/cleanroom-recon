/**
 * @devomnitools/cleanroom-recon - Source Map Deep Analyzer
 * Recovers original unminified file structures, component hierarchies,
 * and detects exposed proprietary TypeScript/JSX sources from production bundles.
 */
export interface SourceMapAnalysisResult {
    hasSourceMap: boolean;
    mapUrl?: string;
    sourceCount: number;
    recoveredFiles: string[];
    directoryTree: Record<string, string[]>;
    isSourceCodeExposed: boolean;
    embeddedCodeSnippetsCount: number;
    error?: string;
}
export declare function analyzeSourceMap(scriptUrl: string, mapRef: string, baseUrl: string): Promise<SourceMapAnalysisResult>;
export declare function parseSourceMapJson(mapData: any, mapUrl: string): SourceMapAnalysisResult;
//# sourceMappingURL=sourcemap-analyzer.d.ts.map