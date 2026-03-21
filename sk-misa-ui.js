/* ================================================================
 * sk-misa-ui.js  SonKhang ERP v5.11.0
 * Module Hoa don VAT — Sapo → ERP → Misa
 * Luong: Upload DM Misa → Mapping → Tao HD nhap 2 che do → Xuat Excel
 * 0 non-ASCII, DOM API
 * ================================================================ */
(function(){
'use strict';
var _api  = function(){ return typeof window.api==='function'?window.api:null; };
var _ct   = function(){ var c=typeof window.getContent==='function'?window.getContent():null; return c||document.getElementById('sk-ct'); };
var _esc  = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
var _fmt  = function(n){ return (Number(n)||0).toLocaleString('vi-VN'); };
var _toast= function(m,t){ if(typeof window.skToast==='function')window.skToast(m,t||'ok'); };
var C = {
  accent:['rgba(79,111,255,.15)','rgba(79,111,255,.3)','var(--accent2)'],
  green :['rgba(0,214,143,.15)','rgba(0,214,143,.3)','var(--green)'],
  red   :['rgba(255,77,109,.15)','rgba(255,77,109,.3)','var(--red)'],
  yellow:['rgba(251,191,36,.12)','rgba(251,191,36,.3)','var(--yellow)'],
  cyan  :['rgba(0,182,255,.1)','rgba(0,182,255,.2)','var(--cyan)'],
  purple:['rgba(167,139,250,.15)','rgba(167,139,250,.3)','#a78bfa'],
};
function bg(k){ return 'background:'+C[k][0]+';border:1px solid '+C[k][1]+';color:'+C[k][2]+';'; }

// ── Helpers ───────────────────────────────────────────────────────
var STATE = { tab:'setup' };
function _modal(html,mw){
  var old=document.getElementById('sk-misa-modal');
  if(old&&old.parentNode)old.parentNode.removeChild(old);
  var ov=document.createElement('div');ov.id='sk-misa-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;';
  var box=document.createElement('div');
  box.style.cssText='background:var(--bg2);border:1px solid var(--border2);border-radius:18px;width:100%;max-width:'+(mw||'720px')+';margin:auto;';
  box.innerHTML=html;ov.appendChild(box);
  ov.addEventListener('click',function(e){if(e.target===ov)_cm();});
  document.body.appendChild(ov);
}
function _cm(){var m=document.getElementById('sk-misa-modal');if(m&&m.parentNode)m.parentNode.removeChild(m);}
function _inp(id,label,type,val,ph){
  return '<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:5px;">'+label+'</label>'
    +'<input id="'+id+'" type="'+(type||'text')+'" value="'+_esc(String(val===undefined?'':val))+'" placeholder="'+_esc(ph||'')+'"'
    +' style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box;"></div>';
}
function _sel(id,label,opts,val){
  return '<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:5px;">'+label+'</label>'
    +'<select id="'+id+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
    +opts.map(function(o){return '<option value="'+_esc(o[0])+'"'+(o[0]==val?' selected':'')+'>'+_esc(o[1])+'</option>';}).join('')
    +'</select></div>';
}
function _badge(text,k){ return '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;'+bg(k)+'">'+text+'</span>'; }
function _card(icon,label,val,k,sub){
  return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;gap:10px;align-items:center;">'
    +'<div style="font-size:22px;">'+icon+'</div>'
    +'<div><div style="font-size:18px;font-weight:900;color:'+C[k][2]+';">'+val+'</div>'
    +'<div style="font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);">'+label+'</div>'
    +(sub?'<div style="font-size:10px;color:var(--text3);">'+sub+'</div>':'')
    +'</div></div>';
}
function _btnStyle(k,label,id,extra){
  return '<button id="'+(id||'')+'" style="'+bg(k)+'border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;'+(extra||'')+'">'+label+'</button>';
}

// ════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════
function loadHoaDonVAT(){
  var ct=_ct();if(!ct)return;
  var TABS=[['setup','&#x2699; Thiet lap'],['mapping','&#x1F517; Mapping SP'],['draft','&#x1F4DD; Tao HD nhap'],['list','&#x1F4CB; Danh sach HD'],['export','&#x1F4E4; Xuat Excel']];

  ct.innerHTML='<div class="fade-in" style="padding:24px;">'
    +'<div style="margin-bottom:18px;">'
    +'<h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F9FE; Hoa don VAT</h1>'
    +'<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Sapo &#x2192; ERP &#x2192; Misa AMIS | Upload DM &#x2192; Mapping &#x2192; HD nhap &#x2192; Xuat Excel</p>'
    +'</div>'
    +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;">'
    +TABS.map(function(t,i){
      return '<button data-t="'+t[0]+'" style="border-radius:8px;padding:7px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;'
        +(i===0?bg('accent'):' background:var(--bg3);border:1px solid var(--border2);color:var(--text3);')+'">'+t[1]+'</button>';
    }).join('')
    +'</div>'
    +'<div id="misa-body"></div></div>';

  ct.querySelectorAll('[data-t]').forEach(function(btn){
    btn.addEventListener('click',function(){
      STATE.tab=btn.getAttribute('data-t');
      ct.querySelectorAll('[data-t]').forEach(function(b){
        b.style.cssText='border-radius:8px;padding:7px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;background:var(--bg3);border:1px solid var(--border2);color:var(--text3);';
      });
      btn.style.cssText='border-radius:8px;padding:7px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;'+bg('accent');
      _renderTab(STATE.tab);
    });
  });
  _renderTab('setup');
}
function _renderTab(t){
  if(t==='setup')   _renderSetup();
  else if(t==='mapping') _renderMapping();
  else if(t==='draft')   _renderDraft();
  else if(t==='list')    _renderList();
  else if(t==='export')  _renderExport();
}
window.loadHoaDonVAT=loadHoaDonVAT;
window.loadMisaVAT=loadHoaDonVAT;

// Load SheetJS
(function(){if(typeof XLSX!=='undefined')return;var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';document.head.appendChild(s);})();

// ════════════════════════════════════════════════════════════════
// TAB 1: THIẾT LẬP — Upload danh mục + tồn kho Misa
// ════════════════════════════════════════════════════════════════
function _renderSetup(){
  var el=document.getElementById('misa-body');if(!el)return;
  el.innerHTML='<div id="setup-stats" style="margin-bottom:16px;"></div>'
    // Upload danh mục
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:12px;">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">'
        +'<div>'
          +'<div style="font-size:14px;font-weight:900;margin-bottom:4px;">&#x1F4CB; Buoc 1 — Upload danh muc hang hoa Misa</div>'
          +'<div style="font-size:11px;color:var(--text3);">File: Danh_sach_hang_hoa_dich_vu.xlsx tu Misa (muc Danh muc → Hang hoa dich vu → Xuat Excel)</div>'
        +'</div>'
        +_btnStyle('cyan','&#x2B06; Chon file danh muc','dm-upload-btn')
      +'</div>'
      +'<input id="dm-file" type="file" accept=".xlsx,.xls" style="display:none;">'
      +'<div id="dm-status" style="font-size:11px;color:var(--text3);">Chua upload. ERP can danh muc Misa de thuc hien mapping.</div>'
    +'</div>'
    // Upload tồn kho
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:18px;">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">'
        +'<div>'
          +'<div style="font-size:14px;font-weight:900;margin-bottom:4px;">&#x1F4E6; Buoc 2 — Upload ton kho Misa (tuy chon)</div>'
          +'<div style="font-size:11px;color:var(--text3);">File: Bao cao tong hop nhap xuat ton. ERP dung de kiem tra khi tao HD nhap (chi tao HD cho SP con ton > 0)</div>'
        +'</div>'
        +_btnStyle('yellow','&#x2B06; Chon file ton kho','tk-upload-btn')
      +'</div>'
      +'<input id="tk-file" type="file" accept=".xlsx,.xls" style="display:none;">'
      +'<div id="tk-status" style="font-size:11px;color:var(--text3);">Chua upload. Neu khong co ton kho, ERP se cho phep tat ca SP da mapping vao HD.</div>'
    +'</div>';

  // Events
  document.getElementById('dm-upload-btn').addEventListener('click',function(){ document.getElementById('dm-file').click(); });
  document.getElementById('dm-file').addEventListener('change',function(e){ var f=e.target.files[0];if(f){_parseDanhMucFile(f);this.value='';} });
  document.getElementById('tk-upload-btn').addEventListener('click',function(){ document.getElementById('tk-file').click(); });
  document.getElementById('tk-file').addEventListener('change',function(e){ var f=e.target.files[0];if(f){_parseTonKhoMisa(f);this.value='';} });

  _loadSetupStats();
}

function _loadSetupStats(){
  var el=document.getElementById('setup-stats');if(!el)return;
  var apiF=_api();if(!apiF)return;
  apiF('misa_get_stats',{},function(e,d){
    if(e||!d||!d.ok)return;
    var m=d.mapping||{}, t=d.ton_kho||{}, h=d.hoa_don||{};
    el.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:4px;">'
      +_card('&#x1F4CB;','DM Misa',m.total||0,'cyan','ma hang')
      +_card('&#x1F517;','Da mapping',m.active||0,'green','SP Sapo↔Misa')
      +_card('&#x1F4E6;','Ky ton kho',t.ky_moi_nhat||'Chua co','yellow','')
      +_card('&#x1F4DD;','HD nhap',h.nhap||0,'purple','cho xuat')
      +'</div>';
  });
}

// Parse file danh mục Misa
function _parseDanhMucFile(file){
  // Kiem tra SheetJS da load chua, neu chua thi doi 2s roi retry
  if(typeof XLSX==='undefined'){
    _toast('Dang tai thu vien Excel, vui long thu lai sau 3 giay...','ok');
    setTimeout(function(){ _parseDanhMucFile(file); }, 3000);
    return;
  }
  var sEl=document.getElementById('dm-status');
  if(sEl) sEl.innerHTML='<span style="color:var(--cyan);">Dang doc file "'+file.name+'"...</span>';
  _toast('Dang doc file danh muc...','ok');

  var rd=new FileReader();
  rd.onerror=function(){ _toast('Khong the doc file. Thu lai.','error'); };
  rd.onload=function(ev){
    try{
      var wb=XLSX.read(ev.target.result,{type:'binary'});
      var ws=wb.Sheets[wb.SheetNames[0]];
      var raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});

      // File Misa: "DANH SACH HANG HOA, DICH VU"
      // Row 0 = title, Row 1 = blank, Row 2 = header, Row 3+ = data
      // Auto-detect: tim dong dau tien co "Ma" + "Ten" + "DVT" trong cac cols
      var dataStart = 3; // default Misa
      var colMa=1, colTen=2, colDvt=3, colSau=4; // default

      for(var ri=0; ri<Math.min(raw.length,8); ri++){
        var row=raw[ri];
        var joined=row.map(function(c){return String(c||'').toLowerCase();}).join('|');
        if(joined.indexOf('ma')>=0 && joined.indexOf('ten')>=0){
          // Tim cols
          for(var ci=0; ci<row.length; ci++){
            var h=String(row[ci]||'').toLowerCase().trim();
            if(h==='ma'||h==='ma hang'||h==='ma han') colMa=ci;
            else if(h==='ten'||h==='ten hang'||h==='ten san pham') colTen=ci;
            else if(h==='dvt'||h==='don vi'||h==='don vi tinh') colDvt=ci;
            else if(h.indexOf('sau')>=0||h.indexOf('thue')>=0) colSau=ci;
          }
          dataStart=ri+1;
          break;
        }
      }

      var rows=[];
      for(var ri2=dataStart; ri2<raw.length; ri2++){
        var r=raw[ri2];
        var ma=String(r[colMa]||'').trim();
        if(!ma||ma==='nan'||/^(ma|stt)/i.test(ma)) continue;
        if(/^t.{0,4}ng/i.test(ma)) continue; // skip tong cong
        rows.push({
          ma      : ma,
          ten     : String(r[colTen]||'').trim(),
          dvt     : String(r[colDvt]||'cai').trim()||'cai',
          sau_thue: String(r[colSau]||'').trim()
        });
      }

      if(!rows.length){
        var msg='Khong doc duoc du lieu ('+raw.length+' dong). File co the bi bao ve hoac dinh dang khac.';
        _toast(msg,'error');
        if(sEl) sEl.innerHTML='<span style="color:var(--red);">&#x274C; '+msg+'</span>';
        return;
      }

      var preview=rows.slice(0,2).map(function(r2){return r2.ma+'|'+r2.ten.substr(0,15);}).join(', ');
      if(sEl) sEl.innerHTML='<span style="color:var(--cyan);">Doc duoc '+rows.length+' hang hoa ('+preview+'...). Dang luu...</span>';

      _api()('misa_import_danh_muc',{rows:rows,replace:true},function(e,d){
        if(!e&&d&&d.ok){
          _toast(d.msg,'ok');
          if(sEl) sEl.innerHTML='<span style="color:var(--green);font-weight:700;">&#x2705; '+d.msg+'</span>';
          _loadSetupStats();
        } else {
          var err=(d&&d.error)||'Loi server';
          _toast('Loi: '+err,'error');
          if(sEl) sEl.innerHTML='<span style="color:var(--red);">&#x274C; '+err+'</span>';
        }
      });
    }catch(parseErr){
      var msg='Loi doc file: '+parseErr.message;
      _toast(msg,'error');
      if(sEl) sEl.innerHTML='<span style="color:var(--red);">&#x274C; '+msg+'</span>';
    }
  };
  rd.readAsBinaryString(file);
}

// Parse file tồn kho Misa (đã có từ v5.10, tái dùng logic)
function _parseTonKhoMisa(file){
  if(typeof XLSX==='undefined'){
    _toast('Dang tai thu vien Excel, thu lai sau 3 giay...','ok');
    setTimeout(function(){ _parseTonKhoMisa(file); }, 3000);
    return;
  }
  var sEl=document.getElementById('tk-status');
  if(sEl) sEl.innerHTML='<span style="color:var(--cyan);">Dang doc file ton kho "'+file.name+'"...</span>';
  _toast('Dang doc file ton kho...','ok');

  var rd=new FileReader();
  rd.onerror=function(){ _toast('Khong the doc file.','error'); };
  rd.onload=function(ev){
    try{
      var wb=XLSX.read(ev.target.result,{type:'binary'});
      var ws=wb.Sheets[wb.SheetNames[0]];
      // raw:true de giu nguyen so (tranh SheetJS format number -> string)
      var raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});

      if(!raw||!raw.length){ _toast('File trong hoac khong doc duoc.','error'); return; }

      // ── Detect ngay tu dong 1 (Kho: ... Ngay DD thang MM nam YYYY) ─
      var ngay='';
      for(var ti=0;ti<Math.min(raw.length,3);ti++){
        var firstCell=String((raw[ti]||[])[0]||'');
        // Match: "Ngay 21 thang 3 nam 2026" (co dau hoac khong dau)
        var m1=firstCell.match(/[Nn]g.{1,3}y\s+(\d{1,2})\s+th.{1,4}ng\s+(\d{1,2})\s+n.{1,3}m\s+(\d{4})/);
        var m2=firstCell.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if(m1){ ngay=m1[1]+'/'+m1[2]+'/'+m1[3]; break; }
        if(m2){ ngay=m2[1]+'/'+m2[2]+'/'+m2[3]; break; }
      }
      if(!ngay) ngay=new Date().toLocaleDateString('vi-VN');

      // ── Detect dong bat dau data ─────────────────────────────────
      // File Misa Tong hop ton kho:
      //   Row 0: "TONG HOP TON KHO" (co the co dau hoac khong)
      //   Row 1: "Kho: ... Ngay..."
      //   Row 2: blank
      //   Row 3: group header (Ten kho | Ma hang | Ten hang | DVT | Dau ky | Nhap | Xuat | Cuoi)
      //   Row 4: sub-header (So luong | Gia tri x4)
      //   Row 5+: data
      // Cols: 0=TenKho, 1=MaHang, 2=TenHang, 3=DVT,
      //        4=DauSL, 5=DauGT, 6=NhapSL, 7=NhapGT, 8=XuatSL, 9=XuatGT, 10=CuoiSL, 11=CuoiGT
      var dataStart=5;
      var colMa=1, colTen=2, colDvt=3, colDau=4, colNhap=6, colXuat=8, colCuoi=10, colCuoiGT=11;

      // Auto-detect: tim dong co "Ma hang" o col nao do
      for(var ri=0;ri<Math.min(raw.length,10);ri++){
        var rowStr=raw[ri].map(function(c){return String(c||'').toLowerCase();}).join('|');
        if(rowStr.indexOf('ma hang')>=0 || rowStr.indexOf('mã hàng')>=0
           || rowStr.indexOf('ma\u0020hang')>=0){
          // Tim chinh xac col
          for(var ci=0;ci<raw[ri].length;ci++){
            var hh=String(raw[ri][ci]||'').toLowerCase().trim();
            if(hh==='ma hang'||hh==='m\xe3 h\xe0ng'||hh==='ma\u0020hang') colMa=ci;
            else if(hh==='ten hang'||hh==='t\xean h\xe0ng') colTen=ci;
            else if(hh==='dvt'||hh==='\u0111vt') colDvt=ci;
          }
          dataStart=ri+2; // sau 2-row header
          break;
        }
      }

      var rows=[];
      for(var di=dataStart;di<raw.length;di++){
        var r=raw[di];
        if(!r||!r.length) continue;
        var ma=String(r[colMa]||'').trim();
        if(!ma||/^t.{0,5}ng/i.test(ma)) continue;
        var cuoiSL=Number(r[colCuoi])||0;
        var cuoiGT=Number(r[colCuoiGT])||0;
        rows.push({
          ma_hang  : ma,
          ten_hang : String(r[colTen]||'').trim(),
          dvt      : String(r[colDvt]||'cai').trim()||'cai',
          ton_dau  : Number(r[colDau])||0,
          nhap_ky  : Number(r[colNhap])||0,
          xuat_ky  : Number(r[colXuat])||0,
          ton_cuoi : cuoiSL,
          gia_von  : cuoiSL>0 ? Math.round(cuoiGT/cuoiSL) : 0,
        });
      }

      if(!rows.length){
        var msg2='Khong doc duoc SP nao ('+raw.length+' dong, start='+dataStart+'). Kiem tra file.';
        _toast(msg2,'error');
        if(sEl) sEl.innerHTML='<span style="color:var(--red);">&#x274C; '+msg2+'</span>';
        return;
      }

      var sample=rows.slice(0,2).map(function(x){return x.ma_hang+'('+x.ton_cuoi+')';}).join(', ');
      if(sEl) sEl.innerHTML='<span style="color:var(--cyan);">Doc duoc '+rows.length+' ma hang, ky '+ngay+'. Dang luu...</span>';
      _toast('Doc duoc '+rows.length+' SP. Dang luu...','ok');

      _api()('misa_import_ton_kho',{data:rows,ngay_bao_cao:ngay,replace:true},function(e,d){
        if(!e&&d&&d.ok){
          _toast(d.msg,'ok');
          if(sEl) sEl.innerHTML='<span style="color:var(--green);font-weight:700;">&#x2705; '+d.msg+'</span>';
          _loadSetupStats();
        } else {
          var err2=(d&&d.error)||'Loi server';
          _toast('Loi: '+err2,'error');
          if(sEl) sEl.innerHTML='<span style="color:var(--red);">&#x274C; '+err2+'</span>';
        }
      });
    }catch(parseErr2){
      var msg3='Loi doc file: '+parseErr2.message;
      _toast(msg3,'error');
      if(sEl) sEl.innerHTML='<span style="color:var(--red);">&#x274C; '+msg3+'</span>';
    }
  };
  rd.readAsBinaryString(file);
}

