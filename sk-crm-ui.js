/* ================================================================
// [v5.32] 22/03/2026 — _renderContracts upgrade: timeline, filter, expiry warning
 * sk-crm-ui.js  SonKhang ERP v5.5.0
 * Module CRM Khach hang day du:
 *   - Danh sach KH: tim kiem, filter nhom, sort
 *   - Chi tiet KH: lich su mua, no cuoi, diem tich luy
 *   - CRUD KH: them, sua, xoa
 *   - Phan nhom: le, si, vip, dai_ly
 *   - Import tu Sapo
 *   - Bao cao CRM: top KH, tong no, diem
 * 21/03/2026 — 0 non-ASCII, DOM API
 * ================================================================ */
(function () {
  'use strict';

  var _api   = function(){ return typeof window.api==='function'?window.api:null; };
  var _ct    = function(){ var c=typeof window.getContent==='function'?window.getContent():null; return c||document.getElementById('sk-ct'); };
  var _esc   = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var _fmt   = function(n){ return (Number(n)||0).toLocaleString('vi-VN'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };

  var STATE = { page:1, q:'', nhom:'', sortCol:'', sortDir:'asc', curKH:null };

  var NHOM_LABELS = { le:'Khach le', si:'Khach si', vip:'VIP', dai_ly:'Dai ly', noi_bo:'Noi bo' };
  var NHOM_COLORS = { le:'var(--text3)', si:'var(--cyan)', vip:'var(--yellow)', dai_ly:'var(--green)', noi_bo:'var(--accent2)' };

  // ── Modal ────────────────────────────────────────────────────────
  function _modal(html, maxW) {
    var old = document.getElementById('sk-crm-modal');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var ov = document.createElement('div');
    ov.id = 'sk-crm-modal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;';
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--bg2,#0d1020);border:1px solid var(--border2,#252d40);border-radius:18px;width:100%;max-width:'+(maxW||'640px')+';margin:auto;';
    box.innerHTML = html;
    ov.appendChild(box);
    ov.addEventListener('click', function(e){ if(e.target===ov) _closeModal(); });
    document.body.appendChild(ov);
  }
  function _closeModal(){ var m=document.getElementById('sk-crm-modal'); if(m&&m.parentNode) m.parentNode.removeChild(m); }
  window.closeCRMModal = _closeModal;

  // ── Main entry point ─────────────────────────────────────────────
  function loadCRM() {
    var ct = _ct(); if (!ct) return;

    ct.innerHTML = '<div class="fade-in" style="padding:24px;">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
      + '<div><h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F465; CRM Khach hang</h1>'
      + '<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Quan ly khach hang · Lich su mua · No cuoi · Diem tich luy</p></div>'
      + '<div style="display:flex;gap:8px;">'
      + '<button id="crm-import-btn" style="background:rgba(0,214,143,.1);border:1px solid rgba(0,214,143,.2);color:var(--green);border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F504; Import Sapo</button>'
      + '<button id="crm-new-btn" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">+ Them KH</button>'
      + '</div></div>'
      // Tabs
      + '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;" id="crm-tabs">'
      + '<button data-crm-tab="list"     style="border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);">&#x1F465; Khach hang</button>'
      + '<button data-crm-tab="loyalty"  style="border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;background:var(--bg3);border:1px solid var(--border2);color:var(--text3);">&#x2B50; Loyalty</button>'
      + '<button data-crm-tab="rfm"      style="border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;background:var(--bg3);border:1px solid var(--border2);color:var(--text3);">&#x1F4CA; RFM</button>'
      + '<button data-crm-tab="contract" style="border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;background:var(--bg3);border:1px solid var(--border2);color:var(--text3);">&#x1F4CB; Hop dong</button>'
      + '</div>'
      // KPI
      + '<div id="crm-kpi" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:20px;"></div>'
      // Filter bar
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center;">'
      + '<input id="crm-q" type="text" placeholder="Tim ten, so dien thoai, email..." style="flex:1;min-width:200px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
      + '<select id="crm-nhom" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
      + '<option value="">Tat ca nhom</option>'
      + Object.keys(NHOM_LABELS).map(function(k){ return '<option value="'+k+'">'+NHOM_LABELS[k]+'</option>'; }).join('')
      + '</select>'
      + '<button id="crm-search-btn" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
      + '</div>'
      + '<div id="crm-list"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>'
      + '<div id="crm-pager" style="display:flex;justify-content:center;gap:6px;margin-top:14px;"></div>'
      + '</div>';

    document.getElementById('crm-search-btn').addEventListener('click', function(){
      STATE.q    = document.getElementById('crm-q').value;
      STATE.nhom = document.getElementById('crm-nhom').value;
      STATE.page = 1;
      _loadList();
    });
    document.getElementById('crm-q').addEventListener('keydown', function(e){ if(e.keyCode===13) document.getElementById('crm-search-btn').click(); });
    document.getElementById('crm-new-btn').addEventListener('click', function(){ _showForm(null); });
    document.getElementById('crm-import-btn').addEventListener('click', _importFromSapo);

    // Tab switching
    document.querySelectorAll('[data-crm-tab]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var tab = btn.getAttribute('data-crm-tab');
        STATE.curTab = tab;
        document.querySelectorAll('[data-crm-tab]').forEach(function(b){
          b.style.background='var(--bg3)'; b.style.borderColor='var(--border2)'; b.style.color='var(--text3)';
        });
        btn.style.background='rgba(79,111,255,.15)'; btn.style.borderColor='rgba(79,111,255,.3)'; btn.style.color='var(--accent2)';
        if (tab==='list')          { _loadKPI(); _loadList(); }
        else if (tab==='loyalty')  _renderLoyaltyDashboard();
        else if (tab==='rfm')      _renderRFM();
        else if (tab==='contract') _renderContracts();
      });
    });
    // Auto-switch to STATE.curTab (set by dedicated loaders)
    var initTab = STATE.curTab || 'list';
    var initBtn = document.querySelector('[data-crm-tab="'+initTab+'"]');
    if (initBtn) initBtn.click();
    else { _loadKPI(); _loadList(); }

    _loadKPI();
    _loadList();
  }
  // Entry points chính
  window.loadCRM        = loadCRM;
  window.loadKhachHang  = loadCRM;
  window.loadSalesCRM   = loadCRM;

  // Dedicated loaders cho từng tab CRM — dùng cho sidebar/SK_LOADERS
  window.loadCRMKhachHang = function () {
    STATE.curTab = 'list';
    loadCRM();
  };
  window.loadCRMLoyalty = function () {
    STATE.curTab = 'loyalty';
    loadCRM();
  };
  window.loadCRMRFM = function () {
    STATE.curTab = 'rfm';
    loadCRM();
  };
  // ── CRM Báo cáo ────────────────────────────────────────────────
  window.loadCRMBaoCao = function () {
    STATE.curTab = 'bao-cao';
    var ct = _ct(); if (!ct) return;
    ct.innerHTML = '<div class="fade-in" style="padding:24px;">'
      + '<div style="margin-bottom:20px;">'
      + '<h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F4C8; Bao cao CRM</h1>'
      + '<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Tong quan khach hang · Doanh thu · Loyalty · Phan khuc</p>'
      + '</div>'
      + '<div id="crm-bc-kpi" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px;">'
      + '<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">'
      + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;" id="crm-bc-top10">'
      + '<div style="font-size:13px;font-weight:900;margin-bottom:12px;">&#x1F3C6; Top 10 KH theo doanh so</div>'
      + '<div style="text-align:center;color:var(--text3);font-size:12px;">Dang tai...</div>'
      + '</div>'
      + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;" id="crm-bc-nhom">'
      + '<div style="font-size:13px;font-weight:900;margin-bottom:12px;">&#x1F465; Phan bo theo nhom</div>'
      + '<div style="text-align:center;color:var(--text3);font-size:12px;">Dang tai...</div>'
      + '</div>'
      + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;" id="crm-bc-no">'
      + '<div style="font-size:13px;font-weight:900;margin-bottom:12px;color:var(--red);">&#x1F4B3; Cong no khach hang</div>'
      + '<div style="text-align:center;color:var(--text3);font-size:12px;">Dang tai...</div>'
      + '</div>'
      + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;" id="crm-bc-tier">'
      + '<div style="font-size:13px;font-weight:900;margin-bottom:12px;">&#x1F451; Phan bo hang Loyalty</div>'
      + '<div style="text-align:center;color:var(--text3);font-size:12px;">Dang tai...</div>'
      + '</div>'
      + '</div></div>';

    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_customers', { limit:1000 }, function(e,d) {
      if (e || !d || !d.ok) return;
      var rows = d.data || [];

      // KPI
      var tongKH    = rows.length;
      var tongMua   = rows.reduce(function(a,r){ return a + Number(r.tong_mua||0); }, 0);
      var tongNo    = rows.reduce(function(a,r){ return a + Number(r.no_cuoi||0); }, 0);
      var tongDiem  = rows.reduce(function(a,r){ return a + Number(r.diem_tl||0); }, 0);
      var coNo      = rows.filter(function(r){ return Number(r.no_cuoi||0)>0; }).length;

      var kpiEl = document.getElementById('crm-bc-kpi');
      if (kpiEl) kpiEl.innerHTML = [
        { icon:'&#x1F465;', label:'Tong KH',      val:tongKH,          c:'var(--text)' },
        { icon:'&#x1F4B0;', label:'Tong doanh so', val:_fmt(tongMua)+'d', c:'var(--green)' },
        { icon:'&#x1F4B3;', label:'Tong no',       val:_fmt(tongNo)+'d',  c:tongNo>0?'var(--red)':'var(--text3)' },
        { icon:'&#x2B50;',  label:'Tong diem TL',  val:_fmt(tongDiem),    c:'var(--cyan)' },
        { icon:'&#x26A0;',  label:'KH co no',      val:coNo,              c:coNo>0?'var(--yellow)':'var(--text3)' },
      ].map(function(k){
        return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;gap:10px;align-items:center;">'
          + '<div style="font-size:20px;">' + k.icon + '</div>'
          + '<div><div style="font-size:16px;font-weight:900;color:' + k.c + ';">' + k.val + '</div>'
          + '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);">' + k.label + '</div></div></div>';
      }).join('');

      // Top 10
      var top10El = document.getElementById('crm-bc-top10');
      if (top10El) {
        var sorted = rows.slice().sort(function(a,b){ return Number(b.tong_mua||0)-Number(a.tong_mua||0); });
        var html = '<div style="border-radius:8px;border:1px solid var(--border);overflow:hidden;">'
          + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
          + '<thead><tr style="background:var(--bg3);">'
          + '<th style="padding:6px 10px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">#</th>'
          + '<th style="padding:6px 10px;text-align:left;">Khach hang</th>'
          + '<th style="padding:6px 10px;text-align:right;">Doanh so</th>'
          + '</tr></thead><tbody>';
        sorted.slice(0,10).forEach(function(r,i){
          var medal = i===0?'&#x1F947;':i===1?'&#x1F948;':i===2?'&#x1F949;':'';
          html += '<tr style="border-top:1px solid var(--border);">'
            + '<td style="padding:6px 10px;color:var(--text3);">' + medal + (medal?'':'#'+(i+1)) + '</td>'
            + '<td style="padding:6px 10px;font-weight:700;">' + _esc(r.ten_kh||r.ten||'') + '</td>'
            + '<td style="padding:6px 10px;text-align:right;color:var(--green);">' + _fmt(r.tong_mua||0) + '</td>'
            + '</tr>';
        });
        html += '</tbody></table></div>';
        top10El.innerHTML = html;
      }

      // Phân bổ nhóm
      var nhomEl = document.getElementById('crm-bc-nhom');
      if (nhomEl) {
        var nhomMap = {};
        var nhomLabels = { le:'Khach le', si:'Khach si', vip:'VIP', dai_ly:'Dai ly', noi_bo:'Noi bo' };
        rows.forEach(function(r){ var n=r.nhom||'le'; nhomMap[n]=(nhomMap[n]||0)+1; });
        var total = rows.length || 1;
        var colors = { le:'var(--text3)', si:'var(--cyan)', vip:'var(--yellow)', dai_ly:'var(--green)', noi_bo:'var(--accent2)' };
        nhomEl.innerHTML = Object.keys(nhomLabels).map(function(k){
          var cnt = nhomMap[k]||0;
          var pct = Math.round(cnt/total*100);
          var c   = colors[k]||'var(--text3)';
          return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
            + '<div style="width:70px;font-size:11px;color:var(--text3);">' + nhomLabels[k] + '</div>'
            + '<div style="flex:1;background:var(--bg3);border-radius:4px;height:8px;overflow:hidden;">'
            + '<div style="width:' + pct + '%;background:' + c + ';height:100%;border-radius:4px;"></div>'
            + '</div>'
            + '<div style="width:40px;text-align:right;font-size:11px;font-weight:700;color:' + c + ';">' + cnt + '</div>'
            + '</div>';
        }).join('');
      }

      // Công nợ top
      var noEl = document.getElementById('crm-bc-no');
      if (noEl) {
        var hasDebt = rows.filter(function(r){ return Number(r.no_cuoi||0)>0; })
          .sort(function(a,b){ return Number(b.no_cuoi||0)-Number(a.no_cuoi||0); });
        if (!hasDebt.length) {
          noEl.innerHTML = '<div style="font-size:13px;font-weight:900;margin-bottom:12px;color:var(--red);">&#x1F4B3; Cong no khach hang</div><div style="text-align:center;padding:20px;color:var(--green);">&#x2705; Khong co no ton</div>';
        } else {
          var noHtml = '<div style="font-size:13px;font-weight:900;margin-bottom:12px;color:var(--red);">&#x1F4B3; Cong no khach hang (' + hasDebt.length + ')</div>'
            + '<div style="border-radius:8px;border:1px solid var(--border);overflow:hidden;">'
            + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
            + '<thead><tr style="background:var(--bg3);">'
            + '<th style="padding:6px 10px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Khach hang</th>'
            + '<th style="padding:6px 10px;text-align:right;color:var(--red);">No con lai</th>'
            + '</tr></thead><tbody>';
          hasDebt.slice(0,8).forEach(function(r){
            noHtml += '<tr style="border-top:1px solid var(--border);">'
              + '<td style="padding:6px 10px;font-weight:700;">' + _esc(r.ten_kh||r.ten||'') + '</td>'
              + '<td style="padding:6px 10px;text-align:right;color:var(--red);font-weight:700;">' + _fmt(r.no_cuoi||0) + 'd</td>'
              + '</tr>';
          });
          noHtml += '</tbody></table></div>';
          noEl.innerHTML = noHtml;
        }
      }

      // Tier breakdown
      var tierEl = document.getElementById('crm-bc-tier');
      if (tierEl) {
        var tiers = { diamond:0, gold:0, silver:0, bronze:0, member:0 };
        var tierMin = { diamond:100000000, gold:50000000, silver:20000000, bronze:5000000, member:0 };
        var tierCfg = {
          diamond:{ name:'Diamond', icon:'&#x1F48E;', color:'#a78bfa' },
          gold:   { name:'Gold',    icon:'&#x1F947;', color:'#f59e0b' },
          silver: { name:'Silver',  icon:'&#x1F948;', color:'#94a3b8' },
          bronze: { name:'Bronze',  icon:'&#x1F949;', color:'#c97d4e' },
          member: { name:'Member',  icon:'&#x1F464;', color:'#6b7a99' }
        };
        rows.forEach(function(r){
          var t=Number(r.tong_mua||0);
          var tier='member';
          if(t>=100000000)tier='diamond';
          else if(t>=50000000)tier='gold';
          else if(t>=20000000)tier='silver';
          else if(t>=5000000)tier='bronze';
          tiers[tier]++;
        });
        var tierHtml = '<div style="font-size:13px;font-weight:900;margin-bottom:12px;">&#x1F451; Phan bo hang Loyalty</div>'
          + '<div style="display:grid;gap:8px;">';
        Object.keys(tierCfg).forEach(function(k){
          var tc = tierCfg[k];
          var cnt = tiers[k]||0;
          var pct = Math.round(cnt/(rows.length||1)*100);
          tierHtml += '<div style="display:flex;align-items:center;gap:8px;">'
            + '<div style="font-size:14px;">' + tc.icon + '</div>'
            + '<div style="width:60px;font-size:11px;color:' + tc.color + ';font-weight:700;">' + tc.name + '</div>'
            + '<div style="flex:1;background:var(--bg3);border-radius:4px;height:8px;overflow:hidden;">'
            + '<div style="width:' + pct + '%;background:' + tc.color + ';height:100%;border-radius:4px;"></div>'
            + '</div>'
            + '<div style="width:40px;text-align:right;font-size:11px;font-weight:700;color:' + tc.color + ';">' + cnt + '</div>'
            + '</div>';
        });
        tierHtml += '</div>';
        tierEl.innerHTML = tierHtml;
      }
    });
  };

  window.loadCRMContract = function () {
    if (typeof window.loadHopDong === 'function') window.loadHopDong();
    else loadCRM();
  };

  // ── KPI ─────────────────────────────────────────────────────────
  function _loadKPI() {
    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_customers', { limit:1000 }, function(e,d){
      var el = document.getElementById('crm-kpi'); if (!el) return;
      var rows = (!e&&d&&d.ok) ? d.data||[] : [];
      var total    = rows.length;
      var vip      = rows.filter(function(r){ return r.nhom==='vip'; }).length;
      var daiLy    = rows.filter(function(r){ return r.nhom==='dai_ly'; }).length;
      var coNo     = rows.filter(function(r){ return (Number(r.no_cuoi)||0) > 0; }).length;
      var tongNo   = rows.reduce(function(a,r){ return a + (Number(r.no_cuoi)||0); }, 0);
      var tongDiem = rows.reduce(function(a,r){ return a + (Number(r.diem_tl)||0); }, 0);
      var items = [
        {icon:'&#x1F465;', label:'Tong KH',     val:total,             c:'var(--text)'},
        {icon:'&#x1F451;', label:'VIP',          val:vip,               c:'var(--yellow)'},
        {icon:'&#x1F3EA;', label:'Dai ly',       val:daiLy,             c:'var(--green)'},
        {icon:'&#x1F4B3;', label:'Co no cuoi',   val:coNo,              c:'var(--red)'},
        {icon:'&#x1F4B0;', label:'Tong no (d)',  val:_fmt(tongNo),      c:'var(--red)'},
        {icon:'&#x2B50;',  label:'Tong diem',    val:_fmt(tongDiem),    c:'var(--cyan)'},
      ];
      el.innerHTML = items.map(function(it){
        return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;gap:10px;align-items:center;">'
          + '<div style="font-size:20px;">'+it.icon+'</div>'
          + '<div><div style="font-size:16px;font-weight:900;color:'+it.c+';">'+it.val+'</div>'
          + '<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);">'+it.label+'</div></div></div>';
      }).join('');
    });
  }

  // ── Danh sách KH ────────────────────────────────────────────────
  function _loadList() {
    var el = document.getElementById('crm-list'); if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_customers', { q:STATE.q, nhom:STATE.nhom, page:STATE.page, limit:30 }, function(e,d){
      if (e||!d||!d.ok) { el.innerHTML='<p style="color:var(--red);padding:16px;">Loi tai danh sach</p>'; return; }
      var rows = d.data||[];
      if (!rows.length) {
        el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text3);">'
          +'<div style="font-size:36px;margin-bottom:12px;">&#x1F465;</div>'
          +'<div style="font-size:14px;font-weight:700;">Chua co khach hang</div></div>';
        return;
      }
      var html = '<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
        +'<table style="width:100%;border-collapse:collapse;font-size:12px;">'
        +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);">Khach hang</th>'
        +'<th style="padding:10px 12px;text-align:left;">Lien he</th>'
        +'<th style="padding:10px 12px;text-align:center;">Nhom</th>'
        +'<th style="padding:10px 12px;text-align:right;">Tong mua</th>'
        +'<th style="padding:10px 12px;text-align:right;color:var(--red);">No cuoi</th>'
        +'<th style="padding:10px 12px;text-align:right;color:var(--cyan);">Diem</th>'
        +'<th style="padding:10px 12px;"></th>'
        +'</tr></thead><tbody>';
      rows.forEach(function(r){
        var nhomColor = NHOM_COLORS[r.nhom] || 'var(--text3)';
        var nhomLabel = NHOM_LABELS[r.nhom] || r.nhom || 'le';
        var no = Number(r.no_cuoi||0);
        html += '<tr style="border-top:1px solid var(--border);cursor:pointer;" id="crm-row-'+_esc(r.id)+'">'
          +'<td style="padding:8px 12px;">'
          +'<div style="font-weight:700;">'+_esc(r.ten_kh||r.ten||'')+'</div>'
          +'<div style="font-size:10px;color:var(--text3);">'+_esc(r.id||'')+'</div>'
          +'</td>'
          +'<td style="padding:8px 12px;font-size:11px;color:var(--text3);">'
          +_esc(r.phone||r.dien_thoai||'')+(r.email?'<br>'+_esc(r.email):'')
          +'</td>'
          +'<td style="padding:8px 12px;text-align:center;">'
          +'<span style="padding:2px 8px;border-radius:5px;font-size:10px;font-weight:800;background:rgba(255,255,255,.05);color:'+nhomColor+';">'+nhomLabel+'</span>'
          +'</td>'
          +'<td style="padding:8px 12px;text-align:right;font-weight:700;">'+_fmt(r.tong_mua||0)+'</td>'
          +'<td style="padding:8px 12px;text-align:right;font-weight:700;color:'+(no>0?'var(--red)':'var(--text3)')+';">'+(no>0?_fmt(no):'—')+'</td>'
          +'<td style="padding:8px 12px;text-align:right;color:var(--cyan);">'+_fmt(r.diem_tl||0)+'</td>'
          +'<td style="padding:8px 12px;" id="crm-act-'+_esc(r.id)+'"></td>'
          +'</tr>';
      });
      html += '</tbody></table></div>';
      el.innerHTML = html;

      rows.forEach(function(r){
        var td = document.getElementById('crm-act-'+r.id); if (!td) return;
        var btn = document.createElement('button');
        btn.innerHTML = '&#x270F;';
        btn.style.cssText = 'background:rgba(79,111,255,.1);border:1px solid rgba(79,111,255,.2);border-radius:6px;padding:4px 8px;font-size:13px;cursor:pointer;';
        btn.addEventListener('click', function(e){ e.stopPropagation(); _showForm(r); });
        td.appendChild(btn);

        var row = document.getElementById('crm-row-'+r.id);
        if (row) row.addEventListener('click', function(){ _showDetail(r); });
      });

      // Pager
      var total = d.total || rows.length;
      var pages = d.pages || 1;
      var pager = document.getElementById('crm-pager');
      if (pager) {
        pager.innerHTML = '<span style="font-size:11px;color:var(--text3);margin-right:8px;">'+total+' khach hang</span>';
        for (var p=1;p<=pages;p++) {
          var pp=p;
          pager.innerHTML += '<span data-p="'+pp+'" style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;'+(p===STATE.page?'background:rgba(79,111,255,.2);color:var(--accent2);':'background:var(--bg3);color:var(--text3);')+'">'+p+'</span>';
        }
        pager.querySelectorAll('[data-p]').forEach(function(sp){
          sp.addEventListener('click', function(){ STATE.page=Number(sp.getAttribute('data-p')); _loadList(); });
        });
      }
    });
  }

  // ── Chi tiết KH ─────────────────────────────────────────────────
  function _showDetail(kh) {
    STATE.curKH = kh;
    var apiF = _api();
    var html = '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
      +'<div><div style="font-size:16px;font-weight:900;">'+_esc(kh.ten_kh||kh.ten||'')+'</div>'
      +'<div style="font-size:11px;color:var(--text3);">'+_esc(kh.id||'')+'</div></div>'
      +'<button id="crm-d-close" style="background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;">&#x00D7;</button>'
      +'</div>'
      +'<div style="padding:16px 20px;">'
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">'
      +_kBox('Tong mua', _fmt(kh.tong_mua||0)+'d', 'var(--green)')
      +_kBox('No cuoi',  _fmt(kh.no_cuoi||0)+'d',  Number(kh.no_cuoi||0)>0?'var(--red)':'var(--text3)')
      +_kBox('Diem TL',  _fmt(kh.diem_tl||0),       'var(--cyan)')
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:16px;">'
      +_infoRow('&#x1F4DE; Dien thoai', kh.phone||kh.dien_thoai||'—')
      +_infoRow('&#x1F4E7; Email',      kh.email||'—')
      +_infoRow('&#x1F4CD; Dia chi',    kh.dia_chi||'—')
      +_infoRow('&#x1F3F7; Nhom',       NHOM_LABELS[kh.nhom]||kh.nhom||'—')
      +_infoRow('&#x1F4CB; Ma so thue', kh.mst||'—')
      +_infoRow('&#x1F91D; Sale PT',    kh.sale_pt||'—')
      +'</div>'
      +'<div id="crm-d-orders" style="margin-top:8px;">'
      +'<div style="font-size:11px;font-weight:800;color:var(--text3);margin-bottom:8px;">Lich su don hang:</div>'
      +'<div style="text-align:center;padding:12px;color:var(--text3);font-size:11px;">Dang tai...</div>'
      +'</div>'
      +'<div style="display:flex;gap:8px;margin-top:12px;">'
      +'<button id="crm-d-edit" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x270F; Chinh sua</button>'
      +'<button id="crm-d-close2" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Dong</button>'
      +'</div></div>';

    _modal(html, '700px');
    document.getElementById('crm-d-close').addEventListener('click', _closeModal);
    document.getElementById('crm-d-close2').addEventListener('click', _closeModal);
    document.getElementById('crm-d-edit').addEventListener('click', function(){ _closeModal(); _showForm(kh); });

    // Load lịch sử đơn hàng
    if (apiF) {
      apiF('sales_get_orders_by_customer', { khach_id: kh.id, limit:10 }, function(e,d){
        var sec = document.getElementById('crm-d-orders'); if (!sec) return;
        var orders = (!e&&d&&d.ok) ? (d.data||[]) : [];
        if (!orders.length) {
          sec.innerHTML = '<div style="font-size:11px;font-weight:800;color:var(--text3);margin-bottom:4px;">Lich su don hang: Chua co don</div>';
          return;
        }
        var tbl = '<div style="font-size:11px;font-weight:800;color:var(--text3);margin-bottom:8px;">Lich su don hang ('+orders.length+'):</div>'
          +'<div style="border-radius:8px;border:1px solid var(--border);overflow:hidden;">'
          +'<table style="width:100%;border-collapse:collapse;font-size:11px;">'
          +'<thead><tr style="background:var(--bg3);">'
          +'<th style="padding:6px 10px;text-align:left;">Ma don</th>'
          +'<th style="padding:6px 10px;text-align:left;">Ngay</th>'
          +'<th style="padding:6px 10px;text-align:right;">Tong</th>'
          +'<th style="padding:6px 10px;text-align:center;">TT</th>'
          +'</tr></thead><tbody>';
        orders.forEach(function(o){
          tbl += '<tr style="border-top:1px solid var(--border);">'
            +'<td style="padding:6px 10px;font-family:monospace;color:var(--accent2);">'+_esc(o.ma_don||o.id||'')+'</td>'
            +'<td style="padding:6px 10px;color:var(--text3);">'+_esc(o.ngay||'')+'</td>'
            +'<td style="padding:6px 10px;text-align:right;font-weight:700;">'+_fmt(o.tong_tt||0)+'</td>'
            +'<td style="padding:6px 10px;text-align:center;"><span style="padding:1px 6px;border-radius:4px;font-size:10px;font-weight:800;background:rgba(0,214,143,.1);color:var(--green);">'+_esc(o.trang_thai||'')+'</span></td>'
            +'</tr>';
        });
        tbl += '</tbody></table></div>';
        sec.innerHTML = tbl;
      });
    }
  }

  function _kBox(l,v,c){ return '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:15px;font-weight:900;color:'+c+';">'+v+'</div><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);margin-top:2px;">'+l+'</div></div>'; }
  function _infoRow(l,v){ return '<div style="background:var(--bg3);border-radius:8px;padding:8px 12px;"><div style="font-size:10px;color:var(--text3);margin-bottom:2px;">'+l+'</div><div style="font-weight:700;">'+_esc(String(v))+'</div></div>'; }

  // ── Form CRUD KH ────────────────────────────────────────────────
  function _showForm(kh) {
    var isNew = !kh;
    var nhomOpts = Object.keys(NHOM_LABELS).map(function(k){
      return '<option value="'+k+'"'+(kh&&kh.nhom===k?' selected':'')+'>'+NHOM_LABELS[k]+'</option>';
    }).join('');
    var h = '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
      +'<div style="font-size:15px;font-weight:900;">'+(isNew?'Them khach hang':'Sua thong tin KH')+'</div>'
      +'<button id="crm-f-x" style="background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;">&#x00D7;</button>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px;">'
      +_field('cf-ten','Ho ten *','text',kh?kh.ten_kh||kh.ten:'',true)
      +_field('cf-phone','Dien thoai','tel',kh?kh.phone||kh.dien_thoai:'')
      +_field('cf-email','Email','email',kh?kh.email:'')
      +_field('cf-nhom','Nhom KH','select',nhomOpts)
      +_field('cf-mst','Ma so thue','text',kh?kh.mst:'')
      +_field('cf-sale','Sale phu trach','text',kh?kh.sale_pt:'')
      +'<div style="grid-column:1/-1;"><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">Dia chi</label>'
      +'<textarea id="cf-addr" rows="2" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;resize:none;">'+_esc(kh?kh.dia_chi||kh.address||'':'')+'</textarea></div>'
      +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">So no hien tai</label>'
      +'<input id="cf-no" type="number" value="'+(kh?Number(kh.no_cuoi||0):0)+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"></div>'
      +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">Diem tich luy</label>'
      +'<input id="cf-diem" type="number" value="'+(kh?Number(kh.diem_tl||0):0)+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"></div>'
      +'</div>'
      +'<div style="display:flex;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--border);">'
      +(isNew?'<div></div>':'<button id="cf-del" style="background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.2);color:var(--red);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Xoa KH</button>')
      +'<div style="display:flex;gap:8px;">'
      +'<button id="cf-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
      +'<button id="cf-save" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--accent2);font-family:inherit;">'+(isNew?'Them KH':'Luu thay doi')+'</button>'
      +'</div></div>';

    _modal(h, '680px');
    document.getElementById('crm-f-x').addEventListener('click', _closeModal);
    document.getElementById('cf-cancel').addEventListener('click', _closeModal);

    if (!isNew) {
      document.getElementById('cf-del').addEventListener('click', function(){
        if (!confirm('Xoa khach hang '+_esc(kh.ten_kh||kh.ten||'')+'?')) return;
        var apiF = _api(); if (!apiF) return;
        apiF('sales_delete_customer', { id:kh.id }, function(e,d){
          if (!e&&d&&d.ok) { _toast('Da xoa KH','ok'); _closeModal(); _loadList(); _loadKPI(); }
          else _toast((d&&d.error)||'Loi xoa','error');
        });
      });
    }

    document.getElementById('cf-save').addEventListener('click', function(){
      var ten = document.getElementById('cf-ten').value.trim();
      if (!ten) { _toast('Nhap ho ten khach hang','error'); return; }
      var btn = document.getElementById('cf-save'); btn.disabled=true; btn.textContent='Dang luu...';
      var apiF = _api(); if (!apiF) return;
      apiF('sales_save_customer', {
        id      : kh ? kh.id : undefined,
        ten     : ten,
        phone   : document.getElementById('cf-phone').value.trim(),
        email   : document.getElementById('cf-email').value.trim(),
        nhom    : document.getElementById('cf-nhom').value,
        mst     : document.getElementById('cf-mst').value.trim(),
        sale_pt : document.getElementById('cf-sale').value.trim(),
        dia_chi : document.getElementById('cf-addr').value,
        no_cuoi : Number(document.getElementById('cf-no').value||0),
        diem_tl : Number(document.getElementById('cf-diem').value||0)
      }, function(e,d){
        btn.disabled=false; btn.textContent=isNew?'Them KH':'Luu thay doi';
        if (e||!d||!d.ok) { _toast((d&&d.error)||'Loi luu','error'); return; }
        _toast((isNew?'Da them: ':'Da cap nhat: ')+ten,'ok');
        _closeModal(); _loadList(); _loadKPI();
      });
    });
  }

  function _field(id,label,type,val,req){
    var base='width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;';
    var lbl='<label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">'+label+'</label>';
    if(type==='select') return '<div>'+lbl+'<select id="'+id+'" style="'+base+'">'+val+'</select></div>';
    return '<div>'+lbl+'<input id="'+id+'" type="'+type+'" value="'+_esc(val||'')+'" style="'+base+'"></div>';
  }


  // ── Loyalty Dashboard ──────────────────────────────────────────
  function _renderLoyaltyDashboard() {
    var el = document.getElementById('crm-list'); if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
    var pager = document.getElementById('crm-pager'); if (pager) pager.innerHTML='';
    var apiF = _api(); if (!apiF) return;

    el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px;" id="tier-cards"></div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">'
      +'<button id="crm-sync-pts-btn" style="background:rgba(0,214,143,.1);border:1px solid rgba(0,214,143,.2);color:var(--green);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F504; Tinh lai diem tu don hang</button>'
      +'<button id="crm-upgrade-btn" style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.2);color:var(--yellow);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F3C6; Cap nhat hang</button>'
      +'</div>'
      +'<div id="tier-list"><div style="text-align:center;padding:16px;color:var(--text3);">Dang tai...</div></div>';

    document.getElementById('crm-sync-pts-btn').addEventListener('click',function(){
      var btn=document.getElementById('crm-sync-pts-btn'); btn.disabled=true;
      apiF('crm_sync_points',{},function(e,d){
        btn.disabled=false;
        if(!e&&d&&d.ok) _toast(d.msg,'ok');
        else _toast((d&&d.error)||'Loi','error');
        _renderLoyaltyDashboard();
      });
    });
    document.getElementById('crm-upgrade-btn').addEventListener('click',function(){
      apiF('crm_upgrade_tier',{},function(e,d){
        if(!e&&d&&d.ok) _toast(d.msg,'ok');
        _renderLoyaltyDashboard();
      });
    });

    // Load KH và phân nhóm theo tier
    apiF('sales_get_customers',{limit:1000},function(e,d){
      if(e||!d||!d.ok) return;
      var rows = d.data||[];
      var tiers = {diamond:[],gold:[],silver:[],bronze:[],member:[]};
      var tierDef = {
        diamond:{name:'Diamond',icon:'&#x1F48E;',color:'#a78bfa',min:100000000},
        gold:   {name:'Gold',   icon:'&#x1F947;',color:'#f59e0b',min:50000000},
        silver: {name:'Silver', icon:'&#x1F948;',color:'#94a3b8',min:20000000},
        bronze: {name:'Bronze', icon:'&#x1F949;',color:'#c97d4e',min:5000000},
        member: {name:'Member', icon:'&#x1F464;',color:'#6b7a99',min:0}
      };
      rows.forEach(function(r){
        var t=Number(r.tong_mua||0);
        var tier='member';
        if(t>=100000000) tier='diamond';
        else if(t>=50000000) tier='gold';
        else if(t>=20000000) tier='silver';
        else if(t>=5000000) tier='bronze';
        tiers[tier].push(r);
      });

      var tierEl = document.getElementById('tier-cards');
      if(tierEl) {
        tierEl.innerHTML = Object.keys(tierDef).map(function(k){
          var td=tierDef[k];
          return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center;">'
            +'<div style="font-size:24px;">'+td.icon+'</div>'
            +'<div style="font-size:20px;font-weight:900;color:'+td.color+';">'+(tiers[k]||[]).length+'</div>'
            +'<div style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-top:2px;">'+td.name+'</div>'
            +'<div style="font-size:10px;color:var(--text3);">tu '+_fmt(td.min)+'d</div>'
            +'</div>';
        }).join('');
      }

      var listEl = document.getElementById('tier-list'); if(!listEl) return;
      var html='<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
        +'<table style="width:100%;border-collapse:collapse;font-size:12px;">'
        +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Khach hang</th>'
        +'<th style="padding:8px 12px;text-align:center;">Hang</th>'
        +'<th style="padding:8px 12px;text-align:right;">Tong mua</th>'
        +'<th style="padding:8px 12px;text-align:right;color:var(--cyan);">Diem</th>'
        +'<th style="padding:8px 12px;"></th>'
        +'</tr></thead><tbody>';

      var sorted = rows.slice().sort(function(a,b){ return Number(b.tong_mua||0)-Number(a.tong_mua||0); });
      sorted.slice(0,50).forEach(function(r){
        var t=Number(r.tong_mua||0);
        var tierK='member';
        if(t>=100000000)tierK='diamond';else if(t>=50000000)tierK='gold';else if(t>=20000000)tierK='silver';else if(t>=5000000)tierK='bronze';
        var td=tierDef[tierK];
        html+='<tr style="border-top:1px solid var(--border);">'
          +'<td style="padding:8px 12px;font-weight:700;">'+_esc(r.ten_kh||r.ten||'')+'</td>'
          +'<td style="padding:8px 12px;text-align:center;"><span style="color:'+td.color+';font-weight:800;">'+td.icon+' '+td.name+'</span></td>'
          +'<td style="padding:8px 12px;text-align:right;">'+_fmt(r.tong_mua||0)+'</td>'
          +'<td style="padding:8px 12px;text-align:right;color:var(--cyan);">'+_fmt(r.diem_tl||0)+'</td>'
          +'<td style="padding:8px 12px;" id="ly-act-'+_esc(r.id)+'"></td>'
          +'</tr>';
      });
      html+='</tbody></table></div>';
      listEl.innerHTML=html;

      sorted.slice(0,50).forEach(function(r){
        var td2=document.getElementById('ly-act-'+r.id); if(!td2) return;
        var btn=document.createElement('button');
        btn.innerHTML='+&#x2B50;';
        btn.title='Cong diem';
        btn.style.cssText='background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.2);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;color:var(--yellow);';
        btn.addEventListener('click',function(){ _showAddPointsForm(r); });
        td2.appendChild(btn);
      });
    });
  }

  function _showAddPointsForm(kh) {
    var h='<div style="padding:16px 20px;border-bottom:1px solid var(--border);font-size:15px;font-weight:900;">Cong diem cho '+_esc(kh.ten_kh||kh.ten||'')+'</div>'
      +'<div style="padding:20px;">'
      +'<label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:6px;">So diem cong them</label>'
      +'<input id="ap-diem" type="number" value="100" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;margin-bottom:12px;">'
      +'<label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:6px;">Ly do</label>'
      +'<input id="ap-ly-do" type="text" value="Tang diem" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
      +'</div>'
      +'<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
      +'<button id="ap-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
      +'<button id="ap-save" style="background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--yellow);font-family:inherit;">Cong diem</button>'
      +'</div>';
    _modal(h,'420px');
    document.getElementById('crm-d-close') && document.getElementById('crm-d-close').addEventListener('click',_closeModal);
    document.getElementById('ap-cancel').addEventListener('click',_closeModal);
    document.getElementById('ap-save').addEventListener('click',function(){
      var diem=Number(document.getElementById('ap-diem').value||0);
      if(!diem){_toast('Nhap so diem','error');return;}
      var apiF=_api();
      apiF('crm_add_points',{khach_id:kh.id,diem:diem,ghi_chu:document.getElementById('ap-ly-do').value},function(e,d){
        if(!e&&d&&d.ok){_toast('Da cong '+diem+' diem','ok');_closeModal();_renderLoyaltyDashboard();}
        else _toast((d&&d.error)||'Loi','error');
      });
    });
  }

  // ── RFM Analysis ───────────────────────────────────────────────
  function _renderRFM() {
    var el=document.getElementById('crm-list'); if(!el) return;
    el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Dang tinh RFM...</div>';
    var apiF=_api(); if(!apiF) return;
    apiF('crm_get_rfm',{limit:100},function(e,d){
      if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);padding:16px;">Loi</p>';return;}
      var seg=d.segments||{};
      var segColors={Champions:'var(--green)',Loyal:'var(--cyan)',Potential:'var(--accent2)',
                     'At Risk':'var(--yellow)',Churned:'var(--red)'};
      var html='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;">'
        +Object.keys(seg).map(function(k){
          var label={'champions':'Champions','loyal':'Loyal','potential':'Potential','at_risk':'At Risk','churned':'Churned'}[k]||k;
          var c=segColors[label]||'var(--text3)';
          return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">'
            +'<div style="font-size:22px;font-weight:900;color:'+c+';">'+(seg[k]||0)+'</div>'
            +'<div style="font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-top:2px;">'+label+'</div>'
            +'</div>';
        }).join('')
        +'</div>'
        +'<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
        +'<table style="width:100%;border-collapse:collapse;font-size:11px;">'
        +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Khach hang</th>'
        +'<th style="padding:8px;text-align:center;">Segment</th>'
        +'<th style="padding:8px;text-align:right;">R</th>'
        +'<th style="padding:8px;text-align:right;">F</th>'
        +'<th style="padding:8px;text-align:right;">M</th>'
        +'<th style="padding:8px;text-align:right;">Score</th>'
        +'<th style="padding:8px;text-align:right;">Tong mua</th>'
        +'</tr></thead><tbody>';
      d.data.forEach(function(r){
        var c=segColors[r.segment]||'var(--text3)';
        html+='<tr style="border-top:1px solid var(--border);">'
          +'<td style="padding:7px 12px;font-weight:700;">'+_esc(r.ten||r.id||'')+'</td>'
          +'<td style="padding:7px 8px;text-align:center;"><span style="padding:2px 6px;border-radius:4px;font-size:10px;font-weight:800;color:'+c+';">'+r.segment+'</span></td>'
          +'<td style="padding:7px 8px;text-align:right;color:var(--text3);">'+r.r+'</td>'
          +'<td style="padding:7px 8px;text-align:right;color:var(--text3);">'+r.f+'</td>'
          +'<td style="padding:7px 8px;text-align:right;color:var(--text3);">'+r.m+'</td>'
          +'<td style="padding:7px 8px;text-align:right;font-weight:900;color:var(--accent2);">'+r.rfm_score+'</td>'
          +'<td style="padding:7px 8px;text-align:right;">'+_fmt(r.monetary)+'</td>'
          +'</tr>';
      });
      html+='</tbody></table></div>';
      el.innerHTML=html;
    });
  }

  // ── Hợp đồng ──────────────────────────────────────────────────
  function _renderContracts() {
    var el = document.getElementById('crm-list'); if (!el) return;

    // Header
    var hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;';
    hdr.innerHTML = '<div>'
      + '<div style="font-size:14px;font-weight:900;color:var(--text);">Hop dong Khach hang</div>'
      + '<div style="font-size:11px;color:var(--text3);margin-top:2px;">Filter theo khach hang dang chon hoac tat ca</div>'
    + '</div>';
    var btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'display:flex;gap:8px;';
    var btnNew = document.createElement('button');
    btnNew.innerHTML = '&#x2795; Tao HD';
    btnNew.style.cssText = 'background:rgba(0,214,143,.12);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;';
    btnNew.addEventListener('click', function() {
      if (typeof window._ctNew === 'function') window._ctNew('khach_hang');
      else if (typeof window.loadHopDong === 'function') window.loadHopDong();
    });
    var btnFull = document.createElement('button');
    btnFull.innerHTML = '&#x1F4CB; Quan ly day du';
    btnFull.style.cssText = 'background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;';
    btnFull.addEventListener('click', function() {
      if (typeof window.skLoad === 'function') window.skLoad('hop-dong');
    });
    btnWrap.appendChild(btnNew); btnWrap.appendChild(btnFull);
    hdr.appendChild(btnWrap);

    // Filter bar
    var filterBar = document.createElement('div');
    filterBar.style.cssText = 'display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;align-items:center;';
    filterBar.innerHTML = '<input id="crm-ct-q" type="text" placeholder="Tim so HD, ten khach..." '
      + 'style="flex:1;min-width:140px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 11px;color:var(--text);font-family:inherit;font-size:12px;">'
      + '<select id="crm-ct-status" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 9px;color:var(--text3);font-family:inherit;font-size:11px;">'
        + '<option value="">Tat ca trang thai</option>'
        + '<option value="soan_thao">Soan thao</option>'
        + '<option value="hieu_luc">Hieu luc</option>'
        + '<option value="het_han">Het han</option>'
        + '<option value="da_ky">Da ky</option>'
      + '</select>'
      + '<button id="crm-ct-search" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>';

    var listEl = document.createElement('div');
    listEl.id  = 'crm-ct-list';
    listEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div>';

    el.innerHTML = '';
    el.appendChild(hdr);
    el.appendChild(filterBar);
    el.appendChild(listEl);

    var loadCt = function() {
      listEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div>';
      var apiF = typeof window.api === 'function' ? window.api : null; if (!apiF) return;
      apiF('contract_get_list', {
        loai   : 'khach_hang',
        q      : (document.getElementById('crm-ct-q')||{}).value||'',
        status : (document.getElementById('crm-ct-status')||{}).value||'',
        limit  : 15,
      }, function(e, d) {
        if (!listEl.parentNode) return;
        var rows = (!e && d && d.ok) ? d.data : [];
        if (!rows.length) {
          listEl.innerHTML = '<div style="text-align:center;padding:36px;color:var(--text3);">'
            + '<div style="font-size:28px;margin-bottom:8px;">&#x1F4CB;</div>'
            + '<div style="font-size:14px;font-weight:700;">Chua co hop dong</div>'
          + '</div>';
          return;
        }
        var SL = { soan_thao:'Soan thao', cho_duyet:'Cho duyet', gui_kh:'Gui KH', da_ky:'Da ky', hieu_luc:'Hieu luc', het_han:'Het han', huy_bo:'Huy bo', gia_han:'Gia han' };
        var SC = { soan_thao:'#94a3b8', cho_duyet:'#fbbf24', gui_kh:'#818cf8', da_ky:'#06d6d6', hieu_luc:'#34d399', het_han:'#f87171', huy_bo:'#ef4444', gia_han:'#10b981' };
        // Workflow steps mini
        var WF = ['soan_thao','cho_duyet','gui_kh','da_ky','hieu_luc'];
        listEl.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px;">'
          + rows.map(function(c) {
              var stC = SC[c.trang_thai] || '#64748b';
              var stL = SL[c.trang_thai] || c.trang_thai;
              var stepIdx = WF.indexOf(c.trang_thai);
              var isExp = c.den_ngay && (new Date(c.den_ngay) - new Date()) / 86400000 < 30;
              var wfHtml = '<div style="display:flex;align-items:center;gap:2px;margin-top:8px;">'
                + WF.map(function(st, i) {
                    var done = i < stepIdx; var cur = i === stepIdx;
                    var clr = cur ? 'var(--accent2)' : (done ? '#34d399' : 'var(--border2)');
                    return '<div style="flex:1;height:4px;background:' + clr + ';border-radius:99px;'
                      + (i===0?'border-radius:99px 0 0 99px;':(i===WF.length-1?'border-radius:0 99px 99px 0;':'')) + '"></div>';
                  }).join('')
              + '</div>'
              + '<div style="display:flex;justify-content:space-between;margin-top:2px;">'
                + WF.map(function(st, i) {
                    var cur = i === stepIdx;
                    return '<div style="font-size:8px;color:'+(cur?'var(--accent2)':'var(--text3)')+';font-weight:'+(cur?'800':'400')+';text-align:center;flex:1;">'
                      + (SL[st]||st) + '</div>';
                  }).join('')
              + '</div>';
              return '<div style="background:var(--bg2);border:1px solid '+(isExp?'rgba(248,113,113,.3)':'var(--border)')+';border-radius:12px;padding:13px;">'
                + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">'
                  + '<div style="flex:1;">'
                    + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">'
                      + '<span style="font-size:13px;font-weight:800;color:var(--accent2);">' + (c.so_hd||'') + '</span>'
                      + '<span style="background:' + stC + '18;color:' + stC + ';border-radius:4px;padding:1px 6px;font-size:9px;font-weight:800;">' + stL + '</span>'
                      + (isExp ? '<span style="background:rgba(248,113,113,.12);color:#f87171;border-radius:4px;padding:1px 6px;font-size:9px;font-weight:800;">&#x23F0; Sap het han</span>' : '')
                    + '</div>'
                    + '<div style="font-size:12px;font-weight:700;color:var(--text);">' + (c.ten_kh||'') + '</div>'
                    + '<div style="font-size:10px;color:var(--text3);margin-top:2px;">'
                      + (c.gia_tri ? 'Gia tri: ' + Math.round(c.gia_tri/1000000) + 'tr · ' : '')
                      + (c.den_ngay ? 'Het han: ' + c.den_ngay : '') + '</div>'
                  + '</div>'
                + '</div>'
                + wfHtml
              + '</div>';
            }).join('')
        + '</div>'
        + '<div style="font-size:11px;color:var(--text3);margin-top:8px;text-align:right;">' + (d.total||rows.length) + ' hop dong</div>';
      });
    };

    filterBar.querySelector('#crm-ct-search').addEventListener('click', loadCt);
    filterBar.querySelector('#crm-ct-q').addEventListener('keydown', function(e) { if(e.key==='Enter') loadCt(); });
    loadCt();
  }

  function _showContractForm(ct) {
    var isNew=!ct;
    var h='<div style="padding:16px 20px;border-bottom:1px solid var(--border);font-size:15px;font-weight:900;">'+(isNew?'Them hop dong moi':'Sua hop dong')+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px;">'
      +_field('ctf-so','So hop dong *','text',ct?ct.so_hd:'')
      +_field('ctf-kh','Ma KH *','text',ct?ct.khach_id:'')
      +_field('ctf-ten','Ten khach hang','text',ct?ct.ten_kh:'')
      +_field('ctf-gt','Gia tri (VND)','number',ct?ct.gia_tri:0)
      +_field('ctf-tu','Tu ngay','date',ct?ct.tu_ngay:'')
      +_field('ctf-den','Den ngay','date',ct?ct.den_ngay:'')
      +_field('ctf-sla','SLA','text',ct?ct.sla:'24h response')
      +_field('ctf-st','Trang thai','text',ct?ct.trang_thai:'hieu_luc')
      +'<div style="grid-column:1/-1;"><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">Ghi chu</label>'
      +'<textarea id="ctf-gc" rows="2" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'+_esc(ct?ct.ghi_chu||'':'')+'</textarea></div>'
      +'</div>'
      +'<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
      +'<button id="ctf-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
      +'<button id="ctf-save" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--accent2);font-family:inherit;">'+(isNew?'Them':'Luu')+'</button>'
      +'</div>';
    _modal(h,'620px');
    document.getElementById('ctf-cancel').addEventListener('click',_closeModal);
    document.getElementById('ctf-save').addEventListener('click',function(){
      var so=document.getElementById('ctf-so').value.trim();
      var kh=document.getElementById('ctf-kh').value.trim();
      if(!so||!kh){_toast('Nhap So HD va Ma KH','error');return;}
      var apiF=_api();
      apiF('crm_save_contract',{
        so_hd:so,khach_id:kh,ten_kh:document.getElementById('ctf-ten').value,
        gia_tri:Number(document.getElementById('ctf-gt').value||0),
        tu_ngay:document.getElementById('ctf-tu').value,
        den_ngay:document.getElementById('ctf-den').value,
        sla:document.getElementById('ctf-sla').value,
        trang_thai:document.getElementById('ctf-st').value,
        ghi_chu:document.getElementById('ctf-gc').value
      },function(e,d){
        if(!e&&d&&d.ok){_toast('Da luu hop dong','ok');_closeModal();_renderContracts();}
        else _toast((d&&d.error)||'Loi','error');
      });
    });
  }

  // ── Import từ Sapo ───────────────────────────────────────────────
  function _importFromSapo() {
    var btn = document.getElementById('crm-import-btn');
    if (btn) { btn.disabled=true; btn.textContent='Dang import...'; }
    var apiF = _api(); if (!apiF) return;
    apiF('sapo_import_customers', {}, function(e,d){
      if (btn) { btn.disabled=false; btn.innerHTML='&#x1F504; Import Sapo'; }
      if (e||!d||!d.ok) { _toast((d&&d.error)||'Loi import','error'); return; }
      _toast(d.msg||('Da import '+d.count+' KH tu Sapo'),'ok');
      _loadList(); _loadKPI();
    });
  }

})();
