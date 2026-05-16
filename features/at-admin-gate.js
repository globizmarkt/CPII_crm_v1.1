// ============================================================
// CARTOGRAFÍA QUIRÚRGICA v3.2
// ============================================================
// ARCHIVO   : features/at-admin-gate.js
// VERSIÓN   : 1.0.0
// FECHA     : 2026-03-22
// AUTOR     : Junior Dev-Logic Kimi
// DOCTRINA  : R2 (Light DOM) | R4 (i18n Strict) | R5 (Economía O(1))
// PROPÓSITO : Electrificación del Golden Gate. Web Component silencioso
//             que descubre elementos existentes en el DOM y conecta los
//             flujos OAuth (Google, Apple, Microsoft) y Vía Manual mediante
//             Firebase Auth. Gestión de estados visual vía atributos
//             data-gate-state (Born Locked / Zero Trust UI).
// SPRINT    : VIBE-CPII-19 — Fase 2
// ============================================================

/**
 * AtAdminGate — Componente de autenticación fiduciaria
 * 
 * Doctrinas aplicadas:
 * - R2 Light DOM: No utiliza Shadow DOM. Opera sobre el DOM plano existente.
 * - R4 i18n Strict: Utiliza window.__CPII__.i18n.t() para resolución de textos.
 * - R5 Economía O(1): Estructuras de datos constantes, cleanup estricto de
 *   listeners para prevenir memory leaks. Fail-safe: ante error, bloquea.
 */
class AtAdminGate extends HTMLElement {
    constructor() {
        super();
        // R2: Light DOM estricto — NO utilizar attachShadow
        this._listeners = []; // Registro O(1) para cleanup (R5)
        this._elements = {};  // Cache de elementos descubiertos
        this._auth = null;    // Referencia a firebase.auth()
    }

    /**
     * Ciclo de vida: Conexión al DOM
     * Inicialización fail-safe (R5): verifica dependencias antes de actuar.
     */
    connectedCallback() {
        // Fail-fast: validar entorno mínimo indispensable
        if (typeof window.firebase === 'undefined' || !window.firebase.auth) {
            console.error('[at-admin-gate] ❌ Firebase no disponible (DT-004)');
            this._dispatchEvent('passport:gate-error', { error: 'FIREBASE_MISSING' });
            return;
        }

        if (typeof window.__CPII__ === 'undefined') {
            console.error('[at-admin-gate] ❌ Namespace __CPII__ no inicializado');
            return;
        }

        this._auth = window.firebase.auth();
        this.init();
    }

    /**
     * Ciclo de vida: Desconexión del DOM
     * R5 — Economía de Guerra: eliminación preventiva de listeners para
     * evitar fugas de memoria en entornos de SPA o hot-reloading.
     */
    disconnectedCallback() {
        this._listeners.forEach(({ element, event, handler }) => {
            if (element && element.removeEventListener) {
                element.removeEventListener(event, handler);
            }
        });
        this._listeners = [];
    }

