// [v5.34] 22/03/2026 — sk-ke-toan-ui.js
// Module KẾ TOÁN — Bút toán kép, Sổ cái, Bảng CĐPS, Cân đối KT
// Phân tách độc lập từ sk-finance-ui.js
(function(){
'use strict';
var _api  = function(){ return typeof window.api==='function'?window.api:null; };
var _ct   = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
var _esc  = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
var _fmt  = function(n){ n=Number(n||0); if(n>=1e9)return(n/1e9).toFixed(1)+'ty'; if(n>=1e6)return(n/1e6).toFixed(1)+'tr'; if(n>=1e3)return Math.round(n/1e3)+'k'; return String(Math.round(n)); };
var _fmtN = function(n){ return Number(n||0).toLocaleString('vi-VN'); };
var _toast= function(m,t){ if(typeof window.skToast==='function')window.skToast(m,t||'ok'); };

var TK_MAP = {
  '111':'Tien mat','112':'Tien gui ngan hang',
  '131':'Phai thu KH','156':'Hang hoa','211':'TSCD',
  '331':'Phai tra NCC','341':'Vay ngan hang','333':'Thue',
  '411':'Von chu so huu','421':'LNST','511':'Doanh thu BH',
  '512':'Doanh thu dich vu','632':'Gia von hang ban',
  '641':'Chi phi ban hang','642':'Chi phi quan ly','811':'Chi phi khac',
};
var TK_OPTS = Object.keys(TK_MAP).map(function(k){
  return '<option value="'+k+'">TK '+k+' - '+TK_MAP[k]+'</option>';
}).join('');

var KT = { tab:'nhat_ky', sc_tk:'111', sc_page:1, cdps_from:'', cdps_to:'' };

function loadKeToan(){
  var ct=_ct();if(!ct)return;
  KT.tab='nhat_ky';
  ct.innerHTML='<div class="fade-in" style="padding:24px;">'
    +'<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:18px;">'
      +'<div><h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F4D3; Ke toan</h1>'
        +'<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Nhat ky chung · So cai · Bang CDPS · Can doi ke toan</p></div>'
      +'<button id="kt-new-bt" style="background:rgba(79,111,255,.12);border:1px solid rgba(79,111,255,.25);color:var(--accent2);border-radius:9px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2795; But toan moi</button>'
    +'</div>'
    +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;background:var(--bg2);border-radius:12px;padding:5px;" id="kt-tabs">'
      +[['nhat_ky','&#x1F4D3; Nhat ky'],['so_cai','&#x1F4F0; So cai'],['cdps','&#x1F4CA; CDPS'],['cdkt','&#x2696; Can doi KT']].map(function(t,i){
        return '<button data-kt="'+t[0]+'" style="flex:1;min-width:80px;border-radius:9px;padding:8px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;border:none;'
          +(i===0?'background:var(--accent2);color:#fff;':'background:none;color:var(--text3);')+'">'+t[1]+'</button>';
      }).join('')
    +'</div>'
    +'<div id="kt-body"></div>'
  +'</div>';

  ct.querySelectorAll('[data-kt]').forEach(function(btn){
    btn.addEventListener('click',function(){
      ct.querySelectorAll('[data-kt]').forEach(function(b){ b.style.background='none'; b.style.color='var(--text3)'; });
      btn.style.background='var(--accent2)'; btn.style.color='#fff';
      KT.tab=btn.getAttribute('data-kt'); _ktRender(KT.tab);
    });
  });
  document.getElementById('kt-new-bt').addEventListener('click', _ktNewButToan);
  _ktRender('nhat_ky');
}

function _ktRender(t){
  if      (t==='nhat_ky') _ktNhatKy();
  else if (t==='so_cai')  _ktSoCai();
  else if (t==='cdps')    _ktCDPS();
  else if (t==='cdkt')    _ktCDKT();
}

// ── Tab 1: Nhật ký chung ─────────────────────────────────────────
function _ktNhatKy(){
  var el=document.getElementById('kt-body');if(!el)return;
  el.innerHTML='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
    +'<select id="nk-tk" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 9px;color:var(--text3);font-family:inherit;font-size:11px;"><option value="">Tat ca TK</option>'+TK_OPTS+'</select>'
    +'<input id="nk-from" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-family:inherit;font-size:11px;">'
    +'<input id="nk-to" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-family:inherit;font-size:11px;">'
    +'<button id="nk-search" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
  +'</div>'
  +'<div id="nk-list"><div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div></div>';

  document.getElementById('nk-search').addEventListener('click', _ktLoadNhatKy);
  _ktLoadNhatKy();
}

function _ktLoadNhatKy(){
  var el=document.getElementById('nk-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('fin_get_but_toan',{
    tk:(document.getElementById('nk-tk')||{}).value||'',
    from_date:(document.getElementById('nk-from')||{}).value||'',
    to_date:(document.getElementById('nk-to')||{}).value||'',
    limit:50
  },function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi tai but toan</p>';return;}
    var rows=d.data||[];
    if(!rows.length){
      el.innerHTML='<div style="text-align:center;padding:36px;color:var(--text3);">'
        +'<div style="font-size:28px;margin-bottom:8px;">&#x1F4D3;</div>'
        +'<div style="font-size:13px;font-weight:700;">Chua co but toan nao</div>'
        +'<div style="margin-top:12px;"><button onclick="window._ktNewButToan()" style="background:var(--accent);border:none;color:#fff;border-radius:9px;padding:9px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tao but toan dau tien</button></div>'
      +'</div>';
      return;
    }
    var tongNo=0, tongCo=0;
    el.innerHTML='<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:600px;">'
      +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma BT</th>'
        +'<th style="padding:8px 12px;text-align:center;">Ngay</th>'
        +'<th style="padding:8px 12px;text-align:left;">Dien giai</th>'
        +'<th style="padding:8px 12px;text-align:center;">TK No</th>'
        +'<th style="padding:8px 12px;text-align:center;">TK Co</th>'
        +'<th style="padding:8px 12px;text-align:right;color:var(--red);">PS No</th>'
        +'<th style="padding:8px 12px;text-align:right;color:var(--green);">PS Co</th>'
      +'</tr></thead><tbody>'
      +rows.map(function(r){
        var so=Number(r.so_tien||0);
        tongNo+=so; tongCo+=so;
        return '<tr style="border-top:1px solid var(--border);">'
          +'<td style="padding:7px 12px;font-family:monospace;font-size:10px;color:var(--accent2);">'+_esc(r.ma_but_toan||'')+'</td>'
          +'<td style="padding:7px 12px;text-align:center;font-size:11px;color:var(--text3);">'+_esc(r.ngay||'')+'</td>'
          +'<td style="padding:7px 12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(r.dien_giai||'')+'</td>'
          +'<td style="padding:7px 12px;text-align:center;"><span style="background:rgba(248,113,113,.12);color:#f87171;border-radius:5px;padding:2px 8px;font-size:10px;font-weight:800;">'+_esc(r.tk_no||'')+'</span></td>'
          +'<td style="padding:7px 12px;text-align:center;"><span style="background:rgba(52,211,153,.12);color:#34d399;border-radius:5px;padding:2px 8px;font-size:10px;font-weight:800;">'+_esc(r.tk_co||'')+'</span></td>'
          +'<td style="padding:7px 12px;text-align:right;color:#f87171;font-weight:700;">'+_fmtN(so)+'</td>'
          +'<td style="padding:7px 12px;text-align:right;color:#34d399;font-weight:700;">'+_fmtN(so)+'</td>'
        +'</tr>';
      }).join('')
      +'</tbody><tfoot><tr style="background:var(--bg3);border-top:2px solid var(--border2);">'
        +'<td colspan="5" style="padding:8px 12px;font-size:11px;font-weight:800;color:var(--text3);">Tong cong ('+(rows.length)+' but toan)</td>'
        +'<td style="padding:8px 12px;text-align:right;font-weight:900;color:#f87171;">'+_fmtN(tongNo)+'</td>'
        +'<td style="padding:8px 12px;text-align:right;font-weight:900;color:#34d399;">'+_fmtN(tongCo)+'</td>'
      +'</tr></tfoot></table></div>'
      +(Math.abs(tongNo-tongCo)<1
        ?'<div style="margin-top:8px;font-size:11px;color:#34d399;text-align:right;">&#x2705; Can bang: PS No = PS Co</div>'
        :'<div style="margin-top:8px;font-size:11px;color:#f87171;text-align:right;">&#x26A0; Khong can bang: Chenh lech '+_fmtN(tongNo-tongCo)+'</div>');
  });
}

