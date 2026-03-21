/* ================================================================
// [v5.19] 22/03/2026 — So cai TK 111/131/331: finGetSoCai, tab UI, CSV export
 * sk-finance-ui.js  SonKhang ERP v5.7.0
 * Tai chinh: So quy · Cong no · Ke toan · Bao cao TC
 * 0 non-ASCII, DOM API
 * ================================================================ */
(function(){
'use strict';
var _api=function(){return typeof window.api==='function'?window.api:null;};
var _ct=function(){var c=typeof window.getContent==='function'?window.getContent():null;return c||document.getElementById('sk-ct');};
var _esc=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
var _fmt=function(n){return(Number(n)||0).toLocaleString('vi-VN');};
var _toast=function(m,t){if(typeof window.skToast==='function')window.skToast(m,t||'ok');};
var STATE={tab:'dashboard'};

function _modal(h,w){
  var old=document.getElementById('sk-fin-modal');
  if(old&&old.parentNode)old.parentNode.removeChild(old);
  var ov=document.createElement('div');ov.id='sk-fin-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;';
  var box=document.createElement('div');
  box.style.cssText='background:var(--bg2);border:1px solid var(--border2);border-radius:18px;width:100%;max-width:'+(w||'620px')+';margin:auto;';
  box.innerHTML=h;ov.appendChild(box);
  ov.addEventListener('click',function(e){if(e.target===ov)_cm();});
  document.body.appendChild(ov);
}
function _cm(){var m=document.getElementById('sk-fin-modal');if(m&&m.parentNode)m.parentNode.removeChild(m);}


  // ── Sapo → Finance Sync ──────────────────────────────────────
  function _syncFromSapo() {
    var btn = document.getElementById('fin-sapo-sync-btn');
    if (btn) { btn.disabled=true; btn.innerHTML='&#x23F3; Dang dong bo...'; }
    var apiF=_api();if(!apiF)return;
    apiF('fin_sync_from_sapo',{},function(e,d){
      if (btn) { btn.disabled=false; btn.innerHTML='&#x1F504; Dong bo Sapo'; }
      if (e||!d||!d.ok){
        _toast((d&&d.error)||'Loi dong bo','error');
        return;
      }
      var msg = 'Sync xong! '
        + 'Phieu thu: ' + (d.created_thu||0)
        + ' | Cong no moi: ' + (d.created_cono||0)
        + ' | Cap nhat CN: ' + (d.updated_cono||0);
      if ((d.errors||[]).length) msg += ' | Loi: '+d.errors.length;
      _toast(msg, 'ok');
      // Tinh lai so du
      var apiF2=_api();
      if (apiF2) apiF2('fin_rebuild_so_du',{},function(){});
      // Refresh view
      setTimeout(function(){ _renderTab(STATE.tab); }, 500);
    });
  }

  // ── Sapo sync status badge ────────────────────────────────────
  function _loadSapoSyncStatus() {
    var apiF=_api();if(!apiF)return;
    apiF('fin_get_sapo_sync_status',{},function(e,d){
      var el=document.getElementById('fin-sapo-status');
      if (!el||e||!d||!d.ok) return;
      if (d.last_sync) {
        var dt=d.last_sync.split('T')[0];
        el.textContent='Sync cuoi: '+dt+' | Tong: '+_fmt(d.total_synced)+' giao dich';
        el.style.color='var(--green)';
      } else {
        el.textContent='Chua dong bo Sapo';
        el.style.color='var(--text3)';
      }
    });
  }

function loadTaiChinh(){
  var ct=_ct();if(!ct)return;
  ct.innerHTML='<div class="fade-in" style="padding:24px;">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
    +'<div><h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F4B0; Tai chinh</h1>'
    +'<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">So quy · Cong no KH/NCC · But toan · Bao cao</p>'
      +'<div id="fin-sapo-status" style="font-size:11px;color:var(--text3);margin-top:3px;">Dang tai trang thai sync...</div>'
      +'</div>'
    +'<button id="fin-phieu-btn" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">+ Phieu thu/chi</button>'
      +'<button id="fin-sapo-sync-btn" style="background:rgba(0,182,255,.1);border:1px solid rgba(0,182,255,.2);color:var(--cyan);border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F504; Dong bo Sapo</button>'
      +'<button id="fin-rebuild-btn" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:10px;padding:9px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Tinh lai so du</button>'
    +'</div>'
    +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;">'
    +[['dashboard','&#x1F4CA; Tong quan'],['soquy','&#x1F4B5; So quy'],['congno','&#x1F4B3; Cong no'],['buttoan','&#x1F4D2; But toan'],['socai','&#x1F4D6; So cai TK']].map(function(t,i){
      return '<button data-fin-tab="'+t[0]+'" style="border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;'+(i===0?'background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);':'background:var(--bg3);border:1px solid var(--border2);color:var(--text3);')+'">'+t[1]+'</button>';
    }).join('')
    +'</div>'
    +'<div id="fin-body"></div></div>';
  document.querySelectorAll('[data-fin-tab]').forEach(function(btn){
    btn.addEventListener('click',function(){
      STATE.tab=btn.getAttribute('data-fin-tab');
      document.querySelectorAll('[data-fin-tab]').forEach(function(b){b.style.background='var(--bg3)';b.style.borderColor='var(--border2)';b.style.color='var(--text3)';});
      btn.style.background='rgba(79,111,255,.15)';btn.style.borderColor='rgba(79,111,255,.3)';btn.style.color='var(--accent2)';
      _renderTab(STATE.tab);
    });
  });
  document.getElementById('fin-phieu-btn').addEventListener('click',function(){_showPhieuForm();});
  document.getElementById('fin-sapo-sync-btn').addEventListener('click',_syncFromSapo);
  document.getElementById('fin-rebuild-btn').addEventListener('click',function(){
    var apiF=_api();if(!apiF)return;
    apiF('fin_rebuild_so_du',{},function(e,d){
      if(!e&&d&&d.ok)_toast(d.msg,'ok');
      else _toast((d&&d.error)||'Loi','error');
      _renderTab(STATE.tab);
    });
  });
  _renderTab('dashboard');
  _loadSapoSyncStatus();
}
window.loadTaiChinh=loadTaiChinh;
window.loadKeToán=loadTaiChinh;
window.loadKeToan=loadTaiChinh;
window.loadSoQuy=function(){STATE.tab='soquy';loadTaiChinh();setTimeout(function(){_renderTab('soquy');},100);};
window.loadCongNo=function(){STATE.tab='congno';loadTaiChinh();setTimeout(function(){_renderTab('congno');},100);};
window.loadBaoCaoTC=function(){STATE.tab='dashboard';loadTaiChinh();};

function _renderTab(tab){
  if(tab==='dashboard') _renderDash();
  else if(tab==='soquy') _renderSoQuy();
  else if(tab==='congno') _renderCongNo();
  else if(tab==='buttoan') _renderButToan();
  else if(tab==='socai') _renderSoCai();
}

// Dashboard TC
function _renderDash(){
  var el=document.getElementById('fin-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('fin_get_report',{},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);padding:16px;">Loi</p>';return;}
    var kpis=[
      {icon:'&#x1F4B5;',label:'So du quy',val:_fmt(d.so_du_quy||0)+'d',c:Number(d.so_du_quy||0)>=0?'var(--green)':'var(--red)'},
      {icon:'&#x1F4C8;',label:'Doanh thu',val:_fmt(d.doanh_thu||0)+'d',c:'var(--green)'},
      {icon:'&#x1F4C9;',label:'Chi phi',val:_fmt(d.chi_phi||0)+'d',c:'var(--red)'},
      {icon:'&#x1F4B9;',label:'Loi nhuan',val:_fmt(d.loi_nhuan||0)+'d',c:Number(d.loi_nhuan||0)>=0?'var(--cyan)':'var(--red)'},
      {icon:'&#x1F4B3;',label:'No KH',val:_fmt(d.no_kh||0)+'d',c:Number(d.no_kh||0)>0?'var(--yellow)':'var(--text3)'},
      {icon:'&#x1F3E6;',label:'No NCC',val:_fmt(d.no_ncc||0)+'d',c:Number(d.no_ncc||0)>0?'var(--yellow)':'var(--text3)'},
    ];
    var html='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px;">'
      +kpis.map(function(k){return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;gap:10px;align-items:center;"><div style="font-size:20px;">'+k.icon+'</div><div><div style="font-size:15px;font-weight:900;color:'+k.c+';">'+k.val+'</div><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);">'+k.label+'</div></div></div>';}).join('')+'</div>';
    // P&L visual
    var rev=Number(d.doanh_thu||0); var cost=Number(d.chi_phi||0); var profit=Number(d.loi_nhuan||0);
    var maxVal=Math.max(rev,cost,1);
    html+='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;">'
      +'<div style="font-size:13px;font-weight:900;margin-bottom:12px;">Ket qua kinh doanh</div>'
      +['Doanh thu:'+rev+':var(--green)','Chi phi:'+cost+':var(--red)','Loi nhuan:'+profit+':'+(profit>=0?'var(--cyan)':'var(--red)')].map(function(s){
        var p=s.split(':'); var pct=Math.round(Math.abs(Number(p[1]))/maxVal*100);
        return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
          +'<div style="width:70px;font-size:11px;color:var(--text3);">'+p[0]+'</div>'
          +'<div style="flex:1;background:var(--bg3);border-radius:4px;height:10px;overflow:hidden;"><div style="width:'+pct+'%;background:'+p[2]+';height:100%;border-radius:4px;"></div></div>'
          +'<div style="width:90px;text-align:right;font-size:11px;font-weight:700;color:'+p[2]+';">'+_fmt(Number(p[1]))+'d</div>'
          +'</div>';
      }).join('')
      +'</div>';
    el.innerHTML=html;
  });
}

// Sổ quỹ
function _renderSoQuy(){
  var el=document.getElementById('fin-body');if(!el)return;
  el.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
      +'<div style="width:100%;display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
      +'<span style="font-size:11px;color:var(--text3);">Cong no KH/NCC. Nhan "Dong bo Sapo" de cap nhat tu don hang Sapo.</span>'
      +'<button id="cn-sapo-sync" style="background:rgba(0,182,255,.1);border:1px solid rgba(0,182,255,.2);color:var(--cyan);border-radius:8px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F504; Sync Sapo</button>'
      +'</div>'
    +'<select id="sq-loai" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<option value="">Tat ca</option><option value="thu">Thu</option><option value="chi">Chi</option>'
    +'</select>'
    +'<input id="sq-from" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<input id="sq-to" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<button id="sq-btn" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
    +'</div><div id="sq-list"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>';
  document.getElementById('sq-btn').addEventListener('click',_loadSoQuy);
  _loadSoQuy();
}

function _loadSoQuy(){
  var el=document.getElementById('sq-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('fin_get_so_quy',{
    loai:(document.getElementById('sq-loai')||{}).value||'',
    from_date:(document.getElementById('sq-from')||{}).value||'',
    to_date:(document.getElementById('sq-to')||{}).value||''
  },function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);padding:16px;">Loi</p>';return;}
    var rows=d.data||[];
    var sumHtml='<div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;">'
      +'<div style="background:rgba(0,214,143,.1);border:1px solid rgba(0,214,143,.2);border-radius:8px;padding:8px 14px;font-size:12px;"><span style="color:var(--text3);">Tong thu: </span><strong style="color:var(--green);">'+_fmt(d.tong_thu||0)+'d</strong></div>'
      +'<div style="background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.2);border-radius:8px;padding:8px 14px;font-size:12px;"><span style="color:var(--text3);">Tong chi: </span><strong style="color:var(--red);">'+_fmt(d.tong_chi||0)+'d</strong></div>'
      +'<div style="background:rgba(79,111,255,.1);border:1px solid rgba(79,111,255,.2);border-radius:8px;padding:8px 14px;font-size:12px;"><span style="color:var(--text3);">So du: </span><strong style="color:var(--accent2);">'+_fmt(d.so_du_cuoi||0)+'d</strong></div>'
      +'</div>';
    if(!rows.length){el.innerHTML=sumHtml+'<div style="text-align:center;padding:24px;color:var(--text3);">Chua co giao dich.</div>';return;}
    var tbl='<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:11px;">'
      +'<thead><tr style="background:var(--bg3);">'
      +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ngay</th>'
      +'<th style="padding:8px 12px;text-align:left;">Dien giai</th>'
      +'<th style="padding:8px 12px;text-align:center;">Loai</th>'
      +'<th style="padding:8px 12px;text-align:right;">So tien</th>'
      +'<th style="padding:8px 12px;text-align:right;">So du</th>'
      +'</tr></thead><tbody>';
    rows.forEach(function(r){
      var c=r.loai==='thu'?'var(--green)':'var(--red)';
      tbl+='<tr style="border-top:1px solid var(--border);">'
        +'<td style="padding:7px 12px;color:var(--text3);">'+_esc(r.ngay||'')+'</td>'
        +'<td style="padding:7px 12px;">'+_esc(r.dien_giai||'')+' <span style="font-size:10px;color:var(--text3);">'+_esc(r.doi_tuong||'')+'</span></td>'
        +'<td style="padding:7px 12px;text-align:center;"><span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;color:'+c+';">'+_esc(r.loai==='thu'?'Thu':'Chi')+'</span></td>'
        +'<td style="padding:7px 12px;text-align:right;font-weight:700;color:'+c+';">'+_fmt(r.so_tien||0)+'</td>'
        +'<td style="padding:7px 12px;text-align:right;color:var(--text3);">'+_fmt(r.so_du||0)+'</td>'
        +'</tr>';
    });
    tbl+='</tbody></table></div>';
    el.innerHTML=sumHtml+tbl;
  });
}