// ════════════════════════════════════════════════════════════════
// TAB 2: MAPPING — Misa SP ↔ Sapo SP
// ════════════════════════════════════════════════════════════════
function _renderMapping(){
  var el=document.getElementById('misa-body');if(!el)return;
  el.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
    +'<input id="map-q" type="text" placeholder="Tim ma Misa, ten hang, SKU Sapo..." style="flex:1;min-width:200px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<button id="map-filter-all" style="'+bg('accent')+'border-radius:8px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Tat ca</button>'
    +'<button id="map-filter-mapped" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Da mapping</button>'
    +'<button id="map-filter-unmapped" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Chua mapping</button>'
    +'</div>'
    +'<div id="map-list"><div style="text-align:center;padding:32px;color:var(--text3);">Dang tai...</div></div>';

  var mapFilter={only_mapped:false,only_unmapped:false};

  function filterBtn(btn,k){
    document.querySelectorAll('#map-filter-all,#map-filter-mapped,#map-filter-unmapped').forEach(function(b){
      b.style.cssText='background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;';
    });
    btn.style.cssText=bg('accent')+'border-radius:8px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;';
    mapFilter.only_mapped   = k==='mapped';
    mapFilter.only_unmapped = k==='unmapped';
    _loadMappingList(mapFilter);
  }
  document.getElementById('map-filter-all').addEventListener('click',function(){ filterBtn(this,'all'); });
  document.getElementById('map-filter-mapped').addEventListener('click',function(){ filterBtn(this,'mapped'); });
  document.getElementById('map-filter-unmapped').addEventListener('click',function(){ filterBtn(this,'unmapped'); });
  document.getElementById('map-q').addEventListener('keydown',function(e){ if(e.keyCode===13) _loadMappingList(Object.assign({},mapFilter,{q:this.value})); });

  _loadMappingList({});
}

