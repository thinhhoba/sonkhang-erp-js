/* ================================================================
// [v5.35] 22/03/2026 — Dashboard chart 14d + Chi tiet don + Bulk + Pagination
// [v5.25.1] 22/03/2026 — Fix: sk-modal-box null, race condition guard
// [v5.22.1] 22/03/2026 — Fix: STATE global → local _soPage
 * sk-sales-orders.js — SonKhang ERP v4.0
 * UI Quan ly Don hang — Tat ca trang thai — Lien ket da phan he
 * 21/03/2026
 * ================================================================ */
(function () {
  'use strict';

  var _api   = function () { return typeof window.api==='function'?window.api:typeof api==='function'?api:null; };

  /* Modal tự build - không phụ thuộc sk-sales-ui.js */
  function _soModal(html, size) {
    _soCloseModal();
    var ov = document.createElement('div');
    ov.id = 'sk-sales-modal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    var box = document.createElement('div');
    // [v5.25.1 FIX] BUG-1: Thêm className để querySelector('.sk-modal-box') không trả null
    box.className = 'sk-modal-box';
    box.style.cssText = 'background:var(--bg2,#0f1117);border:1px solid var(--border2,#252d40);border-radius:18px;max-height:90vh;overflow-y:auto;width:100%;max-width:'+(size==='lg'?'820px':size==='xl'?'1100px':'560px')+';';
    box.innerHTML = html;
    ov.appendChild(box);
    ov.addEventListener('click', function(e){ if(e.target===ov) _soCloseModal(); });
    document.body.appendChild(ov);
    /* Sync voi window.showSalesModal neu co */
    if (typeof window.showSalesModal === 'function') window.showSalesModal = _soModal;
  }
  function _soCloseModal() {
    var el = document.getElementById('sk-sales-modal');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }
  window.showSalesModal  = _soModal;
  window.closeSalesModal = _soCloseModal;
  var _esc   = function (s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var _gv    = function (id) { var e=document.getElementById(id); return e?e.value:''; };
  var _toast = function (m,t) { if(typeof window._hrmToast==='function') window._hrmToast(m,t||'ok'); };
  var _ct    = function () { return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };

  /* State */
  var _orders = [], _curOrderId = null, _cartItems = [];

  var STATUS_TABS = [
    { id:'all',              label:'Tất cả',          icon:'📋' },
    { id:'nhap',             label:'Nháp',             icon:'📝' },
    { id:'cho_xac_nhan',     label:'Chờ duyệt',        icon:'⏳' },
    { id:'da_xac_nhan',      label:'Đã xác nhận',      icon:'✅' },
    { id:'dang_giao',        label:'Đang giao',        icon:'🚚' },
    { id:'chua_thanh_toan',  label:'Chưa TT',          icon:'💳' },
    { id:'hoan_thanh',       label:'Hoàn thành',       icon:'🎉' },
    { id:'tra_hang',         label:'Trả hàng',         icon:'↩️' },
    { id:'huy',              label:'Đã hủy',           icon:'❌' }
  ];

  var STATUS_LABEL = {
    nhap:'Nháp', cho_xac_nhan:'Chờ duyệt', da_xac_nhan:'Đã xác nhận',
    dang_giao:'Đang giao', da_giao:'Đã giao', hoan_thanh:'Hoàn thành',
    huy:'Đã hủy', tra_hang:'Trả hàng', chua_thanh_toan:'Chưa TT'
  };

  /* ── Entry point ──────────────────────────────────────────── */
  
// ════════════════════════════════════════════════════════════════
// [v5.35] sk-sales-orders.js — NÂNG CẤP
// ════════════════════════════════════════════════════════════════

var _SO = { page:1, status:'all', q:'', from:'', to:'', sort:'ngay', total:0 };
var _cartItems = [];
var ORDER_STATUS_LABELS = {
  nhap:'Nháp', cho_xac_nhan:'Chờ duyệt', da_xac_nhan:'Đã duyệt',
  dang_giao:'Đang giao', da_giao:'Đã giao', hoan_thanh:'Hoàn thành',
  huy:'Đã hủy'
};
var ORDER_STATUS_COLORS = {
  nhap:'#64748b', cho_xac_nhan:'#fbbf24', da_xac_nhan:'#4f6fff',
  dang_giao:'#06b6d4', da_giao:'#10b981', hoan_thanh:'#34d399', huy:'#f87171'
};
var ORDER_WORKFLOW = ['nhap','cho_xac_nhan','da_xac_nhan','dang_giao','da_giao','hoan_thanh'];

function loadDonHang() {
  var ct = _ct(); if (!ct) return;
  if (typeof window._salesInjectCSS === 'function') window._salesInjectCSS();
  ct.innerHTML = _buildShell();
  _loadDashboard();
  _loadOrders('all');
}

function _buildShell() {
  return '<div id="so-root" class="fade-in" style="padding:24px;">'
    + '<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:18px;">'
      + '<div><h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F6D2; Quan ly Don hang</h1>'
        + '<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Tao don · Theo doi · Thanh toan · Giao hang</p></div>'
      + '<button id="so-new-btn" style="background:rgba(52,211,153,.15);border:1px solid rgba(52,211,153,.3);color:var(--green);border-radius:9px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2795; Tao don hang</button>'
    + '</div>'
    // KPI row
    + '<div id="so-kpi-row" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;"></div>'
    // Chart + Top5 row
    + '<div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:14px;">'
      + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        + '<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:8px;">Doanh thu 14 ngay</div>'
        + '<canvas id="so-chart" height="120"></canvas>'
      + '</div>'
      + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        + '<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:10px;">Top 5 SP ban chay</div>'
        + '<div id="so-top5"></div>'
      + '</div>'
    + '</div>'
    // Filter bar
    + '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">'
      + '<input id="so-search" type="text" placeholder="Tim ma don, ten KH..." style="flex:1;min-width:150px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 11px;color:var(--text);font-family:inherit;font-size:12px;">'
      + '<select id="so-status-sel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 9px;color:var(--text3);font-family:inherit;font-size:11px;">'
        + '<option value="all">Tat ca</option>'
        + Object.keys(ORDER_STATUS_LABELS).map(function(k){ return '<option value="'+k+'">'+ORDER_STATUS_LABELS[k]+'</option>'; }).join('')
      + '</select>'
      + '<input id="so-from" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-family:inherit;font-size:11px;">'
      + '<input id="so-to" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-family:inherit;font-size:11px;">'
      + '<button id="so-search-btn" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
      + '<button id="so-bulk-btn" style="background:rgba(79,111,255,.12);border:1px solid rgba(79,111,255,.25);color:var(--accent2);border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x270F; Bulk</button>'
    + '</div>'
    // Bulk bar (hidden)
    + '<div id="so-bulk-bar" style="display:none;background:rgba(79,111,255,.08);border:1px solid rgba(79,111,255,.2);border-radius:10px;padding:9px 14px;margin-bottom:10px;align-items:center;justify-content:space-between;">'
      + '<span id="so-bulk-cnt" style="font-size:12px;font-weight:700;color:var(--accent2);">0 don duoc chon</span>'
      + '<div style="display:flex;gap:7px;">'
        + '<select id="so-bulk-status" style="background:var(--bg3);border:1px solid var(--border2);border-radius:7px;padding:5px 9px;color:var(--text);font-family:inherit;font-size:11px;">'
          + Object.keys(ORDER_STATUS_LABELS).map(function(k){ return '<option value="'+k+'">→ '+ORDER_STATUS_LABELS[k]+'</option>'; }).join('')
        + '</select>'
        + '<button id="so-bulk-apply" style="background:var(--accent);border:none;color:#fff;border-radius:7px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Ap dung</button>'
      + '</div>'
    + '</div>'
    + '<div id="so-list"></div>'
    + '<div id="so-pagination" style="display:flex;gap:6px;justify-content:center;margin-top:12px;flex-wrap:wrap;"></div>'
  + '</div>';
}

function _buildShellBindings() {
  var btn = document.getElementById('so-new-btn');
  if (btn) btn.addEventListener('click', function(){ _SO.page=1; _cartItems=[]; _loadOrderForm(null); });
  var doSearch = function(){
    _SO.q      = (document.getElementById('so-search')||{}).value||'';
    _SO.status = (document.getElementById('so-status-sel')||{}).value||'all';
    _SO.from   = (document.getElementById('so-from')||{}).value||'';
    _SO.to     = (document.getElementById('so-to')||{}).value||'';
    _SO.page   = 1;
    _loadOrders(_SO.status);
  };
  var sb = document.getElementById('so-search-btn');
  if (sb) sb.addEventListener('click', doSearch);
  var si = document.getElementById('so-search');
  if (si) si.addEventListener('keydown',function(e){if(e.key==='Enter')doSearch();});
  var bb = document.getElementById('so-bulk-btn');
  if (bb) bb.addEventListener('click', function(){
    var bar = document.getElementById('so-bulk-bar');
    if (bar) bar.style.display = bar.style.display==='flex'?'none':'flex';
  });
  var ba = document.getElementById('so-bulk-apply');
  if (ba) ba.addEventListener('click', _soBulkStatus);
}

// ── Dashboard ─────────────────────────────────────────────────────
function _loadDashboard() {
  var apiF = _api(); if (!apiF) return;
  var now  = new Date();
  apiF('sales_get_dashboard',{month:now.getMonth()+1,year:now.getFullYear()},function(e,d){
    if (e||!d||!d.ok) return;
    var s   = d.stats||{};
    var kpi = document.getElementById('so-kpi-row'); if (!kpi) return;
    var kpis = [
      {icon:'&#x1F4CB;', lbl:'Tong don thang', v:s.total_orders||0,   clr:'#818cf8', fmt:false},
      {icon:'&#x1F4B0;', lbl:'Doanh thu',       v:s.doanh_thu||0,     clr:'#34d399', fmt:true},
      {icon:'&#x1F4B3;', lbl:'Da thu',           v:s.da_thu||0,        clr:'#4f6fff', fmt:true},
      {icon:'&#x23F3;',  lbl:'Cho xac nhan',     v:s.so_don_moi||0,    clr:'#fbbf24', fmt:false},
    ];
    kpi.innerHTML = kpis.map(function(k){
      return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">'
          +'<span style="font-size:18px;">'+k.icon+'</span>'
          +'<span style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;">'+k.lbl+'</span>'
        +'</div>'
        +'<div style="font-size:20px;font-weight:900;color:'+k.clr+';font-family:monospace;">'
          +(k.fmt ? _fmtM(k.v)+'d' : k.v)
        +'</div>'
      +'</div>';
    }).join('');

    // Canvas chart by_day
    var byDay = d.by_day||[];
    var canvas = document.getElementById('so-chart');
    if (canvas && byDay.length) {
      var W = canvas.parentElement.clientWidth-28||300; var H=120;
      canvas.width=W; canvas.height=H;
      var ctx=canvas.getContext('2d');
      ctx.fillStyle='#0d1020'; ctx.fillRect(0,0,W,H);
      var maxV = Math.max.apply(null,byDay.map(function(d2){return d2.doanh_thu||0;}))||1;
      var bw   = Math.max(4,Math.floor((W-20)/byDay.length)-3);
      byDay.forEach(function(d2,di){
        var x  = 20+di*(bw+3);
        var hV = Math.round(((d2.doanh_thu||0)/maxV)*(H-25));
        var grd = ctx.createLinearGradient(x,H-25-hV,x,H-25);
        grd.addColorStop(0,'#4f6fff'); grd.addColorStop(1,'rgba(79,111,255,.2)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.roundRect(x,H-25-hV,bw,hV,3); ctx.fill();
        if (di%3===0) {
          ctx.fillStyle='#475569'; ctx.font='8px monospace'; ctx.textAlign='center';
          var parts=(d2.ngay||'').split('-');
          ctx.fillText((parts[2]||'')+'/'+(parts[1]||''),x+bw/2,H-4);
        }
        if (d2.don>0) {
          ctx.fillStyle='#94a3b8'; ctx.font='8px monospace'; ctx.textAlign='center';
          ctx.fillText(String(d2.don),x+bw/2,H-25-hV-2);
        }
      });
    }

    // Top 5 items
    var top5El = document.getElementById('so-top5');
    var top5   = d.top5_items||[];
    if (top5El) {
      if (!top5.length) { top5El.innerHTML='<div style="color:var(--text3);font-size:12px;">Chua co du lieu</div>'; }
      else {
        var maxSL = top5[0].so_luong||1;
        top5El.innerHTML = top5.map(function(t,i){
          var pct = Math.round((t.so_luong||0)/maxSL*100);
          return '<div style="margin-bottom:7px;">'
            +'<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;">'
              +'<span style="color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px;">'+(i+1)+'. '+_esc(t.ten||'')+'</span>'
              +'<span style="color:var(--accent2);font-weight:700;">'+t.so_luong+'</span>'
            +'</div>'
            +'<div style="height:4px;background:var(--bg3);border-radius:99px;overflow:hidden;">'
              +'<div style="height:100%;width:'+pct+'%;background:var(--accent2);border-radius:99px;"></div>'
            +'</div>'
          +'</div>';
        }).join('');
      }
    }
    // Bind new button after shell rendered
    _buildShellBindings();
  });
}

// ── Danh sách đơn ─────────────────────────────────────────────────
function _loadOrders(status) {
  _SO.status = (status&&status!=='all')?status:(_SO.status||'all');
  var el = document.getElementById('so-list'); if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div>';
  var apiF = _api(); if (!apiF) return;
  apiF('sales_get_orders',{
    search    : _SO.q||'',
    from_date : _SO.from||'',
    to_date   : _SO.to||'',
    trang_thai: _SO.status==='all'?'':_SO.status,
    page      : _SO.page||1,
    limit     : 20,
  },function(e,d){
    if (e||!d||!d.ok) { el.innerHTML='<div style="color:var(--red);padding:16px;">Loi tai don hang</div>'; return; }
    _SO.total = d.total||0;
    _renderOrderList(d.data||[]);
    _renderOrderPagination(_SO.total, 20);
  });
}

function _renderOrderList(orders) {
  var el = document.getElementById('so-list'); if (!el) return;
  if (!orders.length) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">'
      +'<div style="font-size:32px;margin-bottom:10px;">&#x1F6D2;</div>'
      +'<div style="font-size:14px;font-weight:700;">Chua co don hang nao</div>'
    +'</div>';
    return;
  }
  el.innerHTML = '<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:650px;">'
    +'<thead><tr style="background:var(--bg3);">'
      +'<th style="padding:8px;width:32px;"><input type="checkbox" id="so-all"></th>'
      +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma don</th>'
      +'<th style="padding:8px 12px;text-align:left;">Khach hang</th>'
      +'<th style="padding:8px 12px;text-align:center;">Ngay</th>'
      +'<th style="padding:8px 12px;text-align:right;">Tong tien</th>'
      +'<th style="padding:8px 12px;text-align:right;color:#34d399;">Da thu</th>'
      +'<th style="padding:8px 12px;text-align:right;color:#f87171;">Con no</th>'
      +'<th style="padding:8px 12px;text-align:center;">Trang thai</th>'
      +'<th style="padding:8px 12px;"></th>'
    +'</tr></thead><tbody>'
    +orders.map(function(o,oi){
      var stClr  = ORDER_STATUS_COLORS[o.trang_thai]||'#64748b';
      var stLbl  = ORDER_STATUS_LABELS[o.trang_thai]||o.trang_thai||'';
      var conNo  = (o.tong_thanh_toan||0)-(o.da_thanh_toan||0);
      return '<tr style="border-top:1px solid var(--border);">'
        +'<td style="padding:8px;text-align:center;"><input type="checkbox" class="so-cb" data-id="'+_esc(o.ma_don||'')+'"></td>'
        +'<td style="padding:8px 12px;font-weight:700;color:var(--accent2);font-family:monospace;font-size:11px;">'+_esc(o.ma_don||'')+'</td>'
        +'<td style="padding:8px 12px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(o.khach_ten||'')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;font-size:11px;color:var(--text3);">'+_esc((o.ngay||'').split('T')[0])+'</td>'
        +'<td style="padding:8px 12px;text-align:right;font-weight:700;">'+_fmtM(o.tong_thanh_toan||0)+'d</td>'
        +'<td style="padding:8px 12px;text-align:right;color:#34d399;font-weight:700;">'+_fmtM(o.da_thanh_toan||0)+'d</td>'
        +'<td style="padding:8px 12px;text-align:right;color:'+(conNo>0?'#f87171':'#34d399')+';font-weight:700;">'+_fmtM(conNo)+'d</td>'
        +'<td style="padding:8px 12px;text-align:center;">'
          +'<span style="background:'+stClr+'22;color:'+stClr+';border-radius:5px;padding:2px 8px;font-size:10px;font-weight:800;">'+stLbl+'</span>'
        +'</td>'
        +'<td style="padding:8px 12px;text-align:center;" id="so-act-'+oi+'"></td>'
      +'</tr>';
    }).join('')
    +'</tbody></table></div>'
    +'<div style="font-size:11px;color:var(--text3);margin-top:6px;text-align:right;">'+_SO.total+' don hang</div>';

  // Select all
  var allCb = document.getElementById('so-all');
  if (allCb) allCb.addEventListener('change',function(){
    document.querySelectorAll('.so-cb').forEach(function(c){c.checked=this.checked;},this);
    _soUpdBulk();
  });
  document.querySelectorAll('.so-cb').forEach(function(cb){cb.addEventListener('change',_soUpdBulk);});

  // Action buttons
  orders.forEach(function(o,oi){
    var td = document.getElementById('so-act-'+oi); if (!td) return;
    var detBtn = document.createElement('button');
    detBtn.textContent='Chi tiet';
    detBtn.style.cssText='background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:inherit;margin-right:3px;';
    detBtn.addEventListener('click',function(){ _soShowDetail(o.ma_don||o.id); });
    td.appendChild(detBtn);
    if (o.trang_thai==='hoan_thanh'||o.trang_thai==='huy') return;
    var nextSt = ORDER_WORKFLOW[ORDER_WORKFLOW.indexOf(o.trang_thai)+1];
    if (nextSt) {
      var nextBtn = document.createElement('button');
      nextBtn.textContent='→ '+(ORDER_STATUS_LABELS[nextSt]||nextSt);
      nextBtn.style.cssText='background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.25);color:#34d399;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:inherit;';
      nextBtn.addEventListener('click',(function(maDon,st){ return function(){
        var apiF=_api();if(!apiF)return;
        nextBtn.disabled=true;
        apiF('sales_update_order_status',{ma_don:maDon,trang_thai:st},function(e,d){
          if(!e&&d&&d.ok){ _toast('Cap nhat trang thai thanh cong','ok'); _loadOrders(_SO.status); }
          else{ nextBtn.disabled=false; _toast((d&&d.error)||'Loi','error'); }
        });
      };})(o.ma_don||o.id, nextSt));
      td.appendChild(nextBtn);
    }
  });
}

function _soUpdBulk() {
  var sel = Array.from(document.querySelectorAll('.so-cb:checked'));
  var bar = document.getElementById('so-bulk-bar');
  var cnt = document.getElementById('so-bulk-cnt');
  if (cnt) cnt.textContent = sel.length+' don duoc chon';
  if (bar) bar.style.display = sel.length>0 ? 'flex' : 'none';
}

function _soBulkStatus() {
  var sel = Array.from(document.querySelectorAll('.so-cb:checked'));
  if (!sel.length) { _toast('Chon it nhat 1 don','error'); return; }
  var newSt = (document.getElementById('so-bulk-status')||{}).value||'';
  if (!newSt) { _toast('Chon trang thai','error'); return; }
  if (!confirm('Doi '+sel.length+' don sang "'+ORDER_STATUS_LABELS[newSt]+'"?')) return;
  var apiF=_api();if(!apiF)return;
  var done=0, ok=0;
  sel.forEach(function(cb){
    var ma=cb.getAttribute('data-id');
    apiF('sales_update_order_status',{ma_don:ma,trang_thai:newSt},function(e,d){
      if(!e&&d&&d.ok) ok++;
      done++;
      if(done===sel.length){ _toast('Da doi '+ok+'/'+sel.length+' don','ok'); _loadOrders(_SO.status); }
    });
  });
}

// ── Pagination ────────────────────────────────────────────────────
function _renderOrderPagination(total, limit) {
  var el=document.getElementById('so-pagination');if(!el)return;
  var pages=Math.ceil(total/limit)||1; if(pages<=1){el.innerHTML='';return;}
  var h='',s=Math.max(1,_SO.page-2),e=Math.min(pages,_SO.page+2);
  if(s>1) h+='<button onclick="window._soPage(1)" style="'+_pgBtnSO(false)+'">1</button><span style="color:var(--text3);padding:0 4px;">...</span>';
  for(var p=s;p<=e;p++) h+='<button onclick="window._soPage('+p+')" style="'+_pgBtnSO(_SO.page===p)+'">'+p+'</button>';
  if(e<pages) h+='<span style="color:var(--text3);padding:0 4px;">...</span><button onclick="window._soPage('+pages+')" style="'+_pgBtnSO(false)+'">'+pages+'</button>';
  el.innerHTML=h;
}
function _pgBtnSO(a){ return 'background:'+(a?'var(--accent2)':'var(--bg3)')+';border:1px solid var(--border2);color:'+(a?'#fff':'var(--text2)')+';border-radius:7px;padding:5px 11px;font-size:12px;font-weight:700;cursor:pointer;'; }
window._soPage=function(p){ _SO.page=p; _loadOrders(_SO.status); };

// ── Chi tiết đơn hàng ─────────────────────────────────────────────
function _soShowDetail(maDon) {
  var apiF=_api();if(!apiF)return;
  var ov=document.createElement('div'); ov.id='so-detail-ov';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  var box=document.createElement('div');
  box.style.cssText='background:var(--bg2);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:660px;max-height:90vh;overflow-y:auto;';
  box.innerHTML='<div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">'
    +'<span style="font-size:14px;font-weight:900;">&#x1F4CB; Chi tiet don hang</span>'
    +'<button id="so-det-close" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:20px;">&#xd7;</button>'
  +'</div>'
  +'<div id="so-det-body" style="padding:20px;">'
    +'<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div>'
  +'</div>';
  ov.appendChild(box); document.body.appendChild(ov);
  box.querySelector('#so-det-close').addEventListener('click',function(){ov.remove();});

  apiF('sales_get_order_detail',{ma_don:maDon},function(e,d){
    var db=document.getElementById('so-det-body');if(!db)return;
    if(e||!d||!d.ok){db.innerHTML='<p style="color:var(--red);">Loi tai chi tiet</p>';return;}
    var o=d.order||{}; var items=d.items||[]; var hist=d.history||[];
    var stClr=ORDER_STATUS_COLORS[o.trang_thai]||'#64748b';
    var stLbl=ORDER_STATUS_LABELS[o.trang_thai]||o.trang_thai||'';
    var stIdx=ORDER_WORKFLOW.indexOf(o.trang_thai);

    // Timeline
    var tlHtml='<div style="display:flex;align-items:center;overflow-x:auto;padding:4px 0;margin-bottom:14px;">'
      +ORDER_WORKFLOW.map(function(st,i){
        var done=i<stIdx; var cur=i===stIdx;
        var clr=cur?'var(--accent2)':(done?'#34d399':'var(--text3)');
        return '<div style="display:flex;align-items:center;flex-shrink:0;">'
          +'<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">'
            +'<div style="width:28px;height:28px;border-radius:50%;border:2px solid '+clr+';background:'+(cur?'var(--accent2)':(done?'rgba(52,211,153,.15)':'var(--bg3)'))+';display:flex;align-items:center;justify-content:center;font-size:10px;color:'+(cur||done?'#fff':'var(--text3)'+';')+'">'+(done?'&#x2713;':(cur?'&#x25CF;':''))+'</div>'
            +'<div style="font-size:8px;color:'+clr+';font-weight:'+(cur?900:400)+';white-space:nowrap;">'+ORDER_STATUS_LABELS[st]+'</div>'
          +'</div>'
          +(i<ORDER_WORKFLOW.length-1?'<div style="height:2px;width:22px;background:'+(done?'#34d399':'var(--border2)')+';margin:0 3px;margin-bottom:12px;flex-shrink:0;"></div>':'')
        +'</div>';
      }).join('')
    +'</div>';

    // Info
    var infoHtml='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
      +'<div style="background:var(--bg3);border-radius:10px;padding:12px;">'
        +'<div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:8px;">Thong tin don</div>'
        +[['Ma don',o.ma_don||''],['Ngay tao',(o.ngay||'').split('T')[0]],
          ['Trang thai',stLbl],['Ghi chu',o.ghi_chu||'—']
        ].map(function(r){
          return '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px;">'
            +'<span style="color:var(--text3);">'+_esc(r[0])+'</span>'
            +'<span style="font-weight:700;color:var(--text);">'+_esc(r[1])+'</span>'
          +'</div>';
        }).join('')
      +'</div>'
      +'<div style="background:var(--bg3);border-radius:10px;padding:12px;">'
        +'<div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:8px;">Khach hang</div>'
        +[['Ten KH',o.khach_ten||''],['SĐT',o.sdt||'—'],['Dia chi',o.dia_chi||'—']
        ].map(function(r){
          return '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:12px;">'
            +'<span style="color:var(--text3);">'+_esc(r[0])+'</span>'
            +'<span style="font-weight:700;color:var(--text);max-width:140px;overflow:hidden;text-overflow:ellipsis;">'+_esc(r[1])+'</span>'
          +'</div>';
        }).join('')
      +'</div>'
    +'</div>';

    // Items table
    var itemsHtml='<div style="margin-bottom:14px;">'
      +'<div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:8px;">San pham ('+items.length+')</div>'
      +'<div style="border-radius:10px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;">'
      +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">SP</th>'
        +'<th style="padding:7px 10px;text-align:center;">SL</th>'
        +'<th style="padding:7px 10px;text-align:right;">Don gia</th>'
        +'<th style="padding:7px 10px;text-align:right;">Thanh tien</th>'
      +'</tr></thead><tbody>'
      +items.map(function(it){
        return '<tr style="border-top:1px solid var(--border);">'
          +'<td style="padding:7px 10px;">'+_esc(it.ten_sp||'')+'</td>'
          +'<td style="padding:7px 10px;text-align:center;font-weight:700;">'+_esc(String(it.so_luong||0))+'</td>'
          +'<td style="padding:7px 10px;text-align:right;color:var(--text3);">'+_fmtM(it.don_gia||0)+'d</td>'
          +'<td style="padding:7px 10px;text-align:right;font-weight:700;color:var(--green);">'+_fmtM(it.thanh_tien||0)+'d</td>'
        +'</tr>';
      }).join('')
      +'</tbody></table></div>'
    +'</div>';

    // Totals
    var conNo=(o.tong_thanh_toan||0)-(o.da_thanh_toan||0);
    var totalsHtml='<div style="background:var(--bg3);border-radius:10px;padding:12px;margin-bottom:14px;">'
      +[['Tong goc',_fmtM(o.tong_goc||0)+'d'],['Chiet khau',_fmtM(o.chiet_khau||0)+'d'],
        ['Phi GH',_fmtM(o.phi_gh||0)+'d'],['Tong thanh toan',_fmtM(o.tong_thanh_toan||0)+'d'],
        ['Da thu',_fmtM(o.da_thanh_toan||0)+'d'],['Con no',_fmtM(conNo)+'d']
      ].map(function(r,i){
        var isTotal=i>=3; var isDebt=i===5&&conNo>0;
        return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:'+(isTotal?'13':'12')+'px;font-weight:'+(isTotal?900:400)+';">'
          +'<span style="color:'+(isTotal?'var(--text)':'var(--text3)')+'">'+r[0]+'</span>'
          +'<span style="color:'+(isDebt?'#f87171':(i===4?'#34d399':'var(--text)'))+'">'+r[1]+'</span>'
        +'</div>';
      }).join('')
    +'</div>';

    // Action buttons
    var nextSt = ORDER_WORKFLOW[stIdx+1];
    var actHtml='<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      +(nextSt?'<button id="so-det-next" style="background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.25);color:#34d399;border-radius:9px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">→ Chuyen: '+ORDER_STATUS_LABELS[nextSt]+'</button>':'')
      +(conNo>0?'<button id="so-det-pay" style="background:var(--accent);border:none;color:#fff;border-radius:9px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4B5; Thu tien ('+_fmtM(conNo)+'d)</button>':'')
    +'</div>';

    db.innerHTML = tlHtml + infoHtml + itemsHtml + totalsHtml + actHtml;

    if (nextSt) {
      var nb=db.querySelector('#so-det-next');
      if(nb) nb.addEventListener('click',function(){
        var apiF2=_api();if(!apiF2)return;
        nb.disabled=true;
        apiF2('sales_update_order_status',{ma_don:maDon,trang_thai:nextSt},function(e2,d2){
          if(!e2&&d2&&d2.ok){ ov.remove(); _toast('Da doi sang: '+ORDER_STATUS_LABELS[nextSt],'ok'); _loadOrders(_SO.status); }
          else{ nb.disabled=false; _toast((d2&&d2.error)||'Loi','error'); }
        });
      });
    }
    if (conNo>0) {
      var pb=db.querySelector('#so-det-pay');
      if(pb) pb.addEventListener('click',function(){
        var apiF3=_api();if(!apiF3)return;
        pb.disabled=true;pb.textContent='Dang xu ly...';
        apiF3('sales_update_payment',{ma_don:maDon,so_tien:conNo},function(e3,d3){
          if(!e3&&d3&&d3.ok){ ov.remove(); _toast('Da thu '+_fmtM(conNo)+'d','ok'); _loadOrders(_SO.status); }
          else{ pb.disabled=false;pb.innerHTML='&#x1F4B5; Thu tien ('+_fmtM(conNo)+'d)'; _toast((d3&&d3.error)||'Loi','error'); }
        });
      });
    }
  });
}

function _fmtM(n){ n=Number(n||0); if(n>=1e9)return(n/1e9).toFixed(1)+'ty'; if(n>=1e6)return(n/1e6).toFixed(1)+'tr'; if(n>=1e3)return Math.round(n/1e3)+'k'; return String(Math.round(n)); }
function _toast(m,t){ if(typeof window.skToast==='function')window.skToast(m,t||'ok'); else if(typeof window._hrmToast==='function')window._hrmToast(m,t); }

window.loadDonHang = loadDonHang;


function _loadOrderForm(existingId) {
    var apiF = _api(); if (!apiF) return;
    /* Load sản phẩm và khách hàng song song */
    var products = [], customers = [];
    var loaded = 0;
    function onLoaded() {
      loaded++;
      if (loaded < 2) return;
      _renderOrderForm(products, customers, existingId);
    }
    apiF('sales_get_products', { active:true }, function(e,d) {
      if (!e&&d&&d.ok) products = d.data||[]; onLoaded();
    });
    apiF('sales_get_customers', {}, function(e,d) {
      if (!e&&d&&d.ok) customers = d.data||[]; onLoaded();
    });
  }

function _renderOrderForm(products, customers) {
    var todayV = new Date().toISOString().split('T')[0];
    var prodOpts = '<option value="">-- Chọn sản phẩm --</option>'
      + products.map(function(p) {
          return '<option value="'+_esc(p.id)+'" data-price="'+p.gia_ban+'" data-unit="'+_esc(p.don_vi||'cái')+'">'+_esc(p.ten_sp)+' — '+( typeof window.fmtMoney==='function'?window.fmtMoney(p.gia_ban):p.gia_ban)+'/'+_esc(p.don_vi||'cái')+'</option>';
        }).join('');
    var khOpts = '<option value="">-- Chọn khách hàng --</option>'
      + customers.map(function(k) {
          return '<option value="'+_esc(k.id)+'" data-nhom="'+_esc(k.nhom||'le')+'">'+_esc(k.ten)+(k.phone?' — '+k.phone:'')+'</option>';
        }).join('');

    var html = '<div class="sk-modal-hd">'
      + '<div style="font-size:16px;font-weight:900;">🛒 Tạo đơn hàng mới</div>'
      + '<button class="btn-ghost" onclick="closeSalesModal()" style="padding:6px 10px;font-size:12px;">✕</button>'
      + '</div>'
      + '<div class="sk-modal-bd">'
      + '<div class="sk-form-grid" style="margin-bottom:16px;">'
      + '<div class="sk-form-group"><label class="sk-lbl">Khách hàng</label>'
      +   '<select class="form-input" id="so-kh-sel">'+khOpts+'</select></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">Ngày đặt</label>'
      +   '<input type="date" class="form-input" id="so-ngay" value="'+todayV+'"></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">Ngày giao dự kiến</label>'
      +   '<input type="date" class="form-input" id="so-ngay-giao"></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">PT thanh toán</label>'
      +   '<select class="form-input" id="so-pttt"><option value="tien_mat">Tiền mặt</option>'
      +   '<option value="chuyen_khoan">Chuyển khoản</option>'
      +   '<option value="cod">COD</option><option value="the">Thẻ</option></select></div>'
      + '<div class="sk-form-group sk-form-full"><label class="sk-lbl">Địa chỉ giao hàng</label>'
      +   '<input class="form-input" id="so-dia-chi" placeholder="Số nhà, đường, quận, tỉnh..."></div>'
      + '<div class="sk-form-group sk-form-full"><label class="sk-lbl">Ghi chú</label>'
      +   '<input class="form-input" id="so-note"></div>'
      + '</div>'

      /* Thêm sản phẩm */
      + '<div style="margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
      + '<div class="sk-lbl">Sản phẩm</div>'
      + '</div>'
      + '<div style="display:flex;gap:6px;margin-bottom:10px;">'
      +   '<select class="form-input" id="so-add-sp" style="flex:1;">'+prodOpts+'</select>'
      +   '<input type="number" class="form-input" id="so-add-qty" value="1" min="1" style="width:70px;">'
      +   '<button class="btn-ghost" onclick="_soAddToCart()" style="padding:8px 14px;font-size:12px;">+ Thêm</button>'
      + '</div>'
      + '<div id="so-cart"></div>'
      + '</div>'

      /* Tổng */
      + '<div class="card" style="padding:14px;margin-bottom:4px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;">'
      + '<div style="font-size:12px;color:var(--text3);">Phí giao hàng</div>'
      + '<input type="number" class="form-input" id="so-phi-gh" value="0" oninput="_soCalcTotal()" style="width:120px;">'
      + '</div>'
      + '<div style="display:flex;justify-content:space-between;font-size:18px;font-weight:900;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">'
      + '<span>Tổng thanh toán</span>'
      + '<span id="so-grand" style="color:var(--green);">0đ</span>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="sk-modal-ft">'
      + '<button class="btn-ghost" onclick="closeSalesModal()" style="font-size:12px;">Hủy</button>'
      + '<button class="btn-ghost" onclick="_soSubmitOrder(\'nhap\')" style="font-size:12px;">💾 Lưu nháp</button>'
      + '<button class="btn-primary" onclick="_soSubmitOrder(\'cho_xac_nhan\')" style="font-size:12px;">✅ Tạo đơn</button>'
      + '</div>';

    window.showSalesModal(html, 'lg');
    _renderCart();
  }

function _soAddToCart() {
    var sel    = document.getElementById('so-add-sp'); if (!sel||!sel.value) return;
    var opt    = sel.options[sel.selectedIndex];
    var spId   = sel.value;
    var qty    = Number(_gv('so-add-qty')||1);
    var price  = Number(opt.getAttribute('data-price')||0);
    var unit   = opt.getAttribute('data-unit')||'cái';
    var ten    = opt.text.split(' — ')[0];
    // Kiểm tra đã có chưa
    for (var i=0;i<_cartItems.length;i++) {
      if (_cartItems[i].sp_id===spId) { _cartItems[i].sl+=qty; _renderCart(); return; }
    }
    _cartItems.push({ sp_id:spId, ten_sp:ten, sl:qty, don_gia:price, don_vi:unit });
    _renderCart();
  }

function _renderCart() {
    var el = document.getElementById('so-cart'); if (!el) return;
    if (!_cartItems.length) { el.innerHTML='<div style="text-align:center;padding:12px;color:var(--text3);font-size:12px;">Chưa có sản phẩm</div>'; _soCalcTotal(); return; }
    el.innerHTML = '<div class="sk-table-wrap"><table class="sk-table"><thead><tr>'
      + '<th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th><th></th>'
      + '</tr></thead><tbody>'
      + _cartItems.map(function(it,i) {
          var tt = it.sl * it.don_gia;
          return '<tr>'
            + '<td><div style="font-weight:700;">'+_esc(it.ten_sp)+'</div><div style="font-size:10px;color:var(--text3);">'+_esc(it.don_vi)+'</div></td>'
            + '<td><input type="number" value="'+it.sl+'" min="1" oninput="_soCartQty('+i+',this.value)" style="width:60px;padding:4px 6px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--text);"></td>'
            + '<td>'+(typeof window.fmtMoney==='function'?window.fmtMoney(it.don_gia):it.don_gia)+'</td>'
            + '<td style="font-weight:800;">'+(typeof window.fmtMoney==='function'?window.fmtMoney(tt):tt)+'</td>'
            + '<td><button class="btn-danger" onclick="_soCartRemove('+i+')" style="padding:4px 8px;font-size:11px;">✕</button></td>'
            + '</tr>';
        }).join('')
      + '</tbody></table></div>';
    _soCalcTotal();
  }

function _soCalcTotal() {
    var sub   = _cartItems.reduce(function(s,it){ return s+it.sl*it.don_gia; },0);
    var phi   = Number(_gv('so-phi-gh')||0);
    var grand = sub + phi;
    var el    = document.getElementById('so-grand');
    if (el) el.textContent = typeof window.fmtMoney==='function'?window.fmtMoney(grand):grand+'đ';
  }

function _soSubmitOrder(status) {
    if (!_cartItems.length) { _toast('Thêm sản phẩm trước','error'); return; }
    var khId = _gv('so-kh-sel');
    if (!khId) { _toast('Chọn khách hàng','error'); return; }
    var btn = document.querySelector('.sk-modal-ft .btn-primary');
    if (btn) { btn.disabled=true; btn.textContent='Đang tạo...'; }
    var apiF = _api(); if (!apiF) return;
    apiF('sales_create_order', {
      khach_id  : khId,
      items     : _cartItems.map(function(it){ return { sp_id:it.sp_id, sl:it.sl }; }),
      phi_gh    : Number(_gv('so-phi-gh')||0),
      pt_tt     : _gv('so-pttt'),
      dia_chi_gh: _gv('so-dia-chi'),
      ghi_chu   : _gv('so-note'),
      trang_thai: status
    }, function(e,d) {
      if (btn) { btn.disabled=false; btn.textContent='✅ Tạo đơn'; }
      if (e||!d||!d.ok){ _toast((d&&d.error)||'Lỗi tạo đơn','error'); return; }
      _toast('✅ Tạo đơn thành công: '+d.ma_don,'ok');
      window.closeSalesModal();
      _loadOrders(_curStatus);
      _loadDashboard();
    });
  }

function _soConfirm(id) {
    window.salesConfirm('Xác nhận đơn hàng này?', function() {
      _soChangeStatus(id,'da_xac_nhan');
    });
  }

function _soChangeStatus(id, status) {
    var apiF = _api(); if (!apiF) return;
    apiF('sales_update_order_status', { id:id, status:status }, function(e,d) {
      if (e||!d||!d.ok) { _toast((d&&d.error)||'Lỗi','error'); return; }
      _toast('✅ Đã cập nhật: '+STATUS_LABEL[status],'ok');
      window.closeSalesModal();
      _loadOrders(_curStatus);
      _loadDashboard();
    });
  }

function _soRecordPayment(id) {
    var html = '<div class="sk-modal-hd"><div style="font-size:15px;font-weight:900;">💰 Ghi nhận thanh toán</div>'
      + '<button class="btn-ghost" onclick="closeSalesModal()" style="padding:6px 10px;">✕</button></div>'
      + '<div class="sk-modal-bd"><div class="sk-form-grid">'
      + '<div class="sk-form-group sk-form-full"><label class="sk-lbl">Số tiền nhận</label>'
      + '<input type="number" class="form-input" id="sp-amount" placeholder="0"></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">Phương thức</label>'
      + '<select class="form-input" id="sp-pttt"><option value="tien_mat">Tiền mặt</option>'
      + '<option value="chuyen_khoan">Chuyển khoản</option><option value="the">Thẻ</option></select></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">Ghi chú</label>'
      + '<input class="form-input" id="sp-note"></div>'
      + '</div></div>'
      + '<div class="sk-modal-ft"><button class="btn-ghost" onclick="closeSalesModal()">Hủy</button>'
      + '<button class="btn-primary" onclick="_soDoPayment(\''+_esc(id)+'\')" style="font-size:12px;">💰 Xác nhận</button></div>';
    window.showSalesModal(html);
  }

function _soDoPayment(id) {
    var amount = Number(_gv('sp-amount')||0);
    if (amount<=0) { _toast('Nhập số tiền','error'); return; }
    var apiF = _api(); if (!apiF) return;
    apiF('sales_update_payment', { id:id, amount:amount, pt_tt:_gv('sp-pttt'), ghi_chu:_gv('sp-note') }, function(e,d) {
      if (e||!d||!d.ok) { _toast((d&&d.error)||'Lỗi','error'); return; }
      _toast('✅ Đã ghi nhận: '+(typeof window.fmtMoney==='function'?window.fmtMoney(amount):amount),'ok');
      window.closeSalesModal();
      _loadOrders(_curStatus);
      _loadDashboard();
    });
  }

function _soDelivery(orderId) {
    var todayV = new Date().toISOString().split('T')[0];
    var html = '<div class="sk-modal-hd"><div style="font-size:15px;font-weight:900;">🚚 Tạo lệnh giao hàng</div>'
      + '<button class="btn-ghost" onclick="closeSalesModal()" style="padding:6px 10px;">✕</button></div>'
      + '<div class="sk-modal-bd"><div class="sk-form-grid">'
      + '<div class="sk-form-group sk-form-full"><label class="sk-lbl">Địa chỉ giao</label>'
      + '<input class="form-input" id="del-addr" placeholder="Số nhà, đường, quận..."></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">Ngày giao</label>'
      + '<input type="date" class="form-input" id="del-date" value="'+todayV+'"></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">Ghi chú tài xế</label>'
      + '<input class="form-input" id="del-note" placeholder="Lưu ý đặc biệt..."></div>'
      + '</div></div>'
      + '<div class="sk-modal-ft"><button class="btn-ghost" onclick="closeSalesModal()">Hủy</button>'
      + '<button class="btn-primary" onclick="_soDoDelivery(\''+_esc(orderId)+'\')" style="font-size:12px;">🚚 Tạo lệnh giao</button></div>';
    window.showSalesModal(html);
  }

function _soDoInvoice(orderId) {
    var apiF = _api(); if (!apiF) return;
    apiF('sales_create_invoice', {
      don_id    : orderId,
      thue_suat : Number(_gv('inv-thue')||10),
      so_hd     : _gv('inv-so'),
      dia_chi   : _gv('inv-addr'),
      mst       : _gv('inv-mst')
    }, function(e,d) {
      if (e||!d||!d.ok) { _toast((d&&d.error)||'Lỗi xuất HD','error'); return; }
      _toast('✅ Đã xuất hóa đơn: '+d.ma_hd+' — Tổng: '+(typeof window.fmtMoney==='function'?window.fmtMoney(d.tong_tien):d.tong_tien),'ok');
      window.closeSalesModal();
    });
  }

window.showSalesModal = _soModal;
window.showSalesModal  = _soModal;
window.closeSalesModal = _soCloseModal;
window._soTab = _soTab;
window._soSearch = _soSearch;
window._soRefresh = _soRefresh;
window._soShowSapoConfig = _soShowSapoConfig;
window._soDetail = _soDetail;
window._soNewOrder = _soNewOrder;
window._soAddToCart = _soAddToCart;
window._soCalcTotal = _soCalcTotal;
window._soSubmitOrder = _soSubmitOrder;
window._soConfirm = _soConfirm;
window._soChangeStatus = _soChangeStatus;
window._soRecordPayment = _soRecordPayment;
window._soDoPayment = _soDoPayment;
window._soDelivery = _soDelivery;
window._soDoDelivery = _soDoDelivery;
window._soCreateInvoice = _soCreateInvoice;
window._soDoInvoice = _soDoInvoice;

}());
