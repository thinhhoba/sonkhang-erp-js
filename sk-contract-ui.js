/* ================================================================
// [v5.32] 22/03/2026 — Contract Unified: KH+NCC, Timeline, Alerts, Detail, Files
 * sk-contract-ui.js  SonKhang ERP v5.6.0
 * Module Hop dong day du:
 *   Tab 1: Dashboard (KPI, sap het han, canh bao)
 *   Tab 2: Danh sach HD (search, filter, workflow)
 *   Tab 3: Mau HD (template engine, preview)
 *   Tab 4: Tao nhanh HD (from KH card)
 *   Chi tiet: workflow, file dinh kem, audit log, in/preview
 * 21/03/2026  0 non-ASCII, DOM API, no ES6
 * ================================================================ */
(function () {

  'use strict';

  var _api   = function(){ return typeof window.api==='function'?window.api:null; };
  var _ct    = function(){ var c=typeof window.getContent==='function'?window.getContent():null; return c||document.getElementById('sk-ct'); };
  var _esc   = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var _fmt   = function(n){ return (Number(n)||0).toLocaleString('vi-VN'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };

  var STATE = { tab:'dashboard' };

  var STATUS_LABEL = {
    soan_thao :'Soan thao', cho_duyet:'Cho duyet', gui_kh:'Gui KH',
    dang_ky   :'Dang ky',   da_ky    :'Da ky',     hieu_luc:'Hieu luc',
    het_han   :'Het han',   huy_bo   :'Huy bo',    gia_han :'Gia han'
  };
  var STATUS_COLOR = {
    soan_thao:'var(--text3)', cho_duyet:'var(--yellow)', gui_kh:'var(--accent2)',
    dang_ky  :'var(--cyan)',  da_ky    :'var(--green)',  hieu_luc:'var(--green)',
    het_han  :'var(--red)',   huy_bo   :'var(--red)',    gia_han :'var(--purple,#a78bfa)'
  };
  var STATUS_FLOW = {
    soan_thao :['cho_duyet','huy_bo'],
    cho_duyet :['gui_kh','soan_thao','huy_bo'],
    gui_kh    :['dang_ky','soan_thao','huy_bo'],
    dang_ky   :['da_ky','gui_kh','huy_bo'],
    da_ky     :['hieu_luc','huy_bo'],
    hieu_luc  :['het_han','gia_han','huy_bo'],
    het_han   :['gia_han'],
    gia_han   :['hieu_luc','huy_bo']
  };

  // ── Modal ─────────────────────────────────────────────────────────
  function _modal(html,maxW){
    var old=document.getElementById('sk-ct-modal');
    if(old&&old.parentNode) old.parentNode.removeChild(old);
    var ov=document.createElement('div');
    ov.id='sk-ct-modal';
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;';
    var box=document.createElement('div');
    box.style.cssText='background:var(--bg2);border:1px solid var(--border2);border-radius:18px;width:100%;max-width:'+(maxW||'760px')+';margin:auto;';
    box.innerHTML=html;
    ov.appendChild(box);
    ov.addEventListener('click',function(e){if(e.target===ov)_closeModal();});
    document.body.appendChild(ov);
  }
  function _closeModal(){var m=document.getElementById('sk-ct-modal');if(m&&m.parentNode)m.parentNode.removeChild(m);}
  window.closeContractModal=_closeModal;

  // ── Main ──────────────────────────────────────────────────────────
  
// [v5.32] CONTRACT MAIN — FULL UPGRADE
// ═══════════════════════════════════════

// ── State ─────────────────────────────────────────────────────────
var _CT = {
  tab:'dashboard', loai:'khach_hang',
  q:'', status:'', dateFrom:'', dateTo:'', ncc:'',
  page:1, detail:null,
};

// ── Workflow steps ─────────────────────────────────────────────────
var WF_STEPS = [
  {key:'soan_thao', label:'Soan thao',   icon:'&#x270F;'},
  {key:'cho_duyet', label:'Cho duyet',   icon:'&#x23F3;'},
  {key:'gui_kh',    label:'Gui KH/NCC',  icon:'&#x1F4E4;'},
  {key:'dang_ky',   label:'Dang ky',     icon:'&#x1F4DD;'},
  {key:'da_ky',     label:'Da ky',       icon:'&#x1F58A;'},
  {key:'hieu_luc',  label:'Hieu luc',    icon:'&#x2705;'},
];

var WF_NEXT = {
  soan_thao:'cho_duyet', cho_duyet:'gui_kh', gui_kh:'dang_ky',
  dang_ky:'da_ky', da_ky:'hieu_luc',
};

var TYPE_CFG = {
  khach_hang:   { label:'Khach hang', icon:'&#x1F465;', color:'#4f6fff', desc:'CRM · KH · Dich vu' },
  nha_cung_cap: { label:'NCC',        icon:'&#x1F3ED;', color:'#f59e0b', desc:'Mua hang · NCC · Cung cap' },
};

// ── Main ─────────────────────────────────────────────────────────
function loadHopDong() {
  var ct=_ct(); if(!ct) return;
  _CT.tab='dashboard';

  ct.innerHTML='<div class="fade-in" style="padding:24px;">'
    +'<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:18px;">'
      +'<div>'
        +'<h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F4CB; Quan ly Hop dong</h1>'
        +'<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Khach hang · NCC · Mau HD · Workflow ky · Canh bao het han</p>'
      +'</div>'
      +'<div style="display:flex;gap:8px;">'
        +'<button onclick="window._ctNew(\'khach_hang\')" style="background:rgba(79,111,255,.12);border:1px solid rgba(79,111,255,.25);color:var(--accent2);border-radius:9px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2795; HD Khach hang</button>'
        +'<button onclick="window._ctNew(\'nha_cung_cap\')" style="background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.25);color:#f59e0b;border-radius:9px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2795; HD NCC</button>'
      +'</div>'
    +'</div>'
    // Tabs
    +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;background:var(--bg2);border-radius:12px;padding:5px;" id="ct-tabs">'
      +'<button data-ct="dashboard" style="flex:1;min-width:70px;border-radius:9px;padding:8px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;border:none;background:var(--accent2);color:#fff;">&#x1F4CA; Tong quan</button>'
      +'<button data-ct="khach_hang" style="flex:1;min-width:70px;border-radius:9px;padding:8px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;border:none;background:none;color:var(--text3);">&#x1F465; Khach hang</button>'
      +'<button data-ct="nha_cung_cap" style="flex:1;min-width:70px;border-radius:9px;padding:8px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;border:none;background:none;color:var(--text3);">&#x1F3ED; NCC</button>'
      +'<button data-ct="templates" style="flex:1;min-width:70px;border-radius:9px;padding:8px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;border:none;background:none;color:var(--text3);">&#x1F4C3; Mau HD</button>'
      +'<button data-ct="alerts" style="flex:1;min-width:70px;border-radius:9px;padding:8px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;border:none;background:none;color:var(--text3);">&#x1F514; Canh bao</button>'
    +'</div>'
    +'<div id="ct-body"></div>'
  +'</div>';

  ct.querySelectorAll('[data-ct]').forEach(function(btn){
    btn.addEventListener('click',function(){
      ct.querySelectorAll('[data-ct]').forEach(function(b){ b.style.background='none'; b.style.color='var(--text3)'; });
      btn.style.background='var(--accent2)'; btn.style.color='#fff';
      var t=btn.getAttribute('data-ct'); _CT.tab=t;
      _ctRenderTab(t);
    });
  });
  _ctRenderTab('dashboard');
}

function _ctRenderTab(t){
  if      (t==='dashboard')    _ctDashboard();
  else if (t==='khach_hang')   _ctList('khach_hang');
  else if (t==='nha_cung_cap') _ctList('nha_cung_cap');
  else if (t==='templates')    _renderTemplates();
  else if (t==='alerts')       _ctAlerts();
}

// ── TAB 1: DASHBOARD ─────────────────────────────────────────────
function _ctDashboard(){
  var el=document.getElementById('ct-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div>';
  var apiF=_api();if(!apiF)return;

  var done=0; var kh={}, ncc={}, alerts=[];
  function _check(){ if(++done<3)return; _ctDrawDashboard(kh,ncc,alerts); }

  apiF('contract_get_dashboard',{loai:'khach_hang'},function(e,d){ kh=(!e&&d&&d.ok)?d:{}; _check(); });
  apiF('contract_get_dashboard',{loai:'nha_cung_cap'},function(e,d){ ncc=(!e&&d&&d.ok)?d:{}; _check(); });
  apiF('contract_get_expiry_alerts',{days:30},function(e,d){ alerts=(!e&&d&&d.ok)?d.data:[]; _check(); });
}

function _ctDrawDashboard(kh, ncc, alerts){
  var el=document.getElementById('ct-body');if(!el)return;
  var khs=kh.stats||{}; var nccs=ncc.stats||{};
  var totalAll=(khs.total||0)+(nccs.total||0);
  var hlAll=(khs.hieu_luc||0)+(nccs.hieu_luc||0);
  var gtAll=(khs.tong_gia_tri||0)+(nccs.tong_gia_tri||0);

  var html='';
  // KPI row
  html+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">';
  [
    {val:totalAll,      lbl:'Tong HD',      clr:'#818cf8', icon:'&#x1F4CB;'},
    {val:hlAll,         lbl:'Dang hieu luc',clr:'#34d399', icon:'&#x2705;'},
    {val:alerts.length, lbl:'Sap het han',  clr:'#f87171', icon:'&#x23F0;'},
    {val:_fmtVal(gtAll),lbl:'Tong gia tri', clr:'#fbbf24', icon:'&#x1F4B0;'},
  ].forEach(function(k){
    html+='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
      +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">'
        +'<span style="font-size:18px;">'+k.icon+'</span>'
        +'<span style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;">'+k.lbl+'</span>'
      +'</div>'
      +'<div style="font-size:24px;font-weight:900;color:'+k.clr+';font-family:monospace;">'+k.val+'</div>'
    +'</div>';
  });
  html+='</div>';

  // KH vs NCC split
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">';
  [
    {cfg:TYPE_CFG.khach_hang,   s:khs, key:'khach_hang'},
    {cfg:TYPE_CFG.nha_cung_cap, s:nccs,key:'nha_cung_cap'},
  ].forEach(function(x){
    html+='<div style="background:var(--bg2);border:1px solid '+x.cfg.color+'44;border-left:3px solid '+x.cfg.color+';border-radius:12px;padding:14px;">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'
        +'<div style="display:flex;align-items:center;gap:8px;">'
          +'<span style="font-size:20px;">'+x.cfg.icon+'</span>'
          +'<span style="font-size:13px;font-weight:800;color:var(--text);">'+x.cfg.label+'</span>'
        +'</div>'
        +'<button onclick="window._ctGoTab(\''+x.key+'\')" style="background:'+x.cfg.color+'18;border:1px solid '+x.cfg.color+'33;color:'+x.cfg.color+';border-radius:7px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Xem tat ca</button>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
    [
      {lbl:'Tong',       val:x.s.total||0},
      {lbl:'Hieu luc',   val:x.s.hieu_luc||0},
      {lbl:'Cho duyet',  val:x.s.cho_duyet||0},
      {lbl:'Gia tri',    val:_fmtVal(x.s.tong_gia_tri||0)},
    ].forEach(function(r){
      html+='<div style="background:var(--bg3);border-radius:8px;padding:8px;">'
        +'<div style="font-size:10px;color:var(--text3);margin-bottom:2px;">'+r.lbl+'</div>'
        +'<div style="font-size:16px;font-weight:800;color:var(--text);font-family:monospace;">'+r.val+'</div>'
      +'</div>';
    });
    html+='</div></div>';
  });
  html+='</div>';

  // Expiry alerts
  if(alerts.length){
    html+='<div style="background:rgba(248,113,113,.06);border:1px solid rgba(248,113,113,.2);border-radius:14px;padding:16px;">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">'
        +'<span style="font-size:16px;">&#x23F0;</span>'
        +'<span style="font-size:13px;font-weight:800;color:#f87171;">'+alerts.length+' HD sap het han (trong 30 ngay)</span>'
      +'</div>'
      +'<div style="display:flex;flex-direction:column;gap:6px;">';
    alerts.slice(0,6).forEach(function(a){
      var tc=TYPE_CFG[a.loai]||TYPE_CFG.khach_hang;
      var urgCl=a.days_left<=7?'#f87171':(a.days_left<=15?'#fbbf24':'#a3a3a3');
      html+='<div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg2);border-radius:9px;padding:9px 12px;">'
        +'<div style="display:flex;align-items:center;gap:8px;">'
          +'<span style="font-size:14px;">'+tc.icon+'</span>'
          +'<div>'
            +'<div style="font-size:12px;font-weight:700;color:var(--text);">'
              +_esc(a.ten_kh||(a.ten_ncc||a.so_hd))
            +'</div>'
            +'<div style="font-size:10px;color:var(--text3);">'+_esc(a.so_hd)+' · '+_esc(a.den_ngay)+'</div>'
          +'</div>'
        +'</div>'
        +'<div style="text-align:right;">'
          +'<div style="font-size:13px;font-weight:900;color:'+urgCl+';font-family:monospace;">'+a.days_left+' ngay</div>'
          +'<button onclick="window._ctAction(\'gia_han\',\''+_esc(a.so_hd)+'\')" style="font-size:10px;background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:5px;padding:2px 8px;cursor:pointer;font-family:inherit;">Gia han</button>'
        +'</div>'
      +'</div>';
    });
    html+='</div></div>';
  }

  el.innerHTML=html;
}

window._ctGoTab = function(t){
  var ct=_ct();if(!ct)return;
  ct.querySelectorAll('[data-ct]').forEach(function(b){ b.style.background='none'; b.style.color='var(--text3)'; });
  var btn=ct.querySelector('[data-ct="'+t+'"]');
  if(btn){ btn.style.background='var(--accent2)'; btn.style.color='#fff'; }
  _CT.tab=t; _ctRenderTab(t);
};

// ── TAB 2+3: DANH SÁCH (KH / NCC) ────────────────────────────────
function _ctList(loai){
  var el=document.getElementById('ct-body');if(!el)return;
  _CT.loai=loai; _CT.page=1; _CT.q=''; _CT.status=''; _CT.dateFrom=''; _CT.dateTo='';
  var tc=TYPE_CFG[loai]||TYPE_CFG.khach_hang;

  el.innerHTML=
    '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">'
      +'<input id="ct-q" type="text" placeholder="Tim so HD, ten '+tc.label+'..." style="flex:1;min-width:160px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 11px;color:var(--text);font-family:inherit;font-size:12px;">'
      +'<select id="ct-status" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 9px;color:var(--text3);font-family:inherit;font-size:11px;">'
        +'<option value="">Tat ca trang thai</option>'
        +Object.keys(STATUS_LABEL).map(function(k){ return '<option value="'+k+'">'+STATUS_LABEL[k]+'</option>'; }).join('')
      +'</select>'
      +'<input id="ct-df" type="date" title="Tu ngay" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-family:inherit;font-size:11px;">'
      +'<input id="ct-dt" type="date" title="Den ngay" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-family:inherit;font-size:11px;">'
      +'<button id="ct-search" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
    +'</div>'
    +'<div id="ct-list"></div>'
    +'<div id="ct-pagination" style="display:flex;gap:6px;justify-content:center;margin-top:12px;flex-wrap:wrap;"></div>';

  var doSearch=function(){
    _CT.q=(document.getElementById('ct-q')||{}).value||'';
    _CT.status=(document.getElementById('ct-status')||{}).value||'';
    _CT.dateFrom=(document.getElementById('ct-df')||{}).value||'';
    _CT.dateTo=(document.getElementById('ct-dt')||{}).value||'';
    _CT.page=1; _ctLoadList();
  };
  document.getElementById('ct-search').addEventListener('click',doSearch);
  document.getElementById('ct-q').addEventListener('keydown',function(e){if(e.key==='Enter')doSearch();});
  _ctLoadList();
}

function _ctLoadList(){
  var el=document.getElementById('ct-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('contract_get_list',{
    q:_CT.q, status:_CT.status, loai:_CT.loai,
    date_from:_CT.dateFrom, date_to:_CT.dateTo, limit:15, page:_CT.page,
  },function(e,d){
    if(e||!d||!d.ok){
      el.innerHTML='<div style="color:var(--red);padding:16px;background:rgba(239,68,68,.08);border-radius:10px;">Loi tai danh sach</div>';
      return;
    }
    var rows=d.data||[];
    var total=d.total||0;
    if(!rows.length){
      var tc=TYPE_CFG[_CT.loai]||TYPE_CFG.khach_hang;
      el.innerHTML='<div style="text-align:center;padding:48px;color:var(--text3);">'
        +'<div style="font-size:36px;margin-bottom:10px;">'+tc.icon+'</div>'
        +'<div style="font-size:14px;font-weight:700;">Chua co hop dong '+tc.label+'</div>'
        +'<div style="margin-top:12px;">'
          +'<button onclick="window._ctNew(\''+_CT.loai+'\')" style="background:var(--accent);border:none;color:#fff;border-radius:9px;padding:9px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2795; Tao hop dong moi</button>'
        +'</div>'
      +'</div>';
      _ctRenderPagination(0,15);
      return;
    }
    el.innerHTML='<div style="display:flex;flex-direction:column;gap:8px;">'
      +rows.map(function(c){ return _ctCard(c); }).join('')
    +'</div>'
    +'<div style="font-size:11px;color:var(--text3);margin-top:8px;text-align:right;">'+total+' hop dong</div>';
    _ctRenderPagination(total,15);
    // Bind actions
    el.querySelectorAll('[data-ct-btn]').forEach(function(btn){
      btn.addEventListener('click',function(){
        var act=btn.getAttribute('data-ct-btn');
        var id=btn.getAttribute('data-id');
        if(act==='detail') _ctShowDetail(id);
        else if(act==='status') _ctQuickStatus(id,btn.getAttribute('data-next'));
        else if(act==='delete') _ctDelete(id);
      });
    });
  });
}

function _ctCard(c){
  var tc=TYPE_CFG[c.loai||'khach_hang']||TYPE_CFG.khach_hang;
  var stC=STATUS_COLOR[c.trang_thai]||'var(--text3)';
  var stL=STATUS_LABEL[c.trang_thai]||c.trang_thai||'';
  var nextSt=WF_NEXT[c.trang_thai]||'';
  var nextLbl=nextSt?(STATUS_LABEL[nextSt]||nextSt):'';
  var isExpiring=c.den_ngay&&(new Date(c.den_ngay)-new Date())/(1000*86400)<30;

  // Timeline
  var stepIdx=WF_STEPS.findIndex(function(s){return s.key===c.trang_thai;});
  var timelineHtml='<div style="display:flex;align-items:center;gap:0;margin-top:10px;overflow-x:auto;">'
    +WF_STEPS.map(function(st,i){
      var done=i<stepIdx; var cur=i===stepIdx;
      var clr=cur?'var(--accent2)':(done?'#34d399':'var(--text3)');
      return '<div style="display:flex;align-items:center;gap:0;flex-shrink:0;">'
        +'<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">'
          +'<div style="width:24px;height:24px;border-radius:50%;border:2px solid '+clr+';background:'+(cur?'var(--accent2)':(done?'rgba(52,211,153,.15)':'var(--bg3)'))+';display:flex;align-items:center;justify-content:center;font-size:10px;">'+st.icon+'</div>'
          +'<div style="font-size:8px;color:'+clr+';font-weight:'+(cur?'900':'600')+';white-space:nowrap;">'+st.label+'</div>'
        +'</div>'
        +(i<WF_STEPS.length-1?'<div style="height:2px;width:18px;background:'+(done?'#34d399':'var(--border2)')+';margin:0 2px;margin-bottom:12px;flex-shrink:0;"></div>':'')
      +'</div>';
    }).join('')
  +'</div>';

  return '<div style="background:var(--bg2);border:1px solid '+(isExpiring?'rgba(248,113,113,.3)':'var(--border)')+';border-left:3px solid '+tc.color+';border-radius:14px;padding:15px;">'
    +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;">'
      +'<div style="flex:1;">'
        +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">'
          +'<span style="font-size:14px;font-weight:900;color:var(--accent2);font-family:monospace;">'+_esc(c.so_hd)+'</span>'
          +'<span style="font-size:9px;background:'+tc.color+'18;color:'+tc.color+';border-radius:4px;padding:1px 7px;font-weight:800;">'+tc.icon+' '+tc.label+'</span>'
          +'<span style="font-size:9px;background:'+stC+'18;color:'+stC+';border-radius:4px;padding:1px 7px;font-weight:800;">'+stL+'</span>'
          +(isExpiring?'<span style="font-size:9px;background:rgba(248,113,113,.15);color:#f87171;border-radius:4px;padding:1px 7px;font-weight:800;">&#x23F0; Sap het han</span>':'')
        +'</div>'
        +'<div style="font-size:13px;font-weight:700;color:var(--text);">'+_esc(c.ten_kh||(c.ten_ncc||''))+'</div>'
        +'<div style="display:flex;gap:14px;margin-top:4px;flex-wrap:wrap;">'
          +'<span style="font-size:11px;color:var(--text3);">Gia tri: <strong style="color:var(--green);">'+_fmtVal(c.gia_tri||0)+'</strong></span>'
          +(c.tu_ngay?'<span style="font-size:11px;color:var(--text3);">'+_esc(c.tu_ngay)+' → '+_esc(c.den_ngay||'...')+'</span>':'')
        +'</div>'
      +'</div>'
      +'<div style="display:flex;gap:6px;align-items:flex-start;flex-shrink:0;">'
        +'<button data-ct-btn="detail" data-id="'+_esc(c.so_hd)+'" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:7px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Chi tiet</button>'
        +(nextSt?'<button data-ct-btn="status" data-id="'+_esc(c.so_hd)+'" data-next="'+nextSt+'" style="background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.25);color:#34d399;border-radius:7px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">→ '+nextLbl+'</button>':'')
      +'</div>'
    +'</div>'
    +timelineHtml
  +'</div>';
}

function _ctRenderPagination(total, limit){
  var el=document.getElementById('ct-pagination');if(!el)return;
  var pages=Math.ceil(total/limit)||1; if(pages<=1){el.innerHTML='';return;}
  var html='';
  var s=Math.max(1,_CT.page-2),e=Math.min(pages,_CT.page+2);
  if(s>1) html+='<button onclick="window._ctPage(1)" style="'+_pgB(false)+'">1</button><span style="color:var(--text3);padding:0 4px;">...</span>';
  for(var p=s;p<=e;p++) html+='<button onclick="window._ctPage('+p+')" style="'+_pgB(_CT.page===p)+'">'+p+'</button>';
  if(e<pages) html+='<span style="color:var(--text3);padding:0 4px;">...</span><button onclick="window._ctPage('+pages+')" style="'+_pgB(false)+'">'+pages+'</button>';
  el.innerHTML=html;
}
function _pgB(a){ return 'background:'+(a?'var(--accent2)':'var(--bg3)')+';border:1px solid var(--border2);color:'+(a?'#fff':'var(--text2)')+';border-radius:7px;padding:5px 11px;font-size:12px;font-weight:700;cursor:pointer;'; }
window._ctPage=function(p){ _CT.page=p; _ctLoadList(); };

// ── Contract Detail ───────────────────────────────────────────────
function _ctShowDetail(soHd){
  var apiF=_api();if(!apiF)return;
  var el=document.getElementById('ct-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai chi tiet...</div>';
  var loaded=0; var detail=null, files=[], log=[];
  function _done(){
    if(++loaded<3)return;
    _ctDrawDetail(detail,files,log);
  }
  apiF('contract_get_detail',{so_hd:soHd},function(e,d){ detail=(!e&&d&&d.ok)?d.data:null; _done(); });
  apiF('contract_get_files', {so_hd:soHd},function(e,d){ files=(!e&&d&&d.ok)?d.data:[]; _done(); });
  apiF('contract_get_log',   {so_hd:soHd},function(e,d){ log=(!e&&d&&d.ok)?d.data:[]; _done(); });
}

function _ctDrawDetail(d,files,log){
  var el=document.getElementById('ct-body');if(!el)return;
  if(!d){ el.innerHTML='<div style="color:var(--red);padding:16px;">Khong tim thay hop dong</div>';return; }
  var tc=TYPE_CFG[d.loai||'khach_hang']||TYPE_CFG.khach_hang;
  var stC=STATUS_COLOR[d.trang_thai]||'var(--text3)';
  var nextSt=WF_NEXT[d.trang_thai]||'';
  var nextLbl=nextSt?(STATUS_LABEL[nextSt]||nextSt):'';

  // Timeline
  var stepIdx=WF_STEPS.findIndex(function(s){return s.key===d.trang_thai;});
  var tl='<div style="display:flex;align-items:center;gap:0;overflow-x:auto;padding:4px 0;">'
    +WF_STEPS.map(function(st,i){
      var done=i<stepIdx; var cur=i===stepIdx;
      var clr=cur?'var(--accent2)':(done?'#34d399':'var(--text3)');
      return '<div style="display:flex;align-items:center;gap:0;flex-shrink:0;">'
        +'<div style="display:flex;flex-direction:column;align-items:center;gap:3px;">'
          +'<div style="width:32px;height:32px;border-radius:50%;border:2px solid '+clr+';background:'+(cur?'var(--accent2)':(done?'rgba(52,211,153,.15)':'var(--bg3)'))+';display:flex;align-items:center;justify-content:center;font-size:13px;">'+st.icon+'</div>'
          +'<div style="font-size:9px;color:'+clr+';font-weight:'+(cur?'900':'600')+';white-space:nowrap;">'+st.label+'</div>'
        +'</div>'
        +(i<WF_STEPS.length-1?'<div style="height:2px;width:24px;background:'+(done?'#34d399':'var(--border2)')+';margin:0 3px;margin-bottom:15px;flex-shrink:0;"></div>':'')
      +'</div>';
    }).join('')
  +'</div>';

  el.innerHTML='<button onclick="window._ctGoTab(\''+_CT.loai+'\')" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:14px;">&#x2190; Quay lai</button>'
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-left:3px solid '+tc.color+';border-radius:14px;padding:18px;margin-bottom:12px;">'
      +'<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;">'
        +'<div>'
          +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
            +'<span style="font-size:16px;font-weight:900;color:var(--accent2);">'+_esc(d.so_hd)+'</span>'
            +'<span style="font-size:10px;background:'+tc.color+'18;color:'+tc.color+';border-radius:4px;padding:2px 8px;font-weight:800;">'+tc.icon+' '+tc.label+'</span>'
            +'<span style="font-size:10px;background:'+stC+'18;color:'+stC+';border-radius:4px;padding:2px 8px;font-weight:800;">'+STATUS_LABEL[d.trang_thai]+'</span>'
          +'</div>'
          +'<div style="font-size:15px;font-weight:800;color:var(--text);">'+_esc(d.ten_kh||(d.ten_ncc||''))+'</div>'
        +'</div>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap;">'
          +(nextSt?'<button onclick="window._ctQuickStatus(\''+_esc(d.so_hd)+'\',\''+nextSt+'\')" style="background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.25);color:#34d399;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2192; '+nextLbl+'</button>':'')
          +'<button onclick="window._ctNew(\''+_CT.loai+'\',\''+_esc(d.so_hd)+'\')" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x270F; Sua</button>'
        +'</div>'
      +'</div>'
      +tl
    +'</div>'
    // Info grid
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;">Thong tin HD</div>'
        +[
          ['So HD',    d.so_hd],
          ['Loai',     tc.label],
          ['Gia tri',  _fmtVal(d.gia_tri||0)],
          ['PT TT',    d.pt_tt||''],
          ['Tu ngay',  d.tu_ngay||''],
          ['Den ngay', d.den_ngay||''],
          ['Ghi chu',  d.ghi_chu||''],
        ].map(function(r){
          return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);">'
            +'<span style="font-size:11px;color:var(--text3);">'+_esc(r[0])+'</span>'
            +'<span style="font-size:11px;font-weight:700;color:var(--text);">'+_esc(r[1]||'—')+'</span>'
          +'</div>';
        }).join('')
      +'</div>'
      // Files
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;">File dinh kem ('+files.length+')</div>'
        +(files.length
          ? files.map(function(f){
              return '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">'
                +'<span style="font-size:11px;color:var(--text);">&#x1F4CE; '+_esc(f.ten||f.url||'')+'</span>'
                +(f.url?'<a href="'+_esc(f.url)+'" target="_blank" style="font-size:10px;color:var(--accent2);">Mo</a>':'')
              +'</div>';
            }).join('')
          : '<div style="font-size:11px;color:var(--text3);">Chua co file</div>'
        )
        +'<div style="margin-top:10px;">'
          +'<input id="det-file-url" type="text" placeholder="URL file Google Drive..." style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:7px;padding:6px 9px;font-size:11px;font-family:inherit;box-sizing:border-box;margin-bottom:6px;">'
          +'<button onclick="window._ctAddFile(\''+_esc(d.so_hd)+'\')" style="background:var(--accent);border:none;color:#fff;border-radius:7px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Them file</button>'
        +'</div>'
      +'</div>'
    +'</div>'
    // Log
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
      +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;">Lich su thay doi</div>'
      +(log.length
        ? '<div style="display:flex;flex-direction:column;gap:4px;">'
          +log.map(function(l){
            return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);">'
              +'<div style="width:6px;height:6px;border-radius:50%;background:var(--accent2);flex-shrink:0;"></div>'
              +'<div style="flex:1;font-size:11px;color:var(--text2);">'+_esc(l.mo_ta||l.action||'')+'</div>'
              +'<div style="font-size:10px;color:var(--text3);">'+_esc(l.nguoi||'')+'</div>'
              +'<div style="font-size:10px;color:var(--text3);">'+_esc((l.ngay||'').split('T')[0])+'</div>'
            +'</div>';
          }).join('')
        +'</div>'
        : '<div style="font-size:11px;color:var(--text3);">Chua co lich su</div>'
      )
    +'</div>';
}

// ── TAB 5: CẢNH BÁO ───────────────────────────────────────────────
function _ctAlerts(){
  var el=document.getElementById('ct-body');if(!el)return;
  el.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">'
    +'<select id="al-days" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
      +'<option value="7">7 ngay toi</option>'
      +'<option value="15">15 ngay toi</option>'
      +'<option value="30" selected>30 ngay toi</option>'
      +'<option value="60">60 ngay toi</option>'
    +'</select>'
    +'<select id="al-loai" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
      +'<option value="">Tat ca loai</option>'
      +'<option value="khach_hang">Khach hang</option>'
      +'<option value="nha_cung_cap">NCC</option>'
    +'</select>'
    +'<button id="al-search" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Xem</button>'
  +'</div>'
  +'<div id="al-list"><div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div></div>';

  var load=function(){
    var days=Number((document.getElementById('al-days')||{}).value||30);
    var loai=(document.getElementById('al-loai')||{}).value||'';
    var alEl=document.getElementById('al-list');if(!alEl)return;
    alEl.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div>';
    var apiF=_api();if(!apiF)return;
    apiF('contract_get_expiry_alerts',{days:days,loai:loai},function(e,d){
      var rows=(!e&&d&&d.ok)?d.data:[];
      if(!rows.length){alEl.innerHTML='<div style="text-align:center;padding:36px;color:var(--text3);">&#x2705; Khong co HD het han trong thoi gian nay</div>';return;}
      alEl.innerHTML='<div style="display:flex;flex-direction:column;gap:8px;">'
        +rows.map(function(a){
          var tc=TYPE_CFG[a.loai||'khach_hang']||TYPE_CFG.khach_hang;
          var urgCl=a.days_left<=7?'#f87171':(a.days_left<=15?'#fbbf24':'#a3a3a3');
          return '<div style="background:var(--bg2);border:1px solid rgba(248,113,113,.2);border-left:3px solid '+urgCl+';border-radius:12px;padding:13px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">'
            +'<div style="display:flex;align-items:center;gap:10px;">'
              +'<span style="font-size:20px;">'+tc.icon+'</span>'
              +'<div>'
                +'<div style="font-size:12px;font-weight:800;color:var(--text);">'+_esc(a.ten_kh||(a.ten_ncc||a.so_hd))+'</div>'
                +'<div style="font-size:10px;color:var(--text3);">'+_esc(a.so_hd)+' · Het han: '+_esc(a.den_ngay)+'</div>'
                +'<div style="font-size:11px;color:var(--text3);">Gia tri: '+_fmtVal(a.gia_tri||0)+'</div>'
              +'</div>'
            +'</div>'
            +'<div style="display:flex;align-items:center;gap:8px;">'
              +'<div style="font-size:22px;font-weight:900;color:'+urgCl+';font-family:monospace;">'+a.days_left+'</div>'
              +'<div style="font-size:10px;color:var(--text3);">ngay<br>con lai</div>'
              +'<button onclick="window._ctAction(\'gia_han\',\''+_esc(a.so_hd)+'\')" style="background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.25);color:#34d399;border-radius:7px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Gia han</button>'
            +'</div>'
          +'</div>';
        }).join('')
      +'</div>';
    });
  };
  document.getElementById('al-search').addEventListener('click',load);
  load();
}

// ── Form Tạo / Sửa ───────────────────────────────────────────────
window._ctNew = function(loai, soHd) {
  var tc=TYPE_CFG[loai||'khach_hang']||TYPE_CFG.khach_hang;
  var isEdit=!!soHd;
  var ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});

  ov.innerHTML='<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:18px;width:100%;max-width:560px;padding:24px;max-height:90vh;overflow-y:auto;">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">'
      +'<span style="font-size:15px;font-weight:900;">'+(isEdit?'Sua':'Tao')+' HD '+tc.label+'</span>'
      +'<button id="ov-close" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:20px;">&#xd7;</button>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      +_formRow('ct-f-kh',     (loai==='nha_cung_cap'?'Ten NCC':'Ten khach hang')+'*','text','',  '1fr')
      +_formRow('ct-f-gt',     'Gia tri (VND)',           'number','',      '1fr')
      +_formRow('ct-f-pttt',   'Phuong thuc TT',          'text',  'Chuyen khoan','1fr')
      +_formRow('ct-f-tu',     'Tu ngay',                 'date',  '',      '1fr')
      +_formRow('ct-f-den',    'Den ngay',                'date',  '',      '1fr')
      +_formRow('ct-f-gchu',   'Ghi chu',                 'text',  '',      '2fr')
    +'</div>'
    +(loai==='nha_cung_cap'
      ?'<div style="margin-top:10px;margin-bottom:4px;font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;">Ma NCC (tuy chon)</div>'
       +'<input id="ct-f-ncc" type="text" placeholder="Ma nha cung cap..." style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:8px 10px;font-size:12px;font-family:inherit;box-sizing:border-box;margin-bottom:10px;">'
      :'')
    +'<button id="ct-f-save" style="margin-top:14px;width:100%;background:var(--accent);border:none;color:#fff;border-radius:10px;padding:11px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Luu hop dong</button>'
  +'</div>';

  ov.querySelector('#ov-close').addEventListener('click',function(){ov.remove();});
  ov.querySelector('#ct-f-save').addEventListener('click',function(){
    var btn=ov.querySelector('#ct-f-save');
    var tenKH=(ov.querySelector('#ct-f-kh')||{}).value||'';
    if(!tenKH.trim()){_toast('Nhap ten khach hang / NCC','error');return;}
    btn.disabled=true; btn.textContent='Dang luu...';
    var apiF=_api();if(!apiF)return;
    var payload={
      loai       : loai||'khach_hang',
      ten_kh     : loai!=='nha_cung_cap'?tenKH:'',
      ten_ncc    : loai==='nha_cung_cap'?tenKH:'',
      ncc_id     : (ov.querySelector('#ct-f-ncc')||{}).value||'',
      gia_tri    : Number((ov.querySelector('#ct-f-gt')||{}).value||0),
      pt_tt      : (ov.querySelector('#ct-f-pttt')||{}).value||'Chuyen khoan',
      tu_ngay    : (ov.querySelector('#ct-f-tu')||{}).value||'',
      den_ngay   : (ov.querySelector('#ct-f-den')||{}).value||'',
      ghi_chu    : (ov.querySelector('#ct-f-gchu')||{}).value||'',
      nguoi_tao  : 'admin',
    };
    if(soHd) payload.so_hd=soHd;
    apiF('contract_save',payload,function(e,d){
      if(!e&&d&&d.ok){
        ov.remove();
        _toast((isEdit?'Da cap nhat':'Da tao')+' hop dong '+tc.label,'ok');
        _ctList(loai);
      } else { btn.disabled=false; btn.textContent='Luu hop dong'; _toast((d&&d.error)||'Loi','error'); }
    });
  });
  document.body.appendChild(ov);
  setTimeout(function(){var inp=ov.querySelector('#ct-f-kh');if(inp)inp.focus();},50);
};

