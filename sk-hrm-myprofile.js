/* ================================================================
 * sk-hrm-myprofile.js — SonKhang ERP v3.6
 * Trang ca nhan NV: Ho so + Cham cong + Phieu luong + KPI cua toi
 * Lien ket User dang nhap voi Ho so Nhan vien
 * 20/03/2026
 * ================================================================ */
(function(){
  'use strict';
  var _a   = function(){ return typeof window.api==='function'?window.api:typeof api==='function'?api:null; };
  var _esc = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var _gv  = function(id){ var e=document.getElementById(id); return e?e.value:''; };
  var _t   = function(m,t){ if(typeof window._hrmToast==='function') window._hrmToast(m,t); };
  var _fv  = function(n){ var v=Number(n||0); if(v>=1e6) return (v/1e6).toFixed(1)+' tri\u1ec7u'; return v.toLocaleString()+'\u0111'; };

  function loadMyProfile(){
    var ct = typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct');
    if(!ct)return;
    // Lay thong tin user hien tai
    var user = (window._auth && window._auth.user) || {};
    ct.innerHTML = '<div id="mp-root" class="fade-in">'
      +'<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
      +'<div><h1 style="font-size:22px;font-weight:900;">\ud83d\udc64 Trang c\u00e1 nh\u00e2n</h1>'
      +'<p style="font-size:12px;color:var(--text3);">' + _esc(user.email||'') + '</p></div>'
      +'</div>'
      +'<div class="hrm-tabbar">'
      +_mtab('info',    '\ud83d\udccc', 'H\u1ed3 s\u01a1')
      +_mtab('attend',  '\ud83d\uddd3',  'Ch\u1ea5m c\u00f4ng')
      +_mtab('payslip', '\ud83d\udcb0', 'Phi\u1ebfu l\u01b0\u01a1ng')
      +_mtab('kpi',     '\ud83c\udfaf', 'KPI c\u1ee7a t\u00f4i')
      +_mtab('leave',   '\ud83c\udfe5', 'Ngh\u1ec9 ph\u00e9p')
      +'</div>'
      +'<div id="mp-content"></div>'
      +'</div>';
    _mpSwitch('info');
  }
  window.loadMyProfile  = loadMyProfile;
  window.loadHoSoNV     = loadMyProfile;   /* alias sidebar */
  window.loadCaNhan     = loadMyProfile;

  function _mtab(k, icon, label){
    return '<button class="hrm-tab" id="mpt-'+k+'" onclick="_mpSwitch(\''+k+'\')">'
      + icon+' '+label+'</button>';
  }

  function _mpSwitch(tab){
    ['info','attend','payslip','kpi','leave'].forEach(function(t){
      var b=document.getElementById('mpt-'+t); if(b) b.classList.toggle('active',t===tab);
    });
    var ct=document.getElementById('mp-content'); if(!ct)return;
    ct.innerHTML='<div class="hrm-loading"><div class="sk-spin" style="width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div>';
    setTimeout(function(){
      if(tab==='info')    _mpInfo();
      else if(tab==='attend')  _mpAttend();
      else if(tab==='payslip') _mpPayslip();
      else if(tab==='kpi')     _mpKPI();
      else if(tab==='leave')   _mpLeave();
    }, 60);
  }
  window._mpSwitch = _mpSwitch;

  /* ── Hồ sơ của tôi ──────────────────────────────────────── */
  function _mpInfo(){
    var ct=document.getElementById('mp-content'); if(!ct)return;
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_get_my_profile',{},function(e,d){
      if(e||!d){ct.innerHTML='<div class="hrm-alert">L\u1ed7i t\u1ea3i h\u1ed3 s\u01a1</div>';return;}
      if(!d.ok){
        // Chua lien ket → Hien huong dan
        var user = (window._auth&&window._auth.user)||{};
        ct.innerHTML='<div class="card" style="padding:24px;max-width:480px;margin:0 auto;text-align:center;">'
          +'<div style="font-size:48px;margin-bottom:12px;">\ud83d\udd17</div>'
          +'<div style="font-size:16px;font-weight:800;margin-bottom:8px;">Ch\u01b0a li\u00ean k\u1ebft h\u1ed3 s\u01a1 nh\u00e2n vi\u00ean</div>'
          +'<div style="font-size:12px;color:var(--text3);margin-bottom:20px;">T\u00e0i kho\u1ea3n <strong style="color:var(--accent2);">'+_esc(user.email||'')+'</strong>'
          +' ch\u01b0a \u0111\u01b0\u1ee3c li\u00ean k\u1ebft v\u1edbi h\u1ed3 s\u01a1 nh\u00e2n vi\u00ean.</div>'
          +'<div style="font-size:12px;color:var(--text3);margin-bottom:20px;">'
          +'Li\u00ean h\u1ec7 Admin \u0111\u1ec3 li\u00ean k\u1ebft ho\u1eb7c nh\u1eadp M\u00e3 NV c\u1ee7a b\u1ea1n:</div>'
          +'<div style="display:flex;gap:8px;justify-content:center;">'
          +'<input id="mp-emp-id" class="form-input" placeholder="VD: NV001" style="max-width:160px;">'
          +'<button class="btn-primary" onclick="_mpRequestLink()" style="font-size:11px;">\ud83d\udd17 Y\u00eau c\u1ea7u li\u00ean k\u1ebft</button>'
          +'</div></div>';
        return;
      }
      var emp = d.employee||{};
      var docs = d.documents||[];
      var alertDocs = docs.filter(function(x){return x.alert!=='ok';});
      var COLORS = ['#3d6bff','#10d68c','#a855f7','#fbbf24','#ff4d6d','#06b6d4'];
      var ini = (emp.name||'?').trim().split(/\s+/);
      ini = ini.length>=2?(ini[0][0]+ini[ini.length-1][0]).toUpperCase():(emp.name||'?')[0].toUpperCase();
      var col = COLORS[Math.abs((emp.id||'').split('').reduce(function(a,c){return a*31+c.charCodeAt(0);},0))%COLORS.length];

      ct.innerHTML=(alertDocs.length?'<div class="hrm-alert" style="margin-bottom:12px;">\u26a0\ufe0f '+alertDocs.length+' t\u00e0i li\u1ec7u s\u1eafp h\u1ebft h\u1ea1n</div>':'')
        +'<div class="card" style="padding:20px;margin-bottom:16px;">'
        +'<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">'
        +'<div class="hrm-av" style="background:'+col+';width:64px;height:64px;font-size:24px;font-weight:900;">'+ini+'</div>'
        +'<div style="flex:1;">'
        +'<div style="font-size:20px;font-weight:900;">'+_esc(emp.name||'')+'</div>'
        +'<div style="font-size:13px;color:var(--text3);margin-top:2px;">'+_esc(emp.role||'')+' \u2022 M\u00e3 NV: <strong style="color:var(--accent2);">'+_esc(emp.id||'')+'</strong></div>'
        +'<div style="font-size:11px;color:var(--text3);margin-top:4px;">\ud83d\udcdd '+_esc(emp.start_date||'')+(emp.years_worked?' \u2022 '+emp.years_worked+' n\u0103m c\u00f4ng t\u00e1c':'')+'</div>'
        +'</div>'
        +'<div style="text-align:right;">'
        +'<div class="hrm-badge hrm-badge-green">\u2705 '+_esc(emp.status||'')+'</div>'
        +'<div style="font-size:20px;font-weight:900;color:var(--green);margin-top:8px;">'+_fv(emp.base_salary)+'</div>'
        +'<div style="font-size:10px;color:var(--text3);">L\u01b0\u01a1ng c\u01a1 b\u1ea3n</div>'
        +'</div></div></div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">'
        +'<div class="card" style="padding:16px;">'
        +'<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:12px;">\ud83d\udccc Th\u00f4ng tin c\u00e1 nh\u00e2n</div>'
        +_iRow('\ud83d\udcde S\u0110T',         emp.phone)
        +_iRow('\ud83d\udce7 Email',             emp.email)
        +_iRow('\ud83c\udf82 Ng\u00e0y sinh',   emp.birthday)
        +_iRow('\ud83d\udc64 Gi\u1edbi t\u00ednh',emp.gender)
        +_iRow('\ud83d\udccb CMND',              emp.id_card)
        +_iRow('\ud83c\udfe0 \u0110\u1ecba ch\u1ec9',emp.address)
        +'</div>'
        +'<div class="card" style="padding:16px;">'
        +'<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:12px;">\ud83c\udfe6 Th\u00f4ng tin c\u00f4ng ty</div>'
        +_iRow('\ud83d\udcbc V\u1ecb tr\u00ed',  emp.role)
        +_iRow('\ud83d\udcc5 V\u00e0o l\u00e0m', emp.start_date)
        +_iRow('\ud83c\udfe6 STK',               emp.bank_account)
        +_iRow('\ud83c\udfe6 Ng\u00e2n h\u00e0ng',emp.bank_name)
        +(emp.note?_iRow('\ud83d\udcdd Ghi ch\u00fa',emp.note):'')
        +'</div></div>'
        +(docs.length?'<div class="card" style="padding:16px;margin-top:14px;">'
          +'<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:10px;">\ud83d\udcce T\u00e0i li\u1ec7u</div>'
          +'<table class="hrm-tbl"><thead><tr><th>Lo\u1ea1i</th><th>T\u00ean</th><th>H\u1ebft h\u1ea1n</th><th>T\u00ecnh tr\u1ea1ng</th></tr></thead><tbody>'
          +docs.map(function(doc){
            var ac=doc.alert==='expired'?'hrm-badge-red':doc.alert==='urgent'?'hrm-badge-yellow':'hrm-badge-green';
            return '<tr><td>'+_esc(doc.type)+'</td>'
              +'<td>'+(doc.link?'<a href="'+_esc(doc.link)+'" target="_blank" style="color:var(--accent2);">'+_esc(doc.name||'Xem')+'</a>':_esc(doc.name||''))+'</td>'
              +'<td>'+_esc(doc.expire_date||'\u2014')+'</td>'
              +'<td><span class="hrm-badge '+ac+'">'+(doc.alert==='expired'?'H\u1ebft h\u1ea1n':doc.alert==='urgent'?'S\u1eafp h\u1ebft':doc.days_left===null?'OK':doc.days_left+'ng')+'</span></td>'
              +'</tr>';
          }).join('')
          +'</tbody></table></div>':'');
    });
  }

  function _iRow(label,val){
    if(!val && val!==0) return '';
    return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;">'
      +'<span style="color:var(--text3);">'+label+'</span>'
      +'<span style="font-weight:600;color:var(--text);text-align:right;max-width:60%;">'+_esc(val)+'</span></div>';
  }

  function _mpRequestLink(){
    var empId=(_gv('mp-emp-id')||'').trim();
    if(!empId){_t('Nh\u1eadp M\u00e3 NV','error');return;}
    var user=(window._auth&&window._auth.user)||{};
    // Gui yeu cau lien ket qua workflow
    var apiF=_a(); if(!apiF)return;
    apiF('wf_create_request',{
      type:'de_xuat_khac',
      title:'Y\u00eau c\u1ea7u li\u00ean k\u1ebft h\u1ed3 s\u01a1 NV',
      content:'Email: '+user.email+'\nMa NV: '+empId,
      sender_name:user.name||user.email
    },function(e,d){
      if(e||!d||!d.ok){_t((d&&d.error)||'L\u1ed7i','error');return;}
      _t('\u2705 \u0110\u00e3 g\u1eedi y\u00eau c\u1ea7u li\u00ean k\u1ebft: '+d.id,'ok');
    });
  }
  window._mpRequestLink=_mpRequestLink;

  /* ── Chấm công của tôi ──────────────────────────────────── */
  function _mpAttend(){
    var ct=document.getElementById('mp-content'); if(!ct)return;
    var now=new Date();
    ct.innerHTML='<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center;">'
      +'<select id="mpa-m" class="form-input" style="width:100px;padding:7px 10px;font-size:12px;">'
      +[1,2,3,4,5,6,7,8,9,10,11,12].map(function(m){return '<option value="'+m+'"'+(m===now.getMonth()+1?' selected':'')+'>Th\u00e1ng '+m+'</option>';}).join('')
      +'</select>'
      +'<input id="mpa-y" type="number" value="'+now.getFullYear()+'" class="form-input" style="width:90px;padding:7px 10px;font-size:12px;">'
      +'<button class="btn-primary" onclick="_mpLoadAttend()" style="font-size:11px;">\ud83d\udd0d Xem</button>'
      +'</div>'
      +'<div id="mpa-body"></div>';
    _mpLoadAttend();
  }

  function _mpLoadAttend(){
    var el=document.getElementById('mpa-body'); if(!el)return;
    var m=Number(_gv('mpa-m')||new Date().getMonth()+1);
    var y=Number(_gv('mpa-y')||new Date().getFullYear());
    el.innerHTML='<div class="hrm-loading"><div class="sk-spin" style="width:20px;height:20px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div>';
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_get_my_attendance',{month:m,year:y},function(e,d){
      if(e||!d||!d.ok){
        el.innerHTML='<div class="hrm-info">'+(d&&d.error||'Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u')+'</div>';
        return;
      }
      var rows=(d.data||[]);
      if(!rows.length){ el.innerHTML='<div class="hrm-empty">Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u ch\u1ea5m c\u00f4ng</div>'; return; }
      var r=rows[0];
      var rate=r.std_days>0?Math.round(r.worked/r.std_days*100):0;
      el.innerHTML='<div class="hrm-kpi-grid" style="margin-bottom:16px;">'
        +_kCard('\ud83d\udcca','Ng\u00e0y chu\u1ea9n',r.std_days,'var(--text2)')
        +_kCard('\u2705','Ng\u00e0y l\u00e0m',r.worked,'var(--green)')
        +_kCard('\u274c','Ng\u00e0y v\u1eafng',r.absent,'var(--red)')
        +_kCard('\u23f0','\u0110i mu\u1ed9n',r.late_count+' l\u1ea7n','var(--yellow)')
        +_kCard('\u23f3','OT',r.ot_hours+'h','var(--purple)')
        +_kCard('\ud83d\udccd','T\u1eff l\u1ec7',rate+'%',rate>=95?'var(--green)':rate>=80?'var(--yellow)':'var(--red)')
        +'</div>'
        +'<div class="card" style="padding:16px;">'
        +'<div class="progress-bar" style="height:8px;"><div class="progress-fill" style="width:'+Math.min(rate,100)+'%;"></div></div>'
        +(r.note?'<div style="font-size:12px;color:var(--text3);margin-top:8px;">\ud83d\udcdd '+_esc(r.note)+'</div>':'')
        +'</div>'
        +'<div style="margin-top:14px;">'
        +'<button class="btn-ghost" onclick="_mpLeaveQuick()" style="font-size:11px;">\ud83c\udfe5 \u0110\u0103ng k\u00fd ngh\u1ec9</button>'
        +'</div>';
    });
  }
  window._mpLoadAttend=_mpLoadAttend;

  function _mpLeaveQuick(){
    var user=(window._auth&&window._auth.user)||{};
    var todayStr=new Date().toISOString().split('T')[0];
    var TYPES=['Ngh\u1ec9 ph\u00e9p n\u0103m','Ngh\u1ec9 \u1ed1m','Ngh\u1ec9 thai s\u1ea3n','Ngh\u1ec9 kh\u00f4ng l\u01b0\u01a1ng'];
    var html='<div class="hrm-modal">'
      +'<div class="hrm-modal-hd"><span style="font-size:15px;font-weight:800;">\ud83c\udfe5 \u0110\u0103ng k\u00fd ngh\u1ec9 ph\u00e9p</span>'
      +'<button class="hrm-close" onclick="_closeModal()">&#10005;</button></div>'
      +'<div class="hrm-modal-bd"><div class="hrm-form-grid">'
      +'<div class="hrm-form-group"><label class="hrm-lbl">Lo\u1ea1i ngh\u1ec9</label>'
      +'<select id="lq-type" class="form-input">'+TYPES.map(function(t){return '<option>'+t+'</option>';}).join('')+'</select></div>'
      +'<div class="hrm-form-group"><label class="hrm-lbl">T\u1eeb ng\u00e0y</label><input id="lq-from" type="date" value="'+todayStr+'" class="form-input"></div>'
      +'<div class="hrm-form-group"><label class="hrm-lbl">\u0110\u1ebfn ng\u00e0y</label><input id="lq-to" type="date" value="'+todayStr+'" class="form-input"></div>'
      +'<div class="hrm-form-group full"><label class="hrm-lbl">L\u00fd do</label><input id="lq-reason" class="form-input"></div>'
      +'</div></div>'
      +'<div class="hrm-modal-ft"><button class="btn-ghost" onclick="_closeModal()">H\u1ee7y</button>'
      +'<button class="btn-primary" onclick="_mpSubmitLeave()">\ud83d\udce4 G\u1eedi</button></div></div>';
    _showModal(html);
  }
  window._mpLeaveQuick=_mpLeaveQuick;

  function _mpSubmitLeave(){
    var user=(window._auth&&window._auth.user)||{};
    var apiF=_a(); if(!apiF)return;
    var empId='';
    // Lay empId tu my_profile cache
    apiF('hrm_get_my_profile',{},function(e,d){
      empId=(d&&d.employee&&d.employee.id)||'';
      apiF('hrm_request_leave',{
        emp_id:empId, emp_name:user.name||user.email,
        from_date:_gv('lq-from'), to_date:_gv('lq-to'),
        type:_gv('lq-type'), reason:_gv('lq-reason')
      },function(e2,d2){
        if(e2||!d2||!d2.ok){_t((d2&&d2.error)||'L\u1ed7i','error');return;}
        _closeModal(); _t('\u2705 \u0110\u00e3 g\u1eedi: '+d2.leave_id,'ok');
      });
    });
  }
  window._mpSubmitLeave=_mpSubmitLeave;

  /* ── Phiếu lương của tôi ────────────────────────────────── */
  function _mpPayslip(){
    var ct=document.getElementById('mp-content'); if(!ct)return;
    var now=new Date();
    ct.innerHTML='<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center;">'
      +'<select id="mpp-m" class="form-input" style="width:100px;padding:7px 10px;font-size:12px;">'
      +[1,2,3,4,5,6,7,8,9,10,11,12].map(function(m){return '<option value="'+m+'"'+(m===now.getMonth()+1?' selected':'')+'>Th\u00e1ng '+m+'</option>';}).join('')
      +'</select>'
      +'<input id="mpp-y" type="number" value="'+now.getFullYear()+'" class="form-input" style="width:90px;padding:7px 10px;font-size:12px;">'
      +'<button class="btn-primary" onclick="_mpLoadPayslip()" style="font-size:11px;">\ud83d\udd0d Xem</button>'
      +'</div><div id="mpp-body"></div>';
    _mpLoadPayslip();
  }

  function _mpLoadPayslip(){
    var el=document.getElementById('mpp-body'); if(!el)return;
    var m=Number(_gv('mpp-m')||new Date().getMonth()+1);
    var y=Number(_gv('mpp-y')||new Date().getFullYear());
    el.innerHTML='<div class="hrm-loading"><div class="sk-spin" style="width:20px;height:20px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div>';
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_get_my_payslip',{month:m,year:y},function(e,d){
      if(e||!d||!d.ok){el.innerHTML='<div class="hrm-info">Ch\u01b0a c\u00f3 phi\u1ebfu l\u01b0\u01a1ng ho\u1eb7c ch\u01b0a li\u00ean k\u1ebft h\u1ed3 s\u01a1</div>';return;}
      if(!d.data){el.innerHTML='<div class="hrm-empty">Ch\u01b0a c\u00f3 phi\u1ebfu l\u01b0\u01a1ng th\u00e1ng '+m+'/'+y+'</div>';return;}
      var r=d.data;
      el.innerHTML='<div class="card" style="padding:24px;max-width:480px;">'
        +'<div style="text-align:center;margin-bottom:16px;">'
        +'<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);">PHI\u1EEAU L\u01af\u01a0NG TH\u00c1NG '+m+'/'+y+'</div>'
        +'<div style="font-size:32px;font-weight:900;color:var(--green);margin:8px 0;">'+_fv(r.net)+'</div>'
        +'</div>'
        +'<div style="background:var(--bg3);border-radius:10px;padding:14px;">'
        +[
          ['+','L\u01b0\u01a1ng c\u01a1 b\u1ea3n '+r.worked+' ng\u00e0y',r.actual,'var(--text2)'],
          ['+','Hoa h\u1ed3ng',r.commission,'var(--cyan)'],
          ['+','Th\u01b0\u1edfng GH',r.gh_bonus,'var(--green)'],
          ['+','Th\u01b0\u1edfng KPI',r.kpi_bonus,'var(--green)'],
          ['\u2212','T\u1ea1m \u1ee9ng',r.advance,'var(--red)'],
          ['\u2212','Ph\u1ea1t',r.penalty,'var(--red)']
        ].map(function(c){
          if(!c[2]) return '';
          return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px;">'
            +'<span style="color:var(--text3);">'+c[0]+' '+c[1]+'</span>'
            +'<span style="font-weight:700;color:'+c[3]+';">'+_fv(c[2])+'</span></div>';
        }).join('')
        +'<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;font-weight:900;">'
        +'<span>Th\u1ef1c l\u0129nh</span><span style="color:var(--green);">'+_fv(r.net)+'</span></div>'
        +'</div></div>';
    });
  }
  window._mpLoadPayslip=_mpLoadPayslip;

  /* ── KPI của tôi ────────────────────────────────────────── */
  function _mpKPI(){
    var ct=document.getElementById('mp-content'); if(!ct)return;
    var now=new Date();
    ct.innerHTML='<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center;">'
      +'<select id="mpk-m" class="form-input" style="width:100px;padding:7px 10px;font-size:12px;">'
      +[1,2,3,4,5,6,7,8,9,10,11,12].map(function(m){return '<option value="'+m+'"'+(m===now.getMonth()+1?' selected':'')+'>Th\u00e1ng '+m+'</option>';}).join('')
      +'</select>'
      +'<input id="mpk-y" type="number" value="'+now.getFullYear()+'" class="form-input" style="width:90px;padding:7px 10px;font-size:12px;">'
      +'<button class="btn-primary" onclick="_mpLoadKPI()" style="font-size:11px;">\ud83d\udd0d Xem</button>'
      +'</div><div id="mpk-body"></div>';
    _mpLoadKPI();
  }

  function _mpLoadKPI(){
    var el=document.getElementById('mpk-body'); if(!el)return;
    var m=Number(_gv('mpk-m')||new Date().getMonth()+1);
    var y=Number(_gv('mpk-y')||new Date().getFullYear());
    el.innerHTML='<div class="hrm-loading"><div class="sk-spin" style="width:20px;height:20px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div>';
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_get_my_kpi',{month:m,year:y},function(e,d){
      if(e||!d||!d.ok){el.innerHTML='<div class="hrm-info">'+(d&&d.error||'Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u KPI')+'</div>';return;}
      var rows=d.data||[];
      if(!rows.length){el.innerHTML='<div class="hrm-empty">Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u KPI th\u00e1ng '+m+'/'+y+'</div>';return;}
      var total=rows.reduce(function(s,r){return s+r.score;},0);
      var grade=total>=90?'A':total>=75?'B':total>=60?'C':'D';
      var GCOL={A:'var(--green)',B:'var(--accent2)',C:'var(--yellow)',D:'var(--red)'};
      el.innerHTML='<div style="text-align:center;margin-bottom:16px;">'
        +'<div style="font-size:40px;font-weight:900;color:'+(GCOL[grade]||'var(--text3))')+';">'+grade+'</div>'
        +'<div style="font-size:20px;font-weight:800;color:var(--accent2);">'+Math.round(total*10)/10+' \u0111i\u1ec3m</div>'
        +'<div style="font-size:11px;color:var(--text3);">Th\u00e1ng '+m+'/'+y+'</div>'
        +'</div>'
        +'<div class="card" style="overflow:hidden;">'
        +'<table class="hrm-tbl"><thead><tr><th>Ch\u1ec9 s\u1ed1</th><th>M\u1ee5c ti\u00eau</th><th>Th\u1ef1c t\u1ebf</th><th>\u0110\u1ea1t</th><th>\u0110i\u1ec3m</th></tr></thead><tbody>'
        +rows.map(function(r){
          var pc=r.achieve; var col=pc>=100?'var(--green)':pc>=80?'var(--yellow)':'var(--red)';
          return '<tr><td><div style="font-weight:700;">'+_esc(r.name)+'</div><div style="font-size:9px;color:var(--text3);">'+_esc(r.unit)+'</div></td>'
            +'<td>'+r.target+'</td><td style="font-weight:700;">'+r.actual+'</td>'
            +'<td><div style="font-weight:800;color:'+col+';">'+pc+'%</div>'
            +'<div class="progress-bar" style="margin-top:2px;"><div class="progress-fill" style="width:'+Math.min(pc,100)+'%;background:'+col+';"></div></div></td>'
            +'<td style="font-weight:900;color:'+col+';">'+r.score+'</td></tr>';
        }).join('')
        +'</tbody></table></div>';
    });
  }
  window._mpLoadKPI=_mpLoadKPI;

  /* ── Nghỉ phép của tôi ──────────────────────────────────── */
  function _mpLeave(){
    var ct=document.getElementById('mp-content'); if(!ct)return;
    ct.innerHTML='<div style="display:flex;justify-content:flex-end;margin-bottom:12px;">'
      +'<button class="btn-primary" onclick="_mpLeaveQuick()" style="font-size:11px;">+ \u0110\u0103ng k\u00fd ngh\u1ec9</button></div>'
      +'<div id="mpl-body"><div class="hrm-loading"><div class="sk-spin" style="width:20px;height:20px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div></div>';
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_get_my_leaves',{},function(e,d){
      var el=document.getElementById('mpl-body'); if(!el)return;
      if(e||!d||!d.ok){el.innerHTML='<div class="hrm-info">'+(d&&d.error||'Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u')+'</div>';return;}
      var rows=d.data||[];
      if(!rows.length){el.innerHTML='<div class="hrm-empty">Ch\u01b0a c\u00f3 \u0111\u01a1n ngh\u1ec9 n\u00e0o.</div>';return;}
      var stMap={cho_duyet:{l:'Ch\u1edd',c:'hrm-badge-yellow'},da_duyet:{l:'\u0110\u00e3 duy\u1ec7t',c:'hrm-badge-green'},tu_choi:{l:'T\u1eeb ch\u1ed1i',c:'hrm-badge-red'}};
      el.innerHTML='<div class="card" style="overflow:hidden;">'
        +'<table class="hrm-tbl"><thead><tr><th>Lo\u1ea1i</th><th>T\u1eeb</th><th>\u0110\u1ebfn</th><th>L\u00fd do</th><th>T\u00ecnh tr\u1ea1ng</th></tr></thead><tbody>'
        +rows.map(function(r){
          var st=stMap[r.status]||{l:r.status,c:'hrm-badge-blue'};
          return '<tr><td>'+_esc(r.type)+'</td><td>'+_esc(r.from)+'</td><td>'+_esc(r.to)+'</td>'
            +'<td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;">'+_esc(r.reason||'\u2014')+'</td>'
            +'<td><span class="hrm-leave-status '+st.c+'">'+st.l+'</span></td></tr>';
        }).join('')
        +'</tbody></table></div>';
    });
  }

  /* ── Link Panel cho Admin ───────────────────────────────── */
  function loadUserEmpLink(){
    var ct=typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct');
    if(!ct)return;
    ct.innerHTML='<div class="fade-in">'
      +'<div style="margin-bottom:20px;">'
      +'<h1 style="font-size:22px;font-weight:900;">\ud83d\udd17 Li\u00ean k\u1ebft User \u2014 Nh\u00e2n vi\u00ean</h1>'
      +'<p style="font-size:12px;color:var(--text3);">Sau khi li\u00ean k\u1ebft, NV c\u00f3 th\u1ec3 xem h\u1ed3 s\u01a1, phi\u1ebfu l\u01b0\u01a1ng, KPI c\u1ee7a m\u00ecnh</p></div>'
      +'<div class="card" style="padding:20px;max-width:500px;">'
      +'<div class="hrm-form-grid">'
      +'<div class="hrm-form-group full"><label class="hrm-lbl">Email \u0111\u0103ng nh\u1eadp (User_Database)</label>'
      +'<input id="lk-email" class="form-input" type="email" placeholder="nhanvien@sonkhang.vn"></div>'
      +'<div class="hrm-form-group full"><label class="hrm-lbl">M\u00e3 NV (NhanVien sheet)</label>'
      +'<input id="lk-empid" class="form-input" placeholder="NV001"></div>'
      +'</div>'
      +'<div style="margin-top:16px;display:flex;gap:8px;">'
      +'<button class="btn-primary" onclick="_doLink()">\ud83d\udd17 Li\u00ean k\u1ebft</button>'
      +'<button class="btn-ghost" onclick="_checkLink()">\ud83d\udd0d Ki\u1ec3m tra</button>'
      +'</div>'
      +'<div id="lk-result" style="margin-top:12px;"></div>'
      +'</div>'
      +'<div style="margin-top:16px;" id="lk-list-wrap">'
      +'<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:8px;">Tr\u1ea1ng th\u00e1i li\u00ean k\u1ebft</div>'
      +'<div id="lk-status-list"><button class="btn-ghost" onclick="_loadLinkStatus()" style="font-size:11px;">\ud83d\udd0d T\u1ea3i tr\u1ea1ng th\u00e1i</button></div>'
      +'</div></div>';
  }
  window.loadUserEmpLink=loadUserEmpLink;

  function _doLink(){
    var email=(_gv('lk-email')||'').trim();
    var empId=(_gv('lk-empid')||'').trim();
    if(!email||!empId){_t('Nh\u1eadp email v\u00e0 M\u00e3 NV','error');return;}
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_link_user_employee',{email:email,emp_id:empId},function(e,d){
      var el=document.getElementById('lk-result'); if(!el)return;
      if(e||!d||!d.ok){el.innerHTML='<div class="hrm-alert">'+(d&&d.error||'L\u1ed7i')+'</div>';return;}
      el.innerHTML='<div class="hrm-info" style="background:rgba(16,214,140,.08);border-color:rgba(16,214,140,.2);color:var(--green);">'
        +'\u2705 '+_esc(d.msg)+'</div>';
      _t('\u2705 '+d.msg,'ok');
    });
  }
  window._doLink=_doLink;

  function _checkLink(){
    var email=(_gv('lk-email')||'').trim();
    if(!email){_t('Nh\u1eadp email','error');return;}
    var el=document.getElementById('lk-result'); if(!el)return;
    var apiF=_a(); if(!apiF)return;
    // Lay profile cua email do
    apiF('auth_get_profile',{},function(e,d){
      // API auth_get_profile chi lay cua session hien tai
      // Nen dung hrm_get_employees filter email
      apiF('hrm_get_employees',{search:email},function(e2,d2){
        var found=(d2&&d2.data||[]).filter(function(r){return (r.email||'').toLowerCase()===email.toLowerCase();});
        if(found.length){
          el.innerHTML='<div class="hrm-info" style="background:rgba(16,214,140,.08);border-color:rgba(16,214,140,.2);color:var(--green);">'
            +'\u2705 \u0110\u00e3 li\u00ean k\u1ebft: '+_esc(email)+' \u2192 '+_esc(found[0].id)+' ('+_esc(found[0].name)+')'+'</div>';
        } else {
          el.innerHTML='<div class="hrm-info">\u26a0\ufe0f Email n\u00e0y ch\u01b0a \u0111\u01b0\u1ee3c li\u00ean k\u1ebft v\u1edbi NV n\u00e0o.</div>';
        }
      });
    });
  }
  window._checkLink=_checkLink;

  function _loadLinkStatus(){
    var el=document.getElementById('lk-status-list'); if(!el)return;
    el.innerHTML='<div class="hrm-loading"><div class="sk-spin" style="width:16px;height:16px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;display:inline-block;"></div></div>';
    var apiF=_a(); if(!apiF)return;
    apiF('hrm_get_employees',{status:'Hoat dong'},function(e,d){
      if(e||!d||!d.ok){el.innerHTML='<div class="hrm-alert">L\u1ed7i</div>';return;}
      var rows=d.data||[];
      if(!rows.length){el.innerHTML='<div class="hrm-empty">Kh\u00f4ng c\u00f3 nh\u00e2n vi\u00ean</div>';return;}
      el.innerHTML='<div class="card" style="overflow:hidden;">'
        +'<table class="hrm-tbl"><thead><tr><th>M\u00e3 NV</th><th>H\u1ecd t\u00ean</th><th>Email NV</th><th>Tr\u1ea1ng th\u00e1i</th></tr></thead><tbody>'
        +rows.map(function(r){
          var linked=!!(r.email&&r.email.trim());
          return '<tr><td style="font-weight:700;">'+_esc(r.id)+'</td>'
            +'<td>'+_esc(r.name)+'</td>'
            +'<td style="font-size:11px;color:var(--text3);">'+_esc(r.email||'\u2014')+'</td>'
            +'<td><span class="hrm-badge '+(linked?'hrm-badge-green':'hrm-badge-red')+'">'+(linked?'\u2705 Li\u00ean k\u1ebft':'\u2714 Ch\u01b0a link')+'</span></td>'
            +'</tr>';
        }).join('')
        +'</tbody></table></div>';
    });
  }
  window._loadLinkStatus=_loadLinkStatus;

  /* ── Helpers ─────────────────────────────────────────────── */
  function _kCard(icon,label,val,color){
    return '<div class="hrm-kpi card"><div class="hrm-kpi-lbl">'+icon+' '+label+'</div>'
      +'<div class="hrm-kpi-val" style="color:'+color+';">'+val+'</div></div>';
  }
  function _showModal(html){
    _closeModal();
    var ov=document.createElement('div'); ov.className='hrm-modal-overlay'; ov.id='hrm-modal-ov';
    ov.innerHTML=html; ov.addEventListener('click',function(e){if(e.target===ov)_closeModal();});
    document.body.appendChild(ov);
  }
  function _closeModal(){var ov=document.getElementById('hrm-modal-ov');if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);}
  window._closeModal=window._closeModal||_closeModal;

})();
