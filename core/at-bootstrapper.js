/**
 * 🚀 AT-BOOTSTRAPPER | UNIVERSAL CONTEXT INJECTOR
 * ═══════════════════════════════════════════════════════════════
 * ARCHIVO:    core/at-bootstrapper.js
 * VERSIÓN:    1.0.0 (Incubator Edition)
 * FECHA:      2026-03-19
 * DOCTRINA:   Agnosticismo Radical | Multitenencia Lógica
 * DESCRIPCIÓN: Inicializa el objeto global __CPII__ y establece
 *              el project_id (tenant_id) antes de la ejecución
 *              de los motores de autenticación y datos.
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

(function(window) {
    // 1. Inicializar Objeto Global Seguro
    window.__CPII__ = window.__CPII__ || {
        config: {
            debug: true,
            project_id: null,
            version: '1.0.0'
        },
        session: null,
        status: 'BOOTING'
    };

    /**
     * API de Inicialización de Contexto
     */
    const CPII = {
        /**
         * Inicializa el ID del proyecto (tenant_id) para el aislamiento lógico.
         * @param {string} projectId - El ID único del proyecto (ej: cpii_lux_v1.0)
         */
        init: function(projectId) {
            if (!projectId) {
                console.warn('[CPII:BOOT] ⚠️ Advertencia: Se intenta inicializar sin projectId.');
            }

            window.__CPII__.config.project_id = projectId;
            
            console.log(`[CPII:BOOT] ✅ Contexto inyectado: ${projectId}`);
            
            this._broadcast('bootstrapped', { 
                project_id: projectId,
                timestamp: Date.now()
            });

            window.__CPII__.status = 'READY';
        },

        /**
         * Emite eventos globales en el namespace CPII
         * @private
         */
        _broadcast: function(eventName, detail) {
            const event = new CustomEvent(`CPII:${eventName}`, { 
                detail: detail,
                bubbles: true,
                composed: true 
            });
            window.dispatchEvent(event);
        }
    };

    // Namespace unificado — API de boot accesible vía auto-detección (L71-77).
    // window.CPII extirpado: dual namespace resuelto (Sutura F1 — Ticket Fracturas Críticas).

    // Auto-detección por Atributo (Ejecución Silenciosa)
    document.addEventListener('DOMContentLoaded', () => {
        const root = document.querySelector('[data-tenant-id]');
        if (root) {
            const tenantId = root.getAttribute('data-tenant-id');
            CPII.init(tenantId);
        }
    });

    console.log('[CPII:BOOT] 🏛️ El Bibliotecario: Bootstrapper cargado.');

})(window);
