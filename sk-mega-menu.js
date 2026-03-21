/* ================================================================
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
        { id:'bao-cao-ns',       icon:'&#x1F4CA;', label:'Bao cao NS',     desc:'Tong hop · luong · KPI · tuyen dung',admin:true }
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

  // ================================================================
  // NOTIFICATION SYSTEM v5.13
  // Polling GAS moi 30s | Browser Notification | Persistent localStorage
  // ================================================================

  // State
  var _notifCache   = [];          // cache local
  var _notifSince   = null;        // ISO timestamp poll cuoi
  var _notifTimer   = null;        // setInterval handle
  var _notifPerm    = false;       // Browser Notification permission
  var _notifPaused  = false;       // tam dung polling (tab an)
  var POLL_INTERVAL = 30000;       // 30 giay

  // Icons + labels theo type
  var NOTIF_META = {
    order_new       : { icon:'&#x1F6D2;', color:'var(--green)',  label:'Don hang moi'    },
    order_paid      : { icon:'&#x1F4B0;', color:'var(--green)',  label:'Thanh toan'       },
    order_cancel    : { icon:'&#x274C;',  color:'var(--red)',    label:'Huy don'          },
    leave_request   : { icon:'&#x1F4C5;', color:'var(--yellow)', label:'Nghi phep'        },
    leave_approved  : { icon:'&#x2705;',  color:'var(--green)',  label:'Duyet nghi'       },
    expiry_alert    : { icon:'&#x23F0;',  color:'var(--yellow)', label:'Sap het han'      },
    stock_low       : { icon:'&#x1F4E6;', color:'var(--yellow)', label:'Ton kho thap'     },
    misa_hd         : { icon:'&#x1F9FE;', color:C.cyan[2],       label:'Hoa don Misa'     },
    workflow_pending: { icon:'&#x1F4CB;', color:'var(--purple)', label:'Cho duyet'        },
    kpi_alert       : { icon:'&#x1F4CA;', color:'var(--accent2)',label:'Canh bao KPI'     },
    debt_due        : { icon:'&#x1F4B3;', color:'var(--red)',    label:'Cong no qua han'  },
    contract_expire : { icon:'&#x1F4DC;', color:'var(--yellow)', label:'HD sap het han'   },
    system          : { icon:'&#x2699;',  color:'var(--text3)',  label:'He thong'         },
  };

  function _notifMeta(type) {
    return NOTIF_META[type] || { icon:'&#x1F514;', color:'var(--text2)', label:'Thong bao' };
  }

  function _fmtAgo(iso) {
    if (!iso) return '';
    var diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)   return diff + 'g truoc';
    if (diff < 3600) return Math.round(diff/60) + ' phut truoc';
    if (diff < 86400)return Math.round(diff/3600) + ' gio truoc';
    return Math.round(diff/86400) + ' ngay truoc';
  }

  // ── LocalStorage persist ─────────────────────────────────────────
  var LS_KEY = 'sk_notif_v2';
  function _loadFromLS() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        _notifCache = parsed.items || [];
        _notifSince = parsed.since || null;
      }
    } catch(e) {}
  }
  function _saveToLS() {
    try {
      // Giu toi da 100 thong bao
      var items = _notifCache.slice(0, 100);
      localStorage.setItem(LS_KEY, JSON.stringify({ items:items, since:_notifSince }));
    } catch(e) {}
  }

  // ── Poll GAS ──────────────────────────────────────────────────────
  function _notifPoll() {
    if (_notifPaused) return;
    var apiF = typeof window.api === 'function' ? window.api : null;
    if (!apiF) return;
    apiF('notif_get', { unread_only:false, limit:50, since:_notifSince }, function(e, d) {
      if (e || !d || !d.ok) return;
      var items = d.data || [];
      _notifSince = d.server_time || new Date().toISOString();

      // Merge: add mới, update status đã đọc
      var existingIds = {};
      _notifCache.forEach(function(n) { existingIds[n.id] = true; });

      var newItems = [];
      items.forEach(function(item) {
        if (!existingIds[item.id]) {
          newItems.push(item);
          _notifCache.unshift(item);
        } else {
          // Cập nhật status
          for (var i=0; i<_notifCache.length; i++) {
            if (_notifCache[i].id === item.id) {
              _notifCache[i].status = item.status;
              break;
            }
          }
        }
      });

      if (newItems.length > 0) {
        _saveToLS();
        _updateBellBadge();
        _refreshBellPanel();
        // Browser notification cho urgent/warning
        newItems.forEach(function(item) {
          if (item.level === 'urgent' || item.level === 'warning' || item.level === 'success') {
            _pushBrowserNotif(item);
          }
        });
      } else {
        _updateBellBadge();
      }
    });
  }

  // ── Start/stop polling ────────────────────────────────────────────
  function _notifStartPolling() {
    _loadFromLS();
    _notifPoll(); // Poll ngay lập tức lần đầu
    _notifTimer = setInterval(_notifPoll, POLL_INTERVAL);

    // Pause khi tab ẩn, resume khi quay lại
    document.addEventListener('visibilitychange', function() {
      _notifPaused = document.hidden;
      if (!document.hidden) _notifPoll(); // Poll ngay khi quay lại
    });
  }

  // ── Browser Push Notification ─────────────────────────────────────
  function _requestBrowserPerm(cb) {
    if (!('Notification' in window)) { if(cb) cb(false); return; }
    if (Notification.permission === 'granted') { _notifPerm=true; if(cb) cb(true); return; }
    if (Notification.permission === 'denied')  { if(cb) cb(false); return; }
    Notification.requestPermission(function(p) {
      _notifPerm = (p === 'granted');
      if(cb) cb(_notifPerm);
    });
  }

  function _pushBrowserNotif(item) {
    if (!_notifPerm || Notification.permission !== 'granted') return;
    var meta = _notifMeta(item.type);
    var n = new Notification('SonKhang ERP — ' + (meta.label||item.type), {
      body    : item.title + (item.body ? '\n' + item.body : ''),
      icon    : '/favicon.ico',
      tag     : item.id,
      silent  : (item.level === 'info'),
      requireInteraction: (item.level === 'urgent')
    });
    n.onclick = function() {
      window.focus();
      if (item.link) _navigateTo(item.link);
      n.close();
    };
    setTimeout(function(){ n.close(); }, 8000);
  }

  function _navigateTo(link) {
    if (!link) return;
    var page = link.replace(/^#/,'');
    if (typeof window.skLoad === 'function') window.skLoad(page);
    else if (typeof window.getContent === 'function') window.location.hash = link;
  }

  // ── Bell Badge ────────────────────────────────────────────────────
  function _updateBellBadge() {
    var count = _notifCache.filter(function(n){ return n.status === 'unread'; }).length;
    var dot   = document.getElementById('mmn-bell-count');
    if (dot) {
      dot.textContent = count > 99 ? '99+' : String(count);
      dot.style.display = count > 0 ? 'flex' : 'none';
      // Pulse animation khi có mới
      if (count > 0) {
        dot.style.animation = 'notif-pulse 1.5s ease-in-out 3';
      }
    }
  }

  // ── Bell Panel ────────────────────────────────────────────────────
  function buildBellPanel() {
    return '<div id="sk-bell-inner"></div>'; // placeholder, filled by _refreshBellPanel
  }

  function _refreshBellPanel() {
    var el = document.getElementById('sk-bell-inner');
    if (!el) return;

    var items    = _notifCache.filter(function(n){ return n.status !== 'dismissed'; });
    var unread   = items.filter(function(n){ return n.status === 'unread'; });
    var hasUrgent= unread.some(function(n){ return n.level === 'urgent'; });

    // Group: Moi (unread) + Da doc
    var unreadItems = items.filter(function(n){ return n.status === 'unread'; }).slice(0,20);
    var readItems   = items.filter(function(n){ return n.status === 'read'; }).slice(0,10);

    var h = '<div style="background:var(--bg2);border-bottom:1px solid var(--border);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">'
      + '<div style="display:flex;align-items:center;gap:8px;">'
        + '<span style="font-size:14px;font-weight:900;">Thong bao</span>'
        + (unread.length ? '<span style="background:var(--red);color:#fff;border-radius:10px;font-size:10px;font-weight:800;padding:2px 7px;">' + unread.length + ' moi</span>' : '')
        + (hasUrgent ? '<span style="font-size:11px;color:var(--red);font-weight:700;">&#x26A0; Can xu ly!</span>' : '')
      + '</div>'
      + '<div style="display:flex;gap:6px;align-items:center;">'
        + '<button id="bell-perm-btn" title="Bat thong bao trinh duyet" style="background:none;border:1px solid var(--border2);color:var(--text3);border-radius:6px;padding:3px 8px;font-size:10px;cursor:pointer;">'
          + (('Notification' in window && Notification.permission === 'granted') ? '&#x1F514; Bat' : '&#x1F515; Tat')
        + '</button>'
        + (unread.length ? '<button id="bell-read-all" style="background:none;border:none;color:var(--accent2);font-size:11px;cursor:pointer;font-weight:700;">Doc het</button>' : '')
      + '</div>'
    + '</div>'

    // Filter tabs
    + '<div style="display:flex;gap:0;border-bottom:1px solid var(--border);">'
      + '<button class="bell-tab active" data-tab="unread" style="flex:1;background:none;border:none;border-bottom:2px solid var(--accent2);color:var(--accent2);font-size:11px;font-weight:700;padding:8px;cursor:pointer;">Chua doc (' + unreadItems.length + ')</button>'
      + '<button class="bell-tab" data-tab="all" style="flex:1;background:none;border:none;border-bottom:2px solid transparent;color:var(--text3);font-size:11px;font-weight:700;padding:8px;cursor:pointer;">Tat ca (' + items.length + ')</button>'
    + '</div>'

    + '<div id="bell-list" style="max-height:380px;overflow-y:auto;">';

    // Render items
    function renderItem(item) {
      var meta  = _notifMeta(item.type);
      var isNew = item.status === 'unread';
      var levelBg = item.level === 'urgent' ? 'rgba(255,77,109,.08)' : item.level === 'warning' ? 'rgba(251,191,36,.06)' : 'transparent';
      return '<div class="bell-item-v2" data-id="' + _esc2(item.id) + '" data-link="' + _esc2(item.link||'') + '" '
        + 'style="display:flex;gap:10px;padding:11px 16px;cursor:pointer;border-bottom:1px solid var(--border);'
        + 'background:' + (isNew ? levelBg||'rgba(79,111,255,.05)' : 'transparent') + ';'
        + 'position:relative;transition:background .15s;">'
        // Icon circle
        + '<div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">' + meta.icon + '</div>'
        // Content
        + '<div style="flex:1;min-width:0;">'
          + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">'
            + '<div style="font-size:12px;font-weight:' + (isNew?'800':'600') + ';color:var(--text);line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;" title="' + _esc2(item.title) + '">' + _esc2(item.title) + '</div>'
            + '<div style="font-size:9px;color:var(--text3);white-space:nowrap;flex-shrink:0;">' + _fmtAgo(item.created_at) + '</div>'
          + '</div>'
          + (item.body ? '<div style="font-size:11px;color:var(--text3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + _esc2(item.body) + '">' + _esc2(item.body) + '</div>' : '')
          + '<div style="display:flex;gap:6px;margin-top:5px;align-items:center;">'
            + '<span style="font-size:9px;font-weight:800;color:' + meta.color + ';text-transform:uppercase;">' + meta.label + '</span>'
            + (item.level === 'urgent' ? '<span style="font-size:9px;background:rgba(255,77,109,.15);color:var(--red);border-radius:3px;padding:1px 5px;font-weight:800;">KHAN CAP</span>' : '')
            + (item.link ? '<span class="bell-goto" data-link="' + _esc2(item.link) + '" style="font-size:9px;color:var(--accent2);cursor:pointer;text-decoration:underline;">Xem &#x2192;</span>' : '')
          + '</div>'
        + '</div>'
        // Unread dot
        + (isNew ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--accent2);flex-shrink:0;margin-top:4px;"></div>' : '')
        // Dismiss btn
        + '<button class="bell-dismiss" data-id="' + _esc2(item.id) + '" style="position:absolute;top:8px;right:8px;background:none;border:none;color:var(--text3);font-size:12px;cursor:pointer;opacity:0;transition:opacity .2s;padding:2px 4px;" title="Xoa">&#x2715;</button>'
        + '</div>';
    }

    if (unreadItems.length === 0 && readItems.length === 0) {
      h += '<div style="text-align:center;padding:40px 20px;">'
        + '<div style="font-size:32px;margin-bottom:10px;">&#x1F514;</div>'
        + '<div style="font-size:13px;color:var(--text2);font-weight:700;">Khong co thong bao</div>'
        + '<div style="font-size:11px;color:var(--text3);margin-top:4px;">He thong se tu dong cap nhat khi co su kien moi</div>'
        + '</div>';
    } else {
      if (unreadItems.length) {
        h += '<div style="padding:6px 16px;font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;background:var(--bg3);">Chua doc</div>';
        unreadItems.forEach(function(item){ h += renderItem(item); });
      }
      if (readItems.length) {
        h += '<div style="padding:6px 16px;font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;background:var(--bg3);">Da doc</div>';
        readItems.forEach(function(item){ h += renderItem(item); });
      }
    }

    h += '</div>'
    // Footer
    + '<div style="padding:10px 16px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
      + '<div style="font-size:10px;color:var(--text3);" id="bell-last-sync">Cap nhat: ' + _fmtAgo(_notifSince) + '</div>'
      + '<button id="bell-clear-read" style="background:none;border:none;color:var(--text3);font-size:11px;cursor:pointer;">Xoa da doc</button>'
    + '</div>';

    el.innerHTML = h;
    _wireBellPanel();
  }

  function _wireBellPanel() {
    // Tabs
    document.querySelectorAll('.bell-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        var t = tab.getAttribute('data-tab');
        document.querySelectorAll('.bell-tab').forEach(function(b) {
          b.style.borderBottomColor = 'transparent';
          b.style.color = 'var(--text3)';
          b.classList.remove('active');
        });
        tab.style.borderBottomColor = 'var(--accent2)';
        tab.style.color = 'var(--accent2)';
        tab.classList.add('active');
        var list = document.getElementById('bell-list');
        if (!list) return;
        var items = _notifCache.filter(function(n){ return n.status !== 'dismissed'; });
        if (t === 'unread') items = items.filter(function(n){ return n.status === 'unread'; });
        list.innerHTML = '';
        if (!items.length) {
          list.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text3);font-size:12px;">Khong co thong bao</div>';
          return;
        }
        var frag = document.createDocumentFragment();
        items.slice(0,30).forEach(function(item){
          var tmp = document.createElement('div');
          var meta = _notifMeta(item.type);
          var isNew = item.status === 'unread';
          tmp.innerHTML = '<div class="bell-item-v2" data-id="'+_esc2(item.id)+'" data-link="'+_esc2(item.link||'')+'" '
            +'style="display:flex;gap:10px;padding:11px 16px;cursor:pointer;border-bottom:1px solid var(--border);background:'+(isNew?'rgba(79,111,255,.05)':'transparent')+';position:relative;">'
            +'<div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">'+meta.icon+'</div>'
            +'<div style="flex:1;min-width:0;">'
              +'<div style="font-size:12px;font-weight:'+(isNew?800:600)+';color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc2(item.title)+'</div>'
              +(item.body?'<div style="font-size:11px;color:var(--text3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc2(item.body)+'</div>':'')
              +'<div style="font-size:9px;color:var(--text3);margin-top:3px;">'+_fmtAgo(item.created_at)+'</div>'
            +'</div>'
            +(isNew?'<div style="width:8px;height:8px;border-radius:50%;background:var(--accent2);flex-shrink:0;margin-top:4px;"></div>':'')
            +'</div>';
          frag.appendChild(tmp.firstChild);
        });
        list.appendChild(frag);
        _wireBellItems(list);
      });
    });

    // Browser perm
    var permBtn = document.getElementById('bell-perm-btn');
    if (permBtn) {
      permBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        _requestBrowserPerm(function(granted) {
          permBtn.innerHTML = granted ? '&#x1F514; Bat' : '&#x1F515; Tat';
          if (granted) _showToast('Da bat thong bao trinh duyet!');
          else _showToast('Trinh duyet tu choi. Vao Settings de cho phep.');
        });
      });
    }

    // Mark all read
    var readAllBtn = document.getElementById('bell-read-all');
    if (readAllBtn) {
      readAllBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var ids = _notifCache.filter(function(n){ return n.status==='unread'; }).map(function(n){ return n.id; });
        _notifCache.forEach(function(n){ if(n.status==='unread') n.status='read'; });
        _saveToLS(); _updateBellBadge(); _refreshBellPanel();
        var apiF = typeof window.api === 'function' ? window.api : null;
        if (apiF) apiF('notif_mark_read', { ids:ids }, function(){});
      });
    }

    // Clear read
    var clearBtn = document.getElementById('bell-clear-read');
    if (clearBtn) {
      clearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        _notifCache = _notifCache.filter(function(n){ return n.status !== 'read'; });
        _saveToLS(); _refreshBellPanel();
      });
    }

    // Wire item list
    _wireBellItems(document.getElementById('bell-list'));
  }

  function _wireBellItems(container) {
    if (!container) return;
    // Click item → mark read + navigate
    container.querySelectorAll('.bell-item-v2').forEach(function(el) {
      el.addEventListener('click', function(e) {
        if (e.target.classList.contains('bell-dismiss') || e.target.classList.contains('bell-goto')) return;
        var id   = el.getAttribute('data-id');
        var link = el.getAttribute('data-link');
        // Mark read
        for (var i=0; i<_notifCache.length; i++) {
          if (_notifCache[i].id === id) { _notifCache[i].status = 'read'; break; }
        }
        _saveToLS(); _updateBellBadge(); _refreshBellPanel();
        var apiF = typeof window.api === 'function' ? window.api : null;
        if (apiF) apiF('notif_mark_read', { ids:[id] }, function(){});
        if (link) { _navigateTo(link); document.getElementById('mmn-bell-panel') && document.getElementById('mmn-bell-panel').classList.remove('open'); }
      });
      // Hover show dismiss
      el.addEventListener('mouseenter', function() {
        var d = el.querySelector('.bell-dismiss'); if(d) d.style.opacity='1';
      });
      el.addEventListener('mouseleave', function() {
        var d = el.querySelector('.bell-dismiss'); if(d) d.style.opacity='0';
      });
    });

    // Goto links
    container.querySelectorAll('.bell-goto').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        _navigateTo(el.getAttribute('data-link'));
        document.getElementById('mmn-bell-panel') && document.getElementById('mmn-bell-panel').classList.remove('open');
      });
    });

    // Dismiss
    container.querySelectorAll('.bell-dismiss').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        _notifCache = _notifCache.filter(function(n){ return n.id !== id; });
        _saveToLS(); _updateBellBadge(); _refreshBellPanel();
        var apiF = typeof window.api === 'function' ? window.api : null;
        if (apiF) apiF('notif_dismiss', { id:id }, function(){});
      });
    });
  }

  // ── Bell button events ────────────────────────────────────────────
  function _bindBellEvents() {
    var btn   = document.getElementById('mmn-bell-btn');
    var panel = document.getElementById('mmn-bell-panel');
    if (!btn || !panel) return;

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = panel.classList.toggle('open');
      if (isOpen) {
        _refreshBellPanel();
        // Mark visible unread as read after 3s
        setTimeout(function() {
          var unread = _notifCache.filter(function(n){ return n.status==='unread'; });
          if (!unread.length) return;
          // Chỉ auto-read level info
          var infoIds = unread.filter(function(n){ return n.level==='info'; }).map(function(n){ return n.id; });
          infoIds.forEach(function(id){
            for(var i=0; i<_notifCache.length; i++){
              if(_notifCache[i].id===id) { _notifCache[i].status='read'; break; }
            }
          });
          if (infoIds.length) {
            _saveToLS(); _updateBellBadge(); _refreshBellPanel();
            var apiF = typeof window.api === 'function' ? window.api : null;
            if (apiF) apiF('notif_mark_read', {ids:infoIds}, function(){});
          }
        }, 3000);
      }
    });
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#mmn-bell-btn') && !e.target.closest('#mmn-bell-panel')) {
        panel.classList.remove('open');
      }
    });

    // Start polling
    _notifStartPolling();
    // Request permission nếu chưa có
    if ('Notification' in window && Notification.permission === 'granted') {
      _notifPerm = true;
    }
  }

  // ── Public API ────────────────────────────────────────────────────
  // Cho phép module khác push notification
  window.skNotify = function(text, type, opts) {
    opts = opts || {};
    var item = {
      id         : 'local-' + Date.now(),
      type       : type || 'system',
      title      : text,
      body       : opts.body || '',
      link       : opts.link || '',
      level      : opts.level || 'info',
      status     : 'unread',
      created_at : new Date().toISOString()
    };
    _notifCache.unshift(item);
    _saveToLS();
    _updateBellBadge();
    var panel = document.getElementById('mmn-bell-panel');
    if (panel && panel.classList.contains('open')) _refreshBellPanel();
    if (item.level === 'urgent' || item.level === 'warning') _pushBrowserNotif(item);
    _showToast(text, opts.toastType || 'ok');
  };

  // Force poll ngay lập tức
  window.skNotifPoll = _notifPoll;

  function _esc2(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }




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
