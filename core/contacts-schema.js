// ============================================================
// ARCHIVO  : contacts-schema.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-05-17
// PROPÓSITO: Contrato canónico de datos CRM — CONTACT_SCHEMA,
//            PIPELINE_STAGES y helpers de construcción de payload.
//            Zero-Deps. Zero-Firestore. Solo definiciones puras.
//            Fuente de verdad para contacts-service.js,
//            at-pipeline.js y at-dashboard.js.
// ============================================================
//
// ÍNDICE
// [SEC-01] Namespace guard
// [SEC-02] CONTACT_SCHEMA — plantilla canónica inmutable
// [SEC-03] PIPELINE_STAGES — 6 fases + doctrina "Lost"
// [SEC-04] generateSlug — NFD + strip diacríticos
// [SEC-05] generateSearchTokens — prefijos para búsqueda sin Algolia
// [SEC-06] createContactPayload — factory con defaults + derivados
// [SEC-07] Export al namespace window.__CPII__
//
// DOCTRINA: R0 (sin hardcode en markup) | R3 (Zero-Hex)
//           R4 (i18n Strict) | R5 (Economía O(1))
// TENANT  : cpii_v1.1
// ============================================================

'use strict';

// [SEC-01] Namespace guard
if (!window.__CPII__) window.__CPII__ = {};

// ============================================================
// [SEC-02] CONTACT_SCHEMA — plantilla canónica inmutable
// ============================================================
// Object.freeze() en la raíz; las sub-estructuras anidadas se
// clonan en createContactPayload — nunca se mutan directamente.

const CONTACT_SCHEMA = Object.freeze({

  // ── IDENTIFICACIÓN ──────────────────────────────────────
  // id: auto-generado por Firestore (NUNCA el slug como doc ID)
  slug:              '',       // NFD + strip diacríticos. Inmutable tras creación.
  referralCode:      '',       // "CPII-{slug}" — para compartir
  tenant_id:         'cpii_v1.1', // OBLIGATORIO en toda escritura (multitenancy)

  firstName:         '',
  lastName:          '',
  fullName:          '',       // Desnormalizado: firstName + ' ' + lastName
  email:             '',
  emailSecondary:    '',
  phone:             '',       // Formato E.164: "+351..."
  country:           'PT',    // ISO 3166-1 alpha-2
  city:              '',
  timezone:          'Europe/Lisbon', // IANA timezone
  preferredLanguage: 'pt',    // "pt" | "es" | "en" | "fr"

  // ── CUALIFICACIÓN FINANCIERA (HNWI) ─────────────────────
  investorProfile: {
    type:                '',    // "individual" | "institutional" | "family_office"
    accreditedStatus:    '',    // "accredited" | "qualified" | "unverified"
    annualIncome:        '',    // "50k-100k" | "100k-250k" | "250k-500k" | "500k+"
    totalPatrimony:      '',    // "250k-500k" | "500k-1M" | "1M-5M" | "5M+"
    estimatedTicket:     '',    // Rango de inversión estimada en CPII
    investmentHorizon:   '',    // "short" (<1y) | "medium" (1-3y) | "long" (3y+)
    riskProfile:         '',    // "conservative" | "moderate" | "aggressive"
    previousInvestments: false,
    sourceOfFunds:       '',
    interestAreas:       [],   // ["real_estate", "bonds", "equity"]
  },

  // ── COMPLIANCE / KYC ────────────────────────────────────
  compliance: {
    kycStatus:    'pending',  // "pending" | "in_review" | "approved" | "rejected"
    kycDate:      null,
    documentType: '',         // "passport" | "national_id" | "tax_id"
    documentRef:  '',         // Referencia Firebase Storage — NUNCA texto plano
    pepStatus:    false,      // Persona Expuesta Políticamente
    amlFlag:      false,      // Anti Money Laundering
    notes:        '',
  },

  // ── ATRIBUCIÓN (campos planos — 3 niveles fijos) ────────
  // Decisión 08.3: campos planos > Materialized Path array para ≤3 niveles
  l1Id:               null,   // UID del referidor directo
  l2Id:               null,   // UID del referidor de L1
  l3Id:               null,   // UID del referidor de L2
  l1Slug:             null,   // Slug de L1 (display sin getDoc extra)
  directReferralCount: 0,     // Desnormalizado — FieldValue.increment() en write

  utmSource:        '',
  utmMedium:        '',
  utmCampaign:      '',
  firstTouchChannel: '',      // "referral" | "organic" | "direct" | "social"

  // ── PIPELINE (6 fases CPII) ──────────────────────────────
  // "Lost" NO es fase — es isActive:false + lostReason + lostAt
  currentStage:   'lead_captured',
  stageUpdatedAt: null,
  assignedTo:     '',         // UID del gestor responsable
  priority:       'medium',   // "low" | "medium" | "high" | "critical"
  score:          0,          // Lead scoring 0–100
  nextAction:     '',
  nextActionDate: null,
  nextFollowUpAt: null,       // Para Cloud Scheduler + alertas Telegram

  // ── INTERACCIÓN ──────────────────────────────────────────
  totalTouchpoints:    0,
  lastContactDate:     null,
  lastContactChannel:  '',    // "email" | "phone" | "telegram" | "meeting"
  preferredChannel:    '',
  telegramChatId:      '',    // Para notificaciones directas al inversor
  notes:               '',

  // ── METADATA ─────────────────────────────────────────────
  createdAt:  null,           // serverTimestamp() — asignado en contacts-service
  updatedAt:  null,           // serverTimestamp() — asignado en contacts-service
  createdBy:  '',             // UID del gestor que creó el contacto
  isActive:   true,
  lostReason: '',             // Solo si isActive === false
  lostAt:     null,
  tags:       [],
  _searchTokens: [],          // Prefijos NFD para búsqueda sin Algolia (O(1))
});

