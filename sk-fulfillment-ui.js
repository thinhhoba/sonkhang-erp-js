// [v5.25] 22/03/2026 — sk-fulfillment-ui.js
// Order Fulfillment Dashboard — Phase 1->5
// Cong ty TNHH Thuc Pham Son Khang
// [RULE] Khong dung escaped quotes trong string HTML — dung DOM API
// ================================================================
(function () {
  'use strict';

  var _api   = function(){ return typeof window.api==='function'?window.api:null; };
  var _ct    = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };
  var _esc   = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var _fmtC  = function(n){ return Number(n||0).toLocaleString('vi-VN')+'d'; };

  var FF_TABS = [
    { id:'kho',     label:'[KHO] Kho van'   },
    { id:'dieu-xe', label:'[XE] Dieu xe'    },
    { id:'giao',    label:'[GIAO] Giao hang'},
    { id:'ketoan',  label:'[KT] Ke toan'    },
  ];

  var _activeTab = 'kho';
  var _clusters  = [];

  var ST_COLOR = {
    'nhap':'#64748b','cho_xac_nhan':'#f59e0b','da_xac_nhan':'#3b82f6',
    'cho_dong_goi':'#8b5cf6','cho_xuat_kho':'#06b6d4','dang_giao':'#f97316',
    'da_giao':'#10b981','hoan_thanh_cho_vat':'#22c55e','da_xuat_misa':'#84cc16',
    'hoan_thanh':'#00d68f','huy':'#ef4444','tra_hang':'#f43f5e',
  };
  var ST_LABEL = {
    'nhap':'Nhap','cho_xac_nhan':'Cho xac nhan','da_xac_nhan':'Cho xu ly',
    'cho_dong_goi':'Cho dong goi','cho_xuat_kho':'Cho xuat kho',
    'dang_giao':'Dang giao','da_giao':'Da giao',
    'hoan_thanh_cho_vat':'Hoan thanh - Cho VAT',
    'da_xuat_misa':'Da xuat MISA','hoan_thanh':'Hoan thanh',
    'huy':'Da huy','tra_hang':'Tra hang',
  };

  function _stBadge(st) {
    var c = ST_COLOR[st] || '#64748b';
    return '<span style="background:'+c+'22;color:'+c+';border:1px solid '+c+'44;'
      +'border-radius:6px;padding:2px 8px;font-size:10px;font-weight:800;">'
      +(ST_LABEL[st]||st)+'</span>';
  }

  function _injectCSS() {
    if (document.getElementById('sk-ff-css')) return;
    var s = document.createElement('style');
    s.id  = 'sk-ff-css';
    s.textContent = '.ff-wrap{padding:24px;}'
      +'.ff-card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px;}'
      +'.ff-tab-btn{border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;}'
      +'.ff-tab-btn.active{background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);}'
      +'.ff-tab-btn:not(.active){background:var(--bg3);border:1px solid var(--border2);color:var(--text3);}'
      +'.ff-tbl{width:100%;border-collapse:collapse;font-size:12px;}'
      +'.ff-tbl th{padding:9px 10px;background:var(--bg);color:var(--text3);font-weight:700;text-align:left;border-bottom:2px solid var(--border);font-size:10px;text-transform:uppercase;letter-spacing:.06em;}'
      +'.ff-tbl td{padding:9px 10px;border-bottom:1px solid var(--bg3);color:var(--text2);}'
      +'.ff-tbl tr:last-child td{border-bottom:none;}'
      +'.ff-tbl tr:hover td{background:var(--bg3);}'
      +'.ff-btn{border:none;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;}'
      +'.ff-btn-p{background:var(--accent2);color:#fff;}'
      +'.ff-btn-g{background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:#00d68f;}'
      +'.ff-btn-v{background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);color:#8b5cf6;}'
      +'.ff-btn-c{background:rgba(6,182,212,.15);border:1px solid rgba(6,182,212,.3);color:#06b6d4;}'
      +'.ff-btn-ghost{background:var(--bg3);border:1px solid var(--border2);color:var(--text2);}'
      +'.ff-empty{text-align:center;padding:48px 16px;color:var(--text3);}'
      +'.ff-cluster{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px;}'
      +'.ff-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;}'
      +'.ff-modal{background:var(--bg2);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;padding:24px;}';
    document.head.appendChild(s);
  }

  function loadFulfillment() {
    var ct = _ct(); if (!ct) return;
    _injectCSS();
    ct.innerHTML = '';

    var wrap = document.createElement('div');
    wrap.className = 'ff-wrap fade-in';

    // Header
    var hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px;';
    hdr.innerHTML = '<div><h1 style="font-size:22px;font-weight:900;margin:0;">Order Fulfillment</h1>'
      +'<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Kho · Dieu xe · Giao hang · Ke toan</p></div>';
    var mBtn = document.createElement('button');
    mBtn.className = 'ff-btn ff-btn-ghost';
    mBtn.style.padding = '9px 14px';
    mBtn.textContent = 'Mobile Tai xe';
    mBtn.addEventListener('click', function(){
      if (typeof window.loadDeliveryMobile==='function') window.loadDeliveryMobile();
      else if (typeof window.skLoad==='function') window.skLoad('giao-hang-mobile');
    });
    hdr.appendChild(mBtn);
    wrap.appendChild(hdr);

    // Tab bar — DOM API only, no onclick strings
    var tabBar = document.createElement('div');
    tabBar.id = 'ff-tab-bar';
    tabBar.style.cssText = 'display:flex;gap:4px;margin-bottom:20px;flex-wrap:wrap;';
    FF_TABS.forEach(function(t, i) {
      var btn = document.createElement('button');
      btn.className = 'ff-tab-btn'+(i===0?' active':'');
      btn.setAttribute('data-fftab', t.id);
      btn.textContent = t.label;
      btn.addEventListener('click', (function(id){ return function(){ _renderTab(id); }; })(t.id));
      tabBar.appendChild(btn);
    });
    wrap.appendChild(tabBar);

    var body = document.createElement('div');
    body.id = 'ff-body';
    wrap.appendChild(body);
    ct.appendChild(wrap);
    _renderTab('kho');
  }

  function _renderTab(tab) {
    _activeTab = tab;
    document.querySelectorAll('[data-fftab]').forEach(function(btn){
      btn.className = 'ff-tab-btn' + (btn.getAttribute('data-fftab')===tab?' active':'');
    });
    if      (tab==='kho')     _renderKho();
    else if (tab==='dieu-xe') _renderDieuXe();
    else if (tab==='giao')    _renderGiaoHang();
    else if (tab==='ketoan')  _renderKeToan();
  }

  function _setBody(html) { var e=document.getElementById('ff-body'); if(e) e.innerHTML=html; }
  function _loading()     { _setBody('<div style="text-align:center;padding:32px;color:var(--text3);">Dang tai...</div>'); }
  function _errMsg(msg)   { _setBody('<div style="padding:16px;color:var(--red);">Loi: '+_esc(msg)+'</div>'); }

  // ── PHASE 2: Kho van ────────────────────────────────────────────
  function _renderKho() {
    _loading();
    var apiF = _api(); if (!apiF) { _errMsg('API khong san sang'); return; }
    apiF('fulfillment_get_picking', {}, function(e,d){
      if (e||!d||!d.ok) { _errMsg((d&&d.error)||'Loi tai du lieu'); return; }
      var rows = d.data||[];
      var el   = document.getElementById('ff-body'); if (!el) return;

      // Toolbar
      var toolbar = document.createElement('div');
      toolbar.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;';
      toolbar.innerHTML = '<span style="font-size:13px;font-weight:900;">Don can xu ly ('+rows.length+')</span>';
      var rBtn = document.createElement('button');
      rBtn.className = 'ff-btn ff-btn-ghost'; rBtn.style.marginLeft='auto'; rBtn.textContent='Lam moi';
      rBtn.addEventListener('click', _renderKho);
      toolbar.appendChild(rBtn);

      el.innerHTML = '';
      el.appendChild(toolbar);

      if (!rows.length) {
        el.insertAdjacentHTML('beforeend','<div class="ff-empty"><div style="font-size:28px;margin-bottom:8px;">OK</div>'
          +'<div style="font-size:13px;font-weight:700;">Khong co don nao can xu ly</div></div>');
        return;
      }

      var wrap = document.createElement('div'); wrap.style.overflowX='auto';
      var tbl  = document.createElement('table'); tbl.className='ff-tbl';
      tbl.innerHTML='<thead><tr><th>Ma don</th><th>Khach hang</th><th>Dia chi</th>'
        +'<th style="text-align:right;">Tong TT</th><th style="text-align:center;">Trang thai</th>'
        +'<th style="text-align:center;">Thao tac</th></tr></thead>';
      var tbody = document.createElement('tbody');

      rows.forEach(function(r){
        var tr = document.createElement('tr');
        tr.innerHTML = '<td style="font-family:monospace;color:var(--cyan);">'+_esc(r.ma_don)+'</td>'
          +'<td style="font-weight:700;">'+_esc(r.khach_ten)+'</td>'
          +'<td style="color:var(--text3);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(r.dia_chi||'—')+'</td>'
          +'<td style="text-align:right;font-weight:800;color:var(--green);">'+_fmtC(r.tong_tt)+'</td>'
          +'<td style="text-align:center;">'+_stBadge(r.trang_thai)+'</td>';

        var tdA = document.createElement('td'); tdA.style.textAlign='center';
        if (r.trang_thai==='da_xac_nhan') {
          var b1=document.createElement('button'); b1.className='ff-btn ff-btn-v'; b1.textContent='Bat dau dong goi';
          b1.addEventListener('click',(function(id){return function(){_ffStartPack(id);};})(r.id)); tdA.appendChild(b1);
        } else if (r.trang_thai==='cho_dong_goi') {
          var b2=document.createElement('button'); b2.className='ff-btn ff-btn-c'; b2.textContent='Dong goi xong';
          b2.addEventListener('click',(function(id){return function(){_ffConfirmPacked(id);};})(r.id)); tdA.appendChild(b2);
        }
        tr.appendChild(tdA); tbody.appendChild(tr);
      });
      tbl.appendChild(tbody); wrap.appendChild(tbl); el.appendChild(wrap);
    });
  }

  // ── PHASE 3: Dieu xe Smart Routing ─────────────────────────────
  function _renderDieuXe() {
    var el = document.getElementById('ff-body'); if (!el) return;
    el.innerHTML = '';

    var toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center;';

    var aBtn = document.createElement('button');
    aBtn.className='ff-btn ff-btn-p'; aBtn.style.padding='9px 18px'; aBtn.textContent='Phan tich tuyen duong';
    aBtn.addEventListener('click', _ffLoadRouting); toolbar.appendChild(aBtn);

    var lbl = document.createElement('span'); lbl.style.cssText='font-size:12px;color:var(--text3);'; lbl.textContent='Ban kinh:';
    toolbar.appendChild(lbl);
    var rInp = document.createElement('input'); rInp.type='number'; rInp.id='ff-radius'; rInp.value='5'; rInp.min='1'; rInp.max='30';
    rInp.style.cssText='background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:7px 10px;font-size:12px;width:60px;';
    toolbar.appendChild(rInp);
    var ulbl=document.createElement('span'); ulbl.style.cssText='font-size:12px;color:var(--text3);'; ulbl.textContent='km';
    toolbar.appendChild(ulbl);
    el.appendChild(toolbar);

    var resultDiv = document.createElement('div'); resultDiv.id='ff-routing-result';
    resultDiv.innerHTML='<div class="ff-empty"><div style="font-size:32px;margin-bottom:8px;">[MAP]</div>'
      +'<div style="font-size:13px;">Nhan "Phan tich tuyen duong" de gom don thong minh</div></div>';
    el.appendChild(resultDiv);
  }

  function _ffLoadRouting() {
    var el     = document.getElementById('ff-routing-result'); if (!el) return;
    var radius = Number((document.getElementById('ff-radius')||{}).value||5);
    el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang phan tich...</div>';
    var apiF = _api(); if (!apiF) return;

    apiF('fulfillment_smart_routing',{radius_km:radius},function(e,d){
      if (e||!d||!d.ok){ el.innerHTML='<p style="color:var(--red);">'+_esc((d&&d.error)||'Loi routing')+'</p>'; return; }
      _clusters = d.clusters||[];
      if (!_clusters.length){
        el.innerHTML='<div class="ff-empty"><div style="font-size:28px;">OK</div><div>Khong co don nao cho xuat kho</div></div>'; return;
      }
      el.innerHTML='<div style="font-size:13px;font-weight:900;margin-bottom:14px;">'+_clusters.length+' cum · '+d.total_orders+' don hang</div>';
      var COLORS=['#4f6fff','#00d68f','#f59e0b','#ef4444','#8b5cf6','#06d6d6'];

      _clusters.forEach(function(cluster,ci){
        var c=COLORS[ci%COLORS.length];
        var div=document.createElement('div'); div.className='ff-cluster'; div.style.borderLeft='3px solid '+c;

        var hdr=document.createElement('div'); hdr.style.cssText='display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;';
        var badge=document.createElement('span');
        badge.style.cssText='background:'+c+'22;color:'+c+';border:1px solid '+c+'44;border-radius:6px;padding:4px 10px;font-size:12px;font-weight:900;';
        badge.textContent='Cum '+(ci+1); hdr.appendChild(badge);

        var info=document.createElement('span'); info.style.cssText='font-size:12px;color:var(--text3);';
        info.textContent=cluster.count+' don · '+_fmtC(cluster.total); hdr.appendChild(info);

        var sel=document.createElement('select'); sel.id='ff-driver-'+ci;
        sel.style.cssText='margin-left:auto;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:6px;padding:5px 8px;font-size:11px;font-family:inherit;';
        sel.innerHTML='<option value="">-- Chon tai xe --</option>'; hdr.appendChild(sel);

        var aBtn=document.createElement('button'); aBtn.className='ff-btn ff-btn-g'; aBtn.textContent='Gan lenh';
        aBtn.addEventListener('click',(function(idx){return function(){_ffAssignCluster(idx);};})(ci)); hdr.appendChild(aBtn);
        div.appendChild(hdr);

        var tbl=document.createElement('table'); tbl.style.cssText='width:100%;border-collapse:collapse;font-size:11px;';
        var tbody=document.createElement('tbody');
        cluster.orders.forEach(function(o){
          var tr=document.createElement('tr'); tr.style.borderBottom='1px solid var(--border)';
          tr.innerHTML='<td style="padding:5px 0;color:var(--cyan);font-family:monospace;width:110px;">'+_esc(o.ma_don||o.id)+'</td>'
            +'<td style="padding:5px 8px;color:var(--text2);">'+_esc(o.khach_ten||'')+'</td>'
            +'<td style="padding:5px 0;text-align:right;color:var(--green);">'+_fmtC(o.tong_tt)+'</td>';
          tbody.appendChild(tr);
        });
        tbl.appendChild(tbody); div.appendChild(tbl); el.appendChild(div);
      });
      _loadDriversForSelects();
    });
  }

  function _loadDriversForSelects() {
    var apiF=_api(); if (!apiF) return;
    apiF('hrm_get_employees',{limit:100},function(e,d){
      if (e||!d||!d.ok) return;
      var emps=d.data||[];
      var drivers=emps.filter(function(emp){
        var p=String(emp.chuc_vu||emp.position||emp.department||'').toLowerCase();
        return p.indexOf('giao')>-1||p.indexOf('driver')>-1||p.indexOf('tai xe')>-1;
      });
      if (!drivers.length) drivers=emps.slice(0,20);
      document.querySelectorAll('[id^="ff-driver-"]').forEach(function(sel){
        var val=sel.value; sel.innerHTML='<option value="">-- Chon tai xe --</option>';
        drivers.forEach(function(drv){
          var opt=document.createElement('option');
          opt.value=drv.id||drv.ma_nv||drv.email||'';
          opt.textContent=drv.ten_nv||drv.name||drv.email||drv.id||'';
          sel.appendChild(opt);
        });
        sel.value=val;
      });
    });
  }

  function _ffAssignCluster(ci) {
    var cluster=_clusters[ci]; if (!cluster) return;
    var sel=document.getElementById('ff-driver-'+ci);
    var driverId=sel?sel.value:'';
    if (!driverId){ _toast('Vui long chon tai xe','error'); return; }
    var ids=cluster.orders.map(function(o){return o.id;});
    var apiF=_api(); if (!apiF) return;
    apiF('fulfillment_assign_driver',{ids:ids,driver_id:driverId,nhom_giao:'GRP-'+Date.now()},function(e,d){
      if (!e&&d&&d.ok){ _toast('OK: '+d.msg,'ok'); setTimeout(_ffLoadRouting,800); }
      else _toast((d&&d.error)||'Loi gan lenh','error');
    });
  }

  // ── PHASE 4: Giao hang ─────────────────────────────────────────
  function _renderGiaoHang() {
    _loading();
    var apiF=_api(); if (!apiF){ _errMsg('API khong san sang'); return; }
    apiF('fulfillment_get_list',{status:'dang_giao',limit:100},function(e,d){
      if (e||!d||!d.ok){ _errMsg((d&&d.error)||'Loi'); return; }
      var rows=d.data||[];
      var el=document.getElementById('ff-body'); if (!el) return;
      el.innerHTML='<div style="font-size:13px;font-weight:900;margin-bottom:14px;">Dang giao hang ('+rows.length+')</div>';
      if (!rows.length){
        el.insertAdjacentHTML('beforeend','<div class="ff-empty"><div style="font-size:28px;">OK</div><div>Khong co don nao dang giao</div></div>'); return;
      }
      rows.forEach(function(r){
        var card=document.createElement('div'); card.className='ff-card';
        card.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
          +'<span style="font-family:monospace;color:var(--cyan);font-weight:900;">'+_esc(r.ma_don)+'</span>'
          +_stBadge(r.trang_thai)+'</div>'
          +'<div style="font-size:12px;color:var(--text2);margin-bottom:4px;">KH: '+_esc(r.khach_ten)+'</div>'
          +'<div style="font-size:11px;color:var(--text3);margin-bottom:8px;">DC: '+_esc(r.dia_chi||'—')+'</div>'
          +'<div style="font-size:14px;font-weight:900;color:var(--green);">'+_fmtC(r.tong_tt)+'</div>';
        var eBtn=document.createElement('button'); eBtn.className='ff-btn ff-btn-ghost'; eBtn.style.marginTop='10px'; eBtn.textContent='Chinh sua linh hoat';
        eBtn.addEventListener('click',(function(id){return function(){_showFlexEdit(id);};})(r.id)); card.appendChild(eBtn);
        el.appendChild(card);
      });
    });
  }

  // ── PHASE 5: Ke toan ───────────────────────────────────────────
  function _renderKeToan() {
    _loading();
    var apiF=_api(); if (!apiF){ _errMsg('API khong san sang'); return; }
    apiF('fulfillment_get_vat_list',{},function(e,d){
      if (e||!d||!d.ok){ _errMsg((d&&d.error)||'Loi'); return; }
      var rows=d.data||[]; var el=document.getElementById('ff-body'); if (!el) return;
      el.innerHTML='';

      var toolbar=document.createElement('div'); toolbar.style.cssText='display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;';
      toolbar.innerHTML='<span style="font-size:13px;font-weight:900;">Cho xuat VAT ('+rows.length+')</span>'
        +'<span style="font-size:13px;font-weight:800;color:var(--green);">'+_fmtC(d.tong_gia_tri||0)+'</span>';
      var rg=document.createElement('div'); rg.style.cssText='margin-left:auto;display:flex;gap:8px;';
      var saBtn=document.createElement('button'); saBtn.className='ff-btn ff-btn-ghost'; saBtn.textContent='Chon tat ca';
      saBtn.addEventListener('click',function(){ document.querySelectorAll('.ff-vat-cb').forEach(function(cb){cb.checked=true;}); });
      var exBtn=document.createElement('button'); exBtn.className='ff-btn ff-btn-g'; exBtn.textContent='Xuat MISA';
      exBtn.addEventListener('click',_ffExportMisa);
      rg.appendChild(saBtn); rg.appendChild(exBtn); toolbar.appendChild(rg); el.appendChild(toolbar);

      if (!rows.length){
        el.insertAdjacentHTML('beforeend','<div class="ff-empty"><div style="font-size:28px;">OK</div><div>Khong co don nao cho xuat VAT</div></div>'); return;
      }
      var tw=document.createElement('div'); tw.style.overflowX='auto';
      var tbl=document.createElement('table'); tbl.className='ff-tbl';
      tbl.innerHTML='<thead><tr><th style="width:32px;">Chon</th><th>Ma don</th><th>Ngay</th><th>Khach hang</th><th style="text-align:right;">Tong TT</th></tr></thead>';
      var tbody=document.createElement('tbody');
      rows.forEach(function(r){
        var tr=document.createElement('tr');
        var tdCb=document.createElement('td'); tdCb.style.textAlign='center';
        var cb=document.createElement('input'); cb.type='checkbox'; cb.className='ff-vat-cb'; cb.value=r.id; cb.style.cursor='pointer';
        tdCb.appendChild(cb); tr.appendChild(tdCb);
        tr.insertAdjacentHTML('beforeend',
          '<td style="font-family:monospace;color:var(--cyan);">'+_esc(r.ma_don)+'</td>'
          +'<td style="color:var(--text3);">'+_esc(r.ngay)+'</td>'
          +'<td style="font-weight:700;">'+_esc(r.khach_ten)+'</td>'
          +'<td style="text-align:right;font-weight:800;color:var(--green);">'+_fmtC(r.tong_tt)+'</td>');
        tbody.appendChild(tr);
      });
      tbl.appendChild(tbody); tw.appendChild(tbl); el.appendChild(tw);
    });
  }

  // ── Flexible Edit Modal (Global Rule) ────────────────────────────
  function _showFlexEdit(orderId) {
    var overlay=document.createElement('div'); overlay.className='ff-modal-overlay';
    overlay.addEventListener('click',function(ev){ if(ev.target===overlay) overlay.remove(); });

    var modal=document.createElement('div'); modal.className='ff-modal';

    var hdr=document.createElement('div'); hdr.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;';
    hdr.innerHTML='<span style="font-size:15px;font-weight:900;">Chinh sua linh hoat</span>';
    var xBtn=document.createElement('button'); xBtn.className='ff-btn ff-btn-ghost'; xBtn.style.cssText='width:32px;height:32px;padding:0;font-size:18px;'; xBtn.textContent='x';
    xBtn.addEventListener('click',function(){overlay.remove();}); hdr.appendChild(xBtn); modal.appendChild(hdr);

    var baseInpStyle='width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);'
      +'border-radius:8px;padding:8px 10px;font-size:12px;font-family:inherit;box-sizing:border-box;';
    var lblStyle='font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:4px;';

    function _addField(id, labelText, type, opts) {
      var g=document.createElement('div'); g.style.marginBottom='12px';
      var l=document.createElement('label'); l.style.cssText=lblStyle; l.textContent=labelText; g.appendChild(l);
      var inp;
      if (type==='select') {
        inp=document.createElement('select'); inp.id=id; inp.style.cssText=baseInpStyle;
        inp.innerHTML='<option value="">-- Giu nguyen --</option>';
        (opts||[]).forEach(function(o){ var opt=document.createElement('option'); opt.value=o.v; opt.textContent=o.l; inp.appendChild(opt); });
      } else if (type==='textarea') {
        inp=document.createElement('textarea'); inp.id=id; inp.rows=3; inp.style.cssText=baseInpStyle+'resize:vertical;';
      } else {
        inp=document.createElement('input'); inp.type='text'; inp.id=id; inp.style.cssText=baseInpStyle;
      }
      g.appendChild(inp); modal.appendChild(g);
    }

    _addField('ff-fe-status','Trang thai moi','select',[
      {v:'cho_dong_goi',l:'Cho dong goi'},{v:'cho_xuat_kho',l:'Cho xuat kho'},
      {v:'dang_giao',l:'Dang giao'},{v:'da_giao',l:'Da giao'},
      {v:'hoan_thanh_cho_vat',l:'Hoan thanh - Cho VAT'},
      {v:'hoan_thanh',l:'Hoan thanh'},{v:'huy',l:'Da huy'},{v:'tra_hang',l:'Tra hang'},
    ]);
    _addField('ff-fe-note',   'Ghi chu',     'textarea');
    _addField('ff-fe-address','Dia chi giao','text');
    _addField('ff-fe-driver', 'Tai xe ID',   'text');

    var saveBtn=document.createElement('button'); saveBtn.className='ff-btn ff-btn-p';
    saveBtn.style.cssText='width:100%;padding:12px;font-size:13px;font-weight:800;margin-top:4px;';
    saveBtn.textContent='Luu thay doi';
    saveBtn.addEventListener('click',function(){
      var apiF=_api(); if (!apiF) return;
      var patch={id:orderId};
      var stEl=document.getElementById('ff-fe-status');
      var ntEl=document.getElementById('ff-fe-note');
      var adEl=document.getElementById('ff-fe-address');
      var dvEl=document.getElementById('ff-fe-driver');
      if (stEl&&stEl.value)  patch.trang_thai=stEl.value;
      if (ntEl&&ntEl.value)  patch.ghi_chu=ntEl.value;
      if (adEl&&adEl.value)  patch.dia_chi_gh=adEl.value;
      if (dvEl&&dvEl.value)  patch.tai_xe_id=dvEl.value;
      if (Object.keys(patch).length<=1){ _toast('Khong co thay doi','error'); return; }
      saveBtn.disabled=true; saveBtn.textContent='Dang luu...';
      apiF('fulfillment_flexible_update',patch,function(e,d){
        overlay.remove();
        if (!e&&d&&d.ok){ _toast('OK: '+(d.msg||'Da cap nhat'),'ok'); _renderTab(_activeTab); }
        else _toast((d&&d.error)||'Loi cap nhat','error');
      });
    });
    modal.appendChild(saveBtn); overlay.appendChild(modal); document.body.appendChild(overlay);
  }

  // ── Action helpers ──────────────────────────────────────────────
  function _ffStartPack(id){
    var apiF=_api(); if (!apiF) return;
    apiF('fulfillment_start_packing',{id:id},function(e,d){
      if (!e&&d&&d.ok){ _toast('Bat dau dong goi: '+(d.label||''),'ok'); _renderKho(); }
      else _toast((d&&d.error)||'Loi','error');
    });
  }
  function _ffConfirmPacked(id){
    var apiF=_api(); if (!apiF) return;
    apiF('fulfillment_confirm_packed',{id:id},function(e,d){
      if (!e&&d&&d.ok){ _toast('Dong goi xong: '+(d.label||''),'ok'); _renderKho(); }
      else _toast((d&&d.error)||'Loi','error');
    });
  }
  function _ffExportMisa(){
    var ids=[];
    document.querySelectorAll('.ff-vat-cb:checked').forEach(function(cb){ids.push(cb.value);});
    if (!ids.length){ _toast('Chon it nhat 1 don','error'); return; }
    var apiF=_api(); if (!apiF) return;
    apiF('fulfillment_mark_misa',{ids:ids},function(e,d){
      if (!e&&d&&d.ok){ _toast('OK: '+d.msg,'ok'); _renderKeToan(); }
      else _toast((d&&d.error)||'Loi','error');
    });
  }

  window.loadFulfillment      = loadFulfillment;
  window.loadOrderFulfillment = loadFulfillment;

}());
