// ============================================================
// ARCHIVO  : contacts-service.js
// VERSIÓN  : 1.1.0
// FECHA    : 2026-05-19
// PROPÓSITO: Capa de acceso a datos CRM — colección 'contacts'.
//            Implementa operaciones CRUD + búsqueda + pipeline
//            sobre Firebase Firestore (v8 compat CDN).
//            GA-01: Electrificación transaccional con tenant dinámico.
//            Depende de: contacts-schema.js (window.__CPII__.schema).
//            Expone API pública en window.__CPII__.ContactsService.
//            Despacha CustomEvents en cada mutación exitosa.
//            Zero external deps. IIFE global.
// TENANT   : Dinámico vía session.claims.tenant_id (ATOM-02)
// ============================================================
//
// ÍNDICE
// [SEC-01] Namespace guard + boilerplate interno
// [SEC-02] Helpers internos (_db, _fv, _tenant, _emit, _validateStage)
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
// DOCTRINA: R0 (Agnosticismo Radical) | R5 (Aislamiento Fiduciario)
//           ATOM-02 (Tenant Dinámico) | DEC-01 (Firebase v8 compat)
//           DEC-03 (IIFE namespace) | DEC-04 (colección contacts)
//           PAT-01 (serverTimestamp) | PAT-02 (searchTokens)
// ============================================================