// ── Tab 2: Sổ cái ─────────────────────────────────────────────────
function _ktSoCai(){
  var el=document.getElementById('kt-body');if(!el)return;
  el.innerHTML='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
    +'<select id="sc-tk" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text);font-family:inherit;font-size:12px;min-width:200px;"><option value="">Chon tai khoan...</option>'+TK_OPTS+'</select>'
    +'<input id="sc-from" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-family:inherit;font-size:11px;">'
    +'<input id="sc-to" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 8px;color:var(--text);font-family:inherit;font-size:11px;">'
    +'<button id="sc-view" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Xem</button>'
  +'</div>'
  +'<div id="sc-body"><div style="text-align:center;padding:32px;color:var(--text3);">Chon tai khoan va nhan Xem</div></div>';

  document.getElementById('sc-view').addEventListener('click', _ktLoadSoCai);
}

function _ktLoadSoCai(){
  var el=document.getElementById('sc-body');if(!el)return;
  var tk=(document.getElementById('sc-tk')||{}).value||'';
  if(!tk){_toast('Chon tai khoan','error');return;}
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('fin_get_so_cai',{
    tk:tk,
    from_date:(document.getElementById('sc-from')||{}).value||'',
    to_date:(document.getElementById('sc-to')||{}).value||'',
    limit:100
  },function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi</p>';return;}
    var rows=d.data||[];
    var ten=TK_MAP[tk]||tk;
    // Summary cards
    el.innerHTML='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">'
      +[
        {lbl:'Du No dau ky', v:d.du_no_dau||0, clr:'#f87171'},
        {lbl:'PS No',        v:d.tong_ps_no||0, clr:'#f87171'},
        {lbl:'PS Co',        v:d.tong_ps_co||0, clr:'#34d399'},
        {lbl:'Du No cuoi ky',v:d.du_no_cuoi||0, clr:'#818cf8'},
      ].map(function(k){
        return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:11px;padding:12px;">'
          +'<div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:4px;">'+k.lbl+'</div>'
          +'<div style="font-size:17px;font-weight:900;color:'+k.clr+';font-family:monospace;">'+_fmtN(k.v)+'</div>'
        +'</div>';
      }).join('')
    +'</div>'
    +'<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:10px;">TK '+tk+' - '+_esc(ten)+'</div>';

    if(!rows.length){el.innerHTML+='<div style="text-align:center;padding:24px;color:var(--text3);">Chua co giao dich</div>';return;}
    var runDu=Number(d.du_no_dau||0);
    el.innerHTML+='<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:560px;">'
      +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:7px 12px;text-align:center;font-size:10px;font-weight:800;color:var(--text3);">Ngay</th>'
        +'<th style="padding:7px 12px;text-align:left;">Dien giai</th>'
        +'<th style="padding:7px 12px;text-align:center;">Ma ref</th>'
        +'<th style="padding:7px 12px;text-align:right;color:#f87171;">PS No</th>'
        +'<th style="padding:7px 12px;text-align:right;color:#34d399;">PS Co</th>'
        +'<th style="padding:7px 12px;text-align:right;">Du No</th>'
      +'</tr></thead><tbody>'
      +rows.map(function(r){
        var psNo=Number(r.ps_no||0), psCo=Number(r.ps_co||0);
        runDu=runDu+psNo-psCo;
        return '<tr style="border-top:1px solid var(--border);">'
          +'<td style="padding:7px 12px;text-align:center;font-size:11px;color:var(--text3);">'+_esc(r.ngay||'')+'</td>'
          +'<td style="padding:7px 12px;">'+_esc(r.dien_giai||'')+'</td>'
          +'<td style="padding:7px 12px;text-align:center;font-family:monospace;font-size:10px;color:var(--text3);">'+_esc(r.ma_ref||'')+'</td>'
          +'<td style="padding:7px 12px;text-align:right;color:'+(psNo?'#f87171':'var(--text3)')+';font-weight:'+(psNo?700:400)+';">'+(psNo?_fmtN(psNo):'')+'</td>'
          +'<td style="padding:7px 12px;text-align:right;color:'+(psCo?'#34d399':'var(--text3)')+';font-weight:'+(psCo?700:400)+';">'+(psCo?_fmtN(psCo):'')+'</td>'
          +'<td style="padding:7px 12px;text-align:right;font-weight:700;color:'+(runDu>=0?'var(--text)':'#f87171')+';">'+_fmtN(Math.abs(runDu))+(runDu<0?' (Co)':' (No)')+'</td>'
        +'</tr>';
      }).join('')
      +'</tbody></table></div>';
  });
}