// Công nợ
function _renderCongNo(){
  var el=document.getElementById('fin-body');if(!el)return;
  el.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
      +'<div style="width:100%;display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
      +'<span style="font-size:11px;color:var(--text3);">Cong no KH/NCC. Nhan "Dong bo Sapo" de cap nhat tu don hang Sapo.</span>'
      +'<button id="cn-sapo-sync" style="background:rgba(0,182,255,.1);border:1px solid rgba(0,182,255,.2);color:var(--cyan);border-radius:8px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F504; Sync Sapo</button>'
      +'</div>'
    +'<select id="cn-loai" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<option value="">Tat ca</option><option value="kh">Cong no KH</option><option value="ncc">Cong no NCC</option>'
    +'</select>'
    +'<button id="cn-add-btn" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">+ Them cong no</button>'
    +'<button id="cn-btn" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Xem</button>'
    +'</div><div id="cn-list"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>';
  document.getElementById('cn-btn').addEventListener('click',_loadCongNo);
  document.getElementById('cn-add-btn').addEventListener('click',function(){_showCongNoForm(null);});
  _loadCongNo();
  var cnSapoBtn=document.getElementById('cn-sapo-sync');
  if(cnSapoBtn) cnSapoBtn.addEventListener('click',function(){
    cnSapoBtn.disabled=true;cnSapoBtn.textContent='Dang sync...';
    var apiF2=_api();if(!apiF2)return;
    apiF2('fin_sync_from_sapo',{},function(e,d){
      cnSapoBtn.disabled=false;cnSapoBtn.innerHTML='&#x1F504; Sync Sapo';
      if(!e&&d&&d.ok){_toast('Dong bo xong: '+d.msg,'ok');_loadCongNo();}
      else _toast((d&&d.error)||'Loi','error');
    });
  });
}

