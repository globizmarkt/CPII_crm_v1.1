// ============================================================
// CARTOGRAFÍA QUIRÚRGICA v3.2
// ============================================================
// ARCHIVO   : features/at-attribution.js
// VERSIÓN   : 1.0.0
// FECHA     : 2026-03-23
// AUTOR     : Junior Dev-Logic Kimi
// DOCTRINA  : R0 (Agnóstico) | R5 (Economía O(1)) | Separación de Responsabilidades
// PROPÓSITO : Interceptor Stealth de atribución traccional. Captura parámetros
//             de marketing (?ref=, ?utm_*) en milisegundo cero, persiste en
//             localStorage canónico, limpia URL vía replaceState (modo Stealth)
//             y notifica al ecosistema mediante evento canónico.
// SPRINT    : VIBE-CPII-20 — Sprint 6 (Reconstrucción Puente Traccional DT-013)
// ============================================================

/**
 * AT-ATTRIBUTION | STEALTH CATCHER v1.0.0
 * 
 * Características:
 * - Ejecución síncrona inmediata (IIFE) al cargar el script
 * - Complejidad O(1): Set lookup + single-pass URLSearchParams
 * - Fail-silent: No arroja errores si URLSearchParams no está disponible
 * - Stealth: Limpia URL sin recarga mediante history.replaceState
 * - Agnóstico: Sin dependencias externas, auto-inicializable
 */
(function AttributionStealthCatcher() {
    'use strict';

    // [SEC-01] Configuración Inmutable (Whitelist estricto O(1))
    const WHITELIST = new Set([
        'ref',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'partner',
        'affiliate'
    ]);

    const STORAGE_PREFIX = 'cpii:attribution:';
    const EVENT_NAME = 'cpii:attribution-captured';

    // [SEC-02] Captura Atómica (Milisegundo Cero)
    // Fail-fast: Si no hay search params, salir inmediatamente O(1)
    const searchString = window.location.search;
    if (!searchString || searchString.length <= 1) {
        return; // No hay nada que capturar
    }

    try {
        // Parseo único (O(n) donde n = cantidad de params, pero efectivamente O(1)
        // para URLs normales ya que whitelist limita el procesamiento)
        const params = new URLSearchParams(searchString);
        const captured = {};
        let hasCaptures = false;

        // [SEC-03] Filtrado y Persistencia O(1)
        // Solo iteramos sobre las claves presentes (navegador optimiza esto)
        for (const [key, value] of params) {
            if (WHITELIST.has(key) && value) {
                const storageKey = STORAGE_PREFIX + key;
                const sanitized = value.substring(0, 100); // Limitar longitud O(1)

                localStorage.setItem(storageKey, sanitized);
                captured[key] = sanitized;
                hasCaptures = true;
            }
        }

        // [SEC-04] Limpieza Stealth (Modo Zero Trust UI)
        // Eliminar parámetros de URL sin recargar página, manteniendo estética
        if (hasCaptures) {
            const cleanUrl = window.location.protocol + '//' +
                window.location.host +
                window.location.pathname +
                window.location.hash; // Preservar hash si existe

            window.history.replaceState(
                { attributionCleaned: true, timestamp: Date.now() },
                document.title,
                cleanUrl
            );
        }

        // [SEC-05] Notificación Canónica al Ecosistema
        if (hasCaptures) {
            const eventDetail = {
                captured: captured,
                originalSearch: searchString,
                cleaned: true,
                timestamp: Date.now(),
                source: 'at-attribution'
            };

            // Dispatch inmediato (síncrono) para que bootstrapper y otros
            // puedan escuchar si ya están cargados, o se procese en bubbling
            if (document.readyState === 'loading') {
                // Si DOM aún no listo, usar setImmediate macro-task para no bloquear
                // pero mantener orden antes de DOMContentLoaded
                setTimeout(() => {
                    document.dispatchEvent(new CustomEvent(EVENT_NAME, {
                        detail: eventDetail,
                        bubbles: true,
                        cancelable: false
                    }));
                }, 0);
            } else {
                // DOM listo, disparar inmediatamente
                document.dispatchEvent(new CustomEvent(EVENT_NAME, {
                    detail: eventDetail,
                    bubbles: true,
                    cancelable: false
                }));
            }
        }

    } catch (error) {
        // Fail-silent R5: No bloquear carga por errores de atribución
        // Log discreto en modo debug
        if (window.__CPII__?.config?.debug) {
            console.warn('[at-attribution] Stealth catcher silenced:', error.message);
        }
    }
})();

// [SEC-06] Exposición segura de API (opcional, para inspección manual)
if (typeof window !== 'undefined') {
    window.__CPII__ = window.__CPII__ || {};
    window.__CPII__.attribution = {
        /**
         * Recupera todos los valores de atribución capturados
         * @returns {Object} Mapa clave-valor de atribución
         */
        getAll: function () {
            const result = {};
            const prefix = 'cpii:attribution:';
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    const attrKey = key.substring(prefix.length);
                    result[attrKey] = localStorage.getItem(key);
                }
            }
            return result;
        },

        /**
         * Limpieza manual de atribución (GDPR compliance helper)
         */
        clearAll: function () {
            const prefix = 'cpii:attribution:';
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            document.dispatchEvent(new CustomEvent('cpii:attribution-cleared', {
                detail: { timestamp: Date.now() },
                bubbles: true
            }));
        }
    };
}