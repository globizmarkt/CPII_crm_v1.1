// ============================================================
// ARCHIVO  : core/at-resource-registry.js
// VERSIÓN  : 2.0.0
// FECHA    : 2026-05-18
// PROPÓSITO: Registro canónico de los 23 gadgets CPII_crm_v1.1.
//            Amplía el legado de 4 entradas a las 23 entradas
//            canónicas definidas en Sprint VIBE-CPII-REBORN-02.1.
//            Requerido por: breadcrumb (orbit2-active-label),
//            TabManager.openFromRegistry(), Omnibox search.
// DOCTRINA : R19 (preservar legado) | R21 (namespace) | DT-013
//
// Convención de campos:
//   id         — clave canónica del gadget (coincide con clave objeto)
//   type       — siempre 'gadget'
//   url        — ruta relativa a code.html. null si sin gadget físico aún.
//   labelKey   — clave i18n para breadcrumb, tab y omnibox
//   icon       — Material Symbol name (R3 Zero-Hex: sin emoji)
//   tagName    — legacy / reservado para futuros Web Components
//   status     — 'production' | 'draft' | 'placeholder'
//
// ÁREAS CANÓNICAS (R28 — acordeón Órbita 1):
//   Área 1 Negócios         : contacts, dealroom, investments, commissions, properties
//   Área 2 Dashboard Agente : agentmetrics, portfolio, tasks, compliancemessenger
//   Área 3 Procedimentos    : compliance_dashboard, sops, market
//   Área 4 Academy          : onboarding, training_commercial, training_ops, document_library
//   Área 5 Configuração     : user_profile, theme_config, compliance_rules, faq, admin_gate
//   Especiais               : kyc_verification, cpii_agentmetrics (autoboot)
//   Legado DT-012           : gd-manual, gd-dashboard, gd-simulador, gd-calculadora
// ============================================================
(function () {
    'use strict';
    window.__CPII__ = window.__CPII__ || {};

    window.__CPII__.RESOURCE_REGISTRY = {

        // ── ÁREA 1 — Negócios ────────────────────────────────────────
        'contacts': {
            id: 'contacts',
            type: 'gadget',
            url: 'gadgets/cpii_contacts/code.html',
            labelKey: 'nav.business.contacts',
            icon: 'contacts',
            tagName: 'gd-contacts',
            status: 'production'
        },
        'dealroom': {
            id: 'dealroom',
            type: 'gadget',
            url: 'gadgets/sin_evaluar/cpii_dealroom.at_dealroom_v2.5_featured_deal/code.html',
            labelKey: 'nav.business.deals',
            icon: 'handshake',
            tagName: 'gd-dealroom',
            status: 'quarantined'
        },
        'investments': {
            id: 'investments',
            type: 'gadget',
            url: 'gadgets/cpii_investments/code.html',
            labelKey: 'nav.business.investments',
            icon: 'trending_up',
            tagName: 'gd-investments',
            status: 'draft'
        },
        'commissions': {
            id: 'commissions',
            type: 'gadget',
            url: 'gadgets/cpii_commissions/code.html',
            labelKey: 'nav.business.commissions',
            icon: 'percent',
            tagName: 'gd-commissions',
            status: 'draft'
        },
        'properties': {
            id: 'properties',
            type: 'gadget',
            url: 'gadgets/cpii_properties/code.html',
            labelKey: 'nav.business.properties',
            icon: 'apartment',
            tagName: 'gd-properties',
            status: 'draft'
        },

        // ── ÁREA 2 — Dashboard do Agente ─────────────────────────────
        'agentmetrics': {
            id: 'agentmetrics',
            type: 'gadget',
            url: 'gadgets/sin_evaluar/cpii_agentmetrics.at_agent_v2.5_refactored/code.html',
            labelKey: 'nav.dashboard.metrics',
            icon: 'insights',
            tagName: 'gd-agentmetrics',
            status: 'quarantined'
        },
        'portfolio': {
            id: 'portfolio',
            type: 'gadget',
            url: 'gadgets/cpii_portfolio/code.html',
            labelKey: 'nav.dashboard.portfolio',
            icon: 'account_balance_wallet',
            tagName: 'gd-portfolio',
            status: 'draft'
        },
        'tasks': {
            id: 'tasks',
            type: 'gadget',
            url: 'gadgets/cpii_tasks/code.html',
            labelKey: 'nav.dashboard.tasks',
            icon: 'task_alt',
            tagName: 'gd-tasks',
            status: 'draft'
        },
        'compliancemessenger': {
            id: 'compliancemessenger',
            type: 'gadget',
            url: 'gadgets/sin_evaluar/cpii_compliancemessenger.wd_messenger_v2.5_refactored/code.html',
            labelKey: 'nav.dashboard.alerts',
            icon: 'mark_email_unread',
            tagName: 'gd-compliancemessenger',
            status: 'quarantined'
        },

        // ── ÁREA 3 — Procedimentos e Mercado ─────────────────────────
        'compliance_dashboard': {
            id: 'compliance_dashboard',
            type: 'gadget',
            url: 'gadgets/cpii_compliance_dashboard/code.html',
            labelKey: 'nav.procedures.compliance',
            icon: 'verified_user',
            tagName: 'gd-compliance-dashboard',
            status: 'draft'
        },
        'sops': {
            id: 'sops',
            type: 'gadget',
            url: 'gadgets/cpii_sops/code.html',
            labelKey: 'nav.procedures.sops',
            icon: 'description',
            tagName: 'gd-sops',
            status: 'draft'
        },
        'market': {
            id: 'market',
            type: 'gadget',
            url: 'gadgets/cpii_market/code.html',
            labelKey: 'nav.procedures.market',
            icon: 'store',
            tagName: 'gd-market',
            status: 'draft'
        },

        // ── ÁREA 4 — Manuais e Formação ──────────────────────────────
        'onboarding': {
            id: 'onboarding',
            type: 'gadget',
            url: 'gadgets/cpii_onboarding/code.html',
            labelKey: 'nav.academy.onboarding',
            icon: 'school',
            tagName: 'gd-onboarding',
            status: 'draft'
        },
        'training_commercial': {
            id: 'training_commercial',
            type: 'gadget',
            url: 'gadgets/cpii_training_commercial/code.html',
            labelKey: 'nav.academy.training_commercial',
            icon: 'real_estate_agent',
            tagName: 'gd-training-commercial',
            status: 'draft'
        },
        'training_ops': {
            id: 'training_ops',
            type: 'gadget',
            url: 'gadgets/cpii_training_ops/code.html',
            labelKey: 'nav.academy.training_ops',
            icon: 'engineering',
            tagName: 'gd-training-ops',
            status: 'draft'
        },
        'document_library': {
            id: 'document_library',
            type: 'gadget',
            url: 'gadgets/cpii_document_library/code.html',
            labelKey: 'nav.academy.library',
            icon: 'local_library',
            tagName: 'gd-document-library',
            status: 'draft'
        },

        // ── ÁREA 5 — Configuração (footer) ───────────────────────────
        'user_profile': {
            id: 'user_profile',
            type: 'gadget',
            url: 'gadgets/cpii_user_profile/code.html',
            labelKey: 'nav.config.profile',
            icon: 'manage_accounts',
            tagName: 'gd-user-profile',
            status: 'draft'
        },
        'theme_config': {
            id: 'theme_config',
            type: 'gadget',
            url: 'gadgets/cpii_theme_config/code.html',
            labelKey: 'nav.config.theme',
            icon: 'palette',
            tagName: 'gd-theme-config',
            status: 'draft'
        },
        'compliance_rules': {
            id: 'compliance_rules',
            type: 'gadget',
            url: 'gadgets/cpii_compliance_rules/code.html',
            labelKey: 'nav.config.compliance_rules',
            icon: 'policy',
            tagName: 'gd-compliance-rules',
            status: 'draft'
        },
        'faq': {
            id: 'faq',
            type: 'gadget',
            url: null,
            labelKey: 'nav.config.faq',
            icon: 'help',
            tagName: 'gd-faq',
            status: 'placeholder'
        },
        'admin_gate': {
            id: 'admin_gate',
            type: 'gadget',
            url: null,
            labelKey: 'nav.config.admin',
            icon: 'admin_panel_settings',
            tagName: 'gd-admin-gate',
            status: 'placeholder'
        },

        // ── ESPECIALES ───────────────────────────────────────────────
        'kyc_verification': {
            id: 'kyc_verification',
            type: 'gadget',
            url: null,
            labelKey: 'kyc.tab.title',
            icon: 'verified',
            tagName: 'gd-kyc-verification',
            status: 'placeholder'
        },

        // ── LEGADO DT-012 — preservados (R19) ────────────────────────
        // autofinancingclock: WD Clock v2.5 — EN CUARENTENA (GE-03 resuelto: registrado al moverlo a sin_evaluar)
        'autofinancingclock': {
            id: 'autofinancingclock',
            type: 'gadget',
            url: 'gadgets/sin_evaluar/cpii_autofinancingclock.wd_clock_v2.5_refactored/code.html',
            labelKey: 'nav.legacy.autofinancingclock',
            icon: 'schedule',
            tagName: 'gd-autofinancingclock',
            status: 'quarantined'
        },
        // gd-manual: Prescriptor Tree v2.5 — EN CUARENTENA (movido a sin_evaluar)
        'gd-manual': {
            id: 'gd-manual',
            type: 'gadget',
            url: 'gadgets/sin_evaluar/cpii_prescriptortree.gd_network_v2.5_refactored/code.html',
            labelKey: 'nav_manuals',
            icon: 'menu_book',
            tagName: 'gd-manual',
            status: 'quarantined'
        },
        // gd-dashboard: ClubPulse v2.5 — EN CUARENTENA (movido a sin_evaluar)
        'gd-dashboard': {
            id: 'gd-dashboard',
            type: 'gadget',
            url: 'gadgets/sin_evaluar/cpii_clubpulse.gd_pulse_v2.5_refactored_final/code.html',
            labelKey: 'nav_dashboard',
            icon: 'dashboard',
            tagName: 'gd-dashboard',
            status: 'quarantined'
        },
        // gd-simulador / gd-calculadora: DT-012 legacy — EN CUARENTENA (alias de dealroom/agentmetrics)
        'gd-simulador': {
            id: 'gd-simulador',
            type: 'gadget',
            url: 'gadgets/sin_evaluar/cpii_dealroom.at_dealroom_v2.5_featured_deal/code.html',
            labelKey: 'nav.business.deals',
            icon: 'calculate',
            tagName: 'gd-simulador',
            status: 'quarantined'
        },
        'gd-calculadora': {
            id: 'gd-calculadora',
            type: 'gadget',
            url: 'gadgets/sin_evaluar/cpii_agentmetrics.at_agent_v2.5_refactored/code.html',
            labelKey: 'nav.dashboard.metrics',
            icon: 'functions',
            tagName: 'gd-calculadora',
            status: 'quarantined'
        }
    };

    console.log('[Registry] ✅ at-resource-registry.js v2.0.0 — ' +
        Object.keys(window.__CPII__.RESOURCE_REGISTRY).length + ' entradas cargadas.');
})();
