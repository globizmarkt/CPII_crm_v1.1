/**
 * ============================================================
 * ARCHIVO  : features/crm-aimon.js
 * VERSIÓN  : 1.0.0
 * FECHA    : 2026-05-17
 * PATRÓN   : IIFE — sin ES Modules. Coherencia con core stack.
 * DOCTRINA : R2 (Light DOM) | R3 (Zero-Hex) | R4 (i18n Strict) | R20 (Event-Driven)
 *
 * PROPÓSITO:
 *   Panel contextual AIMON. Tres estados: idle → form → success.
 *   Escucha aimon:open → renderiza formulario de ticket.
 *   Al submit → dispara aimon:ticket-submitted.
 *   PROHIBIDO: acceso directo a Firestore desde este componente.
 *   El receptor del evento (Cloud Function bridge) procesa el ticket.
 *
 * EVENTOS QUE ESCUCHA (R20):
 *   - aimon:open             → abre formulario
 *
 * EVENTOS QUE EMITE (R20):
 *   - aimon:ticket-submitted → { type, message, timestamp, context, userId, tenantId }
 *
 * EXPONE (R21):
 *   window.__CPII__.aimon.open()      → abre formulario manualmente
 *   window.__CPII__.aimon.getState()  → retorna estado actual
 * ============================================================
 */