// ── Tab 3: Bảng CĐPS ─────────────────────────────────────────────
function _ktCDPS(){
  var el=document.getElementById('kt-body');if(!el)return;
  el.innerHTML='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
    +'<input id="cdps-from" type="date" placeholder="Tu ngay" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<input id="cdps-to" type="date" placeholder="Den ngay" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<button id="cdps-view" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tinh toan</button>'
  +'</div>'
  +'<div id="cdps-body"><div style="text-align:center;padding:32px;color:var(--text3);">Nhan Tinh toan de xem bang CDPS</div></div>';
  document.getElementById('cdps-view').addEventListener('click', _ktLoadCDPS);
}

function _ktLoadCDPS(){
  var el=document.getElementById('cdps-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tinh toan...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('fin_get_cdps',{
    from_date:(document.getElementById('cdps-from')||{}).value||'',
    to_date:(document.getElementById('cdps-to')||{}).value||'',
  },function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi: '+(d&&d.error||'')+'</p>';return;}
    var rows=d.data||[];
    var tPsNo=d.tong_ps_no||0, tPsCo=d.tong_ps_co||0;
    var canBang=d.can_bang;
    el.innerHTML=(canBang
      ?'<div style="background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#34d399;font-weight:700;">&#x2705; Can bang: Tong PS No = Tong PS Co = '+_fmtN(tPsNo)+'d</div>'
      :'<div style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#f87171;font-weight:700;">&#x26A0; Khong can bang! Chenh lech: '+_fmtN(Math.abs(tPsNo-tPsCo))+'d</div>'
    )
    +'<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:700px;">'
    +'<thead><tr style="background:var(--bg3);">'
      +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">TK</th>'
      +'<th style="padding:8px 12px;text-align:left;">Ten tai khoan</th>'
      +'<th style="padding:8px 12px;text-align:right;">Du No dau ky</th>'
      +'<th style="padding:8px 12px;text-align:right;">Du Co dau ky</th>'
      +'<th style="padding:8px 12px;text-align:right;color:#f87171;">PS No</th>'
      +'<th style="padding:8px 12px;text-align:right;color:#34d399;">PS Co</th>'
      +'<th style="padding:8px 12px;text-align:right;">Du No cuoi ky</th>'
      +'<th style="padding:8px 12px;text-align:right;">Du Co cuoi ky</th>'
    +'</tr></thead><tbody>'
    +rows.map(function(r){
      var hasPeriod=r.ps_no||r.ps_co||r.no_dau||r.co_dau;
      return '<tr style="border-top:1px solid var(--border);background:'+(hasPeriod?'var(--bg2)':'var(--bg3)')+';opacity:'+(hasPeriod?1:.5)+';">'
        +'<td style="padding:7px 12px;font-weight:800;color:var(--accent2);font-family:monospace;">'+_esc(r.tk||'')+'</td>'
        +'<td style="padding:7px 12px;color:var(--text2);">'+_esc(r.ten||'')+'</td>'
        +'<td style="padding:7px 12px;text-align:right;color:var(--text3);">'+(r.no_dau?_fmtN(r.no_dau):'')+'</td>'
        +'<td style="padding:7px 12px;text-align:right;color:var(--text3);">'+(r.co_dau?_fmtN(r.co_dau):'')+'</td>'
        +'<td style="padding:7px 12px;text-align:right;color:#f87171;font-weight:'+(r.ps_no?700:400)+';">'+(r.ps_no?_fmtN(r.ps_no):'')+'</td>'
        +'<td style="padding:7px 12px;text-align:right;color:#34d399;font-weight:'+(r.ps_co?700:400)+';">'+(r.ps_co?_fmtN(r.ps_co):'')+'</td>'
        +'<td style="padding:7px 12px;text-align:right;font-weight:700;">'+(r.no_cuoi?_fmtN(r.no_cuoi):'')+'</td>'
        +'<td style="padding:7px 12px;text-align:right;font-weight:700;">'+(r.co_cuoi?_fmtN(r.co_cuoi):'')+'</td>'
      +'</tr>';
    }).join('')
    +'</tbody><tfoot><tr style="background:var(--bg3);border-top:2px solid var(--border2);font-weight:900;">'
      +'<td colspan="4" style="padding:8px 12px;font-size:11px;color:var(--text3);">Tong cong</td>'
      +'<td style="padding:8px 12px;text-align:right;color:#f87171;">'+_fmtN(tPsNo)+'</td>'
      +'<td style="padding:8px 12px;text-align:right;color:#34d399;">'+_fmtN(tPsCo)+'</td>'
      +'<td colspan="2"></td>'
    +'</tr></tfoot></table></div>';
  });
}