function _loadMappingList(opts){
  var el=document.getElementById('map-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Dang tai...</div>';
  var apiF=_api();if(!apiF)return;
  apiF('misa_get_danh_muc_full',Object.assign({q:(document.getElementById('map-q')||{}).value||'',limit:100},opts),function(e,d){
    if(e||!d||!d.ok){
      if(d&&d.error&&d.error.indexOf('Chua co')>=0){
        el.innerHTML='<div style="text-align:center;padding:48px;">'
          +'<div style="font-size:32px;margin-bottom:12px;">&#x1F4CB;</div>'
          +'<div style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:8px;">Chua co danh muc Misa</div>'
          +'<div style="font-size:12px;color:var(--text3);max-width:360px;margin:0 auto 16px;">Vao tab "Thiet lap" &#x2192; Upload file danh sach hang hoa Misa truoc</div>'
          +'<button id="goto-setup" style="'+bg('cyan')+'border-radius:8px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2192; Di den Thiet lap</button>'
        +'</div>';
        var gs=document.getElementById('goto-setup');
        if(gs) gs.addEventListener('click',function(){ document.querySelector('[data-t="setup"]').click(); });
      } else {
        el.innerHTML='<div style="color:var(--red);padding:16px;">Loi: '+_esc((d&&d.error)||'')+'</div>';
      }
      return;
    }
    var rows=d.data||[];
    var mapped=d.total_mapped||0, totalMisa=d.total_misa||0;

    // Stats
    var statsHtml='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">'
      +'<div style="'+bg('cyan')+'border-radius:8px;padding:6px 12px;font-size:12px;">DM Misa: <strong>'+totalMisa+'</strong></div>'
      +'<div style="'+bg('green')+'border-radius:8px;padding:6px 12px;font-size:12px;">Da mapping: <strong>'+mapped+'</strong></div>'
      +'<div style="'+bg('yellow')+'border-radius:8px;padding:6px 12px;font-size:12px;">Chua mapping: <strong>'+(totalMisa-mapped)+'</strong></div>'
    +'</div>';

    if(!rows.length){
      el.innerHTML=statsHtml+'<div style="text-align:center;padding:32px;color:var(--text3);">Khong co ket qua</div>';
      return;
    }

    var tbl='<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:900px;">'
      +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--green);">Ma hang Misa</th>'
        +'<th style="padding:9px 12px;text-align:left;color:var(--green);">Ten hang Misa</th>'
        +'<th style="padding:9px 12px;text-align:center;color:var(--green);">DVT</th>'
        +'<th style="padding:9px 12px;text-align:right;color:var(--green);">Ton kho</th>'
        +'<th style="padding:9px 12px;text-align:center;color:var(--text3);">&#x2194;</th>'
        +'<th style="padding:9px 12px;text-align:left;color:'+C.cyan[2]+';">SKU Sapo</th>'
        +'<th style="padding:9px 12px;text-align:left;color:'+C.cyan[2]+';">Ten SP Sapo</th>'
        +'<th style="padding:9px 12px;text-align:right;">Don gia</th>'
        +'<th style="padding:9px 12px;text-align:center;">VAT</th>'
        +'<th style="padding:9px 12px;width:70px;"></th>'
      +'</tr></thead><tbody>';

    rows.forEach(function(r,ri){
      var ev=ri%2===0?'var(--bg2)':'var(--bg3)';
      var tc=r.ton_kho<0?'var(--text3)':r.ton_kho===0?'var(--red)':r.ton_kho<10?'var(--yellow)':'var(--green)';
      var tv=r.ton_kho<0?'N/A':_fmt(r.ton_kho);
      tbl+='<tr style="border-top:1px solid var(--border);background:'+ev+';">'
        +'<td style="padding:8px 12px;font-family:monospace;font-size:11px;font-weight:700;color:var(--green);">'+_esc(r.misa_ma)+'</td>'
        +'<td style="padding:8px 12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+_esc(r.misa_ten||'')+'">'+_esc(r.misa_ten||'')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;color:var(--text3);">'+_esc(r.dvt||'')+'</td>'
        +'<td style="padding:8px 12px;text-align:right;font-weight:700;color:'+tc+';">'+tv+'</td>'
        +'<td style="padding:8px 12px;text-align:center;">'+(r.is_mapped?'<span style="color:var(--green);">&#x2714;</span>':'<span style="color:var(--text3);">—</span>')+'</td>'
        +'<td style="padding:8px 12px;font-family:monospace;font-size:11px;color:'+C.cyan[2]+';font-weight:700;">'+(r.sapo_sku?_esc(r.sapo_sku):'<span style="color:var(--text3);font-style:italic;">chua mapping</span>')+'</td>'
        +'<td style="padding:8px 12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(r.sapo_ten||'')+'</td>'
        +'<td style="padding:8px 12px;text-align:right;">'+(r.don_gia>0?_fmt(r.don_gia)+'d':'—')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;color:var(--yellow);">'+(r.is_mapped?r.vat+'%':'')+'</td>'
        +'<td style="padding:8px 12px;" id="map-act-'+ri+'"></td>'
        +'</tr>';
    });
    tbl+='</tbody></table></div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:8px;text-align:right;">Hien '+rows.length+' / '+d.total+' hang hoa</div>';

    el.innerHTML=statsHtml+tbl;

    // Action buttons
    rows.forEach(function(r,ri){
      var td=document.getElementById('map-act-'+ri);if(!td)return;
      var mapBtn=document.createElement('button');
      mapBtn.innerHTML=r.is_mapped?'&#x270F; Sua':'&#x1F517; Map';
      mapBtn.style.cssText=(r.is_mapped?bg('accent'):bg('green'))+'border-radius:6px;padding:3px 9px;font-size:11px;font-weight:700;cursor:pointer;margin-right:3px;';
      mapBtn.addEventListener('click',function(e){e.stopPropagation();_showMapForm(r);});

      if(r.is_mapped){
        var delBtn=document.createElement('button');
        delBtn.innerHTML='&#x1F5D1;';delBtn.title='Xoa mapping';
        delBtn.style.cssText=bg('red')+'border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;';
        delBtn.addEventListener('click',function(e){
          e.stopPropagation();
          if(!confirm('Xoa mapping: '+r.misa_ma+' ↔ '+r.sapo_sku+'?'))return;
          _api()('misa_delete_mapping_new',{misa_ma:r.misa_ma},function(e2,d2){
            if(!e2&&d2&&d2.ok){_toast('Da xoa mapping','ok');_loadMappingList({});}
            else _toast((d2&&d2.error)||'Loi','error');
          });
        });
        td.appendChild(mapBtn);td.appendChild(delBtn);
      } else {
        td.appendChild(mapBtn);
      }
    });
  });
}

