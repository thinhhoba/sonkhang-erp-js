// [v5.36] 22/03/2026 — sk-giao-hang-ui.js
// Module GIAO HÀNG — Kho vận (chuyển từ Ban hàng)
// Tab 1: Lệnh giao hàng | Tab 2: Google Maps + Tính phí | Tab 3: Hạch toán
(function(){
'use strict';
var _api  = function(){ return typeof window.api==='function'?window.api:null; };
var _ct   = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
var _esc  = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
var _fmt  = function(n){ n=Number(n||0); if(n>=1e6)return(n/1e6).toFixed(1)+'tr'; if(n>=1e3)return Math.round(n/1e3)+'k'; return String(Math.round(n)); };
var _fmtN = function(n){ return Number(n||0).toLocaleString('vi-VN'); };
var _toast= function(m,t){ if(typeof window.skToast==='function')window.skToast(m,t||'ok'); };

var GH = { tab:'delivery', config:null };

function loadGiaoHang(){
  var ct=_ct();if(!ct)return;
  GH.tab='delivery';
  ct.innerHTML='<div class="fade-in" style="padding:24px;">'
    +'<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:18px;">'
      +'<div>'
        +'<h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F69A; Giao hang</h1>'
        +'<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Lenh giao · Google Maps · Tinh phi · Hach toan chi phi KT</p>'
        +'<div id="gh-config-bar" style="margin-top:6px;"></div>'
      +'</div>'
      +'<button id="gh-new-btn" style="background:rgba(6,182,212,.12);border:1px solid rgba(6,182,212,.25);color:var(--cyan);border-radius:9px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2795; Tao lenh giao</button>'
    +'</div>'
    +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;background:var(--bg2);border-radius:12px;padding:5px;" id="gh-tabs">'
      +[['delivery','&#x1F69A; Lenh giao hang'],['maps','&#x1F5FA; Tinh phi van chuyen'],['cost','&#x1F4B0; Hach toan chi phi']].map(function(t,i){
        return '<button data-gh="'+t[0]+'" style="flex:1;min-width:100px;border-radius:9px;padding:8px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;border:none;'
          +(i===0?'background:var(--accent2);color:#fff;':'background:none;color:var(--text3);')+'">'+t[1]+'</button>';
      }).join('')
    +'</div>'
    +'<div id="gh-body"></div>'
  +'</div>';

  ct.querySelectorAll('[data-gh]').forEach(function(btn){
    btn.addEventListener('click',function(){
      ct.querySelectorAll('[data-gh]').forEach(function(b){ b.style.background='none'; b.style.color='var(--text3)'; });
      btn.style.background='var(--accent2)'; btn.style.color='#fff';
      GH.tab=btn.getAttribute('data-gh'); _ghRender(GH.tab);
    });
  });
  document.getElementById('gh-new-btn').addEventListener('click', _ghNewDelivery);
  _ghLoadConfig();
  _ghRender('delivery');
}

function _ghLoadConfig(){
  var apiF=_api();if(!apiF)return;
  apiF('delivery_get_config',{},function(e,d){
    if(e||!d||!d.ok) return;
    GH.config=d;
    var bar=document.getElementById('gh-config-bar'); if(!bar)return;
    var wh=d.warehouse||{};
    var hasKey=d.has_maps_key;
    bar.innerHTML='<div style="display:flex;align-items:center;gap:8px;font-size:11px;">'
      +'<span style="color:var(--text3);">&#x1F3ED; Kho: <strong style="color:var(--text);">'+_esc(wh.name||'')+'</strong></span>'
      +'<span style="color:var(--text3);">|</span>'
      +'<span style="background:'+(hasKey?'rgba(52,211,153,.12)':'rgba(248,113,113,.12)')+';color:'+(hasKey?'#34d399':'#f87171')+';border-radius:5px;padding:1px 8px;font-weight:700;">'
        +(hasKey?'&#x2705; Google Maps API':'&#x26A0; Chua co API Key (dang dung uoc tinh quan)')
      +'</span>'
    +'</div>';
  });
}

function _ghRender(t){
  if      (t==='delivery') _ghDeliveryList();
  else if (t==='maps')     _ghMapsCalc();
  else if (t==='cost')     _ghCostAccounting();
}

// ── Tab 1: Lệnh giao hàng ────────────────────────────────────────
function _ghDeliveryList(){
  var el=document.getElementById('gh-body');if(!el)return;
  el.innerHTML='<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">'
    +'<select id="gh-status" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:7px 10px;color:var(--text3);font-family:inherit;font-size:12px;">'
      +'<option value="">Tat ca</option>'
      +'<option value="cho_giao">Cho giao</option>'
      +'<option value="dang_giao">Dang giao</option>'
      +'<option value="da_giao">Da giao</option>'
      +'<option value="huy">Da huy</option>'
    +'</select>'
    +'<button id="gh-filter-btn" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Loc</button>'
  +'</div>'
  +'<div id="gh-dl-list"><div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div></div>';

  document.getElementById('gh-filter-btn').addEventListener('click', _ghLoadList);
  _ghLoadList();
}

function _ghLoadList(){
  var el=document.getElementById('gh-dl-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div>';
  var apiF=_api();if(!apiF)return;
  var status=(document.getElementById('gh-status')||{}).value||'';
  apiF('sales_get_deliveries',{status:status},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<p style="color:var(--red);">Loi tai danh sach</p>';return;}
    var rows=d.data||[];
    if(!rows.length){
      el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text3);">'
        +'<div style="font-size:32px;margin-bottom:10px;">&#x1F69A;</div>'
        +'<div style="font-size:14px;font-weight:700;">Chua co lenh giao hang</div>'
        +'<div style="margin-top:10px;">'
          +'<button onclick="window._ghNewDelivery()" style="background:var(--accent);border:none;color:#fff;border-radius:9px;padding:9px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tao lenh dau tien</button>'
        +'</div>'
      +'</div>';
      return;
    }
    var ST_CLR={cho_giao:'#fbbf24',dang_giao:'#06b6d4',da_giao:'#34d399',huy:'#f87171'};
    var ST_LBL={cho_giao:'Cho giao',dang_giao:'Dang giao',da_giao:'Da giao',huy:'Da huy'};
    el.innerHTML='<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:580px;">'
      +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma giao</th>'
        +'<th style="padding:8px 12px;text-align:left;">Ma don</th>'
        +'<th style="padding:8px 12px;text-align:left;">Dia chi giao</th>'
        +'<th style="padding:8px 12px;text-align:right;color:var(--cyan);">Phi VC</th>'
        +'<th style="padding:8px 12px;text-align:center;">Tai xe</th>'
        +'<th style="padding:8px 12px;text-align:center;">Trang thai</th>'
        +'<th style="padding:8px 12px;"></th>'
      +'</tr></thead><tbody>'
      +rows.map(function(r,ri){
        var stClr=ST_CLR[r.trang_thai]||'#64748b';
        var stLbl=ST_LBL[r.trang_thai]||r.trang_thai||'';
        return '<tr style="border-top:1px solid var(--border);">'
          +'<td style="padding:8px 12px;font-family:monospace;font-size:10px;color:var(--accent2);">'+_esc(r.id||r.ma_giao||'')+'</td>'
          +'<td style="padding:8px 12px;font-weight:700;color:var(--text);">'+_esc(r.don_id||'')+'</td>'
          +'<td style="padding:8px 12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text2);">'+_esc(r.dia_chi_giao||r.address||'')+'</td>'
          +'<td style="padding:8px 12px;text-align:right;color:var(--cyan);font-weight:700;">'+(r.phi_vc?_fmtN(r.phi_vc)+'d':'—')+'</td>'
          +'<td style="padding:8px 12px;text-align:center;font-size:11px;color:var(--text3);">'+_esc(r.tai_xe||'—')+'</td>'
          +'<td style="padding:8px 12px;text-align:center;">'
            +'<span style="background:'+stClr+'22;color:'+stClr+';border-radius:5px;padding:2px 8px;font-size:10px;font-weight:800;">'+stLbl+'</span>'
          +'</td>'
          +'<td style="padding:8px 12px;text-align:center;" id="gh-act-'+ri+'"></td>'
        +'</tr>';
      }).join('')
      +'</tbody></table></div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:6px;text-align:right;">'+rows.length+' lenh giao</div>';

    rows.forEach(function(r,ri){
      var td=document.getElementById('gh-act-'+ri);if(!td)return;
      if(r.trang_thai==='dang_giao'){
        var confirmBtn=document.createElement('button');
        confirmBtn.innerHTML='&#x2705; Xac nhan giao';
        confirmBtn.style.cssText='background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.25);color:#34d399;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:inherit;';
        confirmBtn.addEventListener('click',function(){
          var apiF2=_api();if(!apiF2)return;
          confirmBtn.disabled=true;
          apiF2('sales_confirm_delivery',{id:r.id||r.ma_giao},function(e2,d2){
            if(!e2&&d2&&d2.ok){ _toast('Da xac nhan giao hang','ok'); _ghLoadList(); }
            else{ confirmBtn.disabled=false; _toast((d2&&d2.error)||'Loi','error'); }
          });
        });
        td.appendChild(confirmBtn);
      }
      // Nút tính phí nhanh
      if((r.dia_chi_giao||r.address)&&!r.phi_vc){
        var feeBtn=document.createElement('button');
        feeBtn.innerHTML='&#x1F5FA;';
        feeBtn.title='Tinh phi van chuyen';
        feeBtn.style.cssText='background:rgba(6,182,212,.12);border:1px solid rgba(6,182,212,.25);color:var(--cyan);border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer;margin-left:4px;';
        feeBtn.addEventListener('click',(function(addr,maDon){ return function(){
          _ghCalcAndShow(addr, maDon);
        };})(r.dia_chi_giao||r.address, r.don_id));
        td.appendChild(feeBtn);
      }
    });
  });
}

// ── Tab 2: Google Maps tính phí ───────────────────────────────────
function _ghMapsCalc(){
  var el=document.getElementById('gh-body');if(!el)return;
  var wh=GH.config&&GH.config.warehouse||{};
  el.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">'
    +'<div>'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:14px;">'
        +'<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:12px;">&#x1F5FA; Tinh khoang cach + Phi van chuyen</div>'
        +'<div style="margin-bottom:10px;">'
          +'<label style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:4px;">Kho xuat phat</label>'
          +'<input type="text" id="gh-origin" value="'+_esc(wh.address||'')+'" '
            +'style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:8px 11px;font-size:12px;font-family:inherit;box-sizing:border-box;" readonly>'
        +'</div>'
        +'<div style="margin-bottom:10px;">'
          +'<label style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:4px;">Dia chi khach hang *</label>'
          +'<input type="text" id="gh-dest" placeholder="VD: 123 Cau Giay, Ha Noi..." '
            +'style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:8px 11px;font-size:12px;font-family:inherit;box-sizing:border-box;margin-bottom:8px;">'
          +'<input type="text" id="gh-ma-don" placeholder="Ma don hang (tuy chon)" '
            +'style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:8px 11px;font-size:12px;font-family:inherit;box-sizing:border-box;">'
        +'</div>'
        +'<button id="gh-calc-btn" style="width:100%;background:var(--accent2);border:none;color:#fff;border-radius:10px;padding:11px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">&#x1F5FA; Tinh khoang cach & Phi</button>'
      +'</div>'
      +'<div id="gh-maps-result"></div>'
    +'</div>'
    +'<div>'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;">'
        +'<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:12px;">&#x1F4CB; Bang phi van chuyen</div>'
        +(GH.config&&GH.config.fee_table
          ? '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
            +'<thead><tr style="background:var(--bg3);"><th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Khoang cach</th><th style="padding:7px 10px;text-align:right;font-size:10px;font-weight:800;color:var(--text3);">Phi VC</th></tr></thead><tbody>'
            +(GH.config.fee_table||[]).map(function(row,i){
              var prev=(i===0)?0:GH.config.fee_table[i-1].max_km;
              var range=(i===0?'≤2km':prev+'km → '+(row.max_km>500?'> 50km':row.max_km+'km'));
              return '<tr style="border-top:1px solid var(--border);">'
                +'<td style="padding:7px 10px;color:var(--text2);">'+range+'</td>'
                +'<td style="padding:7px 10px;text-align:right;font-weight:700;color:var(--cyan);">'
                  +(typeof row.fee==='number'?_fmtN(row.fee)+'d':row.fee)
                +'</td>'
              +'</tr>';
            }).join('')
            +'</tbody></table>'
          : '<div style="color:var(--text3);font-size:12px;">Dang tai bang phi...</div>'
        )
      +'</div>'
      +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;margin-top:12px;">'
        +'<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:8px;">&#x2139; Ghi chu</div>'
        +'<div style="font-size:12px;color:var(--text3);line-height:1.7;">'
          +(GH.config&&GH.config.has_maps_key
            ?'&#x2705; Google Maps API da ket noi.<br>Phi tinh theo duong thuc te (co the khac voi bang phi uoc tinh).'
            :'&#x26A0; Chua cai dat GOOGLE_MAPS_API_KEY.<br>Dang su dung uoc tinh theo quan/huyen.<br><br>De cai dat: GAS Editor → Project Settings → Script Properties → Them GOOGLE_MAPS_API_KEY'
          )
        +'</div>'
      +'</div>'
    +'</div>'
  +'</div>';

  document.getElementById('gh-calc-btn').addEventListener('click', function(){
    var dest=(document.getElementById('gh-dest')||{}).value||'';
    if(!dest.trim()){ _toast('Nhap dia chi khach hang','error'); return; }
    var maDon=(document.getElementById('gh-ma-don')||{}).value||'';
    _ghCalcAndShow(dest, maDon);
  });
  document.getElementById('gh-dest').addEventListener('keydown',function(e){
    if(e.key==='Enter'){ document.getElementById('gh-calc-btn').click(); }
  });
}

function _ghCalcAndShow(dest, maDon){
  var resEl=document.getElementById('gh-maps-result'); if(!resEl)return;
  var btn=document.getElementById('gh-calc-btn');
  if(btn){ btn.disabled=true; btn.textContent='Dang tinh...'; }
  resEl.innerHTML='<div style="text-align:center;padding:16px;color:var(--text3);">Dang ket noi Google Maps...</div>';

  var apiF=_api();if(!apiF)return;
  apiF('delivery_get_distance',{destination:dest},function(e,d){
    if(btn){ btn.disabled=false; btn.innerHTML='&#x1F5FA; Tinh khoang cach & Phi'; }
    if(e||!d||!d.ok){
      resEl.innerHTML='<div style="color:var(--red);padding:12px;background:rgba(239,68,68,.08);border-radius:10px;">Loi: '+(d&&d.error||'')+'</div>';
      return;
    }
    var isMatrix=d.method==='distance_matrix';
    resEl.innerHTML='<div style="background:rgba(6,182,212,.06);border:1px solid rgba(6,182,212,.2);border-radius:14px;padding:16px;">'
      +'<div style="font-size:11px;font-weight:800;color:var(--cyan);text-transform:uppercase;margin-bottom:12px;">Ket qua tinh phi</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">'
        +[
          {lbl:'Khoang cach', v:d.dist_text||d.dist_km+'km', clr:'#818cf8'},
          {lbl:'Thoi gian',   v:d.duration_text||(d.duration_min+'\''), clr:'#fbbf24'},
          {lbl:'Phi van chuyen', v:d.fee_text||_fmtN(d.fee)+'d', clr:'#06b6d4'},
          {lbl:'Phuong phap', v:isMatrix?'Distance Matrix':(d.method==='geocode_haversine'?'Geocode':'Uoc tinh quan'), clr:isMatrix?'#34d399':'#94a3b8'},
        ].map(function(k){
          return '<div style="background:var(--bg2);border-radius:9px;padding:10px;">'
            +'<div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:3px;">'+k.lbl+'</div>'
            +'<div style="font-size:16px;font-weight:900;color:'+k.clr+';font-family:monospace;">'+k.v+'</div>'
          +'</div>';
        }).join('')
      +'</div>'
      +'<div style="font-size:11px;color:var(--text3);margin-bottom:12px;">'
        +'Diem di: '+_esc(d.origin||'')+'<br>'
        +'Diem den: '+_esc(d.destination||dest)
      +'</div>'
      +(maDon
        ?'<div style="display:flex;gap:8px;">'
          +'<button id="gh-apply-fee" style="flex:1;background:var(--accent);border:none;color:#fff;border-radius:9px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4B0; Hach toan vao don '+_esc(maDon)+'</button>'
          +'<button id="gh-view-map" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:9px;padding:10px 14px;font-size:12px;cursor:pointer;font-family:inherit;">&#x1F5FA;</button>'
        +'</div>'
        :'<div style="display:flex;gap:8px;">'
          +'<input id="gh-apply-don" type="text" placeholder="Nhap ma don de hach toan..." style="flex:1;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:9px;padding:9px 12px;font-size:12px;font-family:inherit;">'
          +'<button id="gh-apply-fee" style="background:var(--accent);border:none;color:#fff;border-radius:9px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Hach toan</button>'
        +'</div>'
      )
    +'</div>';

    // Bind map button
    var mapBtn=resEl.querySelector('#gh-view-map');
    if(mapBtn){
      mapBtn.addEventListener('click',function(){
        var lat=d.lat||0; var lng=d.lng||0;
        if(lat&&lng) window.open('https://www.google.com/maps/dir/?api=1&origin='+d.origin+'&destination='+d.destination+'&travelmode=driving','_blank');
        else window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(dest),'_blank');
      });
    }

    // Bind hạch toán
    var applyBtn=resEl.querySelector('#gh-apply-fee');
    if(applyBtn){
      applyBtn.addEventListener('click',function(){
        var donId=maDon||(resEl.querySelector('#gh-apply-don')||{}).value||'';
        if(!donId){ _toast('Nhap ma don hang','error'); return; }
        _ghPostCost(donId, d.fee||0, d.dist_km||0);
      });
    }
  });
}