function _formRow(id,label,type,val,span){
  return '<div style="grid-column:span '+(span==='2fr'?2:1)+';">'
    +'<label style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:4px;">'+label+'</label>'
    +'<input id="'+id+'" type="'+type+'" value="'+_esc(val)+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:8px 10px;font-size:12px;font-family:inherit;box-sizing:border-box;">'
  +'</div>';
}

// ── Quick actions ──────────────────────────────────────────────────
window._ctQuickStatus = function(soHd, nextStatus) {
  var apiF=_api();if(!apiF)return;
  apiF('contract_update_status',{so_hd:soHd,trang_thai:nextStatus,nguoi_duyet:'admin'},function(e,d){
    if(!e&&d&&d.ok){ _toast('Da cap nhat: '+STATUS_LABEL[nextStatus],'ok'); _ctLoadList(); }
    else _toast((d&&d.error)||'Loi','error');
  });
};

window._ctAddFile = function(soHd) {
  var url=(document.getElementById('det-file-url')||{}).value||'';
  if(!url.trim()){_toast('Nhap URL file','error');return;}
  var apiF=_api();if(!apiF)return;
  apiF('contract_add_file',{so_hd:soHd,url:url,ten:'File dinh kem'},function(e,d){
    if(!e&&d&&d.ok){ _toast('Da them file','ok'); _ctShowDetail(soHd); }
    else _toast((d&&d.error)||'Loi','error');
  });
};

