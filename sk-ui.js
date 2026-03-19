/**
 * ============================================================
 * SONKHANG ERP v3.5 — sk-ui.js  (Premium + Accordion Menu)
 * UI Helpers: kpi(), skel(), fv(), accordion sidebar, ...
 *
 * Cập nhật v3.5.1:
 *  - Accordion sidebar với tiếng Việt có dấu
 *  - SK_TITLES: nhãn trang chuẩn tiếng Việt
 *  - initSidebar(): tái tạo menu nhóm đóng/mở
 *  - MutationObserver: tự cập nhật tiêu đề topbar
 *  - Giữ nguyên interface: fv, kpi, skel, ...
 * ============================================================
 */

'use strict';

// ── Format số tiền VND ────────────────────────────────────────
function fv(n) {
  var v = Number(n) || 0;
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(1) + 'ty';
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'tr';
  if (!v) return '0\u0111';
  return v.toLocaleString('vi-VN') + '\u0111';
}

// ── Format số nguyên gọn ──────────────────────────────────────
function fn(n) {
  var v = Number(n) || 0;
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return String(v);
}

// ── Format % ─────────────────────────────────────────────────
function fpct(n) {
  var v = Number(n) || 0;
  return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
}

// ── KPI Card Builder ──────────────────────────────────────────
// Interface cũ GIỮ NGUYÊN: kpi(color, lbl, val, sub)
// Thêm opts thứ 5: { trend, trendVal, icon }
function kpi(color, lbl, val, sub, opts) {
  opts = opts || {};
  var trend    = opts.trend    || null;
  var trendVal = opts.trendVal || '';
  var icon     = opts.icon     || '';

  var trendHtml = '';
  if (trend && trendVal) {
    var tc = trend === 'up' ? '#10b981' : '#ef4444';
    var tb = trend === 'up' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
    var ta = trend === 'up' ? '&#8593;' : '&#8595;';
    trendHtml = '<span style="display:inline-flex;align-items:center;gap:3px;'
      + 'background:' + tb + ';color:' + tc + ';'
      + 'font-size:10px;font-weight:700;'
      + 'padding:2px 7px;border-radius:999px;">'
      + ta + ' ' + trendVal + '</span>';
  }

  var iconHtml = icon
    ? '<span style="position:absolute;top:14px;right:16px;'
      + 'font-size:18px;opacity:0.18;pointer-events:none;">' + icon + '</span>'
    : '';

  var borderStyle = 'border-top:3px solid ' + color + ' !important;';
  var glowStyle   = 'box-shadow:0 2px 8px rgba(0,0,0,0.5),'
    + '0 0 0 1px rgba(148,163,184,0.06),'
    + 'inset 0 1px 0 rgba(255,255,255,0.04),'
    + '0 0 24px ' + color + '14;';

  return '<div class="sk-kpi" style="' + borderStyle + glowStyle + '">'
    + iconHtml
    + '<div class="sk-kl">' + lbl + '</div>'
    + '<div class="sk-kv">' + val + '</div>'
    + '<div class="sk-ks" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
    +   '<span>' + sub + '</span>' + trendHtml
    + '</div>'
    + '</div>';
}

// ── Skeleton Loader ───────────────────────────────────────────
function skel() {
  var kpiSkels = '';
  for (var i = 0; i < 5; i++) {
    kpiSkels += '<div class="sk-kpi" style="border-top:3px solid rgba(51,65,85,0.8);">'
      + '<div class="sk-skel" style="height:10px;width:55%;border-radius:6px;margin-bottom:12px;"></div>'
      + '<div class="sk-skel" style="height:24px;width:70%;border-radius:8px;margin-bottom:10px;"></div>'
      + '<div class="sk-skel" style="height:10px;width:40%;border-radius:6px;"></div>'
      + '</div>';
  }
  var panelSkel = '<div class="sk-panel" style="margin-top:16px;">'
    + '<div class="sk-skel" style="height:13px;width:30%;border-radius:6px;margin-bottom:20px;"></div>'
    + '<div style="display:flex;flex-direction:column;gap:10px;">'
    +   '<div class="sk-skel" style="height:38px;border-radius:10px;"></div>'
    +   '<div class="sk-skel" style="height:38px;border-radius:10px;width:90%;"></div>'
    +   '<div class="sk-skel" style="height:38px;border-radius:10px;width:95%;"></div>'
    +   '<div class="sk-skel" style="height:38px;border-radius:10px;width:80%;"></div>'
    + '</div>'
    + '</div>';
  return '<div class="sk-g5" style="margin-bottom:16px;">' + kpiSkels + '</div>' + panelSkel;
}

