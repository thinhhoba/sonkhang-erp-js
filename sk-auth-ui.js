/* ================================================================
 * sk-auth-ui.js — SonKhang ERP v3.5
 * SK-AUTH-001: Identity & Access Management UI
 * Ng\u00e0y: 20/03/2026
 *
 * M\u00f4-\u0111un:
 *   [LOGIN]   M\u00e0n h\u00ecnh \u0111\u0103ng nh\u1eadp: Email/Password + Google GSI
 *   [PROFILE] C\u00e0i \u0111\u1eb7t t\u00e0i kho\u1ea3n: C\u1eadp nh\u1eadt + \u0110\u1ed5i m\u1eadt kh\u1ea9u
 *   [ADMIN]   Qu\u1ea3n l\u00fd User: Set role, kh\u00f3a/m\u1edf, duy\u1ec7t \u0111\u0103ng k\u00fd
 *
 * QUY T\u1eaec: var only, Unicode escape, window expose, text/plain CORS
 * ================================================================ */

(function () {
  'use strict';

  /* ============================================================
   * S0 - STATE
   * ============================================================ */
  if (!window._auth) {
    window._auth = {
      tab: 'login', loading: false,
      user: null, users: [], pending: []
    };
  }

  /* Google Client ID - match GOOGLE_CLIENT_ID in Auth.gs */
  var _GCID = window.GOOGLE_CLIENT_ID || '';

  /* ============================================================
   * S1 - ENTRY POINTS
   * ============================================================ */

  function loadAuth() {
    var tok = _getToken();
    if (tok) {
      api('auth_get_profile', {}, function (err, d) {
        if (!err && d && d.ok) { _setUser(d); loadAccountSettings(); }
        else { _clearToken(); _renderLoginPage(); }
      });
    } else {
      _renderLoginPage();
    }
  }

  function loadAccountSettings() {
    var ct = getContent(); if (!ct) return;
    window._auth.tab = 'profile';
    ct.innerHTML = _profileShell();
    _profileTabSwitch('info');
  }

  function loadAdminPanel() {
    var tok = _getToken();
    if (!tok) { _renderLoginPage(); return; }
    var ct = getContent(); if (!ct) return;
    window._auth.tab = 'admin';
    ct.innerHTML = _adminShell();
    _adminTabSwitch('users');
  }

  /* ============================================================
   * S2 - LOGIN PAGE
   * ============================================================ */

  function _renderLoginPage() {
    var ct = getContent(); if (!ct) return;
    ct.innerHTML = _loginHtml();
    _loadGSI();
  }

  function _loginHtml() {
    var h = '<div class="sk-auth-center">';
    h += '<div class="sk-auth-card">';
    h += '<div style="text-align:center;margin-bottom:28px;">';
    h += '<div style="font-size:40px;margin-bottom:8px;">&#x1F4BC;</div>';
    h += '<div style="font-size:20px;font-weight:800;color:#f1f5f9;">SonKhang ERP</div>';
    h += '<div style="font-size:12.5px;color:#64748b;margin-top:4px;">v3.5 \u2014 \u0110\u0103ng nh\u1eadp h\u1ec7 th\u1ed1ng</div>';
    h += '</div>';
    /* Google GSI button — chi render khi da cau hinh GOOGLE_CLIENT_ID */
    if (_GCID) {
      h += '<div id="g_id_onload" data-client_id="' + _esc(_GCID) + '" data-callback="_authGoogleCallback" data-auto_prompt="false"></div>';
      h += '<div id="sk-google-btn" style="margin-bottom:18px;">';
      /* data-width PHAI la so px nguyen, KHONG dung % hoac auto */
      h += '<div class="g_id_signin" data-type="standard" data-theme="filled_black" data-size="large" data-width="360" data-text="signin_with" data-shape="rectangular" data-logo_alignment="left"></div>';
      h += '</div>';
      h += '<div class="sk-auth-divider"><span>ho\u1eb7c \u0111\u0103ng nh\u1eadp b\u1eb1ng m\u1eadt kh\u1ea9u</span></div>';
    }
    /* Error box */
    h += '<div id="sk-login-err" class="sk-auth-err" style="display:none;margin-bottom:14px;"></div>';
    /* Email */
    h += '<label class="sk-lbl">Email c\u00f4ng ty</label>';
    h += '<input id="li_email" class="sk-inp" type="email" placeholder="ten@sonkhang.vn" onkeydown="_authLoginKey(event)" style="margin-bottom:12px;">';
    /* Password */
    h += '<label class="sk-lbl">M\u1eadt kh\u1ea9u c\u1ea5p 2</label>';
    h += '<div style="position:relative;margin-bottom:18px;">';
    h += '<input id="li_pass" class="sk-inp" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022" onkeydown="_authLoginKey(event)" style="padding-right:44px;">';
    h += '<button onclick="_authTogglePass(\'li_pass\',this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#64748b;cursor:pointer;font-size:16px;">&#x1F441;</button>';
    h += '</div>';
    h += '<button id="li_btn" class="sk-btn" style="width:100%;" onclick="_authLogin()">&#x1F511; \u0110\u0103ng nh\u1eadp</button>';
    /* Register link */
    h += '<div style="text-align:center;margin-top:16px;font-size:12.5px;color:#64748b;">';
    h += 'Ch\u01b0a c\u00f3 t\u00e0i kho\u1ea3n? <a href="#" onclick="_authShowRegisterForm();return false;" style="color:#3b82f6;text-decoration:none;font-weight:600;">G\u1eedi y\u00eau c\u1ea7u \u0111\u0103ng k\u00fd</a>';
    h += '</div>';
    h += '</div></div>';
    return h;
  }

  function _authLoginKey(e) { if (e.key === 'Enter') _authLogin(); }

  function _authLogin() {
    var email = _val('li_email').trim();
    var pass  = _val('li_pass').trim();
    if (!email || !pass) { _authErrShow('sk-login-err', 'Vui l\u00f2ng nh\u1eadp email v\u00e0 m\u1eadt kh\u1ea9u'); return; }
    var btn = document.getElementById('li_btn');
    if (btn) { btn.disabled = true; btn.textContent = '\u0110ang ki\u1ec3m tra...'; }
    api('login', { email: email, password: pass }, function (err, d) {
      if (btn) { btn.disabled = false; btn.innerHTML = '&#x1F511; \u0110\u0103ng nh\u1eadp'; }
      if (err || !d || !d.ok) { _authErrShow('sk-login-err', (d && d.error) || 'Kh\u00f4ng k\u1ebft n\u1ed1i \u0111\u01b0\u1ee3c'); return; }
      _onLoginSuccess(d);
    });
  }

  function _authGoogleCallback(response) {
    if (!response || !response.credential) { _authErrShow('sk-login-err', 'Google \u0111\u0103ng nh\u1eadp th\u1ea5t b\u1ea1i'); return; }
    api('google_login', { credential: response.credential }, function (err, d) {
      if (err || !d) { _authErrShow('sk-login-err', 'L\u1ed7i k\u1ebft n\u1ed1i'); return; }
      if (d.ok) { _onLoginSuccess(d); return; }
      if (d.new_user) { _authShowRegisterForm(d.email, d.name); return; }
      _authErrShow('sk-login-err', d.error || '\u0110\u0103ng nh\u1eadp Google th\u1ea5t b\u1ea1i');
    });
  }

  function _onLoginSuccess(d) {
    _setToken(d.token);
    _setUser(d);
    _toast('&#x2705; Xin ch\u00e0o, ' + d.name + '!', 'ok');
    if (typeof window.loadDashboard === 'function') window.loadDashboard();
    else loadAccountSettings();
  }

  /* ============================================================
   * S3 - REGISTER FORM (modal)
   * ============================================================ */

  function _authShowRegisterForm(preEmail, preName) {
    _removeModal('sk-register-modal');
    var h = '<div id="sk-register-modal" class="sk-modal-overlay" onclick="_closeModal(\'sk-register-modal\',event)">';
    h += '<div class="sk-modal-box" style="max-width:440px;" onclick="event.stopPropagation()">';
    h += '<div class="sk-modal-hd">&#x270D; G\u1eedi y\u00eau c\u1ea7u \u0111\u0103ng k\u00fd<button onclick="_removeModal(\'sk-register-modal\')" class="sk-modal-close">&times;</button></div>';
    h += '<div class="sk-modal-bd">';
    h += '<div class="sk-auth-info-box" style="margin-bottom:14px;">&#x2139;&#xFE0F; Y\u00eau c\u1ea7u s\u1ebd \u0111\u01b0\u1ee3c g\u1eedi t\u1edbi Admin duy\u1ec7t. B\u1ea1n s\u1ebd nh\u1eadn email khi \u0111\u01b0\u1ee3c c\u1ea5p quy\u1ec1n.</div>';
    h += '<div id="sk-reg-err" class="sk-auth-err" style="display:none;margin-bottom:14px;"></div>';
    h += '<div class="sk-fg2">';
    h += '<div style="grid-column:1/-1"><label class="sk-lbl">Email Google <em style="color:#ef4444;">*</em></label>';
    h += '<input id="reg_email" class="sk-inp" type="email" placeholder="email@gmail.com" value="' + _esc(preEmail || '') + '"' + (preEmail ? ' readonly style="opacity:.65"' : '') + '></div>';
    h += '<div style="grid-column:1/-1"><label class="sk-lbl">H\u1ecd v\u00e0 t\u00ean <em style="color:#ef4444;">*</em></label>';
    h += '<input id="reg_name" class="sk-inp" type="text" placeholder="Nguy\u1ec5n V\u0103n A" value="' + _esc(preName || '') + '"></div>';
    h += '<div><label class="sk-lbl">S\u1ed1 \u0111i\u1ec7n tho\u1ea1i</label><input id="reg_phone" class="sk-inp" type="tel" placeholder="0901234567"></div>';
    h += '<div><label class="sk-lbl">Ph\u00f2ng / Ban</label><input id="reg_dept" class="sk-inp" type="text" placeholder="Kho, K\u1ebf to\u00e1n..."></div>';
    h += '<div style="grid-column:1/-1"><label class="sk-lbl">Ghi ch\u00fa</label><input id="reg_note" class="sk-inp" type="text" placeholder="L\u00fd do c\u1ea7n t\u00e0i kho\u1ea3n..."></div>';
    h += '</div></div>';
    h += '<div class="sk-modal-ft">';
    h += '<button class="sk-btn-sm sk-btn-outline" onclick="_removeModal(\'sk-register-modal\')">H\u1ee7y</button>';
    h += '<button class="sk-btn" id="reg_btn" onclick="_authSendRegister()">&#x1F4E8; G\u1eedi y\u00eau c\u1ea7u</button>';
    h += '</div></div></div>';
    document.body.appendChild(document.createRange().createContextualFragment(h));
  }

  function _authSendRegister() {
    var email = _val('reg_email').trim(); var name = _val('reg_name').trim();
    if (!email || !name) { _authErrShow('sk-reg-err', 'Vui l\u00f2ng nh\u1eadp email v\u00e0 h\u1ecd t\u00ean'); return; }
    var btn = document.getElementById('reg_btn');
    if (btn) { btn.disabled = true; btn.textContent = '\u0110ang g\u1eedi...'; }
    api('auth_register_req', { email:email, name:name, phone:_val('reg_phone'), department:_val('reg_dept'), note:_val('reg_note') }, function (err, d) {
      if (btn) { btn.disabled = false; btn.innerHTML = '&#x1F4E8; G\u1eedi y\u00eau c\u1ea7u'; }
      if (err || !d || !d.ok) { _authErrShow('sk-reg-err', (d && d.error) || 'L\u1ed7i g\u1eedi'); return; }
      _removeModal('sk-register-modal');
      _toast('&#x2705; \u0110\u00e3 g\u1eedi. Vui l\u00f2ng ch\u1edd Admin duy\u1ec7t!', 'ok');
    });
  }

  /* ============================================================
   * S4 - ACCOUNT SETTINGS
   * ============================================================ */

  function _profileShell() {
    var h = '<div class="sk-panel" style="padding:0;overflow:hidden;">';
    h += '<div class="sk-veh-tabbar">';
    h += '<button class="sk-veh-tab active" id="prof-tb-info" onclick="_profileTabSwitch(\'info\')">&#x1F464; Th\u00f4ng tin c\u00e1 nh\u00e2n</button>';
    h += '<button class="sk-veh-tab" id="prof-tb-pass" onclick="_profileTabSwitch(\'pass\')">&#x1F511; \u0110\u1ed5i m\u1eadt kh\u1ea9u</button>';
    h += '</div><div id="prof-body" style="padding:24px 28px 32px;"></div></div>';
    return h;
  }

  function _profileTabSwitch(tab) {
    var all = ['info','pass'];
    for (var i = 0; i < all.length; i++) {
      var b = document.getElementById('prof-tb-' + all[i]);
      if (b) b.className = 'sk-veh-tab' + (all[i] === tab ? ' active' : '');
    }
    var body = document.getElementById('prof-body'); if (!body) return;
    if (tab === 'info') body.innerHTML = _profileInfoHtml();
    if (tab === 'pass') body.innerHTML = _profilePassHtml();
  }

  function _profileInfoHtml() {
    var u = window._auth.user || {};
    var h = '<div style="display:grid;grid-template-columns:auto 1fr;gap:32px;align-items:start;">';
    /* Avatar */
    h += '<div style="text-align:center;">';
    if (u.avatar) h += '<img src="' + _esc(u.avatar) + '" style="width:80px;height:80px;border-radius:50%;border:3px solid #334155;object-fit:cover;">';
    else h += '<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;">' + _avatarInitials(u.name || u.email || 'U') + '</div>';
    h += '<div style="margin-top:8px;">' + _roleBadge(u.role || 'user') + '</div>';
    h += '</div>';
    /* Fields */
    h += '<div>';
    h += '<h3 style="margin:0 0 20px;font-size:15px;font-weight:700;color:#e2e8f0;">&#x1F464; Th\u00f4ng tin c\u00e1 nh\u00e2n</h3>';
    h += '<div id="prof-info-err" class="sk-auth-err" style="display:none;margin-bottom:14px;"></div>';
    h += '<div id="prof-info-ok" class="sk-auth-ok" style="display:none;margin-bottom:14px;"></div>';
    h += '<div class="sk-fg2">';
    h += '<div style="grid-column:1/-1"><label class="sk-lbl">Email (kh\u00f4ng s\u1eeda \u0111\u01b0\u1ee3c)</label><input class="sk-inp" type="email" value="' + _esc(u.email || '') + '" readonly style="opacity:.5;cursor:not-allowed;"></div>';
    h += '<div><label class="sk-lbl">H\u1ecd v\u00e0 t\u00ean <em style="color:#ef4444;">*</em></label><input id="pi_name" class="sk-inp" type="text" value="' + _esc(u.name || '') + '" placeholder="Nguy\u1ec5n V\u0103n A"></div>';
    h += '<div><label class="sk-lbl">S\u1ed1 \u0111i\u1ec7n tho\u1ea1i</label><input id="pi_phone" class="sk-inp" type="tel" value="' + _esc(u.phone || '') + '" placeholder="0901234567"></div>';
    h += '<div style="grid-column:1/-1"><label class="sk-lbl">Ph\u00f2ng / Ban</label><input id="pi_dept" class="sk-inp" type="text" value="' + _esc(u.department || '') + '" placeholder="Kho, K\u1ebf to\u00e1n..."></div>';
    h += '</div>';
    h += '<button class="sk-btn" style="margin-top:20px;" onclick="_profileSaveInfo()">&#x1F4BE; L\u01b0u th\u00f4ng tin</button>';
    h += '</div></div>';
    return h;
  }

  function _profileSaveInfo() {
    var name = _val('pi_name').trim();
    if (!name) { _authErrShow('prof-info-err', 'T\u00ean kh\u00f4ng \u0111\u01b0\u1ee3c \u0111\u1ec3 tr\u1ed1ng'); return; }
    var btn = document.querySelector('[onclick="_profileSaveInfo()"]');
    if (btn) { btn.disabled = true; btn.textContent = '\u0110ang l\u01b0u...'; }
    api('auth_update_profile', { name:name, phone:_val('pi_phone'), department:_val('pi_dept') }, function (err, d) {
      if (btn) { btn.disabled = false; btn.innerHTML = '&#x1F4BE; L\u01b0u th\u00f4ng tin'; }
      if (err || !d || !d.ok) { _authErrShow('prof-info-err', (d && d.error) || 'L\u1ed7i l\u01b0u'); return; }
      if (window._auth.user) { window._auth.user.name = d.name||name; window._auth.user.phone = d.phone||''; window._auth.user.department = d.department||''; }
      var okEl = document.getElementById('prof-info-ok');
      if (okEl) { okEl.style.display = 'block'; okEl.textContent = '\u2705 \u0110\u00e3 l\u01b0u th\u00e0nh c\u00f4ng'; }
      _toast('&#x2705; C\u1eadp nh\u1eadt th\u00f4ng tin th\u00e0nh c\u00f4ng', 'ok');
    });
  }

  function _profilePassHtml() {
    var h = '<div style="max-width:420px;">';
    h += '<h3 style="margin:0 0 20px;font-size:15px;font-weight:700;color:#e2e8f0;">&#x1F511; \u0110\u1ed5i m\u1eadt kh\u1ea9u c\u1ea5p 2</h3>';
    h += '<div class="sk-auth-info-box" style="margin-bottom:18px;">&#x2139;&#xFE0F; D\u00f9ng khi \u0111\u0103ng nh\u1eadp b\u1eb1ng Email. \u0110\u0103ng nh\u1eadp Google kh\u00f4ng y\u00eau c\u1ea7u.</div>';
    h += '<div id="prof-pass-err" class="sk-auth-err" style="display:none;margin-bottom:14px;"></div>';
    h += '<div id="prof-pass-ok" class="sk-auth-ok" style="display:none;margin-bottom:14px;"></div>';
    h += '<label class="sk-lbl">M\u1eadt kh\u1ea9u hi\u1ec7n t\u1ea1i</label>';
    h += '<div style="position:relative;margin-bottom:14px;"><input id="pp_old" class="sk-inp" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022" style="padding-right:44px;"><button onclick="_authTogglePass(\'pp_old\',this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#64748b;cursor:pointer;font-size:16px;">&#x1F441;</button></div>';
    h += '<label class="sk-lbl">M\u1eadt kh\u1ea9u m\u1edbi <em style="color:#64748b;">(t\u1ed1i thi\u1ec3u 6 k\u00fd t\u1ef1)</em></label>';
    h += '<div style="position:relative;margin-bottom:6px;"><input id="pp_new" class="sk-inp" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022" style="padding-right:44px;" oninput="_profilePassStrength()"><button onclick="_authTogglePass(\'pp_new\',this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#64748b;cursor:pointer;font-size:16px;">&#x1F441;</button></div>';
    h += '<div id="pp-sw" style="margin-bottom:14px;display:none;"><div style="height:5px;background:#1e293b;border-radius:3px;overflow:hidden;"><div id="pp-sf" style="height:100%;width:0;border-radius:3px;transition:width .3s,background .3s;"></div></div><div id="pp-sl" style="font-size:11px;color:#64748b;margin-top:4px;"></div></div>';
    h += '<label class="sk-lbl">X\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u m\u1edbi</label>';
    h += '<input id="pp_confirm" class="sk-inp" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022" style="margin-bottom:20px;">';
    h += '<button class="sk-btn" onclick="_profileSavePass()">&#x1F511; C\u1eadp nh\u1eadt m\u1eadt kh\u1ea9u</button>';
    h += '</div>';
    return h;
  }

  function _profilePassStrength() {
    var p = _val('pp_new');
    var sw = document.getElementById('pp-sw'); var sf = document.getElementById('pp-sf'); var sl = document.getElementById('pp-sl');
    if (!sw||!sf||!sl) return;
    if (!p) { sw.style.display='none'; return; }
    sw.style.display='block';
    var s=0;
    if(p.length>=6)s++; if(p.length>=10)s++; if(/[A-Z]/.test(p))s++; if(/[0-9]/.test(p))s++; if(/[^A-Za-z0-9]/.test(p))s++;
    var cs=['#ef4444','#f97316','#f59e0b','#10b981','#3b82f6'];
    var ls=['Qu\u00e1 y\u1ebfu','Y\u1ebfu','Trung b\u00ecnh','M\u1ea1nh','R\u1ea5t m\u1ea1nh'];
    sf.style.width=(s*20)+'%'; sf.style.background=cs[s-1]||'#ef4444';
    sl.textContent='\u0110\u1ed9 m\u1ea1nh: '+(ls[s-1]||'Qu\u00e1 y\u1ebfu');
  }

  function _profileSavePass() {
    var old=_val('pp_old').trim(); var nw=_val('pp_new').trim(); var cf=_val('pp_confirm').trim();
    if(!old||!nw){_authErrShow('prof-pass-err','Vui l\u00f2ng nh\u1eadp \u0111\u1ee7 c\u00e1c \u00f4');return;}
    if(nw.length<6){_authErrShow('prof-pass-err','M\u1eadt kh\u1ea9u m\u1edbi ph\u1ea3i \u00edt nh\u1ea5t 6 k\u00fd t\u1ef1');return;}
    if(nw!==cf){_authErrShow('prof-pass-err','X\u00e1c nh\u1eadn kh\u00f4ng kh\u1edbp');return;}
    var btn=document.querySelector('[onclick="_profileSavePass()"]');
    if(btn){btn.disabled=true;btn.textContent='\u0110ang c\u1eadp nh\u1eadt...';}
    api('auth_change_password',{old_password:old,new_password:nw},function(err,d){
      if(btn){btn.disabled=false;btn.innerHTML='&#x1F511; C\u1eadp nh\u1eadt m\u1eadt kh\u1ea9u';}
      if(err||!d||!d.ok){_authErrShow('prof-pass-err',(d&&d.error)||'L\u1ed7i c\u1eadp nh\u1eadt');return;}
      var ok=document.getElementById('prof-pass-ok');
      if(ok){ok.style.display='block';ok.textContent='\u2705 \u0110\u1ed5i m\u1eadt kh\u1ea9u th\u00e0nh c\u00f4ng';}
      ['pp_old','pp_new','pp_confirm'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
      var sw=document.getElementById('pp-sw');if(sw)sw.style.display='none';
      _toast('&#x2705; \u0110\u1ed5i m\u1eadt kh\u1ea9u th\u00e0nh c\u00f4ng','ok');
    });
  }

  /* ============================================================
   * S5 - ADMIN PANEL
   * ============================================================ */

  function _adminShell() {
    var h='<div class="sk-panel" style="padding:0;overflow:hidden;">';
    h+='<div class="sk-veh-tabbar">';
    h+='<button class="sk-veh-tab active" id="adm-tb-users" onclick="_adminTabSwitch(\'users\')">&#x1F465; Danh s\u00e1ch User</button>';
    h+='<button class="sk-veh-tab" id="adm-tb-pending" onclick="_adminTabSwitch(\'pending\')">&#x23F3; Ch\u1edd duy\u1ec7t</button>';
    h+='</div><div id="adm-body" style="padding:24px 28px 32px;"></div></div>';
    return h;
  }

  function _adminTabSwitch(tab) {
    var all=['users','pending'];
    for(var i=0;i<all.length;i++){var b=document.getElementById('adm-tb-'+all[i]);if(b)b.className='sk-veh-tab'+(all[i]===tab?' active':'');}
    var body=document.getElementById('adm-body'); if(!body)return;
    body.innerHTML=_skelBlock();
    if(tab==='users')_adminLoadUsers(body);
    if(tab==='pending')_adminLoadPending(body);
  }

  function _adminLoadUsers(body) {
    api('admin_user_list',{},function(err,d){
      if(!body)return;
      if(err||!d||!d.ok){body.innerHTML=_errBox(d&&d.error);return;}
      window._auth.users=d.data||[];
      body.innerHTML=_adminUsersHtml(d.data||[]);
    });
  }

  function _adminUsersHtml(users) {
    var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">';
    h+='<h3 style="margin:0;font-size:15px;font-weight:700;color:#e2e8f0;">&#x1F465; Qu\u1ea3n l\u00fd t\u00e0i kho\u1ea3n ('+users.length+')</h3>';
    h+='<button class="sk-btn" style="padding:8px 16px;font-size:12.5px;" onclick="_adminOpenUserForm(null)">+ Th\u00eam user</button>';
    h+='</div>';
    if(users.length===0) return h+_emptyBox('&#x1F465;','Ch\u01b0a c\u00f3 user n\u00e0o','Nh\u1ea5n \u201cTh\u00eam user\u201d \u0111\u1ec3 b\u1eaft \u0111\u1ea7u');
    h+='<div class="sk-panel" style="overflow:hidden;padding:0;">';
    h+='<table style="width:100%;border-collapse:collapse;font-size:13px;">';
    h+='<thead><tr style="background:#1e293b;">';
    var cols=['H\u1ecd t\u00ean / Email','Ph\u00f2ng ban','Role','Tr\u1ea1ng th\u00e1i','Ng\u00e0y t\u1ea1o',''];
    for(var c=0;c<cols.length;c++) h+='<th style="padding:11px 14px;color:#64748b;font-weight:500;text-align:left;">'+cols[c]+'</th>';
    h+='</tr></thead><tbody>';
    for(var i=0;i<users.length;i++){
      var u=users[i]; var bg=i%2===0?'transparent':'rgba(255,255,255,.018)';
      h+='<tr style="background:'+bg+';border-bottom:1px solid #1e293b;">';
      h+='<td style="padding:11px 14px;"><div style="display:flex;align-items:center;gap:10px;">';
      if(u.avatar) h+='<img src="'+_esc(u.avatar)+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;">';
      else h+='<div style="width:32px;height:32px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;">'+_avatarInitials(u.name||u.email)+'</div>';
      h+='<div><div style="font-weight:600;color:#f1f5f9;">'+_esc(u.name||'\u2014')+'</div><div style="font-size:11.5px;color:#64748b;">'+_esc(u.email)+'</div></div></div></td>';
      h+='<td style="padding:11px 14px;color:#94a3b8;">'+_esc(u.department||'\u2014')+'</td>';
      h+='<td style="padding:11px 14px;">'+_roleBadge(u.role)+'</td>';
      h+='<td style="padding:11px 14px;">'+(u.active?'<span style="color:#10b981;font-size:12px;font-weight:600;">&#x25CF; Ho\u1ea1t \u0111\u1ed9ng</span>':'<span style="color:#ef4444;font-size:12px;font-weight:600;">&#x25CF; \u0110\u00e3 kh\u00f3a</span>')+'</td>';
      h+='<td style="padding:11px 14px;color:#64748b;font-size:12px;">'+_esc(u.created_at||'\u2014')+'</td>';
      h+='<td style="padding:11px 14px;text-align:right;"><button class="sk-btn-sm sk-btn-outline" style="font-size:11.5px;" onclick="_adminOpenUserForm(\''+_esc(u.email)+'\')">&#x270F; S\u1eeda</button></td>';
      h+='</tr>';
    }
    h+='</tbody></table></div>';
    return h;
  }

  function _adminOpenUserForm(email) {
    var u=null;
    if(email){var lst=window._auth.users||[];for(var i=0;i<lst.length;i++){if(lst[i].email===email){u=lst[i];break;}}}
    var isNew=!u;
    _removeModal('sk-user-modal');
    var roles=['admin','kho','ketoan','xe','sales','user'];
    var rLbls=['Admin','\u0110i\u1ec1u ph\u1ed1i Kho','K\u1ebf to\u00e1n','T\u00e0i x\u1ebf','Sales','User'];
    var rOpts='';
    for(var r=0;r<roles.length;r++) rOpts+='<option value="'+roles[r]+'"'+(u&&u.role===roles[r]?' selected':'')+'>'+roles[r]+' \u2014 '+rLbls[r]+'</option>';
    var h='<div id="sk-user-modal" class="sk-modal-overlay" onclick="_closeModal(\'sk-user-modal\',event)">';
    h+='<div class="sk-modal-box" style="max-width:480px;" onclick="event.stopPropagation()">';
    h+='<div class="sk-modal-hd">'+(isNew?'&#x1F464;+ Th\u00eam user m\u1edbi':'&#x270F; Ch\u1ec9nh s\u1eeda: '+_esc(u.email))+'<button onclick="_removeModal(\'sk-user-modal\')" class="sk-modal-close">&times;</button></div>';
    h+='<div class="sk-modal-bd">';
    h+='<div id="sk-user-modal-err" class="sk-auth-err" style="display:none;margin-bottom:14px;"></div>';
    h+='<div class="sk-fg2">';
    h+='<div style="grid-column:1/-1"><label class="sk-lbl">Email <em style="color:#ef4444;">*</em></label><input id="uf_email" class="sk-inp" type="email" placeholder="user@sonkhang.vn"'+(u?' value="'+_esc(u.email)+'" readonly style="opacity:.55"':'')+' ></div>';
    h+='<div><label class="sk-lbl">H\u1ecd v\u00e0 t\u00ean</label><input id="uf_name" class="sk-inp" type="text" value="'+_esc(u?u.name:'')+'" placeholder="Nguy\u1ec5n V\u0103n A"></div>';
    h+='<div><label class="sk-lbl">'+(isNew?'M\u1eadt kh\u1ea9u t\u1ea1m':'M\u1eadt kh\u1ea9u m\u1edbi')+'</label><input id="uf_pass" class="sk-inp" type="text" placeholder="'+(isNew?'T\u1ef1 \u0111i\u1ec1n ho\u1eb7c \u0111\u1ec3 tr\u1ed1ng (t\u1ef1 t\u1ea1o)':'\u0110\u1ec3 tr\u1ed1ng = gi\u1eef nguy\u00ean')+'"></div>';
    h+='<div><label class="sk-lbl">Role</label><select id="uf_role" class="sk-inp">'+rOpts+'</select></div>';
    h+='<div><label class="sk-lbl">S\u1ed1 \u0111i\u1ec7n tho\u1ea1i</label><input id="uf_phone" class="sk-inp" type="tel" value="'+_esc(u?u.phone:'')+'" placeholder="0901234567"></div>';
    h+='<div><label class="sk-lbl">Ph\u00f2ng / Ban</label><input id="uf_dept" class="sk-inp" type="text" value="'+_esc(u?u.department:'')+'" placeholder="Kho, K\u1ebf to\u00e1n..."></div>';
    if(!isNew){
      h+='<div style="grid-column:1/-1;padding:12px 14px;background:rgba(255,255,255,.04);border-radius:8px;border:1px solid #1e293b;">';
      h+='<label class="sk-lbl" style="margin-bottom:8px;">Tr\u1ea1ng th\u00e1i t\u00e0i kho\u1ea3n</label>';
      h+='<div style="display:flex;gap:16px;">';
      h+='<label style="display:flex;align-items:center;gap:6px;cursor:pointer;color:#94a3b8;font-size:13px;"><input type="radio" id="uf_active_y" name="uf_active" value="true"'+(u&&u.active?' checked':'')+' style="accent-color:#10b981;"> &#x2705; Ho\u1ea1t \u0111\u1ed9ng</label>';
      h+='<label style="display:flex;align-items:center;gap:6px;cursor:pointer;color:#94a3b8;font-size:13px;"><input type="radio" id="uf_active_n" name="uf_active" value="false"'+(u&&!u.active?' checked':'')+' style="accent-color:#ef4444;"> &#x1F512; Kh\u00f3a</label>';
      h+='</div></div>';
    }
    h+='</div></div>';
    h+='<div class="sk-modal-ft">';
    h+='<button class="sk-btn-sm sk-btn-outline" onclick="_removeModal(\'sk-user-modal\')">H\u1ee7y</button>';
    h+='<button class="sk-btn" id="uf_save" onclick="_adminSaveUser()">'+(isNew?'&#x1F4BE; T\u1ea1o t\u00e0i kho\u1ea3n':'&#x2705; C\u1eadp nh\u1eadt')+'</button>';
    h+='</div></div></div>';
    document.body.appendChild(document.createRange().createContextualFragment(h));
  }

  function _adminSaveUser() {
    var email=_val('uf_email').trim().toLowerCase();
    if(!email){_authErrShow('sk-user-modal-err','Vui l\u00f2ng nh\u1eadp email');return;}
    var activeEl=document.querySelector('input[name="uf_active"]:checked');
    var active=activeEl?(activeEl.value==='true'):true;
    var btn=document.getElementById('uf_save');
    if(btn){btn.disabled=true;btn.textContent='\u0110ang l\u01b0u...';}
    var payload={email:email,role:_val('uf_role'),active:active};
    var nm=_val('uf_name').trim(); var ps=_val('uf_pass').trim();
    var ph=_val('uf_phone').trim(); var dp=_val('uf_dept').trim();
    if(nm)payload.name=nm; if(ps)payload.password=ps;
    if(ph)payload.phone=ph; if(dp)payload.department=dp;
    api('admin_user_save',payload,function(err,d){
      if(btn){btn.disabled=false;btn.innerHTML='&#x2705; C\u1eadp nh\u1eadt';}
      if(err||!d||!d.ok){_authErrShow('sk-user-modal-err',(d&&d.error)||'L\u1ed7i l\u01b0u');return;}
      _removeModal('sk-user-modal');
      var msg=d.action==='created'?'&#x2705; \u0110\u00e3 t\u1ea1o t\u00e0i kho\u1ea3n '+email+(d.temp_password?' \u2014 M\u1eadt kh\u1ea9u t\u1ea1m: <strong>'+d.temp_password+'</strong>':''):'&#x2705; \u0110\u00e3 c\u1eadp nh\u1eadt '+email;
      _toast(msg,'ok');
      var body=document.getElementById('adm-body');
      if(body){body.innerHTML=_skelBlock();_adminLoadUsers(body);}
    });
  }

  function _adminLoadPending(body) {
    api('admin_pending_list',{},function(err,d){
      if(!body)return;
      if(err||!d||!d.ok){body.innerHTML=_errBox(d&&d.error);return;}
      window._auth.pending=d.data||[];
      body.innerHTML=_adminPendingHtml(d.data||[]);
    });
  }

  function _adminPendingHtml(list) {
    var pendCount=0; for(var ci=0;ci<list.length;ci++){if(list[ci].status==='pending')pendCount++;}
    var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">';
    h+='<h3 style="margin:0;font-size:15px;font-weight:700;color:#e2e8f0;">&#x23F3; Y\u00eau c\u1ea7u \u0111\u0103ng k\u00fd ('+pendCount+' ch\u1edd duy\u1ec7t)</h3>';
    h+='<button class="sk-btn-sm" onclick="_adminRefreshPending()">&#x21BA; L\u00e0m m\u1edbi</button></div>';
    if(list.length===0) return h+_emptyBox('&#x1F4E5;','Kh\u00f4ng c\u00f3 y\u00eau c\u1ea7u n\u00e0o','T\u1ea5t c\u1ea3 \u0111\u00e3 \u0111\u01b0\u1ee3c x\u1eed l\u00fd');
    h+='<div style="display:flex;flex-direction:column;gap:12px;">';
    for(var i=0;i<list.length;i++){
      var p=list[i]; var isPending=p.status==='pending';
      var bdr=isPending?'#f59e0b':(p.status==='approved'?'#10b981':'#ef4444');
      h+='<div style="background:#111827;border:1px solid '+bdr+'33;border-left:3px solid '+bdr+';border-radius:10px;padding:16px 18px;">';
      h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">';
      h+='<div>';
      h+='<div style="font-weight:700;color:#f1f5f9;font-size:14px;">'+_esc(p.name)+'</div>';
      h+='<div style="font-size:12.5px;color:#94a3b8;margin-top:3px;">'+_esc(p.email)+'</div>';
      if(p.phone) h+='<div style="font-size:12px;color:#64748b;margin-top:2px;">&#x1F4DE; '+_esc(p.phone)+'</div>';
      if(p.department) h+='<div style="font-size:12px;color:#64748b;">&#x1F3E2; '+_esc(p.department)+'</div>';
      if(p.note) h+='<div style="font-size:12px;color:#64748b;margin-top:2px;">&#x1F4DD; '+_esc(p.note)+'</div>';
      h+='<div style="font-size:11.5px;color:#475569;margin-top:6px;">&#x1F4C5; '+_esc(p.created_at)+'</div>';
      h+='</div><div style="flex-shrink:0;">';
      if(isPending){
        var sEmail=_esc(p.email);
        h+='<div style="display:flex;flex-direction:column;gap:7px;">';
        h+='<select id="pend_role_'+i+'" class="sk-inp" style="font-size:12px;padding:6px 10px;">';
        var proles=['user','kho','ketoan','xe','sales','admin'];
        for(var rr=0;rr<proles.length;rr++) h+='<option value="'+proles[rr]+'">'+proles[rr]+'</option>';
        h+='</select>';
        h+='<button class="sk-btn" style="font-size:12px;padding:7px 14px;background:linear-gradient(135deg,#10b981,#059669);" onclick="_adminApprovePending(\''+sEmail+'\','+i+',\'approve\')">&#x2705; Duy\u1ec7t</button>';
        h+='<button class="sk-btn-sm" style="background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3);" onclick="_adminApprovePending(\''+sEmail+'\','+i+',\'reject\')">&#x274C; T\u1eeb ch\u1ed1i</button>';
        h+='</div>';
      } else {
        var stTxt=p.status==='approved'?'\u0110\u00e3 duy\u1ec7t':'\u0110\u00e3 t\u1eeb ch\u1ed1i';
        var stClr=p.status==='approved'?'#10b981':'#ef4444';
        h+='<span style="color:'+stClr+';font-size:12.5px;font-weight:600;">'+(p.status==='approved'?'&#x2705; ':'&#x274C; ')+stTxt+'</span>';
      }
      h+='</div></div></div>';
    }
    h+='</div>';
    return h;
  }

  function _adminApprovePending(email,idx,action) {
    var rEl=document.getElementById('pend_role_'+idx); var role=rEl?rEl.value:'user';
    var confirmMsg=action==='approve'?'Duy\u1ec7t t\u00e0i kho\u1ea3n cho '+email+' v\u1edbi role: '+role+'?':'T\u1eeb ch\u1ed1i \u0111\u0103ng k\u00fd c\u1ee7a '+email+'?';
    if(!confirm(confirmMsg))return;
    api('admin_pending_approve',{email:email,action:action,role:role},function(err,d){
      if(err||!d||!d.ok){_toast('&#x274C; L\u1ed7i: '+((d&&d.error)||'?'),'error');return;}
      var m=action==='approve'?'&#x2705; \u0110\u00e3 duy\u1ec7t '+email+(d.temp_password?' \u2014 M\u1eadt kh\u1ea9u t\u1ea1m: <strong>'+d.temp_password+'</strong>':''):'&#x274C; \u0110\u00e3 t\u1eeb ch\u1ed1i '+email;
      _toast(m,action==='approve'?'ok':'warn');
      _adminRefreshPending();
    });
  }

  function _adminRefreshPending(){
    var body=document.getElementById('adm-body'); if(!body)return;
    body.innerHTML=_skelBlock(); _adminLoadPending(body);
  }

  /* ============================================================
   * S6 - GOOGLE GSI LOADER
   * ============================================================ */
  function _loadGSI() {
    /* Chi load GSI script khi da cau hinh GOOGLE_CLIENT_ID */
    if (!_GCID) return;
    if(document.getElementById('sk-gsi-script'))return;
    var s=document.createElement('script'); s.id='sk-gsi-script';
    s.src='https://accounts.google.com/gsi/client'; s.async=true; s.defer=true;
    document.head.appendChild(s);
  }

  /* ============================================================
   * S7 - CSS
   * ============================================================ */
  function _injectCss() {
    if(document.getElementById('sk-auth-css'))return;
    var s=document.createElement('style'); s.id='sk-auth-css';
    s.textContent=[
      '.sk-auth-center{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 60px);padding:24px;}',
      '.sk-auth-card{background:linear-gradient(135deg,#111827,#0f172a);border:1px solid #1e293b;border-radius:20px;padding:36px 32px;width:100%;max-width:400px;box-shadow:0 32px 80px rgba(0,0,0,.8);}',
      '.sk-auth-divider{display:flex;align-items:center;gap:12px;margin:18px 0;color:#334155;font-size:12px;}',
      '.sk-auth-divider::before,.sk-auth-divider::after{content:"";flex:1;height:1px;background:#1e293b;}',
      '.sk-auth-err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:10px 13px;color:#ef4444;font-size:12.5px;}',
      '.sk-auth-ok{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.22);border-radius:8px;padding:10px 13px;color:#10b981;font-size:12.5px;}',
      '.sk-auth-info-box{background:rgba(59,130,246,.07);border:1px solid rgba(59,130,246,.2);border-radius:8px;padding:10px 13px;color:#93c5fd;font-size:12.5px;}',
      '.sk-veh-tabbar{display:flex;background:#0a0f1e;border-bottom:1px solid #1e293b;overflow-x:auto;}',
      '.sk-veh-tab{display:flex;align-items:center;gap:7px;padding:13px 20px;background:none;border:none;border-bottom:2px solid transparent;color:#64748b;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;transition:color .2s,border-color .2s;}',
      '.sk-veh-tab:hover{color:#94a3b8;}',
      '.sk-veh-tab.active{color:#e2e8f0!important;border-bottom-color:#3b82f6!important;}',
      '.sk-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;}',
      '.sk-modal-box{background:#0f172a;border:1px solid #1e293b;border-radius:16px;width:100%;max-width:600px;max-height:92vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,.9);}',
      '.sk-modal-hd{display:flex;justify-content:space-between;align-items:center;padding:17px 22px;border-bottom:1px solid #1e293b;font-size:14.5px;font-weight:700;color:#e2e8f0;}',
      '.sk-modal-bd{padding:18px 22px;}',
      '.sk-modal-ft{display:flex;justify-content:flex-end;gap:9px;padding:14px 22px;border-top:1px solid #1e293b;}',
      '.sk-modal-close{background:none;border:none;color:#64748b;font-size:22px;cursor:pointer;line-height:1;}',
      '.sk-modal-close:hover{color:#e2e8f0;}',
      '.sk-fg2{display:grid;grid-template-columns:1fr 1fr;gap:13px;}',
      '.sk-lbl{display:block;font-size:11.5px;color:#94a3b8;margin-bottom:4px;font-weight:500;}',
      '.sk-btn-sm{padding:6px 13px;font-size:12px;border-radius:8px;border:none;cursor:pointer;font-weight:600;color:#fff;transition:opacity .15s;}',
      '.sk-btn-sm:hover{opacity:.88;}',
      '.sk-btn-outline{background:transparent!important;border:1px solid #334155!important;color:#94a3b8!important;}',
      '.sk-btn-outline:hover{background:#1e293b!important;color:#e2e8f0!important;}',
      '@keyframes sk-ti{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}',
      '@media(max-width:640px){.sk-fg2{grid-template-columns:1fr;}.sk-auth-card{padding:24px 18px;}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ============================================================
   * S8 - HELPERS
   * ============================================================ */
  function _roleBadge(role){
    var cs={admin:'#ef4444',kho:'#f97316',ketoan:'#f59e0b',xe:'#3b82f6',sales:'#8b5cf6',user:'#64748b'};
    var ls={admin:'Admin',kho:'Kho',ketoan:'K\u1ebf to\u00e1n',xe:'T\u00e0i x\u1ebf',sales:'Sales',user:'User'};
    var c=cs[role]||'#64748b'; var l=ls[role]||role;
    return '<span style="background:'+c+'1a;color:'+c+';border:1px solid '+c+'33;border-radius:999px;padding:3px 10px;font-size:11.5px;font-weight:700;">'+l+'</span>';
  }
  function _avatarInitials(name){
    if(!name)return '?';
    var p=name.trim().split(/\s+/);
    if(p.length>=2) return (p[0][0]+p[p.length-1][0]).toUpperCase();
    return (name[0]||'?').toUpperCase();
  }
  function _authTogglePass(id,btn){
    var el=document.getElementById(id); if(!el)return;
    if(el.type==='password'){el.type='text';if(btn)btn.innerHTML='&#x1F576;';}
    else{el.type='password';if(btn)btn.innerHTML='&#x1F441;';}
  }
  function _authErrShow(boxId,msg){
    var b=document.getElementById(boxId); if(!b)return;
    b.style.display='block'; b.innerHTML='&#x26A0;&#xFE0F; '+msg;
  }
  function _getToken(){try{return localStorage.getItem('sk_session')||'';}catch(e){return '';}}
  function _setToken(tok){try{localStorage.setItem('sk_session',tok);}catch(e){}}
  function _clearToken(){try{localStorage.removeItem('sk_session');}catch(e){}}
  function _setUser(d){window._auth.user={email:d.email||'',name:d.name||'',role:d.role||'user',phone:d.phone||'',department:d.department||'',avatar:d.avatar||''};}
  function _val(id){var e=document.getElementById(id);return e?e.value:'';}
  function _esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function _skelBlock(){if(typeof skel==='function')return skel();return '<div style="text-align:center;padding:60px;color:#64748b;"><div style="width:32px;height:32px;border:2px solid #334155;border-top-color:#3b82f6;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px;"></div>\u0110ang t\u1ea3i...</div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';}
  function _errBox(msg){return '<div style="padding:20px;color:#ef4444;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:10px;font-size:13px;">&#x274C; L\u1ed7i: '+_esc(msg||'Kh\u00f4ng r\u00f5')+'</div>';}
  function _emptyBox(icon,title,desc){if(typeof emptyState==='function')return emptyState(icon,title,desc);return '<div style="text-align:center;padding:48px 24px;color:#64748b;"><div style="font-size:38px;margin-bottom:12px;">'+icon+'</div><div style="font-size:14px;color:#94a3b8;font-weight:600;margin-bottom:6px;">'+title+'</div><div style="font-size:12.5px;">'+desc+'</div></div>';}
  function _toast(msg,type){
    var old=document.getElementById('sk-auth-toast'); if(old)old.remove();
    var bg=type==='ok'?'rgba(16,185,129,.15)':type==='warn'?'rgba(245,158,11,.15)':'rgba(239,68,68,.15)';
    var bd=type==='ok'?'#10b981':type==='warn'?'#f59e0b':'#ef4444';
    var el=document.createElement('div'); el.id='sk-auth-toast';
    el.setAttribute('style','position:fixed;bottom:22px;right:22px;z-index:99999;background:'+bg+';border:1px solid '+bd+';border-radius:11px;padding:12px 18px;color:#e2e8f0;font-size:13px;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,.7);animation:sk-ti .2s ease;pointer-events:none;line-height:1.5;');
    el.innerHTML=msg; document.body.appendChild(el);
    setTimeout(function(){el.style.opacity='0';el.style.transition='opacity .3s';setTimeout(function(){if(el.parentNode)el.remove();},320);},5000);
  }
  function _removeModal(id){var m=document.getElementById(id);if(m)m.remove();}
  function _closeModal(id,e){if(e&&e.target&&e.target.id===id)_removeModal(id);}

  /* ============================================================
   * S9 - EXPOSE WINDOW
   * ============================================================ */
  _injectCss();

  window.loadAuth              = loadAuth;
  window.loadAccountSettings   = loadAccountSettings;
  window.loadAdminPanel        = loadAdminPanel;
  window._authLogin            = _authLogin;
  window._authLoginKey         = _authLoginKey;
  window._authGoogleCallback   = _authGoogleCallback;
  window._authShowRegisterForm = _authShowRegisterForm;
  window._authSendRegister     = _authSendRegister;
  window._authTogglePass       = _authTogglePass;
  window._profileTabSwitch     = _profileTabSwitch;
  window._profileSaveInfo      = _profileSaveInfo;
  window._profileSavePass      = _profileSavePass;
  window._profilePassStrength  = _profilePassStrength;
  window._adminTabSwitch       = _adminTabSwitch;
  window._adminOpenUserForm    = _adminOpenUserForm;
  window._adminSaveUser        = _adminSaveUser;
  window._adminApprovePending  = _adminApprovePending;
  window._adminRefreshPending  = _adminRefreshPending;
  window._removeModal          = window._removeModal || _removeModal;
  window._closeModal           = window._closeModal  || _closeModal;

}());
