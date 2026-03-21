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


  // ── Notification bell data (local mock — sẽ được replace bằng GAS polling sau) ──
  var _notifications = [
    { id:1, type:'order',    text:'Don hang moi tu Sapo #SO0231',  time:'2 phut',  read:false },
    { id:2, type:'leave',    text:'Nguyen Van A xin nghi phep 25/03', time:'15 phut', read:false },
    { id:3, type:'vehicle',  text:'Xe 51G-12345 da hoan thanh chuyen', time:'1 gio',  read:true  },
    { id:4, type:'payroll',  text:'Luong thang 3 da duoc duyet',   time:'2 gio',   read:true  },
  ];

  /* ================================================================
   * 4. NOTIFICATION BELL
   * ================================================================ */
  function buildBellPanel() {
    var unread = _notifications.filter(function(n){ return !n.read; }).length;
    var html = '<div class="bell-header">'
      + '<span class="bell-title">Thong bao</span>'
      + (unread ? '<span class="bell-unread">' + unread + ' moi</span>' : '')
      + '</div><div class="bell-list">';
    _notifications.forEach(function(n) {
      var icons = { order:'&#x1F6D2;', leave:'&#x1F4C5;', vehicle:'&#x1F69B;', payroll:'&#x1F4B5;' };
      html += '<div class="bell-item' + (n.read ? '' : ' unread') + '" data-id="' + n.id + '">'
        + '<span class="bell-icon">' + (icons[n.type] || '&#x1F514;') + '</span>'
        + '<div class="bell-body">'
        + '<div class="bell-text">' + n.text + '</div>'
        + '<div class="bell-time">' + n.time + ' truoc</div>'
        + '</div>'
        + (n.read ? '' : '<span class="bell-dot"></span>')
        + '</div>';
    });
    html += '</div><button class="bell-all" onclick="_skMarkAllRead()">Danh dau tat ca da doc</button>';
    return html;
  }

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

    // Bell items click → mark read
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
    _bindBellEvents();
    _updateBellBadge();
  }

  // API công khai để các module khác push thông báo vào bell
  window.skNotify = function(text, type) {
    _notifications.unshift({ id:Date.now(), type:type||'info', text:text, time:'vua xong', read:false });
    _updateBellBadge();
    _showToast(text);
  };

  window._skMarkAllRead = function() {
    _notifications.forEach(function(n){ n.read = true; });
    _refreshBellPanel();
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