// ── getContent / setPsOk / setPsLoad / setPsErr ───────────────
function getContent()  { return document.getElementById('sk-content'); }
function setPsOk()     { var e=document.getElementById('sk-ps'); if(e)e.textContent=''; }
function setPsLoad(m)  { var e=document.getElementById('sk-ps'); if(e)e.textContent=m||'\u0110ang t\u1ea3i...'; }
function setPsErr(m)   { var e=document.getElementById('sk-ps'); if(e){e.textContent=m||'L\u1ed7i';e.style.color='#ef4444';} }

// ── panelHeader ───────────────────────────────────────────────
function panelHeader(title, actionLabel, actionOnclick) {
  var a = actionLabel
    ? '<button class="sk-btn" style="padding:6px 14px !important;font-size:12px !important;'
      + 'width:auto !important;border-radius:8px !important;" onclick="' + (actionOnclick||'') + '">'
      + actionLabel + '</button>'
    : '';
  return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">'
    + '<div class="sk-pt">' + title + '</div>' + a + '</div>';
}

// ── emptyState ────────────────────────────────────────────────
function emptyState(icon, title, desc) {
  icon  = icon  || '\uD83D\uDCED';
  title = title || 'Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u';
  desc  = desc  || 'D\u1eef li\u1ec7u s\u1ebd hi\u1ec3n th\u1ecb \u1edf \u0111\u00e2y sau khi \u0111\u01b0\u1ee3c th\u00eam v\u00e0o.';
  return '<div style="display:flex;flex-direction:column;align-items:center;'
    + 'justify-content:center;padding:48px 24px;text-align:center;">'
    + '<div style="font-size:36px;margin-bottom:16px;opacity:0.5;">' + icon + '</div>'
    + '<div style="font-size:14px;font-weight:600;color:#f1f5f9;margin-bottom:8px;">' + title + '</div>'
    + '<div style="font-size:12px;color:#475569;max-width:280px;line-height:1.6;">' + desc + '</div>'
    + '</div>';
}

// ── badge ─────────────────────────────────────────────────────
function badge(text, type) {
  var cm = {
    green:  {bg:'rgba(16,185,129,0.12)',  text:'#34d399', border:'rgba(16,185,129,0.2)'},
    red:    {bg:'rgba(239,68,68,0.12)',   text:'#f87171', border:'rgba(239,68,68,0.2)'},
    yellow: {bg:'rgba(245,158,11,0.12)',  text:'#fbbf24', border:'rgba(245,158,11,0.2)'},
    blue:   {bg:'rgba(59,130,246,0.12)',  text:'#93c5fd', border:'rgba(59,130,246,0.2)'},
    purple: {bg:'rgba(139,92,246,0.12)',  text:'#c4b5fd', border:'rgba(139,92,246,0.2)'},
    gray:   {bg:'rgba(100,116,139,0.12)', text:'#94a3b8', border:'rgba(100,116,139,0.2)'},
    orange: {bg:'rgba(249,115,22,0.12)',  text:'#fdba74', border:'rgba(249,115,22,0.2)'},
  };
  var c = cm[type] || cm.gray;
  return '<span style="display:inline-flex;align-items:center;'
    + 'padding:3px 10px;border-radius:999px;'
    + 'font-size:11px;font-weight:600;letter-spacing:0.02em;'
    + 'background:' + c.bg + ';color:' + c.text + ';'
    + 'box-shadow:0 0 0 1px ' + c.border + ';">' + text + '</span>';
}

// ── statusBadge ───────────────────────────────────────────────
function statusBadge(status) {
  var map = {
    'paid':        ['T\u0110 thanh to\u00e1n', 'green'],
    'pending':     ['Ch\u1edd x\u1eed l\u00fd',     'yellow'],
    'processing':  ['\u0110ang x\u1eed l\u00fd',    'blue'],
    'fulfilled':   ['\u0110\u00e3 giao',       'green'],
    'unfulfilled': ['Ch\u01b0a giao',     'orange'],
    'cancelled':   ['\u0110\u00e3 hu\u1ef7',        'red'],
    'active':      ['Ho\u1ea1t \u0111\u1ed9ng',     'green'],
    'inactive':    ['Ng\u01b0ng HT','gray'],
    'approved':    ['\u0110\u00e3 duy\u1ec7t',      'green'],
    'rejected':    ['T\u1eeb ch\u1ed1i',       'red'],
    'draft':       ['Nh\u00e1p',          'gray'],
    'overdue':     ['Qu\u00e1 h\u1ea1n',       'red'],
    'partial':     ['M\u1ed9t ph\u1ea7n',      'yellow'],
  };
  var e = map[status] || [status, 'gray'];
  return badge(e[0], e[1]);
}

// ── divider ───────────────────────────────────────────────────
function divider() {
  return '<hr style="border:none;border-top:1px solid rgba(51,65,85,0.5);margin:16px 0;">';
}

