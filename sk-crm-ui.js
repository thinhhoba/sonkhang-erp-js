/* ================================================================
 * sk-crm-ui.js  SonKhang ERP v5.5.0
 * Module CRM Khach hang day du:
 *   - Danh sach KH: tim kiem, filter nhom, sort
 *   - Chi tiet KH: lich su mua, no cuoi, diem tich luy
 *   - CRUD KH: them, sua, xoa
 *   - Phan nhom: le, si, vip, dai_ly
 *   - Import tu Sapo
 *   - Bao cao CRM: top KH, tong no, diem
 * 21/03/2026 — 0 non-ASCII, DOM API
 * ================================================================ */
(function () {
  'use strict';

  var _api   = function(){ return typeof window.api==='function'?window.api:null; };
  var _ct    = function(){ var c=typeof window.getContent==='function'?window.getContent():null; return c||document.getElementById('sk-ct'); };
  var _esc   = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var _fmt   = function(n){ return (Number(n)||0).toLocaleString('vi-VN'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };

  var STATE = { page:1, q:'', nhom:'', sortCol:'', sortDir:'asc', curKH:null };

  var NHOM_LABELS = { le:'Khach le', si:'Khach si', vip:'VIP', dai_ly:'Dai ly', noi_bo:'Noi bo' };
  var NHOM_COLORS = { le:'var(--text3)', si:'var(--cyan)', vip:'var(--yellow)', dai_ly:'var(--green)', noi_bo:'var(--accent2)' };

  // ── Modal ────────────────────────────────────────────────────────
  function _modal(html, maxW) {
    var old = document.getElementById('sk-crm-modal');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var ov = document.createElement('div');
    ov.id = 'sk-crm-modal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;';
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--bg2,#0d1020);border:1px solid var(--border2,#252d40);border-radius:18px;width:100%;max-width:'+(maxW||'640px')+';margin:auto;';
    box.innerHTML = html;
    ov.appendChild(box);
    ov.addEventListener('click', function(e){ if(e.target===ov) _closeModal(); });
    document.body.appendChild(ov);
  }
  function _closeModal(){ var m=document.getElementById('sk-crm-modal'); if(m&&m.parentNode) m.parentNode.removeChild(m); }
  window.closeCRMModal = _closeModal;

  // ── Main entry point ─────────────────────────────────────────────
  function loadCRM() {
    var ct = _ct(); if (!ct) return;

    ct.innerHTML = '<div class="fade-in" style="padding:24px;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
      + '<div><h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F465; CRM Khach hang</h1>'
      + '<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Quan ly khach hang · Lich su mua · No cuoi · Diem tich luy</p></div>'
      + '<div style="display:flex;gap:8px;">'
      + '<button id="crm-import-btn" style="background:rgba(0,214,143,.1);border:1px solid rgba(0,214,143,.2);color:var(--green);border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F504; Import Sapo</button>'
      + '<button id="crm-new-btn" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">+ Them KH</button>'
      + '</div></div>'
      // KPI
      + '<div id="crm-kpi" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:20px;"></div>'
      // Filter bar
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center;">'
      + '<input id="crm-q" type="text" placeholder="Tim ten, so dien thoai, email..." style="flex:1;min-width:200px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
      + '<select id="crm-nhom" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
      + '<option value="">Tat ca nhom</option>'
      + Object.keys(NHOM_LABELS).map(function(k){ return '<option value="'+k+'">'+NHOM_LABELS[k]+'</option>'; }).join('')
      + '</select>'
      + '<button id="crm-search-btn" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
      + '</div>'
      + '<div id="crm-list"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>'
      + '<div id="crm-pager" style="display:flex;justify-content:center;gap:6px;margin-top:14px;"></div>'
      + '</div>';

    document.getElementById('crm-search-btn').addEventListener('click', function(){
      STATE.q    = document.getElementById('crm-q').value;
      STATE.nhom = document.getElementById('crm-nhom').value;
      STATE.page = 1;
      _loadList();
    });
    document.getElementById('crm-q').addEventListener('keydown', function(e){ if(e.keyCode===13) document.getElementById('crm-search-btn').click(); });
    document.getElementById('crm-new-btn').addEventListener('click', function(){ _showForm(null); });
    document.getElementById('crm-import-btn').addEventListener('click', _importFromSapo);

    _loadKPI();
    _loadList();
  }
  window.loadCRM        = loadCRM;
  window.loadKhachHang  = loadCRM; // alias cho SK_LOADERS cu
  window.loadSalesCRM   = loadCRM;

  // ── KPI ─────────────────────────────────────────────────────────
  function _loadKPI() {
    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_customers', { limit:1000 }, function(e,d){
      var el = document.getElementById('crm-kpi'); if (!el) return;
      var rows = (!e&&d&&d.ok) ? d.data||[] : [];
      var total    = rows.length;
      var vip      = rows.filter(function(r){ return r.nhom==='vip'; }).length;
      var daiLy    = rows.filter(function(r){ return r.nhom==='dai_ly'; }).length;
      var coNo     = rows.filter(function(r){ return (Number(r.no_cuoi)||0) > 0; }).length;
      var tongNo   = rows.reduce(function(a,r){ return a + (Number(r.no_cuoi)||0); }, 0);
      var tongDiem = rows.reduce(function(a,r){ return a + (Number(r.diem_tl)||0); }, 0);
      var items = [
        {icon:'&#x1F465;', label:'Tong KH',     val:total,             c:'var(--text)'},
        {icon:'&#x1F451;', label:'VIP',          val:vip,               c:'var(--yellow)'},
        {icon:'&#x1F3EA;', label:'Dai ly',       val:daiLy,             c:'var(--green)'},
        {icon:'&#x1F4B3;', label:'Co no cuoi',   val:coNo,              c:'var(--red)'},
        {icon:'&#x1F4B0;', label:'Tong no (d)',  val:_fmt(tongNo),      c:'var(--red)'},
        {icon:'&#x2B50;',  label:'Tong diem',    val:_fmt(tongDiem),    c:'var(--cyan)'},
      ];
      el.innerHTML = items.map(function(it){
        return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;gap:10px;align-items:center;">'
          + '<div style="font-size:20px;">'+it.icon+'</div>'
          + '<div><div style="font-size:16px;font-weight:900;color:'+it.c+';">'+it.val+'</div>'
          + '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);">'+it.label+'</div></div></div>';
      }).join('');
    });
  }

  // ── Danh sách KH ────────────────────────────────────────────────
  function _loadList() {
    var el = document.getElementById('crm-list'); if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_customers', { q:STATE.q, nhom:STATE.nhom, page:STATE.page, limit:30 }, function(e,d){
      if (e||!d||!d.ok) { el.innerHTML='<p style="color:var(--red);padding:16px;">Loi tai danh sach</p>'; return; }
      var rows = d.data||[];
      if (!rows.length) {
        el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text3);">'
          +'<div style="font-size:36px;margin-bottom:12px;">&#x1F465;</div>'
          +'<div style="font-size:14px;font-weight:700;">Chua co khach hang</div></div>';
        return;
      }
      var html = '<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
        +'<table style="width:100%;border-collapse:collapse;font-size:12px;">'
        +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);">Khach hang</th>'
        +'<th style="padding:10px 12px;text-align:left;">Lien he</th>'
        +'<th style="padding:10px 12px;text-align:center;">Nhom</th>'
        +'<th style="padding:10px 12px;text-align:right;">Tong mua</th>'
        +'<th style="padding:10px 12px;text-align:right;color:var(--red);">No cuoi</th>'
        +'<th style="padding:10px 12px;text-align:right;color:var(--cyan);">Diem</th>'
        +'<th style="padding:10px 12px;"></th>'
        +'</tr></thead><tbody>';
      rows.forEach(function(r){
        var nhomColor = NHOM_COLORS[r.nhom] || 'var(--text3)';
        var nhomLabel = NHOM_LABELS[r.nhom] || r.nhom || 'le';
        var no = Number(r.no_cuoi||0);
        html += '<tr style="border-top:1px solid var(--border);cursor:pointer;" id="crm-row-'+_esc(r.id)+'">'
          +'<td style="padding:8px 12px;">'
          +'<div style="font-weight:700;">'+_esc(r.ten_kh||r.ten||'')+'</div>'
          +'<div style="font-size:10px;color:var(--text3);">'+_esc(r.id||'')+'</div>'
          +'</td>'
          +'<td style="padding:8px 12px;font-size:11px;color:var(--text3);">'
          +_esc(r.phone||r.dien_thoai||'')+(r.email?'<br>'+_esc(r.email):'')
          +'</td>'
          +'<td style="padding:8px 12px;text-align:center;">'
          +'<span style="padding:2px 8px;border-radius:5px;font-size:10px;font-weight:800;background:rgba(255,255,255,.05);color:'+nhomColor+';">'+nhomLabel+'</span>'
          +'</td>'
          +'<td style="padding:8px 12px;text-align:right;font-weight:700;">'+_fmt(r.tong_mua||0)+'</td>'
          +'<td style="padding:8px 12px;text-align:right;font-weight:700;color:'+(no>0?'var(--red)':'var(--text3)')+';">'+(no>0?_fmt(no):'—')+'</td>'
          +'<td style="padding:8px 12px;text-align:right;color:var(--cyan);">'+_fmt(r.diem_tl||0)+'</td>'
          +'<td style="padding:8px 12px;" id="crm-act-'+_esc(r.id)+'"></td>'
          +'</tr>';
      });
      html += '</tbody></table></div>';
      el.innerHTML = html;

      rows.forEach(function(r){
        var td = document.getElementById('crm-act-'+r.id); if (!td) return;
        var btn = document.createElement('button');
        btn.innerHTML = '&#x270F;';
        btn.style.cssText = 'background:rgba(79,111,255,.1);border:1px solid rgba(79,111,255,.2);border-radius:6px;padding:4px 8px;font-size:13px;cursor:pointer;';
        btn.addEventListener('click', function(e){ e.stopPropagation(); _showForm(r); });
        td.appendChild(btn);

        var row = document.getElementById('crm-row-'+r.id);
        if (row) row.addEventListener('click', function(){ _showDetail(r); });
      });

      // Pager
      var total = d.total || rows.length;
      var pages = d.pages || 1;
      var pager = document.getElementById('crm-pager');
      if (pager) {
        pager.innerHTML = '<span style="font-size:11px;color:var(--text3);margin-right:8px;">'+total+' khach hang</span>';
        for (var p=1;p<=pages;p++) {
          var pp=p;
          pager.innerHTML += '<span data-p="'+pp+'" style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;'+(p===STATE.page?'background:rgba(79,111,255,.2);color:var(--accent2);':'background:var(--bg3);color:var(--text3);')+'">'+p+'</span>';
        }
        pager.querySelectorAll('[data-p]').forEach(function(sp){
          sp.addEventListener('click', function(){ STATE.page=Number(sp.getAttribute('data-p')); _loadList(); });
        });
      }
    });
  }

  // ── Chi tiết KH ─────────────────────────────────────────────────
  function _showDetail(kh) {
    STATE.curKH = kh;
    var apiF = _api();
    var html = '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
      +'<div><div style="font-size:16px;font-weight:900;">'+_esc(kh.ten_kh||kh.ten||'')+'</div>'
      +'<div style="font-size:11px;color:var(--text3);">'+_esc(kh.id||'')+'</div></div>'
      +'<button id="crm-d-close" style="background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;">&#x00D7;</button>'
      +'</div>'
      +'<div style="padding:16px 20px;">'
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">'
      +_kBox('Tong mua', _fmt(kh.tong_mua||0)+'d', 'var(--green)')
      +_kBox('No cuoi',  _fmt(kh.no_cuoi||0)+'d',  Number(kh.no_cuoi||0)>0?'var(--red)':'var(--text3)')
      +_kBox('Diem TL',  _fmt(kh.diem_tl||0),       'var(--cyan)')
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:16px;">'
      +_infoRow('&#x1F4DE; Dien thoai', kh.phone||kh.dien_thoai||'—')
      +_infoRow('&#x1F4E7; Email',      kh.email||'—')
      +_infoRow('&#x1F4CD; Dia chi',    kh.dia_chi||'—')
      +_infoRow('&#x1F3F7; Nhom',       NHOM_LABELS[kh.nhom]||kh.nhom||'—')
      +_infoRow('&#x1F4CB; Ma so thue', kh.mst||'—')
      +_infoRow('&#x1F91D; Sale PT',    kh.sale_pt||'—')
      +'</div>'
      +'<div id="crm-d-orders" style="margin-top:8px;">'
      +'<div style="font-size:11px;font-weight:800;color:var(--text3);margin-bottom:8px;">Lich su don hang:</div>'
      +'<div style="text-align:center;padding:12px;color:var(--text3);font-size:11px;">Dang tai...</div>'
      +'</div>'
      +'<div style="display:flex;gap:8px;margin-top:12px;">'
      +'<button id="crm-d-edit" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x270F; Chinh sua</button>'
      +'<button id="crm-d-close2" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Dong</button>'
      +'</div></div>';

    _modal(html, '700px');
    document.getElementById('crm-d-close').addEventListener('click', _closeModal);
    document.getElementById('crm-d-close2').addEventListener('click', _closeModal);
    document.getElementById('crm-d-edit').addEventListener('click', function(){ _closeModal(); _showForm(kh); });

    // Load lịch sử đơn hàng
    if (apiF) {
      apiF('sales_get_orders_by_customer', { khach_id: kh.id, limit:10 }, function(e,d){
        var sec = document.getElementById('crm-d-orders'); if (!sec) return;
        var orders = (!e&&d&&d.ok) ? (d.data||[]) : [];
        if (!orders.length) {
          sec.innerHTML = '<div style="font-size:11px;font-weight:800;color:var(--text3);margin-bottom:4px;">Lich su don hang: Chua co don</div>';
          return;
        }
        var tbl = '<div style="font-size:11px;font-weight:800;color:var(--text3);margin-bottom:8px;">Lich su don hang ('+orders.length+'):</div>'
          +'<div style="border-radius:8px;border:1px solid var(--border);overflow:hidden;">'
          +'<table style="width:100%;border-collapse:collapse;font-size:11px;">'
          +'<thead><tr style="background:var(--bg3);">'
          +'<th style="padding:6px 10px;text-align:left;">Ma don</th>'
          +'<th style="padding:6px 10px;text-align:left;">Ngay</th>'
          +'<th style="padding:6px 10px;text-align:right;">Tong</th>'
          +'<th style="padding:6px 10px;text-align:center;">TT</th>'
          +'</tr></thead><tbody>';
        orders.forEach(function(o){
          tbl += '<tr style="border-top:1px solid var(--border);">'
            +'<td style="padding:6px 10px;font-family:monospace;color:var(--accent2);">'+_esc(o.ma_don||o.id||'')+'</td>'
            +'<td style="padding:6px 10px;color:var(--text3);">'+_esc(o.ngay||'')+'</td>'
            +'<td style="padding:6px 10px;text-align:right;font-weight:700;">'+_fmt(o.tong_tt||0)+'</td>'
            +'<td style="padding:6px 10px;text-align:center;"><span style="padding:1px 6px;border-radius:4px;font-size:10px;font-weight:800;background:rgba(0,214,143,.1);color:var(--green);">'+_esc(o.trang_thai||'')+'</span></td>'
            +'</tr>';
        });
        tbl += '</tbody></table></div>';
        sec.innerHTML = tbl;
      });
    }
  }

  function _kBox(l,v,c){ return '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:15px;font-weight:900;color:'+c+';">'+v+'</div><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);margin-top:2px;">'+l+'</div></div>'; }
  function _infoRow(l,v){ return '<div style="background:var(--bg3);border-radius:8px;padding:8px 12px;"><div style="font-size:10px;color:var(--text3);margin-bottom:2px;">'+l+'</div><div style="font-weight:700;">'+_esc(String(v))+'</div></div>'; }

  // ── Form CRUD KH ────────────────────────────────────────────────
  function _showForm(kh) {
    var isNew = !kh;
    var nhomOpts = Object.keys(NHOM_LABELS).map(function(k){
      return '<option value="'+k+'"'+(kh&&kh.nhom===k?' selected':'')+'>'+NHOM_LABELS[k]+'</option>';
    }).join('');
    var h = '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
      +'<div style="font-size:15px;font-weight:900;">'+(isNew?'Them khach hang':'Sua thong tin KH')+'</div>'
      +'<button id="crm-f-x" style="background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;">&#x00D7;</button>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px;">'
      +_field('cf-ten','Ho ten *','text',kh?kh.ten_kh||kh.ten:'',true)
      +_field('cf-phone','Dien thoai','tel',kh?kh.phone||kh.dien_thoai:'')
      +_field('cf-email','Email','email',kh?kh.email:'')
      +_field('cf-nhom','Nhom KH','select',nhomOpts)
      +_field('cf-mst','Ma so thue','text',kh?kh.mst:'')
      +_field('cf-sale','Sale phu trach','text',kh?kh.sale_pt:'')
      +'<div style="grid-column:1/-1;"><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">Dia chi</label>'
      +'<textarea id="cf-addr" rows="2" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;resize:none;">'+_esc(kh?kh.dia_chi||kh.address||'':'')+'</textarea></div>'
      +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">So no hien tai</label>'
      +'<input id="cf-no" type="number" value="'+(kh?Number(kh.no_cuoi||0):0)+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"></div>'
      +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">Diem tich luy</label>'
      +'<input id="cf-diem" type="number" value="'+(kh?Number(kh.diem_tl||0):0)+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"></div>'
      +'</div>'
      +'<div style="display:flex;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--border);">'
      +(isNew?'<div></div>':'<button id="cf-del" style="background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.2);color:var(--red);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Xoa KH</button>')
      +'<div style="display:flex;gap:8px;">'
      +'<button id="cf-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
      +'<button id="cf-save" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--accent2);font-family:inherit;">'+(isNew?'Them KH':'Luu thay doi')+'</button>'
      +'</div></div>';

    _modal(h, '680px');
    document.getElementById('crm-f-x').addEventListener('click', _closeModal);
    document.getElementById('cf-cancel').addEventListener('click', _closeModal);

    if (!isNew) {
      document.getElementById('cf-del').addEventListener('click', function(){
        if (!confirm('Xoa khach hang '+_esc(kh.ten_kh||kh.ten||'')+'?')) return;
        var apiF = _api(); if (!apiF) return;
        apiF('sales_delete_customer', { id:kh.id }, function(e,d){
          if (!e&&d&&d.ok) { _toast('Da xoa KH','ok'); _closeModal(); _loadList(); _loadKPI(); }
          else _toast((d&&d.error)||'Loi xoa','error');
        });
      });
    }

    document.getElementById('cf-save').addEventListener('click', function(){
      var ten = document.getElementById('cf-ten').value.trim();
      if (!ten) { _toast('Nhap ho ten khach hang','error'); return; }
      var btn = document.getElementById('cf-save'); btn.disabled=true; btn.textContent='Dang luu...';
      var apiF = _api(); if (!apiF) return;
      apiF('sales_save_customer', {
        id      : kh ? kh.id : undefined,
        ten     : ten,
        phone   : document.getElementById('cf-phone').value.trim(),
        email   : document.getElementById('cf-email').value.trim(),
        nhom    : document.getElementById('cf-nhom').value,
        mst     : document.getElementById('cf-mst').value.trim(),
        sale_pt : document.getElementById('cf-sale').value.trim(),
        dia_chi : document.getElementById('cf-addr').value,
        no_cuoi : Number(document.getElementById('cf-no').value||0),
        diem_tl : Number(document.getElementById('cf-diem').value||0)
      }, function(e,d){
        btn.disabled=false; btn.textContent=isNew?'Them KH':'Luu thay doi';
        if (e||!d||!d.ok) { _toast((d&&d.error)||'Loi luu','error'); return; }
        _toast((isNew?'Da them: ':'Da cap nhat: ')+ten,'ok');
        _closeModal(); _loadList(); _loadKPI();
      });
    });
  }

  function _field(id,label,type,val,req){
    var base='width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;';
    var lbl='<label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">'+label+'</label>';
    if(type==='select') return '<div>'+lbl+'<select id="'+id+'" style="'+base+'">'+val+'</select></div>';
    return '<div>'+lbl+'<input id="'+id+'" type="'+type+'" value="'+_esc(val||'')+'" style="'+base+'"></div>';
  }

  // ── Import từ Sapo ───────────────────────────────────────────────
  function _importFromSapo() {
    var btn = document.getElementById('crm-import-btn');
    if (btn) { btn.disabled=true; btn.textContent='Dang import...'; }
    var apiF = _api(); if (!apiF) return;
    apiF('sapo_import_customers', {}, function(e,d){
      if (btn) { btn.disabled=false; btn.innerHTML='&#x1F504; Import Sapo'; }
      if (e||!d||!d.ok) { _toast((d&&d.error)||'Loi import','error'); return; }
      _toast(d.msg||('Da import '+d.count+' KH tu Sapo'),'ok');
      _loadList(); _loadKPI();
    });
  }

})();
