/* ================================================================
 * sk-sales-ui.js — SonKhang ERP v4.0
 * Phan he Ban hang — CSS, Shell, Shared Helpers
 * 21/03/2026
 *
 * LOI DA BIET - TRANH:
 *   - Khong dat ten ham co dau tieng Viet (loadKeToán → sai)
 *   - Khong new Date() inline trong HTML string concat
 *   - Khong regex co dau nhay trong character class
 * ================================================================ */
(function () {
  'use strict';

  /* ── Shared Helpers ─────────────────────────────────────────── */
  var _api   = function () { return typeof window.api === 'function' ? window.api : typeof api === 'function' ? api : null; };
  var _esc   = function (s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var _gv    = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  var _sv    = function (id, v) { var e = document.getElementById(id); if (e) e.value = v; };
  var _toast = function (m, t) { if (typeof window._hrmToast === 'function') window._hrmToast(m, t||'ok'); };
  var _ct    = function () { return typeof window.getContent === 'function' ? window.getContent() : document.getElementById('sk-ct'); };

  /* Định dạng tiền */
  function fmtMoney(v) {
    var n = Number(v||0);
    if (n >= 1e9) return (n/1e9).toFixed(2)+' tỷ';
    if (n >= 1e6) return (n/1e6).toFixed(1)+' tr';
    return n.toLocaleString('vi-VN')+'đ';
  }
  window.fmtMoney = fmtMoney;

  /* Định dạng số lượng */
  function fmtQty(v, unit) { return Number(v||0).toLocaleString('vi-VN')+(unit?' '+unit:''); }
  window.fmtQty = fmtQty;

  /* Màu trạng thái đơn hàng */
  var ORDER_COLORS = {
    nhap:'#6b7a99', cho_xac_nhan:'#fbbf24', da_xac_nhan:'#06b6d4',
    dang_giao:'#a855f7', da_giao:'#3d6bff', hoan_thanh:'#10d68c',
    huy:'#ff4d6d', tra_hang:'#ff6b35', chua_thanh_toan:'#f97316'
  };
  window.ORDER_COLORS = ORDER_COLORS;

  var ORDER_ICONS = {
    nhap:'📝', cho_xac_nhan:'⏳', da_xac_nhan:'✅',
    dang_giao:'🚚', da_giao:'📦', hoan_thanh:'🎉',
    huy:'❌', tra_hang:'↩️', chua_thanh_toan:'💳'
  };
  window.ORDER_ICONS = ORDER_ICONS;

  /* Badge trạng thái */
  function statusBadge(st, label) {
    var col = ORDER_COLORS[st] || '#6b7a99';
    var icon = ORDER_ICONS[st] || '•';
    return '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:800;background:'+col+'22;border:1px solid '+col+'55;color:'+col+';">'
      + icon+' '+_esc(label||st)+'</span>';
  }
  window.statusBadge = statusBadge;

  /* KPI card */
  function kpiCard(icon, label, value, color, sub) {
    return '<div class="sk-kpi-card">'
      + '<div class="sk-kpi-icon">'+icon+'</div>'
      + '<div class="sk-kpi-body">'
      + '<div class="sk-kpi-val" style="color:'+(color||'var(--text)')+'>'+_esc(String(value||0))+'</div>'
      + '<div class="sk-kpi-lbl">'+_esc(label)+'</div>'
      + (sub?'<div class="sk-kpi-sub">'+_esc(sub)+'</div>':'')
      + '</div></div>';
  }
  window.kpiCard = kpiCard;

  /* Modal helpers */
  function showModal(html, size) {
    closeModal();
    var ov = document.createElement('div');
    ov.className = 'sk-modal-ov'; ov.id = 'sk-sales-modal';
    ov.innerHTML = '<div class="sk-modal-box'+(size?' sk-modal-'+size:'')+'">' + html + '</div>';
    ov.addEventListener('click', function(e) { if (e.target === ov) closeModal(); });
    document.body.appendChild(ov);
  }
  function closeModal() { var el=document.getElementById('sk-sales-modal'); if(el&&el.parentNode) el.parentNode.removeChild(el); }
  window.showSalesModal = showModal;
  window.closeSalesModal = closeModal;

  /* Tab helpers */
  function initTabs(containerId, tabs, defaultTab, onSwitch) {
    var ct = document.getElementById(containerId); if (!ct) return;
    ct.innerHTML = '<div class="sk-tab-bar">'
      + tabs.map(function(t) {
          return '<button class="sk-tab'+(t.id===defaultTab?' active':'')+'" id="sktab-'+t.id+'" onclick="_skSwitchTab(\''+containerId+'\',\''+t.id+'\')">'
            + (t.icon||'')+' '+_esc(t.label)+'</button>';
        }).join('')
      + '</div><div id="'+containerId+'-content"></div>';
    window['_sktab_'+containerId] = onSwitch;
    _skSwitchTab(containerId, defaultTab);
  }
  window.initSalesTabs = initTabs;

  window._skSwitchTab = function(cid, tid) {
    var el = document.querySelector('#'+cid+' .sk-tab-bar');
    if (el) el.querySelectorAll('.sk-tab').forEach(function(b) {
      b.classList.toggle('active', b.id==='sktab-'+tid);
    });
    var cb = window['_sktab_'+cid]; if (typeof cb==='function') cb(tid);
  };

  /* Confirm dialog */
  function confirmAction(msg, cb) {
    var html = '<div style="padding:24px;max-width:360px;">'
      + '<div style="font-size:16px;font-weight:800;margin-bottom:12px;">⚠️ Xác nhận</div>'
      + '<div style="font-size:13px;color:var(--text3);margin-bottom:20px;">'+_esc(msg)+'</div>'
      + '<div style="display:flex;gap:8px;justify-content:flex-end;">'
      + '<button class="btn-ghost" onclick="closeSalesModal()" style="font-size:12px;">Hủy</button>'
      + '<button class="btn-primary" id="sk-confirm-ok" style="font-size:12px;">Xác nhận</button>'
      + '</div></div>';
    showModal(html);
    document.getElementById('sk-confirm-ok').onclick = function() { closeModal(); cb(); };
  }
  window.salesConfirm = confirmAction;

  /* Loading spinner */
  function loadingHTML(msg) {
    return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;gap:12px;">'
      + '<div class="sk-spin" style="width:28px;height:28px;border:3px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div>'
      + '<div style="font-size:12px;color:var(--text3);">'+(msg||'Đang tải...')+'</div>'
      + '</div>';
  }
  window.salesLoading = loadingHTML;

  /* Empty state */
  function emptyHTML(icon, msg, btnLabel, btnCb) {
    return '<div style="text-align:center;padding:40px 20px;">'
      + '<div style="font-size:40px;margin-bottom:12px;">'+(icon||'📭')+'</div>'
      + '<div style="font-size:14px;font-weight:700;margin-bottom:8px;">'+_esc(msg||'Không có dữ liệu')+'</div>'
      + (btnLabel?'<button class="btn-primary" onclick="'+btnCb+'" style="margin-top:8px;font-size:12px;">'+_esc(btnLabel)+'</button>':'')
      + '</div>';
  }
  window.salesEmpty = emptyHTML;

  /* ================================================================
   * CSS INJECTION — toàn bộ sales module
   * ================================================================ */
  function injectCSS() {
    if (document.getElementById('sk-sales-css')) return;
    var s = document.createElement('style');
    s.id  = 'sk-sales-css';
    s.textContent = [
      /* KPI cards */
      '.sk-kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;}',
      '.sk-kpi-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;display:flex;gap:12px;align-items:center;}',
      '.sk-kpi-icon{font-size:24px;flex-shrink:0;}',
      '.sk-kpi-val{font-size:20px;font-weight:900;color:var(--text);font-family:"Be Vietnam Pro",-apple-system,sans-serif;}',
      '.sk-kpi-lbl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-top:2px;}',
      '.sk-kpi-sub{font-size:10px;color:var(--text3);margin-top:2px;}',
      /* Tab bar */
      '.sk-tab-bar{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:10px;}',
      '.sk-tab{background:none;border:1px solid var(--border2);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;color:var(--text3);cursor:pointer;transition:all .15s;font-family:"Be Vietnam Pro",-apple-system,sans-serif;}',
      '.sk-tab:hover{background:var(--bg3);color:var(--text2);}',
      '.sk-tab.active{background:rgba(61,107,255,.15);border-color:var(--accent);color:var(--accent2);}',
      /* Modals */
      '.sk-modal-ov{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;}',
      '.sk-modal-box{background:var(--bg2);border:1px solid var(--border2);border-radius:18px;max-height:90vh;overflow-y:auto;max-width:560px;width:100%;}',
      '.sk-modal-lg{max-width:820px;}',
      '.sk-modal-xl{max-width:1100px;}',
      '.sk-modal-hd{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg2);border-radius:18px 18px 0 0;}',
      '.sk-modal-bd{padding:20px;}',
      '.sk-modal-ft{display:flex;justify-content:flex-end;gap:8px;padding:16px 20px;border-top:1px solid var(--border);}',
      /* Tables */
      '.sk-table-wrap{overflow-x:auto;border-radius:12px;border:1px solid var(--border);}',
      '.sk-table{width:100%;border-collapse:collapse;font-size:12px;}',
      '.sk-table th{background:var(--bg3);padding:10px 12px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);border-bottom:1px solid var(--border2);white-space:nowrap;}',
      '.sk-table td{padding:10px 12px;border-bottom:1px solid var(--border);vertical-align:middle;}',
      '.sk-table tr:last-child td{border-bottom:none;}',
      '.sk-table tr:hover td{background:var(--bg3);}',
      /* Toolbar */
      '.sk-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:16px;}',
      '.sk-search{background:var(--bg3);border:1px solid var(--border2);border-radius:10px;padding:8px 14px;font-size:12px;color:var(--text);outline:none;min-width:200px;}',
      '.sk-search:focus{border-color:var(--accent);}',
      '.sk-filter{background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;font-size:11px;color:var(--text);cursor:pointer;font-family:"Be Vietnam Pro",-apple-system,sans-serif;}',
      /* Forms */
      '.sk-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}',
      '.sk-form-full{grid-column:1/-1;}',
      '.sk-form-group{display:flex;flex-direction:column;gap:5px;}',
      '.sk-lbl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);}',
      /* Product line item */
      '.sk-line-item{display:grid;grid-template-columns:1fr 80px 100px 100px 36px;gap:6px;align-items:center;padding:8px;background:var(--bg3);border-radius:8px;margin-bottom:6px;}',
      /* Status chips */
      '.sk-status-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}',
      /* Delivery card */
      '.sk-del-card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:10px;}',
      /* Spin */
      '.sk-spin{animation:sk-rotate .8s linear infinite;} @keyframes sk-rotate{to{transform:rotate(360deg)}}',
      /* Invoice */
      '.sk-invoice-print{background:#fff;color:#111;padding:24px;border-radius:8px;font-family:"Be Vietnam Pro",sans-serif;max-width:600px;}',
      /* Responsive */
      '@media(max-width:700px){.sk-kpi-grid{grid-template-columns:1fr 1fr}.sk-form-grid{grid-template-columns:1fr}.sk-line-item{grid-template-columns:1fr 70px 80px}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* Expose */
  window._salesInjectCSS = injectCSS;

  /* Auto-inject khi load */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCSS);
  } else {
    injectCSS();
  }

})();
