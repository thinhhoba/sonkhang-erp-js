/* ================================================================
 * sk-hrm-ui.js — SonKhang ERP v3.6
 * SK-HRM Sprint 1: Shell + Navigation
 * 20/03/2026
 *
 * RULES: var only, expose window, lazy read window.*, no innerHTML events
 * ================================================================ */
(function () {
  'use strict';

  /* ── State ──────────────────────────────────────────────────── */
  if (!window._hrm) {
    window._hrm = {
      tab       : 'personnel',
      empList   : [],
      attData   : [],
      leaves    : [],
      loading   : false,
      curMonth  : new Date().getMonth() + 1,
      curYear   : new Date().getFullYear()
    };
  }

  /* ── Entry ──────────────────────────────────────────────────── */
  function loadHRM() {
    var ct = window.getContent ? window.getContent() : document.getElementById('sk-ct');
    if (!ct) return;
    _injectHRMCss();
    ct.innerHTML = _hrmShell();
    _hrmNavSwitch('personnel');
  }
  window.loadHRM = loadHRM;
  window.loadNhanSu = loadHRM; /* alias sidebar */

  function loadChamCong() {
    var ct = window.getContent ? window.getContent() : document.getElementById('sk-ct');
    if (!ct) return;
    _injectHRMCss();
    ct.innerHTML = _hrmShell();
    _hrmNavSwitch('attendance');
  }
  window.loadChamCong = loadChamCong;

  /* ── Shell HTML ─────────────────────────────────────────────── */
  function _hrmShell() {
    return '<div id="hrm-root" class="hrm-root fade-in">'
      + '<div class="hrm-header">'
      +   '<div>'
      +     '<h1 class="hrm-title">Qu\u1ea3n tr\u1ecb Nh\u00e2n s\u1ef1</h1>'
      +     '<p class="hrm-sub">SonKhang ERP \u2014 H\u1ec7 th\u1ed1ng HRM</p>'
      +   '</div>'
      +   '<div id="hrm-alerts-badge" style="display:none;"></div>'
      + '</div>'
      + '<div class="hrm-tabbar">'
      +   _navBtn('personnel',  '\ud83d\udc64', 'H\u1ed3 s\u01a1 NV')
      +   _navBtn('attendance', '\ud83d\uddd3',  'Ch\u1ea5m c\u00f4ng')
      +   _navBtn('leave',      '\ud83c\udfe5',  'Ngh\u1ec9 ph\u00e9p')
      + '</div>'
      + '<div id="hrm-content" class="hrm-content"></div>'
      + '</div>';
  }

  function _navBtn(tab, icon, label) {
    return '<button class="hrm-tab" id="hrm-nav-' + tab + '"'
      + ' onclick="_hrmNavSwitch(\'' + tab + '\')">'
      + icon + ' ' + label + '</button>';
  }

  /* ── Nav switch ─────────────────────────────────────────────── */
  function _hrmNavSwitch(tab) {
    window._hrm.tab = tab;
    var tabs = document.querySelectorAll('.hrm-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
    var activeBtn = document.getElementById('hrm-nav-' + tab);
    if (activeBtn) activeBtn.classList.add('active');

    var ct = document.getElementById('hrm-content');
    if (!ct) return;
    ct.innerHTML = '<div class="hrm-loading"><div class="sk-spin" style="width:28px;height:28px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div>';

    setTimeout(function () {
      if (tab === 'personnel'  && typeof window._hrmRenderPersonnel  === 'function') window._hrmRenderPersonnel();
      else if (tab === 'attendance' && typeof window._hrmRenderAttendance === 'function') window._hrmRenderAttendance();
      else if (tab === 'leave' && typeof window._hrmRenderLeave       === 'function') window._hrmRenderLeave();
      else ct.innerHTML = '<div class="hrm-empty">\u26a0\ufe0f Module ' + tab + ' \u0111ang \u0111\u01b0\u1ee3c t\u1ea3i...</div>';
    }, 60);
  }
  window._hrmNavSwitch = _hrmNavSwitch;

  /* ── Toast / helpers dùng chung ─────────────────────────────── */
  function _hrmToast(msg, type) {
    if (typeof window.skToast === 'function') { window.skToast(msg, type || 'ok'); return; }
    var colors = { ok: '#10d68c', error: '#ff4d6d', warn: '#fbbf24' };
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:22px;right:22px;z-index:9999;'
      + 'background:var(--bg2);border:1px solid ' + (colors[type||'ok']||colors.ok) + ';'
      + 'border-radius:12px;padding:12px 18px;font-size:13px;font-weight:600;'
      + 'color:var(--text);box-shadow:0 8px 24px rgba(0,0,0,.5);';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3500);
  }
  window._hrmToast = _hrmToast;

  function _hrmFmtSalary(n) {
    if (!n) return '0\u0111';
    var num = Number(n);
    if (num >= 1e9)  return (num/1e9).toFixed(1)  + ' t\u1ef7';
    if (num >= 1e6)  return (num/1e6).toFixed(1)  + ' tri\u1ec7u';
    if (num >= 1e3)  return (num/1e3).toFixed(0)  + 'K';
    return num + '\u0111';
  }
  window._hrmFmtSalary = _hrmFmtSalary;

  function _hrmConfirm(msg, cb) {
    if (confirm(msg)) cb();
  }
  window._hrmConfirm = _hrmConfirm;

  /* ── CSS ──────────────────────────────────────────────────────── */
  function _injectHRMCss() {
    if (document.getElementById('sk-hrm-css')) return;
    var s = document.createElement('style');
    s.id = 'sk-hrm-css';
    s.textContent = [
      '.hrm-root{animation:fadeInUp .35s ease forwards;}',
      '.hrm-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;}',
      '.hrm-title{font-size:24px;font-weight:900;letter-spacing:-.03em;}',
      '.hrm-sub{font-size:12px;color:var(--text3);margin-top:3px;}',
      '.hrm-tabbar{display:flex;gap:4px;background:var(--bg3);border-radius:10px;padding:4px;margin-bottom:20px;overflow-x:auto;}',
      '.hrm-tab{padding:7px 18px;border-radius:8px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;cursor:pointer;border:none;color:var(--text3);background:transparent;transition:all .2s;white-space:nowrap;}',
      '.hrm-tab.active{background:var(--accent);color:white;box-shadow:0 4px 12px rgba(61,107,255,.4);}',
      '.hrm-tab:hover:not(.active){background:var(--bg4);color:var(--text2);}',
      '.hrm-content{min-height:300px;}',
      '.hrm-loading{display:flex;align-items:center;justify-content:center;padding:60px;}',
      '.hrm-empty{text-align:center;padding:60px;color:var(--text3);font-size:13px;}',
      /* Card NV */
      '.hrm-emp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-top:16px;}',
      '.hrm-emp-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;cursor:pointer;transition:all .2s;}',
      '.hrm-emp-card:hover{border-color:var(--accent);transform:translateY(-1px);box-shadow:0 4px 16px rgba(61,107,255,.15);}',
      '.hrm-av{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff;flex-shrink:0;}',
      '.hrm-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:6px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;}',
      '.hrm-badge-green{background:rgba(16,214,140,.15);color:var(--green);}',
      '.hrm-badge-red{background:rgba(255,77,109,.15);color:var(--red);}',
      '.hrm-badge-blue{background:rgba(61,107,255,.15);color:var(--accent2);}',
      '.hrm-badge-yellow{background:rgba(251,191,36,.15);color:var(--yellow);}',
      /* Modal */
      '.hrm-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(8px);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;}',
      '.hrm-modal{background:var(--bg2);border:1px solid var(--border2);border-radius:20px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;}',
      '.hrm-modal-hd{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;}',
      '.hrm-modal-bd{padding:20px 24px;}',
      '.hrm-modal-ft{padding:14px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px;}',
      '.hrm-close{background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;line-height:1;padding:4px 8px;border-radius:6px;transition:all .15s;}',
      '.hrm-close:hover{background:var(--bg3);color:var(--text);}',
      /* Form */
      '.hrm-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}',
      '.hrm-form-group{display:flex;flex-direction:column;gap:5px;}',
      '.hrm-form-group.full{grid-column:1/-1;}',
      '.hrm-lbl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);}',
      /* Table */
      '.hrm-tbl{width:100%;border-collapse:collapse;}',
      '.hrm-tbl th{background:var(--bg);padding:9px 12px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);border-bottom:1px solid var(--border);text-align:left;}',
      '.hrm-tbl td{padding:10px 12px;border-bottom:1px solid var(--bg3);font-size:12px;color:var(--text2);}',
      '.hrm-tbl tr:hover td{background:var(--bg3);}',
      '.hrm-tbl tr:last-child td{border-bottom:none;}',
      /* Attendance grid */
      '.hrm-att-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 1fr 1.5fr;gap:0;border-bottom:1px solid var(--bg3);}',
      '.hrm-att-row:hover{background:var(--bg3);}',
      '.hrm-att-cell{padding:9px 10px;font-size:12px;color:var(--text2);}',
      '.hrm-att-hd{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);background:var(--bg);padding:8px 10px;border-bottom:1px solid var(--border);}',
      '.hrm-att-input{width:52px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:3px 6px;font-size:12px;color:var(--text);text-align:center;outline:none;}',
      '.hrm-att-input:focus{border-color:var(--accent);}',
      /* KPI cards */
      '.hrm-kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px;}',
      '.hrm-kpi{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;}',
      '.hrm-kpi-lbl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);}',
      '.hrm-kpi-val{font-family:"JetBrains Mono",monospace;font-size:20px;font-weight:700;margin-top:4px;letter-spacing:-.02em;}',
      /* Alert */
      '.hrm-alert{background:rgba(255,77,109,.07);border:1px solid rgba(255,77,109,.25);border-radius:10px;padding:10px 14px;font-size:12px;color:var(--red);margin-bottom:12px;}',
      '.hrm-info{background:rgba(61,107,255,.07);border:1px solid rgba(61,107,255,.2);border-radius:10px;padding:10px 14px;font-size:12px;color:var(--accent2);margin-bottom:12px;}',
      /* Leave tag */
      '.hrm-leave-status{display:inline-flex;padding:2px 8px;border-radius:6px;font-size:9px;font-weight:800;text-transform:uppercase;}',
      '.hrm-ls-cho{background:rgba(251,191,36,.15);color:var(--yellow);}',
      '.hrm-ls-ok{background:rgba(16,214,140,.15);color:var(--green);}',
      '.hrm-ls-tc{background:rgba(255,77,109,.15);color:var(--red);}',
      /* Responsive */
      '@media(max-width:600px){.hrm-form-grid{grid-template-columns:1fr;}.hrm-emp-grid{grid-template-columns:1fr;}.hrm-att-row{grid-template-columns:2fr 1fr 1fr 1fr;}.hrm-att-cell:nth-child(n+5){display:none;}}'
    ].join('');
    document.head.appendChild(s);
  }

})();
