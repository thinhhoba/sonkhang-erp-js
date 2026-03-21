/* ================================================================
// [v5.18.1] 22/03/2026 — Phase 3 complete: filter events, error, loading state
// [v5.18] 22/03/2026 — Phase 3+4: GAS integration + Chart.js charts
// [v5.18-p1] 22/03/2026 — Admin Dashboard Phase 1: Layout Shell
 * sk-admin-dashboard.js  SonKhang ERP — Admin Dashboard
 * Cong ty TNHH Thuc Pham Son Khang
 *
 * PHASE 1: Layout Shell — Sidebar (ERP existing) + Topbar Mini +
 *          4 Summary Cards + Chart placeholders + Table skeleton +
 *          User Activity feed + Latest Updates widgets
 *
 * [ARCH]   Render vao #sk-ct, khong conflict CSS ERP goc
 * [SCOPE]  Phase 1 = Static UI only, KHONG co API calls
 * [CSS]    Scoped vao #sk-admin-dash, dung ERP CSS vars
 * [v5.18-p1] 22/03/2026 — Initial Phase 1 build
 * ================================================================ */
(function () {
'use strict';

/* ── Escape helper (OWASP A03) ──────────────────────────────── */
var _e = function(s){ return String(s||'')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };

/* ── Scoped CSS inject ───────────────────────────────────────── */
function _injectStyles() {
  if (document.getElementById('sk-admin-dash-styles')) return;
  var style = document.createElement('style');
  style.id  = 'sk-admin-dash-styles';
  style.textContent = [
    /* ── Reset scoped ─────────────────────────────────────── */
    '#sk-admin-dash *{box-sizing:border-box;}',
    '#sk-admin-dash{',
    '  --adm-orange:#ff7043;--adm-green:#43a047;',
    '  --adm-red:#e53935;  --adm-teal:#00acc1;',
    '  --adm-orange-bg:rgba(255,112,67,.13);',
    '  --adm-green-bg:rgba(67,160,71,.13);',
    '  --adm-red-bg:rgba(229,57,53,.13);',
    '  --adm-teal-bg:rgba(0,172,193,.13);',
    '  font-family:"Be Vietnam Pro",-apple-system,sans-serif;',
    '  color:var(--text);',
    '}',

    /* ── Topbar mini ───────────────────────────────────────── */
    '#adm-topbar{',
    '  display:flex;align-items:center;justify-content:space-between;',
    '  gap:12px;flex-wrap:wrap;',
    '  padding:0 0 20px;',
    '}',
    '#adm-search-wrap{',
    '  display:flex;align-items:center;gap:8px;',
    '  background:var(--bg2);border:1px solid var(--border2);',
    '  border-radius:10px;padding:7px 14px;flex:1;max-width:360px;',
    '  transition:border-color .2s;',
    '}',
    '#adm-search-wrap:focus-within{border-color:var(--accent2);}',
    '#adm-search-wrap svg{color:var(--text3);flex-shrink:0;}',
    '#adm-search-inp{',
    '  background:none;border:none;outline:none;',
    '  color:var(--text);font-size:12px;font-family:inherit;',
    '  width:100%;',
    '}',
    '#adm-search-inp::placeholder{color:var(--text3);}',
    '.adm-topbar-right{display:flex;align-items:center;gap:10px;}',
    '.adm-filter-btn{',
    '  background:var(--bg2);border:1px solid var(--border2);',
    '  color:var(--text2);border-radius:9px;',
    '  padding:7px 14px;font-size:11px;font-weight:700;',
    '  cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;',
    '  transition:border-color .2s,background .2s;',
    '}',
    '.adm-filter-btn:hover{background:var(--bg3);border-color:var(--accent2);color:var(--accent2);}',
    '.adm-date-badge{',
    '  background:var(--bg3);border:1px solid var(--border);',
    '  color:var(--text3);border-radius:9px;',
    '  padding:7px 12px;font-size:11px;font-weight:600;',
    '  display:flex;align-items:center;gap:6px;',
    '}',

    /* ── Summary Cards ─────────────────────────────────────── */
    '#adm-cards{',
    '  display:grid;',
    '  grid-template-columns:repeat(4,1fr);',
    '  gap:14px;margin-bottom:18px;',
    '}',
    '@media(max-width:1100px){#adm-cards{grid-template-columns:repeat(2,1fr);}}',
    '@media(max-width:600px){#adm-cards{grid-template-columns:1fr;}}',

    '.adm-card{',
    '  border-radius:16px;padding:20px 20px 16px;',
    '  position:relative;overflow:hidden;',
    '  cursor:default;',
    '  transition:transform .18s,box-shadow .18s;',
    '}',
    '.adm-card:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,.35);}',

    /* Card noise overlay */
    '.adm-card::before{',
    '  content:"";position:absolute;inset:0;',
    '  background:url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.06\'/%3E%3C/svg%3E");',
    '  background-size:120px;pointer-events:none;',
    '}',

    '.adm-card-orange{background:linear-gradient(135deg,#ff8f5e 0%,#ff5722 100%);}',
    '.adm-card-green{background:linear-gradient(135deg,#6dd07a 0%,#2e7d32 100%);}',
    '.adm-card-red{background:linear-gradient(135deg,#ef5350 0%,#b71c1c 100%);}',
    '.adm-card-teal{background:linear-gradient(135deg,#4dd0e1 0%,#006064 100%);}',

    '.adm-card-label{',
    '  font-size:12px;font-weight:600;',
    '  color:rgba(255,255,255,.8);letter-spacing:.3px;',
    '  margin-bottom:6px;',
    '}',
    '.adm-card-value{',
    '  font-size:28px;font-weight:900;',
    '  color:#fff;line-height:1;margin-bottom:14px;',
    '}',
    '.adm-card-bars{',
    '  display:flex;align-items:flex-end;gap:4px;',
    '  height:28px;float:right;margin-top:-40px;',
    '}',
    '.adm-bar{',
    '  width:8px;border-radius:3px 3px 0 0;',
    '  background:rgba(255,255,255,.4);',
    '  transition:height .4s;',
    '}',
    '.adm-bar.active{background:rgba(255,255,255,.9);}',
    '.adm-card-footer{',
    '  display:flex;align-items:center;gap:6px;',
    '  color:rgba(255,255,255,.7);font-size:10px;font-weight:600;',
    '  border-top:1px solid rgba(255,255,255,.15);',
    '  padding-top:10px;margin-top:2px;',
    '}',
    '.adm-card-footer svg{width:12px;height:12px;}',

    /* ── Row 2: Charts 2-col ───────────────────────────────── */
    '#adm-row2{',
    '  display:grid;grid-template-columns:2fr 1fr;',
    '  gap:14px;margin-bottom:18px;',
    '}',
    '@media(max-width:900px){#adm-row2{grid-template-columns:1fr;}}',

    '.adm-panel{',
    '  background:var(--bg2);border:1px solid var(--border);',
    '  border-radius:16px;padding:18px 20px;',
    '}',
    '.adm-panel-head{',
    '  display:flex;justify-content:space-between;align-items:flex-start;',
    '  margin-bottom:4px;',
    '}',
    '.adm-panel-title{',
    '  font-size:13px;font-weight:800;color:var(--text);',
    '}',
    '.adm-panel-sub{',
    '  font-size:10px;color:var(--text3);margin-top:2px;',
    '}',
    '.adm-panel-actions{display:flex;gap:6px;align-items:center;}',
    '.adm-icon-btn{',
    '  width:26px;height:26px;border-radius:6px;',
    '  background:var(--bg3);border:1px solid var(--border2);',
    '  color:var(--text3);display:flex;align-items:center;justify-content:center;',
    '  cursor:pointer;font-size:11px;transition:color .15s;',
    '}',
    '.adm-icon-btn:hover{color:var(--text);}',

    /* Chart canvas area */
    '.adm-chart-area{',
    '  height:220px;margin-top:14px;',
    '  display:flex;align-items:center;justify-content:center;',
    '  position:relative;',
    '}',
    '.adm-chart-placeholder{',
    '  width:100%;height:100%;border-radius:10px;',
    '  background:linear-gradient(180deg,var(--bg3) 0%,var(--bg2) 100%);',
    '  display:flex;align-items:center;justify-content:center;',
    '  color:var(--text3);font-size:11px;',
    '}',

    /* Project Risk donut placeholder */
    '#adm-risk-panel{text-align:center;}',
    '.adm-risk-donut{',
    '  width:110px;height:110px;border-radius:50%;',
    '  margin:16px auto 12px;',
    '  background:conic-gradient(',
    '    var(--adm-teal) 0deg 252deg,',
    '    var(--border2) 252deg 360deg',
    '  );',
    '  display:flex;align-items:center;justify-content:center;',
    '  position:relative;box-shadow:0 0 0 12px var(--bg2);',
    '}',
    '.adm-risk-donut::after{',
    '  content:"";position:absolute;',
    '  width:70px;height:70px;border-radius:50%;',
    '  background:var(--bg2);',
    '}',
    '.adm-risk-value{',
    '  position:relative;z-index:1;',
    '  font-size:22px;font-weight:900;color:var(--adm-teal);',
    '}',
    '.adm-risk-label{font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px;}',
    '.adm-risk-link{font-size:11px;color:var(--adm-teal);cursor:pointer;}',
    '.adm-risk-link:hover{text-decoration:underline;}',
    '.adm-risk-meta{',
    '  display:flex;justify-content:space-around;',
    '  margin-top:14px;padding-top:14px;',
    '  border-top:1px solid var(--border);',
    '}',
    '.adm-risk-meta-item{font-size:10px;color:var(--text3);}',
    '.adm-risk-meta-val{font-size:12px;font-weight:800;color:var(--text);margin-top:2px;}',
    '.adm-risk-download{',
    '  width:100%;margin-top:14px;padding:10px;',
    '  background:var(--adm-orange);border:none;border-radius:10px;',
    '  color:#fff;font-size:12px;font-weight:800;',
    '  cursor:pointer;font-family:inherit;',
    '  transition:opacity .2s;',
    '}',
    '.adm-risk-download:hover{opacity:.85;}',

    /* ── Row 3: Table + Activity ───────────────────────────── */
    '#adm-row3{',
    '  display:grid;grid-template-columns:2fr 1fr;',
    '  gap:14px;margin-bottom:18px;',
    '}',
    '@media(max-width:900px){#adm-row3{grid-template-columns:1fr;}}',

    /* Table */
    '.adm-table{width:100%;border-collapse:collapse;font-size:11px;margin-top:14px;}',
    '.adm-table thead tr{border-bottom:2px solid var(--border);}',
    '.adm-table th{',
    '  text-align:left;padding:8px 10px;',
    '  color:var(--text3);font-weight:700;font-size:10px;',
    '  text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;',
    '}',
    '.adm-table th:first-child{padding-left:4px;}',
    '.adm-table td{padding:10px 10px;border-bottom:1px solid var(--border);}',
    '.adm-table td:first-child{padding-left:4px;}',
    '.adm-table tr:last-child td{border-bottom:none;}',
    '.adm-table tr:hover td{background:var(--bg3);}',
    '.adm-table .adm-app-name{font-weight:700;color:var(--text);}',
    '.adm-table .adm-app-sub{font-size:9px;color:var(--text3);margin-top:2px;}',
    '.adm-table .adm-chk{',
    '  width:14px;height:14px;border-radius:4px;',
    '  border:2px solid var(--border2);',
    '  display:inline-block;vertical-align:middle;cursor:pointer;',
    '}',
    '.adm-sparkline{display:inline-flex;align-items:flex-end;gap:2px;height:22px;vertical-align:middle;}',
    '.adm-spark-bar{width:4px;border-radius:2px 2px 0 0;background:var(--accent2);opacity:.6;}',
    '.adm-total{font-weight:800;color:var(--accent2);}',
    '.adm-view-all{',
    '  display:block;text-align:center;',
    '  padding:12px;font-size:11px;font-weight:700;',
    '  color:var(--accent2);cursor:pointer;',
    '  border-top:1px solid var(--border);margin-top:8px;',
    '}',
    '.adm-view-all:hover{background:var(--bg3);}',

    /* User activity */
    '.adm-activity-list{margin-top:14px;display:flex;flex-direction:column;gap:12px;}',
    '.adm-activity-item{display:flex;gap:10px;align-items:flex-start;}',
    '.adm-av{',
    '  width:34px;height:34px;border-radius:50%;flex-shrink:0;',
    '  display:flex;align-items:center;justify-content:center;',
    '  font-size:12px;font-weight:800;color:#fff;',
    '}',
    '.adm-activity-body{flex:1;}',
    '.adm-activity-name{font-size:12px;font-weight:700;color:var(--text);}',
    '.adm-activity-msg{font-size:11px;color:var(--text3);margin-top:1px;line-height:1.4;}',
    '.adm-activity-time{',
    '  font-size:10px;color:var(--text3);margin-top:3px;',
    '  display:flex;align-items:center;gap:4px;',
    '}',

    /* ── Row 4: Updates + Info ─────────────────────────────── */
    '#adm-row4{',
    '  display:grid;grid-template-columns:1fr 1fr 1fr;',
    '  gap:14px;',
    '}',
    '@media(max-width:900px){#adm-row4{grid-template-columns:1fr;}}',

    '.adm-updates-list{margin-top:12px;display:flex;flex-direction:column;gap:14px;}',
    '.adm-update-item{display:flex;gap:12px;align-items:flex-start;}',
    '.adm-update-dot{',
    '  width:32px;height:32px;border-radius:50%;flex-shrink:0;',
    '  display:flex;align-items:center;justify-content:center;font-size:13px;',
    '}',
    '.adm-update-dot-orange{background:var(--adm-orange-bg);}',
    '.adm-update-dot-green{background:var(--adm-green-bg);}',
    '.adm-update-dot-blue{background:rgba(79,111,255,.15);}',
    '.adm-update-age{font-size:10px;color:var(--text3);white-space:nowrap;flex-shrink:0;padding-top:2px;}',
    '.adm-update-title{font-size:12px;font-weight:700;color:var(--text);}',
    '.adm-update-sub{font-size:10px;color:var(--text3);margin-top:1px;}',

    /* Promo card */
    '.adm-promo-card{',
    '  background:linear-gradient(135deg,var(--adm-teal) 0%,#004d40 100%);',
    '  border-radius:16px;padding:20px;',
    '  display:flex;flex-direction:column;justify-content:space-between;',
    '}',
    '.adm-promo-text{',
    '  font-size:15px;font-weight:900;color:#fff;line-height:1.3;margin-bottom:8px;',
    '}',
    '.adm-promo-sub{font-size:11px;color:rgba(255,255,255,.7);}',

    /* Info card */
    '.adm-info-card{}',
    '.adm-info-row{',
    '  display:flex;justify-content:space-between;align-items:center;',
    '  padding:10px 0;border-bottom:1px solid var(--border);',
    '  font-size:12px;',
    '}',
    '.adm-info-row:last-child{border-bottom:none;}',
    '.adm-info-label{color:var(--text3);}',
    '.adm-info-val{font-weight:700;color:var(--text);}',

    /* ── Shimmer skeleton ──────────────────────────────────── */
    '@keyframes adm-shimmer{',
    '  0%{background-position:200% 0;}',
    '  100%{background-position:-200% 0;}',
    '}',
    '.adm-skel{',
    '  border-radius:6px;height:14px;',
    '  background:linear-gradient(90deg,var(--bg3) 25%,var(--bg4,#1a1f2e) 50%,var(--bg3) 75%);',
    '  background-size:200% 100%;',
    '  animation:adm-shimmer 1.5s infinite;',
    '}',

    /* ── Responsive tweaks ─────────────────────────────────── */
    '@media(max-width:768px){',
    '  #adm-row2,#adm-row3,#adm-row4{grid-template-columns:1fr;}',
    '  #adm-cards{grid-template-columns:1fr 1fr;}',
    '  #adm-topbar{flex-direction:column;align-items:stretch;}',
    '  #adm-search-wrap{max-width:none;}',
    '}',
  ].join('\n');
  document.head.appendChild(style);
}

/* ── Bar chart mini SVG inline ───────────────────────────────── */
function _bars(heights, active) {
  var maxH = Math.max.apply(null, heights) || 1;
  var html = '<div class="adm-card-bars">';
  heights.forEach(function(h, i) {
    var pct = Math.round((h / maxH) * 100);
    html += '<div class="adm-bar' + (i === active ? ' active' : '')
      + '" style="height:' + pct + '%;"></div>';
  });
  return html + '</div>';
}

/* ── Sparkline bars ──────────────────────────────────────────── */
function _spark(data, color) {
  var max = Math.max.apply(null, data) || 1;
  var html = '<span class="adm-sparkline">';
  data.forEach(function(v) {
    var h = Math.max(4, Math.round((v / max) * 22));
    html += '<span class="adm-spark-bar" style="height:' + h + 'px;background:'
      + (color || 'var(--accent2)') + ';"></span>';
  });
  return html + '</span>';
}

/* ── Avatar colors ───────────────────────────────────────────── */
var _AV_COLORS = ['#ff7043','#43a047','#1976d2','#8e24aa','#00acc1','#f57c00'];
function _av(name, idx) {
  var c    = _AV_COLORS[idx % _AV_COLORS.length];
  var init = String(name||'?')[0].toUpperCase();
  return '<div class="adm-av" style="background:' + c + ';">' + _e(init) + '</div>';
}

/* ── Clock ───────────────────────────────────────────────────── */
function _nowStr() {
  var d = new Date();
  var h = d.getHours(), m = d.getMinutes();
  return 'update : ' + (h<10?'0'+h:h) + ':' + (m<10?'0'+m:m) + ' ' + (h<12?'am':'pm');
}

/* ── Format currency ─────────────────────────────────────────── */
function _cur(n) {
  if (n >= 1e9)  return (n/1e9).toFixed(1) + ' tỷ';
  if (n >= 1e6)  return (n/1e6).toFixed(1) + ' tr';
  if (n >= 1e3)  return (n/1e3).toFixed(0) + 'k';
  return String(n);
}

/* ================================================================
 * BUILD HTML — Phase 1 Static Shell
 * Tất cả data là PLACEHOLDER — Phase 3 sẽ inject real data
 * ================================================================ */
function _buildHTML() {
  var now = _nowStr();

  /* ── 4 Summary Cards ─────────────────────────────────────── */
  var cards = [
    {
      cls   : 'adm-card-orange',
      label : 'Doanh thu tháng',
      value : '--',
      id    : 'adm-val-doanhthu',
      bars  : [40,65,50,80,60,90,75],
      actv  : 5,
    },
    {
      cls   : 'adm-card-green',
      label : 'Đơn hàng',
      value : '--',
      id    : 'adm-val-donhang',
      bars  : [60,45,75,55,80,40,70],
      actv  : 4,
    },
    {
      cls   : 'adm-card-red',
      label : 'Công việc hoàn thành',
      value : '--',
      id    : 'adm-val-congviec',
      bars  : [70,55,85,40,60,75,50],
      actv  : 2,
    },
    {
      cls   : 'adm-card-teal',
      label : 'Tổng sản phẩm',
      value : '--',
      id    : 'adm-val-sanpham',
      bars  : [50,70,40,80,55,65,90],
      actv  : 6,
    },
  ];

  var cardsHTML = cards.map(function(c) {
    return '<div class="adm-card ' + c.cls + '">'
      + '<div class="adm-card-label">' + _e(c.label) + '</div>'
      + _bars(c.bars, c.actv)
      + '<div class="adm-card-value" id="' + c.id + '">'
        + '<span class="adm-skel" style="width:80px;height:28px;background:rgba(255,255,255,.2);animation:adm-shimmer 1.5s infinite;"></span>'
      + '</div>'
      + '<div class="adm-card-footer">'
        + '<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 4v4l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>'
        + '<span>' + _e(now) + '</span>'
      + '</div>'
    + '</div>';
  }).join('');

  /* ── Sales Analytics chart placeholder ──────────────────── */
  var analyticsPanel = '<div class="adm-panel">'
    + '<div class="adm-panel-head">'
      + '<div>'
        + '<div class="adm-panel-title">&#x1F4C8; Phân tích bán hàng</div>'
        + '<div class="adm-panel-sub">Dữ liệu doanh thu theo thời gian thực</div>'
      + '</div>'
      + '<div class="adm-panel-actions">'
        + '<div class="adm-icon-btn" title="Phóng to">&#x26F6;</div>'
        + '<div class="adm-icon-btn" title="Thu gon">&#x2212;</div>'
        + '<div class="adm-icon-btn" title="Dong">&#x2715;</div>'
      + '</div>'
    + '</div>'
    + '<div class="adm-chart-area">'
      + '<canvas id="adm-chart-revenue" style="width:100%;height:100%;"></canvas>'
      + '<div id="adm-chart-revenue-loader" class="adm-chart-placeholder">'
        + '<span style="display:flex;flex-direction:column;align-items:center;gap:8px;">'
          + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
          + '<span>Đang tải biểu đồ... (Phase 4)</span>'
        + '</span>'
      + '</div>'
    + '</div>'
  + '</div>';

  /* ── Project Risk donut ──────────────────────────────────── */
  var riskPanel = '<div class="adm-panel" id="adm-risk-panel">'
    + '<div class="adm-panel-head">'
      + '<div class="adm-panel-title">Rủi ro dự án</div>'
    + '</div>'
    + '<div class="adm-risk-donut">'
      + '<span class="adm-risk-value" id="adm-val-risk">5</span>'
    + '</div>'
    + '<div class="adm-risk-label">Balanced</div>'
    + '<div class="adm-risk-link">Thay đổi mức rủi ro</div>'
    + '<div class="adm-risk-meta">'
      + '<div class="adm-risk-meta-item">'
        + '<div>Nr</div>'
        + '<div class="adm-risk-meta-val" id="adm-val-risk-nr">AWS 2455</div>'
      + '</div>'
      + '<div class="adm-risk-meta-item">'
        + '<div>Created</div>'
        + '<div class="adm-risk-meta-val" id="adm-val-risk-date">--</div>'
      + '</div>'
    + '</div>'
    + '<button class="adm-risk-download" onclick="window.admDownloadReport && window.admDownloadReport()">&#x1F4E5; Tải báo cáo tổng hợp</button>'
  + '</div>';

  /* ── App Sales Table ─────────────────────────────────────── */
  var tableRows = [
    { name:'Đơn hàng Sapo',   sub:'Hệ thống bán hàng',  sales:16300, change:[3,5,4,6,5,7], avg:'$53',  total:'Đang tải' },
    { name:'Nhân sự HRM',     sub:'Quản lý nhân viên',  sales:26421, change:[4,3,5,4,6,4], avg:'$35',  total:'Đang tải' },
    { name:'Kho vận',         sub:'Tồn kho & xuất nhập',sales:8265,  change:[5,3,4,6,3,4], avg:'$98',  total:'Đang tải' },
    { name:'Tài chính',       sub:'Sổ quỹ & công nợ',   sales:10652, change:[4,5,3,5,4,3], avg:'$20',  total:'Đang tải' },
  ];

  var colors4 = ['#43a047','#1976d2','#ff7043','#00acc1'];
  var tableHTML = '<div class="adm-panel">'
    + '<div class="adm-panel-head">'
      + '<div class="adm-panel-title">&#x1F4CA; Tổng hợp phân hệ</div>'
      + '<div class="adm-panel-actions">'
        + '<div class="adm-icon-btn">&#x26F6;</div>'
        + '<div class="adm-icon-btn">&#x2212;</div>'
        + '<div class="adm-icon-btn">&#x2715;</div>'
      + '</div>'
    + '</div>'
    + '<table class="adm-table">'
      + '<thead><tr>'
        + '<th></th>'
        + '<th>Phân hệ</th>'
        + '<th>Giao dịch</th>'
        + '<th>Xu hướng</th>'
        + '<th>Trung bình</th>'
        + '<th>Tổng</th>'
      + '</tr></thead>'
      + '<tbody id="adm-table-body">'
      + tableRows.map(function(r, i) {
          return '<tr>'
            + '<td><span class="adm-chk"></span></td>'
            + '<td>'
              + '<div class="adm-app-name">' + _e(r.name) + '</div>'
              + '<div class="adm-app-sub">' + _e(r.sub) + '</div>'
            + '</td>'
            + '<td>' + r.sales.toLocaleString('vi-VN') + '</td>'
            + '<td>' + _spark(r.change, colors4[i]) + '</td>'
            + '<td>' + _e(r.avg) + '</td>'
            + '<td class="adm-total" id="adm-row-total-' + i + '">'
              + '<span class="adm-skel" style="width:60px;"></span>'
            + '</td>'
          + '</tr>';
        }).join('')
      + '</tbody>'
    + '</table>'
    + '<span class="adm-view-all" onclick="window.admViewAll && window.admViewAll()">Xem tất cả phân hệ &#x2192;</span>'
  + '</div>';

  /* ── User Activity feed ──────────────────────────────────── */
  var activityData = [
    { name:'Nguyễn Văn A', msg:'Đã tạo đơn hàng #SO-2231',         time:'2 phút trước',  idx:0 },
    { name:'Trần Thị B',   msg:'Cập nhật tồn kho sản phẩm SP-004',  time:'5 phút trước',  idx:1 },
    { name:'Lê Văn C',     msg:'Phê duyệt yêu cầu nghỉ phép',       time:'12 phút trước', idx:2 },
    { name:'Phạm Thị D',   msg:'Xuất hóa đơn VAT #HD-0089',         time:'1 giờ trước',   idx:3 },
  ];

  var activityHTML = '<div class="adm-panel">'
    + '<div class="adm-panel-title">&#x1F465; Hoạt động gần đây</div>'
    + '<div class="adm-activity-list" id="adm-activity-list">'
    + activityData.map(function(a) {
        return '<div class="adm-activity-item">'
          + _av(a.name, a.idx)
          + '<div class="adm-activity-body">'
            + '<div class="adm-activity-name">' + _e(a.name) + '</div>'
            + '<div class="adm-activity-msg">' + _e(a.msg) + '</div>'
            + '<div class="adm-activity-time">'
              + '<svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2 2"/></svg>'
              + _e(a.time)
            + '</div>'
          + '</div>'
        + '</div>';
      }).join('')
    + '</div>'
    + '<span class="adm-view-all" onclick="window.admViewActivity && window.admViewActivity()">Xem tất cả hoạt động &#x2192;</span>'
  + '</div>';

  /* ── Row 4: Latest Updates ───────────────────────────────── */
  var updates = [
    { age:'4 giờ trước',  dotCls:'adm-update-dot-orange', icon:'&#x1F514;', title:'+5 sản phẩm mới được thêm vào', sub:'Chúc mừng!', id:'adm-upd-0' },
    { age:'1 ngày trước', dotCls:'adm-update-dot-green',  icon:'&#x2705;',  title:'Backup database hoàn tất',       sub:'', id:'adm-upd-1' },
    { age:'3 ngày trước', dotCls:'adm-update-dot-blue',   icon:'&#x1F4E7;', title:'Báo cáo tháng đã gửi',          sub:'3 người nhận', id:'adm-upd-2' },
  ];

  var updatesHTML = '<div class="adm-panel">'
    + '<div class="adm-panel-title">&#x1F514; Cập nhật mới nhất</div>'
    + '<div class="adm-updates-list">'
    + updates.map(function(u) {
        return '<div class="adm-update-item">'
          + '<div class="adm-update-age">' + _e(u.age) + '</div>'
          + '<div class="adm-update-dot ' + u.dotCls + '">' + u.icon + '</div>'
          + '<div>'
            + '<div class="adm-update-title" id="' + u.id + '">' + _e(u.title) + '</div>'
            + (u.sub ? '<div class="adm-update-sub">' + _e(u.sub) + '</div>' : '')
          + '</div>'
        + '</div>';
      }).join('')
    + '</div>'
  + '</div>';

  /* ── Promo / Banner card ─────────────────────────────────── */
  var promoHTML = '<div class="adm-promo-card">'
    + '<div>'
      + '<div class="adm-promo-text">SonKhang ERP<br>Phiên bản mới &#x1F680;</div>'
      + '<div class="adm-promo-sub">v5.18 — Dashboard nâng cao<br>Kho vận · Tài chính · KPI</div>'
    + '</div>'
  + '</div>';

  /* ── Info card ───────────────────────────────────────────── */
  var infoHTML = '<div class="adm-panel adm-info-card">'
    + '<div class="adm-panel-title">&#x2139;&#xFE0F; Thông tin hệ thống</div>'
    + '<div style="margin-top:12px;">'
    + [
        { label:'Email admin',  val:'thinhhoba@gmail.com', id:'adm-info-email' },
        { label:'Điện thoại',   val:'--',                   id:'adm-info-phone' },
        { label:'Phiên bản',    val:'v5.18',                id:'adm-info-ver'   },
        { label:'Cập nhật lúc', val:'--',                   id:'adm-info-ts'    },
      ].map(function(r) {
        return '<div class="adm-info-row">'
          + '<span class="adm-info-label">' + _e(r.label) + '</span>'
          + '<span class="adm-info-val" id="' + r.id + '">' + _e(r.val) + '</span>'
          + '</div>';
      }).join('')
    + '</div>'
  + '</div>';

  /* ── Assemble full layout ────────────────────────────────── */
  return '<div id="sk-admin-dash" class="fade-in">'

    /* Topbar mini */
    + '<div id="adm-topbar">'
      + '<div id="adm-search-wrap">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-3.5-3.5"/></svg>'
        + '<input id="adm-search-inp" type="text" placeholder="Tìm kiếm..." autocomplete="off"/>'
      + '</div>'
      + '<div class="adm-topbar-right">'
        + '<button class="adm-filter-btn" id="adm-month-filter">'
          + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'
          + '<span id="adm-month-label">Tháng này</span>'
        + '</button>'
        + '<div class="adm-date-badge">'
          + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>'
          + '<span id="adm-clock">' + _e(_nowStr()) + '</span>'
        + '</div>'
      + '</div>'
    + '</div>'

    /* Row 1: Cards */
    + '<div id="adm-cards">' + cardsHTML + '</div>'

    /* Row 2: Analytics + Risk */
    + '<div id="adm-row2">' + analyticsPanel + riskPanel + '</div>'

    /* Row 3: Table + Activity */
    + '<div id="adm-row3">' + tableHTML + activityHTML + '</div>'

    /* Row 4: Updates + Promo + Info */
    + '<div id="adm-row4">' + updatesHTML + promoHTML + infoHTML + '</div>'

  + '</div>'; /* #sk-admin-dash */
}

/* ── Clock ticker (Phase 1 only interaction) ─────────────────── */
function _startClock() {
  setInterval(function() {
    var el = document.getElementById('adm-clock');
    if (!el) return;
    el.textContent = _nowStr();
  }, 60000);
}

/* ── Info: risk date  ────────────────────────────────────────── */
function _setStaticInfo() {
  var d = new Date();
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var dateEl  = document.getElementById('adm-val-risk-date');
  var tsEl    = document.getElementById('adm-info-ts');
  if (dateEl) dateEl.textContent = d.getDate() + 'th ' + months[d.getMonth()];
  if (tsEl)   tsEl.textContent   = d.toLocaleString('vi-VN');
}

/* ── Main ────────────────────────────────────────────────────── */
function loadAdminDashboard() {
  var ct = (typeof window.getContent === 'function')
    ? window.getContent()
    : document.getElementById('sk-ct');
  if (!ct) { console.warn('[AdminDash] #sk-ct not found'); return; }

  _injectStyles();
  ct.innerHTML = _buildHTML();
  _startClock();
  _setStaticInfo();
  _admBindFilterEvents();   // Phase 3: month/year filter + reload btn

  // Phase 3+4: start after api ready (800ms grace period)
  setTimeout(function() {
    _admFetchAll(_getAdmMonth(), _getAdmYear());
    _admStartPoll();
  }, 800);

  // Public hooks
  window.admDownloadReport = function() {
    if (typeof window.skToast === 'function')
      window.skToast('Đang tạo báo cáo...', 'ok');
    _admFetchAll(_getAdmMonth(), _getAdmYear());
  };
  window.admViewAll      = function() { if (typeof window.loadGeneric==='function') window.loadGeneric('bao-cao-bh'); };
  window.admViewActivity = function() { if (typeof window.loadGeneric==='function') window.loadGeneric('dev-log'); };
  window.admInjectData   = _admInjectData;
}

/* ================================================================
 * PHASE 3 — GAS DATA INTEGRATION
 * [SECURITY]  Mọi server text qua _e() (OWASP A03)
 * [O(1)]      Map-based lookup cho status colors
 * [ASYNC]     5 GAS calls song song — không block UI
 * [PERF]      Auto-refresh 5 phút, pause tab ẩn
 * ================================================================ */

var _admPollTimer = null;
var _admPollMs    = 5 * 60 * 1000;

function _getAdmMonth() {
  var el = document.getElementById('adm-month-filter');
  return el ? Number(el.getAttribute('data-month') || new Date().getMonth()+1)
            : new Date().getMonth()+1;
}

/* ── Số định dạng ─────────────────────────────────────────────── */
function _admFmt(n)   { return Number(n||0).toLocaleString('vi-VN'); }
function _admCur(n) {
  n = Number(n||0);
  if (n >= 1e9) return (n/1e9).toFixed(1) + ' tỷ₫';
  if (n >= 1e6) return (n/1e6).toFixed(1) + ' tr₫';
  if (n >= 1e3) return (n/1e3).toFixed(0) + 'k₫';
  return _admFmt(n) + '₫';
}

/* ── Fetch tất cả APIs song song ──────────────────────────────── */
function _admFetchAll(month, year) {
  var apiF = typeof window.api === 'function' ? window.api : null;
  if (!apiF) return;

  var done = 0; var R = {};
  var total = 5;

  function _check(key, d) {
    R[key] = d;
    done++;
    if (done >= total) _admBindAll(R);
  }

  apiF('sales_get_dashboard',   { month:month, year:year },
       function(e,d){ _check('sales',   (!e&&d&&d.ok) ? d : null); });
  apiF('sales_report_revenue',  { period:'day', month:month, year:year },
       function(e,d){ _check('revenue', (!e&&d&&d.ok) ? d : null); });
  apiF('wh_get_dashboard',      {},
       function(e,d){ _check('wh',      (!e&&d&&d.ok) ? d : null); });
  apiF('hrm_get_kpi_dashboard', { month:month, year:year },
       function(e,d){ _check('kpi',     (!e&&d&&d.ok) ? d : null); });
  apiF('notif_get',             { limit:6, unread_only:false },
       function(e,d){ _check('notif',   (!e&&d&&d.ok) ? d : null); });
}

/* ── Bind tất cả kết quả vào DOM ─────────────────────────────── */
function _admBindAll(R) {
  _admBindCards(R.sales, R.wh, R.kpi);
  _admBindTable(R.sales, R.kpi, R.wh);
  _admBindActivity(R.notif);
  _admBindInfo();
  _admRenderRevenueChart(R.revenue);
  _admRenderRiskDonut(R.kpi);
  _admUpdateSyncTime();
}

/* ── 4 Summary Cards ─────────────────────────────────────────── */
function _admBindCards(sales, wh, kpi) {
  function _set(id, val) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<span style="font-size:inherit;font-weight:inherit;">'
      + _e(String(val)) + '</span>';
  }
  var dt      = sales ? Number((sales.stats||{}).doanh_thu   || 0) : 0;
  var orders  = sales ? Number((sales.stats||{}).total_orders || 0) : 0;
  var done    = sales ? Number((sales.stats||{}).so_don_hoan_thanh || 0) : 0;
  var totlSP  = wh    ? Number(wh.tong_sp || 0) : 0;

  _set('adm-val-doanhthu', _admCur(dt));
  _set('adm-val-donhang',  _admFmt(orders));
  _set('adm-val-congviec', _admFmt(done));
  _set('adm-val-sanpham',  _admFmt(totlSP));

  // Risk score từ KPI avg
  var kpiAvg  = kpi ? Number((kpi.summary||{}).diem_tb_pct || 70) : 70;
  var riskVal = Math.round(10 - (kpiAvg / 10));   // 0-10, cao = rủi ro cao
  riskVal     = Math.max(1, Math.min(10, riskVal));
  _set('adm-val-risk', String(riskVal));
  _admRenderRiskDonut(kpi);
}

/* ── Module Table ────────────────────────────────────────────── */
function _admBindTable(sales, kpi, wh) {
  // [O(1)] Map totals theo module index
  var totals = [
    sales ? _admCur((sales.stats||{}).doanh_thu  || 0)  : '--',
    kpi   ? _admFmt((kpi.summary||{}).tong_nv    || 0) + ' NV' : '--',
    wh    ? _admCur(wh.tong_gia_tri || 0)                : '--',
    sales ? _admCur((sales.stats||{}).da_thu     || 0)  : '--',
  ];
  totals.forEach(function(val, i) {
    var el = document.getElementById('adm-row-total-' + i);
    if (el) el.innerHTML = '<span style="color:var(--accent2);font-weight:800;">'
      + _e(val) + '</span>';
  });
}

/* ── Activity Feed từ SK_Notifications ───────────────────────── */
var _NOTIF_ICON = {
  order_new       : '🛒', order_paid: '💰', order_cancel: '❌',
  leave_request   : '📅', leave_approved: '✅',
  workflow_pending: '⏳', stock_low: '📦',
  misa_hd         : '📋', system: '⚙️', info: 'ℹ️',
};

function _admBindActivity(notif) {
  var el = document.getElementById('adm-activity-list');
  if (!el) return;
  var items = notif ? (notif.data || []) : [];
  if (!items.length) return; // giữ placeholder nếu rỗng

  var colors = ['#ff7043','#43a047','#1976d2','#8e24aa','#00acc1','#f57c00'];

  el.innerHTML = items.slice(0, 6).map(function(n, i) {
    var icon = _NOTIF_ICON[n.type] || 'ℹ️';
    var title= _e(String(n.title||'').slice(0, 55));
    var body = _e(String(n.body ||'').slice(0, 60));
    var ago  = _notifAgo(n.created_at);
    var init = icon;
    var bg   = colors[i % colors.length];
    return '<div class="adm-activity-item">'
      + '<div class="adm-av" style="background:' + bg + ';font-size:14px;">' + init + '</div>'
      + '<div class="adm-activity-body">'
        + '<div class="adm-activity-name">' + title + '</div>'
        + (body ? '<div class="adm-activity-msg">' + body + '</div>' : '')
        + '<div class="adm-activity-time">'
          + '<svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2 2"/></svg>'
          + _e(ago)
        + '</div>'
      + '</div>'
    + '</div>';
  }).join('');
}

function _notifAgo(iso) {
  if (!iso) return '';
  var diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return diff + 'g trước';
  if (diff < 3600)  return Math.floor(diff/60) + ' phút trước';
  if (diff < 86400) return Math.floor(diff/3600) + ' giờ trước';
  return Math.floor(diff/86400) + ' ngày trước';
}

/* ── Info card: timestamp ─────────────────────────────────────── */
function _admBindInfo() {
  var el = document.getElementById('adm-info-ts');
  if (el) el.textContent = new Date().toLocaleString('vi-VN');
}

/* ── Sync time badge ─────────────────────────────────────────── */
function _admUpdateSyncTime() {
  var el = document.getElementById('adm-clock');
  if (!el) return;
  var d = new Date();
  var h = d.getHours(), m = d.getMinutes();
  el.textContent = 'sync: ' + (h<10?'0'+h:h) + ':' + (m<10?'0'+m:m);
}

/* ── Public inject hook ──────────────────────────────────────── */
function _admInjectData(data) {
  if (data) _admBindAll(data);
  else _admFetchAll(_getAdmMonth(), _getAdmYear());
}

/* ── Auto-refresh ────────────────────────────────────────────── */
function _admStartPoll() {
  if (_admPollTimer) clearInterval(_admPollTimer);
  _admPollTimer = setInterval(function() {
    if (document.visibilityState === 'hidden') return;
    if (!document.getElementById('sk-admin-dash')) {
      clearInterval(_admPollTimer); _admPollTimer = null; return;
    }
    _admFetchAll(_getAdmMonth(), _getAdmYear());
  }, _admPollMs);
}

/* ================================================================
 * PHASE 4 — CHART.JS RENDERING
 * ================================================================ */

var _admChart = null;

function _admEnsureChartJs(cb) {
  if (window.Chart) { cb(); return; }
  var s    = document.createElement('script');
  s.src    = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
  s.onload = cb;
  s.onerror= function() { console.warn('[AdminDash] Chart.js load failed'); };
  document.head.appendChild(s);
}

/* ── Revenue Line + Bar Chart ─────────────────────────────────── */
function _admRenderRevenueChart(data) {
  _admEnsureChartJs(function() {
    var canvas  = document.getElementById('adm-chart-revenue');
    var loader  = document.getElementById('adm-chart-revenue-loader');
    if (!canvas) return;

    // Ẩn placeholder
    if (loader) loader.style.display = 'none';
    canvas.style.display = 'block';

    // Parse data — lấy 7 ngày gần nhất
    var rows = data && data.data ? data.data.slice().sort(function(a,b){
      return String(a.date||'').localeCompare(String(b.date||''));
    }).slice(-7) : [];

    var labels  = rows.length ? rows.map(function(r){ return String(r.date||'').slice(5); })
                               : ['T2','T3','T4','T5','T6','T7','CN'];
    var dtData  = rows.length ? rows.map(function(r){ return Number(r.doanh_thu||0); })
                               : [0,0,0,0,0,0,0];
    var donData = rows.length ? rows.map(function(r){ return Number(r.don||0); })
                               : [0,0,0,0,0,0,0];

    // Destroy chart cũ nếu có
    if (_admChart) { try { _admChart.destroy(); } catch(e){} _admChart = null; }

    _admChart = new Chart(canvas, {
      data: {
        labels: labels,
        datasets: [
          {
            type            : 'line',
            label           : 'Doanh thu (₫)',
            data            : dtData,
            borderColor     : '#4f6fff',
            backgroundColor : 'rgba(79,111,255,.12)',
            borderWidth     : 2.5,
            fill            : true,
            tension         : 0.45,
            pointRadius     : 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#4f6fff',
            yAxisID         : 'y',
            order           : 1,
          },
          {
            type            : 'bar',
            label           : 'Đơn hàng',
            data            : donData,
            backgroundColor : 'rgba(0,214,143,.65)',
            borderRadius    : 4,
            yAxisID         : 'y2',
            order           : 2,
          },
        ],
      },
      options: {
        responsive          : true,
        maintainAspectRatio : false,
        interaction         : { mode:'index', intersect:false },
        plugins: {
          legend: {
            labels: { color:'#8892a4', font:{ size:10, family:'Be Vietnam Pro' }, boxWidth:12 },
          },
          tooltip: {
            backgroundColor : 'rgba(15,17,23,.95)',
            borderColor     : '#252d40',
            borderWidth     : 1,
            titleColor      : '#e8ecf4',
            bodyColor       : '#b0bcd4',
            padding         : 10,
            callbacks: {
              label: function(ctx) {
                if (ctx.dataset.yAxisID === 'y') {
                  return ' ' + Number(ctx.raw).toLocaleString('vi-VN') + '₫';
                }
                return ' ' + ctx.raw + ' đơn';
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color:'#8892a4', font:{ size:10 } },
            grid : { color:'rgba(255,255,255,.04)' },
          },
          y: {
            position: 'left',
            ticks: {
              color: '#8892a4', font:{ size:10 },
              callback: function(v) {
                if (v >= 1e6) return (v/1e6).toFixed(1) + 'M';
                if (v >= 1e3) return (v/1e3).toFixed(0) + 'k';
                return v;
              },
            },
            grid: { color:'rgba(255,255,255,.06)' },
          },
          y2: {
            position: 'right',
            ticks: { color:'#00d68f', font:{ size:10 } },
            grid : { display:false },
          },
        },
      },
    });
  });
}

/* ── Risk Donut: cập nhật CSS conic-gradient ─────────────────── */
function _admRenderRiskDonut(kpi) {
  var el = document.querySelector('#sk-admin-dash .adm-risk-donut');
  if (!el) return;

  var kpiAvg = kpi ? Number((kpi.summary||{}).diem_tb_pct || 70) : 70;
  // Chuyển KPI% thành risk score (KPI cao → risk thấp)
  var safeRatio   = Math.min(1, Math.max(0, kpiAvg / 100));
  var safeDeg     = Math.round(safeRatio * 360);
  var riskScore   = Math.round(10 - safeRatio * 9);
  var color       = safeDeg > 240 ? '#00acc1'
                  : safeDeg > 120 ? '#fbbd24'
                  :                 '#ff4d6d';

  el.style.background = 'conic-gradient('
    + color + ' 0deg ' + safeDeg + 'deg,'
    + 'var(--border2) ' + safeDeg + 'deg 360deg'
    + ')';

  var valEl = document.getElementById('adm-val-risk');
  if (valEl) valEl.style.color = color;
}

/* ================================================================
 * PHASE 3 COMPLETION — Filter Events, Sub-text, Error Handling
 * ================================================================ */

/* ── Month dropdown ─────────────────────────────────────────── */
var _ADM_MONTHS = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'
];

/* Bind filter button events sau khi render HTML */
function _admBindFilterEvents() {
  var mBtn   = document.getElementById('adm-month-filter');
  var reload = document.getElementById('adm-reload-btn');
  var search = document.getElementById('adm-search-inp');

  /* Month filter: click → show dropdown overlay */
  if (mBtn) {
    mBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      _admShowMonthPicker(mBtn);
    });
  }

  /* Reload button */
  if (reload) {
    reload.addEventListener('click', function() {
      reload.style.opacity = '.4';
      reload.style.transform = 'rotate(180deg)';
      _admFetchAll(_getAdmMonth(), _getAdmYear());
      setTimeout(function() {
        reload.style.opacity = '1';
        reload.style.transform = 'rotate(0deg)';
      }, 700);
    });
  }

  /* Search: filter activity list locally */
  if (search) {
    search.addEventListener('input', function() {
      var q = search.value.toLowerCase().trim();
      var items = document.querySelectorAll('#adm-activity-list .adm-activity-item');
      items.forEach(function(item) {
        item.style.display = (!q || item.textContent.toLowerCase().indexOf(q) >= 0)
          ? '' : 'none';
      });
    });
  }
}

