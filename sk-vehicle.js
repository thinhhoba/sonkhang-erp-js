/* ================================================================
 * sk-vehicle.js — SonKhang ERP v3.5 — v2.4
 * S\u1eeda l\u1ed7i:
 *   [FIX-1] api() t\u1ef1 \u0111\u1ecdc window.GAS — kh\u00f4ng ph\u1ee5 thu\u1ed9c scope sk-ui.js
 *   [FIX-2] Expose \u0111\u1ee7 alias: window._vehTabDS, _vehTabDieu, _vehTabCost
 *           \u0111\u1ec3 Theme XML c\u0169 kh\u00f4ng b\u1ecb l\u1ed7i ReferenceError
 * ================================================================ */
(function () {
  'use strict';

  /* ============================================================
   * A0 — api() N\u1ed8I B\u1ed8 — t\u1ef1 \u0111\u1ecdc window.GAS
   * \u0110\u00e2y l\u00e0 s\u1eeda l\u1ed7i c\u1ed1t l\u00f5i: sk-vehicle.js \u0111\u01b0\u1ee3c n\u1ea1p t\u1eeb CDN,
   * kh\u00f4ng c\u00f3 scope ch\u1ecbt v\u00e0o sk-ui.js, n\u00ean ph\u1ea3i t\u1ef1 g\u1ecdi window.api
   * ho\u1eb7c t\u1ef1 th\u1ef1c hi\u1ec7n fetch.
   * ============================================================ */
  function api(action, data, cb) {
    /* \u01afu ti\u00ean d\u00f9ng window.api t\u1eeb sk-ui.js n\u1ebfu \u0111\u00e3 s\u1eb5n */
    if (typeof window.api === 'function' && window.api !== api) {
      return window.api(action, data, cb);
    }
    /* Fallback t\u1ef1 fetch n\u1ebfu sk-ui.js ch\u01b0a load */
    var gasUrl = window.GAS || window._SK_GAS || '';
    if (!gasUrl) {
      console.error('[sk-vehicle] window.GAS ch\u01b0a khai b\u00e1o. Th\u00eam window.GAS = GAS; v\u00e0o Theme XML.');
      if (typeof cb === 'function') cb(new Error('GAS_URL_MISSING'), null);
      return;
    }
    var tok = '';
    try { tok = localStorage.getItem('sk_session') || ''; } catch (e) {}
    var body = { action: action, session_token: tok };
    if (data && typeof data === 'object') {
      var ks = Object.keys(data);
      for (var ki = 0; ki < ks.length; ki++) body[ks[ki]] = data[ks[ki]];
    }
    fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body)
    })
    .then(function (r) { return r.json(); })
    .then(function (d) { if (typeof cb === 'function') cb(null, d); })
    .catch(function (e) {
      console.error('[sk-vehicle] api l\u1ed7i:', action, e);
      if (typeof cb === 'function') cb(e, null);
    });
  }

  /* ============================================================
   * A1 — STATE
   * ============================================================ */
  if (!window._veh) {
    window._veh = {
      tab:               'ds',
      loading:           false,
      registry:          [],
      alerts:            [],
      drivers:           [],
      kpi:               {},
      fuelPrices:        null,
      fuelPricesDefault: false
    };
  }

  var _FUEL_DEFAULT = { xang_ron95: 25170, xang_ron92: 23810, dau_diesel: 21550 };

  var _TOLL_PRESETS = [
    { label: '-- Ch\u1ecdn nhanh c\u1ea7u \u0111\u01b0\u1eddng --',    val: 0      },
    { label: 'C\u1ea7u B\u00ecnh Tri\u1ec7u (1 chi\u1ec1u)',            val: 15000  },
    { label: 'C\u1ea7u B\u00ecnh Tri\u1ec7u (kh\u1ee9 h\u1ed3i)',       val: 30000  },
    { label: 'C\u1ea7u Ph\u00fa M\u1ef9 (1 chi\u1ec1u)',               val: 38000  },
    { label: 'C\u1ea7u Ph\u00fa M\u1ef9 (kh\u1ee9 h\u1ed3i)',          val: 76000  },
    { label: 'Tr\u1ea1m An S\u01b0\u01a1ng (1 chi\u1ec1u)',            val: 35000  },
    { label: 'Tr\u1ea1m An S\u01b0\u01a1ng (kh\u1ee9 h\u1ed3i)',       val: 70000  },
    { label: 'H\u1ea7m \u0110\u1eb9o H\u1ea3i V\u00e2n (1 chi\u1ec1u)', val: 60000 },
    { label: 'Cao t\u1ed1c HCM \u2013 Long Th\u00e0nh',               val: 45000  },
    { label: 'Cao t\u1ed1c HCM \u2013 Th\u1ee7 D\u1ea7u M\u1ed9t',    val: 52000  },
    { label: 'Nh\u1eadp s\u1ed1 kh\u00e1c...',                        val: -1     }
  ];

  /* ============================================================
   * A2 — ENTRY POINTS
   * ============================================================ */
  function loadVehicle() {
    var ct = getContent();
    if (!ct) return;
    window._veh.loading = false;
    ct.innerHTML = _shell();
    _vehRender();
  }

  function loadPhuongTien() { loadVehicle(); }

  /* getContent() — d\u00f9ng window.getContent n\u1ebfu c\u00f3, fallback t\u1ef1 t\u00ecm */
  function getContent() {
    if (typeof window.getContent === 'function' && window.getContent !== getContent) {
      return window.getContent();
    }
    return document.getElementById('sk-ct')
        || document.getElementById('sk-content')
        || document.getElementById('sk-body')
        || document.querySelector('.sk-content')
        || document.querySelector('.sk-main-content')
        || document.querySelector('[data-sk-content]');
  }

  /* ============================================================
   * A3 — SHELL + TAB BAR
   * ============================================================ */
  function _shell() {
    var h = '<div class="sk-panel" style="padding:0;overflow:hidden;min-height:520px;">';
    h += '<div class="sk-veh-tabbar" id="veh-tabbar">';
    h += _tabBtn('ds',   '&#x1F697;', 'Danh s\u00e1ch xe',       true);
    h += _tabBtn('xang', '&#x26FD;',  'Chi ph\u00ed x\u0103ng',   false);
    h += _tabBtn('lenh', '&#x1F4CB;', 'L\u1ec7nh \u0111i\u1ec1u xe',    false);
    h += _tabBtn('bc',   '&#x1F4CA;', 'B\u00e1o c\u00e1o th\u00e1ng',  false);
    h += '</div>';
    h += '<div id="veh-body" style="padding:22px 24px 32px;">' + _skelBlock() + '</div>';
    h += '</div>';
    return h;
  }

  function _tabBtn(id, icon, label, active) {
    return '<button class="sk-veh-tab' + (active ? ' active' : '') + '"'
      + ' id="veh-tb-' + id + '" onclick="_vehTab(\'' + id + '\')">'
      + icon + ' ' + label + '</button>';
  }

  function _vehTab(tab) {
    window._veh.tab = tab;
    var all = ['ds','xang','lenh','bc'];
    for (var i = 0; i < all.length; i++) {
      var b = document.getElementById('veh-tb-' + all[i]);
      if (b) b.className = 'sk-veh-tab' + (all[i] === tab ? ' active' : '');
    }
    if (tab === 'ds')   _vehRender();
    if (tab === 'xang') _calcRender();
    if (tab === 'lenh') _lenhRender();
    if (tab === 'bc')   _bcRender();
  }

  function _body() { return document.getElementById('veh-body'); }

  /* ============================================================
   * A4 — TAB DS: DANH S\u00c1CH XE
   * ============================================================ */
  function _vehRender() {
    var st = window._veh;
    if (st.loading) return;
    st.loading = true;
    var b = _body();
    if (b) b.innerHTML = _skelBlock();

    api('veh_get_registry', {}, function (err, d) {
      st.loading = false;
      var b2 = _body();
      if (!b2) return;
      if (err || !d || !d.ok) { b2.innerHTML = _errBox(d && d.error); return; }
      st.registry = d.data   || [];
      st.alerts   = d.alerts || [];
      st.kpi      = d.kpi    || {};
      b2.innerHTML = _dsHtml();
    });
  }

  function _dsHtml() {
    var st  = window._veh;
    var kp  = st.kpi;
    var h   = '';

    h += '<div class="sk-g5" style="margin-bottom:20px;">';
    h += _kpiBox('#3b82f6', 'T\u1ed5ng xe',          kp.total     || 0, 'trong \u0111\u1ed9i');
    h += _kpiBox('#10b981', 'S\u1eb5n s\u00e0ng',    kp.san_sang  || 0, 'c\u00f3 th\u1ec3 \u0111i\u1ec1u');
    h += _kpiBox('#f97316', '\u0110ang giao',         kp.dang_giao || 0, 'chuy\u1ebfn');
    h += _kpiBox('#f59e0b', 'B\u1ea3o d\u01b0\u1ee1ng',  kp.bao_duong || 0, 'xe');
    h += _kpiBox('#ef4444', 'C\u1ea3nh b\u00e1o',    st.alerts.length, '\u0111i\u1ec3m');
    h += '</div>';

    if (st.alerts.length > 0) {
      h += '<div class="sk-veh-alert-bar" style="margin-bottom:18px;">';
      h += '<div style="font-weight:600;color:#f59e0b;margin-bottom:6px;">'
        + '&#x26A0;&#xFE0F; C\u1ea3nh b\u00e1o (' + st.alerts.length + ')</div>';
      var show = st.alerts.slice(0, 5);
      for (var a = 0; a < show.length; a++) {
        var al = show[a];
        var alc = al.type && al.type.indexOf('expired') >= 0 ? '#ef4444' : '#f59e0b';
        h += '<div style="color:' + alc + ';font-size:12.5px;padding:2px 0;">'
          + '&#x25CF; [' + al.plate + '] ' + al.label + '</div>';
      }
      if (st.alerts.length > 5) {
        h += '<div style="color:#64748b;font-size:11.5px;margin-top:4px;">...v\u00e0 '
          + (st.alerts.length - 5) + ' kh\u00e1c</div>';
      }
      h += '</div>';
    }

    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">';
    h += '<span style="font-size:15px;font-weight:700;color:#e2e8f0;">&#x1F697; \u0110\u1ed9i ph\u01b0\u01a1ng ti\u1ec7n</span>';
    h += '<button class="sk-btn" onclick="_vehOpenForm(null)" style="padding:8px 18px;font-size:12.5px;">+ Th\u00eam xe m\u1edbi</button>';
    h += '</div>';

    if (st.registry.length === 0) {
      return h + _emptyBox('&#x1F697;', 'Ch\u01b0a c\u00f3 ph\u01b0\u01a1ng ti\u1ec7n', 'Nh\u1ea5n \u201cTh\u00eam xe m\u1edbi\u201d \u0111\u1ec3 b\u1eaft \u0111\u1ea7u');
    }

    h += '<div class="sk-veh-grid">';
    for (var i = 0; i < st.registry.length; i++) h += _vehicleCard(st.registry[i]);
    h += '</div>';
    return h;
  }

  function _vehicleCard(v) {
    var sc = _statusColor(v.status);

    /* Progress bar b\u1ea3o d\u01b0\u1ee1ng */
    var maintPct = 0; var maintLeft = 0; var maintColor = '#10b981';
    if (v.maint_km && v.odometer && v.maint_km > 0) {
      var cycle     = 10000;
      var lastMaint = Math.max(0, v.maint_km - cycle);
      var driven    = v.odometer - lastMaint;
      maintPct  = Math.min(100, Math.round(driven / cycle * 100));
      maintLeft = v.maint_km - v.odometer;
      maintColor = maintLeft < 0 ? '#ef4444' : maintLeft < 500 ? '#f59e0b' : '#10b981';
    }

    var h = '<div class="sk-veh-card" style="border-top:3px solid ' + sc
      + ';box-shadow:0 0 0 1px rgba(0,0,0,.3),0 8px 32px rgba(0,0,0,.4),0 0 24px ' + sc + '18;">';

    h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
    h += '<div><div style="font-size:18px;font-weight:800;color:#f1f5f9;letter-spacing:.6px;">' + v.plate + '</div>';
    h += '<div style="font-size:11.5px;color:#64748b;margin-top:3px;">'
      + _typeIcon(v.type) + ' ' + _typeName(v.type) + '</div></div>';
    h += _statusBadge(v.status) + '</div>';

    h += '<div class="sk-veh-info">';
    h += _infoRow('&#x1F464;', 'T\u00e0i x\u1ebf', v.driver_name || (v.driver_email ? v.driver_email.split('@')[0] : '\u2014'));
    h += _infoRow('&#x26FD;', '\u0110\u1ecbnh m\u1ee9c x\u0103ng', (v.fuel_quota || '?') + ' L/100km <small style="color:#64748b;font-size:11px;">(' + _fuelName(v.fuel_type) + ')</small>');
    h += _infoRow('&#x1F4CF;', 'Odometer', '<strong style="font-variant-numeric:tabular-nums;">' + _num(v.odometer) + '</strong> km');
    h += _infoRow('&#x1F4E6;', 'T\u1ea3i tr\u1ecdng', _num(v.load_capacity_kg) + ' kg');

    var rc = _daysColor(v.reg_status);
    var rv = v.registration_exp
      ? '<span style="color:' + rc + ';">' + _fmtDate(v.registration_exp)
        + (v.reg_days !== null ? ' <small>(' + (v.reg_days < 0 ? 'H\u1ebft h\u1ea1n' : 'C\u00f2n ' + v.reg_days + ' ng\u00e0y') + ')</small>' : '') + '</span>'
      : '\u2014';
    h += _infoRow('&#x1F4C5;', '\u0110\u0103ng ki\u1ec3m', rv);

    var ic = _daysColor(v.ins_status);
    var iv = v.insurance_exp
      ? '<span style="color:' + ic + ';">' + _fmtDate(v.insurance_exp)
        + (v.ins_days !== null ? ' <small>(' + (v.ins_days < 0 ? 'H\u1ebft h\u1ea1n' : 'C\u00f2n ' + v.ins_days + ' ng\u00e0y') + ')</small>' : '') + '</span>'
      : '\u2014';
    h += _infoRow('&#x1F6E1;', 'B\u1ea3o hi\u1ec3m', iv);

    if (v.area) h += _infoRow('&#x1F4CD;', 'Khu v\u1ef1c', v.area);
    h += '</div>';

    if (v.maint_km && v.odometer) {
      h += '<div class="sk-veh-maint-wrap">';
      h += '<div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:5px;">';
      h += '<span style="color:#64748b;">&#x1F527; B\u1ea3o d\u01b0\u1ee1ng</span>';
      h += '<span style="color:' + maintColor + ';font-weight:600;">'
        + (maintLeft < 0 ? 'Qu\u00e1 h\u1ea1n ' + _num(Math.abs(maintLeft)) + ' km!' : 'C\u00f2n ' + _num(maintLeft) + ' km')
        + '</span></div>';
      h += '<div class="sk-veh-maint-bg"><div class="sk-veh-maint-fill" style="width:' + maintPct + '%;background:' + maintColor + ';"></div></div>';
      h += '<div style="font-size:10.5px;color:#475569;margin-top:3px;text-align:right;">Odometer: ' + _num(v.odometer) + ' / M\u1ed1c: ' + _num(v.maint_km) + ' km</div>';
      h += '</div>';
    }

    var myA = [];
    var allA = window._veh.alerts || [];
    for (var j = 0; j < allA.length; j++) { if (allA[j].plate === v.plate) myA.push(allA[j]); }
    if (myA.length > 0) {
      h += '<div class="sk-veh-card-warn">';
      for (var k = 0; k < myA.length; k++) {
        var wc = myA[k].type && myA[k].type.indexOf('expired') >= 0 ? '#ef4444' : '#f59e0b';
        h += '<div style="color:' + wc + ';font-size:11.5px;padding:2px 0;">&#x26A0; ' + myA[k].label + '</div>';
      }
      h += '</div>';
    }

    h += '<div class="sk-veh-card-actions">';
    h += '<button class="sk-btn-sm sk-btn-outline" onclick="_vehOpenForm(\'' + _esc(v.plate) + '\')">&#x270F;&#xFE0F; Ch\u1ec9nh s\u1eeda</button>';
    if (v.status === 'san_sang') {
      h += '<button class="sk-btn-sm" style="background:linear-gradient(135deg,#10b981,#059669);" onclick="_dispatchOpen(\'' + _esc(v.plate) + '\')">&#x1F4CB; \u0110i\u1ec1u xe</button>';
    }
    if (v.status === 'dang_giao') {
      h += '<button class="sk-btn-sm" style="background:linear-gradient(135deg,#f97316,#ea580c);" onclick="_completeOpen(\'' + _esc(v.plate) + '\')">&#x2705; Ho\u00e0n th\u00e0nh</button>';
    }
    if (v.status === 'bao_duong') {
      h += '<button class="sk-btn-sm" style="background:linear-gradient(135deg,#f59e0b,#d97706);" onclick="_vehOpenForm(\'' + _esc(v.plate) + '\')">&#x1F527; C\u1eadp nh\u1eadt</button>';
    }
    h += '</div></div>';
    return h;
  }

  function _infoRow(icon, label, val) {
    return '<div class="sk-veh-info-row">'
      + '<span style="color:#64748b;font-size:12px;flex-shrink:0;">' + icon + ' ' + label + '</span>'
      + '<span style="color:#cbd5e1;font-size:12.5px;text-align:right;">' + val + '</span>'
      + '</div>';
  }

  /* ============================================================
   * A5 — FORM TH\u00caM/S\u1eeda XE
   * ============================================================ */
  function _vehOpenForm(plate) {
    var v = null;
    if (plate) {
      var reg = window._veh.registry;
      for (var i = 0; i < reg.length; i++) { if (reg[i].plate === plate) { v = reg[i]; break; } }
    }
    api('veh_get_drivers', {}, function (err, d) {
      if (!err && d && d.ok) window._veh.drivers = d.data || [];
      _showVehicleModal(v);
    });
  }

  function _showVehicleModal(v) {
    var isNew   = !v;
    _removeModal('sk-veh-modal');
    var drivers = window._veh.drivers || [];

    var dOpts = '<option value="">-- Ch\u1ecdn t\u00e0i x\u1ebf ph\u1ee5 tr\u00e1ch --</option>';
    for (var i = 0; i < drivers.length; i++) {
      var sel = v && v.driver_email === drivers[i].email ? ' selected' : '';
      dOpts += '<option value="' + _esc(drivers[i].email) + '"' + sel + '>'
        + _esc(drivers[i].name) + ' (' + drivers[i].role + ')</option>';
    }

    var h = '<div id="sk-veh-modal" class="sk-modal-overlay" onclick="_closeModal(\'sk-veh-modal\',event)">';
    h += '<div class="sk-modal-box" onclick="event.stopPropagation()">';
    h += '<div class="sk-modal-hd">';
    h += isNew ? '&#x1F697; Th\u00eam xe m\u1edbi' : '&#x270F;&#xFE0F; Ch\u1ec9nh s\u1eeda xe: ' + v.plate;
    h += '<button onclick="_removeModal(\'sk-veh-modal\')" class="sk-modal-close">&times;</button>';
    h += '</div><div class="sk-modal-bd"><div class="sk-fg2">';

    h += '<div><label class="sk-lbl">Bi\u1ec3n s\u1ed1 xe <em style="color:#ef4444;">*</em></label>';
    h += '<input id="vf_plate" class="sk-inp" type="text" placeholder="51F-123.45"'
      + (v ? ' value="' + _esc(v.plate) + '" readonly style="opacity:.55"' : '')
      + ' style="text-transform:uppercase"></div>';

    h += '<div><label class="sk-lbl">Lo\u1ea1i xe</label><select id="vf_type" class="sk-inp">';
    h += _opt('xe_tai','Xe t\u1ea3i',v&&v.type) + _opt('xe_may','Xe m\u00e1y',v&&v.type) + _opt('xe_lanh','Xe l\u1ea1nh',v&&v.type);
    h += '</select></div>';

    h += '<div style="grid-column:1/-1"><label class="sk-lbl">T\u00e0i x\u1ebf ph\u1ee5 tr\u00e1ch</label>';
    h += '<select id="vf_driver" class="sk-inp">' + dOpts + '</select></div>';

    h += '<div><label class="sk-lbl">\u0110\u1ecbnh m\u1ee9c x\u0103ng (L/100km)</label>';
    h += '<input id="vf_quota" class="sk-inp" type="number" step=".1" placeholder="VD: 8.5" value="' + (v?v.fuel_quota:'') + '"></div>';

    h += '<div><label class="sk-lbl">Lo\u1ea1i nhi\u00ean li\u1ec7u</label><select id="vf_ftype" class="sk-inp">';
    h += _opt('xang_ron95','X\u0103ng RON 95',v&&v.fuel_type) + _opt('xang_ron92','X\u0103ng RON 92',v&&v.fuel_type) + _opt('dau_diesel','D\u1ea7u Diesel',v&&v.fuel_type);
    h += '</select></div>';

    h += '<div><label class="sk-lbl">T\u1ea3i tr\u1ecdng t\u1ed1i \u0111a (kg)</label>';
    h += '<input id="vf_load" class="sk-inp" type="number" placeholder="VD: 1500" value="' + (v?v.load_capacity_kg:'') + '"></div>';

    h += '<div><label class="sk-lbl">Odometer hi\u1ec7n t\u1ea1i (km)</label>';
    h += '<input id="vf_odo" class="sk-inp" type="number" placeholder="VD: 45000" value="' + (v?v.odometer:'') + '"></div>';

    h += '<div><label class="sk-lbl">M\u1ed1c b\u1ea3o d\u01b0\u1ee1ng ti\u1ebfp (km)</label>';
    h += '<input id="vf_maint" class="sk-inp" type="number" placeholder="VD: 50000" value="' + (v?v.maint_km:'') + '"></div>';

    h += '<div><label class="sk-lbl">Khu v\u1ef1c ho\u1ea1t \u0111\u1ed9ng</label>';
    h += '<input id="vf_area" class="sk-inp" type="text" placeholder="VD: HCM" value="' + _esc(v?v.area:'') + '"></div>';

    h += '<div><label class="sk-lbl">\u0110\u0103ng ki\u1ec3m h\u1ebft h\u1ea1n</label>';
    h += '<input id="vf_reg" class="sk-inp" type="date" value="' + (v?v.registration_exp:'') + '"></div>';

    h += '<div><label class="sk-lbl">B\u1ea3o hi\u1ec3m h\u1ebft h\u1ea1n</label>';
    h += '<input id="vf_ins" class="sk-inp" type="date" value="' + (v?v.insurance_exp:'') + '"></div>';

    if (!isNew) {
      h += '<div style="grid-column:1/-1"><label class="sk-lbl">Tr\u1ea1ng th\u00e1i xe</label><select id="vf_status" class="sk-inp">';
      h += _opt('san_sang','S\u1eb5n s\u00e0ng',v.status) + _opt('dang_giao','\u0110ang giao',v.status)
        + _opt('bao_duong','B\u1ea3o d\u01b0\u1ee1ng',v.status) + _opt('ngung','Ng\u01b0ng ho\u1ea1t \u0111\u1ed9ng',v.status);
      h += '</select></div>';
    }

    h += '</div></div>';
    h += '<div class="sk-modal-ft">';
    h += '<button class="sk-btn-sm sk-btn-outline" onclick="_removeModal(\'sk-veh-modal\')">H\u1ee7y</button>';
    h += '<button class="sk-btn" id="vf_save" onclick="_vehSaveForm()">';
    h += isNew ? '&#x1F4BE; L\u01b0u xe m\u1edbi' : '&#x2705; C\u1eadp nh\u1eadt';
    h += '</button></div></div></div>';

    document.body.appendChild(document.createRange().createContextualFragment(h));
  }

  function _vehSaveForm() {
    var btn = document.getElementById('vf_save');
    if (btn) btn.disabled = true;
    var dSel   = document.getElementById('vf_driver');
    var dEmail = dSel ? dSel.value : '';
    var dName  = dSel && dSel.selectedIndex >= 0 ? (dSel.options[dSel.selectedIndex].text||'').split(' (')[0] : '';
    var plate  = (_val('vf_plate')||'').toUpperCase().replace(/\s/g,'').trim();
    if (!plate) { _toast('&#x26A0;&#xFE0F; Nh\u1eadp bi\u1ec3n s\u1ed1 xe!','warn'); if(btn)btn.disabled=false; return; }

    api('veh_save_registry', {
      plate: plate, type: _val('vf_type'), driver_email: dEmail, driver_name: dName,
      fuel_quota: _val('vf_quota'), fuel_type: _val('vf_ftype'),
      load_capacity_kg: _val('vf_load'), odometer: _val('vf_odo'), maint_km: _val('vf_maint'),
      area: _val('vf_area'), registration_exp: _val('vf_reg'), insurance_exp: _val('vf_ins'),
      status: _val('vf_status') || 'san_sang'
    }, function (err, d) {
      if (btn) btn.disabled = false;
      if (err || !d || !d.ok) { _toast('&#x274C; L\u1ed7i l\u01b0u: ' + (d&&d.error||'?'),'error'); return; }
      _removeModal('sk-veh-modal');
      _toast('&#x2705; \u0110\u00e3 l\u01b0u xe ' + plate, 'ok');
      _vehRender();
    });
  }

  /* ============================================================
   * A6 — TAB XĂNG: TÍNH CHI PHÍ
   * ============================================================ */
  function _calcRender() {
    var b = _body();
    if (!b) return;
    b.innerHTML = _skelBlock();
    _loadFuelPrices(function (prices) {
      var b2 = _body();
      if (!b2) return;
      var reg = window._veh.registry || [];
      var xeOpts = '<option value="">-- Ch\u1ecdn xe --</option>';
      for (var i = 0; i < reg.length; i++) {
        var v = reg[i];
        xeOpts += '<option value="' + _esc(v.plate) + '" data-q="' + (v.fuel_quota||0)
          + '" data-ft="' + (v.fuel_type||'xang_ron95') + '">'
          + v.plate + ' \u2014 ' + _typeName(v.type) + (v.driver_name?' ('+v.driver_name+')':'') + '</option>';
      }
      var p95  = (prices.xang_ron95||0).toLocaleString('vi-VN');
      var p92  = (prices.xang_ron92||0).toLocaleString('vi-VN');
      var pdsl = (prices.dau_diesel ||0).toLocaleString('vi-VN');
      var tollOpts = '';
      for (var t = 0; t < _TOLL_PRESETS.length; t++) {
        tollOpts += '<option value="' + _TOLL_PRESETS[t].val + '">' + _TOLL_PRESETS[t].label + '</option>';
      }
      var notice = window._veh.fuelPricesDefault
        ? '<div class="sk-veh-notice-warn">&#x26A0;&#xFE0F; \u0110ang d\u00f9ng gi\u00e1 m\u1eb7c \u0111\u1ecbnh \u2014 ki\u1ec3m tra GAS Config sheet</div>'
        : '<div class="sk-veh-notice-ok">&#x2705; Gi\u00e1 nhi\u00ean li\u1ec7u \u0111\u00e3 \u0111\u1ed3ng b\u1ed9 t\u1eeb h\u1ec7 th\u1ed1ng</div>';

      var h = '<h3 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#e2e8f0;">&#x26FD; T\u00ednh chi ph\u00ed h\u00e0nh tr\u00ecnh</h3>';
      h += notice;
      h += '<div class="sk-veh-calc-wrap">';

      h += '<div class="sk-panel" style="padding:18px;">';
      h += '<div class="sk-pt" style="margin-bottom:14px;">Th\u00f4ng tin chuy\u1ebfn \u0111i</div>';
      h += '<div class="sk-fg2">';
      h += '<div style="grid-column:1/-1"><label class="sk-lbl">Xe &#x1F697;</label>';
      h += '<select id="calc_plate" class="sk-inp" onchange="_calcFillQuota()">' + xeOpts + '</select></div>';
      h += '<div><label class="sk-lbl">\u0110\u1ecbnh m\u1ee9c (L/100km)</label>';
      h += '<input id="calc_q" class="sk-inp" type="number" step=".1" placeholder="8.5" oninput="_calcLive()"></div>';
      h += '<div><label class="sk-lbl">Lo\u1ea1i nhi\u00ean li\u1ec7u</label><select id="calc_ft" class="sk-inp" onchange="_calcLive()">';
      h += '<option value="xang_ron95">RON 95 \u2014 ' + p95 + ' \u0111/L</option>';
      h += '<option value="xang_ron92">RON 92 \u2014 ' + p92 + ' \u0111/L</option>';
      h += '<option value="dau_diesel">Diesel \u2014 '  + pdsl + ' \u0111/L</option></select></div>';
      h += '<div style="grid-column:1/-1"><label class="sk-lbl">Kho\u1ea3ng c\u00e1ch (km) &#x1F4CF;</label>';
      h += '<input id="calc_km" class="sk-inp" type="number" min=".1" max="3000" step=".1" placeholder="VD: 45 km" oninput="_calcLive()"></div>';
      h += '</div>';

      h += '<div class="sk-veh-toll-section">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
      h += '<label class="sk-lbl" style="margin:0;font-size:12.5px;color:#f59e0b;">&#x1F6E3; Ph\u00ed c\u1ea7u \u0111\u01b0\u1eddng (VN\u0110)</label>';
      h += '<span style="font-size:11px;color:#64748b;">Ch\u1ecdn nhanh:</span></div>';
      h += '<select id="calc_toll_pre" class="sk-inp" style="margin-bottom:8px;" onchange="_calcTollPre()">' + tollOpts + '</select>';
      h += '<input id="calc_toll" class="sk-inp" type="number" min="0" step="1000" placeholder="Ho\u1eb7c nh\u1eadp s\u1ed1 ti\u1ec1n t\u1ea1i \u0111\u00e2y" oninput="_calcLive()"></div>';

      h += '<div style="margin-top:12px;"><label class="sk-lbl">&#x1F4B3; Chi ph\u00ed kh\u00e1c (VN\u0110)</label>';
      h += '<input id="calc_other" class="sk-inp" type="number" min="0" placeholder="0" oninput="_calcLive()"></div>';

      h += '<details style="margin-top:14px;"><summary style="color:#64748b;font-size:12px;cursor:pointer;padding:4px 0;">&#x1F4CC; L\u1ed9 tr\u00ecnh v\u00e0 m\u00e3 \u0111\u01a1n (t\u00f9y ch\u1ecdn)</summary>';
      h += '<div style="padding-top:10px;" class="sk-fg2">';
      h += '<div><label class="sk-lbl">M\u00e3 \u0111\u01a1n Sapo</label><input id="calc_order" class="sk-inp" type="text" placeholder="SP-XXXXX"></div>';
      h += '<div><label class="sk-lbl">Ghi ch\u00fa</label><input id="calc_note" class="sk-inp" type="text" placeholder="..."></div>';
      h += '<div><label class="sk-lbl">T\u1eeb \u0111i\u1ec3m</label><input id="calc_from" class="sk-inp" type="text" placeholder="Kho S\u01a1n Khang"></div>';
      h += '<div><label class="sk-lbl">\u0110\u1ebfn \u0111i\u1ec3m</label><input id="calc_to" class="sk-inp" type="text" placeholder="Q. B\u00ecnh D\u01b0\u01a1ng"></div>';
      h += '</div></details>';

      h += '<div style="display:flex;gap:8px;margin-top:18px;">';
      h += '<button class="sk-btn sk-btn-outline" style="flex:1;" onclick="_calcVerify()">&#x1F50D; Ki\u1ec3m tra server</button>';
      h += '<button class="sk-btn" style="flex:2;" onclick="_calcSave()">&#x1F4BE; L\u01b0u h\u00e0nh tr\u00ecnh</button></div></div>';

      h += '<div style="display:flex;flex-direction:column;gap:14px;">';
      h += '<div class="sk-panel" id="calc-result-box" style="padding:18px;">';
      h += '<div class="sk-pt" style="margin-bottom:14px;">&#x1F4CA; K\u1ebft qu\u1ea3 t\u00ednh to\u00e1n</div>';
      h += '<div id="calc-result"><div style="color:#64748b;font-size:13px;text-align:center;padding:20px 0;">&#x2B05;&#xFE0F; \u0110i\u1ec1n th\u00f4ng tin b\u00ean tr\u00e1i</div></div></div>';
      h += '<div class="sk-panel" id="calc-srv" style="display:none;padding:14px;">';
      h += '<div style="font-size:11.5px;color:#64748b;margin-bottom:6px;">&#x1F4E1; K\u1ebft qu\u1ea3 t\u1eeb server:</div>';
      h += '<div id="calc-srv-data"></div></div></div></div>';
      b2.innerHTML = h;
    });
  }

  function _loadFuelPrices(cb) {
    var st = window._veh;
    if (st.fuelPrices) { cb(st.fuelPrices); return; }
    api('veh_get_fuel_prices', {}, function (err, d) {
      if (!err && d && d.ok && d.prices) { st.fuelPrices = d.prices; st.fuelPricesDefault = false; }
      else { st.fuelPrices = _FUEL_DEFAULT; st.fuelPricesDefault = true; }
      cb(st.fuelPrices);
    });
  }

  function _calcFillQuota() {
    var sel = document.getElementById('calc_plate');
    if (!sel || !sel.value) return;
    var opt = sel.options[sel.selectedIndex];
    var qEl = document.getElementById('calc_q');
    var fEl = document.getElementById('calc_ft');
    if (qEl) qEl.value = opt.getAttribute('data-q')  || '';
    if (fEl) fEl.value = opt.getAttribute('data-ft') || 'xang_ron95';
    _calcLive();
  }

  function _calcTollPre() {
    var sel = document.getElementById('calc_toll_pre');
    if (!sel) return;
    var v = parseInt(sel.value, 10);
    if (v === -1) { var t = document.getElementById('calc_toll'); if (t) { t.value = ''; t.focus(); } return; }
    if (v >= 0)   { var t2 = document.getElementById('calc_toll'); if (t2) t2.value = v; _calcLive(); }
  }

  function _calcLive() {
    var km    = parseFloat(_val('calc_km')    || 0);
    var quota = parseFloat(_val('calc_q')     || 0);
    var toll  = parseFloat(_val('calc_toll')  || 0);
    var other = parseFloat(_val('calc_other') || 0);
    var ft    = _val('calc_ft') || 'xang_ron95';
    var prices = window._veh.fuelPrices || _FUEL_DEFAULT;
    var price  = prices[ft] || prices.xang_ron95;
    var box    = document.getElementById('calc-result');
    if (!box) return;
    if (!km || !quota) {
      box.innerHTML = '<div style="color:#64748b;font-size:13px;text-align:center;padding:20px 0;">&#x2B05;&#xFE0F; Nh\u1eadp kho\u1ea3ng c\u00e1ch v\u00e0 \u0111\u1ecbnh m\u1ee9c</div>';
      return;
    }
    var liters   = (km / 100) * quota;
    var fuelCost = liters * price;
    var total    = fuelCost + toll + other;
    var perKm    = km > 0 ? Math.round(total / km) : 0;
    var pF = total > 0 ? Math.round(fuelCost / total * 100) : 100;
    var pT = total > 0 ? Math.round(toll      / total * 100) : 0;
    var pO = Math.max(0, 100 - pF - pT);

    var h = '<div style="display:flex;flex-direction:column;gap:10px;">';
    h += _resRow('&#x1F4CF;', 'Kho\u1ea3ng c\u00e1ch',      km.toLocaleString('vi-VN') + ' km', '#94a3b8');
    h += _resRow('&#x26FD;',  'Ti\u00eau th\u1ee5 x\u0103ng', liters.toFixed(2) + ' L',           '#94a3b8');
    h += _resRow('&#x1F3F7;', 'Gi\u00e1/L',                  _vnd(price) + '/L',                   '#94a3b8');
    h += '<div style="border-top:1px dashed #1e293b;padding-top:10px;display:flex;flex-direction:column;gap:8px;">';
    h += _resRow('&#x1F9EE;', 'Chi ph\u00ed x\u0103ng',       _vnd(fuelCost), '#3b82f6');
    h += _resRow('&#x1F6E3;', 'Ph\u00ed c\u1ea7u \u0111\u01b0\u1eddng', _vnd(toll),  toll  > 0 ? '#f59e0b' : '#334155');
    h += _resRow('&#x1F4B3;', 'Chi ph\u00ed kh\u00e1c',       _vnd(other), other > 0 ? '#8b5cf6' : '#334155');
    h += '</div>';
    if (total > 0) {
      h += '<div class="sk-veh-breakdown">';
      h += '<div style="font-size:11px;color:#64748b;margin-bottom:6px;">Ph\u00e2n b\u1ed5 chi ph\u00ed</div>';
      h += '<div class="sk-veh-bar-wrap">';
      if (pF > 0) h += '<div class="sk-veh-bar-f" style="width:' + pF + '%"></div>';
      if (pT > 0) h += '<div class="sk-veh-bar-t" style="width:' + pT + '%"></div>';
      if (pO > 0) h += '<div class="sk-veh-bar-o" style="width:' + pO + '%"></div>';
      h += '</div><div style="display:flex;flex-wrap:wrap;gap:10px;font-size:11px;margin-top:5px;">';
      h += '<span style="color:#3b82f6;">&#x25A0; X\u0103ng ' + pF + '%</span>';
      if (pT > 0) h += '<span style="color:#f59e0b;">&#x25A0; C\u1ea7u ' + pT + '%</span>';
      if (pO > 0) h += '<span style="color:#8b5cf6;">&#x25A0; Kh\u00e1c ' + pO + '%</span>';
      h += '</div></div>';
    }
    h += '<div class="sk-veh-total-box">';
    h += '<span style="font-size:12.5px;color:#94a3b8;">T\u1ed5ng chi ph\u00ed h\u00e0nh tr\u00ecnh</span>';
    h += '<span style="font-size:22px;font-weight:800;color:#f59e0b;font-variant-numeric:tabular-nums;">' + _vnd(total) + '</span>';
    h += '<span style="font-size:11.5px;color:#64748b;">' + _vnd(perKm) + '/km &bull; ' + liters.toFixed(2) + 'L x\u0103ng</span>';
    h += '</div></div>';
    box.innerHTML = h;
  }

  function _resRow(icon, label, val, color) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;">'
      + '<span style="color:#64748b;">' + icon + ' ' + label + '</span>'
      + '<span style="color:' + color + ';font-weight:600;font-variant-numeric:tabular-nums;">' + val + '</span>'
      + '</div>';
  }

  function _calcVerify() {
    var km = _val('calc_km'); var quota = _val('calc_q');
    if (!km || !quota) { _toast('&#x26A0;&#xFE0F; Nh\u1eadp kho\u1ea3ng c\u00e1ch v\u00e0 \u0111\u1ecbnh m\u1ee9c tr\u01b0\u1edbc','warn'); return; }
    var sB = document.getElementById('calc-srv'); var sD = document.getElementById('calc-srv-data');
    if (sB) sB.style.display = 'block';
    if (sD) sD.innerHTML = '<span style="color:#64748b;">\u0110ang ki\u1ec3m tra...</span>';
    api('veh_calc_trip_cost', {
      distance_km: km, fuel_quota: quota, fuel_type: _val('calc_ft')||'xang_ron95',
      toll_fee: _val('calc_toll')||0, other_cost: _val('calc_other')||0
    }, function (err, d) {
      if (!sD) return;
      if (err||!d||!d.ok) { sD.innerHTML = '<span style="color:#ef4444;">L\u1ed7i: ' + (d&&d.error||'?') + '</span>'; return; }
      sD.innerHTML = '&#x2705; <strong style="color:#f59e0b;">' + _vnd(d.total_cost) + '</strong>'
        + ' &bull; X\u0103ng: ' + _vnd(d.fuel_cost) + ' &bull; ' + d.fuel_liters + 'L @ ' + _vnd(d.fuel_price) + '/L';
      _toast('&#x2705; Server x\u00e1c nh\u1eadn: ' + _vnd(d.total_cost), 'ok');
    });
  }

  function _calcSave() {
    var plate = _val('calc_plate'); var km = _val('calc_km'); var quota = _val('calc_q');
    if (!plate) { _toast('&#x26A0;&#xFE0F; Ch\u1ecdn xe tr\u01b0\u1edbc!','warn'); return; }
    if (!km)    { _toast('&#x26A0;&#xFE0F; Nh\u1eadp kho\u1ea3ng c\u00e1ch!','warn'); return; }
    if (!quota) { _toast('&#x26A0;&#xFE0F; Nh\u1eadp \u0111\u1ecbnh m\u1ee9c x\u0103ng!','warn'); return; }
    var reg = window._veh.registry || [];
    for (var i = 0; i < reg.length; i++) {
      if (reg[i].plate === plate) {
        if (reg[i].status === 'dang_giao') { _toast('&#x26A0;&#xFE0F; Xe \u0111ang trong chuy\u1ebfn kh\u00e1c!','warn'); return; }
        if (reg[i].status === 'bao_duong') { _toast('&#x26A0;&#xFE0F; Xe \u0111ang b\u1ea3o d\u01b0\u1ee1ng!','warn'); return; }
        if (reg[i].status === 'ngung')     { _toast('&#x26A0;&#xFE0F; Xe \u0111\u00e3 ng\u01b0ng!','warn'); return; }
        break;
      }
    }
    var btn = document.querySelector('[onclick="_calcSave()"]');
    if (btn) { btn.disabled = true; btn.textContent = '\u0110ang l\u01b0u...'; }
    api('veh_dispatch', {
      plate: plate, distance_km: km, fuel_quota: quota,
      fuel_type: _val('calc_ft')||'xang_ron95', toll_fee: _val('calc_toll')||0,
      other_cost: _val('calc_other')||0, order_id: _val('calc_order')||'',
      route_from: _val('calc_from')||'', route_to: _val('calc_to')||''
    }, function (err, d) {
      if (btn) { btn.disabled = false; btn.innerHTML = '&#x1F4BE; L\u01b0u h\u00e0nh tr\u00ecnh'; }
      if (err||!d||!d.ok) { _toast('&#x274C; L\u1ed7i: ' + (d&&d.error||'?'),'error'); return; }
      _toast('&#x2705; L\u1ec7nh ' + d.log_id + ' \u2014 ' + _vnd(d.total_cost), 'ok');
      for (var j = 0; j < reg.length; j++) { if (reg[j].plate===d.plate) { reg[j].status='dang_giao'; break; } }
      setTimeout(function () { _vehTab('ds'); }, 1500);
    });
  }

  /* ============================================================
   * A7 — TAB LỆNH: ĐIỀU PHỐI XE
   * ============================================================ */
  function _lenhRender() {
    var b = _body();
    if (!b) return;
    b.innerHTML = _skelBlock();
    api('sapo_orders', { ship: 'pending', ps: 30, page: 1 }, function (err, d) {
      var b2 = _body();
      if (!b2) return;
      var orders = [];
      if (!err && d) {
        var raw = d.data || d.orders || [];
        for (var i = 0; i < raw.length; i++) {
          var s = raw[i].fulfillment_status || '';
          if (!s || s === 'unshipped' || s === 'pending') orders.push(raw[i]);
        }
      }
      b2.innerHTML = _lenhHtml(orders);
    });
  }

  function _lenhHtml(orders) {
    var reg = window._veh.registry || [];
    var ready = [];
    for (var i = 0; i < reg.length; i++) { if (reg[i].status === 'san_sang') ready.push(reg[i]); }

    var h = '<h3 style="margin:0 0 16px;font-size:15px;font-weight:700;color:#e2e8f0;">&#x1F4CB; \u0110i\u1ec1u ph\u1ed1i xe giao \u0111\u01a1n</h3>';
    h += '<div class="sk-veh-lenh-wrap">';

    h += '<div><div class="sk-pt" style="margin-bottom:10px;">\u0110\u01a1n h\u00e0ng ch\u1edd giao (' + orders.length + ')'
      + ' <span style="font-size:11px;color:#64748b;font-weight:400;">&#x1F447; Click \u0111\u1ec3 t\u1ef1 \u0111i\u1ec1n form</span></div>';
    if (orders.length === 0) { h += _emptyBox('&#x1F4E6;', 'Kh\u00f4ng c\u00f3 \u0111\u01a1n ch\u1edd giao', 'T\u1ea5t c\u1ea3 \u0111\u01a3n \u0111\u00e3 x\u1eed l\u00fd'); }
    else {
      h += '<div style="max-height:460px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">';
      for (var j = 0; j < orders.length; j++) h += _orderItem(orders[j]);
      h += '</div>';
    }
    h += '</div>';

    h += '<div><div class="sk-pt" style="margin-bottom:10px;">Xe s\u1eb5n s\u00e0ng (' + ready.length + ')</div>';
    if (ready.length === 0) { h += _emptyBox('&#x1F697;', 'Kh\u00f4ng c\u00f3 xe s\u1eb5n s\u00e0ng', 'Ki\u1ec3m tra tr\u1ea1ng th\u00e1i'); }
    else {
      h += '<div style="display:flex;flex-direction:column;gap:8px;">';
      for (var k = 0; k < ready.length; k++) h += _readyVehItem(ready[k]);
      h += '</div>';
    }
    h += '</div></div>';

    var pOpts = '<option value="">-- Ch\u1ecdn xe --</option>';
    for (var r = 0; r < ready.length; r++) {
      pOpts += '<option value="' + _esc(ready[r].plate) + '" data-q="' + (ready[r].fuel_quota||0)
        + '" data-ft="' + (ready[r].fuel_type||'xang_ron95') + '">'
        + ready[r].plate + ' \u2014 ' + (ready[r].driver_name||ready[r].driver_email||'?') + '</option>';
    }

    h += '<div class="sk-panel" style="padding:18px;margin-top:16px;">';
    h += '<div class="sk-pt" style="margin-bottom:14px;">&#x1F680; T\u1ea1o l\u1ec7nh nhanh</div>';
    h += '<div class="sk-fg2">';
    h += '<div><label class="sk-lbl">Xe &#x1F697;</label><select id="dsp_plate" class="sk-inp" onchange="_dspEstimate()">' + pOpts + '</select></div>';
    h += '<div><label class="sk-lbl">M\u00e3 \u0111\u01a3n Sapo</label><input id="dsp_order" class="sk-inp" type="text" placeholder="T\u1ef1 \u0111i\u1ec1n khi click \u0111\u01a3n"></div>';
    h += '<div><label class="sk-lbl">Kho\u1ea3ng c\u00e1ch (km)</label><input id="dsp_km" class="sk-inp" type="number" min="1" placeholder="VD: 30" oninput="_dspEstimate()"></div>';
    h += '<div><label class="sk-lbl">Ph\u00ed c\u1ea7u (VN\u0110)</label><input id="dsp_toll" class="sk-inp" type="number" min="0" placeholder="0" oninput="_dspEstimate()"></div>';
    h += '<div><label class="sk-lbl">T\u1eeb \u0111i\u1ec3m</label><input id="dsp_from" class="sk-inp" type="text" placeholder="Kho S\u01a1n Khang"></div>';
    h += '<div><label class="sk-lbl">\u0110\u1ebfn \u0111i\u1ec3m</label><input id="dsp_to" class="sk-inp" type="text" placeholder="T\u1ef1 \u0111i\u1ec1n khi click \u0111\u01a3n"></div>';
    h += '</div>';
    h += '<div id="dsp-estimate" class="sk-veh-dsp-estimate" style="display:none;margin-top:14px;">';
    h += '<div style="font-size:12px;color:#64748b;margin-bottom:6px;">&#x1F4B0; \u01AF\u1edbc t\u00ednh chi ph\u00ed:</div>';
    h += '<div id="dsp-estimate-val" style="font-size:16px;font-weight:700;color:#f59e0b;font-variant-numeric:tabular-nums;"></div></div>';
    h += '<button class="sk-btn" style="margin-top:14px;width:100%;" onclick="_dspExec()">&#x1F4E4; Ph\u00e1t l\u1ec7nh \u0111i\u1ec1u xe</button>';
    h += '</div>';
    return h;
  }

  function _orderItem(o) {
    var cust = (o.customer&&(o.customer.name||o.customer.phone)) || (o.shipping_address&&o.shipping_address.name) || '\u2014';
    var addr = '';
    if (o.shipping_address) {
      addr = [o.shipping_address.address1||'', o.shipping_address.ward||'',
        o.shipping_address.district||'', o.shipping_address.city||'']
        .filter(function(x){return x;}).join(', ');
    }
    var safeAddr = addr.replace(/'/g, '\u2019');
    var safeCode = String(o.code||o.id||'').replace(/'/g,'');
    return '<div class="sk-veh-order-item" onclick="_lenhFill(\'' + safeCode + '\',\'' + _esc(safeAddr) + '\')">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;">'
      + '<div style="font-weight:700;color:#e2e8f0;font-size:13px;">#' + (o.code||o.id) + '</div>'
      + '<div style="font-size:12px;color:#10b981;font-weight:600;">' + _vnd(o.total_price||0) + '</div></div>'
      + '<div style="color:#94a3b8;font-size:12px;margin-top:3px;">' + _esc(String(cust)) + '</div>'
      + (addr ? '<div style="color:#64748b;font-size:11px;margin-top:2px;">&#x1F4CD; ' + _esc(addr) + '</div>' : '')
      + '<div style="font-size:11px;color:#3b82f6;margin-top:5px;font-style:italic;">&#x1F447; Nh\u1ea5n \u0111\u1ec3 ch\u1ecdn \u0111\u01a3n n\u00e0y</div>'
      + '</div>';
  }

  function _readyVehItem(v) {
    return '<div class="sk-veh-ready-item">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;">'
      + '<div style="font-weight:700;color:#e2e8f0;font-size:13.5px;">' + v.plate + '</div>'
      + _statusBadge(v.status) + '</div>'
      + '<div style="font-size:12px;color:#94a3b8;margin-top:4px;">' + _typeIcon(v.type) + ' ' + (v.driver_name||v.driver_email||'\u2014') + '</div>'
      + '<div style="font-size:11.5px;color:#64748b;margin-top:2px;">' + v.fuel_quota + ' L/100km &bull; ' + _fuelName(v.fuel_type) + '</div>'
      + '</div>';
  }

  function _lenhFill(orderId, addr) {
    var oEl = document.getElementById('dsp_order');
    var tEl = document.getElementById('dsp_to');
    if (oEl) oEl.value = orderId;
    if (tEl && addr) tEl.value = addr;
    var items = document.querySelectorAll('.sk-veh-order-item');
    for (var i = 0; i < items.length; i++) {
      var txt = items[i].textContent || items[i].innerText || '';
      if (txt.indexOf('#' + orderId) >= 0) { items[i].style.borderColor = '#3b82f6'; items[i].style.background = 'rgba(59,130,246,.1)'; }
      else { items[i].style.borderColor = ''; items[i].style.background = ''; }
    }
    _dspEstimate();
    _toast('&#x2714;&#xFE0F; \u0110\u00e3 ch\u1ecdn \u0111\u01a3n #' + orderId, 'ok');
  }

  function _dspEstimate() {
    var sel = document.getElementById('dsp_plate');
    var kmV = parseFloat(_val('dsp_km')||0); var toll = parseFloat(_val('dsp_toll')||0);
    var box = document.getElementById('dsp-estimate'); var val = document.getElementById('dsp-estimate-val');
    if (!sel||!sel.value||!kmV||!val||!box) { if(box) box.style.display='none'; return; }
    var opt   = sel.options[sel.selectedIndex];
    var quota = parseFloat(opt.getAttribute('data-q')||0);
    var ft    = opt.getAttribute('data-ft') || 'xang_ron95';
    var price = (window._veh.fuelPrices||_FUEL_DEFAULT)[ft] || (window._veh.fuelPrices||_FUEL_DEFAULT).xang_ron95;
    if (!quota||!price) { box.style.display='none'; return; }
    var total = (kmV/100)*quota*price + toll;
    box.style.display = 'block';
    val.innerHTML = _vnd(total) + ' <span style="font-size:12px;color:#64748b;font-weight:400;">('
      + ((kmV/100)*quota).toFixed(2) + 'L x\u0103ng' + (toll>0?' + c\u1ea7u '+_vnd(toll):'') + ')</span>';
  }

  function _dspExec() {
    var plate = _val('dsp_plate'); var km = _val('dsp_km');
    if (!plate) { _toast('&#x26A0;&#xFE0F; Ch\u1ecdn xe tr\u01b0\u1edbc!','warn'); return; }
    if (!km)    { _toast('&#x26A0;&#xFE0F; Nh\u1eadp kho\u1ea3ng c\u00e1ch!','warn'); return; }
    var sel   = document.getElementById('dsp_plate');
    var quota = sel ? parseFloat(sel.options[sel.selectedIndex].getAttribute('data-q')||0) : 0;
    api('veh_dispatch', {
      plate: plate, order_id: _val('dsp_order')||'', distance_km: km,
      fuel_quota: quota||8.5, toll_fee: _val('dsp_toll')||0,
      route_from: _val('dsp_from')||'', route_to: _val('dsp_to')||''
    }, function (err, d) {
      if (err||!d||!d.ok) { _toast('&#x274C; L\u1ed7i: ' + (d&&d.error||'?'),'error'); return; }
      _toast('&#x2705; L\u1ec7nh ' + d.log_id + ' \u2014 ' + _vnd(d.total_cost), 'ok');
      var reg = window._veh.registry || [];
      for (var j = 0; j < reg.length; j++) { if (reg[j].plate===d.plate) { reg[j].status='dang_giao'; break; } }
      _lenhRender();
    });
  }

  /* ============================================================
   * A8 — MODAL HOÀN THÀNH CHUYẾN
   * ============================================================ */
  function _completeOpen(plate) {
    _removeModal('sk-complete-modal');
    var h = '<div id="sk-complete-modal" class="sk-modal-overlay" onclick="_closeModal(\'sk-complete-modal\',event)">';
    h += '<div class="sk-modal-box" style="max-width:460px;" onclick="event.stopPropagation()">';
    h += '<div class="sk-modal-hd">&#x2705; Ho\u00e0n th\u00e0nh chuy\u1ebfn \u2014 ' + plate
      + '<button onclick="_removeModal(\'sk-complete-modal\')" class="sk-modal-close">&times;</button></div>';
    h += '<div class="sk-modal-bd">';
    h += '<div class="sk-veh-complete-banner">';
    h += '<div style="font-size:13px;font-weight:600;color:#10b981;margin-bottom:8px;">&#x1F4CB; H\u1ec7 th\u1ed1ng s\u1ebd t\u1ef1 \u0111\u1ed9ng:</div>';
    h += '<div style="font-size:12.5px;color:#94a3b8;line-height:1.7;">';
    h += '&#x2714;&#xFE0F; Xe <strong style="color:#e2e8f0;">' + plate + '</strong> \u2192 <strong style="color:#10b981;">S\u1eb5n s\u00e0ng</strong><br>';
    h += '&#x2714;&#xFE0F; C\u1eadp nh\u1eadt s\u1ed1 km Odometer<br>';
    h += '&#x2714;&#xFE0F; <strong style="color:#f59e0b;">T\u1ef1 t\u1ea1o phi\u1ebfu chi x\u0103ng</strong> v\u00e0o Finance_Logs</div></div>';
    h += '<label class="sk-lbl" style="margin-top:14px;">Odometer cu\u1ed1i chuy\u1ebfn <em style="color:#64748b;font-weight:400;">\u2014 kh\u00f4ng b\u1eaft bu\u1ed9c</em></label>';
    h += '<input id="cmp_odo" class="sk-inp" type="number" placeholder="Nh\u1eadp \u0111\u1ec3 c\u1eadp nh\u1eadt odometer">';
    h += '<label class="sk-lbl" style="margin-top:12px;">Km th\u1ef1c t\u1ebf <em style="color:#64748b;font-weight:400;">\u2014 kh\u00f4ng b\u1eaft bu\u1ed9c</em></label>';
    h += '<input id="cmp_dist" class="sk-inp" type="number" placeholder="B\u1ecf tr\u1ed1ng = gi\u1eef km \u0111\u00e3 ghi">';
    h += '<label class="sk-lbl" style="margin-top:12px;">Ghi ch\u00fa</label>';
    h += '<input id="cmp_note" class="sk-inp" type="text" placeholder="VD: Giao th\u00e0nh c\u00f4ng...">';
    h += '</div>';
    h += '<div class="sk-modal-ft">';
    h += '<button class="sk-btn-sm sk-btn-outline" onclick="_removeModal(\'sk-complete-modal\')">H\u1ee7y</button>';
    h += '<button class="sk-btn" style="background:linear-gradient(135deg,#10b981,#059669);"'
      + ' onclick="_completeSave(\'' + _esc(plate) + '\')">&#x2705; X\u00e1c nh\u1eadn ho\u00e0n th\u00e0nh</button>';
    h += '</div></div></div>';
    document.body.appendChild(document.createRange().createContextualFragment(h));
  }

  function _completeSave(plate) {
    var btn = document.querySelector('[onclick="_completeSave(\'' + plate + '\')"]');
    if (btn) { btn.disabled = true; btn.textContent = '\u0110ang x\u1eed l\u00fd...'; }
    api('veh_complete_trip', {
      plate: plate, final_odometer: _val('cmp_odo'),
      actual_distance: _val('cmp_dist'), note: _val('cmp_note')
    }, function (err, d) {
      if (btn) { btn.disabled = false; btn.innerHTML = '&#x2705; X\u00e1c nh\u1eadn'; }
      _removeModal('sk-complete-modal');
      if (err||!d||!d.ok) { _toast('&#x274C; L\u1ed7i: ' + (d&&d.error||'?'),'error'); return; }
      var msg = '&#x2705; Xe ' + plate + ' \u0111\u00e3 v\u1ec1!';
      if (d.finance_created) msg += ' \u2014 Ph\u1ebfu chi ' + _vnd(d.total_cost) + ' \u2192 Finance_Logs &#x1F4B0;';
      _toast(msg, 'ok');
      var reg = window._veh.registry || [];
      for (var i = 0; i < reg.length; i++) {
        if (reg[i].plate === plate) { reg[i].status = 'san_sang'; if (d.new_odometer) reg[i].odometer = d.new_odometer; break; }
      }
      _vehRender();
    });
  }

  /* ============================================================
   * A9 — TAB BÁO CÁO
   * ============================================================ */
  function _bcRender() {
    var b = _body(); if (!b) return;
    b.innerHTML = _skelBlock();
    var now = new Date();
    api('veh_monthly_report', { month: now.getMonth()+1, year: now.getFullYear() }, function (err, d) {
      var b2 = _body(); if (!b2) return;
      if (err||!d||!d.ok) { b2.innerHTML = _errBox(d&&d.error); return; }
      b2.innerHTML = _bcHtml(d);
    });
  }

  function _bcHtml(d) {
    var rows = d.data || [];
    var months = ['','Th\u00e1ng 1','Th\u00e1ng 2','Th\u00e1ng 3','Th\u00e1ng 4','Th\u00e1ng 5','Th\u00e1ng 6',
      'Th\u00e1ng 7','Th\u00e1ng 8','Th\u00e1ng 9','Th\u00e1ng 10','Th\u00e1ng 11','Th\u00e1ng 12'];
    var h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">';
    h += '<h3 style="margin:0;font-size:15px;font-weight:700;color:#e2e8f0;">&#x1F4CA; B\u00e1o c\u00e1o ' + months[d.month] + ' ' + d.year + '</h3>';
    h += '<div style="display:flex;gap:8px;">';
    h += '<button class="sk-btn-sm sk-btn-outline" onclick="_syncFinance()">&#x21C4; Sync Finance</button>';
    h += '<button class="sk-btn-sm" onclick="_bcRender()">&#x21BA; L\u00e0m m\u1edbi</button></div></div>';
    var trips=0; var km=0; var liters=0;
    for (var i=0;i<rows.length;i++) { trips+=rows[i].trips; km+=rows[i].total_distance; liters+=rows[i].total_fuel_liters; }
    h += '<div class="sk-g5" style="margin-bottom:18px;">';
    h += _kpiBox('#3b82f6','Xe ho\u1ea1t \u0111\u1ed9ng',rows.length,'xe');
    h += _kpiBox('#10b981','T\u1ed5ng chuy\u1ebfn',trips,'chuy\u1ebfn');
    h += _kpiBox('#f97316','T\u1ed5ng km',Math.round(km),'km');
    h += _kpiBox('#f59e0b','X\u0103ng ti\u00eau th\u1ee5',(Math.round(liters*10)/10)+'L','');
    h += _kpiBox('#ef4444','T\u1ed5ng chi ph\u00ed',_vnd(d.grand_total),'');
    h += '</div>';
    if (rows.length===0) return h + _emptyBox('&#x1F4CA;','Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u','Kh\u00f4ng c\u00f3 chuy\u1ebfn n\u00e0o');
    h += '<div class="sk-panel" style="overflow:hidden;padding:0;">';
    h += '<table style="width:100%;border-collapse:collapse;font-size:12.5px;">';
    h += '<thead><tr style="background:#1e293b;">';
    var cols=['Xe / T\u00e0i x\u1ebf','Chuy\u1ebfn','Km','X\u0103ng (L)','CP x\u0103ng','Ph\u00ed c\u1ea7u','T\u1ed5ng'];
    for (var c=0;c<cols.length;c++) {
      var al = c===0?'left':(c===1?'center':'right');
      h += '<th style="padding:11px 14px;color:#64748b;font-weight:500;text-align:' + al + ';">' + cols[c] + '</th>';
    }
    h += '</tr></thead><tbody>';
    for (var r=0;r<rows.length;r++) {
      var row=rows[r]; var bg=r%2===0?'transparent':'rgba(255,255,255,.018)';
      h += '<tr style="background:' + bg + ';border-bottom:1px solid #1e293b;">';
      h += '<td style="padding:11px 14px;"><div style="font-weight:700;color:#f1f5f9;">' + row.plate + '</div>'
        + '<div style="font-size:11px;color:#64748b;">' + (row.driver_email||'') + '</div></td>';
      h += '<td style="padding:11px 14px;text-align:center;color:#94a3b8;">' + row.trips + '</td>';
      h += '<td style="padding:11px 14px;text-align:right;color:#94a3b8;font-variant-numeric:tabular-nums;">' + row.total_distance + '</td>';
      h += '<td style="padding:11px 14px;text-align:right;color:#94a3b8;font-variant-numeric:tabular-nums;">' + row.total_fuel_liters + '</td>';
      h += '<td style="padding:11px 14px;text-align:right;color:#94a3b8;font-variant-numeric:tabular-nums;">' + _vnd(row.total_fuel_cost) + '</td>';
      h += '<td style="padding:11px 14px;text-align:right;color:#94a3b8;font-variant-numeric:tabular-nums;">' + _vnd(row.total_toll) + '</td>';
      h += '<td style="padding:11px 14px;text-align:right;font-weight:700;color:#f59e0b;font-variant-numeric:tabular-nums;">' + _vnd(row.total_cost) + '</td>';
      h += '</tr>';
    }
    h += '</tbody></table></div>';
    return h;
  }

  function _syncFinance() {
    api('veh_sync_finance', {}, function (err, d) {
      if (err||!d||!d.ok) { _toast('&#x274C; L\u1ed7i sync: ' + (d&&d.error||'?'),'error'); return; }
      _toast('&#x2705; \u0110\u00e3 sync ' + d.synced + ' b\u1ea3n ghi \u2192 Finance_Logs','ok');
    });
  }

  /* ============================================================
   * A10 — SHORTCUTS
   * ============================================================ */
  function _dispatchOpen(plate) {
    _vehTab('lenh');
    setTimeout(function () {
      var sel = document.getElementById('dsp_plate');
      if (sel) { sel.value = plate; _dspEstimate(); }
    }, 350);
  }

  /* ============================================================
   * A11 — CSS
   * ============================================================ */
  function _injectCss() {
    if (document.getElementById('sk-veh-css')) return;
    var s = document.createElement('style');
    s.id = 'sk-veh-css';
    s.textContent = [
      '.sk-veh-tabbar{display:flex;background:#0a0f1e;border-bottom:1px solid #1e293b;overflow-x:auto;-webkit-overflow-scrolling:touch;}',
      '.sk-veh-tab{display:flex;align-items:center;gap:7px;padding:13px 20px;background:none;border:none;border-bottom:2px solid transparent;color:#64748b;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;transition:color .2s,border-color .2s;}',
      '.sk-veh-tab:hover{color:#94a3b8;}',
      '.sk-veh-tab.active{color:#e2e8f0!important;border-bottom-color:#3b82f6!important;}',
      '.sk-veh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(295px,1fr));gap:16px;}',
      '.sk-veh-card{background:linear-gradient(135deg,#111827,#0f172a);border:1px solid #1e293b;border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:13px;transition:transform .15s,box-shadow .2s;}',
      '.sk-veh-card:hover{transform:translateY(-3px);}',
      '.sk-veh-info{display:flex;flex-direction:column;gap:7px;border-top:1px solid #1e293b;padding-top:12px;}',
      '.sk-veh-info-row{display:flex;justify-content:space-between;align-items:baseline;gap:8px;}',
      '.sk-veh-maint-wrap{background:rgba(255,255,255,.03);border:1px solid #1e293b;border-radius:8px;padding:10px 12px;}',
      '.sk-veh-maint-bg{height:7px;background:#1e293b;border-radius:4px;overflow:hidden;}',
      '.sk-veh-maint-fill{height:100%;border-radius:4px;transition:width .4s ease;}',
      '.sk-veh-card-warn{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.18);border-radius:8px;padding:8px 11px;}',
      '.sk-veh-card-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:2px;}',
      '.sk-btn-sm{padding:6px 13px;font-size:12px;border-radius:8px;border:none;cursor:pointer;font-weight:600;color:#fff;transition:opacity .15s,transform .1s;}',
      '.sk-btn-sm:hover{opacity:.88;transform:scale(.98);}',
      '.sk-btn-sm:active{transform:scale(.95);}',
      '.sk-btn-outline{background:transparent!important;border:1px solid #334155!important;color:#94a3b8!important;}',
      '.sk-btn-outline:hover{background:#1e293b!important;color:#e2e8f0!important;}',
      '.sk-veh-alert-bar{background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.22);border-radius:10px;padding:13px 16px;}',
      '.sk-veh-calc-wrap{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:12px;}',
      '.sk-veh-toll-section{background:rgba(245,158,11,.05);border:1px solid rgba(245,158,11,.2);border-radius:10px;padding:14px;margin-top:12px;}',
      '.sk-veh-breakdown{background:rgba(255,255,255,.03);border-radius:8px;padding:10px 12px;margin-top:6px;}',
      '.sk-veh-bar-wrap{height:10px;border-radius:5px;overflow:hidden;display:flex;background:#1e293b;}',
      '.sk-veh-bar-f{background:#3b82f6;transition:width .35s ease;}',
      '.sk-veh-bar-t{background:#f59e0b;transition:width .35s ease;}',
      '.sk-veh-bar-o{background:#8b5cf6;transition:width .35s ease;}',
      '.sk-veh-total-box{background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.22);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:4px;}',
      '.sk-veh-notice-warn{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:8px;padding:8px 12px;font-size:12px;color:#f59e0b;margin-bottom:12px;}',
      '.sk-veh-notice-ok{background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.18);border-radius:8px;padding:8px 12px;font-size:12px;color:#10b981;margin-bottom:12px;}',
      '.sk-veh-lenh-wrap{display:grid;grid-template-columns:1fr 1fr;gap:16px;}',
      '.sk-veh-order-item{background:rgba(255,255,255,.03);border:1px solid #1e293b;border-radius:9px;padding:12px 14px;cursor:pointer;transition:background .15s,border-color .15s,transform .1s;}',
      '.sk-veh-order-item:hover{background:rgba(59,130,246,.08);border-color:rgba(59,130,246,.35);transform:scale(1.01);}',
      '.sk-veh-ready-item{background:rgba(16,185,129,.05);border:1px solid rgba(16,185,129,.18);border-radius:9px;padding:12px 14px;}',
      '.sk-veh-dsp-estimate{background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.2);border-radius:9px;padding:12px 14px;}',
      '.sk-veh-complete-banner{background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.22);border-radius:10px;padding:14px 16px;margin-bottom:4px;}',
      '.sk-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;}',
      '.sk-modal-box{background:#0f172a;border:1px solid #1e293b;border-radius:16px;width:100%;max-width:600px;max-height:92vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,.9);}',
      '.sk-modal-hd{display:flex;justify-content:space-between;align-items:center;padding:17px 22px;border-bottom:1px solid #1e293b;font-size:14.5px;font-weight:700;color:#e2e8f0;}',
      '.sk-modal-bd{padding:18px 22px;}',
      '.sk-modal-ft{display:flex;justify-content:flex-end;gap:9px;padding:14px 22px;border-top:1px solid #1e293b;}',
      '.sk-modal-close{background:none;border:none;color:#64748b;font-size:22px;cursor:pointer;line-height:1;padding:0 4px;}',
      '.sk-modal-close:hover{color:#e2e8f0;}',
      '.sk-fg2{display:grid;grid-template-columns:1fr 1fr;gap:13px;}',
      '.sk-lbl{display:block;font-size:11.5px;color:#94a3b8;margin-bottom:4px;font-weight:500;}',
      '.sk-veh-kpi{background:#111827;border:1px solid #1e293b;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:3px;}',
      '.sk-badge{border-radius:999px;padding:3px 11px;font-size:11.5px;font-weight:700;white-space:nowrap;}',
      '@keyframes sk-ti{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}',
      '@media(max-width:768px){.sk-veh-calc-wrap,.sk-veh-lenh-wrap,.sk-veh-grid{grid-template-columns:1fr;}.sk-fg2{grid-column:1fr;}.sk-veh-tabbar{flex-wrap:nowrap;}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ============================================================
   * A12 — HELPERS
   * ============================================================ */
  function _vnd(n) { if(typeof fv==='function') return fv(n); n=Number(n)||0; if(n>=1e9) return (Math.round(n/1e7)/100)+' t\u1ef7'; if(n>=1e6) return (Math.round(n/1e4)/100)+' tr'; return n.toLocaleString('vi-VN')+'\u0111'; }
  function _num(n) { return (Number(n)||0).toLocaleString('vi-VN'); }
  function _fmtDate(s) { if(!s) return '\u2014'; var d=new Date(s); if(isNaN(d.getTime())) return String(s); return d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear(); }
  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function _val(id) { var e=document.getElementById(id); return e?e.value:''; }
  function _statusColor(s) { return {san_sang:'#10b981',dang_giao:'#3b82f6',bao_duong:'#f59e0b',ngung:'#ef4444'}[s]||'#64748b'; }
  function _statusBadge(s) {
    var lbl={san_sang:'S\u1eb5n s\u00e0ng',dang_giao:'\u0110ang giao',bao_duong:'B\u1ea3o d\u01b0\u1ee1ng',ngung:'Ng\u01b0ng'};
    var c=_statusColor(s);
    return '<span class="sk-badge" style="background:'+c+'1a;color:'+c+';border:1px solid '+c+'33;">'+(lbl[s]||s)+'</span>';
  }
  function _daysColor(st) { if(st==='expired') return '#ef4444'; if(st==='urgent') return '#f97316'; if(st==='warn') return '#f59e0b'; return '#10b981'; }
  function _typeName(t) { return {xe_tai:'Xe t\u1ea3i',xe_may:'Xe m\u00e1y',xe_lanh:'Xe l\u1ea1nh'}[t]||t; }
  function _typeIcon(t) { return {xe_tai:'&#x1F69A;',xe_may:'&#x1F6F5;',xe_lanh:'&#x1F699;'}[t]||'&#x1F697;'; }
  function _fuelName(t) { return {xang_ron95:'RON 95',xang_ron92:'RON 92',dau_diesel:'Diesel'}[t]||t; }
  function _opt(val,label,cur) { return '<option value="'+val+'"'+(cur===val?' selected':'')+'>'+label+'</option>'; }
  function _kpiBox(color,label,value,sub) { if(typeof kpi==='function') return kpi(color,label,value,sub); return '<div class="sk-veh-kpi" style="border-top:3px solid '+color+';">'+'<div style="font-size:11.5px;color:#64748b;">'+label+'</div>'+'<div style="font-size:21px;font-weight:700;color:#e2e8f0;font-variant-numeric:tabular-nums;">'+value+'</div>'+(sub?'<div style="font-size:11px;color:#64748b;">'+sub+'</div>':'')+'</div>'; }
  function _skelBlock() { if(typeof skel==='function') return skel(); return '<div style="text-align:center;padding:60px;color:#64748b;"><div style="width:32px;height:32px;border:2px solid #334155;border-top-color:#3b82f6;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px;"></div>\u0110ang t\u1ea3i...</div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>'; }
  function _errBox(msg) { return '<div style="padding:20px;color:#ef4444;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:10px;font-size:13px;">&#x274C; L\u1ed7i: '+_esc(msg||'Kh\u00f4ng r\u00f5')+'</div>'; }
  function _emptyBox(icon,title,desc) { if(typeof emptyState==='function') return emptyState(icon,title,desc); return '<div style="text-align:center;padding:48px 24px;color:#64748b;"><div style="font-size:38px;margin-bottom:12px;">'+icon+'</div><div style="font-size:14px;color:#94a3b8;font-weight:600;margin-bottom:6px;">'+title+'</div><div style="font-size:12.5px;">'+desc+'</div></div>'; }
  function _toast(msg,type) {
    var old=document.getElementById('sk-veh-toast'); if(old) old.remove();
    var bg=type==='ok'?'rgba(16,185,129,.15)':type==='warn'?'rgba(245,158,11,.15)':'rgba(239,68,68,.15)';
    var bd=type==='ok'?'#10b981':type==='warn'?'#f59e0b':'#ef4444';
    var el=document.createElement('div'); el.id='sk-veh-toast';
    el.setAttribute('style','position:fixed;bottom:22px;right:22px;z-index:99999;background:'+bg+';border:1px solid '+bd+';border-radius:11px;padding:12px 18px;color:#e2e8f0;font-size:13px;max-width:360px;box-shadow:0 8px 32px rgba(0,0,0,.7);animation:sk-ti .2s ease;pointer-events:none;line-height:1.5;');
    el.innerHTML=msg; document.body.appendChild(el);
    setTimeout(function(){ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(function(){ if(el.parentNode) el.remove(); },320); },4000);
  }
  function _removeModal(id) { var m=document.getElementById(id); if(m) m.remove(); }
  function _closeModal(id,e) { if(e&&e.target&&e.target.id===id) _removeModal(id); }

  /* ============================================================
   * A13 — EXPOSE RA WINDOW
   * [FIX-2] C\u00e1c alias backward-compat cho m\u1ecdi t\u00ean c\u0169 Theme XML
   *   c\u00f3 th\u1ec3 g\u1ecdi: _vehTabDS, _vehTabDieu, _vehTabCost, v.v.
   * ============================================================ */
  _injectCss();

  /* H\u00e0m ch\u00ednh */
  window.loadVehicle         = loadVehicle;
  window.loadPhuongTien      = loadPhuongTien;

  /* Tab switching — t\u00ean ch\u00ednh th\u1ee9c */
  window._vehTab             = _vehTab;

  /* [FIX-2] Alias backward-compat — t\u1ea5t c\u1ea3 t\u00ean c\u0169 Theme XML c\u00f3 th\u1ec3 g\u1ecdi */
  window._vehTabDS           = loadVehicle;
  window._vehTabDieu         = function(){ document.getElementById('veh-body') ? _vehTab('lenh') : (loadVehicle(), setTimeout(function(){ _vehTab('lenh'); }, 350)); };
  window._vehTabCost         = function(){ document.getElementById('veh-body') ? _vehTab('xang') : (loadVehicle(), setTimeout(function(){ _vehTab('xang'); }, 350)); };
  window._vehTabXang         = window._vehTabCost;
  window._vehTabLenh         = window._vehTabDieu;
  window._vehTabBC           = function(){ document.getElementById('veh-body') ? _vehTab('bc')   : (loadVehicle(), setTimeout(function(){ _vehTab('bc');   }, 350)); };
  window._vehViewRoute       = function(logId){ _toast('&#x1F5FA;&#xFE0F; Xem l\u1ed9 tr\u00ecnh: ' + logId, 'ok'); };

  /* Data + forms */
  window._vehRender          = _vehRender;
  window._vehOpenForm        = _vehOpenForm;
  window._vehSaveForm        = _vehSaveForm;
  window._vehShowAddForm     = _vehOpenForm;   /* alias c\u0169 */

  /* Calculator */
  window._calcFillQuota      = _calcFillQuota;
  window._calcTollPre        = _calcTollPre;
  window._calcLive           = _calcLive;
  window._calcVerify         = _calcVerify;
  window._calcSave           = _calcSave;
  window._vehSaveCost        = _calcSave;      /* alias c\u0169 */

  /* Dispatch */
  window._lenhFill           = _lenhFill;
  window._dspEstimate        = _dspEstimate;
  window._dspExec            = _dspExec;
  window._vehDispatch        = _dspExec;       /* alias c\u0169 */
  window._dispatchOpen       = _dispatchOpen;

  /* Complete */
  window._completeOpen       = _completeOpen;
  window._completeSave       = _completeSave;

  /* Finance */
  window._syncFinance        = _syncFinance;

  /* Modal */
  window._removeModal        = _removeModal;
  window._closeModal         = _closeModal;

}());
