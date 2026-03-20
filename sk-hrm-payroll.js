/* ================================================================
 * sk-hrm-payroll.js — SonKhang ERP v3.6
 * SK-HRM-03: Bang luong tu dong
 * 20/03/2026
 * ================================================================ */
(function(){
  'use strict';
  var _a=function(){return typeof window.api==='function'?window.api:typeof api==='function'?api:null;};
  var _e=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  var _gv=function(id){var e=document.getElementById(id);return e?e.value:'';};
  var _t=function(m,t){if(typeof window._hrmToast==='function')window._hrmToast(m,t);};
  var _fv=function(n){var v=Number(n||0);if(v>=1e9)return (v/1e9).toFixed(2)+' t\u1ef7';if(v>=1e6)return (v/1e6).toFixed(1)+' tri\u1ec7u';return v.toLocaleString()+'\u0111';};

  function loadPayroll(){
    var ct=typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct');
    if(!ct)return;
    var now=new Date();
    ct.innerHTML='<div id="pay-root" class="fade-in">'
      +'<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
      +'<div><h1 style="font-size:22px;font-weight:900;">\ud83d\udcb0 B\u1ea3ng l\u01b0\u01a1ng</h1>'
      +'<p style="font-size:12px;color:var(--text3);">T\u00ednh l\u01b0\u01a1ng t\u1ef1 \u0111\u1ed9ng \u2014 SonKhang ERP</p></div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'
      +'<select id="pay-m" class="form-input" style="width:100px;padding:7px 10px;font-size:12px;">'
      +[1,2,3,4,5,6,7,8,9,10,11,12].map(function(m){return '<option value="'+m+'"'+(m===now.getMonth()+1?' selected':'')+'>Th\u00e1ng '+m+'</option>';}).join('')
      +'</select>'
      +'<input id="pay-y" class="form-input" type="number" value="'+now.getFullYear()+'" style="width:90px;padding:7px 10px;font-size:12px;">'
      +'<button class="btn-ghost" onclick="_payRun()" style="font-size:11px;">\u26a1 T\u00ednh l\u01b0\u01a1ng</button>'
      +'<button class="btn-primary" onclick="_payLoad()" style="font-size:11px;">\ud83d\udd0d Xem</button>'
      +'</div></div>'
      +'<div class="hrm-tabbar">'
      +'<button class="hrm-tab active" id="pt-list"    onclick="_payTabSwitch(\'list\')">\ud83d\udcca B\u1ea3ng l\u01b0\u01a1ng</button>'
      +'<button class="hrm-tab" id="pt-advance" onclick="_payTabSwitch(\'advance\')">\ud83d\udcb3 T\u1ea1m \u1ee9ng</button>'
      +'</div>'
      +'<div id="pay-content"></div></div>';
    _payLoad();
  }
  window.loadPayroll=loadPayroll; window.loadKeToán=loadPayroll;

  function _payTabSwitch(tab){
    ['list','advance'].forEach(function(t){var b=document.getElementById('pt-'+t);if(b)b.classList.toggle('active',t===tab);});
    if(tab==='list') _payLoad();
    else _payLoadAdvance();
  }
  window._payTabSwitch=_payTabSwitch;

  /* ── Bảng lương ────────────────────────────────────────────── */
  function _payLoad(){
    var el=document.getElementById('pay-content'); if(!el)return;
    el.innerHTML='<div class="hrm-loading"><div class="sk-spin" style="width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div>';
    var m=Number(_gv('pay-m')||new Date().getMonth()+1);
    var y=Number(_gv('pay-y')||new Date().getFullYear());
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_get_payroll',{month:m,year:y},function(e,d){
      if(e||!d||!d.ok){el.innerHTML='<div class="hrm-alert">'+(d&&d.error||'L\u1ed7i')+'. Ch\u1ea1y "T\u00ednh l\u01b0\u01a1ng" tr\u01b0\u1edbc.</div>';return;}
      var rows=d.data||[];
      if(!rows.length){
        el.innerHTML='<div class="hrm-empty">\ud83d\udcb0 Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u th\u00e1ng '+m+'/'+y+'.<br>'
          +'<button class="btn-primary" style="margin-top:12px;font-size:11px;" onclick="_payRun()">\u26a1 T\u00ednh l\u01b0\u01a1ng ngay</button></div>';
        return;
      }
      var st=rows[0].status||''; var isDuyet=st==='da_duyet';
      el.innerHTML='<div class="hrm-kpi-grid" style="margin-bottom:16px;">'
        +'<div class="hrm-kpi card"><div class="hrm-kpi-lbl">\ud83d\udc65 S\u1ed1 NV</div><div class="hrm-kpi-val" style="color:var(--accent2);">'+d.count+'</div></div>'
        +'<div class="hrm-kpi card"><div class="hrm-kpi-lbl">\ud83d\udcb0 T\u1ed5ng chi</div><div class="hrm-kpi-val" style="color:var(--green);">'+_fv(d.total_net)+'</div></div>'
        +'<div class="hrm-kpi card"><div class="hrm-kpi-lbl">\u2b50 Cao nh\u1ea5t</div><div class="hrm-kpi-val" style="color:var(--yellow);">'+_fv(rows[0].net)+'</div></div>'
        +'<div class="hrm-kpi card"><div class="hrm-kpi-lbl">\ud83d\udd0d Tr\u1ea1ng th\u00e1i</div>'
        +'<div class="hrm-kpi-val" style="color:'+(isDuyet?'var(--green)':'var(--yellow))+';font-size:13px;">'+(isDuyet?'\u2705 \u0110\u00e3 duy\u1ec7t':'\u23f3 Ch\u1edd duy\u1ec7t')+'</div></div>'
        +'</div>'
        +'<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">'
        +(!isDuyet?'<button class="btn-primary" onclick="_payApprove(\'duyet\')" style="font-size:11px;">\u2714 Ph\u00ea duy\u1ec7t b\u1ea3ng l\u01b0\u01a1ng</button>':'')
        +(isDuyet?'<button class="btn-ghost" onclick="_paySendSlips()" style="font-size:11px;">\ud83d\udce7 G\u1eedi phi\u1ebfu l\u01b0\u01a1ng</button>':'')
        +'</div>'
        +'<div class="card" style="overflow:hidden;">'
        +'<table class="hrm-tbl">'
        +'<thead><tr><th>Nh\u00e2n vi\u00ean</th><th>L\u01b0\u01a1ng CB</th><th>Ng\u00e0y c\u00f4ng</th>'
        +'<th>Hoa h\u1ed3ng</th><th>Th\u01b0\u1edfng</th><th>T\u1ea1m \u1ee9ng</th><th>Ph\u1ea1t</th><th>Th\u1ef1c l\u0129nh</th></tr></thead>'
        +'<tbody>'+rows.map(function(r){
          return '<tr style="cursor:pointer;" onclick="_payDetail(\''+_e(JSON.stringify(r))+'\')">'
            +'<td><div style="font-weight:800;">'+_e(r.name)+'</div><div style="font-size:10px;color:var(--text3);">'+_e(r.role)+'</div></td>'
            +'<td>'+_fv(r.base)+'</td>'
            +'<td style="text-align:center;">'+r.worked+'</td>'
            +'<td style="color:var(--cyan);">'+_fv(r.commission)+'</td>'
            +'<td style="color:var(--green);">'+_fv(r.gh_bonus+r.kpi_bonus)+'</td>'
            +'<td style="color:var(--red);">'+_fv(r.advance)+'</td>'
            +'<td style="color:var(--red);">'+_fv(r.penalty)+'</td>'
            +'<td style="font-weight:900;font-family:\'JetBrains Mono\',monospace;color:var(--accent2);">'+_fv(r.net)+'</td>'
            +'</tr>';
        }).join('')+'</tbody></table></div>';
    });
  }
  window._payLoad=_payLoad;

  function _payRun(){
    var m=Number(_gv('pay-m')||new Date().getMonth()+1);
    var y=Number(_gv('pay-y')||new Date().getFullYear());
    if(!confirm('T\u00ednh l\u01b0\u01a1ng th\u00e1ng '+m+'/'+y+'?\n(S\u1ebd ghi \u0111\u00e8 d\u1eef li\u1ec7u c\u0169)'))return;
    var apiF=_a(); if(!apiF)return;
    var el=document.getElementById('pay-content');
    if(el) el.innerHTML='<div class="hrm-info">\u26a1 \u0110ang t\u00ednh l\u01b0\u01a1ng... vui l\u00f2ng ch\u1edd</div>';
    apiF('hrm_run_payroll',{month:m,year:y},function(e,d){
      if(e||!d||!d.ok){_t((d&&d.error)||'L\u1ed7i t\u00ednh l\u01b0\u01a1ng','error');return;}
      _t('\u2705 '+d.msg+' \u2014 '+d.count+' NV / '+_fv(d.total_net),'ok');
      _payLoad();
    });
  }
  window._payRun=_payRun;

  function _payApprove(act){
    var m=Number(_gv('pay-m')||new Date().getMonth()+1);
    var y=Number(_gv('pay-y')||new Date().getFullYear());
    if(!confirm('Ph\u00ea duy\u1ec7t b\u1ea3ng l\u01b0\u01a1ng th\u00e1ng '+m+'/'+y+'?'))return;
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_approve_payroll',{month:m,year:y,action:act},function(e,d){
      if(e||!d||!d.ok){_t('L\u1ed7i','error');return;}
      _t('\u2705 \u0110\u00e3 ph\u00ea duy\u1ec7t '+d.count+' d\u00f2ng','ok'); _payLoad();
    });
  }
  window._payApprove=_payApprove;

  function _paySendSlips(){
    if(!confirm('G\u1eedi phi\u1ebfu l\u01b0\u01a1ng qua email cho t\u1ea5t c\u1ea3 nh\u00e2n vi\u00ean?'))return;
    var m=Number(_gv('pay-m')||new Date().getMonth()+1);
    var y=Number(_gv('pay-y')||new Date().getFullYear());
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_send_payslips',{month:m,year:y},function(e,d){
      if(e||!d||!d.ok){_t((d&&d.error)||'L\u1ed7i g\u1eedi email','error');return;}
      _t('\u2705 '+d.msg,'ok');
    });
  }
  window._paySendSlips=_paySendSlips;

  function _payDetail(jsonStr){
    var r; try{r=JSON.parse(jsonStr);}catch(e){return;}
    var html='<div class="hrm-modal">'
      +'<div class="hrm-modal-hd"><span style="font-size:15px;font-weight:800;">\ud83d\udcb0 Chi ti\u1ebft l\u01b0\u01a1ng \u2014 '+_e(r.name)+'</span>'
      +'<button class="hrm-close" onclick="_closeModal()">&#10005;</button></div>'
      +'<div class="hrm-modal-bd">'
      +'<div style="text-align:center;font-size:28px;font-weight:900;color:var(--accent2);margin:12px 0;">'+_fv(r.net)+'</div>'
      +'<div style="background:var(--bg3);border-radius:10px;padding:14px 16px;">'
      +[
        ['+','L\u01b0\u01a1ng c\u01a1 b\u1ea3n',r.base,'var(--text2)'],
        ['+','Hoa h\u1ed3ng',r.commission,'var(--cyan)'],
        ['+','Th\u01b0\u1edfng giao h\u00e0ng',r.gh_bonus,'var(--green)'],
        ['+','Th\u01b0\u1edfng KPI',r.kpi_bonus,'var(--green)'],
        ['−','T\u1ea1m \u1ee9ng',r.advance,'var(--red)'],
        ['−','Ph\u1ea1t',r.penalty,'var(--red)']
      ].map(function(c){
        if(!c[2])return '';
        return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px;">'
          +'<span style="color:var(--text3);">'+c[0]+' '+c[1]+'</span>'
          +'<span style="font-weight:700;color:'+c[3]+';">'+_fv(c[2])+'</span></div>';
      }).join('')
      +'<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;font-weight:900;">'
      +'<span>Th\u1ef1c l\u0129nh</span><span style="color:var(--accent2);">'+_fv(r.net)+'</span></div>'
      +'</div></div>'
      +'<div class="hrm-modal-ft"><button class="btn-ghost" onclick="_closeModal()">D\u00f3ng</button></div></div>';
    _showModal(html);
  }
  window._payDetail=_payDetail;

  /* ── Tạm ứng ───────────────────────────────────────────────── */
  function _payLoadAdvance(){
    var el=document.getElementById('pay-content'); if(!el)return;
    var m=Number(_gv('pay-m')||new Date().getMonth()+1);
    var y=Number(_gv('pay-y')||new Date().getFullYear());
    el.innerHTML='<div style="display:flex;justify-content:flex-end;margin-bottom:12px;">'
      +'<button class="btn-primary" onclick="_payAddAdvance()" style="font-size:11px;">+ Ghi t\u1ea1m \u1ee9ng</button></div>'
      +'<div id="adv-list"><div class="hrm-loading"><div class="sk-spin" style="width:20px;height:20px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div></div>';
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_get_advances',{month:m,year:y},function(e,d){
      var lst=document.getElementById('adv-list'); if(!lst)return;
      if(e||!d||!d.ok){lst.innerHTML='<div class="hrm-alert">L\u1ed7i</div>';return;}
      var rows=d.data||[];
      if(!rows.length){lst.innerHTML='<div class="hrm-empty">Ch\u01b0a c\u00f3 t\u1ea1m \u1ee9ng th\u00e1ng n\u00e0y</div>';return;}
      lst.innerHTML='<div style="margin-bottom:8px;font-size:12px;color:var(--text3);">T\u1ed5ng t\u1ea1m \u1ee9ng: <strong style="color:var(--red);">'+_fv(d.total)+'</strong></div>'
        +'<div class="card" style="overflow:hidden;">'
        +'<table class="hrm-tbl"><thead><tr><th>NV</th><th>S\u1ed1 ti\u1ec1n</th><th>L\u00fd do</th><th>Ng\u00e0y</th></tr></thead>'
        +'<tbody>'+rows.map(function(r){
          return '<tr><td><div style="font-weight:700;">'+_e(r.name)+'</div><div style="font-size:10px;color:var(--text3);">'+_e(r.emp_id)+'</div></td>'
            +'<td style="color:var(--red);font-weight:700;">'+_fv(r.amount)+'</td>'
            +'<td>'+_e(r.reason||'\u2014')+'</td><td style="font-size:11px;">'+_e(r.date)+'</td></tr>';
        }).join('')+'</tbody></table></div>';
    });
  }

  function _payAddAdvance(){
    var html='<div class="hrm-modal"><div class="hrm-modal-hd">'
      +'<span style="font-size:15px;font-weight:800;">\ud83d\udcb3 Ghi t\u1ea1m \u1ee9ng</span>'
      +'<button class="hrm-close" onclick="_closeModal()">&#10005;</button></div>'
      +'<div class="hrm-modal-bd"><div class="hrm-form-grid">'
      +'<div class="hrm-form-group"><label class="hrm-lbl">M\u00e3 NV *</label><input id="adv-id" class="form-input" placeholder="NV001"></div>'
      +'<div class="hrm-form-group"><label class="hrm-lbl">H\u1ecd t\u00ean</label><input id="adv-name" class="form-input"></div>'
      +'<div class="hrm-form-group full"><label class="hrm-lbl">S\u1ed1 ti\u1ec1n *</label><input id="adv-amt" class="form-input" type="number" min="0" placeholder="0"></div>'
      +'<div class="hrm-form-group full"><label class="hrm-lbl">L\u00fd do</label><input id="adv-reason" class="form-input" placeholder="L\u00fd do t\u1ea1m \u1ee9ng..."></div>'
      +'</div></div>'
      +'<div class="hrm-modal-ft"><button class="btn-ghost" onclick="_closeModal()">H\u1ee7y</button>'
      +'<button class="btn-primary" onclick="_paySubmitAdvance()">\u2795 Ghi</button></div></div>';
    _showModal(html);
  }
  window._payAddAdvance=_payAddAdvance;

  function _paySubmitAdvance(){
    var empId=(_gv('adv-id')||'').trim(); var amt=Number(_gv('adv-amt')||0);
    if(!empId||amt<=0){_t('Nh\u1eadp M\u00e3 NV v\u00e0 s\u1ed1 ti\u1ec1n','error');return;}
    var m=Number(_gv('pay-m')||new Date().getMonth()+1);
    var y=Number(_gv('pay-y')||new Date().getFullYear());
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_save_advance',{emp_id:empId,emp_name:_gv('adv-name'),amount:amt,
      month:m,year:y,reason:_gv('adv-reason')},function(e,d){
      if(e||!d||!d.ok){_t((d&&d.error)||'L\u1ed7i','error');return;}
      _closeModal(); _t('\u2705 '+d.msg,'ok'); _payLoadAdvance();
    });
  }
  window._paySubmitAdvance=_paySubmitAdvance;

  function _showModal(html){
    _closeModal();
    var ov=document.createElement('div'); ov.className='hrm-modal-overlay'; ov.id='hrm-modal-ov';
    ov.innerHTML=html; ov.addEventListener('click',function(e){if(e.target===ov)_closeModal();});
    document.body.appendChild(ov);
  }
  function _closeModal(){var ov=document.getElementById('hrm-modal-ov');if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);}
  window._closeModal=window._closeModal||_closeModal;
})();
