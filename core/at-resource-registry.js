// ============================================================
// at-resource-registry.js — Registro de gadgets CPII_crm_v1.1
// Carga: Camino A (fetch HTML). Campo url → ruta real code.html.
// Sutura F2 — Ticket Fracturas Críticas (2026-05-16)
// ============================================================
(function () {
    'use strict';
    window.__CPII__ = window.__CPII__ || {};
    window.__CPII__.RESOURCE_REGISTRY = {
            'gd-dashboard': {
                id: 'gd-dashboard',
                type: 'gadget',
                url: 'gadgets/cpii_clubpulse.gd_pulse_v2.5_refactored_final/code.html',
                labelKey: 'nav_dashboard',
                icon: 'dashboard',
                tagName: 'gd-dashboard',
                status: 'production'
            },
            'gd-manual': {
                id: 'gd-manual',
                type: 'gadget',
                url: 'gadgets/cpii_prescriptortree.gd_network_v2.5_refactored/code.html',
                labelKey: 'nav_manuals',
                icon: 'menu_book',
                tagName: 'gd-manual',
                status: 'production'
            },
            'gd-simulador': {
                id: 'gd-simulador',
                type: 'gadget',
                url: 'gadgets/cpii_dealroom.at_dealroom_v2.5_featured_deal/code.html',
                labelKey: 'nav_simulator',
                icon: 'calculate',
                tagName: 'gd-simulador',
                status: 'draft'
            },
            'gd-calculadora': {
                id: 'gd-calculadora',
                type: 'gadget',
                url: 'gadgets/cpii_agentmetrics.at_agent_v2.5_refactored/code.html',
                labelKey: 'nav_calculator',
                icon: 'functions',
                tagName: 'gd-calculadora',
                status: 'draft'
            }
    };
})();