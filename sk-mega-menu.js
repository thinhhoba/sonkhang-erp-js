/* ================================================================
 * sk-mega-menu.js — SonKhang ERP v5.0
 * Mega Menu + Quick Search Ctrl+K + Command Palette + Breadcrumb
 * Design System: DataTable, SKChart, Notification, Print
 * 21/03/2026
 *
 * LỖI ĐÃ BIẾT - TRÁNH:
 *   - Không dùng tiếng Việt có dấu trong tên hàm/biến
 *   - Không build HTML string có event attr chứa variable → dùng DOM API
 *   - Modal self-contained, không phụ thuộc file khác
 * ================================================================ */
(function () {
  'use strict';

  /* ── Menu data — toàn bộ modules ─────────────────────────────── */
  var MENU = [
    {
      id: 'ban-hang', label: 'Ban hang', icon: '&#x1F6D2;', color: '#4f6fff',
      items: [
        { id:'don-hang',    icon:'&#x1F4CB;', label:'Don hang',     desc:'Tao don · 9 trang thai · Sapo sync', done:true  },
        { id:'bang-gia',    icon:'&#x1F4B2;', label:'Bang gia SP',  desc:'San pham · gia le/si/goc · ton kho', done:true  },
        { id:'chiet-khau',  icon:'&#x1F3F7;', label:'Chiet khau KM',desc:'Giam %, VND · nhom KH · thoi gian',  done:true  },
        { id:'tinh-gia',    icon:'&#x1F9EE;', label:'Tinh gia ban', desc:'Margin · VAT · gia si/le · CK',      done:true  },
        { id:'khach-hang',  icon:'&#x1F465;', label:'Khach hang CRM',desc:'Thong tin · lich su · no cuoi',     done:true  },
        { id:'giao-hang',   icon:'&#x1F69A;', label:'Giao hang',    desc:'Lenh giao · tai xe · xe tu dong',    done:true  },
        { id:'hoa-don-vat', icon:'&#x1F9FE;', label:'Hoa don VAT',  desc:'Xuat HD · thue · hach toan kep',     done:true  },
        { id:'tra-hang',    icon:'&#x21A9;',  label:'Tra hang RMA', desc:'Yeu cau · kiem hang · hoan tien',    done:true  },
        { id:'bao-cao-bh',  icon:'&#x1F4CA;', label:'Bao cao BH',   desc:'Doanh thu · SP ban chay · hoa hong', done:true  }
      ]
    },
    {
      id: 'mua-hang', label: 'Mua hang', icon: '&#x1F4E6;', color: '#06d6d6',
      items: [
        { id:'mua-hang', icon:'&#x1F3ED;', label:'Nha cung cap',   desc:'Thong tin · nhom · han muc',         done:false },
        { id:'mua-hang', icon:'&#x1F4C4;', label:'Don dat hang PO', desc:'Duyet · email NCC',                  done:false },
        { id:'mua-hang', icon:'&#x1F4E5;', label:'Nhap kho',        desc:'Tu PO · cap nhat ton kho',           done:false }
      ]
    },
    {
      id: 'kho-van', label: 'Kho van', icon: '&#x1F3ED;', color: '#fbbf24',
      items: [
        { id:'phuong-tien', icon:'&#x1F69B;', label:'Phuong tien',  desc:'Registry · dieu phoi · xang',       done:true  },
        { id:'kho-hang',    icon:'&#x1F4CA;', label:'Ton kho',       desc:'So luong · lo hang · canh bao',     done:false },
        { id:'kho-hang',    icon:'&#x1F4E4;', label:'Xuat kho',      desc:'Phieu xuat · tru ton',              done:false }
      ]
    },
    {
      id: 'nhan-su', label: 'Nhan su', icon: '&#x1F454;', color: '#00d68f',
      items: [
        { id:'nhan-su',      icon:'&#x1F464;', label:'Ho so NV',    desc:'Thong tin · hop dong · tai lieu',    done:true  },
        { id:'cham-cong-v2', icon:'&#x23F0;',  label:'Cham cong',   desc:'Ca sang/chieu · OT · nghi phep',    done:true  },
        { id:'bang-luong',   icon:'&#x1F4B5;', label:'Bang luong',  desc:'Tinh luong · phu cap · phieu',      done:true  },
        { id:'kpi',          icon:'&#x1F3AF;', label:'KPI',         desc:'Muc tieu · ket qua · xu huong',     done:true  },
        { id:'tuyen-dung',   icon:'&#x1F50D;', label:'Tuyen dung',  desc:'Pipeline Kanban · ung vien',         done:true  },
        { id:'portal',       icon:'&#x1F4E2;', label:'Cong noi bo', desc:'Thong bao · hoi dap',               done:true  },
        { id:'workflow',     icon:'&#x2705;',  label:'Quy trinh',   desc:'De xuat · phe duyet · lich su',     done:true  },
        { id:'bao-cao-ns',   icon:'&#x1F4CB;', label:'Bao cao NS',  desc:'Nhan su · bieu do · tong hop',      done:true  }
      ]
    },
    {
      id: 'tai-chinh', label: 'Tai chinh', icon: '&#x1F4B0;', color: '#ff4d6d',
      items: [
        { id:'hoa-don-vat', icon:'&#x1F9FE;', label:'Hoa don VAT',  desc:'Xuat HD · hach toan 131/511/3331',  done:true  },
        { id:'ke-toan',     icon:'&#x1F4D2;', label:'So quy',       desc:'Thu chi · so du dau/cuoi',           done:false },
        { id:'ke-toan',     icon:'&#x1F517;', label:'Cong no',      desc:'KH · NCC · han thanh toan',          done:false }
      ]
    },
    {
      id: 'quan-tri', label: 'Quan tri', icon: '&#x2699;', color: '#a78bfa',
      items: [
        { id:'admin-panel',      icon:'&#x1F511;', label:'Phan quyen',    desc:'Users · roles · RBAC',        admin:true  },
        { id:'link-user-nv',     icon:'&#x1F517;', label:'Link User-NV',  desc:'Lien ket tai khoan · NV',     admin:true  },
        { id:'account-settings', icon:'&#x1F464;', label:'Cai dat TK',    desc:'Mat khau · thong tin ca nhan',admin:false },
        { id:'ca-nhan',          icon:'&#x1F4CB;', label:'Ho so ca nhan', desc:'Xem luong · CC · KPI',        admin:false }
      ]
    }
  ];

  /* ── Search index ─────────────────────────────────────────────── */
  var SEARCH_INDEX = [];
  MENU.forEach(function(group) {
    group.items.forEach(function(item) {
      SEARCH_INDEX.push({
        id: item.id, group: group.label, groupId: group.id,
        label: item.label, desc: item.desc, icon: item.icon,
        keywords: (item.label + ' ' + item.desc + ' ' + group.label).toLowerCase()
      });
    });
  });
  // Thêm NV, phiếu... vào index để search thực
  var DYNAMIC_RESULTS = [];

  /* ── State ────────────────────────────────────────────────────── */
  var _activeMenu   = null;
  var _searchOpen   = false;
  var _cmdIdx       = 0;
  var _cmdResults   = [];
  var _notifications = [
    { id:1, type:'order',    text:'Đơn hàng mới từ Sapo #SO0231', time:'2 phút', read:false },
    { id:2, type:'leave',    text:'Nguyễn Văn A xin nghỉ phép ngày 25/03', time:'15 phút', read:false },
    { id:3, type:'vehicle',  text:'Xe 51G-12345 đã hoàn thành chuyến', time:'1 giờ', read:true },
    { id:4, type:'payroll',  text:'Bảng lương tháng 3 chờ duyệt', time:'2 giờ', read:true }
  ];

  /* ================================================================
   * 1. MEGA MENU — inject HTML vào DOM
   * ================================================================ */
  function buildMegaMenu() {
    if (document.getElementById('sk-mega-nav')) return;

    var nav = document.createElement('nav');
    nav.id = 'sk-mega-nav';
    nav.setAttribute('role', 'navigation');

    // Logo + brand
    var brand = '<div class="mmn-brand" onclick="skLoad(\'dashboard\')">'
      + '<div class="mmn-logo">SK</div>'
      + '<div class="mmn-brand-text"><span class="mmn-title">SonKhang ERP</span>'
      + '<span class="mmn-version">v5.0</span></div>'
      + '</div>';

    // Menu items
    var menuHtml = '<div class="mmn-items" id="mmn-items">';
    MENU.forEach(function(group) {
      var dot = '<span class="mmn-dot" style="background:' + group.color + '"></span>';
      menuHtml += '<div class="mmn-group" id="mmg-' + group.id + '" data-id="' + group.id + '">'
        + '<button class="mmn-btn" type="button">'
        + dot + group.icon + ' ' + group.label
        + '<svg class="mmn-caret" viewBox="0 0 10 6" width="10" height="6"><path d="M0 0l5 6 5-6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'
        + '</button>'
        + '<div class="mmn-dropdown" id="mmd-' + group.id + '">'
        + buildDropdown(group)
        + '</div>'
        + '</div>';
    });
    menuHtml += '</div>';

    // Right side: search + bell + user
    var right = '<div class="mmn-right">'
      // Search button
      + '<button class="mmn-icon-btn" id="mmn-search-btn" title="Tìm kiếm (Ctrl+K)">'
      + '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l-3-3"/></svg>'
      + '<span class="mmn-kbd">⌘K</span>'
      + '</button>'
      // Bell
      + '<button class="mmn-icon-btn" id="mmn-bell-btn" title="Thông báo">'
      + '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2a6 6 0 00-6 6v3l-2 2v1h16v-1l-2-2V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z"/></svg>'
      + '<span class="mmn-badge-dot" id="mmn-bell-count" style="display:none">0</span>'
      + '</button>'
      // Bell dropdown
      + '<div class="mmn-bell-panel" id="mmn-bell-panel">'
      + buildBellPanel()
      + '</div>'
      // User avatar
      + '<button class="mmn-user-btn" id="mmn-user-btn" onclick="skLoad(\'ca-nhan\')">'
      + '<div class="mmn-avatar" id="mmn-avatar">?</div>'
      + '<span class="mmn-username" id="mmn-uname">...</span>'
      + '</button>'
      + '</div>';

    nav.innerHTML = brand + menuHtml + right;

    // Breadcrumb bar
    var bc = document.createElement('div');
    bc.id = 'sk-breadcrumb';
    bc.innerHTML = '<span class="bc-item bc-home" onclick="skLoad(\'dashboard\')">🏠 Trang chủ</span>';

    // Quick Search overlay
    var qs = document.createElement('div');
    qs.id = 'sk-quick-search';
    qs.innerHTML = '<div class="qs-backdrop" id="qs-backdrop"></div>'
      + '<div class="qs-panel">'
      + '<div class="qs-header">'
      + '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l-3-3"/></svg>'
      + '<input class="qs-input" id="qs-input" placeholder="Tìm module, đơn hàng, nhân viên..." autocomplete="off"/>'
      + '<kbd class="qs-esc">Esc</kbd>'
      + '</div>'
      + '<div class="qs-results" id="qs-results"></div>'
      + '<div class="qs-footer">'
      + '<span><kbd>↑↓</kbd> di chuyển</span>'
      + '<span><kbd>Enter</kbd> chọn</span>'
      + '<span><kbd>Esc</kbd> đóng</span>'
      + '</div>'
      + '</div>';

    // Notification center
    var nc = document.createElement('div');
    nc.id = 'sk-notify-center';

    // Insert into DOM - trước sidebar/main-content
    var body = document.body;
    var first = body.firstChild;
    body.insertBefore(nc, first);
    body.insertBefore(qs, first);
    body.insertBefore(bc, first);
    body.insertBefore(nav, first);

    // Bind events
    _bindMenuEvents();
    _bindSearchEvents();
    _bindBellEvents();
    _updateBellBadge();
  }

  function buildDropdown(group) {
    var html = '<div class="mmd-inner">';
    group.items.forEach(function(item) {
      var statusDot = item.done
        ? '<span class="mmd-status done" title="Hoàn thành">✓</span>'
        : '<span class="mmd-status todo" title="Đang phát triển">○</span>';
      html += '<div class="mmd-item" data-page="' + item.id + '">'
        + '<div class="mmd-icon">' + (item.icon || '◆') + '</div>'
        + '<div class="mmd-info">'
        + '<div class="mmd-label">' + item.label + statusDot + '</div>'
        + '<div class="mmd-desc">' + item.desc + '</div>'
        + '</div>'
        + '</div>';
    });
    html += '</div>';
    return html;
  }

  function buildBellPanel() {
    var unread = _notifications.filter(function(n){ return !n.read; }).length;
    var html = '<div class="bell-header">'
      + '<span class="bell-title">Thông báo</span>'
      + (unread ? '<span class="bell-unread">' + unread + ' mới</span>' : '')
      + '</div><div class="bell-list">';
    _notifications.forEach(function(n) {
      var icons = { order:'🛒', leave:'📅', vehicle:'🚛', payroll:'💵' };
      html += '<div class="bell-item' + (n.read ? '' : ' unread') + '" data-id="' + n.id + '">'
        + '<span class="bell-icon">' + (icons[n.type] || '🔔') + '</span>'
        + '<div class="bell-body">'
        + '<div class="bell-text">' + n.text + '</div>'
        + '<div class="bell-time">' + n.time + ' trước</div>'
        + '</div>'
        + (n.read ? '' : '<span class="bell-dot"></span>')
        + '</div>';
    });
    html += '</div><button class="bell-all" onclick="_skMarkAllRead()">Đánh dấu tất cả đã đọc</button>';
    return html;
  }

  /* ── Bind menu dropdown events ───────────────────────────────── */
  function _bindMenuEvents() {
    var groups = document.querySelectorAll('.mmn-group');
    groups.forEach(function(g) {
      var btn  = g.querySelector('.mmn-btn');
      var drop = g.querySelector('.mmn-dropdown');

      var _closeTimer = null;

      // Hover on desktop — delay đóng để chuột kịp vào dropdown
      g.addEventListener('mouseenter', function() {
        if (_closeTimer) { clearTimeout(_closeTimer); _closeTimer = null; }
        _closeAllDropdowns();
        drop.classList.add('open');
        g.classList.add('active');
        _activeMenu = g.getAttribute('data-id');
      });
      drop.addEventListener('mouseenter', function() {
        if (_closeTimer) { clearTimeout(_closeTimer); _closeTimer = null; }
      });
      g.addEventListener('mouseleave', function() {
        _closeTimer = setTimeout(function() {
          drop.classList.remove('open');
          g.classList.remove('active');
          if (_activeMenu === g.getAttribute('data-id')) _activeMenu = null;
        }, 220); /* 220ms delay — đủ để chuột di chuyển vào dropdown */
      });
      drop.addEventListener('mouseleave', function() {
        _closeTimer = setTimeout(function() {
          drop.classList.remove('open');
          g.classList.remove('active');
          _activeMenu = null;
        }, 120);
      });

      // Click on mobile
      if (btn) btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = drop.classList.contains('open');
        _closeAllDropdowns();
        if (!isOpen) { drop.classList.add('open'); g.classList.add('active'); }
      });
    });

    // Dropdown items → skLoad
    document.querySelectorAll('.mmd-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var page = el.getAttribute('data-page');
        if (page) {
          _closeAllDropdowns();
          skLoad(page);
        }
      });
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#sk-mega-nav')) _closeAllDropdowns();
    });
  }

  function _closeAllDropdowns() {
    document.querySelectorAll('.mmn-dropdown.open').forEach(function(d) { d.classList.remove('open'); });
    document.querySelectorAll('.mmn-group.active').forEach(function(g) { g.classList.remove('active'); });
    _activeMenu = null;
  }

  /* ================================================================
   * 2. QUICK SEARCH + COMMAND PALETTE (Ctrl+K)
   * ================================================================ */
  function _bindSearchEvents() {
    var btn     = document.getElementById('mmn-search-btn');
    var panel   = document.getElementById('sk-quick-search');
    var backdrop= document.getElementById('qs-backdrop');
    var input   = document.getElementById('qs-input');
    var results = document.getElementById('qs-results');

    if (btn)      btn.addEventListener('click', openSearch);
    if (backdrop) backdrop.addEventListener('click', closeSearch);

    // Ctrl+K / Cmd+K
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (_searchOpen) closeSearch(); else openSearch();
        return;
      }
      if (e.key === 'Escape' && _searchOpen) { closeSearch(); return; }
      if (!_searchOpen) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); _moveCmdIdx(1); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); _moveCmdIdx(-1); }
      if (e.key === 'Enter')     { e.preventDefault(); _selectCmd(); }
    });

    if (input) {
      input.addEventListener('input', function() {
        _renderSearchResults(input.value);
      });
    }

    // Close Esc btn
    var escBtn = panel ? panel.querySelector('.qs-esc') : null;
    if (escBtn) escBtn.addEventListener('click', closeSearch);
  }

  function openSearch() {
    _searchOpen = true;
    var panel = document.getElementById('sk-quick-search');
    var input = document.getElementById('qs-input');
    if (panel) panel.classList.add('open');
    if (input) { input.value = ''; input.focus(); }
    _renderSearchResults('');
  }
  window._skOpenSearch = openSearch;

  function closeSearch() {
    _searchOpen = false;
    var panel = document.getElementById('sk-quick-search');
    if (panel) panel.classList.remove('open');
  }

  function _renderSearchResults(q) {
    var results = document.getElementById('qs-results');
    if (!results) return;
    var ql = q.toLowerCase().trim();

    var filtered = ql
      ? SEARCH_INDEX.filter(function(item) { return item.keywords.indexOf(ql) >= 0; })
      : SEARCH_INDEX.slice(0, 12);

    if (!filtered.length) {
      results.innerHTML = '<div class="qs-empty">Không tìm thấy "' + _esc(q) + '"</div>';
      return;
    }

    _cmdResults = filtered;
    _cmdIdx = 0;
    var html = '';
    filtered.forEach(function(item, i) {
      html += '<div class="qs-item' + (i === 0 ? ' selected' : '') + '" data-idx="' + i + '" data-page="' + item.id + '">'
        + '<span class="qs-item-icon">' + item.icon + '</span>'
        + '<div class="qs-item-body">'
        + '<div class="qs-item-label">' + _highlight(item.label, q) + '</div>'
        + '<div class="qs-item-meta">' + item.group + ' · ' + item.desc + '</div>'
        + '</div>'
        + '<kbd class="qs-item-enter">↵</kbd>'
        + '</div>';
    });

    results.innerHTML = html;
    results.querySelectorAll('.qs-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var page = el.getAttribute('data-page');
        if (page) { closeSearch(); skLoad(page); }
      });
      el.addEventListener('mouseenter', function() {
        var idx = parseInt(el.getAttribute('data-idx'));
        _cmdIdx = idx;
        _highlightCmd();
      });
    });
  }

  function _moveCmdIdx(dir) {
    _cmdIdx = Math.max(0, Math.min(_cmdResults.length - 1, _cmdIdx + dir));
    _highlightCmd();
    // Scroll into view
    var el = document.querySelector('.qs-item[data-idx="' + _cmdIdx + '"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  function _highlightCmd() {
    document.querySelectorAll('.qs-item').forEach(function(el, i) {
      el.classList.toggle('selected', parseInt(el.getAttribute('data-idx')) === _cmdIdx);
    });
  }

  function _selectCmd() {
    var item = _cmdResults[_cmdIdx];
    if (item) { closeSearch(); skLoad(item.id); }
  }

  /* ================================================================
   * 3. BREADCRUMB — cập nhật khi load module
   * ================================================================ */
  var _breadcrumbMap = {};
  MENU.forEach(function(g) {
    g.items.forEach(function(item) {
      if (!_breadcrumbMap[item.id]) {
        _breadcrumbMap[item.id] = { group: g.label, label: item.label, icon: item.icon };
      }
    });
  });

  function updateBreadcrumb(page) {
    var bc = document.getElementById('sk-breadcrumb');
    if (!bc) return;
    var info = _breadcrumbMap[page];
    if (!info) {
      bc.innerHTML = '<span class="bc-item bc-home" onclick="skLoad(\'dashboard\')">🏠 Trang chủ</span>';
      return;
    }
    bc.innerHTML = '<span class="bc-item bc-home" onclick="skLoad(\'dashboard\')">🏠 Trang chủ</span>'
      + '<span class="bc-sep">›</span>'
      + '<span class="bc-item bc-group">' + info.group + '</span>'
      + '<span class="bc-sep">›</span>'
      + '<span class="bc-item bc-current">' + info.icon + ' ' + info.label + '</span>';

    // Cập nhật URL hash
    try {
      history.replaceState(null, '', window.location.pathname + '#' + page);
    } catch(e) {}
  }
  window.skUpdateBreadcrumb = updateBreadcrumb;

  function _updateActiveMenu(page) {
    // Highlight đúng group trong mega menu
    document.querySelectorAll('.mmn-group').forEach(function(g) {
      g.classList.remove('current');
    });
    MENU.forEach(function(group) {
      var hasPage = group.items.some(function(item) { return item.id === page; });
      if (hasPage) {
        var el = document.getElementById('mmg-' + group.id);
        if (el) el.classList.add('current');
      }
    });
  }

  /* ================================================================
   * 4. NOTIFICATION BELL
   * ================================================================ */
  function _bindBellEvents() {
    var btn   = document.getElementById('mmn-bell-btn');
    var panel = document.getElementById('mmn-bell-panel');
    if (!btn || !panel) return;

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#mmn-bell-btn') && !e.target.closest('#mmn-bell-panel')) {
        panel.classList.remove('open');
      }
    });

    // Bell items click
    panel.querySelectorAll('.bell-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var id = parseInt(el.getAttribute('data-id'));
        var n  = _notifications.find(function(x){ return x.id === id; });
        if (n) { n.read = true; _refreshBellPanel(); }
      });
    });
  }

  function _updateBellBadge() {
    var count = _notifications.filter(function(n){ return !n.read; }).length;
    var dot   = document.getElementById('mmn-bell-count');
    if (dot) {
      dot.textContent = count;
      dot.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  function _refreshBellPanel() {
    var panel = document.getElementById('mmn-bell-panel');
    if (!panel) return;
    panel.innerHTML = buildBellPanel();
    _updateBellBadge();
    _bindBellEvents();
  }

  window._skMarkAllRead = function() {
    _notifications.forEach(function(n){ n.read = true; });
    _refreshBellPanel();
  };

  // API: thêm notification từ bên ngoài
  window.skNotify = function(text, type) {
    _notifications.unshift({ id:Date.now(), type:type||'info', text:text, time:'vừa xong', read:false });
    _updateBellBadge();
    _showToast(text);
  };

  function _showToast(msg) {
    var t = document.getElementById('sk-toast');
    var m = document.getElementById('sk-toast-msg');
    if (!t || !m) return;
    m.textContent = msg;
    t.classList.add('show');
    clearTimeout(_showToast._t);
    _showToast._t = setTimeout(function() { t.classList.remove('show'); }, 3000);
  }

  /* ================================================================
   * 5. HOOK skLoad — polling pattern (không race với DOMContentLoaded)
   * ================================================================ */
  var _skLoadHooked = false;
  function _hookSkLoad() {
    if (_skLoadHooked || typeof window.skLoad !== 'function') return;
    _skLoadHooked = true;
    var _orig = window.skLoad;
    window.skLoad = function(page, navEl) {
      _orig(page, navEl);
      updateBreadcrumb(page);
      _updateActiveMenu(page);
      var info = _breadcrumbMap[page];
      if (info) document.title = info.label + ' · SonKhang ERP';
      document.querySelectorAll('.bn-item').forEach(function(b) {
        b.classList.toggle('active', b.id === 'bn-' + page);
      });
    };
  }
  _hookSkLoad();
  setTimeout(_hookSkLoad, 400);
  setTimeout(_hookSkLoad, 1200);

  /* ================================================================
   * 6. SYNC USER INFO từ skUpdateUser
   * ================================================================ */
  var _origSkUpdateUser = window.skUpdateUser;
  window.skUpdateUser = function(user) {
    if (_origSkUpdateUser) _origSkUpdateUser(user);
    var av = document.getElementById('mmn-avatar');
    var nm = document.getElementById('mmn-uname');
    if (user && user.name) {
      var parts = (user.name || '').trim().split(/\s+/);
      var ini = parts.length >= 2 ? parts[0][0] + parts[parts.length-1][0] : (user.name[0] || '?');
      if (av) av.textContent = ini.toUpperCase();
      if (nm) nm.textContent = parts[0] || '';
    }
  };

  /* ================================================================
   * 6. MOBILE BOTTOM NAV
   * ================================================================ */
  function buildBottomNav() {
    if (document.getElementById('sk-bottom-nav')) return;
    var nav = document.createElement('nav');
    nav.id = 'sk-bottom-nav';

    var items = [
      { id:'dashboard',    icon:'⊞', label:'Dashboard' },
      { id:'don-hang',     icon:'🛒', label:'Đơn hàng'  },
      { id:'nhan-su',      icon:'👔', label:'Nhân sự'   },
      { id:'phuong-tien',  icon:'🚛', label:'Kho vận'   },
      { id:'ca-nhan',      icon:'👤', label:'Cá nhân'   }
    ];

    items.forEach(function(item) {
      var btn = document.createElement('button');
      btn.className = 'bn-item';
      btn.id = 'bn-' + item.id;
      btn.innerHTML = '<span class="bn-icon">' + item.icon + '</span>'
                    + '<span class="bn-label">' + item.label + '</span>';
      btn.addEventListener('click', function() { skLoad(item.id); });
      nav.appendChild(btn);
    });

    document.body.appendChild(nav);
  }

  /* ================================================================
   * 7. DESIGN SYSTEM — DataTable
   * ================================================================ */
  window.SKTable = function(config) {
    // config: { el, data, columns, sortable, filterable, exportable }
    var el      = typeof config.el === 'string' ? document.getElementById(config.el) : config.el;
    var data    = config.data || [];
    var columns = config.columns || [];
    var _sort   = { col: null, dir: 1 };
    var _filter = '';
    var _page   = 1;
    var _perPage= config.perPage || 20;

    function render() {
      if (!el) return;
      var filtered = data.filter(function(row) {
        if (!_filter) return true;
        return columns.some(function(c) {
          return String(row[c.key] || '').toLowerCase().indexOf(_filter) >= 0;
        });
      });
      if (_sort.col) {
        filtered = filtered.slice().sort(function(a, b) {
          var av = a[_sort.col] || '', bv = b[_sort.col] || '';
          return String(av).localeCompare(String(bv)) * _sort.dir;
        });
      }
      var total = filtered.length;
      var start = (_page - 1) * _perPage;
      var paged = filtered.slice(start, start + _perPage);

      var html = '';
      if (config.filterable) {
        html += '<div class="skt-toolbar">'
          + '<input class="skt-search" placeholder="Lọc..." id="skt-filter-' + (el.id||'x') + '">'
          + (config.exportable ? '<button class="skt-export" onclick="this.closest(\'.skt-wrap\')._skExport()">⬇ CSV</button>' : '')
          + '</div>';
      }
      html += '<div class="sk-table-wrap"><table class="sk-table"><thead><tr>';
      columns.forEach(function(c) {
        var sortIcon = _sort.col === c.key ? (_sort.dir === 1 ? ' ↑' : ' ↓') : '';
        html += '<th' + (config.sortable ? ' class="skt-sortable" data-key="' + c.key + '"' : '') + '>'
          + c.label + sortIcon + '</th>';
      });
      html += '</tr></thead><tbody>';
      if (!paged.length) {
        html += '<tr><td colspan="' + columns.length + '" style="text-align:center;padding:20px;color:var(--text3);">Không có dữ liệu</td></tr>';
      }
      paged.forEach(function(row) {
        html += '<tr>';
        columns.forEach(function(c) {
          var val = c.render ? c.render(row[c.key], row) : (row[c.key] !== undefined ? row[c.key] : '');
          html += '<td>' + val + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      // Pagination
      var totalPages = Math.ceil(total / _perPage);
      if (totalPages > 1) {
        html += '<div class="skt-pagination">'
          + '<span class="skt-page-info">' + (start+1) + '–' + Math.min(start+_perPage, total) + ' / ' + total + '</span>'
          + '<button class="skt-pgbtn" ' + (_page <= 1 ? 'disabled' : '') + ' data-dir="-1">‹</button>'
          + '<button class="skt-pgbtn" ' + (_page >= totalPages ? 'disabled' : '') + ' data-dir="1">›</button>'
          + '</div>';
      } else {
        html += '<div class="skt-pagination"><span class="skt-page-info">' + total + ' bản ghi</span></div>';
      }

      el.innerHTML = '<div class="skt-wrap">' + html + '</div>';
      el.firstChild._skExport = function() { _export(filtered); };

      // Bind events
      var filterInput = document.getElementById('skt-filter-' + (el.id||'x'));
      if (filterInput) {
        filterInput.value = _filter;
        filterInput.addEventListener('input', function() {
          _filter = this.value.toLowerCase(); _page = 1; render();
        });
      }
      if (config.sortable) {
        el.querySelectorAll('.skt-sortable').forEach(function(th) {
          th.addEventListener('click', function() {
            var key = th.getAttribute('data-key');
            if (_sort.col === key) { _sort.dir *= -1; } else { _sort.col = key; _sort.dir = 1; }
            render();
          });
        });
      }
      el.querySelectorAll('.skt-pgbtn:not([disabled])').forEach(function(btn) {
        btn.addEventListener('click', function() {
          _page = Math.max(1, Math.min(totalPages, _page + parseInt(btn.getAttribute('data-dir'))));
          render();
        });
      });
    }

    function _export(rows) {
      var csv = columns.map(function(c){ return '"'+c.label+'"'; }).join(',') + '\n';
      rows.forEach(function(row) {
        csv += columns.map(function(c){ return '"' + String(row[c.key]||'').replace(/"/g,'""') + '"'; }).join(',') + '\n';
      });
      var blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href = url; a.download = (config.filename||'export') + '.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }

    render();
    return { refresh: render, setData: function(d){ data=d; _page=1; render(); } };
  };

  /* ================================================================
   * 8. DESIGN SYSTEM — Chart wrapper (Chart.js)
   * ================================================================ */
  window.SKChart = function(canvasId, config) {
    // config: { type, labels, datasets, title, height }
    if (typeof Chart === 'undefined') {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js';
      s.onload = function() { window.SKChart(canvasId, config); };
      document.head.appendChild(s);
      return;
    }
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (canvas._skChart) { canvas._skChart.destroy(); }

    var defaults = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: '#a0aec8', font: { family: "'Be Vietnam Pro',sans-serif", size: 11 } } },
        title: config.title ? { display: true, text: config.title, color: '#e2e8f8', font: { size: 13, weight: '800' } } : { display: false }
      },
      scales: config.type === 'pie' || config.type === 'doughnut' ? {} : {
        x: { ticks: { color: '#5a6890' }, grid: { color: '#1c2340' } },
        y: { ticks: { color: '#5a6890' }, grid: { color: '#1c2340' } }
      }
    };

    var PALETTE = ['#4f6fff','#00d68f','#06d6d6','#fbbf24','#ff4d6d','#a78bfa','#fb923c'];
    var datasets = config.datasets.map(function(ds, i) {
      return Object.assign({
        backgroundColor: config.type === 'line' ? 'transparent' : (PALETTE[i % PALETTE.length] + '33'),
        borderColor: PALETTE[i % PALETTE.length],
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.4
      }, ds);
    });

    canvas._skChart = new Chart(canvas, {
      type: config.type || 'bar',
      data: { labels: config.labels, datasets: datasets },
      options: Object.assign(defaults, config.options || {})
    });
    return canvas._skChart;
  };

  /* ================================================================
   * HELPERS
   * ================================================================ */
  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function _highlight(text, q) {
    if (!q) return _esc(text);
    var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return _esc(text).replace(re, '<mark style="background:rgba(79,111,255,.3);color:#fff;border-radius:2px">$1</mark>');
  }

  /* ================================================================
   * INIT — chạy khi DOM ready
   * ================================================================ */
  function init() {
    buildMegaMenu();
    buildBottomNav();

    // Đồng bộ user info nếu đã có
    var av = document.getElementById('sb-av');
    if (av && av.textContent) {
      var mmAv = document.getElementById('mmn-avatar');
      if (mmAv) mmAv.textContent = av.textContent;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
