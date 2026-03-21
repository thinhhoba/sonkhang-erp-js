/* ================================================================
 * sk-warehouse-ui.js  SonKhang ERP v5.7.0
 * Kho van: Ton kho · Xuat kho · Nhap kho · Lich su · Dashboard
 * 0 non-ASCII, DOM API
 * ================================================================ */
(function(){
'use strict';
var _api=function(){return typeof window.api==='function'?window.api:null;};
var _ct=function(){var c=typeof window.getContent==='function'?window.getContent():null;return c||document.getElementById('sk-ct');};
var _esc=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
var _fmt=function(n){return(Number(n)||0).toLocaleString('vi-VN');};
var _toast=function(m,t){if(typeof window.skToast==='function')window.skToast(m,t||'ok');};
var STATE={tab:'dashboard',page:1,q:''};

function _modal(h,w){
  var old=document.getElementById('sk-wh-modal');
  if(old&&old.parentNode)old.parentNode.removeChild(old);
  var ov=document.createElement('div');
  ov.id='sk-wh-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;';
  var box=document.createElement('div');
  box.style.cssText='background:var(--bg2);border:1px solid var(--border2);border-radius:18px;width:100%;max-width:'+(w||'680px')+';margin:auto;';
  box.innerHTML=h;ov.appendChild(box);
  ov.addEventListener('click',function(e){if(e.target===ov)_cm();});
  document.body.appendChild(ov);
}
function _cm(){var m=document.getElementById('sk-wh-modal');if(m&&m.parentNode)m.parentNode.removeChild(m);}
window.closeWHModal=_cm;

function loadKhoVan(){
  var ct=_ct();if(!ct)return;
  ct.innerHTML='<div class="fade-in" style="padding:24px;">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
    +'<div><h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F3ED; Kho van</h1>'
    +'<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Ton kho · Xuat · Nhap · Lich su · Bao cao</p></div>'
    +'<div style="display:flex;gap:8px;">'
    +'<button id="wh-xuat-btn" style="background:rgba(255,77,109,.12);border:1px solid rgba(255,77,109,.3);color:var(--red);border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4E4; Xuat kho</button>'
    +'<button id="wh-nhap-btn" style="background:rgba(0,214,143,.12);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4E5; Nhap kho</button>'
    +'<button id="wh-sync-btn" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:10px;padding:9px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F504; Sync</button>'
    +'</div></div>'
    +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;">'
    +[['dashboard','&#x1F4CA; Dashboard'],['stock','&#x1F4E6; Ton kho'],['history','&#x1F4DC; Lich su']].map(function(t,i){
      return '<button data-wh-tab="'+t[0]+'" style="border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;'+(i===0?'background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);':'background:var(--bg3);border:1px solid var(--border2);color:var(--text3);')+'">'+t[1]+'</button>';
    }).join('')
    +'</div>'
    +'<div id="wh-body"></div></div>';

  document.querySelectorAll('[data-wh-tab]').forEach(function(btn){
    btn.addEventListener('click',function(){
      STATE.tab=btn.getAttribute('data-wh-tab');
      document.querySelectorAll('[data-wh-tab]').forEach(function(b){b.style.background='var(--bg3)';b.style.borderColor='var(--border2)';b.style.color='var(--text3)';});
      btn.style.background='rgba(79,111,255,.15)';btn.style.borderColor='rgba(79,111,255,.3)';btn.style.color='var(--accent2)';
      _renderTab(STATE.tab);
    });
  });
  document.getElementById('wh-xuat-btn').addEventListener('click',function(){_showPhieuForm('xuat');});
  document.getElementById('wh-nhap-btn').addEventListener('click',function(){_showPhieuForm('nhap');});
  document.getElementById('wh-sync-btn').addEventListener('click',function(){
    var apiF=_api();if(!apiF)return;
    apiF('wh_sync_from_banggia',{},function(e,d){
      if(!e&&d&&d.ok)_toast(d.msg||'Sync xong','ok');
      else _toast((d&&d.error)||'Loi','error');
      _renderTab('dashboard');
    });
  });
  _renderTab('dashboard');
}
window.loadKhoVan=loadKhoVan;
window.loadTonKho=function(){STATE.tab='stock';loadKhoVan();setTimeout(function(){_renderTab('stock');},100);};
window.loadXuatKho=function(){STATE.tab='history';loadKhoVan();setTimeout(function(){_showPhieuForm('xuat');},300);};
window.loadNhapKho=function(){STATE.tab='history';loadKhoVan();setTimeout(function(){_showPhieuForm('nhap');},300);};
window.loadBaoCaoKV=function(){STATE.tab='dashboard';loadKhoVan();};

function _renderTab(tab){
  if(tab==='dashboard') _renderDash();
  else if(tab==='stock') _renderStock();
  else if(tab==='history') _renderHistory();
}

function _renderDash(){
  var el=document.getElementById('wh-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('wh_get_dashboard',{},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);padding:16px;">Loi</p>';return;}
    var kpis=[
      {icon:'&#x1F4E6;',label:'Tong SP',val:d.tong_sp||0,c:'var(--text)'},
      {icon:'&#x1F4B0;',label:'Gia tri kho',val:_fmt(d.tong_gia_tri||0)+'d',c:'var(--green)'},
      {icon:'&#x26A0;', label:'Canh bao min',val:d.canh_bao||0,c:'var(--yellow)'},
      {icon:'&#x274C;', label:'Het hang',val:d.het_hang||0,c:'var(--red)'},
    ];
    var html='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px;">'
      +kpis.map(function(k){return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;gap:10px;align-items:center;"><div style="font-size:20px;">'+k.icon+'</div><div><div style="font-size:16px;font-weight:900;color:'+k.c+';">'+k.val+'</div><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);">'+k.label+'</div></div></div>';}).join('')+'</div>';
    if((d.canh_bao_list||[]).length){
      html+='<div style="background:rgba(251,191,36,.04);border:1px solid rgba(251,191,36,.2);border-radius:14px;padding:16px;margin-bottom:14px;">'
        +'<div style="font-size:13px;font-weight:900;color:var(--yellow);margin-bottom:10px;">&#x26A0; Canh bao ton kho thap</div>'
        +'<div style="display:grid;gap:6px;">'
        +d.canh_bao_list.map(function(r){return '<div style="display:flex;justify-content:space-between;background:var(--bg2);border-radius:8px;padding:8px 12px;font-size:12px;"><span style="font-weight:700;">'+_esc(r.ten_sp)+'</span><span style="color:var(--yellow);font-weight:900;">'+_fmt(r.ton_hien_tai)+' '+_esc(r.don_vi||'')+'</span></div>';}).join('')
        +'</div></div>';
    }
    if((d.het_hang_list||[]).length){
      html+='<div style="background:rgba(255,77,109,.04);border:1px solid rgba(255,77,109,.2);border-radius:14px;padding:16px;">'
        +'<div style="font-size:13px;font-weight:900;color:var(--red);margin-bottom:10px;">&#x274C; Het hang</div>'
        +'<div style="display:grid;gap:6px;">'
        +d.het_hang_list.map(function(r){return '<div style="background:var(--bg2);border-radius:8px;padding:8px 12px;font-size:12px;font-weight:700;color:var(--red);">'+_esc(r.ten_sp)+'</div>';}).join('')
        +'</div></div>';
    }
    el.innerHTML=html;
  });
}

function _renderStock(){
  var el=document.getElementById('wh-body');if(!el)return;
  el.innerHTML='<div style="display:flex;gap:8px;margin-bottom:12px;">'
    +'<input id="wh-q" type="text" placeholder="Tim ma SP, ten SP..." style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<button id="wh-q-btn" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
    +'</div>'
    +'<div id="wh-stock-list"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>';
  document.getElementById('wh-q-btn').addEventListener('click',function(){
    STATE.q=document.getElementById('wh-q').value;
    _loadStockList();
  });
  document.getElementById('wh-q').addEventListener('keydown',function(e){if(e.keyCode===13)document.getElementById('wh-q-btn').click();});
  _loadStockList();
}

function _loadStockList(){
  var el=document.getElementById('wh-stock-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('wh_get_stock',{q:STATE.q,page:STATE.page,limit:50},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);padding:16px;">Loi</p>';return;}
    var rows=d.data||[];
    if(!rows.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Chua co du lieu ton kho. Nhan "Sync" de dong bo tu Bang gia.</div>';return;}
    var html='<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;">'
      +'<thead><tr style="background:var(--bg3);">'
      +'<th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);">San pham</th>'
      +'<th style="padding:9px 12px;text-align:right;">Ton kho</th>'
      +'<th style="padding:9px 12px;text-align:right;">Min</th>'
      +'<th style="padding:9px 12px;text-align:right;">Gia von</th>'
      +'<th style="padding:9px 12px;text-align:right;">GT ton kho</th>'
      +'<th style="padding:9px 12px;"></th>'
      +'</tr></thead><tbody>';
    rows.forEach(function(r){
      var tonColor=r.canh_bao?'var(--red)':(r.ton_hien_tai>0?'var(--green)':'var(--text3)');
      html+='<tr style="border-top:1px solid var(--border);">'
        +'<td style="padding:8px 12px;"><div style="font-weight:700;">'+_esc(r.ten_sp)+'</div><div style="font-size:10px;color:var(--text3);">'+_esc(r.ma_sp)+'</div></td>'
        +'<td style="padding:8px 12px;text-align:right;font-weight:900;color:'+tonColor+';">'+_fmt(r.ton_hien_tai)+' <span style="font-size:10px;font-weight:400;color:var(--text3);">'+_esc(r.don_vi||'')+'</span>'+(r.canh_bao?' &#x26A0;':'')+'</td>'
        +'<td style="padding:8px 12px;text-align:right;color:var(--text3);">'+_fmt(r.ton_min||0)+'</td>'
        +'<td style="padding:8px 12px;text-align:right;">'+_fmt(r.gia_von||0)+'</td>'
        +'<td style="padding:8px 12px;text-align:right;color:var(--cyan);">'+_fmt(r.ton_hien_tai*(r.gia_von||0))+'</td>'
        +'<td style="padding:8px 12px;" id="wh-sp-act-'+_esc(r.ma_sp)+'"></td>'
        +'</tr>';
    });
    html+='</tbody></table></div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:8px;">Tong: '+d.total+' SP | Gia tri: '+_fmt(d.tong_gia_tri||0)+'d</div>';
    el.innerHTML=html;
    rows.forEach(function(r){
      var td=document.getElementById('wh-sp-act-'+r.ma_sp);if(!td)return;
      var xBtn=document.createElement('button');
      xBtn.innerHTML='&#x1F4E4;';xBtn.title='Xuat kho';
      xBtn.style.cssText='background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.2);border-radius:6px;padding:3px 8px;cursor:pointer;font-size:12px;margin-right:4px;';
      xBtn.addEventListener('click',function(e){e.stopPropagation();_showPhieuForm('xuat',r);});
      var nBtn=document.createElement('button');
      nBtn.innerHTML='&#x1F4E5;';nBtn.title='Nhap kho';
      nBtn.style.cssText='background:rgba(0,214,143,.1);border:1px solid rgba(0,214,143,.2);border-radius:6px;padding:3px 8px;cursor:pointer;font-size:12px;';
      nBtn.addEventListener('click',function(e){e.stopPropagation();_showPhieuForm('nhap',r);});
      td.appendChild(xBtn);td.appendChild(nBtn);
    });
  });
}

function _renderHistory(){
  var el=document.getElementById('wh-body');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai lich su...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('wh_get_history',{limit:50},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);padding:16px;">Loi</p>';return;}
    var rows=d.data||[];
    if(!rows.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Chua co lich su xuat/nhap kho.</div>';return;}
    var html='<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:11px;">'
      +'<thead><tr style="background:var(--bg3);">'
      +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ngay</th>'
      +'<th style="padding:8px 12px;text-align:left;">San pham</th>'
      +'<th style="padding:8px 12px;text-align:center;">Hanh dong</th>'
      +'<th style="padding:8px 12px;text-align:right;">Thay doi</th>'
      +'<th style="padding:8px 12px;text-align:right;">Sau</th>'
      +'<th style="padding:8px 12px;text-align:left;">Ref</th>'
      +'</tr></thead><tbody>';
    rows.forEach(function(r){
      var dc=Number(r.sl_thay_doi||0);
      var c=dc>=0?'var(--green)':'var(--red)';
      html+='<tr style="border-top:1px solid var(--border);">'
        +'<td style="padding:7px 12px;color:var(--text3);">'+_esc(r.ngay||'')+'</td>'
        +'<td style="padding:7px 12px;font-weight:700;">'+_esc(r.ma_sp||'')+'</td>'
        +'<td style="padding:7px 12px;text-align:center;"><span style="padding:2px 6px;border-radius:4px;font-size:10px;font-weight:800;background:rgba(0,0,0,.1);color:var(--text3);">'+_esc(r.hanh_dong||'')+'</span></td>'
        +'<td style="padding:7px 12px;text-align:right;font-weight:900;color:'+c+';">'+(dc>=0?'+':'')+_fmt(dc)+'</td>'
        +'<td style="padding:7px 12px;text-align:right;">'+_fmt(r.sl_sau||0)+'</td>'
        +'<td style="padding:7px 12px;color:var(--accent2);font-size:10px;font-family:monospace;">'+_esc(r.ref||'')+'</td>'
        +'</tr>';
    });
    html+='</tbody></table></div>';
    el.innerHTML=html;
  });
}

