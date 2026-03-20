/* ================================================================
 * sk-hrm-recruitment.js — SonKhang ERP v3.6
 * SK-HRM-07: Tuyen dung — Kanban Pipeline
 * 20/03/2026
 * ================================================================ */
(function(){
'use strict';
var _api=function(){return typeof window.api==='function'?window.api:typeof api==='function'?api:null;};
var _esc=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
var _gv=function(id){var e=document.getElementById(id);return e?e.value:'';};
var _toast=function(m,t){if(typeof window._hrmToast==='function')window._hrmToast(m,t);};

var STAGES=[
  {k:'moi',        l:'\ud83d\udce5 Ho so moi',    c:'var(--text3)'},
  {k:'loc_ho_so',  l:'\ud83d\udd0d Loc ho so',    c:'var(--accent2)'},
  {k:'pv1',        l:'\ud83d\udde3 Phong van 1',  c:'var(--yellow)'},
  {k:'pv2',        l:'\ud83c\udfc6 Phong van 2',  c:'var(--purple)'},
  {k:'offer',      l:'\ud83d\udcdc Offer',         c:'var(--cyan)'},
  {k:'nhan_viec',  l:'\u2705 Nhan viec',           c:'var(--green)'},
  {k:'tu_choi',    l:'\u274c Tu choi',             c:'var(--red)'}
];

function loadRecruitment(){
  var ct=typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct');
  if(!ct)return;
  ct.innerHTML='<div id="rec-root" class="fade-in">'
    +'<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
    +'<div><h1 style="font-size:22px;font-weight:900;">\ud83c\udfe2 Tuy\u1ec3n d\u1ee5ng</h1>'
    +'<p style="font-size:12px;color:var(--text3);margin-top:3px;">Qu\u1ea3n l\u00fd pipeline \u1ee9ng vi\u00ean</p></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    +'<button class="btn-ghost" onclick="_recOpenPosForm(null)" style="font-size:11px;">\ud83d\udccc V\u1ecb tr\u00ed tuy\u1ec3n</button>'
    +'<button class="btn-primary" onclick="_recAddCand()" style="font-size:11px;">+ Th\u00eam \u1ee9ng vi\u00ean</button>'
    +'</div></div>'
    +'<div id="rec-stats" class="hrm-kpi-grid"></div>'
    +'<div id="rec-pos-filter" style="margin-bottom:14px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'
    +'<span style="font-size:11px;color:var(--text3);font-weight:700;">L\u1ecdc v\u1ecb tr\u00ed:</span>'
    +'<select id="rec-pos-sel" class="form-input" style="width:220px;padding:7px 10px;font-size:12px;" onchange="_recLoadKanban()">'
    +'<option value="">T\u1ea5t c\u1ea3 v\u1ecb tr\u00ed</option></select>'
    +'</div>'
    +'<div id="rec-kanban" style="overflow-x:auto;"></div></div>';
  _recLoadStats();
  _recLoadPositionsFilter();
  _recLoadKanban();
}
window.loadRecruitment=loadRecruitment;
window.loadTuyenDung=loadRecruitment;

function _recLoadStats(){
  var apiF=_api();if(!apiF)return;
  apiF('rec_get_pipeline_stats',{},function(e,d){
    var el=document.getElementById('rec-stats');if(!el||e||!d||!d.ok)return;
    var s=d.stats||{};var by=s.by_stage||{};
    el.innerHTML=[
      ['\ud83d\udc65','T\u1ed5ng UV',s.total||0,'var(--text2)'],
      ['\u23f3','\u0110ang x\u00e9t',s.active||0,'var(--accent2)'],
      ['\u2705','Nh\u1eadn vi\u1ec7c',s.hired||0,'var(--green)'],
      ['\ud83d\udcdc','Offer',by.offer||0,'var(--cyan)'],
      ['\ud83c\udfc6','PV2',by.pv2||0,'var(--purple)'],
      ['\ud83d\udce2','T\u1eff l\u1ec7 tuy\u1ec3n',(s.hire_rate||0)+'%','var(--yellow)']
    ].map(function(c){
      return '<div class="hrm-kpi card"><div class="hrm-kpi-lbl">'+c[0]+' '+c[1]+'</div>'
        +'<div class="hrm-kpi-val" style="color:'+c[3]+';">'+c[2]+'</div></div>';
    }).join('');
  });
}

function _recLoadPositionsFilter(){
  var apiF=_api();if(!apiF)return;
  apiF('rec_get_positions',{status:'dang_tuyen'},function(e,d){
    var sel=document.getElementById('rec-pos-sel');if(!sel||e||!d||!d.ok)return;
    (d.data||[]).forEach(function(p){
      var opt=document.createElement('option');opt.value=p.id;opt.textContent=p.title;sel.appendChild(opt);
    });
  });
}

function _recLoadKanban(){
  var el=document.getElementById('rec-kanban');if(!el)return;
  el.innerHTML='<div class="hrm-loading"><div class="sk-spin" style="width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div>';
  var posId=_gv('rec-pos-sel');
  var apiF=_api();if(!apiF)return;
  apiF('rec_get_candidates',{pos_id:posId},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<div class="hrm-alert">L\u1ed7i t\u1ea3i</div>';return;}
    var pipeline=d.pipeline||{};
    var cols=STAGES.map(function(s){
      var cards=(pipeline[s.k]||[]);
      return '<div style="min-width:200px;max-width:220px;background:var(--bg3);border-radius:12px;padding:10px;flex-shrink:0;">'
        +'<div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:'+s.c+';margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">'
        +_esc(s.l)
        +'<span style="background:'+s.c+';color:#000;border-radius:99px;padding:1px 6px;font-size:9px;opacity:.8;">'+cards.length+'</span>'
        +'</div>'
        +cards.map(function(c){
          return '<div class="card" style="padding:10px;margin-bottom:6px;cursor:pointer;" onclick="_recViewCand(\''+_esc(c.id)+'\',\''+_esc(c.stage)+'\')">'
            +'<div style="font-size:12px;font-weight:800;margin-bottom:3px;">'+_esc(c.name)+'</div>'
            +'<div style="font-size:10px;color:var(--text3);">'+_esc(c.pos||c.pos_id)+'</div>'
            +(c.score>0?'<div style="font-size:10px;color:var(--yellow);margin-top:3px;">\u2b50 '+c.score.toFixed(1)+'</div>':'')
            +'<div style="font-size:9px;color:var(--text3);margin-top:3px;">'+_esc(c.source)+' \u2022 '+_esc(c.date)+'</div>'
            +'</div>';
        }).join('')
        +'</div>';
    }).join('');
    el.innerHTML='<div style="display:flex;gap:10px;padding-bottom:16px;">'+cols+'</div>';
  });
}
window._recLoadKanban=_recLoadKanban;

function _recViewCand(id,curStage){
  var html='<div class="hrm-modal"><div class="hrm-modal-hd"><span style="font-size:15px;font-weight:800;">\ud83d\udc64 \u1ee8ng vi\u00ean</span><button class="hrm-close" onclick="_closeModal()">&#10005;</button></div>'
    +'<div class="hrm-modal-bd">'
    +'<div class="hrm-lbl" style="margin-bottom:6px;">Chuy\u1ec3n giai \u0111o\u1ea1n</div>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">'
    +STAGES.map(function(s){
      var isActive=s.k===curStage;
      return '<button class="chip'+(isActive?' active':'')+'" onclick="_recMove(\''+id+'\',\''+s.k+'\')" style="'+(isActive?'':'')+'">'+_esc(s.l.replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g,'').trim())+'</button>';
    }).join('')
    +'</div>'
    +'<div class="hrm-lbl" style="margin-bottom:6px;">Th\u00eam k\u1ebft qu\u1ea3 ph\u1ecfng v\u1ea5n</div>'
    +'<div class="hrm-form-grid">'
    +'<div class="hrm-form-group"><label class="hrm-lbl">V\u00f2ng</label><input id="iv-round" class="form-input" value="1" type="number" min="1" max="3"></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">\u0110i\u1ec3m (1-10)</label><input id="iv-score" class="form-input" type="number" min="1" max="10" placeholder="7"></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">Ng\u00e0y PV</label><input id="iv-date" class="form-input" type="date" value="'+new Date().toISOString().split(\'T\')[0]+'"></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">Ng\u01b0\u1eddi PV</label><input id="iv-er" class="form-input" placeholder="Th\u1ecbnh HB"></div>'
    +'<div class="hrm-form-group full"><label class="hrm-lbl">Nh\u1eadn x\u00e9t</label><textarea id="iv-note" class="form-input" rows="3"></textarea></div>'
    +'</div>'
    +'</div>'
    +'<div class="hrm-modal-ft"><button class="btn-ghost" onclick="_closeModal()">H\u1ee7y</button>'
    +'<button class="btn-primary" onclick="_recSaveIV(\''+id+'\')">L\u01b0u PV</button></div></div>';
  _showModal(html);
}
window._recViewCand=_recViewCand;

function _recMove(id,stage){
  var apiF=_api();if(!apiF)return;
  apiF('rec_move_stage',{id:id,stage:stage},function(e,d){
    if(e||!d||!d.ok){_toast('L\u1ed7i','error');return;}
    _closeModal();_toast('\u2705 \u0110\u00e3 chuy\u1ec3n: '+stage,'ok');
    _recLoadKanban();_recLoadStats();
  });
}
window._recMove=_recMove;

function _recSaveIV(candId){
  var apiF=_api();if(!apiF)return;
  apiF('rec_save_interview',{
    cand_id:candId,round:_gv('iv-round'),score:Number(_gv('iv-score')||0),
    date:_gv('iv-date'),interviewer:_gv('iv-er'),note:_gv('iv-note')
  },function(e,d){
    if(e||!d||!d.ok){_toast('L\u1ed7i','error');return;}
    _closeModal();_toast('\u2705 \u0110\u00e3 l\u01b0u k\u1ebft qu\u1ea3 PV','ok');_recLoadKanban();
  });
}
window._recSaveIV=_recSaveIV;

function _recAddCand(){
  var html='<div class="hrm-modal"><div class="hrm-modal-hd"><span style="font-size:15px;font-weight:800;">+ Th\u00eam \u1ee9ng vi\u00ean</span><button class="hrm-close" onclick="_closeModal()">&#10005;</button></div>'
    +'<div class="hrm-modal-bd"><div class="hrm-form-grid">'
    +'<div class="hrm-form-group full"><label class="hrm-lbl">H\u1ecd t\u00ean *</label><input id="rv-name" class="form-input"></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">Email</label><input id="rv-email" class="form-input" type="email"></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">S\u1ed1 \u0111i\u1ec7n tho\u1ea1i</label><input id="rv-phone" class="form-input" type="tel"></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">V\u1ecb tr\u00ed \u1ee9ng tuy\u1ec3n</label><input id="rv-pos" class="form-input" placeholder="Sale, Giao h\u00e0ng..."></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">Ngu\u1ed3n</label><select id="rv-src" class="form-input"><option>Facebook</option><option>Zalo</option><option>Gi\u1edbi thi\u1ec7u</option><option>Website</option><option>Kh\u00e1c</option></select></div>'
    +'<div class="hrm-form-group full"><label class="hrm-lbl">Ghi ch\u00fa</label><input id="rv-note" class="form-input"></div>'
    +'</div></div>'
    +'<div class="hrm-modal-ft"><button class="btn-ghost" onclick="_closeModal()">H\u1ee7y</button>'
    +'<button class="btn-primary" id="rv-save" onclick="_recSaveCand()">\u2795 Th\u00eam</button></div></div>';
  _showModal(html);
}
window._recAddCand=_recAddCand;

function _recSaveCand(){
  var name=(_gv('rv-name')||'').trim();
  if(!name){_toast('Nh\u1eadp h\u1ecd t\u00ean','error');return;}
  var btn=document.getElementById('rv-save');if(btn)btn.disabled=true;
  var apiF=_api();if(!apiF)return;
  apiF('rec_save_candidate',{
    name:name,email:_gv('rv-email'),phone:_gv('rv-phone'),
    pos:_gv('rv-pos'),source:_gv('rv-src'),note:_gv('rv-note'),stage:'moi'
  },function(e,d){
    if(btn)btn.disabled=false;
    if(e||!d||!d.ok){_toast((d&&d.error)||'L\u1ed7i','error');return;}
    _closeModal();_toast('\u2705 \u0110\u00e3 th\u00eam: '+name,'ok');_recLoadKanban();_recLoadStats();
  });
}
window._recSaveCand=_recSaveCand;

function _recOpenPosForm(pos){
  var html='<div class="hrm-modal"><div class="hrm-modal-hd"><span style="font-size:15px;font-weight:800;">\ud83d\udccc V\u1ecb tr\u00ed tuy\u1ec3n d\u1ee5ng</span><button class="hrm-close" onclick="_closeModal()">&#10005;</button></div>'
    +'<div class="hrm-modal-bd"><div class="hrm-form-grid">'
    +'<div class="hrm-form-group full"><label class="hrm-lbl">T\u00ean v\u1ecb tr\u00ed *</label><input id="rp-title" class="form-input" value="'+(pos?_esc(pos.title):'')+'"></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">B\u1ed9 ph\u1eadn</label><input id="rp-dept" class="form-input" value="'+(pos?_esc(pos.dept):'')+'"></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">S\u1ed1 l\u01b0\u1ee3ng</label><input id="rp-cnt" class="form-input" type="number" min="1" value="'+(pos?pos.count:1)+'"></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">L\u01b0\u01a1ng min</label><input id="rp-smin" class="form-input" type="number" value="'+(pos?pos.sal_min:0)+'"></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">L\u01b0\u01a1ng max</label><input id="rp-smax" class="form-input" type="number" value="'+(pos?pos.sal_max:0)+'"></div>'
    +'<div class="hrm-form-group"><label class="hrm-lbl">H\u1ea1n n\u1ed9p</label><input id="rp-dl" class="form-input" type="date"></div>'
    +'<div class="hrm-form-group full"><label class="hrm-lbl">Y\u00eau c\u1ea7u</label><textarea id="rp-req" class="form-input" rows="3">'+(pos?_esc(pos.require):'')+'</textarea></div>'
    +'</div></div>'
    +'<div class="hrm-modal-ft"><button class="btn-ghost" onclick="_closeModal()">H\u1ee7y</button>'
    +'<button class="btn-primary" onclick="_recSavePos(\''+((pos&&pos.id)||'')+'\')">\ud83d\udcbe L\u01b0u</button></div></div>';
  _showModal(html);
}
window._recOpenPosForm=_recOpenPosForm;

function _recSavePos(id){
  var title=(_gv('rp-title')||'').trim();if(!title){_toast('Nh\u1eadp t\u00ean','error');return;}
  var apiF=_api();if(!apiF)return;
  apiF('rec_save_position',{id:id,title:title,dept:_gv('rp-dept'),count:Number(_gv('rp-cnt')||1),
    sal_min:Number(_gv('rp-smin')||0),sal_max:Number(_gv('rp-smax')||0),
    require:_gv('rp-req'),deadline:_gv('rp-dl'),status:'dang_tuyen'},
  function(e,d){
    if(e||!d||!d.ok){_toast('L\u1ed7i','error');return;}
    _closeModal();_toast('\u2705 \u0110\u00e3 l\u01b0u v\u1ecb tr\u00ed','ok');_recLoadPositionsFilter();
  });
}
window._recSavePos=_recSavePos;

function _showModal(html){
  _closeModal();
  var ov=document.createElement('div');ov.className='hrm-modal-overlay';ov.id='hrm-modal-ov';
  ov.innerHTML=html;ov.addEventListener('click',function(e){if(e.target===ov)_closeModal();});
  document.body.appendChild(ov);
}
function _closeModal(){var ov=document.getElementById('hrm-modal-ov');if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);}
window._closeModal=window._closeModal||_closeModal;
})();
