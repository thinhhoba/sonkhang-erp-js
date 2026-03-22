/* ================================================================
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
  function loadDonHang() {
    var ct = _ct(); if (!ct) return;
    if (typeof window._salesInjectCSS === 'function') window._salesInjectCSS();
    ct.innerHTML = _buildShell();
    _loadDashboard();
    _loadOrders('all');
  }
  window.loadDonHang = loadDonHang;

  /* Shortcut tabs - goi tu sidebar hoac mega menu */
  window.loadDonHangTab = function (tab) {
    if (!document.getElementById('so-root')) {
      loadDonHang();
      setTimeout(function () { if (typeof window._soTab === 'function') window._soTab(tab); }, 200);
    } else {
      if (typeof window._soTab === 'function') window._soTab(tab);
    }
  };

  /* ── Shell HTML ───────────────────────────────────────────── */
  function _buildShell() {
    return '<div id="so-root" class="fade-in">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
      +   '<div><h1 style="font-size:22px;font-weight:900;">🛒 Quản lý Đơn hàng</h1>'
      +   '<p style="font-size:12px;color:var(--text3);">Tất cả trạng thái — liên kết kho, giao hàng, kế toán</p></div>'
      +   '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      +   '<button class="btn-ghost" onclick="_soRefresh()" style="font-size:11px;">🔄 Đồng bộ Sapo</button>'
      +   '<button class="btn-primary" onclick="_soNewOrder()" style="font-size:11px;">+ Tạo đơn hàng</button>'
      +   '</div>'
      + '</div>'
      + '<div id="so-kpi-row" class="sk-kpi-grid"></div>'
      + '<div class="sk-tab-bar" id="so-tabs">'
      + STATUS_TABS.map(function(t) {
          return '<button class="sk-tab'+(t.id==='all'?' active':'')+'" id="sotab-'+t.id+'" onclick="_soTab(\''+t.id+'\')">'
            + t.icon+' '+_esc(t.label)+'</button>';
        }).join('')
      + '</div>'
      + '<div class="sk-toolbar">'
      +   '<input class="sk-search" id="so-search" placeholder="🔍 Tìm đơn hàng, khách hàng..." oninput="_soSearch()">'
      +   '<select class="sk-filter" id="so-sort" onchange="_soSearch()">'
      +     '<option value="date_desc">Mới nhất</option>'
      +     '<option value="date_asc">Cũ nhất</option>'
      +     '<option value="total_desc">Giá trị cao</option>'
      +   '</select>'
      +   '<input type="date" class="sk-filter" id="so-from" oninput="_soSearch()">'
      +   '<input type="date" class="sk-filter" id="so-to" oninput="_soSearch()">'
      + '</div>'
      + '<div id="so-list">'+window.salesLoading('Đang tải đơn hàng...')+'</div>'
      + '</div>';
  }

  /* ── Dashboard KPIs ───────────────────────────────────────── */
  function _loadDashboard() {
    var apiF = _api(); if (!apiF) return;
    var now  = new Date();
    apiF('sales_get_dashboard', { month:now.getMonth()+1, year:now.getFullYear() }, function(e,d) {
      var el = document.getElementById('so-kpi-row'); if (!el||e||!d||!d.ok) return;
      var s  = d.stats||{};
      el.innerHTML = [
        kpiCard('📋','Tổng đơn',          s.total_orders||0,     'var(--text2)'),
        kpiCard('💰','Doanh thu',          typeof window.fmtMoney==='function'?window.fmtMoney(s.doanh_thu):s.doanh_thu, 'var(--green)'),
        kpiCard('💳','Chưa thu',           typeof window.fmtMoney==='function'?window.fmtMoney(s.chua_thu):s.chua_thu,   'var(--red)'),
        kpiCard('🚚','Đang giao',          s.dang_giao||0,        'var(--purple)'),
        kpiCard('⏳','Chờ xác nhận',      s.cho_xac_nhan||0,     'var(--yellow)'),
        kpiCard('🎉','Hoàn thành',        s.so_don_hoan_thanh||0,'var(--cyan)')
      ].join('');
    });
  }

  function kpiCard(icon,label,val,col) {
    return '<div class="sk-kpi-card"><div class="sk-kpi-icon">'+icon+'</div>'
      +'<div><div class="sk-kpi-val" style="color:'+col+';">'+_esc(String(val))+'</div>'
      +'<div class="sk-kpi-lbl">'+_esc(label)+'</div></div></div>';
  }

  /* ── Load Orders ──────────────────────────────────────────── */
  var _curStatus = 'all';

  function _soTab(st) {
    _curStatus = st;
    document.querySelectorAll('.sk-tab').forEach(function(b) {
      b.classList.toggle('active', b.id === 'sotab-'+st);
    });
    _loadOrders(st);
  }
  window._soTab = _soTab;

  // [v5.22.1 FIX] Local pagination state — không dùng global STATE
  var _soPage = 1;

  function _loadOrders(status) {
    var el = document.getElementById('so-list'); if (!el) return;
    el.innerHTML = window.salesLoading('Đang tải...');
    var apiF = _api(); if (!apiF) return;
    var params = {
      search    : (_gv('so-search')||'').toLowerCase(),
      from_date : _gv('so-from') || '',
      to_date   : _gv('so-to')   || '',
      limit     : 30,
      page      : _soPage,
    };
    if (status && status !== 'all') params.status = status;
    apiF('sales_get_orders', params, function(e,d) {
      if (e||!d||!d.ok) { el.innerHTML=window.salesEmpty('⚠️','Lỗi tải đơn hàng','Thử lại','_soTab(\'all\')'); return; }
      _orders = d.data || [];
      if (!_orders.length) { el.innerHTML=window.salesEmpty('📭','Chưa có đơn hàng','+ Tạo đơn','_soNewOrder()'); return; }
      _renderOrderList(_orders);
    });
  }

  function _soSearch() {
    clearTimeout(_soSearch._t);
    _soSearch._t = setTimeout(function() { _loadOrders(_curStatus); }, 400);
  }
  window._soSearch = _soSearch;

  function _soRefresh() {
    var apiF = _api(); if (!apiF) return;

    // Step 1: Kiem tra config
    apiF('sapo_get_config', {}, function(e,d) {
      if (!e && d && d.ok && !d.configured) {
        _soShowSapoConfig(d);
        return;
      }

      // Step 2: Test ket noi truoc khi sync
      _toast('Dang kiem tra ket noi Sapo...','ok');
      apiF('sapo_test', {}, function(et, dt) {
        if (et || !dt || !dt.ok) {
          var errMsg = (dt&&dt.error) || 'Ket noi Sapo that bai';
          var guide  = (dt&&dt.guide) || 'Kiem tra SAPO_SHOP va SAPO_TOKEN trong sheet CaiDat';
          _soShowSapoError(errMsg, guide);
          return;
        }

        // Step 3: Sync
        _toast('Dang dong bo Sapo (' + ((dt&&dt.shop_name)||'') + ')...','ok');
        apiF('sapo_sync_all', {}, function(e2,d2) {
          if (e2||!d2||!d2.ok) {
            _soShowSapoError((d2&&d2.error)||'Loi dong bo', (d2&&d2.guide)||'');
            return;
          }
          var msg = d2.msg || ('Da dong bo ' + d2.synced + ' don');
          if (d2.synced === 0) {
            msg += ' - Shop co the chua co don hang hoac filter qua chat';
          }
          _toast(msg + (d2.errors ? ' (' + d2.errors + ' loi)' : ''),'ok');
          _loadOrders(_curStatus);
          _loadDashboard();
        });
      });
    });
  }

  /* Hien loi Sapo voi huong dan */
  function _soShowSapoError(errMsg, guide) {
    var ct = _ct(); if (!ct) return;
    var div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9990;max-width:400px;'
      + 'background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.3);border-radius:14px;'
      + 'padding:16px 18px;box-shadow:0 8px 32px rgba(0,0,0,.4);';
    div.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">'
      + '<div style="font-size:13px;font-weight:800;color:#ff4d6d;">Loi ket noi Sapo</div>'
      + '<button id="sapo-err-close" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px;">x</button>'
      + '</div>'
      + '<div style="font-size:12px;color:var(--text2);margin-bottom:8px;">' + errMsg + '</div>'
      + (guide ? '<div style="font-size:11px;color:var(--text3);background:rgba(0,0,0,.2);border-radius:8px;padding:8px;">' + guide + '</div>' : '')
      + '<button id="sapo-err-debug" style="margin-top:10px;width:100%;background:rgba(255,255,255,.04);border:1px solid var(--border2);border-radius:8px;padding:7px;font-size:11px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Xem chi tiet ket noi</button>';
    document.body.appendChild(div);

    document.getElementById('sapo-err-close').addEventListener('click', function(){ div.parentNode.removeChild(div); });
    document.getElementById('sapo-err-debug').addEventListener('click', function(){
      var apiF = _api(); if (!apiF) return;
      this.textContent = 'Dang kiem tra...';
      var self = this;
      apiF('sapo_status', {}, function(e,d){
        self.textContent = 'Xem chi tiet ket noi';
        if (e||!d) return;
        var dbg = d.debug || {};
        var info = ['SAPO DEBUG:', 'Shop: '+dbg.shop, 'URL: '+dbg.base_url, 'Shop test: '+dbg.shop_test, 'Orders count: '+dbg.orders_count, 'First order: '+dbg.first_order_test].join(String.fromCharCode(10));
        if (dbg.sample_fields) info += String.fromCharCode(10)+'Sample: '+JSON.stringify(dbg.sample_fields);
        alert(info);
      });
    });
  }
  window._soRefresh = _soRefresh;

  function _soShowSapoConfig(info) {
    var html = '<div class="sk-modal-hd">'
      + '<div style="font-size:15px;font-weight:900;">⚙️ Cài đặt kết nối Sapo</div>'
      + '<button class="btn-ghost" onclick="closeSalesModal()" style="padding:6px 10px;">✕</button></div>'
      + '<div class="sk-modal-bd">'
      + '<div style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);border-radius:10px;padding:14px;margin-bottom:16px;">'
      + '<div style="font-size:12px;font-weight:800;color:var(--yellow);margin-bottom:6px;">⚠️ Chưa cấu hình Sapo API</div>'
      + '<div style="font-size:11px;color:var(--text3);">Nhập thông tin từ Admin Sapo → Ứng dụng → Private Apps</div>'
      + '</div>'
      + '<div class="sk-form-grid">'
      + '<div class="sk-form-group sk-form-full"><label class="sk-lbl">Tên shop Sapo (subdomain)</label>'
      + '<input class="form-input" id="sapo-shop" placeholder="vd: sonkhang (trong sonkhang.mysapogo.com)" value="'+((info&&info.shop)||'')+'"></div>'
      + '<div class="sk-form-group sk-form-full"><label class="sk-lbl">Access Token (Private App)</label>'
      + '<input class="form-input" id="sapo-token" type="password" placeholder="shpat_xxxxxxxxxxxx"></div>'
      + '</div></div>'
      + '<div class="sk-modal-ft">'
      + '<button class="btn-ghost" onclick="closeSalesModal()">Hủy</button>'
      + '<button class="btn-ghost" onclick="_sapoTestConn()" style="font-size:12px;">🔍 Test kết nối</button>'
      + '<button class="btn-primary" onclick="_sapoSaveConfig()" style="font-size:12px;">💾 Lưu & Đồng bộ</button>'
      + '</div>';
    _soModal(html);
  }
  window._soShowSapoConfig = _soShowSapoConfig;

  function _soShowSapoConfigGuide(d) {
    var steps = (d.steps||[]).join('</div><div style="padding:5px 0;font-size:11px;">');
    var html = '<div class="sk-modal-hd">'
      + '<div style="font-size:15px;font-weight:900;">⚙️ Hướng dẫn cài đặt Sapo</div>'
      + '<button class="btn-ghost" onclick="closeSalesModal()" style="padding:6px 10px;">✕</button></div>'
      + '<div class="sk-modal-bd">'
      + '<div style="font-size:12px;color:var(--red);margin-bottom:12px;">'+_esc(d.error||'')+'</div>'
      + '<div style="background:var(--bg3);border-radius:10px;padding:14px;">'
      + '<div style="font-size:11px;font-weight:800;color:var(--text3);margin-bottom:8px;">HƯỚNG DẪN:</div>'
      + '<div style="padding:5px 0;font-size:11px;">'+steps+'</div>'
      + '</div>'
      + '<div style="margin-top:16px;" class="sk-form-grid">'
      + '<div class="sk-form-group sk-form-full"><label class="sk-lbl">Tên shop</label>'
      + '<input class="form-input" id="sapo-shop" placeholder="tenShop (không có .mysapogo.com)"></div>'
      + '<div class="sk-form-group sk-form-full"><label class="sk-lbl">Access Token</label>'
      + '<input class="form-input" id="sapo-token" type="password" placeholder="Token từ Sapo Admin"></div>'
      + '</div></div>'
      + '<div class="sk-modal-ft">'
      + '<button class="btn-ghost" onclick="closeSalesModal()">Đóng</button>'
      + '<button class="btn-primary" onclick="_sapoSaveConfig()" style="font-size:12px;">💾 Lưu config</button>'
      + '</div>';
    _soModal(html);
  }

  function _sapoTestConn() {
    var apiF = _api(); if (!apiF) return;
    var shop  = document.getElementById('sapo-shop')  ? document.getElementById('sapo-shop').value  : '';
    var token = document.getElementById('sapo-token') ? document.getElementById('sapo-token').value : '';
    if (!shop||!token) { _toast('Nhập Shop và Token','error'); return; }
    // Luu tam roi test
    apiF('sapo_save_config',{shop:shop,token:token},function(e,d){
      if(e||!d||!d.ok){_toast('Lỗi lưu config','error');return;}
      apiF('sapo_test',{},function(e2,d2){
        if(e2||!d2||!d2.ok){_toast((d2&&d2.error)||'Kết nối thất bại','error');return;}
        _toast('✅ Kết nối thành công: '+( d2.shop_name||'OK' ),'ok');
      });
    });
  }
  window._sapoTestConn = _sapoTestConn;

  function _sapoSaveConfig() {
    var apiF = _api(); if (!apiF) return;
    var shop  = document.getElementById('sapo-shop')  ? document.getElementById('sapo-shop').value  : '';
    var token = document.getElementById('sapo-token') ? document.getElementById('sapo-token').value : '';
    if (!shop||!token) { _toast('Nhập đủ Shop và Token','error'); return; }
    apiF('sapo_save_config',{shop:shop,token:token},function(e,d){
      if(e||!d||!d.ok){_toast((d&&d.error)||'Lỗi','error');return;}
      _toast('✅ Đã lưu config Sapo. Đang đồng bộ...','ok');
      if(typeof window.closeSalesModal==='function') window.closeSalesModal();
      _soRefresh();
    });
  }
  window._sapoSaveConfig = _sapoSaveConfig;

  /* ── Render Order List ────────────────────────────────────── */
  function _renderOrderList(orders) {
    var el = document.getElementById('so-list'); if (!el) return;
    el.innerHTML = '<div class="sk-table-wrap">'
      + '<table class="sk-table">'
      + '<thead><tr>'
      + '<th>Mã đơn</th><th>Khách hàng</th><th>Ngày</th>'
      + '<th>Tổng tiền</th><th>Đã TT</th><th>Còn nợ</th>'
      + '<th>Trạng thái</th><th>Nguồn</th><th style="width:100px;"></th>'
      + '</tr></thead>'
      + '<tbody>'
      + orders.map(function(o) {
          var col   = (window.ORDER_COLORS||{})[o.trang_thai]||'#6b7a99';
          var icon  = (window.ORDER_ICONS||{})[o.trang_thai]||'•';
          var label = STATUS_LABEL[o.trang_thai]||o.trang_thai;
          var conNo = Number(o.con_no||0);
          var sapoIcon = o.sapo_id ? '🔗' : '';
          return '<tr>'
            + '<td><strong style="color:var(--accent2);cursor:pointer;" onclick="_soDetail(\''+_esc(o.id)+'\')">'+_esc(o.ma_don)+'</strong></td>'
            + '<td>'+_esc(o.khach_ten||'—')+'</td>'
            + '<td style="color:var(--text3);font-size:11px;">'+_esc(o.ngay||'')+'</td>'
            + '<td style="font-weight:800;color:var(--text);">'+( typeof window.fmtMoney==='function'?window.fmtMoney(o.tong_tt):o.tong_tt )+'</td>'
            + '<td style="color:var(--green);">'+( typeof window.fmtMoney==='function'?window.fmtMoney(o.da_tt):o.da_tt )+'</td>'
            + '<td style="color:'+(conNo>0?'var(--red)':'var(--text3)')+';">'+(conNo>0?(typeof window.fmtMoney==='function'?window.fmtMoney(conNo):conNo):'—')+'</td>'
            + '<td><span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:800;background:'+col+'22;border:1px solid '+col+'55;color:'+col+';">'+icon+' '+_esc(label)+'</span></td>'
            + '<td style="font-size:11px;color:var(--text3);">'+sapoIcon+(o.sapo_id?'Sapo':'ERP')+'</td>'
            + '<td><div style="display:flex;gap:4px;">'
            +   '<button class="btn-ghost" onclick="_soDetail(\''+_esc(o.id)+'\')" style="padding:5px 8px;font-size:10px;">👁</button>'
            +   (o.trang_thai==='cho_xac_nhan'?'<button class="btn-primary" onclick="_soConfirm(\''+_esc(o.id)+'\')" style="padding:5px 8px;font-size:10px;">✅</button>':'')
            +   (o.trang_thai==='da_xac_nhan'||o.trang_thai==='da_giao'?'<button class="btn-ghost" onclick="_soDelivery(\''+_esc(o.id)+'\')" style="padding:5px 8px;font-size:10px;">🚚</button>':'')
            + '</div></td>'
            + '</tr>';
        }).join('')
      + '</tbody></table></div>';
  }

  /* [v5.25.1 FIX] BUG-2: Helper an toàn — trả null nếu modal đã đóng (race condition) */
  function _getModalBox() {
    return document.querySelector('.sk-modal-box')
        || document.querySelector('#sk-sales-modal > div');
  }

  /* ── Order Detail Modal ───────────────────────────────────── */
  function _soDetail(id) {
    _curOrderId = id;
    window.showSalesModal(window.salesLoading('Đang tải chi tiết...'), 'lg');
    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_order_detail', { id:id }, function(e,d) {
      if (e||!d||!d.ok) {
        // [v5.25.1 FIX] BUG-2: guard null — modal có thể đã đóng trước khi callback return
        var _errBox = _getModalBox();
        if (_errBox) _errBox.innerHTML='<div style="padding:24px;color:var(--red);">Lỗi: '+_esc(String(d&&d.error||e||'Unknown error'))+'</div>';
        return;
      }
      var o = d.order; var items = d.items||[]; var history = d.history||[];
      var col   = (window.ORDER_COLORS||{})[o.trang_thai]||'#6b7a99';
      var label = STATUS_LABEL[o.trang_thai]||o.trang_thai;
      var conNo = Number(o.con_no||0);

      var html = '<div class="sk-modal-hd">'
        + '<div><div style="font-size:16px;font-weight:900;">📋 '+_esc(o.ma_don)+'</div>'
        + '<div style="font-size:11px;color:var(--text3);">'+_esc(o.ngay||'')+'</div></div>'
        + '<div style="display:flex;gap:8px;align-items:center;">'
        + '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:800;background:'+col+'22;border:1px solid '+col+'55;color:'+col+';">'+(window.ORDER_ICONS||{})[o.trang_thai]+' '+_esc(label)+'</span>'
        + '<button class="btn-ghost" onclick="closeSalesModal()" style="padding:6px 10px;font-size:12px;">✕</button>'
        + '</div></div>'
        + '<div class="sk-modal-bd">'

        /* Hành động */
        + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">'
        + _actionBtns(o)
        + '</div>'

        /* Info 2 cột */
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">'
        + '<div class="card" style="padding:14px;">'
        + '<div class="sk-lbl" style="margin-bottom:8px;">Khách hàng</div>'
        + _infoRow('Tên', o.khach_ten) + _infoRow('Địa chỉ GH', o.dia_chi_gh||'—')
        + _infoRow('PT thanh toán', o.pt_tt) + _infoRow('Ghi chú', o.ghi_chu||'—')
        + (o.sapo_id?_infoRow('Sapo ID','#'+o.sapo_id):'')
        + '</div>'
        + '<div class="card" style="padding:14px;">'
        + '<div class="sk-lbl" style="margin-bottom:8px;">Thanh toán</div>'
        + _infoRow('Tổng đơn',   typeof window.fmtMoney==='function'?window.fmtMoney(o.tong_tt):o.tong_tt)
        + _infoRow('Đã thanh toán', typeof window.fmtMoney==='function'?window.fmtMoney(o.da_tt):o.da_tt, 'var(--green)')
        + (conNo>0?_infoRow('Còn nợ',typeof window.fmtMoney==='function'?window.fmtMoney(conNo):conNo,'var(--red)'):'')
        + (conNo>0?'<button class="btn-primary" onclick="_soRecordPayment(\''+_esc(o.id)+'\')" style="margin-top:10px;font-size:11px;width:100%;">💰 Ghi nhận thanh toán</button>':'')
        + '</div>'
        + '</div>'

        /* Sản phẩm */
        + '<div class="card" style="padding:14px;margin-bottom:12px;">'
        + '<div class="sk-lbl" style="margin-bottom:8px;">Sản phẩm</div>'
        + '<div class="sk-table-wrap"><table class="sk-table">'
        + '<thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>CK</th><th>Thành tiền</th></tr></thead>'
        + '<tbody>'+items.map(function(it) {
            return '<tr>'
              +'<td><div style="font-weight:700;">'+_esc(it.ten_sp)+'</div><div style="font-size:10px;color:var(--text3);">'+_esc(it.don_vi||'')+'</div></td>'
              +'<td>'+it.sl+'</td>'
              +'<td>'+(typeof window.fmtMoney==='function'?window.fmtMoney(it.don_gia):it.don_gia)+'</td>'
              +'<td>'+(it.chiet_khau>0?'-'+(typeof window.fmtMoney==='function'?window.fmtMoney(it.chiet_khau):it.chiet_khau):'—')+'</td>'
              +'<td style="font-weight:800;">'+(typeof window.fmtMoney==='function'?window.fmtMoney(it.thanh_tien):it.thanh_tien)+'</td>'
              +'</tr>';
          }).join('')+'</tbody></table></div></div>'

        /* Lịch sử */
        + (history.length?'<div class="card" style="padding:14px;">'
          + '<div class="sk-lbl" style="margin-bottom:8px;">📜 Lịch sử</div>'
          + history.map(function(h) {
              return '<div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--border);font-size:11px;">'
                + '<span style="color:var(--text3);white-space:nowrap;">'+_esc(h.ngay)+'</span>'
                + '<span style="font-weight:700;color:var(--accent2);">'+_esc(h.hanh_dong)+'</span>'
                + (h.moi?'<span style="color:var(--text3);">→ '+_esc(h.moi)+'</span>':'')
                + '<span style="margin-left:auto;color:var(--text3);">'+_esc(h.nguoi)+'</span>'
                + '</div>';
            }).join('')
          +'</div>':'')
        + '</div>';

      // [v5.25.1 FIX] BUG-2: guard null — tránh crash nếu modal đóng trong lúc chờ API
      var _box = _getModalBox();
      if (!_box) return;  // Modal đã bị đóng bởi user → bỏ qua kết quả
      _box.innerHTML = html;
    });
  }
  window._soDetail = _soDetail;

  function _infoRow(label, val, color) {
    return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px;">'
      + '<span style="color:var(--text3);">'+_esc(label)+'</span>'
      + '<span style="font-weight:600;'+(color?'color:'+color+';':'')+' text-align:right;max-width:55%;">'+_esc(String(val||'—'))+'</span></div>';
  }

  function _actionBtns(o) {
    var btns = '';
    if (o.trang_thai==='cho_xac_nhan')
      btns += '<button class="btn-primary" onclick="_soChangeStatus(\''+o.id+'\',\'da_xac_nhan\')" style="font-size:11px;">✅ Xác nhận đơn</button>';
    if (o.trang_thai==='da_xac_nhan'||o.trang_thai==='cho_xac_nhan')
      btns += '<button class="btn-ghost" onclick="_soDelivery(\''+o.id+'\')" style="font-size:11px;">🚚 Tạo lệnh giao</button>';
    if (o.trang_thai==='dang_giao'||o.trang_thai==='da_xac_nhan')
      btns += '<button class="btn-ghost" onclick="_soCreateInvoice(\''+o.id+'\')" style="font-size:11px;">🧾 Xuất hóa đơn VAT</button>';
    if (o.trang_thai!=='huy'&&o.trang_thai!=='hoan_thanh')
      btns += '<button class="btn-ghost" onclick="_soChangeStatus(\''+o.id+'\',\'huy\')" style="font-size:11px;color:var(--red);">❌ Hủy đơn</button>';
    return btns;
  }

  /* ── Tạo đơn hàng mới ─────────────────────────────────────── */
  function _soNewOrder() {
    _cartItems = [];
    _loadOrderForm(null);
  }
  window._soNewOrder = _soNewOrder;

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

  /* Cart */
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
  window._soAddToCart = _soAddToCart;

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
  window._soCartQty    = function(i,v){ if(_cartItems[i]) { _cartItems[i].sl=Number(v)||1; _renderCart(); } };
  window._soCartRemove = function(i){ _cartItems.splice(i,1); _renderCart(); };

  function _soCalcTotal() {
    var sub   = _cartItems.reduce(function(s,it){ return s+it.sl*it.don_gia; },0);
    var phi   = Number(_gv('so-phi-gh')||0);
    var grand = sub + phi;
    var el    = document.getElementById('so-grand');
    if (el) el.textContent = typeof window.fmtMoney==='function'?window.fmtMoney(grand):grand+'đ';
  }
  window._soCalcTotal = _soCalcTotal;

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
  window._soSubmitOrder = _soSubmitOrder;

  /* ── Xác nhận / Hủy đơn ──────────────────────────────────── */
  function _soConfirm(id) {
    window.salesConfirm('Xác nhận đơn hàng này?', function() {
      _soChangeStatus(id,'da_xac_nhan');
    });
  }
  window._soConfirm = _soConfirm;

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
  window._soChangeStatus = _soChangeStatus;

  /* ── Ghi nhận thanh toán ─────────────────────────────────── */
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
  window._soRecordPayment = _soRecordPayment;

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
  window._soDoPayment = _soDoPayment;

  /* ── Tạo lệnh giao hàng ──────────────────────────────────── */
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
  window._soDelivery = _soDelivery;

  function _soDoDelivery(orderId) {
    var apiF = _api(); if (!apiF) return;
    apiF('sales_create_delivery', {
      don_id   : orderId,
      dia_chi  : _gv('del-addr'),
      ngay_giao: _gv('del-date'),
      ghi_chu  : _gv('del-note')
    }, function(e,d) {
      if (e||!d||!d.ok) { _toast((d&&d.error)||'Lỗi','error'); return; }
      _toast('✅ Đã tạo lệnh giao: '+d.id+(d.driver_id?' — Tài xế: '+d.driver_id:''),'ok');
      window.closeSalesModal();
      _loadOrders(_curStatus);
    });
  }
  window._soDoDelivery = _soDoDelivery;

  /* ── Xuất hóa đơn VAT ────────────────────────────────────── */
  function _soCreateInvoice(orderId) {
    var html = '<div class="sk-modal-hd"><div style="font-size:15px;font-weight:900;">🧾 Xuất hóa đơn VAT</div>'
      + '<button class="btn-ghost" onclick="closeSalesModal()" style="padding:6px 10px;">✕</button></div>'
      + '<div class="sk-modal-bd"><div class="sk-form-grid">'
      + '<div class="sk-form-group"><label class="sk-lbl">Thuế suất VAT (%)</label>'
      + '<select class="form-input" id="inv-thue"><option value="10">10%</option><option value="8">8%</option><option value="5">5%</option><option value="0">Miễn thuế</option></select></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">Số hóa đơn (tùy chọn)</label>'
      + '<input class="form-input" id="inv-so" placeholder="Tự động nếu để trống"></div>'
      + '<div class="sk-form-group sk-form-full"><label class="sk-lbl">Địa chỉ khách hàng (trên HD)</label>'
      + '<input class="form-input" id="inv-addr"></div>'
      + '<div class="sk-form-group"><label class="sk-lbl">MST khách hàng</label>'
      + '<input class="form-input" id="inv-mst"></div>'
      + '</div></div>'
      + '<div class="sk-modal-ft"><button class="btn-ghost" onclick="closeSalesModal()">Hủy</button>'
      + '<button class="btn-primary" onclick="_soDoInvoice(\''+_esc(orderId)+'\')" style="font-size:12px;">🧾 Xuất hóa đơn</button></div>';
    window.showSalesModal(html);
  }
  window._soCreateInvoice = _soCreateInvoice;

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
  window._soDoInvoice = _soDoInvoice;

})();
