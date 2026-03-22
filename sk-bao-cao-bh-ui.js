// [v5.35] 22/03/2026 — sk-bao-cao-bh-ui.js
// Module BÁO CÁO BÁN HÀNG — Doanh thu, Lợi nhuận, Hoa hồng
// Tách từ sk-sales-returns.js (trước đây lồng ghép)
(function(){
'use strict';
var _api  = function(){ return typeof window.api==='function'?window.api:null; };
var _ct   = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
var _esc  = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
var _fmt  = function(n){ n=Number(n||0); if(n>=1e9)return(n/1e9).toFixed(1)+'ty'; if(n>=1e6)return(n/1e6).toFixed(1)+'tr'; if(n>=1e3)return Math.round(n/1e3)+'k'; return String(Math.round(n)); };
var _fmtN = function(n){ return Number(n||0).toLocaleString('vi-VN'); };
var _toast= function(m,t){ if(typeof window.skToast==='function')window.skToast(m,t||'ok'); };
var _pct  = function(n){ n=Number(n||0); return (n>=0?'+':'')+n+'%'; };

var BC = { tab:'revenue', month:new Date().getMonth()+1, year:new Date().getFullYear() };

function loadBaoCaoBH() {
  var ct=_ct();if(!ct)return;
  BC.tab='revenue';
  ct.innerHTML='<div class="fade-in" style="padding:24px;">'
    +'<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:18px;">'
      +'<div><h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F4CA; Bao cao Ban hang</h1>'
        +'<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Doanh thu · Loi nhuan · Hoa hong · Top KH · Top SP</p></div>'
      +'<div style="display:flex;gap:7px;align-items:center;">'
        +'<select id="bc-month" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
          +[1,2,3,4,5,6,7,8,9,10,11,12].map(function(m){
            return '<option value="'+m+'"'+(m===BC.month?' selected':'')+'>Thang '+m+'</option>';
          }).join('')
        +'</select>'
        +'<select id="bc-year" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
          +[BC.year-1,BC.year,BC.year+1].map(function(y){ return '<option value="'+y+'"'+(y===BC.year?' selected':'')+'>'+y+'</option>'; }).join('')
        +'</select>'
        +'<button id="bc-refresh" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Xem</button>'
      +'</div>'
    +'</div>'
    +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;background:var(--bg2);border-radius:12px;padding:5px;" id="bh-tabs">'
      +[['revenue','&#x1F4B9; Doanh thu'],['profit','&#x1F4B0; Loi nhuan'],['commission','&#x1F4B3; Hoa hong']].map(function(t,i){
        return '<button data-bh="'+t[0]+'" style="flex:1;min-width:80px;border-radius:9px;padding:8px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;border:none;'
          +(i===0?'background:var(--accent2);color:#fff;':'background:none;color:var(--text3);')+'">'+t[1]+'</button>';
      }).join('')
    +'</div>'
    +'<div id="bh-body"></div>'
  +'</div>';

  ct.querySelectorAll('[data-bh]').forEach(function(btn){
    btn.addEventListener('click',function(){
      ct.querySelectorAll('[data-bh]').forEach(function(b){ b.style.background='none'; b.style.color='var(--text3)'; });
      btn.style.background='var(--accent2)'; btn.style.color='#fff';
      BC.tab=btn.getAttribute('data-bh'); _bhRender(BC.tab);
    });
  });
  document.getElementById('bc-refresh').addEventListener('click',function(){
    BC.month=Number((document.getElementById('bc-month')||{}).value||BC.month);
    BC.year =Number((document.getElementById('bc-year') ||{}).value||BC.year);
    _bhRender(BC.tab);
  });
  _bhRender('revenue');
}

function _bhRender(t){
  if      (t==='revenue')    _bhRevenue();
  else if (t==='profit')     _bhProfit();
  else if (t==='commission') _bhCommission();
}

// ── Tab Doanh thu ─────────────────────────────────────────────────
function _bhRevenue(){
  var el=document.getElementById('bh-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tinh toan...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('sales_report_revenue',{period:'month',month:BC.month,year:BC.year},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi</p>';return;}
    var s=d.summary||{}; var prev=d.prev_summary||{};
    var byDate=d.by_date||[]; var top5KH=d.top5_kh||[]; var top5SP=d.top5_sp||[];
    var tang=d.tang_dt||0;
    var margin=s.doanh_thu>0?Math.round((s.doanh_thu-s.gia_von||0)/s.doanh_thu*100):0;

    // KPI summary
    el.innerHTML='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;">'
      +[
        {icon:'&#x1F4B9;', lbl:'Doanh thu', v:s.doanh_thu||0, clr:'#34d399'},
        {icon:'&#x1F4CB;', lbl:'Don hang',  v:s.so_don||0,    clr:'#818cf8', nofmt:true},
        {icon:'&#x1F4B3;', lbl:'Da thu',    v:s.da_thu||0,    clr:'#4f6fff'},
        {icon:'&#x1F504;', lbl:'So vs ky truoc', v:tang, clr:tang>=0?'#34d399':'#f87171', pct:true, nofmt:true},
      ].map(function(k){
        var val=k.pct?_pct(k.v):(k.nofmt?k.v:_fmt(k.v)+'d');
        return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
          +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">'
            +'<span style="font-size:18px;">'+k.icon+'</span>'
            +'<span style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;">'+k.lbl+'</span>'
          +'</div>'
          +'<div style="font-size:20px;font-weight:900;color:'+k.clr+';font-family:monospace;">'+val+'</div>'
          +(prev.doanh_thu&&!k.pct?'<div style="font-size:10px;color:var(--text3);margin-top:2px;">Ky truoc: '+_fmt(prev.doanh_thu||0)+'d</div>':'')
        +'</div>';
      }).join('')
    +'</div>'
    // Chart + Top rows
    +'<div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:14px;">'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:8px;">Doanh thu theo ngay</div>'
        +'<canvas id="bh-chart" height="150"></canvas>'
      +'</div>'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:10px;">Theo nhan vien</div>'
        +'<div id="bh-by-sale"></div>'
      +'</div>'
    +'</div>'
    // Top KH + Top SP
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:10px;">&#x1F465; Top 5 Khach hang</div>'
        +(top5KH.length
          ? top5KH.map(function(k,i){
              return '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">'
                +'<div style="display:flex;align-items:center;gap:7px;">'
                  +'<div style="width:20px;height:20px;border-radius:50%;background:var(--accent2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;">'+(i+1)+'</div>'
                  +'<span style="font-size:12px;color:var(--text);">'+_esc(k.ten||'')+'</span>'
                +'</div>'
                +'<span style="font-size:12px;font-weight:700;color:var(--accent2);">'+k.don+' don</span>'
              +'</div>';
            }).join('')
          : '<div style="color:var(--text3);font-size:12px;">Chua co du lieu</div>'
        )
      +'</div>'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:10px;">&#x1F4E6; Top 5 San pham</div>'
        +(top5SP.length
          ? top5SP.map(function(p,i){
              var maxDT=top5SP[0].doanh_thu||1;
              var pct=Math.round((p.doanh_thu||0)/maxDT*100);
              return '<div style="margin-bottom:7px;">'
                +'<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;">'
                  +'<span style="color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:150px;">'+(i+1)+'. '+_esc(p.ten||'')+'</span>'
                  +'<span style="color:var(--green);font-weight:700;">'+_fmt(p.doanh_thu||0)+'d</span>'
                +'</div>'
                +'<div style="height:4px;background:var(--bg3);border-radius:99px;overflow:hidden;">'
                  +'<div style="height:100%;width:'+pct+'%;background:var(--green);border-radius:99px;"></div>'
                +'</div>'
              +'</div>';
            }).join('')
          : '<div style="color:var(--text3);font-size:12px;">Chua co du lieu</div>'
        )
      +'</div>'
    +'</div>';

    // Draw chart
    setTimeout(function(){
      var canvas=document.getElementById('bh-chart');
      if(!canvas||!byDate.length)return;
      var W=canvas.parentElement.clientWidth-28||300; var H=150;
      canvas.width=W; canvas.height=H;
      var ctx=canvas.getContext('2d');
      ctx.fillStyle='#0d1020'; ctx.fillRect(0,0,W,H);
      var maxV=Math.max.apply(null,byDate.map(function(d2){return d2.doanh_thu||0;}))||1;
      var bw=Math.max(5,Math.floor((W-30)/byDate.length)-3);
      byDate.forEach(function(d2,di){
        var x=30+di*(bw+3);
        var hV=Math.round(((d2.doanh_thu||0)/maxV)*(H-30));
        var grd=ctx.createLinearGradient(x,H-30-hV,x,H-30);
        grd.addColorStop(0,'#34d399'); grd.addColorStop(1,'rgba(52,211,153,.2)');
        ctx.fillStyle=grd;
        ctx.beginPath(); ctx.roundRect(x,H-30-hV,bw,hV,3); ctx.fill();
        if(di%5===0){
          ctx.fillStyle='#475569'; ctx.font='8px monospace'; ctx.textAlign='center';
          var parts=(d2.date||d2.ngay||'').split('-');
          ctx.fillText((parts[2]||'')+'/'+(parts[1]||''),x+bw/2,H-4);
        }
      });
    },60);

    // By sale
    var bySale=d.by_sale||[];
    var bySaleEl=document.getElementById('bh-by-sale');
    if(bySaleEl){
      if(!bySale.length){bySaleEl.innerHTML='<div style="font-size:12px;color:var(--text3);">Chua co du lieu</div>';}
      else{
        bySaleEl.innerHTML=bySale.slice(0,5).map(function(s2){
          return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px;">'
            +'<span style="color:var(--text2);">'+_esc(s2.sale_name||s2.nguoi_tao||'')+'</span>'
            +'<span style="color:var(--green);font-weight:700;">'+_fmt(s2.doanh_thu||0)+'d</span>'
          +'</div>';
        }).join('');
      }
    }
  });
}

