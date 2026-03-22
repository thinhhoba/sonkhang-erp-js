// [v5.34] 22/03/2026 — sk-bao-cao-tc-ui.js
// Module BÁO CÁO TÀI CHÍNH — P&L, Cash Flow, KPI Dashboard
// Module mới hoàn toàn
(function(){
'use strict';
var _api  = function(){ return typeof window.api==='function'?window.api:null; };
var _ct   = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
var _esc  = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
var _fmt  = function(n){ n=Number(n||0); if(n>=1e9)return(n/1e9).toFixed(1)+'ty'; if(n>=1e6)return(n/1e6).toFixed(1)+'tr'; if(n>=1e3)return Math.round(n/1e3)+'k'; return String(Math.round(n)); };
var _fmtN = function(n){ return Number(n||0).toLocaleString('vi-VN'); };
var _pct  = function(n){ return (n>=0?'+':'')+n+'%'; };

var BC = { tab:'pl' };

function loadBaoCaoTC(){
  var ct=_ct();if(!ct)return;
  BC.tab='pl';
  ct.innerHTML='<div class="fade-in" style="padding:24px;">'
    +'<div style="margin-bottom:18px;">'
      +'<h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F4CA; Bao cao Tai chinh</h1>'
      +'<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">P&L · Luu chuyen tien te · KPI Dashboard</p>'
    +'</div>'
    +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;background:var(--bg2);border-radius:12px;padding:5px;" id="bc-tabs">'
      +[['pl','&#x1F4B9; P&L'],['cashflow','&#x1F4B8; Cash Flow'],['dashboard','&#x1F4CA; KPI Dashboard']].map(function(t,i){
        return '<button data-bc="'+t[0]+'" style="flex:1;min-width:90px;border-radius:9px;padding:8px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;border:none;'
          +(i===0?'background:var(--accent2);color:#fff;':'background:none;color:var(--text3);')+'">'+t[1]+'</button>';
      }).join('')
    +'</div>'
    +'<div id="bc-body"></div>'
  +'</div>';

  ct.querySelectorAll('[data-bc]').forEach(function(btn){
    btn.addEventListener('click',function(){
      ct.querySelectorAll('[data-bc]').forEach(function(b){ b.style.background='none'; b.style.color='var(--text3)'; });
      btn.style.background='var(--accent2)'; btn.style.color='#fff';
      BC.tab=btn.getAttribute('data-bc'); _bcRender(BC.tab);
    });
  });
  _bcRender('pl');
}

function _bcRender(t){
  if      (t==='pl')        _bcPL();
  else if (t==='cashflow')  _bcCashFlow();
  else if (t==='dashboard') _bcDashboard();
}

// ── Báo cáo P&L ───────────────────────────────────────────────────
function _bcPL(){
  var el=document.getElementById('bc-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tinh toan...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('fin_get_bao_cao_tc',{},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi</p>';return;}
    var cur=d.cur||{}, prev=d.prev||{};
    var months=d.months6||[];

    // Chart 6 tháng
    var chartHtml='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:16px;">'
      +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:10px;">Doanh thu · Chi phi · Loi nhuan (6 thang)</div>'
      +'<canvas id="pl-chart" height="160"></canvas>'
    +'</div>';

    // P&L table
    var rows=[
      {lbl:'DOANH THU',        v:cur.thu||0,             prev:prev.thu||0,    bold:true,  clr:'#34d399'},
      {lbl:'  - Thu tien',     v:cur.thu||0,             prev:prev.thu||0,    sub:true},
      {lbl:'CHI PHI',          v:cur.chi||0,             prev:prev.chi||0,    bold:true,  clr:'#f87171'},
      {lbl:'  - Chi tien',     v:cur.chi||0,             prev:prev.chi||0,    sub:true},
      {lbl:'LOI NHUAN THUAN',  v:cur.loi_nhuan||0,       prev:prev.loi_nhuan||0, bold:true, clr:(cur.loi_nhuan>=0?'#34d399':'#f87171'), sep:true},
    ];

    var tbRows=rows.map(function(r){
      var tang=r.prev?Math.round((r.v-r.prev)/(Math.abs(r.prev)||1)*100):0;
      return '<tr style="border-top:1px solid var(--border);'+(r.sep?'border-top:2px solid var(--border2);':'')+'">'
        +'<td style="padding:9px 14px;font-weight:'+(r.bold?800:400)+';color:'+(r.clr||'var(--text2)')+';'+(r.sub?'padding-left:28px;font-size:11px;':'font-size:12px;')+'">'+r.lbl+'</td>'
        +'<td style="padding:9px 14px;text-align:right;font-weight:'+(r.bold?900:500)+';color:'+(r.clr||'var(--text)')+';font-size:'+(r.bold?'15':'12')+'px;font-family:monospace;">'+_fmtN(r.v)+'d</td>'
        +'<td style="padding:9px 14px;text-align:right;color:var(--text3);font-size:11px;">'+_fmtN(r.prev)+'d</td>'
        +'<td style="padding:9px 14px;text-align:center;">'
          +'<span style="background:'+(tang>=0?'rgba(52,211,153,.12)':'rgba(248,113,113,.12)')+';color:'+(tang>=0?'#34d399':'#f87171')+';border-radius:5px;padding:2px 8px;font-size:10px;font-weight:800;">'+_pct(tang)+'</span>'
        +'</td>'
      +'</tr>';
    }).join('');

    el.innerHTML=chartHtml
      +'<div style="display:flex;gap:8px;margin-bottom:12px;">'
        +'<div style="flex:1;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);border-radius:10px;padding:12px;">'
          +'<div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:4px;">Doanh thu thay doi</div>'
          +'<div style="font-size:20px;font-weight:900;color:'+(d.tang_dt>=0?'#34d399':'#f87171')+';">'+_pct(d.tang_dt||0)+'</div>'
          +'<div style="font-size:10px;color:var(--text3);">so thang truoc</div>'
        +'</div>'
        +'<div style="flex:1;background:rgba(79,111,255,.08);border:1px solid rgba(79,111,255,.2);border-radius:10px;padding:12px;">'
          +'<div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:4px;">Loi nhuan thay doi</div>'
          +'<div style="font-size:20px;font-weight:900;color:'+(d.tang_ln>=0?'#4f6fff':'#f87171')+';">'+_pct(d.tang_ln||0)+'</div>'
          +'<div style="font-size:10px;color:var(--text3);">so thang truoc</div>'
        +'</div>'
        +'<div style="flex:1;background:rgba(129,140,248,.08);border:1px solid rgba(129,140,248,.2);border-radius:10px;padding:12px;">'
          +'<div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:4px;">Bien loi nhuan</div>'
          +'<div style="font-size:20px;font-weight:900;color:#818cf8;">'+(cur.thu>0?Math.round(cur.loi_nhuan/cur.thu*100):0)+'%</div>'
          +'<div style="font-size:10px;color:var(--text3);">profit margin</div>'
        +'</div>'
      +'</div>'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;overflow:hidden;">'
        +'<table style="width:100%;border-collapse:collapse;font-size:12px;">'
        +'<thead><tr style="background:var(--bg3);">'
          +'<th style="padding:9px 14px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Khoan muc</th>'
          +'<th style="padding:9px 14px;text-align:right;font-size:10px;font-weight:800;color:var(--text3);">Ky nay</th>'
          +'<th style="padding:9px 14px;text-align:right;font-size:10px;font-weight:800;color:var(--text3);">Ky truoc</th>'
          +'<th style="padding:9px 14px;text-align:center;font-size:10px;font-weight:800;color:var(--text3);">Tang/Giam</th>'
        +'</tr></thead><tbody>'+tbRows+'</tbody></table>'
      +'</div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:8px;">Ky bao cao: '+_esc(d.ky||'Thang hien tai')+'</div>';

    // Draw chart
    setTimeout(function(){
      var canvas=document.getElementById('pl-chart');
      if(!canvas||!months.length) return;
      var W=canvas.parentElement.clientWidth-32||400; var H=160;
      canvas.width=W; canvas.height=H;
      var ctx=canvas.getContext('2d');
      ctx.fillStyle='#0d1020'; ctx.fillRect(0,0,W,H);
      var maxV=Math.max.apply(null,months.map(function(m){return Math.max(m.thu||0,m.chi||0);}))||1;
      var bw=Math.floor((W-40)/months.length/3)-2;
      months.forEach(function(m,i){
        var x=40+i*(bw*3+6);
        // Thu
        var hT=Math.round(((m.thu||0)/maxV)*(H-30));
        var gT=ctx.createLinearGradient(x,H-30-hT,x,H-30);
        gT.addColorStop(0,'#34d399'); gT.addColorStop(1,'rgba(52,211,153,.2)');
        ctx.fillStyle=gT; ctx.beginPath(); ctx.roundRect(x,H-30-hT,bw,hT,3); ctx.fill();
        // Chi
        var hC=Math.round(((m.chi||0)/maxV)*(H-30));
        var gC=ctx.createLinearGradient(x+bw+2,H-30-hC,x+bw+2,H-30);
        gC.addColorStop(0,'#f87171'); gC.addColorStop(1,'rgba(248,113,113,.2)');
        ctx.fillStyle=gC; ctx.beginPath(); ctx.roundRect(x+bw+2,H-30-hC,bw,hC,3); ctx.fill();
        // LN
        var ln=(m.thu||0)-(m.chi||0);
        var hL=Math.round((Math.abs(ln)/maxV)*(H-30));
        ctx.fillStyle=ln>=0?'rgba(79,111,255,.6)':'rgba(248,113,113,.4)';
        ctx.beginPath(); ctx.roundRect(x+bw*2+4,H-30-hL,bw,hL,3); ctx.fill();
        // Label
        ctx.fillStyle='#475569'; ctx.font='9px monospace'; ctx.textAlign='center';
        ctx.fillText(String(m.label||''),x+bw*1.5,H-4);
      });
      ctx.fillStyle='#34d399'; ctx.fillRect(5,8,8,8);
      ctx.fillStyle='#94a3b8'; ctx.font='9px monospace'; ctx.textAlign='left'; ctx.fillText('DT',16,16);
      ctx.fillStyle='#f87171'; ctx.fillRect(40,8,8,8); ctx.fillText('CP',51,16);
      ctx.fillStyle='#818cf8'; ctx.fillRect(70,8,8,8); ctx.fillText('LN',81,16);
    },50);
  });
}

