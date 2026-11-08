/**
 * @devomnitools/cleanroom-recon - Source Map Deep Analyzer
 * Recovers original unminified file structures, component hierarchies,
 * and detects exposed proprietary TypeScript/JSX sources from production bundles.
 */

import { validateSafeUrl, safeFetch } from './ssrf-filter.js';

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

export async function analyzeSourceMap(
  scriptUrl: string,
  mapRef: string,
  baseUrl: string
): Promise<SourceMapAnalysisResult> {
  let fullMapUrl = '';

  // 1. Resolve Map URL
  if (mapRef.startsWith('data:application/json;base64,')) {
    try {
      const base64Data = mapRef.split(',')[1];
      const jsonStr = atob(base64Data);
      return parseSourceMapJson(JSON.parse(jsonStr), 'inline-base64');
    } catch (err: any) {
      return {
        hasSourceMap: true,
        sourceCount: 0,
        recoveredFiles: [],
        directoryTree: {},
        isSourceCodeExposed: false,
        embeddedCodeSnippetsCount: 0,
        error: `Failed to decode inline base64 sourcemap: ${err?.message || err}`
      };
    }
  }

  try {
    const parentUrl = scriptUrl.startsWith('http') ? scriptUrl : baseUrl;
    fullMapUrl = new URL(mapRef, parentUrl).toString();
  } catch {
    return {
      hasSourceMap: false,
      sourceCount: 0,
      recoveredFiles: [],
      directoryTree: {},
      isSourceCodeExposed: false,
      embeddedCodeSnippetsCount: 0,
      error: `Could not resolve sourcemap path: ${mapRef}`
    };
  }

  // 2. Validate SSRF Safety
  const check = validateSafeUrl(fullMapUrl);
  if (!check.isValid) {
    return {
      hasSourceMap: true,
      mapUrl: fullMapUrl,
      sourceCount: 0,
      recoveredFiles: [],
      directoryTree: {},
      isSourceCodeExposed: false,
      embeddedCodeSnippetsCount: 0,
      error: `SSRF Block on sourcemap URL: ${check.reason}`
    };
  }

  // 3. Fetch Source Map File
  try {
    const res = await safeFetch(fullMapUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CleanRoomRecon/1.0 SourceMap-Analyzer'
      }
    });

    if (!res.ok) {
      return {
        hasSourceMap: true,
        mapUrl: fullMapUrl,
        sourceCount: 0,
        recoveredFiles: [],
        directoryTree: {},
        isSourceCodeExposed: false,
        embeddedCodeSnippetsCount: 0,
        error: `HTTP ${res.status} when fetching sourcemap from ${fullMapUrl}`
      };
    }

    const data = await res.json();
    return parseSourceMapJson(data, fullMapUrl);

  } catch (err: any) {
    return {
      hasSourceMap: true,
      mapUrl: fullMapUrl,
      sourceCount: 0,
      recoveredFiles: [],
      directoryTree: {},
      isSourceCodeExposed: false,
      embeddedCodeSnippetsCount: 0,
      error: `Network/parse error retrieving sourcemap: ${err?.message || err}`
    };
  }
}

export function parseSourceMapJson(mapData: any, mapUrl: string): SourceMapAnalysisResult {
  if (!mapData || typeof mapData !== 'object') {
    return {
      hasSourceMap: false,
      sourceCount: 0,
      recoveredFiles: [],
      directoryTree: {},
      isSourceCodeExposed: false,
      embeddedCodeSnippetsCount: 0,
      error: 'Invalid sourcemap JSON structure'
    };
  }

  const rawSources: string[] = Array.isArray(mapData.sources) ? mapData.sources : [];
  const rawContents: any[] = Array.isArray(mapData.sourcesContent) ? mapData.sourcesContent : [];

  const cleanedFiles: string[] = [];
  const directoryTree: Record<string, string[]> = {};

  for (const src of rawSources) {
    if (!src || typeof src !== 'string') continue;
    // Strip prefixes like webpack://, vite://, Turbopack, or leading ./
    const cleanPath = src
      .replace(/^[a-z\-]+:\/\/(?:[^\/]+\/)?/i, '')
      .replace(/^\.\//, '')
      .replace(/^[.\/]+/, '');

    if (cleanPath && !cleanPath.includes('node_modules')) {
      cleanedFiles.push(cleanPath);
      const parts = cleanPath.split('/');
      const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
      const file = parts[parts.length - 1];

      if (!directoryTree[dir]) directoryTree[dir] = [];
      directoryTree[dir].push(file);
    }
  }

  const hasEmbeddedSources = rawContents.some(c => typeof c === 'string' && c.length > 50);
  const embeddedCount = rawContents.filter(c => typeof c === 'string' && c.length > 0).length;

  return {
    hasSourceMap: true,
    mapUrl,
    sourceCount: cleanedFiles.length,
    recoveredFiles: cleanedFiles.slice(0, 50), // cap to top 50 for clean reporting
    directoryTree,
    isSourceCodeExposed: hasEmbeddedSources,
    embeddedCodeSnippetsCount: embeddedCount
  };
}
