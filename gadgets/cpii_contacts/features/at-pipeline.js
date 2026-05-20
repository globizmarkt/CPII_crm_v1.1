// ============================================================
// ARCHIVO  : features/at-pipeline.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-05-20
// PROPÓSITO: Controlador ES Module del Pipeline Kanban/List.
//            Conecta con window.__CPII__.ContactsService (GA-01).
//            Implementa Drag & Drop, vista dual, drawer dinámico.
//            Doctrina: R2 (Light DOM) | R4 (i18n) | R18 (ES Modules) | R20 (Event-Driven) | R27 (Fusión Inmutable).
// ============================================================

'use strict';

// --- Configuración de stages (congelada, R27) ---
const STAGE_CONFIG = Object.freeze({
  lead_captured:     { i18nKey: 'pipeline.stage_captured',     colorToken: 'primary',      statusKey: 'pipeline.status_standard' },
  contact_initiated: { i18nKey: 'pipeline.stage_contact',      colorToken: 'tertiary',     statusKey: 'pipeline.status_pending' },
  kyc_pending:       { i18nKey: 'pipeline.stage_kyc',          colorToken: 'error',        statusKey: 'pipeline.status_flagged' },
  active_investor:   { i18nKey: 'pipeline.stage_active',       colorToken: 'state-success',  statusKey: 'pipeline.status_verified' },
});

// --- Schema de campos para drawer (congelado, R27) ---
const DRAWER_FIELDS = Object.freeze([
  { key: 'email',    i18nKey: 'pipeline.drawer_email',    icon: 'mail' },
  { key: 'phone',    i18nKey: 'pipeline.drawer_phone',    icon: 'phone' },
  { key: 'location', i18nKey: 'pipeline.drawer_location', icon: 'location_on' },
  { key: 'companyName', i18nKey: 'pipeline.drawer_company', icon: 'corporate_fare' },
]);

/**
 * PipelineController — Orquesta la vista Kanban/List del pipeline de contactos.
 * @class
 * @implements {EventTarget} via document.dispatchEvent (R20)
 */
export class PipelineController {
  /**
   * @param {Object} config
   * @param {string} config.containerId — ID del contenedor de columnas
   * @param {string} config.drawerId — ID del side drawer
   * @param {string} config.viewToggleId — ID del grupo de botones Kanban/List
   */
  constructor(config) {
    this.container = document.getElementById(config.containerId);
    this.drawer = document.getElementById(config.drawerId);
    this.viewToggle = document.getElementById(config.viewToggleId);

    this.currentView = 'kanban'; // 'kanban' | 'list'
    this.contacts = new Map(); // Map<id, contact> para O(1)
    this.draggedCard = null;
    this.isLoading = false;

    // Dependencias externas (inyectadas, no hardcodeadas)
    this._i18n = window.__CPII__?.i18n?.t ? window.__CPII__.i18n.t.bind(window.__CPII__.i18n) : (k) => k;
    this._service = window.__CPII__?.ContactsService;
    this._actorUid = window.__CPII__?.session?.uid;
    this._claims = window.__CPII__?.session?.claims || {};

    this._init();
  }

  // ============================================================
  // [SEC-INIT] Bootstrap y validación de dependencias
  // ============================================================

  _init() {
    if (!this._service) {
      console.error('[PipelineController] CRITICAL: ContactsService no disponible. Abortando inicialización.');
      this._emit('Skeleton:Pipeline:Error', { code: 'DEP_MISSING', detail: 'ContactsService' });
      return;
    }

    if (!this.container) {
      console.error('[PipelineController] CRITICAL: Contenedor no encontrado:', this.container);
      return;
    }

    this._bindEvents();
    this._loadContacts();
    this._listenForExternalUpdates();
  }

  // ============================================================
  // [SEC-EVENTS] Event-Driven Architecture (R20, R11)
  // ============================================================

