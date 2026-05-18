---
METAFAC_VER: 0.6.0
GEO_LOC: 01_PRODUCTION/CPII_crm_v1.1/RECOVERY_MAP_CPII_2026-05-17.md
PROJECT: CPII_v1.1 + CPII_crm_v1.1
AFFINITY_GROUP: ARQUITECTURA
CONTENT_CAT: RECOVERY_MAP
PATTERN_TYPE: SYSTEM_TOPOLOGY
MUTATION_POLICY: APPEND_ONLY
PROTECTED_HEADER: TRUE
PHASE: 02.2 — Arqueología Física Completa
STATUS: SNAPSHOT — 2026-05-17
PRODUCED_BY: Claude Code (Sentinel) — VIBE-CPII-REBORN-01.3
---

# RECOVERY MAP — CPII COMPLETO
## Snapshot físico: CPII_v1.1 (landing) + CPII_crm_v1.1 (CRM)
### 2026-05-17 · Generado en sesión VIBE-CPII-REBORN-01.3

> **Propósito:** Consolidar en un único documento el estado físico real de ambos proyectos.
> Base para arqueología profunda. Snapshot puntual — no es un documento vivo.
> Para estado vivo: ver `00_master_tasks.md` en `tactical_logs/CPII_v1.1/`.

---

## § 1 — ÁRBOL FÍSICO: CPII_v1.1 (Landing)
*Ruta: `C:\BreederHub\01_PRODUCTION\CPII_v1.1\`*
*Vercel: `cpii-v1-1.vercel.app` · GitHub: `globizmarkt/cpii_v1.1`*

```
CPII_v1.1/
│
├── index.html                        ← Landing principal. v2.0.0 · 2026-02-17
├── access-form.html                  ← Formulario de acceso + OAuth. v1.4.1 · 2026-03-01
├── onboarding.html                   ← Stepper educativo onboarding. Sin versión declarada.
├── simulator.html                    ← Simulador de riqueza exponencial. v2.1.1 · 2026-02-24
├── equipo-comercial.html             ← Presentación equipo comercial. v1.0.0 · 2026-02-19
├── referrals.html                    ← Red de Revenue Share. v2.1.0 · 2026-04-19
├── webinars.html                     ← Comités de inversión / Deal Flow. v2.1.0 · 2026-04-19
├── privacy.html                      ← Política de privacidad. Sin versión. · 2026-04-19
├── terms.html                        ← Términos y condiciones. Sin versión. · 2026-04-19
│
├── i18n.js                           ← Motor i18n landing. v2.9.0 · 2026-03-01 [157KB — MONOLITO]
├── update-i18n.js                    ← Script Node.js para actualización i18n. Sin cabecera doctrinal.
├── input.css                         ← Entry Tailwind (@tailwind base/components). 60 bytes.
├── tailwind.config.js                ← Config Tailwind. Namespace lux.* · 2026-04-18
├── firebase.json                     ← Config Firebase Hosting + Firestore.
├── firestore.rules                   ← Reglas Firestore v1.0 (landing). belongsToTenant() básico.
├── package.json                      ← Deps: Tailwind CLI. · 2026-03-06
├── README.md                         ← Stub. Sin contenido relevante. · 2026-02-17
├── RECOVERY_MAP.md                   ← Recovery Map anterior (Fase 01). · 2026-05-17
├── task.md                           ← Roadmap auditoría forense Fase 1+2. · 2026-04-20
│
├── core/
│   ├── handoff-emitter.js            ← Persistencia cross-domain (locale, referral, UTM). v1.0.0 · 2026-04-19
│   └── onboarding-controller.js      ← Controlador Stepper onboarding. v1.1.0 · 2026-04-19
│
├── css/
│   ├── design-system.css             ← Tokens color/tipografía/componentes. v1.0.0 · 2026-04-18
│   └── tailwind.css                  ← Output compilado Tailwind. 47KB. · 2026-04-18
│
├── functions/
│   ├── index.js                      ← Cloud Functions Firebase v2. Sin cabecera. Usa Secrets: TELEGRAM_TOKEN, CHAT_ID, MASTER_KEY, VERCEL_CRM_URL.
│   └── package.json                  ← Deps: axios, firebase-functions.
│
├── js/
│   └── design-system.js              ← [INVESTIGAR] Script JS design system. 710B. Sin cabecera doctrinal.
│
├── utils/
│   └── tracking.js                   ← Captura ?ref= → localStorage/sessionStorage. Sin cabecera doctrinal.
│
├── .agents/
│   ├── DOCTRINA.md                   ← Leyes de la planta CPII (Ley I→V). · 2026-04-17
│   ├── auto-check/
│   │   └── acceso a drive.md         ← Nota de acceso a Google Drive. · 2026-04-15
│   ├── base de datos/
│   │   ├── ingesta_2026-04-15_full agency administracion CPII.md  ← Datos agentes. 156KB.
│   │   └── ingesta_INDEX_2026-04-15.md                            ← Índice de ingesta.
│   ├── bibliotecario/
│   │   ├── tiket_CPII-CRM-HOTFIX-20260417-003.md  ← Ticket hotfix.
│   │   └── tiket_CPII-CRM-HOTFIX-20260419-001.md  ← Ticket hotfix.
│   ├── inbox/                        ← [VACÍO]
│   └── workshop/
│       ├── CANONICAL_FOOTER.html     ← Footer canónico HTML. · 2026-04-19
│       └── CANONICAL_HEADER.html     ← Header canónico HTML. · 2026-04-19
│
├── backup_pre_sutura/                ← Backup antes de sutura (no en producción)
│   ├── access-form.html
│   └── index.js
│
└── dogfood data/                     ← Investigación / datos internos (no en producción)
    ├── BR-gemini-VIBE-CPII-01..05.md ← Sesiones Gemini VibeCoding
    ├── Claude outputs/               ← Auditorías, copywriting, imágenes de flujo
    └── CPII_v0.0/                    ← Versión anterior archivada
