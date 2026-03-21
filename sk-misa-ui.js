/* ================================================================
 * sk-misa-ui.js  SonKhang ERP v5.10.0
 * Hoa don VAT: Sapo → ERP → Misa
 * Tabs: Dashboard | Mapping SKU | Ton kho Misa | Hoa don nhap | Xuat Excel
 * 0 non-ASCII outside strings, DOM API only
 * ================================================================ */
(function () {
'use strict';
var _api  = function(){ return typeof window.api==='function'?window.api:null; };
var _ct   = function(){ var c=typeof window.getContent==='function'?window.getContent():null; return c||document.getElementById('sk-ct'); };
var _esc  = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
var _fmt  = function(n){ return (Number(n)||0).toLocaleString('vi-VN'); };
var _fmtP = function(n){ return (Number(n)||0).toFixed(1)+'%'; };
var _toast= function(m,t){ if(typeof window.skToast==='function')window.skToast(m,t||'ok'); };

var STATE = { tab:'dashboard', page:1, q:'', selected_drafts:[] };

// ── Colors ───────────────────────────────────────────────────────
var C = {
  accent:'rgba(79,111,255,.15)', accentB:'rgba(79,111,255,.3)', accentT:'var(--accent2)',
  green :'rgba(0,214,143,.15)',  greenB :'rgba(0,214,143,.3)',  greenT :'var(--green)',
  red   :'rgba(255,77,109,.15)', redB   :'rgba(255,77,109,.3)', redT   :'var(--red)',
  yellow:'rgba(251,191,36,.15)', yellowB:'rgba(251,191,36,.3)', yellowT:'var(--yellow)',
  cyan  :'rgba(0,182,255,.1)',   cyanB  :'rgba(0,182,255,.2)',  cyanT  :'var(--cyan)',
};

// ── Modal ─────────────────────────────────────────────────────────
function _modal(html, maxW) {
  var old = document.getElementById('sk-misa-modal');
  if (old && old.parentNode) old.parentNode.removeChild(old);
  var ov  = document.createElement('div');
  ov.id   = 'sk-misa-modal';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;';
  var box = document.createElement('div');
  box.style.cssText = 'background:var(--bg2);border:1px solid var(--border2);border-radius:18px;width:100%;max-width:'+(maxW||'720px')+';margin:auto;';
  box.innerHTML = html;
  ov.appendChild(box);
  ov.addEventListener('click', function(e){ if(e.target===ov) _cm(); });
  document.body.appendChild(ov);
}
function _cm(){ var m=document.getElementById('sk-misa-modal'); if(m&&m.parentNode)m.parentNode.removeChild(m); }
window.closeMisaModal = _cm;

// ── Input helper ─────────────────────────────────────────────────
function _inp(id, label, type, val, placeholder) {
  return '<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:5px;">'+label+'</label>'
    +'<input id="'+id+'" type="'+(type||'text')+'" value="'+_esc(String(val===undefined?'':val))+'" placeholder="'+_esc(placeholder||'')+'"'
    +' style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box;"></div>';
}
function _sel(id, label, opts, val) {
  var ops = opts.map(function(o){ var v=o[0],l=o[1]||v; return '<option value="'+_esc(v)+'"'+(v==val?' selected':'')+'>'+_esc(l)+'</option>'; }).join('');
  return '<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:5px;">'+label+'</label>'
    +'<select id="'+id+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'+ops+'</select></div>';
}
function _btn(label, color, id) {
  return '<button id="'+(id||'')+ '" style="background:'+color[0]+';border:1px solid '+color[1]+';color:'+color[2]+';border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">'+label+'</button>';
}
function _badge(text, c) {
  return '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;background:'+c[0]+';color:'+c[2]+';border:1px solid '+c[1]+';">'+text+'</span>';
}

// ════════════════════════════════════════════════════════════════
// MAIN LOADER
// ════════════════════════════════════════════════════════════════
function loadHoaDonVAT() {
  var ct = _ct(); if (!ct) return;

  var TABS = [
    ['dashboard','&#x1F4CA; Tong quan'],
    ['mapping',  '&#x1F517; Mapping SKU'],
    ['tonkho',   '&#x1F4E6; Ton kho Misa'],
    ['draft',    '&#x1F4DD; Hoa don nhap'],
    ['export',   '&#x1F4E4; Xuat Excel'],
  ];

  ct.innerHTML = '<div class="fade-in" style="padding:24px;">'
    // Header
    +'<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
    +'<div>'
    +'<h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F9FE; Hoa don VAT</h1>'
    +'<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Sapo &#x2192; ERP &#x2192; Misa | Mapping SKU · Ton kho · Hoa don nhap · Xuat Excel</p>'
    +'</div>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;">'
    +'<button id="misa-download-template" style="background:'+C.cyan+';border:1px solid '+C.cyanB+';color:'+C.cyanT+';border-radius:10px;padding:8px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2B07; Tai file mau HD</button>'
    +'<button id="misa-download-tonkho" style="background:'+C.yellow+';border:1px solid '+C.yellowB+';color:'+C.yellowT+';border-radius:10px;padding:8px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2B07; Tai mau Ton kho</button>'
    +'</div>'
    +'</div>'
    // Flow diagram
    +'<div id="misa-flow" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:16px;background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px 16px;">'
    +['Sapo','&#x2192;','ERP','&#x2192;','Mapping SKU','&#x2192;','Kiem tra Ton Misa','&#x2192;','HD Nhap','&#x2192;','Xuat Excel','&#x2192;','Misa']
      .map(function(s,i){ return i%2===0
        ?'<span style="font-size:11px;font-weight:800;color:'+(i===0?C.cyanT:i===12?C.greenT:'var(--accent2)')+';">'+s+'</span>'
        :'<span style="color:var(--text3);">'+s+'</span>'; }).join('')
    +'</div>'
    // Tabs
    +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;">'
    +TABS.map(function(t,i){
      var act = i===0;
      return '<button data-misa-tab="'+t[0]+'" style="border-radius:8px;padding:7px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;'
        +(act?'background:'+C.accent+';border:1px solid '+C.accentB+';color:'+C.accentT+';'
             :'background:var(--bg3);border:1px solid var(--border2);color:var(--text3);')+'">'+t[1]+'</button>';
    }).join('')
    +'</div>'
    +'<div id="misa-body"></div></div>';

  // Tab switching
  ct.querySelectorAll('[data-misa-tab]').forEach(function(btn){
    btn.addEventListener('click', function(){
      STATE.tab = btn.getAttribute('data-misa-tab');
      ct.querySelectorAll('[data-misa-tab]').forEach(function(b){
        b.style.cssText='border-radius:8px;padding:7px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;background:var(--bg3);border:1px solid var(--border2);color:var(--text3);';
      });
      btn.style.cssText='border-radius:8px;padding:7px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;background:'+C.accent+';border:1px solid '+C.accentB+';color:'+C.accentT+';';
      _renderTab(STATE.tab);
    });
  });

  // Download buttons — link to GAS export or static URL
  document.getElementById('misa-download-template').addEventListener('click', function(){
    _toast('File mau dang xu ly... Vui long doi', 'ok');
    // In production: link to Drive file or GAS doGet endpoint
    window.open('https://docs.google.com/spreadsheets/create', '_blank');
  });
  document.getElementById('misa-download-tonkho').addEventListener('click', function(){
    _toast('File mau ton kho dang xu ly...', 'ok');
    window.open('https://docs.google.com/spreadsheets/create', '_blank');
  });

  _renderTab('dashboard');
}

function _renderTab(tab){
  if(tab==='dashboard') _renderDashboard();
  else if(tab==='mapping')  _renderMapping();
  else if(tab==='tonkho')   _renderTonKho();
  else if(tab==='draft')    _renderDraft();
  else if(tab==='export')   _renderExport();
}

// ════════════════════════════════════════════════════════════════
// TAB 1: DASHBOARD
// ════════════════════════════════════════════════════════════════
function _renderDashboard(){
  var el = document.getElementById('misa-body'); if(!el) return;
  el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
  var apiF = _api(); if(!apiF) return;
  apiF('misa_get_stats',{}, function(e,d){
    if(e||!d||!d.ok){ el.innerHTML='<div style="color:var(--red);padding:16px;">'+((d&&d.error)||'Loi')+'</div>'; return; }

    var m = d.mapping||{}, t = d.ton_kho||{}, h = d.hoa_don||{};

    // KPI cards
    var kpis = [
      { icon:'&#x1F517;', label:'SKU da mapping', val:m.active||0,  c:'var(--accent2)', sub:'Total: '+(m.total||0) },
      { icon:'&#x26A0;',  label:'SP chua mapping', val:m.unmapped_sp||0, c:'var(--yellow)', sub:'Can cap nhat' },
      { icon:'&#x1F4E6;', label:'Ky ton kho Misa', val:t.ky_moi_nhat||'Chua co', c:'var(--cyan)', sub:(t.so_ma_hang||0)+' ma hang' },
      { icon:'&#x1F4DD;', label:'HD nhap hien tai', val:h.nhap||0,   c:'var(--green)', sub:'Da xuat: '+(h.da_xuat||0) },
    ];
    var kpiHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:20px;">';
    kpis.forEach(function(k){
      kpiHtml += '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:14px;">'
        +'<div style="font-size:22px;margin-bottom:6px;">'+k.icon+'</div>'
        +'<div style="font-size:20px;font-weight:900;color:'+k.c+';">'+k.val+'</div>'
        +'<div style="font-size:11px;font-weight:800;color:var(--text2);margin:2px 0;">'+k.label+'</div>'
        +'<div style="font-size:10px;color:var(--text3);">'+k.sub+'</div></div>';
    });
    kpiHtml += '</div>';

    // Luồng step-by-step
    var steps = [
      ['1','Setup Mapping',    'Cau hinh Sapo SKU &#x2194; Misa Ma hang','mapping',  C.accent, C.accentT],
      ['2','Upload Ton kho',   'Import file bao cao ton kho tu Misa',     'tonkho',   C.cyan,   C.cyanT],
      ['3','Tao HD Nhap',      'Chon don Sapo, ERP check ton, tao nhap',  'draft',    C.green,  C.greenT],
      ['4','Xuat Excel Misa',  'Xuat file Excel format Misa import HD',   'export',   C.yellow, C.yellowT],
    ];
    var stepHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;">';
    steps.forEach(function(s){
      stepHtml += '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:14px;cursor:pointer;" data-goto="'+s[3]+'">'
        +'<div style="font-size:12px;font-weight:900;color:'+s[5]+';margin-bottom:6px;">BUOC '+s[0]+': '+s[1]+'</div>'
        +'<div style="font-size:11px;color:var(--text3);">'+s[2]+'</div>'
        +'<div style="margin-top:8px;font-size:11px;font-weight:700;color:'+s[5]+';">Di den &#x2192;</div></div>';
    });
    stepHtml += '</div>';

    el.innerHTML = kpiHtml + stepHtml;

    el.querySelectorAll('[data-goto]').forEach(function(card){
      card.addEventListener('click', function(){
        var tab = card.getAttribute('data-goto');
        var btn = document.querySelector('[data-misa-tab="'+tab+'"]');
        if(btn) btn.click();
      });
    });
  });
}

// ════════════════════════════════════════════════════════════════
// TAB 2: MAPPING SKU
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// MAPPING MODULE — Upload file / CRUD / Auto-suggest
// ════════════════════════════════════════════════════════════════

// State riêng cho mapping
var MS = {
  view     : 'list',   // 'list' | 'upload_preview'
  q        : '',
  preview  : [],       // rows chờ confirm import
  page     : 1,
  per_page : 30,
};

// ── Tab Mapping chính ────────────────────────────────────────────
function _renderMapping(){
  var el = document.getElementById('misa-body'); if(!el) return;
  MS.view = 'list';

  el.innerHTML =
    // ── Toolbar ──────────────────────────────────────────────
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">'
      +'<input id="map-q" type="text" placeholder="Tim SKU Sapo, ma Misa, ten hang..." '
        +'style="flex:1;min-width:200px;background:var(--bg3);border:1px solid var(--border2);'
        +'border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
      +'<button id="map-search-btn" style="'
        +'background:'+C.accent+';border:1px solid '+C.accentB+';color:'+C.accentT+';'
        +'border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
      // Upload Excel
      +'<button id="map-upload-btn" style="'
        +'background:'+C.cyan+';border:1px solid '+C.cyanB+';color:'+C.cyanT+';'
        +'border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">'
        +'&#x2B06; Upload file mapping</button>'
      +'<input id="map-file" type="file" accept=".xlsx,.xls" style="display:none;">'
      // Them thu cong
      +'<button id="map-add-btn" style="'
        +'background:'+C.green+';border:1px solid '+C.greenB+';color:'+C.greenT+';'
        +'border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">'
        +'+ Them thu cong</button>'
      // Auto suggest
      +'<button id="map-suggest-btn" style="'
        +'background:'+C.yellow+';border:1px solid '+C.yellowB+';color:'+C.yellowT+';'
        +'border-radius:10px;padding:9px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">'
        +'&#x1F916; Goi y</button>'
    +'</div>'
    // ── Stats bar ─────────────────────────────────────────────
    +'<div id="map-stats" style="margin-bottom:10px;"></div>'
    // ── Main list ─────────────────────────────────────────────
    +'<div id="map-list"></div>';

  // Events
  document.getElementById('map-search-btn').addEventListener('click', function(){
    MS.q = (document.getElementById('map-q')||{}).value||'';
    MS.page = 1;
    _loadMapping();
  });
  document.getElementById('map-q').addEventListener('keydown', function(e){
    if(e.keyCode===13){ MS.q=this.value; MS.page=1; _loadMapping(); }
  });
  document.getElementById('map-upload-btn').addEventListener('click', function(){
    document.getElementById('map-file').click();
  });
  document.getElementById('map-file').addEventListener('change', function(e){
    var f = e.target.files[0]; if(!f) return;
    _parseMappingFile(f);
    this.value = ''; // reset
  });
  document.getElementById('map-add-btn').addEventListener('click', function(){ _showMappingForm(null); });
  document.getElementById('map-suggest-btn').addEventListener('click', _showSuggest);

  _loadMappingStats();
  _loadMapping();
}

// ── Stats ─────────────────────────────────────────────────────────
function _loadMappingStats(){
  var el = document.getElementById('map-stats'); if(!el) return;
  var apiF = _api(); if(!apiF) return;
  apiF('misa_get_stats',{}, function(e,d){
    if(e||!d||!d.ok) return;
    var m = d.mapping||{};
    el.innerHTML =
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
        +'<div style="background:'+C.accent+';border:1px solid '+C.accentB+';border-radius:8px;padding:6px 14px;font-size:12px;">'
          +'<span style="color:var(--text3);">Da mapping: </span>'
          +'<strong style="color:'+C.accentT+';">'+m.active+'</strong>'
        +'</div>'
        +(m.unmapped_sp>0
          ?'<div style="background:'+C.yellow+';border:1px solid '+C.yellowB+';border-radius:8px;padding:6px 14px;font-size:12px;">'
            +'<span style="color:var(--text3);">Chua mapping: </span>'
            +'<strong style="color:'+C.yellowT+';">'+m.unmapped_sp+' SP Sapo</strong>'
          +'</div>' : '')
        +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:12px;color:var(--text3);">'
          +'Tong danh muc Misa: <strong style="color:var(--text);">'+(m.total||0)+'</strong>'
        +'</div>'
      +'</div>';
  });
}

// ── List view ────────────────────────────────────────────────────
function _loadMapping(){
  var el = document.getElementById('map-list'); if(!el) return;
  el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);">Dang tai...</div>';
  var apiF = _api(); if(!apiF) return;
  apiF('misa_get_mapping', { q:MS.q, page:MS.page, limit:MS.per_page }, function(e,d){
    if(e||!d||!d.ok){ el.innerHTML='<div style="color:var(--red);padding:16px;">Loi: '+((d&&d.error)||'')+'</div>'; return; }
    var rows = d.data||[];
    if(!rows.length){
      el.innerHTML = '<div style="text-align:center;padding:48px;">'
        +'<div style="font-size:32px;margin-bottom:12px;">&#x1F517;</div>'
        +'<div style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:8px;">Chua co mapping nao</div>'
        +'<div style="font-size:12px;color:var(--text3);max-width:360px;margin:0 auto 16px;">'
          +'Upload file Mapping_Sapo_Misa.xlsx hoac nhan "Goi y" de ERP tu dong de xuat tu Bang gia'
        +'</div>'
        +'<div style="display:flex;gap:8px;justify-content:center;">'
          +'<button id="map-empty-upload" style="background:'+C.cyan+';border:1px solid '+C.cyanB+';color:'+C.cyanT+';'
            +'border-radius:8px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2B06; Upload file mapping</button>'
          +'<button id="map-empty-suggest" style="background:'+C.yellow+';border:1px solid '+C.yellowB+';color:'+C.yellowT+';'
            +'border-radius:8px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F916; Goi y tu Sapo</button>'
        +'</div>'
      +'</div>';
      document.getElementById('map-empty-upload').addEventListener('click',function(){ document.getElementById('map-file').click(); });
      document.getElementById('map-empty-suggest').addEventListener('click',_showSuggest);
      return;
    }

    var total = d.total||rows.length;
    var pages = Math.ceil(total / MS.per_page);
    var html = '<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:780px;">'
      +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">SKU Sapo</th>'
        +'<th style="padding:9px 12px;text-align:left;">Ten SP Sapo</th>'
        +'<th style="padding:9px 12px;text-align:left;color:'+C.accentT+';">Ma hang Misa</th>'
        +'<th style="padding:9px 12px;text-align:left;">Ten hang Misa</th>'
        +'<th style="padding:9px 12px;text-align:center;">DVT</th>'
        +'<th style="padding:9px 12px;text-align:right;">Ton kho</th>'
        +'<th style="padding:9px 12px;text-align:center;">VAT</th>'
        +'<th style="padding:9px 12px;text-align:right;">Don gia</th>'
        +'<th style="padding:9px 12px;text-align:center;">Active</th>'
        +'<th style="padding:9px 12px;width:60px;"></th>'
      +'</tr></thead><tbody>';

    rows.forEach(function(r, ri){
      var tonColor = r.ton_kho < 0 ? 'var(--text3)'
                   : r.ton_kho === 0 ? 'var(--red)'
                   : r.ton_kho < 10  ? 'var(--yellow)'
                   : 'var(--green)';
      var tonDisp  = r.ton_kho < 0 ? 'N/A' : _fmt(r.ton_kho);
      html += '<tr style="border-top:1px solid var(--border);" id="map-row-'+ri+'">'
        +'<td style="padding:8px 12px;font-family:monospace;font-size:11px;color:'+C.cyanT+';font-weight:700;">'+_esc(r.sapo_sku)+'</td>'
        +'<td style="padding:8px 12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(r.sapo_ten||'')+'</td>'
        +'<td style="padding:8px 12px;font-family:monospace;font-size:11px;color:'+C.accentT+';font-weight:700;">'+_esc(r.misa_ma)+'</td>'
        +'<td style="padding:8px 12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(r.misa_ten||'')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;color:var(--text3);">'+_esc(r.misa_dvt||'')+'</td>'
        +'<td style="padding:8px 12px;text-align:right;font-weight:700;color:'+tonColor+';">'+tonDisp+'</td>'
        +'<td style="padding:8px 12px;text-align:center;color:var(--yellow);font-weight:700;">'+r.thue_vat+'%</td>'
        +'<td style="padding:8px 12px;text-align:right;color:var(--text2);">'+(r.don_gia>0?_fmt(r.don_gia)+'d':'—')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;">'+(r.active ? _badge('On',[C.green,C.greenB,C.greenT]) : _badge('Off',[C.red,C.redB,C.redT]))+'</td>'
        +'<td style="padding:8px 12px;" id="map-act-'+ri+'"></td>'
        +'</tr>';
    });
    html += '</tbody></table></div>';

    // Pagination
    if(pages > 1){
      html += '<div style="display:flex;gap:6px;justify-content:center;margin-top:12px;flex-wrap:wrap;">';
      for(var p=1;p<=pages;p++){
        html += '<button class="map-pg" data-p="'+p+'" style="background:'
          +(p===MS.page?C.accent:'var(--bg3)')+';border:1px solid '
          +(p===MS.page?C.accentB:'var(--border2)')+';color:'
          +(p===MS.page?C.accentT:'var(--text3)')+';border-radius:6px;'
          +'padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">'+p+'</button>';
      }
      html += '</div>';
    }

    html += '<div style="font-size:11px;color:var(--text3);margin-top:8px;text-align:right;">'+total+' mapping</div>';
    el.innerHTML = html;

    // Pagination clicks
    el.querySelectorAll('.map-pg').forEach(function(btn){
      btn.addEventListener('click',function(){ MS.page=Number(btn.getAttribute('data-p')); _loadMapping(); });
    });

    // Row action buttons
    rows.forEach(function(r, ri){
      var td = document.getElementById('map-act-'+ri); if(!td) return;
      var eBtn = document.createElement('button');
      eBtn.innerHTML='&#x270F;'; eBtn.title='Sua';
      eBtn.style.cssText='background:'+C.accent+';border:1px solid '+C.accentB+';border-radius:6px;padding:3px 8px;font-size:12px;cursor:pointer;margin-right:3px;';
      eBtn.addEventListener('click', function(e){ e.stopPropagation(); _showMappingForm(r); });

      var dBtn = document.createElement('button');
      dBtn.innerHTML='&#x1F5D1;'; dBtn.title='Xoa';
      dBtn.style.cssText='background:'+C.red+';border:1px solid '+C.redB+';border-radius:6px;padding:3px 8px;font-size:12px;cursor:pointer;';
      dBtn.addEventListener('click', function(e){
        e.stopPropagation();
        if(!confirm('Xoa mapping SKU "'+r.sapo_sku+'" ↔ "'+r.misa_ma+'"?')) return;
        _api()('misa_delete_mapping',{sapo_sku:r.sapo_sku},function(e2,d2){
          if(!e2&&d2&&d2.ok){ _toast('Da xoa','ok'); _loadMapping(); _loadMappingStats(); }
          else _toast((d2&&d2.error)||'Loi xoa','error');
        });
      });
      td.appendChild(eBtn); td.appendChild(dBtn);
    });
  });
}

// ════════════════════════════════════════════════════════════════
// UPLOAD FILE MAPPING
// ════════════════════════════════════════════════════════════════
function _parseMappingFile(file){
  if(typeof XLSX === 'undefined'){
    _toast('Thu vien XLSX chua san sang. Cho 2 giay roi thu lai.','error'); return;
  }
  _toast('Dang doc file "'+file.name+'"...','ok');
  var reader = new FileReader();
  reader.onload = function(ev){
    try {
      var wb  = XLSX.read(ev.target.result, {type:'binary', raw:false});
      // Tim sheet Mapping_Sapo_Misa truoc, fallback sheet dau tien
      var wsName = 'Mapping_Sapo_Misa';
      if(wb.SheetNames.indexOf(wsName) < 0) wsName = wb.SheetNames[0];
      var ws  = wb.Sheets[wsName];
      var raw = XLSX.utils.sheet_to_json(ws, {header:1, defval:'', raw:false});

      // Tim header row: co 'SKU' hoac 'sku' hoac 'Ma hang Misa'
      var hdrRow = -1;
      for(var ri=0; ri<Math.min(raw.length,10); ri++){
        var row = raw[ri];
        var joined = row.map(function(c){ return String(c||'').toLowerCase(); }).join('|');
        if(/sku|sapo/i.test(joined) && /misa|ma.{0,4}hang/i.test(joined)){
          hdrRow = ri; break;
        }
      }
      if(hdrRow < 0){
        _toast('Khong tim thay header. File phai co cot "SKU Sapo" va "Ma hang Misa".','error');
        return;
      }

      var hdr = raw[hdrRow].map(function(h){ return String(h||'').toLowerCase().trim(); });
      // Map column indices
      function fc(patterns){
        for(var p=0; p<patterns.length; p++)
          for(var h=0; h<hdr.length; h++)
            if(hdr[h].indexOf(patterns[p]) >= 0) return h;
        return -1;
      }
      var COL = {
        stt      : fc(['stt']),
        sku      : fc(['sku sapo','sapo sku','sku']),
        ten_sapo : fc(['ten sp sapo','ten sapo','tên sp sapo']),
        misa_ma  : fc(['ma hang misa','misa ma','ma misa','mã hàng misa','mã']),
        misa_ten : fc(['ten hang misa','ten misa','tên hàng misa','tên hàng']),
        dvt      : fc(['dvt','don vi','đvt']),
        ton      : fc(['ton kho','tồn kho','ton']),
        sau_thue : fc(['sau thue','sau thuế']),
        don_gia  : fc(['don gia','đơn giá','gia ban','giá bán']),
        vat      : fc(['% vat','vat','% thue','thue']),
      };

      if(COL.sku < 0 || COL.misa_ma < 0){
        _toast('Khong tim thay cot SKU Sapo (B) hoac Ma hang Misa (D). Dung file Mapping_Sapo_Misa.xlsx.','error');
        return;
      }

      // Parse rows
      var rows = [];
      var skipped = 0;
      for(var ri2=hdrRow+1; ri2<raw.length; ri2++){
        var r = raw[ri2];
        var sku    = String(r[COL.sku]||'').trim();
        var maMisa = String(r[COL.misa_ma]||'').trim();
        // Skip empty / header duplicates
        if(!sku || !maMisa) { skipped++; continue; }
        if(/^sku|^stt/i.test(sku)) continue;

        rows.push({
          stt      : ri2 - hdrRow,
          sku_sapo : sku,
          ten_sapo : COL.ten_sapo>=0 ? String(r[COL.ten_sapo]||'').trim() : '',
          misa_ma  : maMisa,
          misa_ten : COL.misa_ten>=0 ? String(r[COL.misa_ten]||'').trim() : '',
          dvt      : COL.dvt>=0     ? String(r[COL.dvt]||'cai').trim() : 'cai',
          don_gia  : COL.don_gia>=0 ? (parseFloat(String(r[COL.don_gia]).replace(/[^0-9.]/g,''))||0) : 0,
          vat      : COL.vat>=0     ? (parseInt(String(r[COL.vat]).replace(/[^0-9]/g,''))||10) : 10,
          sau_thue : COL.sau_thue>=0 ? String(r[COL.sau_thue]||'') : '',
          ton_kho  : COL.ton>=0     ? (parseFloat(String(r[COL.ton]).replace(/[^0-9.]/g,''))||null) : null,
        });
      }

      if(!rows.length){
        _toast('Khong co dong nao hop le. Kiem tra lai file.','error'); return;
      }

      var filled   = rows.filter(function(r){ return r.sku_sapo && r.misa_ma; });
      var no_sku   = rows.filter(function(r){ return !r.sku_sapo && r.misa_ma; });
      var no_gia   = rows.filter(function(r){ return r.sku_sapo && r.misa_ma && !r.don_gia; });

      _toast('Doc duoc '+filled.length+' dong, '+no_sku.length+' chua co SKU. Xem truoc...','ok');

      // Show preview
      MS.preview = rows;
      _showUploadPreview(rows, file.name, {
        total  : rows.length,
        filled : filled.length,
        no_sku : no_sku.length,
        no_gia : no_gia.length,
        skipped: skipped,
      });
    } catch(err){
      _toast('Loi doc file: '+err.message,'error');
      console.error(err);
    }
  };
  reader.readAsBinaryString(file);
}

// ── Preview table trước khi import ──────────────────────────────
function _showUploadPreview(rows, fileName, stats){
  MS.view = 'upload_preview';
  var el = document.getElementById('misa-body'); if(!el) return;

  // Stats summary
  var summaryHtml =
    '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:14px 18px;margin-bottom:14px;">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">'
        +'<div>'
          +'<div style="font-size:14px;font-weight:900;margin-bottom:4px;">Xem truoc: <span style="color:'+C.cyanT+';">'+_esc(fileName)+'</span></div>'
          +'<div style="font-size:11px;color:var(--text3);">Kiem tra cac dong truoc khi luu vao ERP</div>'
        +'</div>'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap;font-size:12px;">'
          +'<span style="background:'+C.green+';border:1px solid '+C.greenB+';border-radius:6px;padding:4px 10px;color:'+C.greenT+';font-weight:700;">'+stats.filled+' dong du dieu kien</span>'
          +(stats.no_sku>0 ? '<span style="background:'+C.yellow+';border:1px solid '+C.yellowB+';border-radius:6px;padding:4px 10px;color:'+C.yellowT+';font-weight:700;">'+stats.no_sku+' chua co SKU</span>' : '')
          +(stats.no_gia>0 ? '<span style="background:'+C.red+';border:1px solid '+C.redB+';border-radius:6px;padding:4px 10px;color:'+C.redT+';font-weight:700;">'+stats.no_gia+' chua co gia</span>' : '')
        +'</div>'
      +'</div>'
      // Progress bar
      +'<div style="margin-top:10px;background:var(--bg3);border-radius:4px;height:8px;overflow:hidden;">'
        +'<div style="width:'+(Math.round(stats.filled/Math.max(stats.total,1)*100))+'%;height:100%;background:var(--green);border-radius:4px;transition:width .5s;"></div>'
      +'</div>'
      +'<div style="font-size:10px;color:var(--text3);margin-top:4px;">'+stats.filled+' / '+stats.total+' dong hop le</div>'
    +'</div>';

  // Filter & controls
  var controlHtml =
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">'
      +'<span style="font-size:12px;font-weight:700;color:var(--text2);">Loc:</span>'
      +'<button class="pv-filter" data-f="all" style="background:'+C.accent+';border:1px solid '+C.accentB+';color:'+C.accentT+';border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Tat ca ('+stats.total+')</button>'
      +'<button class="pv-filter" data-f="ok" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Co SKU va Ma Misa ('+stats.filled+')</button>'
      +(stats.no_sku>0 ? '<button class="pv-filter" data-f="no_sku" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Chua SKU ('+stats.no_sku+')</button>' : '')
      +'<div style="flex:1;"></div>'
      +'<button id="pv-cancel-btn" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2190; Huy bo</button>'
      +'<button id="pv-import-btn" style="background:linear-gradient(135deg,var(--green),var(--cyan));border:none;color:#1A2340;border-radius:8px;padding:8px 18px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;">&#x1F4E5; Luu '+stats.filled+' dong vao ERP</button>'
    +'</div>';

  // Table preview
  var tableHtml = '<div id="pv-table-wrap">';
  tableHtml += _buildPreviewTable(rows, 'all');
  tableHtml += '</div>';

  el.innerHTML = summaryHtml + controlHtml + tableHtml;

  // Events
  document.getElementById('pv-cancel-btn').addEventListener('click', function(){
    MS.view = 'list';
    MS.preview = [];
    _renderMapping();
  });

  document.getElementById('pv-import-btn').addEventListener('click', function(){
    _doImportMapping(rows.filter(function(r){ return r.sku_sapo && r.misa_ma; }));
  });

  el.querySelectorAll('.pv-filter').forEach(function(btn){
    btn.addEventListener('click', function(){
      el.querySelectorAll('.pv-filter').forEach(function(b){
        b.style.background='var(--bg3)'; b.style.borderColor='var(--border2)'; b.style.color='var(--text3)';
      });
      btn.style.background=C.accent; btn.style.borderColor=C.accentB; btn.style.color=C.accentT;
      var f = btn.getAttribute('data-f');
      var filtered = f==='ok'   ? rows.filter(function(r){ return r.sku_sapo && r.misa_ma; })
                   : f==='no_sku' ? rows.filter(function(r){ return !r.sku_sapo && r.misa_ma; })
                   : rows;
      document.getElementById('pv-table-wrap').innerHTML = _buildPreviewTable(filtered, f);
    });
  });
}

// Build preview table HTML
function _buildPreviewTable(rows, filter){
  if(!rows.length) return '<div style="text-align:center;padding:32px;color:var(--text3);">Khong co dong nao phu hop.</div>';

  var html = '<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
    +'<table style="width:100%;border-collapse:collapse;font-size:11px;min-width:800px;">'
    +'<thead><tr style="background:var(--bg3);">'
      +'<th style="padding:8px 10px;text-align:center;font-size:10px;font-weight:800;color:var(--text3);">TT</th>'
      +'<th style="padding:8px 10px;text-align:left;color:'+C.redT+';">SKU Sapo</th>'
      +'<th style="padding:8px 10px;text-align:left;color:'+C.redT+';">Ten SP Sapo</th>'
      +'<th style="padding:8px 10px;text-align:left;color:'+C.accentT+';">Ma Misa</th>'
      +'<th style="padding:8px 10px;text-align:left;color:'+C.accentT+';">Ten hang Misa</th>'
      +'<th style="padding:8px 10px;text-align:center;">DVT</th>'
      +'<th style="padding:8px 10px;text-align:right;">Don gia</th>'
      +'<th style="padding:8px 10px;text-align:center;">VAT</th>'
      +'<th style="padding:8px 10px;text-align:center;">Trang thai</th>'
    +'</tr></thead><tbody>';

  rows.forEach(function(r, ri){
    var hasSku   = !!r.sku_sapo;
    var hasMisa  = !!r.misa_ma;
    var hasGia   = r.don_gia > 0;
    var statusBg, statusLabel, statusC;
    if(hasSku && hasMisa){ statusBg=C.green; statusLabel='OK'; statusC=C.greenT; }
    else if(!hasSku && hasMisa){ statusBg=C.yellow; statusLabel='Thieu SKU'; statusC=C.yellowT; }
    else{ statusBg=C.red; statusLabel='Thieu Ma'; statusC=C.redT; }

    var rowBg = ri%2===0 ? 'var(--bg2)' : 'var(--bg3)';
    html += '<tr style="border-top:1px solid var(--border);background:'+rowBg+';">'
      +'<td style="padding:6px 10px;text-align:center;color:var(--text3);">'+r.stt+'</td>'
      +'<td style="padding:6px 10px;font-family:monospace;font-size:10px;color:'+C.cyanT+';font-weight:700;">'
        +(hasSku ? _esc(r.sku_sapo) : '<span style="color:var(--red);font-style:italic;">chua dien</span>')+'</td>'
      +'<td style="padding:6px 10px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(r.ten_sapo||'')+'</td>'
      +'<td style="padding:6px 10px;font-family:monospace;font-size:10px;color:'+C.accentT+';font-weight:700;">'
        +(hasMisa ? _esc(r.misa_ma) : '<span style="color:var(--red);">—</span>')+'</td>'
      +'<td style="padding:6px 10px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(r.misa_ten||'')+'</td>'
      +'<td style="padding:6px 10px;text-align:center;color:var(--text3);">'+_esc(r.dvt||'')+'</td>'
      +'<td style="padding:6px 10px;text-align:right;'+(hasGia?'':'color:var(--text3);font-style:italic;')+';">'
        +(hasGia ? _fmt(r.don_gia)+'d' : 'chua co')+'</td>'
      +'<td style="padding:6px 10px;text-align:center;color:var(--yellow);">'+r.vat+'%</td>'
      +'<td style="padding:6px 10px;text-align:center;">'+_badge(statusLabel,statusBg)+'</td>'
      +'</tr>';
  });
  html += '</tbody></table></div>';
  html += '<div style="font-size:11px;color:var(--text3);margin-top:6px;text-align:right;">Hien thi '+rows.length+' dong</div>';
  return html;
}

// ── Thực hiện import ─────────────────────────────────────────────
function _doImportMapping(validRows){
  if(!validRows.length){ _toast('Khong co dong hop le de luu','error'); return; }
  var btn = document.getElementById('pv-import-btn');
  if(btn){ btn.disabled=true; btn.textContent='Dang luu...'; }
  var apiF = _api(); if(!apiF) return;

  // Convert to format GAS expects: [stt, sku, ten_sapo, ma_misa, ten_misa, dvt, ton, sau, gia, vat]
  var rows = validRows.map(function(r){
    return [r.stt||'', r.sku_sapo, r.ten_sapo||'', r.misa_ma, r.misa_ten||'',
            r.dvt||'cai', r.ton_kho||'', r.sau_thue||'', r.don_gia||0, r.vat||10];
  });

  apiF('misa_import_mapping_excel', { rows:rows }, function(e,d){
    if(btn){ btn.disabled=false; btn.textContent='Luu vao ERP'; }
    if(!e && d && d.ok){
      // Thanh cong
      MS.view = 'list';
      MS.preview = [];
      var msg = '&#x2705; Da luu ' + (d.created||0) + ' moi + ' + (d.updated||0) + ' cap nhat';
      if(d.skipped) msg += ' (' + d.skipped + ' bo qua)';
      _toast(msg, 'ok');
      // Show success state briefly then go back to list
      var el = document.getElementById('misa-body');
      if(el){
        el.innerHTML = '<div style="text-align:center;padding:48px;">'
          +'<div style="font-size:48px;margin-bottom:12px;">&#x2705;</div>'
          +'<div style="font-size:16px;font-weight:900;color:var(--green);margin-bottom:8px;">Import thanh cong!</div>'
          +'<div style="font-size:13px;color:var(--text2);">'+_esc(d.msg||'')+'</div>'
        +'</div>';
        setTimeout(function(){ _renderMapping(); }, 1800);
      }
      _loadMappingStats();
    } else {
      _toast((d&&d.error)||'Loi luu mapping','error');
    }
  });
}

// ════════════════════════════════════════════════════════════════
// FORM THEM / SUA MAPPING (thu cong)
// ════════════════════════════════════════════════════════════════
function _showMappingForm(row){
  var isEdit = !!row;
  var h = '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
    +'<div>'
      +'<div style="font-size:15px;font-weight:900;">'+(isEdit ? '&#x270F; Sua mapping' : '+ Them mapping moi')+'</div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:2px;">Moi mapping = 1 SKU Sapo &#x2194; 1 Ma hang Misa</div>'
    +'</div>'
    +'<button id="mf-x" style="background:none;border:none;color:var(--text3);font-size:22px;cursor:pointer;line-height:1;">&#x00D7;</button>'
    +'</div>'
    +'<div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:14px;">'
      // Sapo side
      +'<div style="grid-column:1/-1;background:rgba(255,77,109,.05);border:1px solid rgba(255,77,109,.15);border-radius:10px;padding:12px 14px;">'
        +'<div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:var(--red);margin-bottom:10px;">SAPO (ban dien)</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
          +_inp('mf-sku','SKU Sapo *','text', row?row.sapo_sku:'', 'VD: SP001 hoac ID Sapo')
          +_inp('mf-ten','Ten SP Sapo','text', row?row.sapo_ten:'', 'De doi chieu')
        +'</div>'
      +'</div>'
      // Misa side
      +'<div style="grid-column:1/-1;background:rgba(0,214,143,.05);border:1px solid rgba(0,214,143,.15);border-radius:10px;padding:12px 14px;">'
        +'<div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:var(--green);margin-bottom:10px;">MISA (theo danh muc Misa)</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
          +_inp('mf-mma','Ma hang Misa *','text', row?row.misa_ma:'', 'VD: VT0001, DV009')
          +_inp('mf-mten','Ten hang Misa','text', row?row.misa_ten:'', '')
          +_inp('mf-dvt','Don vi tinh','text', row?row.misa_dvt:'cai', 'Thung/Goi/Hop/Kg...')
          +_sel('mf-vat','% Thue VAT',[['0','0%'],['5','5%'],['8','8%'],['10','10%']], row?String(row.thue_vat||10):'10')
          +_inp('mf-gia','Don gia ban (chua thue)','number', row?row.don_gia:0, '0')
          +_sel('mf-active','Trang thai',[['TRUE','Active (dung)'],['FALSE','Inactive (bo qua)']], row&&!row.active?'FALSE':'TRUE')
        +'</div>'
      +'</div>'
      +'<div style="grid-column:1/-1;">'+_inp('mf-gc','Ghi chu','text', row?row.ghi_chu:'', '')+'</div>'
    +'</div>'
    +'<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
      +'<button id="mf-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
      +'<button id="mf-save" style="background:'+C.green+';border:1px solid '+C.greenB+';color:'+C.greenT+';border-radius:8px;padding:8px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">'+(isEdit?'&#x2705; Luu thay doi':'&#x2795; Them mapping')+'</button>'
    +'</div>';

  _modal(h, '680px');
  document.getElementById('mf-x').addEventListener('click', _cm);
  document.getElementById('mf-cancel').addEventListener('click', _cm);
  document.getElementById('mf-save').addEventListener('click', function(){
    var sku = document.getElementById('mf-sku').value.trim();
    var mma = document.getElementById('mf-mma').value.trim();
    if(!sku || !mma){ _toast('Nhap SKU Sapo va Ma hang Misa','error'); return; }
    var btn = document.getElementById('mf-save'); btn.disabled=true;
    _api()('misa_save_mapping',{
      sapo_sku:sku, sapo_ten:document.getElementById('mf-ten').value,
      misa_ma:mma,  misa_ten:document.getElementById('mf-mten').value,
      misa_dvt:document.getElementById('mf-dvt').value,
      thue_vat:Number(document.getElementById('mf-vat').value),
      don_gia:Number(document.getElementById('mf-gia').value||0),
      active:document.getElementById('mf-active').value==='TRUE',
      ghi_chu:document.getElementById('mf-gc').value
    }, function(e2,d2){
      btn.disabled=false;
      if(!e2&&d2&&d2.ok){
        _toast((isEdit?'Da cap nhat':'Da them')+' mapping: '+sku+' → '+mma,'ok');
        _cm(); _loadMapping(); _loadMappingStats();
      } else _toast((d2&&d2.error)||'Loi luu','error');
    });
  });
}

// ════════════════════════════════════════════════════════════════
// AUTO SUGGEST từ BangGia Sapo
// ════════════════════════════════════════════════════════════════
function _showSuggest(){
  var apiF = _api(); if(!apiF) return;
  apiF('misa_auto_suggest',{}, function(e,d){
    if(e||!d||!d.ok){ _toast((d&&d.error)||'Loi goi y','error'); return; }
    var rows = d.data||[];
    if(!rows.length){ _toast('Tat ca san pham Sapo da co mapping!','ok'); return; }

    var h = '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
      +'<div>'
        +'<div style="font-size:15px;font-weight:900;">&#x1F916; Goi y mapping tu Sapo</div>'
        +'<div style="font-size:11px;color:var(--text3);margin-top:2px;">'+(d.total||rows.length)+' san pham chua co mapping · Sua "Ma Misa" cho dung truoc khi luu</div>'
      +'</div>'
      +'<button id="sg-x" style="background:none;border:none;color:var(--text3);font-size:22px;cursor:pointer;">&#x00D7;</button>'
    +'</div>'
    +'<div style="padding:12px 16px;border-bottom:1px solid var(--border);background:'+C.yellow+';font-size:11px;color:'+C.yellowT+';">'
      +'&#x26A0; Misa Ma hang phai khop CHINH XAC voi ma trong danh muc Misa. ERP tu goi y dung Sapo SKU = Misa Ma, ban can sua lai cho dung.'
    +'</div>'
    +'<div style="padding:16px;max-height:55vh;overflow-y:auto;">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
        +'<label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;">'
          +'<input type="checkbox" id="sg-all"> <span>Chon tat ca</span>'
        +'</label>'
        +'<span style="font-size:11px;color:var(--text3);">Chon SP muon them mapping</span>'
      +'</div>'
      +'<div style="border-radius:10px;border:1px solid var(--border);overflow:hidden;">'
        +'<table style="width:100%;border-collapse:collapse;font-size:11px;min-width:600px;">'
          +'<thead><tr style="background:var(--bg3);">'
            +'<th style="padding:8px;width:36px;"></th>'
            +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">SKU Sapo</th>'
            +'<th style="padding:8px 12px;text-align:left;">Ten SP Sapo</th>'
            +'<th style="padding:8px 12px;text-align:left;color:'+C.accentT+';">Ma Misa (sua neu can)</th>'
            +'<th style="padding:8px 12px;text-align:center;">DVT</th>'
            +'<th style="padding:8px 12px;text-align:right;">Gia ban</th>'
          +'</tr></thead><tbody>'
          +rows.map(function(r,i){
            var bg = i%2===0 ? 'var(--bg2)' : 'var(--bg3)';
            return '<tr style="border-top:1px solid var(--border);background:'+bg+';">'
              +'<td style="padding:6px 8px;text-align:center;"><input type="checkbox" class="sg-cb" checked '
                +'data-sku="'+_esc(r.sapo_sku)+'" data-ten="'+_esc(r.sapo_ten)+'" '
                +'data-dvt="'+_esc(r.suggested_dvt||'cai')+'" '
                +'data-mten="'+_esc(r.suggested_misa_ten||r.sapo_ten)+'" '
                +'data-gia="'+_esc(String(r.gia_ban||0))+'"></td>'
              +'<td style="padding:6px 12px;font-family:monospace;font-size:10px;color:'+C.cyanT+';font-weight:700;">'+_esc(r.sapo_sku)+'</td>'
              +'<td style="padding:6px 12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(r.sapo_ten||'')+'</td>'
              +'<td style="padding:6px 12px;">'
                +'<input class="sg-mma" data-sku="'+_esc(r.sapo_sku)+'" value="'+_esc(r.suggested_misa_ma||r.sapo_sku)+'" '
                  +'style="width:100%;min-width:100px;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.4);'
                  +'border-radius:6px;padding:4px 8px;font-size:11px;font-family:monospace;color:'+C.accentT+';font-weight:700;">'
              +'</td>'
              +'<td style="padding:6px 12px;text-align:center;color:var(--text3);">'+_esc(r.suggested_dvt||'cai')+'</td>'
              +'<td style="padding:6px 12px;text-align:right;color:var(--text3);">'+(r.gia_ban>0?_fmt(r.gia_ban):'—')+'</td>'
              +'</tr>';
          }).join('')
          +'</tbody></table>'
      +'</div>'
    +'</div>'
    +'<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-top:1px solid var(--border);">'
      +'<span id="sg-count" style="font-size:12px;color:var(--text3);">'+rows.length+' da chon</span>'
      +'<div style="display:flex;gap:8px;">'
        +'<button id="sg-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
        +'<button id="sg-save" style="background:'+C.green+';border:1px solid '+C.greenB+';color:'+C.greenT+';border-radius:8px;padding:8px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2795; Them cac muc da chon</button>'
      +'</div>'
    +'</div>';

    _modal(h, '860px');
    document.getElementById('sg-x').addEventListener('click', _cm);
    document.getElementById('sg-cancel').addEventListener('click', _cm);

    var allCb = document.getElementById('sg-all');
    allCb.addEventListener('change', function(){
      document.querySelectorAll('.sg-cb').forEach(function(cb){ cb.checked=allCb.checked; });
      _updateSgCount();
    });
    document.querySelectorAll('.sg-cb').forEach(function(cb){
      cb.addEventListener('change', _updateSgCount);
    });

    function _updateSgCount(){
      var n = document.querySelectorAll('.sg-cb:checked').length;
      var sc = document.getElementById('sg-count');
      if(sc) sc.textContent = n + ' da chon';
    }

    document.getElementById('sg-save').addEventListener('click', function(){
      var cbs = document.querySelectorAll('.sg-cb:checked');
      if(!cbs.length){ _toast('Chua chon SP nao','error'); return; }
      var btn = document.getElementById('sg-save');
      btn.disabled=true; btn.textContent='Dang luu...';
      var pending = cbs.length, ok=0, fail=0;
      cbs.forEach(function(cb){
        var sku = cb.getAttribute('data-sku');
        var mmaIn = document.querySelector('.sg-mma[data-sku="'+sku+'"]');
        var mma = (mmaIn ? mmaIn.value : sku).trim();
        if(!mma){ fail++; pending--; if(!pending) _sgDone(ok,fail); return; }
        _api()('misa_save_mapping',{
          sapo_sku:sku,
          sapo_ten:cb.getAttribute('data-ten')||'',
          misa_ma:mma,
          misa_ten:cb.getAttribute('data-mten')||'',
          misa_dvt:cb.getAttribute('data-dvt')||'cai',
          don_gia:Number(cb.getAttribute('data-gia')||0),
          thue_vat:10, active:true
        }, function(e2,d2){
          if(!e2&&d2&&d2.ok) ok++; else fail++;
          pending--;
          if(!pending) _sgDone(ok,fail);
        });
      });
    });

    function _sgDone(ok,fail){
      _toast('Da luu '+ok+' mapping'+(fail?' ('+fail+' loi)':''),'ok');
      _cm(); _loadMapping(); _loadMappingStats();
    }
  });
}




// ════════════════════════════════════════════════════════════════
// TAB 3: TỒN KHO MISA
// ════════════════════════════════════════════════════════════════
function _renderTonKho(){
  var el = document.getElementById('misa-body'); if(!el) return;
  el.innerHTML = '<div style="background:'+C.yellow+';border:1px solid '+C.yellowB+';border-radius:12px;padding:12px 16px;margin-bottom:14px;font-size:12px;">'
    +'<strong style="color:'+C.yellowT+';">Huong dan:</strong> Export bao cao ton kho tu Misa, '
    +'sau do upload file Excel vao day. ERP se dung ton kho nay de kiem tra khi tao hoa don nhap.'
    +'</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
    +'<input id="tk-q" type="text" placeholder="Tim ma hang, ten hang..." style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:12px;font-family:inherit;">'
    +'<input id="tk-file" type="file" accept=".xlsx,.xls,.csv" style="display:none;">'
    +'<button id="tk-upload-btn" style="background:'+C.cyan+';border:1px solid '+C.cyanB+';color:'+C.cyanT+';border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2B06; Upload Excel Misa</button>'
    +'<button id="tk-search" style="background:'+C.accent+';border:1px solid '+C.accentB+';color:'+C.accentT+';border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
    +'</div>'
    +'<div id="tk-list"></div>';

  document.getElementById('tk-upload-btn').addEventListener('click',function(){
    document.getElementById('tk-file').click();
  });
  document.getElementById('tk-file').addEventListener('change',function(e){
    var file = e.target.files[0]; if(!file) return;
    _parseTonKhoFile(file);
  });
  document.getElementById('tk-search').addEventListener('click', _loadTonKho);
  document.getElementById('tk-q').addEventListener('keydown',function(e){ if(e.keyCode===13) _loadTonKho(); });
  _loadTonKho();
}

function _parseTonKhoFile(file){
  _toast('Dang doc file Misa...','ok');
  if(typeof XLSX === 'undefined'){
    _toast('Thu vien XLSX chua san sang. Thu lai sau 2 giay.','error'); return;
  }
  var reader = new FileReader();
  reader.onload = function(ev){
    try {
      var wb = XLSX.read(ev.target.result, {type:'binary', cellDates:true});
      var ws = wb.Sheets[wb.SheetNames[0]];
      var raw2D = XLSX.utils.sheet_to_json(ws, {header:1, defval:'', raw:false});

      // Detect: file Misa goc (co "TONG HOP TON KHO" dong 0)
      var isMisaReal = false;
      var ngayTuFile = '';
      for(var ti=0;ti<Math.min(raw2D.length,4);ti++){
        var fc0 = String(raw2D[ti][0]||'');
        if(/T.NG H.P T.N KHO/i.test(fc0)){ isMisaReal=true; }
        var mm = fc0.match(/(\d{1,2})\s+th.{1,3}ng\s+(\d{1,2})\s+n.{1,3}m\s+(\d{4})/i)
              || fc0.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if(mm) ngayTuFile = mm[1]+'/'+mm[2]+'/'+mm[3];
      }

      var ngay = ngayTuFile || new Date().toLocaleDateString('vi-VN');

      if(isMisaReal){
        // FILE MISA GOC: 12 cols, data tu row 5
        // Col: 0=TenKho, 1=MaHang, 2=TenHang, 3=DVT,
        //      4=DauSL, 5=DauGT, 6=NhapSL, 7=NhapGT,
        //      8=XuatSL, 9=XuatGT, 10=CuoiSL, 11=CuoiGT
        var rows = [];
        for(var ri=5; ri<raw2D.length; ri++){
          var r = raw2D[ri];
          var ma = String(r[1]||'').trim();
          if(!ma || /^t.{0,5}ng/i.test(ma)) continue;
          var cuoiSL = parseFloat(String(r[10]||'0').replace(/[^0-9.]/g,''))||0;
          var cuoiGT = parseFloat(String(r[11]||'0').replace(/[^0-9.]/g,''))||0;
          rows.push({
            ma_hang  : ma,
            ten_hang : String(r[2]||'').trim(),
            dvt      : String(r[3]||'cai').trim(),
            ton_dau  : parseFloat(String(r[4]||'0').replace(/[^0-9.]/g,''))||0,
            nhap_ky  : parseFloat(String(r[6]||'0').replace(/[^0-9.]/g,''))||0,
            xuat_ky  : parseFloat(String(r[8]||'0').replace(/[^0-9.]/g,''))||0,
            ton_cuoi : cuoiSL,
            gia_von  : cuoiSL>0 ? Math.round(cuoiGT/cuoiSL) : 0,
          });
        }
        if(!rows.length){ _toast('Khong doc duoc du lieu. Kiem tra file.','error'); return; }
        var sample = rows.slice(0,2).map(function(x){ return x.ma_hang+'('+x.ton_cuoi+')'; }).join(', ');
        _toast('Doc duoc '+rows.length+' ma hang, ky '+ngay+'. VD: '+sample,'ok');
        _api()('misa_import_ton_kho',{data:rows, ngay_bao_cao:ngay, replace:true}, function(e,d){
          if(!e&&d&&d.ok){ _toast(d.msg,'ok'); _loadTonKho(); }
          else _toast((d&&d.error)||'Loi luu ton kho','error');
        });

      } else {
        // FILE CUSTOM: auto detect header
        var hdrRow = 0;
        for(var hi=0;hi<Math.min(raw2D.length,10);hi++){
          if(raw2D[hi].some(function(c){ return /ma.{0,4}h.ng/i.test(String(c)); })){ hdrRow=hi; break; }
        }
        var hdr = raw2D[hdrRow].map(function(h){ return String(h||'').toLowerCase(); });
        function fc2(pats){ for(var p=0;p<pats.length;p++) for(var h=0;h<hdr.length;h++) if(hdr[h].indexOf(pats[p])>=0) return h; return -1; }
        var MA=fc2(['ma hang','ma_hang']), TEN=fc2(['ten hang','ten h']),
            DVT=fc2(['dvt','don vi']), DAU=fc2(['dau','ton dau']),
            NHAP=fc2(['nhap','nhập']), XUAT=fc2(['xuat','xuất']),
            CUOI=fc2(['cuoi','ton cuoi']), GV=fc2(['gia von']);
        if(MA<0){ _toast('Khong tim duoc cot "Ma hang". Dung file Misa goc.','error'); return; }
        var rows2=[];
        for(var ri2=hdrRow+1;ri2<raw2D.length;ri2++){
          var r2=raw2D[ri2];
          var ma2=String(r2[MA]||'').trim();
          if(!ma2||/^t.ng/i.test(ma2)) continue;
          rows2.push({
            ma_hang:ma2, ten_hang:TEN>=0?String(r2[TEN]||''):'',
            dvt:DVT>=0?String(r2[DVT]||'cai'):'cai',
            ton_dau:DAU>=0?Number(r2[DAU]||0):0, nhap_ky:NHAP>=0?Number(r2[NHAP]||0):0,
            xuat_ky:XUAT>=0?Number(r2[XUAT]||0):0, ton_cuoi:CUOI>=0?Number(r2[CUOI]||0):0,
            gia_von:GV>=0?Number(r2[GV]||0):0,
          });
        }
        if(!rows2.length){ _toast('Khong doc duoc dong nao','error'); return; }
        _toast('Doc '+rows2.length+' dong (custom format). Dang luu...','ok');
        _api()('misa_import_ton_kho',{data:rows2, ngay_bao_cao:ngay, replace:true}, function(e,d){
          if(!e&&d&&d.ok){ _toast(d.msg,'ok'); _loadTonKho(); }
          else _toast((d&&d.error)||'Loi luu','error');
        });
      }
    } catch(parseErr){ _toast('Loi doc file: '+parseErr.message,'error'); }
  };
  reader.readAsBinaryString(file);
}

function _loadTonKho(){
  var el = document.getElementById('tk-list'); if(!el) return;
  el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
  var apiF = _api(); if(!apiF) return;
  apiF('misa_get_ton_kho',{ q:(document.getElementById('tk-q')||{}).value||'' }, function(e,d){
    if(e||!d||!d.ok){ el.innerHTML='<div style="color:var(--red);padding:16px;">'+((d&&d.error)||'Loi')+'</div>'; return; }
    var rows = d.data||[];
    if(!rows.length){
      el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Chua co du lieu ton kho Misa. Upload file Excel tu Misa.</div>';
      return;
    }
    var kyInfo = '<div style="font-size:11px;color:var(--text3);margin-bottom:8px;">Ky bao cao: <strong style="color:var(--accent2);">'+_esc(d.ky||'')+'</strong> | '+d.total+' ma hang</div>';
    var tbl = '<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:700px;">'
      +'<thead><tr style="background:var(--bg3);">'
      +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma hang</th>'
      +'<th style="padding:8px 12px;text-align:left;">Ten hang</th>'
      +'<th style="padding:8px 12px;text-align:center;">DVT</th>'
      +'<th style="padding:8px 12px;text-align:right;">Ton dau</th>'
      +'<th style="padding:8px 12px;text-align:right;">Nhap</th>'
      +'<th style="padding:8px 12px;text-align:right;">Xuat</th>'
      +'<th style="padding:8px 12px;text-align:right;color:var(--green);">Ton cuoi</th>'
      +'<th style="padding:8px 12px;text-align:right;">Gia von</th>'
      +'</tr></thead><tbody>';
    rows.forEach(function(r){
      var tonColor = r.ton_cuoi <= 0 ? 'var(--red)' : r.ton_cuoi < 10 ? 'var(--yellow)' : 'var(--green)';
      tbl += '<tr style="border-top:1px solid var(--border);">'
        +'<td style="padding:7px 12px;font-family:monospace;color:var(--accent2);font-weight:700;">'+_esc(r.ma_hang)+'</td>'
        +'<td style="padding:7px 12px;">'+_esc(r.ten_hang||'')+'</td>'
        +'<td style="padding:7px 12px;text-align:center;color:var(--text3);">'+_esc(r.dvt||'')+'</td>'
        +'<td style="padding:7px 12px;text-align:right;">'+_fmt(r.ton_dau)+'</td>'
        +'<td style="padding:7px 12px;text-align:right;color:var(--cyan);">+'+_fmt(r.nhap_ky)+'</td>'
        +'<td style="padding:7px 12px;text-align:right;color:var(--red);">-'+_fmt(r.xuat_ky)+'</td>'
        +'<td style="padding:7px 12px;text-align:right;font-weight:900;color:'+tonColor+';">'+_fmt(r.ton_cuoi)+'</td>'
        +'<td style="padding:7px 12px;text-align:right;color:var(--text3);">'+_fmt(r.gia_von)+'</td>'
        +'</tr>';
    });
    tbl += '</tbody></table></div>';
    el.innerHTML = kyInfo + tbl;
  });
}

// ════════════════════════════════════════════════════════════════
// TAB 4: HÓA ĐƠN NHÁP
// ════════════════════════════════════════════════════════════════
function _renderDraft(){
  var el = document.getElementById('misa-body'); if(!el) return;
  STATE.selected_drafts = [];
  el.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
    +'<input id="dr-q" type="text" placeholder="Tim ma don, khach hang..." style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:12px;font-family:inherit;">'
    +'<select id="dr-tt" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-size:12px;font-family:inherit;">'
    +'<option value="">Tat ca trang thai</option><option value="nhap">Nhap</option><option value="da_xuat">Da xuat</option></select>'
    +'<button id="dr-search" style="background:'+C.accent+';border:1px solid '+C.accentB+';color:'+C.accentT+';border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
    +'<button id="dr-create" style="background:'+C.green+';border:1px solid '+C.greenB+';color:'+C.greenT+';border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">+ Tao tu don Sapo</button>'
    +'</div>'
    +'<div id="dr-list"></div>';

  document.getElementById('dr-search').addEventListener('click',_loadDraft);
  document.getElementById('dr-q').addEventListener('keydown',function(e){ if(e.keyCode===13)_loadDraft(); });
  document.getElementById('dr-create').addEventListener('click',_showCreateDraftForm);
  _loadDraft();
}

function _loadDraft(){
  var el = document.getElementById('dr-list'); if(!el) return;
  el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
  var apiF = _api(); if(!apiF) return;
  apiF('misa_get_draft_list',{
    q:(document.getElementById('dr-q')||{}).value||'',
    trang_thai:(document.getElementById('dr-tt')||{}).value||''
  }, function(e,d){
    if(e||!d||!d.ok){ el.innerHTML='<div style="color:var(--red);padding:16px;">'+((d&&d.error)||'Loi')+'</div>'; return; }
    var groups = d.data||[];
    if(!groups.length){
      el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Chua co hoa don nhap. Nhan "+ Tao tu don Sapo" de bat dau.</div>';
      return;
    }

    var selBar = '<div id="dr-sel-bar" style="display:none;background:'+C.accent+';border:1px solid '+C.accentB+';border-radius:10px;padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;">'
      +'<span id="dr-sel-count" style="font-size:12px;font-weight:700;color:'+C.accentT+';">0 hoa don da chon</span>'
      +'<button id="dr-export-sel" style="background:'+C.yellow+';border:1px solid '+C.yellowB+';color:'+C.yellowT+';border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4E4; Xuat Excel Misa</button>'
      +'</div>';

    var tbl = '<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;min-width:760px;">'
      +'<thead><tr style="background:var(--bg3);">'
      +'<th style="padding:8px;"><input type="checkbox" id="dr-all"></th>'
      +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma nhap</th>'
      +'<th style="padding:8px 12px;text-align:left;">Ma don Sapo</th>'
      +'<th style="padding:8px 12px;text-align:left;">Khach hang</th>'
      +'<th style="padding:8px 12px;text-align:center;">So dong</th>'
      +'<th style="padding:8px 12px;text-align:right;">Tong cong</th>'
      +'<th style="padding:8px 12px;text-align:center;">Ngay</th>'
      +'<th style="padding:8px 12px;text-align:center;">Trang thai</th>'
      +'<th style="padding:8px 12px;"></th>'
      +'</tr></thead><tbody>';

    groups.forEach(function(g,i){
      var ttBadge = g.trang_thai==='nhap'?_badge('Nhap',C.green):_badge('Da xuat',C.accent);
      tbl += '<tr style="border-top:1px solid var(--border);">'
        +'<td style="padding:8px;text-align:center;"><input type="checkbox" class="dr-cb" data-ma="'+_esc(g.ma_nhap)+'"></td>'
        +'<td style="padding:8px 12px;font-family:monospace;font-size:10px;color:var(--text3);">'+_esc(g.ma_nhap)+'</td>'
        +'<td style="padding:8px 12px;font-weight:700;color:var(--accent2);">'+_esc(g.ma_don||'')+'</td>'
        +'<td style="padding:8px 12px;">'+_esc(g.khach_ten||'')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;">'+g.lines.length+'</td>'
        +'<td style="padding:8px 12px;text-align:right;font-weight:700;color:var(--green);">'+_fmt(g.tong_cong)+'</td>'
        +'<td style="padding:8px 12px;text-align:center;color:var(--text3);">'+_esc(g.ngay||'')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;">'+ttBadge+'</td>'
        +'<td style="padding:8px 12px;" id="dr-act-'+i+'"></td>'
        +'</tr>';
    });
    tbl += '</tbody></table></div>';
    el.innerHTML = selBar + tbl + '<div style="font-size:11px;color:var(--text3);margin-top:8px;">'+d.total+' hoa don nhap</div>';

    // Checkbox logic
    document.getElementById('dr-all').addEventListener('change',function(){
      document.querySelectorAll('.dr-cb').forEach(function(cb){ cb.checked=this.checked; },this);
      _updateSelBar();
    });
    el.querySelectorAll('.dr-cb').forEach(function(cb){
      cb.addEventListener('change',_updateSelBar);
    });
    document.getElementById('dr-export-sel').addEventListener('click',function(){
      var maNhaps = Array.from(document.querySelectorAll('.dr-cb:checked')).map(function(cb){ return cb.getAttribute('data-ma'); });
      if(!maNhaps.length){ _toast('Chon it nhat 1 hoa don','error'); return; }
      _exportMisa(maNhaps);
    });

    // Action buttons per row
    groups.forEach(function(g,i){
      var td = document.getElementById('dr-act-'+i); if(!td) return;
      var viewBtn = document.createElement('button');
      viewBtn.innerHTML='&#x1F441;'; viewBtn.title='Xem chi tiet';
      viewBtn.style.cssText='background:'+C.accent+';border:1px solid '+C.accentB+';border-radius:6px;padding:3px 8px;font-size:12px;cursor:pointer;margin-right:3px;';
      viewBtn.addEventListener('click',function(){ _showDraftDetail(g); });
      td.appendChild(viewBtn);
      if(g.trang_thai==='nhap'){
        var xBtn = document.createElement('button');
        xBtn.innerHTML='&#x1F4E4;'; xBtn.title='Xuat Excel Misa';
        xBtn.style.cssText='background:'+C.yellow+';border:1px solid '+C.yellowB+';border-radius:6px;padding:3px 8px;font-size:12px;cursor:pointer;';
        xBtn.addEventListener('click',function(){ _exportMisa([g.ma_nhap]); });
        td.appendChild(xBtn);
      }
    });
  });
}

function _updateSelBar(){
  var checked = document.querySelectorAll('.dr-cb:checked');
  var bar = document.getElementById('dr-sel-bar');
  var cnt = document.getElementById('dr-sel-count');
  if(bar){ bar.style.display = checked.length ? 'flex' : 'none'; }
  if(cnt) cnt.textContent = checked.length+' hoa don da chon';
}

function _showDraftDetail(g){
  var linesHtml = '<div style="border-radius:10px;border:1px solid var(--border);overflow:hidden;margin-top:12px;">'
    +'<table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr style="background:var(--bg3);">'
    +'<th style="padding:7px 10px;text-align:left;font-size:10px;color:var(--text3);">Ma hang</th>'
    +'<th style="padding:7px 10px;text-align:left;">Ten hang</th>'
    +'<th style="padding:7px 10px;text-align:center;">DVT</th>'
    +'<th style="padding:7px 10px;text-align:right;">SL</th>'
    +'<th style="padding:7px 10px;text-align:right;">Don gia</th>'
    +'<th style="padding:7px 10px;text-align:center;">VAT</th>'
    +'<th style="padding:7px 10px;text-align:right;">Tong cong</th>'
    +'</tr></thead><tbody>'
    +g.lines.map(function(l){
      return '<tr style="border-top:1px solid var(--border);">'
        +'<td style="padding:6px 10px;font-family:monospace;color:var(--accent2);">'+_esc(l.ma_hang||'')+'</td>'
        +'<td style="padding:6px 10px;">'+_esc(l.ten_hang||'')+'</td>'
        +'<td style="padding:6px 10px;text-align:center;">'+_esc(l.dvt||'')+'</td>'
        +'<td style="padding:6px 10px;text-align:right;">'+_fmt(l.so_luong)+'</td>'
        +'<td style="padding:6px 10px;text-align:right;">'+_fmt(l.don_gia)+'</td>'
        +'<td style="padding:6px 10px;text-align:center;color:var(--yellow);">'+l.thue_vat+'%</td>'
        +'<td style="padding:6px 10px;text-align:right;font-weight:700;color:var(--green);">'+_fmt(l.tong_cong)+'</td>'
        +'</tr>';
    }).join('')
    +'</tbody></table></div>';

  var h = '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;">'
    +'<div><div style="font-size:14px;font-weight:900;">Chi tiet hoa don nhap</div>'
    +'<div style="font-size:11px;color:var(--text3);margin-top:2px;">'+_esc(g.ma_nhap)+'</div></div>'
    +'<button id="dd-x" style="background:none;border:none;color:var(--text3);font-size:22px;cursor:pointer;">&#x00D7;</button></div>'
    +'<div style="padding:16px 20px;">'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:4px;">'
    +'<div><span style="color:var(--text3);">Ma don Sapo: </span><strong>'+_esc(g.ma_don||'')+'</strong></div>'
    +'<div><span style="color:var(--text3);">Khach hang: </span><strong>'+_esc(g.khach_ten||'')+'</strong></div>'
    +'<div><span style="color:var(--text3);">Ngay HD: </span>'+_esc(g.ngay||'')+'</div>'
    +'<div><span style="color:var(--text3);">Tong cong: </span><strong style="color:var(--green);">'+_fmt(g.tong_cong)+'d</strong></div>'
    +'</div>'
    +linesHtml
    +'</div>'
    +'<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
    +'<button id="dd-close" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Dong</button>'
    +(g.trang_thai==='nhap'?'<button id="dd-export" style="background:'+C.yellow+';border:1px solid '+C.yellowB+';color:'+C.yellowT+';border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Xuat Excel Misa</button>':'')
    +'</div>';
  _modal(h,'780px');
  document.getElementById('dd-x').addEventListener('click',_cm);
  document.getElementById('dd-close').addEventListener('click',_cm);
  var xp = document.getElementById('dd-export');
  if(xp) xp.addEventListener('click',function(){ _cm(); _exportMisa([g.ma_nhap]); });
}

function _showCreateDraftForm(){
  var h = '<div style="padding:16px 20px;border-bottom:1px solid var(--border);font-size:15px;font-weight:900;">Tao hoa don nhap tu don Sapo</div>'
    +'<div style="padding:20px;">'
    +'<div style="background:'+C.cyan+';border:1px solid '+C.cyanB+';border-radius:10px;padding:12px;margin-bottom:14px;font-size:12px;color:'+C.cyanT+';font-weight:700;">'
    +'ERP se: (1) Lay SP tu don Sapo, (2) Kiem tra mapping SKU, (3) Kiem tra ton kho Misa, (4) Dua SP du dieu kien vao HD nhap'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
    +_inp('cd-madon','Ma don Sapo *','text','','VD: 12345678 hoac DH001')
    +_inp('cd-ngay','Ngay hoa don','text',new Date().toLocaleDateString('vi-VN'),'DD/MM/YYYY')
    +_inp('cd-mst','Ma so thue KH','text','','')
    +_inp('cd-kyhieu','Ky hieu HĐ','text','AA/23E','VD: AA/23E')
    +'<div style="grid-column:1/-1;">'+_inp('cd-dc','Dia chi KH','text','','')+'</div>'
    +'<div style="grid-column:1/-1;">'+_inp('cd-gc','Ghi chu','text','','')+'</div>'
    +'</div>'
    +'<div id="cd-preview" style="margin-top:12px;"></div>'
    +'</div>'
    +'<div style="display:flex;justify-content:space-between;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
    +'<button id="cd-preview-btn" style="background:'+C.accent+';border:1px solid '+C.accentB+';color:'+C.accentT+';border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F50D; Xem truoc</button>'
    +'<div style="display:flex;gap:8px;">'
    +'<button id="cd-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
    +'<button id="cd-save" style="background:'+C.green+';border:1px solid '+C.greenB+';color:'+C.greenT+';border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tao hoa don nhap</button>'
    +'</div></div>';
  _modal(h,'680px');
  document.getElementById('cd-cancel').addEventListener('click',_cm);

  // Preview
  document.getElementById('cd-preview-btn').addEventListener('click',function(){
    var maDon = document.getElementById('cd-madon').value.trim();
    if(!maDon){ _toast('Nhap ma don Sapo','error'); return; }
    var pvEl = document.getElementById('cd-preview');
    pvEl.innerHTML = '<div style="text-align:center;padding:10px;color:var(--text3);font-size:11px;">Dang kiem tra...</div>';
    // Gọi Sapo để lấy items
    _api()('sapo_order_detail',{id:maDon}, function(e,d){
      if(e||!d||!d.ok){
        pvEl.innerHTML='<div style="color:var(--red);font-size:11px;">Khong tim thay don Sapo: '+maDon+'</div>';
        return;
      }
      var order = d.data||d.order||{};
      var items = (order.line_items||[]).map(function(li){
        return { sku:String(li.sku||li.variant_id||''), ten:String(li.name||li.title||''), so_luong:Number(li.quantity||1), don_gia:Number(li.price||0) };
      });
      if(!items.length){ pvEl.innerHTML='<div style="color:var(--yellow);font-size:11px;">Don khong co san pham</div>'; return; }
      _api()('misa_preview_order',{ ma_don:maDon, items:items }, function(e2,d2){
        if(e2||!d2||!d2.ok){ pvEl.innerHTML='<div style="color:var(--red);font-size:11px;">Loi preview</div>'; return; }
        var pv = d2.preview||[];
        pvEl.innerHTML = '<div style="border-radius:10px;border:1px solid var(--border);overflow:hidden;">'
          +'<div style="padding:8px 12px;background:var(--bg3);font-size:11px;display:flex;gap:16px;">'
          +'<span>Tong: <strong>'+d2.tong+'</strong></span>'
          +'<span style="color:var(--green);">Co the them: <strong>'+d2.co_the_them+'</strong></span>'
          +'<span style="color:var(--red);">Se bo qua: <strong>'+d2.se_bo_qua+'</strong></span>'
          +'</div>'
          +'<table style="width:100%;border-collapse:collapse;font-size:11px;">'
          +'<thead><tr style="background:var(--bg3);"><th style="padding:6px 10px;text-align:left;color:var(--text3);">SKU</th><th style="padding:6px 10px;text-align:left;">Ten</th><th style="padding:6px 10px;text-align:center;">Misa MA</th><th style="padding:6px 10px;text-align:center;">Ton Misa</th><th style="padding:6px 10px;text-align:center;">Ket qua</th></tr></thead><tbody>'
          +pv.map(function(p){
            var r = p.can_include
              ? '<td style="padding:5px 10px;text-align:center;">'+_badge('Them vao HD',C.green)+'</td>'
              : '<td style="padding:5px 10px;text-align:center;">'+_badge('Bo qua',C.red)+'<div style="font-size:9px;color:var(--text3);">'+_esc(p.reason)+'</div></td>';
            return '<tr style="border-top:1px solid var(--border);">'
              +'<td style="padding:5px 10px;font-family:monospace;font-size:10px;color:var(--cyan);">'+_esc(p.sku)+'</td>'
              +'<td style="padding:5px 10px;">'+_esc(p.ten||'')+'</td>'
              +'<td style="padding:5px 10px;text-align:center;font-family:monospace;font-size:10px;color:var(--accent2);">'+_esc(p.misa_ma||'-')+'</td>'
              +'<td style="padding:5px 10px;text-align:center;font-weight:700;color:'+(p.ton_misa<0?'var(--text3)':p.ton_misa<p.so_luong?'var(--red)':'var(--green)')+';">'+(p.ton_misa<0?'N/A':_fmt(p.ton_misa))+'</td>'
              +r+'</tr>';
          }).join('')
          +'</tbody></table></div>';
        // Lưu items để dùng khi save
        document.getElementById('cd-save').setAttribute('data-items', JSON.stringify(items));
        document.getElementById('cd-save').setAttribute('data-khach', JSON.stringify({ ten:order.khach_ten||'', email:order.khach_email||'', dia_chi:order.dia_chi_gh||'' }));
      });
    });
  });

  document.getElementById('cd-save').addEventListener('click',function(){
    var maDon = document.getElementById('cd-madon').value.trim();
    if(!maDon){ _toast('Nhap ma don Sapo','error'); return; }
    var itemsRaw = this.getAttribute('data-items');
    if(!itemsRaw){ _toast('Nhan "Xem truoc" truoc khi tao','error'); return; }
    var btn = this; btn.disabled=true; btn.textContent='Dang tao...';
    _api()('misa_create_draft',{
      ma_don:maDon,
      items:JSON.parse(itemsRaw),
      mst:document.getElementById('cd-mst').value,
      so_hd_seri:document.getElementById('cd-kyhieu').value,
      dia_chi:document.getElementById('cd-dc').value,
      ngay:document.getElementById('cd-ngay').value,
      nguoi_tao:'admin'
    },function(e,d){
      btn.disabled=false; btn.textContent='Tao hoa don nhap';
      if(!e&&d&&d.ok){
        _toast(d.msg,'ok'); _cm(); _loadDraft();
      } else _toast((d&&d.error)||'Loi','error');
    });
  });
}

// ════════════════════════════════════════════════════════════════
// TAB 5: XUẤT EXCEL
// ════════════════════════════════════════════════════════════════
function _renderExport(){
  var el = document.getElementById('misa-body'); if(!el) return;
  el.innerHTML = '<div style="background:'+C.yellow+';border:1px solid '+C.yellowB+';border-radius:12px;padding:12px 16px;margin-bottom:14px;font-size:12px;color:'+C.yellowT+';font-weight:700;">'
    +'Sau khi xuat, mo Google Sheets → File → Download → Microsoft Excel (.xlsx) → Import vao Misa'
    +'</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">'
    +'<input id="ex-q" type="text" placeholder="Tim hoa don nhap..." style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:12px;font-family:inherit;">'
    +'<button id="ex-search" style="background:'+C.accent+';border:1px solid '+C.accentB+';color:'+C.accentT+';border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Loc</button>'
    +'</div>'
    +'<div id="ex-list"></div>';
  document.getElementById('ex-search').addEventListener('click',_loadExportList);
  document.getElementById('ex-q').addEventListener('keydown',function(e){ if(e.keyCode===13)_loadExportList(); });
  _loadExportList();
}

function _loadExportList(){
  var el = document.getElementById('ex-list'); if(!el) return;
  el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
  var apiF=_api(); if(!apiF) return;
  apiF('misa_get_draft_list',{ trang_thai:'nhap', q:(document.getElementById('ex-q')||{}).value||'' }, function(e,d){
    if(e||!d||!d.ok){ el.innerHTML='<div style="color:var(--red);">'+((d&&d.error)||'Loi')+'</div>'; return; }
    var groups = d.data||[];
    if(!groups.length){
      el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Khong co hoa don nhap nao. Vao tab "HD nhap" de tao.</div>';
      return;
    }
    var tbl='<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:600px;">'
      +'<thead><tr style="background:var(--bg3);">'
      +'<th style="padding:8px;"><input type="checkbox" id="ex-all"></th>'
      +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma nhap</th>'
      +'<th style="padding:8px 12px;text-align:left;">Ma don Sapo</th>'
      +'<th style="padding:8px 12px;text-align:left;">Khach hang</th>'
      +'<th style="padding:8px 12px;text-align:center;">So dong HD</th>'
      +'<th style="padding:8px 12px;text-align:right;">Tong cong</th>'
      +'<th style="padding:8px 12px;text-align:center;">Ngay</th>'
      +'</tr></thead><tbody>'
      +groups.map(function(g,i){
        return '<tr style="border-top:1px solid var(--border);">'
          +'<td style="padding:8px;text-align:center;"><input type="checkbox" class="ex-cb" data-ma="'+_esc(g.ma_nhap)+'" checked></td>'
          +'<td style="padding:8px 12px;font-family:monospace;font-size:10px;color:var(--text3);">'+_esc(g.ma_nhap)+'</td>'
          +'<td style="padding:8px 12px;font-weight:700;color:var(--accent2);">'+_esc(g.ma_don||'')+'</td>'
          +'<td style="padding:8px 12px;">'+_esc(g.khach_ten||'')+'</td>'
          +'<td style="padding:8px 12px;text-align:center;">'+g.lines.length+'</td>'
          +'<td style="padding:8px 12px;text-align:right;font-weight:700;color:var(--green);">'+_fmt(g.tong_cong)+'</td>'
          +'<td style="padding:8px 12px;text-align:center;color:var(--text3);">'+_esc(g.ngay||'')+'</td>'
          +'</tr>';
      }).join('')
      +'</tbody></table></div>';

    var kyHieu = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0;">'
      +_inp('ex-kyhieu','Ky hieu HD (bat buoc)','text','AA/23E','VD: AA/23E, DD/23E')
      +_inp('ex-mau_so','Mau so HD','text','01GTKT0/001','01GTKT0/001')
      +_inp('ex-gc','Ghi chu chung','text','','')
      +_sel('ex-httt','Hinh thuc thanh toan',[['Tien mat','Tien mat'],['Chuyen khoan','Chuyen khoan'],['TM/CK','TM/CK'],['Cong no','Cong no']],'Chuyen khoan')
      +_sel('ex-hinh-thuc','Hinh thuc ban hang',[['Ban hang hoa dich vu trong nuoc','Ban hang hoa dich vu trong nuoc'],['Ban hang xuat khau','Ban hang xuat khau'],['Ban hang dai ly ban dung gia','Ban hang dai ly ban dung gia']],'Ban hang hoa dich vu trong nuoc')
      +'</div>';

    var exportBtn='<button id="ex-export-all" style="width:100%;margin-top:10px;background:linear-gradient(135deg,'+C.yellowT+',var(--green));border:none;border-radius:10px;padding:12px;font-size:13px;font-weight:900;cursor:pointer;color:#1a2340;font-family:inherit;">&#x1F4E4; Xuat Excel Misa (cac hoa don da chon)</button>';

    el.innerHTML = tbl + kyHieu + exportBtn;

    document.getElementById('ex-all').addEventListener('change',function(){
      document.querySelectorAll('.ex-cb').forEach(function(cb){ cb.checked=this.checked; },this);
    });
    document.getElementById('ex-export-all').addEventListener('click',function(){
      var maNhaps = Array.from(document.querySelectorAll('.ex-cb:checked')).map(function(cb){ return cb.getAttribute('data-ma'); });
      if(!maNhaps.length){ _toast('Chon it nhat 1 hoa don','error'); return; }
      _exportMisa(maNhaps);
    });
  });
}

function _exportMisa(maNhaps){
  var apiF=_api(); if(!apiF) return;
  var ky = (document.getElementById('ex-kyhieu')||{}).value||'AA/23E';
  var gc = (document.getElementById('ex-gc')||{}).value||'';
  _toast('Dang tao sheet xuat...','ok');
  apiF('misa_export_excel',{ ma_nhaps:maNhaps, ky_hieu:ky, ghi_chu:gc, nguoi_xuat:'admin' }, function(e,d){
    if(!e&&d&&d.ok){
      _toast(d.msg+' | '+d.so_dong+' dong','ok');
      // Show link to spreadsheet
      setTimeout(function(){
        if(confirm(d.msg+'\n\nMo Google Sheets de download?')){
          window.open('https://docs.google.com/spreadsheets/d/'+
            (typeof SPREADSHEET_ID!=='undefined'?SPREADSHEET_ID:''), '_blank');
        }
      }, 300);
      _loadExportList();
    } else {
      _toast((d&&d.error)||'Loi xuat Excel','error');
    }
  });
}

// Expose
window.loadHoaDonVAT = loadHoaDonVAT;
window.loadMisaVAT   = loadHoaDonVAT;

// Load SheetJS if not already loaded (for Excel parsing)
(function(){
  if(typeof XLSX !== 'undefined') return;
  var sc = document.createElement('script');
  sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  document.head.appendChild(sc);
})();

})();
