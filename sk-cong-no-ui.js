// [v5.34] 22/03/2026 — sk-cong-no-ui.js
// Module CÔNG NỢ — Phân tách từ sk-finance-ui.js
// Aging Dashboard, Bulk Payment, Nhắc nợ Telegram
(function(){
'use strict';
var _api  = function(){ return typeof window.api==='function'?window.api:null; };
var _ct   = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
var _esc  = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
var _fmt  = function(n){ n=Number(n||0); if(n>=1e9)return(n/1e9).toFixed(1)+'ty'; if(n>=1e6)return(n/1e6).toFixed(1)+'tr'; if(n>=1e3)return Math.round(n/1e3)+'k'; return String(Math.round(n)); };
var _toast= function(m,t){ if(typeof window.skToast==='function')window.skToast(m,t||'ok'); };
var _modal= function(h,w){
  var old=document.getElementById('sk-fin-modal');
  if(old&&old.parentNode)old.parentNode.removeChild(old);
  var ov=document.createElement('div');
  ov.id='sk-fin-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  var box=document.createElement('div');
  box.style.cssText='background:var(--bg2);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:'+(w||'500px')+';max-height:90vh;overflow-y:auto;';
  box.innerHTML=h;
  ov.appendChild(box); document.body.appendChild(ov);
  return {ov:ov,box:box};
};
var _pgBtn=function(a){ return 'background:'+(a?'var(--accent2)':'var(--bg3)')+';border:1px solid var(--border2);color:'+(a?'#fff':'var(--text2)')+';border-radius:7px;padding:5px 11px;font-size:12px;font-weight:700;cursor:pointer;'; };

var CN = { page:1, loai:'', status:'', sort:'con_no' };

function loadCongNo(){
  var ct=_ct();if(!ct)return;
  ct.innerHTML='<div class="fade-in" style="padding:24px;">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:18px;">'
      +'<div>'
        +'<h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F4CB; Cong no</h1>'
        +'<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">KH · NCC · Aging Report · Thanh toan · Nhac no</p>'
      +'</div>'
      +'<div style="display:flex;gap:7px;">'
        +'<button id="cn-new-btn" style="background:rgba(79,111,255,.12);border:1px solid rgba(79,111,255,.25);color:var(--accent2);border-radius:9px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2795; Them cong no</button>'
        +'<button id="cn-sapo-sync" style="background:rgba(0,182,255,.08);border:1px solid rgba(0,182,255,.2);color:var(--cyan);border-radius:9px;padding:8px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x21BA; Dong bo Sapo</button>'
      +'</div>'
    +'</div>'
    +'<div id="cn-aging-row" style="margin-bottom:14px;"></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:8px;">Top 5 no nhieu nhat</div>'
        +'<canvas id="cn-chart" height="130"></canvas>'
      +'</div>'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:10px;">Phan tich aging</div>'
        +'<div id="cn-aging-detail"></div>'
      +'</div>'
    +'</div>'
    +'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">'
      +'<select id="cn-loai" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 9px;color:var(--text3);font-family:inherit;font-size:11px;"><option value="">KH + NCC</option><option value="kh">Khach hang</option><option value="ncc">NCC</option></select>'
      +'<select id="cn-status" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 9px;color:var(--text3);font-family:inherit;font-size:11px;"><option value="">Tat ca</option><option value="chua_tt">Con no</option><option value="da_tt">Da thanh toan</option></select>'
      +'<button id="cn-filter-btn" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Loc</button>'
      +'<button id="cn-bulk-btn" style="background:rgba(79,111,255,.12);border:1px solid rgba(79,111,255,.25);color:var(--accent2);border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4B5; Bulk TT</button>'
      +'<button id="cn-remind-btn" style="background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.25);color:#f59e0b;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4F2; Nhac no TG</button>'
    +'</div>'
    +'<div id="cn-list"></div>'
    +'<div id="cn-pagination" style="display:flex;gap:6px;justify-content:center;margin-top:12px;flex-wrap:wrap;"></div>';

  document.getElementById('cn-new-btn').addEventListener('click', function(){ _showCongNoForm(null); });
  document.getElementById('cn-filter-btn').addEventListener('click',function(){
    CN.loai=(document.getElementById('cn-loai')||{}).value||'';
    CN.status=(document.getElementById('cn-status')||{}).value||'';
    CN.page=1; _loadCongNo();
  });
  document.getElementById('cn-bulk-btn').addEventListener('click',_cnBulkPayment);
  document.getElementById('cn-remind-btn').addEventListener('click',_cnSendReminder);
  document.getElementById('cn-sapo-sync').addEventListener('click',function(){
    var btn=document.getElementById('cn-sapo-sync'); btn.disabled=true; btn.textContent='Dang dong bo...';
    var apiF=_api();if(!apiF)return;
    apiF('fin_sync_from_sapo',{},function(e,d){
      btn.disabled=false; btn.innerHTML='&#x21BA; Dong bo Sapo';
      if(!e&&d&&d.ok){ _toast('Da dong bo Sapo','ok'); _loadCongNo(); _loadAgingDashboard(); }
      else _toast((d&&d.error)||'Loi','error');
    });
  });
  _loadAgingDashboard();
  _loadCongNo();
}

function _renderCongNo(){
  var el=document.getElementById('fin-body');if(!el)return;
  STATE.cn_page=1; STATE.cn_loai=''; STATE.cn_status='';

  el.innerHTML=
    // KPI + Aging row
    '<div id="cn-aging-row" style="margin-bottom:14px;"></div>'
    // Top5 + chart row
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:8px;">Top 5 doi tuong no nhieu nhat</div>'
        +'<canvas id="cn-chart" height="130"></canvas>'
      +'</div>'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:10px;">Phan tich aging</div>'
        +'<div id="cn-aging-detail"></div>'
      +'</div>'
    +'</div>'
    // Actions
    +'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">'
      +'<select id="cn-loai" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 9px;color:var(--text3);font-family:inherit;font-size:11px;">'
        +'<option value="">KH + NCC</option><option value="kh">Khach hang</option><option value="ncc">NCC</option>'
      +'</select>'
      +'<select id="cn-status" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 9px;color:var(--text3);font-family:inherit;font-size:11px;">'
        +'<option value="">Tat ca</option><option value="chua_tt">Con no</option><option value="da_tt">Da thanh toan</option>'
      +'</select>'
      +'<button id="cn-filter-btn" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Loc</button>'
      +'<button id="cn-bulk-btn" style="background:rgba(79,111,255,.12);border:1px solid rgba(79,111,255,.25);color:var(--accent2);border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4B5; Bulk TT</button>'
      +'<button id="cn-remind-btn" style="background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.25);color:#f59e0b;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4F2; Nhac no TG</button>'
      +'<button id="cn-sapo-sync" style="background:rgba(0,182,255,.08);border:1px solid rgba(0,182,255,.2);color:var(--cyan);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x21BA; Sapo</button>'
    +'</div>'
    +'<div id="cn-list"></div>'
    +'<div id="cn-pagination" style="display:flex;gap:6px;justify-content:center;margin-top:12px;flex-wrap:wrap;"></div>';

  document.getElementById('cn-filter-btn').addEventListener('click',function(){
    STATE.cn_loai=(document.getElementById('cn-loai')||{}).value||'';
    STATE.cn_status=(document.getElementById('cn-status')||{}).value||'';
    STATE.cn_page=1; _loadCongNo();
  });
  document.getElementById('cn-bulk-btn').addEventListener('click',_cnBulkPayment);
  document.getElementById('cn-remind-btn').addEventListener('click',_cnSendReminder);
  document.getElementById('cn-sapo-sync').addEventListener('click',function(){
    var btn=document.getElementById('cn-sapo-sync');
    btn.textContent='Dang dong bo...'; btn.disabled=true;
    var apiF=_api();if(!apiF)return;
    apiF('fin_sync_from_sapo',{},function(e,d){
      btn.disabled=false; btn.innerHTML='&#x21BA; Sapo';
      if(!e&&d&&d.ok){ _toast('Da dong bo Sapo','ok'); _loadCongNo(); }
      else _toast((d&&d.error)||'Loi','error');
    });
  });
  _loadAgingDashboard();
  _loadCongNo();
}

function _loadAgingDashboard(){
  var apiF=_api();if(!apiF)return;
  apiF('fin_get_aging_report',{},function(e,d){
    if(!d||!d.ok) return;
    var aging=d.aging||{};
    var agRow=document.getElementById('cn-aging-row');
    if(agRow){
      var buckets=[
        {lbl:'Chua den han', v:aging.amt_current||0, n:aging.current||0, clr:'#34d399'},
        {lbl:'0-30 ngay',    v:aging.amt_d30||0,     n:aging.d30||0,     clr:'#fbbf24'},
        {lbl:'30-60 ngay',   v:aging.amt_d60||0,     n:aging.d60||0,     clr:'#f97316'},
        {lbl:'60-90 ngay',   v:aging.amt_d90||0,     n:aging.d90||0,     clr:'#ef4444'},
        {lbl:'Tren 90 ngay', v:aging.amt_over90||0,  n:aging.over90||0,  clr:'#7f1d1d'},
      ];
      agRow.innerHTML='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">'
        +buckets.map(function(b){
          return '<div style="background:var(--bg2);border:1px solid '+b.clr+'33;border-left:3px solid '+b.clr+';border-radius:10px;padding:11px;">'
            +'<div style="font-size:10px;font-weight:800;color:'+b.clr+';margin-bottom:4px;">'+b.lbl+'</div>'
            +'<div style="font-size:16px;font-weight:900;color:var(--text);font-family:monospace;">'+_fmt(b.v)+'d</div>'
            +'<div style="font-size:10px;color:var(--text3);">'+b.n+' doi tuong</div>'
          +'</div>';
        }).join('')
      +'</div>';
    }
    // Chart top5
    var chartEl=document.getElementById('cn-chart');
    if(chartEl && d.top5 && d.top5.length){
      var top5=d.top5;
      var W=chartEl.parentElement.clientWidth-28||250; var H=130;
      chartEl.width=W; chartEl.height=H;
      var ctx=chartEl.getContext('2d');
      ctx.fillStyle='#0d1020'; ctx.fillRect(0,0,W,H);
      var maxV=Math.max.apply(null,top5.map(function(r){return r.con_no||0;}))||1;
      var bh=Math.floor((H-20)/top5.length)-4;
      top5.forEach(function(r,i){
        var y=10+i*(bh+4);
        var w=Math.round(((r.con_no||0)/maxV)*(W-80));
        var agClr=r.aging_days>90?'#7f1d1d':(r.aging_days>60?'#ef4444':(r.aging_days>30?'#f97316':(r.aging_days>0?'#fbbf24':'#34d399')));
        var grd=ctx.createLinearGradient(0,y,w,y);
        grd.addColorStop(0,agClr); grd.addColorStop(1,agClr+'44');
        ctx.fillStyle=grd;
        ctx.beginPath(); ctx.roundRect(0,y,Math.max(w,4),bh,3); ctx.fill();
        ctx.fillStyle='#94a3b8'; ctx.font='9px sans-serif'; ctx.textAlign='left';
        var name=(r.ten||'').substring(0,14);
        ctx.fillText(name,4,y+bh-3);
        ctx.textAlign='right';
        ctx.fillText(_fmt(r.con_no||0)+'d',W-2,y+bh-3);
      });
    }
    // Aging detail
    var agDetail=document.getElementById('cn-aging-detail');
    if(agDetail){
      var total=d.tong_no||0;
      var buckets2=[
        {lbl:'Chua den han', v:aging.amt_current||0, clr:'#34d399'},
        {lbl:'0-30 ngay',    v:aging.amt_d30||0,     clr:'#fbbf24'},
        {lbl:'30-60 ngay',   v:aging.amt_d60||0,     clr:'#f97316'},
        {lbl:'60-90 ngay',   v:aging.amt_d90||0,     clr:'#ef4444'},
        {lbl:'>90 ngay',     v:aging.amt_over90||0,  clr:'#7f1d1d'},
      ];
      agDetail.innerHTML=buckets2.map(function(b){
        var pct=total>0?Math.round(b.v/total*100):0;
        return '<div style="margin-bottom:6px;">'
          +'<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px;">'
            +'<span style="color:var(--text3);">'+b.lbl+'</span>'
            +'<span style="color:'+b.clr+';font-weight:700;">'+_fmt(b.v)+'d ('+pct+'%)</span>'
          +'</div>'
          +'<div style="height:5px;background:var(--bg3);border-radius:99px;overflow:hidden;">'
            +'<div style="height:100%;width:'+pct+'%;background:'+b.clr+';border-radius:99px;"></div>'
          +'</div>'
        +'</div>';
      }).join('');
    }
  });
}

function _loadCongNo(){
  var el=document.getElementById('cn-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('fin_get_cong_no',{
    loai:STATE.cn_loai,
    only_open:STATE.cn_status==='chua_tt',
    page:STATE.cn_page, limit:20,
  },function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<div style="color:var(--red);padding:16px;">Loi</div>';return;}
    var rows=d.data||[]; var total=d.total||0;

    if(!rows.length){
      el.innerHTML='<div style="text-align:center;padding:36px;color:var(--text3);">Khong co cong no.</div>';
      _cnPagination(0,20); return;
    }
    el.innerHTML='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:600px;">'
      +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:8px;width:32px;"><input type="checkbox" id="cn-all" title="Chon tat ca"></th>'
        +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Doi tuong</th>'
        +'<th style="padding:8px 12px;text-align:center;">Loai</th>'
        +'<th style="padding:8px 12px;text-align:right;">Goc</th>'
        +'<th style="padding:8px 12px;text-align:right;">Con no</th>'
        +'<th style="padding:8px 12px;text-align:center;">Han TT</th>'
        +'<th style="padding:8px 12px;text-align:center;">Aging</th>'
        +'<th style="padding:8px 12px;text-align:center;">TT</th>'
        +'<th style="padding:8px 12px;"></th>'
      +'</tr></thead><tbody>'
      +rows.map(function(r,ri){
        var aging=Number(r.aging_days||0);
        var agClr=aging>90?'#f87171':(aging>60?'#ef4444':(aging>30?'#f97316':(aging>0?'#fbbf24':'#34d399')));
        var agLbl=aging<=0?'Chua han':(aging<=30?aging+'d':(aging<=60?aging+'d':(aging<=90?aging+'d':aging+'d')));
        var stClr=r.trang_thai==='da_tt'?'#34d399':(r.con_no>0?'#fbbf24':'#64748b');
        return '<tr style="border-top:1px solid var(--border);">'
          +'<td style="padding:8px;text-align:center;"><input type="checkbox" class="cn-cb" data-ma="'+_esc(r.ma||'')+'" data-ten="'+_esc(r.ten_doi_tuong||'')+'" data-no="'+Number(r.con_no||0)+'"></td>'
          +'<td style="padding:8px 12px;font-weight:700;">'+_esc(r.ten_doi_tuong||'')+'</td>'
          +'<td style="padding:8px 12px;text-align:center;">'
            +'<span style="background:'+(r.loai==='kh'?'rgba(0,182,255,.1)':'rgba(79,111,255,.1)')+';color:'+(r.loai==='kh'?'var(--cyan)':'var(--accent2)')+';border-radius:4px;padding:1px 6px;font-size:10px;font-weight:800;">'+(r.loai==='kh'?'KH':'NCC')+'</span>'
          +'</td>'
          +'<td style="padding:8px 12px;text-align:right;color:var(--text3);">'+_fmt(r.so_tien_goc||0)+'</td>'
          +'<td style="padding:8px 12px;text-align:right;font-weight:900;color:'+(r.con_no>0?'#f87171':'#34d399')+';">'
            +_fmt(r.con_no||0)+(r.qua_han?' &#x26A0;':'')+'</td>'
          +'<td style="padding:8px 12px;text-align:center;font-size:11px;color:var(--text3);">'+_esc(r.han_tt||'--')+'</td>'
          +'<td style="padding:8px 12px;text-align:center;">'
            +'<span style="background:'+agClr+'22;color:'+agClr+';border-radius:4px;padding:1px 7px;font-size:10px;font-weight:800;">'+agLbl+'</span>'
          +'</td>'
          +'<td style="padding:8px 12px;text-align:center;">'
            +'<span style="background:'+stClr+'22;color:'+stClr+';border-radius:4px;padding:1px 6px;font-size:9px;font-weight:800;">'+(r.trang_thai==='da_tt'?'Da TT':(r.con_no>0?'Con no':'—'))+'</span>'
          +'</td>'
          +'<td style="padding:8px 12px;" id="cn-act-'+ri+'"></td>'
        +'</tr>';
      }).join('')
      +'</tbody></table></div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:6px;text-align:right;">'+total+' doi tuong</div>';

    document.getElementById('cn-all').addEventListener('change',function(){
      document.querySelectorAll('.cn-cb').forEach(function(c){c.checked=this.checked;},this);
    });

    rows.forEach(function(r,ri){
      var td=document.getElementById('cn-act-'+ri);if(!td)return;
      if(Number(r.con_no||0)>0){
        var thuBtn=document.createElement('button');
        thuBtn.innerHTML='&#x1F4B5; TT+Sapo'; thuBtn.title='Thanh toan & cap nhat Sapo';
        thuBtn.style.cssText='background:rgba(0,214,143,.1);border:1px solid rgba(0,214,143,.2);border-radius:6px;padding:3px 9px;font-size:11px;cursor:pointer;color:var(--green);font-family:inherit;margin-right:3px;';
        thuBtn.addEventListener('click',function(){ _showThanhToanFormWithSapo(r); });
        td.appendChild(thuBtn);
        var ttBtn=document.createElement('button');
        ttBtn.innerHTML='TT'; ttBtn.title='Thanh toan';
        ttBtn.style.cssText='background:rgba(0,214,143,.1);border:1px solid rgba(0,214,143,.2);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;color:var(--green);font-family:inherit;';
        ttBtn.addEventListener('click',function(){ _showThanhToanForm(r); });
        td.appendChild(ttBtn);
      }
    });
    _cnPagination(total,20);
  });
}