function _showMapForm(misaRow){
  // Tìm SP Sapo phù hợp
  var h='<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;">'
    +'<div><div style="font-size:14px;font-weight:900;">'+(misaRow.is_mapped?'Sua mapping':'Map Misa ↔ Sapo')+'</div>'
    +'<div style="font-size:11px;color:var(--green);margin-top:2px;">Misa: <strong>'+_esc(misaRow.misa_ma)+'</strong> — '+_esc(misaRow.misa_ten||'')+'</div>'
    +'</div>'
    +'<button id="mf-x" style="background:none;border:none;color:var(--text3);font-size:22px;cursor:pointer;">&#x00D7;</button>'
    +'</div>'
    // Misa info (read-only)
    +'<div style="padding:14px 20px;background:rgba(0,214,143,.06);border-bottom:1px solid rgba(0,214,143,.15);">'
      +'<div style="font-size:10px;font-weight:800;text-transform:uppercase;color:var(--green);margin-bottom:8px;">Thong tin Misa (khong doi)</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:12px;">'
        +'<div><span style="color:var(--text3);">Ma hang: </span><strong style="color:var(--green);">'+_esc(misaRow.misa_ma)+'</strong></div>'
        +'<div><span style="color:var(--text3);">DVT: </span>'+_esc(misaRow.dvt||'')+'</div>'
        +'<div><span style="color:var(--text3);">Ton kho: </span><strong style="color:'+(misaRow.ton_kho>0?'var(--green)':'var(--red)')+';">'+(misaRow.ton_kho<0?'N/A':_fmt(misaRow.ton_kho))+'</strong></div>'
      +'</div>'
    +'</div>'
    // Sapo side
    +'<div style="padding:16px 20px;">'
      +'<div style="font-size:10px;font-weight:800;text-transform:uppercase;color:'+C.cyan[2]+';margin-bottom:10px;">San pham Sapo tuong ung</div>'
      +'<div style="display:flex;gap:8px;margin-bottom:12px;">'
        +'<input id="mf-sapo-q" type="text" placeholder="Tim SKU, ten san pham Sapo..." '
          +'style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;"'
          +(misaRow.sapo_sku?' value="'+_esc(misaRow.sapo_sku)+'"':'')+'>'
        +'<button id="mf-sapo-search" style="'+bg('cyan')+'border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
      +'</div>'
      +'<div id="mf-sapo-results" style="max-height:220px;overflow-y:auto;border-radius:8px;border:1px solid var(--border);"></div>'
      +'<div id="mf-selected" style="margin-top:10px;"></div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;">'
        +_inp('mf-gia','Don gia ban (chua thue)','number',misaRow.don_gia||0,'')
        +_sel('mf-vat','% Thue VAT',[['0','0%'],['5','5%'],['8','8%'],['10','10%']],String(misaRow.vat||10))
      +'</div>'
    +'</div>'
    +'<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
      +'<button id="mf-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
      +'<button id="mf-save" style="'+bg('green')+'border-radius:8px;padding:8px 18px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;">&#x2705; Luu mapping</button>'
    +'</div>';

  _modal(h,'720px');
  document.getElementById('mf-x').addEventListener('click',_cm);
  document.getElementById('mf-cancel').addEventListener('click',_cm);

  var selectedSku=misaRow.sapo_sku||'', selectedTen=misaRow.sapo_ten||'';

  // Search Sapo products
  function _searchSapo(){
    var q=document.getElementById('mf-sapo-q').value.trim();
    var res=document.getElementById('mf-sapo-results');if(!res)return;
    res.innerHTML='<div style="padding:8px;text-align:center;font-size:11px;color:var(--text3);">Dang tim...</div>';
    _api()('misa_get_sapo_products',{q:q},function(e,d){
      if(e||!d||!d.ok){res.innerHTML='<div style="color:var(--red);padding:8px;font-size:11px;">Loi</div>';return;}
      var rs=d.data||[];
      if(!rs.length){res.innerHTML='<div style="padding:8px;text-align:center;font-size:11px;color:var(--text3);">Khong tim thay</div>';return;}
      res.innerHTML='<table style="width:100%;border-collapse:collapse;font-size:11px;">'
        +'<thead><tr style="background:var(--bg3);"><th style="padding:6px 10px;text-align:left;font-size:10px;color:var(--text3);">SKU</th><th style="padding:6px 10px;text-align:left;">Ten SP</th><th style="padding:6px 10px;text-align:right;">Gia ban</th><th style="padding:6px 10px;text-align:center;">Ton</th></tr></thead><tbody>'
        +rs.map(function(r){
          var isSel=r.sku===selectedSku;
          return '<tr class="sapo-row" data-sku="'+_esc(r.sku)+'" data-ten="'+_esc(r.ten||'')+'" data-gia="'+r.gia+'" '
            +'style="border-top:1px solid var(--border);cursor:pointer;'+(isSel?'background:rgba(0,214,143,.12);':'')+'">'
            +'<td style="padding:6px 10px;font-family:monospace;font-size:10px;color:'+C.cyan[2]+';">'+_esc(r.sku)+'</td>'
            +'<td style="padding:6px 10px;">'+_esc(r.ten||'')+'</td>'
            +'<td style="padding:6px 10px;text-align:right;">'+_fmt(r.gia)+'</td>'
            +'<td style="padding:6px 10px;text-align:center;">'+(r.ton>0?'<span style="color:var(--green);">'+r.ton+'</span>':'<span style="color:var(--red);">0</span>')+'</td>'
            +'</tr>';
        }).join('')
        +'</tbody></table>';
      // Click to select
      res.querySelectorAll('.sapo-row').forEach(function(row){
        row.addEventListener('click',function(){
          selectedSku=row.getAttribute('data-sku');
          selectedTen=row.getAttribute('data-ten');
          var gia=Number(row.getAttribute('data-gia')||0);
          res.querySelectorAll('.sapo-row').forEach(function(r2){ r2.style.background=''; });
          row.style.background='rgba(0,214,143,.12)';
          var selDiv=document.getElementById('mf-selected');
          if(selDiv) selDiv.innerHTML='<div style="'+bg('green')+'border-radius:8px;padding:8px 12px;font-size:12px;">'
            +'&#x2705; Da chon: <strong>'+_esc(selectedSku)+'</strong> — '+_esc(selectedTen)+'</div>';
          var giaInp=document.getElementById('mf-gia');
          if(giaInp&&gia>0) giaInp.value=gia;
        });
      });
    });
  }
  document.getElementById('mf-sapo-search').addEventListener('click',_searchSapo);
  document.getElementById('mf-sapo-q').addEventListener('keydown',function(e){if(e.keyCode===13)_searchSapo();});
  if(misaRow.sapo_sku) setTimeout(_searchSapo,100);
  else _searchSapo();

  document.getElementById('mf-save').addEventListener('click',function(){
    if(!selectedSku){_toast('Chua chon san pham Sapo','error');return;}
    var btn=this;btn.disabled=true;btn.textContent='Dang luu...';
    _api()('misa_save_mapping_new',{
      misa_ma:misaRow.misa_ma, misa_ten:misaRow.misa_ten, misa_dvt:misaRow.dvt,
      sapo_sku:selectedSku, sapo_ten:selectedTen,
      vat:Number((document.getElementById('mf-vat')||{}).value||10),
      don_gia:Number((document.getElementById('mf-gia')||{}).value||0),
      active:true
    },function(e2,d2){
      btn.disabled=false;btn.textContent='Luu mapping';
      if(!e2&&d2&&d2.ok){
        _toast('Da mapping: '+misaRow.misa_ma+' ↔ '+selectedSku,'ok');
        _cm();_loadMappingList({});
      } else _toast((d2&&d2.error)||'Loi','error');
    });
  });
}


// ════════════════════════════════════════════════════════════════
// DRAFT MODULE v5.12 — Invoice Editor redesign
// Layout: Left=Sapo items | Right=Misa mapped items
// Billing: tu billing_address Sapo, fallback customer
// Gia Sapo da co thue → tinh gia chua thue cho Misa
// ════════════════════════════════════════════════════════════════

var DS = { order:null, orderFull:null, lines:[], mode:'manual' };

function _renderDraft(){
  var el=document.getElementById('misa-body'); if(!el)return;
  DS.order=null; DS.orderFull=null; DS.lines=[];
  el.innerHTML=
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
      +'<input id="dr-q" type="text" placeholder="Tim ma don, ten khach..." '
        +'style="flex:1;min-width:200px;background:var(--bg3);border:1px solid var(--border2);'
        +'border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
      +'<button id="dr-search" style="'+bg('accent')+'border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim don</button>'
    +'</div>'
    +'<div id="dr-order-list"></div>';
  document.getElementById('dr-search').addEventListener('click',_loadSapoOrders);
  document.getElementById('dr-q').addEventListener('keydown',function(e){if(e.keyCode===13)_loadSapoOrders();});
  _loadSapoOrders();
}

function _loadSapoOrders(){
  var el=document.getElementById('dr-order-list'); if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Dang tai don hang...</div>';
  _api()('sales_get_orders',{q:(document.getElementById('dr-q')||{}).value||'',limit:30,page:1},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<div style="color:var(--red);padding:16px;">Loi tai don hang</div>';return;}
    var orders=d.data||[];
    if(!orders.length){
      el.innerHTML='<div style="text-align:center;padding:48px;"><div style="font-size:28px;margin-bottom:10px;">&#x1F4CB;</div>'
        +'<div style="font-size:13px;color:var(--text2);font-weight:700;">Chua co don hang</div>'
        +'<div style="font-size:11px;color:var(--text3);margin-top:6px;">Dong bo don Sapo truoc</div></div>';
      return;
    }
    var html='<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:600px;">'
      +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma don</th>'
        +'<th style="padding:9px 12px;text-align:left;">Khach hang</th>'
        +'<th style="padding:9px 12px;text-align:center;">Ngay</th>'
        +'<th style="padding:9px 12px;text-align:right;">Tong tien</th>'
        +'<th style="padding:9px 12px;text-align:center;">Trang thai</th>'
        +'<th style="padding:9px 12px;"></th>'
      +'</tr></thead><tbody>'
      +orders.map(function(o,oi){
        var ev=oi%2===0?'var(--bg2)':'var(--bg3)';
        return '<tr style="border-top:1px solid var(--border);background:'+ev+';">'
          +'<td style="padding:8px 12px;font-weight:700;color:'+C.cyan[2]+';">'+_esc(o.ma_don||o.id||'')+'</td>'
          +'<td style="padding:8px 12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(o.khach_ten||'')+'</td>'
          +'<td style="padding:8px 12px;text-align:center;color:var(--text3);font-size:11px;">'+_esc((o.ngay||'').split('T')[0])+'</td>'
          +'<td style="padding:8px 12px;text-align:right;font-weight:800;color:var(--green);">'+_fmt(o.tong_tt||0)+'d</td>'
          +'<td style="padding:8px 12px;text-align:center;">'+_badge(o.trang_thai||'moi','accent')+'</td>'
          +'<td style="padding:8px 12px;" id="dr-act-'+oi+'"></td>'
          +'</tr>';
      }).join('')+'</tbody></table></div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:6px;text-align:right;">'+d.total+' don hang</div>';
    el.innerHTML=html;
    orders.forEach(function(o,oi){
      var td=document.getElementById('dr-act-'+oi);if(!td)return;
      var btn=document.createElement('button');
      btn.innerHTML='&#x1F4DD; Tao HD';
      btn.style.cssText=bg('green')+'border-radius:6px;padding:5px 11px;font-size:11px;font-weight:700;cursor:pointer;';
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        btn.disabled=true; btn.textContent='Dang tai...';
        _openEditorForOrder(String(o.sapo_id||o.id||o.ma_don||''),function(){ btn.disabled=false; btn.textContent='Tao HD'; });
      });
      td.appendChild(btn);
    });
  });
}

// Load du lieu day du tu GAS (billing + mapping check) roi mo editor
function _openEditorForOrder(orderId, onErr){
  _api()('misa_get_order_for_draft',{order_id:orderId},function(e,d){
    if(e||!d||!d.ok){
      _toast('Loi: '+((d&&d.error)||'Khong tai duoc don'),'error');
      if(onErr)onErr(); return;
    }
    DS.orderFull=d;
    // Init DS.lines tu mapped_items
    DS.lines=[];
    (d.mapped_items||[]).forEach(function(item){
      if(!item.het_ton) {
        DS.lines.push({
          misa_ma    : item.misa_ma,
          misa_ten   : item.misa_ten,
          dvt        : item.misa_dvt,
          sl         : item.misa_sl,
          gia        : item.misa_gia,
          gia_goc    : item.misa_gia,
          vat        : item.misa_vat,
          ton_kho    : item.ton_kho,
          sapo_sku   : item.sapo_sku,
          nguon      : 'sapo'
        });
      }
    });
    _renderEditor();
  });
}