// ── Báo cáo Lưu chuyển tiền tệ ───────────────────────────────────
function _bcCashFlow(){
  var el=document.getElementById('bc-body');if(!el)return;
  el.innerHTML='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;">'
    +'<input id="cf-from" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<input id="cf-to" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<button id="cf-view" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Xem</button>'
  +'</div>'
  +'<div id="cf-body"><div style="text-align:center;padding:32px;color:var(--text3);">Chon khoang thoi gian va nhan Xem</div></div>';
  document.getElementById('cf-view').addEventListener('click', _bcLoadCF);
}

function _bcLoadCF(){
  var el=document.getElementById('cf-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tinh toan...</div>';
  var apiF=_api();if(!apiF)return;
  var from=(document.getElementById('cf-from')||{}).value||'';
  var to=(document.getElementById('cf-to')||{}).value||'';
  apiF('fin_get_so_quy',{from_date:from,to_date:to,limit:10000},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi</p>';return;}
    var rows=d.data||[];
    var thu=d.tong_thu||0, chi=d.tong_chi||0;
    var soDuDau=d.so_du_dau||0, soDuCuoi=soDuDau+thu-chi;

    // Group by loai dien giai
    var grouped={};
    rows.forEach(function(r){
      var key=r.dien_giai&&r.dien_giai.length>2?r.dien_giai.substring(0,30):r.loai;
      if(!grouped[key]) grouped[key]={loai:r.loai,ten:key,so_tien:0};
      grouped[key].so_tien+=Number(r.so_tien||0);
    });
    var thuItems=Object.values(grouped).filter(function(g){return g.loai==='thu';}).sort(function(a,b){return b.so_tien-a.so_tien;}).slice(0,5);
    var chiItems=Object.values(grouped).filter(function(g){return g.loai==='chi';}).sort(function(a,b){return b.so_tien-a.so_tien;}).slice(0,5);

    el.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">'
      +[{lbl:'So du dau ky',v:soDuDau,clr:'#818cf8'},{lbl:'Tong thu',v:thu,clr:'#34d399'},{lbl:'Tong chi',v:chi,clr:'#f87171'}].map(function(k){
        return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center;">'
          +'<div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:4px;">'+k.lbl+'</div>'
          +'<div style="font-size:20px;font-weight:900;color:'+k.clr+';font-family:monospace;">'+_fmt(k.v)+'d</div>'
        +'</div>';
      }).join('')
    +'</div>'
    +'<div style="background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);border-radius:12px;padding:14px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;">'
      +'<div><div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:3px;">So du cuoi ky</div>'
        +'<div style="font-size:26px;font-weight:900;color:'+(soDuCuoi>=0?'#34d399':'#f87171')+';font-family:monospace;">'+_fmtN(soDuCuoi)+'d</div></div>'
      +'<div style="text-align:right;font-size:12px;color:var(--text3);">'
        +'<div>Net: <strong style="color:'+(thu-chi>=0?'#34d399':'#f87171')+';">'+_fmt(thu-chi)+'d</strong></div>'
        +'<div>'+rows.length+' phieu</div>'
      +'</div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:#34d399;text-transform:uppercase;margin-bottom:10px;">Top Thu tien</div>'
        +thuItems.map(function(i){return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;"><span style="color:var(--text2);">'+_esc(i.ten)+'</span><span style="color:#34d399;font-weight:700;">+'+_fmt(i.so_tien)+'</span></div>';}).join('')
      +'</div>'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:#f87171;text-transform:uppercase;margin-bottom:10px;">Top Chi tien</div>'
        +chiItems.map(function(i){return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;"><span style="color:var(--text2);">'+_esc(i.ten)+'</span><span style="color:#f87171;font-weight:700;">-'+_fmt(i.so_tien)+'</span></div>';}).join('')
      +'</div>'
    +'</div>';
  });
}

// ── KPI Dashboard ─────────────────────────────────────────────────
function _bcDashboard(){
  var el=document.getElementById('bc-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai KPI...</div>';
  var apiF=_api();if(!apiF)return;
  var loaded=0; var summary={}, cdkt={}, aging={};
  var done=function(){
    if(++loaded<3)return;
    _bcDrawKPI(el,summary,cdkt,aging);
  };
  apiF('fin_get_summary',{},function(e,d){summary=(!e&&d&&d.ok)?d:{};done();});
  apiF('fin_get_cdkt',{},function(e,d){cdkt=(!e&&d&&d.ok)?d:{};done();});
  apiF('fin_get_aging_report',{},function(e,d){aging=(!e&&d&&d.ok)?d:{};done();});
}

function _bcDrawKPI(el,s,c,a){
  var ts=c.tai_san||{}, no=c.no_phai_tra||{};
  var ag=a.aging||{};
  var kpis=[
    {icon:'&#x1F4B5;',lbl:'So du quy',v:s.so_du_quy||0,clr:'#34d399'},
    {icon:'&#x1F4C8;',lbl:'Doanh thu',v:s.doanh_thu||0,clr:'#4f6fff'},
    {icon:'&#x1F4C9;',lbl:'Chi phi',v:s.chi_phi||0,clr:'#f87171'},
    {icon:'&#x1F4B0;',lbl:'Loi nhuan',v:s.loi_nhuan||0,clr:(s.loi_nhuan>=0?'#818cf8':'#f87171')},
    {icon:'&#x1F3E6;',lbl:'Tong tai san',v:ts.tong||0,clr:'#06b6d4'},
    {icon:'&#x1F4CB;',lbl:'No phai tra',v:no.tong||0,clr:'#f59e0b'},
    {icon:'&#x1F465;',lbl:'No KH',v:s.no_kh||0,clr:'#f87171'},
    {icon:'&#x1F3ED;',lbl:'No NCC',v:s.no_ncc||0,clr:'#f97316'},
  ];
  el.innerHTML='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">'
    +kpis.map(function(k){
      return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">'
          +'<span style="font-size:18px;">'+k.icon+'</span>'
          +'<span style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;">'+k.lbl+'</span>'
        +'</div>'
        +'<div style="font-size:18px;font-weight:900;color:'+k.clr+';font-family:monospace;">'+_fmt(k.v)+'d</div>'
      +'</div>';
    }).join('')
  +'</div>'
  +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
    // Aging summary
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;">'
      +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:12px;">Aging Cong no</div>'
      +[{lbl:'Chua den han',v:ag.amt_current||0,clr:'#34d399'},
        {lbl:'0-30 ngay',v:ag.amt_d30||0,clr:'#fbbf24'},
        {lbl:'30-60 ngay',v:ag.amt_d60||0,clr:'#f97316'},
        {lbl:'60-90 ngay',v:ag.amt_d90||0,clr:'#ef4444'},
        {lbl:'Tren 90 ngay',v:ag.amt_over90||0,clr:'#7f1d1d'},
      ].map(function(b){
        return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;">'
          +'<span style="color:'+b.clr+';font-weight:700;">'+b.lbl+'</span>'
          +'<span style="font-weight:800;color:var(--text);">'+_fmt(b.v)+'d</span>'
        +'</div>';
      }).join('')
    +'</div>'
    // Balance sheet mini
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;">'
      +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:12px;">Can doi ke toan</div>'
      +[{lbl:'Tien mat + TG',v:(ts.tien_mat||0)+(ts.tien_gui||0),clr:'#818cf8'},
        {lbl:'Phai thu KH',v:ts.phai_thu||0,clr:'#06b6d4'},
        {lbl:'Hang hoa',v:ts.hang_hoa||0,clr:'#10b981'},
        {lbl:'Phai tra NCC',v:no.phai_tra||0,clr:'#f87171'},
        {lbl:'Von chu so huu',v:c.von_chu_so_huu||0,clr:'#4f6fff'},
      ].map(function(r){
        return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;">'
          +'<span style="color:var(--text3);">'+r.lbl+'</span>'
          +'<span style="font-weight:700;color:'+r.clr+';">'+_fmt(r.v)+'d</span>'
        +'</div>';
      }).join('')
    +'</div>'
  +'</div>';
}

window.loadBaoCaoTC  = loadBaoCaoTC;
window.loadBaoCaoKT  = loadBaoCaoTC;

}());