// ============================================================
// [SEC-03] PIPELINE_STAGES — 6 fases + doctrina "Lost"
// ============================================================
// "Lost" es un estado transversal (isActive: false), no una fase
// secuencial. No bloquea re-apertura del contacto.

const PIPELINE_STAGES = Object.freeze({
  lead_captured:     { order: 1, label: { pt: 'Lead Capturado',    es: 'Lead Capturado'    } },
  contact_initiated: { order: 2, label: { pt: 'Contacto Iniciado', es: 'Contacto Iniciado' } },
  qualified:         { order: 3, label: { pt: 'Qualificado',       es: 'Cualificado'       } },
  presentation:      { order: 4, label: { pt: 'Apresentação',      es: 'Presentación'      } },
  kyc_approved:      { order: 5, label: { pt: 'KYC Aprovado',      es: 'KYC Aprobado'      } },
  active_investor:   { order: 6, label: { pt: 'Investidor Ativo',  es: 'Inversor Activo'   } },
});

// ============================================================
// [SEC-04] generateSlug — NFD + strip diacríticos + guiones
// ============================================================
// Coste: O(n) donde n = longitud de fullName. Invariante: mismo
// input → mismo output (determinista). Sin random, sin timestamp.

function generateSlug(fullName) {
  if (!fullName || typeof fullName !== 'string') return '';

  return fullName
    .normalize('NFD')                    // Descompone diacríticos (é → e + combining mark)
    .replace(/[̀-ͯ]/g, '')    // Elimina marcas diacríticas (Unicode block)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')       // Solo alfanumérico y guiones
    .replace(/\s+/g, '-')               // Espacios → guiones
    .replace(/-+/g, '-')                // Colapsa guiones múltiples
    .replace(/^-|-$/g, '');             // Elimina guiones en extremos
}

// ============================================================
// [SEC-05] generateSearchTokens — prefijos NFD para búsqueda
// ============================================================
// Genera array de prefijos (mínimo 2 chars) sobre los campos
// más buscados: fullName, email, phone.
// Firestore "array-contains" sobre _searchTokens permite búsqueda
// de prefijo O(1) sin Algolia para colecciones < 50k docs.