  _listenForExternalUpdates() {
    // Escuchar mutaciones desde otros gadgets o servicios
    document.addEventListener('Skeleton:Contacts:Created', (e) => {
      this._loadContacts(); // Recarga completa para consistencia
    });

    document.addEventListener('Skeleton:Contacts:Updated', (e) => {
      const contactId = e.detail?.id;
      if (contactId && this.contacts.has(contactId)) {
        this._refreshContact(contactId);
      }
    });

    document.addEventListener('Skeleton:Contacts:StageChanged', (e) => {
      const { id, previousStage, newStage } = e.detail || {};
      if (id && this.contacts.has(id)) {
        const contact = this.contacts.get(id);
        contact.currentStage = newStage;
        this._animateStageChange(id, previousStage, newStage);
        this._updateColumnCounts();
      }
    });
  }

  _emit(eventName, detail) {
    document.dispatchEvent(new CustomEvent(eventName, {
      detail: Object.freeze(detail || {}), // R27: payload inmutable
      bubbles: true,
      cancelable: false,
    }));
  }

  // ============================================================
  // [SEC-DATA] Carga de contactos desde Firestore
  // ============================================================

  async _loadContacts() {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      const result = await this._service.getAll({ limit: 100, activeOnly: true });
      const contacts = result.contacts || [];

      // Reconstruir Map para O(1) lookup
      this.contacts.clear();
      contacts.forEach(c => this.contacts.set(c.id, Object.freeze(c))); // R27

      this._render();
      this._emit('Skeleton:Pipeline:Loaded', { count: contacts.length });
    } catch (err) {
      console.error('[PipelineController] Error cargando contactos:', err);
      this._emit('Skeleton:Pipeline:Error', { code: 'LOAD_FAILED', error: err.message });
    } finally {
      this.isLoading = false;
    }
  }

  async _refreshContact(contactId) {
    try {
      const contact = await this._service.getById(contactId);
      if (contact) {
        this.contacts.set(contactId, Object.freeze(contact));
        this._updateCard(contact);
      }
    } catch (err) {
      console.warn('[PipelineController] Error refrescando contacto:', contactId, err);
    }
  }

  // ============================================================
  // [SEC-RENDER] Renderizado condicional: Kanban vs List
  // ============================================================

  _render() {
    if (this.currentView === 'kanban') {
      this._renderKanban();
    } else {
      this._renderList();
    }
    this._updateColumnCounts();
  }

  _renderKanban() {
    // Limpiar todas las dropzones
    this.container.querySelectorAll('.column-dropzone').forEach(dz => {
      dz.innerHTML = '';
    });

    // Distribuir contactos por stage
    this.contacts.forEach(contact => {
      const stage = contact.currentStage;
      const dropzone = this.container.querySelector(`.column-dropzone[data-stage="${stage}"]`);

      if (!dropzone) {
        console.warn(`[PipelineController] Stage desconocido o sin dropzone: ${stage}`);
        return;
      }

      const card = this._createCard(contact);
      dropzone.appendChild(card);
    });
  }

  _renderList() {
    // Vista tabla — placeholder para implementación futura
    console.info('[PipelineController] Vista List no implementada en v1.0.0');
    this._emit('Skeleton:Pipeline:ViewChanged', { view: 'list', status: 'placeholder' });
  }

  /**
   * Crea una tarjeta de contacto clonando el template o fallback DOM.
   * @param {Object} contact — documento Firestore contacts
   * @returns {HTMLElement}
   */
  _createCard(contact) {
    const tpl = document.getElementById('tpl-contact-card');

    if (!tpl) {
      return this._createCardFallback(contact);
    }

    const clone = tpl.content.cloneNode(true);
    const card = clone.querySelector('.contact-card');

    // Dataset para D&D y referencia
    card.dataset.contactId = contact.id;
    card.dataset.currentStage = contact.currentStage;
    card.setAttribute('draggable', 'true');

    // Status chip (R4: i18n)
    const stageCfg = STAGE_CONFIG[contact.currentStage] || STAGE_CONFIG.lead_captured;
    const statusEl = card.querySelector('.status-chip');
    statusEl.dataset.i18n = stageCfg.statusKey;
    statusEl.textContent = this._i18n(stageCfg.statusKey);

    // Aplicar clase de color según stage
    const statusClasses = {
      lead_captured:     'status-chip-neutral bg-surface-container/50 text-outline',
      contact_initiated: 'status-chip-warning bg-tertiary/10 text-tertiary border-l-2 border-tertiary',
      kyc_pending:       'status-chip-error bg-error/10 text-error border-l-2 border-error',
      active_investor:   'status-chip-success bg-state-success/10 text-state-success border-l-2 border-state-success',
    };
    statusEl.className = `status-chip px-3 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${statusClasses[contact.currentStage] || ''}`;

    // Datos
    card.querySelector('.contact-slug').textContent = `#${contact.slug || contact.id.slice(-4)}`;
    card.querySelector('.contact-name').textContent = contact.displayName || contact.email || this._i18n('pipeline.unknown_name');
    card.querySelector('.contact-company').textContent = contact.companyName || contact.emailDomain || this._i18n('pipeline.unknown_company');

    // Avatar (fallback a iniciales SVG si no hay foto)
    const avatarImg = card.querySelector('.avatar-img');
    const avatarUrl = contact.photoURL || this._generateAvatarFallback(contact.email, contact.displayName);
    avatarImg.src = avatarUrl;
    avatarImg.alt = contact.displayName || '';

    // Action menu (R2: data-action, no inline onclick)
    const actionBtn = card.querySelector('.action-menu');
    actionBtn.dataset.contactId = contact.id;

    return card;
  }

  _createCardFallback(contact) {
    // Fallback si template no está disponible (degradación elegante)
    const div = document.createElement('div');
    div.className = 'glass-card p-5 rounded-xl cursor-pointer contact-card';
    div.dataset.contactId = contact.id;
    div.dataset.currentStage = contact.currentStage;
    div.setAttribute('draggable', 'true');

    div.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <span class="status-chip px-3 py-1 rounded text-[10px] font-bold tracking-wider uppercase">—</span>
        <span class="text-[10px] text-outline font-mono">#${contact.id.slice(-4)}</span>
      </div>
      <h4 class="font-headline-md text-body-lg mb-1">${contact.displayName || contact.email || '—'}</h4>
      <p class="text-xs text-on-surface-variant mb-4">${contact.companyName || '—'}</p>
    `;
    return div;
  }

  _generateAvatarFallback(email, displayName) {
    const initials = displayName
      ? displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : (email ? email.split('@')[0].slice(0, 2).toUpperCase() : '??');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <rect width="24" height="24" fill="var(--surface-container)"/>
      <text x="12" y="16" text-anchor="middle" fill="var(--on-surface)" font-size="10" font-family="Manrope">${initials}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  _updateCard(contact) {
    // Actualizar card existente sin re-render completo
    const card = this.container.querySelector(`.contact-card[data-contact-id="${contact.id}"]`);
    if (!card) return;

    const newStage = contact.currentStage;
    const oldStage = card.dataset.currentStage;

    if (newStage !== oldStage) {
      // Mover a nueva columna
      const newDropzone = this.container.querySelector(`.column-dropzone[data-stage="${newStage}"]`);
      if (newDropzone) {
        newDropzone.appendChild(card);
        card.dataset.currentStage = newStage;
        this._updateCardAppearance(card, contact);
      }
    } else {
      this._updateCardAppearance(card, contact);
    }
  }

  _updateCardAppearance(card, contact) {
    const stageCfg = STAGE_CONFIG[contact.currentStage];
    const statusEl = card.querySelector('.status-chip');
    if (statusEl && stageCfg) {
      statusEl.dataset.i18n = stageCfg.statusKey;
      statusEl.textContent = this._i18n(stageCfg.statusKey);
    }
    card.querySelector('.contact-name').textContent = contact.displayName || contact.email || '—';
    card.querySelector('.contact-company').textContent = contact.companyName || '—';
  }

  _updateColumnCounts() {
    this.container.querySelectorAll('.kanban-column').forEach(col => {
      const stage = col.dataset.stage;
      const count = Array.from(this.contacts.values()).filter(c => c.currentStage === stage).length;
      const countEl = col.querySelector('.column-count');
      if (countEl) {
        countEl.textContent = count;
        countEl.dataset.columnCount = count;
      }
    });
  }

  // ============================================================
  // [SEC-DND] Drag & Drop con optimistic UI
  // ============================================================

  _bindEvents() {
    // Event delegation en container (R2: nada inline)
    this.container.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;

      const action = actionEl.dataset.action;
      const contactId = actionEl.dataset.contactId ||
                        actionEl.closest('.contact-card')?.dataset.contactId;

      switch (action) {
        case 'open-drawer':
          if (contactId) this._openDrawer(contactId);
          break;
        case 'stage-move':
          if (contactId && actionEl.dataset.newStage) {
            this._moveStage(contactId, actionEl.dataset.newStage);
          }
          break;
      }
    });

    // Drag & Drop
    this.container.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.contact-card');
      if (!card) return;

      this.draggedCard = card;
      card.classList.add('opacity-50', 'scale-105', 'shadow-2xl', 'z-50');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.contactId);

      this._emit('Skeleton:Pipeline:DragStarted', { contactId: card.dataset.contactId });
    });

    this.container.addEventListener('dragend', (e) => {
      const card = e.target.closest('.contact-card');
      if (card) {
        card.classList.remove('opacity-50', 'scale-105', 'shadow-2xl', 'z-50');
      }
      this.draggedCard = null;
      this._clearDropIndicators();
    });

    this.container.addEventListener('dragover', (e) => {
      e.preventDefault();
      const dropzone = e.target.closest('.column-dropzone[data-accept-drop="true"]');
      if (dropzone) {
        dropzone.classList.add('bg-primary/5', 'border-2', 'border-dashed', 'border-primary/30', 'rounded-xl');
      }
    });

    this.container.addEventListener('dragleave', (e) => {
      const dropzone = e.target.closest('.column-dropzone');
      if (dropzone) {
        dropzone.classList.remove('bg-primary/5', 'border-2', 'border-dashed', 'border-primary/30', 'rounded-xl');
      }
    });

    this.container.addEventListener('drop', async (e) => {
      e.preventDefault();
      const dropzone = e.target.closest('.column-dropzone[data-accept-drop="true"]');
      if (!dropzone || !this.draggedCard) return;

      this._clearDropIndicators();

      const newStage = dropzone.dataset.stage;
      const contactId = this.draggedCard.dataset.contactId;
      const previousStage = this.draggedCard.dataset.currentStage;

      if (newStage === previousStage) return;

      // Validar stage
      if (!STAGE_CONFIG[newStage]) {
        console.error('[PipelineController] Stage inválido:', newStage);
        return;
      }

      // Optimistic UI: mover visualmente inmediatamente
      dropzone.appendChild(this.draggedCard);
      this.draggedCard.dataset.currentStage = newStage;
      this._updateCardAppearance(this.draggedCard, { ...this.contacts.get(contactId), currentStage: newStage });
      this._updateColumnCounts();

      try {
        await this._service.updatePipelineStage(contactId, newStage, this._actorUid);

        // Actualizar estado interno
        const contact = this.contacts.get(contactId);
        if (contact) {
          // R27: reemplazar con nuevo objeto inmutable
          const updated = Object.freeze({ ...contact, currentStage: newStage });
          this.contacts.set(contactId, updated);
        }

        this._emit('Skeleton:Pipeline:StageChanged', {
          id: contactId,
          previousStage,
          newStage,
          actorUid: this._actorUid,
        });
      } catch (err) {
        // Rollback: revertir UI
        console.error('[PipelineController] Error moviendo stage:', err);
        const oldDropzone = this.container.querySelector(`.column-dropzone[data-stage="${previousStage}"]`);
        if (oldDropzone && this.draggedCard) {
          oldDropzone.appendChild(this.draggedCard);
          this.draggedCard.dataset.currentStage = previousStage;
          this._updateCardAppearance(this.draggedCard, { ...this.contacts.get(contactId), currentStage: previousStage });
        }
        this._updateColumnCounts();

        this._emit('Skeleton:Pipeline:Error', {
          code: 'STAGE_MOVE_FAILED',
          error: err.message,
          contactId,
          previousStage,
          attemptedStage: newStage,
        });
      }
    });

    // Toggle Kanban/List
    if (this.viewToggle) {
      this.viewToggle.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-view]');
        if (!btn) return;

        const view = btn.dataset.view;
        if (!view || view === this.currentView) return;

        this.currentView = view;
        this._updateToggleUI();
        this._render();
        this._emit('Skeleton:Pipeline:ViewChanged', { view });
      });
    }

    // Drawer close (R2: data-action)
    const closeBtn = this.drawer?.querySelector('[data-action="close-drawer"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this._closeDrawer());
    }

    // Cerrar drawer con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.drawer?.classList.contains('translate-x-full')) {
        this._closeDrawer();
      }
    });
  }

  _clearDropIndicators() {
    this.container.querySelectorAll('.column-dropzone').forEach(dz => {
      dz.classList.remove('bg-primary/5', 'border-2', 'border-dashed', 'border-primary/30', 'rounded-xl');
    });
  }

  _updateToggleUI() {
    if (!this.viewToggle) return;
    this.viewToggle.querySelectorAll('button[data-view]').forEach(btn => {
      const isActive = btn.dataset.view === this.currentView;
      if (isActive) {
        btn.classList.add('bg-primary/20', 'text-primary');
        btn.classList.remove('text-on-surface-variant');
      } else {
        btn.classList.remove('bg-primary/20', 'text-primary');
        btn.classList.add('text-on-surface-variant');
      }
    });
  }

  // ============================================================
  // [SEC-DRAWER] Side drawer dinámico
  // ============================================================

  async _openDrawer(contactId) {
    let contact = this.contacts.get(contactId);

    // Si no está en caché, fetch individual
    if (!contact) {
      try {
        contact = await this._service.getById(contactId);
        if (contact) {
          this.contacts.set(contactId, Object.freeze(contact));
        }
      } catch (err) {
        console.error('[PipelineController] Error cargando contacto para drawer:', err);
        return;
      }
    }

    if (!contact) return;

    this._populateDrawer(contact);
    this.drawer.classList.remove('translate-x-full');

    this._emit('Skeleton:Pipeline:ContactSelected', {
      id: contactId,
      stage: contact.currentStage,
    });
  }

  _closeDrawer() {
    this.drawer.classList.add('translate-x-full');
    this._emit('Skeleton:Pipeline:DrawerClosed', {});
  }

  _populateDrawer(contact) {
    const t = this._i18n;

    // Avatar y nombre
    const avatarContainer = this.drawer.querySelector('.drawer-avatar-container');
    const avatarIcon = this.drawer.querySelector('.drawer-avatar-icon');
    if (contact.photoURL) {
      avatarContainer.innerHTML = `<img src="${contact.photoURL}" alt="" class="w-24 h-24 rounded-full object-cover border-2 border-primary/20"/>`;
    } else {
      avatarIcon.textContent = 'account_balance'; // default, o calcular icono por tipo
    }

    this.drawer.querySelector('.drawer-name').textContent = contact.displayName || contact.email || '—';
    this.drawer.querySelector('.drawer-role').textContent = contact.companyName || contact.title || t('pipeline.drawer_role_default');

    // Tags
    const tagsContainer = this.drawer.querySelector('.drawer-tags');
    tagsContainer.innerHTML = '';
    const tagTpl = document.getElementById('tpl-drawer-tag');
    if (contact.tags && Array.isArray(contact.tags)) {
      contact.tags.forEach(tag => {
        const tagEl = tagTpl ? tagTpl.content.cloneNode(true).querySelector('span') : document.createElement('span');
        tagEl.className = 'px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold rounded-full uppercase';
        tagEl.textContent = tag;
        tagsContainer.appendChild(tagEl);
      });
    }

    // Score
    const score = contact.complianceScore || contact.identityScore || 0;
    const scoreLabel = score >= 90 ? 'pipeline.score_exceptional' :
                       score >= 70 ? 'pipeline.score_good' :
                       score >= 50 ? 'pipeline.score_fair' : 'pipeline.score_poor';

    this.drawer.querySelector('.drawer-score').textContent = `${score}%`;
    this.drawer.querySelector('.drawer-score-label').textContent = t(scoreLabel);
    this.drawer.querySelector('.drawer-progress-bar').style.width = `${score}%`;

    // Details (R4: i18n para labels)
    const detailsContainer = this.drawer.querySelector('.drawer-details');
    detailsContainer.innerHTML = '';
    const rowTpl = document.getElementById('tpl-drawer-detail-row');

    DRAWER_FIELDS.forEach(field => {
      const value = contact[field.key];
      if (!value) return;

      const row = rowTpl ? rowTpl.content.cloneNode(true).querySelector('div') : document.createElement('div');
      if (!rowTpl) {
        row.className = 'flex justify-between items-center py-2 border-b border-outline/5';
      }
      const labelEl = row.querySelector('.detail-label') || row;
      const valueEl = row.querySelector('.detail-value');
      if (labelEl.dataset) labelEl.dataset.i18n = field.i18nKey;
      labelEl.textContent = t(field.i18nKey);
      if (valueEl) valueEl.textContent = value;

      detailsContainer.appendChild(row);
    });

    // Documents (placeholder hasta que exista subcolección)
    const docsContainer = this.drawer.querySelector('.drawer-documents');
    docsContainer.innerHTML = '';
    const docTpl = document.getElementById('tpl-drawer-doc');

    if (contact.documents && Array.isArray(contact.documents)) {
      contact.documents.forEach(doc => {
        const docEl = docTpl ? docTpl.content.cloneNode(true).querySelector('div') : document.createElement('div');
        if (!docTpl) {
          docEl.className = 'flex items-center gap-3 p-3 rounded-lg bg-white/5';
        }
        const nameEl = docEl.querySelector('.doc-name');
        const statusEl = docEl.querySelector('.doc-status');
        if (nameEl) nameEl.textContent = doc.name || '—';
        if (statusEl) statusEl.textContent = doc.status || '—';
        docsContainer.appendChild(docEl);
      });
    } else {
      docsContainer.innerHTML = `<p class="text-xs text-outline italic">${t('pipeline.no_documents')}</p>`;
    }
  }

  // ============================================================
  // [SEC-ANIM] Feedback visual
  // ============================================================

  _animateStageChange(contactId, fromStage, toStage) {
    const card = this.container.querySelector(`.contact-card[data-contact-id="${contactId}"]`);
    if (!card) return;

    // Flash de confirmación
    card.classList.add('ring-2', 'ring-primary', 'scale-105');
    setTimeout(() => {
      card.classList.remove('ring-2', 'ring-primary', 'scale-105');
    }, 600);

    // Emitir evento para posible sonido o notificación
    this._emit('Skeleton:Pipeline:StageAnimationComplete', { contactId, fromStage, toStage });
  }

  // ============================================================
  // [SEC-UTILS] Helpers
  // ============================================================

  _moveStage(contactId, newStage) {
    // Método programático (por botón, no D&D)
    const card = this.container.querySelector(`.contact-card[data-contact-id="${contactId}"]`);
    if (!card) return;

    const previousStage = card.dataset.currentStage;
    const dropzone = this.container.querySelector(`.column-dropzone[data-stage="${newStage}"]`);
    if (!dropzone) return;

    // Simular el flujo de D&D
    dropzone.appendChild(card);
    card.dataset.currentStage = newStage;
    this._updateColumnCounts();

    this._service.updatePipelineStage(contactId, newStage, this._actorUid)
      .then(() => {
        const contact = this.contacts.get(contactId);
        if (contact) {
          this.contacts.set(contactId, Object.freeze({ ...contact, currentStage: newStage }));
        }
        this._emit('Skeleton:Pipeline:StageChanged', { id: contactId, previousStage, newStage });
      })
      .catch(err => {
        const oldDropzone = this.container.querySelector(`.column-dropzone[data-stage="${previousStage}"]`);
        if (oldDropzone) oldDropzone.appendChild(card);
        card.dataset.currentStage = previousStage;
        this._updateColumnCounts();
        this._emit('Skeleton:Pipeline:Error', { code: 'STAGE_MOVE_FAILED', error: err.message });
      });
  }
}

// ============================================================
// [SEC-EXPORT] Registro en namespace canónico (R21)
// ============================================================

if (typeof window !== 'undefined') {
  window.__CPII__ = window.__CPII__ || {};
  window.__CPII__.PipelineController = PipelineController;

  // Auto-inicialización si existe configuración en DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.__CPII__.pipelineConfig) {
        window.__CPII__.pipelineController = new PipelineController(window.__CPII__.pipelineConfig);
      }
    });
  }
}