// ── Tab 4: Cân đối kế toán ───────────────────────────────────────
function _ktCDKT(){
  var el=document.getElementById('kt-body');if(!el)return;
  el.innerHTML='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
    +'<span style="font-size:12px;color:var(--text3);">Toi ngay:</span>'
    +'<input id="cdkt-to" type="date" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<button id="cdkt-view" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Xem</button>'
  +'</div>'
  +'<div id="cdkt-body"><div style="text-align:center;padding:32px;color:var(--text3);">Nhan Xem de tinhCan doi ke toan</div></div>';
  document.getElementById('cdkt-view').addEventListener('click', _ktLoadCDKT);
}

function _ktLoadCDKT(){
  var el=document.getElementById('cdkt-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tinh toan...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('fin_get_cdkt',{to_date:(document.getElementById('cdkt-to')||{}).value||''},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi: '+(d&&d.error||'')+'</p>';return;}
    var ts=d.tai_san||{}, no=d.no_phai_tra||{};
    var vcsh=d.von_chu_so_huu||0;
    var canBang=d.kiem_tra;
    el.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">'
      // Tài sản
      +'<div>'
        +'<div style="font-size:13px;font-weight:900;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:6px;">'
          +'<span style="background:rgba(79,111,255,.15);color:var(--accent2);border-radius:6px;padding:3px 10px;font-size:11px;">A</span> TAI SAN'
        +'</div>'
        +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
          +_cdktRow('TK 111 - Tien mat',           ts.tien_mat||0, false)
          +_cdktRow('TK 112 - Tien gui ngan hang', ts.tien_gui||0, false)
          +_cdktRow('TK 131 - Phai thu KH',        ts.phai_thu||0, false)
          +_cdktRow('TK 156 - Hang hoa',            ts.hang_hoa||0, false)
          +_cdktRow('TK 211 - Tai san co dinh',     ts.tscd||0,     false)
          +'<div style="border-top:2px solid var(--border2);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-weight:900;font-size:13px;">'
            +'<span style="color:var(--accent2);">Tong tai san</span>'
            +'<span style="color:var(--accent2);">'+_fmtN(ts.tong||0)+'</span>'
          +'</div>'
        +'</div>'
        +'<div style="margin-top:14px;font-size:13px;font-weight:900;color:var(--text);margin-bottom:10px;">P&L Ky nay</div>'
        +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
          +_cdktRow('Doanh thu',  d.doanh_thu||0, false)
          +_cdktRow('Chi phi',    d.chi_phi||0,   true)
          +'<div style="border-top:2px solid var(--border2);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-weight:900;font-size:13px;">'
            +'<span>Loi nhuan thuan</span>'
            +'<span style="color:'+(d.loi_nhuan>=0?'#34d399':'#f87171')+';">'+_fmtN(d.loi_nhuan||0)+'</span>'
          +'</div>'
        +'</div>'
      +'</div>'
      // Nợ + Vốn
      +'<div>'
        +'<div style="font-size:13px;font-weight:900;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:6px;">'
          +'<span style="background:rgba(248,113,113,.15);color:#f87171;border-radius:6px;padding:3px 10px;font-size:11px;">B</span> NO PHAI TRA + VON'
        +'</div>'
        +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;">'
          +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:8px;">No phai tra</div>'
          +_cdktRow('TK 331 - Phai tra NCC',   no.phai_tra||0, false)
          +_cdktRow('TK 341 - Vay ngan hang',  no.no_vay||0,   false)
          +'<div style="border-top:1px solid var(--border);margin:8px 0;padding-top:8px;display:flex;justify-content:space-between;font-weight:800;font-size:12px;color:#f87171;">'
            +'<span>Tong no phai tra</span><span>'+_fmtN(no.tong||0)+'</span>'
          +'</div>'
          +'<div style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase;margin:12px 0 8px;">Von chu so huu</div>'
          +_cdktRow('Von chu so huu (tinh)',   vcsh, false)
          +'<div style="border-top:2px solid var(--border2);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-weight:900;font-size:13px;">'
            +'<span style="color:var(--accent2);">Tong nguon von</span>'
            +'<span style="color:var(--accent2);">'+_fmtN((no.tong||0)+vcsh)+'</span>'
          +'</div>'
        +'</div>'
        +'<div style="margin-top:14px;background:'+(canBang?'rgba(52,211,153,.08)':'rgba(248,113,113,.08)')+';border:1px solid '+(canBang?'rgba(52,211,153,.25)':'rgba(248,113,113,.25)')+';border-radius:12px;padding:14px;">'
          +'<div style="font-size:13px;font-weight:800;color:'+(canBang?'#34d399':'#f87171')+';margin-bottom:4px;">'
            +(canBang?'&#x2705; Can doi can bang':'&#x26A0; Can doi KHONG can bang')
          +'</div>'
          +'<div style="font-size:11px;color:var(--text3);">Tai san = No + Von = '+_fmtN((no.tong||0)+vcsh)+'d</div>'
        +'</div>'
      +'</div>'
    +'</div>';
  });
}

