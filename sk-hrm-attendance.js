/* ================================================================
 * sk-hrm-attendance.js — SonKhang ERP v3.6
 * SK-HRM-02: Chấm công + Nghỉ phép (frontend)
 * 20/03/2026
 * ================================================================ */
(function () {
  'use strict';

  var _LEAVE_TYPES = ['Ngh\u1ec9 ph\u00e9p n\u0103m','Ngh\u1ec9 \u1ed1m','Ngh\u1ec9 thai s\u1ea3n','Ngh\u1ec9 kh\u00f4ng l\u01b0\u01a1ng','Ngh\u1ec9 l\u1ec5'];
  var _attDirty = {};  /* empId_month_year → changed row data */

  /* ─── Attendance Tab ─────────────────────────────────────────── */
  function _renderAtt() {
    var ct = document.getElementById('hrm-content');
    if (!ct) return;
    var now = new Date();
    var m   = window._hrm.curMonth;
    var y   = window._hrm.curYear;

    ct.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:16px;">'
      + '<div style="display:flex;align-items:center;gap:8px;">'
      +   '<button class="btn-ghost" onclick="_attPrevMonth()" style="padding:7px 12px;">&laquo;</button>'
      +   '<span style="font-size:15px;font-weight:800;" id="att-month-label">T\u1ed5ng h\u1ee3p ' + m + '/' + y + '</span>'
      +   '<button class="btn-ghost" onclick="_attNextMonth()" style="padding:7px 12px;">&raquo;</button>'
      + '</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      +   '<button class="btn-ghost" onclick="_attGenMonth()" style="font-size:11px;">\u2b06\ufe0f T\u1ea1o b\u1ea3ng th\u00e1ng</button>'
      +   '<button class="btn-primary" id="att-save-btn" onclick="_attSaveAll()" style="font-size:11px;display:none;">\ud83d\udcbe L\u01b0u thay \u0111\u1ed5i</button>'
      + '</div>'
      + '</div>'
      + '<div id="att-kpi" class="hrm-kpi-grid"></div>'
      + '<div class="card" style="overflow:hidden;">'
      +   '<div id="att-grid"><div class="hrm-loading"><div style="width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;" class="sk-spin"></div></div></div>'
      + '</div>';

    _loadAttendance(m, y);
  }
  window._hrmRenderAttendance = _renderAtt;

  function _loadAttendance(m, y) {
    _attDirty = {};
    var apiF = (typeof window.api === 'function') ? window.api
             : (typeof api === 'function') ? api : null;
    if (!apiF) return;
    apiF('hrm_get_attendance', { month: m, year: y }, function(err, d) {
      if (err || !d || !d.ok) { _attShowErr('L\u1ed7i t\u1ea3i d\u1eef li\u1ec7u'); return; }
      window._hrm.attData = d.data || [];
      _renderAttKpi(d.data);
      _renderAttGrid(d.data, m, y);
    });
  }

  function _renderAttKpi(rows) {
    var el = document.getElementById('att-kpi');
    if (!el) return;
    var totalWorked = 0, totalAbsent = 0, totalOT = 0, totalLate = 0;
    rows.forEach(function(r) {
      totalWorked += r.worked || 0;
      totalAbsent += r.absent || 0;
      totalOT     += r.ot_hours || 0;
      totalLate   += r.late_count || 0;
    });
    el.innerHTML = [
      ['&#128197;', 'S\u1ed1 NV', rows.length, 'var(--accent2)'],
      ['\u2705', 'T\u1ed5ng ng\u00e0y c\u00f4ng', totalWorked, 'var(--green)'],
      ['\u274c', 'Ng\u00e0y v\u1eafng', totalAbsent, 'var(--red)'],
      ['\u23f0', '\u0110i mu\u1ed9n', totalLate, 'var(--yellow)'],
      ['\u23f3', 'Gi\u1edd OT', totalOT.toFixed(1), 'var(--purple)']
    ].map(function(c) {
      return '<div class="hrm-kpi card"><div class="hrm-kpi-lbl">' + c[0] + ' ' + c[1] + '</div>'
           + '<div class="hrm-kpi-val" style="color:' + c[3] + ';">' + c[2] + '</div></div>';
    }).join('');
  }

  function _renderAttGrid(rows, m, y) {
    var grid = document.getElementById('att-grid');
    if (!grid) return;
    if (!rows.length) {
      grid.innerHTML = '<div class="hrm-empty">'
        + 'Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u th\u00e1ng ' + m + '/' + y + '.<br>'
        + '<button class="btn-primary" style="margin-top:12px;font-size:11px;" onclick="_attGenMonth()">T\u1ea1o b\u1ea3ng ch\u1ea5m c\u00f4ng</button>'
        + '</div>';
      return;
    }

    var header = '<div class="hrm-att-row" style="background:var(--bg);">'
      + '<div class="hrm-att-hd">Nh\u00e2n vi\u00ean</div>'
      + '<div class="hrm-att-hd" style="text-align:center;">Chu\u1ea9n</div>'
      + '<div class="hrm-att-hd" style="text-align:center;">L\u00e0m vi\u1ec7c</div>'
      + '<div class="hrm-att-hd" style="text-align:center;">V\u1eafng</div>'
      + '<div class="hrm-att-hd" style="text-align:center;">OT (h)</div>'
      + '<div class="hrm-att-hd" style="text-align:center;">Tr\u1ec5 (l\u1ea7n)</div>'
      + '<div class="hrm-att-hd" style="text-align:center;">Tr\u1ec5 (ph\u00fat)</div>'
      + '<div class="hrm-att-hd">Ghi ch\u00fa</div>'
      + '</div>';

    var bodyRows = rows.map(function(r) {
      var key = r.emp_id + '_' + m + '_' + y;
      return '<div class="hrm-att-row" id="att-row-' + r.emp_id + '">'
        + '<div class="hrm-att-cell">'
        +   '<div style="font-size:12px;font-weight:700;">' + _esc(r.name) + '</div>'
        +   '<div style="font-size:10px;color:var(--text3);">' + _esc(r.role) + '</div>'
        + '</div>'
        + _attInp(key, 'std',   r.std_days,   2)
        + _attInp(key, 'work',  r.worked,      2)
        + _attInp(key, 'abs',   r.absent,      2)
        + _attInp(key, 'ot',    r.ot_hours,    4)
        + _attInp(key, 'late',  r.late_count,  2)
        + _attInp(key, 'latm',  r.late_mins,   4)
        + '<div class="hrm-att-cell">'
        +   '<input class="hrm-att-input" style="width:90%;" id="att-' + key + '-note" value="' + _esc(r.note||'') + '"'
        +     ' onchange="_attMarkDirty(\'' + key + '\',\'' + r.emp_id + '\',\'' + _esc(r.name) + '\',\'' + _esc(r.role) + '\',' + m + ',' + y + ')">'
        + '</div>'
        + '</div>';
    }).join('');

    grid.innerHTML = header + bodyRows;
  }

  function _attInp(key, field, val, size) {
    return '<div class="hrm-att-cell" style="text-align:center;">'
      + '<input class="hrm-att-input" id="att-' + key + '-' + field + '" type="number" min="0" value="' + (val||0) + '" style="width:' + (size*20+10) + 'px;"'
      + ' onchange="_attMarkDirty(\'' + key + '\',null,null,null,null,null)">'
      + '</div>';
  }

  function _attMarkDirty(key, empId, name, role, m, y) {
    var parts = key.split('_');
    var eid = parts[0], pm = parts[1]||m, py = parts[2]||y;
    _attDirty[key] = {
      emp_id    : empId || eid,
      name      : name  || '',
      role      : role  || '',
      month     : Number(pm),
      year      : Number(py),
      std_days  : _attGv(key, 'std'),
      worked    : _attGv(key, 'work'),
      absent    : _attGv(key, 'abs'),
      ot_hours  : _attGv(key, 'ot'),
      late_count: _attGv(key, 'late'),
      late_mins : _attGv(key, 'latm'),
      note      : (document.getElementById('att-' + key + '-note')||{}).value || ''
    };
    var saveBtn = document.getElementById('att-save-btn');
    if (saveBtn) saveBtn.style.display = '';
  }
  window._attMarkDirty = _attMarkDirty;

  function _attGv(key, field) {
    return Number((document.getElementById('att-' + key + '-' + field)||{}).value || 0);
  }

  function _attSaveAll() {
    var keys = Object.keys(_attDirty);
    if (!keys.length) { window._hrmToast('Kh\u00f4ng c\u00f3 thay \u0111\u1ed5i', 'warn'); return; }
    var btn = document.getElementById('att-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = '\u0110ang l\u01b0u...'; }

    var apiF = (typeof window.api === 'function') ? window.api
             : (typeof api === 'function') ? api : null;
    if (!apiF) return;

    var done = 0, total = keys.length, errors = 0;
    keys.forEach(function(k) {
      apiF('hrm_save_attendance_row', _attDirty[k], function(err, d) {
        done++;
        if (err || !d || !d.ok) errors++;
        if (done >= total) {
          if (btn) { btn.disabled = false; btn.textContent = '\ud83d\udcbe L\u01b0u thay \u0111\u1ed5i'; btn.style.display = 'none'; }
          _attDirty = {};
          if (errors) window._hrmToast(errors + ' l\u1ed7i khi l\u01b0u', 'error');
          else window._hrmToast('\u2705 \u0110\u00e3 l\u01b0u ' + total + ' d\u00f2ng', 'ok');
          _loadAttendance(window._hrm.curMonth, window._hrm.curYear);
        }
      });
    });
  }
  window._attSaveAll = _attSaveAll;

  function _attGenMonth() {
    var m = window._hrm.curMonth, y = window._hrm.curYear;
    if (!confirm('T\u1ea1o b\u1ea3ng ch\u1ea5m c\u00f4ng th\u00e1ng ' + m + '/' + y + '?')) return;
    var apiF = (typeof window.api === 'function') ? window.api
             : (typeof api === 'function') ? api : null;
    if (!apiF) return;
    apiF('hrm_gen_monthly_attendance', { month: m, year: y }, function(err, d) {
      if (err || !d || !d.ok) { window._hrmToast((d&&d.error)||'L\u1ed7i', 'error'); return; }
      window._hrmToast(d.msg || '\u0110\u00e3 t\u1ea1o b\u1ea3ng', 'ok');
      _loadAttendance(m, y);
    });
  }
  window._attGenMonth = _attGenMonth;

  function _attPrevMonth() {
    if (window._hrm.curMonth === 1) { window._hrm.curMonth = 12; window._hrm.curYear--; }
    else window._hrm.curMonth--;
    _renderAtt();
  }
  window._attPrevMonth = _attPrevMonth;

  function _attNextMonth() {
    if (window._hrm.curMonth === 12) { window._hrm.curMonth = 1; window._hrm.curYear++; }
    else window._hrm.curMonth++;
    _renderAtt();
  }
  window._attNextMonth = _attNextMonth;

  function _attShowErr(msg) {
    var el = document.getElementById('att-grid');
    if (el) el.innerHTML = '<div class="hrm-alert">' + msg + '</div>';
  }

  /* ─── Leave Tab ──────────────────────────────────────────────── */
  function _renderLeave() {
    var ct = document.getElementById('hrm-content');
    if (!ct) return;

    ct.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">'
      + '<div style="font-size:15px;font-weight:800;">\ud83c\udfe5 Qu\u1ea3n l\u00fd ngh\u1ec9 ph\u00e9p</div>'
      + '<button class="btn-primary" onclick="_leaveOpenForm()" style="font-size:11px;">+ \u0110\u0103ng k\u00fd ngh\u1ec9</button>'
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-bottom:12px;">'
      +   '<button class="chip active" id="lv-tab-all"  onclick="_leaveFilter(\'\')">T\u1ea5t c\u1ea3</button>'
      +   '<button class="chip" id="lv-tab-wait" onclick="_leaveFilter(\'cho_duyet\')">Ch\u1edd duy\u1ec7t</button>'
      +   '<button class="chip" id="lv-tab-ok"   onclick="_leaveFilter(\'da_duyet\')">Duy\u1ec7t</button>'
      +   '<button class="chip" id="lv-tab-no"   onclick="_leaveFilter(\'tu_choi\')">T\u1eeb ch\u1ed1i</button>'
      + '</div>'
      + '<div class="card" style="overflow:hidden;">'
      +   '<div id="leave-list"><div class="hrm-loading"><div style="width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;" class="sk-spin"></div></div></div>'
      + '</div>';

    _loadLeaves('');
  }
  window._hrmRenderLeave = _renderLeave;

  function _loadLeaves(status) {
    var apiF = (typeof window.api === 'function') ? window.api
             : (typeof api === 'function') ? api : null;
    if (!apiF) return;
    apiF('hrm_get_leaves', { status: status }, function(err, d) {
      var el = document.getElementById('leave-list');
      if (!el) return;
      if (err || !d || !d.ok) { el.innerHTML = '<div class="hrm-alert">L\u1ed7i t\u1ea3i d\u1eef li\u1ec7u</div>'; return; }
      window._hrm.leaves = d.data || [];
      _renderLeaveTable(d.data);
    });
  }

  function _leaveFilter(status) {
    ['all','wait','ok','no'].forEach(function(t) {
      var btn = document.getElementById('lv-tab-' + t);
      if (btn) btn.classList.remove('active');
    });
    var map = { '': 'all', 'cho_duyet': 'wait', 'da_duyet': 'ok', 'tu_choi': 'no' };
    var btn = document.getElementById('lv-tab-' + (map[status]||'all'));
    if (btn) btn.classList.add('active');
    _loadLeaves(status);
  }
  window._leaveFilter = _leaveFilter;

  function _renderLeaveTable(rows) {
    var el = document.getElementById('leave-list');
    if (!el) return;
    if (!rows.length) {
      el.innerHTML = '<div class="hrm-empty">Kh\u00f4ng c\u00f3 \u0111\u01a1n ngh\u1ec9 n\u00e0o.</div>';
      return;
    }

    var html = '<table class="hrm-tbl">'
      + '<thead><tr>'
      +   '<th>Nh\u00e2n vi\u00ean</th><th>Lo\u1ea1i ngh\u1ec9</th>'
      +   '<th>T\u1eeb ng\u00e0y</th><th>\u0110\u1ebfn ng\u00e0y</th>'
      +   '<th>L\u00fd do</th><th>Tr\u1ea1ng th\u00e1i</th><th>Thao t\u00e1c</th>'
      + '</tr></thead><tbody>'
      + rows.map(function(r) {
          var stCls = r.status === 'da_duyet' ? 'hrm-ls-ok'
                    : r.status === 'tu_choi'  ? 'hrm-ls-tc' : 'hrm-ls-cho';
          var stLbl = r.status === 'da_duyet' ? '\u2705 Duy\u1ec7t'
                    : r.status === 'tu_choi'  ? '\u274c T\u1eeb ch\u1ed1i' : '\u23f3 Ch\u1edd';
          var actions = r.status === 'cho_duyet'
            ? '<button class="btn-ghost" style="padding:4px 8px;font-size:10px;color:var(--green);border-color:var(--green);" onclick="_leaveApprove(\'' + r.id + '\',\'duyet\')">Duy\u1ec7t</button>'
            + ' <button class="btn-ghost" style="padding:4px 8px;font-size:10px;color:var(--red);border-color:var(--red);" onclick="_leaveApprove(\'' + r.id + '\',\'tu_choi\')">T\u1eeb ch\u1ed1i</button>'
            : '<span style="font-size:11px;color:var(--text3);">' + (r.approver||'\u2014') + '</span>';
          return '<tr>'
            + '<td><div style="font-weight:700;">' + _esc(r.emp_name) + '</div><div style="font-size:10px;color:var(--text3);">' + _esc(r.emp_id) + '</div></td>'
            + '<td>' + _esc(r.type) + '</td>'
            + '<td>' + _esc(r.from) + '</td>'
            + '<td>' + _esc(r.to)   + '</td>'
            + '<td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;">' + _esc(r.reason||'\u2014') + '</td>'
            + '<td><span class="hrm-leave-status ' + stCls + '">' + stLbl + '</span></td>'
            + '<td>' + actions + '</td>'
            + '</tr>';
        }).join('')
      + '</tbody></table>';

    el.innerHTML = html;
  }

  function _leaveApprove(leaveId, action) {
    var lbl = action === 'duyet' ? 'duy\u1ec7t' : 't\u1eeb ch\u1ed1i';
    if (!confirm(lbl.charAt(0).toUpperCase() + lbl.slice(1) + ' \u0111\u01a1n n\u00e0y?')) return;
    var apiF = (typeof window.api === 'function') ? window.api
             : (typeof api === 'function') ? api : null;
    if (!apiF) return;
    apiF('hrm_approve_leave', { leave_id: leaveId, action: action }, function(err, d) {
      if (err || !d || !d.ok) { window._hrmToast((d&&d.error)||'L\u1ed7i', 'error'); return; }
      window._hrmToast('\u2705 \u0110\u00e3 ' + lbl, 'ok');
      _loadLeaves('');
    });
  }
  window._leaveApprove = _leaveApprove;

  /* ─── Form đăng ký nghỉ ─────────────────────────────────────── */
  function _leaveOpenForm() {
    var typeOpts = _LEAVE_TYPES.map(function(t) { return '<option>' + t + '</option>'; }).join('');
    var today = new Date().toISOString().split('T')[0];
    var html = '<div class="hrm-modal">'
      + '<div class="hrm-modal-hd">'
      +   '<span style="font-size:15px;font-weight:800;">\ud83c\udfe5 \u0110\u0103ng k\u00fd ngh\u1ec9 ph\u00e9p</span>'
      +   '<button class="hrm-close" onclick="_closeModal()">&#10005;</button>'
      + '</div>'
      + '<div class="hrm-modal-bd">'
      +   '<div class="hrm-form-grid">'
      +     '<div class="hrm-form-group"><label class="hrm-lbl">M\u00e3 NV</label><input id="lv-empid" class="form-input" placeholder="VD: NV001"></div>'
      +     '<div class="hrm-form-group"><label class="hrm-lbl">H\u1ecd t\u00ean</label><input id="lv-name" class="form-input" placeholder="Nguy\u1ec5n V\u0103n A"></div>'
      +     '<div class="hrm-form-group"><label class="hrm-lbl">Lo\u1ea1i ngh\u1ec9</label><select id="lv-type" class="form-input">' + typeOpts + '</select></div>'
      +     '<div class="hrm-form-group"><label class="hrm-lbl">T\u1eeb ng\u00e0y</label><input id="lv-from" class="form-input" type="date" value="' + today + '"></div>'
      +     '<div class="hrm-form-group"><label class="hrm-lbl">\u0110\u1ebfn ng\u00e0y</label><input id="lv-to" class="form-input" type="date" value="' + today + '"></div>'
      +     '<div class="hrm-form-group full"><label class="hrm-lbl">L\u00fd do</label><input id="lv-reason" class="form-input" placeholder="L\u00fd do xin ngh\u1ec9..."></div>'
      +   '</div>'
      + '</div>'
      + '<div class="hrm-modal-ft">'
      +   '<button class="btn-ghost" onclick="_closeModal()">H\u1ee7y</button>'
      +   '<button class="btn-primary" id="lv-submit" onclick="_leaveSubmit()">\ud83d\udce4 G\u1eedi y\u00eau c\u1ea7u</button>'
      + '</div>'
      + '</div>';
    _closeModal();
    var ov = document.createElement('div');
    ov.className = 'hrm-modal-overlay'; ov.id = 'hrm-modal-ov';
    ov.innerHTML = html;
    ov.addEventListener('click', function(e) { if (e.target === ov) _closeModal(); });
    document.body.appendChild(ov);
  }
  window._leaveOpenForm = _leaveOpenForm;

  function _leaveSubmit() {
    var empId  = (_gv('lv-empid') ||'').trim();
    var name   = (_gv('lv-name')  ||'').trim();
    var from   = _gv('lv-from');
    var to     = _gv('lv-to');
    if (!empId || !name || !from || !to) {
      window._hrmToast('Vui l\u00f2ng \u0111i\u1ec1n \u0111\u1ee7 th\u00f4ng tin', 'error'); return;
    }
    var btn = document.getElementById('lv-submit');
    if (btn) { btn.disabled = true; btn.textContent = '\u0110ang g\u1eedi...'; }
    var apiF = (typeof window.api === 'function') ? window.api
             : (typeof api === 'function') ? api : null;
    if (!apiF) return;
    apiF('hrm_request_leave', {
      emp_id: empId, emp_name: name,
      from_date: from, to_date: to,
      type: _gv('lv-type'), reason: _gv('lv-reason')
    }, function(err, d) {
      if (btn) { btn.disabled = false; btn.textContent = 'G\u1eedi'; }
      if (err || !d || !d.ok) { window._hrmToast((d&&d.error)||'L\u1ed7i', 'error'); return; }
      _closeModal();
      window._hrmToast('\u2705 \u0110\u00e3 g\u1eedi: ' + d.leave_id, 'ok');
      _loadLeaves('');
    });
  }
  window._leaveSubmit = _leaveSubmit;

  /* ─── Utils ──────────────────────────────────────────────────── */
  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function _gv(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  function _closeModal() {
    var ov = document.getElementById('hrm-modal-ov');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
  }

})();
