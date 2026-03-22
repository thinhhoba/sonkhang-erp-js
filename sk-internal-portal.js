// [v5.30] 22/03/2026 — sk-internal-portal.js
// Cong Noi Bo v2.0 — Unified Internal Portal
// Hop nhat: Profile + Social + Messaging + Directory + Announcements
// [v5.30] Profile sync, post type styles, edit/delete, dir DM, notif sync
(function () {
  'use strict';

  var _api   = function(){ return typeof window.api==='function'?window.api:null; };
  var _ct    = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
  var _esc   = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };
  var _ago   = function(iso){ if(!iso) return ''; var d=(Date.now()-new Date(iso).getTime())/1000; if(d<60) return Math.round(d)+'g'; if(d<3600) return Math.round(d/60)+' phut'; if(d<86400) return Math.round(d/3600)+' gio'; return Math.round(d/86400)+' ngay'; };

  var _sess=null, _activeTab='feed', _pollTimer=null, _curThread=null;
  var _initialTab = 'feed';

  var TABS = [
    { id:'feed',    icon:'&#x1F4F0;', label:'Feed'      },
    { id:'chat',    icon:'&#x1F4AC;', label:'Tin nhan'  },
    { id:'dir',     icon:'&#x1F465;', label:'Danh ba'   },
    { id:'profile', icon:'&#x1F464;', label:'Ca nhan'   },
    { id:'notice',  icon:'&#x1F4E2;', label:'Thong bao' },
  ];

  // Post type config — visual phân biệt rõ
  var POST_TYPE_CONFIG = {
    post: {
      label:'Bai viet', icon:'&#x1F4DD;',
      cardStyle:'border-left:3px solid var(--accent2);',
      badgeBg:'rgba(79,111,255,.15)', badgeColor:'var(--accent2)',
      headerBg:'',
    },
    announcement: {
      label:'Thong bao', icon:'&#x1F4E2;',
      cardStyle:'border-left:3px solid #ef4444;background:rgba(239,68,68,.04);',
      badgeBg:'rgba(239,68,68,.15)', badgeColor:'#ef4444',
      headerBg:'background:linear-gradient(90deg,rgba(239,68,68,.08),transparent);padding:10px 14px;border-radius:10px;margin-bottom:10px;',
    },
    kudos: {
      label:'Khen thuong', icon:'&#x1F3C6;',
      cardStyle:'border-left:3px solid #f59e0b;background:rgba(245,158,11,.04);',
      badgeBg:'rgba(245,158,11,.15)', badgeColor:'#f59e0b',
      headerBg:'background:linear-gradient(90deg,rgba(245,158,11,.08),transparent);padding:10px 14px;border-radius:10px;margin-bottom:10px;',
    },
  };

  var ROLE_COLOR = { admin:'#ef4444',manager:'#f59e0b',sales:'#4f6fff',accountant:'#10b981',warehouse:'#06b6d4',hr:'#a855f7',driver:'#f97316' };
  var ROLE_LABEL = { admin:'Quan tri',manager:'Quan ly',sales:'Ban hang',accountant:'Ke toan',warehouse:'Kho',hr:'Nhan su',driver:'Tai xe' };

  function _getSession() {
    try { var r=localStorage.getItem('sk_session_data'); return r?JSON.parse(r):null; } catch(e){return null;}
  }

  function _injectCSS() {
    if (document.getElementById('sk-portal-css')) return;
    var s = document.createElement('style');
    s.id  = 'sk-portal-css';
    s.textContent = [
      '.por-wrap{display:grid;grid-template-columns:220px 1fr;height:calc(100vh - 100px);max-height:820px;margin:16px 24px;border:1px solid var(--border);border-radius:18px;overflow:hidden;}',
      '.por-sidebar{background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;}',
      '.por-sidebar-hdr{padding:16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;cursor:pointer;}',
      '.por-sidebar-hdr:hover{background:var(--bg3);}',
      '.por-av{border-radius:11px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;flex-shrink:0;}',
      '.por-nav{flex:1;padding:8px;overflow-y:auto;}',
      '.por-nav-btn{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border:none;border-radius:10px;background:none;color:var(--text3);cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;transition:all .12s;text-align:left;}',
      '.por-nav-btn:hover{background:var(--bg3);color:var(--text);}',
      '.por-nav-btn.active{background:rgba(79,111,255,.12);color:var(--accent2);border:1px solid rgba(79,111,255,.2);}',
      '.por-badge{background:#ef4444;color:#fff;border-radius:99px;font-size:9px;font-weight:800;min-width:16px;height:16px;display:flex;align-items:center;justify-content:center;padding:0 3px;margin-left:auto;}',
      '.por-main{background:var(--bg);display:flex;flex-direction:column;overflow:hidden;}',
      '.por-main-hdr{padding:12px 18px;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;align-items:center;gap:10px;flex-shrink:0;}',
      '.por-body{flex:1;overflow-y:auto;padding:16px 20px;}',
      '.por-post-card{border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:10px;transition:border .15s;}',
      '.por-post-card:hover{border-color:var(--border2);}',
      '.por-composer{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:14px;}',
      '.por-msg-split{display:grid;grid-template-columns:250px 1fr;height:100%;overflow:hidden;}',
      '.por-thread-list{border-right:1px solid var(--border);overflow-y:auto;}',
      '.por-thread-item{display:flex;align-items:center;gap:10px;padding:10px 13px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .1s;}',
      '.por-thread-item:hover,.por-thread-item.active{background:rgba(79,111,255,.07);}',
      '.por-chat-area{display:flex;flex-direction:column;}',
      '.por-dir-card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px;display:flex;align-items:center;gap:12px;transition:border .12s;}',
      '.por-dir-card:hover{border-color:var(--border2);}',
      '.por-edit-textarea{width:100%;background:var(--bg3);border:1px solid rgba(79,111,255,.4);color:var(--text);border-radius:9px;padding:10px;font-size:13px;font-family:inherit;resize:none;box-sizing:border-box;}',
      '.por-action-btn{display:flex;align-items:center;gap:4px;background:none;border:none;color:var(--text3);cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;padding:4px 9px;border-radius:7px;transition:all .12s;}',
      '.por-action-btn:hover{background:var(--bg3);color:var(--text);}',
      '.por-action-btn.danger:hover{background:rgba(239,68,68,.12);color:#ef4444;}',
      '@keyframes por-pop{0%{transform:scale(.95);opacity:0}100%{transform:scale(1);opacity:1}}',
      '.por-anim{animation:por-pop .2s ease;}',
      '@media(max-width:640px){.por-wrap{grid-template-columns:1fr;margin:8px;}.por-sidebar{display:none;}}',
    ].join('');
    document.head.appendChild(s);
  }

  // ── Main Load ─────────────────────────────────────────────────
  function loadInternalPortal(initTab) {
    _injectCSS();
    _sess = _getSession();
    _initialTab = initTab || 'feed';
    _activeTab  = _initialTab;
    var ct = _ct(); if (!ct) return;
    ct.innerHTML = '';

    var wrap = document.createElement('div');
    wrap.className = 'por-wrap fade-in';

    // ── Sidebar ──────────────────────────────────────────────
    var sb = document.createElement('div');
    sb.className = 'por-sidebar';

    var name = (_sess&&_sess.name)||'Nhan vien';
    var role = (_sess&&_sess.role)||'';
    var rc   = ROLE_COLOR[role]||'#64748b';
    var rl   = ROLE_LABEL[role]||role;
    var init = name.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();

    // Profile header — click → profile tab
    var hdr = document.createElement('div');
    hdr.className = 'por-sidebar-hdr';
    hdr.title = 'Xem trang ca nhan';
    hdr.innerHTML = '<div class="por-av" style="width:40px;height:40px;font-size:14px;background:linear-gradient(135deg,'+rc+','+rc+'88);">'+init+'</div>'
      + '<div>'
        + '<div style="font-size:12px;font-weight:800;color:var(--text);">'+_esc(name)+'</div>'
        + '<span style="font-size:9px;background:'+rc+'22;color:'+rc+';border:1px solid '+rc+'44;border-radius:4px;padding:1px 6px;font-weight:800;">'+_esc(rl)+'</span>'
      + '</div>';
    hdr.addEventListener('click', function(){ _switchTab('profile'); });
    sb.appendChild(hdr);

    // Nav tabs
    var nav = document.createElement('nav');
    nav.className = 'por-nav';
    TABS.forEach(function(t) {
      var btn = document.createElement('button');
      btn.className = 'por-nav-btn'+(t.id===_activeTab?' active':'');
      btn.setAttribute('data-tab', t.id);
      btn.innerHTML = '<span style="font-size:16px;">'+t.icon+'</span><span>'+t.label+'</span>';
      if (t.id==='chat') btn.innerHTML += '<span class="por-badge" id="por-chat-badge" style="display:none;">0</span>';
      btn.addEventListener('click', (function(id){ return function(){ _switchTab(id); }; })(t.id));
      nav.appendChild(btn);
    });
    sb.appendChild(nav);

    // Quick links
    var ql = document.createElement('div');
    ql.style.cssText = 'padding:10px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:2px;';
    var quickLinks = [
      ['nhan-su','HR Phan he'],['bang-luong','Bang luong'],['dev-log','DevLog'],
    ];
    quickLinks.forEach(function(lk) {
      var b = document.createElement('button');
      b.style.cssText = 'background:none;border:none;color:var(--text3);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;padding:5px 4px;text-align:left;border-radius:6px;';
      b.textContent = lk[1] + ' \u203a';
      b.addEventListener('click', function(){ if(window.skLoad) window.skLoad(lk[0]); });
      ql.appendChild(b);
    });
    sb.appendChild(ql);

    // Main area
    var main = document.createElement('div');
    main.className = 'por-main';
    var mainHdr = document.createElement('div');
    mainHdr.className = 'por-main-hdr';
    mainHdr.id = 'por-main-hdr';
    var mainBody = document.createElement('div');
    mainBody.className = 'por-body';
    mainBody.id = 'por-body';
    main.appendChild(mainHdr);
    main.appendChild(mainBody);

    wrap.appendChild(sb);
    wrap.appendChild(main);
    ct.appendChild(wrap);

    _switchTab(_activeTab);
    _startPoll();
  }

  function _switchTab(tab) {
    _activeTab = tab;
    document.querySelectorAll('.por-nav-btn').forEach(function(b){
      b.className = 'por-nav-btn'+(b.getAttribute('data-tab')===tab?' active':'');
    });
    var t = TABS.find(function(x){return x.id===tab;})||TABS[0];
    var hdr = document.getElementById('por-main-hdr');
    if (hdr) hdr.innerHTML = '<span style="font-size:18px;">'+t.icon+'</span><span style="font-size:14px;font-weight:900;color:var(--text);">'+t.label+'</span>';

    var body = document.getElementById('por-body');
    if (body) {
      body.style.padding = (tab==='chat') ? '0' : '16px 20px';
      body.style.overflow = 'auto';
    }

    if      (tab==='feed')    _renderFeed();
    else if (tab==='chat')    _renderChat();
    else if (tab==='dir')     _renderDirectory();
    else if (tab==='profile') _renderProfile();
    else if (tab==='notice')  _renderNotice();
  }

  // ── TAB 1: FEED ───────────────────────────────────────────────
  function _renderFeed() {
    var body = document.getElementById('por-body'); if (!body) return;
    var myRole = _sess&&_sess.role||'';
    var myEmail= (_sess&&_sess.email||'').toLowerCase();
    var myName = _sess&&_sess.name||'Ban';
    var init   = myName.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
    var rc     = ROLE_COLOR[myRole]||'#64748b';

    body.innerHTML = '';

    // Composer
    var comp = document.createElement('div');
    comp.className = 'por-composer';
    comp.innerHTML = '<div style="display:flex;gap:10px;align-items:flex-start;">'
      + '<div class="por-av" style="width:36px;height:36px;font-size:12px;flex-shrink:0;background:linear-gradient(135deg,'+rc+','+rc+'88);">'+init+'</div>'
      + '<div style="flex:1;">'
        + '<textarea id="por-compose-txt" rows="2" placeholder="Chia se voi dong nghiep... (Ctrl+Enter de gui)" '
          + 'style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:9px;padding:9px 11px;font-size:12px;font-family:inherit;resize:none;box-sizing:border-box;transition:border .15s;"></textarea>'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:7px;">'
          + '<div style="display:flex;gap:6px;">'
            + '<select id="por-post-type" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:7px;padding:4px 8px;font-size:11px;font-family:inherit;">'
              + '<option value="post">&#x1F4DD; Bai viet</option>'
              + '<option value="kudos">&#x1F3C6; Khen thuong</option>'
              + (['admin','manager'].indexOf(myRole)>-1?'<option value="announcement">&#x1F4E2; Thong bao</option>':'')
            + '</select>'
          + '</div>'
          + '<button id="por-post-btn" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 18px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">Dang</button>'
        + '</div>'
      + '</div>'
    + '</div>';
    body.appendChild(comp);

    // Bind composer
    var txt = comp.querySelector('#por-compose-txt');
    var btn = comp.querySelector('#por-post-btn');
    if (txt) txt.addEventListener('keydown', function(e){ if(e.key==='Enter'&&e.ctrlKey){e.preventDefault();_porSubmitPost();} });
    if (btn) btn.addEventListener('click', _porSubmitPost);

    // Feed container
    var feedEl = document.createElement('div');
    feedEl.id  = 'por-feed-list';
    feedEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div>';
    body.appendChild(feedEl);

    _loadFeedPosts();
  }

  function _porSubmitPost() {
    var apiF = _api(); if (!apiF) return;
    var txt  = document.getElementById('por-compose-txt');
    var type = (document.getElementById('por-post-type')||{}).value||'post';
    var content = txt?txt.value.trim():'';
    if (!content){ _toast('Nhap noi dung bai dang','error'); return; }
    var btn = document.getElementById('por-post-btn');
    if (btn){ btn.disabled=true; btn.textContent='Dang...'; }
    apiF('social_create_post',{content:content,type:type},function(e,d){
      if (btn){ btn.disabled=false; btn.textContent='Dang'; }
      if (!e&&d&&d.ok){
        _toast('Da dang bai viet!','ok');
        if(txt) txt.value='';
        _loadFeedPosts();
      } else _toast((d&&d.error)||'Loi','error');
    });
  }

  function _loadFeedPosts() {
    var el = document.getElementById('por-feed-list'); if (!el) return;
    var apiF = _api(); if (!apiF){ el.innerHTML='<p style="color:var(--red);">API chua san sang</p>'; return; }
    var myEmail = (_sess&&_sess.email||'').toLowerCase();
    var myRole  = _sess&&_sess.role||'';
    apiF('social_get_feed',{limit:12},function(e,d){
      var posts = (!e&&d&&d.ok)?d.data:[];
      if (!posts.length){
        el.innerHTML='<div style="text-align:center;padding:36px;color:var(--text3);">'
          +'<div style="font-size:32px;margin-bottom:8px;">&#x1F4AC;</div>'
          +'<div style="font-size:13px;font-weight:700;">Chua co bai dang nao</div>'
        +'</div>';
        return;
      }
      el.innerHTML = posts.map(function(p){ return _buildPostCard(p, myEmail, myRole); }).join('');
      // Bind action buttons
      el.querySelectorAll('[data-action]').forEach(function(btn){
        btn.addEventListener('click', function(){
          var action = btn.getAttribute('data-action');
          var pid    = btn.getAttribute('data-pid');
          if      (action==='like')   _porLike(pid);
          else if (action==='cmt')    _porToggleCmt(pid);
          else if (action==='edit')   _porEditPost(pid, btn.getAttribute('data-content'));
          else if (action==='delete') _porDeletePost(pid);
        });
      });
    });
  }

  function _buildPostCard(p, myEmail, myRole) {
    var cfg    = POST_TYPE_CONFIG[p.type] || POST_TYPE_CONFIG.post;
    var init   = (p.author_name||'?').split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
    var rc     = ROLE_COLOR[p.author_role]||'#64748b';
    var rl     = ROLE_LABEL[p.author_role]||p.author_role||'';
    var isOwn  = p.author_email && p.author_email.toLowerCase()===myEmail;
    var canMod = isOwn || myRole==='admin' || myRole==='manager';

    return '<div class="por-post-card por-anim" style="'+cfg.cardStyle+'">'
      // Header special (announcement/kudos)
      + (p.type!=='post' ? '<div style="'+cfg.headerBg+'display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
          + '<span style="font-size:20px;">'+cfg.icon+'</span>'
          + '<span style="font-size:12px;font-weight:800;color:'+cfg.badgeColor+';">'+cfg.label.toUpperCase()+'</span>'
          + (p.pinned?'<span style="background:rgba(239,68,68,.12);color:#ef4444;border-radius:4px;padding:1px 7px;font-size:9px;font-weight:800;margin-left:auto;">&#x1F4CC; Ghim</span>':'')
        + '</div>' : '')
      // Author row
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'
        + '<div class="por-av" style="width:38px;height:38px;font-size:13px;background:linear-gradient(135deg,'+rc+','+rc+'88);">'+init+'</div>'
        + '<div style="flex:1;">'
          + '<div style="font-size:13px;font-weight:800;color:var(--text);">'+_esc(p.author_name)+'</div>'
          + '<div style="display:flex;align-items:center;gap:5px;">'
            + (rl?'<span style="background:'+rc+'18;color:'+rc+';border-radius:4px;padding:1px 6px;font-size:9px;font-weight:800;">'+_esc(rl)+'</span>':'')
            + (p.type==='post'?'<span style="background:'+cfg.badgeBg+';color:'+cfg.badgeColor+';border-radius:4px;padding:1px 6px;font-size:9px;font-weight:800;">'+cfg.icon+' '+cfg.label+'</span>':'')
            + '<span style="font-size:10px;color:var(--text3);">'+_ago(p.created_at)+'</span>'
          + '</div>'
        + '</div>'
        // Edit/Delete buttons
        + (canMod?'<div style="display:flex;gap:2px;">'
            + (isOwn?'<button class="por-action-btn" data-action="edit" data-pid="'+p.id+'" data-content="'+_esc(p.content||'').replace(/"/g,'&quot;')+'">&#x270F;</button>':'')
            + '<button class="por-action-btn danger" data-action="delete" data-pid="'+p.id+'">&#x1F5D1;</button>'
          +'</div>':'')
      + '</div>'
      // Content
      + '<div style="font-size:13px;color:var(--text2);line-height:1.65;white-space:pre-wrap;margin-bottom:10px;" id="por-pcontent-'+p.id+'">'+_esc(p.content||'')+'</div>'
      // Edit area (hidden)
      + '<div id="por-pedit-'+p.id+'" style="display:none;margin-bottom:10px;">'
        + '<textarea class="por-edit-textarea" rows="3" id="por-pedit-txt-'+p.id+'" style="margin-bottom:6px;">'+_esc(p.content||'')+'</textarea>'
        + '<div style="display:flex;gap:6px;">'
          + '<button onclick="window._porSaveEdit(\''+p.id+'\')" style="background:var(--accent);border:none;color:#fff;border-radius:7px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Luu</button>'
          + '<button onclick="document.getElementById(\'por-pedit-'+p.id+'\').style.display=\'none\'" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:7px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Huy</button>'
        + '</div>'
      + '</div>'
      // Actions
      + '<div style="display:flex;align-items:center;gap:6px;border-top:1px solid var(--border);padding-top:9px;">'
        + '<button class="por-action-btn" data-action="like" data-pid="'+p.id+'" id="por-like-'+p.id+'">&#x2764; '+p.likes_count+'</button>'
        + '<button class="por-action-btn" data-action="cmt"  data-pid="'+p.id+'">&#x1F4AC; BL</button>'
      + '</div>'
      + '<div id="por-cmt-'+p.id+'" style="display:none;margin-top:8px;"></div>'
    + '</div>';
  }

  window._porLike = function(pid) {
    var apiF=_api(); if(!apiF) return;
    apiF('social_toggle_like',{post_id:pid},function(e,d){
      if (!e&&d&&d.ok) {
        var btn=document.querySelector('[data-action="like"][data-pid="'+pid+'"]');
        if (btn) btn.innerHTML='&#x2764; '+d.likes_count;
        if (btn) btn.style.color=d.liked?'#ef4444':'var(--text3)';
      }
    });
  };

  window._porToggleCmt = function(pid) {
    var el=document.getElementById('por-cmt-'+pid); if(!el) return;
    if (el.style.display==='none') { el.style.display='block'; _loadCmts(pid); }
    else el.style.display='none';
  };

  function _loadCmts(pid) {
    var el=document.getElementById('por-cmt-'+pid); if(!el) return;
    el.innerHTML='<div style="font-size:11px;color:var(--text3);">Dang tai...</div>';
    var apiF=_api(); if(!apiF) return;
    var myN=(_sess&&_sess.name||'').substring(0,2).toUpperCase();
    apiF('social_get_comments',{post_id:pid},function(e,d){
      var cmts=(!e&&d&&d.ok)?d.data:[];
      el.innerHTML=cmts.map(function(c){
        return '<div style="display:flex;gap:7px;padding:6px 0;border-bottom:1px solid var(--border);">'
          +'<div class="por-av" style="width:26px;height:26px;font-size:9px;background:var(--bg3);color:var(--text3);border-radius:7px;">'+c.author_name.substring(0,2).toUpperCase()+'</div>'
          +'<div><div style="font-size:11px;font-weight:700;color:var(--text);">'+_esc(c.author_name)
            +' <span style="font-weight:400;color:var(--text3);font-size:10px;">'+_ago(c.created_at)+'</span></div>'
            +'<div style="font-size:12px;color:var(--text2);">'+_esc(c.content)+'</div>'
          +'</div></div>';
      }).join('')
      +'<div style="display:flex;gap:6px;margin-top:7px;">'
        +'<input id="por-cin-'+pid+'" type="text" placeholder="Them binh luan..." '
          +'style="flex:1;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:6px 10px;font-size:12px;font-family:inherit;">'
        +'<button onclick="window._porCmt(\''+pid+'\')" '
          +'style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Gui</button>'
      +'</div>';
      var cinp=document.getElementById('por-cin-'+pid);
      if(cinp) cinp.addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();window._porCmt(pid);}});
    });
  }

  window._porCmt = function(pid) {
    var inp=document.getElementById('por-cin-'+pid); var txt=inp?inp.value.trim():'';
    if(!txt) return;
    var apiF=_api(); if(!apiF) return;
    apiF('social_add_comment',{post_id:pid,content:txt},function(e,d){
      if(!e&&d&&d.ok){if(inp)inp.value='';_loadCmts(pid);}
      else _toast((d&&d.error)||'Loi','error');
    });
  };

  window._porEditPost = function(pid, currentContent) {
    var editArea = document.getElementById('por-pedit-'+pid);
    var content  = document.getElementById('por-pcontent-'+pid);
    if (editArea) {
      editArea.style.display = 'block';
      if (content) content.style.display = 'none';
      var txt = document.getElementById('por-pedit-txt-'+pid);
      if (txt) { txt.value = currentContent || ''; txt.focus(); }
    }
  };

  window._porSaveEdit = function(pid) {
    var txt = document.getElementById('por-pedit-txt-'+pid);
    var newContent = txt ? txt.value.trim() : '';
    if (!newContent) { _toast('Noi dung khong duoc de trong','error'); return; }
    var apiF=_api(); if(!apiF) return;
    apiF('social_update_post',{id:pid,content:newContent},function(e,d){
      if(!e&&d&&d.ok){
        _toast('Da cap nhat bai viet','ok');
        var contentEl=document.getElementById('por-pcontent-'+pid);
        var editArea=document.getElementById('por-pedit-'+pid);
        if(contentEl){ contentEl.textContent=newContent; contentEl.style.display=''; }
        if(editArea)  editArea.style.display='none';
      } else _toast((d&&d.error)||'Loi','error');
    });
  };

  window._porDeletePost = function(pid) {
    if (!confirm('Xoa bai dang nay?')) return;
    var apiF=_api(); if(!apiF) return;
    apiF('social_delete_post',{id:pid},function(e,d){
      if(!e&&d&&d.ok){
        _toast('Da xoa bai viet','ok');
        var card=document.getElementById('por-card-'+pid);
        if(!card){ _loadFeedPosts(); return; }
        card.style.opacity='0'; card.style.transition='opacity .3s';
        setTimeout(function(){ if(card.parentNode) card.parentNode.removeChild(card); },300);
      } else _toast((d&&d.error)||'Khong co quyen','error');
    });
  };

  // ── TAB 2: CHAT ───────────────────────────────────────────────
  function _renderChat() {
    var body=document.getElementById('por-body'); if(!body) return;
    body.style.padding='0';
    body.innerHTML='<div class="por-msg-split" style="height:100%;">'
      +'<div class="por-thread-list" id="por-threads-list">'
        +'<div style="padding:9px 12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
          +'<span style="font-size:12px;font-weight:800;color:var(--text);">Tin nhan</span>'
          +'<button id="por-new-chat-btn" style="background:var(--accent);border:none;color:#fff;border-radius:7px;width:24px;height:24px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">+</button>'
        +'</div>'
        +'<div id="por-threads-inner"><div style="padding:16px;text-align:center;color:var(--text3);font-size:11px;">Dang tai...</div></div>'
      +'</div>'
      +'<div id="por-chat-win" class="por-chat-area">'
        +'<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text3);">'
          +'<div style="text-align:center;"><div style="font-size:28px;margin-bottom:8px;">&#x1F4AC;</div><div style="font-size:12px;">Chon cuoc tro chuyen</div></div>'
        +'</div>'
      +'</div>'
    +'</div>';
    document.getElementById('por-new-chat-btn').addEventListener('click', _porNewChat);
    _loadThreadList();
  }

  function _loadThreadList() {
    var apiF=_api(); if(!apiF) return;
    var el=document.getElementById('por-threads-inner'); if(!el) return;
    var email=(_sess&&_sess.email||'').toLowerCase();
    apiF('msg_get_threads',{},function(e,d){
      var threads=(!e&&d&&d.ok)?d.data:[];
      if(!threads.length){ el.innerHTML='<div style="padding:16px;text-align:center;color:var(--text3);font-size:11px;">Chua co tin nhan</div>'; return; }
      el.innerHTML='';
      threads.forEach(function(t){
        var others=t.participants.filter(function(p){return p!==email;});
        var name=t.title||(others[0]||'Chat');
        var init=name.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
        var isAct=_curThread&&_curThread.id===t.id;
        var div=document.createElement('div');
        div.className='por-thread-item'+(isAct?' active':'');
        div.innerHTML='<div style="position:relative;flex-shrink:0;">'
            +'<div class="por-av" style="width:36px;height:36px;font-size:12px;font-weight:800;background:linear-gradient(135deg,#4f6fff88,#06d6d688);">'+init+'</div>'
            +(t.unread>0?'<span style="position:absolute;top:-2px;right:-2px;background:#ef4444;color:#fff;font-size:8px;font-weight:800;min-width:14px;height:14px;border-radius:7px;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg2);">'+t.unread+'</span>':'')
          +'</div>'
          +'<div style="flex:1;min-width:0;">'
            +'<div style="font-size:12px;font-weight:700;color:var(--text);">'+_esc(name.substring(0,22))+'</div>'
            +'<div style="font-size:10px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc((t.last_msg||'').substring(0,30))+'</div>'
          +'</div>';
        div.addEventListener('click', (function(thread){ return function(){ _openThread(thread); }; })(t));
        el.appendChild(div);
      });
    });
  }

  function _openThread(thread) {
    _curThread=thread;
    _loadThreadList();
    var win=document.getElementById('por-chat-win'); if(!win) return;
    var email=(_sess&&_sess.email||'').toLowerCase();
    var others=thread.participants.filter(function(p){return p!==email;});
    var name=thread.title||(others[0]||'Chat');
    win.innerHTML='<div style="padding:10px 14px;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;align-items:center;gap:8px;flex-shrink:0;">'
        +'<div class="por-av" style="width:32px;height:32px;font-size:11px;font-weight:800;background:linear-gradient(135deg,#4f6fff,#06d6d6);">'+name.substring(0,2).toUpperCase()+'</div>'
        +'<span style="font-size:13px;font-weight:800;color:var(--text);">'+_esc(name)+'</span>'
      +'</div>'
      +'<div id="por-bubbles" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px;"></div>'
      +'<div style="padding:10px 12px;border-top:1px solid var(--border);background:var(--bg2);display:flex;gap:7px;flex-shrink:0;">'
        +'<input id="por-msg-inp" type="text" placeholder="Nhap tin nhan..." style="flex:1;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:9px;padding:8px 11px;font-size:12px;font-family:inherit;">'
        +'<button id="por-msg-send" style="background:var(--accent);border:none;color:#fff;border-radius:9px;padding:8px 14px;cursor:pointer;">&#x27A4;</button>'
      +'</div>';
    var inp=win.querySelector('#por-msg-inp');
    var sendBtn=win.querySelector('#por-msg-send');
    if(inp) inp.addEventListener('keydown',function(ev){if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();_porSendMsg();}});
    if(sendBtn) sendBtn.addEventListener('click',_porSendMsg);
    _loadMessages(thread.id,true);
  }

  function _loadMessages(tid,scroll) {
    var apiF=_api(); if(!apiF) return;
    var el=document.getElementById('por-bubbles'); if(!el) return;
    var email=(_sess&&_sess.email||'').toLowerCase();
    apiF('msg_get_messages',{thread_id:tid},function(e,d){
      var msgs=(!e&&d&&d.ok)?d.data:[];
      if(!msgs.length&&scroll){el.innerHTML='<div style="text-align:center;color:var(--text3);font-size:11px;margin:auto;">Bat dau tro chuyen!</div>';return;}
      el.innerHTML=msgs.map(function(m){
        var mine=m.is_mine;
        return '<div style="display:flex;justify-content:'+(mine?'flex-end':'flex-start')+';">'
          +'<div style="max-width:72%;'+(mine?'background:var(--accent);color:#fff;border-radius:14px 14px 4px 14px;':'background:var(--bg2);color:var(--text);border:1px solid var(--border);border-radius:14px 14px 14px 4px;')+'padding:8px 12px;font-size:12px;">'
            +'<div style="white-space:pre-wrap;word-break:break-word;">'+_esc(m.content)+'</div>'
            +'<div style="font-size:9px;opacity:.5;margin-top:2px;text-align:right;">'+_shortTime(m.created_at)+'</div>'
          +'</div>'
        +'</div>';
      }).join('');
      if(scroll||msgs.length) el.scrollTop=el.scrollHeight;
    });
  }

  function _porSendMsg() {
    if(!_curThread) return;
    var inp=document.getElementById('por-msg-inp'); var txt=inp?inp.value.trim():'';
    if(!txt) return;
    if(inp) inp.value='';
    var apiF=_api(); if(!apiF) return;
    apiF('msg_send',{thread_id:_curThread.id,content:txt},function(e,d){
      if(!e&&d&&d.ok) _loadMessages(_curThread.id,false);
      else _toast((d&&d.error)||'Loi','error');
    });
  }

  function _porNewChat() {
    var ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    ov.addEventListener('click',function(ev){if(ev.target===ov)ov.remove();});
    ov.innerHTML='<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:400px;padding:22px;">'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:14px;"><span style="font-size:14px;font-weight:900;">Tin nhan moi</span>'
        +'<button id="ov-close" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px;">x</button></div>'
      +'<label style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:4px;">Email nguoi nhan</label>'
      +'<input id="nc-email" type="email" placeholder="email@sonkhang.vn" style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:8px 10px;font-size:12px;font-family:inherit;box-sizing:border-box;margin-bottom:10px;">'
      +'<label style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:4px;">Tin nhan</label>'
      +'<textarea id="nc-msg" rows="3" placeholder="Xin chao..." style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:8px 10px;font-size:12px;font-family:inherit;resize:none;box-sizing:border-box;margin-bottom:14px;"></textarea>'
      +'<button id="nc-send" style="width:100%;background:var(--accent);border:none;color:#fff;border-radius:9px;padding:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Gui tin nhan</button>'
    +'</div>';
    ov.querySelector('#ov-close').addEventListener('click',function(){ov.remove();});
    ov.querySelector('#nc-send').addEventListener('click',function(){
      var btn=ov.querySelector('#nc-send');
      var to=(ov.querySelector('#nc-email')||{}).value||'';
      var msg=(ov.querySelector('#nc-msg')||{}).value||'';
      if(!to||!msg.trim()){_toast('Nhap du email va tin nhan','error');return;}
      btn.disabled=true;btn.textContent='Dang gui...';
      var apiF=_api();if(!apiF)return;
      apiF('msg_get_or_create_thread',{to_email:to.trim().toLowerCase()},function(e,d){
        if(e||!d||!d.ok){_toast((d&&d.error)||'Loi','error');btn.disabled=false;btn.textContent='Gui tin nhan';return;}
        apiF('msg_send',{thread_id:d.thread_id,content:msg.trim()},function(e2,d2){
          ov.remove();
          if(!e2&&d2&&d2.ok){_toast('Da gui tin nhan','ok');_renderChat();}
          else _toast((d2&&d2.error)||'Loi','error');
        });
      });
    });
    document.body.appendChild(ov);
    setTimeout(function(){var inp=ov.querySelector('#nc-email');if(inp)inp.focus();},50);
  }

  // ── TAB 3: DIRECTORY ──────────────────────────────────────────
  function _renderDirectory() {
    var body=document.getElementById('por-body'); if(!body) return;
    body.innerHTML='<div style="display:flex;gap:8px;margin-bottom:14px;">'
      +'<input id="por-dir-q" type="text" placeholder="Tim nhan vien theo ten, phong ban..." '
        +'style="flex:1;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:9px;padding:9px 12px;font-size:12px;font-family:inherit;">'
      +'<button id="por-dir-search-btn" style="background:var(--accent);border:none;color:#fff;border-radius:9px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
    +'</div>'
    +'<div id="por-dir-list"><div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div></div>';

    var inp=document.getElementById('por-dir-q');
    var btn=document.getElementById('por-dir-search-btn');
    if(inp) inp.addEventListener('keydown',function(ev){if(ev.key==='Enter')_porDirLoad(inp.value.trim());});
    if(btn) btn.addEventListener('click',function(){ var q=inp?inp.value.trim():''; _porDirLoad(q); });
    _porDirLoad('');
  }

  function _porDirLoad(q) {
    var el=document.getElementById('por-dir-list'); if(!el) return;
    el.innerHTML='<div style="text-align:center;padding:16px;color:var(--text3);">Dang tai...</div>';
    var apiF=_api(); if(!apiF) return;
    apiF('hrm_get_employees',{limit:60,search:q},function(e,d){
      var emps=(!e&&d&&d.ok)?d.data:[];
      if(!emps.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Khong tim thay nhan vien nao.</div>';return;}
      el.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
      emps.forEach(function(emp){
        var name=emp.ten_nv||emp.name||emp.email||'';
        var init=name.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
        var role=emp.chuc_vu||emp.position||'';
        var dept=emp.phong_ban||emp.department||'';
        var rc=ROLE_COLOR[emp.role||'']||'#64748b';
        var email=emp.email||'';

        var card=document.createElement('div');
        card.className='por-dir-card';
        card.innerHTML='<div class="por-av" style="width:40px;height:40px;font-size:14px;background:linear-gradient(135deg,'+rc+','+rc+'88);">'+init+'</div>'
          +'<div style="flex:1;min-width:0;">'
            +'<div style="font-size:13px;font-weight:800;color:var(--text);">'+_esc(name)+'</div>'
            +'<div style="font-size:10px;color:var(--text3);">'+_esc(role||(dept||''))+'</div>'
            +(emp.phone?'<div style="font-size:10px;color:var(--text3);">'+_esc(emp.phone)+'</div>':'')
          +'</div>'
          +'<div style="display:flex;flex-direction:column;gap:4px;">'
            +(email?'<button class="por-action-btn" data-email="'+_esc(email)+'" data-name="'+_esc(name)+'" title="Nhan tin" style="font-size:14px;padding:4px 6px;">&#x1F4AC;</button>':'')
          +'</div>';

        // Bind message button
        if (email) {
          var msgBtn = card.querySelector('[data-email]');
          if (msgBtn) {
            msgBtn.addEventListener('click', (function(toEmail, toName){ return function(){
              _switchTab('chat');
              setTimeout(function(){
                var apiF=_api(); if(!apiF) return;
                apiF('msg_get_or_create_thread',{to_email:toEmail},function(e,d){
                  if(!e&&d&&d.ok) {
                    _openThread({id:d.thread_id,participants:[(_sess&&_sess.email||'').toLowerCase(),toEmail],title:toName});
                  }
                });
              }, 200);
            }; })(email.toLowerCase(), name));
          }
        }
        el.querySelector('div').appendChild(card);
      });
    });
  }

  // ── TAB 4: PROFILE — sync với loadAccountSettings ─────────────
  function _renderProfile() {
    var body = document.getElementById('por-body'); if (!body) return;
    body.innerHTML = '<div id="por-profile-inner"></div>';

    // Inject temporary getContent override để render profile trong portal
    var origGet = window.getContent;
    window.getContent = function() { return document.getElementById('por-profile-inner'); };

    if (typeof window.loadAccountSettings === 'function') {
      window.loadAccountSettings();
    } else if (typeof window.loadProfile === 'function') {
      window.loadProfile();
    } else {
      // Fallback: render basic profile
      var s = _sess||{};
      var init=(s.name||'?').split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
      var rc=ROLE_COLOR[s.role||'']||'#64748b';
      body.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;overflow:hidden;">'
        +'<div style="height:80px;background:linear-gradient(135deg,#0a1628,#1a2a6c,#23074d);"></div>'
        +'<div style="padding:0 20px 20px;margin-top:-30px;">'
          +'<div class="por-av" style="width:58px;height:58px;font-size:20px;border:3px solid var(--bg2);background:linear-gradient(135deg,'+rc+','+rc+'88);margin-bottom:10px;">'+init+'</div>'
          +'<div style="font-size:18px;font-weight:900;color:var(--text);">'+_esc(s.name||s.email||'')+'</div>'
          +'<div style="font-size:10px;background:'+rc+'22;color:'+rc+';border-radius:5px;padding:1px 9px;font-weight:800;display:inline-block;margin:6px 0;">'+_esc(ROLE_LABEL[s.role||'']||s.role||'')+'</div>'
          +'<hr style="margin:14px 0;border-color:var(--border);">'
          +'<div style="font-size:12px;display:grid;gap:8px;">'
            +'<div style="display:flex;justify-content:space-between;"><span style="color:var(--text3);">Email</span><span style="color:var(--text);font-weight:700;">'+_esc(s.email||'—')+'</span></div>'
            +'<div style="display:flex;justify-content:space-between;"><span style="color:var(--text3);">Phong ban</span><span style="color:var(--text);font-weight:700;">'+_esc(s.department||'—')+'</span></div>'
          +'</div>'
        +'</div>'
      +'</div>';
    }

    // Restore getContent
    window.getContent = origGet;
  }

  // ── TAB 5: NOTICES ────────────────────────────────────────────
  function _renderNotice() {
    var body = document.getElementById('por-body'); if (!body) return;
    body.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai thong bao...</div>';
    var apiF=_api(); if(!apiF) return;
    // Load từ social feed (announcements) + notification center
    var loaded = 0;
    var announcements = [], notifications = [];

    function _render() {
      if (++loaded < 2) return;
      var all = [];
      announcements.forEach(function(p){
        all.push({ ts:p.created_at, type:'announcement', title:p.author_name, body:p.content, icon:'&#x1F4E2;', color:'#ef4444' });
      });
      notifications.forEach(function(n){
        all.push({ ts:n.created_at, type:n.type||'info', title:n.title, body:n.body, icon:'&#x1F514;', color:'#4f6fff' });
      });
      all.sort(function(a,b){ return String(b.ts).localeCompare(String(a.ts)); });
      if (!all.length) {
        body.innerHTML='<div style="text-align:center;padding:36px;color:var(--text3);">'
          +'<div style="font-size:28px;margin-bottom:8px;">&#x1F514;</div>'
          +'<div style="font-size:13px;font-weight:700;">Chua co thong bao moi</div>'
        +'</div>';
        return;
      }
      body.innerHTML = all.map(function(n){
        return '<div style="background:var(--bg2);border:1px solid rgba('+n.color.replace('#','').match(/.{2}/g).map(function(h){return parseInt(h,16);}).join(',')+', .2);border-left:3px solid '+n.color+';border-radius:14px;padding:14px;margin-bottom:10px;">'
          +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
            +'<span style="font-size:18px;">'+n.icon+'</span>'
            +'<div style="flex:1;"><div style="font-size:13px;font-weight:800;color:var(--text);">'+_esc(n.title)+'</div>'
              +'<div style="font-size:10px;color:var(--text3);">'+_ago(n.ts)+'</div></div>'
          +'</div>'
          +'<div style="font-size:12px;color:var(--text2);line-height:1.6;white-space:pre-wrap;">'+_esc(n.body||'')+'</div>'
        +'</div>';
      }).join('');
    }

    apiF('social_get_feed',{type:'announcement',limit:15},function(e,d){
      announcements=(!e&&d&&d.ok)?d.data:[];
      _render();
    });
    apiF('notif_get',{limit:10,unread_only:false},function(e,d){
      notifications=(!e&&d&&d.ok)?(d.data||[]):[];
      _render();
    });
  }

  // ── Polling 5s ───────────────────────────────────────────────
  function _startPoll() {
    clearInterval(_pollTimer);
    _pollTimer = setInterval(function() {
      if (!document.querySelector('.por-wrap')) { clearInterval(_pollTimer); return; }
      var apiF=_api(); if(!apiF) return;
      apiF('msg_unread_count',{},function(e,d){
        var n=(!e&&d&&d.ok)?d.total:0;
        var badge=document.getElementById('por-chat-badge');
        if(badge){ badge.style.display=n>0?'flex':'none'; badge.textContent=n; }
      });
      if (_activeTab==='chat'&&_curThread) _loadMessages(_curThread.id,false);
      if (_activeTab==='chat') _loadThreadList();
    },5000);
  }

  function _shortTime(iso){ if(!iso) return ''; var d=new Date(iso),now=new Date(); if(now.toDateString()===d.toDateString()) return d.toTimeString().substring(0,5); return d.getDate()+'/'+(d.getMonth()+1); }

  // ── Exports ───────────────────────────────────────────────────
  window.loadInternalPortal = loadInternalPortal;
  window.loadCongNoiBo      = loadInternalPortal;

}());