(function () {
  'use strict';

  // ============================================================
  // [SEC-01] Namespace guard + boilerplate interno
  // ============================================================

  if (!window.__CPII__) window.__CPII__ = {};

  const COLLECTION = 'contacts';
  // [GA-01] ELIMINADO: const TENANT = 'cpii_v1.1';
  // El tenant se resuelve dinámicamente vía _tenant() (ATOM-02)

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

  // [GA-01] NUEVO: Hard Gate de Tenant (ATOM-02 / R5 / R0)
  /**
   * Resuelve el tenant_id del usuario activo.
   * Operación Default-Deny: Sin tenant explícito, colapso inmediato.
   * @returns {string}
   * @throws {Error} si no hay tenant_id válido en sesión
   */
  function _tenant() {
    const sessionTenant = window.__CPII__?.session?.claims?.tenant_id;
    if (!sessionTenant || typeof sessionTenant !== 'string') {
      throw new Error('[FiduciaryLock] Violación de Aislamiento: Intento de I/O sin tenant_id válido en sesión.');
    }
    return sessionTenant;
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

  /**
   * Lee parámetros de atribución desde localStorage (GA-02).
   * O(1) por clave directa. Sin iteración.
   * @returns {Object} { l1Id, l2Id, l3Id, utmSource, utmMedium, utmCampaign, attributedAt }
   */
  function _readAttribution() {
    const get = (key) => localStorage.getItem(key) || null;
    const attributedAt = get('cpii:attribution:timestamp');

    return {
      l1Id:        get('cpii:attribution:l1'),
      l2Id:        get('cpii:attribution:l2'),
      l3Id:        get('cpii:attribution:l3'),
      utmSource:   get('cpii:attribution:utm_source'),
      utmMedium:   get('cpii:attribution:utm_medium'),
      utmCampaign: get('cpii:attribution:utm_campaign'),
      attributedAt: attributedAt ? new Date(attributedAt).toISOString() : null,
    };
  }

  /**
   * Fusiona atribución en payload respetando CONTACT_SCHEMA inmutable (R27).
   * Solo inyecta campos definidos en schema. Campos nulos se omiten.
   */
  function _mergeAttribution(payload, attribution, schema) {
    const schemaFields = schema.CONTACT_SCHEMA || {};
    const frozenKeys = Object.keys(schemaFields);

    Object.entries(attribution).forEach(([key, value]) => {
      if (value !== null && value !== undefined && frozenKeys.includes(key)) {
        if (!(key in payload)) {
          payload[key] = value;
        }
      }
    });

    return payload;
  }

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

    // [GA-02] Payload base desde schema inmutable
    let payload = schema.createContactPayload(data, creatorUid);

    // [GA-02] Inyección de atribución desde localStorage
    const attribution = _readAttribution();
    payload = _mergeAttribution(payload, attribution, schema);

    payload.createdAt      = FV.serverTimestamp();
    payload.updatedAt      = FV.serverTimestamp();
    payload.stageUpdatedAt = FV.serverTimestamp();

    // [GA-01] Tenant dinámico vía Hard Gate (ATOM-02)
    payload.tenant_id = _tenant();

    // [R27] Sello de inmutabilidad post-fusión
    Object.freeze(payload);

    const contactRef = db.collection(COLLECTION).doc();

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

  async function getById(id) {
    if (!id || typeof id !== 'string') {
      throw new Error('[ContactsService] getById: id es requerido.');
    }

    const db  = _db();
    const doc = await db.collection(COLLECTION).doc(id).get();

    if (!doc.exists) return null;

    const data = doc.data();

    // [GA-01] Tenant dinámico (ATOM-02)
    if (data.tenant_id !== _tenant()) {
      console.warn('[ContactsService] getById: tenant mismatch para doc', id);
      return null;
    }

    return { id: doc.id, ...data };
  }

  // ============================================================
  // [SEC-05] getBySlug(slug)
  // ============================================================

  async function getBySlug(slug) {
    if (!slug || typeof slug !== 'string') {
      throw new Error('[ContactsService] getBySlug: slug es requerido.');
    }

    const db = _db();
    const snapshot = await db.collection(COLLECTION)
      // [GA-01] Tenant dinámico (ATOM-02)
      .where('tenant_id', '==', _tenant())
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

  async function getByEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('[ContactsService] getByEmail: email es requerido.');
    }

    const db = _db();
    const snapshot = await db.collection(COLLECTION)
      // [GA-01] Tenant dinámico (ATOM-02)
      .where('tenant_id', '==', _tenant())
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

  async function getAll(options) {
    const opts = options || {};

    const limitN    = Math.min(opts.limit || 25, 100);
    const activeOnly = opts.activeOnly !== false;

    const db = _db();
    let query = db.collection(COLLECTION)
      // [GA-01] Tenant dinámico (ATOM-02)
      .where('tenant_id', '==', _tenant());

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

  async function update(id, changes) {
    if (!id || typeof id !== 'string') {
      throw new Error('[ContactsService] update: id es requerido.');
    }
    if (!changes || typeof changes !== 'object' || Object.keys(changes).length === 0) {
      throw new Error('[ContactsService] update: changes debe ser un objeto no vacío.');
    }

    const IMMUTABLE = ['slug', 'tenant_id', 'createdAt', 'createdBy', 'referralCode'];
    IMMUTABLE.forEach(field => {
      if (field in changes) {
        throw new Error(`[ContactsService] update: el campo "${field}" es inmutable y no puede modificarse.`);
      }
    });

    const db  = _db();
    const FV  = _fv();

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

  async function updatePipelineStage(id, newStage, actorUid) {
    if (!id)       throw new Error('[ContactsService] updatePipelineStage: id es requerido.');
    if (!newStage) throw new Error('[ContactsService] updatePipelineStage: newStage es requerido.');
    if (!actorUid) throw new Error('[ContactsService] updatePipelineStage: actorUid es requerido.');

    _validateStage(newStage);

    const db  = _db();
    const FV  = _fv();
    const ref = db.collection(COLLECTION).doc(id);

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

  async function search(queryStr, maxResults) {
    if (!queryStr || typeof queryStr !== 'string' || queryStr.trim().length < 2) {
      throw new Error('[ContactsService] search: queryStr debe tener mínimo 2 caracteres.');
    }

    const limit = Math.min(maxResults || 20, 50);

    const normalizedQuery = queryStr
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();

    const db = _db();
    const snapshot = await db.collection(COLLECTION)
      // [GA-01] Tenant dinámico (ATOM-02)
      .where('tenant_id',     '==',            _tenant())
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

    _meta: {
      version:    '1.1.0',           // [GA-01] Bump de versión
      date:       '2026-05-19',      // [GA-01] Fecha de electrificación
      collection: COLLECTION,
      tenantMode: 'dynamic',         // [GA-01] ATOM-02 activo
    },
  };

  console.info('[contacts-service v1.1.0] ContactsService registrado en window.__CPII__.ContactsService');

})();