function _loadCongNo(){
  var el=document.getElementById('cn-list');if(!el)return;
  var apiF=_api();if(!apiF)return;
  apiF('fin_get_cong_no',{loai:(document.getElementById('cn-loai')||{}).value||'',only_open:false},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);padding:16px;">Loi</p>';return;}
    var rows=d.data||[];
    var summaryHtml='<div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;">'
      +'<div style="background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.2);border-radius:8px;padding:8px 14px;font-size:12px;"><span style="color:var(--text3);">Tong no: </span><strong style="color:var(--red);">'+_fmt(d.tong_no||0)+'d</strong></div>'
      +(d.qua_han>0?'<div style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.2);border-radius:8px;padding:8px 14px;font-size:12px;"><span style="color:var(--yellow);">Qua han: '+d.qua_han+' mon</span></div>':'')
      +'</div>';
    if(!rows.length){el.innerHTML=summaryHtml+'<div style="text-align:center;padding:24px;color:var(--text3);">Khong co cong no.</div>';return;}
    var tbl='<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;">'
      +'<thead><tr style="background:var(--bg3);">'
      +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Doi tuong</th>'
      +'<th style="padding:8px 12px;text-align:center;">Loai</th>'
      +'<th style="padding:8px 12px;text-align:right;">Goc</th>'
      +'<th style="padding:8px 12px;text-align:right;color:var(--red);">Con no</th>'
      +'<th style="padding:8px 12px;text-align:center;">Han TT</th>'
      +'<th style="padding:8px 12px;"></th>'
      +'</tr></thead><tbody>';
    rows.forEach(function(r){
      var c2=r.qua_han?'var(--red)':Number(r.con_no||0)>0?'var(--yellow)':'var(--text3)';
      tbl+='<tr style="border-top:1px solid var(--border);">'
        +'<td style="padding:8px 12px;font-weight:700;">'+_esc(r.ten_doi_tuong||'')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;"><span style="padding:2px 6px;border-radius:4px;font-size:10px;font-weight:800;color:'+(r.loai==='kh'?'var(--cyan)':'var(--accent2)')+';">'+_esc(r.loai==='kh'?'KH':'NCC')+'</span></td>'
        +'<td style="padding:8px 12px;text-align:right;">'+_fmt(r.so_tien_goc||0)+'</td>'
        +'<td style="padding:8px 12px;text-align:right;font-weight:900;color:'+c2+';">'+_fmt(r.con_no||0)+(r.qua_han?' &#x26A0;':'')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;font-size:11px;color:var(--text3);">'+_esc(r.han_tt||'--')+'</td>'
        +'<td style="padding:8px 12px;" id="cn-act-'+_esc(r.ma||'')+'"></td>'
        +'</tr>';
    });
    tbl+='</tbody></table></div>';
    el.innerHTML=summaryHtml+tbl;
    rows.forEach(function(r){
      var td=document.getElementById('cn-act-'+r.ma);if(!td)return;
      if(Number(r.con_no||0)>0){
        var thuBtn2=document.createElement('button');
        thuBtn2.innerHTML='&#x1F4B5;';thuBtn2.title='Thu tien + Cap nhat Sapo';
        thuBtn2.style.cssText='background:rgba(0,214,143,.1);border:1px solid rgba(0,214,143,.2);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;color:var(--green);margin-right:3px;';
        thuBtn2.addEventListener('click',function(){ _showThanhToanFormWithSapo(r); });
        td.appendChild(thuBtn2);
        var btn=document.createElement('button');
        btn.innerHTML='&#x1F4B5; TT';btn.title='Thanh toan';
        btn.style.cssText='background:rgba(0,214,143,.1);border:1px solid rgba(0,214,143,.2);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;color:var(--green);';
        btn.addEventListener('click',function(){ _showThanhToanForm(r); });
        td.appendChild(btn);
      }
    });
  });
}