// ════════════════════════════════════════════════════════════════
// EDITOR LAYOUT
// ════════════════════════════════════════════════════════════════
function _renderEditor(){
  var el=document.getElementById('misa-body'); if(!el)return;
  var d=DS.orderFull;
  var oh=d.order_header||{};
  var billing=d.billing||{};
  var hasBilling=!!d.has_billing;
  var tongSapo=Number(oh.tong_tt||0);

  el.innerHTML=
    // Back + title
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">'
      +'<button id="ed-back" style="'+bg('accent')+'border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2190; Danh sach</button>'
      +'<div>'
        +'<div style="font-size:16px;font-weight:900;">Tao hoa don Misa — Don <span style="color:'+C.cyan[2]+';">'+_esc(oh.ma_don||'')+'</span></div>'
        +'<div style="font-size:11px;color:var(--text3);">Gia tri don Sapo: <strong style="color:var(--green);">'+_fmt(tongSapo)+'d</strong> (gia da co thue)</div>'
      +'</div>'
    +'</div>'

    // ── Billing info ────────────────────────────────────────────
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:14px 18px;margin-bottom:14px;">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">'
        +'<div style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:'+C.cyan[2]+';"> Thong tin xuat hoa don</div>'
        +(hasBilling
          ?'<span style="font-size:9px;'+bg('cyan')+'border-radius:4px;padding:1px 7px;">Tu billing_address Sapo</span>'
          :'<span style="font-size:9px;'+bg('yellow')+'border-radius:4px;padding:1px 7px;">&#x26A0; Khong co billing — dung tai khoan KH</span>')
      +'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;">'
        +_billingField('ed-ten','Nguoi mua (*)',billing.ten||d.order_header&&'',!billing.ten)
        +_billingField('ed-cty','Cong ty / Don vi',billing.cong_ty||'',false)
        +_billingField('ed-mst','Ma so thue',billing.mst||'',!billing.mst,'warn')
        +_billingField('ed-phone','So dien thoai',billing.phone||'',!billing.phone)
        +_billingField('ed-email','Email',billing.email||'',false)
        +_billingField('ed-kyhieu','Ky hieu HĐ Misa','AA/24E',false)
        +'<div style="grid-column:1/-1;">'+_billingFieldFull('ed-dc','Dia chi (*)',billing.dia_chi||'',!billing.dia_chi)+'</div>'
      +'</div>'
    +'</div>'

    // ── Split layout ────────────────────────────────────────────
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'

      // LEFT: Sapo items
      +'<div style="background:var(--bg2);border:1px solid rgba(251,191,36,.25);border-radius:14px;padding:14px;">'
        +'<div style="font-size:11px;font-weight:900;color:var(--yellow);margin-bottom:8px;">&#x1F6CD; San pham tren don Sapo <span style="font-weight:400;color:var(--text3);">(gia da co thue)</span></div>'
        +'<div id="ed-sapo-items"></div>'
      +'</div>'

      // RIGHT: Misa items
      +'<div style="background:var(--bg2);border:1px solid rgba(0,214,143,.25);border-radius:14px;padding:14px;">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
          +'<div style="font-size:11px;font-weight:900;color:var(--green);">&#x1F9FE; San pham Misa (gia chua thue)</div>'
          +'<button id="ed-add" style="'+bg('accent')+'border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">+ Them</button>'
        +'</div>'
        +'<div id="ed-misa-items"></div>'
      +'</div>'

    +'</div>'

    // ── Balance bar ─────────────────────────────────────────────
    +'<div id="ed-balance" style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-bottom:14px;"></div>'

    // ── Actions ─────────────────────────────────────────────────
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between;align-items:center;">'
      +'<div style="display:flex;gap:8px;">'
        +'<button id="ed-suggest" style="'+bg('purple')+'border-radius:10px;padding:10px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F916; Goi y can bang tu dong</button>'
        +'<button id="ed-clear-auto" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:10px;padding:10px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:none;">Xoa goi y</button>'
      +'</div>'
      +'<div style="display:flex;gap:8px;">'
        +'<button id="ed-save-draft" style="'+bg('accent')+'border-radius:10px;padding:10px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4BE; Luu don nhap</button>'
        +'<button id="ed-create-export" style="'+bg('green')+'border-radius:10px;padding:10px 18px;font-size:13px;font-weight:900;cursor:pointer;font-family:inherit;">&#x1F4E4; Tao &amp; Xuat file ngay</button>'
      +'</div>'
    +'</div>';

  // Events
  document.getElementById('ed-back').addEventListener('click',function(){ DS.lines=[]; DS.orderFull=null; _renderDraft(); });
  document.getElementById('ed-add').addEventListener('click',_showAddPanel);
  document.getElementById('ed-suggest').addEventListener('click',_runBalance);
  document.getElementById('ed-save-draft').addEventListener('click',function(){ _doSave(false); });
  document.getElementById('ed-create-export').addEventListener('click',function(){ _doSave(true); });

  // Render panels
  _renderSapoPanel();
  _renderMisaPanel();
  _renderBalanceBar();
}

// Helper: field billing có cảnh báo
function _billingField(id,label,val,warn,warnType){
  var borderC=warn?(warnType==='warn'?'rgba(251,191,36,.5)':'rgba(255,77,109,.4)'):'var(--border2)';
  var labelExtra=warn?'<span style="font-size:9px;color:'+(warnType==='warn'?C.yellow[2]:C.red[2])+';">&#x26A0;</span>':'';
  return '<div><label style="display:flex;align-items:center;gap:4px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:4px;">'+label+' '+labelExtra+'</label>'
    +'<input id="'+id+'" value="'+_esc(val||'')+'" type="text" placeholder="'+(warn?'Chua co — Nhap vao':'')+'..."'
    +' style="width:100%;background:var(--bg3);border:1px solid '+borderC+';border-radius:7px;padding:6px 10px;font-size:12px;color:var(--text);font-family:inherit;box-sizing:border-box;">'
    +'</div>';
}
function _billingFieldFull(id,label,val,warn){
  var borderC=warn?'rgba(255,77,109,.4)':'var(--border2)';
  var labelExtra=warn?'<span style="font-size:9px;color:'+C.red[2]+';">&#x26A0; Chua co</span>':'';
  return '<label style="display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:4px;">'+label+' '+labelExtra+'</label>'
    +'<input id="'+id+'" value="'+_esc(val||'')+'" type="text" placeholder="Nhap dia chi xuat hoa don..."'
    +' style="width:100%;background:var(--bg3);border:1px solid '+borderC+';border-radius:7px;padding:6px 10px;font-size:12px;color:var(--text);font-family:inherit;box-sizing:border-box;">';
}

// ── LEFT PANEL: Sapo items ────────────────────────────────────────
function _renderSapoPanel(){
  var el=document.getElementById('ed-sapo-items'); if(!el)return;
  var d=DS.orderFull;
  var mapped  =d.mapped_items||[];
  var unmapped=d.unmapped_items||[];
  var all=[].concat(mapped,unmapped);
  if(!all.length){ el.innerHTML='<div style="font-size:11px;color:var(--text3);font-style:italic;padding:12px 0;">Don khong co san pham</div>'; return; }
  el.innerHTML='<table style="width:100%;border-collapse:collapse;font-size:11px;">'
    +'<thead><tr style="border-bottom:2px solid rgba(251,191,36,.2);">'
      +'<th style="padding:5px 6px;text-align:left;font-size:9px;font-weight:800;color:var(--yellow);">SKU / Ten SP</th>'
      +'<th style="padding:5px 6px;text-align:right;font-size:9px;font-weight:800;color:var(--yellow);">SL</th>'
      +'<th style="padding:5px 6px;text-align:right;font-size:9px;font-weight:800;color:var(--yellow);">Gia (co thue)</th>'
      +'<th style="padding:5px 6px;text-align:right;font-size:9px;font-weight:800;color:var(--yellow);">Thanh tien</th>'
      +'<th style="padding:5px 6px;text-align:center;font-size:9px;font-weight:800;color:var(--yellow);">Misa</th>'
    +'</tr></thead><tbody>'
    +mapped.map(function(item,i){
      var ev=i%2===0?'rgba(255,255,255,.03)':'transparent';
      var mapStatus = item.het_ton
        ? '<span style="font-size:9px;'+bg('red')+'border-radius:3px;padding:1px 5px;">Het ton</span>'
        : '<span style="font-size:9px;'+bg('green')+'border-radius:3px;padding:1px 5px;">✓ Map</span>';
      return '<tr style="border-bottom:1px solid rgba(255,255,255,.05);background:'+ev+';">'
        +'<td style="padding:5px 6px;"><div style="font-family:monospace;font-size:9px;color:var(--yellow);">'+_esc(item.sapo_sku||'')+'</div>'
          +'<div style="font-size:11px;">'+_esc(item.sapo_ten||'')+'</div></td>'
        +'<td style="padding:5px 6px;text-align:right;font-weight:700;">'+item.sapo_sl+'</td>'
        +'<td style="padding:5px 6px;text-align:right;color:var(--text3);">'+_fmt(item.sapo_gia_co_thue||item.sapo_gia||0)+'</td>'
        +'<td style="padding:5px 6px;text-align:right;font-weight:700;">'+_fmt(item.sapo_thanh_tien||0)+'</td>'
        +'<td style="padding:5px 6px;text-align:center;">'+mapStatus+'</td>'
        +'</tr>';
    }).join('')
    +unmapped.map(function(item,i){
      var ev=(i+mapped.length)%2===0?'rgba(255,255,255,.03)':'transparent';
      return '<tr style="border-bottom:1px solid rgba(255,255,255,.05);background:'+ev+';opacity:.7;">'
        +'<td style="padding:5px 6px;"><div style="font-family:monospace;font-size:9px;color:var(--yellow);">'+_esc(item.sapo_sku||'')+'</div>'
          +'<div style="font-size:11px;">'+_esc(item.sapo_ten||'')+'</div></td>'
        +'<td style="padding:5px 6px;text-align:right;font-weight:700;">'+item.sapo_sl+'</td>'
        +'<td style="padding:5px 6px;text-align:right;color:var(--text3);">'+_fmt(item.sapo_gia||0)+'</td>'
        +'<td style="padding:5px 6px;text-align:right;">'+_fmt((item.sapo_sl||0)*(item.sapo_gia||0))+'</td>'
        +'<td style="padding:5px 6px;text-align:center;"><span style="font-size:9px;'+bg('yellow')+'border-radius:3px;padding:1px 5px;">Chua map</span></td>'
        +'</tr>';
    }).join('')
    +'</tbody></table>'
    +(unmapped.length?'<div style="font-size:10px;color:var(--yellow);margin-top:6px;">&#x26A0; '+unmapped.length+' SP chua mapping → vao tab Mapping de them</div>':'');
}

