/**
 * @devomnitools/cleanroom-recon - Bundle & Framework Inspector
 * Clean-room static bundle inspector inspired by REA and Replica Recon.
 */
export function inspectHtml(html, baseUrl = 'http://localhost') {
    const frameworks = [];
    // 1. Framework & Stack Fingerprinting
    if (html.includes('__NEXT_DATA__') || html.includes('/_next/')) {
        frameworks.push({ name: 'Next.js', category: 'Meta Framework', confidence: 1.0, indicator: '__NEXT_DATA__' });
    }
    if (html.includes('data-astro-cid') || html.includes('astro-island')) {
        frameworks.push({ name: 'Astro', category: 'Meta Framework', confidence: 1.0, indicator: 'astro-island' });
    }
    if (html.includes('__NUXT__') || html.includes('/_nuxt/')) {
        frameworks.push({ name: 'Nuxt.js', category: 'Meta Framework', confidence: 1.0, indicator: '__NUXT__' });
    }
    if (html.includes('data-reactroot') || /_jsx\(|React\.createElement/i.test(html)) {
        frameworks.push({ name: 'React', category: 'Frontend Framework', confidence: 0.95, indicator: 'react' });
    }
    if (html.includes('data-v-') || html.includes('Vue.createApp')) {
        frameworks.push({ name: 'Vue.js', category: 'Frontend Framework', confidence: 0.95, indicator: 'vue' });
    }
    if (html.includes('svelte-') || html.includes('__svelte')) {
        frameworks.push({ name: 'Svelte', category: 'Frontend Framework', confidence: 0.95, indicator: 'svelte' });
    }
    if (html.includes('class="') && /(?:flex|grid|p-\d|m-\d|text-|bg-)/.test(html)) {
        frameworks.push({ name: 'Tailwind CSS', category: 'Styling', confidence: 0.85, indicator: 'utility-classes' });
    }
    // 2. Extract Scripts
    const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    const scripts = [];
    let scriptMatch;
    while ((scriptMatch = scriptRegex.exec(html)) !== null) {
        const attrs = scriptMatch[1] || '';
        const inlineContent = scriptMatch[2]?.trim() || '';
        const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
        const isModule = /type=["']module["']/i.test(attrs);
        if (srcMatch && srcMatch[1]) {
            let fullUrl = srcMatch[1];
            try {
                fullUrl = new URL(srcMatch[1], baseUrl).toString();
            }
            catch {
                // fallback to raw
            }
            scripts.push({
                url: fullUrl,
                isInline: false,
                isModule
            });
        }
        else if (inlineContent.length > 0) {
            const smMatch = inlineContent.match(/\/\/#\s*sourceMappingURL=([^\s]+)/);
            scripts.push({
                url: 'inline-script-' + (scripts.length + 1),
                isInline: true,
                isModule,
                content: inlineContent,
                hasSourceMap: Boolean(smMatch),
                sourceMapUrl: smMatch ? smMatch[1] : undefined
            });
        }
    }
    // 3. Extract Stylesheets
    const linkRegex = /<link\b([^>]*rel=["']stylesheet["'][^>]*)>/gi;
    const stylesheets = [];
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
        const hrefMatch = linkMatch[1]?.match(/href=["']([^"']+)["']/i);
        if (hrefMatch && hrefMatch[1]) {
            try {
                stylesheets.push(new URL(hrefMatch[1], baseUrl).toString());
            }
            catch {
                stylesheets.push(hrefMatch[1]);
            }
        }
    }
    // 4. Title Extraction
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : 'Unknown Application';
    const hasServiceWorker = /navigator\.serviceWorker\.register/i.test(html);
    const hasSourceMaps = scripts.some(s => s.hasSourceMap);
    return {
        title,
        frameworks,
        scripts,
        stylesheets,
        hasServiceWorker,
        hasSourceMaps
    };
}
//# sourceMappingURL=bundle-inspector.js.map