/* Month picker dropdown */
function _admShowMonthPicker(anchor) {
  var old = document.getElementById('adm-month-picker');
  if (old) { old.parentNode.removeChild(old); return; }

  var curMonth = _getAdmMonth();
  var curYear  = _getAdmYear();
  var curYearEl = document.getElementById('adm-year-badge');
  var years    = [];
  for (var y = curYear; y >= curYear - 3; y--) years.push(y);

  var html = '<div id="adm-month-picker" style="'
    + 'position:absolute;top:38px;left:0;z-index:500;'
    + 'background:var(--bg2);border:1px solid var(--border2);'
    + 'border-radius:14px;padding:14px;box-shadow:0 16px 48px rgba(0,0,0,.6);'
    + 'width:260px;">'
    // Year row
    + '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">'
    + years.map(function(y) {
        return '<span data-yr="' + y + '" style="background:'
          + (y===curYear ? 'var(--accent2)' : 'var(--bg3)')
          + ';color:' + (y===curYear ? '#fff' : 'var(--text3)')
          + ';border-radius:7px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;">'
          + y + '</span>';
      }).join('')
    + '</div>'
    // Month grid
    + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;">'
    + _ADM_MONTHS.map(function(m, i) {
        var mo = i + 1;
        return '<span data-mo="' + mo + '" style="background:'
          + (mo===curMonth ? 'var(--accent2)' : 'var(--bg3)')
          + ';color:' + (mo===curMonth ? '#fff' : 'var(--text2)')
          + ';border-radius:7px;padding:5px 4px;font-size:10px;'
          + 'font-weight:700;cursor:pointer;text-align:center;">'
          + m.replace('Tháng ','T') + '</span>';
      }).join('')
    + '</div>'
    + '</div>';

  // Append to anchor parent
  anchor.style.position = 'relative';
  anchor.insertAdjacentHTML('afterend', html);

  var picker = document.getElementById('adm-month-picker');

  // Click month
  picker.querySelectorAll('[data-mo]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      var mo = Number(el.getAttribute('data-mo'));
      var yr = _admSelectedYear || curYear;
      anchor.setAttribute('data-month', mo);
      var lbl = document.getElementById('adm-month-label');
      if (lbl) lbl.textContent = _ADM_MONTHS[mo-1];
      picker.parentNode.removeChild(picker);
      _admShowLoadingState();
      _admFetchAll(mo, yr);
    });
  });

  // Click year
  picker.querySelectorAll('[data-yr]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      _admSelectedYear = Number(el.getAttribute('data-yr'));
      // Highlight year
      picker.querySelectorAll('[data-yr]').forEach(function(y) {
        y.style.background = Number(y.getAttribute('data-yr'))===_admSelectedYear
          ? 'var(--accent2)' : 'var(--bg3)';
        y.style.color = Number(y.getAttribute('data-yr'))===_admSelectedYear
          ? '#fff' : 'var(--text3)';
      });
    });
  });

  // Close on outside click
  setTimeout(function() {
    document.addEventListener('click', function _closePicker() {
      var p = document.getElementById('adm-month-picker');
      if (p) p.parentNode.removeChild(p);
      document.removeEventListener('click', _closePicker);
    });
  }, 0);
}