// ── Tab 3: Hạch toán chi phí ─────────────────────────────────────
function _ghCostAccounting(){
  var el=document.getElementById('gh-body');if(!el)return;
  el.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'
    // Form hạch toán thủ công
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;">'
      +'<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:12px;">&#x270F; Hach toan thu cong</div>'
      +[
        ['ct-ma-don','Ma don *','text',''],
        ['ct-so-tien','Phi van chuyen (d) *','number',''],
        ['ct-dist','Khoang cach (km)','number',''],
        ['ct-tk-no','TK No (chi phi)','text','641'],
        ['ct-tk-co','TK Co (tra tien)','text','111'],
      ].map(function(f){
        return '<div style="margin-bottom:8px;">'
          +'<label style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:3px;">'+f[1]+'</label>'
          +'<input id="'+f[0]+'" type="'+f[2]+'" value="'+f[3]+'" placeholder="'+f[1]+'" '
            +'style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:8px 10px;font-size:12px;font-family:inherit;box-sizing:border-box;">'
        +'</div>';
      }).join('')
      +'<div style="background:rgba(79,111,255,.06);border-radius:8px;padding:8px 10px;font-size:11px;color:var(--text3);margin-bottom:10px;">'
        +'But toan: No TK 641 (Chi phi BH) / Co TK 111 (Tien mat)<br>'
        +'Thay TK 111 bang 331 neu tra cham (cong no NCC)'
      +'</div>'
      +'<button id="ct-save" style="width:100%;background:var(--accent);border:none;color:#fff;border-radius:10px;padding:11px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">&#x1F4B0; Ghi hach toan</button>'
    +'</div>'
    // Lịch sử hạch toán
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;">'
      +'<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:12px;">&#x1F4CB; Lich su chi phi van chuyen</div>'
      +'<div id="ct-history"><div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div></div>'
    +'</div>'
  +'</div>';

  document.getElementById('ct-save').addEventListener('click', function(){
    var btn=document.getElementById('ct-save');
    var maDon=(document.getElementById('ct-ma-don')||{}).value||'';
    var soTien=Number((document.getElementById('ct-so-tien')||{}).value||0);
    var dist=Number((document.getElementById('ct-dist')||{}).value||0);
    var tkNo=(document.getElementById('ct-tk-no')||{}).value||'641';
    var tkCo=(document.getElementById('ct-tk-co')||{}).value||'111';
    if(!maDon||soTien<=0){ _toast('Nhap ma don va so tien','error'); return; }
    btn.disabled=true; btn.textContent='Dang ghi...';
    _ghPostCost(maDon, soTien, dist, tkNo, tkCo, function(){
      btn.disabled=false; btn.innerHTML='&#x1F4B0; Ghi hach toan';
    });
  });
  _ghLoadCostHistory();
}

