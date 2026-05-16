// ============================================================
// ARCHIVO  : at-tab-manager.js
// VERSIÓN  : 3.6.0
// FECHA    : 2026-03-14
// PROPÓSITO: Inyección de Empty State (syncPlaceholder) para eliminar
//            el canvas negro cuando no hay pestañas abiertas.
//            Desconectar estilos inline. Conectar clases CSS del
//            sistema (.cpii-tab, .is-active, .cpii-tab__close).
//            Textos delegados a clases Tailwind.
//            Conectar createOmnibox() a las clases .cpii-omnibox
//            del CSS. Eliminar todos los style.cssText inline
//            del componente buscador.
//            Limpiar style.cssText residual de syncPlaceholder.
//            Mover estilos del empty state a .cpii-empty-state en CSS.
//            Orden 7 ya aplicada en v3.5.0 — verificada y cerrada.

//  Índice   :
// [SEC-01] Configuración y estado
// [SEC-02] MODIFICADA  (syncPlaceholder: style.cssText → clases CSS + Tailwind)
// [SEC-03] createOmnibox — MODIFICADA
// [SEC-04] buildInterface
// [SEC-05] Gestión de pestañas
// [SEC-06] Inicialización
// ============================================================
(function () {
    'use strict';

    // [SEC-01] Configuración y estado
    const state = { tabs: [], activeId: null };
    // Referencias persistentes
    let tabBarRef, contentAreaRef;

    const t = (key) => window.__CPII__?.i18n?.t(key) ?? key;
    const emit = (name, detail = {}) => document.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));

    // [SEC-02] Empty State — syncPlaceholder
    function syncPlaceholder() {
        const existing = document.getElementById('cpii-empty-state');
        if (state.tabs.length > 0) {
            if (existing) existing.remove();
            return;
        }
        if (existing) return; // ya está montado, no duplicar

        const el = document.createElement('div');
        el.id = 'cpii-empty-state';
        el.className = 'cpii-empty-state';
        el.innerHTML = `
            <div class="cpii-empty-state__icon">
                <span class="material-symbols-outlined text-primary">diamond</span>
            </div>
            <div class="cpii-empty-state__body">
                <h2 class="cpii-empty-state__title font-serif text-primary">
                    ${window.__CPII__.i18n.t('welcome_title')}
                </h2>
                <p class="cpii-empty-state__desc text-slate-400">
                    ${window.__CPII__.i18n.t('empty_state')}
                </p>
            </div>
            <button id="cpii-explore-btn" class="cpii-empty-state__btn text-primary">
                ${window.__CPII__.i18n.t('explore_btn')}
            </button>
        `;

        el.querySelector('#cpii-explore-btn').addEventListener('click', () => {
            openFromRegistry('gd-dashboard');
        });

        // Re-traducir al cambiar idioma
        document.addEventListener('cpii:lang:change', () => {
            const btn = document.getElementById('cpii-explore-btn');
            const existing = document.getElementById('cpii-empty-state');
            if (!existing) return;
            existing.querySelector('h2').textContent = window.__CPII__.i18n.t('welcome_title');
            existing.querySelector('p').textContent = window.__CPII__.i18n.t('empty_state');
            if (btn) btn.textContent = window.__CPII__.i18n.t('explore_btn');
        });

        contentAreaRef.appendChild(el);
    }

    // [SEC-03] OMNIBOX — createOmnibox()
    function createOmnibox() {
        // Contenedor raíz
        const wrapper = document.createElement('div');
        wrapper.className = 'cpii-omnibox';

        // Input wrapper (luxury-glass via CSS)
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'cpii-omnibox__input-wrapper';

        // Icono búsqueda
        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined cpii-omnibox__icon';
        icon.textContent = 'search';

        // Input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'cpii-omnibox__input';
        input.placeholder = window.__CPII__.i18n.t('search_placeholder');

        // Dropdown
        const dropdown = document.createElement('ul');
        dropdown.className = 'cpii-omnibox__dropdown';

        // Re-traducir placeholder al cambiar idioma
        document.addEventListener('cpii:lang:change', () => {
            input.placeholder = window.__CPII__.i18n.t('search_placeholder');
        });

        // Lógica de búsqueda
        input.addEventListener('input', () => {
            const query = input.value.trim();
            if (query.length < 1) { dropdown.style.display = 'none'; return; }
            emit('cpii:omnibox:search', { query });
        });

        document.addEventListener('cpii:omnibox:results', (e) => {
            const ids = e.detail.ids || [];
            const registry = window.__CPII__.RESOURCE_REGISTRY || {};
            dropdown.innerHTML = '';

            if (ids.length === 0) {
                const empty = document.createElement('li');
                empty.className = 'cpii-omnibox__empty';
                empty.textContent = window.__CPII__.i18n.t('omnibox_no_results');
                dropdown.appendChild(empty);
            } else {
                ids.forEach(id => {
                    const li = document.createElement('li');
                    li.className = 'cpii-omnibox__item';
                    li.textContent = t(registry[id]?.labelKey || id);
                    li.addEventListener('mousedown', (ev) => {
                        ev.preventDefault();
                        openFromRegistry(id);
                        input.value = '';
                        dropdown.style.display = 'none';
                    });
                    dropdown.appendChild(li);
                });
            }
            dropdown.style.display = 'block';
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) dropdown.style.display = 'none';
        });

        // Ensamblar
        inputWrapper.appendChild(icon);
        inputWrapper.appendChild(input);
        wrapper.appendChild(inputWrapper);
        wrapper.appendChild(dropdown);
        return wrapper;
    }

    // [SEC-04] buildInterface — Constructor de la estructura
    function buildInterface() {
        const orbitCanvas = document.getElementById('canvas-orbita-2');
        if (!orbitCanvas) return;

        // Crear Barra (CONTRASTE MEJORADO)
        tabBarRef = document.createElement('div');
        tabBarRef.id = 'cpii-tab-bar';
        tabBarRef.className = 'cpii-tab-bar';

        // Crear Área de Contenido
        contentAreaRef = document.createElement('div');
        contentAreaRef.id = 'cpii-content-area';
        contentAreaRef.className = 'cpii-workspace';

        // Ensamblar
        tabBarRef.appendChild(createOmnibox());
        orbitCanvas.appendChild(tabBarRef);
        orbitCanvas.appendChild(contentAreaRef);
        syncPlaceholder();
    }

    // [SEC-05] Gestión de pestañas
    // [CAMINO A] — Carga de gadgets vía fetch + createContextualFragment
    // Doctrina R2 Light DOM | R5 Economía O(1) | Fail-silent ante error de red
    // Sutura F2 — Ticket Fracturas Críticas (2026-05-16)
    function openFromRegistry(id) {
        const res = window.__CPII__?.RESOURCE_REGISTRY?.[id];
        if (!res) return;

        // Si ya existe, activar
        if (state.tabs.find(t => t.id === id)) return activateTab(id);

        // Nodo contenedor genérico — HTML inyectado vía fetch (Camino A)
        const node = document.createElement('div');
        node.id = `cpii-gadget-${id}`;
        node.className = 'cpii-gadget-frame';
        node.style.display = 'none';
        contentAreaRef.appendChild(node);

        const tab = { id, labelKey: res.labelKey, node };
        state.tabs.push(tab);

        // Crear pestaña visual (síncrono — feedback inmediato al usuario)
        const tabEl = document.createElement('div');
        tabEl.dataset.id = id;
        tabEl.className = 'cpii-tab text-slate-400';
        tabEl.innerHTML = `
            <span class="cpii-tab__label">${t(res.labelKey)}</span>
            <button class="cpii-tab__close">&times;</button>
        `;

        tabEl.addEventListener('click', () => activateTab(id));
        tabEl.querySelector('.cpii-tab__close').addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(id);
        });

        // Insertar antes del buscador
        tabBarRef.insertBefore(tabEl, tabBarRef.lastChild);
        activateTab(id);
        syncPlaceholder();

        // Inyección asíncrona del gadget HTML (R5: fail-silent, no bloquea UI)
        if (res.url) {
            fetch(res.url)
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status} — ${res.url}`);
                    return r.text();
                })
                .then(html => {
                    // createContextualFragment ejecuta <script> correctamente (vs innerHTML estático)
                    const fragment = document.createRange().createContextualFragment(html);
                    node.innerHTML = '';
                    node.appendChild(fragment);
                    emit('cpii:gadget:loaded', { id, url: res.url });
                })
                .catch(err => {
                    node.innerHTML = `<div class="cpii-gadget-error">[TabManager] Error cargando <strong>${id}</strong>: ${err.message}</div>`;
                    console.error(`[TabManager] Error cargando gadget ${id}:`, err);
                    emit('cpii:gadget:error', { id, error: err.message });
                });
        }
    }

    function activateTab(id) {
        state.tabs.forEach(t => {
            t.node.style.display = t.id === id ? 'block' : 'none';
            const el = tabBarRef.querySelector(`[data-id="${t.id}"]`);
            if (el) {
                el.classList.toggle('is-active', t.id === id);
                el.classList.toggle('text-slate-100', t.id === id);
                el.classList.toggle('text-slate-400', t.id !== id);
            }
        });
        state.activeId = id;
    }

    function closeTab(id) {
        const idx = state.tabs.findIndex(t => t.id === id);
        if (idx === -1) return;
        state.tabs[idx].node.remove();
        tabBarRef.querySelector(`[data-id="${id}"]`).remove();
        state.tabs.splice(idx, 1);
        if (state.activeId === id && state.tabs.length > 0) activateTab(state.tabs[0].id);
        syncPlaceholder();
    }

    // [SEC-06] Inicialización
    function init() {
        if (document.getElementById('cpii-tab-bar')) return;
        window.__CPII__ = window.__CPII__ || {};
        window.__CPII__.tabManager = { openFromRegistry };

        buildInterface();

        // Auto-apertura del Dashboard
        setTimeout(() => {
            if (window.__CPII__.RESOURCE_REGISTRY?.['gd-dashboard']) {
                openFromRegistry('gd-dashboard');
            }
        }, 600);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();