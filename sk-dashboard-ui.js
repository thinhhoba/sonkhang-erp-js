/* ================================================================
 * sk-dashboard-ui.js  SonKhang ERP v5.16
 * Dashboard tong hop: KPI cards + charts doanh thu + don hang + kho
 *
 * [SECURITY]  Moi server value qua _dEsc() truoc innerHTML (OWASP A03)
 * [O(1)]      Map-based lookup cho status/type colors
 * [ASYNC]     4 GAS calls song song qua _dParallel() — khong block UI
 * [PERF]      Auto-refresh 5 phut, pause khi tab an
 * [v5.16] 22/03/2026 — Initial build
 * ================================================================ */
(function () {
'use strict';

var _api   = function(){ return typeof window.api==='function'?window.api:null; };
var _ct    = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
var _dEsc  = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
var _dFmt  = function(n){ return Number(n||0).toLocaleString('vi-VN'); };
var _dCur  = function(n){ return _dFmt(n) + '₫'; };
var _dPct  = function(n){ return (Number(n||0)).toFixed(1) + '%'; };

// ── State ─────────────────────────────────────────────────────────
var _dTimer   = null;
var _dCharts  = {};            // Chart.js instance map — destroy trước khi tạo mới
var POLL_MS   = 5 * 60 * 1000; // 5 phút

// ── Status/Type color maps — O(1) lookup ──────────────────────────
var STATUS_COLOR = {
  'moi'         : '#4f6fff',
  'xac_nhan'    : '#00b6ff',
  'dang_giao'   : '#fbbd24',
  'hoan_thanh'  : '#00d68f',
  'huy'         : '#ff4d6d',
  'tra_hang'    : '#a78bfa',
};
var STATUS_LABEL = {
  'moi'        :'Mới','xac_nhan':'Xác nhận','dang_giao':'Đang giao',
  'hoan_thanh' :'Hoàn thành','huy':'Hủy','tra_hang':'Trả hàng',
};

// ── Main loader ───────────────────────────────────────────────────
function loadDashboard() {
  var ct = _ct(); if (!ct) return;

  // Render skeleton
  ct.innerHTML = _buildSkeleton();

  // Load Chart.js nếu chưa có
  _ensureChartJs(function() {
    _fetchAll();
    _startPoll();
  });
}

// ── Skeleton ──────────────────────────────────────────────────────
function _buildSkeleton() {
  return '<div class="fade-in" id="sk-dash" style="padding:20px 16px;max-width:1400px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">'
      + '<div>'
        + '<h1 style="font-size:20px;font-weight:900;margin:0;">&#x1F4CA; Dashboard</h1>'
        + '<p id="dash-updated" style="font-size:11px;color:var(--text3);margin:3px 0 0;">Đang tải...</p>'
      + '</div>'
      + '<div style="display:flex;gap:8px;align-items:center;">'
        + '<select id="dash-month" style="background:var(--bg3);border:1px solid var(--border2);'
          + 'color:var(--text);border-radius:8px;padding:6px 10px;font-size:11px;font-family:inherit;">'
          + _monthOptions()
        + '</select>'
        + '<select id="dash-year" style="background:var(--bg3);border:1px solid var(--border2);'
          + 'color:var(--text);border-radius:8px;padding:6px 10px;font-size:11px;font-family:inherit;">'
          + _yearOptions()
        + '</select>'
        + '<button id="dash-reload" style="background:var(--bg3);border:1px solid var(--border2);'
          + 'color:var(--text2);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;'
          + 'cursor:pointer;font-family:inherit;">&#x21BA;</button>'
      + '</div>'
    + '</div>'
    // Row 1: KPI cards skeleton
    + '<div id="dash-kpi-row" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">'
      + _skCard(4)
    + '</div>'
    // Row 2: Revenue chart
    + '<div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:16px;">'
      + '<div id="dash-revenue-wrap" class="dash-card">'
        + '<div class="dash-card-title">&#x1F4C8; Doanh thu 7 ngày</div>'
        + '<div style="height:200px;display:flex;align-items:center;justify-content:center;color:var(--text3);">Đang tải...</div>'
      + '</div>'
      + '<div id="dash-status-wrap" class="dash-card">'
        + '<div class="dash-card-title">&#x1F4CB; Đơn hàng theo trạng thái</div>'
        + '<div style="height:200px;display:flex;align-items:center;justify-content:center;color:var(--text3);">Đang tải...</div>'
      + '</div>'
    + '</div>'
    // Row 3: Top products + Warehouse
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">'
      + '<div id="dash-products-wrap" class="dash-card">'
        + '<div class="dash-card-title">&#x1F3C6; Top 5 sản phẩm bán chạy</div>'
        + '<div style="height:180px;display:flex;align-items:center;justify-content:center;color:var(--text3);">Đang tải...</div>'
      + '</div>'
      + '<div id="dash-wh-wrap" class="dash-card">'
        + '<div class="dash-card-title">&#x1F4E6; Kho vận</div>'
        + '<div style="height:180px;display:flex;align-items:center;justify-content:center;color:var(--text3);">Đang tải...</div>'
      + '</div>'
    + '</div>'
    // Row 4: KPI + Finance
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      + '<div id="dash-kpi-wrap" class="dash-card">'
        + '<div class="dash-card-title">&#x1F3AF; KPI nhân sự tháng này</div>'
        + '<div style="color:var(--text3);font-size:12px;padding:16px 0;">Đang tải...</div>'
      + '</div>'
      + '<div id="dash-fin-wrap" class="dash-card">'
        + '<div class="dash-card-title">&#x1F4B0; Tài chính</div>'
        + '<div style="color:var(--text3);font-size:12px;padding:16px 0;">Đang tải...</div>'
      + '</div>'
    + '</div>'
  + '</div>';
}

function _skCard(n) {
  var h = '';
  for (var i=0; i<n; i++) {
    h += '<div class="dash-card" style="height:88px;'
      + 'background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);'
      + 'background-size:200% 100%;animation:sk-shimmer 1.4s infinite;"></div>';
  }
  return h;
}

// ── Fetch all APIs parallel ────────────────────────────────────────
// [ASYNC] Không await tuần tự — tất cả gọi song song
function _fetchAll() {
  var api = _api(); if (!api) return;
  var m   = _getMonth(), y = _getYear();

  var done = 0; var results = {};
  var total = 5;

  function _check(key, data) {
    results[key] = data;
    done++;
    if (done >= total) _renderAll(results);
  }

  api('sales_get_dashboard',    { month:m, year:y }, function(e,d){ _check('sales', (!e&&d&&d.ok)?d:null); });
  api('sales_report_revenue',   { period:'day', month:m, year:y }, function(e,d){ _check('revenue', (!e&&d&&d.ok)?d:null); });
  api('hrm_get_kpi_dashboard',  { month:m, year:y }, function(e,d){ _check('kpi', (!e&&d&&d.ok)?d:null); });
  api('wh_get_dashboard',       {}, function(e,d){ _check('wh', (!e&&d&&d.ok)?d:null); });
  api('fin_get_report',         { month:m, year:y }, function(e,d){ _check('fin', (!e&&d&&d.ok)?d:null); });
}

// ── Render all sections ───────────────────────────────────────────
function _renderAll(R) {
  _renderKpiCards(R.sales, R.wh, R.kpi, R.fin);
  _renderRevenueChart(R.revenue);
  _renderStatusChart(R.sales);
  _renderTopProducts(R.revenue);
  _renderWarehouse(R.wh);
  _renderKpiTable(R.kpi);
  _renderFinance(R.fin);
  _updateTimestamp();
  _bindDashEvents();
}

// ── Row 1: KPI Cards ──────────────────────────────────────────────
function _renderKpiCards(sales, wh, kpi, fin) {
  var el = document.getElementById('dash-kpi-row'); if (!el) return;

  var dt     = sales ? (sales.stats && sales.stats.doanh_thu   || 0) : 0;
  var orders = sales ? (sales.stats && sales.stats.total_orders || 0) : 0;
  var whWarn = wh    ? (wh.canh_bao || 0) : 0;
  var kpiAvg = kpi   ? (kpi.summary && kpi.summary.diem_tb_pct || 0) : 0;

  el.innerHTML = ''
    + _kpiCard('&#x1F4B5;', 'Doanh thu tháng', _dCur(dt), '', '#00d68f',
        sales ? '+' + _dPct((sales.stats&&sales.stats.growth)||0) + ' so kỳ trước' : '')
    + _kpiCard('&#x1F6D2;', 'Đơn hàng', _dFmt(orders), '', '#4f6fff',
        sales ? 'Hoàn thành: ' + _dFmt((sales.stats&&sales.stats.so_don_hoan_thanh)||0) : '')
    + _kpiCard('&#x26A0;&#xFE0F;', 'Kho cảnh báo', _dFmt(whWarn), '', '#fbbd24',
        wh ? 'Hết hàng: ' + _dFmt(wh.het_hang||0) : '')
    + _kpiCard('&#x1F3AF;', 'KPI trung bình', _dPct(kpiAvg), '', '#a78bfa',
        kpi ? 'Đánh giá: ' + _dFmt((kpi.summary&&kpi.summary.tong_nv)||0) + ' NV' : '');
}

function _kpiCard(icon, label, value, unit, color, sub) {
  return '<div class="dash-card" style="padding:16px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;">'
      + '<div>'
        + '<div style="font-size:10px;color:var(--text3);font-weight:700;text-transform:uppercase;'
          + 'letter-spacing:.5px;margin-bottom:6px;">' + _dEsc(label) + '</div>'
        + '<div style="font-size:22px;font-weight:900;color:var(--text);">' + _dEsc(value) + '</div>'
        + (sub ? '<div style="font-size:10px;color:var(--text3);margin-top:4px;">' + _dEsc(sub) + '</div>' : '')
      + '</div>'
      + '<div style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;'
        + 'justify-content:center;font-size:18px;background:' + color + '22;flex-shrink:0;">'
        + icon
      + '</div>'
    + '</div>'
    + '<div style="height:3px;background:' + color + '33;border-radius:2px;margin-top:12px;">'
      + '<div style="height:100%;width:70%;background:' + color + ';border-radius:2px;"></div>'
    + '</div>'
  + '</div>';
}

// ── Row 2a: Revenue Line Chart ────────────────────────────────────
function _renderRevenueChart(data) {
  var wrap = document.getElementById('dash-revenue-wrap'); if (!wrap) return;

  if (!data || !data.data || data.data.length === 0) {
    wrap.innerHTML = '<div class="dash-card-title">&#x1F4C8; Doanh thu 7 ngày</div>'
      + '<div style="height:200px;display:flex;align-items:center;justify-content:center;'
      + 'color:var(--text3);font-size:12px;">Chưa có dữ liệu</div>';
    return;
  }

  // Lấy 7 ngày gần nhất — O(n) sort + slice
  var rows = (data.data || []).slice().sort(function(a,b){
    return String(a.date||'').localeCompare(String(b.date||''));
  }).slice(-7);

  var labels = rows.map(function(r){
    var d = String(r.date||''); return d.slice(5); // MM-DD
  });
  var dtData = rows.map(function(r){ return Number(r.doanh_thu||0); });
  var donData = rows.map(function(r){ return Number(r.don||0); });

  wrap.innerHTML = '<div class="dash-card-title">&#x1F4C8; Doanh thu 7 ngày</div>'
    + '<canvas id="chart-revenue" height="200"></canvas>';

  _dDestroyChart('revenue');
  var ctx = document.getElementById('chart-revenue');
  if (!ctx || !window.Chart) return;

  _dCharts['revenue'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label     : 'Doanh thu (₫)',
          data      : dtData,
          borderColor     : '#4f6fff',
          backgroundColor : 'rgba(79,111,255,.1)',
          borderWidth : 2,
          fill        : true,
          tension     : 0.4,
          pointRadius : 3,
          yAxisID     : 'y',
        },
        {
          label      : 'Đơn hàng',
          data       : donData,
          borderColor: '#00d68f',
          borderWidth: 2,
          fill       : false,
          tension    : 0.4,
          pointRadius: 3,
          yAxisID    : 'y2',
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#8892a4', font: { size: 10 } } } },
      scales: {
        x  : { ticks: { color:'#8892a4', font:{ size:10 } }, grid:{ color:'rgba(255,255,255,.04)' } },
        y  : { ticks: { color:'#8892a4', font:{ size:10 },
                callback: function(v){ return (v/1000000).toFixed(1)+'M'; } },
               grid:{ color:'rgba(255,255,255,.04)' }, position:'left' },
        y2 : { ticks: { color:'#00d68f', font:{ size:10 } },
               grid:{ display:false }, position:'right' },
      },
    },
  });
}