function _showPhieuForm(loai,sp){
  var title=loai==='xuat'?'Phieu xuat kho':'Phieu nhap kho';
  var h='<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
    +'<div style="font-size:15px;font-weight:900;">'+title+'</div>'
    +'<button id="pf-x" style="background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;">&#x00D7;</button>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px;">'
    +_fld('pf-masp','Ma san pham *','text',sp?sp.ma_sp:'')
    +_fld('pf-tensp','Ten san pham','text',sp?sp.ten_sp:'')
    +_fld('pf-sl','So luong *','number','')
    +_fld('pf-dv','Don vi','text',sp?sp.don_vi||'cai':'cai')
    +(loai==='xuat'?_fld('pf-ly','Ly do','text','Ban hang'):_fld('pf-gv','Don gia nhap','number',sp?sp.gia_von||0:0))
    +(loai==='xuat'?_fld('pf-ref','Don hang ref','text',''):_fld('pf-po','Ma PO','text',''))
    +'</div>'
    +'<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
    +'<button id="pf-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
    +'<button id="pf-save" style="background:'+(loai==='xuat'?'rgba(255,77,109,.15);border:1px solid rgba(255,77,109,.3);color:var(--red)':'rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green)')+';border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">'+(loai==='xuat'?'&#x1F4E4; Xuat':'&#x1F4E5; Nhap')+'</button>'
    +'</div>';
  _modal(h,'560px');
  document.getElementById('pf-x').addEventListener('click',_cm);
  document.getElementById('pf-cancel').addEventListener('click',_cm);
  document.getElementById('pf-save').addEventListener('click',function(){
    var maSP=document.getElementById('pf-masp').value.trim();
    var sl=Number(document.getElementById('pf-sl').value||0);
    if(!maSP||!sl){_toast('Nhap Ma SP va so luong','error');return;}
    var btn=document.getElementById('pf-save');btn.disabled=true;
    var apiF=_api();if(!apiF)return;
    var route=loai==='xuat'?'wh_create_phieu_xuat':'wh_create_phieu_nhap';
    apiF(route,{
      ma_sp:maSP,ten_sp:document.getElementById('pf-tensp').value,
      so_luong:sl,don_vi:document.getElementById('pf-dv').value,
      ly_do:loai==='xuat'?(document.getElementById('pf-ly')||{}).value:'',
      gia_von:loai==='nhap'?Number((document.getElementById('pf-gv')||{}).value||0):0,
      don_gia:loai==='nhap'?Number((document.getElementById('pf-gv')||{}).value||0):0,
      ma_po:loai==='nhap'?(document.getElementById('pf-po')||{}).value:''
    },function(e,d){
      btn.disabled=false;
      if(!e&&d&&d.ok){_toast((loai==='xuat'?'Xuat':'Nhap')+' kho thanh cong: '+(d.ma_phieu||''),'ok');_cm();_renderTab(STATE.tab);}
      else _toast((d&&d.error)||'Loi','error');
    });
  });
}
function _fld(id,l,t,v){return '<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">'+l+'</label><input id="'+id+'" type="'+t+'" value="'+_esc(String(v||''))+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"></div>';}
})();