function _showThanhToanFormWithSapo(cn){
    // Kiểm tra có phải công nợ từ Sapo không
    var isSapo = cn.ma && cn.ma.indexOf('CN-SAPO-') === 0;
    var sapoId = isSapo ? cn.ma.replace('CN-SAPO-','') : '';
    var h='<div style="padding:16px 20px;border-bottom:1px solid var(--border);font-size:14px;font-weight:900;">Thu tien + Dong bo Sapo</div>'
      +'<div style="padding:20px;">'
      +'<div style="background:var(--bg3);border-radius:10px;padding:12px;margin-bottom:14px;font-size:12px;">'
      +'<div style="font-weight:700;margin-bottom:4px;">'+_esc(cn.ten_doi_tuong||'')+'</div>'
      +'<div style="color:var(--red);">Con no: <strong>'+_fmt(cn.con_no||0)+'d</strong></div>'
      +(isSapo?'<div style="color:var(--cyan);font-size:11px;margin-top:4px;">&#x1F504; Se cap nhat trang thai Sapo sau khi thu</div>':'')
      +'</div>'
      +'<label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">So tien</label>'
      +'<input id="tts-so" type="number" value="'+(cn.con_no||0)+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;margin-bottom:12px;">'
      +'<label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">Phuong thuc TT</label>'
      +'<select id="tts-pt" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
      +'<option value="cash">Tien mat</option>'
      +'<option value="bank_transfer">Chuyen khoan</option>'
      +'<option value="momo">MoMo</option>'
      +'<option value="cod">COD</option>'
      +'</select>'
      +'</div>'
      +'<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
      +'<button id="tts-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
      +'<button id="tts-save" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Xac nhan thu'+(isSapo?' + Sync Sapo':'')+'</button>'
      +'</div>';
    _modal(h,'480px');
    document.getElementById('tts-cancel').addEventListener('click',_cm);
    document.getElementById('tts-save').addEventListener('click',function(){
      var so=Number(document.getElementById('tts-so').value||0);
      var pt=document.getElementById('tts-pt').value;
      if(!so){_toast('Nhap so tien','error');return;}
      var btn=document.getElementById('tts-save');btn.disabled=true;btn.textContent='Dang xu ly...';
      var apiF=_api();
      // 1. Thu tiền trong ERP
      apiF('fin_thanh_toan_cong_no',{ma:cn.ma,so_tien:so},function(e,d){
        if(e||!d||!d.ok){btn.disabled=false;btn.textContent='Xac nhan';_toast((d&&d.error)||'Loi','error');return;}
        _toast('Da thu '+_fmt(so)+'d','ok');
        // 2. Nếu là Sapo order → cập nhật Sapo
        if (isSapo && sapoId) {
          apiF('fin_mark_paid_in_sapo',{sapo_id:sapoId,so_tien:so,pt_tt:pt},function(e2,d2){
            if(!e2&&d2&&d2.ok) _toast('Da cap nhat Sapo: '+sapoId,'ok');
            else _toast('Thu ERP OK nhung Sapo update that bai: '+((d2&&d2.error)||''),'error');
          });
        }
        _cm();_loadCongNo();
      });
    });
  }