// ── RIGHT PANEL: Misa lines (editable) ───────────────────────────
function _renderMisaPanel(){
  var el=document.getElementById('ed-misa-items'); if(!el)return;
  var lines=DS.lines.filter(function(l){return l.misa_ma;});
  if(!lines.length){
    el.innerHTML='<div style="font-size:11px;color:var(--text3);font-style:italic;padding:12px 0;">'
      +'Chua co SP Misa. Nhan "+ Them" hoac "Goi y can bang tu dong".</div>';
    _renderBalanceBar(); return;
  }
  el.innerHTML='<table style="width:100%;border-collapse:collapse;font-size:11px;" id="misa-table">'
    +'<thead><tr style="border-bottom:2px solid rgba(0,214,143,.2);">'
      +'<th style="padding:5px 6px;text-align:left;font-size:9px;font-weight:800;color:var(--green);">Ma Misa / Ten hang</th>'
      +'<th style="padding:5px 6px;text-align:right;font-size:9px;font-weight:800;color:var(--green);">SL</th>'
      +'<th style="padding:5px 6px;text-align:right;font-size:9px;font-weight:800;color:var(--green);">Don gia</th>'
      +'<th style="padding:5px 6px;text-align:center;font-size:9px;font-weight:800;color:var(--green);">VAT</th>'
      +'<th style="padding:5px 6px;text-align:right;font-size:9px;font-weight:800;color:var(--green);">Thanh tien</th>'
      +'<th style="padding:5px 6px;width:22px;"></th>'
    +'</tr></thead><tbody>'
    +lines.map(function(line,li){
      var realIdx=DS.lines.indexOf(line);
      var ev=li%2===0?'rgba(0,255,150,.02)':'transparent';
      var tt=Math.round(line.sl*line.gia);
      var nguonBadge=line.nguon==='auto'?'<span style="font-size:9px;'+bg('purple')+'border-radius:3px;padding:1px 4px;">Auto</span> ':'';
      var tonC=line.ton_kho<0?'var(--text3)':line.ton_kho===0?'var(--red)':line.ton_kho<10?'var(--yellow)':'var(--green)';
      var minG=line.nguon==='auto'&&line.gia_goc?Math.floor(line.gia_goc*0.97/100)*100:0;
      var maxG=line.nguon==='auto'&&line.gia_goc?Math.ceil(line.gia_goc*1.03/100)*100:9999999;
      return '<tr style="border-bottom:1px solid rgba(0,214,143,.08);background:'+ev+';" id="ml-'+realIdx+'">'
        +'<td style="padding:4px 6px;"><div style="font-family:monospace;font-size:9px;color:var(--green);font-weight:700;">'+nguonBadge+_esc(line.misa_ma)+'</div>'
          +'<div style="font-size:11px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+_esc(line.misa_ten||'')+'">'+_esc(line.misa_ten||'')+'</div>'
          +(line.ton_kho>=0?'<div style="font-size:9px;color:'+tonC+';">Ton: '+line.ton_kho+'</div>':'')
        +'</td>'
        // SL
        +'<td style="padding:3px 4px;">'
          +'<input class="ml-sl" data-i="'+realIdx+'" type="number" min="0.01" step="1" value="'+line.sl+'"'
            +' style="width:50px;background:var(--bg3);border:1px solid var(--border2);border-radius:5px;padding:3px 5px;font-size:11px;text-align:right;color:var(--text);font-family:inherit;">'
        +'</td>'
        // Gia
        +'<td style="padding:3px 4px;">'
          +'<input class="ml-gia" data-i="'+realIdx+'" data-min="'+minG+'" data-max="'+maxG+'" type="number" min="0" step="100" value="'+line.gia+'"'
            +' style="width:80px;background:var(--bg3);border:1px solid '+(line.nguon==='auto'?C.purple[1]:'var(--border2)')+';border-radius:5px;padding:3px 5px;font-size:11px;text-align:right;color:var(--text);font-family:inherit;">'
          +(line.nguon==='auto'&&line.gia_goc?'<div style="font-size:8px;color:var(--text3);text-align:right;">'+_fmt(minG)+'-'+_fmt(maxG)+'</div>':'')
        +'</td>'
        // VAT
        +'<td style="padding:4px 6px;text-align:center;color:var(--yellow);font-size:11px;">'+line.vat+'%</td>'
        // TT
        +'<td style="padding:4px 6px;text-align:right;font-weight:700;" id="ml-tt-'+realIdx+'">'+_fmt(tt)+'</td>'
        // Del
        +'<td style="padding:3px 4px;" id="ml-del-'+realIdx+'"></td>'
        +'</tr>';
    }).join('')
    +'</tbody></table>';

  // Wire inputs
  el.querySelectorAll('.ml-sl,.ml-gia').forEach(function(inp){
    inp.addEventListener('input',function(){
      var idx=Number(this.getAttribute('data-i'));
      var line=DS.lines[idx]; if(!line)return;
      if(this.classList.contains('ml-sl')) line.sl=parseFloat(this.value)||0;
      else {
        var v=parseFloat(this.value)||0;
        var minG=Number(this.getAttribute('data-min')||0);
        var maxG=Number(this.getAttribute('data-max')||9999999);
        this.style.borderColor=(v>0&&minG>0&&(v<minG||v>maxG))?'var(--red)':
                               (line.nguon==='auto'?C.purple[1]:'var(--border2)');
        line.gia=v;
      }
      var tt=Math.round(line.sl*line.gia);
      var ttEl=document.getElementById('ml-tt-'+idx);
      if(ttEl) ttEl.textContent=_fmt(tt);
      _renderBalanceBar();
    });
  });

  // Delete
  lines.forEach(function(line){
    var realIdx=DS.lines.indexOf(line);
    var td=document.getElementById('ml-del-'+realIdx); if(!td)return;
    var btn=document.createElement('button');
    btn.innerHTML='&#x2715;';
    btn.style.cssText='background:none;border:1px solid rgba(255,77,109,.3);color:var(--red);border-radius:5px;padding:2px 6px;font-size:10px;cursor:pointer;';
    btn.addEventListener('click',function(){
      DS.lines.splice(realIdx,1);
      _renderMisaPanel();
    });
    td.appendChild(btn);
  });

  _renderBalanceBar();
}

// ── Balance bar ───────────────────────────────────────────────────
function _renderBalanceBar(){
  var el=document.getElementById('ed-balance'); if(!el)return;
  var tongSapo=Number((DS.orderFull&&DS.orderFull.order_header&&DS.orderFull.order_header.tong_tt)||0);
  var lines=DS.lines.filter(function(l){return l.misa_ma;});
  var tongChuaThue=lines.reduce(function(a,l){return a+Math.round(l.sl*l.gia);},0);
  var tongThue    =lines.reduce(function(a,l){return a+Math.round(l.sl*l.gia*l.vat/100);},0);
  var tongMisa    =tongChuaThue+tongThue;
  // So sanh gia tri tuong duong: tongSapo (co thue) vs tongMisa (co thue)
  var gap    =tongSapo-tongMisa;
  var gapAbs =Math.abs(gap);
  var gapPct =tongSapo>0?Math.round(gapAbs/tongSapo*1000)/10:0;
  var gapColor=gapAbs<1000?'var(--green)':gapAbs/Math.max(tongSapo,1)<0.05?'var(--yellow)':'var(--red)';
  var gapMsg  =gapAbs<1000?'Da can bang!':gap>0?'Con du '+_fmt(gap)+'d':'Du ra '+_fmt(-gap)+'d';

  el.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">'
    +'<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;">'
      +'<div><span style="color:var(--text3);">Misa chua thue: </span><strong>'+_fmt(tongChuaThue)+'d</strong></div>'
      +'<div><span style="color:var(--text3);">Tien thue: </span>'+_fmt(tongThue)+'d</div>'
      +'<div style="border-left:2px solid var(--border);padding-left:12px;"><span style="color:var(--text3);">Misa TT: </span><strong style="color:var(--green);">'+_fmt(tongMisa)+'d</strong></div>'
      +'<div><span style="color:var(--text3);">Sapo: </span><strong>'+_fmt(tongSapo)+'d</strong></div>'
    +'</div>'
    +'<div style="display:flex;align-items:center;gap:8px;">'
      +'<div style="font-size:13px;font-weight:900;color:'+gapColor+';">'+gapMsg+(gapAbs>=1000?' ('+gapPct+'%)':'')+'</div>'
    +'</div>'
    +'</div>'
    +(lines.length?'<div style="margin-top:8px;background:var(--bg3);border-radius:4px;height:6px;overflow:hidden;">'
      +'<div style="width:'+Math.min(100,Math.round(tongMisa/Math.max(tongSapo,1)*100))+'%;height:100%;background:'+(gapAbs<1000?'var(--green)':gapAbs/Math.max(tongSapo,1)<0.05?'var(--yellow)':'var(--red)')+';transition:width .3s;"></div>'
    +'</div>':'');
}

