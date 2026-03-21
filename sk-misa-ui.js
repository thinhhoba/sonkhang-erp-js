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
// TAB 3: TẠO HÓA ĐƠN NHÁP
// ════════════════════════════════════════════════════════════════
function _renderDraft(){
  var el=document.getElementById('misa-body');if(!el)return;
  el.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
    +'<input id="dr-q" type="text" placeholder="Ma don Sapo, ten khach..." '
      +'style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<button id="dr-search" style="'+bg('accent')+'border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim don</button>'
    +'</div>'
    +'<div id="dr-order-list"></div>';

  document.getElementById('dr-search').addEventListener('click',_loadSapoOrders);
  document.getElementById('dr-q').addEventListener('keydown',function(e){if(e.keyCode===13)_loadSapoOrders();});
  _loadSapoOrders();
}

function _loadSapoOrders(){
  var el=document.getElementById('dr-order-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Dang tai don hang Sapo...</div>';
  var apiF=_api();if(!apiF)return;
  var q=(document.getElementById('dr-q')||{}).value||'';
  apiF('sales_get_orders',{q:q,limit:30,page:1},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<div style="color:var(--red);padding:16px;">Loi tai don hang</div>';return;}
    var orders=d.data||d.orders||[];
    if(!orders.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Khong co don hang. Dong bo Sapo truoc.</div>';return;}

    var tbl='<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:700px;">'
      +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma don</th>'
        +'<th style="padding:9px 12px;text-align:left;">Khach hang</th>'
        +'<th style="padding:9px 12px;text-align:center;">Ngay</th>'
        +'<th style="padding:9px 12px;text-align:right;">Tong tien</th>'
        +'<th style="padding:9px 12px;text-align:center;">Trang thai</th>'
        +'<th style="padding:9px 12px;"></th>'
      +'</tr></thead><tbody>';

    orders.forEach(function(o,oi){
      var ev=oi%2===0?'var(--bg2)':'var(--bg3)';
      tbl+='<tr style="border-top:1px solid var(--border);background:'+ev+';">'
        +'<td style="padding:8px 12px;font-weight:700;color:'+C.cyan[2]+';">'+_esc(o.ma_don||o.code||o.id||'')+'</td>'
        +'<td style="padding:8px 12px;">'+_esc(o.khach_ten||o.customer||'')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;color:var(--text3);">'+_esc((o.ngay||o.created_at||'').split('T')[0])+'</td>'
        +'<td style="padding:8px 12px;text-align:right;font-weight:700;color:var(--green);">'+_fmt(o.tong_tt||o.total||0)+'d</td>'
        +'<td style="padding:8px 12px;text-align:center;">'+_badge(o.trang_thai||'moi','accent')+'</td>'
        +'<td style="padding:8px 12px;" id="dr-act-'+oi+'"></td>'
        +'</tr>';
    });
    tbl+='</tbody></table></div>';
    el.innerHTML=tbl;

    orders.forEach(function(o,oi){
      var td=document.getElementById('dr-act-'+oi);if(!td)return;
      var btn=document.createElement('button');
      btn.innerHTML='&#x1F4DD; Tao HD';
      btn.style.cssText=bg('green')+'border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;';
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        _showCreateDraftModal(o);
      });
      td.appendChild(btn);
    });
  });
}

