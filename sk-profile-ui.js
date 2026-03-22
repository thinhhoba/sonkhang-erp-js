// [v5.28] 22/03/2026 — sk-profile-ui.js
// Profile Page: Hero + Stats + Social tabs
// [DESIGN] LinkedIn/Notion inspired, dark premium
(function () {
  'use strict';
  var _api   = function(){ return typeof window.api==='function'?window.api:null; };
  var _ct    = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
  var _esc   = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };
  var _fmt   = function(n){ n=Number(n||0); if(n>=1e6) return (n/1e6).toFixed(1)+'tr'; if(n>=1e3) return (n/1e3).toFixed(0)+'k'; return n; };

  var _ROLE_LABEL = {
    'admin':'Quản trị viên','manager':'Quản lý','sales':'Bán hàng',
    'accountant':'Kế toán','warehouse':'Kho','hr':'Nhân sự','driver':'Tài xế',
  };
  var _ROLE_COLOR = {
    'admin':'#ef4444','manager':'#f59e0b','sales':'#4f6fff',
    'accountant':'#10b981','warehouse':'#06b6d4','hr':'#a855f7','driver':'#f97316',
  };

  var _profileData = null;
  var _activeTab   = 'info';

  function loadProfile() {
    var ct = _ct(); if (!ct) return;
    ct.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text3);">Dang tai...</div>';
    var apiF = _api(); if (!apiF) { ct.innerHTML='<p style="color:var(--red);padding:24px;">API chua san sang</p>'; return; }
    apiF('auth_get_profile', {}, function(e, d) {
      if (e||!d||!d.ok) { ct.innerHTML='<div style="padding:24px;color:var(--red);">Loi tai profile: '+_esc((d&&d.error)||'')+'</div>'; return; }
      _profileData = d;
      _renderProfile(d);
    });
  }

  function _renderProfile(d) {
    var ct = _ct(); if (!ct) return;
    var role      = d.role || 'user';
    var roleLabel = _ROLE_LABEL[role] || role;
    var roleColor = _ROLE_COLOR[role] || '#64748b';
    var initials  = (d.name||d.email||'?').split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
    var avatarUrl = d.avatar || '';
    var dept      = d.department || '';

    ct.innerHTML = '<div class="fade-in" style="max-width:860px;margin:0 auto;padding:24px;">'

      // Cover + Avatar hero
      + '<div style="border-radius:18px;overflow:hidden;margin-bottom:20px;border:1px solid var(--border);">'
        // Cover gradient
        + '<div style="height:140px;background:linear-gradient(135deg,#0a1628 0%,#1a2a6c 40%,#23074d 70%,#0d1b2a 100%);position:relative;">'
          + '<div style="position:absolute;inset:0;background:url(\'data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"100\\" height=\\"100\\"><circle cx=\\"20\\" cy=\\"20\\" r=\\"40\\" fill=\\"rgba(79,111,255,.08)\\"/><circle cx=\\"80\\" cy=\\"60\\" r=\\"60\\" fill=\\"rgba(6,214,214,.06)\\"/></svg>\') repeat;opacity:.5;"></div>'
        + '</div>'
        // Profile info row
        + '<div style="padding:0 24px 20px;background:var(--bg2);">'
          + '<div style="display:flex;align-items:flex-end;gap:16px;margin-top:-50px;flex-wrap:wrap;">'
            // Avatar
            + '<div style="position:relative;flex-shrink:0;">'
              + '<div id="prof-avatar-wrap" style="width:90px;height:90px;border-radius:18px;'
                + 'border:4px solid var(--bg2);overflow:hidden;background:linear-gradient(135deg,#4f6fff,#06d6d6);'
                + 'display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#fff;cursor:pointer;" '
                + 'onclick="document.getElementById(\'prof-avatar-input\').click()" title="Doi anh dai dien">'
                + (avatarUrl
                    ? '<img src="'+_esc(avatarUrl)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">'
                    : initials)
              + '</div>'
              + '<div style="position:absolute;bottom:4px;right:4px;width:24px;height:24px;background:var(--accent);border:2px solid var(--bg2);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;" onclick="document.getElementById(\'prof-avatar-input\').click()"><svg width="10" height="10" viewBox="0 0 16 16" fill="white"><path d="M11.5 2.5a2.5 2.5 0 013 3L6 14H2v-4L11.5 2.5z"/></svg></div>'
              + '<input type="file" id="prof-avatar-input" accept="image/*" style="display:none;" onchange="window._profUploadAvatar(this)">'
            + '</div>'
            // Name + role
            + '<div style="padding-bottom:4px;flex:1;">'
              + '<h2 style="font-size:20px;font-weight:900;margin:0 0 4px;color:var(--text);">'+_esc(d.name||d.email)+'</h2>'
              + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
                + '<span style="background:'+roleColor+'22;color:'+roleColor+';border:1px solid '+roleColor+'44;'
                  + 'border-radius:6px;padding:2px 10px;font-size:11px;font-weight:800;">'+_esc(roleLabel)+'</span>'
                + (dept ? '<span style="font-size:12px;color:var(--text3);">'+_esc(dept)+'</span>' : '')
                + '<span style="font-size:11px;color:var(--text3);">'+_esc(d.email||'')+'</span>'
              + '</div>'
            + '</div>'
            // Action buttons
            + '<div style="display:flex;gap:8px;padding-bottom:4px;">'
              + '<button onclick="window._profTabSwitch(\'settings\')" style="background:var(--accent);border:none;color:#fff;border-radius:9px;padding:8px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x2699; Cai dat</button>'
              + '<button onclick="window._profNewMessage()" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:9px;padding:8px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">&#x1F4AC; Nhan tin</button>'
            + '</div>'
          + '</div>'
        + '</div>'
      + '</div>'

      // Stats row
      + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;" id="prof-stats">'
        + _statCard('---','Don hang','#4f6fff')
        + _statCard('---','Doanh thu','#00d68f')
        + _statCard('---','Ngay lam','#f59e0b')
        + _statCard('---','Danh gia','#a855f7')
      + '</div>'

      // Tabs
      + '<div style="display:flex;gap:4px;background:var(--bg3);border-radius:12px;padding:4px;margin-bottom:16px;" id="prof-tabs">'
        + _tabBtn('info',     'info',     'Thong tin',  true)
        + _tabBtn('posts',    'posts',    'Bai dang',   false)
        + _tabBtn('settings', 'settings', 'Cai dat',    false)
      + '</div>'

      + '<div id="prof-tab-body"></div>'
    + '</div>';

    _renderTab('info');
    _loadStats();
  }

  function _statCard(val, label, color) {
    return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center;">'
      + '<div style="font-size:20px;font-weight:900;color:'+color+';font-family:monospace;" id="pstat-'+label.replace(' ','-')+'">'+val+'</div>'
      + '<div style="font-size:10px;font-weight:700;color:var(--text3);margin-top:3px;text-transform:uppercase;letter-spacing:.07em;">'+label+'</div>'
    + '</div>';
  }

  function _tabBtn(id, key, label, active) {
    return '<button id="prtab-'+id+'" onclick="window._profTabSwitch(\''+key+'\')" '
      + 'style="flex:1;border-radius:9px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;'
      + (active
          ? 'background:var(--accent2);border:none;color:#fff;'
          : 'background:none;border:none;color:var(--text3);')
      + '">'+label+'</button>';
  }

  function _renderTab(tab) {
    _activeTab = tab;
    ['info','posts','settings'].forEach(function(t) {
      var btn = document.getElementById('prtab-'+t);
      if (!btn) return;
      btn.style.background = t===tab ? 'var(--accent2)' : 'none';
      btn.style.color      = t===tab ? '#fff' : 'var(--text3)';
    });
    var body = document.getElementById('prof-tab-body');
    if (!body) return;
    if      (tab==='info')     _renderInfoTab(body);
    else if (tab==='posts')    _renderPostsTab(body);
    else if (tab==='settings') _renderSettingsTab(body);
  }

  function _renderInfoTab(body) {
    var d = _profileData || {};
    body.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:20px;">'
      + '<h3 style="font-size:13px;font-weight:900;margin:0 0 14px;color:var(--text);">Thong tin ca nhan</h3>'
      + _infoRow('Email',      d.email      || '—')
      + _infoRow('Ho va ten',  d.name       || '—')
      + _infoRow('Dien thoai', d.phone      || '—')
      + _infoRow('Phong ban',  d.department || '—')
      + _infoRow('Chuc vu',    _ROLE_LABEL[d.role]||d.role||'—')
      + _infoRow('Ngay tao',   d.created_at ? d.created_at.split('T')[0] : '—')
    + '</div>';
  }

  function _infoRow(label, val) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">'
      + '<span style="font-size:12px;color:var(--text3);font-weight:600;">'+_esc(label)+'</span>'
      + '<span style="font-size:12px;color:var(--text);font-weight:700;">'+_esc(val)+'</span>'
    + '</div>';
  }

  function _renderPostsTab(body) {
    body.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai bai dang...</div>';
    var apiF = _api(); if (!apiF) return;
    apiF('social_get_feed', { limit:10 }, function(e,d) {
      if (e||!d||!d.ok||!d.data.length) {
        body.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);">'
          + '<div style="font-size:28px;margin-bottom:8px;">&#x1F4DD;</div>'
          + '<div style="font-size:13px;">Chua co bai dang nao. Chia se suy nghi cua ban!</div>'
          + '<button onclick="window.loadSocial&&window.loadSocial()" '
            + 'style="margin-top:12px;background:var(--accent);border:none;color:#fff;border-radius:9px;padding:9px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Di toi mang xa hoi</button>'
        + '</div>';
        return;
      }
      var email = _profileData && _profileData.email ? _profileData.email.toLowerCase() : '';
      var myPosts = d.data.filter(function(p){ return p.author_email.toLowerCase()===email; });
      body.innerHTML = myPosts.length
        ? myPosts.map(_renderPostCard).join('')
        : '<div style="text-align:center;padding:32px;color:var(--text3);">Chua co bai dang nao cua ban.</div>';
    });
  }

  function _renderPostCard(p) {
    var ago = _timeAgo(p.created_at);
    return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:10px;">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'
        + '<div style="width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#4f6fff,#06d6d6);'
          + 'display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800;flex-shrink:0;">'
          + (p.author_name||'?').substring(0,2).toUpperCase()
        + '</div>'
        + '<div><div style="font-size:13px;font-weight:800;color:var(--text);">'+_esc(p.author_name)+'</div>'
          + '<div style="font-size:10px;color:var(--text3);">'+_esc(ago)+'</div>'
        + '</div>'
      + '</div>'
      + '<div style="font-size:13px;color:var(--text2);line-height:1.6;white-space:pre-wrap;">'+_esc(p.content)+'</div>'
      + '<div style="margin-top:10px;font-size:11px;color:var(--text3);">&#x2764; '+p.likes_count+' luot thich</div>'
    + '</div>';
  }

  function _renderSettingsTab(body) {
    var d = _profileData || {};
    body.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:20px;">'
      + '<h3 style="font-size:13px;font-weight:900;margin:0 0 16px;">Cap nhat thong tin</h3>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">'
        + _field('ps-name',  'Ho va ten',  d.name||'',    'text')
        + _field('ps-phone', 'Dien thoai', d.phone||'',   'text')
        + _field('ps-dept',  'Phong ban',  d.department||'', 'text')
        + _field('ps-email', 'Email',      d.email||'',   'text')
      + '</div>'
      + '<button onclick="window._profSaveInfo()" style="background:var(--accent);border:none;color:#fff;border-radius:9px;padding:10px 24px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Luu thay doi</button>'
      + '<hr style="margin:20px 0;border-color:var(--border);">'
      + '<h3 style="font-size:13px;font-weight:900;margin:0 0 16px;">Doi mat khau</h3>'
      + '<div style="display:grid;gap:12px;max-width:400px;">'
        + _field('ps-pw-old',  'Mat khau cu',  '', 'password')
        + _field('ps-pw-new',  'Mat khau moi', '', 'password')
        + _field('ps-pw-new2', 'Xac nhan',     '', 'password')
      + '</div>'
      + '<button onclick="window._profChangePass()" style="margin-top:14px;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:var(--red);border-radius:9px;padding:10px 24px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Doi mat khau</button>'
    + '</div>';
  }

  function _field(id, label, val, type) {
    return '<div>'
      + '<label style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;display:block;margin-bottom:4px;">'+_esc(label)+'</label>'
      + '<input id="'+id+'" type="'+type+'" value="'+_esc(val)+'" style="width:100%;background:var(--bg3);border:1px solid var(--border2);'
        + 'color:var(--text);border-radius:8px;padding:8px 10px;font-size:12px;font-family:inherit;box-sizing:border-box;">'
    + '</div>';
  }

  function _loadStats() {
    // Load order count for this user
    var apiF = _api(); if (!apiF) return;
    var email = _profileData && _profileData.email;
    if (!email) return;
    apiF('sales_get_orders', { limit:1 }, function(e,d) {
      var el = document.getElementById('pstat-Don-hang');
      if (el && !e && d && d.ok) el.textContent = d.total || 0;
    });
  }

  function _timeAgo(iso) {
    if (!iso) return '';
    var diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)   return Math.round(diff) + 'g';
    if (diff < 3600) return Math.round(diff/60) + ' phut';
    if (diff < 86400)return Math.round(diff/3600) + ' gio';
    return Math.round(diff/86400) + ' ngay';
  }

  // ── Handlers ──────────────────────────────────────────────────
  window._profTabSwitch = function(tab) { _renderTab(tab); };

  window._profSaveInfo = function() {
    var apiF = _api(); if (!apiF) return;
    var name  = (document.getElementById('ps-name') ||{}).value||'';
    var phone = (document.getElementById('ps-phone')||{}).value||'';
    var dept  = (document.getElementById('ps-dept') ||{}).value||'';
    apiF('auth_update_profile',{name:name,phone:phone,department:dept},function(e,d){
      if (!e&&d&&d.ok){ _toast('Da cap nhat thong tin','ok'); if(_profileData){_profileData.name=name;_profileData.phone=phone;_profileData.department=dept;} }
      else _toast((d&&d.error)||'Loi','error');
    });
  };

  window._profChangePass = function() {
    var apiF = _api(); if (!apiF) return;
    var old  = (document.getElementById('ps-pw-old') ||{}).value||'';
    var nw   = (document.getElementById('ps-pw-new') ||{}).value||'';
    var nw2  = (document.getElementById('ps-pw-new2')||{}).value||'';
    if (!old||!nw) { _toast('Nhap du mat khau','error'); return; }
    if (nw !== nw2){ _toast('Mat khau moi khong khop','error'); return; }
    apiF('auth_change_password',{old_password:old,new_password:nw},function(e,d){
      if (!e&&d&&d.ok) _toast('Da doi mat khau','ok');
      else _toast((d&&d.error)||'Loi','error');
    });
  };

  window._profNewMessage = function() {
    if (typeof window.loadMessaging === 'function') window.skLoad('tin-nhan');
  };

  window._profUploadAvatar = function(input) {
    var file = input && input.files && input.files[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { _toast('Anh qua lon (toi da 2MB)','error'); return; }
    var reader = new FileReader();
    reader.onload = function(ev) {
      var b64 = ev.target.result;
      var apiF = _api(); if (!apiF) return;
      apiF('auth_update_profile',{ avatar:b64 },function(e,d){
        if (!e&&d&&d.ok) {
          _toast('Da cap nhat anh dai dien','ok');
          var wrap = document.getElementById('prof-avatar-wrap');
          if (wrap) {
            var img = wrap.querySelector('img');
            if (img) img.src = b64;
            else { var el=document.createElement('img'); el.src=b64; el.style.cssText='width:100%;height:100%;object-fit:cover;'; wrap.innerHTML=''; wrap.appendChild(el); }
          }
        } else _toast((d&&d.error)||'Loi upload','error');
      });
    };
    reader.readAsDataURL(file);
  };

  window.loadProfile   = loadProfile;
  window.loadCaNhan    = loadProfile;

}());
