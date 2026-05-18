// ============================================================
// ARCHIVO  : contacts-service.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-05-17
// PROPÓSITO: Capa de acceso a datos CRM — colección 'contacts'.
//            Implementa operaciones CRUD + búsqueda + pipeline
//            sobre Firebase Firestore (v8 compat CDN).
//            Depende de: contacts-schema.js (window.__CPII__.schema).
//            Expone API pública en window.__CPII__.ContactsService.
//            Despacha CustomEvents en cada mutación exitosa.
//            Zero external deps. IIFE global.
// TENANT   : cpii_v1.1
// ============================================================
//
// ÍNDICE
// [SEC-01] Namespace guard + boilerplate interno
// [SEC-02] Helpers internos (_db, _fv, _emit, _validateStage)
// [SEC-03] create(data, creatorUid)
// [SEC-04] getById(id)
// [SEC-05] getBySlug(slug)
// [SEC-06] getByEmail(email)
// [SEC-07] getAll(options)
// [SEC-08] update(id, changes)
// [SEC-09] updatePipelineStage(id, newStage, actorUid)
// [SEC-10] markLost(id, reason, actorUid)
// [SEC-11] reactivate(id, newStage, actorUid)
// [SEC-12] search(queryStr, maxResults)
// [SEC-13] remove(id, actorUid)
// [SEC-14] Export al namespace window.__CPII__
//
// DOCTRINA: R5 (Economía O(1)) | R39 (Pozos de Sabiduría)
//           DEC-01 (Firebase v8 compat) | DEC-03 (IIFE namespace)
//           DEC-04 (colección contacts / tenant cpii_v1.1)
//           PAT-01 (serverTimestamp inject) | PAT-02 (searchTokens)
// ============================================================