window._ctAction = function(action, soHd) {
  if(action==='gia_han'){
    var newDen=prompt('Ngay gia han (YYYY-MM-DD):','');
    if(!newDen) return;
    var apiF=_api();if(!apiF)return;
    apiF('contract_save',{so_hd:soHd,den_ngay:newDen,trang_thai:'gia_han'},function(e,d){
      if(!e&&d&&d.ok){ _toast('Da gia han hop dong','ok'); _ctDashboard(); }
      else _toast((d&&d.error)||'Loi','error');
    });
  }
};

window._ctDelete = function(soHd){
  if(!confirm('Xac nhan xoa hop dong '+soHd+'?')) return;
  var apiF=_api();if(!apiF)return;
  apiF('contract_delete',{so_hd:soHd},function(e,d){
    if(!e&&d&&d.ok){ _toast('Da xoa','ok'); _ctLoadList(); }
    else _toast((d&&d.error)||'Loi','error');
  });
};

// ── Helper ─────────────────────────────────────────────────────────
function _fmtVal(n){ n=Number(n||0); if(n>=1e9) return (n/1e9).toFixed(1)+'ty'; if(n>=1e6) return (n/1e6).toFixed(1)+'tr'; if(n>=1e3) return Math.round(n/1e3)+'k'; return String(n); }