function _cnPagination(total,limit){
  var el=document.getElementById('cn-pagination');if(!el)return;
  var pages=Math.ceil(total/limit)||1; if(pages<=1){el.innerHTML='';return;}
  var h='',s=Math.max(1,STATE.cn_page-2),e=Math.min(pages,STATE.cn_page+2);
  if(s>1) h+='<button onclick="_cnPage(1)" style="'+_pgBtn(false)+'">1</button>...';
  for(var p=s;p<=e;p++) h+='<button onclick="_cnPage('+p+')" style="'+_pgBtn(STATE.cn_page===p)+'">'+p+'</button>';
  if(e<pages) h+='...<button onclick="_cnPage('+pages+')" style="'+_pgBtn(false)+'">'+pages+'</button>';
  el.innerHTML=h;
}
window._cnPage=function(p){ STATE.cn_page=p; _loadCongNo(); };

// ── Bulk Payment ──────────────────────────────────────────────────
function _cnBulkPayment(){
  var selected=Array.from(document.querySelectorAll('.cn-cb:checked'));
  if(!selected.length){ _toast('Chon it nhat 1 doi tuong','error'); return; }
  var total=selected.reduce(function(s,c){ return s+Number(c.getAttribute('data-no')||0); },0);
  var names=selected.slice(0,3).map(function(c){ return c.getAttribute('data-ten'); }).join(', ');
  var ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  ov.innerHTML='<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:440px;padding:22px;">'
    +'<div style="font-size:15px;font-weight:900;margin-bottom:14px;">&#x1F4B5; Thanh toan hang loat</div>'
    +'<div style="background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);border-radius:10px;padding:12px;margin-bottom:14px;">'
      +'<div style="font-size:12px;color:var(--text3);">'+selected.length+' doi tuong: '+_esc(names)+(selected.length>3?'...':'')+'</div>'
      +'<div style="font-size:18px;font-weight:900;color:#34d399;margin-top:4px;">Tong: '+_fmt(total)+'d</div>'
    +'</div>'
    +'<label style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:4px;">Ghi chu</label>'
    +'<input id="bulk-note" type="text" value="Thanh toan cong no" style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:8px 10px;font-size:12px;font-family:inherit;box-sizing:border-box;margin-bottom:14px;">'
    +'<div style="display:flex;gap:8px;">'
      +'<button id="bulk-save" style="flex:1;background:var(--accent);border:none;color:#fff;border-radius:9px;padding:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Xac nhan thanh toan</button>'
      +'<button onclick="this.closest(\'[style*=fixed]\').remove()" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:9px;padding:10px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Huy</button>'
    +'</div>'
  +'</div>';
  ov.querySelector('#bulk-save').addEventListener('click',function(){
    var btn=ov.querySelector('#bulk-save');
    var note=(ov.querySelector('#bulk-note')||{}).value||'Thanh toan hang loat';
    btn.disabled=true; btn.textContent='Dang xu ly...';
    var apiF=_api();if(!apiF)return;
    var done=0; var ok=0;
    selected.forEach(function(c){
      var ma=c.getAttribute('data-ma'); var no=Number(c.getAttribute('data-no')||0);
      if(!no){ done++; if(done===selected.length){ ov.remove(); _toast('Da TT '+ok+' doi tuong','ok'); _loadCongNo(); } return; }
      apiF('fin_thanh_toan_cong_no',{ma:ma,so_tien:no,dien_giai:note},function(e,d2){
        if(!e&&d2&&d2.ok) ok++;
        done++;
        if(done===selected.length){ ov.remove(); _toast('Da TT '+ok+'/'+selected.length,'ok'); _loadCongNo(); _loadAgingDashboard(); }
      });
    });
  });
  document.body.appendChild(ov);
}

