/* ================================================================
 * sk-sales-delivery-ui.js  SonKhang ERP v5.1
 * UI: Giao hang + Hoa don VAT + So cai ke toan
 * 21/03/2026
 * QUY TAC: 0 non-ASCII, DOM API cho event handlers
 * ================================================================ */
(function () {
  'use strict';

  var _api = function () { return typeof window.api==='function'?window.api:null; };
  var _ct  = function () { return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
  var _fmt = function (n) { return typeof window.fv==='function'?window.fv(n):Number(n||0).toLocaleString('vi-VN')+'d'; };
  var _esc = function (s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };

  /* Modal helper */
  function _modal(html, maxW) {
    var old = document.getElementById('sk-dv-modal');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var ov = document.createElement('div');
    ov.id = 'sk-dv-modal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px;';
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--bg2,#0d1020);border:1px solid var(--border2,#252d40);border-radius:18px;width:100%;max-width:'+(maxW||'620px')+';max-height:90vh;overflow-y:auto;';
    box.innerHTML = html;
    ov.appendChild(box);
    ov.addEventListener('click',function(e){ if(e.target===ov){ var m=document.getElementById('sk-dv-modal'); if(m&&m.parentNode) m.parentNode.removeChild(m); } });
    document.body.appendChild(ov);
  }

  function hdr(title, subtitle, btnHtml) {
    return '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
      + '<div><h1 style="font-size:22px;font-weight:900;margin:0;">'+title+'</h1>'
      + '<p style="font-size:12px;color:var(--text3,#5a6890);margin:4px 0 0;">'+subtitle+'</p></div>'
      + (btnHtml||'') + '</div>';
  }

  function tabBar(tabs, activeId, containerId) {
    var html = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;" id="'+containerId+'">';
    tabs.forEach(function(t){
      html += '<button data-tab="'+t.id+'" style="border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;'
        +(t.id===activeId?'background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2,#6b8aff);':'background:var(--bg3,#111525);border:1px solid var(--border2,#252d40);color:var(--text3,#5a6890);')+'">'
        +(t.icon?' '+t.icon+' ':'')+t.label+'</button>';
    });
    return html + '</div>';
  }

  function table(cols, rows, emptyMsg) {
    if (!rows.length) return '<div style="text-align:center;padding:32px;color:var(--text3);">'+(emptyMsg||'Chua co du lieu')+'</div>';
    var html = '<div style="border-radius:12px;border:1px solid var(--border,#1c2340);overflow:hidden;">'
      + '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
      + '<thead><tr style="background:var(--bg3,#111525);">';
    cols.forEach(function(c){
      html += '<th style="padding:10px 12px;text-align:'+(c.right?'right':'left')+';font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--text3,#5a6890);">'+c.label+'</th>';
    });
    html += '</tr></thead><tbody>';
    rows.forEach(function(r){
      html += '<tr style="border-top:1px solid var(--border,#1c2340);">';
      cols.forEach(function(c){ html += '<td style="padding:10px 12px;'+(c.right?'text-align:right;':'')+'">'+(r[c.key]||'')+'</td>'; });
      html += '</tr>';
    });
    return html + '</tbody></table></div>';
  }

  /* ================================================================
   * GIAO HANG
   * ================================================================ */
  function loadGiaoHang() {
    var ct = _ct(); if (!ct) return;
    ct.innerHTML = '<div class="fade-in" style="padding:24px;">'
      + hdr('Giao hang', 'Lenh giao hang * Xe va tai xe * Xac nhan giao', btnNew())
      + tabBar([
          {id:'pending',icon:'',label:'Cho giao'},
          {id:'delivering',icon:'',label:'Dang giao'},
          {id:'done',icon:'',label:'Da giao'},
          {id:'all',icon:'',label:'Tat ca'}
        ], 'pending', 'dv-tabs')
      + '<div id="dv-list"></div>'
      + '</div>';

    function btnNew() {
      var b = document.createElement('button');
      b.textContent = '+ Tao lenh giao';
      b.style.cssText = 'background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green,#00d68f);border-radius:10px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;';
      b.addEventListener('click', _newDelivery);
      var wrap = document.createElement('div');
      wrap.appendChild(b);
      return wrap.innerHTML;
    }

    // Tab switching
    document.querySelectorAll('#dv-tabs button').forEach(function(btn){
      btn.addEventListener('click', function(){
        document.querySelectorAll('#dv-tabs button').forEach(function(b){
          b.style.background='var(--bg3)'; b.style.borderColor='var(--border2)'; b.style.color='var(--text3)';
        });
        btn.style.background='rgba(79,111,255,.15)'; btn.style.borderColor='rgba(79,111,255,.3)'; btn.style.color='var(--accent2)';
        _loadDeliveries(btn.getAttribute('data-tab'));
      });
    });

    // New delivery button
    var btnEl = ct.querySelector('button');
    if (btnEl && btnEl.textContent.indexOf('Tao lenh') >= 0) {
      btnEl.addEventListener('click', _newDelivery);
    }

    _loadDeliveries('pending');
  }
  window.loadGiaoHang = loadGiaoHang;

  function _loadDeliveries(status) {
    var el = document.getElementById('dv-list'); if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
    var apiF = _api(); if (!apiF) { el.innerHTML='<p style="color:var(--red);padding:16px;">api() chua san sang</p>'; return; }
    apiF('sales_get_deliveries', { status:status==='all'?'':status }, function(e,d){
      if (e||!d||!d.ok) { el.innerHTML='<p style="color:var(--red);padding:16px;">Loi tai du lieu</p>'; return; }
      var rows = d.data||[];
      if (!rows.length) {
        el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">'
          + '<div style="font-size:36px;margin-bottom:12px;">&#x1F69A;</div>'
          + '<div style="font-size:14px;font-weight:700;">Chua co lenh giao nao</div></div>';
        return;
      }
      var ST_COL = {cho_giao:'#fbbf24',dang_giao:'#06d6d6',da_giao:'#00d68f',huy:'#ff4d6d'};
      var colDefs = [
        {key:'ma_don_x', label:'Ma lenh/Don'},
        {key:'khach_ten', label:'Khach hang'},
        {key:'dia_chi_x', label:'Dia chi'},
        {key:'driver_ten', label:'Tai xe'},
        {key:'vehicle_bien', label:'Xe'},
        {key:'ngay_giao', label:'Ngay giao'},
        {key:'status_x', label:'Trang thai'},
        {key:'action_x', label:'', right:true}
      ];
      // Build rows
      var tRows = rows.map(function(r){
        var col = ST_COL[r.trang_thai]||'#6b7a99';
        return {
          ma_don_x: '<span style="font-family:monospace;color:var(--accent2);">'+_esc(r.ma_don||'')+'</span>',
          khach_ten: '<strong>'+_esc(r.khach_ten||'')+'</strong>',
          dia_chi_x: '<span style="color:var(--text3);font-size:11px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;">'+_esc(r.dia_chi||'')+'</span>',
          driver_ten: _esc(r.driver_ten||'--'),
          vehicle_bien: _esc(r.vehicle_bien||'--'),
          ngay_giao: _esc(r.ngay_giao||''),
          status_x: '<span style="padding:3px 8px;border-radius:6px;font-size:10px;font-weight:800;background:'+col+'22;color:'+col+';">'+_esc(r.trang_thai)+'</span>',
          action_x: (r.trang_thai==='dang_giao')
            ? '<span id="dv-confirm-'+_esc(r.id)+'" style="display:inline-block;"></span>'
            : ''
        };
      });
      el.innerHTML = table(colDefs, tRows, 'Chua co lenh giao');

      // Bind confirm buttons
      rows.forEach(function(r){
        if (r.trang_thai !== 'dang_giao') return;
        var span = document.getElementById('dv-confirm-'+r.id);
        if (!span) return;
        var btn = document.createElement('button');
        btn.textContent = 'Xac nhan da giao';
        btn.style.cssText = 'background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:7px;padding:5px 10px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;';
        btn.addEventListener('click', function(){
          apiF('sales_confirm_delivery',{id:r.id},function(e2,d2){
            if(e2||!d2||!d2.ok){_toast((d2&&d2.error)||'Loi','error');return;}
            _toast('Da xac nhan giao hang','ok');
            _loadDeliveries(status);
          });
        });
        span.appendChild(btn);
      });
    });
  }

  function _newDelivery() {
    var apiF = _api(); if (!apiF) return;
    // Load don hang dang_giao
    apiF('sales_get_orders',{status:'da_xac_nhan',limit:50},function(e,d){
      var orders = (!e&&d&&d.ok)?d.data:[];
      var opts = '<option value="">-- Chon don hang da duyet --</option>'
        + orders.map(function(o){
            return '<option value="'+_esc(o.id)+'">'+_esc(o.ma_don)+' - '+_esc(o.khach_ten)+' - '+_esc(o.dia_chi_gh||'')+'</option>';
          }).join('');

      var h = '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
        + '<div style="font-size:15px;font-weight:900;">Tao lenh giao hang</div>'
        + '<button id="dv-new-close" style="background:none;border:none;color:var(--text3);font-size:18px;cursor:pointer;line-height:1;">x</button>'
        + '</div>'
        + '<div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
        + _field('dv-don-id','Don hang *','select',opts,true)
        + _field('dv-phi-gh','Phi giao hang','number','0',false)
        + _field('dv-ngay-giao','Ngay giao','date','',false)
        + _field('dv-ghi-chu','Ghi chu','text','',false,'grid-column:1/-1;')
        + '</div>'
        + '<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
        + '<button id="dv-new-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;color:var(--text2);">Huy</button>'
        + '<button id="dv-new-save" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;color:var(--green);">Tao lenh giao</button>'
        + '</div>';

      _modal(h);
      document.getElementById('dv-new-close').addEventListener('click', _closeModal);
      document.getElementById('dv-new-cancel').addEventListener('click', _closeModal);
      document.getElementById('dv-new-save').addEventListener('click', function(){
        var donId = document.getElementById('dv-don-id').value;
        if (!donId) { _toast('Chon don hang','error'); return; }
        var btn = document.getElementById('dv-new-save');
        btn.disabled = true; btn.textContent = 'Dang tao...';
        apiF('sales_create_delivery',{
          don_id: donId,
          phi_gh: Number(document.getElementById('dv-phi-gh').value||0),
          ngay_giao: document.getElementById('dv-ngay-giao').value,
          ghi_chu: document.getElementById('dv-ghi-chu').value
        },function(e2,d2){
          btn.disabled=false; btn.textContent='Tao lenh giao';
          if(e2||!d2||!d2.ok){_toast((d2&&d2.error)||'Loi tao lenh','error');return;}
          _toast('Da tao lenh giao: '+d2.id,'ok');
          _closeModal();
          _loadDeliveries('pending');
        });
      });
    });
  }

  /* ================================================================
   * HOA DON VAT
   * ================================================================ */
  function loadHoaDonVAT() {
    var ct = _ct(); if (!ct) return;
    ct.innerHTML = '<div class="fade-in" style="padding:24px;">'
      + hdr('Hoa don VAT', 'Xuat hoa don * Bach toan kep * In va xu ly')
      + tabBar([
          {id:'invoices',icon:'',label:'Hoa don'},
          {id:'accounting',icon:'',label:'So ke toan'}
        ], 'invoices', 'vat-tabs')
      + '<div id="vat-body"></div>'
      + '</div>';

    document.querySelectorAll('#vat-tabs button').forEach(function(btn){
      btn.addEventListener('click', function(){
        document.querySelectorAll('#vat-tabs button').forEach(function(b){
          b.style.background='var(--bg3)'; b.style.borderColor='var(--border2)'; b.style.color='var(--text3)';
        });
        btn.style.background='rgba(79,111,255,.15)'; btn.style.borderColor='rgba(79,111,255,.3)'; btn.style.color='var(--accent2)';
        if (btn.getAttribute('data-tab')==='invoices') _loadInvoices();
        else _loadAccounting();
      });
    });

    _loadInvoices();
  }
  window.loadHoaDonVAT = loadHoaDonVAT;

  function _loadInvoices() {
    var el = document.getElementById('vat-body'); if (!el) return;
    el.innerHTML = '<div style="display:flex;justify-content:flex-end;margin-bottom:12px;"><span id="vat-new-wrap"></span></div>'
      + '<div id="vat-inv-list"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>';

    var newWrap = document.getElementById('vat-new-wrap');
    if (newWrap) {
      var btnNew = document.createElement('button');
      btnNew.textContent = '+ Xuat hoa don';
      btnNew.style.cssText = 'background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;';
      btnNew.addEventListener('click', _newInvoice);
      newWrap.appendChild(btnNew);
    }

    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_invoices',{},function(e,d){
      var listEl = document.getElementById('vat-inv-list'); if (!listEl) return;
      if (e||!d||!d.ok) { listEl.innerHTML='<p style="color:var(--red);padding:16px;">Loi tai hoa don</p>'; return; }
      var rows = d.data||[];
      if (!rows.length) {
        listEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">'
          + '<div style="font-size:36px;margin-bottom:12px;">&#x1F9FE;</div>'
          + '<div style="font-size:14px;font-weight:700;">Chua co hoa don nao</div></div>';
        return;
      }
      var ST = {chua_ky:'#fbbf24',da_ky:'#00d68f',huy:'#ff4d6d'};
      var tRows = rows.map(function(r){
        var col = ST[r.trang_thai]||'#6b7a99';
        var thue = Number(r.tong_truoc_thue||0)*Number(r.thue_suat||0)/100;
        return {
          ma_hd: '<span style="font-family:monospace;color:var(--accent2);">'+_esc(r.ma_hd||r.id)+'</span>',
          khach_ten: '<strong>'+_esc(r.khach_ten||'')+'</strong>',
          mst: '<span style="font-family:monospace;font-size:11px;color:var(--text3);">'+_esc(r.mst||'')+'</span>',
          ngay_hd: _esc(r.ngay_hd||''),
          tong_truoc_thue: '<span style="color:var(--text2);">'+_fmt(r.tong_truoc_thue)+'</span>',
          tien_thue: '<span style="color:var(--yellow);">'+_fmt(thue)+'</span>',
          tong_tien: '<strong style="color:var(--green);">'+_fmt(r.tong_tien)+'</strong>',
          status_x: '<span style="padding:3px 8px;border-radius:6px;font-size:10px;font-weight:800;background:'+col+'22;color:'+col+';">'+_esc(r.trang_thai)+'</span>'
        };
      });
      listEl.innerHTML = table([
        {key:'ma_hd',label:'So HD'},
        {key:'khach_ten',label:'Khach hang'},
        {key:'mst',label:'MST'},
        {key:'ngay_hd',label:'Ngay HD'},
        {key:'tong_truoc_thue',label:'Truoc thue',right:true},
        {key:'tien_thue',label:'Thue VAT',right:true},
        {key:'tong_tien',label:'Tong tien',right:true},
        {key:'status_x',label:'Trang thai'}
      ], tRows, 'Chua co hoa don');
    });
  }

  function _loadAccounting() {
    var el = document.getElementById('vat-body'); if (!el) return;
    el.innerHTML = '<div id="acc-list"><div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div></div>';
    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_accounting',{},function(e,d){
      var listEl = document.getElementById('acc-list'); if (!listEl) return;
      if (e||!d||!d.ok) { listEl.innerHTML='<p style="color:var(--red);padding:16px;">Loi</p>'; return; }
      var rows = d.data||[];
      var TYPE_COL={ban_hang:'#00d68f',tra_hang:'#ff4d6d',thanh_toan:'#4f6fff',chi_phi:'#fbbf24'};
      var total = rows.reduce(function(s,r){ return s + Number(r.so_tien||0); }, 0);
      el.innerHTML = '<div style="background:rgba(0,214,143,.06);border:1px solid rgba(0,214,143,.2);border-radius:12px;padding:14px 16px;margin-bottom:14px;font-size:13px;font-weight:700;">'
        + 'Tong phat sinh: <span style="color:var(--green);font-size:20px;font-weight:900;">'+_fmt(total)+'</span></div>'
        + table([
            {key:'ngay',label:'Ngay'},
            {key:'loai_x',label:'Loai'},
            {key:'mo_ta',label:'Mo ta'},
            {key:'tk_no',label:'TK No',right:true},
            {key:'tk_co',label:'TK Co',right:true},
            {key:'so_tien_x',label:'So tien',right:true}
          ],
          rows.map(function(r){
            var c = TYPE_COL[r.loai]||'#6b7a99';
            return {
              ngay: _esc(r.ngay||''),
              loai_x: '<span style="font-size:10px;font-weight:800;padding:2px 7px;border-radius:5px;background:'+c+'22;color:'+c+';">'+_esc(r.loai)+'</span>',
              mo_ta: '<span style="font-size:11px;color:var(--text3);">'+_esc(r.mo_ta||'')+'</span>',
              tk_no: '<span style="font-family:monospace;">'+_esc(r.tk_no||'')+'</span>',
              tk_co: '<span style="font-family:monospace;">'+_esc(r.tk_co||'')+'</span>',
              so_tien_x: '<strong>'+_fmt(r.so_tien)+'</strong>'
            };
          }),
          'Chua co but toan nao'
        );
    });
  }

  function _newInvoice() {
    var apiF = _api(); if (!apiF) return;
    apiF('sales_get_orders',{status:'hoan_thanh',limit:50},function(e,d){
      var orders = (!e&&d&&d.ok)?d.data:[];
      var opts = '<option value="">-- Chon don hang hoan thanh --</option>'
        + orders.map(function(o){
            return '<option value="'+_esc(o.id)+'">'+_esc(o.ma_don)+' - '+_esc(o.khach_ten)+' - '+_fmt(o.tong_tt)+'</option>';
          }).join('');

      var h = '<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
        + '<div style="font-size:15px;font-weight:900;">Xuat hoa don VAT</div>'
        + '<button id="inv-close" style="background:none;border:none;color:var(--text3);font-size:18px;cursor:pointer;">x</button>'
        + '</div>'
        + '<div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
        + _field('inv-don-id','Don hang *','select',opts,true)
        + _field('inv-mst','Ma so thue KH','text','',false)
        + _field('inv-dia-chi','Dia chi KH','text','',false,'grid-column:1/-1;')
        + '<div style="grid-column:1/-1;">'
          + '<label style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);display:block;margin-bottom:5px;">Thue suat VAT</label>'
          + '<select id="inv-thue" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'
          + '<option value="10">10% - Hang hoa pho thong</option>'
          + '<option value="8">8% - Giam theo ND</option>'
          + '<option value="5">5% - Thiet yeu</option>'
          + '<option value="0">0% - Mien thue</option>'
          + '</select></div>'
        + '</div>'
        + '<div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);">'
        + '<button id="inv-cancel" style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;color:var(--text2);">Huy</button>'
        + '<button id="inv-save" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;color:var(--accent2);">Xuat hoa don</button>'
        + '</div>';

      _modal(h);
      document.getElementById('inv-close').addEventListener('click', _closeModal);
      document.getElementById('inv-cancel').addEventListener('click', _closeModal);
      document.getElementById('inv-save').addEventListener('click', function(){
        var donId = document.getElementById('inv-don-id').value;
        if (!donId) { _toast('Chon don hang','error'); return; }
        var btn = document.getElementById('inv-save');
        btn.disabled=true; btn.textContent='Dang xuat...';
        apiF('sales_create_invoice',{
          don_id: donId,
          mst: document.getElementById('inv-mst').value,
          dia_chi: document.getElementById('inv-dia-chi').value,
          thue_suat: Number(document.getElementById('inv-thue').value||10)
        },function(e2,d2){
          btn.disabled=false; btn.textContent='Xuat hoa don';
          if(e2||!d2||!d2.ok){_toast((d2&&d2.error)||'Loi','error');return;}
          _toast('Da xuat HD: '+(d2.ma_hd||d2.id),'ok');
          _closeModal();
          _loadInvoices();
        });
      });
    });
  }

  /* helper: form field */
  function _field(id, label, type, val, required, wrapStyle) {
    var inputHtml;
    if (type==='select') {
      inputHtml = '<select id="'+id+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">'+val+'</select>';
    } else {
      inputHtml = '<input id="'+id+'" type="'+type+'" value="'+(type==='select'?'':_esc(val))+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-family:inherit;font-size:12px;">';
    }
    return '<div style="'+(wrapStyle||'')+'"><label style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);display:block;margin-bottom:5px;">'+label+(required?' *':'')+'</label>'+inputHtml+'</div>';
  }

  function _closeModal() {
    var m = document.getElementById('sk-dv-modal');
    if (m && m.parentNode) m.parentNode.removeChild(m);
  }
  window.closeSalesDVModal = _closeModal;

})();