function _showCreateDraftModal(order){
  var maDon = String(order.ma_don||order.code||order.id||'');
  var tongDon = Number(order.tong_tt||order.total||0);
  var items = order.items||order.line_items||[];

  var h='<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
    +'<div>'
      +'<div style="font-size:15px;font-weight:900;">Tao HD nhap tu don Sapo</div>'
      +'<div style="font-size:11px;color:var(--text2);margin-top:2px;">Don: <strong>'+_esc(maDon)+'</strong> | KH: <strong>'+_esc(order.khach_ten||'')+'</strong> | Tong: <strong style="color:var(--green);">'+_fmt(tongDon)+'d</strong></div>'
    +'</div>'
    +'<button id="cd-x" style="background:none;border:none;color:var(--text3);font-size:22px;cursor:pointer;">&#x00D7;</button>'
    +'</div>'
    // Chọn chế độ
    +'<div style="padding:16px 20px;border-bottom:1px solid var(--border);">'
      +'<div style="font-size:12px;font-weight:800;color:var(--text2);margin-bottom:10px;">Chon che do tao hoa don:</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
        // Mode 1
        +'<label id="mode-simple-label" style="cursor:pointer;background:rgba(0,214,143,.08);border:2px solid var(--green);border-radius:12px;padding:14px;display:block;">'
          +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
            +'<input type="radio" name="hd-mode" id="mode-simple" value="simple" checked> '
            +'<span style="font-size:13px;font-weight:900;color:var(--green);">Che do 1 — Don gian</span>'
          +'</div>'
          +'<div style="font-size:11px;color:var(--text2);line-height:1.5;">Chi lay SP Sapo co mapping Misa va con ton kho. Khong can bang tong gia tri don hang.</div>'
        +'</label>'
        // Mode 2
        +'<label id="mode-balance-label" style="cursor:pointer;background:var(--bg3);border:2px solid var(--border2);border-radius:12px;padding:14px;display:block;">'
          +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
            +'<input type="radio" name="hd-mode" id="mode-balance" value="balance"> '
            +'<span style="font-size:13px;font-weight:900;color:'+C.purple[2]+';">Che do 2 — Can bang gia tri</span>'
          +'</div>'
          +'<div style="font-size:11px;color:var(--text2);line-height:1.5;">Lay SP co mapping + goi y them SP Misa thay the SP Sapo khong co Misa, dieu chinh gia &#xB1;3% lam tron tram dong de xap xi tong don Sapo.</div>'
        +'</label>'
      +'</div>'
    +'</div>'
    // Thông tin khách
    +'<div style="padding:12px 20px;background:rgba(0,182,255,.05);border-bottom:1px solid var(--border);">'      +'<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:'+C.cyan[2]+';margin-bottom:10px;">Thong tin khach hang (tu Sapo)</div>'      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'        +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:5px;">Ten khach hang</label>'          +'<div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--text2);">'+_esc(order.khach_ten||'—')+'</div></div>'        +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:5px;">Ma so thue '          +(order.mst?'<span style=\"margin-left:6px;font-size:9px;background:'+C.cyan[0]+';border:1px solid '+C.cyan[1]+';color:'+C.cyan[2]+';border-radius:4px;padding:1px 6px;\">Tu Sapo</span>':'<span style=\"margin-left:6px;font-size:9px;background:'+C.yellow[0]+';border:1px solid '+C.yellow[1]+';color:'+C.yellow[2]+';border-radius:4px;padding:1px 6px;\">Chua co</span>')          +'</label>'          +'<input id="cd-mst" type="text" value="'+_esc(order.mst||'')+'" placeholder="Nhap MST neu can"'            +' style="width:100%;background:var(--bg3);border:1px solid '+(order.mst?C.cyan[1]:'var(--border2)')+';border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box;">'        +'</div>'        +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:5px;">Email</label>'          +'<input id="cd-email" type="text" value="'+_esc(order.email||'')+'" placeholder="email@..." style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box;">'        +'</div>'        +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:5px;">Ky hieu HD Misa</label>'          +'<input id="cd-kyhieu" type="text" value="AA/24E" placeholder="VD: AA/24E" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box;">'        +'</div>'        +'<div style="grid-column:1/-1;"><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:5px;">Dia chi '          +((order.dia_chi_gh||order.address)?'<span style=\"margin-left:6px;font-size:9px;background:'+C.cyan[0]+';border:1px solid '+C.cyan[1]+';color:'+C.cyan[2]+';border-radius:4px;padding:1px 6px;\">Tu don Sapo</span>':'')          +'</label>'          +'<input id="cd-dc" type="text" value="'+_esc(order.dia_chi_gh||order.address||'')+'" placeholder="Dia chi giao hang / xuat hoa don"'            +' style="width:100%;background:var(--bg3);border:1px solid '+((order.dia_chi_gh||order.address)?C.cyan[1]:'var(--border2)')+';border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box;">'        +'</div>'      +'</div>'
      +_inp('cd-kyhieu','Ky hieu HD Misa','text','AA/24E','VD: AA/24E')
      +'<div style="grid-column:1/-1;">'+_inp('cd-dc','Dia chi giao hang','text',order.dia_chi_gh||order.address||'','')+'</div>'
    +'</div>'
    +'<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;">'
      +'<button id="cd-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
      +'<button id="cd-create" style="'+bg('green')+'border-radius:8px;padding:8px 18px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;">Kiem tra &amp; Tao HD nhap</button>'
    +'</div>';

  _modal(h,'720px');
  document.getElementById('cd-x').addEventListener('click',_cm);
  document.getElementById('cd-cancel').addEventListener('click',_cm);

  // Mode toggle styling
  var radios=document.querySelectorAll('[name="hd-mode"]');
  radios.forEach(function(r2){
    r2.addEventListener('change',function(){
      document.getElementById('mode-simple-label').style.cssText='cursor:pointer;background:var(--bg3);border:2px solid var(--border2);border-radius:12px;padding:14px;display:block;';
      document.getElementById('mode-balance-label').style.cssText='cursor:pointer;background:var(--bg3);border:2px solid var(--border2);border-radius:12px;padding:14px;display:block;';
      var activeLabel=document.getElementById('mode-'+this.value+'-label');
      var borderC=this.value==='balance'?C.purple[1]:'rgba(0,214,143,.5)';
      var bgC=this.value==='balance'?'rgba(167,139,250,.08)':'rgba(0,214,143,.08)';
      if(activeLabel){ activeLabel.style.background=bgC; activeLabel.style.border='2px solid '+borderC; }
    });
  });

  document.getElementById('cd-create').addEventListener('click',function(){
    var mode=document.querySelector('[name="hd-mode"]:checked').value;
    var btn=this;btn.disabled=true;btn.textContent='Dang kiem tra...';
    _api()('misa_create_draft_v2',{
      ma_don:maDon, mode:mode,
      items:items.map(function(it){return{sku:String(it.sku||it.sapo_sku||it.variant_id||''),ten:String(it.ten||it.name||it.title||''),so_luong:Number(it.so_luong||it.quantity||1),don_gia:Number(it.don_gia||it.price||0)};}),
      tong_don:tongDon,
      khach_ten:String(order.khach_ten||''),
      mst:(document.getElementById('cd-mst')||{}).value||'',
      email:(document.getElementById('cd-email')||{}).value||'',
      so_hd_seri:(document.getElementById('cd-kyhieu')||{}).value||'AA/24E',
      dia_chi:(document.getElementById('cd-dc')||{}).value||'',
      nguoi_tao:'admin'
    },function(e2,d2){
      btn.disabled=false;btn.textContent='Kiem tra & Tao HD nhap';
      if(!e2&&d2&&d2.ok){
        _cm();
        _showDraftResult(d2,mode,maDon);
      } else _toast((d2&&d2.error)||'Loi','error');
    });
  });
}