// ── Nhắc nợ Telegram ─────────────────────────────────────────────
function _cnSendReminder(){
  if(!confirm('Gui nhac no qua Telegram cho cac cong no qua han?')) return;
  var apiF=_api();if(!apiF)return;
  var btn=document.getElementById('cn-remind-btn');
  if(btn){btn.disabled=true;btn.textContent='Dang gui...';}
  apiF('fin_send_debt_reminder',{},function(e,d){
    if(btn){btn.disabled=false;btn.innerHTML='&#x1F4F2; Nhac no TG';}
    if(!e&&d&&d.ok) _toast(d.msg||'Da gui nhac no','ok');
    else _toast((d&&d.error)||'Loi','error');
  });
}

window.loadTaiChinh = loadTaiChinh;
window.loadKeToan   = loadTaiChinh;
window.loadKeToán   = loadTaiChinh;



// ── Form: Thêm công nợ mới ────────────────────────────────────────
function _showCongNoForm(cn) {
  cn = cn || {};
  var ov=document.createElement('div');
  ov.id='sk-fin-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  var box=document.createElement('div');
  box.style.cssText='background:var(--bg2);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;';
  box.innerHTML='<div style="padding:16px 20px;border-bottom:1px solid var(--border);font-size:14px;font-weight:900;">'+(cn.ma?'Sua':'Them')+' Cong no</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px;">'
    +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">Loai *</label>'
    +'<select id="cnf-loai" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
      +'<option value="kh"'+(cn.loai==='kh'?' selected':'')+'>Khach hang</option>'
      +'<option value="ncc"'+(cn.loai==='ncc'?' selected':'')+'>Nha cung cap</option>'
    +'</select></div>'
    +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">Ten doi tuong *</label>'
    +'<input id="cnf-ten" type="text" value="'+_esc(cn.ten_doi_tuong||'')+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box;"></div>'
    +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">So tien goc (VND) *</label>'
    +'<input id="cnf-tien" type="number" value="'+(cn.so_tien_goc||'')+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box;"></div>'
    +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">Han TT</label>'
    +'<input id="cnf-han" type="date" value="'+_esc(cn.han_tt||'')+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box;"></div>'
    +'<div style="grid-column:span 2;"><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">Ghi chu</label>'
    +'<input id="cnf-ghu" type="text" value="'+_esc(cn.ghi_chu||'')+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box;"></div>'
    +'</div>'
    +'<div style="padding:0 20px 20px;display:flex;gap:8px;">'
    +'<button id="cnf-save" style="flex:1;background:var(--accent);border:none;color:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Luu</button>'
    +'<button id="cnf-cancel" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:10px;padding:10px 20px;cursor:pointer;font-family:inherit;">Huy</button>'
    +'</div>';
  ov.appendChild(box); document.body.appendChild(ov);
  box.querySelector('#cnf-cancel').addEventListener('click',function(){ov.remove();});
  box.querySelector('#cnf-save').addEventListener('click',function(){
    var btn=box.querySelector('#cnf-save');
    var loai=(box.querySelector('#cnf-loai')||{}).value||'';
    var ten=(box.querySelector('#cnf-ten')||{}).value||'';
    var tien=Number((box.querySelector('#cnf-tien')||{}).value||0);
    if(!loai||!ten||!tien){_toast('Nhap du thong tin','error');return;}
    btn.disabled=true; btn.textContent='Dang luu...';
    var apiF=_api();if(!apiF)return;
    apiF('fin_save_cong_no',{ma:cn.ma||'',loai:loai,ten_doi_tuong:ten,
      so_tien_goc:tien,han_tt:(box.querySelector('#cnf-han')||{}).value||'',
      ghi_chu:(box.querySelector('#cnf-ghu')||{}).value||''},
    function(e,d){
      if(!e&&d&&d.ok){ov.remove();_toast('Da luu cong no','ok');_loadCongNo();_loadAgingDashboard();}
      else{btn.disabled=false;btn.textContent='Luu';_toast((d&&d.error)||'Loi','error');}
    });
  });
}