function _showThanhToanForm(cn){
  var h='<div style="padding:16px 20px;border-bottom:1px solid var(--border);font-size:14px;font-weight:900;">Thanh toan cong no</div>'
    +'<div style="padding:20px;">'
    +'<div style="background:var(--bg3);border-radius:10px;padding:12px;margin-bottom:14px;font-size:12px;">'
    +'<div style="font-weight:700;margin-bottom:4px;">'+_esc(cn.ten_doi_tuong||'')+'</div>'
    +'<div style="color:var(--red);">Con no: <strong>'+_fmt(cn.con_no||0)+'d</strong></div>'
    +'</div>'
    +'<label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">So tien thanh toan</label>'
    +'<input id="tt-so" type="number" value="'+(cn.con_no||0)+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'</div>'
    +'<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
    +'<button id="tt-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
    +'<button id="tt-save" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Xac nhan TT</button>'
    +'</div>';
  _modal(h,'480px');
  document.getElementById('tt-cancel').addEventListener('click',_cm);
  document.getElementById('tt-save').addEventListener('click',function(){
    var so=Number(document.getElementById('tt-so').value||0);
    if(!so){_toast('Nhap so tien','error');return;}
    var apiF=_api();
    apiF('fin_thanh_toan_cong_no',{ma:cn.ma,so_tien:so},function(e,d){
      if(!e&&d&&d.ok){_toast('Thanh toan '+_fmt(so)+'d thanh cong','ok');_cm();_loadCongNo();}
      else _toast((d&&d.error)||'Loi','error');
    });
  });
}

function _showCongNoForm(cn){
  var h='<div style="padding:16px 20px;border-bottom:1px solid var(--border);font-size:14px;font-weight:900;">Them cong no</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px;">'
    +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">Loai *</label>'
    +'<select id="cnf-loai" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<option value="kh">Cong no KH</option><option value="ncc">Cong no NCC</option></select></div>'
    +_fld2('cnf-ten','Ten doi tuong *','text','')
    +_fld2('cnf-so','So tien goc *','number','0')
    +_fld2('cnf-han','Han thanh toan','date','')
    +'<div style="grid-column:1/-1;"><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">Ghi chu</label><input id="cnf-gc" type="text" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"></div>'
    +'</div>'
    +'<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
    +'<button id="cnf-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
    +'<button id="cnf-save" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Them</button>'
    +'</div>';
  _modal(h,'560px');
  document.getElementById('cnf-cancel').addEventListener('click',_cm);
  document.getElementById('cnf-save').addEventListener('click',function(){
    var ten=document.getElementById('cnf-ten').value.trim();
    var so=Number(document.getElementById('cnf-so').value||0);
    if(!ten||!so){_toast('Nhap day du thong tin','error');return;}
    var apiF=_api();
    apiF('fin_save_cong_no',{
      loai:document.getElementById('cnf-loai').value,
      ten_doi_tuong:ten,so_tien_goc:so,
      han_tt:document.getElementById('cnf-han').value,
      ghi_chu:document.getElementById('cnf-gc').value
    },function(e,d){
      if(!e&&d&&d.ok){_toast('Da them cong no','ok');_cm();_loadCongNo();}
      else _toast((d&&d.error)||'Loi','error');
    });
  });
}