    /**
     * Inicialización principal
     * Secuencia: descubrimiento → activación → wiring de eventos.
     */
    init() {
        try {
            this._discoverElements();
            this._activateControls(); // Eliminar disabled (Born Locked → Activo)
            this._setupOAuthListeners();
            this._setupManualFlow();

            // Notificar ready a sistemas externos (tester, passport-engine)
            this._dispatchEvent('passport:engine-ready', {
                component: 'at-admin-gate',
                version: '1.0.0',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('[at-admin-gate] Error de inicialización:', error);
            this._setState('error');
        }
    }

    /**
     * [SEC-01] Descubrimiento de elementos (Discovery Phase)
     * R2: Descubrir elementos existentes en el Light DOM inyectados por
     * Bulldozer. No crear ni mutar estructura, solo referenciar.
     */
    _discoverElements() {
        const root = document.getElementById('golden-gate-root');
        if (!root) {
            throw new Error('[at-admin-gate] #golden-gate-root no encontrado en DOM');
        }

        this._elements = {
            root: root,
            googleBtn: document.getElementById('gate-btn-google'),
            appleBtn: document.getElementById('gate-btn-apple'),
            microsoftBtn: document.getElementById('gate-btn-microsoft'),
            emailInput: document.getElementById('gate-email-input'),
            manualSubmitBtn: document.getElementById('gate-btn-manual-submit'),
            manualConfirm: document.getElementById('gate-manual-confirm'),
            stateLoading: document.getElementById('gate-state-loading'),
            stateError: document.getElementById('gate-state-error'),
            stateSuccess: document.getElementById('gate-state-success')
        };
    }

    /**
     * [SEC-02] Activación de controles (Unlock Phase)
     * Elimina atributos disabled de botones e inputs para habilitar
     * la interacción una vez el JS está listo (progresive enhancement).
     */
    // ── DESPUÉS (Fix: Levantamiento de Candado Fiduciario) ─────
    _activateControls() {
        // [BUGFIX Sprint 7] Liberar candado visual Zero Trust UI
        // Eliminamos data-gate-lock para revelar la interfaz una vez
        // los controles están electrificados y listos para interacción.
        if (this._elements.root && this._elements.root.hasAttribute('data-gate-lock')) {
            this._elements.root.removeAttribute('data-gate-lock');

            // Evento de auditoría para el tester/debug
            this._dispatchEvent('passport:gate-unlocked', {
                timestamp: Date.now(),
                component: 'at-admin-gate',
                trigger: '_activateControls'
            });
        }

        const toActivate = [
            this._elements.googleBtn,
            this._elements.appleBtn,
            this._elements.microsoftBtn,
            this._elements.emailInput,
            this._elements.manualSubmitBtn
        ];

        toActivate.forEach(el => {
            if (el && el.hasAttribute('disabled')) {
                el.removeAttribute('disabled');
            }
        });
    }

    /**
     * [SEC-03] Wiring OAuth Élite Federada
     * Conecta listeners a los 3 botones de proveedores.
     * Delegación a _handleOAuth() con identificación de provider.
     */
    _setupOAuthListeners() {
        const providers = [
            { key: 'google', btn: this._elements.googleBtn, providerId: 'google.com' },
            { key: 'apple', btn: this._elements.appleBtn, providerId: 'apple.com' },
            { key: 'microsoft', btn: this._elements.microsoftBtn, providerId: 'microsoft.com' }
        ];

        providers.forEach(({ key, btn, providerId }) => {
            if (!btn) return;

            const handler = (e) => {
                e.preventDefault();
                this._handleOAuth(key, providerId);
            };

            btn.addEventListener('click', handler);
            this._listeners.push({ element: btn, event: 'click', handler });
        });
    }

    /**
     * [SEC-04] Wiring Vía Manual (Email Link)
     * Conecta el formulario manual: validación O(1) de email y envío
     * mediante sendSignInLinkToEmail.
     */
    _setupManualFlow() {
        const { manualSubmitBtn, emailInput } = this._elements;
        if (!manualSubmitBtn || !emailInput) return;

        // Handler submit
        const submitHandler = (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();

            if (!this._validateEmail(email)) {
                this._showError(window.__CPII__?.i18n?.t ?
                    window.__CPII__.i18n.t('errors.invalid_email', 'Formato de correo inválido') :
                    'Formato de correo inválido'
                );
                this._setState('error');
                return;
            }

            this._handleManualSubmit(email);
        };

        manualSubmitBtn.addEventListener('click', submitHandler);
        this._listeners.push({ element: manualSubmitBtn, event: 'click', handler: submitHandler });

        // Handler tecla Enter en input (UX accessibility)
        const keyHandler = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                manualSubmitBtn.click();
            }
        };

        emailInput.addEventListener('keypress', keyHandler);
        this._listeners.push({ element: emailInput, event: 'keypress', handler: keyHandler });
    }

    /**
     * Validación O(1) de formato email (R5)
     */
    _validateEmail(email) {
        // Regex ligero, validación estricta la hace Firebase
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /**
     * [SEC-05] Handler OAuth Genérico
     * Ejecuta signInWithPopup, gestiona estados y emite eventos estándar.
     * Fail-safe (R5): ante cualquier excepción, transiciona a estado error.
     */
    // ── DESPUÉS (Fix: Instanciación correcta AuthProvider) ───────
    async _handleOAuth(providerName, providerId) {
        this._setState('loading');

        try {
            // [BUGFIX Sprint 7] Instanciación O(1) del proveedor OAuth
            // Firebase v8/v9-compat requiere objeto provider instanciado
            let provider;

            switch (providerId) {
                case 'google.com':
                    provider = new firebase.auth.GoogleAuthProvider();
                    // Opcional: Añadir scopes si son necesarios
                    provider.addScope('profile');
                    provider.addScope('email');
                    break;

                case 'apple.com':
                    provider = new firebase.auth.OAuthProvider('apple.com');
                    break;

                case 'microsoft.com':
                    provider = new firebase.auth.OAuthProvider('microsoft.com');
                    break;

                default:
                    throw new Error(`Proveedor OAuth no soportado: ${providerId}`);
            }

            // R5 (Fail-Fast): Validación defensiva antes de invocación
            if (!provider || typeof provider !== 'object') {
                throw new Error('AUTH_PROVIDER_INVALID');
            }

            // Invocación con instancia provider (corrección del TypeError)
            const result = await this._auth.signInWithPopup(provider);

            // Fail-closed: si no hay usuario post-popup, es error
            if (!result || !result.user) {
                throw new Error('AUTH_NO_USER');
            }

            // Construir objeto de sesión agnóstico (R0) — claims reales via getIdTokenResult
            const session = await this._buildSession(result.user, providerName);

            // Inyectar en namespace global (contrato con __CPII__)
            window.__CPII__.session = session;

            // Emitir eventos para PassportEngine y testers
            this._dispatchEvent('passport:session-updated', session);
            this._dispatchEvent('passport:staff-authenticated', {
                provider: providerName,
                uid: session.uid,
                timestamp: Date.now()
            });

            this._setState('success');

            // Redirección Fiduciaria al interior del CRM
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1200);

        } catch (error) {
            console.error(`[at-admin-gate] OAuth ${providerName} error:`, error);

            this._dispatchEvent('passport:staff-auth-failed', {
                provider: providerName,
                code: error.code || 'UNKNOWN',
                message: error.message
            });

            this._showError(this._resolveErrorMessage(error));
            this._setState('error');
        }
    }

