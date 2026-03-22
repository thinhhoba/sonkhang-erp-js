/* ================================================================
// [v5.23] 22/03/2026 — Sapo Full Sync: pagination all modules, batch UI
 * sk-sapo-sync-ui.js  SonKhang ERP v5.4.0
 * UI: Sapo Realtime Sync Dashboard
 * 21/03/2026 — 0 non-ASCII, DOM API
 * ================================================================ */
(function () {
  'use strict';

  var _api   = function(){ return typeof window.api==='function'?window.api:null; };
  var _ct    = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
  var _fmt   = function(n){ return (Number(n)||0).toLocaleString('vi-VN'); };
  var _esc   = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };

  var _pollInterval = null;
  var _lastSyncCount = 0;

  // ── Main UI ─────────────────────────────────────────────────────
  function loadSapoSync() {
    var ct = _ct(); if (!ct) return;
    ct.innerHTML = '<div class="fade-in" style="padding:24px;max-width:800px;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px;">'
      + '<div><h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F504; Sapo Realtime Sync</h1>'
      + '<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Dong bo tu dong · Thong bao don moi · Trigger GAS</p></div>'
      + '<div style="display:flex;gap:8px;">'
      + '<button id="ss-notify-btn" style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.2);color:var(--yellow);border-radius:10px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F514; Bat thong bao</button>'      + '<button id="ss-manual-btn" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:10px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x25B6; Sync ngay</button>'
      + '<button id="ss-reset-btn" style="background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.2);color:var(--red);border-radius:10px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x21BA; Reset</button>'
      + '</div></div>'

      // Status card
      + '<div id="ss-status-card" style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:16px;">'
      + '<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai trang thai...</div>'
      + '</div>'

      // San pham sync section
      + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:16px;">'      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'      + '<div style="font-size:13px;font-weight:900;">&#x1F4E6; San pham tu Sapo</div>'      + '<div id="ss-prod-status" style="font-size:11px;color:var(--text3);">Chua sync</div>'      + '</div>'      + '<div style="display:flex;gap:8px;">'      + '<button id="ss-sync-prod-btn" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F504; San pham</button>'      + '<button id="ss-sync-cat-btn" style="background:rgba(79,111,255,.1);border:1px solid rgba(79,111,255,.2);color:var(--accent2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F333; Danh muc</button>'      + '<button id="ss-sync-brand-btn" style="background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.2);color:#a78bfa;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F3F7; Thuong hieu</button>'      + '<button id="ss-sync-prod-all-btn" style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);color:var(--yellow);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x21BA; Toan bo</button>'      + '</div></div>'
      // Trigger setup
      + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:16px;">'
      + '<div style="font-size:13px;font-weight:900;margin-bottom:12px;">&#x23F1; Auto Trigger</div>'
      + '<p style="font-size:12px;color:var(--text3);margin:0 0 12px;">Khi bat trigger, GAS tu dong chay sapoAutoSync() moi 5 phut. Don moi tu Sapo se duoc dong bo vao ERP va gui email thong bao.</p>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button id="ss-start-trigger" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x25B6; Bat trigger (5 phut)</button>'
      + '<button id="ss-stop-trigger" style="background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.2);color:var(--red);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x25A0; Tat trigger</button>'
      + '<button id="ss-debug-btn" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F50D; Debug</button>'
      + '</div></div>'

      // [v5.23] Full Sync Modules panel
      + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:16px;">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">'
          + '<div style="font-size:13px;font-weight:900;">&#x1F5C4; Full Sync Module</div>'
          + '<div id="ss-full-status" style="font-size:10px;color:var(--text3);">Chua sync</div>'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;">'
          + _buildModuleBtn('ss-btn-customers',   '&#x1F465;', 'Khach hang',      'sapo_sync_customers')
          + _buildModuleBtn('ss-btn-inventory',   '&#x1F4CA;', 'Ton kho',          'sapo_sync_inventory')
          + _buildModuleBtn('ss-btn-suppliers',   '&#x1F3ED;', 'Nha cung cap',    'sapo_sync_suppliers')
          + _buildModuleBtn('ss-btn-po',          '&#x1F4C4;', 'Purchase Orders', 'sapo_sync_purchase_orders')
          + _buildModuleBtn('ss-btn-price',       '&#x1F4B2;', 'Bang gia',         'sapo_sync_price_rules')
          + _buildModuleBtn('ss-btn-fulfill',     '&#x1F69A;', 'Fulfillments',    'sapo_sync_fulfillments')
          + _buildModuleBtn('ss-btn-ledger',      '&#x1F4D2;', 'Ledger Entries',  'sapo_sync_ledger')
          + _buildModuleBtn('ss-btn-transfers',   '&#x1F504;', 'Transfers',        'sapo_sync_transfers')
          + _buildModuleBtn('ss-btn-draft',       '&#x1F4DD;', 'Draft Orders',    'sapo_sync_draft_orders')
          + _buildModuleBtn('ss-btn-locations',   '&#x1F4CD;', 'Locations',        'sapo_sync_locations')
        + '</div>'
        + '<div id="ss-module-log" style="margin-top:10px;font-size:11px;color:var(--text3);min-height:20px;"></div>'
      + '</div>'

      // Recent synced
      + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:20px;">'
      + '<div style="font-size:13px;font-weight:900;margin-bottom:12px;">&#x1F4CB; Don hang vua dong bo</div>'
      + '<div id="ss-recent-orders"><div style="text-align:center;padding:16px;color:var(--text3);font-size:12px;">Dong bo de hien thi don moi</div></div>'
      + '</div>'
      + '</div>';

    // Bind buttons
    var notifyBtn = document.getElementById('ss-notify-btn');
    if (notifyBtn) {
      notifyBtn.addEventListener('click', function() {
        _requestNotifyPermission(function(granted) {
          if (granted) {
            notifyBtn.style.color = 'var(--green)';
            notifyBtn.innerHTML = '&#x1F514; Thong bao bat';
            _toast('Da bat thong bao trinh duyet!','ok');
            _pushBrowserNotification('SonKhang ERP','Thong bao don hang Sapo se hien thi o day',null);
          } else {
            notifyBtn.style.color = 'var(--red)';
            _toast('Trinh duyet tu choi thong bao. Vui long cho phep trong Settings.','error');
          }
        });
      });
      // Cap nhat trang thai ban dau
      if ('Notification' in window && Notification.permission === 'granted') {
        notifyBtn.style.color = 'var(--green)';
        notifyBtn.innerHTML = '&#x1F514; Thong bao bat';
      }
    }
    document.getElementById('ss-manual-btn').addEventListener('click', _manualSync);
    // Product sync buttons
    var spBtn = document.getElementById('ss-sync-prod-btn');
    if (spBtn) spBtn.addEventListener('click', function(){ _syncProducts(false); });
    var catBtn = document.getElementById('ss-sync-cat-btn');
    if (catBtn) catBtn.addEventListener('click', function(){ _syncMeta('sapo_sync_categories','ss-sync-cat-btn','&#x1F333; Danh muc'); });
    var brandBtn = document.getElementById('ss-sync-brand-btn');
    if (brandBtn) brandBtn.addEventListener('click', function(){ _syncMeta('sapo_sync_brands','ss-sync-brand-btn','&#x1F3F7; Thuong hieu'); });
    var spAllBtn = document.getElementById('ss-sync-prod-all-btn');
    if (spAllBtn) spAllBtn.addEventListener('click', function(){ _syncAll(); });
    document.getElementById('ss-reset-btn').addEventListener('click', _resetSync);
    document.getElementById('ss-start-trigger').addEventListener('click', _startTrigger);
    document.getElementById('ss-stop-trigger').addEventListener('click', _stopTrigger);
    document.getElementById('ss-debug-btn').addEventListener('click', _showDebug);

    // Load status + start polling
    _loadStatus();
    _renderModuleStatus();
    _renderSyncLog();
    _startPolling();
  }

  // ── Full Sync Dashboard ────────────────────────────────────────
  // Thêm tab "Modules" vào loadSapoSync
  var _MODULE_INFO = {
    'customers'       :{ icon:'&#x1F465;', label:'Khach hang',     interval:'5 phut'  },
    'inventory'       :{ icon:'&#x1F4E6;', label:'Ton kho',        interval:'1 phut'  },
    'suppliers'       :{ icon:'&#x1F3ED;', label:'Nha cung cap',   interval:'30 phut' },
    'purchase_orders' :{ icon:'&#x1F4C4;', label:'Don nhap hang',  interval:'10 phut' },
    'price_rules'     :{ icon:'&#x1F4B9;', label:'Chiet khau KM',  interval:'15 phut' },
    'ledger_entries'  :{ icon:'&#x1F4B5;', label:'So quy Sapo',    interval:'5 phut'  },
    'fulfillments'    :{ icon:'&#x1F69A;', label:'Giao hang',      interval:'1 phut'  },
    'transfers'       :{ icon:'&#x1F4E4;', label:'Chuyen kho',     interval:'10 phut' },
    'draft_orders'    :{ icon:'&#x1F4DD;', label:'Don hang nhap',  interval:'5 phut'  },
    'locations'       :{ icon:'&#x1F4CD;', label:'Chi nhanh',      interval:'60 phut' },
  };

  function _renderModuleStatus() {
    var el = document.getElementById('ss-module-grid');
    if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:12px;color:var(--text3);font-size:11px;">Dang tai...</div>';
    var apiF = _api(); if (!apiF) return;
    apiF('sapo_get_module_status', {}, function(e, d) {
      if (e||!d||!d.ok) { el.innerHTML='<div style="color:var(--red);padding:12px;">Loi</div>'; return; }
      var mods = d.modules || {};
      var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;">';
      Object.keys(mods).forEach(function(key) {
        var m    = mods[key];
        var info = _MODULE_INFO[key] || { icon:'&#x1F504;', label:key };
        var isDue = m.is_due;
        var c    = isDue ? 'var(--yellow)' : 'var(--green)';
        html += '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:10px;">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'
          + '<span style="font-size:12px;">' + info.icon + ' <strong>' + info.label + '</strong></span>'
          + '<span style="font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700;background:rgba(0,0,0,.1);color:'+c+';">'
          + (isDue ? 'Cho sync' : 'OK') + '</span></div>'
          + '<div style="font-size:10px;color:var(--text3);">' + m.last_sync_ago + '</div>'
          + '<div style="font-size:10px;color:var(--text3);">Interval: ' + info.interval + '</div>'
          + '<button data-sync-module="'+key+'" style="margin-top:6px;width:100%;background:rgba(79,111,255,.1);border:1px solid rgba(79,111,255,.2);border-radius:6px;padding:4px;font-size:10px;font-weight:700;cursor:pointer;color:var(--accent2);font-family:inherit;">Sync ngay</button>'
          + '</div>';
      });
      html += '</div>';
      el.innerHTML = html;

      el.querySelectorAll('[data-sync-module]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var mod = btn.getAttribute('data-sync-module');
          btn.disabled = true; btn.textContent = 'Dang sync...';
          var apiF2 = _api();
          apiF2('sapo_full_sync_module', { module:mod }, function(e2,d2) {
            btn.disabled = false;
            btn.textContent = 'Sync ngay';
            if (!e2&&d2&&d2.ok) {
              _toast((d2.msg||'Sync xong: '+mod), 'ok');
              _renderModuleStatus();
            } else {
              _toast((d2&&d2.error)||'Loi sync '+mod, 'error');
            }
          });
        });
      });
    });
  }

  function _renderSyncLog() {
    var el = document.getElementById('ss-log-body');
    if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:12px;color:var(--text3);">Dang tai log...</div>';
    var apiF = _api(); if (!apiF) return;
    apiF('sapo_get_sync_log', { limit:50 }, function(e, d) {
      if (e||!d||!d.ok) { el.innerHTML=''; return; }
      var rows = d.data || [];
      if (!rows.length) { el.innerHTML='<div style="text-align:center;padding:16px;color:var(--text3);">Chua co log</div>'; return; }
      var html = '<div style="border-radius:8px;border:1px solid var(--border);overflow:hidden;">'
        + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
        + '<thead><tr style="background:var(--bg3);">'
        + '<th style="padding:6px 10px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Thoi gian</th>'
        + '<th style="padding:6px 10px;text-align:left;">Module</th>'
        + '<th style="padding:6px 10px;text-align:center;">TT</th>'
        + '<th style="padding:6px 10px;text-align:right;">Ban ghi</th>'
        + '<th style="padding:6px 10px;text-align:left;">Ghi chu</th>'
        + '</tr></thead><tbody>';
      rows.forEach(function(r) {
        var sc = r.status === 'ok' ? 'var(--green)' : (r.status === 'error' ? 'var(--red)' : 'var(--yellow)');
        html += '<tr style="border-top:1px solid var(--border);">'
          + '<td style="padding:5px 10px;color:var(--text3);white-space:nowrap;">' + r.time + '</td>'
          + '<td style="padding:5px 10px;font-weight:700;">' + r.module + '</td>'
          + '<td style="padding:5px 10px;text-align:center;"><span style="color:'+sc+';font-weight:800;">' + r.status.toUpperCase() + '</span></td>'
          + '<td style="padding:5px 10px;text-align:right;">' + r.count + '</td>'
          + '<td style="padding:5px 10px;color:var(--text3);">' + r.note + '</td>'
          + '</tr>';
      });
      html += '</tbody></table></div>';
      el.innerHTML = html;
    });
  }


    window.loadSapoSync = loadSapoSync;

  // ── Product Sync ─────────────────────────────────────────────
  function _syncMeta(route, btnId, label) {
    var btn = document.getElementById(btnId);
    if (btn) { btn.disabled=true; btn.textContent='Dang sync...'; }
    var apiF = _api(); if (!apiF) return;
    apiF(route, {}, function(e,d){
      if (btn) { btn.disabled=false; btn.innerHTML=label; }
      if (e||!d||!d.ok) { _toast((d&&d.error)||'Loi sync','error'); return; }
      _toast(d.msg||'Sync xong','ok');
    });
  }

  function _syncAll() {
    var btn = document.getElementById('ss-sync-prod-all-btn');
    if (btn) { btn.disabled=true; btn.textContent='Dang sync...'; }
    var apiF = _api(); if (!apiF) return;
    apiF('sapo_sync_all_extended', {}, function(e,d){
      if (btn) { btn.disabled=false; btn.innerHTML='&#x21BA; Toan bo'; }
      if (e||!d||!d.ok) { _toast((d&&d.error)||'Loi','error'); return; }
      _toast(d.msg||'Sync xong','ok'); _loadStatus();
    });
  }

  function _syncProducts(resetAll) {
    var btnId = resetAll ? 'ss-sync-prod-all-btn' : 'ss-sync-prod-btn';
    var btn   = document.getElementById(btnId);
    if (btn) { btn.disabled=true; btn.textContent='Dang sync...'; }
    var apiF = _api(); if (!apiF) return;
    var route = resetAll ? 'sapo_sync_products_full' : 'sapo_sync_products_full';
    apiF(route, {}, function(e,d){
      if (btn) { btn.disabled=false; btn.innerHTML = resetAll ? '&#x21BA; Sync lai toan bo' : '&#x1F504; Sync san pham'; }
      if (e||!d||!d.ok) { _toast((d&&d.error)||'Loi sync san pham','error'); return; }
      _toast(d.msg||'Sync xong','ok');
      _updateProdStatus(d);
    });
  }

  function _updateProdStatus(d) {
    var el = document.getElementById('ss-prod-status'); if (!el) return;
    if (!d) return;
    el.style.color = 'var(--green)';
    el.textContent = (d.created||0) + ' moi · ' + (d.updated||0) + ' cap nhat · ' + (d.errors||0) + ' loi';
  }

  // ── Status ───────────────────────────────────────────────────────
  function _loadStatus() {
    var apiF = _api(); if (!apiF) return;
    apiF('sapo_get_sync_status', {}, function(e,d){
      if (e||!d||!d.ok) return;
      _renderStatus(d);

      // Hien thong bao neu co don moi
      var newOrders = d.new_orders || [];
      if (newOrders.length > 0) {
        _showNewOrdersNotification(newOrders);
        _renderRecentOrders(newOrders);
      }
    });
  }

  function _renderStatus(d) {
    var card = document.getElementById('ss-status-card'); if (!card) return;
    var triggerActive = d.trigger_active;
    var triggerColor  = triggerActive ? 'var(--green)' : 'var(--text3)';
    var triggerIcon   = triggerActive ? '&#x1F7E2;' : '&#x26AA;';
    var lastSync      = d.last_sync_time ? _fmtTime(d.last_sync_time) : 'Chua sync';
    var statusObj     = d.status || {};

    card.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">'
      + _statBox(triggerIcon+' Trigger',
          triggerActive ? 'Dang chay (5 phut)' : 'Chua bat',
          triggerColor)
      + _statBox('&#x23F0; Lan cuoi sync', lastSync, 'var(--text2)')
      + _statBox('&#x1F4E6; Don da sync',
          _fmt(d.last_sync_count) + ' don',
          'var(--cyan)')
      + _statBox('&#x1F194; Last order ID',
          d.last_order_id || '0',
          'var(--text3)')
      + '</div>'
      + (statusObj.msg ? '<div style="margin-top:12px;padding:10px 14px;background:'+(statusObj.status==='error'?'rgba(255,77,109,.08)':'rgba(0,214,143,.06)')+';border-radius:8px;font-size:11px;color:'+(statusObj.status==='error'?'var(--red)':'var(--green')+');">'
          + (statusObj.status==='error'?'&#x26A0; ':'&#x2705; ') + _esc(statusObj.msg) + '</div>'
        : '');
  }

  function _statBox(label, val, color) {
    return '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center;">'
      + '<div style="font-size:14px;font-weight:900;color:'+color+';">'+val+'</div>'
      + '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);margin-top:3px;">'+label+'</div>'
      + '</div>';
  }

  function _renderRecentOrders(orders) {
    var el = document.getElementById('ss-recent-orders'); if (!el) return;
    if (!orders.length) return;
    var html = '<div style="border-radius:10px;border:1px solid var(--border);overflow:hidden;">'
      + '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
      + '<thead><tr style="background:var(--bg3);">'
      + '<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma don</th>'
      + '<th style="padding:8px 12px;text-align:left;">Khach hang</th>'
      + '<th style="padding:8px 12px;text-align:right;">Tong tien</th>'
      + '</tr></thead><tbody>';
    orders.forEach(function(o){
      html += '<tr style="border-top:1px solid var(--border);">'
        + '<td style="padding:8px 12px;font-family:monospace;color:var(--accent2);">'+_esc(o.code||o.id)+'</td>'
        + '<td style="padding:8px 12px;font-weight:700;">'+_esc(o.khach)+'</td>'
        + '<td style="padding:8px 12px;text-align:right;color:var(--green);">'+_fmt(o.tong)+'d</td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
  }

  // ── Browser Push Notification ───────────────────────────────────
  // Web Notification API (khong can server, chay tu browser)
  // Request permission mot lan → hien thong bao native khi co don moi

  function _requestNotifyPermission(cb) {
    if (!('Notification' in window)) { if(cb) cb(false); return; }
    if (Notification.permission === 'granted')   { if(cb) cb(true);  return; }
    if (Notification.permission === 'denied')    { if(cb) cb(false); return; }
    Notification.requestPermission(function(perm) {
      if(cb) cb(perm === 'granted');
    });
  }

  function _pushBrowserNotification(title, body, onClick) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      var n = new Notification(title, {
        body : body,
        icon : 'https://erp.sonkhang.vn/favicon.ico',
        tag  : 'sapo-new-order',  // tag giong nhau → thay the thong bao cu
        requireInteraction: false
      });
      n.onclick = function() {
        window.focus();
        if (typeof onClick === 'function') onClick();
        n.close();
      };
      // Tu dong dong sau 8s
      setTimeout(function(){ try{ n.close(); } catch(e){} }, 8000);
    } catch(e) {
      // Fallback: toast
      _toast(title + ': ' + body, 'ok');
    }
  }

  // ── Polling moi 30s ──────────────────────────────────────────────
  function _startPolling() {
    _stopPolling();
    _pollInterval = setInterval(function(){
      var apiF = _api(); if (!apiF) return;
      apiF('sapo_get_sync_status', {}, function(e,d){
        if (e||!d||!d.ok) return;
        _renderStatus(d);
        var newOrders = d.new_orders || [];
        if (newOrders.length > 0) {
          _showNewOrdersNotification(newOrders);
          _renderRecentOrders(newOrders);
        }
      });
    }, 30000); // 30s
  }

  function _stopPolling() {
    if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; }
  }

  // ── Notification toast cho don moi ──────────────────────────────
  function _showNewOrdersNotification(orders) {
    var count = orders.length;
    var msg   = count + ' don hang moi tu Sapo: ' + orders.map(function(o){ return o.code; }).join(', ');
    _toast(msg, 'ok');

    // Hien notification banner
    var existing = document.getElementById('sapo-new-order-banner');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var banner = document.createElement('div');
    banner.id = 'sapo-new-order-banner';
    banner.style.cssText = 'position:fixed;top:64px;right:16px;z-index:9990;max-width:320px;'
      + 'background:rgba(0,214,143,.12);border:1px solid rgba(0,214,143,.4);border-radius:12px;'
      + 'padding:14px 16px;box-shadow:0 8px 24px rgba(0,0,0,.4);';
    banner.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
      + '<div style="font-size:13px;font-weight:900;color:var(--green);">&#x1F6D2; '+count+' don moi tu Sapo</div>'
      + '<button id="banner-close" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px;line-height:1;">&#x00D7;</button>'
      + '</div>'
      + '<div style="font-size:11px;color:var(--text2);">'+orders.slice(0,3).map(function(o){ return _esc(o.code)+' - '+_esc(o.khach); }).join('<br>')
      + (count>3 ? '<br>+' + (count-3) + ' don khac...' : '')
      + '</div>'
      + '<button id="banner-view-btn" style="margin-top:8px;width:100%;background:rgba(0,214,143,.2);border:1px solid rgba(0,214,143,.3);border-radius:8px;padding:6px;font-size:11px;font-weight:700;cursor:pointer;color:var(--green);font-family:inherit;">Xem don hang</button>';

    document.body.appendChild(banner);
    document.getElementById('banner-close').addEventListener('click', function(){
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    });
    document.getElementById('banner-view-btn').addEventListener('click', function(){
      if (typeof window.skLoad === 'function') window.skLoad('don-hang');
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    });

    // Auto dismiss sau 15s
    setTimeout(function(){
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 15000);
  }

  // ── Actions ──────────────────────────────────────────────────────
  function _manualSync() {
    var btn = document.getElementById('ss-manual-btn');
    if (btn) { btn.disabled=true; btn.textContent='Dang sync...'; }
    var apiF = _api(); if (!apiF) return;
    apiF('sapo_manual_sync', {}, function(e,d){
      if (btn) { btn.disabled=false; btn.innerHTML='&#x25B6; Sync ngay'; }
      if (e||!d||!d.ok) { _toast((d&&d.error)||'Loi sync','error'); return; }
      _toast(d.msg + ' (' + d.last_sync_count + ' don)', 'ok');
      _loadStatus();
    });
  }

  function _resetSync() {
    if (!confirm('Reset sync state? Lan sync tiep theo se lay lai tat ca don.')) return;
    var apiF = _api(); if (!apiF) return;
    apiF('sapo_reset_sync', {}, function(e,d){
      if (!e&&d&&d.ok) { _toast(d.msg,'ok'); _loadStatus(); }
    });
  }

  function _startTrigger() {
    var btn = document.getElementById('ss-start-trigger');
    if (btn) { btn.disabled=true; btn.textContent='Dang bat...'; }
    var apiF = _api(); if (!apiF) return;
    apiF('sapo_setup_trigger', {}, function(e,d){
      if (btn) { btn.disabled=false; btn.innerHTML='&#x25B6; Bat trigger (5 phut)'; }
      if (!e&&d&&d.ok) { _toast(d.msg,'ok'); _loadStatus(); }
      else _toast((d&&d.error)||'Loi','error');
    });
  }

  function _stopTrigger() {
    var apiF = _api(); if (!apiF) return;
    apiF('sapo_remove_trigger', {}, function(e,d){
      if (!e&&d&&d.ok) { _toast('Da tat auto trigger','ok'); _loadStatus(); }
    });
  }

  function _showDebug() {
    var apiF = _api(); if (!apiF) return;
    apiF('sapo_sync_debug', {}, function(e,d){
      if (e||!d||!d.ok) return;
      var msg = Object.keys(d).filter(function(k){ return k!=='ok'; }).map(function(k){ return k+': '+d[k]; }).join('\n');
      alert('SAPO SYNC DEBUG\n\n' + msg);
    });
  }

  function _fmtTime(iso) {
    if (!iso) return '--';
    try {
      var d = new Date(iso);
      return d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear()+' '+d.getHours()+':'+String(d.getMinutes()).padStart(2,'0');
    } catch(e) { return iso.substring(0,16); }
  }

  // Cleanup khi rời trang
  window.addEventListener('beforeunload', _stopPolling);

  // Global: start polling khi ERP load (moi 30s check don moi)
  window._sapoStartGlobalPoll = function() {
    if (_pollInterval) return;
    _startPolling();
  };

  // Auto-start global polling khi sk-sapo-sync-ui.js load
  setTimeout(function(){
    var apiF = _api();
    if (!apiF) return;
    // Check silently moi 30s - hien banner neu co don moi
    setInterval(function(){
      apiF('sapo_get_sync_status', {}, function(e,d){
        if (e||!d||!d.ok) return;
        var newOrders = d.new_orders || [];
        if (newOrders.length > 0) {
          _showNewOrdersNotification(newOrders);
          // Browser push notification
          _pushBrowserNotification(
            'SonKhang ERP - ' + newOrders.length + ' don moi',
            newOrders.slice(0,3).map(function(o){ return o.code + ' - ' + o.khach; }).join(', ')
              + (newOrders.length > 3 ? ' (+' + (newOrders.length-3) + ')' : ''),
            function(){ if(typeof window.skLoad==='function') window.skLoad('don-hang'); }
          );
        }
      });
    }, 30000);
  }, 5000); // Bat dau sau 5s khi page load xong


  // ── [v5.23] Module Sync helpers ──────────────────────────────────

  function _buildModuleBtn(id, icon, label, route) {
    return '<button id="' + id + '" data-route="' + route + '" '
      + 'style="display:flex;align-items:center;gap:8px;background:var(--bg3);'
      + 'border:1px solid var(--border2);color:var(--text2);border-radius:10px;'
      + 'padding:9px 12px;font-size:11px;font-weight:700;cursor:pointer;'
      + 'font-family:inherit;transition:all .15s;text-align:left;">'
      + '<span style="font-size:16px;">' + icon + '</span>'
      + '<span>' + label + '</span>'
      + '</button>';
  }

  function _bindModuleButtons() {
    document.querySelectorAll('[data-route]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var route = btn.getAttribute('data-route');
        var label = btn.textContent.trim().slice(0,30);
        var apiF  = _api(); if (!apiF) return;
        var log   = document.getElementById('ss-module-log');
        var fstEl = document.getElementById('ss-full-status');

        btn.disabled = true;
        btn.style.opacity = '.5';
        if (log)   log.textContent = 'Dang dong bo: ' + label + '...';
        if (fstEl) fstEl.textContent = 'Dang chay...';

        apiF(route, {}, function(e, d) {
          btn.disabled = false;
          btn.style.opacity = '1';
          var msg = (!e && d && d.ok)
            ? ('✅ ' + label + ': ' + (d.msg || 'Xong'))
            : ('❌ ' + label + ': ' + ((d && d.error) || 'Loi'));
          if (log)   log.textContent = msg;
          if (fstEl) fstEl.textContent = new Date().toLocaleTimeString('vi-VN');
          if (typeof window.skToast === 'function') {
            window.skToast(msg, (!e && d && d.ok) ? 'ok' : 'error');
          }
        });
      });
    });
  }

  // Patch loadSapoSync để gọi _bindModuleButtons sau render
  var _origLoadSapoSync = window.loadSapoSync;
  window.loadSapoSync = function() {
    if (typeof _origLoadSapoSync === 'function') _origLoadSapoSync();
    setTimeout(_bindModuleButtons, 100);
  };

})();