var _admSelectedYear = new Date().getFullYear();

function _getAdmYear() { return _admSelectedYear; }

/* ── Loading state: shimmer trở lại khi fetch ─────────────────── */
function _admShowLoadingState() {
  // Cards
  var cardIds = ['adm-val-doanhthu','adm-val-donhang','adm-val-congviec','adm-val-sanpham'];
  cardIds.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = '<span class="adm-skel" style="width:80px;height:26px;'
      + 'background:rgba(255,255,255,.2);animation:adm-shimmer 1.5s infinite;'
      + 'display:inline-block;border-radius:4px;"></span>';
  });
  // Table totals
  for (var i=0; i<4; i++) {
    var el = document.getElementById('adm-row-total-' + i);
    if (el) el.innerHTML = '<span class="adm-skel" style="width:55px;'
      + 'display:inline-block;border-radius:4px;"></span>';
  }
}

/* ── Card sub-text update (Hoàn thành: X, Hết hàng: X) ──────── */
function _admBindCardSubs(sales, wh, kpi) {
  // Tìm các .adm-card-footer spans để update
  var footers = document.querySelectorAll('#sk-admin-dash .adm-card-footer');
  var subs = [
    sales ? '+' + (((sales.stats||{}).growth)||0).toFixed(1) + '% so kỳ trước' : '--',
    sales ? 'Hoàn thành: ' + _admFmt((sales.stats||{}).so_don_hoan_thanh||0) : '--',
    wh    ? 'Hết hàng: ' + _admFmt(wh.het_hang||0) : '--',
    kpi   ? 'Đánh giá: ' + _admFmt((kpi.summary||{}).tong_nv||0) + ' NV' : '--',
  ];
  footers.forEach(function(footer, i) {
    if (subs[i]) {
      var span = footer.querySelector('span');
      // Chỉ update text sau clock icon
      var spans = footer.querySelectorAll('span');
      if (spans.length > 0) {
        // Lấy span cuối — text content
        var last = spans[spans.length - 1];
        if (last && !last.querySelector('svg')) last.textContent = subs[i];
      }
    }
  });
}

