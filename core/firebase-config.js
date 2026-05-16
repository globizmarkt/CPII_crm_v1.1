/**
 * ============================================================================
 * CARTOGRAFÍA QUIRÚRGICA v3.2
 * ============================================================================
 * MÓDULO: core/firebase-config.js
 * ROL: Inicializador Singleton de Infraestructura SDK (Golden Gate)
 * DOCTRINA: R0 (Agnosticismo) | R5 (Fail-Fast O(1))
 * AUTO-EJECUCIÓN: true
 * ============================================================================
 */

(function initFirebaseInfrastructure() {
    console.log('[FIREBASE-CONFIG] Secuencia de ignición SDK iniciada...');

    // ------------------------------------------------------------------------
    // REGLA R5: FAIL-FAST O(1)
    // ------------------------------------------------------------------------
    // Si el CDN no cargó (bloqueadores de anuncios, red caída, orden incorrecto),
    // abortamos silenciosamente. El DOM sobrevive y la aplicación base no se rompe.
    if (typeof window.firebase === 'undefined') {
        console.error('[CRÍTICO] window.firebase es undefined. Posible bloqueo de CDN temporal. Abortando inicialización para proteger el DOM.');
        return;
    }

    // ------------------------------------------------------------------------
    // REGLA R0: AGNOSTICISMO DE ENTORNO
    // ------------------------------------------------------------------------
    // Intentamos capturar la configuración inyectada globalmente (Producción/Staging)
    const envConfig = window.ENV && window.ENV.firebase ? window.ENV.firebase : null;

    // Fallback pasivo para variables locales del Director (Desarrollo)
    // NUNCA hacer commit de credenciales reales sobre este objeto.
    const devFallbackConfig = {
        apiKey: "AIzaSyD7_EYohInAK5rgMLFZxrE5jEn2nyyHoEk",
        authDomain: "cpii-landing.firebaseapp.com",
        projectId: "cpii-landing",
        storageBucket: "cpii-landing.firebasestorage.app",
        messagingSenderId: "963765788097",
        appId: "1:963765788097:web:d8a8600feb29e9caeda340"
    };

    const activeConfig = envConfig || devFallbackConfig;

    // Validación preventiva humana
    if (activeConfig.apiKey.includes("INSERTE_AQUI")) {
        console.warn('[FIREBASE-CONFIG] Atención: Se detectó template vacío. Las llamadas al Auth fallarán.');
    }

    // ------------------------------------------------------------------------
    // PATRÓN SINGLETON PUDO-SEGURO
    // ------------------------------------------------------------------------
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(activeConfig);
            console.log('[FIREBASE-CONFIG] Instancia primaria inicializada con éxito.');
        } else {
            console.log('[FIREBASE-CONFIG] Firebase ya detectado. Reutilizando instancia (Singleton actvo).');
        }
    } catch (error) {
        console.error('[FIREBASE-CONFIG] Fallo en la barrera de inicialización:', error);
    }
})();
