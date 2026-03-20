/* ================================================================
 * sk-ui.js — SonKhang ERP v3.5
 * Core UI: api(), getContent(), helpers, initSidebar()
 * Ng\u00e0y c\u1eadp nh\u1eadt: 20/03/2026
 *
 * S\u1eeda l\u1ed7i:
 *   [FIX-1] window.api = api  — cho ph\u00e9p sk-vehicle.js v\u00e0 c\u00e1c CDN module g\u1ecdi \u0111\u01b0\u1ee3c
 *   [FIX-2] window.getContent = getContent — c\u1ea7n thi\u1ebft cho m\u1ecdi module
 *
 * QUY T\u1eaec: Ch\u1ec9 d\u00f9ng var, kh\u00f4ng let/const
 *            Ti\u1ebfng Vi\u1ec7t trong string JS = Unicode escape
 *
 * DEPLOY: GitHub thinhhoba/sonkhang-erp-js → commit sk-ui.js
 * ================================================================ */

(function () {
  'use strict';

  /* ============================================================
   * S1 — H\u00c0M api()
   * [FIX-1] \u0110\u00e2y l\u00e0 s\u1eeda l\u1ed7i c\u1ed1t l\u00f5i: expose ra window.api \u0111\u1ec3
   *         sk-vehicle.js (IIFE tr\u00ean CDN) g\u1ecdi \u0111\u01b0\u1ee3c.
   *
   * api() \u0111\u1ecdc window.GAS \u0111\u01b0\u1ee3c Theme XML khai b\u00e1o.
   * Anh Th\u1ecbnh c\u1ea7n th\u00eam 1 d\u00f2ng v\u00e0o Theme XML (xem h\u01b0\u1edbng d\u1eabn cu\u1ed1i file):
   *   window.GAS = GAS;
   * ============================================================ */

  function api(action, data, cb) {
    var gasUrl = window.GAS || window._SK_GAS || '';
    if (!gasUrl) {
      console.error('[SonKhang ERP] window.GAS ch\u01b0a \u0111\u01b0\u1ee3c khai b\u00e1o. Th\u00eam d\u00f2ng window.GAS = GAS; v\u00e0o Theme XML.');
      if (typeof cb === 'function') cb(new Error('GAS URL not configured'), null);
      return;
    }
    var tok  = '';
    try { tok = localStorage.getItem('sk_session') || ''; } catch (e) { tok = ''; }

    var body = { action: action, session_token: tok };
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(function (k) { body[k] = data[k]; });
    }

    fetch(gasUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' },  /* QUAN TR\u1eccNG: tr\u00e1nh CORS preflight */
      body:    JSON.stringify(body)
    })
    .then(function (r) { return r.json(); })
    .then(function (d) { if (typeof cb === 'function') cb(null, d); })
    .catch(function (e) {
      console.error('[SonKhang ERP] api() l\u1ed7i:', action, e);
      if (typeof cb === 'function') cb(e, null);
    });
  }

  /* ============================================================
   * S2 — getContent()
   * [FIX-2] Tr\u1ea3 v\u1ec1 \u0111\u01b0\u1ee3c th\u1eebb v\u00f9ng n\u1ed9i dung ch\u00ednh, c\u1ea7n cho m\u1ecdi module.
   * C\u1ed1 g\u1eafng nhi\u1ec1u ID kh\u00e1c nhau \u0111\u1ec3 t\u01b0\u01a1ng th\u00edch v\u1edbi m\u1ecdi phi\u00ean b\u1ea3n Theme.
   * ============================================================ */

  function getContent() {
    return document.getElementById('sk-ct')
        || document.getElementById('sk-content')
        || document.getElementById('sk-body')
        || document.querySelector('.sk-content')
        || document.querySelector('.sk-main-content')
        || document.querySelector('[data-sk-content]');
  }

  /* ============================================================
   * S3 — FORMAT HELPERS
   * ============================================================ */

  /* fv(n) — Format ti\u1ec1n VND: 1.500.000\u0111 → "1.5 tr", 2.000.000.000\u0111 → "2 t\u1ef7" */
  function fv(n) {
    n = Number(n) || 0;
    if (n === 0) return '0\u0111';
    if (n >= 1e9) return (Math.round(n / 1e7) / 100) + ' t\u1ef7';
    if (n >= 1e6) return (Math.round(n / 1e4) / 100) + ' tr';
    return n.toLocaleString('vi-VN') + '\u0111';
  }

  /* fd(s) — Format ng\u00e0y ISO → dd/MM/yyyy */
  function fd(s) {
    if (!s) return '';
    var d = new Date(s);
    if (isNaN(d.getTime())) return String(s);
    return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
  }

  /* ============================================================
   * S4 — HTML HELPERS: skel, kpi, badge, emptyState, alertBanner
   * ============================================================ */

  /* skel() — Skeleton loading HTML (3 d\u00f2ng x\u01b0\u01a1ng) */
  function skel() {
    var h = '<div style="display:flex;flex-direction:column;gap:12px;padding:8px 0;">';
    var widths = ['70%', '50%', '85%', '40%', '65%'];
    for (var i = 0; i < widths.length; i++) {
      h += '<div style="height:14px;width:' + widths[i] + ';background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);background-size:400% 100%;border-radius:6px;animation:sk-shimmer 1.4s ease infinite;"></div>';
    }
    h += '</div>';
    h += '<style>@keyframes sk-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}</style>';
    return h;
  }

  /* kpi(color, label, value, subtitle) — KPI card HTML */
  function kpi(color, label, value, subtitle) {
    return '<div class="sk-kpi" style="border-top:4px solid ' + color + ';background:#111827;border-radius:12px;padding:14px 16px;">'
      + '<div style="font-size:11.5px;color:#64748b;margin-bottom:5px;">' + label + '</div>'
      + '<div style="font-size:20px;font-weight:700;color:#e2e8f0;font-variant-numeric:tabular-nums;">' + value + '</div>'
      + (subtitle ? '<div style="font-size:11px;color:#64748b;margin-top:2px;">' + subtitle + '</div>' : '')
      + '</div>';
  }

  /* badge(text, color) — Status badge span */
  function badge(text, color) {
    color = color || '#64748b';
    return '<span style="'
      + 'background:' + color + '1a;'
      + 'color:' + color + ';'
      + 'border:1px solid ' + color + '33;'
      + 'border-radius:999px;padding:3px 10px;font-size:11.5px;font-weight:600;'
      + '">' + text + '</span>';
  }

  /* emptyState(icon, title, desc) — Tr\u1ea1ng th\u00e1i r\u1ed7ng */
  function emptyState(icon, title, desc) {
    return '<div style="text-align:center;padding:48px 24px;color:#64748b;">'
      + '<div style="font-size:40px;margin-bottom:12px;">' + icon + '</div>'
      + '<div style="font-size:14px;color:#94a3b8;font-weight:600;margin-bottom:6px;">' + title + '</div>'
      + (desc ? '<div style="font-size:12.5px;">' + desc + '</div>' : '')
      + '</div>';
  }

  /* alertBanner(alerts) — Banner c\u1ea3nh b\u00e1o */
  function alertBanner(alerts) {
    if (!alerts || !alerts.length) return '';
    var h = '<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:10px;padding:12px 15px;margin-bottom:14px;">';
    for (var i = 0; i < alerts.length; i++) {
      var a = alerts[i];
      var c = a.level === 'error' ? '#ef4444' : '#f59e0b';
      h += '<div style="color:' + c + ';font-size:12.5px;padding:2px 0;">'
        + '&#x25CF; ' + (a.message || String(a)) + '</div>';
    }
    h += '</div>';
    return h;
  }

  /* ============================================================
   * S5 — SIDEBAR: initSidebar()
   * \u0110\u1ecdc window.SK_MENU (do Theme XML khai b\u00e1o)
   * Build accordion sidebar v\u1edbi 7 nh\u00f3m, 27 m\u1ee5c menu.
   * ============================================================ */

  function initSidebar() {
    var sb = document.getElementById('sk-sb-nav')
          || document.getElementById('sk-nav')
          || document.querySelector('.sk-sb-nav')
          || document.querySelector('.sk-nav-items');
    if (!sb) return;

    var menu      = window.SK_MENU || [];
    var activePg  = window._SK_PAGE || _getPageFromUrl();
    var html      = '';

    for (var g = 0; g < menu.length; g++) {
      var grp = menu[g];
      /* Ki\u1ec3m tra group c\u00f3 m\u1ee5c active kh\u00f4ng \u0111\u1ec3 auto-expand */
      var hasActive = false;
      for (var ia = 0; ia < grp.items.length; ia++) {
        if (grp.items[ia].page === activePg) { hasActive = true; break; }
      }

      html += '<div class="sk-acc-group">';
      html += '<div class="sk-acc-header" onclick="skAccToggle(this)">';
      html += '<span class="sk-acc-label">' + (grp.icon || '') + ' ' + grp.group + '</span>';
      html += '<span class="sk-acc-arrow" style="font-size:10px;transition:transform .2s;">'
        + (hasActive ? '&#x25B4;' : '&#x25BE;') + '</span>';
      html += '</div>';
      html += '<div class="sk-acc-content' + (hasActive ? ' sk-open' : '') + '">';

      for (var it = 0; it < grp.items.length; it++) {
        var item     = grp.items[it];
        var isActive = item.page === activePg;
        html += '<div class="sk-na' + (isActive ? ' active' : '') + '"'
          + ' onclick="loadGeneric(\'' + item.page + '\')"'
          + ' data-page="' + item.page + '">';
        html += (item.icon || '') + ' ' + item.label;
        html += '</div>';
      }

      html += '</div>';
      html += '</div>';
    }

    sb.innerHTML = html;
  }

  /* skAccToggle(header) — M\u1edf/\u0111\u00f3ng accordion group */
  function skAccToggle(header) {
    if (!header) return;
    var content = header.nextElementSibling;
    if (!content) return;
    var isOpen = content.className.indexOf('sk-open') >= 0;
    var arrow  = header.querySelector('.sk-acc-arrow');

    if (isOpen) {
      content.className = content.className.replace(' sk-open', '').replace('sk-open', '');
      if (arrow) arrow.innerHTML = '&#x25BE;';
    } else {
      content.className += ' sk-open';
      if (arrow) arrow.innerHTML = '&#x25B4;';
    }
  }

  /* setActiveNav(page) — C\u1eadp nh\u1eadt nav item active khi chuy\u1ec3n trang */
  function setActiveNav(page) {
    var items = document.querySelectorAll('.sk-na');
    for (var i = 0; i < items.length; i++) {
      var p = items[i].getAttribute('data-page');
      if (p === page) {
        items[i].className = 'sk-na active';
        /* M\u1edf accordion ch\u1ee9a m\u1ee5c n\u00e0y */
        var content = items[i].parentElement;
        if (content && content.className.indexOf('sk-open') < 0) {
          content.className += ' sk-open';
          var hdr   = content.previousElementSibling;
          var arrow = hdr && hdr.querySelector('.sk-acc-arrow');
          if (arrow) arrow.innerHTML = '&#x25B4;';
        }
      } else {
        items[i].className = 'sk-na';
      }
    }
  }

  /* _getPageFromUrl() — L\u1ea5y page t\u1eeb URL hi\u1ec7n t\u1ea1i (Blogger path) */
  function _getPageFromUrl() {
    var path = window.location.pathname || '';
    var match = path.match(/\/p\/([^\/]+)/);
    return match ? match[1].replace('.html', '') : '';
  }

  /* ============================================================
   * S6 — CSS INJECT cho c\u00e1c helper h\u1ee3p l\u1ec7
   * ============================================================ */

  function _injectUiCss() {
    if (document.getElementById('sk-ui-css')) return;
    var s = document.createElement('style');
    s.id = 'sk-ui-css';
    s.textContent = [
      /* Accordion */
      '.sk-acc-group{margin-bottom:2px;}',
      '.sk-acc-header{display:flex;justify-content:space-between;align-items:center;padding:7px 12px;cursor:pointer;border-radius:6px;font-size:11px;font-weight:600;color:#64748b;letter-spacing:.04em;text-transform:uppercase;user-select:none;}',
      '.sk-acc-header:hover{background:rgba(255,255,255,.04);}',
      '.sk-acc-content{display:none;overflow:hidden;}',
      '.sk-acc-content.sk-open{display:block;}',
      /* Nav items */
      '.sk-na{display:flex;align-items:center;gap:8px;padding:9px 14px;font-size:13px;color:#94a3b8;cursor:pointer;border-radius:8px;margin:1px 4px;border-left:2px solid transparent;transition:background .15s,color .15s,border-color .15s;}',
      '.sk-na:hover{background:rgba(59,130,246,.08);color:#cbd5e1;}',
      '.sk-na.active{background:rgba(59,130,246,.12);color:#e2e8f0;border-left-color:#3b82f6;font-weight:500;}',
      /* KPI grid */
      '.sk-g5{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;}',
      '@media(max-width:1024px){.sk-g5{grid-template-columns:repeat(3,1fr);}}',
      '@media(max-width:640px){.sk-g5{grid-template-columns:repeat(2,1fr);}}',
      /* Panel */
      '.sk-panel{background:#111827;border:1px solid #1e293b;border-radius:12px;}',
      '.sk-pt{font-size:14px;font-weight:600;color:#e2e8f0;}',
      /* Input */
      '.sk-inp{width:100%;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:9px 12px;color:#e2e8f0;font-size:13px;box-sizing:border-box;outline:none;transition:border-color .15s;}',
      '.sk-inp:focus{border-color:#3b82f6;}',
      '.sk-inp option{background:#0f172a;color:#e2e8f0;}',
      /* Button */
      '.sk-btn{background:#3b82f6;color:#fff;border:none;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s,transform .1s;}',
      '.sk-btn:hover{background:#2563eb;}',
      '.sk-btn:active{transform:scale(.97);}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ============================================================
   * S7 — EXPOSE T\u1ea4T C\u1ea2 RA WINDOW
   * \u0110\u00e2y l\u00e0 ph\u1ea7n quan tr\u1ecdng nh\u1ea5t — m\u1ecdi CDN module (sk-vehicle.js,
   * sk-crm.js...) \u0111\u1ec1u c\u1ea7n g\u1ecdi \u0111\u01b0\u1ee3c c\u00e1c h\u00e0m n\u00e0y t\u1eeb window scope.
   * ============================================================ */

  _injectUiCss();

  window.api          = api;          /* [FIX-1] QUAN TR\u1eccNG — CDN modules g\u1ecdi api() */
  window.getContent   = getContent;   /* [FIX-2] QUAN TR\u1eccNG — CDN modules g\u1ecdi getContent() */
  window.fv           = fv;
  window.fd           = fd;
  window.skel         = skel;
  window.kpi          = kpi;
  window.badge        = badge;
  window.emptyState   = emptyState;
  window.alertBanner  = alertBanner;
  window.initSidebar  = initSidebar;
  window.skAccToggle  = skAccToggle;
  window.setActiveNav = setActiveNav;

}());

/* ================================================================
 * H\u01af\u1ee0NG D\u1eaaN: Anh Th\u1ecbnh c\u1ea7n th\u00eam 2 d\u00f2ng v\u00e0o Theme XML
 *
 * M\u1edf Blogger → Theme → Edit HTML → Ctrl+F t\u00ecm:
 *   window._crmRender = _crmRender;
 *   (t\u00ecm \u0111o\u1ea1n expose cu\u1ed1i c\u1ee7a IIFE trong Theme XML)
 *
 * Th\u00eam 2 d\u00f2ng n\u00e0y v\u00e0o \u0111\u00f3 (tr\u01b0\u1edbc d\u1ea5u \u0111\u00f3ng c\u1ee7a IIFE):
 *   window.GAS = GAS;              // cho ph\u00e9p sk-ui.js \u0111\u1ecdc URL GAS
 *   window.loadPhuongTien = function() { window.loadVehicle(); };
 *   (d\u00f2ng 2 s\u1eeda l\u1ed7i _vehTabDS by delegate sang sk-vehicle.js m\u1edbi)
 * ================================================================ */
