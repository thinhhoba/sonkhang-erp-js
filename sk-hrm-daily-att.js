/* ================================================================
 * sk-hrm-daily-att.js — SonKhang ERP v3.8.2
 * Module Cham Cong & Tinh Luong (port tu prCalcSummary)
 * 21/03/2026
 *
 * QUY TAC TINH LUONG (dong bo GAS):
 *   STD_WORK_DAYS = 28
 *   1 ca sang/chieu = 0.5 cong → 1 ngay du = 1.0 cong
 *   Luong = (baseSalary / 28) × workDays
 *   PC Xang/An = round((pc / 28) × workDays)
 *   PC Chuyen can / Trach nhiem = full if workDays >= 15, else 0
 * ================================================================ */
(function(){
  'use strict';

  /* ── Hằng số đồng bộ GAS ───────────────────────────────────── */
  var STD_WORK_DAYS = 28;
  var COND_THRESHOLD = 15;

  /* ── State ───────────────────────────────────────────────────── */
  var _s = {
    empList        : [],
    shiftMorning   : true,
    shiftAfternoon : true,
    tasks          : [],
    saving         : false,
    calcTimeout    : null,
    allowances     : { pc_xang:0, pc_an:0, pc_chuyen_can:0, pc_trach_nhiem:0 }
  };

  /* ── Helpers ─────────────────────────────────────────────────── */
  var _a   = function(){ return typeof window.api==='function'?window.api:typeof api==='function'?api:null; };
  var _esc = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var _gv  = function(id){ var e=document.getElementById(id); return e?e.value:''; };
  var _sv  = function(id,v){ var e=document.getElementById(id); if(e) e.value=v; };
  var _t   = function(m,t){ if(typeof window._hrmToast==='function') window._hrmToast(m,t||'ok'); };
  var _today = function(){
    var todayD = new Date().toISOString().split('T')[0];
    return todayD;
  };

  /* ── Định dạng tiền VND ──────────────────────────────────────── */
  function fmt(v) {
    var n = Number(v||0);
    if (n >= 1e9) return (n/1e9).toFixed(2) + ' t\u1ef7';
    if (n >= 1e6) return (n/1e6).toFixed(1) + ' tri\u1ec7u';
    if (n >= 1e3) return n.toLocaleString('vi-VN') + '\u0111';
    return n + '\u0111';
  }

  /* ================================================================
   * ENTRY POINT
   * ================================================================ */
  function loadDailyAtt() {
    var ct = typeof window.getContent==='function' ? window.getContent()
                                                   : document.getElementById('sk-ct');
    if (!ct) return;
    _injectCSS();
    ct.innerHTML = _shellHTML();
    _initModule();
  }
  window.loadDailyAtt   = loadDailyAtt;
  window.loadChamCong2  = loadDailyAtt;

  /* ================================================================
   * SHELL HTML (port tu template cũ)
   * ================================================================ */
  function _shellHTML() {
    var todayVal = _today();
    return '<div id="da-root" class="fade-in">'

      /* Header */
      + '<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
      +   '<div><h1 style="font-size:22px;font-weight:900;">\u23f0 Ch\u1ea5m c\u00f4ng</h1>'
      +   '<p style="font-size:12px;color:var(--text3);">Ghi nh\u1eadn theo ng\u00e0y — ' + todayVal + '</p></div>'
      +   '<div id="da-month-summary-badge"></div>'
      + '</div>'

      /* Main 2-col */
      + '<div id="pr-tab-attendance">'
      +   '<div style="display:grid;grid-template-columns:1fr 340px;gap:16px;">'

          /* LEFT: Form chấm công */
      +     '<div class="card" style="padding:24px;">'

              /* Nhân viên + Ngày */
      +       '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">'
      +         '<div>'
      +           '<div class="form-label">Nh\u00e2n vi\u00ean</div>'
      +           '<select class="form-input" id="pr-emp-select" onchange="prSyncForm()"></select>'
      +         '</div>'
      +         '<div>'
      +           '<div class="form-label">Ng\u00e0y</div>'
      +           '<div style="display:flex;gap:4px;align-items:center;">'
      +             '<button onclick="prChangeDate(-1)" class="btn-ghost" style="padding:8px;">&#9664;</button>'
      +             '<input class="form-input" type="date" id="pr-att-date" value="' + todayVal + '" onchange="prSyncForm()" style="flex:1;"/>'
      +             '<button onclick="prChangeDate(1)" class="btn-ghost" style="padding:8px;">&#9654;</button>'
      +           '</div>'
      +         '</div>'
      +       '</div>'

              /* Ca làm việc */
      +       '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">'
      +         '<div id="pr-shift-morning" onclick="prToggleShift(\'morning\')" class="da-shift-card da-shift-active">'
      +           '<div style="font-size:20px;">\u2600\ufe0f</div>'
      +           '<div class="da-shift-title">Ca S\u00e1ng</div>'
      +           '<div class="da-shift-time">08:00 \u2013 12:00</div>'
      +         '</div>'
      +         '<div id="pr-shift-afternoon" onclick="prToggleShift(\'afternoon\')" class="da-shift-card da-shift-active">'
      +           '<div style="font-size:20px;">\ud83c\udf24\ufe0f</div>'
      +           '<div class="da-shift-title">Ca Chi\u1ec1u</div>'
      +           '<div class="da-shift-time">13:30 \u2013 17:30</div>'
      +         '</div>'
      +       '</div>'

              /* Bến bãi + Tạm ứng */
      +       '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">'
      +         '<div>'
      +           '<div class="form-label">B\u1ebfn b\u00e3i (+)</div>'
      +           '<input class="form-input" type="number" id="pr-parking" value="0" oninput="prCalc()"/>'
      +         '</div>'
      +         '<div>'
      +           '<div class="form-label">T\u1ea1m \u1ee9ng (-)</div>'
      +           '<input class="form-input" type="number" id="pr-advance" value="0" oninput="prCalc()"/>'
      +         '</div>'
      +       '</div>'

              /* Tăng ca / Đầu việc */
      +       '<div style="margin-bottom:16px;">'
      +         '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
      +           '<div class="form-label">T\u0103ng ca / \u0110\u1ea7u vi\u1ec7c</div>'
      +           '<button onclick="prAddTask()" class="btn-ghost" style="padding:4px 10px;font-size:10px;">+ Th\u00eam</button>'
      +         '</div>'
      +         '<div id="pr-tasks-container" style="display:flex;flex-direction:column;gap:6px;"></div>'
      +       '</div>'

              /* Nút Lưu */
      +       '<button id="pr-save-btn" onclick="prSaveAttendance()" class="btn-primary" style="width:100%;padding:13px;font-size:12px;">'
      +         '\ud83d\udcbe L\u01b0u ch\u1ea5m c\u00f4ng'
      +       '</button>'
      +     '</div>'

          /* RIGHT: Sidebar thu nhập */
      +     '<div>'

              /* Thu nhập tháng */
      +       '<div class="da-income-card">'
      +         '<h3 class="da-income-title">Thu nh\u1eadp th\u00e1ng n\u00e0y</h3>'
      +         '<div id="pr-summary-rows" style="display:flex;flex-direction:column;gap:10px;"></div>'
      +         '<div class="da-income-total-row">'
      +           '<span class="da-income-total-label">Th\u1ef1c nh\u1eadn</span>'
      +           '<span id="pr-grand-total" class="da-income-total-val">0\u0111</span>'
      +         '</div>'
      +       '</div>'

              /* Phụ cấp tháng */
      +       '<div class="card" style="padding:16px;margin-top:12px;">'
      +         '<h3 class="form-label" style="margin-bottom:12px;">Ph\u1ee5 c\u1ea5p & B\u1ea3o hi\u1ec3m th\u00e1ng</h3>'
      +         '<div style="display:flex;flex-direction:column;gap:8px;">'

                  /* PC theo ngày công */
      +           '<div class="da-allow-box da-allow-cyan">'
      +             '<div class="da-allow-title" style="color:var(--cyan);">PC THEO NG\u00c0Y C\u00d4NG (\u00f728\u00d7C\u00d4NG)</div>'
      +             '<div class="da-allow-row">'
      +               '<span class="da-allow-label">X\u0103ng xe</span>'
      +               '<input class="form-input" type="number" id="pr-allow-gas" value="0" oninput="prSaveBonus()" style="flex:1;padding:5px;"/>'
      +             '</div>'
      +             '<div class="da-allow-row" style="margin-top:5px;">'
      +               '<span class="da-allow-label">\u0102n tr\u01b0a</span>'
      +               '<input class="form-input" type="number" id="pr-allow-lunch" value="0" oninput="prSaveBonus()" style="flex:1;padding:5px;"/>'
      +             '</div>'
      +           '</div>'

                  /* PC có điều kiện */
      +           '<div class="da-allow-box da-allow-yellow">'
      +             '<div style="display:flex;justify-content:space-between;margin-bottom:7px;">'
      +               '<span class="da-allow-title" style="color:var(--yellow);">PC C\u00d3 \u0110I\u1ec0U KI\u1ec6N (\u226515 NG\u00c0Y)</span>'
      +               '<span id="pr-cond-status" style="font-size:8px;font-weight:700;"></span>'
      +             '</div>'
      +             '<div class="da-allow-row">'
      +               '<span class="da-allow-label">Chuy\u00ean c\u1ea7n</span>'
      +               '<input class="form-input" type="number" id="pr-allow-attendance" value="0" oninput="prSaveBonus()" style="flex:1;padding:5px;"/>'
      +             '</div>'
      +             '<div class="da-allow-row" style="margin-top:5px;">'
      +               '<span class="da-allow-label">Tr\u00e1ch nhi\u1ec7m</span>'
      +               '<input class="form-input" type="number" id="pr-allow-responsibility" value="0" oninput="prSaveBonus()" style="flex:1;padding:5px;"/>'
      +             '</div>'
      +           '</div>'
      +         '</div>'
      +       '</div>'

              /* Calendar tháng */
      +       '<div id="da-calendar" style="margin-top:12px;"></div>'
      +     '</div>'
      +   '</div>'
      + '</div>'
      + '</div>';
  }

  /* ================================================================
   * KHỞI TẠO
   * ================================================================ */
  function _initModule() {
    var apiF = _a(); if (!apiF) return;
    apiF('att_get_emp_list', {}, function(e,d){
      var sel = document.getElementById('pr-emp-select'); if(!sel) return;
      if(e||!d||!d.ok||!d.data.length){
        sel.innerHTML = '<option value="">Ch\u01b0a c\u00f3 nh\u00e2n vi\u00ean</option>'; return;
      }
      _s.empList = d.data;
      sel.innerHTML = '<option value="">-- Ch\u1ecdn nh\u00e2n vi\u00ean --</option>'
        + d.data.map(function(emp){
            return '<option value="'+_esc(emp.id)+'" data-sal="'+emp.base_salary+'">'
              + _esc(emp.name)+' ('+_esc(emp.role)+')</option>';
          }).join('');

      /* Nếu user đang login là NV → auto chọn */
      var user = window._auth && window._auth.user;
      if (user && user.emp_id) {
        sel.value = user.emp_id;
        if (!sel.value && d.data.length) sel.value = d.data[0].id;
      } else if (d.data.length) {
        sel.value = d.data[0].id;
      }
      prSyncForm();
    });
  }

  /* ================================================================
   * SYNC FORM — load dữ liệu ngày đang chọn
   * ================================================================ */
  function prSyncForm() {
    var empId   = _gv('pr-emp-select');
    var dateVal = _gv('pr-att-date') || _today();
    if (!empId) return;

    var apiF = _a(); if (!apiF) return;

    /* Load bản ghi ngày */
    apiF('att_get_daily', { emp_id:empId, date:dateVal }, function(e,d){
      if (e||!d||!d.ok) return;
      _s.shiftMorning   = d.shift_morning   !== false;
      _s.shiftAfternoon = d.shift_afternoon !== false;
      _sv('pr-parking', d.parking_fee     || 0);
      _sv('pr-advance', d.advance_payment || 0);
      _s.tasks = d.tasks || [];
      prUpdateShiftUI();
      prRenderTasks();
    });

    /* Load phụ cấp tháng */
    var parts = dateVal.split('-');
    apiF('att_get_monthly_allowances',
      { emp_id:empId, month:Number(parts[1]), year:Number(parts[0]) },
      function(e,d){
        if (e||!d||!d.ok) return;
        _sv('pr-allow-gas',            d.pc_xang        || 0);
        _sv('pr-allow-lunch',          d.pc_an          || 0);
        _sv('pr-allow-attendance',     d.pc_chuyen_can  || 0);
        _sv('pr-allow-responsibility', d.pc_trach_nhiem || 0);
        _s.allowances = { pc_xang:d.pc_xang||0, pc_an:d.pc_an||0,
                          pc_chuyen_can:d.pc_chuyen_can||0, pc_trach_nhiem:d.pc_trach_nhiem||0 };
        prUpdateCondStatus();
        prCalc();
        _loadCalendar(empId, Number(parts[0]), Number(parts[1]));
    });
  }
  window.prSyncForm = prSyncForm;

  /* ================================================================
   * SHIFT TOGGLE
   * ================================================================ */
  function prToggleShift(shift) {
    if (shift === 'morning')   _s.shiftMorning   = !_s.shiftMorning;
    else                       _s.shiftAfternoon = !_s.shiftAfternoon;
    prUpdateShiftUI();
    prCalc();
    prUpdateCondStatus();
  }
  window.prToggleShift = prToggleShift;

  function prUpdateShiftUI() {
    _setShiftStyle('pr-shift-morning',   _s.shiftMorning);
    _setShiftStyle('pr-shift-afternoon', _s.shiftAfternoon);
  }
  window.prUpdateShiftUI = prUpdateShiftUI;

  function _setShiftStyle(id, active) {
    var el = document.getElementById(id); if (!el) return;
    if (active) {
      el.style.border      = '2px solid var(--accent)';
      el.style.background  = 'rgba(61,107,255,0.08)';
      el.querySelector('.da-shift-title').style.color = 'var(--accent2)';
    } else {
      el.style.border      = '2px solid var(--border)';
      el.style.background  = 'var(--bg3)';
      el.querySelector('.da-shift-title').style.color = 'var(--text3)';
    }
  }

  /* ================================================================
   * DATE NAVIGATION
   * ================================================================ */
  function prChangeDate(delta) {
    var el = document.getElementById('pr-att-date'); if (!el) return;
    var d  = new Date(el.value + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    el.value = d.toISOString().split('T')[0];
    prSyncForm();
  }
  window.prChangeDate = prChangeDate;

  /* ================================================================
   * TASKS (Tăng ca)
   * ================================================================ */
  function prAddTask() {
    _s.tasks.push({ id: String(Date.now()), description:'', amount:0 });
    prRenderTasks();
  }
  window.prAddTask = prAddTask;

  function prRemoveTask(idx) {
    _s.tasks.splice(idx, 1);
    prRenderTasks();
    prCalc();
  }
  window.prRemoveTask = prRemoveTask;

  function prRenderTasks() {
    var ct = document.getElementById('pr-tasks-container'); if (!ct) return;
    ct.innerHTML = _s.tasks.map(function(t, i){
      return '<div style="display:flex;gap:6px;align-items:center;">'
        + '<input class="form-input" value="'+_esc(t.description||'')+'"'
        +   ' oninput="_prTaskDesc('+i+',this.value)"'
        +   ' placeholder="M\u00f4 t\u1ea3..." style="flex:1;padding:8px;"/>'
        + '<input class="form-input" type="number" value="'+(t.amount||0)+'"'
        +   ' oninput="_prTaskAmt('+i+',this.value)"'
        +   ' placeholder="0" style="width:100px;padding:8px;"/>'
        + '<button class="btn-danger" onclick="prRemoveTask('+i+')" style="padding:6px 8px;">\u2715</button>'
        + '</div>';
    }).join('');
  }
  window.prRenderTasks = prRenderTasks;

  function _prTaskDesc(i, v) { if(_s.tasks[i]) _s.tasks[i].description = v; prCalc(); }
  function _prTaskAmt(i, v)  { if(_s.tasks[i]) _s.tasks[i].amount = Number(v)||0; prCalc(); }
  window._prTaskDesc = _prTaskDesc;
  window._prTaskAmt  = _prTaskAmt;

  /* ================================================================
   * TÍNH TOÁN REAL-TIME (port prCalcSummary — CLIENT SIDE estimate)
   * Kết quả chính xác nhất từ GAS att_calc_month_summary
   * ================================================================ */
  function prCalc() {
    clearTimeout(_s.calcTimeout);
    _s.calcTimeout = setTimeout(_doCalc, 300);
  }
  window.prCalc = prCalc;

  function _doCalc() {
    var empId   = _gv('pr-emp-select');
    var dateVal = _gv('pr-att-date') || _today();
    if (!empId) return;

    var apiF = _a(); if (!apiF) return;
    var parts = dateVal.split('-');
    apiF('att_calc_month_summary',
      { emp_id:empId, month:Number(parts[1]), year:Number(parts[0]) },
      function(e,d){
        if (e||!d||!d.ok) return;
        _renderSummary(d);
    });
  }

  function _renderSummary(s) {
    var row = function(label, val, color) {
      return '<div style="display:flex;justify-content:space-between;margin-bottom:5px;">'
        + '<span style="color:#6b8fd4;font-size:10px;">'+label+'</span>'
        + '<span style="color:'+(color||'#e8ecf4')+';font-size:11px;font-weight:700;">'+val+'</span>'
        + '</div>';
    };

    var html = '';
    html += row('L\u01b0\u01a1ng h\u1ee3p \u0111\u1ed3ng ('+(s.work_days||0)+'c/'+(s.std_days||28)+')', fmt(s.daily_fixed));
    if (s.pc_xang_earned)  html += row('\u26fd X\u0103ng xe', fmt(s.pc_xang_earned));
    if (s.pc_an_earned)    html += row('\ud83c\udf5c \u0102n tr\u01b0a', fmt(s.pc_an_earned));
    if (s.pc_chuyen_can_earned)   html += row('\u2705 Chuy\u00ean c\u1ea7n', fmt(s.pc_chuyen_can_earned));
    if (s.pc_trach_nhiem_earned)  html += row('\ud83c\udfc5 Tr\u00e1ch nhi\u1ec7m', fmt(s.pc_trach_nhiem_earned));
    if (s.total_ot)    html += row('\u23f1\ufe0f T\u0103ng ca', fmt(s.total_ot));
    if (s.total_park)  html += row('\ud83c\udfd7\ufe0f B\u1ebfn b\u00e3i', '+'+fmt(s.total_park));
    if (s.total_adv)   html += row('\ud83d\udcb8 T\u1ea1m \u1ee9ng', '-'+fmt(s.total_adv), 'var(--red)');

    /* Điều kiện chuyên cần */
    var condEl = document.getElementById('pr-cond-status');
    if (condEl) {
      condEl.textContent = s.cond_met
        ? '\u2705 \u0110\u1ee7 (\u2265'+COND_THRESHOLD+'c) \u2014 '+(s.work_days||0)+'c'
        : '\u26a0\ufe0f Ch\u01b0a \u0111\u1ee7 \u2014 '+(s.work_days||0)+'/'+(COND_THRESHOLD)+'c';
      condEl.style.color = s.cond_met ? 'var(--green)' : 'var(--yellow)';
    }

    var rowsEl = document.getElementById('pr-summary-rows');
    if (rowsEl) rowsEl.innerHTML = html;

    var totalEl = document.getElementById('pr-grand-total');
    if (totalEl) totalEl.textContent = fmt(s.grand_total);
  }

  /* ================================================================
   * LƯU CHẤM CÔNG
   * ================================================================ */
  function prSaveAttendance() {
    var empId   = _gv('pr-emp-select');
    var dateVal = _gv('pr-att-date');
    if (!empId || !dateVal) { _t('Ch\u1ecdn nh\u00e2n vi\u00ean v\u00e0 ng\u00e0y', 'error'); return; }
    if (_s.saving) return;
    _s.saving = true;

    var btn = document.getElementById('pr-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = '\u0110ang l\u01b0u...'; }

    var apiF = _a(); if (!apiF) return;
    apiF('att_save_daily', {
      emp_id          : empId,
      date            : dateVal,
      shift_morning   : _s.shiftMorning,
      shift_afternoon : _s.shiftAfternoon,
      parking_fee     : Number(_gv('pr-parking') || 0),
      advance_payment : Number(_gv('pr-advance') || 0),
      tasks           : _s.tasks,
      note            : ''
    }, function(e,d){
      _s.saving = false;
      if (btn) { btn.disabled = false; btn.textContent = '\ud83d\udcbe L\u01b0u ch\u1ea5m c\u00f4ng'; }
      if (e||!d||!d.ok){ _t((d&&d.error)||'L\u1ed7i l\u01b0u', 'error'); return; }
      _t('\u2705 \u0110\u00e3 l\u01b0u ng\u00e0y '+dateVal, 'ok');
      /* Refresh calendar + summary */
      var parts = dateVal.split('-');
      _loadCalendar(empId, Number(parts[0]), Number(parts[1]));
      _doCalc();
      prUpdateCondStatus();
    });
  }
  window.prSaveAttendance = prSaveAttendance;

  /* ================================================================
   * LƯU PHỤ CẤP THÁNG
   * ================================================================ */
  function prSaveBonus() {
    var empId   = _gv('pr-emp-select');
    var dateVal = _gv('pr-att-date') || _today();
    if (!empId) return;

    var parts = dateVal.split('-');
    var apiF  = _a(); if (!apiF) return;
    apiF('att_save_monthly_allowances', {
      emp_id          : empId,
      month           : Number(parts[1]),
      year            : Number(parts[0]),
      pc_xang         : Number(_gv('pr-allow-gas')            || 0),
      pc_an           : Number(_gv('pr-allow-lunch')          || 0),
      pc_chuyen_can   : Number(_gv('pr-allow-attendance')     || 0),
      pc_trach_nhiem  : Number(_gv('pr-allow-responsibility') || 0)
    }, function(e,d){
      if (e||!d||!d.ok) return;
      prUpdateCondStatus();
      _doCalc();
    });
  }
  window.prSaveBonus = prSaveBonus;

  /* ================================================================
   * CẬP NHẬT TRẠNG THÁI CHUYÊN CẦN (real-time từ GAS)
   * ================================================================ */
  function prUpdateCondStatus() {
    var empId   = _gv('pr-emp-select');
    var dateVal = _gv('pr-att-date') || _today();
    if (!empId) return;
    var parts = dateVal.split('-');
    var apiF  = _a(); if (!apiF) return;
    apiF('att_calc_month_summary',
      { emp_id:empId, month:Number(parts[1]), year:Number(parts[0]) },
      function(e,d){
        if (e||!d||!d.ok) return;
        var el = document.getElementById('pr-cond-status'); if (!el) return;
        el.textContent = d.cond_met
          ? '\u2705 \u0110\u1ee7 \u0111i\u1ec1u ki\u1ec7n ('+d.work_days+'c)'
          : '\u26a0\ufe0f Ch\u01b0a \u0111\u1ee7 ('+d.work_days+'/'+d.cond_threshold+'c)';
        el.style.color = d.cond_met ? 'var(--green)' : 'var(--yellow)';
    });
  }
  window.prUpdateCondStatus = prUpdateCondStatus;

  /* ================================================================
   * CALENDAR VIEW THÁNG
   * ================================================================ */
  function _loadCalendar(empId, year, month) {
    var apiF = _a(); if (!apiF) return;
    apiF('att_get_month_calendar', { emp_id:empId, month:month, year:year }, function(e,d){
      var el = document.getElementById('da-calendar'); if (!el||e||!d||!d.ok) return;
      el.innerHTML = _renderCalendar(d, year, month);
    });
  }

  function _renderCalendar(d, year, month) {
    var DOW_LABELS = ['CN','T2','T3','T4','T5','T6','T7'];
    var MONTHS     = ['','Th\u00e1ng 1','Th\u00e1ng 2','Th\u00e1ng 3','Th\u00e1ng 4',
                      'Th\u00e1ng 5','Th\u00e1ng 6','Th\u00e1ng 7','Th\u00e1ng 8',
                      'Th\u00e1ng 9','Th\u00e1ng 10','Th\u00e1ng 11','Th\u00e1ng 12'];

    /* DOW header */
    var html = '<div class="card" style="padding:14px;">'
      + '<div style="font-size:10px;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:10px;">'
      + '\ud83d\udcc5 '+MONTHS[month]+'/'+year
      + '</div>'
      + '<div class="da-cal-grid">'
      + DOW_LABELS.map(function(l){
          return '<div class="da-cal-dow">'+l+'</div>';
        }).join('');

    /* Leading empty cells */
    var firstDow = d.days.length ? d.days[0].dow : 0;
    for (var empty = 0; empty < firstDow; empty++) {
      html += '<div></div>';
    }

    /* Day cells */
    var today = _today();
    d.days.forEach(function(day){
      var cls   = 'da-cal-day';
      if (day.is_weekend)  cls += ' da-cal-weekend';
      if (day.date === today) cls += ' da-cal-today';
      var work  = day.work_days;
      var bg    = !day.has_record ? '' :
                   work === 1.0   ? 'background:rgba(16,214,140,.12);border-color:rgba(16,214,140,.3);' :
                   work === 0.5   ? 'background:rgba(251,191,36,.1);border-color:rgba(251,191,36,.3);'  :
                                    'background:rgba(255,77,109,.08);border-color:rgba(255,77,109,.25);';
      html += '<div class="'+cls+'" style="'+bg+'" onclick="_daSelectDay(\''+day.date+'\')" title="'+day.date+'">'
        + '<div class="da-cal-num">'+day.day+'</div>'
        + (day.has_record
            ? '<div class="da-cal-dot" style="color:'+(work===1?'var(--green)':work===0.5?'var(--yellow)':'var(--text3)')+';">'
              + (work===1 ? '\u2022\u2022' : work===0.5 ? '\u2022' : '\u00d7')+'</div>'
            : '')
        + '</div>';
    });

    html += '</div>'
      /* Legend */
      + '<div style="display:flex;gap:12px;margin-top:10px;font-size:9px;color:var(--text3);">'
      + '<span style="color:var(--green);">\u2022\u2022 \u0110\u1ee7 c\u00f4ng</span>'
      + '<span style="color:var(--yellow);">\u2022 N\u1eeda c\u00f4ng</span>'
      + '<span style="color:var(--text3);">(tr\u1ed1ng) Ch\u01b0a ch\u1ea5m</span>'
      + '</div>'
      + '</div>';
    return html;
  }

  function _daSelectDay(date) {
    var el = document.getElementById('pr-att-date');
    if (el) { el.value = date; prSyncForm(); }
  }
  window._daSelectDay = _daSelectDay;

  /* ================================================================
   * CSS INJECTION
   * ================================================================ */
  function _injectCSS() {
    if (document.getElementById('sk-da-css')) return;
    var s = document.createElement('style');
    s.id = 'sk-da-css';
    s.textContent = [
      /* Income card */
      '.da-income-card{background:linear-gradient(135deg,#0d1730,#111832);border:1px solid #1e2d50;border-radius:16px;padding:20px;}',
      '.da-income-title{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.12em;color:#6b8fd4;border-bottom:1px solid #1e2d50;padding-bottom:10px;margin-bottom:14px;}',
      '.da-income-total-row{margin-top:14px;padding-top:14px;border-top:1px solid #1e2d50;display:flex;justify-content:space-between;align-items:center;}',
      '.da-income-total-label{font-size:10px;font-weight:900;text-transform:uppercase;color:#6b8fd4;}',
      '.da-income-total-val{font-family:"JetBrains Mono",monospace;font-size:22px;font-weight:700;color:var(--yellow);}',
      /* Shift cards */
      '.da-shift-card{padding:14px;border-radius:12px;cursor:pointer;text-align:center;transition:all .2s;}',
      '.da-shift-active{border:2px solid var(--accent);background:rgba(61,107,255,0.08);}',
      '.da-shift-title{font-size:11px;font-weight:800;margin-top:4px;}',
      '.da-shift-time{font-size:9px;color:var(--text3);}',
      /* Allowance boxes */
      '.da-allow-box{border-radius:8px;padding:10px;}',
      '.da-allow-cyan{background:rgba(6,182,212,.06);border:1px solid rgba(6,182,212,.15);}',
      '.da-allow-yellow{background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.2);}',
      '.da-allow-title{font-size:8px;font-weight:900;margin-bottom:7px;}',
      '.da-allow-row{display:flex;gap:5px;align-items:center;}',
      '.da-allow-label{font-size:9px;width:70px;color:var(--text2);flex-shrink:0;}',
      /* Calendar */
      '.da-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;}',
      '.da-cal-dow{font-size:8px;font-weight:800;text-align:center;color:var(--text3);padding:3px 0;}',
      '.da-cal-day{border:1px solid var(--border);border-radius:6px;padding:4px 2px;text-align:center;cursor:pointer;transition:all .15s;min-height:34px;}',
      '.da-cal-day:hover{border-color:var(--accent);background:rgba(61,107,255,.08);}',
      '.da-cal-today{border-color:var(--accent)!important;background:rgba(61,107,255,.12)!important;}',
      '.da-cal-weekend{color:var(--red);opacity:.6;}',
      '.da-cal-num{font-size:10px;font-weight:700;}',
      '.da-cal-dot{font-size:10px;line-height:1;}',
      /* Responsive */
      '@media(max-width:700px){#pr-tab-attendance>div{grid-template-columns:1fr!important;}.da-income-card{margin-top:12px;}}'
    ].join('');
    document.head.appendChild(s);
  }

})();