function _showDraftResult(result,mode,maDon){
  var included=result.included||[], skipped=result.skipped||[], suggestions=result.suggestions||[];
  var tongIncl=result.tong_included||0, tongDon=result.tong_don_sapo||0, gap=result.gap||0;

  var incHtml='<div style="margin-bottom:12px;">'
    +'<div style="font-size:12px;font-weight:900;color:var(--green);margin-bottom:6px;">&#x2705; SP da dua vao HD ('+included.length+')</div>'
    +'<div style="border-radius:10px;border:1px solid var(--border);overflow:hidden;">'
    +'<table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr style="background:var(--bg3);">'
    +'<th style="padding:6px 10px;text-align:left;font-size:10px;color:var(--text3);">Ma Misa</th>'
    +'<th style="padding:6px 10px;text-align:left;">Ten hang</th>'
    +'<th style="padding:6px 10px;text-align:center;">DVT</th>'
    +'<th style="padding:6px 10px;text-align:right;">SL</th>'
    +'<th style="padding:6px 10px;text-align:right;">Don gia</th>'
    +'<th style="padding:6px 10px;text-align:right;">Tong</th>'
    +'</tr></thead><tbody>'
    +included.map(function(r){
      return '<tr style="border-top:1px solid var(--border);">'
        +'<td style="padding:5px 10px;font-family:monospace;font-size:10px;color:var(--green);">'+_esc(r.misa_ma)+'</td>'
        +'<td style="padding:5px 10px;">'+_esc(r.misa_ten||'')+'</td>'
        +'<td style="padding:5px 10px;text-align:center;color:var(--text3);">'+_esc(r.dvt||'')+'</td>'
        +'<td style="padding:5px 10px;text-align:right;">'+r.so_luong+'</td>'
        +'<td style="padding:5px 10px;text-align:right;">'+_fmt(r.don_gia)+'</td>'
        +'<td style="padding:5px 10px;text-align:right;font-weight:700;">'+_fmt(r.thanh_tien||r.so_luong*r.don_gia)+'</td>'
        +'</tr>';
    }).join('')
    +'</tbody></table></div></div>';

  var skipHtml='';
  if(skipped.length){
    skipHtml='<div style="margin-bottom:12px;">'
      +'<div style="font-size:12px;font-weight:900;color:var(--yellow);margin-bottom:6px;">&#x26A0; SP Sapo khong co trong Misa / het ton ('+skipped.length+')</div>'
      +'<div style="background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.2);border-radius:10px;padding:10px;">'
      +skipped.map(function(r){return '<div style="font-size:11px;display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(251,191,36,.1);">'
        +'<span style="color:var(--text2);">'+_esc(r.ten||r.sku||'')+'</span>'
        +'<span style="color:var(--yellow);font-size:10px;">'+_esc(r.ly_do||'')+'</span>'
        +'</div>';}).join('')
      +'</div></div>';
  }

  var suggestHtml='';
  var confirmedItems=[];

  if(mode==='balance'&&suggestions.length){
    suggestHtml='<div id="suggest-section" style="margin-bottom:12px;">'
      +'<div style="font-size:12px;font-weight:900;color:'+C.purple[2]+';margin-bottom:8px;">&#x1F4A1; Goi y SP bo sung de can bang gia tri don (gap: <strong>'+_fmt(gap)+'d</strong>)</div>'
      +'<div style="font-size:10px;color:var(--text3);margin-bottom:8px;">Gia da dieu chinh &#xB1;3%, lam tron hang tram dong. Chon SP muon them vao HD, co the sua so luong va gia.</div>'
      +'<div style="border-radius:10px;border:1px solid '+C.purple[1]+';overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:11px;min-width:700px;">'
      +'<thead><tr style="background:rgba(167,139,250,.08);">'
      +'<th style="padding:6px 10px;width:36px;"></th>'
      +'<th style="padding:6px 10px;text-align:left;font-size:10px;color:var(--text3);">Ma Misa</th>'
      +'<th style="padding:6px 10px;text-align:left;">Ten hang</th>'
      +'<th style="padding:6px 10px;text-align:center;">DVT</th>'
      +'<th style="padding:6px 10px;text-align:right;">Ton</th>'
      +'<th style="padding:6px 10px;text-align:right;">SL de xuat</th>'
      +'<th style="padding:6px 10px;text-align:right;">Gia goc</th>'
      +'<th style="padding:6px 10px;text-align:right;">Gia de xuat</th>'
      +'<th style="padding:6px 10px;text-align:center;">% ±</th>'
      +'<th style="padding:6px 10px;text-align:right;">Thanh tien</th>'
      +'</tr></thead><tbody>'
      +suggestions.map(function(s,si){
        var pct=s.change_pct||0;
        var pctC=pct>0?'var(--yellow)':pct<0?'var(--cyan)':'var(--text3)';
        return '<tr style="border-top:1px solid var(--border);" id="sug-row-'+si+'">'
          +'<td style="padding:5px 8px;text-align:center;"><input type="checkbox" class="sug-cb" data-si="'+si+'" checked></td>'
          +'<td style="padding:5px 10px;font-family:monospace;font-size:10px;color:'+C.purple[2]+';">'+_esc(s.misa_ma)+'</td>'
          +'<td style="padding:5px 10px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+_esc(s.misa_ten||'')+'">'+_esc(s.misa_ten||'')+'</td>'
          +'<td style="padding:5px 10px;text-align:center;color:var(--text3);">'+_esc(s.dvt||'')+'</td>'
          +'<td style="padding:5px 10px;text-align:right;color:var(--green);">'+_fmt(s.ton_kho>0?s.ton_kho:0)+'</td>'
          +'<td style="padding:5px 10px;text-align:right;"><input type="number" class="sug-sl" data-si="'+si+'" value="'+s.so_luong+'" min="1" style="width:55px;background:var(--bg3);border:1px solid var(--border2);border-radius:4px;padding:3px 5px;font-size:11px;text-align:right;color:var(--text);"></td>'
          +'<td style="padding:5px 10px;text-align:right;color:var(--text3);">'+_fmt(s.don_gia_goc)+'</td>'
          +'<td style="padding:5px 10px;text-align:right;"><input type="number" class="sug-gia" data-si="'+si+'" value="'+s.don_gia_de_xuat+'" step="100" style="width:90px;background:var(--bg3);border:1px solid rgba(251,191,36,.4);border-radius:4px;padding:3px 5px;font-size:11px;text-align:right;color:var(--text);"></td>'
          +'<td style="padding:5px 10px;text-align:center;font-size:10px;font-weight:700;color:'+pctC+';">'+(pct>=0?'+':'')+pct+'%</td>'
          +'<td style="padding:5px 10px;text-align:right;font-weight:700;" id="sug-tt-'+si+'">'+_fmt(s.thanh_tien)+'</td>'
          +'</tr>';
      }).join('')
      +'</tbody></table></div>'
      // Tổng gợi ý
      +'<div id="sug-total" style="margin-top:8px;font-size:12px;color:var(--text3);">Tong bo sung goi y: <strong id="sug-total-val" style="color:'+C.purple[2]+';">'+_fmt(suggestions.reduce(function(a,s){return a+s.thanh_tien;},0))+'d</strong></div>'
    +'</div>';
  }

  var totHtml='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:12px;">'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;font-size:12px;">'
    +'<div><span style="color:var(--text3);">Tong don Sapo: </span><strong style="color:var(--text);">'+_fmt(tongDon)+'d</strong></div>'
    +'<div><span style="color:var(--text3);">Tong SP dua vao: </span><strong style="color:var(--green);">'+_fmt(tongIncl)+'d</strong></div>'
    +(gap>0?'<div><span style="color:var(--text3);">Chenh lech: </span><strong style="color:var(--yellow);">'+_fmt(gap)+'d</strong></div>':'')
    +'</div>'
    +'</div>';

  var footHtml='<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
    +'<button id="dr-back" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">&#x2190; Quay lai</button>'
    +(mode==='balance'&&suggestions.length
      ?'<button id="dr-confirm-sug" style="'+bg('purple')+'border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2795; Them SP goi y da chon</button>':'')
    +'<button id="dr-goto-list" style="'+bg('green')+'border-radius:8px;padding:8px 16px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;">Xem danh sach HD nhap &#x2192;</button>'
    +'</div>';

  _modal('<div style="padding:16px 20px;border-bottom:1px solid var(--border);">'
    +'<div style="font-size:15px;font-weight:900;">Ket qua tao HD nhap</div>'
    +'<div style="font-size:11px;color:var(--text3);margin-top:2px;">Ma HD: '+_esc(result.ma_nhap||'')+'  |  Don Sapo: '+_esc(maDon)+'</div>'
    +'</div>'
    +'<div style="padding:14px 20px;max-height:65vh;overflow-y:auto;">'
      +totHtml+incHtml+skipHtml+suggestHtml
    +'</div>'+footHtml, '820px');

  document.getElementById('dr-back').addEventListener('click',_cm);
  document.getElementById('dr-goto-list').addEventListener('click',function(){
    _cm();
    document.querySelector('[data-t="list"]').click();
  });

  // Recalc suggestion totals when user edits
  if(mode==='balance'&&suggestions.length){
    function _recalcSugTotals(){
      var total=0;
      suggestions.forEach(function(s,si){
        var slInp=document.querySelector('.sug-sl[data-si="'+si+'"]');
        var giaInp=document.querySelector('.sug-gia[data-si="'+si+'"]');
        var cb=document.querySelector('.sug-cb[data-si="'+si+'"]');
        if(!slInp||!giaInp||!cb) return;
        var sl=Number(slInp.value||0);
        var gia=Number(giaInp.value||0);
        // Validate ±3%
        var maxG=Math.ceil(s.don_gia_goc*1.03/100)*100;
        var minG=Math.floor(s.don_gia_goc*0.97/100)*100;
        if(gia>maxG||gia<minG){giaInp.style.borderColor='var(--red)';}
        else {giaInp.style.borderColor='rgba(251,191,36,.4)';}
        var tt=sl*gia;
        var ttEl=document.getElementById('sug-tt-'+si);
        if(ttEl) ttEl.textContent=_fmt(tt)+'d';
        if(cb.checked) total+=tt;
      });
      var tv=document.getElementById('sug-total-val');
      if(tv) tv.textContent=_fmt(total)+'d';
    }
    document.querySelectorAll('.sug-sl,.sug-gia,.sug-cb').forEach(function(inp){
      inp.addEventListener('input',_recalcSugTotals);
    });

    document.getElementById('dr-confirm-sug').addEventListener('click',function(){
      var toAdd=[];
      suggestions.forEach(function(s,si){
        var cb=document.querySelector('.sug-cb[data-si="'+si+'"]');
        if(!cb||!cb.checked) return;
        var sl=Number((document.querySelector('.sug-sl[data-si="'+si+'"]')||{}).value||s.so_luong);
        var gia=Number((document.querySelector('.sug-gia[data-si="'+si+'"]')||{}).value||s.don_gia_de_xuat);
        // Validate ±3%
        var maxG=Math.ceil(s.don_gia_goc*1.03/100)*100;
        var minG=Math.floor(s.don_gia_goc*0.97/100)*100;
        if(gia>maxG||gia<minG){_toast('Gia SP "'+s.misa_ma+'" vuot bien do ±3% ('+_fmt(minG)+'–'+_fmt(maxG)+'d)','error');return;}
        toAdd.push(Object.assign({},s,{so_luong:sl,don_gia:gia,tong_cong:sl*gia}));
      });
      if(!toAdd.length){_toast('Chua chon SP nao','error');return;}
      var btn2=this;btn2.disabled=true;btn2.textContent='Dang luu...';
      _api()('misa_confirm_suggestions',{ma_nhap:result.ma_nhap,items:toAdd},function(e3,d3){
        btn2.disabled=false;btn2.textContent='Them SP goi y da chon';
        if(!e3&&d3&&d3.ok){
          _toast('Da them '+d3.added+' SP bo sung vao HD','ok');
          btn2.style.display='none';
          document.querySelectorAll('.sug-cb:checked').forEach(function(cb2){
            var si=cb2.getAttribute('data-si');
            var row=document.getElementById('sug-row-'+si);
            if(row) row.style.background='rgba(0,214,143,.1)';
          });
        } else _toast((d3&&d3.error)||'Loi','error');
      });
    });
  }
}

