/* ================================================================
 * sk-hrm-daily-att.js — SonKhang ERP v3.9
 * Module Chấm Công & Tính Lương
 * Port đúng cấu trúc từ prCalcSummary() của hệ thống cũ
 * 21/03/2026
 *
 * KIẾN TRÚC:
 *   - State local (giống cũ) → UI phản hồi tức thì, không chờ API
 *   - GAS API làm backend persistence (async, non-blocking)
 *   - prCalcSummary() tính toán local, kết quả từ GAS chỉ để verify
 *
 * QUY TẮC TÍNH LƯƠNG (đồng bộ GAS):
 *   STD_WORK_DAYS = 28
 *   1 ca sáng = 0.5 công | 1 ca chiều = 0.5 công
 *   dailyFixed = baseSalary / 28 × workDays
 *   pcXang/An = round(pc / 28 × workDays)
 *   condMet = workDays >= 15
 *   pcChuyenCan/TrachNhiem = condMet ? full : 0
 *
 * LỖI ĐÃ BIẾT - TRÁNH:
 *   - Không dùng tiếng Việt có dấu trong tên hàm/biến (loadKeToán → lỗi)
 *   - Không dùng new Date() inline trong HTML string concat
 *   - Không dùng regex /pattern/i với dấu nháy trong character class
 *   - Không để bare newline trong JS string (Python heredoc)
 * ================================================================ */
