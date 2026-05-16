(function () {
    'use strict';
    class SearchEngine {
        init() {
            document.addEventListener('cpii:omnibox:search', (e) => this.handleSearch(e.detail?.query || ''));
        }
        handleSearch(query) {
            const sanitized = query.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const registry = window.__CPII__.RESOURCE_REGISTRY || {};

            if (!sanitized) return document.dispatchEvent(new CustomEvent('cpii:omnibox:results', { detail: { ids: [] } }));

            const results = [];
            Object.entries(registry).forEach(([id, resource]) => {
                let score = 0;
                if (id.includes(sanitized)) score += 3;
                (resource.tags || []).forEach(tag => {
                    if (tag === sanitized) score += 10;
                    else if (tag.includes(sanitized)) score += 2;
                });
                if (score > 0) results.push({ id, score });
            });

            results.sort((a, b) => b.score - a.score);
            document.dispatchEvent(new CustomEvent('cpii:omnibox:results', { detail: { ids: results.map(r => r.id) } }));
        }
    }
    window.__CPII__.searchEngine = new SearchEngine();
    document.addEventListener('DOMContentLoaded', () => window.__CPII__.searchEngine.init());
})();