// ════════════════════════════════════════════════════════════════
// TAB 4: DANH SÁCH HD NHÁP
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
        +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma HD nhap</th>'
        +'<th style="padding:8px 12px;text-align:left;">Ma don Sapo</th>'
        +'<th style="padding:8px 12px;text-align:left;">Khach hang</th>'
        +'<th style="padding:8px 12px;text-align:center;">So dong</th>'
        +'<th style="padding:8px 12px;text-align:right;">Tong cong</th>'
        +'<th style="padding:8px 12px;text-align:center;">Ngay</th>'
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
          +'<td style="padding:8px 12px;text-align:center;color:var(--text3);">'+_esc(g.ngay||'')+'</td>'
          +'<td style="padding:8px 12px;text-align:center;">'+tt+'</td>'
          +'<td style="padding:8px 12px;" id="ls-act-'+gi+'"></td>'
          +'</tr>';
      }).join('')
      +'</tbody></table></div>'
      +'<div style="font-size:11px;color:var(--text3);margin-top:8px;text-align:right;">'+d.total+' HD nhap</div>';

    el.innerHTML=selBar+tbl;

    document.getElementById('ls-all').addEventListener('change',function(){
      document.querySelectorAll('.ls-cb').forEach(function(c2){c2.checked=this.checked;},this);
      _updLsBar();
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
  var bar=document.getElementById('ls-sel-bar');
  var cnt=document.getElementById('ls-sel-cnt');
  if(bar) bar.style.display=n?'flex':'none';
  if(cnt) cnt.textContent=n+' HD da chon';
}

// ════════════════════════════════════════════════════════════════
// TAB 5: XUẤT EXCEL MISA
// ════════════════════════════════════════════════════════════════
function _renderExport(){
  var el=document.getElementById('misa-body');if(!el)return;
  el.innerHTML='<div style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);border-radius:12px;padding:12px 16px;margin-bottom:14px;font-size:12px;color:var(--yellow);font-weight:700;">'
    +'Sau khi xuat: Mo Google Sheets → File → Download → Microsoft Excel (.xlsx) → Import vao Misa AMIS'
    +'</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">'
    +'<input id="ex-q" type="text" placeholder="Tim HD nhap can xuat..." style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<button id="ex-search" style="'+bg('accent')+'border-radius:8px;padding:8px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Loc</button>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;">'
    +_inp('ex-kyhieu','Ky hieu HD Misa (*)','text','AA/24E','VD: AA/24E, DD/24E')
    +_inp('ex-mau_so','Mau so HD','text','01GTKT0/001','')
    +'<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:5px;">HTTT</label>'
    +'<select id="ex-httt" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
    +'<option>Chuyen khoan</option><option>Tien mat</option><option>TM/CK</option><option>Cong no</option>'
    +'</select></div>'
    +'</div>'
    +'<div id="ex-list"></div>';

  document.getElementById('ex-search').addEventListener('click',_loadExportableList);
  document.getElementById('ex-q').addEventListener('keydown',function(e){if(e.keyCode===13)_loadExportableList();});
  _loadExportableList();
}

function _loadExportableList(){
  var el=document.getElementById('ex-list');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
  _api()('misa_get_draft_list',{trang_thai:'nhap',q:(document.getElementById('ex-q')||{}).value||'',limit:50},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<div style="color:var(--red);padding:16px;">Loi</div>';return;}
    var rows=d.data||[];
    if(!rows.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Khong co HD nhap nao cho xuat. Tao HD nhap o tab "Tao HD nhap".</div>';return;}
    var tbl='<div style="border-radius:12px;border:1px solid var(--border);overflow:auto;">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;min-width:600px;">'
      +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:8px;"><input type="checkbox" id="ex-all" checked></th>'
        +'<th style="padding:8px 12px;text-align:left;font-size:10px;font-weight:800;color:var(--text3);">Ma HD nhap</th>'
        +'<th style="padding:8px 12px;text-align:left;">Ma don / Khach</th>'
        +'<th style="padding:8px 12px;text-align:center;">So dong</th>'
        +'<th style="padding:8px 12px;text-align:right;">Tong cong</th>'
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
      }).join('')
      +'</tbody></table></div>';
    el.innerHTML=tbl
      +'<button id="ex-do-export" style="width:100%;margin-top:12px;background:linear-gradient(135deg,var(--yellow),var(--green));border:none;border-radius:10px;padding:12px;font-size:13px;font-weight:900;cursor:pointer;color:#1A2340;font-family:inherit;">&#x1F4E4; Xuat file Excel Misa (cac HD da chon)</button>';
    document.getElementById('ex-all').addEventListener('change',function(){
      document.querySelectorAll('.ex-cb').forEach(function(c){c.checked=this.checked;},this);
    });
    document.getElementById('ex-do-export').addEventListener('click',function(){
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
        if(confirm(d.msg+'\n\nMo Google Sheets de download as Excel?')){
          window.open('https://docs.google.com/spreadsheets/d/'+(window.SPREADSHEET_ID||''),'_blank');
        }
      },300);
      _loadExportableList();
    } else _toast((d&&d.error)||'Loi xuat','error');
  });
}

})();