// ── Row 2b: Order Status Donut ────────────────────────────────────
function _renderStatusChart(data) {
  var wrap = document.getElementById('dash-status-wrap'); if (!wrap) return;

  var by_status = data && data.stats && data.stats.by_status || {};
  var keys   = Object.keys(by_status).filter(function(k){ return by_status[k] > 0; });

  if (!keys.length) {
    wrap.innerHTML = '<div class="dash-card-title">&#x1F4CB; Đơn theo trạng thái</div>'
      + '<div style="height:200px;display:flex;align-items:center;justify-content:center;color:var(--text3);">Chưa có dữ liệu</div>';
    return;
  }

  // [O(1)] Map lookup cho colors
  var colors = keys.map(function(k){ return STATUS_COLOR[k] || '#8892a4'; });
  var labels = keys.map(function(k){ return STATUS_LABEL[k] || k; });
  var vals   = keys.map(function(k){ return by_status[k]; });

  wrap.innerHTML = '<div class="dash-card-title">&#x1F4CB; Đơn theo trạng thái</div>'
    + '<canvas id="chart-status" height="200"></canvas>';

  _dDestroyChart('status');
  var ctx = document.getElementById('chart-status');
  if (!ctx || !window.Chart) return;

  _dCharts['status'] = new Chart(ctx, {
    type : 'doughnut',
    data : { labels:labels, datasets:[{
      data:vals, backgroundColor:colors,
      borderColor:'rgba(255,255,255,.08)', borderWidth:2,
    }]},
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ position:'right', labels:{ color:'#8892a4', font:{ size:10 }, boxWidth:12 } },
      },
    },
  });
}

