/**
 * ============================================================
 * SONKHANG ERP v3.5 — sk-ui.js
 * UI Helpers: kpi(), skel(), fv(), and utility builders
 *
 * UPGRADED: Premium UI/UX 2026
 *  - kpi()  → thêm micro-sparkline, trend indicator, glow wrapper
 *  - skel() → skeleton đẹp hơn với shimmer cards
 *  - Thêm helpers mới: kpiRow(), panelHeader(), emptyState(), badge()
 *  - Giữ nguyên interface cũ: fv(), kpi(color, lbl, val, sub)
 * ============================================================
 */

'use strict';

// ── Format số tiền VND ────────────────────────────────────────
function fv(n) {
  var v = Number(n) || 0;
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(1) + 'ty';
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'tr';
  if (!v) return '0d';
  return v.toLocaleString('vi-VN') + 'd';
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

// ── KPI Card Builder (nâng cấp) ───────────────────────────────
// Interface cũ GIỮ NGUYÊN: kpi(color, lbl, val, sub)
// Thêm tham số tùy chọn thứ 5: opts = { trend, trendVal, icon }
function kpi(color, lbl, val, sub, opts) {
  opts = opts || {};
  var trend     = opts.trend || null;    // 'up' | 'down' | null
  var trendVal  = opts.trendVal || '';   // ví dụ '+12%'
  var icon      = opts.icon || '';       // emoji hoặc chuỗi HTML

  // Trend badge HTML
  var trendHtml = '';
  if (trend && trendVal) {
    var trendColor = trend === 'up' ? '#10b981' : '#ef4444';
    var trendBg    = trend === 'up' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
    var trendArrow = trend === 'up' ? '&#8593;' : '&#8595;';
    trendHtml = '<span style="'
      + 'display:inline-flex;align-items:center;gap:3px;'
      + 'background:' + trendBg + ';'
      + 'color:' + trendColor + ';'
      + 'font-size:10px;font-weight:700;'
      + 'padding:2px 7px;border-radius:999px;'
      + 'box-shadow:0 0 0 1px ' + trendColor + '22;'
      + '">' + trendArrow + ' ' + trendVal + '</span>';
  }

  // Icon HTML
  var iconHtml = '';
  if (icon) {
    iconHtml = '<span style="'
      + 'position:absolute;top:14px;right:16px;'
      + 'font-size:18px;opacity:0.18;'
      + 'pointer-events:none;user-select:none;'
      + '">' + icon + '</span>';
  }

  // Border-top dày 3px + glow tương ứng
  var borderStyle  = 'border-top: 3px solid ' + color + ' !important;';
  var glowColor    = color;
  var glowStyle    = 'box-shadow: 0 2px 8px rgba(0,0,0,0.5),'
    + '0 0 0 1px rgba(148,163,184,0.06),'
    + 'inset 0 1px 0 rgba(255,255,255,0.04),'
    + '0 0 24px ' + glowColor + '14;';

  return '<div class="sk-kpi" style="' + borderStyle + glowStyle + '">'
    + iconHtml
    + '<div class="sk-kl">' + lbl + '</div>'
    + '<div class="sk-kv">' + val + '</div>'
    + '<div class="sk-ks" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
    +   '<span>' + sub + '</span>'
    +   trendHtml
    + '</div>'
    + '</div>';
}

// ── Skeleton Loader (nâng cấp) ────────────────────────────────
// Giữ nguyên tên hàm: skel()
function skel() {
  // 5 KPI skeletons + 1 panel skeleton
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

  return '<div class="sk-g5" style="margin-bottom:16px;">' + kpiSkels + '</div>'
    + panelSkel;
}

// ── getContent shorthand ──────────────────────────────────────
function getContent() {
  return document.getElementById('sk-content');
}

// ── setPsOk ───────────────────────────────────────────────────
function setPsOk() {
  var el = document.getElementById('sk-ps');
  if (el) el.textContent = '';
}

// ── setPsLoad ─────────────────────────────────────────────────
function setPsLoad(msg) {
  var el = document.getElementById('sk-ps');
  if (el) el.textContent = msg || 'Đang tải...';
}

// ── setPsErr ──────────────────────────────────────────────────
function setPsErr(msg) {
  var el = document.getElementById('sk-ps');
  if (el) {
    el.textContent = msg || 'Lỗi';
    el.style.color = '#ef4444';
  }
}

// ─────────────────────────────────────────────────────────────
// HELPERS MỚI (không làm vỡ code cũ, chỉ bổ sung)
// ─────────────────────────────────────────────────────────────

// ── Panel Header với action button tùy chọn ──────────────────
function panelHeader(title, actionLabel, actionOnclick) {
  var actionHtml = '';
  if (actionLabel) {
    actionHtml = '<button class="sk-btn" style="'
      + 'padding:6px 14px !important;font-size:12px !important;'
      + 'width:auto !important;border-radius:8px !important;'
      + '" onclick="' + (actionOnclick || '') + '">'
      + actionLabel
      + '</button>';
  }
  return '<div style="'
    + 'display:flex;align-items:center;justify-content:space-between;'
    + 'margin-bottom:16px;'
    + '">'
    + '<div class="sk-pt">' + title + '</div>'
    + actionHtml
    + '</div>';
}

// ── Empty State placeholder ───────────────────────────────────
function emptyState(icon, title, desc) {
  icon  = icon  || '📭';
  title = title || 'Chưa có dữ liệu';
  desc  = desc  || 'Dữ liệu sẽ hiển thị ở đây sau khi được thêm vào.';
  return '<div style="'
    + 'display:flex;flex-direction:column;align-items:center;justify-content:center;'
    + 'padding:48px 24px;text-align:center;'
    + '">'
    + '<div style="font-size:36px;margin-bottom:16px;opacity:0.5;">' + icon + '</div>'
    + '<div style="font-size:14px;font-weight:600;color:#f1f5f9;margin-bottom:8px;">' + title + '</div>'
    + '<div style="font-size:12px;color:#475569;max-width:280px;line-height:1.6;">' + desc + '</div>'
    + '</div>';
}

// ── Badge helper ──────────────────────────────────────────────
// badge('Đã thanh toán', 'green')
function badge(text, type) {
  var colorMap = {
    green:  { bg: 'rgba(16,185,129,0.12)',  text: '#34d399', border: 'rgba(16,185,129,0.2)'  },
    red:    { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.2)'   },
    yellow: { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.2)'  },
    blue:   { bg: 'rgba(59,130,246,0.12)',  text: '#93c5fd', border: 'rgba(59,130,246,0.2)'  },
    purple: { bg: 'rgba(139,92,246,0.12)',  text: '#c4b5fd', border: 'rgba(139,92,246,0.2)'  },
    gray:   { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', border: 'rgba(100,116,139,0.2)' },
    orange: { bg: 'rgba(249,115,22,0.12)',  text: '#fdba74', border: 'rgba(249,115,22,0.2)'  },
  };
  var c = colorMap[type] || colorMap.gray;
  return '<span style="'
    + 'display:inline-flex;align-items:center;'
    + 'padding:3px 10px;border-radius:999px;'
    + 'font-size:11px;font-weight:600;letter-spacing:0.02em;'
    + 'background:' + c.bg + ';'
    + 'color:' + c.text + ';'
    + 'box-shadow:0 0 0 1px ' + c.border + ';'
    + '">' + text + '</span>';
}

// ── Status badge từ keyword ───────────────────────────────────
function statusBadge(status) {
  var map = {
    'paid':        ['Đã thanh toán', 'green'],
    'pending':     ['Chờ xử lý',     'yellow'],
    'processing':  ['Đang xử lý',    'blue'],
    'fulfilled':   ['Đã giao',       'green'],
    'unfulfilled': ['Chưa giao',     'orange'],
    'cancelled':   ['Đã huỷ',        'red'],
    'active':      ['Hoạt động',     'green'],
    'inactive':    ['Ngừng hoạt động','gray'],
    'approved':    ['Đã duyệt',      'green'],
    'rejected':    ['Từ chối',       'red'],
    'draft':       ['Nháp',          'gray'],
    'overdue':     ['Quá hạn',       'red'],
    'partial':     ['Một phần',      'yellow'],
  };
  var entry = map[status] || [status, 'gray'];
  return badge(entry[0], entry[1]);
}

// ── Divider ───────────────────────────────────────────────────
function divider() {
  return '<hr style="border:none;border-top:1px solid rgba(51,65,85,0.5);margin:16px 0;">';
}

// ── Mini stat row (dùng trong panel) ─────────────────────────
// statRow('Tổng đơn', '124', '#3b82f6')
function statRow(label, value, color) {
  color = color || '#94a3b8';
  return '<div style="'
    + 'display:flex;align-items:center;justify-content:space-between;'
    + 'padding:10px 0;border-bottom:1px solid rgba(51,65,85,0.4);'
    + '">'
    + '<span style="font-size:12px;color:#94a3b8;">' + label + '</span>'
    + '<span style="font-size:13px;font-weight:700;color:' + color + ';">' + value + '</span>'
    + '</div>';
}

// ── Action buttons row ────────────────────────────────────────
function btnRow(buttons) {
  // buttons = [{label, onclick, type}]
  // type: 'primary' | 'danger' | 'ghost'
  var html = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">';
  (buttons || []).forEach(function(b) {
    var styleMap = {
      primary: 'background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;box-shadow:0 2px 12px rgba(59,130,246,0.35);',
      danger:  'background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;box-shadow:0 2px 12px rgba(239,68,68,0.35);',
      ghost:   'background:rgba(51,65,85,0.4);color:#94a3b8;border:1px solid rgba(51,65,85,0.8);',
    };
    var s = styleMap[b.type || 'ghost'] || styleMap.ghost;
    html += '<button onclick="' + (b.onclick || '') + '" style="'
      + 'padding:8px 16px;border-radius:10px;border:none;cursor:pointer;'
      + 'font-size:12px;font-weight:600;letter-spacing:0.01em;'
      + 'transition:all 0.25s cubic-bezier(0.4,0,0.2,1);'
      + s
      + '" onmouseover="this.style.transform=\'translateY(-2px)\'" '
      + 'onmouseout="this.style.transform=\'\'"> '
      + b.label
      + '</button>';
  });
  html += '</div>';
  return html;
}

// ── Loading overlay nhỏ trong card ───────────────────────────
function miniLoader() {
  return '<div style="'
    + 'display:flex;align-items:center;justify-content:center;'
    + 'padding:32px 16px;gap:12px;'
    + '">'
    + '<div style="'
    +   'width:20px;height:20px;border-radius:50%;'
    +   'border:2px solid rgba(59,130,246,0.2);'
    +   'border-top-color:#3b82f6;'
    +   'animation:sk-spin 0.7s linear infinite;'
    + '"></div>'
    + '<span style="font-size:12px;color:#475569;">Đang tải...</span>'
    + '</div>';
}

// ── Error state ───────────────────────────────────────────────
function errorState(msg) {
  return '<div style="'
    + 'display:flex;align-items:center;gap:10px;'
    + 'padding:14px 16px;border-radius:12px;margin:8px 0;'
    + 'background:rgba(239,68,68,0.08);'
    + 'border:1px solid rgba(239,68,68,0.15);'
    + '">'
    + '<span style="font-size:16px;">&#9888;</span>'
    + '<span style="font-size:12px;color:#f87171;">' + (msg || 'Đã xảy ra lỗi') + '</span>'
    + '</div>';
}

// ── Info state (xanh dương) ───────────────────────────────────
function infoState(msg) {
  return '<div style="'
    + 'display:flex;align-items:center;gap:10px;'
    + 'padding:14px 16px;border-radius:12px;margin:8px 0;'
    + 'background:rgba(59,130,246,0.08);'
    + 'border:1px solid rgba(59,130,246,0.15);'
    + '">'
    + '<span style="font-size:15px;">&#8505;</span>'
    + '<span style="font-size:12px;color:#93c5fd;">' + (msg || '') + '</span>'
    + '</div>';
}

// ── Success state (xanh lá) ───────────────────────────────────
function successState(msg) {
  return '<div style="'
    + 'display:flex;align-items:center;gap:10px;'
    + 'padding:14px 16px;border-radius:12px;margin:8px 0;'
    + 'background:rgba(16,185,129,0.08);'
    + 'border:1px solid rgba(16,185,129,0.15);'
    + '">'
    + '<span style="font-size:15px;">&#10003;</span>'
    + '<span style="font-size:12px;color:#34d399;">' + (msg || 'Thao tác thành công') + '</span>'
    + '</div>';
}

// ── Section title (giữa các block) ───────────────────────────
function sectionTitle(title, sub) {
  return '<div style="margin:20px 0 12px;">'
    + '<div style="font-size:14px;font-weight:700;color:#f1f5f9;letter-spacing:-0.01em;">' + title + '</div>'
    + (sub ? '<div style="font-size:11px;color:#475569;margin-top:3px;">' + sub + '</div>' : '')
    + '</div>';
}

// ── Two-column grid wrapper ───────────────────────────────────
function grid2(left, right, gap) {
  gap = gap || '14px';
  return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:' + gap + ';">'
    + left + right
    + '</div>';
}

// ── Three-column grid wrapper ─────────────────────────────────
function grid3(a, b, c, gap) {
  gap = gap || '14px';
  return '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:' + gap + ';">'
    + (a||'') + (b||'') + (c||'')
    + '</div>';
}

// ── KPI row builder (5 cột) ───────────────────────────────────
// Nhận array các KPI objects: [{color, lbl, val, sub, opts}]
function kpiRow(items) {
  var html = '<div class="sk-g5" style="margin-bottom:16px;">';
  (items || []).forEach(function(item) {
    html += kpi(item.color, item.lbl, item.val, item.sub, item.opts);
  });
  html += '</div>';
  return html;
}

// ── Số liệu ngang: Tài chính tháng ───────────────────────────
// Dùng trong panel nhỏ
function financeMini(thu, chi, loiNhuan) {
  var color = loiNhuan >= 0 ? '#10b981' : '#ef4444';
  return '<div style="display:flex;flex-direction:column;gap:6px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;">'
    +   '<span style="font-size:11px;color:#94a3b8;">Thu</span>'
    +   '<span style="font-size:13px;font-weight:700;color:#10b981;">' + fv(thu) + '</span>'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;">'
    +   '<span style="font-size:11px;color:#94a3b8;">Chi</span>'
    +   '<span style="font-size:13px;font-weight:700;color:#ef4444;">' + fv(chi) + '</span>'
    + '</div>'
    + '<div style="height:1px;background:rgba(51,65,85,0.6);margin:4px 0;"></div>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;">'
    +   '<span style="font-size:11px;color:#94a3b8;font-weight:600;">Lợi nhuận</span>'
    +   '<span style="font-size:14px;font-weight:800;color:' + color + ';">' + fv(loiNhuan) + '</span>'
    + '</div>'
    + '</div>';
}

// ── Progress bar ──────────────────────────────────────────────
function progressBar(label, value, max, color) {
  color = color || '#3b82f6';
  var pct = max > 0 ? Math.min(100, Math.round(value / max * 100)) : 0;
  return '<div style="margin-bottom:12px;">'
    + '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">'
    +   '<span style="font-size:11px;color:#94a3b8;">' + label + '</span>'
    +   '<span style="font-size:11px;font-weight:700;color:#f1f5f9;">' + pct + '%</span>'
    + '</div>'
    + '<div style="height:5px;background:rgba(30,41,59,0.8);border-radius:999px;overflow:hidden;">'
    +   '<div style="'
    +     'height:100%;width:' + pct + '%;'
    +     'background:linear-gradient(90deg,' + color + ',rgba(255,255,255,0.3));'
    +     'border-radius:999px;'
    +     'box-shadow:0 0 8px ' + color + '66;'
    +     'transition:width 0.6s cubic-bezier(0.4,0,0.2,1);'
    +   '"></div>'
    + '</div>'
    + '</div>';
}

// ── Avatar chữ cái ────────────────────────────────────────────
function avatar(name, size, color) {
  size  = size  || 32;
  color = color || '#3b82f6';
  var initials = (name || '?').split(' ').map(function(w) { return w[0]; }).join('').slice(0,2).toUpperCase();
  return '<div style="'
    + 'width:' + size + 'px;height:' + size + 'px;border-radius:50%;'
    + 'background:' + color + '22;'
    + 'border:1.5px solid ' + color + '44;'
    + 'display:flex;align-items:center;justify-content:center;'
    + 'font-size:' + Math.round(size * 0.38) + 'px;font-weight:700;'
    + 'color:' + color + ';'
    + 'flex-shrink:0;'
    + '">' + initials + '</div>';
}

// ── Staff row (dùng trong bảng nhân sự / top performers) ────
function staffRow(name, role, value, color) {
  color = color || '#3b82f6';
  return '<div style="'
    + 'display:flex;align-items:center;gap:10px;'
    + 'padding:9px 0;border-bottom:1px solid rgba(51,65,85,0.35);'
    + '">'
    + avatar(name, 30, color)
    + '<div style="flex:1;min-width:0;">'
    +   '<div style="font-size:12px;font-weight:600;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + '</div>'
    +   '<div style="font-size:10px;color:#475569;">' + role + '</div>'
    + '</div>'
    + '<div style="font-size:13px;font-weight:700;color:' + color + ';">' + value + '</div>'
    + '</div>';
}

// ── Bảng đơn giản từ array ────────────────────────────────────
// tableSimple(['Tên', 'Số lượng', 'Trạng thái'], [[...], [...]])
function tableSimple(headers, rows) {
  if (!rows || !rows.length) return emptyState('📋', 'Không có dữ liệu');

  var html = '<div style="overflow-x:auto;margin-top:4px;">'
    + '<table style="width:100%;border-collapse:collapse;">'
    + '<thead><tr>';

  headers.forEach(function(h) {
    html += '<th style="'
      + 'padding:9px 12px;text-align:left;'
      + 'font-size:10px;font-weight:700;text-transform:uppercase;'
      + 'letter-spacing:0.08em;color:#475569;'
      + 'border-bottom:1px solid rgba(51,65,85,0.6);'
      + '">' + h + '</th>';
  });

  html += '</tr></thead><tbody>';

  rows.forEach(function(row, ri) {
    html += '<tr style="'
      + 'border-bottom:1px solid rgba(30,41,59,0.6);'
      + 'transition:background 0.12s ease;'
      + '" onmouseover="this.style.background=\'rgba(59,130,246,0.04)\'" '
      + 'onmouseout="this.style.background=\'\'">';
    row.forEach(function(cell) {
      html += '<td style="padding:10px 12px;font-size:12px;color:#94a3b8;">' + cell + '</td>';
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  return html;
}

// ── Format ngày ───────────────────────────────────────────────
function fd(dateStr) {
  if (!dateStr) return '—';
  try {
    var d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
  } catch(e) { return dateStr; }
}

// ── Format datetime ───────────────────────────────────────────
function fdt(dateStr) {
  if (!dateStr) return '—';
  try {
    var d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day:'2-digit', month:'2-digit', year:'numeric',
      hour:'2-digit', minute:'2-digit',
    });
  } catch(e) { return dateStr; }
}

// ── Thời gian tương đối ───────────────────────────────────────
function fago(dateStr) {
  if (!dateStr) return '—';
  try {
    var diff = Date.now() - new Date(dateStr).getTime();
    var m = Math.floor(diff / 60000);
    if (m < 1)  return 'Vừa xong';
    if (m < 60) return m + ' phút trước';
    var h = Math.floor(m / 60);
    if (h < 24) return h + ' giờ trước';
    var d = Math.floor(h / 24);
    if (d < 30) return d + ' ngày trước';
    return fd(dateStr);
  } catch(e) { return dateStr; }
}

// ── Truncate text ─────────────────────────────────────────────
function trunc(str, len) {
  len = len || 40;
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

// ── Exports (nếu dùng trong môi trường module) ────────────────
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
  };
}