// ── statRow ───────────────────────────────────────────────────
function statRow(label, value, color) {
  return '<div style="display:flex;align-items:center;justify-content:space-between;'
    + 'padding:10px 0;border-bottom:1px solid rgba(51,65,85,0.4);">'
    + '<span style="font-size:12px;color:#94a3b8;">' + label + '</span>'
    + '<span style="font-size:13px;font-weight:700;color:' + (color||'#94a3b8') + ';">' + value + '</span>'
    + '</div>';
}

// ── btnRow ────────────────────────────────────────────────────
function btnRow(buttons) {
  var html = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">';
  (buttons || []).forEach(function(b) {
    var sm = {
      primary: 'background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;box-shadow:0 2px 12px rgba(59,130,246,0.35);',
      danger:  'background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;box-shadow:0 2px 12px rgba(239,68,68,0.35);',
      ghost:   'background:rgba(51,65,85,0.4);color:#94a3b8;border:1px solid rgba(51,65,85,0.8);',
    };
    var s = sm[b.type || 'ghost'] || sm.ghost;
    html += '<button onclick="' + (b.onclick||'') + '" style="'
      + 'padding:8px 16px;border-radius:10px;border:none;cursor:pointer;'
      + 'font-size:12px;font-weight:600;' + s + '">' + b.label + '</button>';
  });
  return html + '</div>';
}

// ── miniLoader ────────────────────────────────────────────────
function miniLoader() {
  return '<div style="display:flex;align-items:center;justify-content:center;'
    + 'padding:32px 16px;gap:12px;">'
    + '<div style="width:20px;height:20px;border-radius:50%;'
    +   'border:2px solid rgba(59,130,246,0.2);border-top-color:#3b82f6;'
    +   'animation:sk-spin 0.7s linear infinite;"></div>'
    + '<span style="font-size:12px;color:#475569;">\u0110ang t\u1ea3i...</span>'
    + '</div>';
}

// ── errorState / infoState / successState ─────────────────────
function errorState(msg) {
  return '<div style="display:flex;align-items:center;gap:10px;'
    + 'padding:14px 16px;border-radius:12px;margin:8px 0;'
    + 'background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.15);">'
    + '<span style="font-size:16px;">&#9888;</span>'
    + '<span style="font-size:12px;color:#f87171;">' + (msg||'\u0110\u00e3 x\u1ea3y ra l\u1ed7i') + '</span>'
    + '</div>';
}
function infoState(msg) {
  return '<div style="display:flex;align-items:center;gap:10px;'
    + 'padding:14px 16px;border-radius:12px;margin:8px 0;'
    + 'background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.15);">'
    + '<span style="font-size:14px;">&#9432;</span>'
    + '<span style="font-size:12px;color:#93c5fd;">' + (msg||'Th\u00f4ng tin') + '</span>'
    + '</div>';
}
function successState(msg) {
  return '<div style="display:flex;align-items:center;gap:10px;'
    + 'padding:14px 16px;border-radius:12px;margin:8px 0;'
    + 'background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15);">'
    + '<span style="font-size:14px;">&#10003;</span>'
    + '<span style="font-size:12px;color:#34d399;">' + (msg||'Th\u00e0nh c\u00f4ng') + '</span>'
    + '</div>';
}

// ── sectionTitle ──────────────────────────────────────────────
function sectionTitle(title, sub) {
  return '<div style="margin-bottom:20px;">'
    + '<div style="font-size:16px;font-weight:700;color:#f1f5f9;">' + title + '</div>'
    + (sub ? '<div style="font-size:12px;color:#475569;margin-top:4px;">' + sub + '</div>' : '')
    + '</div>';
}

// ── grid2 / grid3 ─────────────────────────────────────────────
function grid2(left, right, gap) {
  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:' + (gap||14) + 'px;">'
    + left + right + '</div>';
}
function grid3(a, b, c, gap) {
  return '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:' + (gap||14) + 'px;">'
    + a + b + c + '</div>';
}

// ── kpiRow ────────────────────────────────────────────────────
function kpiRow(items) {
  var n = items.length;
  var html = '<div style="display:grid;grid-template-columns:repeat(' + n + ',1fr);gap:12px;margin-bottom:16px;">';
  items.forEach(function(it) {
    html += kpi(it.color, it.label, it.value, it.sub||'', it.opts);
  });
  return html + '</div>';
}

// ── financeMini ───────────────────────────────────────────────
function financeMini(thu, chi, loiNhuan) {
  var pos = (loiNhuan >= 0);
  return '<div style="display:flex;flex-direction:column;gap:6px;padding:12px;">'
    + statRow('Thu', fv(thu), '#10b981')
    + statRow('Chi', fv(chi), '#ef4444')
    + '<div style="display:flex;align-items:center;justify-content:space-between;'
    +   'padding:10px 0;border-top:2px solid rgba(51,65,85,0.6);margin-top:4px;">'
    + '<span style="font-size:13px;font-weight:700;color:#f1f5f9;">L\u1ee3i nhu\u1eadn</span>'
    + '<span style="font-size:14px;font-weight:800;color:' + (pos?'#10b981':'#ef4444') + ';">'
    +   (pos?'+':'') + fv(loiNhuan) + '</span>'
    + '</div></div>';
}