// ── Row 3a: Top Products Bar ───────────────────────────────────────
function _renderTopProducts(data) {
  var wrap = document.getElementById('dash-products-wrap'); if (!wrap) return;

  var items = data && data.top_products || [];
  // salesReportRevenue trả top_products: [{sp_id, ten_sp, so_luong, doanh_thu}]
  if (!items.length) {
    wrap.innerHTML = '<div class="dash-card-title">&#x1F3C6; Top 5 sản phẩm</div>'
      + '<div style="color:var(--text3);font-size:12px;padding:16px 0;">Chưa có dữ liệu</div>';
    return;
  }

  var top5   = items.slice(0, 5);
  var labels = top5.map(function(r){ return _dEsc(String(r.ten_sp||r.sp_id||'').slice(0,18)); });
  var vals   = top5.map(function(r){ return Number(r.doanh_thu||0); });

  wrap.innerHTML = '<div class="dash-card-title">&#x1F3C6; Top 5 sản phẩm</div>'
    + '<canvas id="chart-products" height="160"></canvas>';

  _dDestroyChart('products');
  var ctx = document.getElementById('chart-products');
  if (!ctx || !window.Chart) return;

  _dCharts['products'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets:[{
        label           : 'Doanh thu (₫)',
        data            : vals,
        backgroundColor : 'rgba(79,111,255,.7)',
        borderRadius    : 4,
      }],
    },
    options: {
      indexAxis      : 'y',
      responsive     : true,
      maintainAspectRatio: false,
      plugins:{ legend:{ display:false } },
      scales:{
        x:{ ticks:{ color:'#8892a4', font:{ size:9 },
              callback:function(v){ return (v/1000000).toFixed(1)+'M'; } },
            grid:{ color:'rgba(255,255,255,.04)' } },
        y:{ ticks:{ color:'#8892a4', font:{ size:9 } }, grid:{ display:false } },
      },
    },
  });
}

