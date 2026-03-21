/* ================================================================
 * sk-purchasing-ui.js  SonKhang ERP v5.5.0
 * Module Mua hang (Purchasing):
 *   - Danh sach NCC (Nha cung cap)
 *   - PO (Purchase Order): tao, duyet, nhan hang
 *   - Cap nhat ton kho tu PO da nhan
 *   - Bao cao mua hang
 * 21/03/2026 — 0 non-ASCII, DOM API
 * ================================================================ */
(function () {
  'use strict';

  var _api   = function(){ return typeof window.api==='function'?window.api:null; };
  var _ct    = function(){ var c=typeof window.getContent==='function'?window.getContent():null; return c||document.getElementById('sk-ct'); };
  var _esc   = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var _fmt   = function(n){ return (Number(n)||0).toLocaleString('vi-VN'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };

  var STATE = { tab:'po', page:1, q:'', status:'' };

  var STATUS_LABELS = {
    'cho_duyet':'Cho duyet', 'da_duyet':'Da duyet',
    'dang_giao':'Dang giao', 'da_nhan':'Da nhan', 'huy':'Da huy'
  };
  var STATUS_COLORS = {
    'cho_duyet':'var(--yellow)', 'da_duyet':'var(--accent2)',
    'dang_giao':'var(--cyan)', 'da_nhan':'var(--green)', 'huy':'var(--red)'
  };

  // ── Modal ───────────────────────────────────────────────────────
  function _modal(html,maxW){
    var old=document.getElementById('sk-po-modal');
    if(old&&old.parentNode) old.parentNode.removeChild(old);
    var ov=document.createElement('div');
    ov.id='sk-po-modal';
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;';
    var box=document.createElement('div');
    box.style.cssText='background:var(--bg2);border:1px solid var(--border2);border-radius:18px;width:100%;max-width:'+(maxW||'720px')+';margin:auto;';
    box.innerHTML=html;
    ov.appendChild(box);
    ov.addEventListener('click',function(e){if(e.target===ov)_closeModal();});
    document.body.appendChild(ov);
  }
  function _closeModal(){ var m=document.getElementById('sk-po-modal'); if(m&&m.parentNode) m.parentNode.removeChild(m); }
  window.closePOModal = _closeModal;

  // ── Main ─────────────────────────────────────────────────────────
  function loadMuaHang() {
    var ct = _ct(); if (!ct) return;
    ct.innerHTML = '<div class="fade-in" style="padding:24px;">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
      +'<div><h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F6D2; Mua hang</h1>'
      +'<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">NCC · Lenh mua · Nhan hang · Nhap kho</p></div>'
      +'<button id="po-new-btn" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">+ Tao lenh mua</button>'
      +'</div>'
      // KPI
      +'<div id="po-kpi" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:20px;"></div>'
      // Tabs
      +'<div style="display:flex;gap:4px;margin-bottom:16px;">'
      +[['po','&#x1F4CB; Lenh mua'],['ncc','&#x1F3ED; Nha cung cap'],['report','&#x1F4CA; Bao cao']].map(function(t,i){
        return '<button data-mh-tab="'+t[0]+'" style="border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;'+(i===0?'background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);':'background:var(--bg3);border:1px solid var(--border2);color:var(--text3);')+'">'+t[1]+'</button>';
      }).join('')
      +'</div>'
      +'<div id="po-body"></div>'
      +'</div>';

    document.querySelectorAll('[data-mh-tab]').forEach(function(btn){
      btn.addEventListener('click', function(){
        STATE.tab = btn.getAttribute('data-mh-tab');
        document.querySelectorAll('[data-mh-tab]').forEach(function(b){
          b.style.background='var(--bg3)'; b.style.borderColor='var(--border2)'; b.style.color='var(--text3)';
        });
        btn.style.background='rgba(79,111,255,.15)'; btn.style.borderColor='rgba(79,111,255,.3)'; btn.style.color='var(--accent2)';
        _renderTab(STATE.tab);
      });
    });
    document.getElementById('po-new-btn').addEventListener('click', function(){ _showPOForm(null); });
    _loadKPI();
    _renderTab('po');
  }
  window.loadMuaHang   = loadMuaHang;
  window.loadPurchasing = loadMuaHang;

  // ── KPI ──────────────────────────────────────────────────────────
  function _loadKPI() {
    var apiF = _api(); if (!apiF) return;
    apiF('po_get_list', { limit:500 }, function(e,d){
      var el = document.getElementById('po-kpi'); if (!el) return;
      var rows = (!e&&d&&d.ok) ? d.data||[] : [];
      var pending  = rows.filter(function(r){ return r.status==='cho_duyet'; }).length;
      var approved = rows.filter(function(r){ return r.status==='da_duyet'||r.status==='dang_giao'; }).length;
      var received = rows.filter(function(r){ return r.status==='da_nhan'; }).length;
      var tongGT   = rows.reduce(function(a,r){ return a+(Number(r.tong_gt)||0); }, 0);
      var items = [
        {icon:'&#x23F3;',label:'Cho duyet',  val:pending,      c:'var(--yellow)'},
        {icon:'&#x1F4E6;',label:'Dang giao', val:approved,     c:'var(--cyan)'},
        {icon:'&#x2705;', label:'Da nhan',   val:received,     c:'var(--green)'},
        {icon:'&#x1F4B0;',label:'Tong GT (d)',val:_fmt(tongGT),c:'var(--text2)'},
      ];
      el.innerHTML = items.map(function(it){
        return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;gap:10px;align-items:center;">'
          +'<div style="font-size:20px;">'+it.icon+'</div>'
          +'<div><div style="font-size:16px;font-weight:900;color:'+it.c+';">'+it.val+'</div>'
          +'<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);">'+it.label+'</div></div></div>';
      }).join('');
    });
  }

  // ── Tabs ─────────────────────────────────────────────────────────
  function _renderTab(tab) {
    if (tab==='po')     _renderPOList();
    else if (tab==='ncc')    _renderNCCList();
    else if (tab==='report') _renderReport();
  }

  // ── PO List ─────────────────────────────────────────────────────
  function _renderPOList() {
    var el = document.getElementById('po-body'); if (!el) return;
    el.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">'
      +'<input id="po-q" type="text" placeholder="Tim ma PO, NCC..." style="flex:1;min-width:200px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
      +'<select id="po-status" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:12px;">'
      +'<option value="">Tat ca trang thai</option>'
      +Object.keys(STATUS_LABELS).map(function(k){ return '<option value="'+k+'">'+STATUS_LABELS[k]+'</option>'; }).join('')
      +'</select>'
      +'<button id="po-search-btn" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
      +'</div>'
      +'<div id="po-list"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>';

    document.getElementById('po-search-btn').addEventListener('click', function(){
      STATE.q=document.getElementById('po-q').value;
      STATE.status=document.getElementById('po-status').value;
      _loadPOs();
    });
    document.getElementById('po-q').addEventListener('keydown',function(e){if(e.keyCode===13)document.getElementById('po-search-btn').click();});
    _loadPOs();
  }

  function _loadPOs() {
    var el = document.getElementById('po-list'); if (!el) return;
    el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
    var apiF = _api(); if (!apiF) return;
    apiF('po_get_list', { q:STATE.q, status:STATE.status, page:STATE.page, limit:30 }, function(e,d){
      if (e||!d||!d.ok) { el.innerHTML='<p style="color:var(--red);padding:16px;">Loi tai lenh mua</p>'; return; }
      var rows = d.data||[];
      if (!rows.length) {
        el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text3);"><div style="font-size:36px;margin-bottom:12px;">&#x1F4CB;</div><div style="font-size:14px;font-weight:700;">Chua co lenh mua nao</div></div>';
        return;
      }
      var html='<div style="border-radius:12px;border:1px solid var(--border);overflow:hidden;">'
        +'<table style="width:100%;border-collapse:collapse;font-size:12px;">'
        +'<thead><tr style="background:var(--bg3);">'
        +'<th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);">Ma PO</th>'
        +'<th style="padding:10px 12px;text-align:left;">NCC</th>'
        +'<th style="padding:10px 12px;text-align:left;">Ngay</th>'
        +'<th style="padding:10px 12px;text-align:right;">Tong GT</th>'
        +'<th style="padding:10px 12px;text-align:center;">Trang thai</th>'
        +'<th style="padding:10px 12px;"></th>'
        +'</tr></thead><tbody>';
      rows.forEach(function(r){
        var sc=STATUS_COLORS[r.status]||'var(--text3)';
        var sl=STATUS_LABELS[r.status]||r.status||'';
        html+='<tr style="border-top:1px solid var(--border);cursor:pointer;" id="po-row-'+_esc(r.id)+'">'
          +'<td style="padding:8px 12px;font-family:monospace;color:var(--accent2);">'+_esc(r.ma_po||r.id||'')+'</td>'
          +'<td style="padding:8px 12px;font-weight:700;">'+_esc(r.ncc_ten||r.ncc_id||'')+'</td>'
          +'<td style="padding:8px 12px;color:var(--text3);">'+_esc(r.ngay||'')+'</td>'
          +'<td style="padding:8px 12px;text-align:right;font-weight:700;">'+_fmt(r.tong_gt||0)+'</td>'
          +'<td style="padding:8px 12px;text-align:center;"><span style="padding:2px 8px;border-radius:5px;font-size:10px;font-weight:800;color:'+sc+';">'+sl+'</span></td>'
          +'<td style="padding:8px 12px;" id="po-act-'+_esc(r.id)+'"></td>'
          +'</tr>';
      });
      html+='</tbody></table></div>';
      el.innerHTML=html;
      rows.forEach(function(r){
        var td=document.getElementById('po-act-'+r.id); if(!td)return;
        var btn=document.createElement('button');
        btn.innerHTML='&#x270F;';
        btn.style.cssText='background:rgba(79,111,255,.1);border:1px solid rgba(79,111,255,.2);border-radius:6px;padding:4px 8px;font-size:13px;cursor:pointer;';
        btn.addEventListener('click',function(e){e.stopPropagation();_showPOForm(r);});
        td.appendChild(btn);
        var row=document.getElementById('po-row-'+r.id);
        if(row) row.addEventListener('click',function(){_showPODetail(r);});
      });
    });
  }

  // ── PO Detail ───────────────────────────────────────────────────
  function _showPODetail(po) {
    var sc=STATUS_COLORS[po.status]||'var(--text3)';
    var sl=STATUS_LABELS[po.status]||po.status||'';
    var h='<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
      +'<div><div style="font-size:15px;font-weight:900;">Lenh mua: '+_esc(po.ma_po||po.id||'')+'</div>'
      +'<span style="padding:2px 8px;border-radius:5px;font-size:11px;font-weight:800;color:'+sc+';">'+sl+'</span>'
      +'</div><button id="po-d-x" style="background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;">&#x00D7;</button>'
      +'</div>'
      +'<div style="padding:16px 20px;">'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:16px;">'
      +'<div style="background:var(--bg3);border-radius:8px;padding:10px;"><div style="font-size:10px;color:var(--text3);margin-bottom:2px;">NCC</div><div style="font-weight:700;">'+_esc(po.ncc_ten||po.ncc_id||'')+'</div></div>'
      +'<div style="background:var(--bg3);border-radius:8px;padding:10px;"><div style="font-size:10px;color:var(--text3);margin-bottom:2px;">Ngay tao</div><div style="font-weight:700;">'+_esc(po.ngay||'')+'</div></div>'
      +'<div style="background:var(--bg3);border-radius:8px;padding:10px;"><div style="font-size:10px;color:var(--text3);margin-bottom:2px;">Tong gia tri</div><div style="font-size:16px;font-weight:900;color:var(--green);">'+_fmt(po.tong_gt||0)+'d</div></div>'
      +'<div style="background:var(--bg3);border-radius:8px;padding:10px;"><div style="font-size:10px;color:var(--text3);margin-bottom:2px;">Ghi chu</div><div style="font-weight:700;">'+_esc(po.ghi_chu||'—')+'</div></div>'
      +'</div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      +(po.status==='cho_duyet'?'<button id="po-d-approve" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2705; Duyet PO</button>':'')
      +(po.status==='da_duyet'?'<button id="po-d-ship" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F69A; Dang giao</button>':'')
      +(po.status==='dang_giao'?'<button id="po-d-receive" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4E6; Nhan hang + Nhap kho</button>':'')
      +(po.status!=='da_nhan'&&po.status!=='huy'?'<button id="po-d-cancel" style="background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.2);color:var(--red);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Huy PO</button>':'')
      +'<button id="po-d-close" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Dong</button>'
      +'</div></div>';

    _modal(h,'680px');
    document.getElementById('po-d-x').addEventListener('click',_closeModal);
    document.getElementById('po-d-close').addEventListener('click',_closeModal);

    var apiF=_api();
    function _updateStatus(newStatus){
      if (!apiF) return;
      apiF('po_update_status',{id:po.id,status:newStatus},function(e,d){
        if(!e&&d&&d.ok){
          _toast('Cap nhat: '+STATUS_LABELS[newStatus],'ok');
          _closeModal(); _loadPOs(); _loadKPI();
          if(newStatus==='da_nhan') _toast('Ton kho da duoc cap nhat!','ok');
        } else _toast((d&&d.error)||'Loi cap nhat','error');
      });
    }
    var aBtn=document.getElementById('po-d-approve');
    if(aBtn) aBtn.addEventListener('click',function(){_updateStatus('da_duyet');});
    var sBtn=document.getElementById('po-d-ship');
    if(sBtn) sBtn.addEventListener('click',function(){_updateStatus('dang_giao');});
    var rBtn=document.getElementById('po-d-receive');
    if(rBtn) rBtn.addEventListener('click',function(){_updateStatus('da_nhan');});
    var cBtn=document.getElementById('po-d-cancel');
    if(cBtn) cBtn.addEventListener('click',function(){
      if(confirm('Huy lenh mua '+_esc(po.ma_po||po.id||'')+'?')) _updateStatus('huy');
    });
  }

  // ── PO Form ──────────────────────────────────────────────────────
  function _showPOForm(po) {
    var isNew=!po;
    var h='<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
      +'<div style="font-size:15px;font-weight:900;">'+(isNew?'Tao lenh mua moi':'Sua lenh mua')+'</div>'
      +'<button id="pof-x" style="background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;">&#x00D7;</button>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px;">'
      +_field2('pof-ncc','Nha cung cap *','text',po?po.ncc_ten||po.ncc_id:'')
      +_field2('pof-ngay','Ngay dat hang','date',po?po.ngay:(new Date().toISOString().split('T')[0]))
      +_field2('pof-ngay-du','Ngay du kien nhan','date',po?po.ngay_du_kien:'')
      +_field2('pof-pt-tt','Phuong thuc TT','text',po?po.pt_tt:'Chuyen khoan')
      +'<div style="grid-column:1/-1;"><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">Ghi chu</label>'
      +'<textarea id="pof-ghichu" rows="2" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;resize:none;">'+_esc(po?po.ghi_chu||'':'')+'</textarea></div>'
      +_field2('pof-tong','Tong gia tri du kien','number',po?po.tong_gt||0:0)
      +'<div></div>'
      +'</div>'
      +'<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
      +'<button id="pof-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
      +'<button id="pof-save" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--accent2);font-family:inherit;">'+(isNew?'Tao lenh mua':'Luu')+'</button>'
      +'</div>';

    _modal(h,'600px');
    document.getElementById('pof-x').addEventListener('click',_closeModal);
    document.getElementById('pof-cancel').addEventListener('click',_closeModal);
    document.getElementById('pof-save').addEventListener('click',function(){
      var ncc=document.getElementById('pof-ncc').value.trim();
      if(!ncc){_toast('Nhap ten NCC','error');return;}
      var btn=document.getElementById('pof-save'); btn.disabled=true; btn.textContent='Dang luu...';
      var apiF=_api(); if(!apiF)return;
      apiF('po_save',{
        id:po?po.id:undefined, ncc_ten:ncc,
        ngay:document.getElementById('pof-ngay').value,
        ngay_du_kien:document.getElementById('pof-ngay-du').value,
        pt_tt:document.getElementById('pof-pt-tt').value,
        ghi_chu:document.getElementById('pof-ghichu').value,
        tong_gt:Number(document.getElementById('pof-tong').value||0)
      },function(e,d){
        btn.disabled=false; btn.textContent=isNew?'Tao lenh mua':'Luu';
        if(e||!d||!d.ok){_toast((d&&d.error)||'Loi','error');return;}
        _toast((isNew?'Da tao PO: ':'Da cap nhat: ')+(d.ma_po||''),'ok');
        _closeModal(); _loadPOs(); _loadKPI();
      });
    });
  }

  // ── NCC List ─────────────────────────────────────────────────────
  function _renderNCCList() {
    var el=document.getElementById('po-body'); if(!el)return;
    el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
      +'<div style="font-size:13px;font-weight:900;color:var(--text2);">Nha cung cap (NCC)</div>'
      +'<button id="ncc-new-btn" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">+ Them NCC</button>'
      +'</div>'
      +'<div id="ncc-list"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>';

    document.getElementById('ncc-new-btn').addEventListener('click',function(){ _showNCCForm(null); });

    var apiF=_api(); if(!apiF)return;
    apiF('po_get_suppliers',{},function(e,d){
      var nccEl=document.getElementById('ncc-list'); if(!nccEl)return;
      var rows=(!e&&d&&d.ok)?d.data||[]:[];
      if(!rows.length){
        nccEl.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Chua co NCC</div>'; return;
      }
      var html='<div style="display:grid;gap:8px;">';
      rows.forEach(function(r){
        html+='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;">'
          +'<div>'
          +'<div style="font-size:13px;font-weight:900;">'+_esc(r.ten||'')+'</div>'
          +'<div style="font-size:11px;color:var(--text3);">'+_esc(r.phone||'')+(r.email?' · '+_esc(r.email):'')+'</div>'
          +(r.dia_chi?'<div style="font-size:11px;color:var(--text3);">'+_esc(r.dia_chi)+'</div>':'')
          +'</div>'
          +'<button data-ncc-edit="'+_esc(r.id)+'" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:15px;flex-shrink:0;">&#x270F;</button>'
          +'</div>';
      });
      html+='</div>';
      nccEl.innerHTML=html;
      nccEl.querySelectorAll('[data-ncc-edit]').forEach(function(btn){
        btn.addEventListener('click',function(){
          var id=btn.getAttribute('data-ncc-edit');
          var ncc=rows.find(function(r){return r.id===id;});
          if(ncc) _showNCCForm(ncc);
        });
      });
    });
  }

  function _showNCCForm(ncc){
    var isNew=!ncc;
    var h='<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
      +'<div style="font-size:15px;font-weight:900;">'+(isNew?'Them NCC moi':'Sua NCC')+'</div>'
      +'<button id="nccf-x" style="background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;">&#x00D7;</button>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px;">'
      +_field2('nccf-ten','Ten NCC *','text',ncc?ncc.ten:'')
      +_field2('nccf-phone','Dien thoai','tel',ncc?ncc.phone:'')
      +_field2('nccf-email','Email','email',ncc?ncc.email:'')
      +_field2('nccf-mst','Ma so thue','text',ncc?ncc.mst:'')
      +_field2('nccf-ngan-hang','Tai khoan NH','text',ncc?ncc.ngan_hang:'')
      +_field2('nccf-nguon','Nguon hang','text',ncc?ncc.nguon:'Trong nuoc')
      +'<div style="grid-column:1/-1;"><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">Dia chi</label>'
      +'<textarea id="nccf-addr" rows="2" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;resize:none;">'+_esc(ncc?ncc.dia_chi||'':'')+'</textarea></div>'
      +'</div>'
      +'<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
      +'<button id="nccf-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--text2);font-family:inherit;">Huy</button>'
      +'<button id="nccf-save" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;color:var(--accent2);font-family:inherit;">'+(isNew?'Them NCC':'Luu')+'</button>'
      +'</div>';
    _modal(h,'580px');
    document.getElementById('nccf-x').addEventListener('click',_closeModal);
    document.getElementById('nccf-cancel').addEventListener('click',_closeModal);
    document.getElementById('nccf-save').addEventListener('click',function(){
      var ten=document.getElementById('nccf-ten').value.trim();
      if(!ten){_toast('Nhap ten NCC','error');return;}
      var btn=document.getElementById('nccf-save'); btn.disabled=true; btn.textContent='Dang luu...';
      var apiF=_api(); if(!apiF)return;
      apiF('po_save_supplier',{
        id:ncc?ncc.id:undefined,ten:ten,
        phone:document.getElementById('nccf-phone').value.trim(),
        email:document.getElementById('nccf-email').value.trim(),
        mst:document.getElementById('nccf-mst').value.trim(),
        ngan_hang:document.getElementById('nccf-ngan-hang').value.trim(),
        nguon:document.getElementById('nccf-nguon').value.trim(),
        dia_chi:document.getElementById('nccf-addr').value
      },function(e,d){
        btn.disabled=false; btn.textContent=isNew?'Them NCC':'Luu';
        if(!e&&d&&d.ok){_toast('Da luu NCC','ok');_closeModal();_renderNCCList();}
        else _toast((d&&d.error)||'Loi','error');
      });
    });
  }

  // ── Report ───────────────────────────────────────────────────────
  function _renderReport() {
    var el=document.getElementById('po-body'); if(!el)return;
    el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai bao cao...</div>';
    var apiF=_api(); if(!apiF)return;
    apiF('po_get_list',{limit:500},function(e,d){
      var rows=(!e&&d&&d.ok)?d.data||[]:[];
      var byStatus={};
      var tongGT=0;
      rows.forEach(function(r){
        byStatus[r.status]=(byStatus[r.status]||0)+1;
        tongGT+=Number(r.tong_gt||0);
      });
      el.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;">'
        +Object.keys(STATUS_LABELS).map(function(k){
          var c=STATUS_COLORS[k]||'var(--text3)';
          return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">'
            +'<div style="font-size:24px;font-weight:900;color:'+c+';">'+(byStatus[k]||0)+'</div>'
            +'<div style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-top:4px;">'+STATUS_LABELS[k]+'</div>'
            +'</div>';
        }).join('')
        +'</div>'
        +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px;">'
        +'<div style="font-size:12px;color:var(--text3);">Tong gia tri tat ca PO</div>'
        +'<div style="font-size:28px;font-weight:900;color:var(--green);">'+_fmt(tongGT)+' d</div>'
        +'</div>';
    });
  }

  function _field2(id,label,type,val){
    var base='width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;';
    return '<div><label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:5px;">'+label+'</label>'
      +'<input id="'+id+'" type="'+type+'" value="'+_esc(String(val||''))+'" style="'+base+'"></div>';
  }

})();
