/* ================================================================
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
      + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:16px;">'      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'      + '<div style="font-size:13px;font-weight:900;">&#x1F4E6; San pham tu Sapo</div>'      + '<div id="ss-prod-status" style="font-size:11px;color:var(--text3);">Chua sync</div>'      + '</div>'      + '<div style="display:flex;gap:8px;">'      + '<button id="ss-sync-prod-btn" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F504; Sync san pham</button>'      + '<button id="ss-sync-prod-all-btn" style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);color:var(--yellow);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x21BA; Sync lai toan bo</button>'      + '</div></div>'
      // Trigger setup
      + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:16px;">'
      + '<div style="font-size:13px;font-weight:900;margin-bottom:12px;">&#x23F1; Auto Trigger</div>'
      + '<p style="font-size:12px;color:var(--text3);margin:0 0 12px;">Khi bat trigger, GAS tu dong chay sapoAutoSync() moi 5 phut. Don moi tu Sapo se duoc dong bo vao ERP va gui email thong bao.</p>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      + '<button id="ss-start-trigger" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x25B6; Bat trigger (5 phut)</button>'
      + '<button id="ss-stop-trigger" style="background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.2);color:var(--red);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x25A0; Tat trigger</button>'
      + '<button id="ss-debug-btn" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F50D; Debug</button>'
      + '</div></div>'

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
    var spAllBtn = document.getElementById('ss-sync-prod-all-btn');
    if (spAllBtn) spAllBtn.addEventListener('click', function(){ _syncProducts(true); });
    document.getElementById('ss-reset-btn').addEventListener('click', _resetSync);
    document.getElementById('ss-start-trigger').addEventListener('click', _startTrigger);
    document.getElementById('ss-stop-trigger').addEventListener('click', _stopTrigger);
    document.getElementById('ss-debug-btn').addEventListener('click', _showDebug);

    // Load status + start polling
    _loadStatus();
    _startPolling();
  }
  window.loadSapoSync = loadSapoSync;

  // ── Product Sync ─────────────────────────────────────────────
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

})();