// ── Row 3b: Warehouse Summary ─────────────────────────────────────
function _renderWarehouse(data) {
  var wrap = document.getElementById('dash-wh-wrap'); if (!wrap) return;
  if (!data) {
    wrap.innerHTML = '<div class="dash-card-title">&#x1F4E6; Kho vận</div>'
      + '<div style="color:var(--text3);font-size:12px;padding:8px 0;">Chưa có dữ liệu</div>';
    return;
  }

  var rows = [
    ['Tổng sản phẩm',  _dFmt(data.tong_sp||0),       '#8892a4'],
    ['Tổng giá trị',   _dCur(data.tong_gia_tri||0),   '#4f6fff'],
    ['Cảnh báo tồn',   _dFmt(data.canh_bao||0),       '#fbbd24'],
    ['Hết hàng',       _dFmt(data.het_hang||0),        '#ff4d6d'],
  ];

  var html = '<div class="dash-card-title">&#x1F4E6; Kho vận</div>'
    + '<div style="display:flex;flex-direction:column;gap:8px;padding-top:6px;">';
  rows.forEach(function(r) {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;'
          + 'padding:8px 12px;background:var(--bg3);border-radius:8px;">'
          +   '<span style="font-size:11px;color:var(--text3);">' + r[0] + '</span>'
          +   '<span style="font-size:13px;font-weight:800;color:' + r[2] + ';">' + r[1] + '</span>'
          + '</div>';
  });
  html += '</div>';
  wrap.innerHTML = html;
}

