/* ================================================================
// [v5.33] 22/03/2026 — So quy v2: KPI+Chart+Preview | Cong no v2: Aging+Bulk+Telegram
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
// ════════════════════════════════════════════════════════════════
// [v5.33] MAIN UPGRADE — Sổ quỹ v2 + Công nợ v2
// ════════════════════════════════════════════════════════════════

var STATE = { tab:'dashboard', sq_page:1, cn_page:1,
              sq_q:'', sq_loai:'', sq_from:'', sq_to:'', sq_sort:'ngay',
              cn_loai:'', cn_status:'', cn_sort:'con_no' };

// ── Main ─────────────────────────────────────────────────────────
function loadTaiChinh(){
  var ct=_ct();if(!ct)return;
  ct.innerHTML='<div class="fade-in" style="padding:24px;">'
    +'<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:18px;">'
      +'<div>'
        +'<h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F4B0; Tai chinh</h1>'
        +'<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">So quy · Cong no KH/NCC · But toan · Bao cao</p>'
        +'<div id="fin-sapo-status" style="font-size:11px;color:var(--text3);margin-top:3px;"></div>'
      +'</div>'
      +'<div style="display:flex;gap:7px;flex-wrap:wrap;">'
        +'<button id="fin-phieu-btn" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:9px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2795; Phieu thu/chi</button>'
        +'<button id="fin-cn-btn" style="background:rgba(79,111,255,.12);border:1px solid rgba(79,111,255,.25);color:var(--accent2);border-radius:9px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2795; Cong no</button>'
      +'</div>'
    +'</div>'
    +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;background:var(--bg2);border-radius:12px;padding:5px;" id="fin-tabs">'
      +[['dashboard','&#x1F4CA; Tong quan'],
        ['so_quy',   '&#x1F4B5; So quy'],
        ['cong_no',  '&#x1F4CB; Cong no'],
        ['but_toan', '&#x1F4D3; But toan'],
        ['so_cai',   '&#x1F4F0; So cai'],
      ].map(function(t,i){
        return '<button data-ft="'+t[0]+'" style="flex:1;min-width:70px;border-radius:9px;padding:8px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;border:none;transition:all .12s;'
          +(i===0?'background:var(--accent2);color:#fff;':'background:none;color:var(--text3);')+'">'+t[1]+'</button>';
      }).join('')
    +'</div>'
    +'<div id="fin-body"></div>'
  +'</div>';

  ct.querySelectorAll('[data-ft]').forEach(function(btn){
    btn.addEventListener('click',function(){
      ct.querySelectorAll('[data-ft]').forEach(function(b){ b.style.background='none'; b.style.color='var(--text3)'; });
      btn.style.background='var(--accent2)'; btn.style.color='#fff';
      STATE.tab=btn.getAttribute('data-ft');
      _renderTab(STATE.tab);
    });
  });
  document.getElementById('fin-phieu-btn').addEventListener('click', _showPhieuForm);
  document.getElementById('fin-cn-btn').addEventListener('click',    function(){ _showCongNoForm(null); });
  _loadSapoSyncStatus();
  _renderTab('dashboard');
}

function _renderTab(t){
  if      (t==='dashboard') _renderDash();
  else if (t==='so_quy')    _renderSoQuy();
  else if (t==='cong_no')   _renderCongNo();
  else if (t==='but_toan')  _renderButToan();
  else if (t==='so_cai')    _renderSoCai();
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function _renderDash(){
  var el=document.getElementById('fin-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('fin_get_report',{},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);padding:16px;">Loi</p>';return;}
    var kpis=[
      {icon:'&#x1F4B5;',label:'So du quy',  v:d.so_du_quy||0,  clr:'#34d399',fmt:true},
      {icon:'&#x1F4C8;',label:'Doanh thu',  v:d.doanh_thu||0,  clr:'#4f6fff', fmt:true},
      {icon:'&#x1F4C9;',label:'Chi phi',    v:d.chi_phi||0,    clr:'#f87171', fmt:true},
      {icon:'&#x1F4B0;',label:'Loi nhuan',  v:d.loi_nhuan||0,  clr:'#fbbf24', fmt:true},
      {icon:'&#x1F465;',label:'No KH',      v:d.no_kh||0,      clr:'#f87171', fmt:true},
      {icon:'&#x1F3ED;',label:'No NCC',     v:d.no_ncc||0,     clr:'#f59e0b', fmt:true},
    ];
    el.innerHTML='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">'
      +kpis.map(function(k){
        return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
          +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">'
            +'<span style="font-size:18px;">'+k.icon+'</span>'
            +'<span style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;">'+k.lbl+'</span>'
          +'</div>'
          +'<div style="font-size:20px;font-weight:900;color:'+k.clr+';font-family:monospace;">'+_fmt(k.v)+'d</div>'
        +'</div>';
      }).join('')
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;">Thu chi nhanh</div>'
        +'<button onclick="_finGoTab(\'so_quy\')" style="display:block;width:100%;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.2);color:#34d399;border-radius:9px;padding:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px;">&#x1F4B5; Xem so quy</button>'
        +'<button onclick="_finGoTab(\'cong_no\')" style="display:block;width:100%;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.2);color:#f87171;border-radius:9px;padding:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4CB; Xem cong no</button>'
      +'</div>'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;">Tong hop</div>'
        +'<div style="font-size:12px;display:flex;flex-direction:column;gap:7px;">'
          +'<div style="display:flex;justify-content:space-between;"><span style="color:var(--text3);">Tong no (KH+NCC)</span><span style="color:var(--red);font-weight:700;">'+_fmt(d.tong_no||0)+'d</span></div>'
          +'<div style="height:1px;background:var(--border);"></div>'
          +'<div style="display:flex;justify-content:space-between;"><span style="color:var(--text3);">Loi nhuan thuan</span><span style="color:'+(d.loi_nhuan>=0?'var(--green)':'var(--red)')+';font-weight:700;">'+_fmt(d.loi_nhuan||0)+'d</span></div>'
        +'</div>'
      +'</div>'
    +'</div>';
  });
}
window._finGoTab = function(t){
  var ct=_ct();if(!ct)return;
  ct.querySelectorAll('[data-ft]').forEach(function(b){ b.style.background='none'; b.style.color='var(--text3)'; });
  var btn=ct.querySelector('[data-ft="'+t+'"]');
  if(btn){ btn.style.background='var(--accent2)'; btn.style.color='#fff'; }
  STATE.tab=t; _renderTab(t);
};

// ── SỔ QUỸ v2 ────────────────────────────────────────────────────
function _renderSoQuy(){
  var el=document.getElementById('fin-body');if(!el)return;
  STATE.sq_page=1;

  el.innerHTML=
    // KPI strip (sẽ fill bởi _loadSoQuy)
    '<div id="sq-kpi" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;"></div>'
    // Chart row
    +'<div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:14px;">'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:8px;">Thu / Chi theo ngay</div>'
        +'<canvas id="sq-chart" height="130"></canvas>'
      +'</div>'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:10px;">Phan tich ky</div>'
        +'<div id="sq-breakdown"></div>'
      +'</div>'
    +'</div>'
    // Filter bar
    +'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">'
      +'<input id="sq-q" type="text" placeholder="Ma phieu, dien giai, doi tuong..." '
        +'style="flex:1;min-width:150px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 11px;color:var(--text);font-family:inherit;font-size:12px;">'
      +'<select id="sq-loai" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 9px;color:var(--text3);font-family:inherit;font-size:11px;">'
        +'<option value="">Tat ca</option>'
        +'<option value="thu">Thu</option>'
        +'<option value="chi">Chi</option>'
      +'</select>'
      +'<input id="sq-from" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-family:inherit;font-size:11px;">'
      +'<input id="sq-to" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-family:inherit;font-size:11px;">'
      +'<button id="sq-search" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
    +'</div>'
    +'<div id="sq-list"></div>'
    +'<div id="sq-pagination" style="display:flex;gap:6px;justify-content:center;margin-top:12px;flex-wrap:wrap;"></div>';

  var doSearch=function(){
    STATE.sq_q=(document.getElementById('sq-q')||{}).value||'';
    STATE.sq_loai=(document.getElementById('sq-loai')||{}).value||'';
    STATE.sq_from=(document.getElementById('sq-from')||{}).value||'';
    STATE.sq_to=(document.getElementById('sq-to')||{}).value||'';
    STATE.sq_page=1; _loadSoQuy();
  };
  document.getElementById('sq-search').addEventListener('click',doSearch);
  document.getElementById('sq-q').addEventListener('keydown',function(e){if(e.key==='Enter')doSearch();});
  _loadSoQuy();
}

function _loadSoQuy(){
  var el=document.getElementById('sq-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('fin_get_so_quy',{
    loai:STATE.sq_loai, q:STATE.sq_q,
    from_date:STATE.sq_from, to_date:STATE.sq_to,
    page:STATE.sq_page, limit:20,
  },function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<div style="color:var(--red);padding:16px;">Loi tai so quy</div>';return;}
    var rows=d.data||[];
    var total=d.total||0;

    // KPI cards
    var kpiEl=document.getElementById('sq-kpi');
    if(kpiEl){
      var soDuDau = d.so_du_dau||0;
      var soDuCuoi= soDuDau + (d.tong_thu||0) - (d.tong_chi||0);
      kpiEl.innerHTML=[
        {lbl:'So du dau ky', v:soDuDau,      clr:'#818cf8'},
        {lbl:'Tong thu',     v:d.tong_thu||0, clr:'#34d399'},
        {lbl:'Tong chi',     v:d.tong_chi||0, clr:'#f87171'},
      ].map(function(k){
        return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px;">'
          +'<div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:5px;">'+k.lbl+'</div>'
          +'<div style="font-size:20px;font-weight:900;color:'+k.clr+';font-family:monospace;">'+_fmt(k.v)+'d</div>'
        +'</div>';
      }).join('')
      +'<div style="background:var(--bg2);border:1px solid rgba(52,211,153,.3);border-radius:12px;padding:13px;grid-column:span '+(true?1:1)+';">'
        +'<div style="font-size:10px;font-weight:800;color:#34d399;text-transform:uppercase;margin-bottom:5px;">So du cuoi ky</div>'
        +'<div style="font-size:22px;font-weight:900;color:'+(soDuCuoi>=0?'#34d399':'#f87171')+';font-family:monospace;">'+_fmt(soDuCuoi)+'d</div>'
      +'</div>';
      // Realign grid to 4 cols
      kpiEl.style.gridTemplateColumns='repeat(4,1fr)';
    }

    // Chart
    var chartEl=document.getElementById('sq-chart');
    if(chartEl && d.by_day && d.by_day.length){
      var days=d.by_day.slice(-14);
      var W=chartEl.parentElement.clientWidth-28||260; var H=130;
      chartEl.width=W; chartEl.height=H;
      var ctx=chartEl.getContext('2d');
      ctx.fillStyle='#0d1020'; ctx.fillRect(0,0,W,H);
      var maxV=Math.max.apply(null,days.map(function(d2){return Math.max(d2.thu||0,d2.chi||0);}))||1;
      var bw=Math.max(4, Math.floor((W-30)/days.length/2)-2);
      days.forEach(function(d2,di){
        var x=30+di*(bw*2+4);
        // Thu bar
        var hThu=Math.round(((d2.thu||0)/maxV)*(H-30));
        var gThu=ctx.createLinearGradient(x,H-30-hThu,x,H-30);
        gThu.addColorStop(0,'#34d399'); gThu.addColorStop(1,'rgba(52,211,153,.3)');
        ctx.fillStyle=gThu;
        ctx.beginPath(); ctx.roundRect(x,H-30-hThu,bw,hThu,3); ctx.fill();
        // Chi bar
        var hChi=Math.round(((d2.chi||0)/maxV)*(H-30));
        var gChi=ctx.createLinearGradient(x+bw+2,H-30-hChi,x+bw+2,H-30);
        gChi.addColorStop(0,'#f87171'); gChi.addColorStop(1,'rgba(248,113,113,.3)');
        ctx.fillStyle=gChi;
        ctx.beginPath(); ctx.roundRect(x+bw+2,H-30-hChi,bw,hChi,3); ctx.fill();
        // Date label
        if(di%3===0){
          ctx.fillStyle='#475569'; ctx.font='9px monospace'; ctx.textAlign='center';
          var parts=(d2.ngay||'').split('-');
          ctx.fillText((parts[2]||'')+'/'+(parts[1]||''),x+bw,H-4);
        }
      });
      // Legend
      ctx.fillStyle='#34d399'; ctx.fillRect(5,8,8,8);
      ctx.fillStyle='#94a3b8'; ctx.font='9px monospace'; ctx.textAlign='left';
      ctx.fillText('Thu',16,16);
      ctx.fillStyle='#f87171'; ctx.fillRect(45,8,8,8);
      ctx.fillStyle='#94a3b8'; ctx.fillText('Chi',56,16);
    }

    // Breakdown panel
    var bkEl=document.getElementById('sq-breakdown');
    if(bkEl){
      var thuPct=d.tong_thu&&(d.tong_thu+d.tong_chi)>0?Math.round(d.tong_thu/(d.tong_thu+d.tong_chi)*100):0;
      bkEl.innerHTML='<div style="margin-bottom:8px;">'
        +'<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;">'
          +'<span style="color:#34d399;">Thu</span><span style="color:#34d399;font-weight:700;">'+thuPct+'%</span>'
        +'</div>'
        +'<div style="height:6px;background:var(--bg3);border-radius:99px;overflow:hidden;">'
          +'<div style="height:100%;width:'+thuPct+'%;background:#34d399;border-radius:99px;"></div>'
        +'</div>'
      +'</div>'
      +'<div>'
        +'<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;">'
          +'<span style="color:#f87171;">Chi</span><span style="color:#f87171;font-weight:700;">'+(100-thuPct)+'%</span>'
        +'</div>'
        +'<div style="height:6px;background:var(--bg3);border-radius:99px;overflow:hidden;">'
          +'<div style="height:100%;width:'+(100-thuPct)+'%;background:#f87171;border-radius:99px;"></div>'
        +'</div>'
      +'</div>'
      +'<hr style="margin:10px 0;border-color:var(--border);">'
      +'<div style="font-size:11px;color:var(--text3);">Tong phieu: <strong style="color:var(--text);">'+total+'</strong></div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:4px;">Net: <strong style="color:'
        +((d.tong_thu||0)>=(d.tong_chi||0)?'#34d399':'#f87171')+';">'
        +_fmt((d.tong_thu||0)-(d.tong_chi||0))+'d</strong></div>';
    }

    // Table
    if(!rows.length){
      el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Khong co phieu nao.</div>';
      _sqPagination(0,20); return;
    }
    var runDu = d.so_du_dau||0;
    el.innerHTML='<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:560px;">'
      +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:7px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma phieu</th>'
        +'<th style="padding:7px 12px;text-align:center;">Loai</th>'
        +'<th style="padding:7px 12px;text-align:center;">Ngay</th>'
        +'<th style="padding:7px 12px;text-align:right;">So tien</th>'
        +'<th style="padding:7px 12px;text-align:right;">So du</th>'
        +'<th style="padding:7px 12px;text-align:left;">Dien giai</th>'
        +'<th style="padding:7px 12px;text-align:left;">Doi tuong</th>'
        +'<th style="padding:7px 12px;"></th>'
      +'</tr></thead><tbody>'
      +rows.map(function(r){
        runDu += r.loai==='thu' ? Number(r.so_tien||0) : -Number(r.so_tien||0);
        var isThu = r.loai==='thu';
        var amtClr = isThu ? '#34d399' : '#f87171';
        var prefix = isThu ? '+' : '-';
        return '<tr style="border-top:1px solid var(--border);">'
          +'<td style="padding:7px 12px;font-weight:700;color:var(--accent2);font-family:monospace;font-size:11px;">'+_esc(r.ma_phieu||'')+'</td>'
          +'<td style="padding:7px 12px;text-align:center;">'
            +'<span style="background:'+(isThu?'rgba(52,211,153,.12)':'rgba(248,113,113,.12)')+';color:'+amtClr+';border-radius:4px;padding:1px 7px;font-size:10px;font-weight:800;">'
            +(isThu?'THU':'CHI')+'</span>'
          +'</td>'
          +'<td style="padding:7px 12px;text-align:center;font-size:11px;color:var(--text3);">'+_esc(r.ngay||'')+'</td>'
          +'<td style="padding:7px 12px;text-align:right;font-weight:800;color:'+amtClr+';">'+prefix+_fmt(r.so_tien||0)+'</td>'
          +'<td style="padding:7px 12px;text-align:right;font-size:11px;color:'+(runDu>=0?'var(--green)':'var(--red)')+';">'+_fmt(runDu)+'</td>'
          +'<td style="padding:7px 12px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(r.dien_giai||'')+'</td>'
          +'<td style="padding:7px 12px;font-size:11px;color:var(--text3);">'+_esc(r.doi_tuong||'')+'</td>'
          +'<td style="padding:7px 12px;text-align:center;"><button onclick="window._sqPreview(\''+_esc(r.ma_phieu||'')+'\',\''+_esc(r.loai||'')+'\','+Number(r.so_tien||0)+',\''+_esc(r.dien_giai||'')+'\',\''+_esc(r.ngay||'')+'\')" title="Xem phieu" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;">&#x1F4C4;</button></td>'
        +'</tr>';
      }).join('')
      +'</tbody></table></div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:6px;text-align:right;">'+total+' phieu</div>';
    _sqPagination(total,20);
  });
}

function _sqPagination(total,limit){
  var el=document.getElementById('sq-pagination');if(!el)return;
  var pages=Math.ceil(total/limit)||1; if(pages<=1){el.innerHTML='';return;}
  var h='',s=Math.max(1,STATE.sq_page-2),e=Math.min(pages,STATE.sq_page+2);
  if(s>1) h+='<button onclick="_sqPage(1)" style="'+_pgBtn(false)+'">1</button><span style="color:var(--text3);padding:0 4px;">...</span>';
  for(var p=s;p<=e;p++) h+='<button onclick="_sqPage('+p+')" style="'+_pgBtn(STATE.sq_page===p)+'">'+p+'</button>';
  if(e<pages) h+='<span style="color:var(--text3);padding:0 4px;">...</span><button onclick="_sqPage('+pages+')" style="'+_pgBtn(false)+'">'+pages+'</button>';
  el.innerHTML=h;
}
function _pgBtn(a){ return 'background:'+(a?'var(--accent2)':'var(--bg3)')+';border:1px solid var(--border2);color:'+(a?'#fff':'var(--text2)')+';border-radius:7px;padding:5px 11px;font-size:12px;font-weight:700;cursor:pointer;'; }
window._sqPage=function(p){ STATE.sq_page=p; _loadSoQuy(); };

// Preview phiếu
window._sqPreview=function(ma,loai,sotien,dien_giai,ngay){
  var isThu=(loai==='thu');
  var h='<div style="padding:20px 24px;">'
    +'<div style="border:2px solid '+(isThu?'rgba(52,211,153,.4)':'rgba(248,113,113,.4)')+';border-radius:12px;padding:20px;">'
      +'<div style="text-align:center;margin-bottom:16px;">'
        +'<div style="font-size:22px;font-weight:900;color:'+(isThu?'#34d399':'#f87171')+';">'+(isThu?'PHIEU THU':'PHIEU CHI')+'</div>'
        +'<div style="font-size:12px;color:var(--text3);">CONG TY TNHH THUC PHAM SON KHANG</div>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">'
        +'<div><span style="color:var(--text3);">Ma phieu: </span><strong>'+_esc(ma)+'</strong></div>'
        +'<div><span style="color:var(--text3);">Ngay: </span><strong>'+_esc(ngay)+'</strong></div>'
        +'<div style="grid-column:span 2;"><span style="color:var(--text3);">Dien giai: </span><strong>'+_esc(dien_giai)+'</strong></div>'
        +'<div style="grid-column:span 2;margin-top:8px;border-top:1px solid var(--border);padding-top:8px;">'
          +'<span style="font-size:11px;color:var(--text3);">So tien: </span>'
          +'<span style="font-size:20px;font-weight:900;color:'+(isThu?'#34d399':'#f87171')+';">'+_fmt(sotien)+'</span> dong'
        +'</div>'
      +'</div>'
    +'</div>'
    +'<div style="display:flex;gap:8px;margin-top:14px;justify-content:center;">'
      +'<button onclick="window.print()" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:8px;padding:8px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F5A8; In phieu</button>'
      +'<button onclick="document.getElementById(\'sk-fin-modal\').remove()" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:8px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Dong</button>'
    +'</div>'
  +'</div>';
  _modal(h,'440px');
};

// ── CÔNG NỢ v2 ────────────────────────────────────────────────────
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

}());