// ── Auto suggest ─────────────────────────────────────────────────
function _runBalance(){
  var tongSapo=Number((DS.orderFull&&DS.orderFull.order_header&&DS.orderFull.order_header.tong_tt)||0);
  var lines   =DS.lines.filter(function(l){return l.misa_ma;});
  var tongMisa=lines.reduce(function(a,l){return a+Math.round(l.sl*l.gia*(1+l.vat/100));},0);
  var gap     =tongSapo-tongMisa;

  if(Math.abs(gap)<1000){ _toast('Da can bang!','ok'); return; }

  var btn=document.getElementById('ed-suggest');
  if(btn){btn.disabled=true;btn.textContent='Dang tinh...';}
  var excludeMas=DS.lines.map(function(l){return l.misa_ma;}).filter(Boolean);

  _api()('misa_suggest_balance',{gap:Math.round(gap/(1+0.1)),exclude_mas:excludeMas},function(e,d){
    if(btn){btn.disabled=false;btn.textContent='&#x1F916; Goi y can bang tu dong';}
    if(e||!d||!d.ok){ _toast((d&&d.error)||'Loi goi y','error'); return; }
    var sug=d.suggestions||[];
    if(!sug.length){ _toast('Khong tim duoc SP phu hop','error'); return; }
    // Xoa auto lines cu, them moi
    DS.lines=DS.lines.filter(function(l){return l.nguon!=='auto';});
    sug.forEach(function(s){
      DS.lines.push({
        misa_ma   : s.misa_ma, misa_ten:s.misa_ten, dvt:s.dvt,
        sl        : s.so_luong, gia:s.don_gia_de_xuat, gia_goc:s.don_gia_goc,
        vat       : s.vat, ton_kho:s.ton_kho,
        nguon     : 'auto'
      });
    });
    var clearBtn=document.getElementById('ed-clear-auto');
    if(clearBtn) clearBtn.style.display='';
    _toast('Goi y '+sug.length+' SP. Con du: '+_fmt(d.gap_sau)+'d. Kiem tra roi xac nhan.','ok');
    _renderMisaPanel();
  });

  document.getElementById('ed-clear-auto').addEventListener('click',function(){
    DS.lines=DS.lines.filter(function(l){return l.nguon!=='auto';});
    this.style.display='none';
    _renderMisaPanel();
  });
}

// ── Add SP modal ─────────────────────────────────────────────────
function _showAddPanel(){
  var h='<div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;">'
    +'<div style="font-size:14px;font-weight:900;">+ Them san pham Misa</div>'
    +'<button id="ap-x" style="background:none;border:none;color:var(--text3);font-size:22px;cursor:pointer;line-height:1;">&#x00D7;</button>'
    +'</div>'
    +'<div style="padding:14px 18px;">'
      +'<div style="display:flex;gap:6px;margin-bottom:10px;">'
        +'<input id="ap-q" type="text" placeholder="Tim ma Misa, ten hang..." '
          +'style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;font-size:12px;color:var(--text);font-family:inherit;">'
        +'<button id="ap-s" style="'+bg('accent')+'border-radius:8px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
      +'</div>'
      +'<div id="ap-res" style="max-height:320px;overflow-y:auto;border-radius:8px;border:1px solid var(--border);"></div>'
    +'</div>';
  _modal(h,'640px');
  document.getElementById('ap-x').addEventListener('click',_cm);
  document.getElementById('ap-s').addEventListener('click',_searchAdd);
  document.getElementById('ap-q').addEventListener('keydown',function(e){if(e.keyCode===13)_searchAdd();});
  _searchAdd();
}
function _searchAdd(){
  var el=document.getElementById('ap-res');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:12px;font-size:11px;color:var(--text3);">Dang tim...</div>';
  _api()('misa_get_available_for_suggest',{q:(document.getElementById('ap-q')||{}).value||''},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<div style="color:var(--red);padding:8px;font-size:11px;">Loi</div>';return;}
    var rows=d.data||[];
    if(!rows.length){el.innerHTML='<div style="text-align:center;padding:12px;font-size:11px;color:var(--text3);">Khong co ket qua</div>';return;}
    var existingMas={};
    DS.lines.forEach(function(l){if(l.misa_ma)existingMas[l.misa_ma]=true;});
    el.innerHTML='<table style="width:100%;border-collapse:collapse;font-size:11px;">'
      +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:6px 10px;text-align:left;font-size:10px;color:var(--text3);">Ma Misa</th>'
        +'<th style="padding:6px 10px;text-align:left;">Ten hang</th>'
        +'<th style="padding:6px 10px;text-align:center;">DVT</th>'
        +'<th style="padding:6px 10px;text-align:right;">Ton</th>'
        +'<th style="padding:6px 10px;text-align:right;">Don gia</th>'
        +'<th style="padding:6px 10px;"></th>'
      +'</tr></thead><tbody>'
      +rows.map(function(r){
        var inList=existingMas[r.misa_ma];
        var tc=r.ton_kho<0?'var(--text3)':r.ton_kho===0?'var(--red)':r.ton_kho<10?'var(--yellow)':'var(--green)';
        return '<tr style="border-top:1px solid var(--border);">'
          +'<td style="padding:5px 10px;font-family:monospace;font-size:10px;color:var(--green);font-weight:700;">'+_esc(r.misa_ma)+'</td>'
          +'<td style="padding:5px 10px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc(r.misa_ten||'')+'</td>'
          +'<td style="padding:5px 10px;text-align:center;color:var(--text3);">'+_esc(r.dvt||'')+'</td>'
          +'<td style="padding:5px 10px;text-align:right;font-weight:700;color:'+tc+';">'+(r.ton_kho<0?'N/A':_fmt(r.ton_kho))+'</td>'
          +'<td style="padding:5px 10px;text-align:right;">'+(r.don_gia>0?_fmt(r.don_gia)+'d':'—')+'</td>'
          +'<td style="padding:5px 10px;">'
            +(inList
              ?'<span style="font-size:10px;color:var(--text3);">Da co</span>'
              :'<button class="ap-add" data-ma="'+_esc(r.misa_ma)+'" data-ten="'+_esc(r.misa_ten||'')+'" '
                +'data-dvt="'+_esc(r.dvt||'cai')+'" data-gia="'+r.don_gia+'" data-vat="'+r.vat+'" data-ton="'+r.ton_kho+'"'
                +' style="'+bg('green')+'border-radius:5px;padding:3px 8px;font-size:10px;font-weight:700;cursor:pointer;">+ Them</button>')
          +'</td></tr>';
      }).join('')+'</tbody></table>';
    el.querySelectorAll('.ap-add').forEach(function(btn){
      btn.addEventListener('click',function(){
        DS.lines.push({
          misa_ma:btn.getAttribute('data-ma'), misa_ten:btn.getAttribute('data-ten'),
          dvt:btn.getAttribute('data-dvt'), sl:1,
          gia:Number(btn.getAttribute('data-gia'))||0, gia_goc:Number(btn.getAttribute('data-gia'))||0,
          vat:Number(btn.getAttribute('data-vat'))||10, ton_kho:Number(btn.getAttribute('data-ton')),
          nguon:'added'
        });
        btn.textContent='✓'; btn.disabled=true; btn.style.opacity='.6';
        existingMas[btn.getAttribute('data-ma')]=true;
        _renderMisaPanel();
      });
    });
  });
}

// ── Save ─────────────────────────────────────────────────────────
function _doSave(exportNow){
  var lines=DS.lines.filter(function(l){return l.misa_ma;});
  if(!lines.length){_toast('Chua co SP Misa nao','error');return;}
  // Validate auto lines
  var invalid=lines.filter(function(l){
    if(l.nguon!=='auto'||!l.gia_goc) return false;
    var min=Math.floor(l.gia_goc*0.97/100)*100, max=Math.ceil(l.gia_goc*1.03/100)*100;
    return l.gia<min||l.gia>max;
  });
  if(invalid.length){_toast('Co '+invalid.length+' SP gia ngoai bien do ±3%. Chinh lai.','error');return;}

  var btn=document.getElementById(exportNow?'ed-create-export':'ed-save-draft');
  if(btn){btn.disabled=true;btn.textContent='Dang luu...';}

  var oh=DS.orderFull.order_header||{};
  _api()('misa_create_draft_v2',{
    ma_don      : String(oh.ma_don||oh.sapo_id||''),
    mode        : 'direct',
    items       : (DS.orderFull.mapped_items||[]).map(function(it){
      return {sku:it.sapo_sku,ten:it.sapo_ten,so_luong:it.sapo_sl,don_gia:it.sapo_gia_co_thue||0};
    }),
    direct_lines: lines.map(function(l){
      return {misa_ma:l.misa_ma,misa_ten:l.misa_ten,dvt:l.dvt,
              so_luong:l.sl,don_gia:l.gia,vat:l.vat};
    }),
    tong_don    : Number(oh.tong_tt||0),
    khach_ten   : (document.getElementById('ed-ten')||{}).value||'',
    mst         : (document.getElementById('ed-mst')||{}).value||'',
    email       : (document.getElementById('ed-email')||{}).value||'',
    so_hd_seri  : (document.getElementById('ed-kyhieu')||{}).value||'AA/24E',
    dia_chi     : (document.getElementById('ed-dc')||{}).value||'',
    nguoi_tao   : 'admin'
  },function(e,d){
    if(btn){btn.disabled=false;btn.textContent=exportNow?'Tao & Xuat file ngay':'Luu don nhap';}
    if(!e&&d&&d.ok){
      if(exportNow){
        // Xuat ngay
        _api()('misa_export_excel',{
          ma_nhaps:[d.ma_nhap],
          ky_hieu:(document.getElementById('ed-kyhieu')||{}).value||'AA/24E',
          nguoi_xuat:'admin'
        },function(e2,d2){
          if(!e2&&d2&&d2.ok){
            _toast('Tao HD + xuat thanh cong! '+d2.msg,'ok');
            setTimeout(function(){
              if(confirm('Mo Google Sheets de download Excel?'))
                window.open('https://docs.google.com/spreadsheets/d/'+(window.SPREADSHEET_ID||''),'_blank');
            },400);
          } else _toast('Luu OK nhung xuat loi: '+((d2&&d2.error)||''),'error');
        });
      } else {
        _toast('&#x1F4BE; Da luu don nhap! '+_esc(d.ma_nhap||''),'ok');
      }
      setTimeout(function(){DS.lines=[];DS.orderFull=null;_renderDraft();},2000);
    } else _toast((d&&d.error)||'Loi luu','error');
  });
}