(function (window, document) {
    'use strict';

    // ── Constantes ───────────────────────────────────────────────
    const PANEL_ID = 'aimon-panel';
    const OPEN_BTN_ID = 'aimon-open-btn';
    const TICKET_TYPES = ['support', 'investor', 'document', 'incident'];
    const SUCCESS_AUTO_RESET_MS = 5000;

    // ── Estado interno ───────────────────────────────────────────
    let _state = 'idle'; // idle | form | processing | success
    let _originalPanelHTML = null; // guardado en el primer aimon:open

    // ── Helpers ──────────────────────────────────────────────────

    /** Hidrata el DOM con el idioma activo */
    function _hydrate() {
        const lang = (function () {
            try { return localStorage.getItem('cpii_locale') || 'pt'; }
            catch (e) { return 'pt'; }
        })();
        window.__CPII__?.i18n?.applyTranslations(lang);
    }

    /** Retorna el panel Orbit 3 AIMON. Falla suave si no existe. */
    function _getPanel() {
        const panel = document.getElementById(PANEL_ID);
        if (!panel) {
            console.warn('[AIMON] #' + PANEL_ID + ' no encontrado en DOM');
        }
        return panel;
    }

    // ── Ligadura del botón idle (botón estático en HTML) ─────────
    /**
     * _bindIdleButton()
     * Conecta el botón #aimon-open-btn al evento aimon:open.
     * Usa _aimonBound como guardia para no duplicar listeners.
     */
    function _bindIdleButton() {
        const btn = document.getElementById(OPEN_BTN_ID);
        if (!btn || btn._aimonBound) return;
        btn._aimonBound = true;
        btn.addEventListener('click', function () {
            document.dispatchEvent(new CustomEvent('aimon:open', {
                detail: { context: window.__CPII__?.tabManager?.activeTab?.id || null },
                bubbles: true
            }));
        });
    }

    // ── Renderizado: Formulario de ticket ─────────────────────────
    function _renderForm(panel) {
        _state = 'form';

        const typeOptions = TICKET_TYPES.map(function (type) {
            return '<option value="' + type + '" data-i18n="aimon.ticket.types.' + type + '"></option>';
        }).join('');

        panel.innerHTML = [
            '<div class="flex items-center justify-between mb-4">',
            '  <div class="flex items-center gap-2">',
            '    <span class="material-symbols-outlined text-primary">smart_toy</span>',
            '    <h4 class="text-sm font-bold uppercase tracking-widest text-primary"',
            '        data-i18n="aimon.ticket.title"></h4>',
            '  </div>',
            '  <button id="aimon-back-btn"',
            '          class="text-slate-500 hover:text-primary transition-colors"',
            '          type="button" aria-label="Close">',
            '    <span class="material-symbols-outlined text-xl">close</span>',
            '  </button>',
            '</div>',
            '<form id="aimon-ticket-form" class="flex flex-col gap-4" novalidate>',
            '  <div class="flex flex-col gap-1">',
            '    <label class="text-xs font-bold text-slate-400 uppercase tracking-widest"',
            '           for="aimon-ticket-type"',
            '           data-i18n="aimon.ticket.type.label"></label>',
            '    <select id="aimon-ticket-type"',
            '            class="bg-background-dark border border-primary/20 text-slate-200',
            '                   rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"',
            '            required>',
            '      ' + typeOptions,
            '    </select>',
            '  </div>',
            '  <div class="flex flex-col gap-1">',
            '    <label class="text-xs font-bold text-slate-400 uppercase tracking-widest"',
            '           for="aimon-ticket-message"',
            '           data-i18n="aimon.ticket.message.label"></label>',
            '    <textarea id="aimon-ticket-message"',
            '              class="bg-background-dark border border-primary/20 text-slate-200',
            '                     rounded-lg px-3 py-2 text-sm resize-none',
            '                     focus:outline-none focus:border-primary"',
            '              rows="4"',
            '              required></textarea>',
            '  </div>',
            '  <button type="submit"',
            '          id="aimon-submit-btn"',
            '          class="w-full bg-primary/20 hover:bg-primary/30 text-primary',
            '                 py-2 px-4 rounded-lg text-xs font-bold transition-all',
            '                 border border-primary/30">',
            '    <span data-i18n="aimon.ticket.submit"></span>',
            '  </button>',
            '</form>'
        ].join('\n');

        // Hidratar i18n inmediatamente (Anti-FOUC Doctrine)
        _hydrate();
        _bindFormEvents(panel);
    }

    // ── Renderizado: Estado éxito ─────────────────────────────────
    function _renderSuccess(panel) {
        _state = 'success';

        panel.innerHTML = [
            '<div class="flex flex-col items-center justify-center gap-4 py-8 text-center">',
            '  <div class="size-12 rounded-full bg-primary/20 border border-primary/30',
            '              flex items-center justify-center">',
            '    <span class="material-symbols-outlined text-primary text-2xl">check_circle</span>',
            '  </div>',
            '  <p class="text-sm text-slate-200 font-serif leading-relaxed"',
            '     data-i18n="aimon.ticket.success"></p>',
            '  <button id="aimon-reset-btn"',
            '          class="mt-2 text-xs font-bold text-primary hover:underline"',
            '          type="button">',
            '    <span data-i18n="aimon.btn.open_assistant"></span>',
            '  </button>',
            '</div>'
        ].join('\n');

        _hydrate();

        // Listener de reset manual
        var resetBtn = panel.querySelector('#aimon-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () { _resetToIdle(panel); });
        }

        // Auto-reset tras SUCCESS_AUTO_RESET_MS
        setTimeout(function () {
            if (_state === 'success') _resetToIdle(panel);
        }, SUCCESS_AUTO_RESET_MS);
    }

    // ── Reset: restaurar estado idle desde HTML guardado ─────────
    function _resetToIdle(panel) {
        _state = 'idle';
        if (_originalPanelHTML) {
            panel.innerHTML = _originalPanelHTML;
            _hydrate();
            _bindIdleButton();
        }
    }

    // ── Event bindings del formulario ────────────────────────────
    function _bindFormEvents(panel) {
        // Botón volver
        var backBtn = panel.querySelector('#aimon-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', function () { _resetToIdle(panel); });
        }

        // Submit del formulario
        var form = panel.querySelector('#aimon-ticket-form');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();

                var type = panel.querySelector('#aimon-ticket-type')?.value;
                var message = (panel.querySelector('#aimon-ticket-message')?.value || '').trim();

                if (!type || !message) return;

                _state = 'processing';

                // Feedback visual: deshabilitar botón
                var submitBtn = panel.querySelector('#aimon-submit-btn');
                if (submitBtn) submitBtn.disabled = true;

                // ── Emitir evento (R20) ──────────────────────────
                // PROHIBIDO escribir en Firestore aquí.
                // El receptor del evento procesa el ticket externamente.
                document.dispatchEvent(new CustomEvent('aimon:ticket-submitted', {
                    detail: {
                        type: type,
                        message: message,
                        timestamp: Date.now(),
                        context: window.__CPII__?.tabManager?.activeTab?.id || null,
                        userId: window.__CPII__?.session?.uid || null,
                        tenantId: 'cpii_v1.1'
                    },
                    bubbles: true
                }));

                _renderSuccess(panel);
            });
        }
    }

    // ── Entrada principal: aimon:open ────────────────────────────
    function _onAimonOpen() {
        var panel = _getPanel();
        if (!panel) return;

        // Guardar HTML original en el primer open (para restaurar idle)
        if (!_originalPanelHTML) {
            _originalPanelHTML = panel.innerHTML;
        }

        _renderForm(panel);
    }

    // ── Registro de eventos (R20) ────────────────────────────────
    document.addEventListener('DOMContentLoaded', _bindIdleButton);
    document.addEventListener('aimon:open', _onAimonOpen);

    // ── Exposición en namespace window.__CPII__ (R21) ────────────
    window.__CPII__ = window.__CPII__ || {};
    window.__CPII__.aimon = Object.freeze({
        open: _onAimonOpen,
        getState: function () { return _state; }
    });

    console.log('[AIMON] ✅ crm-aimon.js cargado (v1.0.0)');

})(window, document);