// ── Tab Lợi nhuận ─────────────────────────────────────────────────
function _bhProfit(){
  var el=document.getElementById('bh-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tinh toan...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('sales_report_profit',{month:BC.month,year:BC.year},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi</p>';return;}
    var rows=d.data||[]; var s=d.summary||{};
    var margin=s.doanh_thu>0?Math.round((s.loi_nhuan||0)/s.doanh_thu*100):0;

    el.innerHTML='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">'
      +[
        {lbl:'Doanh thu', v:s.doanh_thu||0, clr:'#34d399'},
        {lbl:'Gia von',   v:s.gia_von||0,   clr:'#f87171'},
        {lbl:'Loi nhuan', v:s.loi_nhuan||0, clr:'#818cf8'},
      ].map(function(k){
        return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
          +'<div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:5px;">'+k.lbl+'</div>'
          +'<div style="font-size:20px;font-weight:900;color:'+k.clr+';font-family:monospace;">'+_fmt(k.v)+'d</div>'
        +'</div>';
      }).join('')
    +'</div>'
    +'<div style="background:rgba(129,140,248,.08);border:1px solid rgba(129,140,248,.2);border-radius:12px;padding:14px;margin-bottom:14px;display:flex;align-items:center;gap:14px;">'
      +'<div style="font-size:36px;font-weight:900;color:#818cf8;font-family:monospace;">'+margin+'%</div>'
      +'<div><div style="font-size:13px;font-weight:700;color:var(--text);">Bien loi nhuan</div>'
        +'<div style="font-size:11px;color:var(--text3);">(Loi nhuan / Doanh thu)</div></div>'
    +'</div>'
    +(rows.length
      ?'<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
        +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:500px;">'
        +'<thead><tr style="background:var(--bg3);">'
          +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma don</th>'
          +'<th style="padding:8px 12px;text-align:left;">Khach hang</th>'
          +'<th style="padding:8px 12px;text-align:right;">Doanh thu</th>'
          +'<th style="padding:8px 12px;text-align:right;color:#f87171;">Gia von</th>'
          +'<th style="padding:8px 12px;text-align:right;color:#818cf8;">Loi nhuan</th>'
          +'<th style="padding:8px 12px;text-align:center;">Margin</th>'
        +'</tr></thead><tbody>'
        +rows.slice(0,30).map(function(r){
          var ln=(r.doanh_thu||0)-(r.gia_von||0);
          var mg=r.doanh_thu>0?Math.round(ln/r.doanh_thu*100):0;
          return '<tr style="border-top:1px solid var(--border);">'
            +'<td style="padding:7px 12px;font-family:monospace;font-size:11px;color:var(--accent2);">'+_esc(r.ma_don||'')+'</td>'
            +'<td style="padding:7px 12px;">'+_esc(r.khach_ten||'')+'</td>'
            +'<td style="padding:7px 12px;text-align:right;color:#34d399;font-weight:700;">'+_fmt(r.doanh_thu||0)+'d</td>'
            +'<td style="padding:7px 12px;text-align:right;color:#f87171;">'+_fmt(r.gia_von||0)+'d</td>'
            +'<td style="padding:7px 12px;text-align:right;color:#818cf8;font-weight:700;">'+_fmt(ln)+'d</td>'
            +'<td style="padding:7px 12px;text-align:center;">'
              +'<span style="background:rgba(129,140,248,.12);color:#818cf8;border-radius:5px;padding:2px 8px;font-size:10px;font-weight:800;">'+mg+'%</span>'
            +'</td>'
          +'</tr>';
        }).join('')
        +'</tbody></table></div>'
      :'<div style="text-align:center;padding:32px;color:var(--text3);">Chua co du lieu loi nhuan.</div>'
    );
  });
}