```

---

## § 2 — ÁRBOL FÍSICO: CPII_crm_v1.1 (CRM)
*Ruta: `C:\BreederHub\01_PRODUCTION\CPII_crm_v1.1\`*
*Vercel: `cpii-crm-v1-1.vercel.app` · GitHub: `globizmarkt/CPII_crm_v1.1`*

```
CPII_crm_v1.1/
│
├── index.html                        ← TrinityLayout shell CRM. v1.5.0 · 2026-03-14 [última sutura 2026-05-17]
├── admin-gate.html                   ← Auth Gate Born Locked. Sin versión. · 2026-05-14
├── firestore.rules                   ← Reglas Firestore CRM. belongsToTenant()+isStaff(). · 2026-05-14 [PENDIENTE DEPLOY]
├── .gitignore                        ← Excluye core/env.local.js. · 2026-05-16
├── RECOVERY_MAP.md                   ← Recovery Map Fase 02.1 (anterior a este). · 2026-05-17
├── RECOVERY_MAP_CPII_2026-05-17.md   ← ESTE ARCHIVO
│
├── core/
│   ├── at-bootstrapper.js            ← Inicializador namespace window.__CPII__. v1.0.0 · 2026-03-19
│   ├── at-resource-registry.js       ← Registro gadgets Camino A (fetch HTML). Sin versión. · 2026-05-16 [Sutura F2]
│   ├── at-search-engine.js           ← Motor búsqueda omnibox. Sin cabecera doctrinal. · 2026-03-13
│   ├── at-tab-manager.js             ← Gestor tabs + gadgets. v3.6.0 · 2026-03-14
│   ├── contacts-schema.js            ← Schema canónico CONTACT_SCHEMA + PIPELINE_STAGES. v1.0.0 · 2026-05-17 [NUEVO]
│   ├── env.local.js                  ← Credenciales Firebase (excluido de git). Sin cabecera.
│   ├── firebase-config.js            ← Inicializador singleton Firebase SDK. Sin versión. · 2026-03-28
│   ├── i18n.js                       ← Motor i18n CRM. v2.2 · 2026-03-14 [última actualización 2026-05-17]
│   ├── passport-engine.js            ← Motor autorización O(1). v2.1.2 · 2026-03-19 [_syncGatekeeperUI añadido 2026-05-17]
│   ├── MANUAL_ACCESO_FIDUCIARIO.md   ← Protocolo custodia patrimonial / acceso. · 2026-03-19 [ref. "Lux Lusitana" — legacy]
│   ├── PROTOCOL_CORE_ARCHITECT.md    ← Protocolo rol Bibliotecario. · 2026-03-15 [ref. "cpii_crm_v0.1" — legacy]
│   └── README_COLLAB.txt             ← Nota vinculación Sprint Genesis AIP. · 2026-03-17
│
├── css/
│   ├── theme.css                     ← Tokens diseño Médula v2.6.1. · 2026-04-11 [28 tokens añadidos 2026-05-17]
│   └── tab-manager.css               ← Estilos Órbita 2 (tabs, workspace). v1.1.0 · 2026-03-14
│
├── features/
│   ├── at-admin-gate.js              ← OAuth Google+Apple + gestión sesión. v1.0.0 · 2026-03-22 [LuxI18n→__CPII__ reparado]
│   └── at-attribution.js            ← Captura UTM/ref → localStorage. v1.0.0 · 2026-03-23
│
├── gadgets/                          ← Gadgets standalone (fetch HTML · Camino A). Todos: v2.5 · 2026-03-10
│   ├── cpii_agentmetrics.at_agent_v2.5_refactored/
│   │   ├── code.html                 ← AgentMetrics dashboard. lang="en". Sin cabecera doctrinal.
│   │   └── screen.png
│   ├── cpii_autofinancingclock.wd_clock_v2.5_refactored/
│   │   ├── code.html                 ← Reloj autofinanciamiento. lang="pt". Sin cabecera doctrinal.
│   │   └── screen.png
│   ├── cpii_clubpulse.gd_pulse_v2.5_refactored_final/
│   │   ├── code.html                 ← Club Pulse / KPIs. SIN DOCTYPE. Tokens hex directos en :root. [POLÍGONO R3]
│   │   └── screen.png
│   ├── cpii_compliancemessenger.wd_messenger_v2.5_refactored/
│   │   ├── code.html                 ← Mensajería compliance. lang="pt". Sin cabecera doctrinal.
│   │   └── screen.png
│   ├── cpii_dealroom.at_dealroom_v2.5_featured_deal/
│   │   ├── code.html                 ← Deal Room. lang="pt". Sin cabecera doctrinal.
│   │   └── screen.png
│   └── cpii_prescriptortree.gd_network_v2.5_refactored/
│       ├── code.html                 ← Red prescriptores. lang="pt". Sin cabecera doctrinal.
│       └── screen.png
│
└── .agents/
    └── blueprints/
        └── auth-gate-engine.md       ← Candidato Skeleton AuthGate. METAFAC 0.4.0 [POLÍGONO — actual: 0.6.0]. STATUS: DRAFT.