window.loadHopDong  = loadHopDong;
window.loadContracts= loadHopDong;


function _renderTemplates(){
    var el=document.getElementById('ct-body'); if(!el) return;
    el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
      +'<div style="font-size:13px;font-weight:900;">Mau hop dong</div>'
      +'<button id="tpl-new-btn" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">+ Tao mau moi</button>'
      +'</div>'
      +'<div id="tpl-list"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>';
    document.getElementById('tpl-new-btn').addEventListener('click',function(){_showTemplateForm(null);});
    _loadTemplates();
  }

function _loadTemplates(){
    var el=document.getElementById('tpl-list'); if(!el) return;
    var apiF=_api(); if(!apiF) return;
    apiF('contract_get_templates',{},function(e,d){
      var rows=(!e&&d&&d.ok)?d.data||[]:[];
      if(!rows.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Chua co mau HD</div>';return;}
      var html='<div style="display:grid;gap:10px;">';
      rows.forEach(function(t){
        html+='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
          +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">'
          +'<div>'
          +'<span style="font-size:13px;font-weight:900;">'+_esc(t.ten)+'</span>'
          +' <span style="padding:2px 8px;border-radius:5px;font-size:10px;font-weight:800;background:rgba(79,111,255,.1);color:var(--accent2);">'+_esc(t.loai)+'</span>'
          +'</div>'
          +'<div style="display:flex;gap:6px;">'
          +'<button data-tpl-preview="'+_esc(t.id)+'" style="background:none;border:none;color:var(--cyan);cursor:pointer;font-size:13px;" title="Preview">&#x1F441;</button>'
          +'<button data-tpl-edit="'+_esc(t.id)+'" style="background:none;border:none;color:var(--accent2);cursor:pointer;font-size:13px;">&#x270F;</button>'
          +'</div></div>'
          +(t.bien&&t.bien.length?'<div style="font-size:11px;color:var(--text3);">Bien: '
            +t.bien.map(function(b){return '{{'+b.key+'}}';}).join(' ')
            +'</div>':'')
          +'</div>';
      });
      html+='</div>';
      el.innerHTML=html;
      el.querySelectorAll('[data-tpl-edit]').forEach(function(btn){
        btn.addEventListener('click',function(){
          var id=btn.getAttribute('data-tpl-edit');
          var tpl=rows.find(function(t){return t.id===id;});
          if(tpl)_showTemplateForm(tpl);
        });
      });
      el.querySelectorAll('[data-tpl-preview]').forEach(function(btn){
        btn.addEventListener('click',function(){
          var apiF2=_api();
          apiF2('contract_preview_template',{id:btn.getAttribute('data-tpl-preview'),vars:{}},function(e2,d2){
            if(!e2&&d2&&d2.ok) _showPreviewModal(d2.html);
          });
        });
      });
    });
  }

function _loadTemplateVars(mauId,templates,c){
    var tpl=templates.find(function(t){return t.id===mauId;});
    var sec=document.getElementById('ctf-vars-section'); if(!sec) return;
    if(!tpl||!tpl.bien||!tpl.bien.length){sec.innerHTML='';return;}
    var existVals=(c&&c.bien_values)||{};
    var html='<div style="border:1px solid var(--border);border-radius:10px;padding:12px;">'
      +'<div style="font-size:11px;font-weight:800;color:var(--text3);margin-bottom:10px;">BIEN TRONG MAU HD (tu dong dien)</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
    tpl.bien.forEach(function(b){
      var val=existVals[b.key]||'';
      html+='<div><label style="display:block;font-size:10px;font-weight:800;color:var(--text3);margin-bottom:4px;">{{'+_esc(b.key)+'}} - '+_esc(b.label)+'</label>'
        +'<input type="text" data-var-key="'+_esc(b.key)+'" value="'+_esc(val)+'" '
        +'style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:6px 10px;color:var(--text);font-family:inherit;font-size:11px;"></div>';
    });
    html+='</div></div>';
    sec.innerHTML=html;
    // Auto-fill từ form fields
    var tenKH=(document.getElementById('ctf-ten-kh')||{}).value||'';
    var tenKHInput=sec.querySelector('[data-var-key="ten_kh"]');
    if(tenKHInput&&!tenKHInput.value&&tenKH) tenKHInput.value=tenKH;
  }

}());
