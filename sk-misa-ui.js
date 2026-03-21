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
function _renderMapping(){
  var el = document.getElementById('misa-body'); if(!el) return;
  el.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
    +'<input id="map-q" type="text" placeholder="Tim SKU, ten SP, ma Misa..." style="flex:1;min-width:180px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:12px;font-family:inherit;">'
    +'<button id="map-search" style="background:'+C.accent+';border:1px solid '+C.accentB+';color:'+C.accentT+';border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
    +'<button id="map-add" style="background:'+C.green+';border:1px solid '+C.greenB+';color:'+C.greenT+';border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">+ Them mapping</button>'
    +'<button id="map-suggest" style="background:'+C.yellow+';border:1px solid '+C.yellowB+';color:'+C.yellowT+';border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F916; Tu dong goi y</button>'
    +'</div>'
    +'<div id="map-list"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>';

  document.getElementById('map-search').addEventListener('click', _loadMapping);
  document.getElementById('map-q').addEventListener('keydown', function(e){ if(e.keyCode===13) _loadMapping(); });
  document.getElementById('map-add').addEventListener('click', function(){ _showMappingForm(null); });
  document.getElementById('map-suggest').addEventListener('click', _showSuggest);
  _loadMapping();
}

function _loadMapping(){
  var el = document.getElementById('map-list'); if(!el) return;
  el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
  var apiF = _api(); if(!apiF) return;
  apiF('misa_get_mapping', { q:(document.getElementById('map-q')||{}).value||'' }, function(e,d){
    if(e||!d||!d.ok){ el.innerHTML='<div style="color:var(--red);padding:16px;">'+((d&&d.error)||'Loi')+'</div>'; return; }
    var rows = d.data||[];
    if(!rows.length){
      el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);">'
        +'Chua co mapping. Nhan "Tu dong goi y" de ERP tu dong de xuat tu Bang gia.</div>';
      return;
    }
    var html = '<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:700px;">'
      +'<thead><tr style="background:var(--bg3);">'
      +'<th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Sapo SKU</th>'
      +'<th style="padding:9px 12px;text-align:left;">Ten SP Sapo</th>'
      +'<th style="padding:9px 12px;text-align:left;color:var(--accent2);">Misa Ma hang</th>'
      +'<th style="padding:9px 12px;text-align:left;">Ten hang Misa</th>'
      +'<th style="padding:9px 12px;text-align:center;">DVT</th>'
      +'<th style="padding:9px 12px;text-align:center;">VAT</th>'
      +'<th style="padding:9px 12px;text-align:center;">Active</th>'
      +'<th style="padding:9px 12px;"></th>'
      +'</tr></thead><tbody>';
    rows.forEach(function(r){
      html += '<tr style="border-top:1px solid var(--border);">'
        +'<td style="padding:8px 12px;font-family:monospace;color:var(--cyan);font-weight:700;">'+_esc(r.sapo_sku)+'</td>'
        +'<td style="padding:8px 12px;">'+_esc(r.sapo_ten||'')+'</td>'
        +'<td style="padding:8px 12px;font-family:monospace;color:var(--accent2);font-weight:700;">'+_esc(r.misa_ma)+'</td>'
        +'<td style="padding:8px 12px;">'+_esc(r.misa_ten||'')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;">'+_esc(r.misa_dvt||'cai')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;font-weight:700;color:var(--yellow);">'+r.thue_vat+'%</td>'
        +'<td style="padding:8px 12px;text-align:center;">'+(r.active?_badge('Active',C.green):_badge('Off',C.red))+'</td>'
        +'<td style="padding:8px 12px;" id="map-act-'+_esc(r.sapo_sku)+'"></td>'
        +'</tr>';
    });
    html += '</tbody></table></div>';
    html += '<div style="font-size:11px;color:var(--text3);margin-top:8px;">'+d.total+' mapping</div>';
    el.innerHTML = html;

    rows.forEach(function(r){
      var td = document.getElementById('map-act-'+r.sapo_sku); if(!td) return;
      var editBtn = document.createElement('button');
      editBtn.innerHTML = '&#x270F;';
      editBtn.style.cssText='background:'+C.accent+';border:1px solid '+C.accentB+';border-radius:6px;padding:3px 8px;font-size:12px;cursor:pointer;margin-right:4px;';
      editBtn.addEventListener('click', function(){ _showMappingForm(r); });
      var delBtn = document.createElement('button');
      delBtn.innerHTML = '&#x1F5D1;';
      delBtn.style.cssText='background:'+C.red+';border:1px solid '+C.redB+';border-radius:6px;padding:3px 8px;font-size:12px;cursor:pointer;';
      delBtn.addEventListener('click', function(){
        if(!confirm('Xoa mapping SKU: '+r.sapo_sku+' ?')) return;
        _api()('misa_delete_mapping',{sapo_sku:r.sapo_sku},function(e2,d2){
          if(!e2&&d2&&d2.ok){ _toast('Da xoa mapping','ok'); _loadMapping(); }
          else _toast((d2&&d2.error)||'Loi','error');
        });
      });
      td.appendChild(editBtn); td.appendChild(delBtn);
    });
  });
}

