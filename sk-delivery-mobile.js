// [v5.25] 22/03/2026 — sk-delivery-mobile.js
// Mobile Delivery UI — Tài xế giao hàng (Phase 4)
// Công ty TNHH Thực Phẩm Sơn Khang
// ================================================================
// [DESIGN] Tối ưu màn hình 360-480px, font lớn, touch targets 44px+
// [SECURITY] Tài xế chỉ xem đơn của mình (server-side filter)
// [OFFLINE] Lưu orders vào localStorage khi mất mạng
// ================================================================
(function () {
  'use strict';

  var _api   = function(){ return typeof window.api === 'function' ? window.api : null; };
  var _ct    = function(){ return typeof window.getContent === 'function' ? window.getContent() : document.getElementById('sk-ct'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };
  var _esc   = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var _fmtC  = function(n){ return Number(n||0).toLocaleString('vi-VN')+'₫'; };

  var _orders = [];
  var _current = null;

  // ── CSS Mobile ───────────────────────────────────────────────────
  function _injectMobileCSS() {
    if (document.getElementById('sk-mobile-css')) return;
    var s = document.createElement('style');
    s.id  = 'sk-mobile-css';
    s.textContent = [
      '.mob-wrap{max-width:480px;margin:0 auto;padding:12px;font-family:inherit;}',
      '.mob-header{background:linear-gradient(135deg,var(--accent,#4f6fff),#06d6d6);',
        'border-radius:16px;padding:20px;color:#fff;margin-bottom:16px;text-align:center;}',
      '.mob-header h1{font-size:18px;font-weight:900;margin:0 0 4px;}',
      '.mob-header p{font-size:12px;opacity:.8;margin:0;}',
      '.mob-card{background:var(--bg2,#0d1020);border:1px solid var(--border,#1e293b);',
        'border-radius:14px;padding:16px;margin-bottom:12px;}',
      '.mob-card-header{display:flex;justify-content:space-between;align-items:center;',
        'margin-bottom:12px;}',
      '.mob-order-code{font-size:15px;font-weight:900;color:var(--text,#e2e8f0);}',
      '.mob-badge{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800;}',
      '.mob-badge-green{background:rgba(0,214,143,.2);color:#00d68f;}',
      '.mob-field{margin-bottom:10px;}',
      '.mob-field label{font-size:10px;font-weight:800;color:var(--text3,#64748b);',
        'text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:3px;}',
      '.mob-field p{font-size:14px;color:var(--text,#e2e8f0);margin:0;font-weight:600;}',
      '.mob-btn{width:100%;padding:16px;border:none;border-radius:12px;font-size:15px;',
        'font-weight:900;cursor:pointer;font-family:inherit;transition:all .15s;',
        'margin-bottom:10px;letter-spacing:.02em;}',
      '.mob-btn-primary{background:var(--accent,#4f6fff);color:#fff;}',
      '.mob-btn-primary:active{transform:scale(.97);}',
      '.mob-btn-success{background:#00d68f;color:#000;}',
      '.mob-btn-danger{background:rgba(255,77,109,.2);color:#ff4d6d;',
        'border:1px solid rgba(255,77,109,.3);}',
      '.mob-btn-ghost{background:var(--bg3,#1e293b);color:var(--text2,#94a3b8);',
        'border:1px solid var(--border2,#334155);}',
      '.mob-price{font-size:22px;font-weight:900;color:#00d68f;}',
      '.mob-qr-wrap{text-align:center;padding:16px 0;}',
      '.mob-qr-wrap img{border-radius:12px;border:3px solid var(--border,#1e293b);}',
      '.mob-photo-area{border:2px dashed var(--border2,#334155);border-radius:12px;',
        'padding:20px;text-align:center;cursor:pointer;margin-bottom:10px;}',
      '.mob-photo-preview{width:100%;border-radius:10px;margin-top:10px;}',
      '.mob-list-item{display:flex;justify-content:space-between;align-items:center;',
        'padding:12px 0;border-bottom:1px solid var(--border,#1e293b);}',
      '.mob-list-item:last-child{border-bottom:none;}',
      '.mob-count-badge{background:var(--accent,#4f6fff);color:#fff;',
        'border-radius:99px;padding:2px 8px;font-size:12px;font-weight:800;}',
      '.mob-empty{text-align:center;padding:40px 16px;color:var(--text3,#64748b);}',
      '.mob-empty .icon{font-size:40px;margin-bottom:10px;}',
      '.mob-nav{display:flex;gap:8px;margin-bottom:16px;}',
      '.mob-nav-btn{flex:1;padding:10px;border:none;border-radius:10px;font-size:12px;',
        'font-weight:700;cursor:pointer;font-family:inherit;background:var(--bg3,#1e293b);',
        'color:var(--text2,#94a3b8);}',
      '.mob-nav-btn.active{background:var(--accent,#4f6fff);color:#fff;}',
      '@media(min-width:600px){.mob-wrap{padding:24px;}}',
    ].join('');
    document.head.appendChild(s);
  }

  // ── Main Load ─────────────────────────────────────────────────────
  function loadDeliveryMobile() {
    var ct = _ct(); if (!ct) return;
    _injectMobileCSS();

    // Lấy driver_id từ session
    var session = null;
    try {
      var raw = localStorage.getItem('sk_session_data');
      if (raw) session = JSON.parse(raw);
    } catch(e) {}
    var driverEmail = session && session.email ? session.email : '';
    var driverName  = session && session.name  ? session.name  : 'Tài xế';

    ct.innerHTML = '<div class="mob-wrap fade-in">'
      + '<div class="mob-header">'
        + '<div style="font-size:28px;margin-bottom:8px;">🚚</div>'
        + '<h1>SonKhang Giao Hàng</h1>'
        + '<p>Chào ' + _esc(driverName) + ' · ' + new Date().toLocaleDateString('vi-VN') + '</p>'
      + '</div>'
      + '<div class="mob-nav">'
        + '<button class="mob-nav-btn active" id="mob-tab-orders" onclick="window._mobTab(\'orders\')">📋 Đơn hàng</button>'
        + '<button class="mob-nav-btn" id="mob-tab-done"   onclick="window._mobTab(\'done\')">✅ Đã giao</button>'
      + '</div>'
      + '<div id="mob-content"><div style="text-align:center;padding:30px;color:var(--text3);">Đang tải...</div></div>'
    + '</div>';

    _loadOrders(driverEmail);
  }

  function _loadOrders(driverEmail) {
    var apiF = _api();
    if (!apiF) {
      _renderOrderList([]);
      return;
    }
    apiF('fulfillment_driver_get_orders', { driver_id: driverEmail }, function(e,d) {
      if (!e && d && d.ok) {
        _orders = d.data || [];
        // Cache to localStorage
        try { localStorage.setItem('sk_driver_orders', JSON.stringify(_orders)); } catch(er){}
        _renderOrderList(_orders.filter(function(o){ return true; }));
      } else {
        // Fallback: dùng cache
        try {
          var cached = localStorage.getItem('sk_driver_orders');
          if (cached) _orders = JSON.parse(cached);
        } catch(er){}
        _renderOrderList(_orders);
      }
    });
  }

  function _renderOrderList(orders) {
    var ct = document.getElementById('mob-content');
    if (!ct) return;

    if (!orders || !orders.length) {
      ct.innerHTML = '<div class="mob-empty">'
        + '<div class="icon">📭</div>'
        + '<div style="font-size:14px;font-weight:700;">Không có đơn nào cần giao</div>'
        + '<div style="font-size:12px;margin-top:6px;">Liên hệ điều phối để nhận đơn mới</div>'
      + '</div>';
      return;
    }

    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'
      + '<span style="font-size:13px;font-weight:900;color:var(--text);">Đơn cần giao</span>'
      + '<span class="mob-count-badge">' + orders.length + '</span>'
    + '</div>';

    orders.forEach(function(o) {
      var conLai = Math.max(0, (o.tong_tt||0) - (o.da_tt||0));
      html += '<div class="mob-card" onclick="window._mobOpenOrder(\'' + _esc(o.id) + '\')" style="cursor:pointer;">'
        + '<div class="mob-card-header">'
          + '<span class="mob-order-code">🛒 ' + _esc(o.ma_don || o.id) + '</span>'
          + '<span class="mob-badge mob-badge-green">Đang giao</span>'
        + '</div>'
        + '<div class="mob-field"><label>Khách hàng</label><p>👤 ' + _esc(o.khach_ten) + '</p></div>'
        + '<div class="mob-field"><label>Địa chỉ</label><p>📍 ' + _esc(o.dia_chi) + '</p></div>'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">'
          + '<div><label style="font-size:10px;color:var(--text3);font-weight:800;">CẦN THU</label>'
            + '<div class="mob-price">' + _fmtC(conLai) + '</div></div>'
          + '<button style="background:var(--accent);color:#fff;border:none;border-radius:10px;'
            + 'padding:10px 16px;font-size:13px;font-weight:800;cursor:pointer;"'
            + ' onclick="event.stopPropagation();window._mobOpenOrder(\'' + _esc(o.id) + '\')">Chi tiết ›</button>'
        + '</div>'
      + '</div>';
    });

    ct.innerHTML = html;
  }

  // Mở chi tiết đơn
  function _mobOpenOrder(orderId) {
    var o = _orders.find(function(x){ return x.id === orderId; });
    if (!o) return;
    _current = o;

    var ct = document.getElementById('mob-content');
    if (!ct) return;

    var conLai = Math.max(0, (o.tong_tt||0) - (o.da_tt||0));

    ct.innerHTML = '<div>'
      // Back button
      + '<button class="mob-btn mob-btn-ghost" onclick="window._mobBack()" style="margin-bottom:16px;">'
        + '← Quay lại danh sách</button>'

      // Order info card
      + '<div class="mob-card">'
        + '<div class="mob-card-header">'
          + '<span class="mob-order-code">' + _esc(o.ma_don || o.id) + '</span>'
          + '<span class="mob-badge mob-badge-green">Đang giao</span>'
        + '</div>'
        + '<div class="mob-field"><label>Khách hàng</label><p>' + _esc(o.khach_ten) + '</p></div>'
        + '<div class="mob-field"><label>Địa chỉ giao</label><p>' + _esc(o.dia_chi) + '</p></div>'
        + (o.ghi_chu ? '<div class="mob-field"><label>Ghi chú</label><p style="color:var(--yellow);">' + _esc(o.ghi_chu) + '</p></div>' : '')
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">'
          + '<div><label style="font-size:10px;color:var(--text3);font-weight:800;">TỔNG ĐƠN</label>'
            + '<div style="font-size:18px;font-weight:900;color:var(--text);">' + _fmtC(o.tong_tt) + '</div></div>'
          + '<div><label style="font-size:10px;color:var(--text3);font-weight:800;">CẦN THU</label>'
            + '<div class="mob-price" style="font-size:18px;">' + _fmtC(conLai) + '</div></div>'
        + '</div>'
      + '</div>'

      // QR Payment
      + (conLai > 0 ? '<div class="mob-card">'
        + '<div style="font-size:13px;font-weight:800;margin-bottom:10px;">💳 Thanh toán</div>'
        + '<div style="display:flex;gap:8px;margin-bottom:12px;">'
          + '<button id="mob-pay-cash" class="mob-btn mob-btn-ghost" style="flex:1;padding:10px;"'
            + ' onclick="window._mobPayMethod(\'cash\')">💵 Tiền mặt</button>'
          + '<button id="mob-pay-qr" class="mob-btn mob-btn-ghost" style="flex:1;padding:10px;"'
            + ' onclick="window._mobPayMethod(\'qr\')">📱 QR Code</button>'
        + '</div>'
        + '<div id="mob-qr-section" style="display:none;">'
          + '<div class="mob-qr-wrap">'
            + '<img id="mob-qr-img" src="" width="200" height="200" style="display:none;" alt="QR"/>'
            + '<div id="mob-qr-loading" style="color:var(--text3);padding:20px;">Đang tạo QR...</div>'
          + '</div>'
        + '</div>'
      + '</div>' : '')

      // Photo proof
      + '<div class="mob-card">'
        + '<div style="font-size:13px;font-weight:800;margin-bottom:10px;">📸 Ảnh bằng chứng</div>'
        + '<div class="mob-photo-area" id="mob-photo-area" onclick="document.getElementById(\'mob-photo-input\').click()">'
          + '<div style="font-size:32px;margin-bottom:8px;">📷</div>'
          + '<div style="font-size:13px;color:var(--text2);">Chụp ảnh giao hàng</div>'
          + '<div style="font-size:11px;color:var(--text3);margin-top:4px;">Bằng chứng giao hàng thành công</div>'
        + '</div>'
        + '<input type="file" id="mob-photo-input" accept="image/*" capture="environment"'
          + ' style="display:none;" onchange="window._mobPhotoChange(this)"/>'
        + '<img id="mob-photo-preview" class="mob-photo-preview" style="display:none;" src="" alt="Preview"/>'
      + '</div>'

      // Action buttons
      + '<div id="mob-actions">'
        + '<button class="mob-btn mob-btn-success" id="mob-btn-confirm"'
          + ' onclick="window._mobConfirmDelivery()">'
          + '✅ Xác nhận giao thành công</button>'
        + '<a href="tel:" id="mob-call-btn" class="mob-btn mob-btn-ghost"'
          + ' style="display:block;text-align:center;text-decoration:none;">📞 Gọi cho khách</a>'
        + (o.lat && o.lng
          ? '<a href="https://maps.google.com?q=' + o.lat + ',' + o.lng + '" target="_blank"'
            + ' class="mob-btn mob-btn-ghost" style="display:block;text-align:center;text-decoration:none;">🗺️ Mở Google Maps</a>'
          : '<a href="https://maps.google.com?q=' + encodeURIComponent(o.dia_chi||'') + '" target="_blank"'
            + ' class="mob-btn mob-btn-ghost" style="display:block;text-align:center;text-decoration:none;">🗺️ Mở Google Maps</a>')
      + '</div>'
    + '</div>';
  }

  function _mobPayMethod(method) {
    var o = _current; if (!o) return;
    var qrSection = document.getElementById('mob-qr-section');
    if (method === 'qr' && qrSection) {
      qrSection.style.display = 'block';
      // Load QR
      var apiF = _api();
      if (apiF) {
        apiF('fulfillment_get_qr', { id: o.id }, function(e,d) {
          var img     = document.getElementById('mob-qr-img');
          var loading = document.getElementById('mob-qr-loading');
          if (!e && d && d.ok) {
            if (img) { img.src = d.qr_url; img.style.display='block'; }
            if (loading) loading.style.display = 'none';
          }
        });
      }
    } else if (qrSection) {
      qrSection.style.display = 'none';
    }
    // Update button styles
    ['mob-pay-cash','mob-pay-qr'].forEach(function(id) {
      var btn = document.getElementById(id);
      if (btn) btn.style.background = 'var(--bg3)';
    });
    var activeBtn = document.getElementById(method === 'cash' ? 'mob-pay-cash' : 'mob-pay-qr');
    if (activeBtn) activeBtn.style.background = 'var(--accent)';
  }

  var _photoB64 = '';
  function _mobPhotoChange(input) {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      _photoB64 = ev.target.result;
      var preview = document.getElementById('mob-photo-preview');
      if (preview) { preview.src = _photoB64; preview.style.display = 'block'; }
      var area = document.getElementById('mob-photo-area');
      if (area) area.style.borderColor = '#00d68f';
    };
    reader.readAsDataURL(file);
  }

  function _mobConfirmDelivery() {
    var o = _current; if (!o) return;
    var btn = document.getElementById('mob-btn-confirm');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = '⏳ Đang xử lý...';

    var apiF = _api();
    if (!apiF) {
      btn.disabled = false;
      btn.textContent = '✅ Xác nhận giao thành công';
      _toast('API không sẵn sàng', 'error');
      return;
    }

    apiF('fulfillment_driver_confirm', {
      id          : o.id,
      photo_b64   : _photoB64,
      collect_cash: true,
      pt          : 'tien_mat',
    }, function(e, d) {
      btn.disabled = false;
      if (!e && d && d.ok) {
        _toast('🎉 Giao hàng thành công!', 'ok');
        // Xóa khỏi danh sách
        _orders = _orders.filter(function(x){ return x.id !== o.id; });
        try { localStorage.setItem('sk_driver_orders', JSON.stringify(_orders)); } catch(er){}
        _current = null;
        _photoB64 = '';
        setTimeout(function() { _renderOrderList(_orders); }, 1200);
      } else {
        btn.textContent = '✅ Xác nhận giao thành công';
        _toast((d && d.error) || 'Lỗi xác nhận', 'error');
      }
    });
  }

  function _mobBack() {
    _current   = null;
    _photoB64  = '';
    _renderOrderList(_orders);
  }

  window._mobTab = function(tab) {
    ['orders','done'].forEach(function(t) {
      var btn = document.getElementById('mob-tab-' + t);
      if (btn) btn.className = 'mob-nav-btn' + (t === tab ? ' active' : '');
    });
    if (tab === 'orders') {
      _renderOrderList(_orders.filter(function(){ return true; }));
    } else {
      var ct = document.getElementById('mob-content');
      if (ct) ct.innerHTML = '<div class="mob-empty"><div class="icon">✅</div>'
        + '<div>Chức năng đang phát triển</div></div>';
    }
  };
  window._mobOpenOrder      = _mobOpenOrder;
  window._mobBack           = _mobBack;
  window._mobConfirmDelivery = _mobConfirmDelivery;
  window._mobPayMethod      = _mobPayMethod;
  window._mobPhotoChange    = _mobPhotoChange;

  window.loadDeliveryMobile  = loadDeliveryMobile;
  window.loadGiaoHangMobile  = loadDeliveryMobile;
  window.loadMobileDelivery  = loadDeliveryMobile;

}());
