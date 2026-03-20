/* ================================================================
 * sk-hrm-personnel.js — SonKhang ERP v3.6
 * SK-HRM-01: Ho so Nhan su (frontend)
 * 20/03/2026
 * ================================================================ */
(function () {
  'use strict';

  var _ROLES = [
    { code:'GD', name:'Gi\u00e1m \u0111\u1ed1c',   base:25000000 },
    { code:'KT', name:'K\u1ebf to\u00e1n',          base:12000000 },
    { code:'TK', name:'Th\u1ee7 kho',               base:9000000  },
    { code:'TQ', name:'Th\u1ee7 qu\u1ef9',          base:9000000  },
    { code:'SL', name:'Sale',                         base:8000000  },
    { code:'GH', name:'Giao h\u00e0ng',              base:7500000  },
    { code:'HR', name:'Nh\u00e2n s\u1ef1',          base:9000000  }
  ];

  var _AVATAR_COLORS = ['#3d6bff','#10d68c','#a855f7','#fbbf24','#ff4d6d','#06b6d4','#f97316'];

  /* ── Entry ───────────────────────────────────────────────────── */
  function _render() {
    var ct = document.getElementById('hrm-content');
    if (!ct) return;
    ct.innerHTML = '<div style="padding:8px 0 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
      +   '<input id="hrm-search" class="form-input" placeholder="\ud83d\udd0d T\u00ecm ki\u1ebfm..." style="width:220px;padding:8px 12px;font-size:12px;" oninput="_hrmSearchEmp()">'
      +   '<select id="hrm-filter-role" class="form-input" onchange="_hrmSearchEmp()" style="width:160px;padding:8px 12px;font-size:12px;">'
      +     '<option value="">T\u1ea5t c\u1ea3 v\u1ecb tr\u00ed</option>'
      +     _ROLES.map(function(r){ return '<option value="' + r.name + '">' + r.name + '</option>'; }).join('')
      +   '</select>'
      +   '<select id="hrm-filter-status" class="form-input" onchange="_hrmSearchEmp()" style="width:140px;padding:8px 12px;font-size:12px;">'
      +     '<option value="">T\u1ea5t c\u1ea3</option>'
      +     '<option value="Hoat dong">Ho\u1ea1t \u0111\u1ed9ng</option>'
      +     '<option value="Nghi viec">Ngh\u1ec9 vi\u1ec7c</option>'
      +   '</select>'
      + '</div>'
      + '<button class="btn-primary" onclick="_hrmOpenEmpForm(null)" style="font-size:11px;">+ Th\u00eam nh\u00e2n vi\u00ean</button>'
      + '</div>'
      + '<div id="hrm-kpi-row" class="hrm-kpi-grid"></div>'
      + '<div id="hrm-doc-alerts"></div>'
      + '<div id="hrm-emp-list"><div class="hrm-loading"><div style="width:28px;height:28px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;" class="sk-spin"></div></div></div>';

    _loadEmployees();
    _loadDocAlerts();
  }
  window._hrmRenderPersonnel = _render;

  /* ── Load danh sách ──────────────────────────────────────────── */
  function _loadEmployees() {
    var apiF = (typeof window.api === 'function') ? window.api
             : (typeof api === 'function') ? api : null;
    if (!apiF) { _showEmpError('api() kh\u00f4ng t\u1ecbn t\u1ea1i'); return; }

    apiF('hrm_get_employees', {}, function (err, d) {
      if (err || !d || !d.ok) { _showEmpError(d ? d.error : 'L\u1ed7i k\u1ebft n\u1ed1i'); return; }
      window._hrm.empList = d.data || [];
      _renderKpi(d.kpi);
      _renderEmpGrid(window._hrm.empList);
    });
  }

  function _renderKpi(kpi) {
    var el = document.getElementById('hrm-kpi-row');
    if (!el || !kpi) return;
    el.innerHTML = _kpiCard('\ud83d\udc65', 'T\u1ed5ng NV',       kpi.total || 0,           'var(--accent2)')
      + _kpiCard('\u2705', 'Ho\u1ea1t \u0111\u1ed9ng',          kpi.active || 0,          'var(--green)')
      + _kpiCard('\ud83c\udd95', 'Th\u00e1ng n\u00e0y',       kpi.new_this_month || 0,  'var(--yellow)')
      + _kpiCard('\ud83c\udfe2', 'Ngh\u1ec9 vi\u1ec7c',        (kpi.total||0)-(kpi.active||0), 'var(--red)');
  }

  function _kpiCard(icon, label, val, color) {
    return '<div class="hrm-kpi card"><div class="hrm-kpi-lbl">' + icon + ' ' + label + '</div>'
      + '<div class="hrm-kpi-val" style="color:' + color + ';">' + val + '</div></div>';
  }

  function _renderEmpGrid(list) {
    var el = document.getElementById('hrm-emp-list');
    if (!el) return;
    if (!list.length) {
      el.innerHTML = '<div class="hrm-empty">\ud83d\udc64 Ch\u01b0a c\u00f3 nh\u00e2n vi\u00ean n\u00e0o.\u003cbr\u003e<span style="font-size:11px;">B\u1ea5m \u201c+ Th\u00eam nh\u00e2n vi\u00ean\u201d \u0111\u1ec3 b\u1eaft \u0111\u1ea7u.</span></div>';
      return;
    }
    el.innerHTML = '<div class="hrm-emp-grid">' + list.map(_empCard).join('') + '</div>';
  }

  function _empCard(e) {
    var initials = (function(n){
      var p = (n||'').trim().split(/\s+/);
      return (p.length >= 2 ? p[0][0]+(p[p.length-1][0]) : (n||'?')[0]||'?').toUpperCase();
    })(e.name);
    var color = _AVATAR_COLORS[Math.abs(_hashStr(e.id||'')) % _AVATAR_COLORS.length];
    var statusCls = e.status === 'Hoat dong' ? 'hrm-badge-green' : 'hrm-badge-red';
    return '<div class="hrm-emp-card" onclick="_hrmOpenEmpDetail(\'' + _esc(e.id) + '\')">'
      + '<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;">'
      +   '<div class="hrm-av" style="background:' + color + ';">' + initials + '</div>'
      +   '<div style="flex:1;min-width:0;">'
      +     '<div style="font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(e.name) + '</div>'
      +     '<div style="font-size:11px;color:var(--text3);margin-top:2px;">' + _esc(e.role) + '</div>'
      +   '</div>'
      +   '<span class="hrm-badge ' + statusCls + '">' + (e.status==='Hoat dong'?'Active':'Off') + '</span>'
      + '</div>'
      + '<div style="display:flex;justify-content:space-between;align-items:center;">'
      +   '<div style="font-size:10px;color:var(--text3);">'
      +     '\ud83d\udcb0 <span style="color:var(--accent2);font-weight:700;">' + window._hrmFmtSalary(e.base_salary) + '</span>'
      +   '</div>'
      +   '<div style="font-size:10px;color:var(--text3);">'
      +     (e.years_worked > 0 ? e.years_worked + ' n\u0103m' : 'M\u1edbi')
      +   '</div>'
      + '</div>'
      + '<div style="font-size:10px;color:var(--text3);margin-top:6px;">'
      +   '\ud83d\udcde ' + (e.phone || '\u2014') + ' &nbsp; \ud83d\udce7 ' + (e.email || '\u2014')
      + '</div>'
      + '</div>';
  }

  /* ── Tìm kiếm ───────────────────────────────────────────────── */
  function _hrmSearchEmp() {
    var q      = (document.getElementById('hrm-search')        || {}).value || '';
    var role   = (document.getElementById('hrm-filter-role')   || {}).value || '';
    var status = (document.getElementById('hrm-filter-status') || {}).value || '';
    var list   = window._hrm.empList || [];
    var q_lo   = q.toLowerCase();
    var filtered = list.filter(function(e) {
      if (role   && e.role   !== role)   return false;
      if (status && e.status !== status) return false;
      if (q_lo  && (e.name||'').toLowerCase().indexOf(q_lo) < 0
                && (e.id||'').toLowerCase().indexOf(q_lo) < 0
                && (e.email||'').toLowerCase().indexOf(q_lo) < 0
                && (e.phone||'').toLowerCase().indexOf(q_lo) < 0) return false;
      return true;
    });
    _renderEmpGrid(filtered);
  }
  window._hrmSearchEmp = _hrmSearchEmp;

  /* ── Chi tiết nhân viên ─────────────────────────────────────── */
  function _hrmOpenEmpDetail(empId) {
    _showModal('<div style="text-align:center;padding:20px;"><div class="sk-spin" style="width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;display:inline-block;"></div></div>');

    var apiF = (typeof window.api === 'function') ? window.api
             : (typeof api === 'function') ? api : null;
    if (!apiF) return;

    apiF('hrm_get_employee_detail', { id: empId }, function (err, d) {
      if (err || !d || !d.ok) { _closeModal(); window._hrmToast(d ? d.error : 'L\u1ed7i', 'error'); return; }
      _renderEmpDetailModal(d.employee, d.documents, d.history);
    });
  }
  window._hrmOpenEmpDetail = _hrmOpenEmpDetail;

  function _renderEmpDetailModal(e, docs, hist) {
    var initials = (function(n){
      var p=(n||'').trim().split(/\s+/);
      return (p.length>=2?p[0][0]+p[p.length-1][0]:(n||'?')[0]||'?').toUpperCase();
    })(e.name);
    var color = _AVATAR_COLORS[Math.abs(_hashStr(e.id||''))%_AVATAR_COLORS.length];

    var alertDocs = (docs||[]).filter(function(d){ return d.alert !== 'ok'; });
    var alertHtml = alertDocs.length
      ? '<div class="hrm-alert">\u26a0\ufe0f ' + alertDocs.length + ' t\u00e0i li\u1ec7u s\u1eafp h\u1ebft h\u1ea1n</div>'
      : '';

    var docsHtml = docs && docs.length
      ? '<table class="hrm-tbl" style="margin-top:8px;">'
          + '<thead><tr><th>Lo\u1ea1i</th><th>T\u00ean file</th><th>H\u1ebft h\u1ea1n</th><th>Tr\u1ea1ng th\u00e1i</th></tr></thead>'
          + '<tbody>' + docs.map(function(d) {
              var ac = d.alert === 'expired' ? 'hrm-badge-red' : d.alert === 'urgent' ? 'hrm-badge-yellow' : 'hrm-badge-green';
              return '<tr><td>' + _esc(d.type) + '</td>'
                + '<td><a href="' + _esc(d.link) + '" target="_blank" style="color:var(--accent2);">' + _esc(d.name||'Xem') + '</a></td>'
                + '<td>' + (d.expire_date||'\u2014') + '</td>'
                + '<td><span class="hrm-badge ' + ac + '">'
                + (d.alert==='expired'?'H\u1ebft h\u1ea1n':d.alert==='urgent'?'G\u1ea5p':d.days_left===null?'OK':d.days_left+'ng\u00e0y') + '</span></td>'
                + '</tr>';
            }).join('')
          + '</tbody></table>'
      : '<div class="hrm-empty" style="padding:16px;">Ch\u01b0a c\u00f3 t\u00e0i li\u1ec7u</div>';

    var histHtml = hist && hist.length
      ? '<div style="max-height:180px;overflow-y:auto;">' + hist.map(function(h) {
          return '<div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);font-size:11px;">'
            + '<span style="color:var(--text3);white-space:nowrap;">' + (h.date||'') + '</span>'
            + '<span style="color:var(--text2);">[' + (h.type||'') + '] ' + (h.field||'') + '</span>'
            + '<span style="color:var(--text3);margin-left:auto;">' + (h.by||'') + '</span>'
            + '</div>';
        }).join('') + '</div>'
      : '<div class="hrm-empty" style="padding:12px;">Ch\u01b0a c\u00f3 l\u1ecbch s\u1eed</div>';

    /* Tab state */
    var _detailTab = 'info';
    function switchTab(t) {
      _detailTab = t;
      ['info','docs','hist'].forEach(function(tab) {
        var btn = document.getElementById('dt-tab-' + tab);
        var pnl = document.getElementById('dt-pnl-' + tab);
        if (btn) btn.classList.toggle('active', tab === t);
        if (pnl) pnl.style.display = tab === t ? '' : 'none';
      });
    }

    var html = '<div class="hrm-modal">'
      + '<div class="hrm-modal-hd">'
      +   '<div style="display:flex;gap:12px;align-items:center;">'
      +     '<div class="hrm-av" style="background:' + color + ';width:48px;height:48px;font-size:18px;">' + initials + '</div>'
      +     '<div>'
      +       '<div style="font-size:16px;font-weight:900;">' + _esc(e.name) + '</div>'
      +       '<div style="font-size:11px;color:var(--text3);">' + _esc(e.role) + ' &nbsp;|&nbsp; ' + _esc(e.id) + '</div>'
      +     '</div>'
      +   '</div>'
      +   '<button class="hrm-close" onclick="_closeModal()">&#10005;</button>'
      + '</div>'
      + '<div style="display:flex;gap:4px;padding:8px 24px;background:var(--bg3);border-bottom:1px solid var(--border);">'
      +   '<button class="hrm-tab active" id="dt-tab-info"   onclick="document.getElementById(\'dt-tab-info\').className=\'hrm-tab active\';document.getElementById(\'dt-tab-docs\').className=\'hrm-tab\';document.getElementById(\'dt-tab-hist\').className=\'hrm-tab\';document.getElementById(\'dt-pnl-info\').style.display=\'\';document.getElementById(\'dt-pnl-docs\').style.display=\'none\';document.getElementById(\'dt-pnl-hist\').style.display=\'none\';">\ud83d\udcc4 Th\u00f4ng tin</button>'
      +   '<button class="hrm-tab" id="dt-tab-docs" onclick="document.getElementById(\'dt-tab-info\').className=\'hrm-tab\';document.getElementById(\'dt-tab-docs\').className=\'hrm-tab active\';document.getElementById(\'dt-tab-hist\').className=\'hrm-tab\';document.getElementById(\'dt-pnl-info\').style.display=\'none\';document.getElementById(\'dt-pnl-docs\').style.display=\'\';document.getElementById(\'dt-pnl-hist\').style.display=\'none\';">\ud83d\udcce T\u00e0i li\u1ec7u</button>'
      +   '<button class="hrm-tab" id="dt-tab-hist" onclick="document.getElementById(\'dt-tab-info\').className=\'hrm-tab\';document.getElementById(\'dt-tab-docs\').className=\'hrm-tab\';document.getElementById(\'dt-tab-hist\').className=\'hrm-tab active\';document.getElementById(\'dt-pnl-info\').style.display=\'none\';document.getElementById(\'dt-pnl-docs\').style.display=\'none\';document.getElementById(\'dt-pnl-hist\').style.display=\'\';">\ud83d\udcdc L\u1ecbch s\u1eed</button>'
      + '</div>'
      + '<div class="hrm-modal-bd">'
      +   alertHtml
      +   '<div id="dt-pnl-info">'
      +     '<div class="hrm-form-grid">'
      +       _dtRow('\ud83d\udcde S\u0110T', e.phone)
      +       _dtRow('\ud83d\udce7 Email', e.email)
      +       _dtRow('\ud83c\udf82 Sinh', e.birthday)
      +       _dtRow('\ud83d\udc64 Gi\u1edbi t\u00ednh', e.gender)
      +       _dtRow('\ud83d\udccb CMND', e.id_card)
      +       _dtRow('\ud83c\udfe0 \u0110\u1ecba ch\u1ec9', e.address)
      +       _dtRow('\ud83d\udcc5 V\u00e0o l\u00e0m', e.start_date)
      +       _dtRow('\ud83d\udcb0 L\u01b0\u01a1ng CB', window._hrmFmtSalary(e.base_salary))
      +       _dtRow('\ud83c\udfe6 STK', e.bank_account + ' (' + (e.bank_name||'') + ')')
      +       _dtRow('\ud83d\udfe2 Tr\u1ea1ng th\u00e1i', e.status)
      +     '</div>'
      +     (e.note ? '<div style="margin-top:12px;font-size:12px;color:var(--text3);">\ud83d\udcdd ' + _esc(e.note) + '</div>' : '')
      +   '</div>'
      +   '<div id="dt-pnl-docs" style="display:none;">' + docsHtml + '</div>'
      +   '<div id="dt-pnl-hist" style="display:none;">' + histHtml + '</div>'
      + '</div>'
      + '<div class="hrm-modal-ft">'
      +   '<button class="btn-ghost" onclick="_closeModal()">D\u00f3ng</button>'
      +   '<button class="btn-primary" onclick="_closeModal();_hrmOpenEmpForm(\'' + _esc(e.id) + '\')">S\u1eeda h\u1ed3 s\u01a1</button>'
      + '</div>'
      + '</div>';

    _showModal(html);
  }

  function _dtRow(label, val) {
    return '<div class="hrm-form-group">'
      + '<div class="hrm-lbl">' + label + '</div>'
      + '<div style="font-size:13px;font-weight:600;color:var(--text);">' + _esc(val||'\u2014') + '</div>'
      + '</div>';
  }

  /* ── Form thêm/sửa ──────────────────────────────────────────── */
  function _hrmOpenEmpForm(empId) {
    if (empId) {
      var apiF = (typeof window.api === 'function') ? window.api
               : (typeof api === 'function') ? api : null;
      if (!apiF) return;
      _showModal('<div style="text-align:center;padding:30px;"><div class="sk-spin" style="width:24px;height:24px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;display:inline-block;"></div></div>');
      apiF('hrm_get_employee_detail', { id: empId }, function(err, d) {
        if (err || !d || !d.ok) return;
        _renderEmpForm(d.employee);
      });
    } else {
      _renderEmpForm(null);
    }
  }
  window._hrmOpenEmpForm = _hrmOpenEmpForm;

  function _renderEmpForm(e) {
    var isNew = !e;
    var v = function(f) { return e ? _esc(e[f]||'') : ''; };
    var roleOpts = _ROLES.map(function(r) {
      var sel = e && e.role === r.name ? ' selected' : '';
      return '<option value="' + r.name + '" data-code="' + r.code + '" data-base="' + r.base + '"' + sel + '>' + r.name + '</option>';
    }).join('');

    var html = '<div class="hrm-modal">'
      + '<div class="hrm-modal-hd">'
      +   '<span style="font-size:15px;font-weight:800;">' + (isNew ? '+ Th\u00eam nh\u00e2n vi\u00ean' : '\u270f\ufe0f S\u1eeda h\u1ed3 s\u01a1') + '</span>'
      +   '<button class="hrm-close" onclick="_closeModal()">&#10005;</button>'
      + '</div>'
      + '<div class="hrm-modal-bd">'
      +   '<div class="hrm-form-grid">'
      +     _inp('hrm-f-name',    'H\u1ecd v\u00e0 t\u00ean *',      v('name'),         'text',   false, 'full')
      +     _inp('hrm-f-role',    'V\u1ecb tr\u00ed *',               '',                'select', false, '', roleOpts)
      +     _inp('hrm-f-phone',   'S\u1ed1 \u0111i\u1ec7n tho\u1ea1i','v(\'phone\')',   'tel')
      +     _inp('hrm-f-email',   'Email c\u00f4ng ty',              v('email'),        'email')
      +     _inp('hrm-f-idcard',  'CMND / CCCD',                     v('id_card'),      'text')
      +     _inp('hrm-f-birthday','Ng\u00e0y sinh',                  _isoDate(v('birthday')), 'date')
      +     _inp('hrm-f-gender',  'Gi\u1edbi t\u00ednh', '',         'select', false, '',
      +          '<option' + (e&&e.gender==='Nam'?' selected':'') + '>Nam</option>'
      +          + '<option' + (e&&e.gender==='N\u1eef'?' selected':'') + '>N\u1eef</option>')
      +     _inp('hrm-f-start',   'Ng\u00e0y v\u00e0o l\u00e0m',    _isoDate(v('start_date')), 'date')
      +     _inp('hrm-f-salary',  'L\u01b0\u01a1ng c\u01a1 b\u1ea3n', e ? String(e.base_salary||0) : '', 'number')
      +     _inp('hrm-f-bank',    'S\u1ed1 t\u00e0i kho\u1ea3n',    v('bank_account'), 'text')
      +     _inp('hrm-f-bankname','Ng\u00e2n h\u00e0ng',             v('bank_name'),    'text')
      +     _inp('hrm-f-address', '\u0110\u1ecba ch\u1ec9',          v('address'),      'text',   false, 'full')
      +     _inp('hrm-f-note',    'Ghi ch\u00fa',                    v('note'),         'text',   false, 'full')
      +   '</div>'
      + '</div>'
      + '<div class="hrm-modal-ft">'
      +   '<button class="btn-ghost" onclick="_closeModal()">H\u1ee7y</button>'
      +   '<button class="btn-primary" id="hrm-save-btn" onclick="_hrmSaveEmp(\'' + (e?e.id:'') + '\')">'
      +     (isNew ? '\u2795 T\u1ea1o m\u1edbi' : '\u2714 L\u01b0u thay \u0111\u1ed5i')
      +   '</button>'
      + '</div>'
      + '</div>';

    _showModal(html);

    // Auto-fill lương khi chọn role
    var roleEl = document.getElementById('hrm-f-role');
    var salEl  = document.getElementById('hrm-f-salary');
    if (roleEl && salEl && isNew) {
      roleEl.addEventListener('change', function() {
        var opt = roleEl.options[roleEl.selectedIndex];
        if (opt && opt.getAttribute('data-base')) {
          salEl.value = opt.getAttribute('data-base');
        }
      });
    }
  }

  function _inp(id, label, val, type, required, extra, opts) {
    var cls = 'hrm-form-group' + (extra === 'full' ? ' full' : '');
    var input = '';
    if (type === 'select') {
      input = '<select id="' + id + '" class="form-input">' + opts + '</select>';
    } else {
      input = '<input id="' + id + '" class="form-input" type="' + type + '" value="' + (val||'') + '"'
            + (required ? ' required' : '') + '>';
    }
    return '<div class="' + cls + '">'
      + '<label class="hrm-lbl" for="' + id + '">' + label + '</label>'
      + input + '</div>';
  }

  /* ── Lưu nhân viên ──────────────────────────────────────────── */
  function _hrmSaveEmp(existingId) {
    var name = (_gv('hrm-f-name')||'').trim();
    if (!name) { window._hrmToast('Vui l\u00f2ng nh\u1eadp h\u1ecd t\u00ean', 'error'); return; }

    var roleEl  = document.getElementById('hrm-f-role');
    var roleOpt = roleEl ? roleEl.options[roleEl.selectedIndex] : null;

    var payload = {
      id           : existingId || '',
      name         : name,
      role         : _gv('hrm-f-role'),
      role_code    : roleOpt ? (roleOpt.getAttribute('data-code')||'') : '',
      id_card      : _gv('hrm-f-idcard'),
      birthday     : _gv('hrm-f-birthday'),
      gender       : _gv('hrm-f-gender'),
      phone        : _gv('hrm-f-phone'),
      email        : _gv('hrm-f-email'),
      address      : _gv('hrm-f-address'),
      start_date   : _gv('hrm-f-start'),
      base_salary  : Number(_gv('hrm-f-salary')||0),
      bank_account : _gv('hrm-f-bank'),
      bank_name    : _gv('hrm-f-bankname'),
      status       : 'Hoat dong',
      note         : _gv('hrm-f-note')
    };

    var btn = document.getElementById('hrm-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = '\u0110ang l\u01b0u...'; }

    var apiF = (typeof window.api === 'function') ? window.api
             : (typeof api === 'function') ? api : null;
    if (!apiF) return;

    apiF('hrm_save_employee', payload, function(err, d) {
      if (btn) { btn.disabled = false; btn.textContent = 'L\u01b0u'; }
      if (err || !d || !d.ok) { window._hrmToast((d&&d.error)||'L\u1ed7i l\u01b0u', 'error'); return; }
      _closeModal();
      window._hrmToast((d.action==='created'?'\u2705 \u0110\u00e3 t\u1ea1o: ':'\u2714 \u0110\u00e3 c\u1eadp nh\u1eadt: ') + d.name, 'ok');
      _loadEmployees();
    });
  }
  window._hrmSaveEmp = _hrmSaveEmp;

  /* ── Cảnh báo tài liệu ──────────────────────────────────────── */
  function _loadDocAlerts() {
    var apiF = (typeof window.api === 'function') ? window.api
             : (typeof api === 'function') ? api : null;
    if (!apiF) return;
    apiF('hrm_get_expiry_alerts', {}, function(err, d) {
      var el = document.getElementById('hrm-doc-alerts');
      if (!el || err || !d || !d.ok || !d.data.length) return;
      var urgent = d.data.filter(function(a){ return a.level === 'urgent' || a.level === 'expired'; });
      if (!urgent.length) return;
      el.innerHTML = '<div class="hrm-alert" style="margin-bottom:12px;">'
        + '\u26a0\ufe0f <strong>' + urgent.length + ' t\u00e0i li\u1ec7u</strong> s\u1eafp h\u1ebft h\u1ea1n: '
        + urgent.slice(0,3).map(function(a){
            return _esc(a.emp_id) + ' - ' + _esc(a.type) + ' (' + (a.days_left < 0 ? '\u0111\u00e3 h\u1ebft' : a.days_left + ' ng\u00e0y') + ')';
          }).join('; ')
        + '</div>';
    });
  }

  /* ── Modal helpers ───────────────────────────────────────────── */
  function _showModal(html) {
    _closeModal();
    var ov = document.createElement('div');
    ov.className = 'hrm-modal-overlay';
    ov.id = 'hrm-modal-ov';
    ov.innerHTML = html;
    ov.addEventListener('click', function(ev) { if (ev.target === ov) _closeModal(); });
    document.body.appendChild(ov);
  }

  function _closeModal() {
    var ov = document.getElementById('hrm-modal-ov');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
  }
  window._closeModal = _closeModal;

  /* ── Misc utils ──────────────────────────────────────────────── */
  function _esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function _gv(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }
  function _hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) & 0xffffffff; }
    return h;
  }
  function _isoDate(dStr) {
    if (!dStr) return '';
    var m = dStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!m) return dStr;
    return m[3] + '-' + m[2].padStart(2,'0') + '-' + m[1].padStart(2,'0');
  }
  function _showEmpError(msg) {
    var el = document.getElementById('hrm-emp-list');
    if (el) el.innerHTML = '<div class="hrm-alert">' + _esc(msg) + '</div>';
  }

})();
