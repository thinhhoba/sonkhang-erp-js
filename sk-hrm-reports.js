/* ================================================================
 * sk-hrm-reports.js — SonKhang ERP v3.6
 * SK-HRM-08: Bao cao & Phan tich
 * 20/03/2026
 * ================================================================ */
(function(){
'use strict';
var _api=function(){return typeof window.api==='function'?window.api:typeof api==='function'?api:null;};
var _esc=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
var _gv=function(id){var e=document.getElementById(id);return e?e.value:'';};
var _toast=function(m,t){if(typeof window._hrmToast==='function')window._hrmToast(m,t);};
var _fv=function(n){var v=Number(n||0);if(v>=1e9)return (v/1e9).toFixed(2)+' t\u1ef7';if(v>=1e6)return (v/1e6).toFixed(1)+' tri\u1ec7u';return v.toLocaleString()+'\u0111';};

function loadReports(){
  var ct=typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct');
  if(!ct)return;
  ct.innerHTML='<div id="rpt-root" class="fade-in">'
    +'<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
    +'<div><h1 style="font-size:22px;font-weight:900;">\ud83d\udcca B\u00e1o c\u00e1o & Ph\u00e2n t\u00edch</h1>'
    +'<p style="font-size:12px;color:var(--text3);margin-top:3px;">HR Dashboard \u2014 SonKhang ERP</p></div>'
    +'<button class="btn-ghost" onclick="_rptSendReport()" style="font-size:11px;">\ud83d\udce7 G\u1eedi b\u00e1o c\u00e1o email</button>'
    +'</div>'
    +'<div class="hrm-tabbar">'
    +'<button class="hrm-tab active" id="rpt-t-dash"   onclick="_rptSwitch(\'dash\')">Dashboard</button>'
    +'<button class="hrm-tab" id="rpt-t-salary" onclick="_rptSwitch(\'salary\')">\ud83d\udcb0 L\u01b0\u01a1ng</button>'
    +'<button class="hrm-tab" id="rpt-t-att"    onclick="_rptSwitch(\'att\')">\ud83d\uddd3 Ch\u1ea5m c\u00f4ng</button>'
    +'<button class="hrm-tab" id="rpt-t-head"   onclick="_rptSwitch(\'head\')">\ud83d\udc65 C\u01a1 c\u1ea5u</button>'
    +'</div>'
    +'<div id="rpt-content"></div></div>';
  _rptSwitch('dash');
}
window.loadReports=loadReports;
window.loadBaoCao=loadReports;

function _rptSwitch(t){
  ['dash','salary','att','head'].forEach(function(x){
    var b=document.getElementById('rpt-t-'+x);if(b)b.classList.toggle('active',x===t);
  });
  var ct=document.getElementById('rpt-content');if(!ct)return;
  ct.innerHTML='<div class="hrm-loading"><div class="sk-spin" style="width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div>';
  setTimeout(function(){
    if(t==='dash')   _rptDash();
    else if(t==='salary') _rptSalary();
    else if(t==='att')    _rptAtt();
    else if(t==='head')   _rptHead();
  },60);
}
window._rptSwitch=_rptSwitch;

/* ── Dashboard tổng ────────────────────────────────────────── */
function _rptDash(){
  var ct=document.getElementById('rpt-content');if(!ct)return;
  var apiF=_api();if(!apiF)return;
  apiF('hrm_get_dashboard',{},function(e,d){
    if(e||!d||!d.ok){ct.innerHTML='<div class="hrm-alert">L\u1ed7i t\u1ea3i</div>';return;}
    var emp=d.employees||{}, att=d.attendance||{}, wf=d.workflow||{}, lv=d.leave||{}, rec=d.recruitment||{};
    ct.innerHTML='<div class="hrm-kpi-grid" style="margin-bottom:20px;">'
      +_kpi('\ud83d\udc65','T\u1ed5ng NV',emp.total||0,'var(--accent2)')
      +_kpi('\u2705','Ho\u1ea1t \u0111\u1ed9ng',emp.active||0,'var(--green)')
      +_kpi('\ud83c\udd95','M\u1edbi th\u00e1ng n\u00e0y',emp.new_month||0,'var(--yellow)')
      +_kpi('\u23f0','\u0110i mu\u1ed9n',att.late_count||0,'var(--red)')
      +_kpi('\u23f3','Ch\u1edd duy\u1ec7t',(wf.pending||0)+(lv.pending||0),'var(--yellow)')
      +_kpi('\ud83d\udc64','UV \u0111ang x\u00e9t',rec.active||0,'var(--cyan)')
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">'

      /* Cơ cấu vai trò */
      +'<div class="card" style="padding:16px;">'
      +'<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:12px;">\ud83c\udf93 C\u01a1 c\u1ea5u vai tr\u00f2</div>'
      +(function(){
        var br=emp.by_role||{};
        var total=Object.values(br).reduce(function(a,v){return a+v;},0)||1;
        return Object.keys(br).map(function(k){
          var pct=Math.round(br[k]/total*100);
          return '<div style="margin-bottom:8px;">'
            +'<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;">'
            +'<span>'+_esc(k)+'</span><span style="font-weight:800;">'+br[k]+' NV ('+pct+'%)</span></div>'
            +'<div class="progress-bar"><div class="progress-fill" style="width:'+pct+'%;"></div></div>'
            +'</div>';
        }).join('');
      })()
      +'</div>'

      /* Chấm công tháng này */
      +'<div class="card" style="padding:16px;">'
      +'<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:12px;">\ud83d\uddd3 Ch\u1ea5m c\u00f4ng th\u00e1ng n\u00e0y</div>'
      +_statRow('T\u1ed5ng ng\u00e0y c\u00f4ng',att.worked||0,'ng\u00e0y','var(--accent2)')
      +_statRow('Ng\u00e0y v\u1eafng',att.absent||0,'ng\u00e0y','var(--red)')
      +_statRow('L\u01b0\u1ee3t \u0111i mu\u1ed9n',att.late_count||0,'l\u1ea7n','var(--yellow)')
      +_statRow('Gi\u1edd OT',att.ot_hours||0,'gi\u1edd','var(--purple)')
      +'</div>'
      +'</div>';
  });
}

function _kpi(icon,label,val,color){
  return '<div class="hrm-kpi card"><div class="hrm-kpi-lbl">'+icon+' '+label+'</div>'
    +'<div class="hrm-kpi-val" style="color:'+color+';">'+val+'</div></div>';
}
function _statRow(label,val,unit,color){
  return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);">'
    +'<span style="font-size:12px;color:var(--text2);">'+label+'</span>'
    +'<span style="font-size:14px;font-weight:800;color:'+color+';">'+val+' <span style="font-size:10px;font-weight:400;color:var(--text3);">'+unit+'</span></span>'
    +'</div>';
}

/* ── Bảng lương ────────────────────────────────────────────── */
function _rptSalary(){
  var now=new Date();
  var ct=document.getElementById('rpt-content');if(!ct)return;
  ct.innerHTML='<div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;flex-wrap:wrap;">'
    +'<select id="rpt-sm" class="form-input" style="width:100px;padding:7px 10px;font-size:12px;">'
    +[1,2,3,4,5,6,7,8,9,10,11,12].map(function(m){return '<option value="'+m+'"'+(m===now.getMonth()+1?' selected':'')+'>Th\u00e1ng '+m+'</option>';}).join('')
    +'</select>'
    +'<input id="rpt-sy" class="form-input" type="number" value="'+now.getFullYear()+'" style="width:90px;padding:7px 10px;font-size:12px;">'
    +'<button class="btn-primary" onclick="_rptLoadSalary()" style="font-size:11px;">\ud83d\udd0d Xem</button>'
    +'</div>'
    +'<div id="rpt-sal-body"><div class="hrm-loading"><div class="sk-spin" style="width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div></div>';
  _rptLoadSalary();
}

function _rptLoadSalary(){
  var el=document.getElementById('rpt-sal-body');if(!el)return;
  var m=Number(_gv('rpt-sm')||new Date().getMonth()+1);
  var y=Number(_gv('rpt-sy')||new Date().getFullYear());
  el.innerHTML='<div class="hrm-loading"><div class="sk-spin" style="width:20px;height:20px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div>';
  var apiF=_api();if(!apiF)return;
  apiF('hrm_get_salary_report',{month:m,year:y},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<div class="hrm-alert">L\u1ed7i ho\u1eb7c ch\u01b0a c\u00f3 b\u1ea3ng l\u01b0\u01a1ng</div>';return;}
    var rows=d.data||[];
    if(!rows.length){el.innerHTML='<div class="hrm-empty">Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u b\u1ea3ng l\u01b0\u01a1ng '+m+'/'+y+'</div>';return;}
    el.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:16px;">'
      +_kpi('\ud83d\udcb0','T\u1ed5ng chi',_fv(d.total_net),'var(--green)')
      +_kpi('\ud83d\udc65','S\u1ed1 NV',d.count||0,'var(--accent2)')
      +_kpi('\u2b50','Cao nh\u1ea5t',_fv(rows[0]&&rows[0].net||0),'var(--yellow)')
      +'</div>'
      +'<div class="card" style="overflow:hidden;">'
      +'<table class="hrm-tbl">'
      +'<thead><tr><th>Nh\u00e2n vi\u00ean</th><th>L\u01b0\u01a1ng CB</th><th>Ng\u00e0y c\u00f4ng</th><th>Th\u01b0\u1edfng</th><th>T\u1ea1m \u1ee9ng</th><th>Ph\u1ea1t</th><th>L\u01b0\u01a1ng net</th></tr></thead><tbody>'
      +rows.map(function(r){
        return '<tr><td><div style="font-weight:700;">'+_esc(r.name)+'</div><div style="font-size:10px;color:var(--text3);">'+_esc(r.role)+'</div></td>'
          +'<td>'+_fv(r.base)+'</td><td>'+r.worked+'</td>'
          +'<td style="color:var(--green);">'+_fv(r.bonus)+'</td>'
          +'<td style="color:var(--red);">'+_fv(r.advance)+'</td>'
          +'<td style="color:var(--red);">'+_fv(r.penalty)+'</td>'
          +'<td style="font-weight:900;color:var(--accent2);font-family:\'JetBrains Mono\',monospace;">'+_fv(r.net)+'</td>'
          +'</tr>';
      }).join('')
      +'</tbody></table></div>';
  });
}
window._rptLoadSalary=_rptLoadSalary;