// ════════════════════════════════════════════════════════════════
// TAB 4: DANH SACH HD NHAP
// ════════════════════════════════════════════════════════════════
function _renderList(){
  var el=document.getElementById('misa-body');if(!el)return;
  el.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
    +'<input id="ls-q" type="text" placeholder="Tim ma HD, ma don, khach hang..." style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<button id="ls-search" style="'+bg('accent')+'border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
    +'</div>'
    +'<div id="ls-list"></div>';
  document.getElementById('ls-search').addEventListener('click',_loadHDList);
  document.getElementById('ls-q').addEventListener('keydown',function(e){if(e.keyCode===13)_loadHDList();});
  _loadHDList();
}
function _loadHDList(){
  var el=document.getElementById('ls-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Dang tai...</div>';
  _api()('misa_get_draft_list',{q:(document.getElementById('ls-q')||{}).value||'',limit:30},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<div style="color:var(--red);padding:16px;">Loi</div>';return;}
    var rows=d.data||[];
    if(!rows.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Chua co HD nhap nao.</div>';return;}
    var selBar='<div id="ls-sel-bar" style="display:none;background:'+C.accent[0]+';border:1px solid '+C.accent[1]+';border-radius:10px;padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;">'
      +'<span id="ls-sel-cnt" style="font-size:12px;font-weight:700;color:'+C.accent[2]+';">0 da chon</span>'
      +'<button id="ls-export-sel" style="'+bg('yellow')+'border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4E4; Xuat Excel Misa</button>'
      +'</div>';
    var tbl='<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:700px;">'
      +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:8px;"><input type="checkbox" id="ls-all"></th>'
        +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma HD</th>'
        +'<th style="padding:8px 12px;text-align:left;">Ma don Sapo</th>'
        +'<th style="padding:8px 12px;text-align:left;">Khach hang</th>'
        +'<th style="padding:8px 12px;text-align:center;">So dong</th>'
        +'<th style="padding:8px 12px;text-align:right;">Tong</th>'
        +'<th style="padding:8px 12px;text-align:center;">TT</th>'
        +'<th style="padding:8px 12px;"></th>'
      +'</tr></thead><tbody>'
      +rows.map(function(g,gi){
        var tt=g.trang_thai==='nhap'?_badge('Nhap','green'):_badge('Da xuat','accent');
        return '<tr style="border-top:1px solid var(--border);">'
          +'<td style="padding:8px;text-align:center;"><input type="checkbox" class="ls-cb" data-ma="'+_esc(g.ma_nhap)+'"></td>'
          +'<td style="padding:8px 12px;font-family:monospace;font-size:10px;color:var(--text3);">'+_esc(g.ma_nhap)+'</td>'
          +'<td style="padding:8px 12px;font-weight:700;color:'+C.cyan[2]+';">'+_esc(g.ma_don||'')+'</td>'
          +'<td style="padding:8px 12px;">'+_esc(g.khach_ten||'')+'</td>'
          +'<td style="padding:8px 12px;text-align:center;">'+(g.lines||[]).length+'</td>'
          +'<td style="padding:8px 12px;text-align:right;font-weight:700;color:var(--green);">'+_fmt(g.tong_cong)+'d</td>'
          +'<td style="padding:8px 12px;text-align:center;">'+tt+'</td>'
          +'<td style="padding:8px 12px;" id="ls-act-'+gi+'"></td>'
          +'</tr>';
      }).join('')+'</tbody></table></div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:8px;text-align:right;">'+d.total+' HD nhap</div>';
    el.innerHTML=selBar+tbl;
    document.getElementById('ls-all').addEventListener('change',function(){
      document.querySelectorAll('.ls-cb').forEach(function(c2){c2.checked=this.checked;},this);_updLsBar();
    });
    document.querySelectorAll('.ls-cb').forEach(function(cb){cb.addEventListener('change',_updLsBar);});
    document.getElementById('ls-export-sel').addEventListener('click',function(){
      var mas=Array.from(document.querySelectorAll('.ls-cb:checked')).map(function(c2){return c2.getAttribute('data-ma');});
      if(!mas.length){_toast('Chon it nhat 1 HD','error');return;}
      _doExport(mas);
    });
    rows.forEach(function(g,gi){
      var td=document.getElementById('ls-act-'+gi);if(!td)return;
      if(g.trang_thai==='nhap'){
        var xBtn=document.createElement('button');xBtn.innerHTML='&#x1F4E4;';xBtn.title='Xuat Excel';
        xBtn.style.cssText=bg('yellow')+'border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;';
        xBtn.addEventListener('click',function(){_doExport([g.ma_nhap]);});
        td.appendChild(xBtn);
      }
    });
  });
}
function _updLsBar(){
  var n=document.querySelectorAll('.ls-cb:checked').length;
  var bar=document.getElementById('ls-sel-bar');var cnt=document.getElementById('ls-sel-cnt');
  if(bar) bar.style.display=n?'flex':'none';
  if(cnt) cnt.textContent=n+' HD da chon';
}

// ════════════════════════════════════════════════════════════════
// TAB 5: XUAT EXCEL MISA
// ════════════════════════════════════════════════════════════════
function _renderExport(){
  var el=document.getElementById('misa-body');if(!el)return;
  el.innerHTML='<div style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);border-radius:12px;padding:12px 16px;margin-bottom:14px;font-size:12px;color:var(--yellow);font-weight:700;">'
    +'Sau khi xuat: Mo Google Sheets → File → Download → Microsoft Excel (.xlsx) → Import vao Misa AMIS'
    +'</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
      +'<input id="ex-q" type="text" placeholder="Tim HD nhap..." style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
      +'<button id="ex-search" style="'+bg('accent')+'border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Loc</button>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;">'
      +_inp('ex-kyhieu','Ky hieu HD Misa (*)','text','AA/24E','VD: AA/24E')
      +_inp('ex-mau_so','Mau so HD','text','01GTKT0/001','')
      +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:5px;">HTTT</label>'
        +'<select id="ex-httt" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
        +'<option>Chuyen khoan</option><option>Tien mat</option><option>TM/CK</option><option>Cong no</option>'
        +'</select></div>'
    +'</div>'
    +'<div id="ex-list"></div>';
  document.getElementById('ex-search').addEventListener('click',_loadExportList);
  document.getElementById('ex-q').addEventListener('keydown',function(e){if(e.keyCode===13)_loadExportList();});
  _loadExportList();
}
function _loadExportList(){
  var el=document.getElementById('ex-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
  _api()('misa_get_draft_list',{trang_thai:'nhap',q:(document.getElementById('ex-q')||{}).value||'',limit:50},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<div style="color:var(--red);padding:16px;">Loi</div>';return;}
    var rows=d.data||[];
    if(!rows.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Khong co HD nhap cho xuat. Tao HD o tab "Tao HD nhap".</div>';return;}
    var html='<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:600px;">'
      +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:8px;"><input type="checkbox" id="ex-all" checked></th>'
        +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma HD</th>'
        +'<th style="padding:8px 12px;text-align:left;">Don / Khach</th>'
        +'<th style="padding:8px 12px;text-align:center;">Dong</th>'
        +'<th style="padding:8px 12px;text-align:right;">Tong</th>'
        +'<th style="padding:8px 12px;text-align:center;">Ngay</th>'
      +'</tr></thead><tbody>'
      +rows.map(function(g){
        return '<tr style="border-top:1px solid var(--border);">'
          +'<td style="padding:8px;text-align:center;"><input type="checkbox" class="ex-cb" data-ma="'+_esc(g.ma_nhap)+'" checked></td>'
          +'<td style="padding:8px 12px;font-family:monospace;font-size:10px;color:var(--text3);">'+_esc(g.ma_nhap)+'</td>'
          +'<td style="padding:8px 12px;font-size:11px;">'+_esc(g.ma_don||'')+' / '+_esc(g.khach_ten||'')+'</td>'
          +'<td style="padding:8px 12px;text-align:center;">'+(g.lines||[]).length+'</td>'
          +'<td style="padding:8px 12px;text-align:right;font-weight:700;color:var(--green);">'+_fmt(g.tong_cong)+'d</td>'
          +'<td style="padding:8px 12px;text-align:center;color:var(--text3);">'+_esc(g.ngay||'')+'</td>'
          +'</tr>';
      }).join('')+'</tbody></table></div>'
      +'<button id="ex-do" style="width:100%;margin-top:12px;background:linear-gradient(135deg,var(--yellow),var(--green));border:none;border-radius:10px;padding:12px;font-size:13px;font-weight:900;cursor:pointer;color:#1A2340;font-family:inherit;">&#x1F4E4; Xuat Excel Misa</button>';
    el.innerHTML=html;
    document.getElementById('ex-all').addEventListener('change',function(){
      document.querySelectorAll('.ex-cb').forEach(function(c){c.checked=this.checked;},this);
    });
    document.getElementById('ex-do').addEventListener('click',function(){
      var mas=Array.from(document.querySelectorAll('.ex-cb:checked')).map(function(c){return c.getAttribute('data-ma');});
      if(!mas.length){_toast('Chon it nhat 1 HD','error');return;}
      _doExport(mas);
    });
  });
}
function _doExport(maNhaps){
  _toast('Dang tao sheet xuat Excel...','ok');
  _api()('misa_export_excel',{
    ma_nhaps:maNhaps,
    ky_hieu:(document.getElementById('ex-kyhieu')||{}).value||'AA/24E',
    mau_so:(document.getElementById('ex-mau_so')||{}).value||'01GTKT0/001',
    httt:(document.getElementById('ex-httt')||{}).value||'Chuyen khoan',
    nguoi_xuat:'admin'
  },function(e,d){
    if(!e&&d&&d.ok){
      _toast(d.msg,'ok');
      setTimeout(function(){
        if(confirm(d.msg+'\n\nMo Google Sheets de download Excel?'))
          window.open('https://docs.google.com/spreadsheets/d/'+(window.SPREADSHEET_ID||''),'_blank');
      },300);
      _loadExportList();
    } else _toast((d&&d.error)||'Loi xuat','error');
  });
}


})();
