---
METAFAC_VER: 0.6.0
GEO_LOC: 01_PRODUCTION/CPII_crm_v1.1/RECOVERY_MAP.md
PROJECT: CPII_crm_v1.1
AFFINITY_GROUP: ARQUITECTURA
CONTENT_CAT: RECOVERY_LOG
PATTERN_TYPE: SYSTEM_TOPOLOGY
MUTATION_POLICY: APPEND_ONLY
PROTECTED_HEADER: TRUE
PHASE: 02.2 (Materialización Data Layer + Schema)
STATUS: ACTIVE
TIMESTAMP: 2026-05-17
---

# 🗺️ RECOVERY_MAP — CPII_crm_v1.1

## ⚡ [ESTADO DE LA PLANTA - FASE 02.1 CIERRE]
El polígono ha completado la **Fase 02.1: Reingeniería de Interfaces & TrinityLayout**. El chasis visual y el motor de acceso están operativos y desplegados en infraestructura de prototipado.

- **Hitos Alcanzados:**
    - **TrinityLayout**: Adaptado de legacy, suturado de 5 fracturas críticas (Namespace, Registry, Scripts).
    - **AuthGate Engine**: Saneado (Zero Trust, removal of KYC overrides).
    - **Infraestructura**: Repositorio Git inicializado y conectado a GitHub/Vercel (cpii-crm-v1-1.vercel.app).
    - **Seguridad**: `.gitignore` activo protegiendo `env.local.js`.

---

## 🌳 [ÁRBOL DE SSOT ACTIVO]
Rutas validadas y bajo custodia doctrinal:
- `index.html` -> Chasis Trinity v3.0.0 (Router v3.0.0 con auto-boot).
- `admin-gate.html` -> Puerta de acceso Born Locked (ATOM-04).
- `firestore.rules` -> Reglas de seguridad belongsToTenant() (ATOM-07).
- `core/at-bootstrapper.js` -> Inicializador de Namespace `window.__CPII__`.
- `features/at-admin-gate.js` -> Lógica de sesión con Claims reales.
- `03_INBOX/CPII_legacy_logs/tactical_logs/CPII_v1.1/fase_02_development/` -> Trazabilidad táctica.

---

## 🎯 [ESQUEMA MAESTRO - DATA LAYER & PIPELINE]
*Definición del modelo objetivo para la Fase 02.2.*
- **SSoT de Datos:** Cloud Firestore en modo nativo. Aislamiento criptográfico vía `tenant_id`.
- **Append-Only History:** Subcolección `contacts/{id}/events` para trazabilidad inmutable de cambios de fase.
- **Pipeline 6 Fases:** `lead_captured` → `contact_initiated` → `qualified` → `presentation` → `kyc_approved` → `active_investor`.
- **Unicidad de Slugs:** Colección centinela `_slug_reservations` para transacciones de registro de referidores.
- **Hybrid KYC:** Reconocimiento de KYC externo (Plataforma ajena) mediante campos opacos (`kycProvider`).

---

## 🏹 [VECTOR DE ACCIÓN - FASE 02.2]

### T-02.21: Forja de Schemas (Antigravity)
- **Acción:** Materializar `core/contacts-schema.js`.
- **Contenido:** Definición de `CONTACT_SCHEMA` y `PIPELINE_STAGES`.
- **Doctrina:** R39 (Pozos de Sabiduría) para no ignorar el trabajo previo en arqueología.

### T-02.22: Motor CRUD (Bulldozer)
- **Acción:** Materializar `core/contacts-service.js`.
- **Contenido:** Implementación de `createContact`, `updateStage`, y `getLineage`.
- **Requisito:** Inyección de `window.__CPII__.session` para validar permisos.

### T-02.23: Infraestructura de Datos
- **Acción:** Crear `firestore.indexes.json` y desplegar reglas pendientes.
- **Bloqueante:** Acción manual del Director para `firebase deploy`.

---
*Protocolo de Parada Táctica: Sesión 02.1 cerrada. Fase 02.2 activa. Foco: Materialización Data Layer.*