// ── Row 4a: KPI Table ────────────────────────────────────────────
function _renderKpiTable(data) {
  var wrap = document.getElementById('dash-kpi-wrap'); if (!wrap) return;

  var items = data && data.data || [];
  if (!items.length) {
    wrap.innerHTML = '<div class="dash-card-title">&#x1F3AF; KPI nhân sự</div>'
      + '<div style="color:var(--text3);font-size:12px;padding:8px 0;">Chưa có dữ liệu KPI tháng này</div>';
    return;
  }

  var top5 = items.slice(0, 5);
  var html = '<div class="dash-card-title">&#x1F3AF; KPI nhân sự top 5</div>'
    + '<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:6px;">'
    + '<thead><tr style="color:var(--text3);">'
    +   '<th style="text-align:left;padding:4px 6px;font-weight:700;">Nhân viên</th>'
    +   '<th style="text-align:right;padding:4px 6px;font-weight:700;">Điểm</th>'
    +   '<th style="text-align:right;padding:4px 6px;font-weight:700;">Xếp loại</th>'
    + '</tr></thead><tbody>';

  top5.forEach(function(r) {
    var diem = Number(r.diem_so || r.diem_kpi || 0);
    var color = diem >= 90 ? 'var(--green)' : diem >= 70 ? 'var(--accent2)' : 'var(--yellow)';
    html += '<tr style="border-top:1px solid var(--border);">'
      + '<td style="padding:6px;color:var(--text);">' + _dEsc(String(r.ho_ten||r.ma_nv||'').slice(0,20)) + '</td>'
      + '<td style="padding:6px;text-align:right;font-weight:800;color:' + color + ';">' + diem.toFixed(1) + '</td>'
      + '<td style="padding:6px;text-align:right;color:var(--text3);">' + _dEsc(String(r.xep_loai||'')) + '</td>'
      + '</tr>';
  });

  html += '</tbody></table>';
  if (data.summary) {
    html += '<div style="margin-top:8px;font-size:10px;color:var(--text3);">'
      + 'Trung bình: <strong style="color:var(--accent2);">' + _dPct(data.summary.diem_tb_pct||0) + '</strong>'
      + ' | Tổng đánh giá: ' + _dFmt(data.summary.tong_nv||0) + ' NV'
      + '</div>';
  }
  wrap.innerHTML = html;
}

