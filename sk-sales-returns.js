/* ================================================================
// [v5.35] 22/03/2026 — Redirect bao cao sang sk-bao-cao-bh-ui.js + flash timer
 * sk-sales-returns.js  SonKhang ERP v5.1
 * UI: Tra hang RMA + Bao cao + Combo/Flash sale
 * 21/03/2026
 * QUY TAC: 0 non-ASCII, 0 backslash-quote, 0 ES6, DOM API for onclick
 * ================================================================ */
(function () {
  'use strict';

  var _api   = function () { return typeof window.api==='function'?window.api:typeof api==='function'?api:null; };
  var _esc   = function (s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var _gv    = function (id) { var e=document.getElementById(id); return e?e.value:''; };
  var _toast = function (m,t) { if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };
  var _ct    = function () { return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
  var _fmt   = function (n) { return typeof window.fv==='function'?window.fv(n):(Number(n)||0).toLocaleString('vi-VN')+'d'; };

  /* -- Self-contained modal ---------------------------------- */
  function _modal(html, size) {
    _closeModal();
    var ov = document.createElement('div');
    ov.id = 'sk-ret-modal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--bg2,#0d1020);border:1px solid var(--border2,#252d40);border-radius:18px;max-height:90vh;overflow-y:auto;width:100%;max-width:'+(size==='lg'?'820px':'560px')+';';
    box.innerHTML = html;
    ov.appendChild(box);
    ov.addEventListener('click', function(e){ if(e.target===ov) _closeModal(); });
    document.body.appendChild(ov);
  }
  function _closeModal() { var el=document.getElementById('sk-ret-modal'); if(el&&el.parentNode) el.parentNode.removeChild(el); }
  window.closeSalesReturnModal = _closeModal;

  /* ================================================================
   * TRA HANG (RMA)
   * ================================================================ */
  function loadTraHang() {
    var ct = _ct(); if (!ct) return;
    ct.innerHTML = '<div class="fade-in" style="padding:24px;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
      + '<div><h1 style="font-size:22px;font-weight:900;">\u21A9 Tra hang (RMA)</h1>'
      + '<p style="font-size:12px;color:var(--text3);">Yeu cau -> Kiem hang -> Hoan tien -> Cap nhat ton kho</p></div>'
      + '<button id="btn-new-rma" style="background:rgba(255,77,109,.15);border:1px solid rgba(255,77,109,.3);color:#ff4d6d;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">+ Yeu cau tra hang</button>'
      + '</div>'
      + '<div id="ret-filter" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">'
      + ['','cho_duyet','kiem_hang','da_duyet','hoan_tien','tu_choi'].map(function(s){
          var labels={'':'Tat ca','cho_duyet':'Cho duyet','kiem_hang':'Kiem hang','da_duyet':'Da duyet','hoan_tien':'Hoan tien','tu_choi':'Tu choi'};
          var colors={'cho_duyet':'#fbbf24','kiem_hang':'#06d6d6','da_duyet':'#3d6bff','hoan_tien':'#00d68f','tu_choi':'#ff4d6d'};
          return '<button data-status="'+s+'" style="border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;background:var(--bg3);border:1px solid var(--border2);color:var(--text3);">'+(labels[s]||s)+'</button>';
        }).join('')
      + '</div>'
      + '<div id="ret-list"></div>'
      + '</div>';

    var btnNew = document.getElementById('btn-new-rma');
    if (btnNew) btnNew.addEventListener('click', _showNewReturnForm);

    document.querySelectorAll('#ret-filter button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('#ret-filter button').forEach(function(b){ b.style.background='var(--bg3)'; b.style.color='var(--text3)'; });
        btn.style.background='rgba(79,111,255,.15)'; btn.style.color='var(--accent2)';
        _loadReturns(btn.getAttribute('data-status'));
      });
    });

    _loadReturns('');
  }
  window.loadTraHang = loadTraHang;

  function _loadReturns(status) {
    var el = document.getElementById('ret-list'); if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_returns', { status:status }, function(e,d) {
      if (e||!d||!d.ok) { el.innerHTML='<p style="color:var(--red);padding:16px;">Loi tai du lieu</p>'; return; }
      var rows = d.data||[];
      if (!rows.length) {
        el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);">'
          + '<div style="font-size:36px;margin-bottom:12px;">\u21A9</div>'
          + '<div style="font-size:14px;">Chua co yeu cau tra hang</div></div>';
        return;
      }
      var colors={'cho_duyet':'#fbbf24','kiem_hang':'#06d6d6','da_duyet':'#3d6bff','hoan_tien':'#00d68f','tu_choi':'#ff4d6d'};
      var labels={'cho_duyet':'Cho duyet','kiem_hang':'Kiem hang','da_duyet':'Da duyet','hoan_tien':'Hoan tien','tu_choi':'Tu choi'};
      var html = '<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
        + '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
        + '<thead><tr style="background:var(--bg3);">'
        + '<th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);">Ma TH</th>'
        + '<th style="padding:10px 12px;text-align:left;">Ma Don</th>'
        + '<th style="padding:10px 12px;text-align:left;">Khach hang</th>'
        + '<th style="padding:10px 12px;text-align:left;">Ly do</th>'
        + '<th style="padding:10px 12px;text-align:right;">Hoan tra</th>'
        + '<th style="padding:10px 12px;text-align:center;">Trang thai</th>'
        + '<th style="padding:10px 12px;"></th>'
        + '</tr></thead><tbody>';
      rows.forEach(function(r) {
        var col = colors[r.trang_thai]||'#6b7a99';
        html += '<tr style="border-top:1px solid var(--border);">'
          + '<td style="padding:10px 12px;font-family:monospace;color:var(--accent2);">'+_esc(r.ma_th)+'</td>'
          + '<td style="padding:10px 12px;">'+_esc(r.ma_don)+'</td>'
          + '<td style="padding:10px 12px;font-weight:700;">'+_esc(r.khach_ten)+'</td>'
          + '<td style="padding:10px 12px;color:var(--text3);max-width:150px;overflow:hidden;text-overflow:ellipsis;">'+_esc(r.ly_do)+'</td>'
          + '<td style="padding:10px 12px;text-align:right;font-weight:800;color:var(--red);">'+_fmt(r.tong_hoan)+'</td>'
          + '<td style="padding:10px 12px;text-align:center;"><span style="padding:3px 8px;border-radius:6px;font-size:10px;font-weight:800;background:'+col+'22;color:'+col+';">'+_esc(labels[r.trang_thai]||r.trang_thai)+'</span></td>'
          + '<td style="padding:10px 12px;" id="ret-act-'+_esc(r.id)+'"></td>'
          + '</tr>';
      });
      html += '</tbody></table></div>';
      el.innerHTML = html;

      // Bind approve buttons
      rows.forEach(function(r) {
        var td = document.getElementById('ret-act-'+r.id);
        if (!td) return;
        if (r.trang_thai==='cho_duyet'||r.trang_thai==='kiem_hang') {
          var btnOk = document.createElement('button');
          btnOk.textContent = '\u2705 Duyet';
          btnOk.style.cssText = 'background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:#00d68f;border-radius:7px;padding:5px 10px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;margin-right:4px;';
          btnOk.addEventListener('click', function() { _approveReturn(r.id,'da_duyet'); });
          td.appendChild(btnOk);

          var btnNo = document.createElement('button');
          btnNo.textContent = '\u274C';
          btnNo.style.cssText = 'background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.2);color:#ff4d6d;border-radius:7px;padding:5px 8px;font-size:10px;cursor:pointer;';
          btnNo.addEventListener('click', function() { _approveReturn(r.id,'tu_choi'); });
          td.appendChild(btnNo);
        }
      });
    });
  }

  function _approveReturn(id, action) {
    var apiF = _api(); if (!apiF) return;
    apiF('sales_approve_return',{id:id,action:action},function(e,d){
      if(e||!d||!d.ok){_toast((d&&d.error)||'Loi','error');return;}
      _toast(action==='da_duyet'?'Da duyet tra hang + hoan tien':'Da tu choi','ok');
      _loadReturns('');
    });
  }

  function _showNewReturnForm() {
    var apiF = _api(); if (!apiF) return;
    // Load danh sach don hang co the tra
    apiF('sales_get_orders',{status:'hoan_thanh',limit:50},function(e,d){
      var orders = (!e&&d&&d.ok)?d.data:[];
      var opts = '<option value="">-- Chon don hang --</option>'
        + orders.map(function(o){
            return '<option value="'+_esc(o.id)+'" data-ten="'+_esc(o.khach_ten)+'" data-tong="'+o.tong_tt+'">'
              + _esc(o.ma_don)+' - '+_esc(o.khach_ten)+' - '+_fmt(o.tong_tt)+'</option>';
          }).join('');

      var html = '<div style="padding:0;">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);">'
        + '<div style="font-size:15px;font-weight:900;">\u21A9 Yeu cau tra hang</div>'
        + '<button id="ret-close-btn" style="background:none;border:none;color:var(--text3);font-size:18px;cursor:pointer;">x</button>'
        + '</div>'
        + '<div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
        + '<div style="grid-column:1/-1;"><label style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);display:block;margin-bottom:5px;">Don hang *</label>'
        + '<select id="rma-don" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'+opts+'</select></div>'
        + '<div style="grid-column:1/-1;"><label style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);display:block;margin-bottom:5px;">Ly do tra *</label>'
        + '<select id="rma-lydo" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
        + '<option value="hang_loi">Hang loi / Khong dung mo ta</option>'
        + '<option value="giao_nham">Giao nham hang</option>'
        + '<option value="khach_doi_y">Khach doi y</option>'
        + '<option value="khac">Ly do khac</option>'
        + '</select></div>'
        + '<div style="grid-column:1/-1;"><label style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);display:block;margin-bottom:5px;">Ghi chu</label>'
        + '<input id="rma-note" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;" placeholder="Mo ta chi tiet ly do..."></div>'
        + '<div id="rma-items-wrap" style="grid-column:1/-1;"></div>'
        + '</div>'
        + '<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
        + '<button id="rma-cancel-btn" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
        + '<button id="rma-submit-btn" style="background:rgba(255,77,109,.15);border:1px solid rgba(255,77,109,.3);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:#ff4d6d;font-family:inherit;">\u21A9 Gui yeu cau tra hang</button>'
        + '</div></div>';

      _modal(html);

      document.getElementById('ret-close-btn').addEventListener('click', _closeModal);
      document.getElementById('rma-cancel-btn').addEventListener('click', _closeModal);
      document.getElementById('rma-don').addEventListener('change', function() {
        _loadRMAItems(this.value);
      });
      document.getElementById('rma-submit-btn').addEventListener('click', _submitReturn);
    });
  }

  var _rmaItems = [];
  function _loadRMAItems(donId) {
    if (!donId) return;
    var wrap = document.getElementById('rma-items-wrap'); if (!wrap) return;
    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_order_detail',{id:donId},function(e,d){
      if (e||!d||!d.ok) return;
      var items = d.items||[];
      _rmaItems = items.map(function(it){ return Object.assign({},it,{selected:true,sl_tra:it.sl}); });
      var html = '<label style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);display:block;margin-bottom:8px;">San pham tra</label>'
        + '<div style="border-radius:8px;border:1px solid var(--border);overflow:hidden;">'
        + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
        + '<thead><tr style="background:var(--bg3);">'
        + '<th style="padding:8px;text-align:left;">Chon</th><th style="padding:8px;text-align:left;">San pham</th>'
        + '<th style="padding:8px;text-align:center;">SL</th><th style="padding:8px;text-align:right;">Gia</th>'
        + '</tr></thead><tbody>';
      items.forEach(function(it,idx){
        html += '<tr style="border-top:1px solid var(--border);">'
          + '<td style="padding:8px;text-align:center;"><input type="checkbox" id="rma-chk-'+idx+'" checked></td>'
          + '<td style="padding:8px;">'+_esc(it.ten_sp)+'</td>'
          + '<td style="padding:8px;text-align:center;"><input type="number" id="rma-sl-'+idx+'" value="'+it.sl+'" min="1" max="'+it.sl+'" style="width:60px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:4px 6px;color:var(--text);text-align:center;"></td>'
          + '<td style="padding:8px;text-align:right;font-weight:700;">'+_fmt(it.thanh_tien)+'</td>'
          + '</tr>';
      });
      html += '</tbody></table></div>';
      wrap.innerHTML = html;
    });
  }

  function _submitReturn() {
    var donId = _gv('rma-don');
    var lyDo  = _gv('rma-lydo');
    if (!donId) { _toast('Chon don hang','error'); return; }

    // Collect selected items
    var selectedItems = [];
    _rmaItems.forEach(function(it,idx){
      var chk = document.getElementById('rma-chk-'+idx);
      var slEl= document.getElementById('rma-sl-'+idx);
      if (!chk||!chk.checked) return;
      var sl = Number(slEl?slEl.value:it.sl);
      var tienTra = Math.round(it.don_gia * sl);
      selectedItems.push({ sp_id:it.sp_id, ten_sp:it.ten_sp, sl:sl, don_gia:it.don_gia, thanh_tien:tienTra, ly_do:lyDo });
    });
    if (!selectedItems.length) { _toast('Chon it nhat 1 san pham','error'); return; }

    var btn = document.getElementById('rma-submit-btn');
    if (btn) { btn.disabled=true; btn.textContent='Dang gui...'; }
    var apiF = _api(); if (!apiF) return;
    apiF('sales_create_return',{don_id:donId,ly_do:lyDo,items:selectedItems,ghi_chu:_gv('rma-note')},function(e,d){
      if (btn) { btn.disabled=false; btn.textContent='\u21A9 Gui yeu cau tra hang'; }
      if(e||!d||!d.ok){_toast((d&&d.error)||'Loi','error');return;}
      _toast('Da gui yeu cau: '+d.ma_th,'ok');
      _closeModal();
      _loadReturns('');
    });
  }

  /* ================================================================
   * BAO CAO BAN HANG
   * ================================================================ */
  function loadBaoCaoBanHang() {
  // [v5.35] Redirect sang sk-bao-cao-bh-ui.js
  if (typeof window.loadBaoCaoBH === 'function') { window.loadBaoCaoBH(); return; }
  var ct=_ct();if(!ct)return;
  ct.innerHTML='<div style="padding:32px;text-align:center;color:var(--text3);">'
    +'<div style="font-size:28px;margin-bottom:10px;">&#x1F4CA;</div>'
    +'<div style="font-size:14px;font-weight:700;">Bao cao Bán hang</div>'
    +'<div style="font-size:12px;margin-top:6px;">Module dang tai... Thu lai sau.</div>'
  +'</div>';
}
  window.loadBaoCaoBanHang = loadBaoCaoBanHang;

  function _loadReport(tab, month, year) {
    var el = document.getElementById('report-body'); if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
    var apiF = _api(); if (!apiF) return;

    if (tab==='revenue') {
      apiF('sales_report_revenue',{period:'month',month:month,year:year},function(e,d){
        if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi tai bao cao</p>';return;}
        el.innerHTML = _renderRevenueReport(d);
      });
    } else if (tab==='top') {
      apiF('sales_report_top_products',{month:month,year:year,limit:20},function(e,d){
        if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi</p>';return;}
        el.innerHTML = _renderTopProducts(d);
      });
    } else if (tab==='commission') {
      apiF('sales_get_commissions',{month:month,year:year},function(e,d){
        if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi</p>';return;}
        el.innerHTML = _renderCommissions(d);
      });
    } else if (tab==='profit') {
      apiF('sales_report_profit',{limit:30},function(e,d){
        if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi</p>';return;}
        el.innerHTML = _renderProfit(d);
      });
    }
  }

  function _kpiBox(icon, label, val, color) {
    return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;display:flex;gap:12px;align-items:center;">'
      + '<div style="font-size:24px;">'+icon+'</div>'
      + '<div><div style="font-size:18px;font-weight:900;color:'+(color||'var(--text)')+';">'+val+'</div>'
      + '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);">'+label+'</div></div></div>';
  }

  function _renderRevenueReport(d) {
    var s = d.summary||{};
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;">'
      + _kpiBox('&#x1F4CB;', 'Tong don', s.tong_don||0, 'var(--text)')
      + _kpiBox('&#x1F4B0;', 'Doanh thu', _fmt(s.doanh_thu), 'var(--green)')
      + _kpiBox('&#x2705;',  'Da thu',    _fmt(s.da_thu),    'var(--cyan)')
      + _kpiBox('&#x1F4B3;', 'Chua thu',  _fmt(s.chua_thu),  'var(--yellow)')
      + _kpiBox('&#x21A9;',  'Tra hang',  _fmt(s.tra_hang),  'var(--red)')
      + '</div>';

    // Table by date
    var rows = d.by_date||[];
    if (rows.length) {
      html += '<div style="font-size:12px;font-weight:800;margin-bottom:8px;">Chi tiet theo ngay</div>'
        + '<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
        + '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
        + '<thead><tr style="background:var(--bg3);">'
        + '<th style="padding:10px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);">Ngay</th>'
        + '<th style="padding:10px;text-align:right;">Don hang</th>'
        + '<th style="padding:10px;text-align:right;">Doanh thu</th>'
        + '<th style="padding:10px;text-align:right;">Da thu</th>'
        + '</tr></thead><tbody>';
      rows.forEach(function(r){
        html += '<tr style="border-top:1px solid var(--border);">'
          + '<td style="padding:10px;font-family:monospace;">'+_esc(r.ngay)+'</td>'
          + '<td style="padding:10px;text-align:right;">'+r.don+'</td>'
          + '<td style="padding:10px;text-align:right;font-weight:700;color:var(--green);">'+_fmt(r.doanh_thu)+'</td>'
          + '<td style="padding:10px;text-align:right;color:var(--cyan);">'+_fmt(r.da_thu)+'</td>'
          + '</tr>';
      });
      html += '</tbody></table></div>';
    }

    // By sale
    var sales = d.by_sale||[];
    if (sales.length) {
      html += '<div style="font-size:12px;font-weight:800;margin-top:16px;margin-bottom:8px;">Theo nhan vien Sale</div>'
        + '<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
        + '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
        + '<thead><tr style="background:var(--bg3);">'
        + '<th style="padding:10px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);">#</th>'
        + '<th style="padding:10px;text-align:left;">Nhan vien</th>'
        + '<th style="padding:10px;text-align:right;">Don</th>'
        + '<th style="padding:10px;text-align:right;">Doanh thu</th>'
        + '<th style="padding:10px;text-align:right;">Hoa hong</th>'
        + '</tr></thead><tbody>';
      sales.forEach(function(r,i){
        html += '<tr style="border-top:1px solid var(--border);">'
          + '<td style="padding:10px;color:var(--text3);">'+(i+1)+'</td>'
          + '<td style="padding:10px;font-weight:700;">'+_esc(r.ten||r.sale_id)+'</td>'
          + '<td style="padding:10px;text-align:right;">'+r.don+'</td>'
          + '<td style="padding:10px;text-align:right;font-weight:700;color:var(--green);">'+_fmt(r.doanh_thu)+'</td>'
          + '<td style="padding:10px;text-align:right;color:var(--yellow);">'+_fmt(r.hoa_hong||0)+'</td>'
          + '</tr>';
      });
      html += '</tbody></table></div>';
    }
    return html;
  }

  function _renderTopProducts(d) {
    var rows = d.data||[];
    if (!rows.length) return '<div style="text-align:center;padding:32px;color:var(--text3);">Chua co du lieu</div>';
    var html = '<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
      + '<thead><tr style="background:var(--bg3);">'
      + '<th style="padding:10px;text-align:center;width:40px;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);">#</th>'
      + '<th style="padding:10px;text-align:left;">San pham</th>'
      + '<th style="padding:10px;text-align:right;">SL ban</th>'
      + '<th style="padding:10px;text-align:right;">So don</th>'
      + '<th style="padding:10px;text-align:right;">Doanh thu</th>'
      + '</tr></thead><tbody>';
    rows.forEach(function(r){
      var medal = r.rank===1?'&#x1F947;':r.rank===2?'&#x1F948;':r.rank===3?'&#x1F949;':r.rank;
      html += '<tr style="border-top:1px solid var(--border);">'
        + '<td style="padding:10px;text-align:center;font-size:16px;">'+medal+'</td>'
        + '<td style="padding:10px;font-weight:700;">'+_esc(r.ten_sp)+'</td>'
        + '<td style="padding:10px;text-align:right;font-weight:700;color:var(--cyan);">'+r.tong_sl+'</td>'
        + '<td style="padding:10px;text-align:right;color:var(--text3);">'+r.so_don+'</td>'
        + '<td style="padding:10px;text-align:right;font-weight:800;color:var(--green);">'+_fmt(r.tong_tt)+'</td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function _renderCommissions(d) {
    var rows = d.data||[];
    var html = '<div style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);border-radius:12px;padding:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">'
      + '<div style="font-size:13px;font-weight:700;">Tong hoa hong thang: <span style="color:var(--yellow);font-size:18px;font-weight:900;">'+_fmt(d.total_hoa_hong||0)+'</span></div>'
      + '</div>';
    if (!rows.length) return html+'<div style="text-align:center;padding:24px;color:var(--text3);">Chua co hoa hong</div>';
    html += '<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
      + '<thead><tr style="background:var(--bg3);">'
      + '<th style="padding:10px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);">Sale</th>'
      + '<th style="padding:10px;text-align:left;">Ma don</th>'
      + '<th style="padding:10px;text-align:right;">Doanh thu</th>'
      + '<th style="padding:10px;text-align:right;">Ty le</th>'
      + '<th style="padding:10px;text-align:right;">Hoa hong</th>'
      + '<th style="padding:10px;text-align:center;">Trang thai</th>'
      + '</tr></thead><tbody>';
    rows.forEach(function(r){
      var stCol = r.trang_thai==='cho_tt'?'#fbbf24':r.trang_thai==='da_tt'?'#00d68f':'#ff4d6d';
      html += '<tr style="border-top:1px solid var(--border);">'
        + '<td style="padding:10px;font-weight:700;">'+_esc(r.sale_ten||r.sale_id)+'</td>'
        + '<td style="padding:10px;font-family:monospace;color:var(--accent2);">'+_esc(r.ma_don)+'</td>'
        + '<td style="padding:10px;text-align:right;">'+_fmt(r.doanh_thu)+'</td>'
        + '<td style="padding:10px;text-align:right;color:var(--text3);">'+r.ty_le+'%</td>'
        + '<td style="padding:10px;text-align:right;font-weight:800;color:var(--yellow);">'+_fmt(r.tien_hh)+'</td>'
        + '<td style="padding:10px;text-align:center;"><span style="font-size:10px;font-weight:800;color:'+stCol+';">'+r.trang_thai+'</span></td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function _renderProfit(d) {
    var s = d.summary||{};
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;">'
      + _kpiBox('&#x1F4B5;', 'Tong doanh thu', _fmt(s.tong_doanh_thu), 'var(--green)')
      + _kpiBox('&#x1F4B8;', 'Chi phi von',    _fmt(s.tong_chi_phi),   'var(--red)')
      + _kpiBox('&#x1F4B9;', 'Loi nhuan',      _fmt(s.tong_loi_nhuan), 'var(--cyan)')
      + _kpiBox('&#x1F4C8;', 'Margin TB',      (s.margin_tb||0)+'%',  s.margin_tb>=20?'var(--green)':'var(--yellow)')
      + '</div>';
    var rows = d.data||[];
    if (!rows.length) return html+'<div style="text-align:center;padding:24px;color:var(--text3);">Chua co du lieu</div>';
    html += '<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
      + '<thead><tr style="background:var(--bg3);">'
      + '<th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:800;text-transform:uppercase;color:var(--text3);">Don hang</th>'
      + '<th style="padding:8px 10px;text-align:left;">Khach</th>'
      + '<th style="padding:8px 10px;text-align:right;">Doanh thu</th>'
      + '<th style="padding:8px 10px;text-align:right;">Chi phi</th>'
      + '<th style="padding:8px 10px;text-align:right;">Loi nhuan</th>'
      + '<th style="padding:8px 10px;text-align:right;">Margin</th>'
      + '</tr></thead><tbody>';
    rows.forEach(function(r){
      var mCol = r.margin>=20?'var(--green)':r.margin>=10?'var(--yellow)':'var(--red)';
      html += '<tr style="border-top:1px solid var(--border);">'
        + '<td style="padding:8px 10px;font-family:monospace;font-size:11px;color:var(--accent2);">'+_esc(r.ma_don)+'</td>'
        + '<td style="padding:8px 10px;max-width:120px;overflow:hidden;text-overflow:ellipsis;">'+_esc(r.khach_ten)+'</td>'
        + '<td style="padding:8px 10px;text-align:right;color:var(--green);">'+_fmt(r.tong_tt)+'</td>'
        + '<td style="padding:8px 10px;text-align:right;color:var(--text3);">'+_fmt(r.chi_phi)+'</td>'
        + '<td style="padding:8px 10px;text-align:right;font-weight:800;color:var(--cyan);">'+_fmt(r.loi_nhuan)+'</td>'
        + '<td style="padding:8px 10px;text-align:right;font-weight:800;color:'+mCol+';">'+r.margin+'%</td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  /* ================================================================
   * COMBO & FLASH SALE
   * ================================================================ */
  function loadComboFlashSale() {
    var ct = _ct(); if (!ct) return;
    ct.innerHTML = '<div class="fade-in" style="padding:24px;">'
      + '<h1 style="font-size:22px;font-weight:900;margin-bottom:4px;">&#x1F381; Combo & Flash Sale</h1>'
      + '<p style="font-size:12px;color:var(--text3);margin-bottom:20px;">Quan ly goi san pham va khuyen mai co thoi han</p>'
      + '<div style="display:flex;gap:8px;margin-bottom:16px;" id="cfs-tabs">'
      + '<button data-tab="combo" style="border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);">&#x1F381; Combo / Bundle</button>'
      + '<button data-tab="flash" style="border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;background:var(--bg3);border:1px solid var(--border2);color:var(--text3);">&#x26A1; Flash Sale</button>'
      + '</div>'
      + '<div id="cfs-body"></div>'
      + '</div>';

    var curTab = 'combo';
    document.querySelectorAll('#cfs-tabs button').forEach(function(btn){
      btn.addEventListener('click', function(){
        curTab = btn.getAttribute('data-tab');
        document.querySelectorAll('#cfs-tabs button').forEach(function(b){
          b.style.background='var(--bg3)'; b.style.borderColor='var(--border2)'; b.style.color='var(--text3)';
        });
        btn.style.background='rgba(79,111,255,.15)'; btn.style.borderColor='rgba(79,111,255,.3)'; btn.style.color='var(--accent2)';
        if (curTab==='combo') _loadCombos();
        else _loadFlashSales();
      });
    });
    _loadCombos();
  }
  window.loadComboFlashSale = loadComboFlashSale;

  function _loadCombos() {
    var el = document.getElementById('cfs-body'); if (!el) return;
    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_combos',{},function(e,d){
      var rows = (!e&&d&&d.ok)?d.data:[];
      var html = '<button id="btn-new-combo" style="margin-bottom:12px;background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">+ Tao Combo</button>';
      if (!rows.length) {
        html += '<div style="text-align:center;padding:32px;color:var(--text3);">Chua co combo nao</div>';
      } else {
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">';
        rows.forEach(function(r){
          html += '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;">'
            + '<div style="font-size:14px;font-weight:900;margin-bottom:6px;">'+_esc(r.ten)+'</div>'
            + '<div style="font-size:12px;color:var(--text3);margin-bottom:10px;">'+_esc(r.mo_ta)+'</div>'
            + '<div style="display:flex;justify-content:space-between;align-items:center;">'
            + '<div><div style="font-size:18px;font-weight:900;color:var(--accent2);">'+_fmt(r.gia_combo)+'</div>'
            + '<div style="font-size:10px;color:var(--text3);">Tiet kiem: <span style="color:var(--green);">'+_fmt(r.tiet_kiem)+'</span></div></div>'
            + '<span style="font-size:10px;padding:3px 8px;border-radius:6px;background:'+(r.active?'rgba(0,214,143,.1)':'rgba(255,77,109,.1)')+';color:'+(r.active?'var(--green)':'var(--red)')+';">'+(r.active?'Dang ban':'Ngung')+'</span>'
            + '</div></div>';
        });
        html += '</div>';
      }
      el.innerHTML = html;
      var btnNew = document.getElementById('btn-new-combo');
      if (btnNew) btnNew.addEventListener('click', _showComboForm);
    });
  }

  function _loadFlashSales() {
    var el = document.getElementById('cfs-body'); if (!el) return;
    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_flash_sales',{},function(e,d){
      // [v5.35] Countdown timers - clear previous
      if (window._fsTimers) window._fsTimers.forEach(function(t){clearInterval(t);}); window._fsTimers=[];
      var rows = (!e&&d&&d.ok)?d.data:[];
      var html = '<button id="btn-new-fs" style="margin-bottom:12px;background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.2);color:#ff4d6d;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x26A1; Tao Flash Sale</button>';
      if (!rows.length) {
        html += '<div style="text-align:center;padding:32px;color:var(--text3);">Chua co flash sale</div>';
      } else {
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">';
        var stColors = {dang_chay:'var(--green)',het_han:'var(--text3)',chua_bat_dau:'var(--yellow)',het_hang:'var(--red)',da_tat:'var(--text3)'};
        rows.forEach(function(r){
          var pct = r.sl_toi_da>0?Math.round(r.sl_da_ban/r.sl_toi_da*100):0;
          html += '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;">'
            + '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">'
            + '<div style="font-size:13px;font-weight:900;">'+_esc(r.ten)+'</div>'
            + '<span style="font-size:10px;font-weight:800;color:'+(stColors[r.status]||'var(--text3)')+';">'+r.status+'</span>'
            + '</div>'
            + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'
            + '<div style="font-size:20px;font-weight:900;color:#ff4d6d;">'+_fmt(r.gia_fs)+'</div>'
            + '<div style="font-size:10px;color:var(--text3);text-decoration:line-through;">'+_fmt(r.gia_goc)+'</div>'
            + '<div style="font-size:11px;font-weight:800;background:rgba(255,77,109,.15);color:#ff4d6d;padding:2px 7px;border-radius:5px;">-'+r.giam_gia+'%</div>'
            + '</div>'
            + '<div style="height:5px;background:var(--bg4);border-radius:5px;overflow:hidden;margin-bottom:4px;">'
            + '<div style="height:100%;width:'+pct+'%;background:var(--accent);border-radius:5px;transition:width .5s;"></div></div>'
            + '<div style="font-size:10px;color:var(--text3);">Da ban: '+r.sl_da_ban+'/'+r.sl_toi_da+' (Con '+r.sl_con+')</div>'
            + '</div>';
        });
        html += '</div>';
      }
      el.innerHTML = html;
      var btnNew = document.getElementById('btn-new-fs');
      if (btnNew) btnNew.addEventListener('click', _showFlashSaleForm);
    });
  }

  function _showComboForm() {
    var html = '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">'
      + '<div style="font-size:15px;font-weight:900;">&#x1F381; Tao Combo</div>'
      + '<button id="cb-close" style="background:none;border:none;color:var(--text3);font-size:18px;cursor:pointer;">x</button>'
      + '</div>'
      + '<div style="padding:20px;display:grid;gap:12px;">'
      + '<div><label style="font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);display:block;margin-bottom:5px;">Ten combo *</label><input id="cb-ten" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"></div>'
      + '<div><label style="font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);display:block;margin-bottom:5px;">Gia combo *</label><input id="cb-gia" type="number" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;" placeholder="0"></div>'
      + '<div><label style="font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);display:block;margin-bottom:5px;">Mo ta</label><input id="cb-mota" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"></div>'
      + '<div style="background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.15);border-radius:8px;padding:10px;font-size:11px;color:var(--text3);">Them san pham vao combo qua API (co the mo rong them trong phan build combo tren ERP)</div>'
      + '</div>'
      + '<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
      + '<button id="cb-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
      + '<button id="cb-save" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--accent2);font-family:inherit;">&#x1F4BE; Luu Combo</button>'
      + '</div>';
    _modal(html);
    document.getElementById('cb-close').addEventListener('click', _closeModal);
    document.getElementById('cb-cancel').addEventListener('click', _closeModal);
    document.getElementById('cb-save').addEventListener('click', function(){
      var ten = document.getElementById('cb-ten').value.trim();
      if (!ten) { _toast('Nhap ten combo','error'); return; }
      var apiF = _api(); if (!apiF) return;
      apiF('sales_save_combo',{ten:ten,gia_combo:Number(document.getElementById('cb-gia').value||0),mo_ta:document.getElementById('cb-mota').value,items:[]},function(e,d){
        if(e||!d||!d.ok){_toast((d&&d.error)||'Loi','error');return;}
        _toast('Da tao combo: '+ten,'ok');
        _closeModal();
        _loadCombos();
      });
    });
  }

  function _showFlashSaleForm() {
    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_products',{active:true},function(e,d){
      var products = (!e&&d&&d.ok)?d.data:[];
      var opts = '<option value="">-- Chon san pham --</option>'
        + products.map(function(p){
            return '<option value="'+_esc(p.id)+'" data-gia="'+p.gia_ban+'">'+_esc(p.ten_sp)+' - '+_fmt(p.gia_ban)+'</option>';
          }).join('');
      var now = new Date();
      var todayStr = now.toISOString().split('T')[0];
      var html = '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">'
        + '<div style="font-size:15px;font-weight:900;">&#x26A1; Tao Flash Sale</div>'
        + '<button id="fs-close" style="background:none;border:none;color:var(--text3);font-size:18px;cursor:pointer;">x</button>'
        + '</div>'
        + '<div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
        + '<div style="grid-column:1/-1;"><label style="font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);display:block;margin-bottom:5px;">Ten chuong trinh *</label><input id="fs-ten" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;" placeholder="Flash sale cuoi tuan..."></div>'
        + '<div style="grid-column:1/-1;"><label style="font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);display:block;margin-bottom:5px;">San pham *</label><select id="fs-sp" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'+opts+'</select></div>'
        + '<div><label style="font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);display:block;margin-bottom:5px;">Gia flash *</label><input id="fs-gia" type="number" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"></div>'
        + '<div><label style="font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);display:block;margin-bottom:5px;">So luong toi da</label><input id="fs-sl" type="number" value="10" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"></div>'
        + '<div><label style="font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);display:block;margin-bottom:5px;">Bat dau</label><input id="fs-bt" type="datetime-local" value="'+todayStr+'T08:00" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"></div>'
        + '<div><label style="font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);display:block;margin-bottom:5px;">Ket thuc</label><input id="fs-kt" type="datetime-local" value="'+todayStr+'T23:59" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"></div>'
        + '</div>'
        + '<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
        + '<button id="fs-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
        + '<button id="fs-save" style="background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:#ff4d6d;font-family:inherit;">&#x26A1; Bat dau Flash Sale</button>'
        + '</div>';
      _modal(html);
      document.getElementById('fs-close').addEventListener('click', _closeModal);
      document.getElementById('fs-cancel').addEventListener('click', _closeModal);
      document.getElementById('fs-save').addEventListener('click', function(){
        var ten  = document.getElementById('fs-ten').value.trim();
        var spId = document.getElementById('fs-sp').value;
        var gia  = Number(document.getElementById('fs-gia').value||0);
        if (!ten||!spId||!gia) { _toast('Nhap day du thong tin','error'); return; }
        var apiF2 = _api(); if (!apiF2) return;
        apiF2('sales_save_flash_sale',{
          ten:ten, sp_id:spId, gia_fs:gia,
          sl_toi_da:Number(document.getElementById('fs-sl').value||10),
          bat_dau:document.getElementById('fs-bt').value,
          ket_thuc:document.getElementById('fs-kt').value
        },function(e,d){
          if(e||!d||!d.ok){_toast((d&&d.error)||'Loi','error');return;}
          _toast('Da tao flash sale: '+ten,'ok');
          _closeModal();
          _loadFlashSales();
        });
      });
    });
  }

})();
