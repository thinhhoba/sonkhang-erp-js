/* ================================================================
 * sk-hrm-kpi.js — SonKhang ERP v3.6
 * SK-HRM-06: Danh gia KPI
 * 20/03/2026
 * ================================================================ */
(function(){
  'use strict';
  var _a=function(){return typeof window.api==='function'?window.api:typeof api==='function'?api:null;};
  var _e=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  var _gv=function(id){var e=document.getElementById(id);return e?e.value:'';};
  var _t=function(m,t){if(typeof window._hrmToast==='function')window._hrmToast(m,t);};

  var GRADE_COLORS={A:'var(--green)',B:'var(--accent2)',C:'var(--yellow)',D:'var(--red)'};

  function loadKPI(){
    var ct=typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct');
    if(!ct)return;
    var now=new Date();
    ct.innerHTML='<div id="kpi-root" class="fade-in">'
      +'<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
      +'<div><h1 style="font-size:22px;font-weight:900;">\ud83c\udfaf \u0110\u00e1nh gi\u00e1 KPI</h1>'
      +'<p style="font-size:12px;color:var(--text3);">Hi\u1ec7u su\u1ea5t nh\u00e2n vi\u00ean</p></div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'
      +'<select id="kpi-m" class="form-input" style="width:100px;padding:7px 10px;font-size:12px;">'
      +[1,2,3,4,5,6,7,8,9,10,11,12].map(function(m){return '<option value="'+m+'"'+(m===now.getMonth()+1?' selected':'')+'>Th\u00e1ng '+m+'</option>';}).join('')
      +'</select>'
      +'<input id="kpi-y" class="form-input" type="number" value="'+now.getFullYear()+'" style="width:90px;padding:7px 10px;font-size:12px;">'
      +'<button class="btn-ghost" onclick="_kpiAutoImport()" style="font-size:11px;">\u2b07\ufe0f Auto import</button>'
      +'<button class="btn-primary" onclick="_kpiLoad()" style="font-size:11px;">\ud83d\udd0d Xem</button>'
      +'</div></div>'
      +'<div class="hrm-tabbar">'
      +'<button class="hrm-tab active" id="kpit-dash"   onclick="_kpiTabSwitch(\'dash\')">\ud83d\udcca Dashboard</button>'
      +'<button class="hrm-tab" id="kpit-detail" onclick="_kpiTabSwitch(\'detail\')">\ud83d\udcdd Chi ti\u1ebft NV</button>'
      +'<button class="hrm-tab" id="kpit-setup"  onclick="_kpiTabSwitch(\'setup\')">\u2699\ufe0f Thi\u1ebft l\u1eadp</button>'
      +'</div>'
      +'<div id="kpi-content"></div></div>';
    _kpiLoad();
  }
  window.loadKPI=loadKPI; window.loadDanhGiaKPI=loadKPI;

  function _kpiTabSwitch(tab){
    ['dash','detail','setup'].forEach(function(t){var b=document.getElementById('kpit-'+t);if(b)b.classList.toggle('active',t===tab);});
    if(tab==='dash')   _kpiLoad();
    else if(tab==='detail') _kpiLoadDetail();
    else if(tab==='setup')  _kpiLoadSetup();
  }
  window._kpiTabSwitch=_kpiTabSwitch;

  /* ── Dashboard ─────────────────────────────────────────────── */
  function _kpiLoad(){
    var el=document.getElementById('kpi-content'); if(!el)return;
    el.innerHTML='<div class="hrm-loading"><div class="sk-spin" style="width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div>';
    var m=Number(_gv('kpi-m')||new Date().getMonth()+1);
    var y=Number(_gv('kpi-y')||new Date().getFullYear());
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_get_kpi_dashboard',{month:m,year:y},function(e,d){
      if(e||!d||!d.ok){el.innerHTML='<div class="hrm-alert">'+(d&&d.error||'L\u1ed7i')+'</div>';return;}
      var rows=d.data||[]; var s=d.summary||{};
      el.innerHTML='<div class="hrm-kpi-grid" style="margin-bottom:16px;">'
        +'<div class="hrm-kpi card"><div class="hrm-kpi-lbl">\ud83d\udc65 S\u1ed1 NV \u0111\u00e1nh gi\u00e1</div><div class="hrm-kpi-val" style="color:var(--accent2);">'+(s.count||0)+'</div></div>'
        +'<div class="hrm-kpi card"><div class="hrm-kpi-lbl">\u2b50 \u0110i\u1ec3m TB</div><div class="hrm-kpi-val" style="color:var(--yellow);">'+(s.avg||0)+'</div></div>'
        +'<div class="hrm-kpi card" style="border-left:3px solid var(--green);"><div class="hrm-kpi-lbl">\ud83c\udfc6 Xu\u1ea5t s\u1eafc (A)</div><div class="hrm-kpi-val" style="color:var(--green);">'+(s.grade&&s.grade.A||0)+'</div></div>'
        +'<div class="hrm-kpi card" style="border-left:3px solid var(--accent2);"><div class="hrm-kpi-lbl">\u2705 T\u1ed1t (B)</div><div class="hrm-kpi-val" style="color:var(--accent2);">'+(s.grade&&s.grade.B||0)+'</div></div>'
        +'<div class="hrm-kpi card" style="border-left:3px solid var(--yellow);"><div class="hrm-kpi-lbl">\u26a0\ufe0f TB (C)</div><div class="hrm-kpi-val" style="color:var(--yellow);">'+(s.grade&&s.grade.C||0)+'</div></div>'
        +'<div class="hrm-kpi card" style="border-left:3px solid var(--red);"><div class="hrm-kpi-lbl">\ud83d\udea8 Y\u1ebfu (D)</div><div class="hrm-kpi-val" style="color:var(--red);">'+(s.grade&&s.grade.D||0)+'</div></div>'
        +'</div>'
        +(rows.length?''
          :'<div class="hrm-empty">\ud83c\udfaf Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u KPI th\u00e1ng '+m+'/'+y+'.<br>'
          +'<button class="btn-ghost" style="margin-top:8px;font-size:11px;" onclick="_kpiAutoImport()">\u2b07\ufe0f Auto import t\u1eeb d\u1eef li\u1ec7u</button></div>')
        +(rows.length?'<div class="card" style="overflow:hidden;">'
          +'<table class="hrm-tbl"><thead><tr>'
          +'<th>Nh\u00e2n vi\u00ean</th><th>Lo\u1ea1i</th><th style="text-align:center;">\u0110i\u1ec3m</th>'
          +'<th style="text-align:center;">X\u1ebfp lo\u1ea1i</th><th>Progress</th>'
          +'<th></th></tr></thead><tbody>'
          +rows.map(function(r){
            var gc=GRADE_COLORS[r.grade]||'var(--text3)';
            var pct=Math.min(r.score,100);
            return '<tr>'
              +'<td><div style="font-weight:800;">'+_e(r.name)+'</div><div style="font-size:10px;color:var(--text3);">'+_e(r.role)+'</div></td>'
              +'<td style="font-size:10px;">'+_e(r.role)+'</td>'
              +'<td style="text-align:center;font-weight:900;color:var(--text);font-family:\'JetBrains Mono\',monospace;">'+r.score+'</td>'
              +'<td style="text-align:center;"><span class="hrm-badge" style="background:rgba(0,0,0,.1);color:'+gc+';">'+r.grade+'</span></td>'
              +'<td style="min-width:100px;"><div class="progress-bar"><div class="progress-fill" style="width:'+pct+'%;background:'+gc+';"></div></div></td>'
              +'<td><button class="btn-ghost" style="padding:3px 8px;font-size:10px;" onclick="_kpiEmpDetail(\''+_e(r.emp_id)+'\')">Chi ti\u1ebft</button></td>'
              +'</tr>';
          }).join('')+'</tbody></table></div>':'');
    });
  }
  window._kpiLoad=_kpiLoad;

  /* ── Chi tiết theo NV ─────────────────────────────────────── */
  function _kpiLoadDetail(){
    var el=document.getElementById('kpi-content'); if(!el)return;
    el.innerHTML='<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:flex-end;">'
      +'<div class="hrm-form-group"><label class="hrm-lbl">M\u00e3 NV</label>'
      +'<input id="kpi-emp-id" class="form-input" placeholder="NV001" style="width:120px;"></div>'
      +'<button class="btn-primary" onclick="_kpiEmpDetail(_gv(\'kpi-emp-id\'))" style="font-size:11px;">\ud83d\udd0d Xem</button>'
      +'</div>'
      +'<div id="kpi-detail-body"><div class="hrm-empty">Nh\u1eadp M\u00e3 NV r\u1ed3i b\u1ea5m Xem.</div></div>';
  }

  function _kpiEmpDetail(empId){
    if(!empId){_t('Nh\u1eadp M\u00e3 NV','error');return;}
    var m=Number(_gv('kpi-m')||new Date().getMonth()+1);
    var y=Number(_gv('kpi-y')||new Date().getFullYear());
    var target=document.getElementById('kpi-detail-body')||document.getElementById('kpi-content');
    if(target) target.innerHTML='<div class="hrm-loading"><div class="sk-spin" style="width:20px;height:20px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div>';
    var apiF=_a(); if(!apiF)return;

    apiF('hrm_get_kpi_detail',{emp_id:empId,month:m,year:y},function(e,d){
      if(!target)return;
      if(e||!d||!d.ok){target.innerHTML='<div class="hrm-alert">'+(d&&d.error||'L\u1ed7i')+'</div>';return;}
      var rows=d.data||[];
      if(!rows.length){
        target.innerHTML='<div class="hrm-empty">Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u KPI chi ti\u1ebft.<br>'
          +'<button class="btn-ghost" style="margin-top:8px;font-size:11px;" onclick="_kpiOpenInputForm(\''+_e(empId)+'\')">+ Nh\u1eadp k\u1ebft qu\u1ea3</button></div>';
        return;
      }
      var totalScore=rows.reduce(function(s,r){return s+r.score;},0);
      target.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">'
        +'<div><strong>'+_e(empId)+'</strong> \u2014 Th\u00e1ng '+m+'/'+y+'</div>'
        +'<div style="display:flex;gap:8px;">'
        +'<button class="btn-ghost" onclick="_kpiOpenInputForm(\''+_e(empId)+'\')" style="font-size:11px;">+ Nh\u1eadp k\u1ebft qu\u1ea3</button>'
        +'</div></div>'
        +'<div style="font-size:20px;font-weight:900;color:var(--accent2);margin-bottom:12px;">'
        +'\u0110i\u1ec3m t\u1ed5ng: '+Math.round(totalScore*10)/10
        +'</div>'
        +'<div class="card" style="overflow:hidden;">'
        +'<table class="hrm-tbl"><thead><tr><th>Ch\u1ec9 s\u1ed1</th><th>M\u1ee5c ti\u00eau</th><th>Th\u1ef1c t\u1ebf</th><th>Tr\u1ecdng s\u1ed1</th><th>\u0110\u1ea1t (%)</th><th>\u0110i\u1ec3m</th></tr></thead>'
        +'<tbody>'+rows.map(function(r){
          var pc=r.achieve; var col=pc>=100?'var(--green)':pc>=80?'var(--yellow)':'var(--red)';
          return '<tr><td><div style="font-weight:700;">'+_e(r.name)+'</div>'
            +'<div style="font-size:9px;color:var(--text3);">'+_e(r.code)+' \u2022 '+_e(r.unit)+'</div></td>'
            +'<td>'+r.target+'</td><td style="font-weight:700;">'+r.actual+'</td>'
            +'<td style="text-align:center;">'+r.weight+'%</td>'
            +'<td><div style="font-weight:800;color:'+col+';">'+pc+'%</div>'
            +'<div class="progress-bar" style="margin-top:3px;"><div class="progress-fill" style="width:'+Math.min(pc,100)+'%;background:'+col+';"></div></div></td>'
            +'<td style="font-weight:900;color:'+col+';">'+r.score+'</td></tr>';
        }).join('')+'</tbody></table></div>'
        +'<div style="margin-top:12px;">'
        +'<button class="btn-ghost" onclick="_kpiLoadTrend(\''+_e(empId)+'\')" style="font-size:11px;">\ud83d\udcc8 Xem trend 6 th\u00e1ng</button>'
        +'</div>';
    });
  }
  window._kpiEmpDetail=_kpiEmpDetail;

  function _kpiOpenInputForm(empId){
    var m=Number(_gv('kpi-m')||new Date().getMonth()+1);
    var y=Number(_gv('kpi-y')||new Date().getFullYear());
    var apiF=_a(); if(!apiF)return;
    // Lay template KPI cua NV
    apiF('hrm_get_kpi_templates',{},function(e,d){
      var templates={};
      if(!e&&d&&d.ok) templates=d.data||{};
      _kpiShowInputForm(empId,m,y,templates);
    });
  }
  window._kpiOpenInputForm=_kpiOpenInputForm;

  function _kpiShowInputForm(empId,m,y,templates){
    var allKpis=[];
    Object.keys(templates).forEach(function(role){
      (templates[role]||[]).forEach(function(k){
        if(allKpis.indexOf(k.code)<0) allKpis.push(k.code+'|'+k.name+'|'+k.unit+'|'+k.target+'|'+k.weight);
      });
    });
    var html='<div class="hrm-modal" style="max-width:480px;">'
      +'<div class="hrm-modal-hd"><span style="font-size:15px;font-weight:800;">\ud83d\udcdd Nh\u1eadp k\u1ebft qu\u1ea3 KPI</span>'
      +'<button class="hrm-close" onclick="_closeModal()">&#10005;</button></div>'
      +'<div class="hrm-modal-bd"><div class="hrm-form-grid">'
      +'<div class="hrm-form-group"><label class="hrm-lbl">Ch\u1ec9 s\u1ed1</label>'
      +'<select id="ki-code" class="form-input" onchange="_kpiCodeChange()">'
      +allKpis.map(function(s){var p=s.split('|');return '<option value="'+_e(s)+'">'+_e(p[1])+'</option>';}).join('')
      +'</select></div>'
      +'<div class="hrm-form-group"><label class="hrm-lbl">M\u1ee5c ti\u00eau</label>'
      +'<input id="ki-target" class="form-input" type="number" min="0"></div>'
      +'<div class="hrm-form-group"><label class="hrm-lbl">Th\u1ef1c t\u1ebf *</label>'
      +'<input id="ki-actual" class="form-input" type="number" min="0" placeholder="0"></div>'
      +'<div class="hrm-form-group"><label class="hrm-lbl">Tr\u1ecdng s\u1ed1 (%)</label>'
      +'<input id="ki-weight" class="form-input" type="number" min="0" max="100"></div>'
      +'<div class="hrm-form-group full"><label class="hrm-lbl">Ghi ch\u00fa</label>'
      +'<input id="ki-note" class="form-input" placeholder="Ghi ch\u00fa..."></div>'
      +'</div></div>'
      +'<div class="hrm-modal-ft"><button class="btn-ghost" onclick="_closeModal()">H\u1ee7y</button>'
      +'<button class="btn-primary" onclick="_kpiSubmitResult(\''+_e(empId)+'\','+m+','+y+')">\u2714 L\u01b0u</button>'
      +'</div></div>';
    _showModal(html);
    // Auto-fill khi chon chi so
    if(allKpis.length){
      var parts=allKpis[0].split('|');
      var ti=document.getElementById('ki-target'); if(ti) ti.value=parts[3]||'';
      var wi=document.getElementById('ki-weight'); if(wi) wi.value=parts[4]||'';
    }
  }

  function _kpiCodeChange(){
    var sel=document.getElementById('ki-code'); if(!sel)return;
    var parts=(sel.value||'').split('|');
    var ti=document.getElementById('ki-target'); if(ti) ti.value=parts[3]||'';
    var wi=document.getElementById('ki-weight'); if(wi) wi.value=parts[4]||'';
  }
  window._kpiCodeChange=_kpiCodeChange;

  function _kpiSubmitResult(empId,m,y){
    var codeParts=(_gv('ki-code')||'').split('|');
    var code=codeParts[0]; var name=codeParts[1]; var unit=codeParts[2];
    var actual=Number(_gv('ki-actual')||0);
    var target=Number(_gv('ki-target')||0);
    var weight=Number(_gv('ki-weight')||0);
    if(!code||actual<0){_t('Nh\u1eadp \u0111\u1ea7y \u0111\u1ee7 th\u00f4ng tin','error');return;}
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_save_kpi_result',{emp_id:empId,month:m,year:y,
      code:code,name:name,unit:unit,target:target,actual:actual,weight:weight,
      note:_gv('ki-note')},
    function(e,d){
      if(e||!d||!d.ok){_t((d&&d.error)||'L\u1ed7i','error');return;}
      _closeModal(); _t('\u2705 \u0110\u00e3 l\u01b0u: '+code+' = '+actual+' (\u0111i\u1ec3m: '+d.score+')','ok');
      _kpiEmpDetail(empId);
    });
  }
  window._kpiSubmitResult=_kpiSubmitResult;

  /* ── Trend ─────────────────────────────────────────────────── */
  function _kpiLoadTrend(empId){
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_get_kpi_trend',{emp_id:empId,months:6},function(e,d){
      if(e||!d||!d.ok||!d.data.length){_t('Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u trend','warn');return;}
      var rows=d.data;
      var html='<div class="hrm-modal"><div class="hrm-modal-hd">'
        +'<span style="font-size:15px;font-weight:800;">\ud83d\udcc8 Trend KPI \u2014 '+_e(empId)+'</span>'
        +'<button class="hrm-close" onclick="_closeModal()">&#10005;</button></div>'
        +'<div class="hrm-modal-bd">'
        +'<div style="display:flex;gap:8px;align-items:flex-end;height:120px;margin-bottom:12px;">'
        +rows.map(function(r){
          var pct=Math.min(r.score,100); var gc=GRADE_COLORS[r.grade]||'var(--text3)';
          return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">'
            +'<div style="font-size:9px;font-weight:800;color:'+gc+';">'+r.score+'</div>'
            +'<div style="width:100%;background:'+gc+';border-radius:4px 4px 0 0;height:'+pct+'px;max-height:80px;min-height:4px;"></div>'
            +'<div style="font-size:9px;color:var(--text3);">'+r.month+'/'+r.year+'</div>'
            +'</div>';
        }).join('')
        +'</div>'
        +'<table class="hrm-tbl"><thead><tr><th>Th\u00e1ng</th><th style="text-align:center;">\u0110i\u1ec3m</th><th style="text-align:center;">X\u1ebfp lo\u1ea1i</th></tr></thead>'
        +'<tbody>'+rows.map(function(r){
          var gc=GRADE_COLORS[r.grade]||'var(--text3)';
          return '<tr><td>'+r.month+'/'+r.year+'</td>'
            +'<td style="text-align:center;font-weight:800;">'+r.score+'</td>'
            +'<td style="text-align:center;"><span style="color:'+gc+';font-weight:900;">'+r.grade+'</span></td></tr>';
        }).join('')+'</tbody></table>'
        +'</div><div class="hrm-modal-ft"><button class="btn-ghost" onclick="_closeModal()">D\u00f3ng</button></div></div>';
      _showModal(html);
    });
  }
  window._kpiLoadTrend=_kpiLoadTrend;

  /* ── Thiết lập ────────────────────────────────────────────── */
  function _kpiLoadSetup(){
    var el=document.getElementById('kpi-content'); if(!el)return;
    var m=Number(_gv('kpi-m')||new Date().getMonth()+1);
    var y=Number(_gv('kpi-y')||new Date().getFullYear());
    el.innerHTML='<div class="hrm-info" style="margin-bottom:12px;">\u26a1 Auto-import l\u1ea5y d\u1eef li\u1ec7u t\u1eeb Vehicle_Logs v\u00e0 Sapo_Orders</div>'
      +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">'
      +'<button class="btn-primary" onclick="_kpiAutoImport()" style="font-size:11px;">\u2b07\ufe0f Auto import t\u1eeb h\u1ec7 th\u1ed1ng</button>'
      +'<button class="btn-ghost" onclick="_kpiSetTargets(\'GH\')" style="font-size:11px;">\ud83d\udccb T\u1ea1o m\u1eabu KPI Giao h\u00e0ng</button>'
      +'<button class="btn-ghost" onclick="_kpiSetTargets(\'SL\')" style="font-size:11px;">\ud83d\udccb T\u1ea1o m\u1eabu KPI Sale</button>'
      +'<button class="btn-ghost" onclick="_kpiSetTargets(\'GD\')" style="font-size:11px;">\ud83d\udccb T\u1ea1o m\u1eabu KPI Gi\u00e1m \u0111\u1ed1c</button>'
      +'</div>'
      +'<div id="kpi-setup-result"></div>';
  }

  function _kpiAutoImport(){
    var m=Number(_gv('kpi-m')||new Date().getMonth()+1);
    var y=Number(_gv('kpi-y')||new Date().getFullYear());
    var apiF=_a(); if(!apiF)return;
    _t('\u23f3 \u0110ang import...','ok');
    apiF('hrm_auto_import_kpi',{month:m,year:y},function(e,d){
      if(e||!d||!d.ok){_t((d&&d.error)||'L\u1ed7i','error');return;}
      var imp=d.imported||{};
      _t('\u2705 Import xong: GH='+imp.gh+' / Sale='+imp.sl,'ok');
      _kpiLoad();
    });
  }
  window._kpiAutoImport=_kpiAutoImport;

  function _kpiSetTargets(role){
    var m=Number(_gv('kpi-m')||new Date().getMonth()+1);
    var y=Number(_gv('kpi-y')||new Date().getFullYear());
    if(!confirm('T\u1ea1o m\u1eabu KPI cho vai tr\u00f2 '+role+' th\u00e1ng '+m+'/'+y+'?'))return;
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_set_kpi_targets',{role:role,month:m,year:y},function(e,d){
      if(e||!d||!d.ok){_t((d&&d.error)||'L\u1ed7i','error');return;}
      _t('\u2705 '+d.role+': '+d.added+' ch\u1ec9 s\u1ed1','ok');
    });
  }
  window._kpiSetTargets=_kpiSetTargets;

  function _showModal(html){
    _closeModal();
    var ov=document.createElement('div'); ov.className='hrm-modal-overlay'; ov.id='hrm-modal-ov';
    ov.innerHTML=html; ov.addEventListener('click',function(e){if(e.target===ov)_closeModal();});
    document.body.appendChild(ov);
  }
  function _closeModal(){var ov=document.getElementById('hrm-modal-ov');if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);}
  window._closeModal=window._closeModal||_closeModal;
})();