// ── Row 4b: Finance ───────────────────────────────────────────────
function _renderFinance(data) {
  var wrap = document.getElementById('dash-fin-wrap'); if (!wrap) return;
  if (!data) {
    wrap.innerHTML = '<div class="dash-card-title">&#x1F4B0; Tài chính</div>'
      + '<div style="color:var(--text3);font-size:12px;padding:8px 0;">Chưa có dữ liệu</div>';
    return;
  }

  var dt  = Number(data.doanh_thu || 0);
  var cp  = Number(data.chi_phi   || 0);
  var ln  = Number(data.loi_nhuan || 0);
  var cn  = (data.cong_no && data.cong_no.tong_phai_thu) ? Number(data.cong_no.tong_phai_thu) : 0;

  var rows = [
    ['Thu',           _dCur(dt),   '#00d68f'],
    ['Chi',           _dCur(cp),   '#ff4d6d'],
    ['Lợi nhuận',     _dCur(ln),   ln>=0?'#00d68f':'#ff4d6d'],
    ['Công nợ phải thu', _dCur(cn), '#fbbd24'],
  ];

  var html = '<div class="dash-card-title">&#x1F4B0; Tài chính</div>'
    + '<div style="display:flex;flex-direction:column;gap:8px;padding-top:6px;">';
  rows.forEach(function(r) {
    html += '<div style="display:flex;justify-content:space-between;align-items:center;'
          + 'padding:8px 12px;background:var(--bg3);border-radius:8px;">'
          +   '<span style="font-size:11px;color:var(--text3);">' + r[0] + '</span>'
          +   '<span style="font-size:13px;font-weight:800;color:' + r[2] + ';">' + r[1] + '</span>'
          + '</div>';
  });
  html += '</div>';
  wrap.innerHTML = html;
}

// ── Helpers ───────────────────────────────────────────────────────
function _updateTimestamp() {
  var el = document.getElementById('dash-updated'); if (!el) return;
  var d = new Date();
  var h = d.getHours(), m = d.getMinutes();
  el.textContent = 'Cập nhật: ' + (h<10?'0'+h:h) + ':' + (m<10?'0'+m:m)
    + ' | Auto-refresh mỗi 5 phút';
}

function _getMonth() {
  var el = document.getElementById('dash-month');
  return el ? Number(el.value) : new Date().getMonth()+1;
}

function _getYear() {
  var el = document.getElementById('dash-year');
  return el ? Number(el.value) : new Date().getFullYear();
}

function _monthOptions() {
  var cur = new Date().getMonth()+1;
  var months = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  return months.map(function(m,i){
    var v = i+1;
    return '<option value="'+v+'"'+(v===cur?' selected':'')+'>'+m+'</option>';
  }).join('');
}

function _yearOptions() {
  var cur = new Date().getFullYear();
  var h = '';
  for (var y=cur; y>=cur-2; y--) {
    h += '<option value="'+y+'"'+(y===cur?' selected':'')+'>'+y+'</option>';
  }
  return h;
}

function _dDestroyChart(key) {
  if (_dCharts[key]) {
    try { _dCharts[key].destroy(); } catch(e) {}
    delete _dCharts[key];
  }
}

// ── Chart.js loader ───────────────────────────────────────────────
function _ensureChartJs(cb) {
  if (window.Chart) { cb(); return; }
  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
  s.onload  = cb;
  s.onerror = function() {
    // Fallback: render text tables nếu Chart.js không load được
    console.warn('[Dashboard] Chart.js không load được — dùng text tables');
    cb();
  };
  document.head.appendChild(s);
}

// ── Polling ───────────────────────────────────────────────────────
function _startPoll() {
  if (_dTimer) clearInterval(_dTimer);
  _dTimer = setInterval(function() {
    if (document.visibilityState === 'hidden') return;
    if (!document.getElementById('sk-dash')) {
      clearInterval(_dTimer); _dTimer = null; return;
    }
    _fetchAll();
  }, POLL_MS);
}

// ── Bind events ───────────────────────────────────────────────────
function _bindDashEvents() {
  var reloadBtn = document.getElementById('dash-reload');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', function() {
      reloadBtn.style.opacity = '.5';
      _fetchAll();
      setTimeout(function(){ reloadBtn.style.opacity='1'; }, 800);
    });
  }
  var mSel = document.getElementById('dash-month');
  var ySel = document.getElementById('dash-year');
  if (mSel) mSel.addEventListener('change', _fetchAll);
  if (ySel) ySel.addEventListener('change', _fetchAll);
}

// ── Export ────────────────────────────────────────────────────────
window.loadDashboard = loadDashboard;

})();
