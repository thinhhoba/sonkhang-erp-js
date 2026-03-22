/* ================================================================
// [v5.24] 22/03/2026 — Fix: doPost null-safety, sapoSyncOrdersOnly, GAS diagnostics
// [v5.23.1] 22/03/2026 — Fix: JSON parse error, Telegram plain-text, sapoGetStatus inline calls
 * sk-ui.js — SonKhang ERP v3.5
 * Core: api(), getContent(), helpers to\u00e0n h\u1ec7 th\u1ed1ng
 * S\u1eeda l\u1ed7i: window.api = api  \u2190 CDN modules d\u00f9ng \u0111\u01b0\u1ee3c
 * ================================================================ */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
   * api(action, data, cb)
   * \u0110\u1ecdc window.GAS do Theme XML khai b\u00e1o.
   * Content-Type: text/plain  \u2190  b\u1eaft bu\u1ed9c \u0111\u1ec3 tr\u00e1nh CORS preflight.
   * ───────────────────────────────────────────────────────────── */
  function api(action, data, cb) {
    var gasUrl = window.GAS || window._SK_GAS || '';
    if (!gasUrl) {
      console.error('[sk-ui] window.GAS ch\u01b0a \u0111\u01b0\u1ee3c khai b\u00e1o trong Theme XML');
      if (typeof cb === 'function') cb(new Error('GAS_URL_MISSING'), null);
      return;
    }
    var tok = '';
    try { tok = localStorage.getItem('sk_session') || ''; } catch (e) {}

    var body = { action: action, session_token: tok };
    if (data && typeof data === 'object') {
      var keys = Object.keys(data);
      for (var ki = 0; ki < keys.length; ki++) body[keys[ki]] = data[keys[ki]];
    }

    fetch(gasUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify(body)
    })
    .then(function (r) {
      var status = r.status;
      // [v5.24] Safe parse với đầy đủ diagnostic
      return r.text().then(function(txt) {
        if (!txt || txt.trim() === '') {
          // Empty body: thường do GAS chưa deploy "Anyone" hoặc version cũ
          console.error('[sk-ui] Empty response for action=' + action +
            ' | HTTP=' + status +
            ' | Checklist: 1) GAS Deploy→Anyone 2) New Version 3) URL đúng: ' + gasUrl.substring(0,60));
          return {
            ok: false,
            error: 'GAS_EMPTY_RESPONSE',
            hint: 'Vao GAS Editor → Deploy → Manage → Edit → Who has access: Anyone → New version → Deploy',
            http_status: status,
            gas_url_prefix: gasUrl.substring(0, 50)
          };
        }
        try {
          return JSON.parse(txt);
        } catch(parseErr) {
          var preview = txt.trim().substring(0, 200).replace(/<[^>]+>/g, '').trim();
          console.warn('[sk-ui] Non-JSON for action=' + action + ' HTTP=' + status + ':', preview);
          // Kiểm tra nếu là trang đăng nhập Google
          var isGoogleLogin = txt.indexOf('accounts.google.com') > -1 ||
                              txt.indexOf('Sign in') > -1;
          return {
            ok: false,
            error: isGoogleLogin
              ? 'GAS_AUTH_REQUIRED: Deploy lai GAS voi "Anyone" (khong can dang nhap)'
              : 'GAS_NON_JSON: ' + preview.substring(0, 100),
            http_status: status
          };
        }
      });
    })
    .then(function (d) { if (typeof cb === 'function') cb(null, d); })
    .catch(function (e) {
      console.error('[sk-ui] api() l\u1ed7i:', action, e);
      if (typeof cb === 'function') cb(e, null);
    });
  }

  /* ─── getContent() ────────────────────────────────────────────── */
  function getContent() {
    return document.getElementById('sk-ct')
        || document.getElementById('sk-content')
        || document.getElementById('sk-body')
        || document.querySelector('.sk-content')
        || document.querySelector('.sk-main-content')
        || document.querySelector('[data-sk-content]');
  }

  /* ─── Format helpers ──────────────────────────────────────────── */
  function fv(n) {
    n = Number(n) || 0;
    if (n === 0) return '0\u0111';
    if (n >= 1e9) return (Math.round(n / 1e7) / 100) + ' t\u1ef7';
    if (n >= 1e6) return (Math.round(n / 1e4) / 100) + ' tr';
    return n.toLocaleString('vi-VN') + '\u0111';
  }

  function fd(s) {
    if (!s) return '';
    var d = new Date(s);
    if (isNaN(d.getTime())) return String(s);
    return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
  }

  /* ─── HTML helpers ────────────────────────────────────────────── */
  function skel() {
    var h = '<div style="display:flex;flex-direction:column;gap:12px;padding:8px 0;">';
    var ws = ['70%','50%','85%','40%','65%'];
    for (var i = 0; i < ws.length; i++) {
      h += '<div style="height:14px;width:' + ws[i]
        + ';background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);'
        + 'background-size:400% 100%;border-radius:6px;animation:sk-shimmer 1.4s ease infinite;"></div>';
    }
    h += '</div><style>@keyframes sk-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}</style>';
    return h;
  }

  function kpi(color, label, value, sub) {
    return '<div class="sk-kpi" style="border-top:4px solid ' + color
      + ';background:#111827;border-radius:12px;padding:14px 16px;">'
      + '<div style="font-size:11.5px;color:#64748b;margin-bottom:5px;">' + label + '</div>'
      + '<div style="font-size:20px;font-weight:700;color:#e2e8f0;font-variant-numeric:tabular-nums;">' + value + '</div>'
      + (sub ? '<div style="font-size:11px;color:#64748b;margin-top:2px;">' + sub + '</div>' : '')
      + '</div>';
  }

  function badge(text, color) {
    color = color || '#64748b';
    return '<span style="background:' + color + '1a;color:' + color
      + ';border:1px solid ' + color + '33;border-radius:999px;padding:3px 10px;'
      + 'font-size:11.5px;font-weight:600;">' + text + '</span>';
  }

  function emptyState(icon, title, desc) {
    return '<div style="text-align:center;padding:48px 24px;color:#64748b;">'
      + '<div style="font-size:40px;margin-bottom:12px;">' + icon + '</div>'
      + '<div style="font-size:14px;color:#94a3b8;font-weight:600;margin-bottom:6px;">' + title + '</div>'
      + (desc ? '<div style="font-size:12.5px;">' + desc + '</div>' : '')
      + '</div>';
  }

  function alertBanner(alerts) {
    if (!alerts || !alerts.length) return '';
    var h = '<div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);'
          + 'border-radius:10px;padding:12px 15px;margin-bottom:14px;">';
    for (var i = 0; i < alerts.length; i++) {
      var a = alerts[i];
      var c = a.level === 'error' ? '#ef4444' : '#f59e0b';
      h += '<div style="color:' + c + ';font-size:12.5px;padding:2px 0;">'
         + '&#x25CF; ' + (a.message || String(a)) + '</div>';
    }
    h += '</div>';
    return h;
  }

  /* ─── CSS c\u1ea7n thi\u1ebft ─────────────────────────────────────────────── */
  function _injectCss() {
    if (document.getElementById('sk-ui-css')) return;
    var s = document.createElement('style');
    s.id  = 'sk-ui-css';
    s.textContent = [
      '.sk-g5{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;}',
      '@media(max-width:1024px){.sk-g5{grid-template-columns:repeat(3,1fr);}}',
      '@media(max-width:640px){.sk-g5{grid-template-columns:repeat(2,1fr);}}',
      '.sk-panel{background:#111827;border:1px solid #1e293b;border-radius:12px;}',
      '.sk-pt{font-size:14px;font-weight:600;color:#e2e8f0;}',
      '.sk-inp{width:100%;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:9px 12px;color:#e2e8f0;font-size:13px;box-sizing:border-box;outline:none;transition:border-color .15s;}',
      '.sk-inp:focus{border-color:#3b82f6;}',
      '.sk-inp option{background:#0f172a;color:#e2e8f0;}',
      '.sk-btn{background:#3b82f6;color:#fff;border:none;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s,transform .1s;}',
      '.sk-btn:hover{background:#2563eb;}',
      '.sk-btn:active{transform:scale(.97);}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ─── EXPOSE T\u1ea4T C\u1ea2 RA WINDOW ──────────────────────────────────── */
  _injectCss();

  window.api          = api;          /* \u2190 D\u00d2NG QUAN TR\u1eccNG NH\u1ea4T — sk-vehicle.js v\u00e0 m\u1ecdi CDN module d\u00f9ng \u0111\u01b0\u1ee3c */
  window.getContent   = getContent;
  window.fv           = fv;
  window.fd           = fd;
  window.skel         = skel;
  window.kpi          = kpi;
  window.badge        = badge;
  window.emptyState   = emptyState;
  window.alertBanner  = alertBanner;

}());