function _ghPostCost(maDon, fee, distKm, tkNo, tkCo, cb){
  var apiF=_api();if(!apiF)return;
  apiF('delivery_post_cost',{
    ma_don    : maDon,
    so_tien   : fee,
    dist_km   : distKm||0,
    tk_no     : tkNo||'641',
    tk_co     : tkCo||'111',
    dien_giai : 'Chi phi van chuyen don ' + maDon,
  },function(e,d){
    if(!e&&d&&d.ok){
      _toast(d.msg||'Da hach toan chi phi van chuyen','ok');
      _ghLoadCostHistory();
    } else {
      _toast((d&&d.error)||'Loi hach toan','error');
    }
    if(cb) cb();
  });
}

function _ghLoadCostHistory(){
  var el=document.getElementById('ct-history');if(!el)return;
  var apiF=_api();if(!apiF)return;
  // Lấy từ sổ quỹ (phiếu chi vận chuyển)
  apiF('fin_get_so_quy',{loai:'chi',q:'van chuyen',limit:20},function(e,d){
    var rows=(!e&&d&&d.ok)?d.data:[];
    if(!rows.length){el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Chua co lich su hach toan.</div>';return;}
    el.innerHTML='<div style="display:flex;flex-direction:column;gap:6px;">'
      +rows.slice(0,10).map(function(r){
        return '<div style="background:var(--bg3);border-radius:9px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;">'
          +'<div>'
            +'<div style="font-size:12px;font-weight:700;color:var(--text);">'+_esc(r.dien_giai||'')+'</div>'
            +'<div style="font-size:10px;color:var(--text3);">'+_esc(r.ngay||'')+' · Ref: '+_esc(r.ma_ref||'')+'</div>'
          +'</div>'
          +'<div style="font-size:14px;font-weight:900;color:#f87171;font-family:monospace;">-'+_fmtN(r.so_tien||0)+'d</div>'
        +'</div>';
      }).join('')
    +'</div>'
    +'<div style="font-size:11px;color:var(--text3);margin-top:6px;text-align:right;">'
      +'Tong chi phi VC: <strong style="color:#f87171;">'+_fmtN(rows.reduce(function(a,r){return a+Number(r.so_tien||0);},0))+'d</strong>'
    +'</div>';
  });
}

// ── Tạo lệnh giao mới ─────────────────────────────────────────────
window._ghNewDelivery = function(){
  var ov=document.createElement('div'); ov.id='gh-new-ov';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  var box=document.createElement('div');
  box.style.cssText='background:var(--bg2);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:500px;';
  box.innerHTML='<div style="padding:16px 20px;border-bottom:1px solid var(--border);font-size:14px;font-weight:900;">&#x1F69A; Tao lenh giao hang</div>'
    +'<div style="padding:20px;">'
      +[
        ['ndl-don','Ma don hang *','text',''],
        ['ndl-dia-chi','Dia chi giao *','text',''],
        ['ndl-tai-xe','Tai xe','text',''],
        ['ndl-ghi-chu','Ghi chu','text',''],
      ].map(function(f){
        return '<div style="margin-bottom:10px;">'
          +'<label style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:4px;">'+f[1]+'</label>'
          +'<input id="'+f[0]+'" type="'+f[2]+'" value="'+f[3]+'" placeholder="'+f[1]+'" '
            +'style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:8px 10px;font-size:12px;font-family:inherit;box-sizing:border-box;">'
        +'</div>';
      }).join('')
      +'<div id="ndl-fee-preview" style="margin-bottom:12px;"></div>'
      +'<div style="display:flex;gap:8px;">'
        +'<button id="ndl-calc-fee" style="background:rgba(6,182,212,.12);border:1px solid rgba(6,182,212,.25);color:var(--cyan);border-radius:9px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F5FA; Tinh phi</button>'
        +'<button id="ndl-save" style="flex:1;background:var(--accent);border:none;color:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Tao lenh giao</button>'
        +'<button id="ndl-cancel" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:10px;padding:10px 16px;cursor:pointer;font-family:inherit;">Huy</button>'
      +'</div>'
    +'</div>';
  ov.appendChild(box); document.body.appendChild(ov);
  box.querySelector('#ndl-cancel').addEventListener('click',function(){ov.remove();});

  var _calcFee = function(){
    var addr=(box.querySelector('#ndl-dia-chi')||{}).value||'';
    if(!addr){ _toast('Nhap dia chi truoc','error'); return; }
    var prev=box.querySelector('#ndl-fee-preview');
    if(prev) prev.innerHTML='<div style="color:var(--text3);font-size:11px;">Dang tinh...</div>';
    var apiF=_api();if(!apiF)return;
    apiF('delivery_get_distance',{destination:addr},function(e,d){
      if(!prev)return;
      if(!e&&d&&d.ok){
        prev.innerHTML='<div style="background:rgba(6,182,212,.08);border:1px solid rgba(6,182,212,.2);border-radius:9px;padding:10px;font-size:12px;">'
          +'&#x1F5FA; <strong>'+d.dist_text+'</strong> &nbsp;|&nbsp; Phi: <strong style="color:var(--cyan);">'+d.fee_text+'</strong>'
          +' &nbsp;<span style="color:var(--text3);font-size:10px;">('+d.method+')</span>'
        +'</div>';
        box.querySelector('#ndl-save').setAttribute('data-fee', String(d.fee||0));
        box.querySelector('#ndl-save').setAttribute('data-dist', String(d.dist_km||0));
      } else {
        prev.innerHTML='<div style="color:var(--red);font-size:11px;">Loi tinh phi: '+(d&&d.error||'')+'</div>';
      }
    });
  };
  box.querySelector('#ndl-calc-fee').addEventListener('click', _calcFee);

  box.querySelector('#ndl-save').addEventListener('click',function(){
    var btn=box.querySelector('#ndl-save');
    var donId=(box.querySelector('#ndl-don')||{}).value||'';
    var diaChiGiao=(box.querySelector('#ndl-dia-chi')||{}).value||'';
    var taiXe=(box.querySelector('#ndl-tai-xe')||{}).value||'';
    var ghiChu=(box.querySelector('#ndl-ghi-chu')||{}).value||'';
    var fee=Number(btn.getAttribute('data-fee')||0);
    var dist=Number(btn.getAttribute('data-dist')||0);
    if(!donId||!diaChiGiao){ _toast('Nhap day du thong tin *','error'); return; }
    btn.disabled=true; btn.textContent='Dang tao...';
    var apiF=_api();if(!apiF)return;
    apiF('sales_create_delivery',{
      don_id:donId, dia_chi_giao:diaChiGiao,
      tai_xe:taiXe, ghi_chu:ghiChu,
      phi_vc:fee, dist_km:dist,
    },function(e,d){
      if(!e&&d&&d.ok){
        ov.remove();
        _toast('Da tao lenh giao hang','ok');
        // Tự động hạch toán nếu có phí
        if(fee>0) _ghPostCost(donId, fee, dist);
        _ghLoadList();
      } else {
        btn.disabled=false; btn.innerHTML='Tao lenh giao';
        _toast((d&&d.error)||'Loi','error');
      }
    });
  });
};

window.loadGiaoHang  = loadGiaoHang;
window.loadGiaoHangKV= loadGiaoHang;

}());
