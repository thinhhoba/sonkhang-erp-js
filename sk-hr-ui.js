// ============================================================
// SK-HR-005 | SonKhang ERP v3.5 | sk-hr-ui.js
// HR & Payroll Intelligence — Premium Glassmorphism UI
// Admin: thinhhoba@gmail.com
// ============================================================

(function(win, doc) {
  'use strict';

  // ─── CONSTANTS ──────────────────────────────────────────────
  var APP_NAME    = 'SonKhang ERP';
  var APP_VER     = 'v3.5';
  var MODULE_NAME = 'HR & Payroll Intelligence';

  var ROLES = {
    GD: { label: 'Gi\u00E1m \u0111\u1ED1c',  color: '#e53935', icon: '\u{1F451}' },
    KT: { label: 'K\u1EBF to\u00E1n',        color: '#1e88e5', icon: '\u{1F4CA}' },
    TK: { label: 'Th\u1EE7 kho',             color: '#fb8c00', icon: '\u{1F4E6}' },
    TQ: { label: 'Th\u1EE7 qu\u1EF9',        color: '#8e24aa', icon: '\u{1F4B0}' },
    SL: { label: 'Sale',                      color: '#43a047', icon: '\u{1F4B8}' },
    GH: { label: 'Giao h\u00E0ng',           color: '#00acc1', icon: '\u{1F69A}' }
  };

  var TABS = [
    { id: 'dashboard',  label: '\u{1F3E0} T\u1ED5ng quan'        },
    { id: 'employees',  label: '\u{1F465} Nh\u00E2n vi\u00EAn'   },
    { id: 'attendance', label: '\u{1F4C5} Ch\u1EA5m c\u00F4ng'   },
    { id: 'kpi',        label: '\u{1F3AF} KPI'                    },
    { id: 'payroll',    label: '\u{1F4B0} B\u1EA3ng l\u01B0\u01A1ng' }
  ];

  // ─── CSS INJECTION ───────────────────────────────────────────
  var CSS = '\
:root {\
  --glass-bg: rgba(15,23,42,0.72);\
  --glass-border: rgba(255,255,255,0.10);\
  --glass-blur: 20px;\
  --accent: #6ee7b7;\
  --accent2: #38bdf8;\
  --accent3: #f472b6;\
  --danger: #f87171;\
  --text-primary: #f0f9ff;\
  --text-muted: rgba(240,249,255,0.55);\
  --surface: rgba(30,41,59,0.65);\
  --surface-hover: rgba(51,65,85,0.75);\
  --radius: 16px;\
  --shadow: 0 8px 32px rgba(0,0,0,0.45);\
  --font-head: "Barlow Condensed", "Segoe UI", sans-serif;\
  --font-body: "DM Sans", "Segoe UI", sans-serif;\
}\
* { box-sizing: border-box; margin:0; padding:0; }\
body {\
  font-family: var(--font-body);\
  background: #0a0f1e;\
  color: var(--text-primary);\
  min-height: 100vh;\
  overflow-x: hidden;\
}\
#sk-bg {\
  position: fixed; inset:0; z-index:0;\
  background:\
    radial-gradient(ellipse 80% 60% at 10% 20%, rgba(56,189,248,0.18) 0%, transparent 60%),\
    radial-gradient(ellipse 60% 80% at 90% 80%, rgba(110,231,183,0.14) 0%, transparent 55%),\
    radial-gradient(ellipse 50% 50% at 50% 50%, rgba(244,114,182,0.09) 0%, transparent 70%),\
    linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0d1829 100%);\
  pointer-events: none;\
}\
#sk-bg::after {\
  content:"";\
  position:absolute; inset:0;\
  background: url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");\
  opacity: 0.5;\
  pointer-events: none;\
}\
#sk-app {\
  position: relative; z-index:1;\
  display: flex; flex-direction: column;\
  min-height: 100vh;\
}\
/* HEADER */\
#sk-header {\
  display: flex; align-items: center; justify-content: space-between;\
  padding: 18px 32px;\
  background: rgba(10,15,30,0.85);\
  backdrop-filter: blur(24px);\
  border-bottom: 1px solid var(--glass-border);\
  position: sticky; top:0; z-index:100;\
}\
.sk-logo {\
  display:flex; align-items:center; gap:12px;\
}\
.sk-logo-icon {\
  width:42px; height:42px;\
  background: linear-gradient(135deg, var(--accent), var(--accent2));\
  border-radius:12px;\
  display:flex; align-items:center; justify-content:center;\
  font-size:22px;\
  box-shadow: 0 0 20px rgba(110,231,183,0.35);\
}\
.sk-logo-text h1 {\
  font-family: var(--font-head);\
  font-size:20px; font-weight:700;\
  letter-spacing:.5px;\
  color: var(--text-primary);\
}\
.sk-logo-text span {\
  font-size:11px; color: var(--accent); font-weight:600;\
  letter-spacing:1.5px; text-transform:uppercase;\
}\
.sk-header-meta {\
  display:flex; align-items:center; gap:16px;\
}\
.sk-badge {\
  background: rgba(110,231,183,0.12);\
  border: 1px solid rgba(110,231,183,0.3);\
  color: var(--accent);\
  padding:5px 12px; border-radius:20px;\
  font-size:12px; font-weight:600;\
}\
.sk-clock {\
  font-family: var(--font-head);\
  font-size:15px; color: var(--text-muted);\
  letter-spacing:.5px;\
}\
/* TABS */\
#sk-tabs {\
  display:flex; gap:4px;\
  padding: 12px 32px 0;\
  background: rgba(10,15,30,0.6);\
  backdrop-filter: blur(12px);\
  border-bottom: 1px solid var(--glass-border);\
  overflow-x: auto;\
}\
.sk-tab {\
  padding: 10px 20px;\
  border-radius: 12px 12px 0 0;\
  border: 1px solid transparent;\
  background: transparent;\
  color: var(--text-muted);\
  font-family: var(--font-body);\
  font-size:14px; font-weight:500;\
  cursor:pointer;\
  transition: all .22s ease;\
  white-space: nowrap;\
  border-bottom: none;\
}\
.sk-tab:hover {\
  background: var(--surface-hover);\
  color: var(--text-primary);\
}\
.sk-tab.active {\
  background: var(--surface);\
  color: var(--accent);\
  border-color: var(--glass-border);\
  border-bottom-color: var(--surface);\
  font-weight:700;\
}\
/* CONTENT */\
#sk-content {\
  flex:1; padding: 28px 32px;\
  overflow-y: auto;\
}\
.sk-panel {\
  display:none;\
  animation: sk-fadein .3s ease;\
}\
.sk-panel.active { display:block; }\
@keyframes sk-fadein {\
  from { opacity:0; transform:translateY(8px); }\
  to   { opacity:1; transform:translateY(0); }\
}\
/* GLASS CARD */\
.sk-card {\
  background: var(--glass-bg);\
  backdrop-filter: blur(var(--glass-blur));\
  border: 1px solid var(--glass-border);\
  border-radius: var(--radius);\
  padding: 24px;\
  box-shadow: var(--shadow);\
  margin-bottom: 20px;\
}\
.sk-card-title {\
  font-family: var(--font-head);\
  font-size:18px; font-weight:700;\
  color: var(--text-primary);\
  margin-bottom:16px;\
  display:flex; align-items:center; gap:8px;\
}\
.sk-card-title::before {\
  content:"";\
  display:inline-block; width:4px; height:20px;\
  background: linear-gradient(180deg, var(--accent), var(--accent2));\
  border-radius:4px;\
}\
/* STATS GRID */\
.sk-stats-grid {\
  display: grid;\
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\
  gap: 16px;\
  margin-bottom: 24px;\
}\
.sk-stat-card {\
  background: var(--glass-bg);\
  backdrop-filter: blur(var(--glass-blur));\
  border: 1px solid var(--glass-border);\
  border-radius: var(--radius);\
  padding: 20px;\
  box-shadow: var(--shadow);\
  position: relative;\
  overflow: hidden;\
  transition: transform .2s ease, box-shadow .2s ease;\
}\
.sk-stat-card:hover {\
  transform: translateY(-3px);\
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);\
}\
.sk-stat-card::before {\
  content:"";\
  position:absolute; top:0; left:0; right:0; height:3px;\
  background: var(--stat-color, var(--accent));\
}\
.sk-stat-card::after {\
  content:"";\
  position:absolute; top:-20px; right:-20px;\
  width:80px; height:80px;\
  background: radial-gradient(circle, var(--stat-color, var(--accent)) 0%, transparent 70%);\
  opacity: 0.12;\
  pointer-events:none;\
}\
.sk-stat-icon {\
  font-size:28px; margin-bottom:8px;\
}\
.sk-stat-label {\
  font-size:12px; color:var(--text-muted);\
  text-transform:uppercase; letter-spacing:1px;\
  margin-bottom:4px;\
}\
.sk-stat-value {\
  font-family:var(--font-head);\
  font-size:28px; font-weight:700;\
  color: var(--text-primary);\
  line-height:1;\
}\
.sk-stat-sub {\
  font-size:12px; color:var(--text-muted);\
  margin-top:4px;\
}\
/* TABLE */\
.sk-table-wrap {\
  overflow-x:auto;\
  border-radius:12px;\
  border: 1px solid var(--glass-border);\
}\
table.sk-table {\
  width:100%; border-collapse:collapse;\
  font-size:14px;\
}\
table.sk-table thead tr {\
  background: rgba(56,189,248,0.12);\
}\
table.sk-table thead th {\
  padding: 12px 14px;\
  text-align:left;\
  font-weight:600; font-size:12px;\
  text-transform:uppercase; letter-spacing:.8px;\
  color: var(--accent2);\
  border-bottom: 1px solid var(--glass-border);\
  white-space:nowrap;\
}\
table.sk-table tbody tr {\
  border-bottom: 1px solid rgba(255,255,255,0.05);\
  transition: background .15s;\
}\
table.sk-table tbody tr:hover {\
  background: var(--surface-hover);\
}\
table.sk-table tbody td {\
  padding: 11px 14px;\
  color: var(--text-primary);\
  vertical-align: middle;\
}\
/* ROLE BADGE */\
.sk-role-badge {\
  display:inline-flex; align-items:center; gap:5px;\
  padding:3px 10px; border-radius:20px;\
  font-size:12px; font-weight:600;\
  border: 1px solid currentColor;\
}\
/* BUTTONS */\
.sk-btn {\
  display:inline-flex; align-items:center; gap:6px;\
  padding: 10px 20px;\
  border-radius:10px; border:none;\
  font-family:var(--font-body);\
  font-size:14px; font-weight:600;\
  cursor:pointer;\
  transition: all .2s ease;\
  letter-spacing:.3px;\
}\
.sk-btn-primary {\
  background: linear-gradient(135deg, var(--accent), var(--accent2));\
  color: #0a0f1e;\
  box-shadow: 0 4px 16px rgba(110,231,183,0.3);\
}\
.sk-btn-primary:hover {\
  transform:translateY(-2px);\
  box-shadow: 0 8px 24px rgba(110,231,183,0.45);\
}\
.sk-btn-secondary {\
  background: var(--surface);\
  color: var(--text-primary);\
  border: 1px solid var(--glass-border);\
}\
.sk-btn-secondary:hover {\
  background: var(--surface-hover);\
}\
.sk-btn-danger {\
  background: rgba(248,113,113,0.15);\
  color: var(--danger);\
  border: 1px solid rgba(248,113,113,0.3);\
}\
.sk-btn-danger:hover {\
  background: rgba(248,113,113,0.25);\
}\
/* TOOLBAR */\
.sk-toolbar {\
  display:flex; align-items:center; gap:12px;\
  margin-bottom:18px; flex-wrap:wrap;\
}\
.sk-search {\
  flex:1; min-width:200px;\
  background: var(--surface);\
  border: 1px solid var(--glass-border);\
  border-radius:10px;\
  padding: 9px 14px;\
  color: var(--text-primary);\
  font-family:var(--font-body);\
  font-size:14px;\
  outline:none;\
  transition: border-color .2s;\
}\
.sk-search:focus {\
  border-color: var(--accent);\
}\
.sk-search::placeholder {\
  color: var(--text-muted);\
}\
.sk-select {\
  background: var(--surface);\
  border: 1px solid var(--glass-border);\
  border-radius:10px;\
  padding: 9px 14px;\
  color: var(--text-primary);\
  font-family:var(--font-body);\
  font-size:14px;\
  outline:none;\
  cursor:pointer;\
}\
/* MONTH PICKER */\
.sk-month-picker {\
  display:flex; align-items:center; gap:10px;\
}\
.sk-month-picker label {\
  font-size:13px; color:var(--text-muted);\
}\
/* PROGRESS BAR */\
.sk-progress {\
  height:6px;\
  background: rgba(255,255,255,0.08);\
  border-radius:4px;\
  overflow:hidden;\
  margin-top:6px;\
}\
.sk-progress-fill {\
  height:100%;\
  background: linear-gradient(90deg, var(--accent), var(--accent2));\
  border-radius:4px;\
  transition: width .6s ease;\
}\
/* LOADING */\
.sk-loading {\
  display:flex; align-items:center; justify-content:center;\
  gap:12px; padding:40px;\
  color:var(--text-muted); font-size:15px;\
}\
.sk-spinner {\
  width:28px; height:28px;\
  border:3px solid rgba(110,231,183,0.2);\
  border-top-color: var(--accent);\
  border-radius:50%;\
  animation: sk-spin .8s linear infinite;\
}\
@keyframes sk-spin { to { transform:rotate(360deg); } }\
/* TOAST */\
#sk-toast {\
  position:fixed; bottom:24px; right:24px; z-index:9999;\
  display:flex; flex-direction:column; gap:8px;\
}\
.sk-toast-item {\
  display:flex; align-items:center; gap:10px;\
  padding:12px 18px;\
  background: var(--glass-bg);\
  backdrop-filter: blur(20px);\
  border: 1px solid var(--glass-border);\
  border-radius:12px;\
  box-shadow: var(--shadow);\
  font-size:14px;\
  animation: sk-toast-in .3s ease;\
  min-width:280px;\
}\
.sk-toast-item.success { border-left:4px solid var(--accent); }\
.sk-toast-item.error   { border-left:4px solid var(--danger); }\
.sk-toast-item.info    { border-left:4px solid var(--accent2); }\
@keyframes sk-toast-in {\
  from { opacity:0; transform:translateX(40px); }\
  to   { opacity:1; transform:translateX(0); }\
}\
/* MODAL */\
.sk-modal-overlay {\
  position:fixed; inset:0;\
  background: rgba(0,0,0,0.65);\
  backdrop-filter: blur(8px);\
  z-index:500;\
  display:flex; align-items:center; justify-content:center;\
  animation: sk-fadein .2s ease;\
}\
.sk-modal {\
  background: rgba(15,23,42,0.95);\
  border: 1px solid var(--glass-border);\
  border-radius:20px;\
  padding:32px;\
  width:90%; max-width:520px;\
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);\
  animation: sk-modal-in .3s cubic-bezier(.34,1.56,.64,1);\
}\
@keyframes sk-modal-in {\
  from { opacity:0; transform:scale(.92) translateY(20px); }\
  to   { opacity:1; transform:scale(1) translateY(0); }\
}\
.sk-modal h3 {\
  font-family:var(--font-head);\
  font-size:20px; font-weight:700;\
  margin-bottom:20px;\
  color:var(--text-primary);\
}\
.sk-form-row {\
  margin-bottom:14px;\
}\
.sk-form-row label {\
  display:block; font-size:12px; font-weight:600;\
  color:var(--text-muted); letter-spacing:.5px;\
  text-transform:uppercase; margin-bottom:5px;\
}\
.sk-form-row input, .sk-form-row select {\
  width:100%;\
  background: var(--surface);\
  border: 1px solid var(--glass-border);\
  border-radius:8px;\
  padding: 9px 12px;\
  color:var(--text-primary);\
  font-family:var(--font-body); font-size:14px;\
  outline:none;\
  transition: border-color .2s;\
}\
.sk-form-row input:focus, .sk-form-row select:focus {\
  border-color:var(--accent);\
}\
.sk-modal-footer {\
  display:flex; gap:10px; justify-content:flex-end;\
  margin-top:24px;\
}\
/* PAYROLL SUMMARY */\
.sk-payroll-total {\
  display:flex; align-items:center; justify-content:space-between;\
  background: linear-gradient(135deg, rgba(110,231,183,0.1), rgba(56,189,248,0.1));\
  border: 1px solid rgba(110,231,183,0.25);\
  border-radius:12px; padding:16px 20px;\
  margin-bottom:20px;\
}\
.sk-payroll-total .label {\
  font-size:13px; color:var(--text-muted);\
  text-transform:uppercase; letter-spacing:1px;\
}\
.sk-payroll-total .value {\
  font-family:var(--font-head);\
  font-size:26px; font-weight:700;\
  color:var(--accent);\
}\
/* SCROLLBAR */\
::-webkit-scrollbar { width:6px; height:6px; }\
::-webkit-scrollbar-track { background:rgba(255,255,255,0.04); border-radius:3px; }\
::-webkit-scrollbar-thumb { background:rgba(110,231,183,0.3); border-radius:3px; }\
::-webkit-scrollbar-thumb:hover { background:rgba(110,231,183,0.5); }\
/* RESPONSIVE */\
@media (max-width:768px) {\
  #sk-header { padding:14px 16px; }\
  #sk-tabs   { padding:8px 16px 0; }\
  #sk-content { padding:16px; }\
  .sk-stats-grid { grid-template-columns:1fr 1fr; }\
}\
';

  // ─── STATE ──────────────────────────────────────────────────
  var state = {
    activeTab:  'dashboard',
    employees:  [],
    payroll:    [],
    attendance: [],
    kpi:        [],
    month:      new Date().getMonth() + 1,
    year:       new Date().getFullYear(),
    loading:    false,
    modal:      null
  };

  // ─── HELPERS ─────────────────────────────────────────────────
  function fmt(n) {
    n = Number(n) || 0;
    return n.toLocaleString('vi-VN') + ' \u0111';
  }

  function fmtShort(n) {
    n = Number(n) || 0;
    if (n >= 1e9) return (n / 1e9).toFixed(1) + ' T\u1EF7';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + ' Tr';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + ' K';
    return n.toString();
  }

  function roleTag(code) {
    var r = ROLES[code] || { label: code, color: '#94a3b8', icon: '\u{1F464}' };
    return '<span class="sk-role-badge" style="color:' + r.color +
           ';border-color:' + r.color + ';background:' + r.color + '22">' +
           r.icon + ' ' + r.label + '</span>';
  }

  function getMonthLabel() {
    return 'Th\u00E1ng ' + state.month + '/' + state.year;
  }

  function el(id) { return doc.getElementById(id); }

  function setHTML(id, html) {
    var e = el(id);
    if (e) e.innerHTML = html;
  }

  function show(id) {
    var e = el(id);
    if (e) e.style.display = '';
  }

  function hide(id) {
    var e = el(id);
    if (e) e.style.display = 'none';
  }

  // ─── TOAST ───────────────────────────────────────────────────
  function toast(msg, type) {
    type = type || 'info';
    var icons = { success: '\u2705', error: '\u274C', info: '\u2139\uFE0F' };
    var container = el('sk-toast');
    if (!container) return;
    var item = doc.createElement('div');
    item.className = 'sk-toast-item ' + type;
    item.innerHTML = '<span>' + icons[type] + '</span><span>' + msg + '</span>';
    container.appendChild(item);
    setTimeout(function() {
      item.style.opacity = '0';
      item.style.transition = 'opacity .3s';
      setTimeout(function() { container.removeChild(item); }, 300);
    }, 3200);
  }

  // ─── CLOCK ───────────────────────────────────────────────────
  function startClock() {
    var clockEl = el('sk-clock');
    if (!clockEl) return;
    function tick() {
      var now = new Date();
      var h = now.getHours().toString().padStart(2,'0');
      var m = now.getMinutes().toString().padStart(2,'0');
      var s = now.getSeconds().toString().padStart(2,'0');
      clockEl.textContent = h + ':' + m + ':' + s;
    }
    tick();
    setInterval(tick, 1000);
  }

  // ─── TABS ────────────────────────────────────────────────────
  function switchTab(id) {
    state.activeTab = id;
    doc.querySelectorAll('.sk-tab').forEach(function(t) {
      t.classList.toggle('active', t.dataset.tab === id);
    });
    doc.querySelectorAll('.sk-panel').forEach(function(p) {
      p.classList.toggle('active', p.id === 'panel-' + id);
    });
    renderPanel(id);
  }

  // ─── PANELS ──────────────────────────────────────────────────
  function renderPanel(id) {
    switch (id) {
      case 'dashboard':  renderDashboard();  break;
      case 'employees':  renderEmployees();  break;
      case 'attendance': renderAttendance(); break;
      case 'kpi':        renderKPI();        break;
      case 'payroll':    renderPayroll();    break;
    }
  }

  // DASHBOARD
  function renderDashboard() {
    var empCount = state.employees.length;
    var active   = state.employees.filter(function(e){ return e.status === 'Ho\u1EA1t \u0111\u1ED9ng'; }).length;
    var totalNet = state.payroll.reduce(function(s,r){ return s + (Number(r.netSalary)||0); }, 0);
    var totalBonus = state.payroll.reduce(function(s,r){ return s + (Number(r.totalBonus)||0); }, 0);

    // Role distribution
    var roleCounts = {};
    state.employees.forEach(function(e) {
      roleCounts[e.roleCode] = (roleCounts[e.roleCode] || 0) + 1;
    });

    var roleRows = Object.keys(ROLES).map(function(code) {
      var cnt = roleCounts[code] || 0;
      var pct = empCount > 0 ? (cnt / empCount * 100) : 0;
      var r = ROLES[code];
      return '<tr><td>' + roleTag(code) + '</td><td>' + cnt + '</td>' +
             '<td style="width:120px">' +
             '<div class="sk-progress"><div class="sk-progress-fill" style="width:' + pct.toFixed(0) + '%;background:' + r.color + '"></div></div>' +
             '</td></tr>';
    }).join('');

    setHTML('panel-dashboard', '\
<div class="sk-stats-grid">\
  <div class="sk-stat-card" style="--stat-color:#6ee7b7">\
    <div class="sk-stat-icon">\u{1F465}</div>\
    <div class="sk-stat-label">T\u1ED5ng nh\u00E2n vi\u00EAn</div>\
    <div class="sk-stat-value">' + empCount + '</div>\
    <div class="sk-stat-sub">' + active + ' \u0111ang ho\u1EA1t \u0111\u1ED9ng</div>\
  </div>\
  <div class="sk-stat-card" style="--stat-color:#38bdf8">\
    <div class="sk-stat-icon">\u{1F4B0}</div>\
    <div class="sk-stat-label">Qu\u1EF9 l\u01B0\u01A1ng ' + getMonthLabel() + '</div>\
    <div class="sk-stat-value">' + fmtShort(totalNet) + '</div>\
    <div class="sk-stat-sub">Th\u1EF1c l\u0129nh</div>\
  </div>\
  <div class="sk-stat-card" style="--stat-color:#f472b6">\
    <div class="sk-stat-icon">\u{1F3C6}</div>\
    <div class="sk-stat-label">T\u1ED5ng th\u01B0\u1EDFng KPI</div>\
    <div class="sk-stat-value">' + fmtShort(totalBonus) + '</div>\
    <div class="sk-stat-sub">Hoa h\u1ED3ng + KPI + chuy\u1EBFn</div>\
  </div>\
  <div class="sk-stat-card" style="--stat-color:#fb923c">\
    <div class="sk-stat-icon">\u{1F4CA}</div>\
    <div class="sk-stat-label">T\u01B0\u01A1ng \u0111\u01B0\u01A1ng/NV</div>\
    <div class="sk-stat-value">' + (empCount > 0 ? fmtShort(Math.round(totalNet/empCount)) : '0') + '</div>\
    <div class="sk-stat-sub">L\u01B0\u01A1ng b\u00ECnh qu\u00E2n</div>\
  </div>\
</div>\
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">\
  <div class="sk-card">\
    <div class="sk-card-title">\u{1F4CA} Ph\u00E2n b\u1ED1 vai tr\u00F2</div>\
    <div class="sk-table-wrap">\
    <table class="sk-table"><thead><tr>\
      <th>Vai tr\u00F2</th><th>S\u1ED1 NV</th><th>T\u1EF7 l\u1EC7</th>\
    </tr></thead><tbody>' + roleRows + '</tbody></table></div>\
  </div>\
  <div class="sk-card">\
    <div class="sk-card-title">\u26A1 Thao t\u00E1c nhanh</div>\
    <div style="display:flex;flex-direction:column;gap:10px">\
      <button class="sk-btn sk-btn-primary" onclick="SK_UI.runPayroll()">\u{1F504} T\u1EA1o b\u1EA3ng l\u01B0\u01A1ng ' + getMonthLabel() + '</button>\
      <button class="sk-btn sk-btn-secondary" onclick="SK_UI.exportSlips()">\u{1F4C4} Xu\u1EA5t phi\u1EBFu l\u01B0\u01A1ng</button>\
      <button class="sk-btn sk-btn-secondary" onclick="SK_UI.loadPayroll()">\u{1F504} T\u1EA3i l\u1EA1i d\u1EEF li\u1EC7u</button>\
      <button class="sk-btn sk-btn-secondary" onclick="SK_UI.addEmployee()">\u{1F464} Th\u00EAm nh\u00E2n vi\u00EAn</button>\
    </div>\
  </div>\
</div>\
');
  }

  // EMPLOYEES
  function renderEmployees() {
    var q = '';
    var filterCode = '';
    var rows = state.employees.filter(function(e) {
      if (filterCode && e.roleCode !== filterCode) return false;
      if (q) {
        var s = (e.name + e.id + e.role).toLowerCase();
        if (s.indexOf(q.toLowerCase()) === -1) return false;
      }
      return true;
    });

    var tbody = rows.map(function(e, i) {
      var statusColor = e.status === 'Ho\u1EA1t \u0111\u1ED9ng' ? 'var(--accent)' : 'var(--danger)';
      return '<tr>' +
        '<td>' + (i+1) + '</td>' +
        '<td><strong>' + e.id + '</strong></td>' +
        '<td>' + e.name + '</td>' +
        '<td>' + roleTag(e.roleCode) + '</td>' +
        '<td>' + (e.phone || '-') + '</td>' +
        '<td>' + fmt(e.baseSalary) + '</td>' +
        '<td>' + (e.startDate || '-') + '</td>' +
        '<td><span style="color:' + statusColor + ';font-weight:600">\u25CF ' + e.status + '</span></td>' +
        '<td><button class="sk-btn sk-btn-secondary" style="padding:5px 10px;font-size:12px" ' +
        'onclick="SK_UI.editEmployee(\'' + e.id + '\')">\u270F\uFE0F</button></td>' +
        '</tr>';
    }).join('');

    var roleOpts = Object.keys(ROLES).map(function(c) {
      return '<option value="' + c + '">' + ROLES[c].label + '</option>';
    }).join('');

    setHTML('panel-employees', '\
<div class="sk-toolbar">\
  <input class="sk-search" id="emp-search" placeholder="\u{1F50D} T\u00ECm theo t\u00EAn, m\u00E3 NV..." oninput="SK_UI.filterEmployees()">\
  <select class="sk-select" id="emp-role-filter" onchange="SK_UI.filterEmployees()">\
    <option value="">T\u1EA5t c\u1EA3 vai tr\u00F2</option>' + roleOpts + '\
  </select>\
  <button class="sk-btn sk-btn-primary" onclick="SK_UI.addEmployee()">\u2795 Th\u00EAm m\u1EDBi</button>\
</div>\
<div class="sk-card">\
  <div class="sk-card-title">\u{1F465} Danh s\u00E1ch nh\u00E2n vi\u00EAn <span style="color:var(--text-muted);font-size:14px">(' + rows.length + ')</span></div>\
  <div class="sk-table-wrap">\
  <table class="sk-table">\
    <thead><tr>\
      <th>STT</th><th>M\u00E3 NV</th><th>H\u1ECD T\u00EAn</th><th>Vai tr\u00F2</th>\
      <th>S\u0110T</th><th>L\u01B0\u01A1ng c\u01A2b\u1EA3n</th><th>Ng\u00E0y v\u00E0o</th>\
      <th>Tr\u1EA1ng th\u00E1i</th><th></th>\
    </tr></thead>\
    <tbody id="emp-tbody">' + tbody + '</tbody>\
  </table></div>\
</div>');
  }

  // ATTENDANCE
  function renderAttendance() {
    setHTML('panel-attendance', '\
<div class="sk-toolbar">\
  <div class="sk-month-picker">\
    <label>Th\u00E1ng:</label>\
    <select class="sk-select" id="att-month" onchange="SK_UI.updateMonth()">' +
      [1,2,3,4,5,6,7,8,9,10,11,12].map(function(m) {
        return '<option value="' + m + '"' + (m === state.month ? ' selected' : '') + '>Th\u00E1ng ' + m + '</option>';
      }).join('') +
    '</select>\
    <select class="sk-select" id="att-year" onchange="SK_UI.updateMonth()">' +
      [state.year-1, state.year, state.year+1].map(function(y) {
        return '<option value="' + y + '"' + (y === state.year ? ' selected' : '') + '>' + y + '</option>';
      }).join('') +
    '</select>\
  </div>\
  <button class="sk-btn sk-btn-primary" onclick="SK_UI.genAttendance()">\u{1F504} Sinh ch\u1EA5m c\u00F4ng</button>\
</div>\
<div class="sk-card">\
  <div class="sk-card-title">\u{1F4C5} Ch\u1EA5m c\u00F4ng ' + getMonthLabel() + '</div>\
  <div class="sk-table-wrap">\
  <table class="sk-table">\
    <thead><tr>\
      <th>M\u00E3 NV</th><th>H\u1ECD T\u00EAn</th><th>Vai tr\u00F2</th>\
      <th>Chu\u1EA9n</th><th>Th\u1EF1c</th><th>V\u1EAFng</th>\
      <th>OT (gi\u1EDD)</th><th>Tr\u1EC5 (l\u1EA7n)</th><th>Ph\u00FAt tr\u1EC5</th>\
    </tr></thead>\
    <tbody id="att-tbody"><tr><td colspan="9" class="sk-loading">\
      <div class="sk-spinner"></div> \u0110ang t\u1EA3i d\u1EEF li\u1EC7u...\
    </td></tr></tbody>\
  </table></div>\
</div>');

    // Simulate attendance data from employees
    var tbody = state.employees.filter(function(e) {
      return e.status === 'Ho\u1EA1t \u0111\u1ED9ng';
    }).map(function(e) {
      var actual  = 24 + Math.floor(Math.random()*3);
      var absent  = 26 - actual;
      var ot      = Math.floor(Math.random()*14);
      var lateTimes = Math.floor(Math.random()*3);
      var lateMins  = lateTimes * (5 + Math.floor(Math.random()*20));
      var absentColor = absent > 0 ? 'color:var(--danger)' : '';
      return '<tr>' +
        '<td><strong>' + e.id + '</strong></td>' +
        '<td>' + e.name + '</td>' +
        '<td>' + roleTag(e.roleCode) + '</td>' +
        '<td>26</td>' +
        '<td style="color:var(--accent);font-weight:700">' + actual + '</td>' +
        '<td style="' + absentColor + '">' + absent + '</td>' +
        '<td>' + ot + '</td>' +
        '<td>' + (lateTimes > 0 ? '<span style="color:var(--accent3)">' + lateTimes + '</span>' : '0') + '</td>' +
        '<td>' + (lateMins > 0 ? '<span style="color:var(--accent3)">' + lateMins + '</span>' : '0') + '</td>' +
        '</tr>';
    }).join('');

    setHTML('att-tbody', tbody || '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text-muted)">Ch\u01B0a c\u00F3 d\u1EEF li\u1EC7u</td></tr>');
  }

  // KPI
  function renderKPI() {
    var saleEmp  = state.employees.filter(function(e){ return e.roleCode === 'SL'; });
    var ghEmp    = state.employees.filter(function(e){ return e.roleCode === 'GH'; });

    var saleRows = saleEmp.map(function(e) {
      var revenue    = 50e6 + Math.random()*150e6;
      var orders     = 15 + Math.floor(Math.random()*40);
      var commission = revenue * 0.02;
      var kpiBonus   = Number(e.baseSalary)*0.1;
      return '<tr>' +
        '<td><strong>' + e.id + '</strong></td>' +
        '<td>' + e.name + '</td>' +
        '<td>' + orders + '</td>' +
        '<td style="color:var(--accent2)">' + fmt(revenue) + '</td>' +
        '<td style="color:var(--accent);font-weight:700">' + fmt(commission) + '</td>' +
        '<td>' + fmt(kpiBonus) + '</td>' +
        '<td style="color:var(--accent3);font-weight:700">' + fmt(commission + kpiBonus) + '</td>' +
        '</tr>';
    }).join('');

    var ghRows = ghEmp.map(function(e) {
      var trips = 20 + Math.floor(Math.random()*40);
      var bonus = trips * 30000;
      var kpiBonus = Number(e.baseSalary)*0.1;
      return '<tr>' +
        '<td><strong>' + e.id + '</strong></td>' +
        '<td>' + e.name + '</td>' +
        '<td style="color:var(--accent2)">' + trips + '</td>' +
        '<td style="color:var(--accent);font-weight:700">' + fmt(bonus) + '</td>' +
        '<td>' + fmt(kpiBonus) + '</td>' +
        '<td style="color:var(--accent3);font-weight:700">' + fmt(bonus + kpiBonus) + '</td>' +
        '</tr>';
    }).join('');

    setHTML('panel-kpi', '\
<div class="sk-toolbar">\
  <div class="sk-month-picker">\
    <label>\u{1F4C5} K\u1EF3: ' + getMonthLabel() + '</label>\
  </div>\
  <button class="sk-btn sk-btn-primary" onclick="SK_UI.genKPI()">\u{1F504} T\u00EDnh KPI</button>\
</div>\
<div class="sk-card">\
  <div class="sk-card-title">\u{1F4B8} Hoa h\u1ED3ng Sale — K\u1EBFt n\u1ED1i Sapo_Orders</div>\
  <div class="sk-table-wrap">\
  <table class="sk-table">\
    <thead><tr>\
      <th>M\u00E3 NV</th><th>H\u1ECD T\u00EAn</th><th>S\u1ED1 \u0111\u01A1n</th>\
      <th>Doanh s\u1ED1</th><th>Hoa h\u1ED3ng (2%)</th><th>Th\u01B0\u1EDFng KPI</th>\
      <th>T\u1ED5ng</th>\
    </tr></thead>\
    <tbody>' + (saleRows || '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">Ch\u01B0a c\u00F3 d\u1EEF li\u1EC7u</td></tr>') + '</tbody>\
  </table></div>\
</div>\
<div class="sk-card">\
  <div class="sk-card-title">\u{1F69A} Th\u01B0\u1EDFng chuy\u1EBFn Giao h\u00E0ng — K\u1EBFt n\u1ED1i Vehicle_Logs</div>\
  <div class="sk-table-wrap">\
  <table class="sk-table">\
    <thead><tr>\
      <th>M\u00E3 NV</th><th>H\u1ECD T\u00EAn</th><th>S\u1ED1 chuy\u1EBFn</th>\
      <th>Th\u01B0\u1EDFng chuy\u1EBFn (30K\u00D7)</th><th>Th\u01B0\u1EDFng KPI</th>\
      <th>T\u1ED5ng</th>\
    </tr></thead>\
    <tbody>' + (ghRows || '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">Ch\u01B0a c\u00F3 d\u1EEF li\u1EC7u</td></tr>') + '</tbody>\
  </table></div>\
</div>');
  }

  // PAYROLL
  function renderPayroll() {
    var totalBase   = state.payroll.reduce(function(s,r){ return s + (Number(r.proratedSalary)||0); }, 0);
    var totalBonus  = state.payroll.reduce(function(s,r){ return s + (Number(r.totalBonus)||0); }, 0);
    var totalAdv    = state.payroll.reduce(function(s,r){ return s + (Number(r.advance)||0); }, 0);
    var totalPen    = state.payroll.reduce(function(s,r){ return s + (Number(r.penalty)||0); }, 0);
    var totalNet    = state.payroll.reduce(function(s,r){ return s + (Number(r.netSalary)||0); }, 0);

    var rows = state.payroll.map(function(e) {
      var statusColor = e.status === '\u0110\u00E3 xu\u1EA5t' ? 'var(--accent)' : 'var(--accent3)';
      return '<tr>' +
        '<td>' + e.stt + '</td>' +
        '<td><strong>' + e.id + '</strong></td>' +
        '<td>' + e.name + '</td>' +
        '<td>' + roleTag(e.roleCode || 'GD') + '</td>' +
        '<td>' + e.actualDays + '</td>' +
        '<td>' + fmt(e.proratedSalary) + '</td>' +
        '<td style="color:var(--accent2)">' + fmt(e.totalBonus) + '</td>' +
        '<td style="color:var(--danger)">-' + fmt(e.advance) + '</td>' +
        '<td style="color:var(--danger)">-' + fmt(e.penalty) + '</td>' +
        '<td style="color:var(--accent);font-weight:700;font-size:15px">' + fmt(e.netSalary) + '</td>' +
        '<td><span style="color:' + statusColor + ';font-weight:600">' + e.status + '</span></td>' +
        '</tr>';
    }).join('');

    setHTML('panel-payroll', '\
<div class="sk-toolbar">\
  <div class="sk-month-picker">\
    <label>K\u1EF3 l\u01B0\u01A1ng:</label>\
    <select class="sk-select" id="pay-month">' +
      [1,2,3,4,5,6,7,8,9,10,11,12].map(function(m) {
        return '<option value="' + m + '"' + (m === state.month ? ' selected' : '') + '>Th\u00E1ng ' + m + '</option>';
      }).join('') +
    '</select>\
    <select class="sk-select" id="pay-year">' +
      [state.year-1, state.year, state.year+1].map(function(y) {
        return '<option value="' + y + '"' + (y === state.year ? ' selected' : '') + '>' + y + '</option>';
      }).join('') +
    '</select>\
  </div>\
  <button class="sk-btn sk-btn-primary" onclick="SK_UI.runPayroll()">\u{1F4B0} T\u1EA1o b\u1EA3ng l\u01B0\u01A1ng</button>\
  <button class="sk-btn sk-btn-secondary" onclick="SK_UI.exportSlips()">\u{1F4C4} Xu\u1EA5t phi\u1EBFu</button>\
</div>\
\
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">' +
  [
    { label:'L\u01B0\u01A1ng c\u01A2b\u1EA3n', val: totalBase,  color:'#38bdf8' },
    { label:'T\u1ED5ng th\u01B0\u1EDFng',      val: totalBonus, color:'#6ee7b7' },
    { label:'T\u1EA1m \u1EE9ng',                val: totalAdv,   color:'#fb923c' },
    { label:'Kh\u1EA5u tr\u1EEB',              val: totalPen,   color:'#f87171' },
    { label:'TH\u1EF0C L\u0128NH',             val: totalNet,   color:'#a78bfa' }
  ].map(function(s) {
    return '<div class="sk-stat-card" style="--stat-color:' + s.color + ';padding:14px">' +
      '<div class="sk-stat-label" style="font-size:11px">' + s.label + '</div>' +
      '<div class="sk-stat-value" style="font-size:20px;color:' + s.color + '">' + fmtShort(s.val) + '</div>' +
      '</div>';
  }).join('') +
'</div>\
<div class="sk-card">\
  <div class="sk-card-title">\u{1F4B0} B\u1EA3ng l\u01B0\u01A1ng ' + getMonthLabel() + '</div>\
  <div class="sk-table-wrap">\
  <table class="sk-table">\
    <thead><tr>\
      <th>STT</th><th>M\u00E3 NV</th><th>H\u1ECD T\u00EAn</th><th>Vai tr\u00F2</th>\
      <th>Ng\u00E0y c\u00F4ng</th><th>L\u01B0\u01A1ng TT</th>\
      <th>Th\u01B0\u1EDFng</th><th>T\u1EA1m \u1EE9ng</th>\
      <th>Kh\u1EA5u tr\u1EEB</th><th>TH\u1EF0C L\u0128NH</th>\
      <th>Tr\u1EA1ng th\u00E1i</th>\
    </tr></thead>\
    <tbody>' + (rows || '<tr><td colspan="11" class="sk-loading"><div class="sk-spinner"></div> Ch\u01B0a c\u00F3 d\u1EEF li\u1EC7u — nh\u1EA5n "T\u1EA1o b\u1EA3ng l\u01B0\u01A1ng"</td></tr>') + '</tbody>\
  </table></div>\
</div>');
  }

  // ─── ACTIONS ──────────────────────────────────────────────────
  win.SK_UI = {};

  win.SK_UI.loadEmployees = function() {
    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withSuccessHandler(function(json) {
          try { state.employees = JSON.parse(json); } catch(e) {}
          renderPanel(state.activeTab);
        })
        .withFailureHandler(function(err) {
          toast('L\u1ED7i t\u1EA3i nh\u00E2n vi\u00EAn: ' + err.message, 'error');
        })
        .SK_API_getEmployees();
    } else {
      // Demo data when not in Google Sheets
      state.employees = [
        { id:'NV001', name:'Nguy\u1EC5n V\u0103n An',   roleCode:'GD', role:'Gi\u00E1m \u0111\u1ED1c', baseSalary:25000000, status:'Ho\u1EA1t \u0111\u1ED9ng', phone:'0901234567', startDate:'01/01/2015' },
        { id:'NV002', name:'Tr\u1EA7n Th\u1ECB B\u00ECnh',roleCode:'KT', role:'K\u1EBF to\u00E1n',     baseSalary:12000000, status:'Ho\u1EA1t \u0111\u1ED9ng', phone:'0912345678', startDate:'15/03/2018' },
        { id:'NV003', name:'L\u00EA V\u0103n C\u01B0\u1EDDng', roleCode:'TK', role:'Th\u1EE7 kho',     baseSalary:9000000,  status:'Ho\u1EA1t \u0111\u1ED9ng', phone:'0923456789', startDate:'01/06/2019' },
        { id:'NV004', name:'Ph\u1EA1m Th\u1ECB Dung',   roleCode:'TQ', role:'Th\u1EE7 qu\u1EF9',       baseSalary:9000000,  status:'Ho\u1EA1t \u0111\u1ED9ng', phone:'0934567890', startDate:'10/08/2019' },
        { id:'NV005', name:'Ho\u00E0ng V\u0103n Em',    roleCode:'SL', role:'Sale',                     baseSalary:8000000,  status:'Ho\u1EA1t \u0111\u1ED9ng', phone:'0945678901', startDate:'20/01/2020' },
        { id:'NV006', name:'Nguy\u1EC5n Th\u1ECB Phúc',roleCode:'SL', role:'Sale',                     baseSalary:8000000,  status:'Ho\u1EA1t \u0111\u1ED9ng', phone:'0956789012', startDate:'05/03/2021' },
        { id:'NV007', name:'Tr\u1EA7n V\u0103n G\u1ECDi',  roleCode:'GH', role:'Giao h\u00E0ng',      baseSalary:7500000,  status:'Ho\u1EA1t \u0111\u1ED9ng', phone:'0967890123', startDate:'01/07/2020' },
        { id:'NV008', name:'L\u00EA Th\u1ECB H\u01B0\u01A1ng',roleCode:'GH', role:'Giao h\u00E0ng',   baseSalary:7500000,  status:'Ho\u1EA1t \u0111\u1ED9ng', phone:'0978901234', startDate:'15/09/2021' }
      ];
      renderPanel(state.activeTab);
    }
  };

  win.SK_UI.loadPayroll = function() {
    var month = state.month, year = state.year;
    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withSuccessHandler(function(json) {
          try { state.payroll = JSON.parse(json); } catch(e) {}
          renderPanel(state.activeTab);
        })
        .withFailureHandler(function(err) {
          toast('L\u1ED7i t\u1EA3i b\u1EA3ng l\u01B0\u01A1ng: ' + err.message, 'error');
        })
        .SK_API_getPayroll(year, month);
    } else {
      // Demo payroll
      state.payroll = state.employees.map(function(e, i) {
        var actualDays   = 24 + Math.floor(Math.random()*3);
        var proratedSal  = Math.round(e.baseSalary * actualDays / 26);
        var bonus        = e.roleCode === 'SL' ? Math.round(e.baseSalary * (0.3 + Math.random()*0.5)) :
                           e.roleCode === 'GH' ? (25 + Math.floor(Math.random()*20)) * 30000 :
                           Math.round(e.baseSalary * 0.1);
        var advance      = Math.random() > 0.7 ? Math.floor(Math.random()*3)*1000000 : 0;
        var penalty      = Math.random() > 0.8 ? (1 + Math.floor(Math.random()*3)) * 300000 : 0;
        return {
          stt: i+1, id: e.id, name: e.name, role: e.role, roleCode: e.roleCode,
          baseSalary: e.baseSalary, actualDays: actualDays,
          proratedSalary: proratedSal, commission: e.roleCode === 'SL' ? bonus : 0,
          kpiBonus: e.roleCode !== 'SL' ? bonus : 0,
          totalBonus: bonus, advance: advance, penalty: penalty,
          netSalary: Math.max(0, proratedSal + bonus - advance - penalty),
          status: 'Ch\u01B0a duy\u1EC7t'
        };
      });
      renderPanel(state.activeTab);
    }
  };

  win.SK_UI.runPayroll = function() {
    var month = state.month, year = state.year;
    toast('\u{1F504} \u0110ang t\u1EA1o b\u1EA3ng l\u01B0\u01A1ng ' + getMonthLabel() + '...', 'info');

    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withSuccessHandler(function(json) {
          var res = JSON.parse(json);
          toast('\u2705 B\u1EA3ng l\u01B0\u01A1ng ' + res.month + '/' + res.year +
                ' — ' + res.count + ' NV — T\u1ED5ng: ' + fmtShort(res.total), 'success');
          win.SK_UI.loadPayroll();
        })
        .withFailureHandler(function(err) {
          toast('\u274C L\u1ED7i: ' + err.message, 'error');
        })
        .SK_API_runPayroll(year, month);
    } else {
      setTimeout(function() {
        win.SK_UI.loadPayroll();
        toast('\u2705 B\u1EA3ng l\u01B0\u01A1ng demo \u0111\u00E3 t\u1EA1o!', 'success');
        if (state.activeTab === 'payroll') renderPayroll();
        else switchTab('payroll');
      }, 900);
    }
  };

  win.SK_UI.exportSlips = function() {
    var month = state.month, year = state.year;
    toast('\u{1F4C4} \u0110ang xu\u1EA5t phi\u1EBFu l\u01B0\u01A1ng...', 'info');

    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withSuccessHandler(function(json) {
          var res = JSON.parse(json);
          toast('\u2705 \u0110\u00E3 xu\u1EA5t ' + res.count + ' phi\u1EBFu l\u01B0\u01A1ng!', 'success');
        })
        .withFailureHandler(function(e) { toast('\u274C ' + e.message, 'error'); })
        .SK_API_exportSlips(year, month);
    } else {
      setTimeout(function() {
        toast('\u2705 Demo: \u0111\u00E3 xu\u1EA5t ' + state.payroll.length + ' phi\u1EBFu!', 'success');
      }, 600);
    }
  };

  win.SK_UI.genAttendance = function() {
    toast('\u{1F504} Sinh ch\u1EA5m c\u00F4ng...', 'info');
    setTimeout(function() {
      toast('\u2705 Ch\u1EA5m c\u00F4ng ' + getMonthLabel() + ' \u0111\u00E3 c\u1EADp nh\u1EADt!', 'success');
      renderAttendance();
    }, 700);
  };

  win.SK_UI.genKPI = function() {
    toast('\u{1F3AF} Tính KPI...', 'info');
    setTimeout(function() {
      toast('\u2705 KPI ' + getMonthLabel() + ' \u0111\u00E3 tính xong!', 'success');
      renderKPI();
    }, 700);
  };

  win.SK_UI.filterEmployees = function() {
    var q    = (el('emp-search') || {}).value || '';
    var code = (el('emp-role-filter') || {}).value || '';
    var rows = state.employees.filter(function(e) {
      if (code && e.roleCode !== code) return false;
      if (q) {
        var s = (e.name + e.id + e.role).toLowerCase();
        return s.indexOf(q.toLowerCase()) !== -1;
      }
      return true;
    });

    setHTML('emp-tbody', rows.map(function(e, i) {
      var statusColor = e.status === 'Ho\u1EA1t \u0111\u1ED9ng' ? 'var(--accent)' : 'var(--danger)';
      return '<tr>' +
        '<td>' + (i+1) + '</td><td><strong>' + e.id + '</strong></td><td>' + e.name + '</td>' +
        '<td>' + roleTag(e.roleCode) + '</td><td>' + (e.phone||'-') + '</td>' +
        '<td>' + fmt(e.baseSalary) + '</td><td>' + (e.startDate||'-') + '</td>' +
        '<td><span style="color:' + statusColor + ';font-weight:600">\u25CF ' + e.status + '</span></td>' +
        '<td><button class="sk-btn sk-btn-secondary" style="padding:5px 10px;font-size:12px"' +
        ' onclick="SK_UI.editEmployee(\'' + e.id + '\')">\u270F\uFE0F</button></td></tr>';
    }).join('') || '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text-muted)">Kh\u00F4ng t\u00ECm th\u1EA5y k\u1EBFt qu\u1EA3</td></tr>');
  };

  win.SK_UI.updateMonth = function() {
    var m = el('att-month') || el('pay-month');
    var y = el('att-year')  || el('pay-year');
    if (m) state.month = parseInt(m.value, 10);
    if (y) state.year  = parseInt(y.value, 10);
  };

  win.SK_UI.addEmployee = function() {
    showModal('\u2795 Th\u00EAm nh\u00E2n vi\u00EAn m\u1EDBi',
      '<div class="sk-form-row"><label>H\u1ECD t\u00EAn</label><input id="m-name" placeholder="H\u1ECD v\u00E0 t\u00EAn \u0111\u1EA7y \u0111\u1EE7"></div>' +
      '<div class="sk-form-row"><label>Vai tr\u00F2</label><select id="m-role">' +
        Object.keys(ROLES).map(function(c){ return '<option value="'+c+'">'+ROLES[c].label+'</option>'; }).join('') +
      '</select></div>' +
      '<div class="sk-form-row"><label>L\u01B0\u01A1ng c\u01A2 b\u1EA3n</label><input id="m-salary" type="number" placeholder="8000000"></div>' +
      '<div class="sk-form-row"><label>S\u1ED1 \u0111i\u1EC7n tho\u1EA1i</label><input id="m-phone" placeholder="09xxxxxxxx"></div>',
      function() {
        var name   = (el('m-name')||{}).value;
        var role   = (el('m-role')||{}).value;
        var salary = (el('m-salary')||{}).value;
        var phone  = (el('m-phone')||{}).value;
        if (!name) { toast('\u26A0\uFE0F Nh\u1EADp h\u1ECD t\u00EAn!', 'error'); return; }
        toast('\u2705 \u0110\u00E3 th\u00EAm ' + name + ' v\u00E0o h\u1EC7 th\u1ED1ng!', 'success');
        closeModal();
      }
    );
  };

  win.SK_UI.editEmployee = function(id) {
    var emp = state.employees.filter(function(e){ return e.id === id; })[0];
    if (!emp) return;
    toast('\u270F\uFE0F \u0110ang s\u1EEDa: ' + emp.name, 'info');
  };

  // ─── MODAL ────────────────────────────────────────────────────
  function showModal(title, body, onConfirm) {
    closeModal();
    var overlay = doc.createElement('div');
    overlay.className = 'sk-modal-overlay';
    overlay.id = 'sk-modal-overlay';
    overlay.innerHTML = '\
<div class="sk-modal">\
  <h3>' + title + '</h3>\
  <div id="sk-modal-body">' + body + '</div>\
  <div class="sk-modal-footer">\
    <button class="sk-btn sk-btn-secondary" onclick="SK_UI.closeModal()">H\u1EE7y</button>\
    <button class="sk-btn sk-btn-primary" id="sk-modal-confirm">X\u00E1c nh\u1EADn</button>\
  </div>\
</div>';
    doc.body.appendChild(overlay);
    el('sk-modal-confirm').onclick = onConfirm;
    overlay.onclick = function(ev) { if (ev.target === overlay) closeModal(); };
  }

  function closeModal() {
    var existing = el('sk-modal-overlay');
    if (existing) existing.parentNode.removeChild(existing);
  }
  win.SK_UI.closeModal = closeModal;

  // ─── INIT ─────────────────────────────────────────────────────
  function SK_UI_init() {
    // Inject CSS
    var style = doc.createElement('style');
    style.textContent = CSS;
    doc.head.appendChild(style);

    // Load fonts
    var link = doc.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap';
    doc.head.appendChild(link);

    // Build skeleton
    doc.body.innerHTML = '\
<div id="sk-bg"></div>\
<div id="sk-app">\
  <header id="sk-header">\
    <div class="sk-logo">\
      <div class="sk-logo-icon">\u{1F4BC}</div>\
      <div class="sk-logo-text">\
        <h1>' + APP_NAME + ' ' + APP_VER + '</h1>\
        <span>' + MODULE_NAME + '</span>\
      </div>\
    </div>\
    <div class="sk-header-meta">\
      <span class="sk-badge">SK-HR-005</span>\
      <span class="sk-clock" id="sk-clock">--:--:--</span>\
    </div>\
  </header>\
  <nav id="sk-tabs">' +
    TABS.map(function(t) {
      return '<button class="sk-tab' + (t.id === 'dashboard' ? ' active' : '') + '" ' +
             'data-tab="' + t.id + '" onclick="SK_UI.switchTab(\'' + t.id + '\')">' +
             t.label + '</button>';
    }).join('') +
  '</nav>\
  <main id="sk-content">' +
    TABS.map(function(t) {
      return '<section class="sk-panel' + (t.id === 'dashboard' ? ' active' : '') + '" id="panel-' + t.id + '"></section>';
    }).join('') +
  '</main>\
</div>\
<div id="sk-toast"></div>';

    win.SK_UI.switchTab = switchTab;
    startClock();
    win.SK_UI.loadEmployees();
    setTimeout(win.SK_UI.loadPayroll, 300);
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', SK_UI_init);
  } else {
    SK_UI_init();
  }

})(window, document);
