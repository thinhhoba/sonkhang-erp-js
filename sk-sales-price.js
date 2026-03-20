/* ================================================================
 * sk-sales-price.js — SonKhang ERP v4.0
 * UI Bang gia, Chiet khau, Khuyen mai, CRM Khach hang
 * 21/03/2026
 * ================================================================ */
(function () {
  'use strict';

  var _api   = function () { return typeof window.api==='function'?window.api:typeof api==='function'?api:null; };

  /* Dùng chung modal từ sk-sales-orders.js (đã load trước) */
  function _getModal()  { return typeof window.showSalesModal==='function'  ? window.showSalesModal  : _soModal; }
  function _getClose()  { return typeof window.closeSalesModal==='function' ? window.closeSalesModal : _soClose; }
  function _soModal(h,s) {
    _soClose();
    var ov=document.createElement('div'); ov.id='sk-sales-modal';
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    var box=document.createElement('div');
    box.style.cssText='background:var(--bg2,#0f1117);border:1px solid var(--border2,#252d40);border-radius:18px;max-height:90vh;overflow-y:auto;width:100%;max-width:'+(s==='lg'?'820px':'560px')+';';
    box.innerHTML=h; ov.appendChild(box);
    ov.addEventListener('click',function(e){if(e.target===ov) _soClose();});
    document.body.appendChild(ov);
  }
  function _soClose() { var el=document.getElementById('sk-sales-modal'); if(el&&el.parentNode) el.parentNode.removeChild(el); }
  var _esc   = function (s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var _gv    = function (id) { var e=document.getElementById(id); return e?e.value:''; };
  var _sv    = function (id,v) { var e=document.getElementById(id); if(e) e.value=v; };
  var _toast = function (m,t) { if(typeof window._hrmToast==='function') window._hrmToast(m,t||'ok'); };
  var _ct    = function () { return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };

  /* ── Entry point ──────────────────────────────────────────── */
  function loadBangGia() {
    var ct = _ct(); if (!ct) return;
    if (typeof window._salesInjectCSS==='function') window._salesInjectCSS();
    ct.innerHTML = _buildShell();
    _switchSection('products');
  }
  window.loadBangGia   = loadBangGia;
  window.loadSalesCRM  = loadBangGia;

  var _curSection = 'products';

  function _buildShell() {
    return '<div id="sp-root" class="fade-in">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
      + '<div><h1 style="font-size:22px;font-weight:900;">💲 Bảng giá & CRM</h1>'
      + '<p style="font-size:12px;color:var(--text3);">Sản phẩm · Chiết khấu · Khuyến mại · Khách hàng</p></div>'
      + '</div>'
      + '<div class="sk-tab-bar">'
      + [ {id:'products', icon:'📦', label:'Bảng giá'},
          {id:'discounts', icon:'🏷️', label:'Chiết khấu / KM'},
          {id:'customers', icon:'👥', label:'Khách hàng CRM'},
          {id:'calc',      icon:'🧮', label:'Tính giá bán'}
        ].map(function(t) {
          return '<button class="sk-tab'+(t.id==='products'?' active':'')+'" id="sptab-'+t.id+'" onclick="_spSwitch(\''+t.id+'\')">'
            + t.icon+' '+_esc(t.label)+'</button>';
        }).join('')
      + '</div>'
      + '<div id="sp-content">'+( typeof window.salesLoading==='function'?window.salesLoading():'Đang tải...' )+'</div>'
      + '</div>';
  }

  function _switchSection(sec) {
    _curSection = sec;
    document.querySelectorAll('.sk-tab').forEach(function(b){
      b.classList.toggle('active', b.id==='sptab-'+sec);
    });
    var ct = document.getElementById('sp-content'); if (!ct) return;
    ct.innerHTML = typeof window.salesLoading==='function'?window.salesLoading():'Đang tải...';
    if (sec==='products')  _loadProducts();
    if (sec==='discounts') _loadDiscounts();
    if (sec==='customers') _loadCustomers();
    if (sec==='calc')      _loadCalcTool();
  }
  window._spSwitch = _switchSection;

  /* ================================================================
   * BẢNG GIÁ / SẢN PHẨM
   * ================================================================ */
  function _loadProducts() {
    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_products', { active:true }, function(e,d) {
      var ct = document.getElementById('sp-content'); if (!ct) return;
      if (e||!d||!d.ok) { ct.innerHTML=typeof window.salesEmpty==='function'?window.salesEmpty('⚠️','Lỗi tải sản phẩm'):'Lỗi'; return; }
      var products = d.data||[];
      ct.innerHTML = '<div class="sk-toolbar">'
        + '<input class="sk-search" id="sp-search" placeholder="🔍 Tìm sản phẩm..." oninput="_spFilterProducts()">'
        + '<select class="sk-filter" id="sp-cat" onchange="_spFilterProducts()">'
        + '<option value="">Tất cả danh mục</option>'
        + [...new Set(products.map(function(p){return p.danh_muc;}).filter(Boolean))].map(function(c){return '<option>'+_esc(c)+'</option>';}).join('')
        + '</select>'
        + '<button class="btn-primary" onclick="_spNewProduct()" style="font-size:11px;margin-left:auto;">+ Thêm sản phẩm</button>'
        + '<button class="btn-ghost" onclick="_spSyncSapo()" style="font-size:11px;">🔗 Sync Sapo</button>'
        + '</div>'
        + '<div id="sp-prod-list" data-all=\''+_esc(JSON.stringify(products))+'\'>'+_renderProductTable(products)+'</div>';
    });
  }

  window._spFilterProducts = function() {
    var search = (_gv('sp-search')||'').toLowerCase();
    var cat    = _gv('sp-cat');
    var el     = document.getElementById('sp-prod-list'); if (!el) return;
    var all    = JSON.parse(el.getAttribute('data-all')||'[]');
    var filtered = all.filter(function(p) {
      if (cat && p.danh_muc!==cat) return false;
      if (search && (p.ten_sp||'').toLowerCase().indexOf(search)<0 && (p.ma_sp||'').toLowerCase().indexOf(search)<0) return false;
      return true;
    });
    el.innerHTML = _renderProductTable(filtered);
  };

  function _renderProductTable(products) {
    if (!products.length) return typeof window.salesEmpty==='function'?window.salesEmpty('📦','Chưa có sản phẩm','+ Thêm','_spNewProduct()'):'Chưa có sản phẩm';
    var fm = typeof window.fmtMoney==='function'?window.fmtMoney:function(v){return v+'đ';};
    return '<div class="sk-table-wrap"><table class="sk-table"><thead><tr>'
      + '<th>Mã SP</th><th>Tên sản phẩm</th><th>Giá bán lẻ</th><th>Giá sỉ</th><th>Giá gốc</th>'
      + '<th>ĐVT</th><th>Tồn kho</th><th>Danh mục</th><th style="width:90px;"></th>'
      + '</tr></thead><tbody>'
      + products.map(function(p) {
          var margin = p.gia_ban>0?Math.round((p.gia_ban-p.gia_goc)/p.gia_ban*100):0;
          return '<tr>'
            + '<td style="font-size:10px;color:var(--text3);">'+_esc(p.ma_sp||'')+'</td>'
            + '<td><div style="font-weight:700;">'+_esc(p.ten_sp)+'</div>'
            + (p.mo_ta?'<div style="font-size:10px;color:var(--text3);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(p.mo_ta)+'</div>':'')
            + '</td>'
            + '<td style="font-weight:800;color:var(--text);">'+fm(p.gia_ban)+'</td>'
            + '<td style="color:var(--cyan);">'+(p.gia_si>0?fm(p.gia_si):'—')+'</td>'
            + '<td style="color:var(--text3);">'+fm(p.gia_goc)+'</td>'
            + '<td>'+_esc(p.don_vi||'cái')+'</td>'
            + '<td style="color:'+(p.ton_kho<=5?'var(--red)':'var(--green)')+';">'+p.ton_kho+'</td>'
            + '<td style="font-size:11px;">'+_esc(p.danh_muc||'—')+'</td>'
            + '<td><div style="display:flex;gap:3px;">'
            + '<button class="btn-ghost" onclick="_spEditProduct(\''+_esc(JSON.stringify(p).replace(/'/g,"&#39;"))+'\',event)" style="padding:4px 8px;font-size:10px;">✏️</button>'
            + '<button class="btn-ghost" onclick="_spDeleteProduct(\''+_esc(p.id)+'\')" style="padding:4px 8px;font-size:10px;color:var(--red);">🗑️</button>'
            + '</div></td>'
            + '</tr>';
        }).join('')
      + '</tbody></table></div>'
      + '<div style="text-align:center;margin-top:12px;font-size:11px;color:var(--text3);">'
      + products.length+' sản phẩm</div>';
  }

  function _spNewProduct() { _spShowProductForm(null); }
  window._spNewProduct = _spNewProduct;

  function _spEditProduct(jsonStr) {
    try { var p = JSON.parse(jsonStr); _spShowProductForm(p); } catch(e) {}
  }
  window._spEditProduct = _spEditProduct;

  function _spShowProductForm(p) {
    var isNew = !p;
    var html = '<div class="sk-modal-hd"><div style="font-size:15px;font-weight:900;">'+(isNew?'➕ Thêm sản phẩm':'✏️ Chỉnh sửa: '+_esc((p||{}).ten_sp||''))+'</div>'
      + '<button class="btn-ghost" onclick="closeSalesModal()" style="padding:6px 10px;">✕</button></div>'
      + '<div class="sk-modal-bd"><div class="sk-form-grid">'
      + _fG('Mã sản phẩm',   'form-input', 'pf-ma',    isNew?'':'text', p, 'ma_sp')
      + _fG('Tên sản phẩm',  'form-input', 'pf-ten',   isNew?'':'text', p, 'ten_sp', true)
      + _fG('Giá bán lẻ',    'form-input', 'pf-gia',   'number', p, 'gia_ban')
      + _fG('Giá sỉ',        'form-input', 'pf-gias',  'number', p, 'gia_si')
      + _fG('Giá gốc / nhập','form-input', 'pf-giag',  'number', p, 'gia_goc')
      + _fG('Đơn vị tính',   'form-input', 'pf-dv',    'text',   p, 'don_vi')
      + _fG('Danh mục',      'form-input', 'pf-cat',   'text',   p, 'danh_muc')
      + _fG('Tồn kho ban đầu','form-input','pf-ton',   'number', p, 'ton_kho')
      + '<div class="sk-form-group sk-form-full"><label class="sk-lbl">Mô tả</label>'
      + '<textarea class="form-input" id="pf-mota" style="height:60px;">'+_esc((p||{}).mo_ta||'')+'</textarea></div>'
      + '</div></div>'
      + '<div class="sk-modal-ft"><button class="btn-ghost" onclick="closeSalesModal()">Hủy</button>'
      + '<button class="btn-primary" onclick="_spSaveProduct('+(p?'\''+_esc(p.id)+'\'':'\'\''+')')+' style="font-size:12px;">💾 Lưu</button>'
      + '</div>';
    window.showSalesModal ? window.showSalesModal(html) : (typeof showSalesModal==='function'&&showSalesModal(html));
  }

  function _fG(label, cls, id, type, obj, field, full) {
    var val = obj ? (obj[field]||'') : '';
    return '<div class="sk-form-group'+(full?' sk-form-full':'')+'"><label class="sk-lbl">'+label+'</label>'
      + '<input class="'+cls+'" id="'+id+'" type="'+(type||'text')+'" value="'+_esc(String(val))+'"></div>';
  }

  window._spSaveProduct = function(id) {
    var apiF = _api(); if (!apiF) return;
    apiF('sales_save_product', {
      id:id||'', ma_sp:_gv('pf-ma'), ten_sp:_gv('pf-ten'),
      gia_ban:Number(_gv('pf-gia')||0), gia_si:Number(_gv('pf-gias')||0),
      gia_goc:Number(_gv('pf-giag')||0), don_vi:_gv('pf-dv')||'cái',
      danh_muc:_gv('pf-cat'), ton_kho:Number(_gv('pf-ton')||0),
      mo_ta:(document.getElementById('pf-mota')||{}).value||''
    }, function(e,d) {
      if (e||!d||!d.ok) { _toast((d&&d.error)||'Lỗi','error'); return; }
      _toast('✅ Đã lưu sản phẩm','ok');
      (window.closeSalesModal||function(){})(); _loadProducts();
    });
  };

  window._spDeleteProduct = function(id) {
    if (typeof window.salesConfirm==='function') {
      window.salesConfirm('Xóa sản phẩm này?', function() {
        var apiF=_api(); if(!apiF) return;
        apiF('sales_delete_product',{id:id},function(e,d){
          if(e||!d||!d.ok){_toast((d&&d.error)||'Lỗi','error');return;}
          _toast('✅ Đã xóa','ok'); _loadProducts();
        });
      });
    }
  };

  window._spSyncSapo = function() {
    _toast('Đang đồng bộ sản phẩm từ Sapo...','ok');
    var apiF=_api(); if(!apiF) return;
    apiF('sapo_sync_products',{},function(e,d){
      if(e||!d||!d.ok){_toast((d&&d.error)||'Sapo chưa cấu hình','warn');return;}
      _toast('✅ Đồng bộ: '+d.created+' mới, '+d.updated+' cập nhật','ok');
      _loadProducts();
    });
  };

  /* ================================================================
   * CHIẾT KHẤU / KHUYẾN MẠI
   * ================================================================ */
  function _loadDiscounts() {
    var apiF=_api(); if(!apiF) return;
    apiF('sales_get_discounts',{},function(e,d) {
      var ct=document.getElementById('sp-content'); if(!ct) return;
      var rows=(!e&&d&&d.ok)?d.data:[];
      var STATUS_COL = {dang_chay:'var(--green)',chua_bat_dau:'var(--yellow)',het_han:'var(--red)',da_tat:'var(--text3)'};
      var STATUS_LBL = {dang_chay:'Đang chạy',chua_bat_dau:'Chưa bắt đầu',het_han:'Hết hạn',da_tat:'Đã tắt'};
      ct.innerHTML = '<div class="sk-toolbar">'
        + '<button class="btn-primary" onclick="_spNewDiscount()" style="font-size:11px;margin-left:auto;">+ Thêm chương trình</button>'
        + '</div>'
        + '<div class="sk-table-wrap"><table class="sk-table"><thead><tr>'
        + '<th>Tên</th><th>Loại</th><th>Giá trị</th><th>Điều kiện</th>'
        + '<th>Từ ngày</th><th>Đến ngày</th><th>Trạng thái</th><th></th>'
        + '</tr></thead><tbody>'
        + (rows.length?rows.map(function(r) {
            var col = STATUS_COL[r.status]||'var(--text3)';
            return '<tr>'
              + '<td style="font-weight:700;">'+_esc(r.ten)+'</td>'
              + '<td>'+_esc(r.type==='pt'?'Phần trăm':'Số tiền cố định')+'</td>'
              + '<td style="font-weight:800;color:var(--accent2);">'+(r.type==='pt'?r.gia_tri+'%':(typeof window.fmtMoney==='function'?window.fmtMoney(r.gia_tri):r.gia_tri))+'</td>'
              + '<td style="font-size:11px;">'+(r.min_qty?'Min '+r.min_qty+' sp':'')+(r.min_value>0?' / '+( typeof window.fmtMoney==='function'?window.fmtMoney(r.min_value):r.min_value):'')+(r.nhom_kh?' / Nhóm: '+r.nhom_kh:'')+'</td>'
              + '<td style="font-size:11px;color:var(--text3);">'+_esc(r.tu_ngay||'—')+'</td>'
              + '<td style="font-size:11px;color:var(--text3);">'+_esc(r.den_ngay||'—')+'</td>'
              + '<td><span style="color:'+col+';font-size:10px;font-weight:800;">'+( STATUS_LBL[r.status]||r.status )+'</span></td>'
              + '<td><button class="btn-ghost" onclick="_spEditDiscount(\''+_esc(r.id)+'\')" style="padding:4px 8px;font-size:10px;">✏️</button></td>'
              + '</tr>';
          }).join('')
          : '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text3);">Chưa có chương trình nào</td></tr>')
        + '</tbody></table></div>';
    });
  }

  function _spNewDiscount() { _spShowDiscountForm(null); }
  window._spNewDiscount = _spNewDiscount;

  function _spShowDiscountForm(ck) {
    var todayV = new Date().toISOString().split('T')[0];
    var html = '<div class="sk-modal-hd"><div style="font-size:15px;font-weight:900;">'+(ck?'✏️ Sửa chiết khấu':'➕ Thêm chương trình CK/KM')+'</div>'
      + '<button class="btn-ghost" onclick="closeSalesModal()" style="padding:6px 10px;">✕</button></div>'
      + '<div class="sk-modal-bd"><div class="sk-form-grid">'
      + '<div class="sk-form-group sk-form-full"><label class="sk-lbl">Tên chương trình</label>'
      + '<input class="form-input" id="ck-ten" value="'+_esc((ck||{}).ten||'')+'"></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">Loại chiết khấu</label>'
      + '<select class="form-input" id="ck-type"><option value="pt"'+((!ck||ck.type==='pt')?' selected':'')+'>Phần trăm (%)</option>'
      + '<option value="vnd"'+((ck&&ck.type==='vnd')?' selected':'')+'>Số tiền (VND)</option></select></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">Giá trị (% hoặc VND)</label>'
      + '<input type="number" class="form-input" id="ck-val" value="'+(ck?ck.gia_tri:0)+'"></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">Số lượng tối thiểu</label>'
      + '<input type="number" class="form-input" id="ck-minqty" value="'+(ck?ck.min_qty:0)+'"></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">Giá trị đơn tối thiểu</label>'
      + '<input type="number" class="form-input" id="ck-minval" value="'+(ck?ck.min_value:0)+'"></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">Nhóm khách hàng</label>'
      + '<select class="form-input" id="ck-nhom"><option value="">Tất cả</option>'
      + '<option value="le"'+((ck&&ck.nhom_kh==='le')?' selected':'')+'>Lẻ</option>'
      + '<option value="si"'+((ck&&ck.nhom_kh==='si')?' selected':'')+'>Sỉ</option>'
      + '<option value="dai_ly"'+((ck&&ck.nhom_kh==='dai_ly')?' selected':'')+'>Đại lý</option>'
      + '</select></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">Từ ngày</label>'
      + '<input type="date" class="form-input" id="ck-from" value="'+(ck&&ck.tu_ngay?ck.tu_ngay:todayV)+'"></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">Đến ngày</label>'
      + '<input type="date" class="form-input" id="ck-to" value="'+((ck&&ck.den_ngay)||'')+'"></div>'
      + '<div class="sk-form-group sk-form-full"><label class="sk-lbl">Mô tả</label>'
      + '<input class="form-input" id="ck-mota" value="'+_esc((ck||{}).mo_ta||'')+'"></div>'
      + '</div></div>'
      + '<div class="sk-modal-ft"><button class="btn-ghost" onclick="closeSalesModal()">Hủy</button>'
      + '<button class="btn-primary" onclick="_spSaveDis('+(ck?'\''+_esc(ck.id)+'\'':'\'\'')+')">💾 Lưu</button></div>';
    _getModal()(html);
  }
  window._spEditDiscount = function(id) {
    var apiF=_api(); if(!apiF) return;
    apiF('sales_get_discounts',{},function(e,d){
      if(e||!d||!d.ok) return;
      var ck=(d.data||[]).find(function(r){return r.id===id;});
      if(ck) _spShowDiscountForm(ck);
    });
  };

  window._spSaveDis = function(id) {
    var apiF=_api(); if(!apiF) return;
    apiF('sales_save_discount',{
      id:id, ten:_gv('ck-ten'), type:_gv('ck-type'),
      gia_tri:Number(_gv('ck-val')||0),
      min_qty:Number(_gv('ck-minqty')||0),
      min_value:Number(_gv('ck-minval')||0),
      nhom_kh:_gv('ck-nhom'), tu_ngay:_gv('ck-from'),
      den_ngay:_gv('ck-to'), mo_ta:_gv('ck-mota')
    },function(e,d){
      if(e||!d||!d.ok){_toast((d&&d.error)||'Lỗi','error');return;}
      _toast('✅ Đã lưu chương trình','ok');
      _getClose()();
      _loadDiscounts();
    });
  };

  /* ================================================================
   * KHÁCH HÀNG CRM
   * ================================================================ */
  function _loadCustomers() {
    var apiF=_api(); if(!apiF) return;
    apiF('sales_get_customers',{},function(e,d){
      var ct=document.getElementById('sp-content'); if(!ct) return;
      var rows=(!e&&d&&d.ok)?d.data:[];
      var fm=typeof window.fmtMoney==='function'?window.fmtMoney:function(v){return v+'đ';};
      var NHOM_COL={le:'var(--text2)',si:'var(--cyan)',dai_ly:'var(--purple)',vip:'var(--yellow)'};
      ct.innerHTML='<div class="sk-toolbar">'
        +'<input class="sk-search" id="kh-search" placeholder="🔍 Tìm khách hàng, SĐT..." oninput="_khFilter()">'
        +'<select class="sk-filter" id="kh-nhom" onchange="_khFilter()">'
        +'<option value="">Tất cả nhóm</option>'
        +'<option value="le">Lẻ</option><option value="si">Sỉ</option>'
        +'<option value="dai_ly">Đại lý</option><option value="vip">VIP</option>'
        +'</select>'
        +'<button class="btn-primary" onclick="_khNew()" style="font-size:11px;margin-left:auto;">+ Thêm khách</button>'
        +'</div>'
        +'<div id="kh-list" data-all=\''+_esc(JSON.stringify(rows))+'\'>'+_renderCustomerTable(rows,fm,NHOM_COL)+'</div>';
    });
  }

  window._khFilter = function() {
    var search=(_gv('kh-search')||'').toLowerCase(), nhom=_gv('kh-nhom');
    var el=document.getElementById('kh-list'); if(!el) return;
    var all=JSON.parse(el.getAttribute('data-all')||'[]');
    var fm=typeof window.fmtMoney==='function'?window.fmtMoney:function(v){return v+'đ';};
    var NHOM_COL={le:'var(--text2)',si:'var(--cyan)',dai_ly:'var(--purple)',vip:'var(--yellow)'};
    var filtered=all.filter(function(k){
      if(nhom&&k.nhom!==nhom) return false;
      if(search&&(k.ten||'').toLowerCase().indexOf(search)<0&&(k.phone||'').indexOf(search)<0) return false;
      return true;
    });
    el.innerHTML=_renderCustomerTable(filtered,fm,NHOM_COL);
  };

  function _renderCustomerTable(rows,fm,NHOM_COL) {
    if(!rows.length) return typeof window.salesEmpty==='function'?window.salesEmpty('👥','Chưa có khách hàng','+ Thêm khách','_khNew()'):'Chưa có khách';
    return '<div class="sk-table-wrap"><table class="sk-table"><thead><tr>'
      +'<th>Mã KH</th><th>Họ tên</th><th>Điện thoại</th><th>Nhóm</th>'
      +'<th>Tổng mua</th><th>Còn nợ</th><th>Điểm TL</th><th></th>'
      +'</tr></thead><tbody>'
      +rows.map(function(k){
        var col=NHOM_COL[k.nhom]||'var(--text2)';
        return '<tr>'
          +'<td style="font-size:10px;color:var(--text3);">'+_esc(k.id)+'</td>'
          +'<td><div style="font-weight:700;cursor:pointer;color:var(--accent2);" onclick="_khDetail(\''+_esc(k.id)+'\')">'+_esc(k.ten)+'</div>'
          +(k.email?'<div style="font-size:10px;color:var(--text3);">'+_esc(k.email)+'</div>':'')+'</td>'
          +'<td>'+_esc(k.phone||'—')+'</td>'
          +'<td><span style="color:'+col+';font-weight:800;font-size:11px;">'+_esc(k.nhom||'le').toUpperCase()+'</span></td>'
          +'<td style="font-weight:700;color:var(--green);">'+fm(k.tong_mua)+'</td>'
          +'<td style="color:'+(k.no_cuoi>0?'var(--red)':'var(--text3)')+';">'+(k.no_cuoi>0?fm(k.no_cuoi):'—')+'</td>'
          +'<td>'+( k.diem||0 )+'</td>'
          +'<td><button class="btn-ghost" onclick="_khDetail(\''+_esc(k.id)+'\')" style="padding:4px 8px;font-size:10px;">👁</button></td>'
          +'</tr>';
      }).join('')
      +'</tbody></table></div>'
      +'<div style="text-align:center;margin-top:10px;font-size:11px;color:var(--text3);">'+rows.length+' khách hàng</div>';
  }

  function _khNew() { _spShowCustomerForm(null); }
  window._khNew = _khNew;

  window._khDetail = function(id) {
    var apiF=_api(); if(!apiF) return;
    if(typeof window.showSalesModal==='function') window.showSalesModal(typeof window.salesLoading==='function'?window.salesLoading():'Đang tải...','lg');
    apiF('sales_get_customer_detail',{id:id},function(e,d){
      if(e||!d||!d.ok){document.querySelector('.sk-modal-box').innerHTML='<div style="padding:24px;color:var(--red);">Lỗi</div>';return;}
      var k=d.customer; var orders=d.recent_orders||[];
      var fm=typeof window.fmtMoney==='function'?window.fmtMoney:function(v){return v+'đ';};
      var html='<div class="sk-modal-hd"><div><div style="font-size:16px;font-weight:900;">👤 '+_esc(k.ten)+'</div>'
        +'<div style="font-size:11px;color:var(--text3);">'+_esc(k.id)+' · '+_esc(k.nhom||'le').toUpperCase()+'</div></div>'
        +'<button class="btn-ghost" onclick="closeSalesModal()" style="padding:6px 10px;">✕</button></div>'
        +'<div class="sk-modal-bd">'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">'
        +'<div class="card" style="padding:14px;">'
        +'<div class="sk-lbl" style="margin-bottom:8px;">Thông tin</div>'
        +_iR('SĐT',k.phone)+_iR('Email',k.email)+_iR('Địa chỉ',k.dia_chi)+_iR('Tỉnh/TP',k.tinh)+_iR('MST',k.mst)
        +'<button class="btn-ghost" onclick="_spShowCustomerForm(\''+_esc(JSON.stringify(k).replace(/'/g,"&#39;"))+'\',true)" style="margin-top:8px;font-size:11px;width:100%;">✏️ Sửa thông tin</button>'
        +'</div>'
        +'<div class="card" style="padding:14px;">'
        +'<div class="sk-lbl" style="margin-bottom:8px;">Thống kê</div>'
        +'<div style="text-align:center;padding:10px 0;">'
        +'<div style="font-size:28px;font-weight:900;color:var(--green);">'+fm(k.tong_mua)+'</div>'
        +'<div style="font-size:10px;color:var(--text3);">Tổng mua tích lũy</div>'
        +'</div>'
        +_iR('Còn nợ',fm(k.no_cuoi),'var(--red)')+_iR('Điểm tích lũy',k.diem||0)
        +'<button class="btn-primary" onclick="(closeSalesModal(),_soNewOrderForCustomer(\''+_esc(k.id)+'\',\''+_esc(k.ten)+'\'))" style="margin-top:8px;font-size:11px;width:100%;">🛒 Tạo đơn hàng</button>'
        +'</div></div>'
        +(orders.length?'<div class="card" style="padding:14px;">'
          +'<div class="sk-lbl" style="margin-bottom:8px;">📋 Đơn hàng gần nhất</div>'
          +'<div class="sk-table-wrap"><table class="sk-table"><thead><tr><th>Mã đơn</th><th>Ngày</th><th>Tổng tiền</th><th>TT</th></tr></thead><tbody>'
          +orders.map(function(o){
            return '<tr><td style="color:var(--accent2);cursor:pointer;" onclick="(closeSalesModal(),_soDetail(\''+_esc(o.ma_don)+'\'))">'+_esc(o.ma_don)+'</td>'
              +'<td style="font-size:11px;color:var(--text3);">'+_esc(o.ngay)+'</td>'
              +'<td style="font-weight:700;">'+fm(o.tong)+'</td>'
              +'<td style="font-size:10px;">'+_esc(o.trang_thai)+'</td></tr>';
          }).join('')
          +'</tbody></table></div></div>':'')
        +'</div>';
      document.querySelector('.sk-modal-box').innerHTML=html;
    });
  };

  function _iR(label,val,col){
    if(!val&&val!==0) return '';
    return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px;">'
      +'<span style="color:var(--text3);">'+_esc(label)+'</span>'
      +'<span style="font-weight:600;'+(col?'color:'+col+';':'')+' text-align:right;">'+_esc(String(val))+'</span></div>';
  }

  function _spShowCustomerForm(k, isFromDetail) {
    if (typeof k === 'string') { try { k=JSON.parse(k); } catch(e){k=null;} }
    var html='<div class="sk-modal-hd"><div style="font-size:15px;font-weight:900;">'+(k?'✏️ Sửa khách hàng':'➕ Thêm khách hàng')+'</div>'
      +'<button class="btn-ghost" onclick="closeSalesModal()" style="padding:6px 10px;">✕</button></div>'
      +'<div class="sk-modal-bd"><div class="sk-form-grid">'
      +'<div class="sk-form-group sk-form-full"><label class="sk-lbl">Họ tên *</label><input class="form-input" id="kf-ten" value="'+_esc((k||{}).ten||'')+'"></div>'
      +'<div class="sk-form-group"><label class="sk-lbl">Số điện thoại</label><input class="form-input" id="kf-phone" value="'+_esc((k||{}).phone||'')+'"></div>'
      +'<div class="sk-form-group"><label class="sk-lbl">Email</label><input class="form-input" id="kf-email" value="'+_esc((k||{}).email||'')+'"></div>'
      +'<div class="sk-form-group"><label class="sk-lbl">Nhóm khách hàng</label>'
      +'<select class="form-input" id="kf-nhom"><option value="le"'+(((!k)||k.nhom==='le')?' selected':'')+'>Lẻ</option>'
      +'<option value="si"'+((k&&k.nhom==='si')?' selected':'')+'>Sỉ</option>'
      +'<option value="dai_ly"'+((k&&k.nhom==='dai_ly')?' selected':'')+'>Đại lý</option>'
      +'<option value="vip"'+((k&&k.nhom==='vip')?' selected':'')+'>VIP</option></select></div>'
      +'<div class="sk-form-group"><label class="sk-lbl">MST (hóa đơn VAT)</label><input class="form-input" id="kf-mst" value="'+_esc((k||{}).mst||'')+'"></div>'
      +'<div class="sk-form-group"><label class="sk-lbl">Tỉnh / TP</label><input class="form-input" id="kf-tinh" value="'+_esc((k||{}).tinh||'')+'"></div>'
      +'<div class="sk-form-group sk-form-full"><label class="sk-lbl">Địa chỉ</label><input class="form-input" id="kf-addr" value="'+_esc((k||{}).dia_chi||'')+'"></div>'
      +'</div></div>'
      +'<div class="sk-modal-ft"><button class="btn-ghost" onclick="closeSalesModal()">Hủy</button>'
      +'<button class="btn-primary" onclick="_khSave('+(k?'\''+_esc(k.id)+'\'':'\'\'')+')">💾 Lưu</button></div>';
    _getModal()(html);
  }
  window._spShowCustomerForm = _spShowCustomerForm;

  window._khSave = function(id) {
    var ten=_gv('kf-ten').trim(); if(!ten){_toast('Nhập họ tên','error');return;}
    var apiF=_api(); if(!apiF) return;
    apiF('sales_save_customer',{id:id,ten:ten,phone:_gv('kf-phone'),email:_gv('kf-email'),
      nhom:_gv('kf-nhom'),mst:_gv('kf-mst'),tinh:_gv('kf-tinh'),dia_chi:_gv('kf-addr')},
    function(e,d){
      if(e||!d||!d.ok){_toast((d&&d.error)||'Lỗi','error');return;}
      _toast('✅ Đã lưu khách hàng','ok');
      _getClose()();
      _loadCustomers();
    });
  };

  /* ================================================================
   * CÔNG CỤ TÍNH GIÁ BÁN
   * ================================================================ */
  function _loadCalcTool() {
    var ct=document.getElementById('sp-content'); if(!ct) return;
    ct.innerHTML='<div style="max-width:540px;">'
      +'<h3 style="font-size:14px;font-weight:800;margin-bottom:16px;">🧮 Công cụ tính giá bán</h3>'
      +'<div class="card" style="padding:20px;">'
      +'<div class="sk-form-grid" style="margin-bottom:16px;">'
      +'<div class="sk-form-group"><label class="sk-lbl">Giá nhập (gốc)</label><input type="number" class="form-input" id="calc-goc" placeholder="0" oninput="_calcUpdate()"></div>'
      +'<div class="sk-form-group"><label class="sk-lbl">% Lợi nhuận mục tiêu</label><input type="number" class="form-input" id="calc-margin" placeholder="20" value="20" oninput="_calcUpdate()"></div>'
      +'<div class="sk-form-group"><label class="sk-lbl">Chi phí cố định / đơn</label><input type="number" class="form-input" id="calc-cost" placeholder="0" value="0" oninput="_calcUpdate()"></div>'
      +'<div class="sk-form-group"><label class="sk-lbl">% Thuế VAT</label><input type="number" class="form-input" id="calc-vat" placeholder="10" value="10" oninput="_calcUpdate()"></div>'
      +'<div class="sk-form-group sk-form-full"><label class="sk-lbl">% Chiết khấu cho khách</label><input type="number" class="form-input" id="calc-ck" placeholder="0" value="0" oninput="_calcUpdate()"></div>'
      +'</div>'
      +'<div id="calc-result" style="background:var(--bg3);border-radius:10px;padding:16px;">'
      +'<div style="text-align:center;color:var(--text3);">Nhập giá nhập để tính</div>'
      +'</div>'
      +'</div></div>';
  }

  window._calcUpdate = function() {
    var goc    = Number(_gv('calc-goc')||0);
    var margin = Number(_gv('calc-margin')||20)/100;
    var cost   = Number(_gv('calc-cost')||0);
    var vat    = Number(_gv('calc-vat')||10)/100;
    var ck     = Number(_gv('calc-ck')||0)/100;
    var el     = document.getElementById('calc-result'); if(!el) return;
    if(!goc){el.innerHTML='<div style="text-align:center;color:var(--text3);">Nhập giá nhập để tính</div>';return;}
    var fm = typeof window.fmtMoney==='function'?window.fmtMoney:function(v){return v+'đ';};
    var giaBanTruocVAT = Math.round((goc + cost) / (1 - margin));
    var giaBanCoVAT    = Math.round(giaBanTruocVAT * (1 + vat));
    var giaChoCK       = Math.round(giaBanCoVAT * (1 - ck));
    var laiThuc        = giaBanTruocVAT - goc - cost;
    var marginThuc     = goc > 0 ? Math.round(laiThuc/giaBanTruocVAT*100) : 0;
    el.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
      +'<div style="text-align:center;padding:12px;background:var(--bg2);border-radius:8px;">'
      +'<div style="font-size:20px;font-weight:900;color:var(--green);">'+fm(giaBanTruocVAT)+'</div>'
      +'<div style="font-size:10px;color:var(--text3);">Giá bán (chưa VAT)</div></div>'
      +'<div style="text-align:center;padding:12px;background:var(--bg2);border-radius:8px;">'
      +'<div style="font-size:20px;font-weight:900;color:var(--accent2);">'+fm(giaBanCoVAT)+'</div>'
      +'<div style="font-size:10px;color:var(--text3);">Giá bán (có VAT '+(_gv('calc-vat')||10)+'%)</div></div>'
      +'</div>'
      +(ck>0?'<div style="text-align:center;padding:10px;margin-top:8px;background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);border-radius:8px;">'
        +'<div style="font-size:16px;font-weight:900;color:var(--yellow);">'+fm(giaChoCK)+'</div>'
        +'<div style="font-size:10px;color:var(--text3);">Giá sau chiết khấu '+_gv('calc-ck')+'%</div></div>':'')
      +'<div style="display:flex;justify-content:space-around;margin-top:12px;font-size:12px;">'
      +'<div><span style="color:var(--text3);">Lợi nhuận: </span><span style="font-weight:800;color:var(--green);">'+fm(laiThuc)+'</span></div>'
      +'<div><span style="color:var(--text3);">Margin: </span><span style="font-weight:800;color:'+(marginThuc>=20?'var(--green)':'var(--yellow)')+';">'+marginThuc+'%</span></div>'
      +'</div>';
  };

  /* Helper mở tạo đơn với khách hàng được chọn sẵn */
  window._soNewOrderForCustomer = function(khId, khTen) {
    if (typeof loadDonHang==='function') loadDonHang();
    setTimeout(function() {
      var sel=document.getElementById('so-kh-sel');
      if(sel) { sel.value=khId; }
      if(typeof _soNewOrder==='function') _soNewOrder();
    }, 800);
  };

})();
