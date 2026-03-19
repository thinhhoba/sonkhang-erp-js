/**
 * sk-vehicle.js — SonKhang ERP v3.5
 * Module: Qu\u1ea3n l\u00fd Ph\u01b0\u01a1ng ti\u1ec7n (Vehicle Management)
 * CDN: https://thinhhoba.github.io/sonkhang-erp-js/sk-vehicle.js
 * 
 * QUY \u01af\u1edcC:
 * - Ch\u1ec9 d\u00f9ng var (kh\u00f4ng let/const) — CDATA-safe cho Blogger XML
 * - Ti\u1ebfng Vi\u1ec7t d\u00f9ng Unicode escape
 * - Emoji d\u00f9ng HTML entity (&#xHEX;)
 * - T\u1ea5t c\u1ea3 h\u00e0m public expose ra window.*
 * 
 * Ph\u1ee5 thu\u1ed9c: api(), getContent() t\u1eeb theme XML
 * 
 * Ng\u00e0y: 19/03/2026
 * Ki\u1ebfn tr\u00fac s\u01b0: Claude Opus 4.6
 */
(function(){
  'use strict';

  // ============================================================
  // STATE
  // ============================================================
  var _veh = {
    tab: 'ds',
    loading: false,
    registry: [],
    alerts: [],
    drivers: [],
    editPlate: null
  };
  window._veh = _veh;

  // Gi\u00e1 x\u0103ng m\u1eb7c \u0111\u1ecbnh (client-side, sync v\u1edbi GAS)
  var FUEL_PRICES = {
    'xang_ron95': 25170,
    'xang_ron92': 23810,
    'dau_diesel': 21550
  };

  var VEH_TYPES = {
    'xe_tai': 'Xe t\u1ea3i',
    'xe_may': 'Xe m\u00e1y',
    'xe_lanh': 'Xe l\u1ea1nh'
  };

  var FUEL_TYPES = {
    'xang_ron95': 'X\u0103ng RON 95',
    'xang_ron92': 'X\u0103ng RON 92',
    'dau_diesel': 'D\u1ea7u Diesel'
  };

  var STATUS_MAP = {
    'san_sang':  {label: 'S\u1eb5n s\u00e0ng',  color: 'var(--sk-green)'},
    'dang_giao': {label: '\u0110ang giao', color: 'var(--sk-blue)'},
    'bao_duong': {label: 'B\u1ea3o d\u01b0\u1ee1ng', color: 'var(--sk-yellow)'},
    'ngung':     {label: 'Ng\u01b0ng',     color: 'var(--sk-red)'}
  };

  // ============================================================
  // HELPERS
  // ============================================================
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function fmtNum(n) {
    return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function fmtDate(d) {
    if (!d) return '-';
    var dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    var dd = String(dt.getDate()).padStart(2, '0');
    var mm = String(dt.getMonth() + 1).padStart(2, '0');
    return dd + '/' + mm + '/' + dt.getFullYear();
  }

  function getEl(id) { return document.getElementById(id); }

  function toast(msg, type) {
    // Simple toast — d\u00f9ng alert fallback, sau n\u00e0y upgrade
    alert(msg);
  }

  // ============================================================
  // MAIN LOADER
  // ============================================================
  function loadVehicle() {
    var ct = getContent();
    if (!ct) return;

    var h = '<div class="sk-panel" style="padding:24px">';
    h += '<div class="sk-pt" style="display:flex;align-items:center;justify-content:space-between">';
    h += '<span>&#x1F69A; Qu\u1ea3n l\u00fd Ph\u01b0\u01a1ng ti\u1ec7n</span>';
    h += '</div>';

    // Tab buttons
    h += '<div style="display:flex;gap:8px;margin:16px 0;flex-wrap:wrap">';
    var tabs = [
      {id:'ds',     icon:'&#x1F697;', label:'Danh s\u00e1ch xe'},
      {id:'cost',   icon:'&#x26FD;',  label:'T\u00ednh chi ph\u00ed x\u0103ng'},
      {id:'dispatch', icon:'&#x1F4E6;', label:'L\u1ec7nh \u0111i\u1ec1u xe'},
      {id:'report', icon:'&#x1F4C8;', label:'B\u00e1o c\u00e1o th\u00e1ng'}
    ];
    for (var t = 0; t < tabs.length; t++) {
      var isActive = _veh.tab === tabs[t].id;
      h += '<button class="sk-btn" style="'
        + (isActive ? 'background:var(--sk-blue);' : 'background:transparent;border:1px solid #374151;')
        + 'font-size:13px;padding:6px 14px" '
        + 'onclick="_vehTab(\'' + tabs[t].id + '\')">'
        + tabs[t].icon + ' ' + tabs[t].label + '</button>';
    }
    h += '</div>';

    h += '<div id="veh-content"></div>';
    h += '</div>';

    ct.innerHTML = h;
    _vehRender();
  }

  function _vehTab(t) {
    _veh.tab = t;
    // Re-render tabs highlight
    loadVehicle();
  }

  function _vehRender() {
    var st = _veh;
    if (st.loading) return;
    if (st.tab === 'ds') _vehRenderRegistry();
    else if (st.tab === 'cost') _vehRenderCostCalc();
    else if (st.tab === 'dispatch') _vehRenderDispatch();
    else if (st.tab === 'report') _vehRenderReport();
  }

  // ============================================================
  // TAB 1: DANH S\u00c1CH XE (Cards)
  // ============================================================
  function _vehRenderRegistry() {
    var el = getEl('veh-content');
    if (!el) return;
    _veh.loading = true;
    el.innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af">&#x23F3; \u0110ang t\u1ea3i danh s\u00e1ch xe...</div>';

    api('veh_get_registry', {}, function(err, d) {
      _veh.loading = false;
      var el = getEl('veh-content');
      if (!el) return;
      if (err || !d || !d.ok) {
        el.innerHTML = '<div style="color:var(--sk-red);padding:20px">L\u1ed7i: ' + (d ? d.error : String(err)) + '</div>';
        return;
      }
      _veh.registry = d.vehicles || [];
      _veh.alerts = d.alerts || [];

      var h = '';

      // ---- Alerts ----
      if (_veh.alerts.length > 0) {
        h += '<div style="margin-bottom:16px">';
        for (var i = 0; i < _veh.alerts.length; i++) {
          var a = _veh.alerts[i];
          var color = a.type === 'danger' ? 'var(--sk-red)' : 'var(--sk-yellow)';
          h += '<div style="padding:8px 12px;margin:4px 0;border-left:3px solid ' + color
            + ';background:rgba(255,255,255,0.03);border-radius:4px;font-size:13px">'
            + '<strong>' + esc(a.plate) + '</strong>: ' + esc(a.msg) + '</div>';
        }
        h += '</div>';
      }

      // ---- Toolbar ----
      h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
      h += '<span style="font-size:13px;color:#6b7280">' + _veh.registry.length + ' xe</span>';
      h += '<button class="sk-btn" style="font-size:13px" onclick="_vehShowForm(null)">+ Th\u00eam xe m\u1edbi</button>';
      h += '</div>';

      // ---- Vehicle Cards ----
      if (_veh.registry.length === 0) {
        h += '<div style="text-align:center;color:#6b7280;padding:60px 20px">'
          + '<div style="font-size:48px;margin-bottom:12px">&#x1F697;</div>'
          + 'Ch\u01b0a c\u00f3 xe n\u00e0o trong h\u1ec7 th\u1ed1ng.<br>'
          + 'Nh\u1ea5n <strong>"+ Th\u00eam xe m\u1edbi"</strong> \u0111\u1ec3 b\u1eaft \u0111\u1ea7u.'
          + '</div>';
      } else {
        h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">';
        for (var i = 0; i < _veh.registry.length; i++) {
          h += _vehCardHTML(_veh.registry[i]);
        }
        h += '</div>';
      }

      el.innerHTML = h;
    });
  }

  function _vehCardHTML(v) {
    var st = STATUS_MAP[v.status] || STATUS_MAP['san_sang'];
    var typeName = VEH_TYPES[v.type] || v.type;
    var fuelName = FUEL_TYPES[v.fuel_type] || v.fuel_type;

    var h = '<div class="sk-panel" style="padding:16px;position:relative">';

    // Status badge
    h += '<div style="position:absolute;top:12px;right:12px;padding:2px 10px;border-radius:12px;'
      + 'font-size:11px;font-weight:600;background:' + st.color + ';color:#fff">' + st.label + '</div>';

    // Plate
    h += '<div style="font-size:20px;font-weight:700;color:var(--sk-blue);letter-spacing:1px">'
      + esc(v.plate) + '</div>';

    // Type + fuel
    h += '<div style="font-size:12px;color:#9ca3af;margin:4px 0">'
      + esc(typeName) + ' &#x2022; ' + esc(fuelName) + '</div>';

    // Info rows
    h += '<div style="margin:12px 0;font-size:13px;color:#d1d5db;line-height:1.8">';
    h += '&#x1F464; ' + esc(v.driver_name || 'Ch\u01b0a g\u00e1n t\u00e0i x\u1ebf') + '<br>';
    h += '&#x26FD; \u0110\u1ecbnh m\u1ee9c: <strong>' + v.fuel_quota + ' L/100km</strong><br>';
    h += '&#x1F4CF; Odometer: <strong>' + fmtNum(v.odometer) + ' km</strong><br>';
    h += '&#x1F3CB; T\u1ea3i tr\u1ecdng: ' + fmtNum(v.load_capacity) + ' kg';
    h += '</div>';

    // Dates
    h += '<div style="font-size:11px;color:#6b7280;margin-bottom:12px">';
    h += '\u0110K: ' + fmtDate(v.registration_exp) + ' &#x2022; BH: ' + fmtDate(v.insurance_exp);
    h += '</div>';

    // Actions
    h += '<div style="display:flex;gap:6px">';
    h += '<button class="sk-btn" style="font-size:12px;padding:5px 12px" '
      + 'onclick="_vehShowForm(\'' + esc(v.plate) + '\')">&#x270F; S\u1eeda</button>';
    h += '<button class="sk-btn" style="font-size:12px;padding:5px 12px;background:var(--sk-green)" '
      + 'onclick="_vehQuickCalc(\'' + esc(v.plate) + '\')">&#x26FD; T\u00ednh x\u0103ng</button>';
    h += '</div>';

    h += '</div>';
    return h;
  }

  // ============================================================
  // FORM TH\u00caM / S\u1eeca XE (Modal)
  // ============================================================
  function _vehShowForm(plate) {
    var isEdit = !!plate;
    var v = null;

    if (isEdit) {
      for (var i = 0; i < _veh.registry.length; i++) {
        if (_veh.registry[i].plate === plate) { v = _veh.registry[i]; break; }
      }
    }

    // Load drivers cho dropdown
    api('veh_get_drivers', {}, function(err, d) {
      _veh.drivers = (d && d.ok) ? (d.drivers || []) : [];
      _vehRenderFormModal(isEdit, v);
    });
  }

  function _vehRenderFormModal(isEdit, v) {
    // Remove old modal
    var old = getEl('veh-modal');
    if (old) old.remove();

    var h = '<div id="veh-modal" style="position:fixed;top:0;left:0;right:0;bottom:0;'
      + 'background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;'
      + 'padding:20px" onclick="if(event.target===this)_vehCloseModal()">';

    h += '<div class="sk-panel" style="padding:24px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto">';

    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">';
    h += '<div class="sk-pt" style="margin:0">'
      + (isEdit ? '&#x270F; S\u1eeda xe: ' + esc(v.plate) : '&#x2795; Th\u00eam xe m\u1edbi') + '</div>';
    h += '<button onclick="_vehCloseModal()" style="background:none;border:none;color:#9ca3af;font-size:20px;cursor:pointer">&times;</button>';
    h += '</div>';

    // Form grid
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';

    // Bi\u1ec3n s\u1ed1
    h += _field('vf-plate', 'Bi\u1ec3n s\u1ed1 xe *', 'text', v ? v.plate : '', 'VD: 51A-12345', isEdit);

    // Lo\u1ea1i xe
    h += '<div><label style="font-size:12px;color:#9ca3af">Lo\u1ea1i xe</label>'
      + '<select id="vf-type" class="sk-inp" style="width:100%">';
    var types = ['xe_tai', 'xe_may', 'xe_lanh'];
    for (var t = 0; t < types.length; t++) {
      var sel = (v && v.type === types[t]) ? ' selected' : '';
      h += '<option value="' + types[t] + '"' + sel + '>' + VEH_TYPES[types[t]] + '</option>';
    }
    h += '</select></div>';

    // T\u00e0i x\u1ebf (dropdown t\u1eeb User_Database)
    h += '<div><label style="font-size:12px;color:#9ca3af">T\u00e0i x\u1ebf (role=xe)</label>'
      + '<select id="vf-driver" class="sk-inp" style="width:100%">'
      + '<option value="">-- Ch\u01b0a g\u00e1n --</option>';
    for (var d = 0; d < _veh.drivers.length; d++) {
      var dr = _veh.drivers[d];
      var sel = (v && v.driver_email === dr.email) ? ' selected' : '';
      h += '<option value="' + esc(dr.email) + '"' + sel + '>'
        + esc(dr.name) + ' (' + esc(dr.email) + ')</option>';
    }
    h += '</select></div>';

    // Lo\u1ea1i nhi\u00ean li\u1ec7u
    h += '<div><label style="font-size:12px;color:#9ca3af">Nhi\u00ean li\u1ec7u</label>'
      + '<select id="vf-fueltype" class="sk-inp" style="width:100%">';
    var ftypes = ['xang_ron92', 'xang_ron95', 'dau_diesel'];
    for (var f = 0; f < ftypes.length; f++) {
      var sel = (v && v.fuel_type === ftypes[f]) ? ' selected' : '';
      h += '<option value="' + ftypes[f] + '"' + sel + '>' + FUEL_TYPES[ftypes[f]] + '</option>';
    }
    h += '</select></div>';

    // \u0110\u1ecbnh m\u1ee9c x\u0103ng
    h += _field('vf-quota', '\u0110\u1ecbnh m\u1ee9c (L/100km) *', 'number', v ? v.fuel_quota : 12, 'VD: 12');

    // T\u1ea3i tr\u1ecdng
    h += _field('vf-load', 'T\u1ea3i tr\u1ecdng (kg)', 'number', v ? v.load_capacity : 0, 'VD: 2000');

    // Odometer
    h += _field('vf-odo', 'Odometer (km)', 'number', v ? v.odometer : 0, 'S\u1ed1 km hi\u1ec7n t\u1ea1i');

    // H\u1ea1n \u0111\u0103ng ki\u1ec3m
    var regExpVal = (v && v.registration_exp) ? _isoDate(v.registration_exp) : '';
    h += _field('vf-regexp', 'H\u1ea1n \u0111\u0103ng ki\u1ec3m', 'date', regExpVal, '');

    // H\u1ea1n b\u1ea3o hi\u1ec3m
    var insExpVal = (v && v.insurance_exp) ? _isoDate(v.insurance_exp) : '';
    h += _field('vf-insexp', 'H\u1ea1n b\u1ea3o hi\u1ec3m', 'date', insExpVal, '');

    // M\u1ed1c b\u1ea3o d\u01b0\u1ee1ng
    h += _field('vf-maint', 'M\u1ed1c b\u1ea3o d\u01b0\u1ee1ng (km)', 'number', v ? v.maint_km : 0, 'VD: 50000');

    // Khu v\u1ef1c
    h += _field('vf-area', 'Khu v\u1ef1c', 'text', v ? v.area : '', 'VD: HCM, HN');

    // Tr\u1ea1ng th\u00e1i
    h += '<div><label style="font-size:12px;color:#9ca3af">Tr\u1ea1ng th\u00e1i</label>'
      + '<select id="vf-status" class="sk-inp" style="width:100%">';
    var statuses = ['san_sang', 'dang_giao', 'bao_duong', 'ngung'];
    for (var s = 0; s < statuses.length; s++) {
      var sel = (v && v.status === statuses[s]) ? ' selected' : '';
      h += '<option value="' + statuses[s] + '"' + sel + '>' + STATUS_MAP[statuses[s]].label + '</option>';
    }
    h += '</select></div>';

    h += '</div>'; // end grid

    // Buttons
    h += '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">';
    h += '<button class="sk-btn" style="background:transparent;border:1px solid #374151" onclick="_vehCloseModal()">H\u1ee7y</button>';
    h += '<button class="sk-btn" style="background:var(--sk-green)" onclick="_vehSaveForm()">'
      + (isEdit ? '&#x2705; C\u1eadp nh\u1eadt' : '&#x2795; Th\u00eam xe') + '</button>';
    h += '</div>';

    h += '</div></div>';

    document.body.insertAdjacentHTML('beforeend', h);
  }

  function _field(id, label, type, value, placeholder, disabled) {
    return '<div><label style="font-size:12px;color:#9ca3af">' + label + '</label>'
      + '<input id="' + id + '" class="sk-inp" type="' + type + '" '
      + 'value="' + esc(String(value || '')) + '" '
      + 'placeholder="' + esc(placeholder || '') + '" '
      + (disabled ? 'disabled style="width:100%;opacity:0.6"' : 'style="width:100%"')
      + '></div>';
  }

  function _isoDate(d) {
    if (!d) return '';
    var dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0')
      + '-' + String(dt.getDate()).padStart(2, '0');
  }

  function _vehCloseModal() {
    var m = getEl('veh-modal');
    if (m) m.remove();
  }

  function _vehSaveForm() {
    var plate = (getEl('vf-plate').value || '').trim().toUpperCase();
    var quota = Number(getEl('vf-quota').value);
    if (!plate) { toast('Vui l\u00f2ng nh\u1eadp bi\u1ec3n s\u1ed1 xe!'); return; }
    if (!quota || quota <= 0) { toast('Vui l\u00f2ng nh\u1eadp \u0111\u1ecbnh m\u1ee9c x\u0103ng!'); return; }

    var body = {
      plate: plate,
      type: getEl('vf-type').value,
      driver_email: getEl('vf-driver').value,
      fuel_type: getEl('vf-fueltype').value,
      fuel_quota: quota,
      load_capacity: Number(getEl('vf-load').value) || 0,
      odometer: Number(getEl('vf-odo').value) || 0,
      registration_exp: getEl('vf-regexp').value || '',
      insurance_exp: getEl('vf-insexp').value || '',
      maint_km: Number(getEl('vf-maint').value) || 0,
      area: getEl('vf-area').value || '',
      status: getEl('vf-status').value
    };

    api('veh_save_registry', body, function(err, d) {
      if (err || !d || !d.ok) {
        toast('L\u1ed7i: ' + (d ? d.error : String(err)));
        return;
      }
      _vehCloseModal();
      toast('\u2705 ' + (d.action === 'created' ? 'Th\u00eam xe' : 'C\u1eadp nh\u1eadt') + ' th\u00e0nh c\u00f4ng: ' + plate);
      _vehRenderRegistry();
    });
  }

  // ============================================================
  // TAB 2: T\u00cdNH CHI PH\u00cd X\u0102NG (Calculator)
  // ============================================================
  function _vehRenderCostCalc() {
    var el = getEl('veh-content');
    if (!el) return;

    // Load registry n\u1ebfu ch\u01b0a c\u00f3
    if (_veh.registry.length === 0) {
      _veh.loading = true;
      el.innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af">&#x23F3; \u0110ang t\u1ea3i...</div>';
      api('veh_get_registry', {}, function(err, d) {
        _veh.loading = false;
        if (d && d.ok) _veh.registry = d.vehicles || [];
        _vehRenderCostCalc();
      });
      return;
    }

    var reg = _veh.registry;
    var h = '<div class="sk-panel" style="padding:20px;max-width:640px">';
    h += '<div class="sk-pt" style="font-size:16px;margin-bottom:16px">&#x26FD; T\u00ednh chi ph\u00ed x\u0103ng d\u1ea7u theo \u0111\u1ecbnh m\u1ee9c</div>';

    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';

    // Ch\u1ecdn xe
    h += '<div><label style="font-size:12px;color:#9ca3af">Bi\u1ec3n s\u1ed1 xe *</label>'
      + '<select id="vc-plate" class="sk-inp" style="width:100%" onchange="_vehOnPlateChange()">'
      + '<option value="">-- Ch\u1ecdn xe --</option>';
    for (var i = 0; i < reg.length; i++) {
      var v = reg[i];
      if (v.status === 'ngung') continue;
      h += '<option value="' + esc(v.plate) + '" '
        + 'data-quota="' + v.fuel_quota + '" '
        + 'data-ftype="' + esc(v.fuel_type) + '" '
        + 'data-driver="' + esc(v.driver_name) + '">'
        + esc(v.plate) + ' (' + v.fuel_quota + 'L/100km - ' + esc(v.driver_name || 'ch\u01b0a g\u00e1n') + ')'
        + '</option>';
    }
    h += '</select></div>';

    // M\u00e3 \u0111\u01a1n Sapo
    h += '<div><label style="font-size:12px;color:#9ca3af">M\u00e3 \u0111\u01a1n Sapo</label>'
      + '<input id="vc-order" class="sk-inp" placeholder="VD: SON-0042" style="width:100%"></div>';

    // Qu\u00e3ng \u0111\u01b0\u1eddng
    h += '<div><label style="font-size:12px;color:#9ca3af">Qu\u00e3ng \u0111\u01b0\u1eddng (km) *</label>'
      + '<input id="vc-dist" class="sk-inp" type="number" min="0" step="0.1" placeholder="0" '
      + 'oninput="_vehLiveCalc()" style="width:100%"></div>';

    // Gi\u00e1 x\u0103ng
    h += '<div><label style="font-size:12px;color:#9ca3af">Gi\u00e1 x\u0103ng (VN\u0110/L)</label>'
      + '<input id="vc-fprice" class="sk-inp" type="number" placeholder="T\u1ef1 \u0111\u1ed9ng theo lo\u1ea1i" '
      + 'oninput="_vehLiveCalc()" style="width:100%"></div>';

    // \u0110i\u1ec3m \u0111i
    h += '<div><label style="font-size:12px;color:#9ca3af">\u0110i\u1ec3m xu\u1ea5t ph\u00e1t</label>'
      + '<input id="vc-from" class="sk-inp" value="Kho S\u01a1n Khang" style="width:100%"></div>';

    // \u0110i\u1ec3m \u0111\u1ebfn
    h += '<div><label style="font-size:12px;color:#9ca3af">\u0110i\u1ec3m \u0111\u1ebfn</label>'
      + '<input id="vc-to" class="sk-inp" placeholder="\u0110\u1ecba ch\u1ec9 giao h\u00e0ng" style="width:100%"></div>';

    // Ph\u00ed c\u1ea7u \u0111\u01b0\u1eddng
    h += '<div><label style="font-size:12px;color:#9ca3af">Ph\u00ed c\u1ea7u \u0111\u01b0\u1eddng (VN\u0110)</label>'
      + '<input id="vc-toll" class="sk-inp" type="number" value="0" '
      + 'oninput="_vehLiveCalc()" style="width:100%"></div>';

    // CP kh\u00e1c
    h += '<div><label style="font-size:12px;color:#9ca3af">Chi ph\u00ed kh\u00e1c (VN\u0110)</label>'
      + '<input id="vc-other" class="sk-inp" type="number" value="0" '
      + 'oninput="_vehLiveCalc()" style="width:100%"></div>';

    h += '</div>'; // end grid

    // Live Preview box
    h += '<div id="vc-preview" style="margin-top:16px;padding:16px;'
      + 'background:rgba(59,130,246,0.06);border-radius:8px;border:1px solid rgba(59,130,246,0.15);'
      + 'display:none"></div>';

    // Buttons
    h += '<div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">';
    h += '<button class="sk-btn" style="background:transparent;border:1px solid #374151" '
      + 'onclick="_vehRenderCostCalc()">&#x1F504; Reset</button>';
    h += '<button class="sk-btn" style="background:var(--sk-green);font-weight:600" '
      + 'onclick="_vehSubmitCost()">&#x2705; L\u01b0u &amp; ghi Finance</button>';
    h += '</div>';

    h += '</div>';
    el.innerHTML = h;
  }

  function _vehOnPlateChange() {
    var sel = getEl('vc-plate');
    if (!sel) return;
    var opt = sel.options[sel.selectedIndex];
    if (!opt || !opt.value) return;

    // Auto-fill gi\u00e1 x\u0103ng theo lo\u1ea1i
    var ftype = opt.getAttribute('data-ftype') || 'xang_ron92';
    var fpriceEl = getEl('vc-fprice');
    if (fpriceEl && !fpriceEl.value) {
      fpriceEl.placeholder = fmtNum(FUEL_PRICES[ftype] || 23810) + ' (' + (FUEL_TYPES[ftype] || ftype) + ')';
    }
    _vehLiveCalc();
  }

  function _vehLiveCalc() {
    var plateEl = getEl('vc-plate');
    var distEl = getEl('vc-dist');
    var preview = getEl('vc-preview');
    if (!plateEl || !distEl || !preview) return;

    var sel = plateEl.options[plateEl.selectedIndex];
    var quota = sel ? Number(sel.getAttribute('data-quota')) : 0;
    var ftype = sel ? (sel.getAttribute('data-ftype') || 'xang_ron92') : 'xang_ron92';
    var dist = Number(distEl.value) || 0;

    if (!quota || !dist) {
      preview.style.display = 'none';
      return;
    }

    var fprice = Number((getEl('vc-fprice') || {}).value) || FUEL_PRICES[ftype] || 23810;
    var toll = Number((getEl('vc-toll') || {}).value) || 0;
    var other = Number((getEl('vc-other') || {}).value) || 0;

    var liters = Math.round((dist / 100) * quota * 100) / 100;
    var fuelCost = Math.round(liters * fprice);
    var total = fuelCost + toll + other;

    preview.style.display = 'block';
    preview.innerHTML = '<div style="font-size:14px;font-weight:600;color:var(--sk-blue);margin-bottom:10px">'
      + '&#x1F4CA; K\u1ebft qu\u1ea3 t\u00ednh nhanh (client-side)</div>'
      + '<table style="width:100%;font-size:13px;color:#d1d5db;border-collapse:collapse">'
      + '<tr><td style="padding:4px 0">C\u00f4ng th\u1ee9c:</td>'
      + '<td style="text-align:right;font-family:monospace">' + dist + 'km \u00f7 100 \u00d7 ' + quota + 'L = <strong>' + liters + ' l\u00edt</strong></td></tr>'
      + '<tr><td style="padding:4px 0">Chi ph\u00ed x\u0103ng:</td>'
      + '<td style="text-align:right">' + liters + 'L \u00d7 ' + fmtNum(fprice) + '\u0111 = <strong style="color:var(--sk-yellow)">' + fmtNum(fuelCost) + '\u0111</strong></td></tr>'
      + '<tr><td style="padding:4px 0">Ph\u00ed c\u1ea7u \u0111\u01b0\u1eddng:</td>'
      + '<td style="text-align:right">' + fmtNum(toll) + '\u0111</td></tr>'
      + '<tr><td style="padding:4px 0">Chi ph\u00ed kh\u00e1c:</td>'
      + '<td style="text-align:right">' + fmtNum(other) + '\u0111</td></tr>'
      + '<tr style="border-top:1px solid rgba(255,255,255,0.1)">'
      + '<td style="padding:8px 0"><strong>T\u1ed5ng c\u1ed9ng:</strong></td>'
      + '<td style="text-align:right;padding:8px 0;font-size:18px;font-weight:700;color:var(--sk-green)">'
      + fmtNum(total) + ' VN\u0110</td></tr>'
      + '</table>';
  }

  function _vehSubmitCost() {
    var plate = (getEl('vc-plate') || {}).value;
    var dist = Number((getEl('vc-dist') || {}).value);
    if (!plate) { toast('Vui l\u00f2ng ch\u1ecdn xe!'); return; }
    if (!dist || dist <= 0) { toast('Vui l\u00f2ng nh\u1eadp qu\u00e3ng \u0111\u01b0\u1eddng!'); return; }

    var body = {
      plate: plate,
      order_id: (getEl('vc-order') || {}).value || '',
      distance_km: dist,
      route_from: (getEl('vc-from') || {}).value || 'Kho S\u01a1n Khang',
      route_to: (getEl('vc-to') || {}).value || '',
      toll_fee: Number((getEl('vc-toll') || {}).value) || 0,
      other_cost: Number((getEl('vc-other') || {}).value) || 0,
      fuel_price: Number((getEl('vc-fprice') || {}).value) || 0,
      save: true
    };

    // Disable button
    var btn = event.target;
    if (btn) { btn.disabled = true; btn.textContent = '\u0110ang l\u01b0u...'; }

    api('veh_calc_trip_cost', body, function(err, d) {
      if (btn) { btn.disabled = false; btn.innerHTML = '&#x2705; L\u01b0u &amp; ghi Finance'; }
      if (err || !d || !d.ok) {
        toast('L\u1ed7i: ' + (d ? d.error : String(err)));
        return;
      }
      var c = d.calculation;
      toast('\u2705 \u0110\u00e3 l\u01b0u th\u00e0nh c\u00f4ng!\n\n'
        + 'M\u00e3 log: ' + d.log_id + '\n'
        + 'X\u0103ng ti\u00eau th\u1ee5: ' + c.fuel_liters + ' L\n'
        + 'Chi ph\u00ed x\u0103ng: ' + fmtNum(c.fuel_cost) + '\u0111\n'
        + 'T\u1ed5ng: ' + fmtNum(c.total_cost) + ' VN\u0110\n'
        + 'Odometer m\u1edbi: ' + fmtNum(c.new_odometer || 0) + 'km');

      // Auto-sync finance
      api('veh_sync_finance', {}, function() {});

      // Refresh registry cache
      _veh.registry = [];
      _vehRenderCostCalc();
    });
  }

  function _vehQuickCalc(plate) {
    _veh.tab = 'cost';
    loadVehicle();
    setTimeout(function() {
      var sel = getEl('vc-plate');
      if (sel) {
        sel.value = plate;
        _vehOnPlateChange();
        // Focus distance field
        var distEl = getEl('vc-dist');
        if (distEl) distEl.focus();
      }
    }, 150);
  }

  // ============================================================
  // TAB 3: L\u1ec6NH \u0110I\u1ec0U XE
  // ============================================================
  function _vehRenderDispatch() {
    var el = getEl('veh-content');
    if (!el) return;

    if (_veh.registry.length === 0) {
      _veh.loading = true;
      el.innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af">&#x23F3; \u0110ang t\u1ea3i...</div>';
      api('veh_get_registry', {}, function(err, d) {
        _veh.loading = false;
        if (d && d.ok) _veh.registry = d.vehicles || [];
        _vehRenderDispatch();
      });
      return;
    }

    var reg = _veh.registry;
    var h = '<div class="sk-panel" style="padding:20px;max-width:500px">';
    h += '<div class="sk-pt" style="font-size:16px;margin-bottom:16px">&#x1F4E6; T\u1ea1o l\u1ec7nh \u0111i\u1ec1u xe</div>';

    h += '<div style="display:grid;gap:12px">';

    // Ch\u1ecdn xe (ch\u1ec9 xe s\u1eb5n s\u00e0ng)
    h += '<div><label style="font-size:12px;color:#9ca3af">Ch\u1ecdn xe (ch\u1ec9 xe s\u1eb5n s\u00e0ng) *</label>'
      + '<select id="vd-plate" class="sk-inp" style="width:100%">'
      + '<option value="">-- Ch\u1ecdn xe --</option>';
    for (var i = 0; i < reg.length; i++) {
      if (reg[i].status !== 'san_sang') continue;
      h += '<option value="' + esc(reg[i].plate) + '">'
        + esc(reg[i].plate) + ' - ' + esc(reg[i].driver_name || 'ch\u01b0a g\u00e1n') + '</option>';
    }
    h += '</select></div>';

    // M\u00e3 \u0111\u01a1n Sapo
    h += '<div><label style="font-size:12px;color:#9ca3af">M\u00e3 \u0111\u01a1n Sapo *</label>'
      + '<input id="vd-order" class="sk-inp" placeholder="VD: SON-0042" style="width:100%"></div>';

    // \u0110i\u1ec3m \u0111i + \u0111\u1ebfn
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
    h += '<div><label style="font-size:12px;color:#9ca3af">\u0110i\u1ec3m xu\u1ea5t ph\u00e1t</label>'
      + '<input id="vd-from" class="sk-inp" value="Kho S\u01a1n Khang" style="width:100%"></div>';
    h += '<div><label style="font-size:12px;color:#9ca3af">\u0110i\u1ec3m \u0111\u1ebfn</label>'
      + '<input id="vd-to" class="sk-inp" placeholder="\u0110\u1ecba ch\u1ec9 giao" style="width:100%"></div>';
    h += '</div>';

    h += '</div>'; // end form grid

    h += '<div style="margin-top:16px;text-align:right">';
    h += '<button class="sk-btn" style="background:var(--sk-blue);font-weight:600" '
      + 'onclick="_vehSubmitDispatch()">&#x1F69A; Xu\u1ea5t xe</button>';
    h += '</div>';

    h += '</div>';
    el.innerHTML = h;
  }

  function _vehSubmitDispatch() {
    var plate = (getEl('vd-plate') || {}).value;
    var orderId = (getEl('vd-order') || {}).value;
    if (!plate) { toast('Vui l\u00f2ng ch\u1ecdn xe!'); return; }
    if (!orderId) { toast('Vui l\u00f2ng nh\u1eadp m\u00e3 \u0111\u01a1n!'); return; }

    var body = {
      plate: plate,
      order_id: orderId,
      route_from: (getEl('vd-from') || {}).value || 'Kho S\u01a1n Khang',
      route_to: (getEl('vd-to') || {}).value || ''
    };

    api('veh_dispatch', body, function(err, d) {
      if (err || !d || !d.ok) {
        toast('L\u1ed7i: ' + (d ? d.error : String(err)));
        return;
      }
      toast('\u2705 \u0110\u00e3 xu\u1ea5t xe!\n\n'
        + 'Log: ' + d.log_id + '\n'
        + 'Xe: ' + d.plate + '\n'
        + 'T\u00e0i x\u1ebf: ' + d.driver + '\n'
        + '\u0110\u01a1n: ' + d.order_id);

      _veh.registry = [];
      _vehRenderDispatch();
    });
  }

  // ============================================================
  // TAB 4: B\u00c1O C\u00c1O TH\u00c1NG
  // ============================================================
  function _vehRenderReport() {
    var el = getEl('veh-content');
    if (!el) return;

    var now = new Date();
    var monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    var h = '<div class="sk-panel" style="padding:20px">';
    h += '<div class="sk-pt" style="font-size:16px;margin-bottom:12px">&#x1F4C8; B\u00e1o c\u00e1o chi ph\u00ed v\u1eadn chuy\u1ec3n</div>';

    h += '<div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap">';
    h += '<input id="vr-month" class="sk-inp" type="month" value="' + monthStr + '" style="width:180px">';
    h += '<button class="sk-btn" onclick="_vehLoadReport()">Xem b\u00e1o c\u00e1o</button>';
    h += '<button class="sk-btn" style="background:var(--sk-purple)" onclick="_vehSyncFin()">&#x1F504; Sync Finance</button>';
    h += '</div>';

    h += '<div id="vr-body" style="color:#6b7280;padding:40px;text-align:center">'
      + 'Ch\u1ecdn th\u00e1ng v\u00e0 nh\u1ea5n <strong>"Xem b\u00e1o c\u00e1o"</strong></div>';

    h += '</div>';
    el.innerHTML = h;
  }

  function _vehLoadReport() {
    var month = (getEl('vr-month') || {}).value;
    var el = getEl('vr-body');
    if (!el) return;
    el.innerHTML = '<div style="padding:30px;text-align:center;color:#9ca3af">&#x23F3; \u0110ang t\u1ea3i b\u00e1o c\u00e1o...</div>';

    api('veh_monthly_report', {month: month}, function(err, d) {
      var el = getEl('vr-body');
      if (!el) return;
      if (err || !d || !d.ok) {
        el.innerHTML = '<div style="color:var(--sk-red);padding:20px">L\u1ed7i: ' + (d ? d.error : String(err)) + '</div>';
        return;
      }

      var rpt = d.report;
      var vehs = rpt.vehicles || [];

      if (vehs.length === 0) {
        el.innerHTML = '<div style="padding:40px;text-align:center;color:#6b7280">'
          + '&#x1F4ED; Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u cho th\u00e1ng ' + esc(month) + '</div>';
        return;
      }

      var h = '<div style="overflow-x:auto">';
      h += '<table style="width:100%;font-size:13px;border-collapse:collapse;min-width:700px">';
      h += '<thead><tr style="border-bottom:2px solid rgba(255,255,255,0.1);color:#9ca3af;text-align:left">';
      h += '<th style="padding:10px 8px">Xe</th>';
      h += '<th style="padding:10px 8px;text-align:right">Chuy\u1ebfn</th>';
      h += '<th style="padding:10px 8px;text-align:right">Km</th>';
      h += '<th style="padding:10px 8px;text-align:right">X\u0103ng (L)</th>';
      h += '<th style="padding:10px 8px;text-align:right">CP X\u0103ng</th>';
      h += '<th style="padding:10px 8px;text-align:right">C\u1ea7u \u0111\u01b0\u1eddng</th>';
      h += '<th style="padding:10px 8px;text-align:right;font-weight:700">T\u1ed5ng CP</th>';
      h += '<th style="padding:10px 8px;text-align:right">\u0111/km</th>';
      h += '<th style="padding:10px 8px;text-align:right">Hi\u1ec7u su\u1ea5t</th>';
      h += '</tr></thead><tbody>';

      for (var i = 0; i < vehs.length; i++) {
        var v = vehs[i];
        var effColor = v.fuel_efficiency_pct <= 100 ? 'var(--sk-green)'
          : v.fuel_efficiency_pct <= 115 ? 'var(--sk-yellow)' : 'var(--sk-red)';

        h += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05)">';
        h += '<td style="padding:8px;font-weight:600;color:var(--sk-blue)">' + esc(v.plate) + '</td>';
        h += '<td style="padding:8px;text-align:right">' + v.trip_count + '</td>';
        h += '<td style="padding:8px;text-align:right">' + fmtNum(v.total_distance) + '</td>';
        h += '<td style="padding:8px;text-align:right">' + v.total_fuel_liters + '</td>';
        h += '<td style="padding:8px;text-align:right">' + fmtNum(v.total_fuel_cost) + '</td>';
        h += '<td style="padding:8px;text-align:right">' + fmtNum(v.total_toll) + '</td>';
        h += '<td style="padding:8px;text-align:right;font-weight:600">' + fmtNum(v.total_cost) + '</td>';
        h += '<td style="padding:8px;text-align:right">' + fmtNum(v.avg_cost_per_km) + '</td>';
        h += '<td style="padding:8px;text-align:right;color:' + effColor + ';font-weight:700">' + v.fuel_efficiency_pct + '%</td>';
        h += '</tr>';
      }

      // Grand total
      var gt = rpt.grand_total;
      h += '<tr style="border-top:2px solid rgba(255,255,255,0.15);font-weight:700">';
      h += '<td style="padding:10px 8px">T\u1ed5ng</td>';
      h += '<td style="padding:10px 8px;text-align:right">' + gt.trip_count + '</td>';
      h += '<td style="padding:10px 8px;text-align:right">' + fmtNum(gt.total_distance) + '</td>';
      h += '<td style="padding:10px 8px;text-align:right">-</td>';
      h += '<td style="padding:10px 8px;text-align:right">' + fmtNum(gt.total_fuel_cost) + '</td>';
      h += '<td style="padding:10px 8px;text-align:right">-</td>';
      h += '<td style="padding:10px 8px;text-align:right;color:var(--sk-green);font-size:15px">' + fmtNum(gt.total_cost) + ' \u0111</td>';
      h += '<td colspan="2"></td>';
      h += '</tr>';

      h += '</tbody></table></div>';

      // Legend
      h += '<div style="margin-top:12px;font-size:11px;color:#6b7280">'
        + 'Hi\u1ec7u su\u1ea5t: <span style="color:var(--sk-green)">\u2264100%</span> = \u0111\u00fang/d\u01b0\u1edbi \u0111\u1ecbnh m\u1ee9c, '
        + '<span style="color:var(--sk-yellow)">101-115%</span> = h\u01a1i v\u01b0\u1ee3t, '
        + '<span style="color:var(--sk-red)">&gt;115%</span> = v\u01b0\u1ee3t nhi\u1ec1u'
        + '</div>';

      el.innerHTML = h;
    });
  }

  function _vehSyncFin() {
    api('veh_sync_finance', {}, function(err, d) {
      if (d && d.ok) {
        toast('\u2705 \u0110\u00e3 sync ' + d.synced + ' b\u1ea3n ghi v\u00e0o Finance_Logs');
      } else {
        toast('L\u1ed7i sync: ' + (d ? d.error : String(err)));
      }
    });
  }

  // ============================================================
  // EXPOSE TO WINDOW
  // ============================================================
  window.loadVehicle       = loadVehicle;
  window._vehTab           = _vehTab;
  window._vehRender        = _vehRender;
  window._vehShowForm      = _vehShowForm;
  window._vehCloseModal    = _vehCloseModal;
  window._vehSaveForm      = _vehSaveForm;
  window._vehOnPlateChange = _vehOnPlateChange;
  window._vehLiveCalc      = _vehLiveCalc;
  window._vehSubmitCost    = _vehSubmitCost;
  window._vehQuickCalc     = _vehQuickCalc;
  window._vehSubmitDispatch = _vehSubmitDispatch;
  window._vehLoadReport    = _vehLoadReport;
  window._vehSyncFin       = _vehSyncFin;

})();
