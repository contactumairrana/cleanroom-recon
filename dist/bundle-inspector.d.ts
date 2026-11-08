/**
 * @devomnitools/cleanroom-recon - Bundle & Framework Inspector
 * Clean-room static bundle inspector inspired by REA and Replica Recon.
 */
export interface FrameworkDetection {
    name: string;
    category: 'Frontend Framework' | 'Meta Framework' | 'Styling' | 'Bundler';
    confidence: number;
    indicator: string;
}
export interface ScriptBundle {
    url: string;
    isInline: boolean;
    isModule: boolean;
    content?: string;
    hasSourceMap?: boolean;
    sourceMapUrl?: string;
}
export interface BundleInspectionResult {
    title: string;
    frameworks: FrameworkDetection[];
    scripts: ScriptBundle[];
    stylesheets: string[];
    hasServiceWorker: boolean;
    hasSourceMaps: boolean;
}
export declare function inspectHtml(html: string, baseUrl?: string): BundleInspectionResult;
//# sourceMappingURL=bundle-inspector.d.ts.map