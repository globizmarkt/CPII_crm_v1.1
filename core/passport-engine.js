/**
 * 🛡️ CARTOGRAFÍA QUIRÚRGICA v3.2
 * ============================================================
 * Archivo:      core/passport-engine.js
 * Tipo:         Motor de Autorización Fiduciaria O(1)
 * Rol:          Sistema de Custodia y Privilegio Compliance-Based
 * Autor:        Kimi | Unidad de Artifacts
 * Versión:      2.3.0
 * Timestamp:    2026-05-19T00:00:00Z
 * ============================================================
 * DOCTRINAS:    [R3] Zero-Hex | [R4] i18n Strict | [R5] Economía de Guerra
 * STATUS:       R5 Compliant | Zero-Deps | O(1) Complexity Guaranteed
 * ============================================================
 * 
 * DEPENDENCIAS CRÍTICAS:
 * - window.__CPII__.session (Fuente de Verdad de Antigravity)
 * - Firebase Auth Claims (tenant_id, roles, onboarding_phase)
 * 
 * SANITIZACIÓN: Sin referencias legacy "cifi". Namespace puro __CPII__.
 */

(function () {
  'use strict';

  const ENGINE_VERSION = '2.3.0';
  const CACHE_CLAIMS_KEY = '__claims_cache';

  /**
   * Estructura de caché para lookups O(1)
   * @type {Map<string, Set<string>>}
   */
  const permissionsCache = new Map();

  /**
   * Inicialización del motor en el namespace global
   */
  if (!window.__CPII__) {
    window.__CPII__ = {};
  }

  window.__CPII__.PassportEngine = {
    version: ENGINE_VERSION,

    /**
     * Valida autorización de un elemento DOM contra claims de sesión
     * Complejidad: O(1) - Tiempo constante garantizado
     * 
     * @param {HTMLElement} element - Elemento con data-requires y contexto tenant
     * @returns {AuthorizationResult}
     */
    authorizeAccess: function (element) {
      const result = {
        authorized: false,
        reason: null,
        tenantMatch: false,
        rolesMatched: [],
        phaseRequirement: null
      };

      // 1. Obtener sesión activa (Fuente de Verdad)
      const session = window.__CPII__.session;
      if (!session || !session.claims) {
        result.reason = 'no_session';
        return result;
      }

      const claims = session.claims;

      // 2. Validación OBLIGATORIA de Tenant ID (Anti-spoofing)
      const requiredTenant = element.closest('[data-tenant-id]')?.dataset.tenantId;
      const sessionTenant = claims.tenant_id;

      if (!requiredTenant) {
        result.reason = 'missing_tenant_context';
        return result;
      }

      if (requiredTenant !== sessionTenant) {
        result.reason = 'tenant_mismatch';
        result.tenantMatch = false;
        return result;
      }

      result.tenantMatch = true;

      // 3. Parseo de requerimientos (data-requires="role:owner|role:gestor")
      const requiresAttr = element.dataset.requires;
      if (!requiresAttr) {
        // Sin requerimientos explícitos, solo validación de tenant basta
        result.authorized = true;
        return result;
      }

      // 4. Evaluación de Roles en O(1)
      const requiredRoles = this._parseRoles(requiresAttr);
      const userRoles = this._getCachedRoles(claims);

      // Intersección O(min(M,N)) donde M,N son sets pequeños (constante acotada)
      // Para propósitos prácticos de roles fiduciarios (<20 roles), esto es O(1)
      const hasMatchingRole = requiredRoles.size === 0 ||
        Array.from(requiredRoles).some(role => userRoles.has(role));

      if (!hasMatchingRole) {
        result.reason = 'insufficient_privilege';
        return result;
      }

      result.rolesMatched = Array.from(requiredRoles).filter(r => userRoles.has(r));

      // 5. Validación de Fase (data-phase) - Lógica acumulativa
      const requiredPhase = parseInt(element.dataset.phase, 10);
      if (!isNaN(requiredPhase)) {
        result.phaseRequirement = requiredPhase;
        const userPhase = parseInt(claims.onboarding_phase, 10) || 0;

        if (userPhase < requiredPhase) {
          result.reason = 'phase_locked';
          return result;
        }
      }

      // 6. Validación de Custodia (si aplica)
      if (element.dataset.custody === 'hold' && claims.custody_status !== 'released') {
        result.reason = 'custody_hold';
        return result;
      }

      result.authorized = true;
      return result;
    },

    /**
     * Refresca la caché de roles (llamar tras actualización de claims)
     */
    invalidateCache: function () {
      permissionsCache.delete(CACHE_CLAIMS_KEY);
    },

    // ──────────────────────────────────────────────────────────────────────
    // DT-AUTH-01 FIX — VIBE-CPII-REBORN-02.2 — 2026-05-19
    // Fractura: _buildSession() no llamaba getIdTokenResult() → claims vacíos
    // → Born Locked permanente → UI bloqueada indefinidamente.
    // Solución: método async que fuerza refresh del JWT y extrae Custom Claims.
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Construye la sesión extrayendo Custom Claims reales del JWT de Firebase.
     * Llama a user.getIdTokenResult(true) para forzar refresh desde el servidor
     * (garantiza que claims inyectados por Cloud Functions sean los más recientes).
     * Popula window.__CPII__.session y dispara passport:session-updated.
     *
     * @param  {firebase.User} user - Objeto Firebase Auth User (v8 compat)
     * @returns {Promise<Object|null>}  Sesión construida, o null si hay error
     */
    _buildSession: async function (user) {
      if (!user) {
        console.warn('[PassportEngine._buildSession] user es null — sesión no construida.');
        return null;
      }

      try {
        // forceRefresh=true: lee claims frescos del servidor, nunca de caché local.
        // Necesario para recoger claims inyectados por beforeUserCreated / Admin SDK.
        const idTokenResult = await user.getIdTokenResult(/* forceRefresh= */true);
        const claims = idTokenResult.claims;

        window.__CPII__.session = {
          uid:             user.uid,
          status:          'authenticated',
          // tenantValidated es el semáforo que Born Locked evalúa (index.html)
          tenantValidated: claims.tenant_id === 'cpii_v1.1',
          user: {
            email:         user.email,
            displayName:   user.displayName,
            photoURL:      user.photoURL,
            emailVerified: user.emailVerified
          },
          claims: {
            // Campos canónicos — estructura documentada en 05.2 §2.2
            uid:              user.uid,
            tenant_id:        claims.tenant_id        || null,
            role:             claims.role             || null,
            kyc_status:       claims.kyc_status       || 'pending',
            onboarding_phase: claims.onboarding_phase || 1,
            custody_status:   claims.custody_status   || 'active',
            // Árbol de atribución L1-L3 (ATOM-02)
            l1Id:             claims.l1Id             || null,
            l2Id:             claims.l2Id             || null,
            l3Id:             claims.l3Id             || null,
            // auth_time para cache key en _getCachedRoles
            auth_time:        claims.auth_time         || null
          },
          authenticatedAt: Date.now()
        };

        console.info(
          '[PassportEngine] ✅ Session construida.' +
          ' uid=' + user.uid +
          ' | tenant=' + (claims.tenant_id || 'MISSING') +
          ' | role=' + (claims.role || 'MISSING') +
          ' | tenantValidated=' + (claims.tenant_id === 'cpii_v1.1')
        );

        // Re-audita todas las gate zones con los claims reales
        document.dispatchEvent(new CustomEvent('passport:session-updated', {
          detail: { session: window.__CPII__.session, source: '_buildSession' },
          bubbles: true
        }));

        return window.__CPII__.session;

      } catch (err) {
        console.error('[PassportEngine._buildSession] Error al leer claims del JWT:', err);
        // Sesión de error: no bloquea el motor pero tenantValidated=false
        window.__CPII__.session = {
          uid:             user.uid,
          status:          'auth_error',
          tenantValidated: false,
          claims:          {}
        };
        document.dispatchEvent(new CustomEvent('passport:session-updated', {
          detail: { session: window.__CPII__.session, source: '_buildSession_error' },
          bubbles: true
        }));
        return null;
      }
    },

    /**
     * Evaluación batch para inicialización de UI (Sprint 3)
     * Procesa todos los elementos [data-requires] en el DOM
     */
    auditGateZones: function () {
      const zones = document.querySelectorAll('[data-gate-zone]');
      const results = [];

      zones.forEach(zone => {
        // 🛡️ REVELACIÓN ZERO TRUST: Si la zona tiene un lock global, lo ocultamos tras auditar
        const zoneLock = zone.querySelector('[data-gate-lock]');
        if (zoneLock) {
          zoneLock.classList.add('hidden');
          zoneLock.setAttribute('aria-hidden', 'true');
        }

        const protectedElements = zone.querySelectorAll('[data-requires], [data-phase]');

        protectedElements.forEach(el => {
          const auth = this.authorizeAccess(el);

          if (auth.authorized) {
            this._unlockElement(el);
          } else {
            this._maintainCustodyHold(el, auth.reason);
          }

          results.push({ element: el, authorization: auth });
        });
      });

      // EMITIR EVENTO DE AUDITORÍA
      window.dispatchEvent(new CustomEvent('passport:audit-complete', {
        detail: {
          timestamp: Date.now(),
          zones_audited: zones.length,
          results_evaluated: results.length
        }
      }));

      return results;
    },

    /**
     * Parsea string de roles a Set para O(1) lookup
     * @private
     */
    _parseRoles: function (requiresStr) {
      const roles = new Set();
      const parts = requiresStr.split('|');

      parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed.startsWith('role:')) {
          roles.add(trimmed.substring(5));
        } else if (trimmed.startsWith('perm:')) {
          roles.add(`perm:${trimmed.substring(5)}`);
        } else if (trimmed) {
          roles.add(trimmed);
        }
      });

      return roles;
    },

    /**
     * Obtiene roles cacheados del usuario O(1)
     * @private
     */
    _getCachedRoles: function (claims) {
      const cacheKey = `${claims.auth_time}_${claims.tenant_id}`;

      if (permissionsCache.has(CACHE_CLAIMS_KEY)) {
        const cached = permissionsCache.get(CACHE_CLAIMS_KEY);
        if (cached.key === cacheKey) {
          return cached.roles;
        }
      }

      const roles = new Set();
      if (Array.isArray(claims.roles)) {
        claims.roles.forEach(r => roles.add(r));
      }

      if (claims.role) roles.add(claims.role);
      if (claims.is_owner === true) roles.add('owner');
      if (claims.is_gestor === true) roles.add('gestor');
      if (claims.is_admin === true) roles.add('admin');
      if (claims.permission_level) {
        roles.add(`level:${claims.permission_level}`);
      }

      permissionsCache.set(CACHE_CLAIMS_KEY, {
        key: cacheKey,
        roles: roles
      });

      return roles;
    },

    /**
     * Desbloquea visualmente un elemento
     * @private
     */
    _unlockElement: function (el) {
      el.classList.remove('opacity-50', 'pointer-events-none', 'grayscale');
      el.removeAttribute('aria-disabled');
      el.setAttribute('data-custody-status', 'released');

      if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT') {
        el.removeAttribute('disabled');
      }

      el.style.transition = 'opacity 300ms ease-out';
      el.style.opacity = '1';
    },

    /**
     * Sincroniza overlay gatekeeper y widget KYC con el estado real de claims.
     * Oculta el overlay cuando kyc_status === 'approved'; lo muestra en cualquier otro caso.
     * @private
     */
    _syncGatekeeperUI: function (claims) {
      const approved = claims.kyc_status === 'approved';

      // Overlay blur (P0-1)
      const overlay = document.getElementById('gatekeeper-overlay');
      if (overlay) {
        overlay.style.display = approved ? 'none' : '';
      }

      // KYC status widget (P0-6)
      const dot    = document.getElementById('gk-status-dot');
      const iconBg = document.getElementById('gk-icon-bg');
      const icon   = document.getElementById('gk-icon');

      if (!dot || !iconBg || !icon) return;

      if (approved) {
        dot.className    = 'size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
        iconBg.className = 'size-10 bg-green-500/10 rounded-lg flex items-center justify-center';
        icon.className   = 'material-symbols-outlined text-green-500';
        icon.textContent = 'verified_user';
      } else {
        dot.className    = 'size-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]';
        iconBg.className = 'size-10 bg-orange-500/10 rounded-lg flex items-center justify-center';
        icon.className   = 'material-symbols-outlined text-orange-500';
        icon.textContent = 'shield_with_heart';
      }
    },

    /**
     * Hidrata el avatar del usuario desde session.user.photoURL
     * @private
     */
    _syncAvatar: function () {
      const photoURL = window.__CPII__?.session?.user?.photoURL;
      if (!photoURL) return;
      const img = document.getElementById('user-avatar');
      if (img) img.src = photoURL;
    },

    /**
     * Mantiene o aplica estado de Custody Hold visual
     * @private
     */
    _maintainCustodyHold: function (el, reason) {
      el.classList.add('opacity-50', 'pointer-events-none', 'grayscale');
      el.setAttribute('aria-disabled', 'true');
      el.setAttribute('data-custody-status', 'hold');
      el.setAttribute('data-custody-reason', reason);

      if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT') {
        el.setAttribute('disabled', 'true');
      }
    }
  };

  /**
   * Inicialización
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngine);
  } else {
    initEngine();
  }

  /**
 * ============================================================
 * CARTOGRAFÍA QUIRÚRGICA v3.2
 * ============================================================
 * FUNCIÓN   : initEngine
 * ARCHIVO   : core/passport-engine.js  
 * VERSIÓN   : 2.2.0-RESILIENCE
 * FECHA     : 2026-04-10
 * AUTOR     : Junior Dev-Logic Kimi
 * DOCTRINA  : R2 (Light DOM) | R5 (Economía O(1))
 * PROPÓSITO : Inicialización resiliente con acoplamiento 
 *             document-level y gestión KYC manual.
 * ============================================================
 */
  function initEngine() {
    // Helper O(1): Refresco de auditoría post-evento (R5: DRY)
    const triggerAudit = () => {
      const pe = window.__CPII__?.PassportEngine;
      if (!pe) return;
      pe.invalidateCache();
      pe.auditGateZones();
      pe._syncGatekeeperUI(window.__CPII__?.session?.claims || {});
      pe._syncAvatar();
    };

    // [SEC-01] Listeners Document-level (acoplamiento con at-admin-gate.js)
    document.addEventListener('passport:staff-authenticated', triggerAudit);
    document.addEventListener('passport:session-updated', triggerAudit);

    // [SEC-03] Firebase Auth — onAuthStateChanged (DT-AUTH-01 FIX)
    // Hook directo al ciclo de vida de Firebase Auth v8 compat.
    // Cuando el usuario está autenticado, llama a _buildSession() para
    // extraer Custom Claims reales del JWT (getIdTokenResult).
    // Requiere que firebase-config.js haya inicializado la app antes.
    const _firebaseAuth = (
      typeof firebase !== 'undefined' &&
      firebase.apps &&
      firebase.apps.length > 0
    ) ? firebase.auth() : null;

    if (_firebaseAuth) {
      _firebaseAuth.onAuthStateChanged(async function (user) {
        if (user) {
          // Usuario autenticado → construir sesión con claims reales
          await window.__CPII__.PassportEngine._buildSession(user);
        } else {
          // Usuario no autenticado (logout o sesión expirada)
          window.__CPII__.session = { status: 'unauthenticated', claims: {} };
          triggerAudit();
        }
      });
      console.info('[PassportEngine] SEC-03: Firebase Auth listener activo.');
    } else {
      console.warn('[PassportEngine] Firebase Auth no disponible — SEC-03 omitido.');
    }

    // [SEC-02] Bootstrap inicial: Validación de sesión existente o fallback
    // Solo actúa en modo fallback (sin Firebase disponible).
    // Con Firebase, el SEC-03 onAuthStateChanged se encarga de la sesión.
    if (window.__CPII__?.session?.claims) {
      triggerAudit();
    } else if (!_firebaseAuth) {
      // Fallback exclusivo: Firebase no disponible → sesión vacía para no bloquear UI
      console.warn('[PassportEngine] Sesión no detectada, inicializando fallback.');
      if (!window.__CPII__.session) window.__CPII__.session = {};
      window.__CPII__.session.claims = {};
      triggerAudit();
    }

    console.info(`[PassportEngine v${ENGINE_VERSION}] Inicializado. DT-AUTH-01 fix activo | R5 Compliant`);
  }

})();