function generateSearchTokens(firstName, lastName, email, phone) {
  const tokens = new Set();

  const addPrefixes = (str) => {
    if (!str) return;
    const normalized = str
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();

    for (let i = 2; i <= normalized.length; i++) {
      tokens.add(normalized.slice(0, i));
    }
  };

  addPrefixes(firstName);
  addPrefixes(lastName);
  addPrefixes(`${firstName} ${lastName}`);
  addPrefixes(email ? email.split('@')[0] : '');
  if (phone) addPrefixes(phone.replace(/\D/g, '').slice(-9));

  return Array.from(tokens);
}

// ============================================================
// [SEC-06] createContactPayload — factory con defaults + derivados
// ============================================================
// Produce el objeto listo para Firestore (sin serverTimestamp —
// esos los inyecta contacts-service.js para mantener este módulo
// Zero-Deps de Firebase SDK).
//
// @param {Object} data        — campos del formulario de captación
// @param {string} creatorUid  — UID del gestor autenticado
// @returns {Object}           — payload Firestore-ready

function createContactPayload(data, creatorUid) {
  if (!data || typeof data !== 'object') {
    throw new Error('[contacts-schema] createContactPayload: data es requerido');
  }
  if (!creatorUid) {
    throw new Error('[contacts-schema] createContactPayload: creatorUid es requerido');
  }

  const firstName  = (data.firstName  || '').trim();
  const lastName   = (data.lastName   || '').trim();
  const fullName   = `${firstName} ${lastName}`.trim();
  const slug       = generateSlug(fullName);
  const referralCode = slug ? `CPII-${slug}` : '';

  // Deep clone de CONTACT_SCHEMA para no mutar la plantilla
  const base = JSON.parse(JSON.stringify(CONTACT_SCHEMA));

  const payload = Object.assign(base, {
    // Identificación derivada
    slug,
    referralCode,
    fullName,
    firstName,
    lastName,

    // Campos del formulario (sobrescriben defaults)
    email:             (data.email             || '').trim().toLowerCase(),
    emailSecondary:    (data.emailSecondary     || '').trim().toLowerCase(),
    phone:             (data.phone             || '').trim(),
    country:           data.country            || 'PT',
    city:              (data.city              || '').trim(),
    timezone:          data.timezone           || 'Europe/Lisbon',
    preferredLanguage: data.preferredLanguage  || 'pt',

    // Atribución desde localStorage (at-attribution.js)
    utmSource:         data.utmSource          || '',
    utmMedium:         data.utmMedium          || '',
    utmCampaign:       data.utmCampaign        || '',
    firstTouchChannel: data.firstTouchChannel  || 'direct',
    l1Id:              data.l1Id               || null,
    l2Id:              data.l2Id               || null,
    l3Id:              data.l3Id               || null,
    l1Slug:            data.l1Slug             || null,

    // Gestor asignado y autoría
    assignedTo:  data.assignedTo || creatorUid,
    createdBy:   creatorUid,

    // Pipeline inicial
    currentStage:   'lead_captured',
    stageUpdatedAt: null,    // contacts-service inyecta serverTimestamp()

    // Metadata
    createdAt: null,         // contacts-service inyecta serverTimestamp()
    updatedAt: null,         // contacts-service inyecta serverTimestamp()
    isActive: true,

    // Tokens de búsqueda derivados
    _searchTokens: generateSearchTokens(firstName, lastName, data.email, data.phone),

    // Anidados — merge de defaults + data
    investorProfile: Object.assign(
      JSON.parse(JSON.stringify(CONTACT_SCHEMA.investorProfile)),
      data.investorProfile || {}
    ),
    compliance: Object.assign(
      JSON.parse(JSON.stringify(CONTACT_SCHEMA.compliance)),
      data.compliance || {}
    ),
  });

  return payload;
}

// ============================================================
// [SEC-07] Export al namespace window.__CPII__
// ============================================================

window.__CPII__.schema = {
  CONTACT_SCHEMA,
  PIPELINE_STAGES,
  generateSlug,
  generateSearchTokens,
  createContactPayload,
};

console.info('[contacts-schema v1.0.0] Schema canónico registrado en window.__CPII__.schema');