// ── progressBar ───────────────────────────────────────────────
function progressBar(label, value, max, color) {
  var pct = max > 0 ? Math.min(Math.round(value / max * 100), 100) : 0;
  color = color || '#3b82f6';
  return '<div style="margin-bottom:10px;">'
    + '<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px;">'
    +   '<span style="color:#94a3b8;">' + label + '</span>'
    +   '<span style="color:#f1f5f9;font-weight:600;">' + pct + '%</span>'
    + '</div>'
    + '<div style="background:rgba(51,65,85,0.6);border-radius:999px;height:6px;">'
    +   '<div style="background:' + color + ';width:' + pct + '%;height:100%;border-radius:999px;'
    +     'transition:width 0.6s ease;"></div>'
    + '</div>'
    + '</div>';
}

// ── avatar ────────────────────────────────────────────────────
function avatar(name, size, color) {
  size  = size  || 32;
  color = color || '#1d4ed8';
  var init = (name || '?').charAt(0).toUpperCase();
  return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;'
    + 'background:' + color + ';display:inline-flex;align-items:center;justify-content:center;'
    + 'font-size:' + Math.round(size*0.4) + 'px;font-weight:700;color:#fff;flex-shrink:0;">'
    + init + '</div>';
}

// ── staffRow ──────────────────────────────────────────────────
function staffRow(name, role, value, color) {
  return '<div style="display:flex;align-items:center;gap:10px;'
    + 'padding:8px;background:rgba(30,41,59,0.4);border-radius:10px;margin-bottom:6px;">'
    + avatar(name, 32)
    + '<div style="flex:1;min-width:0;">'
    +   '<div style="font-size:12px;font-weight:600;color:#f1f5f9;">' + name + '</div>'
    +   '<div style="font-size:10px;color:#475569;">' + role + '</div>'
    + '</div>'
    + '<div style="font-size:13px;font-weight:700;color:' + (color||'#94a3b8') + ';">' + value + '</div>'
    + '</div>';
}

// ── tableSimple ───────────────────────────────────────────────
function tableSimple(headers, rows) {
  if (!rows || !rows.length) return emptyState('\uD83D\uDCCB', 'Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u');
  var html = '<div style="overflow-x:auto;margin-top:4px;">'
    + '<table style="width:100%;border-collapse:collapse;">'
    + '<thead><tr>';
  headers.forEach(function(h) {
    html += '<th style="padding:9px 12px;text-align:left;'
      + 'font-size:10px;font-weight:700;text-transform:uppercase;'
      + 'letter-spacing:0.08em;color:#475569;'
      + 'border-bottom:1px solid rgba(51,65,85,0.6);">' + h + '</th>';
  });
  html += '</tr></thead><tbody>';
  rows.forEach(function(row) {
    html += '<tr style="border-bottom:1px solid rgba(30,41,59,0.6);">';
    row.forEach(function(cell) {
      html += '<td style="padding:10px 12px;font-size:12px;color:#94a3b8;">' + cell + '</td>';
    });
    html += '</tr>';
  });
  return html + '</tbody></table></div>';
}

