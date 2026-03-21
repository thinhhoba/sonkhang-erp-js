/* ================================================================
 * sk-products-ui.js  SonKhang ERP v5.4.0
 * UI: Bang gia nang cao + Cay danh muc + Thuong hieu + Bien the
 * 21/03/2026 — 0 non-ASCII, DOM API for events, no ES6
 * ================================================================ */
(function () {
  'use strict';

  var _api = function(){ return typeof window.api==='function'?window.api:null; };
  var _ct  = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
  var _esc = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var _gv  = function(id){ var e=document.getElementById(id); return e?e.value:''; };
  var _fmt = function(n){ return (Number(n)||0).toLocaleString('vi-VN'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };

  // ── State ────────────────────────────────────────────────────────
  var STATE = {
    categories : [],
    brands     : [],
    attributes : [],
    curProduct : null,
    curTab     : 'products',
    search     : { q:'', danh_muc_id:'', thuong_hieu_id:'', page:1 }
  };

  // ── Modal ─────────────────────────────────────────────────────────
  function _modal(html, maxW) {
    var old = document.getElementById('sk-prod-modal');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var ov = document.createElement('div');
    ov.id = 'sk-prod-modal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;';
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--bg2,#0d1020);border:1px solid var(--border2,#252d40);border-radius:18px;width:100%;max-width:'+(maxW||'680px')+';margin:auto;';
    box.innerHTML = html;
    ov.appendChild(box);
    ov.addEventListener('click',function(e){ if(e.target===ov) _closeModal(); });
    document.body.appendChild(ov);
  }
  function _closeModal(){
    var m=document.getElementById('sk-prod-modal');
    if(m&&m.parentNode) m.parentNode.removeChild(m);
  }
  window.closeProdModal = _closeModal;

  // ── Field helper ──────────────────────────────────────────────────
  function _fld(id, label, type, val, opts) {
    opts = opts || {};
    var wrap = '<div style="'+(opts.full?'grid-column:1/-1;':'')+'"><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">'+label+(opts.req?' *':'')+'</label>';
    var base = 'width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;';
    if (type === 'select') {
      wrap += '<select id="'+id+'" style="'+base+'">'+val+'</select>';
    } else if (type === 'textarea') {
      wrap += '<textarea id="'+id+'" rows="3" style="'+base+'resize:vertical;">'+_esc(val)+'</textarea>';
    } else {
      wrap += '<input id="'+id+'" type="'+type+'" value="'+_esc(val)+'" '+(opts.placeholder?'placeholder="'+_esc(opts.placeholder)+'"':'')+' style="'+base+'">';
    }
    return wrap + '</div>';
  }

  function _grid(cols) {
    return 'display:grid;grid-template-columns:'+cols+';gap:12px;padding:20px;';
  }

  function _mhdr(title, subtitle) {
    return '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
      + '<div><div style="font-size:15px;font-weight:900;">'+title+'</div>'
      + (subtitle?'<div style="font-size:11px;color:var(--text3);margin-top:2px;">'+subtitle+'</div>':'')
      + '</div>'
      + '<button id="prod-modal-x" style="background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;line-height:1;padding:4px;">&#x00D7;</button>'
      + '</div>';
  }

  function _mfooter(cancelId, saveId, saveLabel) {
    return '<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
      + '<button id="'+cancelId+'" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
      + '<button id="'+saveId+'" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--accent2);font-family:inherit;">'+(saveLabel||'Luu')+'</button>'
      + '</div>';
  }

  // ── MAIN LOAD ─────────────────────────────────────────────────────
  function loadBangGia() {
    var ct = _ct(); if (!ct) return;
    if (typeof window._salesInjectCSS === 'function') window._salesInjectCSS();

    ct.innerHTML = '<div class="fade-in" style="padding:24px;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
      + '<div><h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F4E6; San pham & Bang gia</h1>'
      + '<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Quan ly san pham · Danh muc · Thuong hieu · Bien the · Price Tier</p></div>'
      + '<button id="prod-new-btn" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:10px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">+ San pham moi</button>'
      + '</div>'
      // KPI row
      + '<div id="prod-kpi" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:20px;"></div>'
      // Tab bar
      + '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;" id="prod-tabs">'
      + [['products','&#x1F4E6; San pham'],['categories','&#x1F333; Danh muc'],['brands','&#x1F3F7; Thuong hieu'],['attributes','&#x1F9E9; Thuoc tinh']].map(function(t,i){
          return '<button data-tab="'+t[0]+'" style="border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;'
            +(i===0?'background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);':'background:var(--bg3);border:1px solid var(--border2);color:var(--text3);')+'">'
            +t[1]+'</button>';
        }).join('')
      + '</div>'
      + '<div id="prod-body"></div>'
      + '</div>';

    // Bind tab clicks
    document.querySelectorAll('#prod-tabs button').forEach(function(btn){
      btn.addEventListener('click', function(){
        STATE.curTab = btn.getAttribute('data-tab');
        document.querySelectorAll('#prod-tabs button').forEach(function(b){
          b.style.background='var(--bg3)'; b.style.borderColor='var(--border2)'; b.style.color='var(--text3)';
        });
        btn.style.background='rgba(79,111,255,.15)'; btn.style.borderColor='rgba(79,111,255,.3)'; btn.style.color='var(--accent2)';
        _renderTab(STATE.curTab);
      });
    });

    document.getElementById('prod-new-btn').addEventListener('click', function(){
      if (STATE.curTab==='categories') _showCategoryForm();
      else if (STATE.curTab==='brands') _showBrandForm();
      else if (STATE.curTab==='attributes') _showAttributeForm();
      else _showProductForm(null);
    });

    _loadKPI();
    // Dung STATE.curTab (co the da duoc set boi loadDanhMucSP/loadThuongHieu)
    // truoc khi loadBangGia duoc goi. Default ve 'products'.
    _loadMeta(function(){
      var tab = STATE.curTab || 'products';
      _renderTab(tab);
      // Highlight dung tab button
      var tabBtns = document.querySelectorAll('#prod-tabs button');
      tabBtns.forEach(function(b){
        var isActive = b.getAttribute('data-tab') === tab;
        b.style.background    = isActive ? 'rgba(79,111,255,.15)' : 'var(--bg3)';
        b.style.borderColor   = isActive ? 'rgba(79,111,255,.3)'  : 'var(--border2)';
        b.style.color         = isActive ? 'var(--accent2)'       : 'var(--text3)';
      });
    });
  }
  // === EXPOSE functions ===
  // loadBangGia  = full product manager (4 tabs: SP, DanhMuc, ThuongHieu, ThuocTinh)
  // loadQuanLySP = alias cho full manager (dung cho nav item "San pham")
  // loadDanhMucSP    = mo thang tab Danh muc
  // loadThuongHieu   = mo thang tab Thuong hieu
  // loadThuocTinh    = mo thang tab Thuoc tinh
  // loadChietKhau/loadTinhGia/loadKhachHang = van dung sk-sales-price.js

  window.loadBangGia  = loadBangGia;   // entry point chinh
  window.loadQuanLySP = loadBangGia;   // alias: "Quan ly san pham" tren nav

  // Dedicated tab loaders - set STATE truoc, tranh timing race
  window.loadDanhMucSP = function () {
    STATE.curTab = 'categories';
    loadBangGia();
  };
  window.loadThuongHieu = function () {
    STATE.curTab = 'brands';
    loadBangGia();
  };
  window.loadThuocTinh  = function () {
    STATE.curTab = 'attributes';
    loadBangGia();
  };

  // Cac alias giu lai de khong phai doi SK_LOADERS cu
  window.loadChietKhau = function(){ loadBangGia(); setTimeout(function(){ if(typeof window._spSwitch==='function') window._spSwitch('discounts'); },200); };
  window.loadKhachHang = function(){ loadBangGia(); setTimeout(function(){ if(typeof window._spSwitch==='function') window._spSwitch('customers'); },200); };
  window.loadTinhGia   = function(){ loadBangGia(); setTimeout(function(){ if(typeof window._spSwitch==='function') window._spSwitch('calc'); },200); };
  window.loadSalesCRM  = window.loadKhachHang;

  function _loadKPI() {
    var apiF = _api(); if (!apiF) return;
    apiF('prod_get_summary',{},function(e,d){
      var el = document.getElementById('prod-kpi'); if (!el) return;
      if (e||!d||!d.ok) return;
      var items = [
        {icon:'&#x1F4E6;',label:'Tong SP',val:d.tong_sp||0,c:'var(--text)'},
        {icon:'&#x26A0;',label:'Sap het',val:d.sp_sap_het||0,c:'var(--yellow)'},
        {icon:'&#x274C;',label:'Het hang',val:d.sp_het_hang||0,c:'var(--red)'},
        {icon:'&#x1F5BC;',label:'Co anh',val:d.sp_co_anh||0,c:'var(--cyan)'},
        {icon:'&#x1F500;',label:'Bien the',val:d.sp_co_bienthe||0,c:'var(--purple,#a78bfa)'},
        {icon:'&#x1F333;',label:'Danh muc',val:d.tong_danhmuc||0,c:'var(--green)'}
      ];
      el.innerHTML = items.map(function(it){
        return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;gap:10px;align-items:center;">'
          + '<div style="font-size:20px;">'+it.icon+'</div>'
          + '<div><div style="font-size:18px;font-weight:900;color:'+it.c+';">'+it.val+'</div>'
          + '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);">'+it.label+'</div></div></div>';
      }).join('');
    });
  }

  function _loadMeta(cb) {
    var apiF = _api(); if (!apiF) { if(cb) cb(); return; }
    var done = 0;
    function check(){ if(++done===2&&cb) cb(); }
    apiF('prod_get_categories',{},function(e,d){
      if (!e&&d&&d.ok) STATE.categories = d.data||[];
      check();
    });
    apiF('prod_get_brands',{},function(e,d){
      if (!e&&d&&d.ok) STATE.brands = d.data||[];
      check();
    });
  }

  // ── TABS ──────────────────────────────────────────────────────────
  function _renderTab(tab) {
    if (tab==='products')   _renderProducts();
    else if (tab==='categories') _renderCategories();
    else if (tab==='brands')     _renderBrands();
    else if (tab==='attributes') _renderAttributes();
  }

  // ════════════════════════════════════════════════════════════════
  // TAB 1: SAN PHAM
  // ════════════════════════════════════════════════════════════════
  function _renderProducts() {
    var el = document.getElementById('prod-body'); if (!el) return;

    // Build category options for filter
    var catOpts = '<option value="">Tat ca danh muc</option>' + _buildCatOptions(STATE.categories, '');
    var brandOpts = '<option value="">Tat ca thuong hieu</option>'
      + STATE.brands.map(function(b){ return '<option value="'+_esc(b.id)+'">'+_esc(b.ten)+'</option>'; }).join('');

    el.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">'
      + '<input id="prod-q" type="text" placeholder="Tim ten, ma SP..." style="flex:1;min-width:200px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
      + '<select id="prod-cat-filter" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;">'+catOpts+'</select>'
      + '<select id="prod-brand-filter" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;">'+brandOpts+'</select>'
      + '<button id="prod-search-btn" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
      + '<button id="prod-setup-btn" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:8px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2699; Setup</button>'
      + '</div>'
      + '<div id="prod-list"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>'
      + '<div id="prod-pagination" style="display:flex;justify-content:center;gap:6px;margin-top:14px;"></div>';

    document.getElementById('prod-search-btn').addEventListener('click', function(){
      STATE.search.q = document.getElementById('prod-q').value;
      STATE.search.danh_muc_id = document.getElementById('prod-cat-filter').value;
      STATE.search.thuong_hieu_id = document.getElementById('prod-brand-filter').value;
      STATE.search.page = 1;
      _loadProducts();
    });

    document.getElementById('prod-q').addEventListener('keydown', function(e){
      if (e.keyCode===13) document.getElementById('prod-search-btn').click();
    });

    document.getElementById('prod-setup-btn').addEventListener('click', function(){
      var apiF = _api(); if (!apiF) return;
      this.textContent = 'Dang...';
      var self = this;
      apiF('prod_migrate_schema',{},function(e,d){
        self.textContent = '&#x2699; Setup';
        if (!e&&d&&d.ok) _toast(d.msg,'ok');
      });
      apiF('prod_ensure_sheets',{},function(){});
    });

    _loadProducts();
  }

  function _loadProducts() {
    var el = document.getElementById('prod-list'); if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
    var apiF = _api(); if (!apiF) return;
    apiF('prod_search', {
      q: STATE.search.q,
      danh_muc_id: STATE.search.danh_muc_id,
      thuong_hieu_id: STATE.search.thuong_hieu_id,
      page: STATE.search.page,
      limit: 30
    }, function(e,d){
      if (e||!d||!d.ok) { el.innerHTML='<p style="color:var(--red);padding:16px;">Loi tai san pham</p>'; return; }
      var rows = d.data||[];
      if (!rows.length) {
        el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">'
          + '<div style="font-size:36px;margin-bottom:12px;">&#x1F4E6;</div>'
          + '<div style="font-size:14px;font-weight:700;">Chua co san pham</div>'
          + '<div style="font-size:12px;margin-top:6px;">Them san pham hoac dong bo tu Sapo</div></div>';
        return;
      }
      var html = '<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
        + '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
        + '<thead><tr style="background:var(--bg3);">'
        + '<th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);width:40px;"></th>'
        + '<th style="padding:10px 12px;text-align:left;">San pham</th>'
        + '<th style="padding:10px 12px;text-align:left;">Danh muc</th>'
        + '<th style="padding:10px 12px;text-align:right;">Gia ban</th>'
        + '<th style="padding:10px 12px;text-align:right;">Ton kho</th>'
        + '<th style="padding:10px 12px;text-align:center;">Trang thai</th>'
        + '<th style="padding:10px 12px;"></th>'
        + '</tr></thead><tbody>';

      rows.forEach(function(r){
        var stockColor = r.ton_kho===0?'var(--red)':r.ton_kho<5?'var(--yellow)':'var(--green)';
        var img = r.anh_url ? '<img src="'+_esc(r.anh_url)+'" style="width:32px;height:32px;object-fit:cover;border-radius:6px;border:1px solid var(--border);" onerror="this.style.display=\'none\'">'
          : '<div style="width:32px;height:32px;border-radius:6px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:14px;">&#x1F4E6;</div>';
        html += '<tr style="border-top:1px solid var(--border);cursor:pointer;" id="prod-row-'+_esc(r.id)+'">'
          + '<td style="padding:8px 12px;">'+img+'</td>'
          + '<td style="padding:8px 12px;">'
          + '<div style="font-weight:700;">'+_esc(r.ten_sp)+'</div>'
          + '<div style="font-size:10px;color:var(--text3);">'+_esc(r.ma_sp)+(r.co_bien_the?' · <span style="color:var(--accent2);">+Bien the</span>':'')+(r.ma_vach?' · '+_esc(r.ma_vach):'')+'</div>'
          + '</td>'
          + '<td style="padding:8px 12px;"><span style="font-size:11px;color:var(--text3);">'+_esc(r.danh_muc||'--')+'</span></td>'
          + '<td style="padding:8px 12px;text-align:right;font-weight:700;">'+_fmt(r.gia_ban)+'</td>'
          + '<td style="padding:8px 12px;text-align:right;font-weight:700;color:'+stockColor+';">'+r.ton_kho+'</td>'
          + '<td style="padding:8px 12px;text-align:center;"><span style="padding:2px 8px;border-radius:5px;font-size:10px;font-weight:800;'+(r.active?'background:rgba(0,214,143,.1);color:var(--green)':'background:rgba(255,77,109,.1);color:var(--red)')+';">'+(r.active?'Kinh doanh':'Ngung')+'</span></td>'
          + '<td style="padding:8px 12px;" id="prod-act-'+_esc(r.id)+'"></td>'
          + '</tr>';
      });

      html += '</tbody></table></div>';
      el.innerHTML = html;

      // Bind edit buttons + row click
      rows.forEach(function(r){
        var td = document.getElementById('prod-act-'+r.id);
        if (td) {
          var btn = document.createElement('button');
          btn.innerHTML = '&#x270F;';
          btn.title = 'Chinh sua';
          btn.style.cssText = 'background:rgba(79,111,255,.1);border:1px solid rgba(79,111,255,.2);border-radius:6px;padding:4px 8px;font-size:13px;cursor:pointer;';
          btn.addEventListener('click', function(e){ e.stopPropagation(); _showProductForm(r); });
          td.appendChild(btn);
        }
        var row = document.getElementById('prod-row-'+r.id);
        if (row) row.addEventListener('click', function(){ _showProductDetail(r); });
      });

      // Pagination
      _renderPagination(d.page, d.pages, d.total);
    });
  }

  function _renderPagination(cur, total, count) {
    var el = document.getElementById('prod-pagination'); if (!el) return;
    if (total <= 1) { el.innerHTML = '<span style="font-size:11px;color:var(--text3);">'+count+' san pham</span>'; return; }
    var btns = '<span style="font-size:11px;color:var(--text3);margin-right:8px;">'+count+' SP</span>';
    for (var p=1;p<=total;p++) {
      var pp=p;
      btns += '<span data-page="'+pp+'" style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;'
        +(p===cur?'background:rgba(79,111,255,.2);color:var(--accent2);':'background:var(--bg3);color:var(--text3);')+'">'+p+'</span>';
    }
    el.innerHTML = btns;
    el.querySelectorAll('[data-page]').forEach(function(btn){
      btn.addEventListener('click', function(){
        STATE.search.page = Number(btn.getAttribute('data-page'));
        _loadProducts();
      });
    });
  }

  // ── Product Detail (expand) ────────────────────────────────────
  function _showProductDetail(prod) {
    STATE.curProduct = prod;
    var apiF = _api();
    // Load variants + price tier
    var html = _mhdr('&#x1F4E6; ' + _esc(prod.ten_sp), prod.ma_sp + (prod.ma_vach?' | Barcode: '+prod.ma_vach:''))
      + '<div style="padding:16px 20px;">'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">'
      + _kpiBox('Gia ban',   _fmt(prod.gia_ban)+'d', 'var(--green)')
      + _kpiBox('Gia si',    _fmt(prod.gia_si)+'d',  'var(--cyan)')
      + _kpiBox('Ton kho',   prod.ton_kho,            prod.ton_kho<5?'var(--red)':'var(--green)')
      + '</div>'
      + (prod.anh_url?'<img src="'+_esc(prod.anh_url)+'" style="width:100%;max-height:200px;object-fit:contain;border-radius:10px;border:1px solid var(--border);margin-bottom:12px;">':'')
      + '<div style="font-size:11px;color:var(--text3);margin-bottom:4px;">Mo ta</div>'
      + '<div style="font-size:12px;background:var(--bg3);border-radius:8px;padding:10px;margin-bottom:16px;">'+_esc(prod.mo_ta||'Chua co mo ta')+'</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button id="pd-edit-btn" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x270F; Sua SP</button>'
      + '<button id="pd-variant-btn" style="background:rgba(0,214,143,.1);border:1px solid rgba(0,214,143,.2);color:var(--green);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F500; Bien the</button>'
      + '<button id="pd-tier-btn" style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.2);color:var(--yellow);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4CA; Price Tier</button>'
      + '<button id="pd-close-btn" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Dong</button>'
      + '</div>'
      // Variants section
      + '<div id="pd-variants-section" style="margin-top:16px;"></div>'
      + '<div id="pd-tier-section" style="margin-top:16px;"></div>'
      + '</div>';

    _modal(html, '720px');
    document.getElementById('prod-modal-x').addEventListener('click', _closeModal);
    document.getElementById('pd-close-btn').addEventListener('click', _closeModal);
    document.getElementById('pd-edit-btn').addEventListener('click', function(){ _closeModal(); _showProductForm(prod); });
    document.getElementById('pd-variant-btn').addEventListener('click', function(){ _loadVariants(prod.id); });
    document.getElementById('pd-tier-btn').addEventListener('click', function(){ _loadPriceTier(prod.id); });

    // Auto-load variants if has_variants
    if (prod.co_bien_the) _loadVariants(prod.id);
  }

  function _kpiBox(label, val, color) {
    return '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;">'
      + '<div style="font-size:16px;font-weight:900;color:'+(color||'var(--text)')+';">'+val+'</div>'
      + '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);margin-top:2px;">'+label+'</div>'
      + '</div>';
  }

  function _loadVariants(spId) {
    var sec = document.getElementById('pd-variants-section'); if (!sec) return;
    sec.innerHTML = '<div style="text-align:center;padding:12px;color:var(--text3);">Dang tai bien the...</div>';
    var apiF = _api(); if (!apiF) return;
    apiF('prod_get_variants',{sp_id:spId},function(e,d){
      if (e||!d||!d.ok||!d.data.length) {
        sec.innerHTML = '<div style="margin-top:4px;">'
          + '<div style="font-size:11px;font-weight:800;margin-bottom:8px;">Bien the (0)</div>'
          + '<button id="add-variant-btn" style="background:rgba(0,214,143,.1);border:1px solid rgba(0,214,143,.2);color:var(--green);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">+ Them bien the</button>'
          + '</div>';
        document.getElementById('add-variant-btn').addEventListener('click', function(){ _showVariantForm(spId, null); });
        return;
      }
      var rows = d.data;
      var html = '<div style="font-size:11px;font-weight:800;margin-bottom:8px;">Bien the ('+rows.length+')</div>'
        + '<div style="border-radius:10px;border:1px solid var(--border);overflow:hidden;margin-bottom:8px;">'
        + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
        + '<thead><tr style="background:var(--bg3);">'
        + '<th style="padding:8px;text-align:left;">Ten</th><th style="padding:8px;">SKU</th>'
        + '<th style="padding:8px;text-align:right;">Gia</th><th style="padding:8px;text-align:right;">Ton</th>'
        + '<th style="padding:8px;text-align:left;">Thuoc tinh</th><th style="padding:8px;"></th>'
        + '</tr></thead><tbody>';
      rows.forEach(function(r){
        var attrs = Object.keys(r.thuoc_tinh||{}).map(function(k){ return k+':'+r.thuoc_tinh[k]; }).join(', ');
        html += '<tr style="border-top:1px solid var(--border);">'
          + '<td style="padding:8px;font-weight:700;">'+_esc(r.ten)+'</td>'
          + '<td style="padding:8px;font-family:monospace;font-size:10px;color:var(--text3);">'+_esc(r.sku)+'</td>'
          + '<td style="padding:8px;text-align:right;">'+_fmt(r.gia_ban)+'</td>'
          + '<td style="padding:8px;text-align:right;font-weight:700;color:'+(r.ton_kho<5?'var(--red)':'var(--green)')+';">'+r.ton_kho+'</td>'
          + '<td style="padding:8px;font-size:10px;color:var(--text3);">'+_esc(attrs||'--')+'</td>'
          + '<td style="padding:8px;" id="vr-act-'+_esc(r.id)+'"></td>'
          + '</tr>';
      });
      html += '</tbody></table></div>'
        + '<button id="add-variant-btn" style="background:rgba(0,214,143,.1);border:1px solid rgba(0,214,143,.2);color:var(--green);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">+ Them bien the</button>';
      sec.innerHTML = html;

      rows.forEach(function(r){
        var td = document.getElementById('vr-act-'+r.id); if (!td) return;
        var btn = document.createElement('button');
        btn.innerHTML = '&#x270F;';
        btn.style.cssText = 'background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;';
        btn.addEventListener('click', function(){ _showVariantForm(spId, r); });
        td.appendChild(btn);
      });

      document.getElementById('add-variant-btn').addEventListener('click', function(){ _showVariantForm(spId, null); });
    });
  }

  function _loadPriceTier(spId) {
    var sec = document.getElementById('pd-tier-section'); if (!sec) return;
    sec.innerHTML = '<div style="text-align:center;padding:12px;color:var(--text3);">Dang tai price tier...</div>';
    var apiF = _api(); if (!apiF) return;
    apiF('prod_get_price_tier',{sp_id:spId},function(e,d){
      var rows = (!e&&d&&d.ok)?d.data:[];
      var html = '<div style="font-size:11px;font-weight:800;margin-bottom:8px;">Price Tier (gia theo so luong)</div>';
      if (rows.length) {
        html += '<div style="border-radius:10px;border:1px solid var(--border);overflow:hidden;margin-bottom:8px;">'
          + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
          + '<thead><tr style="background:var(--bg3);">'
          + '<th style="padding:8px;text-align:left;">Tu so luong</th><th style="padding:8px;text-align:right;">Gia</th><th style="padding:8px;text-align:left;">Ghi chu</th><th style="padding:8px;"></th>'
          + '</tr></thead><tbody>';
        rows.forEach(function(r){
          html += '<tr style="border-top:1px solid var(--border);">'
            + '<td style="padding:8px;">&#x2265; '+r.so_luong_min+'</td>'
            + '<td style="padding:8px;text-align:right;font-weight:700;color:var(--green);">'+_fmt(r.gia)+'d</td>'
            + '<td style="padding:8px;font-size:10px;color:var(--text3);">'+_esc(r.note)+'</td>'
            + '<td style="padding:8px;" id="pt-del-'+_esc(r.id)+'"></td>'
            + '</tr>';
        });
        html += '</tbody></table></div>';
      }
      html += '<button id="add-tier-btn" style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.2);color:var(--yellow);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">+ Them gia theo SL</button>';
      sec.innerHTML = html;

      rows.forEach(function(r){
        var td = document.getElementById('pt-del-'+r.id); if (!td) return;
        var btn = document.createElement('button');
        btn.innerHTML = '&#x1F5D1;';
        btn.style.cssText = 'background:none;border:none;color:var(--red);cursor:pointer;font-size:13px;';
        btn.addEventListener('click', function(){
          apiF('prod_delete_price_tier',{id:r.id},function(e2,d2){
            if (!e2&&d2&&d2.ok){ _toast('Da xoa','ok'); _loadPriceTier(spId); }
          });
        });
        td.appendChild(btn);
      });

      document.getElementById('add-tier-btn').addEventListener('click', function(){ _showTierForm(spId); });
    });
  }

  // ── Product Form ───────────────────────────────────────────────
  function _showProductForm(prod) {
    var isNew = !prod;
    var catOpts = '<option value="">-- Chon danh muc --</option>' + _buildCatOptions(STATE.categories, prod?prod.danh_muc:'');
    var brandOpts = '<option value="">-- Chon thuong hieu --</option>'
      + STATE.brands.map(function(b){ return '<option value="'+_esc(b.id)+'"'+(prod&&prod.thuong_hieu===b.id?' selected':'')+'>'+_esc(b.ten)+'</option>'; }).join('');

    var h = _mhdr((isNew?'Them':'Sua')+' San pham', isNew?'San pham moi':'ID: '+_esc(prod.id))
      + '<div style="'+_grid('1fr 1fr')+'">'
      + _fld('pf-ten','Ten san pham','text',prod?prod.ten_sp:'',{req:true,full:true})
      + _fld('pf-ma','Ma SP / SKU','text',prod?prod.ma_sp:'',{placeholder:'Tu dong neu de trong'})
      + _fld('pf-ma-vach','Ma vach / Barcode','text',prod?prod.ma_vach:'',{})
      + _fld('pf-gia-ban','Gia ban (VND)','number',prod?prod.gia_ban:0,{req:true})
      + _fld('pf-gia-goc','Gia goc (von)','number',prod?prod.gia_goc:0,{})
      + _fld('pf-gia-si','Gia si','number',prod?prod.gia_si:0,{})
      + _fld('pf-ton','Ton kho','number',prod?prod.ton_kho:0,{})
      + _fld('pf-don-vi','Don vi','text',prod?prod.don_vi:'cai',{})
      + _fld('pf-danh-muc','Danh muc','select',catOpts,{full:false})
      + _fld('pf-thuong-hieu','Thuong hieu','select',brandOpts,{})
      + _fld('pf-anh-url','Anh URL (Google Drive / Imgur)','text',prod?prod.anh_url:'',{full:true,placeholder:'https://...'})
      + _fld('pf-mo-ta','Mo ta','textarea',prod?prod.mo_ta:'',{full:true})
      + '<div><label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;cursor:pointer;">'
      + '<input type="checkbox" id="pf-active"'+((!prod||prod.active)?' checked':'')+'> Dang kinh doanh</label></div>'
      + '</div>'
      + _mfooter('pf-cancel','pf-save', isNew?'Them san pham':'Luu thay doi');

    _modal(h, '760px');
    document.getElementById('prod-modal-x').addEventListener('click', _closeModal);
    document.getElementById('pf-cancel').addEventListener('click', _closeModal);
    document.getElementById('pf-save').addEventListener('click', function(){
      var btn = document.getElementById('pf-save');
      var ten = document.getElementById('pf-ten').value.trim();
      if (!ten) { _toast('Nhap ten san pham','error'); return; }
      btn.disabled=true; btn.textContent='Dang luu...';
      var apiF = _api(); if (!apiF) return;
      apiF('sales_save_product', {
        id       : prod ? prod.id : undefined,
        ten_sp   : ten,
        ma_sp    : document.getElementById('pf-ma').value.trim(),
        ma_vach  : document.getElementById('pf-ma-vach').value.trim(),
        gia_ban  : Number(document.getElementById('pf-gia-ban').value||0),
        gia_goc  : Number(document.getElementById('pf-gia-goc').value||0),
        gia_si   : Number(document.getElementById('pf-gia-si').value||0),
        ton_kho  : Number(document.getElementById('pf-ton').value||0),
        don_vi   : document.getElementById('pf-don-vi').value,
        danh_muc : document.getElementById('pf-danh-muc').value,
        thuong_hieu_id: document.getElementById('pf-thuong-hieu').value,
        anh_url  : document.getElementById('pf-anh-url').value.trim(),
        mo_ta    : document.getElementById('pf-mo-ta').value,
        active   : document.getElementById('pf-active').checked
      }, function(e,d){
        btn.disabled=false; btn.textContent=isNew?'Them san pham':'Luu thay doi';
        if (e||!d||!d.ok){ _toast((d&&d.error)||'Loi luu','error'); return; }
        _toast((isNew?'Da them: ':'Da cap nhat: ')+ten,'ok');
        _closeModal();
        _loadProducts();
        _loadKPI();
      });
    });
  }

  // ── Variant Form ───────────────────────────────────────────────
  function _showVariantForm(spId, variant) {
    var isNew = !variant;
    // Load attributes để chọn
    var apiF = _api(); if (!apiF) return;
    apiF('prod_get_attributes',{},function(e,d){
      var attrs = (!e&&d&&d.ok)?d.data:[];
      var attrHtml = '';
      attrs.forEach(function(a){
        var vals = a.gia_tri||[];
        var curVal = variant&&variant.thuoc_tinh&&variant.thuoc_tinh[a.ten]||'';
        var opts = '<option value="">--</option>'+vals.map(function(v){
          return '<option value="'+_esc(v)+'"'+(v===curVal?' selected':'')+'>'+_esc(v)+'</option>';
        }).join('');
        attrHtml += _fld('vf-attr-'+a.id, a.ten, 'select', opts, {});
      });
      if (!attrHtml) {
        attrHtml = '<div style="grid-column:1/-1;font-size:11px;color:var(--text3);padding:8px;background:var(--bg3);border-radius:8px;">Chua co thuoc tinh. Vao tab Thuoc tinh de them.</div>';
      }

      var h = _mhdr((isNew?'Them':'Sua')+' Bien the', 'SP: '+spId)
        + '<div style="'+_grid('1fr 1fr')+'">'
        + _fld('vf-ten','Ten bien the','text',variant?variant.ten:'',{req:true,full:true,placeholder:'VD: Do - Size M'})
        + _fld('vf-sku','SKU','text',variant?variant.sku:'',{placeholder:'Tu dong'})
        + _fld('vf-ma-vach','Ma vach','text',variant?variant.ma_vach:'',{})
        + _fld('vf-gia-ban','Gia ban','number',variant?variant.gia_ban:0,{req:true})
        + _fld('vf-gia-goc','Gia goc','number',variant?variant.gia_goc:0,{})
        + _fld('vf-ton','Ton kho','number',variant?variant.ton_kho:0,{})
        + _fld('vf-anh-url','Anh URL','text',variant?variant.anh_url:'',{full:true})
        + (attrHtml ? '<div style="grid-column:1/-1;font-size:11px;font-weight:800;color:var(--text3);margin-top:4px;">Thuoc tinh:</div>' + attrHtml : '')
        + '</div>'
        + _mfooter('vf-cancel','vf-save',isNew?'Them bien the':'Luu');

      _modal(h, '620px');
      document.getElementById('prod-modal-x').addEventListener('click', _closeModal);
      document.getElementById('vf-cancel').addEventListener('click', _closeModal);
      document.getElementById('vf-save').addEventListener('click', function(){
        var btn = document.getElementById('vf-save');
        var ten = document.getElementById('vf-ten').value.trim();
        if (!ten) { _toast('Nhap ten bien the','error'); return; }
        // Collect attributes
        var thuocTinh = {};
        attrs.forEach(function(a){
          var el = document.getElementById('vf-attr-'+a.id);
          if (el && el.value) thuocTinh[a.ten] = el.value;
        });
        btn.disabled=true; btn.textContent='Dang luu...';
        var apiF2 = _api();
        apiF2('prod_save_variant',{
          id:variant?variant.id:undefined, sp_cha_id:spId,
          ten:ten, sku:document.getElementById('vf-sku').value.trim(),
          ma_vach:document.getElementById('vf-ma-vach').value.trim(),
          gia_ban:Number(document.getElementById('vf-gia-ban').value||0),
          gia_goc:Number(document.getElementById('vf-gia-goc').value||0),
          ton_kho:Number(document.getElementById('vf-ton').value||0),
          anh_url:document.getElementById('vf-anh-url').value.trim(),
          thuoc_tinh:thuocTinh
        },function(e2,d2){
          btn.disabled=false; btn.textContent=isNew?'Them bien the':'Luu';
          if(e2||!d2||!d2.ok){_toast((d2&&d2.error)||'Loi','error');return;}
          _toast('Da luu bien the','ok');
          _closeModal();
          _showProductDetail(STATE.curProduct);
        });
      });
    });
  }

  function _showTierForm(spId) {
    var h = _mhdr('Them gia theo so luong','Price Tier')
      + '<div style="'+_grid('1fr 1fr')+'">'
      + _fld('tf-sl','Tu so luong (min)','number','10',{req:true})
      + _fld('tf-gia','Gia ap dung (VND)','number','0',{req:true})
      + _fld('tf-note','Ghi chu','text','',{full:true,placeholder:'VD: Gia si khi mua tu 10 thung'})
      + '</div>'
      + _mfooter('tf-cancel','tf-save','Them price tier');
    _modal(h, '520px');
    document.getElementById('prod-modal-x').addEventListener('click', _closeModal);
    document.getElementById('tf-cancel').addEventListener('click', _closeModal);
    document.getElementById('tf-save').addEventListener('click', function(){
      var apiF = _api();
      apiF('prod_save_price_tier',{
        sp_id:spId,
        so_luong_min:Number(document.getElementById('tf-sl').value||1),
        gia:Number(document.getElementById('tf-gia').value||0),
        note:document.getElementById('tf-note').value
      },function(e,d){
        if(!e&&d&&d.ok){_toast('Da them price tier','ok');_closeModal();_showProductDetail(STATE.curProduct);}
        else _toast((d&&d.error)||'Loi','error');
      });
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TAB 2: CÂY DANH MỤC
  // ════════════════════════════════════════════════════════════════
  function _renderCategories() {
    var el = document.getElementById('prod-body'); if (!el) return;
    el.innerHTML = '<div id="cat-tree" style="min-height:100px;"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>';
    _refreshCategoryTree();
  }

  function _refreshCategoryTree() {
    var apiF = _api(); if (!apiF) return;
    apiF('prod_get_categories',{},function(e,d){
      STATE.categories = (!e&&d&&d.ok)?d.data:[];
      var tree = (!e&&d&&d.ok)?d.tree:[];
      var el = document.getElementById('cat-tree'); if (!el) return;
      if (!STATE.categories.length) {
        el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);">Chua co danh muc</div>';
        return;
      }
      el.innerHTML = _renderCatNode(tree, 0);
      // Bind events
      el.querySelectorAll('[data-cat-edit]').forEach(function(btn){
        btn.addEventListener('click', function(){
          var id = btn.getAttribute('data-cat-edit');
          var cat = STATE.categories.find(function(c){ return c.id===id; });
          if (cat) _showCategoryForm(cat);
        });
      });
      el.querySelectorAll('[data-cat-del]').forEach(function(btn){
        btn.addEventListener('click', function(){
          var id = btn.getAttribute('data-cat-del');
          if (!confirm('Xoa danh muc nay?')) return;
          apiF('prod_delete_category',{id:id},function(e2,d2){
            if (!e2&&d2&&d2.ok){ _toast('Da xoa','ok'); _refreshCategoryTree(); }
            else _toast((d2&&d2.error)||'Loi','error');
          });
        });
      });
      el.querySelectorAll('[data-cat-add-child]').forEach(function(btn){
        btn.addEventListener('click', function(){
          var parentId = btn.getAttribute('data-cat-add-child');
          _showCategoryForm(null, parentId);
        });
      });
    });
  }

  function _renderCatNode(nodes, depth) {
    if (!nodes||!nodes.length) return '';
    var html = '';
    var indent = depth * 20;
    nodes.forEach(function(node){
      html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);margin-left:'+indent+'px;">'
        + '<span style="font-size:16px;">'+(node.icon||'&#x1F4C1;')+'</span>'
        + '<span style="flex:1;font-weight:'+(depth===0?800:700)+';font-size:'+(depth===0?13:12)+'px;">'+_esc(node.ten)+'</span>'
        + '<button data-cat-add-child="'+_esc(node.id)+'" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:12px;padding:3px 6px;" title="Them danh muc con">+ Con</button>'
        + '<button data-cat-edit="'+_esc(node.id)+'" style="background:none;border:none;color:var(--accent2);cursor:pointer;font-size:13px;padding:3px 6px;">&#x270F;</button>'
        + '<button data-cat-del="'+_esc(node.id)+'" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:13px;padding:3px 6px;">&#x1F5D1;</button>'
        + '</div>'
        + _renderCatNode(node.children, depth+1);
    });
    return html;
  }

  function _showCategoryForm(cat, parentId) {
    var isNew = !cat;
    var parentOpts = '<option value="">-- Danh muc goc --</option>'
      + STATE.categories.map(function(c){
          if (cat && c.id===cat.id) return '';  // skip self
          return '<option value="'+_esc(c.id)+'"'+((cat&&cat.cha_id===c.id||(!cat&&parentId===c.id))?' selected':'')+'>'+_esc(c.ten)+'</option>';
        }).join('');
    var icons = ['&#x1F356;','&#x1F964;','&#x1F9C2;','&#x1F527;','&#x1F4E6;','&#x1F3E0;','&#x1F9EA;','&#x1F4BB;','&#x1F456;','&#x1F4CF;','&#x1F9F4;','&#x1F6D2;'];
    var iconOpts = icons.map(function(ic){ return '<option value="'+ic+'"'+(cat&&cat.icon===ic?' selected':'')+'>'+ic+'</option>'; }).join('');

    var h = _mhdr((isNew?'Them':'Sua')+' Danh muc','')
      + '<div style="'+_grid('1fr 1fr')+'">'
      + _fld('cf-ten','Ten danh muc','text',cat?cat.ten:'',{req:true,full:true})
      + _fld('cf-parent','Danh muc cha','select',parentOpts,{})
      + _fld('cf-icon','Icon','select',iconOpts,{})
      + _fld('cf-thu-tu','Thu tu hien thi','number',cat?cat.thu_tu:0,{})
      + _fld('cf-mo-ta','Mo ta','text',cat?cat.mo_ta:'',{full:true})
      + '</div>'
      + _mfooter('cf-cancel','cf-save',isNew?'Them danh muc':'Luu');

    _modal(h, '560px');
    document.getElementById('prod-modal-x').addEventListener('click', _closeModal);
    document.getElementById('cf-cancel').addEventListener('click', _closeModal);
    document.getElementById('cf-save').addEventListener('click', function(){
      var ten = document.getElementById('cf-ten').value.trim();
      if (!ten) { _toast('Nhap ten danh muc','error'); return; }
      var btn = document.getElementById('cf-save'); btn.disabled=true;
      var apiF = _api();
      apiF('prod_save_category',{
        id:cat?cat.id:undefined,ten:ten,
        cha_id:document.getElementById('cf-parent').value,
        icon:document.getElementById('cf-icon').value,
        thu_tu:Number(document.getElementById('cf-thu-tu').value||0),
        mo_ta:document.getElementById('cf-mo-ta').value
      },function(e,d){
        btn.disabled=false;
        if(!e&&d&&d.ok){_toast('Da luu danh muc','ok');_closeModal();_refreshCategoryTree();}
        else _toast((d&&d.error)||'Loi','error');
      });
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TAB 3: THƯƠNG HIỆU
  // ════════════════════════════════════════════════════════════════
  function _renderBrands() {
    var el = document.getElementById('prod-body'); if (!el) return;
    el.innerHTML = '<div id="brand-list"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>';
    _refreshBrands();
  }

  function _refreshBrands() {
    var apiF = _api(); if (!apiF) return;
    apiF('prod_get_brands',{},function(e,d){
      STATE.brands = (!e&&d&&d.ok)?d.data:[];
      var el = document.getElementById('brand-list'); if (!el) return;
      var rows = STATE.brands;
      if (!rows.length) {
        el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);">Chua co thuong hieu</div>';
        return;
      }
      var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">';
      rows.forEach(function(r){
        html += '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;position:relative;">'
          + (r.logo_url?'<img src="'+_esc(r.logo_url)+'" style="width:40px;height:40px;object-fit:contain;border-radius:6px;margin-bottom:8px;" onerror="this.style.display=\'none\'">':'<div style="font-size:28px;margin-bottom:8px;">&#x1F3F7;</div>')
          + '<div style="font-size:13px;font-weight:900;">'+_esc(r.ten)+'</div>'
          + (r.quoc_gia?'<div style="font-size:11px;color:var(--text3);margin-top:2px;">'+_esc(r.quoc_gia)+'</div>':'')
          + '<div style="position:absolute;top:10px;right:10px;display:flex;gap:4px;">'
          + '<button data-brand-edit="'+_esc(r.id)+'" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;">&#x270F;</button>'
          + '</div></div>';
      });
      html += '</div>';
      el.innerHTML = html;

      el.querySelectorAll('[data-brand-edit]').forEach(function(btn){
        btn.addEventListener('click', function(){
          var id = btn.getAttribute('data-brand-edit');
          var brand = STATE.brands.find(function(b){ return b.id===id; });
          if (brand) _showBrandForm(brand);
        });
      });
    });
  }

  function _showBrandForm(brand) {
    var isNew = !brand;
    var h = _mhdr((isNew?'Them':'Sua')+' Thuong hieu','')
      + '<div style="'+_grid('1fr 1fr')+'">'
      + _fld('bf-ten','Ten thuong hieu','text',brand?brand.ten:'',{req:true,full:true})
      + _fld('bf-quoc-gia','Quoc gia','text',brand?brand.quoc_gia:'Viet Nam',{})
      + _fld('bf-logo','Logo URL','text',brand?brand.logo_url:'',{full:true,placeholder:'https://...'})
      + _fld('bf-mo-ta','Mo ta','textarea',brand?brand.mo_ta:'',{full:true})
      + '</div>'
      + _mfooter('bf-cancel','bf-save',isNew?'Them thuong hieu':'Luu');
    _modal(h,'540px');
    document.getElementById('prod-modal-x').addEventListener('click',_closeModal);
    document.getElementById('bf-cancel').addEventListener('click',_closeModal);
    document.getElementById('bf-save').addEventListener('click',function(){
      var ten = document.getElementById('bf-ten').value.trim();
      if (!ten){_toast('Nhap ten thuong hieu','error');return;}
      var btn=document.getElementById('bf-save');btn.disabled=true;
      var apiF=_api();
      apiF('prod_save_brand',{id:brand?brand.id:undefined,ten:ten,
        quoc_gia:document.getElementById('bf-quoc-gia').value,
        logo_url:document.getElementById('bf-logo').value.trim(),
        mo_ta:document.getElementById('bf-mo-ta').value
      },function(e,d){
        btn.disabled=false;
        if(!e&&d&&d.ok){_toast('Da luu thuong hieu','ok');_closeModal();_refreshBrands();}
        else _toast((d&&d.error)||'Loi','error');
      });
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TAB 4: THUỘC TÍNH
  // ════════════════════════════════════════════════════════════════
  function _renderAttributes() {
    var el = document.getElementById('prod-body'); if (!el) return;
    el.innerHTML = '<div id="attr-list"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>';
    _refreshAttributes();
  }

  function _refreshAttributes() {
    var apiF = _api(); if (!apiF) return;
    apiF('prod_get_attributes',{},function(e,d){
      STATE.attributes = (!e&&d&&d.ok)?d.data:[];
      var el = document.getElementById('attr-list'); if (!el) return;
      var rows = STATE.attributes;
      if (!rows.length) {
        el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Chua co thuoc tinh</div>'; return;
      }
      var html = '<div style="display:grid;gap:10px;">';
      rows.forEach(function(r){
        var vals = (r.gia_tri||[]).slice(0,8);
        html += '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
          + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'
          + '<div><div style="font-size:13px;font-weight:900;">'+_esc(r.ten)+'</div>'
          + '<div style="font-size:10px;color:var(--text3);">'+_esc(r.loai)+'</div></div>'
          + '<button data-attr-edit="'+_esc(r.id)+'" style="background:none;border:none;color:var(--accent2);cursor:pointer;font-size:13px;">&#x270F;</button>'
          + '</div>'
          + '<div style="display:flex;flex-wrap:wrap;gap:4px;">'
          + vals.map(function(v){
              return '<span style="background:rgba(79,111,255,.1);color:var(--accent2);border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">'+_esc(v)+'</span>';
            }).join('')
          + ((r.gia_tri||[]).length>8?'<span style="font-size:11px;color:var(--text3);">+'+((r.gia_tri.length)-8)+' more</span>':'')
          + '</div></div>';
      });
      html += '</div>';
      el.innerHTML = html;
      el.querySelectorAll('[data-attr-edit]').forEach(function(btn){
        btn.addEventListener('click',function(){
          var id=btn.getAttribute('data-attr-edit');
          var attr=STATE.attributes.find(function(a){return a.id===id;});
          if(attr) _showAttributeForm(attr);
        });
      });
    });
  }

  function _showAttributeForm(attr) {
    var isNew = !attr;
    var vals = attr ? (attr.gia_tri||[]).join('\n') : '';
    var loaiOpts = ['mau','size','chat_lieu','trong_luong','khac'].map(function(l){
      return '<option value="'+l+'"'+(attr&&attr.loai===l?' selected':'')+'>'+l+'</option>';
    }).join('');

    var h = _mhdr((isNew?'Them':'Sua')+' Thuoc tinh','')
      + '<div style="'+_grid('1fr 1fr')+'">'
      + _fld('af-ten','Ten thuoc tinh','text',attr?attr.ten:'',{req:true})
      + _fld('af-loai','Loai','select',loaiOpts,{})
      + _fld('af-thu-tu','Thu tu','number',attr?attr.thu_tu:0,{})
      + '<div></div>'
      + '<div style="grid-column:1/-1;"><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">Gia tri (moi gia tri 1 dong)</label>'
      + '<textarea id="af-vals" rows="6" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;resize:vertical;">'+_esc(vals)+'</textarea>'
      + '<div style="font-size:10px;color:var(--text3);margin-top:4px;">Vi du: Do<br>Xanh<br>Trang</div></div>'
      + '</div>'
      + _mfooter('af-cancel','af-save',isNew?'Them thuoc tinh':'Luu');
    _modal(h,'560px');
    document.getElementById('prod-modal-x').addEventListener('click',_closeModal);
    document.getElementById('af-cancel').addEventListener('click',_closeModal);
    document.getElementById('af-save').addEventListener('click',function(){
      var ten=document.getElementById('af-ten').value.trim();
      if (!ten){_toast('Nhap ten','error');return;}
      var vals2=document.getElementById('af-vals').value.split('\n').map(function(s){return s.trim();}).filter(Boolean);
      var btn=document.getElementById('af-save');btn.disabled=true;
      var apiF=_api();
      apiF('prod_save_attribute',{id:attr?attr.id:undefined,ten:ten,
        loai:document.getElementById('af-loai').value,
        gia_tri:vals2,thu_tu:Number(document.getElementById('af-thu-tu').value||0)
      },function(e,d){
        btn.disabled=false;
        if(!e&&d&&d.ok){_toast('Da luu thuoc tinh','ok');_closeModal();_refreshAttributes();}
        else _toast((d&&d.error)||'Loi','error');
      });
    });
  }

  // ── Build category select options (recursive) ─────────────────
  function _buildCatOptions(cats, selectedId, depth) {
    depth = depth || 0;
    var prefix = depth > 0 ? Array(depth+1).join('  ') : '';
    var html = '';
    cats.forEach(function(c){
      html += '<option value="'+_esc(c.id)+'"'+(c.id===selectedId?' selected':'')+'>'+prefix+_esc(c.ten)+'</option>';
      if (c.children && c.children.length) {
        html += _buildCatOptions(c.children, selectedId, depth+1);
      }
    });
    return html;
  }

})();