```

---

## § 3 — INVENTARIO DE ARCHIVOS CON VERSIÓN Y PROPÓSITO

### CPII_v1.1 — Landing

| Archivo | Versión | Fecha | Propósito | Cabecera |
|---|---|---|---|---|
| `index.html` | 2.0.0 | 2026-02-17 | Landing principal. i18n 4 idiomas. SEO. | ✅ Canónica |
| `access-form.html` | 1.4.1 | 2026-03-01 | Formulario captación leads + OAuth Firebase | ✅ Canónica |
| `onboarding.html` | — | — | Stepper educativo miembros | ⚠️ Sin cabecera |
| `simulator.html` | 2.1.1 | 2026-02-24 | Simulador riqueza exponencial + Revenue Share | ✅ Canónica |
| `equipo-comercial.html` | 1.0.0 | 2026-02-19 | Presentación equipo comercial | ✅ Canónica |
| `referrals.html` | 2.1.0 | 2026-04-19 | Red de Revenue Share del usuario | ✅ Canónica |
| `webinars.html` | 2.1.0 | 2026-04-19 | Comités inversión + archivo sesiones | ✅ Canónica |
| `privacy.html` | — | 2026-04-19 | Política de privacidad | ⚠️ Sin versión |
| `terms.html` | — | 2026-04-19 | Términos y condiciones | ⚠️ Sin versión |
| `i18n.js` | 2.9.0 | 2026-03-01 | Motor i18n landing (157KB — **MONOLITO**) | ✅ Canónica |
| `update-i18n.js` | — | 2026-04-19 | Script Node.js actualización i18n | ⚠️ Sin cabecera |
| `tailwind.config.js` | — | 2026-04-18 | Config Tailwind, namespace `lux.*` | ⚠️ Sin cabecera |
| `firebase.json` | — | 2026-04-19 | Firebase Hosting + Firestore config | — |
| `firestore.rules` | — | 2026-04-19 | Reglas Firestore landing (versión simple) | ⚠️ Sin cabecera |
| `functions/index.js` | — | 2026-05-14 | Cloud Functions: webhook Telegram + Sheets | ⚠️ Sin cabecera doctrinal |
| `core/handoff-emitter.js` | 1.0.0 | 2026-04-19 | Persistencia cross-domain (locale, UTM, ref) | ✅ Canónica |
| `core/onboarding-controller.js` | 1.1.0 | 2026-04-19 | Stepper interactivo onboarding | ✅ Canónica |
| `css/design-system.css` | 1.0.0 | 2026-04-18 | Tokens color/tipografía/componentes | ✅ Canónica |
| `css/tailwind.css` | — | 2026-04-18 | Output compilado Tailwind (47KB) | — |
| `utils/tracking.js` | — | 2026-03-05 | Captura ?ref= → localStorage/sessionStorage | ⚠️ Sin cabecera |
| `js/design-system.js` | — | 2026-03-06 | [INVESTIGAR] Script design system (710B) | ⚠️ Sin cabecera |
| `.agents/DOCTRINA.md` | — | 2026-04-17 | Leyes de la planta CPII (Ley I→V) | — |

### CPII_crm_v1.1 — CRM

| Archivo | Versión | Fecha | Propósito | Cabecera |
|---|---|---|---|---|
| `index.html` | 1.5.0 | 2026-03-14 | TrinityLayout shell CRM. Router v3.0.0 | ✅ Canónica |
| `admin-gate.html` | — | 2026-05-14 | Auth Gate Born Locked. ATOM-04. | ⚠️ Sin versión |
| `firestore.rules` | — | 2026-05-14 | Seguridad Firestore. ATOM-07. Pendiente deploy. | ✅ Canónica |
| `core/at-bootstrapper.js` | 1.0.0 | 2026-03-19 | Inicializador namespace `window.__CPII__` | ✅ Canónica |
| `core/at-resource-registry.js` | — | 2026-05-16 | Registro gadgets. Camino A (fetch HTML). | ⚠️ Sin versión |
| `core/at-search-engine.js` | — | 2026-03-13 | Motor búsqueda omnibox (local) | ❌ Sin cabecera doctrinal |
| `core/at-tab-manager.js` | 3.6.0 | 2026-03-14 | Gestor tabs + gadgets + omnibox | ✅ Canónica |
| `core/contacts-schema.js` | 1.0.0 | 2026-05-17 | Schema canónico + PIPELINE_STAGES + helpers | ✅ Canónica |
| `core/env.local.js` | — | 2026-03-28 | Credenciales Firebase (excluido de git) | ⚠️ Intencional |
| `core/firebase-config.js` | — | 2026-03-28 | Singleton Firebase SDK | ✅ Canónica (sin versión explícita) |
| `core/i18n.js` | 2.2 | 2026-03-14 | Motor i18n CRM. 4 idiomas. | ✅ Canónica |
| `core/passport-engine.js` | 2.1.2 | 2026-03-19 | Motor autorización O(1). Claims. | ✅ Canónica |
| `core/MANUAL_ACCESO_FIDUCIARIO.md` | — | 2026-03-19 | Protocolo acceso fiduciario. Ref "Lux Lusitana" | ⚠️ Nombre legacy |
| `core/PROTOCOL_CORE_ARCHITECT.md` | — | 2026-03-15 | Protocolo El Bibliotecario | ⚠️ Ref `cpii_crm_v0.1` legacy |
| `css/theme.css` | 2.6.1 | 2026-04-11 | Tokens diseño Médula | ✅ Canónica |
| `css/tab-manager.css` | 1.1.0 | 2026-03-14 | Estilos Órbita 2 (tabs, workspace) | ✅ Canónica |
| `features/at-admin-gate.js` | 1.0.0 | 2026-03-22 | OAuth Google+Apple. Gestión sesión. | ✅ Canónica |
| `features/at-attribution.js` | 1.0.0 | 2026-03-23 | Captura UTM/ref → localStorage | ✅ Canónica |
| `gadgets/*/code.html` | 2.5 | 2026-03-10 | 6 gadgets standalone (ver § 4) | ❌ Sin cabecera doctrinal |
| `.agents/blueprints/auth-gate-engine.md` | — | 2026-05-14 | Candidato Skeleton AuthGate | ⚠️ METAFAC 0.4.0 desactualizado |

---

## § 4 — ARCHIVOS SIN CABECERA DOCTRINAL
### Candidatos a deuda técnica documental

> **Doctrina:** Todo archivo activo debe tener cabecera de control con ARCHIVO, VERSIÓN, FECHA, PROPÓSITO.
> Los marcados ❌ carecen de ella completamente. Los ⚠️ tienen déficits parciales.

#### CPII_v1.1 (Landing)

| Archivo | Déficit | Impacto | Prioridad |
|---|---|---|---|
| `onboarding.html` | Sin versión, sin propósito declarado | Medio — archivo activo en producción | 🟡 |
| `utils/tracking.js` | Sin cabecera. Primera versión sin autoría | Bajo — funciona, solo documentación | 🟢 |
| `update-i18n.js` | Sin cabecera. Script Node.js utilitario | Bajo — no es código de producción | 🟢 |
| `js/design-system.js` | Sin cabecera. Rol desconocido (710B) | **Alto** — ¿qué hace? ¿se usa? | 🔴 INVESTIGAR |
| `functions/index.js` | Sin cabecera doctrinal (tiene imports) | Medio — Cloud Function activa | 🟡 |
| `privacy.html` / `terms.html` | Sin versión | Bajo — contenido estático legal | 🟢 |
| `firestore.rules` | Sin cabecera estilo METAFAC | Bajo | 🟢 |

#### CPII_crm_v1.1 (CRM)

| Archivo | Déficit | Impacto | Prioridad |
|---|---|---|---|
| `core/at-search-engine.js` | Sin cabecera. Arranca directamente como IIFE | Medio — motor activo en producción | 🟡 |
| `core/at-resource-registry.js` | Sin versión formal | Bajo — sutura reciente sin versionar | 🟡 |
| `admin-gate.html` | Sin versión en cabecera | Bajo | 🟢 |
| `gadgets/cpii_agentmetrics/code.html` | Sin cabecera doctrinal. `lang="en"` | Medio — se carga en TrinityLayout | 🟡 |
| `gadgets/cpii_autofinancingclock/code.html` | Sin cabecera doctrinal | Medio | 🟡 |
| `gadgets/cpii_clubpulse/code.html` | **SIN DOCTYPE** + tokens hex en :root (viola R3) | **Alto** — puede romper en browsers strict | 🔴 |
| `gadgets/cpii_compliancemessenger/code.html` | Sin cabecera doctrinal | Medio | 🟡 |
| `gadgets/cpii_dealroom/code.html` | Sin cabecera doctrinal | Medio | 🟡 |
| `gadgets/cpii_prescriptortree/code.html` | Sin cabecera doctrinal | Medio | 🟡 |
| `.agents/blueprints/auth-gate-engine.md` | METAFAC_VER 0.4.0 (actual: 0.6.0). Ref `cpii_lux_v1.0` | Bajo — no runtime | 🟢 |
| `core/PROTOCOL_CORE_ARCHITECT.md` | Ref `CPII_crm_v0.1` (legacy) en cabecera | Bajo — no runtime | 🟢 |
| `core/MANUAL_ACCESO_FIDUCIARIO.md` | Ref "Lux Lusitana" en lugar de "CPII" | Bajo — contenido, no runtime | 🟢 |

---

## § 5 — ARCHIVOS REFERENCIADOS PERO NO ENCONTRADOS EN DISCO
### Gap entre documentación y realidad física

> Fuente de referencias: `12_blueprint_firebase_for_crm.md §3.2`, `RECOVERY_MAP.md`, `00_master_tasks.md §3`

#### CPII_crm_v1.1 — MISSING (construcción pendiente)

| Archivo | Referenciado en | Bloqueante de |
|---|---|---|
| `core/contacts-service.js` | Blueprint §3.2, RECOVERY_MAP.md T-02.22 | Sin este, no hay escritura a Firestore |
| `features/at-pipeline.js` | Blueprint §3.2 | UI movimiento entre fases no existe |
| `features/at-dashboard.js` | Blueprint §3.2 | Dashboard operacional no funciona |
| `features/at-notifications.js` | Blueprint §3.2 | Trigger webhook GAS no existe |
| `dashboard.html` | Blueprint §3.2 | — |
| `firestore.indexes.json` | Blueprint §3.3 | Queries compuestas fallan sin índice |
| `gas/webhook.gs` | Blueprint §2.5 | Sync Firestore → Sheets no existe |
| `gas/telegram.gs` | Blueprint §2.5 | Alertas Telegram no existen |
| `gas/setup-triggers.gs` | Blueprint §2.5 | Triggers GAS no configurados |

#### CPII_v1.1 (Landing) — MISSING o MOVIDOS

| Archivo | Situación | Notas |
|---|---|---|
| `at-admin-gate.js` (en raíz o features/) | No existe en CPII_v1.1 | La lógica está integrada en `access-form.html` directamente |
| `seed-design-system.css` | Mencionado en `03_tareas_fase_01.md` | Puede haber sido renombrado a `design-system.css` o eliminado en purga R3 |
| `gatekeeper.html` | Mencionado en historial git | Purgado en Fase 18.4 (confirmado en project_context) |

---

## § 6 — OBSERVACIONES DE ARQUEOLOGÍA

### OBS-01 — js/design-system.js en CPII_v1.1 (710B)
Archivo de 710 bytes sin cabecera, en directorio `js/`. Rol desconocido. Investigar antes de cualquier limpieza: puede ser un loader de design-system.css o un polyfill activo.

### OBS-02 — i18n.js CPII_v1.1 es MONOLITO (157KB)
El motor i18n de landing pesa 157KB y tiene 2.9.0 versiones. El de CRM pesa 42KB (v2.2) y es modular. Son arquitecturas diferentes. No mezclar.

### OBS-03 — gadgets/cpii_clubpulse sin DOCTYPE
Es el único gadget sin `<!DOCTYPE html>`. Además tiene tokens hex en `:root` directamente (viola R3). Es el gadget más arriesgado para producción.

### OBS-04 — functions/index.js en CPII_v1.1 es la Cloud Function activa
Contiene los 4 secretos (TELEGRAM_TOKEN, CHAT_ID, MASTER_KEY, VERCEL_CRM_URL). Es el proxy Telegram activo para la landing v1.1. El CRM v1.1 aún no tiene su equivalente (`gas/telegram.gs` missing).

### OBS-05 — Gadgets son código legacy (2026-03-10)
Los 6 gadgets tienen la misma fecha: 2026-03-10. Son anteriores a la arquitectura actual. No tienen conexión con `window.__CPII__` ni con el motor i18n del CRM. Son islas autónomas.

### OBS-06 — at-search-engine.js sin cabecera doctrinal
Arranca directamente como IIFE sin ninguna declaración. Funciona pero es deuda menor.

### OBS-07 — PROTOCOL_CORE_ARCHITECT.md referencia cpii_crm_v0.1
Documento vivo en core/ que dice "Si el proyecto es CPII_crm_v0.1, asumir Rol de El Bibliotecario". Nombre de proyecto obsoleto. No bloquea nada en runtime pero confunde a agentes nuevos.

---

*Recovery Map generado: 2026-05-17 · Claude Code (Sentinel) — VIBE-CPII-REBORN-01.3*
*Método: tree + Get-ChildItem + lectura de cabeceras (primeras 10-12 líneas por archivo)*
*Cobertura: 100% de archivos .js/.html/.css/.md/.json/.rules en ambos proyectos*
*Exclusiones: node_modules/, backup_pre_sutura/, dogfood data/ (no son producción)*