// ── Format date / datetime / relative time / truncate ─────────
function fd(s) {
  if (!s) return '\u2014';
  try { return new Date(s).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}); }
  catch(e) { return s; }
}
function fdt(s) {
  if (!s) return '\u2014';
  try { return new Date(s).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
  catch(e) { return s; }
}
function fago(s) {
  if (!s) return '\u2014';
  try {
    var d = Date.now() - new Date(s).getTime();
    var m = Math.floor(d/60000);
    if (m<1)  return 'V\u1eeba xong';
    if (m<60) return m + ' ph\u00fat tr\u01b0\u1edbc';
    var h = Math.floor(m/60);
    if (h<24) return h + ' gi\u1edd tr\u01b0\u1edbc';
    var day = Math.floor(h/24);
    if (day<30) return day + ' ng\u00e0y tr\u01b0\u1edbc';
    return fd(s);
  } catch(e) { return s; }
}
function trunc(str, len) {
  len = len || 40;
  if (!str) return '\u2014';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

// ══════════════════════════════════════════════════════════════
// ACCORDION SIDEBAR
// ══════════════════════════════════════════════════════════════

// ── Tiêu đề trang (tiếng Việt có dấu) ────────────────────────
window.SK_TITLES = {
  'dashboard':     'Dashboard',
  'ban-hang':      'B\u00e1n h\u00e0ng',
  'mua-hang':      'Mua h\u00e0ng',
  'kho':           'Kho h\u00e0ng',
  'tai-chinh':     'Thu chi',
  'nhan-su':       'Nh\u00e2n s\u1ef1',
  'phuong-tien':   'Ph\u01b0\u01a1ng ti\u1ec7n',
  'tien-ich':      'Ti\u1ec7n \u00edch',
  'crm':           'CRM Kh\u00e1ch h\u00e0ng',
  'bao-cao':       'B\u00e1o c\u00e1o b\u00e1n h\u00e0ng',
  'nha-cung-cap':  'Nh\u00e0 cung c\u1ea5p',
  'don-hang-mua':  '\u0110\u01a1n h\u00e0ng mua',
  'hoa-don-ban':   'H\u00f3a \u0111\u01a1n b\u00e1n',
  'bao-cao-tc':    'B\u00e1o c\u00e1o t\u00e0i ch\u00ednh',
  'yeu-cau-mua':   'Y\u00eau c\u1ea7u mua',
  'so-cai-kho':    'S\u1ed5 c\u00e1i kho',
  'tien-gui-nh':   'Ti\u1ec1n g\u1eedi ng\u00e2n h\u00e0ng',
  'ke-toan-kho':   'K\u1ebf to\u00e1n kho',
  'chiet-khau':    'Chi\u1ebft kh\u1ea5u KM',
  'cham-cong':     'Ch\u1ea5m c\u00f4ng KPI',
  'ngan-sach':     'Ng\u00e2n s\u00e1ch',
  'dong-goi':      '\u0110\u00f3ng g\u00f3i giao h\u00e0ng',
  'ke-toan-ts':    'K\u1ebf to\u00e1n t\u00e0i s\u1ea3n',
  'ke-toan-luong': 'K\u1ebf to\u00e1n l\u01b0\u01a1ng',
  'pos':           'POS B\u00e1n l\u1ebb',
  'bctc-tong-hop': 'BCTC T\u1ed5ng h\u1ee3p',
  'san-pham':      'Qu\u1ea3n l\u00fd s\u1ea3n ph\u1ea9m',
};

// ── Cấu trúc menu accordion ───────────────────────────────────
window.SK_MENU = [
  {
    key:  'chinh',
    group: 'CH\u00cdNH',         // CHÍNH
    defaultOpen: true,
    items: [
      { route:'dashboard',   label:'Dashboard',             icon:'\uD83D\uDCCA' }
    ]
  },
  {
    key:  'ban-hang',
    group: 'B\u00c1N H\u00c0NG', // BÁN HÀNG
    items: [
      { route:'crm',         label:'CRM Kh\u00e1ch h\u00e0ng',     icon:'\uD83D\uDC65' },
      { route:'bao-cao',     label:'B\u00e1o c\u00e1o b\u00e1n h\u00e0ng',   icon:'\uD83D\uDCC8' },
      { route:'ban-hang',    label:'B\u00e1n h\u00e0ng Sapo',     icon:'\uD83D\uDED2' },
      { route:'pos',         label:'POS B\u00e1n l\u1ebb',          icon:'\uD83D\uDCB3' },
      { route:'hoa-don-ban', label:'H\u00f3a \u0111\u01a1n b\u00e1n',    icon:'\uD83E\uDDFE' },
      { route:'chiet-khau',  label:'Chi\u1ebft kh\u1ea5u KM',     icon:'\uD83C\uDFF7\uFE0F' }
    ]
  },
  {
    key:  'mua-hang',
    group: 'MUA H\u00c0NG',      // MUA HÀNG
    items: [
      { route:'nha-cung-cap', label:'Nh\u00e0 cung c\u1ea5p',    icon:'\uD83C\uDFED' },
      { route:'yeu-cau-mua',  label:'Y\u00eau c\u1ea7u mua',     icon:'\uD83D\uDCCB' },
      { route:'don-hang-mua', label:'\u0110\u01a1n h\u00e0ng mua', icon:'\uD83D\uDCE6' },
      { route:'mua-hang',     label:'L\u1ecbch s\u1eed mua',      icon:'\uD83D\uDCDC' }
    ]
  },
  {
    key:  'kho',
    group: 'KHO & GIAO H\u00c0NG', // KHO & GIAO HÀNG
    items: [
      { route:'kho',          label:'Kho h\u00e0ng',            icon:'\uD83C\uDFEA' },
      { route:'san-pham',     label:'Qu\u1ea3n l\u00fd SP',     icon:'\uD83C\uDFF7' },
      { route:'so-cai-kho',   label:'S\u1ed5 c\u00e1i kho',    icon:'\uD83D\uDCD2' },
      { route:'dong-goi',     label:'\u0110\u00f3ng g\u00f3i GH', icon:'\uD83D\uDE9A' },
      { route:'phuong-tien',  label:'Ph\u01b0\u01a1ng ti\u1ec7n', icon:'\uD83D\uDE97' }
    ]
  },
  {
    key:  'ke-toan',
    group: 'K\u1ebe TO\u00c1N',   // KẾ TOÁN
    items: [
      { route:'tai-chinh',     label:'Thu chi',               icon:'\uD83D\uDCB0' },
      { route:'bao-cao-tc',    label:'B\u00e1o c\u00e1o TC',  icon:'\uD83D\uDCCA' },
      { route:'bctc-tong-hop', label:'BCTC T\u1ed5ng h\u1ee3p', icon:'\uD83D\uDCC4' },
      { route:'ke-toan-kho',   label:'K\u1ebf to\u00e1n kho',  icon:'\uD83D\uDCE6' },
      { route:'ke-toan-ts',    label:'K\u1ebf to\u00e1n t\u00e0i s\u1ea3n', icon:'\uD83C\uDFD7\uFE0F' },
      { route:'ke-toan-luong', label:'K\u1ebf to\u00e1n l\u01b0\u01a1ng', icon:'\uD83D\uDCBC' },
      { route:'tien-gui-nh',   label:'Ti\u1ec1n g\u1eedi NH',  icon:'\uD83C\uDFE6' },
      { route:'ngan-sach',     label:'Ng\u00e2n s\u00e1ch',   icon:'\uD83D\uDCC5' }
    ]
  },
  {
    key:  'nhan-su',
    group: 'NH\u00c2N S\u1ef0',   // NHÂN SỰ
    items: [
      { route:'nhan-su',   label:'H\u1ed3 s\u01a1 nh\u00e2n vi\u00ean', icon:'\uD83D\uDC64' },
      { route:'cham-cong', label:'Ch\u1ea5m c\u00f4ng KPI',   icon:'\u2705' }
    ]
  },
  {
    key:  'he-thong',
    group: 'H\u1ec6 TH\u1ed0NG',  // HỆ THỐNG
    items: [
      { route:'tien-ich', label:'Ti\u1ec7n \u00edch',        icon:'\uD83D\uDD27' }
    ]
  }
];

// ── Lấy group chứa route hiện tại ────────────────────────────
function _getGroupForRoute(route) {
  for (var i = 0; i < SK_MENU.length; i++) {
    var grp = SK_MENU[i];
    for (var j = 0; j < grp.items.length; j++) {
      if (grp.items[j].route === route) return grp.key;
    }
  }
  return 'chinh';
}

// ── Khởi tạo Accordion Sidebar ────────────────────────────────
function initSidebar() {
  var nav = document.querySelector('.sk-sb nav');
  if (!nav) return;

  // Lấy route hiện tại
  var m = window.location.pathname.match(/\/p\/([^./]+)/);
  var currentRoute = m ? m[1] : 'dashboard';
  var currentGroup = _getGroupForRoute(currentRoute);

  nav.innerHTML = '';

  SK_MENU.forEach(function(group) {
    var isOpen = group.defaultOpen || group.key === currentGroup;

    // Section header (clickable để toggle)
    var header = document.createElement('div');
    header.className = 'sk-acc-header';
    header.innerHTML =
      '<span class="sk-acc-label">' + group.group + '</span>'
      + '<span class="sk-acc-arrow' + (isOpen ? ' sk-open' : '') + '">&#9658;</span>';

    // Content wrapper
    var content = document.createElement('div');
    content.className = 'sk-acc-content' + (isOpen ? ' sk-open' : '');
    content.setAttribute('data-group', group.key);

    // Nav links
    group.items.forEach(function(item) {
      var a = document.createElement('a');
      a.className = 'sk-na' + (item.route === currentRoute ? ' active' : '');
      a.id = 'n-' + item.route;
      a.href = '/p/' + item.route + '.html';
      a.innerHTML =
        '<span class="sk-na-icon">' + item.icon + '</span>'
        + '<span class="sk-na-label">' + item.label + '</span>';
      content.appendChild(a);
    });

    // Đăng xuất vào group cuối cùng
    if (group.key === 'he-thong') {
      var logout = document.createElement('a');
      logout.className = 'sk-na sk-na-logout';
      logout.id = 'sk-out-btn';
      logout.href = '#';
      logout.innerHTML = '<span class="sk-na-icon">\uD83D\uDEAA</span>'
        + '<span class="sk-na-label">\u0110\u0103ng xu\u1ea5t</span>';
      content.appendChild(logout);
    }

    // Toggle handler
    header.addEventListener('click', function() {
      var opened = content.classList.contains('sk-open');
      content.classList.toggle('sk-open', !opened);
      var arrow = header.querySelector('.sk-acc-arrow');
      if (arrow) arrow.classList.toggle('sk-open', !opened);
    });

    nav.appendChild(header);
    nav.appendChild(content);
  });

  // Version
  var ver = document.createElement('div');
  ver.style.cssText = 'padding:8px 14px;border-top:1px solid rgba(51,65,85,0.3);'
    + 'font-size:9px;color:#334155;';
  ver.textContent = 'v3.5 Premium';
  nav.appendChild(ver);

  // MutationObserver: khi setNav() thêm class active → mở đúng group
  if (typeof MutationObserver !== 'undefined') {
    var obs = new MutationObserver(function(mutations) {
      mutations.forEach(function(mut) {
        var el = mut.target;
        if (el.classList && el.classList.contains('active') && el.classList.contains('sk-na')) {
          var parentContent = el.parentElement;
          if (parentContent && parentContent.classList.contains('sk-acc-content')) {
            // Đóng tất cả group khác (optional: accordion exclusive)
            // Mở group chứa item active
            if (!parentContent.classList.contains('sk-open')) {
              parentContent.classList.add('sk-open');
              var prev = parentContent.previousElementSibling;
              if (prev) {
                var arrow = prev.querySelector('.sk-acc-arrow');
                if (arrow) arrow.classList.add('sk-open');
              }
            }
            // Cập nhật tiêu đề topbar bằng tiếng Việt
            var href = el.getAttribute('href') || '';
            var rm   = href.match(/\/p\/([^./]+)/);
            if (rm && SK_TITLES[rm[1]]) {
              var ptEl = document.getElementById('sk-pt');
              if (ptEl) ptEl.textContent = SK_TITLES[rm[1]];
            }
          }
        }
      });
    });
    var links = nav.querySelectorAll('.sk-na');
    links.forEach(function(lk) {
      obs.observe(lk, { attributes: true, attributeFilter: ['class'] });
    });
  }
}

// ── Patch topbar title sau khi boot() chạy ───────────────────
function _patchPageTitle() {
  var m = window.location.pathname.match(/\/p\/([^./]+)/);
  var key = m ? m[1] : 'dashboard';
  var ptEl = document.getElementById('sk-pt');
  if (ptEl && SK_TITLES[key]) ptEl.textContent = SK_TITLES[key];
}

// ── DOMContentLoaded: khởi tạo sidebar ───────────────────────
(function() {
  function _init() {
    initSidebar();
    // Patch title sau một tick (sau khi IIFE setNav đã chạy)
    setTimeout(_patchPageTitle, 200);
    // Fallback: watch sk-pt changes
    var ptEl = document.getElementById('sk-pt');
    if (ptEl && typeof MutationObserver !== 'undefined') {
      new MutationObserver(function() {
        var mp = window.location.pathname.match(/\/p\/([^./]+)/);
        var k  = mp ? mp[1] : 'dashboard';
        if (SK_TITLES[k] && ptEl.textContent !== SK_TITLES[k]) {
          ptEl.textContent = SK_TITLES[k];
        }
      }).observe(ptEl, { childList: true, characterData: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }
})();

// ── Exports (môi trường module) ───────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fv, fn, fpct, fd, fdt, fago, trunc,
    kpi, skel, kpiRow,
    getContent, setPsOk, setPsLoad, setPsErr,
    panelHeader, emptyState, badge, statusBadge,
    divider, statRow, btnRow, miniLoader,
    errorState, infoState, successState,
    sectionTitle, grid2, grid3,
    financeMini, progressBar,
    avatar, staffRow, tableSimple,
    initSidebar,
    alertBanner,
    buildDashboardAlerts,
    stockAlertSummary,
  };
}


// =============================================================
// DASHBOARD ALERTS & BANNERS
// =============================================================

function alertBanner(alerts) {
  if (!alerts || !alerts.length) return '';
  var colorMap = {
    critical: { bg: 'rgba(239,68,68,0.1)',   border: '#fca5a5', text: '#fca5a5' },
    high:     { bg: 'rgba(249,115,22,0.1)',  border: '#fdba74', text: '#fdba74' },
    medium:   { bg: 'rgba(245,158,11,0.1)',  border: '#fbbf24', text: '#fbbf24' },
    low:      { bg: 'rgba(59,130,246,0.1)',  border: '#93c5fd', text: '#93c5fd' },
    info:     { bg: 'rgba(16,185,129,0.08)', border: '#6ee7b7', text: '#6ee7b7' },
  };
  var html = '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">';
  alerts.forEach(function(a) {
    var c = colorMap[a.level] || colorMap.low;
    var inner = '<span style="font-size:14px;">' + (a.icon || '\u26A0') + '</span>'
      + '<span style="flex:1;font-size:12px;font-weight:600;">' + a.msg + '</span>'
      + '<span style="font-size:11px;opacity:0.6;">\u2192</span>';
    if (a.href && a.href !== '#') {
      html += '<a href="' + a.href + '" style="'
        + 'display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;'
        + 'background:' + c.bg + ';border:1px solid ' + c.border + ';color:' + c.text + ';'
        + 'text-decoration:none;">' + inner + '</a>';
    } else {
      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;'
        + 'background:' + c.bg + ';border:1px solid ' + c.border + ';color:' + c.text + ';">' + inner + '</div>';
    }
  });
  return html + '</div>';
}

function buildDashboardAlerts(data) {
  var alerts = [];
  var inv  = data.inventory || {};
  var sal  = data.sales     || {};
  var fin  = data.finance   || {};

  var expired = Number(inv.expired || 0);
  var red     = Number(inv.critical_red || 0);
  var yellow  = Number(inv.warning_yellow || 0);

  if (expired > 0) alerts.push({ level:'critical', icon:'\uD83D\uDEA8',
    msg: expired + ' l\u00f4 h\u00e0ng \u0111\u00e3 h\u1ebft h\u1ea1n!', href:'/p/kho.html' });
  if (red > 0)     alerts.push({ level:'high',     icon:'\u23F0',
    msg: red + ' l\u00f4 s\u1eafp h\u1ebft h\u1ea1n (d\u01b0\u1edbi 7 ng\u00e0y)', href:'/p/kho.html' });
  if (yellow > 0)  alerts.push({ level:'medium',   icon:'\uD83D\uDCE6',
    msg: yellow + ' l\u00f4 c\u1ea7n ch\u00fa \u00fd (d\u01b0\u1edbi 30 ng\u00e0y)', href:'/p/kho.html' });

  var lowStock = Number(inv.low_stock || inv.hang_thap || 0);
  if (lowStock > 0) alerts.push({ level:'medium', icon:'\uD83D\uDD35',
    msg: lowStock + ' s\u1ea3n ph\u1ea9m t\u1ed3n kho d\u01b0\u1edbi m\u1ee9c an to\u00e0n', href:'/p/san-pham.html' });

  var unfulfilled = Number(sal.unfulfilled || 0);
  if (unfulfilled >= 10) alerts.push({ level:'high',   icon:'\uD83D\uDED2',
    msg: unfulfilled + ' \u0111\u01a1n h\u00e0ng ch\u01b0a giao', href:'/p/dong-goi.html' });
  else if (unfulfilled > 0) alerts.push({ level:'low', icon:'\uD83D\uDED2',
    msg: unfulfilled + ' \u0111\u01a1n ch\u01b0a giao', href:'/p/dong-goi.html' });

  var cod = Number(sal.cod_pending || 0);
  if (cod >= 10000000) alerts.push({ level:'medium', icon:'\uD83D\uDCB5',
    msg: 'COD ch\u1edd thu: ' + fv(cod), href:'/p/hoa-don-ban.html' });

  var vehAlerts = Number((data.vehicles && data.vehicles.total_alerts) || data.vehicle_alerts || 0);
  if (vehAlerts > 0) alerts.push({ level:'medium', icon:'&#x1F697;',
    msg: vehAlerts + ' ph\u01b0\u01a1ng ti\u1ec7n c\u1ea7n ki\u1ec3m tra (\u0111\u0103ng ki\u1ec3m / b\u1ea3o hi\u1ec3m)', href:'/p/phuong-tien.html' });

  var balance = Number(fin.balance || 0);
  if (balance < 0) alerts.push({ level:'critical', icon:'\uD83D\uDCC9',
    msg: 'S\u1ed1 d\u01b0 qu\u1ef9 \u00e2m: ' + fv(balance), href:'/p/tai-chinh.html' });

  return alerts;
}

function stockAlertSummary(inv) {
  inv = inv || {};
  var expired  = Number(inv.expired || 0);
  var red      = Number(inv.critical_red || 0);
  var yellow   = Number(inv.warning_yellow || 0);
  var green    = Number(inv.green || 0);
  var low      = Number(inv.low_stock || inv.hang_thap || 0);
  var critical = expired + red;
  var overallColor = critical > 0 ? '#ef4444' : yellow > 0 ? '#f59e0b' : '#10b981';
  var overallIcon  = critical > 0 ? '\uD83D\uDD34' : yellow > 0 ? '\uD83D\uDFE1' : '\uD83D\uDFE2';
  return '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:rgba(15,23,42,0.5);border-radius:10px;">'
    + '<span style="font-size:18px;">' + overallIcon + '</span>'
    + '<div style="flex:1;">'
    +   '<div style="font-size:12px;font-weight:700;color:' + overallColor + ';">'
    +     (critical > 0 ? critical + ' l\u00f4 c\u1ea7n x\u1eed l\u00fd' : '\u0110ang \u1ed5n')
    +   '</div>'
    +   '<div style="font-size:10px;color:#475569;">'
    +     '\u1ea4 v\u00e0ng: ' + yellow + ' \u00b7 \u1eef xanh: ' + green
    +     (low > 0 ? ' \u00b7 D\u01b0\u1edbi min: ' + low : '')
    +   '</div>'
    + '</div>'
    + '</div>';
}