(function () {
  'use strict';

  /* ── Hằng số (đồng bộ GAS HRM_DailyAttendance.gs) ─────────── */
  var STD_WORK_DAYS  = 28;
  var COND_THRESHOLD = 15;

  /* ── State cục bộ (giống hệ thống cũ) ─────────────────────── */
  var _prEmployees   = [];   // danh sách NV từ GAS
  var _prRecords     = {};   // { "empId_yyyy-MM-dd": record } cache từ GAS
  var _prBonuses     = {};   // { "empId_year_month": bonuses } cache từ GAS
  var _prShiftMorning   = true;
  var _prShiftAfternoon = true;
  var _prTasks          = [];
  var _prSaving         = false;

  /* ── Helpers ────────────────────────────────────────────────── */
  var _api   = function () { return typeof window.api === 'function' ? window.api : typeof api === 'function' ? api : null; };
  var _esc   = function (s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var _gv    = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
  var _sv    = function (id, v) { var e = document.getElementById(id); if (e) e.value = v; };
  var _toast = function (m, t) { if (typeof window._hrmToast === 'function') window._hrmToast(m, t || 'ok'); };

  /* Định dạng tiền VND */
  function fmt(v) {
    var n = Number(v || 0);
    if (n >= 1e9) return (n / 1e9).toFixed(2) + ' t\u1ef7';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + ' tri\u1ec7u';
    return n.toLocaleString('vi-VN') + '\u0111';
  }

  /* Lấy ngày hôm nay dạng yyyy-MM-dd (KHÔNG dùng inline) */
  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }

  /* Key cache bản ghi ngày */
  function _recKey(empId, date)   { return empId + '_' + date; }
  /* Key cache phụ cấp tháng */
  function _bonKey(empId, y, m)   { return empId + '_' + y + '_' + m; }

  /* ================================================================
   * ENTRY POINT
   * ================================================================ */
  function loadDailyAtt() {
    var ct = typeof window.getContent === 'function'
      ? window.getContent()
      : document.getElementById('sk-ct');
    if (!ct) return;
    _injectCSS();
    ct.innerHTML = _buildShell();
    _loadEmpList();
  }
  window.loadDailyAtt  = loadDailyAtt;
  window.loadChamCong2 = loadDailyAtt;

  /* ================================================================
   * SHELL HTML — sao chép đúng cấu trúc từ template cũ
   * ================================================================ */
  function _buildShell() {
    var tv = todayStr();
    return (
      '<div id="da-root" class="fade-in">' +

      /* ── Header ── */
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">' +
        '<div>' +
          '<h1 style="font-size:22px;font-weight:900;">\u23f0 Ch\u1ea5m c\u00f4ng</h1>' +
          '<p style="font-size:12px;color:var(--text3);">Ghi nh\u1eadn theo ng\u00e0y \u2014 m\u1ed7i ca = 0.5 c\u00f4ng</p>' +
        '</div>' +
      '</div>' +

      /* ── 2-col layout (đúng template cũ) ── */
      '<div id="pr-tab-attendance">' +
      '<div style="display:grid;grid-template-columns:1fr 340px;gap:16px;">' +

        /* ===== CỘT TRÁI: Form chấm công ===== */
        '<div class="card" style="padding:24px;">' +

          /* Nhân viên + Ngày */
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
            '<div>' +
              '<div class="form-label">Nh\u00e2n vi\u00ean</div>' +
              '<select class="form-input" id="pr-emp-select" onchange="prSyncForm()"></select>' +
            '</div>' +
            '<div>' +
              '<div class="form-label">Ng\u00e0y</div>' +
              '<div style="display:flex;gap:4px;align-items:center;">' +
                '<button onclick="prChangeDate(-1)" class="btn-ghost" style="padding:8px;">&#9664;</button>' +
                '<input class="form-input" type="date" id="pr-att-date" value="' + tv + '" onchange="prSyncForm()" style="flex:1;"/>' +
                '<button onclick="prChangeDate(1)" class="btn-ghost" style="padding:8px;">&#9654;</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* Ca làm việc */
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">' +
            '<div id="pr-shift-morning" onclick="prToggleShift(\'morning\')" class="da-shift-card da-shift-on">' +
              '<div style="font-size:20px;">\u2600\ufe0f</div>' +
              '<div class="da-shift-title">Ca S\u00e1ng</div>' +
              '<div class="da-shift-time">08:00 \u2013 12:00</div>' +
            '</div>' +
            '<div id="pr-shift-afternoon" onclick="prToggleShift(\'afternoon\')" class="da-shift-card da-shift-on">' +
              '<div style="font-size:20px;">\ud83c\udf24\ufe0f</div>' +
              '<div class="da-shift-title">Ca Chi\u1ec1u</div>' +
              '<div class="da-shift-time">13:30 \u2013 17:30</div>' +
            '</div>' +
          '</div>' +

          /* Bến bãi + Tạm ứng */
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">' +
            '<div>' +
              '<div class="form-label">B\u1ebfn b\u00e3i (+)</div>' +
              '<input class="form-input" type="number" id="pr-parking" value="0" oninput="prCalc()"/>' +
            '</div>' +
            '<div>' +
              '<div class="form-label">T\u1ea1m \u1ee9ng (-)</div>' +
              '<input class="form-input" type="number" id="pr-advance" value="0" oninput="prCalc()"/>' +
            '</div>' +
          '</div>' +

          /* Tăng ca / Đầu việc */
          '<div style="margin-bottom:16px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
              '<div class="form-label">T\u0103ng ca / \u0110\u1ea7u vi\u1ec7c</div>' +
              '<button onclick="prAddTask()" class="btn-ghost" style="padding:4px 10px;font-size:10px;">+ Th\u00eam</button>' +
            '</div>' +
            '<div id="pr-tasks-container" style="display:flex;flex-direction:column;gap:6px;"></div>' +
          '</div>' +

          /* Lưu */
          '<button id="pr-save-btn" onclick="prSaveAttendance()" class="btn-primary" style="width:100%;padding:13px;font-size:12px;">' +
            '\ud83d\udcbe L\u01b0u ch\u1ea5m c\u00f4ng' +
          '</button>' +
        '</div>' +

        /* ===== CỘT PHẢI: Sidebar thu nhập ===== */
        '<div>' +

          /* Thu nhập tháng (đúng style template cũ) */
          '<div style="background:linear-gradient(135deg,#0d1730,#111832);border:1px solid #1e2d50;border-radius:16px;padding:20px;">' +
            '<h3 style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.12em;color:#6b8fd4;border-bottom:1px solid #1e2d50;padding-bottom:10px;margin-bottom:14px;">Thu nh\u1eadp th\u00e1ng n\u00e0y</h3>' +
            '<div>' +
              '<div id="pr-summary-rows" style="display:flex;flex-direction:column;gap:10px;"></div>' +
              '<div style="margin-top:14px;padding-top:14px;border-top:1px solid #1e2d50;display:flex;justify-content:space-between;align-items:center;">' +
                '<span style="font-size:10px;font-weight:900;text-transform:uppercase;color:#6b8fd4;">Th\u1ef1c nh\u1eadn</span>' +
                '<span id="pr-grand-total" style="font-family:\'JetBrains Mono\',monospace;font-size:22px;font-weight:700;color:#fbbf24;">0\u0111</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* Phụ cấp tháng */
          '<div class="card" style="padding:16px;margin-top:12px;">' +
            '<h3 class="form-label" style="margin-bottom:12px;">Ph\u1ee5 c\u1ea5p & B\u1ea3o hi\u1ec3m th\u00e1ng</h3>' +
            '<div style="display:flex;flex-direction:column;gap:8px;">' +

              /* Nhóm 1: theo ngày công */
              '<div style="background:rgba(6,182,212,.06);border:1px solid rgba(6,182,212,.15);border-radius:8px;padding:10px;">' +
                '<div style="font-size:8px;font-weight:900;color:var(--cyan);margin-bottom:7px;">PC THEO NG\u00c0Y C\u00d4NG (\u00f728\u00d7C\u00d4NG)</div>' +
                '<div style="display:flex;gap:5px;margin-bottom:5px;">' +
                  '<span style="font-size:9px;width:70px;line-height:32px;">X\u0103ng xe</span>' +
                  '<input class="form-input" type="number" id="pr-allow-gas" value="0" oninput="prSaveBonus()" style="flex:1;padding:5px;"/>' +
                '</div>' +
                '<div style="display:flex;gap:5px;">' +
                  '<span style="font-size:9px;width:70px;line-height:32px;">\u0102n tr\u01b0a</span>' +
                  '<input class="form-input" type="number" id="pr-allow-lunch" value="0" oninput="prSaveBonus()" style="flex:1;padding:5px;"/>' +
                '</div>' +
              '</div>' +

              /* Nhóm 2: có điều kiện */
              '<div style="background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.2);border-radius:8px;padding:10px;">' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:7px;">' +
                  '<span style="font-size:8px;font-weight:900;color:var(--yellow);">PC C\u00d3 \u0110I\u1ec0U KI\u1ec6N (\u226515 NG\u00c0Y)</span>' +
                  '<span id="pr-cond-status" style="font-size:8px;font-weight:700;"></span>' +
                '</div>' +
                '<div style="display:flex;gap:5px;margin-bottom:5px;">' +
                  '<span style="font-size:9px;width:70px;line-height:32px;">Chuy\u00ean c\u1ea7n</span>' +
                  '<input class="form-input" type="number" id="pr-allow-attendance" value="0" oninput="prSaveBonus()" style="flex:1;padding:5px;"/>' +
                '</div>' +
                '<div style="display:flex;gap:5px;">' +
                  '<span style="font-size:9px;width:70px;line-height:32px;">Tr\u00e1ch nhi\u1ec7m</span>' +
                  '<input class="form-input" type="number" id="pr-allow-responsibility" value="0" oninput="prSaveBonus()" style="flex:1;padding:5px;"/>' +
                '</div>' +
              '</div>' +

            '</div>' +
          '</div>' +

          /* Calendar mini */
          '<div id="da-cal-wrap" style="margin-top:12px;"></div>' +

        '</div>' + /* end cột phải */
      '</div>' +   /* end grid */
      '</div>' +   /* end pr-tab-attendance */
      '</div>'     /* end da-root */
    );
  }

  /* ================================================================
   * LOAD DANH SÁCH NHÂN VIÊN
   * ================================================================ */
  function _loadEmpList() {
    var apiF = _api(); if (!apiF) return;
    apiF('att_get_emp_list', {}, function (e, d) {
      var sel = document.getElementById('pr-emp-select'); if (!sel) return;
      if (e || !d || !d.ok || !d.data.length) {
        sel.innerHTML = '<option value="">-- Ch\u01b0a c\u00f3 nh\u00e2n vi\u00ean --</option>';
        return;
      }
      _prEmployees = d.data;
      sel.innerHTML = '<option value="">-- Ch\u1ecdn nh\u00e2n vi\u00ean --</option>'
        + d.data.map(function (emp) {
            return '<option value="' + _esc(emp.id) + '" data-sal="' + (emp.base_salary || 0) + '">'
              + _esc(emp.name) + ' (' + _esc(emp.role) + ')'
              + '</option>';
          }).join('');

      /* Auto-chọn NV của user đang login */
      var user = window._auth && window._auth.user;
      var empId = user && user.emp_id ? user.emp_id : '';
      if (empId) {
        sel.value = empId;
      }
      if (!sel.value && d.data.length) {
        sel.value = d.data[0].id;
      }
      prSyncForm();
    });
  }

  /* ================================================================
   * SYNC FORM — load dữ liệu ngày đang chọn vào UI
   * Ưu tiên cache local, sau đó gọi GAS
   * ================================================================ */
  function prSyncForm() {
    var empId   = _gv('pr-emp-select');
    var dateVal = _gv('pr-att-date') || todayStr();
    if (!empId) return;

    /* Thử lấy từ cache local trước */
    var rk  = _recKey(empId, dateVal);
    var rec = _prRecords[rk];
    if (rec) {
      _applyRecToForm(rec);
    } else {
      /* Gọi GAS nếu chưa có trong cache */
      var apiF = _api(); if (!apiF) return;
      apiF('att_get_daily', { emp_id: empId, date: dateVal }, function (e, d) {
        if (!e && d && d.ok) {
          _prRecords[rk] = d;
          _applyRecToForm(d);
        } else {
          /* Không có bản ghi → reset về mặc định */
          _prShiftMorning   = true;
          _prShiftAfternoon = true;
          _sv('pr-parking', 0);
          _sv('pr-advance', 0);
          _prTasks = [];
          _updateShiftUI();
          _renderTasks();
        }
      });
    }

    /* Load phụ cấp tháng */
    var parts  = dateVal.split('-');
    var year   = Number(parts[0]);
    var month  = Number(parts[1]);
    var bk     = _bonKey(empId, year, month);
    var cached = _prBonuses[bk];
    if (cached) {
      _applyBonusToForm(cached);
      prUpdateCondStatus();
      prCalc();
    } else {
      var apiF2 = _api(); if (!apiF2) return;
      apiF2('att_get_monthly_allowances', { emp_id: empId, month: month, year: year }, function (e, d) {
        if (!e && d && d.ok) {
          _prBonuses[bk] = d;
          _applyBonusToForm(d);
        }
        prUpdateCondStatus();
        prCalc();
        _loadCalendar(empId, year, month);
      });
    }
  }
  window.prSyncForm = prSyncForm;

  function _applyRecToForm(rec) {
    _prShiftMorning   = rec.shift_morning   !== false;
    _prShiftAfternoon = rec.shift_afternoon !== false;
    _sv('pr-parking', rec.parking_fee     || 0);
    _sv('pr-advance', rec.advance_payment || 0);
    _prTasks = rec.tasks ? JSON.parse(JSON.stringify(rec.tasks)) : [];
    _updateShiftUI();
    _renderTasks();
    prCalc();
  }

  function _applyBonusToForm(bon) {
    _sv('pr-allow-gas',            bon.pc_xang        || 0);
    _sv('pr-allow-lunch',          bon.pc_an          || 0);
    _sv('pr-allow-attendance',     bon.pc_chuyen_can  || 0);
    _sv('pr-allow-responsibility', bon.pc_trach_nhiem || 0);
  }

  /* ================================================================
   * TOGGLE CA — cập nhật UI ngay, không gọi API
   * ================================================================ */
  function prToggleShift(shift) {
    if (shift === 'morning')   _prShiftMorning   = !_prShiftMorning;
    else                       _prShiftAfternoon = !_prShiftAfternoon;
    _updateShiftUI();
    prCalc();
    prUpdateCondStatus();
  }
  window.prToggleShift = prToggleShift;

  function _updateShiftUI() {
    _setShiftCard('pr-shift-morning',   _prShiftMorning);
    _setShiftCard('pr-shift-afternoon', _prShiftAfternoon);
  }

  function _setShiftCard(id, active) {
    var el = document.getElementById(id); if (!el) return;
    if (active) {
      el.style.border     = '2px solid var(--accent)';
      el.style.background = 'rgba(61,107,255,0.08)';
      el.style.opacity    = '1';
      var t = el.querySelector('.da-shift-title');
      if (t) t.style.color = 'var(--accent2)';
    } else {
      el.style.border     = '2px solid var(--border)';
      el.style.background = 'var(--bg3)';
      el.style.opacity    = '0.5';
      var t2 = el.querySelector('.da-shift-title');
      if (t2) t2.style.color = 'var(--text3)';
    }
  }

  /* ================================================================
   * ĐIỀU HƯỚNG NGÀY
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
   * TASKS TĂNG CA
   * ================================================================ */
  function prAddTask() {
    _prTasks.push({ id: String(Date.now()), description: '', amount: 0 });
    _renderTasks();
  }
  window.prAddTask = prAddTask;

  function prRemoveTask(idx) {
    _prTasks.splice(idx, 1);
    _renderTasks();
    prCalc();
  }
  window.prRemoveTask = prRemoveTask;

  function _renderTasks() {
    var ct = document.getElementById('pr-tasks-container'); if (!ct) return;
    ct.innerHTML = _prTasks.map(function (t, i) {
      return '<div style="display:flex;gap:6px;align-items:center;">'
        + '<input class="form-input" value="' + _esc(t.description || '') + '"'
        + ' oninput="_prSetDesc(' + i + ',this.value)"'
        + ' placeholder="M\u00f4 t\u1ea3..." style="flex:1;padding:8px;"/>'
        + '<input class="form-input" type="number" value="' + (t.amount || 0) + '"'
        + ' oninput="_prSetAmt(' + i + ',this.value)"'
        + ' placeholder="0" style="width:100px;padding:8px;"/>'
        + '<button class="btn-danger" onclick="prRemoveTask(' + i + ')" style="padding:6px 8px;">\u2715</button>'
        + '</div>';
    }).join('');
  }
  window._prSetDesc = function (i, v) { if (_prTasks[i]) _prTasks[i].description = v; prCalc(); };
  window._prSetAmt  = function (i, v) { if (_prTasks[i]) _prTasks[i].amount = Number(v) || 0; prCalc(); };

  /* ================================================================
   * TÍNH TOÁN — PORT ĐÚNG prCalcSummary() — CHẠY LOCAL
   * Không gọi API → phản hồi tức thì
   * ================================================================ */
  function prCalcSummary(empId, dateVal) {
    var parts  = dateVal.split('-');
    var year   = Number(parts[0]);
    var month  = Number(parts[1]);
    var prefix = parts[0] + '-' + parts[1]; /* yyyy-MM */

    /* Lấy phụ cấp từ form (đang hiển thị) */
    var bon = {
      gasAllow            : Number(_gv('pr-allow-gas')            || 0),
      lunchAllow          : Number(_gv('pr-allow-lunch')          || 0),
      attendanceAllow     : Number(_gv('pr-allow-attendance')     || 0),
      responsibilityAllow : Number(_gv('pr-allow-responsibility') || 0)
    };

    /* Lấy lương cơ bản từ select */
    var sel  = document.getElementById('pr-emp-select');
    var opt  = sel && sel.options[sel.selectedIndex];
    var base = opt ? Number(opt.getAttribute('data-sal') || 0) : 0;
    /* Fallback từ _prEmployees */
    if (!base) {
      for (var ei = 0; ei < _prEmployees.length; ei++) {
        if (_prEmployees[ei].id === empId) { base = _prEmployees[ei].base_salary || 0; break; }
      }
    }

    /* Gom tất cả bản ghi trong tháng từ cache + bản ghi hiện tại */
    var workDays = 0, totalOT = 0, totalPark = 0, totalAdv = 0;

    /* Duyệt cache */
    Object.keys(_prRecords).forEach(function (k) {
      if (k.indexOf(empId + '_' + prefix) !== 0) return;
      var r = _prRecords[k];
      workDays  += (r.shift_morning   ? 0.5 : 0) + (r.shift_afternoon ? 0.5 : 0);
      totalOT   += Number(r.total_ot        || 0);
      totalPark += Number(r.parking_fee     || 0);
      totalAdv  += Number(r.advance_payment || 0);
    });

    /* Thêm bản ghi ĐANG NHẬP (trạng thái UI hiện tại, chưa lưu) */
    var curKey = _recKey(empId, dateVal);
    /* Nếu chưa có trong cache (đang nhập mới), cộng thêm từ UI */
    var curInCache = !!_prRecords[curKey];
    if (dateVal.indexOf(prefix) === 0 && !curInCache) {
      workDays  += (_prShiftMorning   ? 0.5 : 0) + (_prShiftAfternoon ? 0.5 : 0);
      totalPark += Number(_gv('pr-parking') || 0);
      totalAdv  += Number(_gv('pr-advance') || 0);
      _prTasks.forEach(function (t) { totalOT += Number(t.amount || 0); });
    } else if (dateVal.indexOf(prefix) === 0 && curInCache) {
      /* Bản ghi đã có trong cache nhưng UI đang chỉnh sửa → dùng UI state */
      workDays  -= (_prRecords[curKey].shift_morning   ? 0.5 : 0) + (_prRecords[curKey].shift_afternoon ? 0.5 : 0);
      totalOT   -= Number(_prRecords[curKey].total_ot        || 0);
      totalPark -= Number(_prRecords[curKey].parking_fee     || 0);
      totalAdv  -= Number(_prRecords[curKey].advance_payment || 0);
      workDays  += (_prShiftMorning   ? 0.5 : 0) + (_prShiftAfternoon ? 0.5 : 0);
      totalPark += Number(_gv('pr-parking') || 0);
      totalAdv  += Number(_gv('pr-advance') || 0);
      _prTasks.forEach(function (t) { totalOT += Number(t.amount || 0); });
    }

    var STD  = STD_WORK_DAYS;    /* 28 */
    var COND = COND_THRESHOLD;   /* 15 */

    /* === TÍNH TOÁN === */
    var dailyFixed  = Math.round((base / STD) * workDays);
    var gasEarned   = Math.round((bon.gasAllow    / STD) * workDays);
    var lunchEarned = Math.round((bon.lunchAllow  / STD) * workDays);
    var condMet     = workDays >= COND;
    var attEarned   = condMet ? bon.attendanceAllow     : 0;
    var respEarned  = condMet ? bon.responsibilityAllow : 0;

    var grandTotal  = dailyFixed + gasEarned + lunchEarned + attEarned + respEarned
                    + totalOT + totalPark - totalAdv;

    return {
      workDays    : workDays,    dailyFixed   : dailyFixed,
      gasEarned   : gasEarned,   lunchEarned  : lunchEarned,
      attEarned   : attEarned,   respEarned   : respEarned,
      totalOT     : totalOT,     totalPark    : totalPark,
      totalAdv    : totalAdv,    grandTotal   : grandTotal,
      condMet     : condMet,     baseSalary   : base
    };
  }

  /* ================================================================
   * prCalc() — Cập nhật sidebar thu nhập (giống hàm cũ)
   * ================================================================ */
  function prCalc() {
    var empId   = _gv('pr-emp-select');
    var dateVal = _gv('pr-att-date') || todayStr();
    if (!empId) return;

    var s = prCalcSummary(empId, dateVal);

    /* Render summary rows (đúng style cũ) */
    var row = function (label, val) {
      return '<div style="display:flex;justify-content:space-between;margin-bottom:5px;">'
        + '<span style="color:#6b8fd4;font-size:10px;">' + label + '</span>'
        + '<span style="color:#e8ecf4;font-size:11px;font-weight:700;">' + val + '</span>'
        + '</div>';
    };

    var html = row('L\u01b0\u01a1ng h\u1ee3p \u0111\u1ed3ng (' + s.workDays + 'c)', fmt(s.dailyFixed));
    if (s.gasEarned  > 0) html += row('\u26fd X\u0103ng xe',         fmt(s.gasEarned));
    if (s.lunchEarned > 0) html += row('\ud83c\udf5c \u0102n tr\u01b0a', fmt(s.lunchEarned));
    if (s.attEarned  > 0) html += row('\u2705 Chuy\u00ean c\u1ea7n',  fmt(s.attEarned));
    if (s.respEarned > 0) html += row('\ud83c\udfc5 Tr\u00e1ch nhi\u1ec7m', fmt(s.respEarned));
    if (s.totalOT    > 0) html += row('\u23f1\ufe0f T\u0103ng ca',    fmt(s.totalOT));
    if (s.totalPark  > 0) html += row('\ud83c\udfd7\ufe0f B\u1ebfn b\u00e3i', fmt(s.totalPark));
    if (s.totalAdv   > 0) html += row('\ud83d\udcb8 T\u1ea1m \u1ee9ng', '-' + fmt(s.totalAdv));

    var rows = document.getElementById('pr-summary-rows');
    if (rows) rows.innerHTML = html;

    var grand = document.getElementById('pr-grand-total');
    if (grand) grand.textContent = fmt(s.grandTotal);
  }
  window.prCalc = prCalc;

  /* ================================================================
   * prUpdateCondStatus() — Cập nhật badge điều kiện (local, không API)
   * ================================================================ */
  function prUpdateCondStatus() {
    var empId   = _gv('pr-emp-select');
    var dateVal = _gv('pr-att-date') || todayStr();
    if (!empId) return;

    var s  = prCalcSummary(empId, dateVal);
    var el = document.getElementById('pr-cond-status'); if (!el) return;

    if (s.condMet) {
      el.textContent = '\u2705 \u0110\u1ee7 \u0111i\u1ec1u ki\u1ec7n (' + s.workDays + 'c)';
      el.style.color = 'var(--green)';
    } else {
      el.textContent = '\u26a0\ufe0f Ch\u01b0a \u0111\u1ee7 (' + s.workDays + '/' + COND_THRESHOLD + 'c)';
      el.style.color = 'var(--yellow)';
    }
  }
  window.prUpdateCondStatus = prUpdateCondStatus;

  /* ================================================================
   * LƯU CHẤM CÔNG
   * ================================================================ */
  function prSaveAttendance() {
    var empId   = _gv('pr-emp-select');
    var dateVal = _gv('pr-att-date');
    if (!empId || !dateVal) { _toast('Ch\u1ecdn nh\u00e2n vi\u00ean v\u00e0 ng\u00e0y', 'error'); return; }
    if (_prSaving) return;
    _prSaving = true;

    var btn = document.getElementById('pr-save-btn');
    if (btn) { btn.disabled = true; btn.textContent = '\u0110ang l\u01b0u...'; }

    /* Cập nhật cache local ngay */
    var totalOT = _prTasks.reduce(function (s, t) { return s + (Number(t.amount) || 0); }, 0);
    var rec = {
      emp_id          : empId,
      date            : dateVal,
      shift_morning   : _prShiftMorning,
      shift_afternoon : _prShiftAfternoon,
      parking_fee     : Number(_gv('pr-parking') || 0),
      advance_payment : Number(_gv('pr-advance') || 0),
      tasks           : JSON.parse(JSON.stringify(_prTasks)),
      total_ot        : totalOT
    };
    _prRecords[_recKey(empId, dateVal)] = rec;

    var apiF = _api();
    if (!apiF) {
      _prSaving = false;
      if (btn) { btn.disabled = false; btn.textContent = '\ud83d\udcbe L\u01b0u ch\u1ea5m c\u00f4ng'; }
      _toast('L\u01b0u local (API kh\u00f4ng kh\u1ea3 d\u1ee5ng)', 'warn');
      prCalc(); prUpdateCondStatus();
      return;
    }

    apiF('att_save_daily', rec, function (e, d) {
      _prSaving = false;
      if (btn) { btn.disabled = false; btn.textContent = '\ud83d\udcbe L\u01b0u ch\u1ea5m c\u00f4ng'; }
      if (e || !d || !d.ok) { _toast((d && d.error) || 'L\u1ed7i l\u01b0u', 'error'); return; }
      _toast('\u2705 \u0110\u00e3 l\u01b0u: ' + dateVal, 'ok');
      var parts = dateVal.split('-');
      _loadCalendar(empId, Number(parts[0]), Number(parts[1]));
      prCalc();
    });
  }
  window.prSaveAttendance = prSaveAttendance;

  /* ================================================================
   * LƯU PHỤ CẤP THÁNG — giống prSaveBonus() cũ
   * Tự gọi khi oninput trên các input phụ cấp
   * ================================================================ */
  function prSaveBonus() {
    var empId   = _gv('pr-emp-select');
    var dateVal = _gv('pr-att-date') || todayStr();
    if (!empId) return;

    var parts = dateVal.split('-');
    var year  = Number(parts[0]);
    var month = Number(parts[1]);
    var bk    = _bonKey(empId, year, month);

    var bon = {
      pc_xang         : Number(_gv('pr-allow-gas')            || 0),
      pc_an           : Number(_gv('pr-allow-lunch')          || 0),
      pc_chuyen_can   : Number(_gv('pr-allow-attendance')     || 0),
      pc_trach_nhiem  : Number(_gv('pr-allow-responsibility') || 0)
    };

    /* Cập nhật cache local ngay */
    _prBonuses[bk] = bon;

    /* Cập nhật UI ngay */
    prUpdateCondStatus();
    prCalc();

    /* Persist vào GAS (non-blocking) */
    var apiF = _api(); if (!apiF) return;
    apiF('att_save_monthly_allowances',
      { emp_id: empId, month: month, year: year,
        pc_xang: bon.pc_xang, pc_an: bon.pc_an,
        pc_chuyen_can: bon.pc_chuyen_can, pc_trach_nhiem: bon.pc_trach_nhiem },
      function () { /* silent — không cần toast cho auto-save */ }
    );
  }
  window.prSaveBonus = prSaveBonus;

  /* ================================================================
   * CALENDAR THÁNG — hiển thị trạng thái từng ngày
   * ================================================================ */
  function _loadCalendar(empId, year, month) {
    var apiF = _api(); if (!apiF) return;
    apiF('att_get_month_calendar', { emp_id: empId, month: month, year: year }, function (e, d) {
      var el = document.getElementById('da-cal-wrap'); if (!el || e || !d || !d.ok) return;

      /* Cập nhật cache */
      d.days.forEach(function (day) {
        if (!day.has_record) return;
        var rk = _recKey(empId, day.date);
        if (!_prRecords[rk]) {
          _prRecords[rk] = {
            shift_morning   : day.shift_morning,
            shift_afternoon : day.shift_afternoon,
            parking_fee     : day.parking_fee || 0,
            advance_payment : 0,
            total_ot        : day.total_ot || 0,
            tasks           : []
          };
        }
      });

      el.innerHTML = _renderCalendar(d, year, month);
      prCalc(); /* Cập nhật tổng sau khi có đầy đủ dữ liệu tháng */
    });
  }

  function _renderCalendar(d, year, month) {
    var today = todayStr();
    var DOW   = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    var MNAMES = ['', 'Th\u00e1ng 1','Th\u00e1ng 2','Th\u00e1ng 3','Th\u00e1ng 4',
                  'Th\u00e1ng 5','Th\u00e1ng 6','Th\u00e1ng 7','Th\u00e1ng 8',
                  'Th\u00e1ng 9','Th\u00e1ng 10','Th\u00e1ng 11','Th\u00e1ng 12'];

    var html = '<div class="card" style="padding:14px;">'
      + '<div style="font-size:10px;font-weight:800;text-transform:uppercase;'
      +   'color:var(--text3);margin-bottom:10px;letter-spacing:.08em;">'
      + '\ud83d\udcc5 ' + MNAMES[month] + ' / ' + year
      + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;">';

    /* Header DOW */
    DOW.forEach(function (l) {
      html += '<div style="font-size:8px;font-weight:800;text-align:center;color:var(--text3);padding:3px 0;">' + l + '</div>';
    });

    /* Leading empty */
    var first = d.days.length ? d.days[0].dow : 0;
    for (var pad = 0; pad < first; pad++) html += '<div></div>';

    /* Day cells */
    d.days.forEach(function (day) {
      var isToday = day.date === today;
      var work    = day.work_days;
      var bg = '';
      if (day.has_record) {
        bg = work >= 1   ? 'background:rgba(16,214,140,.12);border-color:rgba(16,214,140,.3);' :
             work >= 0.5 ? 'background:rgba(251,191,36,.1);border-color:rgba(251,191,36,.3);'   :
                           'background:rgba(255,77,109,.08);border-color:rgba(255,77,109,.25);';
      }
      var dot = day.has_record
        ? '<div style="font-size:10px;color:' + (work >= 1 ? 'var(--green)' : work >= 0.5 ? 'var(--yellow)' : 'var(--red)') + ';">'
          + (work >= 1 ? '\u2022\u2022' : work >= 0.5 ? '\u2022' : '\u00d7') + '</div>'
        : '';
      html += '<div style="border:1px solid var(--border);border-radius:6px;padding:4px 2px;'
        + 'text-align:center;cursor:pointer;transition:all .15s;min-height:34px;'
        + bg + (day.is_weekend ? 'color:var(--red);opacity:.6;' : '')
        + (isToday ? 'border-color:var(--accent)!important;box-shadow:0 0 0 1px var(--accent);' : '')
        + '" onclick="_daPickDay(\'' + day.date + '\')">'
        + '<div style="font-size:10px;font-weight:700;">' + day.day + '</div>'
        + dot
        + '</div>';
    });

    html += '</div>'
      + '<div style="display:flex;gap:10px;margin-top:8px;font-size:9px;color:var(--text3);">'
      + '<span style="color:var(--green);">\u2022\u2022 \u0110\u1ee7 c\u00f4ng</span>'
      + '<span style="color:var(--yellow);">\u2022 N\u1eeda c\u00f4ng</span>'
      + '<span>\u00d7 Ch\u01b0a ch\u1ea5m</span>'
      + '</div>'
      + '</div>';
    return html;
  }

  function _daPickDay(date) {
    var el = document.getElementById('pr-att-date');
    if (el) { el.value = date; prSyncForm(); }
  }
  window._daPickDay = _daPickDay;

  /* ================================================================
   * CSS
   * ================================================================ */
  function _injectCSS() {
    if (document.getElementById('sk-da-css')) return;
    var s   = document.createElement('style');
    s.id    = 'sk-da-css';
    s.textContent = [
      '.da-shift-card{padding:14px;border-radius:12px;cursor:pointer;text-align:center;transition:all .2s;}',
      '.da-shift-on{border:2px solid var(--accent);background:rgba(61,107,255,.08);}',
      '.da-shift-title{font-size:11px;font-weight:800;margin-top:4px;font-family:"Be Vietnam Pro",-apple-system,sans-serif;}',
      '.da-shift-time{font-size:9px;color:var(--text3);}',
      /* Responsive */
      '@media(max-width:720px){#pr-tab-attendance>div{grid-template-columns:1fr!important;}}'
    ].join('');
    document.head.appendChild(s);
  }

})();