/* ── Error state khi GAS fail ────────────────────────────────── */
function _admShowError(msg) {
  var el = document.getElementById('adm-activity-list');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--red);">'
    + '<div style="font-size:24px;margin-bottom:8px;">&#x26A0;</div>'
    + '<div style="font-size:12px;font-weight:700;">Lỗi kết nối GAS</div>'
    + '<div style="font-size:10px;color:var(--text3);margin-top:4px;">' + _e(msg||'') + '</div>'
    + '<button onclick="_admFetchAll(_getAdmMonth(),_getAdmYear())" '
      + 'style="margin-top:12px;background:var(--accent2);border:none;color:#fff;'
      + 'border-radius:8px;padding:7px 16px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">'
      + '&#x21BA; Thử lại</button>'
    + '</div>';
}

/* ── Override _admBindAll để thêm sub-text + error ──────────── */
var _admBindAllOrig = _admBindAll;
_admBindAll = function(R) {
  _admBindAllOrig(R);
  _admBindCardSubs(R.sales, R.wh, R.kpi);
  // Nếu tất cả null → show error
  if (!R.sales && !R.wh && !R.kpi && !R.revenue && !R.notif) {
    _admShowError('Không nhận được dữ liệu từ GAS. Kiểm tra kết nối.');
  }
};

/* ── Override _admFetchAll để thêm loading state ─────────────── */
var _admFetchAllOrig = _admFetchAll;
_admFetchAll = function(month, year) {
  _admShowLoadingState();
  _admFetchAllOrig(month, year);
};

/* ── Export ──────────────────────────────────────────────────── */
window.loadAdminDashboard = loadAdminDashboard;
// Alias để backward compat với loader
window.loadDashboardAdmin = loadAdminDashboard;

})();