function _cdktRow(lbl, v, isRed){
  return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;">'
    +'<span style="color:var(--text3);">'+_esc(lbl)+'</span>'
    +'<span style="font-weight:700;color:'+(isRed&&v?'#f87171':'var(--text)')+';">'+_fmtN(v)+'</span>'
  +'</div>';
}

// ── Form: Bút toán kép mới ────────────────────────────────────────
window._ktNewButToan = function() {
  var ov=document.createElement('div'); ov.id='sk-fin-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  var box=document.createElement('div');
  box.style.cssText='background:var(--bg2);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:580px;';
  var lineCount=1;
  var renderLines=function(){
    var linesHtml='';
    for(var i=1;i<=lineCount;i++){
      linesHtml+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr 32px;gap:8px;margin-bottom:8px;" id="btl-'+i+'">'
        +'<select id="bt-tk-no-'+i+'" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 9px;color:var(--text);font-family:inherit;font-size:11px;"><option value="">TK No...</option>'+TK_OPTS+'</select>'
        +'<select id="bt-tk-co-'+i+'" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 9px;color:var(--text);font-family:inherit;font-size:11px;"><option value="">TK Co...</option>'+TK_OPTS+'</select>'
        +'<input id="bt-so-'+i+'" type="number" placeholder="So tien" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 9px;color:var(--text);font-family:inherit;font-size:12px;">'
        +'<button id="btl-del-'+i+'" style="background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.2);color:#f87171;border-radius:8px;cursor:pointer;font-size:14px;">&times;</button>'
      +'</div>';
    }
    return linesHtml;
  };
  var buildBox=function(){
    box.innerHTML='<div style="padding:16px 20px;border-bottom:1px solid var(--border);font-size:14px;font-weight:900;">&#x1F4D3; But toan moi (Double-entry)</div>'
      +'<div style="padding:16px 20px;">'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">'
          +'<div><label style="display:block;font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:4px;">Ngay *</label>'
            +'<input id="bt-ngay" type="date" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box;"></div>'
          +'<div><label style="display:block;font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:4px;">Dien giai *</label>'
            +'<input id="bt-dg" type="text" placeholder="Mo ta biet phap..." style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box;"></div>'
        +'</div>'
        +'<div style="background:rgba(79,111,255,.04);border:1px solid rgba(79,111,255,.15);border-radius:10px;padding:12px;margin-bottom:10px;">'
          +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr 32px;gap:8px;margin-bottom:6px;font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;">'
            +'<span>TK No (Debit)</span><span>TK Co (Credit)</span><span>So tien</span><span></span>'
          +'</div>'
          +'<div id="bt-lines">'+renderLines()+'</div>'
          +'<button id="bt-add-line" style="background:none;border:1px dashed var(--border2);color:var(--text3);border-radius:8px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;margin-top:6px;">+ Them dong</button>'
        +'</div>'
        +'<div id="bt-balance" style="font-size:11px;color:var(--text3);margin-bottom:12px;"></div>'
        +'<div style="display:flex;gap:8px;">'
          +'<button id="bt-save" style="flex:1;background:var(--accent);border:none;color:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Ghi so</button>'
          +'<button id="bt-cancel" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:10px;padding:10px 20px;cursor:pointer;font-family:inherit;">Huy</button>'
        +'</div>'
      +'</div>';
    bindBox();
  };
  var bindBox=function(){
    box.querySelector('#bt-cancel').addEventListener('click',function(){ov.remove();});
    box.querySelector('#bt-add-line').addEventListener('click',function(){lineCount++;buildBox();});
    // Delete line buttons
    for(var i=1;i<=lineCount;i++){
      (function(idx){
        var delBtn=box.querySelector('#btl-del-'+idx);
        if(delBtn&&lineCount>1) delBtn.addEventListener('click',function(){
          var row=box.querySelector('#btl-'+idx); if(row)row.remove();
        });
      })(i);
    }
    // Balance check on input
    var checkBal=function(){
      var no=0,co=0;
      for(var i=1;i<=lineCount;i++){
        var soEl=box.querySelector('#bt-so-'+i);
        if(soEl&&soEl.parentNode){ no+=Number(soEl.value||0); co+=Number(soEl.value||0); }
      }
      var balEl=box.querySelector('#bt-balance');
      if(balEl) balEl.textContent='Tong No: '+_fmtN(no)+' | Tong Co: '+_fmtN(co)+(Math.abs(no-co)<1?' ✅ Can bang':' ⚠️ Chua can bang');
    };
    for(var i=1;i<=lineCount;i++){
      var soEl=box.querySelector('#bt-so-'+i);
      if(soEl) soEl.addEventListener('input',checkBal);
    }
    box.querySelector('#bt-save').addEventListener('click',function(){
      var btn=box.querySelector('#bt-save');
      var ngay=(box.querySelector('#bt-ngay')||{}).value||'';
      var dg=(box.querySelector('#bt-dg')||{}).value||'';
      if(!ngay||!dg){_toast('Nhap ngay va dien giai','error');return;}
      var lines=[];
      for(var i=1;i<=lineCount;i++){
        var tkNo=(box.querySelector('#bt-tk-no-'+i)||{value:''}).value||'';
        var tkCo=(box.querySelector('#bt-tk-co-'+i)||{value:''}).value||'';
        var so=Number((box.querySelector('#bt-so-'+i)||{value:0}).value||0);
        if(tkNo&&tkCo&&so) lines.push({tk_no:tkNo,tk_co:tkCo,so_no:so,so_co:so});
      }
      if(!lines.length){_toast('Nhap it nhat 1 dong but toan','error');return;}
      btn.disabled=true; btn.textContent='Dang ghi so...';
      var apiF=_api();if(!apiF)return;
      apiF('fin_save_but_toan',{ngay:ngay,dien_giai:dg,lines:lines},function(e,d){
        if(!e&&d&&d.ok){ov.remove();_toast('Da ghi so '+d.ma_list.length+' but toan','ok');_ktNhatKy();}
        else{btn.disabled=false;btn.textContent='Ghi so';_toast((d&&d.error)||'Loi','error');}
      });
    });
  };
  buildBox();
  ov.appendChild(box); document.body.appendChild(ov);
};

window.loadKeToan  = loadKeToan;
window.loadKeToanTC= loadKeToan;

}());