    /**
     * [SEC-06] Handler Vía Manual (Email Link)
     * Ejecuta sendSignInLinkToEmail con configuración actionCodeSettings.
     */
    async _handleManualSubmit(email) {
        this._setState('loading');

        try {
            const actionCodeSettings = {
                url: window.location.href,
                handleCodeInApp: true
            };

            await this._auth.sendSignInLinkToEmail(email, actionCodeSettings);

            // Persistir email para recuperación post-redirect
            if (window.localStorage) {
                window.localStorage.setItem('cpii:emailForSignIn', email);
            }

            // Mostrar confirmación visual
            if (this._elements.manualConfirm) {
                this._elements.manualConfirm.style.display = 'block';
            }

            this._dispatchEvent('passport:manual-link-sent', { email });
            this._setState('idle'); // Volver a idle tras éxito (no redirige aún)

        } catch (error) {
            console.error('[at-admin-gate] Manual link error:', error);
            this._showError(this._resolveErrorMessage(error));
            this._setState('error');
        }
    }

    /**
     * [SEC-07] Gestión de Estado Visual (Zero Trust UI)
     * Controla atributo data-gate-state en root y visibilidad de slots.
     * Estados válidos: 'idle' | 'loading' | 'error' | 'success'
     */
    _setState(state) {
        const { root, stateLoading, stateError, stateSuccess } = this._elements;

        if (root) {
            root.setAttribute('data-gate-state', state);
        }

        // Control de slots de estado (display none/flex/block)
        if (stateLoading) {
            stateLoading.style.display = state === 'loading' ? 'flex' : 'none';
        }
        if (stateError) {
            stateError.style.display = state === 'error' ? 'block' : 'none';
        }
        if (stateSuccess) {
            stateSuccess.style.display = state === 'success' ? 'block' : 'none';
        }

        // Reset de mensaje de error si salimos de error
        if (state !== 'error') {
            // Limpieza de mensaje de error previo podría ir aquí
        }
    }

    /**
     * Constructor de sesión agnóstica (R0)
     * Mapea objeto User de Firebase a estructura __CPII__.session.
     * Doctrina SIDECAR §5: getIdTokenResult() es MANDATORIO — claims reales, no vacíos.
     */
    async _buildSession(firebaseUser, provider) {
        const idTokenResult = await firebaseUser.getIdTokenResult();
        return {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || null,
            photoURL: firebaseUser.photoURL || null,
            provider: provider,
            claims: idTokenResult.claims,
            authenticated: true,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Resolución de mensajes de error con fallback i18n (R4)
     */
    _resolveErrorMessage(error) {
        const key = error.code ? `errors.${error.code}` : 'gate.state_error_generic';
        const fallback = error.message || 'Error desconocido';

        if (window.__CPII__?.i18n?.t) {
            return window.__CPII__.i18n.t(key, fallback);
        }
        return fallback;
    }

    /**
     * Visualización de error en slot dedicado
     */
    _showError(message) {
        const errorMsgEl = document.getElementById('gate-error-message');
        if (errorMsgEl) {
            errorMsgEl.textContent = message;
        }
    }

    /**
     * Emisor de CustomEvents estándar (R2)
     * Los eventos bubbles para ser capturados por passport-engine o tester.
     */
    _dispatchEvent(name, detail) {
        document.dispatchEvent(new CustomEvent(name, {
            detail: detail || {},
            bubbles: true,
            composed: false // Light DOM (R2)
        }));
    }
}

// ============================================================
// Registro del Web Component
// ============================================================
if (!customElements.get('at-admin-gate')) {
    customElements.define('at-admin-gate', AtAdminGate);
}

// Auto-instanciación para testing en harness (gate-tester.html)
// Si existe el golden-gate-root pero no hay tag <at-admin-gate>, inyectar silenciosamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('golden-gate-root') && !document.querySelector('at-admin-gate')) {
            const gate = document.createElement('at-admin-gate');
            gate.setAttribute('data-auto-injected', 'true');
            document.body.appendChild(gate);
        }
    });
} else {
    // DOM ya cargado
    if (document.getElementById('golden-gate-root') && !document.querySelector('at-admin-gate')) {
        const gate = document.createElement('at-admin-gate');
        gate.setAttribute('data-auto-injected', 'true');
        document.body.appendChild(gate);
    }
}