(function () {
  'use strict';

  // ============================================================
  // [SEC-01] Namespace guard + boilerplate interno
  // ============================================================

  if (!window.__CPII__) window.__CPII__ = {};

  const COLLECTION = 'contacts';
  const TENANT     = 'cpii_v1.1';

  // ============================================================
  // [SEC-02] Helpers internos
  // ============================================================

  /**
   * Devuelve la instancia de Firestore (v8 compat CDN).
   * Lanza error detectable si Firebase no está disponible.
   */
  function _db() {
    if (typeof window.firebase === 'undefined') {
      throw new Error('[ContactsService] Firebase SDK no disponible (window.firebase undefined).');
    }
    if (!window.firebase.firestore) {
      throw new Error('[ContactsService] Firebase Firestore no disponible (firebase.firestore undefined).');
    }
    return window.firebase.firestore();
  }

  /**
   * Atajo para FieldValue (v8 compat — clase estática).
   * Uso: _fv().serverTimestamp() | _fv().increment(n)
   */
  function _fv() {
    if (typeof firebase === 'undefined' || !firebase.firestore || !firebase.firestore.FieldValue) {
      throw new Error('[ContactsService] firebase.firestore.FieldValue no disponible.');
    }
    return firebase.firestore.FieldValue;
  }

  /**
   * Despacha un CustomEvent en document (bubbles: true).
   * @param {string} eventName — nombre canónico del evento
   * @param {Object} detail    — payload del evento
   */
  function _emit(eventName, detail) {
    try {
      document.dispatchEvent(new CustomEvent(eventName, {
        detail:     detail,
        bubbles:    true,
        cancelable: false,
      }));
    } catch (e) {
      console.warn('[ContactsService] _emit error:', eventName, e);
    }
  }

  /**
   * Valida que el stage proporcionado exista en PIPELINE_STAGES.
   * Requiere que contacts-schema.js esté cargado.
   * @param {string} stage
   * @throws {Error} si el stage no es válido
   */
  function _validateStage(stage) {
    const schema = window.__CPII__ && window.__CPII__.schema;
    if (!schema || !schema.PIPELINE_STAGES) {
      throw new Error('[ContactsService] contacts-schema.js no cargado — PIPELINE_STAGES no disponible.');
    }
    if (!schema.PIPELINE_STAGES[stage]) {
      const valid = Object.keys(schema.PIPELINE_STAGES).join(', ');
      throw new Error(`[ContactsService] Stage inválido: "${stage}". Válidos: ${valid}`);
    }
  }

  /**
   * Verifica que el schema esté disponible y devuelve la referencia.
   * @throws {Error} si contacts-schema.js no está cargado
   */
  function _schema() {
    const schema = window.__CPII__ && window.__CPII__.schema;
    if (!schema || typeof schema.createContactPayload !== 'function') {
      throw new Error('[ContactsService] contacts-schema.js no cargado — window.__CPII__.schema no disponible.');
    }
    return schema;
  }

  // ============================================================
  // [SEC-03] create(data, creatorUid)
  // ============================================================
  // Crea un nuevo contacto en Firestore.
  // - Usa createContactPayload() del schema para construir el objeto
  // - Inyecta serverTimestamp() para createdAt, updatedAt, stageUpdatedAt
  // - Si el contacto tiene l1Id, incrementa directReferralCount del referidor
  //   en la misma operación batch (atomicidad)
  // - Despacha 'cpii:contacts:created' al completar
  //
  // @param {Object} data        — campos del formulario / captación
  // @param {string} creatorUid  — UID del gestor autenticado
  // @returns {Promise<{id: string, slug: string, email: string}>}

  async function create(data, creatorUid) {
    if (!data || typeof data !== 'object') {
      throw new Error('[ContactsService] create: data es requerido y debe ser un objeto.');
    }
    if (!creatorUid || typeof creatorUid !== 'string') {
      throw new Error('[ContactsService] create: creatorUid es requerido.');
    }

    const schema  = _schema();
    const db      = _db();
    const FV      = _fv();

    // Construir payload base (sin timestamps — los inyecta este servicio)
    const payload = schema.createContactPayload(data, creatorUid);

    // Inyectar serverTimestamps (PAT-01)
    payload.createdAt      = FV.serverTimestamp();
    payload.updatedAt      = FV.serverTimestamp();
    payload.stageUpdatedAt = FV.serverTimestamp();

    // Forzar tenant (guardrail multitenancy)
    payload.tenant_id = TENANT;

    const contactRef = db.collection(COLLECTION).doc(); // Auto-ID de Firestore

    // Si hay referidor L1 → operación batch para incrementar su contador
    if (payload.l1Id && typeof payload.l1Id === 'string') {
      const batch      = db.batch();
      const referrerRef = db.collection(COLLECTION).doc(payload.l1Id);

      batch.set(contactRef, payload);
      batch.update(referrerRef, {
        directReferralCount: FV.increment(1),
        updatedAt:           FV.serverTimestamp(),
      });

      await batch.commit();
    } else {
      await contactRef.set(payload);
    }

    const result = { id: contactRef.id, slug: payload.slug, email: payload.email };

    _emit('cpii:contacts:created', result);

    console.info('[ContactsService] Contacto creado:', contactRef.id, payload.slug);
    return result;
  }

  // ============================================================
  // [SEC-04] getById(id)
  // ============================================================
  // Obtiene un contacto por su Firestore Document ID.
  // Verifica tenant_id para garantizar aislamiento.
  //
  // @param {string} id — Document ID de Firestore
  // @returns {Promise<Object|null>} — datos del contacto o null si no existe

  async function getById(id) {
    if (!id || typeof id !== 'string') {
      throw new Error('[ContactsService] getById: id es requerido.');
    }

    const db  = _db();
    const doc = await db.collection(COLLECTION).doc(id).get();

    if (!doc.exists) return null;

    const data = doc.data();

    // Guardrail: verificar tenant
    if (data.tenant_id !== TENANT) {
      console.warn('[ContactsService] getById: tenant mismatch para doc', id);
      return null;
    }

    return { id: doc.id, ...data };
  }

  // ============================================================
  // [SEC-05] getBySlug(slug)
  // ============================================================
  // Obtiene un contacto por su slug (índice secundario).
  //
  // @param {string} slug — slug normalizado del contacto
  // @returns {Promise<Object|null>}

  async function getBySlug(slug) {
    if (!slug || typeof slug !== 'string') {
      throw new Error('[ContactsService] getBySlug: slug es requerido.');
    }

    const db = _db();
    const snapshot = await db.collection(COLLECTION)
      .where('tenant_id', '==', TENANT)
      .where('slug', '==', slug.toLowerCase().trim())
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // ============================================================
  // [SEC-06] getByEmail(email)
  // ============================================================
  // Obtiene un contacto por email (índice secundario).
  // Útil para deduplicación antes de crear un nuevo contacto.
  //
  // @param {string} email — email normalizado (lowercase)
  // @returns {Promise<Object|null>}

  async function getByEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('[ContactsService] getByEmail: email es requerido.');
    }

    const db = _db();
    const snapshot = await db.collection(COLLECTION)
      .where('tenant_id', '==', TENANT)
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // ============================================================
  // [SEC-07] getAll(options)
  // ============================================================
  // Lista contactos con filtros opcionales y paginación por cursor.
  //
  // @param {Object} options
  //   @param {string}  options.stage      — filtrar por currentStage
  //   @param {string}  options.assignedTo — filtrar por UID gestor
  //   @param {boolean} options.activeOnly — solo isActive:true (default: true)
  //   @param {number}  options.limit      — máximo de docs (default: 25, max: 100)
  //   @param {Object}  options.startAfter — DocumentSnapshot para paginación
  // @returns {Promise<{contacts: Object[], lastDoc: Object|null}>}

  async function getAll(options) {
    const opts = options || {};

    const limitN    = Math.min(opts.limit || 25, 100);
    const activeOnly = opts.activeOnly !== false; // default true

    const db = _db();
    let query = db.collection(COLLECTION)
      .where('tenant_id', '==', TENANT);

    if (activeOnly) {
      query = query.where('isActive', '==', true);
    }

    if (opts.stage) {
      _validateStage(opts.stage);
      query = query.where('currentStage', '==', opts.stage);
    }

    if (opts.assignedTo && typeof opts.assignedTo === 'string') {
      query = query.where('assignedTo', '==', opts.assignedTo);
    }

    query = query.orderBy('createdAt', 'desc').limit(limitN);

    if (opts.startAfter) {
      query = query.startAfter(opts.startAfter);
    }

    const snapshot = await query.get();
    const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastDoc  = snapshot.docs.length === limitN
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

    return { contacts, lastDoc };
  }

  // ============================================================
  // [SEC-08] update(id, changes)
  // ============================================================
  // Actualización parcial de un contacto.
  // - Siempre inyecta updatedAt: serverTimestamp() (PAT-01)
  // - Rechaza cambios de campos inmutables: slug, tenant_id, createdAt, createdBy
  // - Despacha 'cpii:contacts:updated' al completar
  //
  // @param {string} id      — Document ID de Firestore
  // @param {Object} changes — campos a actualizar (parcial)
  // @returns {Promise<{id: string}>}

  async function update(id, changes) {
    if (!id || typeof id !== 'string') {
      throw new Error('[ContactsService] update: id es requerido.');
    }
    if (!changes || typeof changes !== 'object' || Object.keys(changes).length === 0) {
      throw new Error('[ContactsService] update: changes debe ser un objeto no vacío.');
    }

    // Guardrail: campos inmutables
    const IMMUTABLE = ['slug', 'tenant_id', 'createdAt', 'createdBy', 'referralCode'];
    IMMUTABLE.forEach(field => {
      if (field in changes) {
        throw new Error(`[ContactsService] update: el campo "${field}" es inmutable y no puede modificarse.`);
      }
    });

    const db  = _db();
    const FV  = _fv();

    // Inyectar updatedAt siempre (PAT-01)
    const safeChanges = Object.assign({}, changes, {
      updatedAt: FV.serverTimestamp(),
    });

    await db.collection(COLLECTION).doc(id).update(safeChanges);

    const result = { id };
    _emit('cpii:contacts:updated', result);

    return result;
  }

  // ============================================================
  // [SEC-09] updatePipelineStage(id, newStage, actorUid)
  // ============================================================
  // Avanza o retrocede el pipeline stage de un contacto.
  // - Valida que newStage exista en PIPELINE_STAGES
  // - Inyecta stageUpdatedAt + updatedAt
  // - Despacha 'cpii:contacts:stage-changed' con stage anterior y nuevo
  //
  // @param {string} id       — Document ID
  // @param {string} newStage — clave de PIPELINE_STAGES
  // @param {string} actorUid — UID del gestor que realiza el cambio
  // @returns {Promise<{id: string, previousStage: string, newStage: string}>}

  async function updatePipelineStage(id, newStage, actorUid) {
    if (!id)       throw new Error('[ContactsService] updatePipelineStage: id es requerido.');
    if (!newStage) throw new Error('[ContactsService] updatePipelineStage: newStage es requerido.');
    if (!actorUid) throw new Error('[ContactsService] updatePipelineStage: actorUid es requerido.');

    _validateStage(newStage);

    const db  = _db();
    const FV  = _fv();
    const ref = db.collection(COLLECTION).doc(id);

    // Leer etapa actual para el evento
    const docSnap = await ref.get();
    if (!docSnap.exists) throw new Error(`[ContactsService] updatePipelineStage: contacto "${id}" no encontrado.`);

    const previousStage = docSnap.data().currentStage;

    await ref.update({
      currentStage:   newStage,
      stageUpdatedAt: FV.serverTimestamp(),
      updatedAt:      FV.serverTimestamp(),
    });

    const result = { id, previousStage, newStage };
    _emit('cpii:contacts:stage-changed', result);

    console.info(`[ContactsService] Stage actualizado: ${id} → ${previousStage} → ${newStage}`);
    return result;
  }

  // ============================================================
  // [SEC-10] markLost(id, reason, actorUid)
  // ============================================================
  // Marca un contacto como perdido (isActive: false).
  // "Lost" es estado transversal — NO bloquea re-apertura (PAT-03).
  // - Despacha 'cpii:contacts:lost'
  //
  // @param {string} id       — Document ID
  // @param {string} reason   — motivo de pérdida (obligatorio)
  // @param {string} actorUid — UID del gestor
  // @returns {Promise<{id: string}>}

  async function markLost(id, reason, actorUid) {
    if (!id)     throw new Error('[ContactsService] markLost: id es requerido.');
    if (!reason) throw new Error('[ContactsService] markLost: reason es requerido (describir motivo de pérdida).');
    if (!actorUid) throw new Error('[ContactsService] markLost: actorUid es requerido.');

    const db = _db();
    const FV = _fv();

    await db.collection(COLLECTION).doc(id).update({
      isActive:   false,
      lostReason: reason.trim(),
      lostAt:     FV.serverTimestamp(),
      updatedAt:  FV.serverTimestamp(),
    });

    const result = { id, reason };
    _emit('cpii:contacts:lost', result);

    console.info('[ContactsService] Contacto marcado como perdido:', id, reason);
    return result;
  }

  // ============================================================
  // [SEC-11] reactivate(id, newStage, actorUid)
  // ============================================================
  // Re-abre un contacto perdido (isActive: true).
  // "Lost" no bloquea re-apertura — doctrina PAT-03.
  // - Despacha 'cpii:contacts:reactivated'
  //
  // @param {string} id       — Document ID
  // @param {string} newStage — stage en el que se re-abre (default: 'contact_initiated')
  // @param {string} actorUid — UID del gestor
  // @returns {Promise<{id: string, newStage: string}>}

  async function reactivate(id, newStage, actorUid) {
    if (!id)     throw new Error('[ContactsService] reactivate: id es requerido.');
    if (!actorUid) throw new Error('[ContactsService] reactivate: actorUid es requerido.');

    const stage = newStage || 'contact_initiated';
    _validateStage(stage);

    const db = _db();
    const FV = _fv();

    await db.collection(COLLECTION).doc(id).update({
      isActive:       true,
      lostReason:     '',
      lostAt:         null,
      currentStage:   stage,
      stageUpdatedAt: FV.serverTimestamp(),
      updatedAt:      FV.serverTimestamp(),
    });

    const result = { id, newStage: stage };
    _emit('cpii:contacts:reactivated', result);

    console.info('[ContactsService] Contacto reactivado:', id, '→', stage);
    return result;
  }

  // ============================================================
  // [SEC-12] search(queryStr, maxResults)
  // ============================================================
  // Búsqueda de prefijo sobre el campo _searchTokens.
  // Firestore array-contains → O(1) para colecciones < 50k docs (PAT-02).
  // Mínimo 2 caracteres para evitar resultados masivos.
  //
  // @param {string} queryStr   — término de búsqueda (min 2 chars)
  // @param {number} maxResults — límite de resultados (default: 20, max: 50)
  // @returns {Promise<Object[]>} — array de contactos encontrados

  async function search(queryStr, maxResults) {
    if (!queryStr || typeof queryStr !== 'string' || queryStr.trim().length < 2) {
      throw new Error('[ContactsService] search: queryStr debe tener mínimo 2 caracteres.');
    }

    const limit = Math.min(maxResults || 20, 50);

    // Normalizar el query: NFD + strip diacríticos + lowercase + trim
    const normalizedQuery = queryStr
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();

    const db = _db();
    const snapshot = await db.collection(COLLECTION)
      .where('tenant_id',     '==',            TENANT)
      .where('isActive',      '==',            true)
      .where('_searchTokens', 'array-contains', normalizedQuery)
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // ============================================================
  // [SEC-13] remove(id, actorUid)
  // ============================================================
  // Soft delete: marca el contacto como inactivo con deletedAt.
  // No realiza borrado físico del documento (preserva trazabilidad).
  // Para borrado físico permanente usar la consola Firebase directamente.
  //
  // @param {string} id       — Document ID
  // @param {string} actorUid — UID del gestor que realiza la eliminación
  // @returns {Promise<{id: string}>}

  async function remove(id, actorUid) {
    if (!id)     throw new Error('[ContactsService] remove: id es requerido.');
    if (!actorUid) throw new Error('[ContactsService] remove: actorUid es requerido.');

    const db = _db();
    const FV = _fv();

    await db.collection(COLLECTION).doc(id).update({
      isActive:  false,
      deletedAt: FV.serverTimestamp(),
      deletedBy: actorUid,
      updatedAt: FV.serverTimestamp(),
    });

    const result = { id };
    _emit('cpii:contacts:removed', result);

    console.info('[ContactsService] Contacto eliminado (soft):', id);
    return result;
  }

  // ============================================================
  // [SEC-14] Export al namespace window.__CPII__
  // ============================================================

  window.__CPII__.ContactsService = {
    create,
    getById,
    getBySlug,
    getByEmail,
    getAll,
    update,
    updatePipelineStage,
    markLost,
    reactivate,
    search,
    remove,

    // Metadatos de versión para diagnóstico
    _meta: {
      version:    '1.0.0',
      date:       '2026-05-17',
      collection: COLLECTION,
      tenant:     TENANT,
    },
  };

  console.info('[contacts-service v1.0.0] ContactsService registrado en window.__CPII__.ContactsService');

})();