function _showThanhToanForm(cn) {
  cn = cn || {};
  var ov=document.createElement('div'); ov.id='sk-fin-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  var box=document.createElement('div');
  box.style.cssText='background:var(--bg2);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:420px;';
  box.innerHTML='<div style="padding:16px 20px;border-bottom:1px solid var(--border);font-size:14px;font-weight:900;">Thanh toan cong no</div>'
    +'<div style="padding:20px;">'
    +'<div style="background:var(--bg3);border-radius:10px;padding:12px;margin-bottom:14px;font-size:12px;">'
      +'<div style="font-weight:800;">'+_esc(cn.ten_doi_tuong||'')+'</div>'
      +'<div style="color:var(--text3);margin-top:3px;">Con no: <strong style="color:#f87171;">'+_fmt(cn.con_no||0)+'d</strong></div>'
    +'</div>'
    +'<label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">So tien *</label>'
    +'<input id="tt-tien" type="number" value="'+(cn.con_no||'')+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:9px 11px;color:var(--text);font-family:inherit;font-size:13px;box-sizing:border-box;margin-bottom:12px;">'
    +'<label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">Dien giai</label>'
    +'<input id="tt-note" type="text" value="Thanh toan '+_esc(cn.ten_doi_tuong||'')+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box;margin-bottom:14px;">'
    +'<div style="display:flex;gap:8px;">'
    +'<button id="tt-save" style="flex:1;background:var(--accent);border:none;color:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Xac nhan</button>'
    +'<button id="tt-cancel" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:10px;padding:10px 18px;cursor:pointer;font-family:inherit;">Huy</button>'
    +'</div></div>';
  ov.appendChild(box); document.body.appendChild(ov);
  box.querySelector('#tt-cancel').addEventListener('click',function(){ov.remove();});
  box.querySelector('#tt-save').addEventListener('click',function(){
    var btn=box.querySelector('#tt-save');
    var tien=Number((box.querySelector('#tt-tien')||{}).value||0);
    if(!tien){_toast('Nhap so tien','error');return;}
    btn.disabled=true; btn.textContent='Dang xu ly...';
    var apiF=_api();if(!apiF)return;
    apiF('fin_thanh_toan_cong_no',{ma:cn.ma,so_tien:tien,dien_giai:(box.querySelector('#tt-note')||{}).value||''},function(e,d){
      if(!e&&d&&d.ok){ov.remove();_toast('Da thanh toan','ok');_loadCongNo();_loadAgingDashboard();}
      else{btn.disabled=false;btn.textContent='Xac nhan';_toast((d&&d.error)||'Loi','error');}
    });
  });
}

