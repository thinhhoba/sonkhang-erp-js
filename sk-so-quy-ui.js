// [v5.34] 22/03/2026 — sk-so-quy-ui.js
// Module SỔ QUỸ — Phân tách từ sk-finance-ui.js
// Phiếu thu/chi, KPI, Biểu đồ, Pagination, Preview
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

var SQ = { page:1, q:'', loai:'', from:'', to:'' };

function loadSoQuy(){
  var ct=_ct();if(!ct)return;
  ct.innerHTML='<div class="fade-in" style="padding:24px;">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:18px;">'
      +'<div>'
        +'<h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F4B5; So quy</h1>'
        +'<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Phieu thu · Phieu chi · So du · Bieu do</p>'
      +'</div>'
      +'<button id="sq-new-phieu" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:9px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2795; Phieu thu/chi</button>'
    +'</div>'
    +'<div id="sq-kpi" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;"></div>'
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
    +'<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">'
      +'<input id="sq-q" type="text" placeholder="Ma phieu, dien giai, doi tuong..." style="flex:1;min-width:150px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 11px;color:var(--text);font-family:inherit;font-size:12px;">'
      +'<select id="sq-loai" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 9px;color:var(--text3);font-family:inherit;font-size:11px;">'
        +'<option value="">Tat ca</option><option value="thu">Thu</option><option value="chi">Chi</option>'
      +'</select>'
      +'<input id="sq-from" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-family:inherit;font-size:11px;">'
      +'<input id="sq-to" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-family:inherit;font-size:11px;">'
      +'<button id="sq-search" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
    +'</div>'
    +'<div id="sq-list"></div>'
    +'<div id="sq-pagination" style="display:flex;gap:6px;justify-content:center;margin-top:12px;flex-wrap:wrap;"></div>';

  document.getElementById('sq-new-phieu').addEventListener('click', _showPhieuForm);
  var doSearch=function(){
    SQ.q=(document.getElementById('sq-q')||{}).value||'';
    SQ.loai=(document.getElementById('sq-loai')||{}).value||'';
    SQ.from=(document.getElementById('sq-from')||{}).value||'';
    SQ.to=(document.getElementById('sq-to')||{}).value||'';
    SQ.page=1; _loadSoQuy();
  };
  document.getElementById('sq-search').addEventListener('click',doSearch);
  document.getElementById('sq-q').addEventListener('keydown',function(e){if(e.key==='Enter')doSearch();});
  _loadSoQuy();
}

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

window.loadSoQuy    = loadSoQuy;
window.loadSoQuyTC  = loadSoQuy;

}());