/* ── Chấm công ─────────────────────────────────────────────── */
function _rptAtt(){
  var now=new Date();
  var ct=document.getElementById('rpt-content');if(!ct)return;
  ct.innerHTML='<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">'
    +'<select id="rpt-am" class="form-input" style="width:100px;padding:7px 10px;font-size:12px;">'
    +[1,2,3,4,5,6,7,8,9,10,11,12].map(function(m){return '<option value="'+m+'"'+(m===now.getMonth()+1?' selected':'')+'>Th\u00e1ng '+m+'</option>';}).join('')
    +'</select>'
    +'<input id="rpt-ay" class="form-input" type="number" value="'+now.getFullYear()+'" style="width:90px;padding:7px 10px;font-size:12px;">'
    +'<button class="btn-primary" onclick="_rptLoadAtt()" style="font-size:11px;">\ud83d\udd0d Xem</button>'
    +'</div>'
    +'<div id="rpt-att-body"><div class="hrm-loading"><div class="sk-spin" style="width:20px;height:20px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;"></div></div></div>';
  _rptLoadAtt();
}

function _rptLoadAtt(){
  var el=document.getElementById('rpt-att-body');if(!el)return;
  var m=Number(_gv('rpt-am')||new Date().getMonth()+1);
  var y=Number(_gv('rpt-ay')||new Date().getFullYear());
  var apiF=_api();if(!apiF)return;
  apiF('hrm_get_attendance_report',{month:m,year:y},function(e,d){
    if(e||!d||!d.ok){el.innerHTML='<div class="hrm-alert">L\u1ed7i</div>';return;}
    var rows=d.data||[],s=d.summary||{};
    if(!rows.length){el.innerHTML='<div class="hrm-empty">Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u</div>';return;}
    el.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;">'
      +_kpi('\ud83c\udf1f','Ch\u1ea7n ch\u1ec9nh',s.perfect||0,'var(--green)')
      +_kpi('\u23f0','\u0110i mu\u1ed9n',s.late||0,'var(--yellow)')
      +_kpi('\u274c','V\u1eafng',s.absent||0,'var(--red)')
      +_kpi('\u23f3','T\u1ed5ng OT',(s.ot_total||0).toFixed(1)+'h','var(--purple)')
      +'</div>'
      +'<div class="card" style="overflow:hidden;">'
      +'<table class="hrm-tbl"><thead><tr>'
      +'<th>Nh\u00e2n vi\u00ean</th><th>Ng\u00e0y c\u00f4ng</th><th>V\u1eafng</th><th>\u0110i mu\u1ed9n</th><th>OT(h)</th><th>T\u1eff l\u1ec7 %</th>'
      +'</tr></thead><tbody>'
      +rows.map(function(r){
        var rc=r.rate>=95?'var(--green)':r.rate>=80?'var(--yellow)':'var(--red)';
        return '<tr>'
          +'<td><div style="font-weight:700;">'+_esc(r.name)+'</div><div style="font-size:10px;color:var(--text3);">'+_esc(r.role)+'</div></td>'
          +'<td>'+r.worked+'</td>'
          +'<td style="color:var(--red);">'+r.absent+'</td>'
          +'<td style="color:var(--yellow);">'+r.late+'</td>'
          +'<td style="color:var(--purple);">'+r.ot+'</td>'
          +'<td><div style="font-weight:800;color:'+rc+';">'+r.rate+'%</div>'
          +'<div class="progress-bar" style="margin-top:3px;"><div class="progress-fill" style="width:'+Math.min(r.rate,100)+'%;background:'+rc+';"></div></div>'
          +'</td></tr>';
      }).join('')
      +'</tbody></table></div>';
  });
}
window._rptLoadAtt=_rptLoadAtt;

