/* ================================================================
 * sk-hrm-workflow.js — SonKhang ERP v3.6
 * SK-HRM-05: Quy trinh lam viec / De xuat
 * 20/03/2026
 * ================================================================ */
(function(){
'use strict';
var _api=function(){return typeof window.api==='function'?window.api:typeof api==='function'?api:null;};
var _esc=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
var _gv=function(id){var e=document.getElementById(id);return e?e.value:'';};
var _toast=function(m,t){if(typeof window._hrmToast==='function')window._hrmToast(m,t);};
var _fv=function(n){var v=Number(n||0);if(v>=1e6)return (v/1e6).toFixed(1)+' tri\u1ec7u';return v.toLocaleString()+'\u0111';};

var WF_TYPES={
  nghi_phep    :{label:'\ud83c\udfe5 Ngh\u1ec9 ph\u00e9p',   color:'var(--green)'},
  tam_ung      :{label:'\ud83d\udcb0 T\u1ea1m \u1ee9ng',     color:'var(--yellow)'},
  mua_sam      :{label:'\ud83d\uded2 Mua s\u1eafm',          color:'var(--accent2)'},
  tang_luong   :{label:'\u2b06\ufe0f T\u0103ng l\u01b0\u01a1ng',color:'var(--purple)'},
  dieu_chinh_cc:{label:'\ud83d\uddd3 Ch\u1ea5m c\u00f4ng',    color:'var(--cyan)'},
  de_xuat_khac :{label:'\ud83d\udcc4 Kh\u00e1c',             color:'var(--text3)'}
};
var STATUS_MAP={
  cho_duyet:{label:'Ch\u1edd duy\u1ec7t',cls:'hrm-badge-yellow'},
  da_duyet :{label:'\u0110\u00e3 duy\u1ec7t',cls:'hrm-badge-green'},
  tu_choi  :{label:'T\u1eeb ch\u1ed1i',cls:'hrm-badge-red'}
};

function loadWorkflow(){
  var ct=typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct');
  if(!ct)return;
  ct.innerHTML='<div id="wf-root" class="fade-in">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">'
    +'<div><h1 style="font-size:22px;font-weight:900;">\ud83d\udcdd Quy tr\u00ecnh l\u00e0m vi\u1ec7c</h1>'
    +'<p style="font-size:12px;color:var(--text3);margin-top:3px;">Duy\u1ec7t \u0111\u1ec1 xu\u1ea5t tr\u1ef1c tuy\u1ebfn</p></div>'
    +'<button class="btn-primary" onclick="_wfNewRequest()" style="font-size:11px;">+ T\u1ea1o y\u00eau c\u1ea7u</button>'
    +'</div>'
    +'<div class="hrm-tabbar">'
    +'<button class="hrm-tab active" id="wft-all"     onclick="_wfFilter(\'\')">T\u1ea5t c\u1ea3</button>'
    +'<button class="hrm-tab" id="wft-wait"  onclick="_wfFilter(\'cho_duyet\')">\u23f3 Ch\u1edd duy\u1ec7t <span id="wf-badge" style="background:var(--red);color:#fff;border-radius:99px;padding:1px 6px;font-size:9px;margin-left:3px;"></span></button>'
    +'<button class="hrm-tab" id="wft-ok"    onclick="_wfFilter(\'da_duyet\')">\u2705 \u0110\u00e3 duy\u1ec7t</button>'
    +'<button class="hrm-tab" id="wft-no"    onclick="_wfFilter(\'tu_choi\')">\u274c T\u1eeb ch\u1ed1i</button>'
    +'</div>'
    +'<div id="wf-list"></div></div>';
  _wfLoad('');
}
window.loadWorkflow=loadWorkflow;

function _wfLoad(status){
  var el=document.getElementById('wf-list');if(!el)return;
  el.innerHTML='<div class="hrm-loading"><div class="sk-spin" style="width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div>';
  var apiF=_api();if(!apiF)return;
  apiF('wf_get_all',{status:status,limit:50},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<div class="hrm-alert">L\u1ed7i t\u1ea3i</div>';return;}
    // Badge
    var badge=document.getElementById('wf-badge');
    if(badge)badge.textContent=(d.stats&&d.stats.cho)||'0';
    _wfRender(d.data||[]);
  });
}

function _wfFilter(s){
  ['all','wait','ok','no'].forEach(function(t){
    var b=document.getElementById('wft-'+t);if(b)b.classList.remove('active');
  });
  var map={'':'all','cho_duyet':'wait','da_duyet':'ok','tu_choi':'no'};
  var b=document.getElementById('wft-'+(map[s]||'all'));if(b)b.classList.add('active');
  _wfLoad(s);
}
window._wfFilter=_wfFilter;

function _wfRender(rows){
  var el=document.getElementById('wf-list');if(!el)return;
  if(!rows.length){el.innerHTML='<div class="hrm-empty">\ud83d\udcdd Kh\u00f4ng c\u00f3 y\u00eau c\u1ea7u n\u00e0o.</div>';return;}
  el.innerHTML=rows.map(function(r){
    var wt=WF_TYPES[r.type]||{label:r.type,color:'var(--text3)'};
    var st=STATUS_MAP[r.status]||{label:r.status,cls:'hrm-badge-blue'};
    var actions='';
    var sess=window._auth&&window._auth.user;
    var role=sess?sess.role:'';
    if(r.status==='cho_duyet'&&(role==='admin'||role==='hr'||role==='ketoan')){
      actions='<div style="display:flex;gap:6px;margin-top:10px;">'
        +'<button class="btn-ghost" style="padding:5px 10px;font-size:10px;color:var(--green);border-color:var(--green);" onclick="_wfApprove(\''+_esc(r.id)+'\',\'duyet\',\''+role+'\')">\u2714 Duy\u1ec7t</button>'
        +'<button class="btn-ghost" style="padding:5px 10px;font-size:10px;color:var(--red);border-color:var(--red);" onclick="_wfApprove(\''+_esc(r.id)+'\',\'tu_choi\',\''+role+'\')">\u2716 T\u1eeb ch\u1ed1i</button>'
        +'</div>';
    }
    return '<div class="card" style="padding:14px 16px;margin-bottom:8px;">'
      +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;">'
      +'<div style="flex:1;min-width:0;">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">'
      +'<span style="font-size:10px;font-weight:800;color:'+wt.color+';background:rgba(0,0,0,.12);padding:2px 7px;border-radius:5px;">'+wt.label+'</span>'
      +'<span class="hrm-badge '+st.cls+'">'+st.label+'</span>'
      +(r.amount>0?'<span style="font-size:11px;color:var(--yellow);font-weight:700;">'+_fv(r.amount)+'</span>':'')
      +'<span style="font-size:10px;color:var(--text3);">'+_esc(r.date)+'</span>'
      +'</div>'
      +'<div style="font-size:13px;font-weight:800;margin-bottom:4px;">'+_esc(r.title)+'</div>'
      +'<div style="font-size:11px;color:var(--text3);">\ud83d\udc64 '+_esc(r.sender)+'</div>'
      +(r.content?'<div style="font-size:11px;color:var(--text2);margin-top:6px;white-space:pre-wrap;">'+_esc(r.content)+'</div>':'')
      +actions
      +'</div>'
      +'<button class="btn-ghost" style="padding:5px 10px;font-size:10px;" onclick="_wfTimeline(\''+_esc(r.id)+'\')">Ti\u1ebfn \u0111\u1ed9</button>'
      +'</div></div>';
  }).join('');
}

function _wfApprove(id,action,role){
  var note=prompt((action==='duyet'?'Ghi ch\u00fa (t\u00f9y ch\u1ecdn):':'L\u00fd do t\u1eeb ch\u1ed1i:'))||'';
  var apiF=_api();if(!apiF)return;
  apiF('wf_approve',{id:id,action:action,role:role,note:note},function(e,d){
    if(e||!d||!d.ok){_toast((d&&d.error)||'L\u1ed7i','error');return;}
    _toast('\u2705 \u0110\u00e3 '+(action==='duyet'?'duy\u1ec7t':'t\u1eeb ch\u1ed1i'),'ok');
    _wfLoad('');
  });
}
window._wfApprove=_wfApprove;

function _wfTimeline(id){
  var apiF=_api();if(!apiF)return;
  apiF('wf_get_timeline',{id:id},function(e,d){
    if(e||!d||!d.ok){_toast('L\u1ed7i','error');return;}
    var html='<div class="hrm-modal" style="max-width:440px;">'
      +'<div class="hrm-modal-hd"><span style="font-size:15px;font-weight:800;">\ud83d\udccd Ti\u1ebfn \u0111\u1ed9 duy\u1ec7t</span><button class="hrm-close" onclick="_closeModal()">&#10005;</button></div>'
      +'<div class="hrm-modal-bd"><div style="position:relative;padding-left:28px;">'
      +d.steps.map(function(s,i){
        var done=s.status==='da_duyet',fail=s.status==='tu_choi',wait=s.status==='cho_duyet';
        var icon=done?'\u2705':fail?'\u274c':wait?'\u23f3':'\u25cb';
        var col=done?'var(--green)':fail?'var(--red)':wait?'var(--yellow)':'var(--border2)';
        return '<div style="position:relative;padding:0 0 18px 0;">'
          +(i<d.steps.length-1?'<div style="position:absolute;left:-18px;top:20px;bottom:0;width:2px;background:var(--border);"></div>':'')
          +'<div style="position:absolute;left:-24px;top:2px;width:12px;height:12px;border-radius:50%;background:'+col+';display:flex;align-items:center;justify-content:center;font-size:8px;border:2px solid var(--bg);">'+icon+'</div>'
          +'<div style="font-size:12px;font-weight:800;">B\u01b0\u1edbc '+s.step+': '+_esc(s.role)+'</div>'
          +(s.approver?'<div style="font-size:11px;color:var(--text3);">\ud83d\udc64 '+_esc(s.approver)+'</div>':'')
          +(s.note?'<div style="font-size:11px;color:var(--text2);">'+_esc(s.note)+'</div>':'')
          +(s.date&&s.date!=='/'?'<div style="font-size:10px;color:var(--text3);">'+_esc(s.date)+'</div>':'')
          +'</div>';
      }).join('')
      +'</div></div>'
      +'<div class="hrm-modal-ft"><button class="btn-ghost" onclick="_closeModal()">D\u00f3ng</button></div></div>';
    _showModal(html);
  });
}
window._wfTimeline=_wfTimeline;

/* ── New Request Form ─────────────────────────────────────── */
function _wfNewRequest(){
  var typeOpts=Object.keys(WF_TYPES).map(function(k){return '<option value="'+k+'">'+WF_TYPES[k].label+'</option>';}).join('');
  var html='<div class="hrm-modal"><div class="hrm-modal-hd"><span style="font-size:15px;font-weight:800;">+ T\u1ea1o y\u00eau c\u1ea7u</span><button class="hrm-close" onclick="_closeModal()">&#10005;</button></div>'
    +'<div class="hrm-modal-bd"><div class="hrm-form-grid">'
    +'<div class="hrm-form-group"><label class="hrm-lbl">Lo\u1ea1i y\u00eau c\u1ea7u</label><select id="wf-type" class="form-input">'+typeOpts+'</select></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">S\u1ed1 ti\u1ec1n (n\u1ebfu c\u00f3)</label><input id="wf-amount" class="form-input" type="number" min="0" placeholder="0"></div>'
    +'<div class="hrm-form-group full"><label class="hrm-lbl">Ti\u00eau \u0111\u1ec1 *</label><input id="wf-title" class="form-input" placeholder="Ti\u00eau \u0111\u1ec1 y\u00eau c\u1ea7u..."></div>'
    +'<div class="hrm-form-group full"><label class="hrm-lbl">N\u1ed9i dung chi ti\u1ebft</label><textarea id="wf-content" class="form-input" rows="4"></textarea></div>'
    +'</div></div>'
    +'<div class="hrm-modal-ft"><button class="btn-ghost" onclick="_closeModal()">H\u1ee7y</button>'
    +'<button class="btn-primary" id="wf-submit" onclick="_wfSubmit()">\ud83d\udce4 G\u1eedi y\u00eau c\u1ea7u</button></div></div>';
  _showModal(html);
}
window._wfNewRequest=_wfNewRequest;

function _wfSubmit(){
  var title=(_gv('wf-title')||'').trim();
  if(!title){_toast('Nh\u1eadp ti\u00eau \u0111\u1ec1','error');return;}
  var sess=window._auth&&window._auth.user;
  var btn=document.getElementById('wf-submit');if(btn)btn.disabled=true;
  var apiF=_api();if(!apiF)return;
  apiF('wf_create_request',{
    type:_gv('wf-type'),title:title,
    content:_gv('wf-content'),amount:Number(_gv('wf-amount')||0),
    sender_name:sess?(sess.name||sess.email):'user'
  },function(e,d){
    if(btn)btn.disabled=false;
    if(e||!d||!d.ok){_toast((d&&d.error)||'L\u1ed7i','error');return;}
    _closeModal();_toast('\u2705 \u0110\u00e3 g\u1eedi: '+d.id,'ok');_wfLoad('');
  });
}
window._wfSubmit=_wfSubmit;

function _showModal(html){
  _closeModal();
  var ov=document.createElement('div');ov.className='hrm-modal-overlay';ov.id='hrm-modal-ov';
  ov.innerHTML=html;ov.addEventListener('click',function(e){if(e.target===ov)_closeModal();});
  document.body.appendChild(ov);
}
function _closeModal(){var ov=document.getElementById('hrm-modal-ov');if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);}
window._closeModal=window._closeModal||_closeModal;
})();