// ── Tab Hoa hồng ──────────────────────────────────────────────────
function _bhCommission(){
  var el=document.getElementById('bh-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tinh toan...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('sales_get_commissions',{month:BC.month,year:BC.year},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi</p>';return;}
    var rows=d.data||[]; var total=d.tong_hoa_hong||0;
    el.innerHTML='<div style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);border-radius:12px;padding:14px;margin-bottom:14px;display:flex;align-items:center;gap:14px;">'
      +'<div style="font-size:30px;font-weight:900;color:#fbbf24;font-family:monospace;">'+_fmt(total)+'d</div>'
      +'<div><div style="font-size:13px;font-weight:700;color:var(--text);">Tong hoa hong thang '+BC.month+'/'+BC.year+'</div>'
        +'<div style="font-size:11px;color:var(--text3);">'+rows.length+' nhan vien</div></div>'
    +'</div>'
    +(rows.length
      ?'<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
        +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:500px;">'
        +'<thead><tr style="background:var(--bg3);">'
          +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Nhan vien</th>'
          +'<th style="padding:8px 12px;text-align:center;">So don</th>'
          +'<th style="padding:8px 12px;text-align:right;">Doanh thu</th>'
          +'<th style="padding:8px 12px;text-align:center;">Ty le</th>'
          +'<th style="padding:8px 12px;text-align:right;color:#fbbf24;">Hoa hong</th>'
        +'</tr></thead><tbody>'
        +rows.map(function(r){
          var rate=r.doanh_thu>0?Math.round((r.hoa_hong||0)/r.doanh_thu*100):0;
          return '<tr style="border-top:1px solid var(--border);">'
            +'<td style="padding:8px 12px;font-weight:700;">'+_esc(r.ten_nv||r.nguoi_tao||'')+'</td>'
            +'<td style="padding:8px 12px;text-align:center;">'+_esc(String(r.so_don||0))+'</td>'
            +'<td style="padding:8px 12px;text-align:right;color:#34d399;">'+_fmt(r.doanh_thu||0)+'d</td>'
            +'<td style="padding:8px 12px;text-align:center;">'
              +'<span style="background:rgba(251,191,36,.12);color:#fbbf24;border-radius:5px;padding:2px 7px;font-size:10px;font-weight:800;">'+rate+'%</span>'
            +'</td>'
            +'<td style="padding:8px 12px;text-align:right;font-weight:900;color:#fbbf24;">'+_fmt(r.hoa_hong||0)+'d</td>'
          +'</tr>';
        }).join('')
        +'</tbody></table></div>'
      :'<div style="text-align:center;padding:32px;color:var(--text3);">Chua co du lieu hoa hong.</div>'
    );
  });
}

window.loadBaoCaoBH  = loadBaoCaoBH;
window.loadBaoCaoBanHang = loadBaoCaoBH;

}());
