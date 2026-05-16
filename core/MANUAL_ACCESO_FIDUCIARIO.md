# Protocolo de Integración y Custodia Patrimonial

## Prefacio: Filosofía Fiduciaria y de Compliance

En Lux Lusitana no gestionamos transacciones; gestionamos relaciones patrimoniales. Nuestra arquitectura operativa ha sido diseñada bajo estrictos estándares institucionales que garantizan la confidencialidad, la seguridad jurídica y la alineación estratégica de cada inversor con nuestros objetivos de rentabilidad y riesgo. 

En un entorno regulado e internacional, el acceso a la información sensible no es inmediato, sino progresivo. La plataforma despliega sus capacidades operativas de forma escalonada, asegurando que cada miembro acceda únicamente a los módulos para los cuales ha demostrado la cualificación, el cumplimiento normativo y el volumen de tracción adecuados. Este marco garantiza la integridad del ecosistema y protege tanto el capital como la red de todos nuestros miembros.

---

## Mandato Fiduciario: Multitenencia Lógica (Pool Compartido)
Para optimizar el escalado y la eficiencia bajo la **Economía de Guerra (R5)**, la factoría adopta el estándar **"Shared Pool / Independent Backpack"**:

1.  **Pool Compartido**: Los proyectos en fase embrionaria conviven en una infraestructura Firebase/GCP unificada para optimizar recursos.
2.  **Identidad Unívoca**: Es obligatorio el uso de un `tenant_id` inyectado en los Custom Claims del JWT desde el primer Sign-in.
3.  **Mochila Independiente**: La independencia de datos es **lógica**, no física. Todo documento histórico o transaccional debe portar el atributo de pertenencia al proyecto.
4.  **Inmutabilidad de la Ley**: Este modelo es la norma predeterminada para cualquier nuevo proyecto que entre en la factoría.

---

## Fase 1 (Día 0) - Acceso Inicial

El aterrizaje en el ecosistema está diseñado para ofrecer visión general e iniciar la integración estratégica del miembro.

En esta fase de habilitación temprana, la interfaz expone de forma inmediata:
*   **Posición Global**: Ofrece la macro-perspectiva de su ecosistema.
*   **Mi Red**: Permite visualizar la estructura inicial de sus conexiones.
*   **Academy**: Se activa el acceso al primer módulo.

Las áreas de alto impacto patrimonial permanecerán temporalmente en situación de **Custody Hold** (Custodia Fiduciaria). La plataforma mostrará de forma transparente una Ruta hacia el Desbloqueo, indicando claramente qué requerimientos restan para habilitar cada privilegio.

---

## Fase 2 - Habilitación de Cartera

El acceso a información financiera sensible, balances y documentación de rentabilidad está estrictamente sujeto a lo que denominamos un **Privilegio por Cumplimiento (Compliance-Based Privilege)**. 

Para que el sistema levante el Custody Hold sobre módulos críticos, el inversor debe completar su consolidación dentro del marco normativo y operativo de la firma:
*   **Aprobación KYC (Know Your Customer):** Imprescindible en el marco de nuestra política AML (Anti-Blanqueo de Capitales) para garantizar el origen lícito de los fondos y proteger la integridad legal del club.
*   **Formación Operativa:** Consumo y asimilación del 100% del programa Academy, certificando que el inversor comprende nuestra filosofía de riesgo y los vehículos de inversión de Lux Lusitana.

Una vez que el motor de validación confirme ambos hitos, la Fase de Habilitación se completará de forma automática, desplegando acceso total a **Mi Cartera** y al **Historial y Documentos**.

---

## Fase 3 - Habilitación Gerencial

El módulo de **Gestión de Relaciones** trasciende la mera administración de capital propio; implica la responsabilidad de gestionar, analizar e impulsar capital e inversores de terceros dentro del ecosistema de Lux Lusitana. 

Por su relevancia e impacto institucional, la habilitación de este módulo no está sujeta a cumplimiento pasivo, sino a tracción demostrada. Para acceder a este estatus gerencial o de Staff, se requerirá:
*   Un **Assets Under Management (AUM)** validado, es decir, alcanzar un volumen de negocio y referenciación específico en su red.
*   Alternativamente, una designación directa y discrecional ratificada por el **Comité de Dirección** para socios estratégicos clave.

Solo cuando se consiga la autorización directiva o el umbral de AUM pertinente, la plataforma completará esta última ruta de habilitación, convirtiendo al inversor en un gestor activo del tejido patrimonial del club.
