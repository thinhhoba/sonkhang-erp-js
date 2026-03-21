/* ================================================================
// [v5.15] 22/03/2026 — Notification Bell: GAS polling, XSS guard, O(1) dedup
// [v5.14] 21/03/2026 — DevLog System: realtime changelog + masterplan tracking
// [v5.13.1] 21/03/2026 — Bugfix: restore buildMegaMenu, buildDropdown, _bindMenuEvents,
//           _bindSearchEvents, openSearch/closeSearch, _renderSearchResults,
//           updateBreadcrumb, _updateActiveMenu, _closeAllDropdowns
//           (749L — functions da bi mat trong lan rollback notification v5.13)
 * sk-mega-menu.js — SonKhang ERP v5.4
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
      id: 'san-pham', label: 'San pham', icon: '&#x1F4E6;', color: '#00d68f',
      items: [
        { id:'bang-gia',    icon:'&#x1F4B2;', label:'Bang gia SP',   desc:'San pham · anh · ma vach · bien the', done:true  },
        { id:'danh-muc',    icon:'&#x1F333;', label:'Danh muc',      desc:'Cay phan cap · drag-drop · filter',   done:true  },
        { id:'thuong-hieu', icon:'&#x1F3F7;', label:'Thuong hieu',   desc:'Brand · logo · quoc gia',             done:true  },
        { id:'thuoc-tinh',  icon:'&#x1F9E9;', label:'Thuoc tinh',    desc:'Mau · size · chat lieu · price tier', done:true  },
      ]
    },
    {
      id: 'crm', label: 'CRM', icon: '&#x1F465;', color: '#00d68f',
      items: [
        { id:'crm-khach-hang', icon:'&#x1F465;', label:'Khach hang',     desc:'Danh sach · lich su mua · nhom KH',   done:true  },
        { id:'crm-loyalty',    icon:'&#x2B50;',  label:'Loyalty / Hang', desc:'Bronze/Silver/Gold/Diamond · diem TL', done:true  },
        { id:'crm-rfm',        icon:'&#x1F4CA;', label:'Phan tich RFM',  desc:'Recency · Frequency · Monetary',       done:true  },
        { id:'crm-hop-dong',   icon:'&#x1F4CB;', label:'Hop dong',       desc:'Mau HD · Workflow · File scan',         done:true  },
        { id:'crm-bao-cao',    icon:'&#x1F4C8;', label:'Bao cao CRM',    desc:'Top KH · No · Diem · RFM segments',    done:true  }
      ]
    },
    {
      id: 'ban-hang', label: 'Ban hang', icon: '&#x1F6D2;', color: '#4f6fff',
      items: [
        { id:'don-hang',    icon:'&#x1F4CB;', label:'Don hang',      desc:'9 trang thai · tao nhanh · Sapo',    done:true  },
        { id:'chiet-khau',  icon:'&#x1F4B9;', label:'Chiet khau KM', desc:'%, VND · nhom KH · thoi gian',       done:true  },
        { id:'tinh-gia',    icon:'&#x1F9EE;', label:'Tinh gia ban',  desc:'Margin · VAT · gia si/le',           done:true  },
        { id:'giao-hang',   icon:'&#x1F69A;', label:'Giao hang',     desc:'Lenh giao · tai xe · xe tu dong',    done:true  },
        { id:'hoa-don-vat', icon:'&#x1F9FE;', label:'Hoa don VAT',   desc:'Xuat HD · thue · hach toan kep',     done:true  },
        { id:'tra-hang',    icon:'&#x21A9;',  label:'Tra hang RMA',  desc:'Yeu cau · kiem hang · hoan tien',    done:true  },
        { id:'bao-cao-bh',  icon:'&#x1F4CA;', label:'Bao cao BH',    desc:'Doanh thu · SP ban chay · hoa hong', done:true  }
      ]
    },
    {
      id: 'mua-hang', label: 'Mua hang', icon: '&#x1F4E6;', color: '#06d6d6',
      items: [
        { id:'nha-cung-cap', icon:'&#x1F3ED;', label:'Nha cung cap',    desc:'CRUD · nhom · han muc tin dung',  done:true  },
        { id:'po-list',      icon:'&#x1F4C4;', label:'Lenh mua (PO)',   desc:'Tao · duyet · theo doi trang thai',done:true  },
        { id:'nhap-kho',     icon:'&#x1F4E5;', label:'Nhap kho',        desc:'Tu PO · kiem dem · cap nhat ton', done:true  },
        { id:'bao-cao-mh',   icon:'&#x1F4CA;', label:'Bao cao MH',      desc:'Chi phi · NCC · ton kho nhap',    done:true  }
      ]
    },
    {
      id: 'kho-van', label: 'Kho van', icon: '&#x1F3ED;', color: '#fbbf24',
      items: [
        { id:'ton-kho',     icon:'&#x1F4CA;', label:'Ton kho',       desc:'So luong · lo hang · canh bao min', done:true  },
        { id:'xuat-kho',    icon:'&#x1F4E4;', label:'Xuat kho',      desc:'Phieu xuat · tru ton · LS xuat',    done:true  },
        { id:'nhap-kho',    icon:'&#x1F4E5;', label:'Nhap kho',      desc:'Tu PO · kiem dem · cap nhat',       done:true  },
        { id:'phuong-tien', icon:'&#x1F69B;', label:'Phuong tien',   desc:'Registry · dieu phoi · xang',       done:true  },
        { id:'bao-cao-kv',  icon:'&#x1F4C8;', label:'Bao cao Kho',   desc:'Ton kho · canh bao · bien dong',    done:true  }
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
        { id:'hoa-don-vat', icon:'&#x1F9FE;', label:'Hoa don VAT',  desc:'Xuat HD · thue · hach toan kep',    done:true  },
        { id:'so-quy',      icon:'&#x1F4B5;', label:'So quy',       desc:'Thu chi · so du · doi soat',         done:true  },
        { id:'cong-no',     icon:'&#x1F4B3;', label:'Cong no',      desc:'KH/NCC · han TT · nhac no',          done:true  },
        { id:'ke-toan',     icon:'&#x1F4D2;', label:'Ke toan TK',   desc:'So cai · but toan · bao cao TC',     done:true  },
        { id:'bao-cao-tc',  icon:'&#x1F4CA;', label:'Bao cao TC',   desc:'P&L · doanh thu · chi phi',          done:true  }
      ]
    },
    {
      id: 'quan-tri', label: 'Quan tri', icon: '&#x2699;', color: '#a78bfa',
      items: [
        { id:'sapo-sync',        icon:'&#x1F504;', label:'Sapo Sync',      desc:'Don hang · san pham · realtime sync', done:true  },
        { id:'admin-panel',      icon:'&#x1F511;', label:'Phan quyen',     desc:'Users · roles · RBAC phan quyen',    admin:true },
        { id:'link-user-nv',     icon:'&#x1F517;', label:'Link User-NV',   desc:'Lien ket tai khoan voi nhan vien',   admin:true },
        { id:'account-settings', icon:'&#x1F464;', label:'Cai dat TK',     desc:'Mat khau · thong tin ca nhan',       admin:false},
        { id:'ca-nhan',          icon:'&#x1F4CB;', label:'Ho so ca nhan',  desc:'Xem luong · cham cong · KPI',        admin:false},
        { id:'bao-cao-ns',       icon:'&#x1F4CA;', label:'Bao cao NS',     desc:'Tong hop · luong · KPI · tuyen dung',admin:true },
        { id:'dev-log',          icon:'&#x1F4D3;', label:'DevLog',         desc:'Changelog · Masterplan · tien do',   admin:true, done:true }
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


  /* ================================================================
   * 1. BUILD MEGA MENU HTML
   * ================================================================ */
  var _breadcrumbMap = {};
  MENU.forEach(function(g){
    g.items.forEach(function(it){
      _breadcrumbMap[it.id] = { label:it.label, group:g.label, groupId:g.id };
    });
  });

  function buildDropdown(group) {
    var html = '<div class="mmd-inner">';
    group.items.forEach(function(item) {
      var statusDot = item.done
        ? '<span class="mmd-status done" title="Hoan thanh">&#x2713;</span>'
        : '<span class="mmd-status todo" title="Dang phat trien">&#x25CB;</span>';
      html += '<div class="mmd-item" data-page="' + item.id + '">'
        + '<div class="mmd-icon">' + (item.icon || '&#x25C6;') + '</div>'
        + '<div class="mmd-info">'
        + '<div class="mmd-label">' + item.label + statusDot + '</div>'
        + '<div class="mmd-desc">' + item.desc + '</div>'
        + '</div>'
        + '</div>';
    });
    html += '</div>';
    return html;
  }

  function buildMegaMenu() {
    if (document.getElementById('sk-mega-nav')) return;

    var nav = document.createElement('nav');
    nav.id = 'sk-mega-nav';
    nav.setAttribute('role', 'navigation');

    var brand = '<div class="mmn-brand" onclick="skLoad(\'dashboard\')">'
      + '<div class="mmn-logo">SK</div>'
      + '<div class="mmn-brand-text"><div class="mmn-brand-name">SonKhang ERP</div>'
      + '<span class="mmn-badge" id="mmn-version-badge">v5.12</span></div>'
      + '</div>';

    var menuHtml = '<div class="mmn-items">';
    MENU.forEach(function(group) {
      menuHtml += '<div class="mmn-group" data-gid="' + group.id + '">'
        + '<button class="mmn-group-btn" data-gid="' + group.id + '">'
        + '<span class="mmn-group-icon">' + group.icon + '</span>'
        + '<span class="mmn-group-label">' + group.label + '</span>'
        + '<span class="mmn-caret">&#x25BE;</span>'
        + '</button>'
        + '<div class="mmn-dropdown" id="mmd-' + group.id + '">' + buildDropdown(group) + '</div>'
        + '</div>';
    });
    menuHtml += '</div>';

    var right = '<div class="mmn-right">'
      + '<button class="mmn-icon-btn" id="mmn-search-btn" title="Tim kiem (Ctrl+K)">'
        + '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="5"/><line x1="13" y1="13" x2="18" y2="18"/></svg>'
      + '</button>'
      + '<button class="mmn-icon-btn" id="mmn-bell-btn" title="Thong bao">'
        + '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2a6 6 0 00-6 6v3l-2 2v1h16v-1l-2-2V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z"/></svg>'
        + '<span class="mmn-badge-dot" id="mmn-bell-count" style="display:none">0</span>'
      + '</button>'
      + '<div class="mmn-bell-panel" id="mmn-bell-panel">' + buildBellPanel() + '</div>'
      + '<button class="mmn-user-btn" id="mmn-user-btn" onclick="skLoad(\'ca-nhan\')">'
        + '<div class="mmn-avatar" id="mmn-avatar">?</div>'
        + '<span class="mmn-username" id="mmn-uname">...</span>'
      + '</button>'
      + '</div>';

    nav.innerHTML = brand + menuHtml + right;

    // Breadcrumb bar
    var bc = document.createElement('div');
    bc.id = 'sk-breadcrumb';
    bc.innerHTML = '<span class="bc-item bc-home" onclick="skLoad(\'dashboard\')">&#x1F3E0; Trang chu</span>';

    // Search overlay
    var so = document.createElement('div');
    so.id = 'sk-search-overlay';
    so.innerHTML = '<div class="sk-search-box">'
      + '<input id="sk-cmd-input" type="text" placeholder="Tim kiem module, chuc nang... (Ctrl+K)">'
      + '<div id="sk-cmd-results"></div>'
      + '</div>';

    document.body.insertBefore(nav, document.body.firstChild);
    document.body.insertBefore(bc, nav.nextSibling);
    document.body.insertBefore(so, bc.nextSibling);

    _bindMenuEvents();
    _bindSearchEvents();
    _bindBellEvents();
    _updateBellBadge();
    // [v5.15] Start GAS polling sau khi API sẵn sàng
    _startNotifPoll();
  }

  /* ===============================================================
   * 2. MENU EVENTS
   * ================================================================ */
  function _closeAllDropdowns(except) {
    document.querySelectorAll('.mmn-dropdown').forEach(function(d) {
      if (d !== except) d.classList.remove('open');
    });
    document.querySelectorAll('.mmn-group-btn').forEach(function(b) {
      if (b.getAttribute('data-gid') !== (except ? except.id.replace('mmd-','') : ''))
        b.classList.remove('active');
    });
  }

  function _bindMenuEvents() {
    // Group button click → toggle dropdown
    document.querySelectorAll('.mmn-group-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var gid      = btn.getAttribute('data-gid');
        var dropdown = document.getElementById('mmd-' + gid);
        if (!dropdown) return;
        var isOpen = dropdown.classList.contains('open');
        _closeAllDropdowns(null);
        if (!isOpen) {
          dropdown.classList.add('open');
          btn.classList.add('active');
        }
      });
    });

    // Dropdown item click → navigate
    document.querySelectorAll('.mmd-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var page = item.getAttribute('data-page');
        if (page && typeof skLoad === 'function') {
          skLoad(page);
          _closeAllDropdowns(null);
        }
      });
    });

    // Click outside → close dropdowns
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.mmn-group') && !e.target.closest('.mmn-dropdown')) {
        _closeAllDropdowns(null);
      }
    });
  }

  function _updateActiveMenu(page) {
    document.querySelectorAll('.mmn-group-btn').forEach(function(b){
      b.classList.remove('page-active');
    });
    if (!page) return;
    var info = _breadcrumbMap[page];
    if (!info) return;
    var btn = document.querySelector('.mmn-group-btn[data-gid="' + info.groupId + '"]');
    if (btn) btn.classList.add('page-active');
  }

  function updateBreadcrumb(page) {
    var bc = document.getElementById('sk-breadcrumb');
    if (!bc) return;
    var info = _breadcrumbMap[page];
    if (!info) {
      bc.innerHTML = '<span class="bc-item bc-home" onclick="skLoad(\'dashboard\')">&#x1F3E0; Trang chu</span>';
      return;
    }
    bc.innerHTML = '<span class="bc-item bc-home" onclick="skLoad(\'dashboard\')">&#x1F3E0; Trang chu</span>'
      + '<span class="bc-sep">&#x203A;</span>'
      + '<span class="bc-item" onclick="skLoad(\'' + info.groupId + '\')">' + info.group + '</span>'
      + '<span class="bc-sep">&#x203A;</span>'
      + '<span class="bc-item bc-current">' + info.label + '</span>';
    _updateActiveMenu(page);
  }

  /* ================================================================
   * 3. SEARCH / COMMAND PALETTE (Ctrl+K)
   * ================================================================ */
  function openSearch() {
    _searchOpen = true;
    var overlay = document.getElementById('sk-search-overlay');
    var input   = document.getElementById('sk-cmd-input');
    if (overlay) overlay.classList.add('open');
    if (input)   { input.value = ''; input.focus(); }
    _renderSearchResults('');
  }

  function closeSearch() {
    _searchOpen = false;
    var overlay = document.getElementById('sk-search-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function _renderSearchResults(q) {
    var el = document.getElementById('sk-cmd-results');
    if (!el) return;
    q = (q || '').toLowerCase().trim();
    var results = q
      ? SEARCH_INDEX.filter(function(item) { return item.keywords.indexOf(q) >= 0; })
      : SEARCH_INDEX.slice(0, 12);
    _cmdResults = results;
    _cmdIdx = 0;
    if (!results.length) {
      el.innerHTML = '<div class="sk-cmd-empty">Khong tim thay ket qua cho "' + q + '"</div>';
      return;
    }
    el.innerHTML = results.slice(0,12).map(function(item, i) {
      return '<div class="sk-cmd-item' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '">'
        + '<span class="sk-cmd-icon">' + item.icon + '</span>'
        + '<div class="sk-cmd-info">'
          + '<div class="sk-cmd-label">' + item.label + '</div>'
          + '<div class="sk-cmd-group">' + item.group + ' · ' + item.desc + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
    el.querySelectorAll('.sk-cmd-item').forEach(function(row) {
      row.addEventListener('click', function() {
        var idx = parseInt(row.getAttribute('data-idx'));
        _selectCmd(idx);
      });
      row.addEventListener('mouseenter', function() {
        var idx = parseInt(row.getAttribute('data-idx'));
        _cmdIdx = idx;
        _highlightCmd();
      });
    });
  }

  function _moveCmdIdx(dir) {
    _cmdIdx = Math.max(0, Math.min(_cmdResults.length - 1, _cmdIdx + dir));
    _highlightCmd();
  }

  function _highlightCmd() {
    document.querySelectorAll('.sk-cmd-item').forEach(function(el, i) {
      el.classList.toggle('active', i === _cmdIdx);
    });
    var active = document.querySelector('.sk-cmd-item.active');
    if (active) active.scrollIntoView({ block:'nearest' });
  }

  function _selectCmd(idx) {
    idx = (idx !== undefined) ? idx : _cmdIdx;
    var item = _cmdResults[idx];
    if (!item) return;
    closeSearch();
    if (typeof skLoad === 'function') skLoad(item.id);
  }

  function _bindSearchEvents() {
    var overlay = document.getElementById('sk-search-overlay');
    var input   = document.getElementById('sk-cmd-input');
    var btn     = document.getElementById('mmn-search-btn');
    if (btn)     btn.addEventListener('click', openSearch);
    if (overlay) overlay.addEventListener('click', function(e){ if (e.target===overlay) closeSearch(); });
    if (input) {
      input.addEventListener('input',   function(){ _renderSearchResults(this.value); });
      input.addEventListener('keydown', function(e){
        if (e.key === 'ArrowDown') { e.preventDefault(); _moveCmdIdx(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); _moveCmdIdx(-1); }
        else if (e.key === 'Enter') { e.preventDefault(); _selectCmd(); }
        else if (e.key === 'Escape') closeSearch();
      });
    }
    document.addEventListener('keydown', function(e){
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape' && _searchOpen) closeSearch();
    });
  }



  // ── Notification bell data (local mock — sẽ được replace bằng GAS polling sau) ──
  // ── Notification bell — GAS Realtime Polling v5.15 ────────────
  // ── Notification Bell v5.15 — GAS Realtime Polling ────────────────
  // [SECURITY] Không dùng localStorage — state in-memory only
  // [O(1)]     _notifIdSet (Set) để dedup khi merge items mới
  // [PERF]     Poll pause khi tab ẩn (visibilitychange API)
  // [OWASP A03] Mọi server text qua _escHtml() trước khi render
  // ──────────────────────────────────────────────────────────────────

  // ── State ───────────────────────────────────────────────────────
  var _notifCache   = [];          // Array<notif> — max 50 items
  var _notifIdSet   = new Set();   // O(1) dedup guard
  var _notifUnread  = 0;
  var _notifTimer   = null;
  var _notifSince   = null;        // ISO string — lọc chỉ lấy mới
  var _notifLoading = false;
  var _notifInited  = false;
  var NOTIF_POLL_MS = 30000;       // 30 giây
  var NOTIF_MAX     = 50;          // giới hạn cache

  // ── Type config ─────────────────────────────────────────────────
  var NOTIF_CFG = {
    order_new       : { icon:'&#x1F6D2;', label:'Đơn hàng',   color:'var(--accent2)' },
    order_paid      : { icon:'&#x1F4B0;', label:'Thanh toán',  color:'var(--green)'   },
    order_cancel    : { icon:'&#x274C;',  label:'Hủy đơn',    color:'var(--red)'     },
    leave_request   : { icon:'&#x1F4C5;', label:'Xin nghỉ',   color:'var(--yellow)'  },
    leave_approved  : { icon:'&#x2705;',  label:'Duyệt nghỉ', color:'var(--green)'   },
    expiry_alert    : { icon:'&#x23F0;',  label:'Hết hạn',    color:'var(--yellow)'  },
    stock_low       : { icon:'&#x1F4E6;', label:'Tồn kho',    color:'var(--red)'     },
    misa_hd         : { icon:'&#x1F4CB;', label:'Hóa đơn',    color:'var(--cyan)'    },
    workflow_pending: { icon:'&#x23F3;',  label:'Phê duyệt',  color:'var(--yellow)'  },
    kpi_alert       : { icon:'&#x1F4CA;', label:'KPI',        color:'var(--accent2)' },
    debt_due        : { icon:'&#x1F4B3;', label:'Công nợ',    color:'var(--red)'     },
    contract_expire : { icon:'&#x1F4DC;', label:'Hợp đồng',   color:'var(--yellow)'  },
    system          : { icon:'&#x2699;',  label:'Hệ thống',   color:'var(--text3)'   },
    info            : { icon:'&#x2139;',  label:'Thông tin',  color:'var(--accent2)' },
  };

  // ── Helpers ─────────────────────────────────────────────────────
  function _escHtml(s) {
    // [OWASP A03] Sanitize server text trước khi render vào innerHTML
    return String(s||'')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function _notifTimeAgo(iso) {
    if (!iso) return '';
    var diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)   return diff + 'g trước';
    if (diff < 3600) return Math.floor(diff/60) + ' phút trước';
    if (diff < 86400)return Math.floor(diff/3600) + ' giờ trước';
    return Math.floor(diff/86400) + ' ngày trước';
  }

  function _notifFmt(hhmm) {
    var d = new Date();
    return (d.getHours()<10?'0'+d.getHours():d.getHours())+':'
          +(d.getMinutes()<10?'0'+d.getMinutes():d.getMinutes())+':'
          +(d.getSeconds()<10?'0'+d.getSeconds():d.getSeconds());
  }

  // ── Core: fetch từ GAS ─────────────────────────────────────────
  function _notifFetch(force) {
    if (_notifLoading) return;
    var api = typeof window.api === 'function' ? window.api : null;
    if (!api) return;

    _notifLoading = true;
    var params = { limit: 30, unread_only: false };
    if (_notifSince && !force) params.since = _notifSince;

    api('notif_get', params, function(err, d) {
      _notifLoading = false;
      if (err || !d || !d.ok) return;

      var items = d.data || [];
      var newCount = 0;

      // [O(1)] Merge — dùng Set để dedup
      items.forEach(function(item) {
        if (_notifIdSet.has(item.id)) return;
        _notifIdSet.add(item.id);
        _notifCache.unshift(item);   // mới nhất lên đầu
        if (item.status === 'unread') newCount++;
      });

      // Cắt cache nếu vượt NOTIF_MAX
      if (_notifCache.length > NOTIF_MAX) {
        var removed = _notifCache.splice(NOTIF_MAX);
        removed.forEach(function(r){ _notifIdSet.delete(r.id); });
      }

      // Cập nhật since = ISO của item mới nhất
      if (items.length > 0 && items[0].created_at) {
        _notifSince = items[0].created_at;
      }

      // Đếm lại unread từ cache
      _notifUnread = _notifCache.filter(function(n){
        return n.status === 'unread';
      }).length;

      _updateBellBadge();

      // Re-render nếu panel đang mở
      var panel = document.getElementById('mmn-bell-panel');
      if (panel && panel.classList.contains('open')) {
        _renderBellPanel();
      }

      // Browser Notification nếu có items mới và có permission
      if (newCount > 0 && _notifInited) {
        _tryBrowserNotif(items[0]);
      }
      _notifInited = true;
    });
  }

  // ── Browser Notification API ──────────────────────────────────
  function _tryBrowserNotif(item) {
    if (!item || !window.Notification) return;
    if (Notification.permission !== 'granted') return;
    var cfg = NOTIF_CFG[item.type] || NOTIF_CFG.info;
    try {
      new Notification('SonKhang ERP ' + cfg.label, {
        body : String(item.title || '').slice(0, 80),
        icon : '/favicon.ico',
        tag  : String(item.id),      // deduplicate browser notifs
        silent: false,
      });
    } catch(e) {}
  }

  function _requestBrowserNotifPermission() {
    if (!window.Notification) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // ── Polling lifecycle ─────────────────────────────────────────
  function _startNotifPoll() {
    if (_notifTimer) return;
    _notifFetch(true);  // fetch ngay lần đầu
    _notifTimer = setInterval(function() {
      // [PERF] Pause khi tab ẩn
      if (document.visibilityState === 'hidden') return;
      _notifFetch(false);
    }, NOTIF_POLL_MS);

    // Resume khi tab hiện lại
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') _notifFetch(false);
    });
  }

  function _stopNotifPoll() {
    if (_notifTimer) { clearInterval(_notifTimer); _notifTimer = null; }
  }

  // ── Render panel ──────────────────────────────────────────────
  function _renderBellPanel() {
    var panel = document.getElementById('mmn-bell-panel');
    if (!panel) return;

    var unread = _notifUnread;
    var now    = _notifFmt();
    var html   = '';

    // Header
    html += '<div class="bell-header">'
          +   '<span class="bell-title">Thông báo</span>'
          +   '<div style="display:flex;align-items:center;gap:8px;">'
          +     (unread > 0
                  ? '<span class="bell-unread">' + unread + ' mới</span>'
                  : '<span style="font-size:10px;color:var(--text3);">Đã đọc hết</span>')
          +     '<button id="bell-read-all" style="background:none;border:none;'
          +     'color:var(--accent2);font-size:10px;font-weight:700;cursor:pointer;'
          +     'font-family:inherit;padding:2px 6px;">Đọc hết</button>'
          +   '</div>'
          + '</div>';

    // List
    html += '<div class="bell-list" id="bell-list-inner">';
    if (_notifCache.length === 0) {
      html += '<div style="text-align:center;padding:32px 16px;color:var(--text3);">'
            +   '<div style="font-size:28px;margin-bottom:8px;">&#x1F515;</div>'
            +   '<div style="font-size:12px;font-weight:600;">Chưa có thông báo</div>'
            + '</div>';
    } else {
      _notifCache.forEach(function(n) {
        var cfg    = NOTIF_CFG[n.type] || NOTIF_CFG.info;
        var unread = n.status === 'unread';
        // [OWASP A03] _escHtml() cho mọi giá trị từ server
        var title  = _escHtml(n.title || '');
        var body   = _escHtml(n.body  || '');
        var timeAgo= _notifTimeAgo(n.created_at);
        var idSafe = _escHtml(String(n.id));

        html += '<div class="bell-item' + (unread ? ' unread' : '') + '"'
              +      ' data-id="' + idSafe + '"'
              +      ' data-link="' + _escHtml(n.link || '') + '"'
              +      ' style="border-left:2px solid ' + (unread ? cfg.color : 'transparent') + ';">'
              +   '<span class="bell-icon">' + cfg.icon + '</span>'
              +   '<div class="bell-body" style="flex:1;min-width:0;">'
              +     '<div class="bell-text" style="font-weight:' + (unread?'700':'400') + ';">'
              +       title
              +     '</div>'
              +     (body ? '<div style="font-size:10px;color:var(--text3);margin-top:2px;'
              +             'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
              +             body + '</div>' : '')
              +     '<div class="bell-time">'
              +       '<span style="color:' + cfg.color + ';font-size:9px;font-weight:700;margin-right:4px;">'
              +       cfg.label + '</span>' + timeAgo
              +     '</div>'
              +   '</div>'
              +   (unread ? '<span class="bell-dot"></span>' : '')
              + '</div>';
      });
    }
    html += '</div>';

    // Footer
    html += '<div class="bell-footer" style="display:flex;justify-content:space-between;'
          + 'align-items:center;padding:8px 14px;border-top:1px solid var(--border);'
          + 'background:var(--bg3);">'
          +   '<span style="font-size:10px;color:var(--text3);">Cập nhật: ' + now + '</span>'
          +   '<div style="display:flex;gap:8px;">'
          +     '<button id="bell-cleanup" style="background:none;border:none;color:var(--text3);'
          +     'font-size:10px;cursor:pointer;font-family:inherit;">Xóa đã đọc</button>'
          +     '<button id="bell-refresh" style="background:none;border:none;color:var(--accent2);'
          +     'font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;">↻ Làm mới</button>'
          +   '</div>'
          + '</div>';

    panel.innerHTML = html;
    _bindBellPanelEvents(panel);
  }

  // ── Bind panel events ─────────────────────────────────────────
  function _bindBellPanelEvents(panel) {
    // Đọc hết
    var readAllBtn = document.getElementById('bell-read-all');
    if (readAllBtn) {
      readAllBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        _markAllRead();
      });
    }

    // Làm mới
    var refreshBtn = document.getElementById('bell-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        _notifFetch(true);
      });
    }

    // Xóa đã đọc
    var cleanupBtn = document.getElementById('bell-cleanup');
    if (cleanupBtn) {
      cleanupBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var api = typeof window.api === 'function' ? window.api : null;
        if (!api) return;
        api('notif_cleanup', { days: 7 }, function(err, d) {
          if (!err && d && d.ok) _notifFetch(true);
        });
      });
    }

    // Click từng item → mark read + navigate
    panel.querySelectorAll('.bell-item').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        var id   = el.getAttribute('data-id');
        var link = el.getAttribute('data-link') || '';
        _markOneRead(id, link);
      });
    });
  }

  // ── Mark read actions ─────────────────────────────────────────
  function _markOneRead(id, link) {
    // [O(1)] Update local state ngay lập tức (optimistic UI)
    var item = null;
    for (var ci = 0; ci < _notifCache.length; ci++) {
      if (String(_notifCache[ci].id) === String(id)) {
        item = _notifCache[ci]; break;
      }
    }
    if (item && item.status === 'unread') {
      item.status = 'read';
      _notifUnread = Math.max(0, _notifUnread - 1);
      _updateBellBadge();
      _renderBellPanel();
    }

    // Sync với GAS
    var api = typeof window.api === 'function' ? window.api : null;
    if (api) api('notif_mark_read', { ids: [id] }, function(){});

    // Navigate nếu có link
    if (link && typeof window.loadGeneric === 'function') {
      window.loadGeneric(link);
      var panel = document.getElementById('mmn-bell-panel');
      if (panel) panel.classList.remove('open');
    }
  }

  function _markAllRead() {
    // Optimistic UI
    _notifCache.forEach(function(n) { n.status = 'read'; });
    _notifUnread = 0;
    _updateBellBadge();
    _renderBellPanel();

    // Sync GAS
    var api = typeof window.api === 'function' ? window.api : null;
    if (api) api('notif_mark_read', { all_read: true }, function(){});
  }

  // ── Bell panel open/close ─────────────────────────────────────
  function buildBellPanel() {
    // Trả về chuỗi rỗng — panel được render bởi _renderBellPanel()
    return '';
  }

  function _bindBellEvents() {
    var btn   = document.getElementById('mmn-bell-btn');
    var panel = document.getElementById('mmn-bell-panel');
    if (!btn || !panel) return;

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = panel.classList.contains('open');
      panel.classList.toggle('open');
      if (!isOpen) {
        // Mở panel → render mới nhất
        _renderBellPanel();
        _requestBrowserNotifPermission();
      }
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest('#mmn-bell-btn') &&
          !e.target.closest('#mmn-bell-panel')) {
        panel.classList.remove('open');
      }
    });
  }

  function _updateBellBadge() {
    var dot = document.getElementById('mmn-bell-count');
    if (!dot) return;
    var count = _notifUnread;
    dot.textContent = count > 99 ? '99+' : String(count);
    dot.style.display = count > 0 ? 'flex' : 'none';
  }

  function _refreshBellPanel() {
    var panel = document.getElementById('mmn-bell-panel');
    if (panel && panel.classList.contains('open')) _renderBellPanel();
    _updateBellBadge();
  }

  // ── Public API ────────────────────────────────────────────────
  window.skNotify = function(text, type, opts) {
    // Cho phép modules khác push notification cục bộ ngay lập tức
    opts = opts || {};
    var id  = 'local-' + Date.now() + '-' + Math.floor(Math.random()*1000);
    if (_notifIdSet.has(id)) return;
    _notifIdSet.add(id);
    var item = {
      id         : id,
      type       : type || 'info',
      title      : String(text || '').slice(0, 120),
      body       : String(opts.body || ''),
      link       : String(opts.link || ''),
      status     : 'unread',
      created_at : new Date().toISOString(),
    };
    _notifCache.unshift(item);
    if (_notifCache.length > NOTIF_MAX) _notifCache.pop();
    _notifUnread++;
    _updateBellBadge();
    _refreshBellPanel();
    _showToast(text, type === 'error' ? 'error' : 'ok');

    // Push lên GAS để lưu vào SK_Notifications
    var api = typeof window.api === 'function' ? window.api : null;
    if (api && !opts.local_only) {
      api('notif_push', {
        type   : item.type,
        title  : item.title,
        body   : item.body,
        link   : item.link,
        level  : opts.level || 'info',
        user   : opts.user  || '',
      }, function(){});
    }
  };

  window._skMarkAllRead = function() { _markAllRead(); };


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