function _showThanhToanFormWithSapo(cn) {
  cn = cn || {};
  var ov=document.createElement('div'); ov.id='sk-fin-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  var box=document.createElement('div');
  box.style.cssText='background:var(--bg2);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:420px;';
  box.innerHTML='<div style="padding:16px 20px;border-bottom:1px solid var(--border);font-size:14px;font-weight:900;">&#x1F4B5; TT + Cap nhat Sapo</div>'
    +'<div style="padding:20px;">'
    +'<div style="background:rgba(0,182,255,.06);border:1px solid rgba(0,182,255,.15);border-radius:9px;padding:9px 13px;margin-bottom:12px;font-size:11px;color:var(--cyan);">Thanh toan se cap nhat Sapo</div>'
    +'<div style="background:var(--bg3);border-radius:10px;padding:12px;margin-bottom:14px;font-size:12px;">'
      +'<div style="font-weight:800;">'+_esc(cn.ten_doi_tuong||'')+'</div>'
      +'<div style="color:var(--text3);margin-top:3px;">Con no: <strong style="color:#f87171;">'+_fmt(cn.con_no||0)+'d</strong></div>'
    +'</div>'
    +'<label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:5px;">So tien *</label>'
    +'<input id="tts-tien" type="number" value="'+(cn.con_no||'')+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:9px 11px;color:var(--text);font-family:inherit;font-size:13px;box-sizing:border-box;margin-bottom:14px;">'
    +'<div style="display:flex;gap:8px;">'
    +'<button id="tts-save" style="flex:1;background:rgba(0,182,255,.15);border:1px solid rgba(0,182,255,.3);color:var(--cyan);border-radius:10px;padding:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">TT + Sync</button>'
    +'<button id="tts-cancel" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:10px;padding:10px 18px;cursor:pointer;font-family:inherit;">Huy</button>'
    +'</div></div>';
  ov.appendChild(box); document.body.appendChild(ov);
  box.querySelector('#tts-cancel').addEventListener('click',function(){ov.remove();});
  box.querySelector('#tts-save').addEventListener('click',function(){
    var btn=box.querySelector('#tts-save');
    var tien=Number((box.querySelector('#tts-tien')||{}).value||0);
    if(!tien){_toast('Nhap so tien','error');return;}
    btn.disabled=true; btn.textContent='Dang xu ly...';
    var apiF=_api();if(!apiF)return;
    apiF('fin_thanh_toan_cong_no',{ma:cn.ma,so_tien:tien},function(e,d){
      if(e||!d||!d.ok){btn.disabled=false;btn.textContent='TT + Sync';_toast((d&&d.error)||'Loi','error');return;}
      if(cn.ma_don){
        apiF('fin_mark_paid_in_sapo',{ma_don:cn.ma_don,so_tien:tien},function(){
          ov.remove();_toast('Da TT + cap nhat Sapo','ok');_loadCongNo();
        });
      } else { ov.remove();_toast('Da thanh toan','ok');_loadCongNo();_loadAgingDashboard(); }
    });
  });
}

window.loadCongNo  = loadCongNo;
window.loadCongNoTC= loadCongNo;
window._cnPage     = function(p){ CN.page=p; _loadCongNo(); };

}());