// Bút toán
function _renderButToan(){
  var el=document.getElementById('fin-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai but toan...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('fin_get_but_toan',{limit:50},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi</p>';return;}
    var rows=d.data||[];
    if(!rows.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Chua co but toan.</div>';return;}
    var html='<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:11px;">'
      +'<thead><tr style="background:var(--bg3);">'
      +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ngay</th>'
      +'<th style="padding:8px 12px;text-align:left;">Dien giai</th>'
      +'<th style="padding:8px 12px;text-align:center;">No</th>'
      +'<th style="padding:8px 12px;text-align:center;">Co</th>'
      +'<th style="padding:8px 12px;text-align:right;">So tien</th>'
      +'</tr></thead><tbody>';
    rows.forEach(function(r){
      html+='<tr style="border-top:1px solid var(--border);">'
        +'<td style="padding:7px 12px;color:var(--text3);">'+_esc(r.ngay||'')+'</td>'
        +'<td style="padding:7px 12px;">'+_esc(r.dien_giai||'')+'</td>'
        +'<td style="padding:7px 12px;text-align:center;font-family:monospace;color:var(--red);">'+_esc(r.tk_no||'')+'</td>'
        +'<td style="padding:7px 12px;text-align:center;font-family:monospace;color:var(--green);">'+_esc(r.tk_co||'')+'</td>'
        +'<td style="padding:7px 12px;text-align:right;font-weight:700;">'+_fmt(r.so_tien||0)+'</td>'
        +'</tr>';
    });
    html+='</tbody></table></div>';
    el.innerHTML=html;
  });
}

function _showPhieuForm(){
  var h='<div style="padding:16px 20px;border-bottom:1px solid var(--border);font-size:14px;font-weight:900;">Phieu thu / chi</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px;">'
    +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">Loai *</label>'
    +'<select id="ph-loai" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<option value="thu">Thu tien</option><option value="chi">Chi tien</option></select></div>'
    +_fld2('ph-so','So tien *','number','0')
    +_fld2('ph-dt','Doi tuong','text','')
    +_fld2('ph-ngay','Ngay','date',new Date().toISOString().split('T')[0])
    +'<div style="grid-column:1/-1;"><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">Dien giai *</label><input id="ph-dg" type="text" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"></div>'
    +'</div>'
    +'<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
    +'<button id="ph-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
    +'<button id="ph-save" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Luu phieu</button>'
    +'</div>';
  _modal(h,'560px');
  document.getElementById('ph-cancel').addEventListener('click',_cm);
  document.getElementById('ph-save').addEventListener('click',function(){
    var so=Number(document.getElementById('ph-so').value||0);
    var dg=document.getElementById('ph-dg').value.trim();
    if(!so||!dg){_toast('Nhap so tien va dien giai','error');return;}
    var btn=document.getElementById('ph-save');btn.disabled=true;
    var apiF=_api();
    apiF('fin_save_phieu',{
      loai:document.getElementById('ph-loai').value,
      so_tien:so,dien_giai:dg,
      doi_tuong:document.getElementById('ph-dt').value,
      ngay:document.getElementById('ph-ngay').value
    },function(e,d){
      btn.disabled=false;
      if(!e&&d&&d.ok){_toast('Da luu phieu '+d.ma_phieu,'ok');_cm();_renderTab(STATE.tab);}
      else _toast((d&&d.error)||'Loi','error');
    });
  });
}