/* ── Cơ cấu ────────────────────────────────────────────────── */
function _rptHead(){
  var ct=document.getElementById('rpt-content');if(!ct)return;
  var apiF=_api();if(!apiF)return;
  apiF('hrm_get_headcount_report',{},function(e,d){
    if(e||!d||!d.ok){ct.innerHTML='<div class="hrm-alert">L\u1ed7i</div>';return;}
    var byRole=d.by_role||[],byTen=d.by_tenure||[];
    var totR=byRole.reduce(function(a,r){return a+r.count;},0)||1;
    var totT=byTen.reduce(function(a,r){return a+r.count;},0)||1;
    ct.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">'
      +'<div class="card" style="padding:16px;"><div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:12px;">\ud83c\udf93 Theo vai tr\u00f2</div>'
      +byRole.map(function(r){var p=Math.round(r.count/totR*100);return '<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;"><span>'+_esc(r.role)+'</span><span style="font-weight:800;">'+r.count+' ('+p+'%)</span></div><div class="progress-bar"><div class="progress-fill" style="width:'+p+'%;"></div></div></div>';}).join('')
      +'</div>'
      +'<div class="card" style="padding:16px;"><div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);margin-bottom:12px;">\ud83d\udcc5 Th\u00e2m ni\u00ean</div>'
      +byTen.map(function(r){var p=Math.round(r.count/totT*100);return '<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;"><span>'+_esc(r.range)+' n\u0103m</span><span style="font-weight:800;">'+r.count+' ('+p+'%)</span></div><div class="progress-bar"><div class="progress-fill" style="width:'+p+'%;background:var(--cyan);"></div></div></div>';}).join('')
      +'</div></div>';
  });
}

/* ── Gửi báo cáo ────────────────────────────────────────────── */
function _rptSendReport(){
  if(!confirm('G\u1eedi b\u00e1o c\u00e1o nh\u00e2n s\u1ef1 th\u00e1ng n\u00e0y v\u1ec1 thinhhoba@gmail.com?'))return;
  var apiF=_api();if(!apiF)return;
  apiF('hrm_send_monthly_report',{},function(e,d){
    if(e||!d||!d.ok){_toast((d&&d.error)||'L\u1ed7i g\u1eedi email','error');return;}
    _toast('\u2705 \u0110\u00e3 g\u1eedi b\u00e1o c\u00e1o','ok');
  });
}
window._rptSendReport=_rptSendReport;

})();