function _showMappingForm(row){
  var isEdit = !!row;
  var h = '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
    +'<div style="font-size:15px;font-weight:900;">'+(isEdit?'Sua mapping':'Them mapping SKU')+'</div>'
    +'<button id="mf-x" style="background:none;border:none;color:var(--text3);font-size:22px;cursor:pointer;line-height:1;">&#x00D7;</button></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px;">'
    +_inp('mf-sku','Sapo SKU *','text',row?row.sapo_sku:'','VD: SP001 hoac SAPO-12345')
    +_inp('mf-ten','Ten SP Sapo','text',row?row.sapo_ten:'','')
    +_inp('mf-mma','Misa Ma hang *','text',row?row.misa_ma:'','VD: VT001')
    +_inp('mf-mten','Misa Ten hang','text',row?row.misa_ten:'','')
    +_inp('mf-dvt','Don vi tinh','text',row?row.misa_dvt:'cai','cai / hop / kg...')
    +_sel('mf-vat','% Thue VAT',[['0','0%'],['5','5%'],['8','8%'],['10','10%']], row?String(row.thue_vat||10):'10')
    +_inp('mf-gia','Don gia Misa (tham khao)','number',row?row.don_gia:0,'')
    +_sel('mf-active','Trang thai',[['TRUE','Active'],['FALSE','Inactive']], row&&!row.active?'FALSE':'TRUE')
    +'<div style="grid-column:1/-1;">'+_inp('mf-gc','Ghi chu','text',row?row.ghi_chu:'','')+'</div>'
    +'</div>'
    +'<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
    +'<button id="mf-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
    +'<button id="mf-save" style="background:'+C.green+';border:1px solid '+C.greenB+';color:'+C.greenT+';border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">'+(isEdit?'Luu thay doi':'Them mapping')+'</button>'
    +'</div>';
  _modal(h,'620px');
  document.getElementById('mf-x').addEventListener('click',_cm);
  document.getElementById('mf-cancel').addEventListener('click',_cm);
  document.getElementById('mf-save').addEventListener('click',function(){
    var sku=document.getElementById('mf-sku').value.trim();
    var mma=document.getElementById('mf-mma').value.trim();
    if(!sku||!mma){ _toast('Nhap Sapo SKU va Misa Ma hang','error'); return; }
    var btn=document.getElementById('mf-save'); btn.disabled=true;
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
      if(!e2&&d2&&d2.ok){ _toast('Da luu mapping','ok'); _cm(); _loadMapping(); }
      else _toast((d2&&d2.error)||'Loi','error');
    });
  });
}