function _fld2(id,l,t,v){return '<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">'+l+'</label><input id="'+id+'" type="'+t+'" value="'+_esc(String(v||''))+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"></div>';}

// ── [v5.19] Sổ cái TK 111/131/331 ───────────────────────────────
// [SECURITY] Server text qua _esc trước innerHTML
// [O(1)]     TK_MAP lookup
// ─────────────────────────────────────────────────────────────────

var _FIN_TK_MAP = {
  '111':'Tiền mặt',
  '112':'Tiền gửi NH',
  '131':'Phải thu KH',
  '331':'Phải trả NCC',
  '511':'Doanh thu',
  '641':'Chi phí BH',
  '642':'Chi phí QL',
  '156':'Hàng hóa',
};

var _scState = { tk:'111', from:'', to:'', page:1, data:null };

function _esc(s){ return String(s||'')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;'); }

function _fmtC(n){ return Number(n||0).toLocaleString('vi-VN'); }

function _renderSoCai(){
  var el=document.getElementById('fin-body'); if(!el) return;

  // Filter bar
  var tkOptions = Object.keys(_FIN_TK_MAP).map(function(k){
    return '<option value="'+k+'"'+(k===_scState.tk?' selected':'')+'>TK '+k+' – '+_FIN_TK_MAP[k]+'</option>';
  }).join('');

  el.innerHTML =
    '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px;">'
    +'<select id="sc-tk-sel" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text);'
    +'border-radius:8px;padding:7px 12px;font-size:12px;font-family:inherit;cursor:pointer;">'+tkOptions+'</select>'
    +'<input id="sc-from" type="date" value="'+_esc(_scState.from)+'"'
    +' style="background:var(--bg3);border:1px solid var(--border2);color:var(--text);'
    +'border-radius:8px;padding:7px 10px;font-size:12px;font-family:inherit;" placeholder="Từ ngày"/>'
    +'<input id="sc-to" type="date" value="'+_esc(_scState.to)+'"'
    +' style="background:var(--bg3);border:1px solid var(--border2);color:var(--text);'
    +'border-radius:8px;padding:7px 10px;font-size:12px;font-family:inherit;" placeholder="Đến ngày"/>'
    +'<button id="sc-search-btn" style="background:var(--accent2);border:none;color:#fff;'
    +'border-radius:8px;padding:7px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">'
    +'&#x1F50D; Xem sổ cái</button>'
    +'<button id="sc-export-btn" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);'
    +'border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">'
    +'&#x1F4E5; Xuất CSV</button>'
    +'</div>'
    +'<div id="sc-result">'
      +'<div style="text-align:center;padding:40px 16px;color:var(--text3);">'
        +'<div style="font-size:28px;margin-bottom:8px;">&#x1F4D6;</div>'
        +'<div style="font-size:12px;font-weight:700;">Chọn tài khoản và nhấn "Xem sổ cái"</div>'
      +'</div>'
    +'</div>';

  // Events
  document.getElementById('sc-search-btn').addEventListener('click', function(){
    _scState.tk   = document.getElementById('sc-tk-sel').value;
    _scState.from = document.getElementById('sc-from').value;
    _scState.to   = document.getElementById('sc-to').value;
    _scState.page = 1;
    _loadSoCai();
  });

  document.getElementById('sc-export-btn').addEventListener('click', function(){
    if(_scState.data) _scExportCSV(_scState.data);
    else _toast('Hãy tải sổ cái trước khi xuất','error');
  });

  // Nếu đã có data → re-render
  if(_scState.data) _scRenderTable(_scState.data);
}

function _loadSoCai(){
  var resultEl = document.getElementById('sc-result'); if(!resultEl) return;
  resultEl.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);">Đang tải...</div>';

  var apiF=_api(); if(!apiF){ resultEl.innerHTML='<p style="color:var(--red);">API chưa sẵn sàng</p>'; return; }
  apiF('fin_get_so_cai',{
    tk        : _scState.tk,
    from_date : _scState.from || undefined,
    to_date   : _scState.to   || undefined,
    limit     : 200,
    page      : _scState.page,
  }, function(e,d){
    if(e||!d||!d.ok){
      resultEl.innerHTML='<div style="color:var(--red);padding:16px;">Lỗi: '+_esc((d&&d.error)||'Không kết nối được GAS')+'</div>';
      return;
    }
    _scState.data = d;
    _scRenderTable(d);
  });
}

function _scRenderTable(d){
  var resultEl=document.getElementById('sc-result'); if(!resultEl) return;

  var rows  = d.data || [];
  var noData = rows.length === 0;

  // Header summary
  var sdColor = d.so_du_cuoi >= 0 ? 'var(--green)' : 'var(--red)';
  var html = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">'
    + _scSummCard('Tổng Nợ',    _fmtC(d.tong_no),   'var(--accent2)')
    + _scSummCard('Tổng Có',    _fmtC(d.tong_co),   'var(--red)')
    + _scSummCard('Số dư cuối', _fmtC(d.so_du_cuoi), sdColor)
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px 16px;flex:1;">'
      + '<div style="font-size:10px;color:var(--text3);font-weight:700;margin-bottom:4px;">TÀI KHOẢN</div>'
      + '<div style="font-size:14px;font-weight:900;">TK '+_esc(d.tk)+' — '+_esc(d.ten_tk)+'</div>'
      + '<div style="font-size:10px;color:var(--text3);margin-top:2px;">'
        + d.total + ' bút toán'
        + (d.so_du_dau ? ' | Số dư đầu kỳ: '+_fmtC(d.so_du_dau) : '')
      + '</div>'
    + '</div>'
    + '</div>';

  if(noData){
    html += '<div style="text-align:center;padding:32px;color:var(--text3);">'
      + '<div style="font-size:24px;">&#x1F4ED;</div>'
      + '<div style="font-size:12px;margin-top:8px;">Không có phát sinh trong kỳ</div>'
      + '</div>';
  } else {
    html += '<div style="overflow-x:auto;">'
      + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
      + '<thead><tr style="background:var(--bg3);">'
      + '<th style="text-align:left;padding:8px 10px;color:var(--text3);font-weight:700;border-bottom:2px solid var(--border);">Ngày</th>'
      + '<th style="text-align:left;padding:8px 10px;color:var(--text3);font-weight:700;border-bottom:2px solid var(--border);">Diễn giải</th>'
      + '<th style="text-align:left;padding:8px 10px;color:var(--text3);font-weight:700;border-bottom:2px solid var(--border);">Mã chứng từ</th>'
      + '<th style="text-align:right;padding:8px 10px;color:var(--accent2);font-weight:700;border-bottom:2px solid var(--border);">Số Nợ</th>'
      + '<th style="text-align:right;padding:8px 10px;color:var(--red);font-weight:700;border-bottom:2px solid var(--border);">Số Có</th>'
      + '<th style="text-align:right;padding:8px 10px;color:var(--text2);font-weight:700;border-bottom:2px solid var(--border);">Số dư</th>'
      + '<th style="text-align:center;padding:8px 10px;color:var(--text3);font-weight:700;border-bottom:2px solid var(--border);">Nguồn</th>'
      + '</tr></thead><tbody>';

    rows.forEach(function(r, i){
      var sdClr = r.so_du >= 0 ? 'var(--green)' : 'var(--red)';
      var rowBg = i%2===0 ? 'var(--bg2)' : 'var(--bg3)';
      html += '<tr style="background:'+rowBg+';">'
        + '<td style="padding:7px 10px;white-space:nowrap;color:var(--text3);">'+_esc(r.ngay)+'</td>'
        + '<td style="padding:7px 10px;color:var(--text);">'+_esc(String(r.dien_giai||'').slice(0,50))+'</td>'
        + '<td style="padding:7px 10px;font-family:monospace;font-size:10px;color:var(--cyan);">'+_esc(r.ma_ref)+'</td>'
        + '<td style="padding:7px 10px;text-align:right;font-weight:'+(r.so_no>0?'800':'400')+';color:'+(r.so_no>0?'var(--accent2)':'var(--text3)') + ';">'
          +(r.so_no>0 ? _fmtC(r.so_no) : '—')+'</td>'
        + '<td style="padding:7px 10px;text-align:right;font-weight:'+(r.so_co>0?'800':'400')+';color:'+(r.so_co>0?'var(--red)':'var(--text3)')+';">'
          +(r.so_co>0 ? _fmtC(r.so_co) : '—')+'</td>'
        + '<td style="padding:7px 10px;text-align:right;font-weight:800;color:'+sdClr+';">'+_fmtC(r.so_du)+'</td>'
        + '<td style="padding:7px 10px;text-align:center;">'
          + '<span style="background:'+(r.nguon==='ButToan'?'rgba(79,111,255,.15)':'rgba(0,214,143,.15)')+';'
          + 'color:'+(r.nguon==='ButToan'?'var(--accent2)':'var(--green)')+';'
          + 'border-radius:5px;padding:2px 7px;font-size:9px;font-weight:800;">'+_esc(r.nguon)+'</span>'
        + '</td>'
        + '</tr>';
    });

    // Footer tổng
    html += '<tr style="background:var(--bg4,var(--bg3));font-weight:900;border-top:2px solid var(--border);">'
      + '<td colspan="3" style="padding:8px 10px;font-size:12px;color:var(--text);">TỔNG CỘNG</td>'
      + '<td style="padding:8px 10px;text-align:right;color:var(--accent2);">'+_fmtC(d.tong_no)+'</td>'
      + '<td style="padding:8px 10px;text-align:right;color:var(--red);">'+_fmtC(d.tong_co)+'</td>'
      + '<td style="padding:8px 10px;text-align:right;color:'+sdColor+';">'+_fmtC(d.so_du_cuoi)+'</td>'
      + '<td></td></tr>';

    html += '</tbody></table></div>';

    // Phân trang
    if(d.total > rows.length){
      html += '<div style="display:flex;justify-content:center;gap:8px;margin-top:12px;">';
      if(_scState.page > 1){
        html += '<button onclick="_scPage(-1)" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:7px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">‹ Trước</button>';
      }
      html += '<span style="font-size:11px;color:var(--text3);padding:5px 10px;">Trang '+_scState.page+' / '+Math.ceil(d.total/d.limit)+'</span>';
      if(_scState.page * d.limit < d.total){
        html += '<button onclick="_scPage(1)" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:7px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Tiếp ›</button>';
      }
      html += '</div>';
    }
  }

  resultEl.innerHTML = html;
}

function _scSummCard(label, val, color){
  return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px 16px;min-width:140px;">'
    + '<div style="font-size:10px;color:var(--text3);font-weight:700;text-transform:uppercase;margin-bottom:4px;">'+label+'</div>'
    + '<div style="font-size:16px;font-weight:900;color:'+color+';">'+val+'</div>'
    + '</div>';
}

function _scPage(delta){
  _scState.page = Math.max(1, _scState.page + delta);
  _loadSoCai();
}

function _scExportCSV(d){
  var rows = d.data || [];
  var lines = [['Ngay','Dien giai','Ma chung tu','So No','So Co','So du','Nguon'].join(',')];
  rows.forEach(function(r){
    lines.push([
      r.ngay, '"'+String(r.dien_giai||'').replace(/"/g,'""')+'"',
      r.ma_ref, r.so_no, r.so_co, r.so_du, r.nguon
    ].join(','));
  });
  lines.push(['TONG CONG','','',d.tong_no,d.tong_co,d.so_du_cuoi,''].join(','));

  var csv  = '\uFEFF' + lines.join('\r\n'); // BOM for Excel UTF-8
  var blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href   = url;
  a.download = 'SoCai_TK'+d.tk+'_'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  _toast('Đã xuất CSV: SoCai_TK'+d.tk,'ok');
}

})();
