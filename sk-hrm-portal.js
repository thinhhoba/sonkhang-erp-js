/* ================================================================
 * sk-hrm-portal.js — SonKhang ERP v3.6
 * SK-HRM-04: Cong thong tin noi bo
 * 20/03/2026
 * ================================================================ */
(function(){
'use strict';
var _api = function(){return typeof window.api==='function'?window.api:typeof api==='function'?api:null;};
var _esc = function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
var _gv  = function(id){var e=document.getElementById(id);return e?e.value:'';};
var _ct  = function(){return document.getElementById('hrm-content');};
var _toast = function(m,t){if(typeof window._hrmToast==='function')window._hrmToast(m,t);};

var ANNOUNCE_TYPES = {
  thong_bao   : {label:'\ud83d\udce2 Th\u00f4ng b\u00e1o',  color:'var(--accent2)'},
  khan_cap    : {label:'\ud83d\udea8 Kh\u1ea9n c\u1ea5p',   color:'var(--red)'},
  su_kien     : {label:'\ud83c\udf89 S\u1ef1 ki\u1ec7n',    color:'var(--green)'},
  dao_tao     : {label:'\ud83d\udcda \u0110\u00e0o t\u1ea1o',color:'var(--purple)'},
  chinh_sach  : {label:'\ud83d\udcdc Ch\u00ednh s\u00e1ch',  color:'var(--yellow)'}
};

/* ── Entry ─────────────────────────────────────────────────── */
function loadPortal(){
  var ct=_ct();if(!ct)return;
  ct.innerHTML='<div id="portal-root" class="fade-in">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">'
    +'<div><h1 style="font-size:22px;font-weight:900;">\ud83c\udfe2 C\u1ed5ng th\u00f4ng tin n\u1ed9i b\u1ed9</h1>'
    +'<p style="font-size:12px;color:var(--text3);margin-top:3px;">SonKhang ERP \u2014 Internal Portal</p></div>'
    +'</div>'
    +'<div class="hrm-tabbar">'
    +_ptab('announce','\ud83d\udce2','Th\u00f4ng b\u00e1o')
    +_ptab('directory','\ud83d\udcde','Danh b\u1ea1')
    +_ptab('birthday','\ud83c\udf82','Sinh nh\u1eadt')
    +_ptab('qa','\u2753','H\u1ecfi \u0111\u00e1p')
    +'</div>'
    +'<div id="portal-content"></div></div>';
  _pSwitch('announce');
}
window.loadPortal=loadPortal;
function _ptab(t,icon,label){return '<button class="hrm-tab" id="pt-'+t+'" onclick="_pSwitch(\''+t+'\')">'+icon+' '+label+'</button>';}

function _pSwitch(tab){
  ['announce','directory','birthday','qa'].forEach(function(t){
    var b=document.getElementById('pt-'+t);if(b)b.classList.toggle('active',t===tab);});
  var ct=document.getElementById('portal-content');if(!ct)return;
  ct.innerHTML='<div class="hrm-loading"><div class="sk-spin" style="width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div>';
  setTimeout(function(){
    if(tab==='announce') _loadAnnounce();
    else if(tab==='directory') _loadDirectory();
    else if(tab==='birthday') _loadBirthday();
    else if(tab==='qa') _loadQA();
  },50);
}
window._pSwitch=_pSwitch;

/* ── Thông báo ─────────────────────────────────────────────── */
function _loadAnnounce(){
  var ct=document.getElementById('portal-content');if(!ct)return;
  var apiF=_api();if(!apiF){ct.innerHTML='<div class="hrm-alert">API kh\u00f4ng kh\u1ea3 d\u1ee5ng</div>';return;}
  apiF('portal_get_announcements',{limit:30},function(e,d){
    if(e||!d||!d.ok){ct.innerHTML='<div class="hrm-alert">L\u1ed7i t\u1ea3i d\u1eef li\u1ec7u</div>';return;}
    var rows=d.data||[];
    var html='<div style="display:flex;justify-content:flex-end;margin-bottom:12px;">'
      +'<button class="btn-primary" onclick="_announceOpenForm()" style="font-size:11px;">+ T\u1ea1o th\u00f4ng b\u00e1o</button></div>';
    if(!rows.length){html+='<div class="hrm-empty">\ud83d\udce2 Ch\u01b0a c\u00f3 th\u00f4ng b\u00e1o n\u00e0o.</div>';}
    else {
      html+=rows.map(function(r){
        var t=ANNOUNCE_TYPES[r.type]||{label:r.type,color:'var(--text3)'};
        var bg=r.priority==='cao'?'rgba(255,77,109,.06)':'var(--bg2)';
        var bc=r.priority==='cao'?'rgba(255,77,109,.3)':'var(--border)';
        return '<div class="card" style="padding:16px;margin-bottom:10px;background:'+bg+';border-color:'+bc+';">'
          +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">'
          +'<div style="flex:1;">'
          +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
          +'<span style="font-size:10px;font-weight:800;color:'+t.color+';background:rgba(0,0,0,.15);padding:2px 7px;border-radius:5px;">'+t.label+'</span>'
          +(r.priority==='cao'?'<span style="font-size:9px;color:var(--red);font-weight:800;">\ud83d\udea8 KHAN CAP</span>':'')
          +'<span style="font-size:10px;color:var(--text3);">'+_esc(r.date)+'</span>'
          +'</div>'
          +'<div style="font-size:14px;font-weight:800;margin-bottom:6px;">'+_esc(r.title)+'</div>'
          +'<div style="font-size:12px;color:var(--text2);white-space:pre-wrap;">'+_esc(r.content)+'</div>'
          +'</div>'
          +'<button class="btn-ghost" style="padding:4px 8px;font-size:10px;color:var(--red);" onclick="_announceDelete(\''+_esc(r.id)+'\')">X\u00f3a</button>'
          +'</div></div>';
      }).join('');
    }
    ct.innerHTML=html;
  });
}

function _announceOpenForm(){
  var typeOpts=Object.keys(ANNOUNCE_TYPES).map(function(k){return '<option value="'+k+'">'+ANNOUNCE_TYPES[k].label+'</option>';}).join('');
  var html='<div class="hrm-modal">'
    +'<div class="hrm-modal-hd"><span style="font-size:15px;font-weight:800;">+ T\u1ea1o th\u00f4ng b\u00e1o</span><button class="hrm-close" onclick="_closeModal()">&#10005;</button></div>'
    +'<div class="hrm-modal-bd"><div class="hrm-form-grid">'
    +'<div class="hrm-form-group full"><label class="hrm-lbl">Ti\u00eau \u0111\u1ec1 *</label><input id="an-title" class="form-input" placeholder="Ti\u00eau \u0111\u1ec1 th\u00f4ng b\u00e1o..."></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">Lo\u1ea1i</label><select id="an-type" class="form-input">'+typeOpts+'</select></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">\u01af u ti\u00ean</label><select id="an-pri" class="form-input"><option value="normal">B\u00ecnh th\u01b0\u1eddng</option><option value="cao">Cao / Kh\u1ea9n</option></select></div>'
    +'<div class="hrm-form-group full"><label class="hrm-lbl">N\u1ed9i dung</label><textarea id="an-content" class="form-input" rows="4" style="resize:vertical;"></textarea></div>'
    +'</div></div>'
    +'<div class="hrm-modal-ft"><button class="btn-ghost" onclick="_closeModal()">H\u1ee7y</button>'
    +'<button class="btn-primary" onclick="_announceSave()">\ud83d\udce4 \u0110\u0103ng</button></div></div>';
  _showModal(html);
}
window._announceOpenForm=_announceOpenForm;

function _announceSave(){
  var t=(_gv('an-title')||'').trim();
  if(!t){_toast('Vui l\u00f2ng nh\u1eadp ti\u00eau \u0111\u1ec1','error');return;}
  var apiF=_api();if(!apiF)return;
  apiF('portal_save_announcement',{title:t,content:_gv('an-content'),type:_gv('an-type'),priority:_gv('an-pri')},function(e,d){
    if(e||!d||!d.ok){_toast((d&&d.error)||'L\u1ed7i','error');return;}
    _closeModal();_toast('\u2705 \u0110\u00e3 \u0111\u0103ng th\u00f4ng b\u00e1o','ok');_loadAnnounce();
  });
}
window._announceSave=_announceSave;

function _announceDelete(id){
  if(!confirm('X\u00f3a th\u00f4ng b\u00e1o n\u00e0y?'))return;
  var apiF=_api();if(!apiF)return;
  apiF('portal_delete_announcement',{id:id},function(e,d){
    if(e||!d||!d.ok){_toast('L\u1ed7i x\u00f3a','error');return;}
    _toast('\u2705 \u0110\u00e3 x\u00f3a','ok');_loadAnnounce();
  });
}
window._announceDelete=_announceDelete;

/* ── Danh bạ ───────────────────────────────────────────────── */
function _loadDirectory(){
  var ct=document.getElementById('portal-content');if(!ct)return;
  var apiF=_api();if(!apiF)return;
  ct.innerHTML='<input class="form-input" id="dir-search" placeholder="\ud83d\udd0d T\u00ecm ki\u1ebfm..." style="width:100%;max-width:300px;margin-bottom:16px;" oninput="_dirFilter()">'
    +'<div id="dir-grid" class="hrm-emp-grid"><div class="hrm-loading"><div class="sk-spin" style="width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div></div>';
  apiF('portal_get_directory',{},function(e,d){
    if(e||!d||!d.ok)return;
    window._portalDir=d.data||[];
    _dirRender(d.data);
  });
}

function _dirRender(list){
  var el=document.getElementById('dir-grid');if(!el)return;
  if(!list.length){el.innerHTML='<div class="hrm-empty">Kh\u00f4ng c\u00f3 k\u1ebft qu\u1ea3</div>';return;}
  var colors=['#3d6bff','#10d68c','#a855f7','#fbbf24','#ff4d6d','#06b6d4'];
  el.innerHTML=list.map(function(p){
    var ini=((p.name||'').trim().split(/\s+/).filter(Boolean));
    ini=ini.length>=2?(ini[0][0]+ini[ini.length-1][0]).toUpperCase():(p.name||'?')[0].toUpperCase();
    var col=colors[Math.abs(p.id.split('').reduce(function(a,c){return a*31+c.charCodeAt(0);},0))%colors.length];
    return '<div class="hrm-emp-card" style="cursor:default;">'
      +'<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;">'
      +'<div class="hrm-av" style="background:'+col+';width:40px;height:40px;font-size:14px;">'+ini+'</div>'
      +'<div><div style="font-size:13px;font-weight:800;">'+_esc(p.name)+'</div>'
      +'<div style="font-size:10px;color:var(--text3);">'+_esc(p.role)+'</div></div></div>'
      +'<div style="font-size:11px;color:var(--text2);">\ud83d\udcde '+_esc(p.phone||'\u2014')+'</div>'
      +'<div style="font-size:11px;color:var(--text2);margin-top:3px;">\ud83d\udce7 '+_esc(p.email||'\u2014')+'</div>'
      +(p.birthday?'<div style="font-size:10px;color:var(--text3);margin-top:3px;">\ud83c\udf82 '+_esc(p.birthday)+'</div>':'')
      +'</div>';
  }).join('');
}

function _dirFilter(){
  var q=((_gv('dir-search')||'').toLowerCase());
  var list=(window._portalDir||[]).filter(function(p){
    return !q||(p.name||'').toLowerCase().indexOf(q)>=0||(p.role||'').toLowerCase().indexOf(q)>=0||(p.phone||'').indexOf(q)>=0;
  });
  _dirRender(list);
}
window._dirFilter=_dirFilter;

/* ── Sinh nhật ─────────────────────────────────────────────── */
function _loadBirthday(){
  var ct=document.getElementById('portal-content');if(!ct)return;
  var apiF=_api();if(!apiF)return;
  apiF('portal_get_birthdays',{days:30},function(e,d){
    if(e||!d||!d.ok){ct.innerHTML='<div class="hrm-alert">L\u1ed7i</div>';return;}
    var rows=d.data||[];
    if(!rows.length){ct.innerHTML='<div class="hrm-empty">\ud83c\udf82 Kh\u00f4ng c\u00f3 ai sinh nh\u1eadt trong 30 ng\u00e0y t\u1edbi.</div>';return;}
    ct.innerHTML='<div style="margin-bottom:12px;font-size:12px;color:var(--text3);">Sinh nh\u1eadt trong 30 ng\u00e0y t\u1edbi</div>'
      +'<div style="display:flex;flex-direction:column;gap:8px;">'
      +rows.map(function(p){
        var today=p.days_until===0;
        return '<div class="card" style="padding:14px 16px;display:flex;align-items:center;gap:14px;'+(today?'border-color:var(--yellow);background:rgba(251,191,36,.05);':'') +'">'
          +'<div style="font-size:28px;">'+(today?'\ud83c\udf82':'\ud83d\udc4b')+'</div>'
          +'<div style="flex:1;">'
          +'<div style="font-size:13px;font-weight:800;">'+_esc(p.name)+'</div>'
          +'<div style="font-size:11px;color:var(--text3);">'+_esc(p.role)+'</div>'
          +'</div>'
          +'<div style="text-align:right;">'
          +'<div style="font-size:14px;font-weight:900;'+(today?'color:var(--yellow);':'color:var(--text2);')+'">'+_esc(p.birthday_fmt)+'</div>'
          +'<div style="font-size:10px;color:var(--text3);">'+(today?'\ud83c\udf89 H\u00f4m nay!':'C\u00f2n '+p.days_until+' ng\u00e0y')+'</div>'
          +'</div></div>';
      }).join('')
      +'</div>';
  });
}

/* ── Hỏi đáp ───────────────────────────────────────────────── */
function _loadQA(){
  var ct=document.getElementById('portal-content');if(!ct)return;
  var apiF=_api();if(!apiF)return;
  ct.innerHTML='<div style="display:flex;justify-content:flex-end;margin-bottom:12px;">'
    +'<button class="btn-primary" onclick="_qaOpenForm()" style="font-size:11px;">+ \u0110\u1eb7t c\u00e2u h\u1ecfi</button></div>'
    +'<div id="qa-list"><div class="hrm-loading"><div class="sk-spin" style="width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div></div>';
  apiF('portal_get_qa',{},function(e,d){
    var el=document.getElementById('qa-list');if(!el)return;
    if(e||!d||!d.ok){el.innerHTML='<div class="hrm-alert">L\u1ed7i</div>';return;}
    var rows=d.data||[];
    if(!rows.length){el.innerHTML='<div class="hrm-empty">\u2753 Ch\u01b0a c\u00f3 c\u00e2u h\u1ecfi n\u00e0o.</div>';return;}
    el.innerHTML=rows.map(function(q){
      var answered=q.status==='da_tra_loi';
      return '<div class="card" style="padding:14px 16px;margin-bottom:8px;">'
        +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">'
        +'<div style="flex:1;">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
        +'<span class="hrm-badge '+(answered?'hrm-badge-green':'hrm-badge-yellow')+'">'+(answered?'\u2705 \u0110\u00e3 tr\u1ea3 l\u1eddi':'\u23f3 Ch\u1edd')+'</span>'
        +'<span style="font-size:10px;color:var(--text3);">'+_esc(q.asker)+' \u2022 '+_esc(q.asked_at)+'</span></div>'
        +'<div style="font-size:13px;font-weight:700;margin-bottom:8px;">\u2753 '+_esc(q.question)+'</div>'
        +(answered?'<div style="background:rgba(16,214,140,.07);border:1px solid rgba(16,214,140,.2);border-radius:8px;padding:8px 12px;font-size:12px;">'
          +'\u2705 <strong>'+_esc(q.answerer)+'</strong>: '+_esc(q.answer)+'</div>':'')
        +'</div>'
        +(!answered?'<button class="btn-ghost" style="padding:4px 8px;font-size:10px;" onclick="_qaOpenAnswer(\''+_esc(q.id)+'\')">Tr\u1ea3 l\u1eddi</button>':'')
        +'</div></div>';
    }).join('');
  });
}

function _qaOpenForm(){
  var html='<div class="hrm-modal"><div class="hrm-modal-hd"><span style="font-size:15px;font-weight:800;">\u2753 \u0110\u1eb7t c\u00e2u h\u1ecfi</span><button class="hrm-close" onclick="_closeModal()">&#10005;</button></div>'
    +'<div class="hrm-modal-bd"><div class="hrm-form-group"><label class="hrm-lbl">C\u00e2u h\u1ecfi c\u1ee7a b\u1ea1n</label><textarea id="qa-q" class="form-input" rows="4" placeholder="Nh\u1eadp c\u00e2u h\u1ecfi..."></textarea></div></div>'
    +'<div class="hrm-modal-ft"><button class="btn-ghost" onclick="_closeModal()">H\u1ee7y</button><button class="btn-primary" onclick="_qaSubmit()">\ud83d\udce4 G\u1eedi</button></div></div>';
  _showModal(html);
}
window._qaOpenForm=_qaOpenForm;

function _qaSubmit(){
  var q=(_gv('qa-q')||'').trim();if(!q){_toast('Nh\u1eadp c\u00e2u h\u1ecfi','error');return;}
  var apiF=_api();if(!apiF)return;
  apiF('portal_ask_question',{question:q},function(e,d){
    if(e||!d||!d.ok){_toast('L\u1ed7i','error');return;}
    _closeModal();_toast('\u2705 \u0110\u00e3 g\u1eedi','ok');_loadQA();
  });
}
window._qaSubmit=_qaSubmit;

function _qaOpenAnswer(id){
  var html='<div class="hrm-modal"><div class="hrm-modal-hd"><span style="font-size:15px;font-weight:800;">\u2705 Tr\u1ea3 l\u1eddi c\u00e2u h\u1ecfi</span><button class="hrm-close" onclick="_closeModal()">&#10005;</button></div>'
    +'<div class="hrm-modal-bd"><div class="hrm-form-group"><label class="hrm-lbl">N\u1ed9i dung tr\u1ea3 l\u1eddi</label><textarea id="qa-ans" class="form-input" rows="4"></textarea></div></div>'
    +'<div class="hrm-modal-ft"><button class="btn-ghost" onclick="_closeModal()">H\u1ee7y</button><button class="btn-primary" onclick="_qaDoAnswer(\''+id+'\')">G\u1eedi</button></div></div>';
  _showModal(html);
}
window._qaOpenAnswer=_qaOpenAnswer;

function _qaDoAnswer(id){
  var ans=(_gv('qa-ans')||'').trim();if(!ans){_toast('Nh\u1eadp c\u00e2u tr\u1ea3 l\u1eddi','error');return;}
  var apiF=_api();if(!apiF)return;
  apiF('portal_answer_qa',{id:id,answer:ans},function(e,d){
    if(e||!d||!d.ok){_toast('L\u1ed7i','error');return;}
    _closeModal();_toast('\u2705 \u0110\u00e3 tr\u1ea3 l\u1eddi','ok');_loadQA();
  });
}
window._qaDoAnswer=_qaDoAnswer;

/* ── Helpers ───────────────────────────────────────────────── */
function _showModal(html){
  _closeModal();
  var ov=document.createElement('div');ov.className='hrm-modal-overlay';ov.id='hrm-modal-ov';
  ov.innerHTML=html;ov.addEventListener('click',function(e){if(e.target===ov)_closeModal();});
  document.body.appendChild(ov);
}
function _closeModal(){var ov=document.getElementById('hrm-modal-ov');if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);}
window._closeModal=window._closeModal||_closeModal;

})();