function _showSuggest(){
  var apiF = _api(); if(!apiF) return;
  apiF('misa_auto_suggest',{}, function(e,d){
    if(e||!d||!d.ok){ _toast((d&&d.error)||'Loi goi y','error'); return; }
    var rows = d.data||[];
    if(!rows.length){ _toast('Tat ca SP da co mapping!','ok'); return; }
    var h = '<div style="padding:16px 20px;border-bottom:1px solid var(--border);font-size:15px;font-weight:900;">Tu dong goi y mapping ('+(d.total||rows.length)+' SP chua map)</div>'
      +'<div style="padding:16px;max-height:60vh;overflow-y:auto;">'
      +'<div style="font-size:11px;color:var(--text3);margin-bottom:10px;">ERP goi y dung Sapo SKU = Misa Ma hang. Ban co the sua truoc khi luu hang loat.</div>'
      +'<div style="border-radius:10px;border:1px solid var(--border);overflow:hidden;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr style="background:var(--bg3);">'
      +'<th style="padding:8px;"><input type="checkbox" id="sg-all"></th>'
      +'<th style="padding:8px 12px;text-align:left;">Sapo SKU</th>'
      +'<th style="padding:8px 12px;text-align:left;">Ten SP</th>'
      +'<th style="padding:8px 12px;text-align:left;">Goi y Misa Ma</th>'
      +'</tr></thead><tbody>'
      +rows.map(function(r,i){
        return '<tr style="border-top:1px solid var(--border);">'
          +'<td style="padding:6px 8px;text-align:center;"><input type="checkbox" class="sg-cb" data-sku="'+_esc(r.sapo_sku)+'" data-ten="'+_esc(r.sapo_ten)+'" data-mma="'+_esc(r.suggested_misa_ma)+'" data-mten="'+_esc(r.suggested_misa_ten)+'" data-dvt="'+_esc(r.suggested_dvt)+'" checked></td>'
          +'<td style="padding:6px 12px;font-family:monospace;color:var(--cyan);">'+_esc(r.sapo_sku)+'</td>'
          +'<td style="padding:6px 12px;">'+_esc(r.sapo_ten||'')+'</td>'
          +'<td style="padding:6px 12px;"><input class="sg-mma" data-sku="'+_esc(r.sapo_sku)+'" value="'+_esc(r.suggested_misa_ma)+'" style="width:120px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:4px 8px;font-size:11px;font-family:monospace;color:var(--accent2);"></td>'
          +'</tr>';
      }).join('')
      +'</tbody></table></div></div>'
      +'<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-top:1px solid var(--border);">'
      +'<span style="font-size:11px;color:var(--text3);">Chon SP muon them mapping</span>'
      +'<div style="display:flex;gap:8px;">'
      +'<button id="sg-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
      +'<button id="sg-save" style="background:'+C.green+';border:1px solid '+C.greenB+';color:'+C.greenT+';border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Luu cac muc da chon</button>'
      +'</div></div>';
    _modal(h,'800px');
    document.getElementById('sg-cancel').addEventListener('click',_cm);
    document.getElementById('sg-all').addEventListener('change',function(){
      document.querySelectorAll('.sg-cb').forEach(function(cb){ cb.checked=this.checked; },this);
    });
    document.getElementById('sg-save').addEventListener('click',function(){
      var cbs = document.querySelectorAll('.sg-cb:checked');
      if(!cbs.length){ _toast('Chua chon SP nao','error'); return; }
      var btn=document.getElementById('sg-save'); btn.disabled=true; btn.textContent='Dang luu...';
      var pending=cbs.length, ok=0, fail=0;
      cbs.forEach(function(cb){
        var sku = cb.getAttribute('data-sku');
        var mmaInput = document.querySelector('.sg-mma[data-sku="'+sku+'"]');
        _api()('misa_save_mapping',{
          sapo_sku:sku, sapo_ten:cb.getAttribute('data-ten'),
          misa_ma:(mmaInput?mmaInput.value:cb.getAttribute('data-mma')).trim(),
          misa_ten:cb.getAttribute('data-mten'),
          misa_dvt:cb.getAttribute('data-dvt'), thue_vat:10, active:true
        },function(e2,d2){
          if(!e2&&d2&&d2.ok) ok++; else fail++;
          pending--;
          if(pending===0){
            _toast('Da luu '+ok+' mapping'+(fail?' ('+fail+' loi)':''),'ok');
            _cm(); _loadMapping();
          }
        });
      });
    });
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
  // Đọc file Excel bằng FileReader → parse với SheetJS
  _toast('Dang doc file Excel...','ok');
  if(typeof XLSX === 'undefined'){
    _toast('Chua load thu vien XLSX. Vui long tai lai trang.','error'); return;
  }
  var reader = new FileReader();
  reader.onload = function(ev){
    try {
      var wb = XLSX.read(ev.target.result, {type:'binary'});
      var ws = wb.Sheets[wb.SheetNames[0]]; // Sheet dau tien
      var rawData = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});

      // Auto-detect header row (tim dong co "Ma hang" hoac "ma hang")
      var headerRow = -1;
      for(var i=0;i<Math.min(rawData.length,10);i++){
        var row = rawData[i];
        if(row.some(function(c){ return /ma.{0,3}hang/i.test(String(c)); })){
          headerRow = i; break;
        }
      }
      if(headerRow < 0) headerRow = 3; // Default: row 4 (Misa format)

      var headers = rawData[headerRow].map(function(h){ return String(h||'').toLowerCase().trim(); });
      // Map columns
      function findCol(patterns){
        for(var pi=0;pi<patterns.length;pi++){
          var idx = headers.findIndex(function(h){ return h.indexOf(patterns[pi])>=0; });
          if(idx>=0) return idx;
        }
        return -1;
      }
      var COL = {
        ma_hang : findCol(['ma hang','ma_hang','mã hàng']),
        ten_hang: findCol(['ten hang','ten_hang','tên hàng']),
        dvt     : findCol(['dvt','don vi','đơn vị']),
        ton_dau : findCol(['ton dau','ton_dau','tồn đầu']),
        nhap_ky : findCol(['nhap ky','nhap_ky','nhập kỳ']),
        xuat_ky : findCol(['xuat ky','xuat_ky','xuất kỳ']),
        ton_cuoi: findCol(['ton cuoi','ton_cuoi','tồn cuối','tồn']),
        gia_von : findCol(['gia von','gia_von','giá vốn']),
      };

      if(COL.ma_hang < 0){ _toast('Khong tim thay cot "Ma hang" trong file. Kiem tra dinh dang.','error'); return; }

      var rows = [];
      for(var ri=headerRow+1; ri<rawData.length; ri++){
        var r = rawData[ri];
        var ma = String(r[COL.ma_hang]||'').trim();
        if(!ma) continue;
        rows.push({
          ma_hang  : ma,
          ten_hang : COL.ten_hang>=0 ? String(r[COL.ten_hang]||'') : '',
          dvt      : COL.dvt>=0 ? String(r[COL.dvt]||'cai') : 'cai',
          ton_dau  : COL.ton_dau>=0 ? Number(r[COL.ton_dau]||0) : 0,
          nhap_ky  : COL.nhap_ky>=0 ? Number(r[COL.nhap_ky]||0) : 0,
          xuat_ky  : COL.xuat_ky>=0 ? Number(r[COL.xuat_ky]||0) : 0,
          ton_cuoi : COL.ton_cuoi>=0 ? Number(r[COL.ton_cuoi]||0) : 0,
          gia_von  : COL.gia_von>=0 ? Number(r[COL.gia_von]||0) : 0,
        });
      }

      if(!rows.length){ _toast('Khong doc duoc dong nao hop le','error'); return; }

      _toast('Doc duoc '+rows.length+' dong. Dang luu vao ERP...','ok');
      var ngay = new Date().toLocaleDateString('vi-VN');
      _api()('misa_import_ton_kho',{ data:rows, ngay_bao_cao:ngay, replace:true }, function(e,d){
        if(!e&&d&&d.ok){ _toast(d.msg,'ok'); _loadTonKho(); }
        else _toast((d&&d.error)||'Loi luu','error');
      });
    } catch(err){
      _toast('Loi doc file: '+err.message,'error');
    }
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
      +_inp('ex-kyhieu','Ky hieu hoa don (Misa)','text','AA/23E','VD: AA/23E')
      +_inp('ex-gc','Ghi chu chung','text','','')
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
