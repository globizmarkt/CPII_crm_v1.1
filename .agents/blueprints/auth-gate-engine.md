---
METAFAC_VER: 0.4.0
GEO_LOC: 01_PRODUCTION/CPII_crm_v1.1/.agents/blueprints/auth-gate-engine.md
TYPE: SKELETON CANDIDATE
NAME: AuthGate Engine
STATUS: DRAFT (AWAITING DEMIURGO VALIDATION)
---

# 🛡️ AUTH-GATE ENGINE (Candidato a Skeleton)

## 1. IDENTIDAD Y PROPÓSITO
El **AuthGate Engine** es un componente agnóstico de acceso. Su misión es separar radicalmente la interfaz de entrada (DOM) de la capa de autorización (Firebase Auth + Custom Claims), permitiendo que cualquier webapp restrinja el acceso a sus datos basándose en el tenant y los roles del usuario.

## 2. NÚCLEO ARQUITECTÓNICO
La pieza se compone de tres elementos inseparables:
1. `golden-gate.html`: La Interfaz Zero Trust (nace bloqueada por `data-gate-lock`).
2. `at-admin-gate.js`: El motor OAuth que se comunica con Firebase para obtener el JWT.
3. `passport-engine.js`: El árbitro que lee los Custom Claims y decide si levanta el `data-gate-lock`.

## 3. AGNÓSTICO POR DISEÑO (Criterios de Éxito)
Esta pieza solo es exportable a otros proyectos si cumple:
- [ ] El `tenant_id` no está hardcodeado, sino inyectado dinámicamente desde el DOM o el archivo de configuración.
- [ ] El array `roles[]` y la `onboarding_phase` son evaluados genéricamente, sin atarlos a la jerarquía específica de CPII.
- [ ] La función `_buildSession()` llama explícitamente a `getIdTokenResult()` para poblar la memoria con los Custom Claims.
- [ ] **Prohibido el Bypass:** La función "KYC Override" (`cpii:kyc-dismissed`) ha sido extirpada para producción.

## 4. GLOSARIO DE TRIGGERS (Experiencia de Forja)
Este glosario documenta los "agujeros de gusano" encontrados durante la ingeniería inversa, para que el próximo proyecto que importe esta pieza no repita el dolor:

- **[TRIGGER: SESIÓN VACÍA]** 
  *Síntoma:* El usuario hace login con Google, la UI se queda congelada.
  *Causa:* `at-admin-gate.js` construyó la sesión sin pedir los Custom Claims.
  *Vacuna:* Exigir siempre la extracción del JWT completo antes de emitir el evento `passport:staff-authenticated`.

- **[TRIGGER: TENANT MISMATCH INVISIBLE]**
  *Síntoma:* El JWT viene con claims correctos, pero la puerta no abre.
  *Causa:* El `data-tenant-id` del contenedor HTML no coincide con el `tenant_id` en Firebase. (Ocurrió con la herencia de `cpii_lux_v1.0`).
  *Vacuna:* Validar siempre el origen del tenant en tiempo de compilación.

- **[TRIGGER: DEUDA DOCTRINAL DE OAUTH]**
  *Síntoma:* Implementación ciega de múltiples proveedores (Google, Apple, Microsoft, LinkedIn).
  *Causa:* Falsa sensación de escalabilidad. LinkedIn OAuth exige scopes y retención de datos distintos.
  *Vacuna:* Aplicar Doctrina Coste Cero: mantener solo Google/Apple hasta justificar comercialmente un tercero.

---
**DEPENDENCIAS SSoT:**
- Firebase Auth + Admin SDK
- Objeto de sesión aislado: `window.__[PROJECT]__`
