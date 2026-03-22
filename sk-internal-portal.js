// [v5.29] 22/03/2026 — sk-internal-portal.js
// Cong Noi Bo — Unified Internal Portal
// Hop nhat: HRM Portal + Social + Messaging + Profile
// [DESIGN] Sidebar + main panel, dark premium
// ================================================================
(function () {
  'use strict';

  var _api   = function(){ return typeof window.api==='function'?window.api:null; };
  var _ct    = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
  var _esc   = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };
  var _fmtC  = function(n){ n=Number(n||0); if(n>=1e6) return (n/1e6).toFixed(1)+'tr'; if(n>=1e3) return (n/1e3).toFixed(0)+'k'; return n; };
  var _ago   = function(iso){ if(!iso) return ''; var d=(Date.now()-new Date(iso).getTime())/1000; if(d<60) return Math.round(d)+'g'; if(d<3600) return Math.round(d/60)+' phut'; if(d<86400) return Math.round(d/3600)+' gio'; return Math.round(d/86400)+' ngay'; };

  var _sess = null, _activeTab = 'feed', _pollTimer = null;
  var _curThread = null, _orders = [];

  var TABS = [
    { id:'feed',    icon:'&#x1F4F0;', label:'Feed'      },
    { id:'chat',    icon:'&#x1F4AC;', label:'Tin nhan'  },
    { id:'dir',     icon:'&#x1F465;', label:'Danh ba'   },
    { id:'profile', icon:'&#x1F464;', label:'Ca nhan'   },
    { id:'notice',  icon:'&#x1F4E2;', label:'Thong bao' },
  ];

  var ROLE_COLOR = { 'admin':'#ef4444','manager':'#f59e0b','sales':'#4f6fff','accountant':'#10b981','warehouse':'#06b6d4','hr':'#a855f7','driver':'#f97316' };
  var ROLE_LABEL = { 'admin':'Quan tri','manager':'Quan ly','sales':'Ban hang','accountant':'Ke toan','warehouse':'Kho','hr':'Nhan su','driver':'Tai xe' };

  function _getSession() {
    try { var r=localStorage.getItem('sk_session_data'); return r?JSON.parse(r):null; } catch(e){return null;}
  }

  // ── CSS ─────────────────────────────────────────────────────────
  function _injectCSS() {
    if (document.getElementById('sk-portal-css')) return;
    var s = document.createElement('style');
    s.id  = 'sk-portal-css';
    s.textContent = [
      '.por-wrap{display:grid;grid-template-columns:220px 1fr;height:calc(100vh - 100px);max-height:820px;margin:16px 24px;border:1px solid var(--border);border-radius:18px;overflow:hidden;}',
      '.por-sidebar{background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;}',
      '.por-sidebar-hdr{padding:16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;}',
      '.por-av{width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,#4f6fff,#06d6d6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:900;flex-shrink:0;}',
      '.por-nav{flex:1;padding:8px;}',
      '.por-nav-btn{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border:none;border-radius:10px;background:none;color:var(--text3);cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;transition:all .12s;text-align:left;}',
      '.por-nav-btn:hover{background:var(--bg3);color:var(--text);}',
      '.por-nav-btn.active{background:rgba(79,111,255,.12);color:var(--accent2);border:1px solid rgba(79,111,255,.2);}',
      '.por-nav-icon{font-size:16px;flex-shrink:0;}',
      '.por-badge{background:#ef4444;color:#fff;border-radius:99px;font-size:9px;font-weight:800;min-width:16px;height:16px;display:flex;align-items:center;justify-content:center;padding:0 3px;margin-left:auto;}',
      '.por-main{background:var(--bg);display:flex;flex-direction:column;overflow:hidden;}',
      '.por-main-hdr{padding:14px 20px;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;align-items:center;gap:10px;flex-shrink:0;}',
      '.por-body{flex:1;overflow-y:auto;padding:16px 20px;}',
      '.por-post-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:10px;}',
      '.por-composer{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:14px;}',
      '.por-msg-split{display:grid;grid-template-columns:260px 1fr;height:100%;overflow:hidden;}',
      '.por-thread-list{border-right:1px solid var(--border);overflow-y:auto;}',
      '.por-thread-item{display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .1s;}',
      '.por-thread-item:hover,.por-thread-item.active{background:rgba(79,111,255,.08);}',
      '.por-chat-area{display:flex;flex-direction:column;}',
      '.por-bubbles{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:7px;}',
      '.por-dir-card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:13px;display:flex;align-items:center;gap:12px;}',
      '@media(max-width:640px){.por-wrap{grid-template-columns:1fr;}.por-sidebar{display:none;}}',
    ].join('');
    document.head.appendChild(s);
  }

  // ── Main load ─────────────────────────────────────────────────
  function loadInternalPortal() {
    _injectCSS();
    _sess = _getSession();
    var ct = _ct(); if (!ct) return;
    ct.innerHTML = '';

    var wrap = document.createElement('div');
    wrap.className = 'por-wrap fade-in';

    // Sidebar
    var sidebar = document.createElement('div');
    sidebar.className = 'por-sidebar';

    var name = (_sess && _sess.name) || 'Nhan vien';
    var role = (_sess && _sess.role) || '';
    var rc   = ROLE_COLOR[role] || '#64748b';
    var rl   = ROLE_LABEL[role] || role;
    var init = name.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();

    var hdr = document.createElement('div');
    hdr.className = 'por-sidebar-hdr';
    hdr.innerHTML = '<div class="por-av" id="por-av">'+init+'</div>'
      + '<div><div style="font-size:12px;font-weight:800;color:var(--text);">'+_esc(name)+'</div>'
        + '<span style="font-size:9px;background:'+rc+'22;color:'+rc+';border:1px solid '+rc+'44;border-radius:4px;padding:1px 6px;font-weight:800;">'+_esc(rl)+'</span>'
      + '</div>';
    sidebar.appendChild(hdr);

    var nav = document.createElement('nav');
    nav.className = 'por-nav';
    TABS.forEach(function(t) {
      var btn = document.createElement('button');
      btn.className = 'por-nav-btn' + (t.id===_activeTab?' active':'');
      btn.setAttribute('data-tab', t.id);
      btn.innerHTML = '<span class="por-nav-icon">'+t.icon+'</span><span>'+t.label+'</span>';
      if (t.id==='chat') btn.innerHTML += '<span class="por-badge" id="por-chat-badge" style="display:none;">0</span>';
      btn.addEventListener('click', (function(id){ return function(){ _switchTab(id); }; })(t.id));
      nav.appendChild(btn);
    });
    sidebar.appendChild(nav);

    // Quick links at bottom
    var qlinks = document.createElement('div');
    qlinks.style.cssText = 'padding:10px 12px;border-top:1px solid var(--border);';
    qlinks.innerHTML = '<button onclick="window.skLoad&&window.skLoad(\'nhan-su\')" style="display:block;width:100%;background:none;border:none;color:var(--text3);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;padding:5px 4px;text-align:left;">HR Phan he &rsaquo;</button>'
      + '<button onclick="window.skLoad&&window.skLoad(\'dev-log\')" style="display:block;width:100%;background:none;border:none;color:var(--text3);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;padding:5px 4px;text-align:left;">DevLog &rsaquo;</button>';
    sidebar.appendChild(qlinks);

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
    wrap.appendChild(sidebar);
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
    if (hdr) hdr.innerHTML = '<span style="font-size:17px;">'+t.icon+'</span><span style="font-size:14px;font-weight:900;color:var(--text);">'+t.label+'</span>';

    if      (tab==='feed')    _renderFeed();
    else if (tab==='chat')    _renderChat();
    else if (tab==='dir')     _renderDirectory();
    else if (tab==='profile') _renderProfile();
    else if (tab==='notice')  _renderNotice();
  }

  // ── TAB 1: Social Feed ─────────────────────────────────────────
  function _renderFeed() {
    var body = document.getElementById('por-body'); if (!body) return;
    var myRole = _sess && _sess.role || '';
    var myName = (_sess && _sess.name || '?');
    var init   = myName.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();

    body.innerHTML = '<div id="por-feed-wrap">';
    // Composer
    body.innerHTML += '<div class="por-composer">'
      + '<div style="display:flex;gap:10px;align-items:flex-start;">'
        + '<div class="por-av" style="flex-shrink:0;font-size:12px;">'+init+'</div>'
        + '<div style="flex:1;">'
          + '<textarea id="por-compose-txt" placeholder="Chia se suy nghi cua ban..." rows="2" '
            + 'style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:9px;padding:9px 11px;font-size:12px;font-family:inherit;resize:none;box-sizing:border-box;"></textarea>'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:7px;">'
            + '<select id="por-post-type" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:7px;padding:4px 8px;font-size:11px;font-family:inherit;">'
              + '<option value="post">&#x1F4DD; Bai viet</option>'
              + '<option value="kudos">&#x1F3C6; Khen thuong</option>'
              + (['admin','manager'].indexOf(myRole)>-1 ? '<option value="announcement">&#x1F4E2; Thong bao</option>' : '')
            + '</select>'
            + '<button id="por-post-btn" onclick="window._porPost()" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 18px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">Dang</button>'
          + '</div>'
        + '</div>'
      + '</div>'
    + '</div>';

    body.innerHTML += '<div id="por-feed-list"><div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div></div></div>';
    _loadFeedPosts();
  }

  function _loadFeedPosts() {
    var apiF = _api(); if (!apiF) return;
    var el   = document.getElementById('por-feed-list'); if (!el) return;
    apiF('social_get_feed', { limit:10 }, function(e,d) {
      var posts = (!e&&d&&d.ok) ? (d.data||[]) : [];
      if (!posts.length) {
        el.innerHTML = '<div style="text-align:center;padding:36px;color:var(--text3);">'
          + '<div style="font-size:32px;margin-bottom:8px;">&#x1F4AC;</div>'
          + '<div style="font-size:13px;font-weight:700;">Chua co bai dang nao</div>'
        + '</div>';
        return;
      }
      el.innerHTML = posts.map(function(p) {
        var init = (p.author_name||'?').substring(0,2).toUpperCase();
        var rc   = ROLE_COLOR[p.author_role] || '#64748b';
        var tc   = p.type==='announcement'?'#ef4444':p.type==='kudos'?'#f59e0b':'#4f6fff';
        return '<div class="por-post-card">'
          + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'
            + '<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,'+rc+','+rc+'88);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:900;flex-shrink:0;">'+init+'</div>'
            + '<div style="flex:1;">'
              + '<div style="font-size:12px;font-weight:800;color:var(--text);">'+_esc(p.author_name)+'</div>'
              + '<div style="display:flex;gap:5px;align-items:center;">'
                + '<span style="font-size:9px;background:'+tc+'22;color:'+tc+';border-radius:4px;padding:1px 5px;font-weight:800;">'+(p.type==='announcement'?'Thong bao':p.type==='kudos'?'Khen thuong':'Bai viet')+'</span>'
                + '<span style="font-size:10px;color:var(--text3);">'+_ago(p.created_at)+'</span>'
              + '</div>'
            + '</div>'
          + '</div>'
          + '<div style="font-size:13px;color:var(--text2);line-height:1.6;white-space:pre-wrap;margin-bottom:10px;">'+_esc(p.content)+'</div>'
          + '<div style="display:flex;gap:10px;border-top:1px solid var(--border);padding-top:8px;">'
            + '<button onclick="window._porLike(\''+p.id+'\')" style="display:flex;align-items:center;gap:4px;background:none;border:none;color:var(--text3);cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;padding:3px 7px;border-radius:6px;">&#x2764; <span id="plc-'+p.id+'">'+p.likes_count+'</span></button>'
            + '<button onclick="window._porToggleCmt(\''+p.id+'\')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;padding:3px 7px;border-radius:6px;">&#x1F4AC; BL</button>'
          + '</div>'
          + '<div id="pcmt-'+p.id+'" style="display:none;margin-top:8px;"></div>'
        + '</div>';
      }).join('');
    });
  }

  window._porPost = function() {
    var apiF = _api(); if (!apiF) return;
    var txt  = (document.getElementById('por-compose-txt')||{}).value||'';
    var type = (document.getElementById('por-post-type')||{}).value||'post';
    if (!txt.trim()) { _toast('Nhap noi dung','error'); return; }
    var btn = document.getElementById('por-post-btn');
    if (btn) { btn.disabled=true; btn.textContent='Dang...'; }
    apiF('social_create_post',{content:txt,type:type},function(e,d){
      if (btn) { btn.disabled=false; btn.textContent='Dang'; }
      if (!e&&d&&d.ok) {
        _toast('Da dang bai','ok');
        var t=document.getElementById('por-compose-txt'); if(t) t.value='';
        _loadFeedPosts();
      } else _toast((d&&d.error)||'Loi','error');
    });
  };

  window._porLike = function(id) {
    var apiF=_api(); if(!apiF) return;
    apiF('social_toggle_like',{post_id:id},function(e,d){
      if (!e&&d&&d.ok) {
        var c=document.getElementById('plc-'+id); if(c) c.textContent=d.likes_count;
      }
    });
  };

  window._porToggleCmt = function(id) {
    var el=document.getElementById('pcmt-'+id); if(!el) return;
    if (el.style.display==='none') {
      el.style.display='block';
      el.innerHTML = '<div style="font-size:11px;color:var(--text3);">Dang tai...</div>';
      var apiF=_api(); if(!apiF) return;
      apiF('social_get_comments',{post_id:id},function(e,d){
        var cmts=(!e&&d&&d.ok)?d.data:[];
        el.innerHTML = cmts.map(function(c){
          return '<div style="display:flex;gap:7px;padding:5px 0;border-bottom:1px solid var(--border);">'
            +'<div style="width:24px;height:24px;border-radius:6px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;flex-shrink:0;">'+c.author_name.substring(0,2).toUpperCase()+'</div>'
            +'<div><div style="font-size:11px;font-weight:700;color:var(--text);">'+_esc(c.author_name)+'</div>'
              +'<div style="font-size:11px;color:var(--text2);">'+_esc(c.content)+'</div></div>'
          +'</div>';
        }).join('')
        + '<div style="display:flex;gap:6px;margin-top:7px;">'
          + '<input id="cin-'+id+'" type="text" placeholder="Binh luan..." style="flex:1;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:7px;padding:6px 9px;font-size:11px;font-family:inherit;">'
          + '<button onclick="window._porCmt(\''+id+'\')" style="background:var(--accent);border:none;color:#fff;border-radius:7px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Gui</button>'
        + '</div>';
      });
    } else { el.style.display='none'; }
  };

  window._porCmt = function(postId) {
    var inp=document.getElementById('cin-'+postId); var txt=inp?inp.value.trim():'';
    if (!txt) return;
    var apiF=_api(); if(!apiF) return;
    apiF('social_add_comment',{post_id:postId,content:txt},function(e,d){
      if (!e&&d&&d.ok) { if(inp) inp.value=''; window._porToggleCmt(postId); setTimeout(function(){window._porToggleCmt(postId);},50); }
    });
  };

  // ── TAB 2: Messaging ────────────────────────────────────────────
  function _renderChat() {
    var body = document.getElementById('por-body'); if (!body) return;
    body.style.padding = '0';
    body.innerHTML = '<div class="por-msg-split" style="height:100%;">'
      + '<div class="por-thread-list" id="por-threads-list">'
        + '<div style="padding:10px 12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">'
          + '<span style="font-size:12px;font-weight:800;color:var(--text);">Cuoc tro chuyen</span>'
          + '<button onclick="window._porNewChat()" style="background:var(--accent);border:none;color:#fff;border-radius:7px;width:24px;height:24px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">+</button>'
        + '</div>'
        + '<div id="por-threads-inner"><div style="padding:16px;text-align:center;color:var(--text3);font-size:11px;">Dang tai...</div></div>'
      + '</div>'
      + '<div id="por-chat-win" style="display:flex;flex-direction:column;">'
        + '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text3);">'
          + '<div style="text-align:center;"><div style="font-size:28px;margin-bottom:8px;">&#x1F4AC;</div><div style="font-size:12px;">Chon cuoc tro chuyen</div></div>'
        + '</div>'
      + '</div>'
    + '</div>';
    _loadThreadList();
  }

  function _loadThreadList() {
    var apiF=_api(); if(!apiF) return;
    var el=document.getElementById('por-threads-inner'); if(!el) return;
    var email=(_sess&&_sess.email||'').toLowerCase();
    apiF('msg_get_threads',{},function(e,d){
      var threads=(!e&&d&&d.ok)?d.data:[];
      if (!threads.length) { el.innerHTML='<div style="padding:16px;text-align:center;color:var(--text3);font-size:11px;">Chua co tin nhan.<br>Nhan + de bat dau!</div>'; return; }
      el.innerHTML=threads.map(function(t){
        var others=t.participants.filter(function(p){return p!==email;});
        var name=t.title||(others[0]||'Chat');
        var init=name.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
        var isAct=_curThread&&_curThread.id===t.id;
        return '<div class="por-thread-item'+(isAct?' active':'')+'" onclick="window._porOpenThread('+JSON.stringify(t)+')">'
          +'<div style="position:relative;flex-shrink:0;">'
            +'<div style="width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#4f6fff88,#06d6d688);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800;">'+init+'</div>'
            +(t.unread>0?'<span style="position:absolute;top:-2px;right:-2px;background:#ef4444;color:#fff;font-size:8px;font-weight:800;min-width:14px;height:14px;border-radius:7px;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg2);">'+t.unread+'</span>':'')
          +'</div>'
          +'<div style="flex:1;min-width:0;">'
            +'<div style="font-size:12px;font-weight:700;color:var(--text);">'+_esc(name.substring(0,20))+'</div>'
            +'<div style="font-size:10px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+_esc((t.last_msg||'').substring(0,30))+'</div>'
          +'</div>'
        +'</div>';
      }).join('');
    });
  }

  window._porOpenThread = function(thread) {
    _curThread = thread;
    _loadThreadList();
    var win = document.getElementById('por-chat-win'); if (!win) return;
    var email=(_sess&&_sess.email||'').toLowerCase();
    var others=thread.participants.filter(function(p){return p!==email;});
    var name=thread.title||(others[0]||'Chat');
    win.innerHTML = '<div style="padding:10px 14px;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;align-items:center;gap:8px;flex-shrink:0;">'
        +'<div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#4f6fff,#06d6d6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;">'+name.substring(0,2).toUpperCase()+'</div>'
        +'<span style="font-size:13px;font-weight:800;color:var(--text);">'+_esc(name)+'</span>'
      +'</div>'
      +'<div id="por-bubbles" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px;"></div>'
      +'<div style="padding:10px 12px;border-top:1px solid var(--border);background:var(--bg2);display:flex;gap:7px;flex-shrink:0;">'
        +'<input id="por-msg-inp" type="text" placeholder="Nhap tin nhan..." style="flex:1;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:9px;padding:8px 11px;font-size:12px;font-family:inherit;">'
        +'<button onclick="window._porSendMsg()" style="background:var(--accent);border:none;color:#fff;border-radius:9px;padding:8px 14px;cursor:pointer;">&#x27A4;</button>'
      +'</div>';
    var inp=win.querySelector('#por-msg-inp');
    if (inp) inp.addEventListener('keydown',function(ev){if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();window._porSendMsg();}});
    _loadMessages(thread.id,true);
  };

  function _loadMessages(threadId, scroll) {
    var apiF=_api(); if(!apiF) return;
    var el=document.getElementById('por-bubbles'); if(!el) return;
    var email=(_sess&&_sess.email||'').toLowerCase();
    apiF('msg_get_messages',{thread_id:threadId},function(e,d){
      var msgs=(!e&&d&&d.ok)?d.data:[];
      if (!msgs.length&&scroll) { el.innerHTML='<div style="text-align:center;color:var(--text3);font-size:11px;margin:auto;">Chua co tin nhan. Bat dau tro chuyen!</div>'; return; }
      el.innerHTML=msgs.map(function(m){
        var mine=m.is_mine;
        return '<div style="display:flex;justify-content:'+(mine?'flex-end':'flex-start')+';">'
          +'<div style="max-width:72%;'+(mine?'background:var(--accent);color:#fff;border-radius:14px 14px 4px 14px;':'background:var(--bg2);color:var(--text);border:1px solid var(--border);border-radius:14px 14px 14px 4px;')+'padding:8px 12px;font-size:12px;">'
            +'<div style="white-space:pre-wrap;word-break:break-word;">'+_esc(m.content)+'</div>'
            +'<div style="font-size:9px;opacity:.55;margin-top:2px;text-align:right;">'+_shortTime(m.created_at)+'</div>'
          +'</div>'
        +'</div>';
      }).join('');
      if (scroll||msgs.length) el.scrollTop=el.scrollHeight;
    });
  }

  window._porSendMsg = function() {
    if (!_curThread) return;
    var inp=document.getElementById('por-msg-inp'); var txt=inp?inp.value.trim():'';
    if (!txt) return;
    if (inp) inp.value='';
    var apiF=_api(); if(!apiF) return;
    apiF('msg_send',{thread_id:_curThread.id,content:txt},function(e,d){
      if (!e&&d&&d.ok) _loadMessages(_curThread.id,false);
      else _toast((d&&d.error)||'Loi','error');
    });
  };

  window._porNewChat = function() {
    var ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    ov.addEventListener('click',function(ev){if(ev.target===ov)ov.remove();});
    ov.innerHTML='<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:400px;padding:22px;">'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:14px;"><span style="font-size:14px;font-weight:900;">Tin nhan moi</span>'
        +'<button onclick="this.closest(\'[style*=fixed]\').remove()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px;">x</button></div>'
      +'<label style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:4px;">Email nguoi nhan</label>'
      +'<input id="nc-email" type="email" placeholder="email@company.com" style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:8px 10px;font-size:12px;font-family:inherit;box-sizing:border-box;margin-bottom:10px;">'
      +'<label style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:4px;">Tin nhan</label>'
      +'<textarea id="nc-msg" rows="3" placeholder="Xin chao..." style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:8px 10px;font-size:12px;font-family:inherit;resize:none;box-sizing:border-box;margin-bottom:14px;"></textarea>'
      +'<button id="nc-send" style="width:100%;background:var(--accent);border:none;color:#fff;border-radius:9px;padding:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Gui tin nhan</button>'
    +'</div>';
    var btn=ov.querySelector('#nc-send');
    btn.addEventListener('click',function(){
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
  };

  // ── TAB 3: Directory ──────────────────────────────────────────
  function _renderDirectory() {
    var body=document.getElementById('por-body');if(!body)return;
    body.innerHTML='<div style="margin-bottom:14px;display:flex;gap:8px;">'
      +'<input id="por-dir-q" type="text" placeholder="Tim nhan vien theo ten, phong ban..." style="flex:1;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:9px;padding:9px 12px;font-size:12px;font-family:inherit;">'
      +'<button onclick="window._porDirSearch()" style="background:var(--accent);border:none;color:#fff;border-radius:9px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
    +'</div>'
    +'<div id="por-dir-list"><div style="text-align:center;padding:20px;color:var(--text3);">Dang tai...</div></div>';
    var inp=document.getElementById('por-dir-q');
    if(inp) inp.addEventListener('keydown',function(ev){if(ev.key==='Enter') window._porDirSearch();});
    _porDirLoad('');
  }

  function _porDirLoad(q) {
    var apiF=_api();if(!apiF)return;
    var el=document.getElementById('por-dir-list');if(!el)return;
    apiF('hrm_get_employees',{limit:50,search:q},function(e,d){
      var emps=(!e&&d&&d.ok)?d.data:[];
      if(!emps.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--text3);">Khong tim thay nhan vien nao.</div>';return;}
      el.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
        +emps.map(function(emp){
          var name=emp.ten_nv||emp.name||emp.email||'';
          var init=name.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
          var role=emp.chuc_vu||emp.position||'';
          var dept=emp.phong_ban||emp.department||'';
          var rc=ROLE_COLOR[emp.role||'']||'#64748b';
          return '<div class="por-dir-card">'
            +'<div style="width:42px;height:42px;border-radius:11px;background:linear-gradient(135deg,'+rc+','+rc+'88);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:900;flex-shrink:0;">'+init+'</div>'
            +'<div><div style="font-size:13px;font-weight:800;color:var(--text);">'+_esc(name)+'</div>'
              +'<div style="font-size:11px;color:var(--text3);">'+_esc(role||(dept||''))+'</div>'
              +(emp.phone?'<div style="font-size:10px;color:var(--text3);">'+_esc(emp.phone)+'</div>':'')
            +'</div>'
          +'</div>';
        }).join('')
      +'</div>';
    });
  }

  window._porDirSearch = function() {
    var q=(document.getElementById('por-dir-q')||{}).value||'';
    _porDirLoad(q.trim());
  };

  // ── TAB 4: Profile ────────────────────────────────────────────
  function _renderProfile() {
    if (typeof window.loadProfile === 'function') {
      // Redirect sang ca-nhan module
      var body=document.getElementById('por-body');if(!body)return;
      body.innerHTML='<div id="sk-ct"></div>';
      var oldCt=typeof window.getContent==='function'?window.getContent():null;
      // Override getContent temporarily
      var origGC=window.getContent;
      window.getContent=function(){return document.getElementById('sk-ct');};
      window.loadProfile();
      window.getContent=origGC;
    } else {
      var body=document.getElementById('por-body');if(!body)return;
      var s=_sess||{};
      var init=(s.name||'?').split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
      var rc=ROLE_COLOR[s.role||'']||'#64748b';
      var rl=ROLE_LABEL[s.role||'']||s.role||'';
      body.innerHTML='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;overflow:hidden;">'
        +'<div style="height:80px;background:linear-gradient(135deg,#0a1628,#1a2a6c,#23074d);"></div>'
        +'<div style="padding:0 20px 20px;margin-top:-30px;">'
          +'<div style="width:60px;height:60px;border-radius:14px;border:3px solid var(--bg2);background:linear-gradient(135deg,'+rc+','+rc+'88);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:900;margin-bottom:10px;">'+init+'</div>'
          +'<div style="font-size:18px;font-weight:900;color:var(--text);">'+_esc(s.name||s.email||'')+'</div>'
          +'<span style="font-size:10px;background:'+rc+'22;color:'+rc+';border:1px solid '+rc+'44;border-radius:6px;padding:2px 9px;font-weight:800;">'+_esc(rl)+'</span>'
          +'<hr style="margin:16px 0;border-color:var(--border);">'
          +'<div style="display:grid;gap:8px;font-size:12px;">'
            +'<div style="display:flex;justify-content:space-between;"><span style="color:var(--text3);">Email</span><span style="color:var(--text);font-weight:700;">'+_esc(s.email||'—')+'</span></div>'
            +'<div style="display:flex;justify-content:space-between;"><span style="color:var(--text3);">Phong ban</span><span style="color:var(--text);font-weight:700;">'+_esc(s.department||'—')+'</span></div>'
          +'</div>'
          +'<button onclick="window.skLoad&&window.skLoad(\'ca-nhan\')" style="margin-top:14px;background:var(--accent);border:none;color:#fff;border-radius:9px;padding:9px 20px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">Xem trang ca nhan day du</button>'
        +'</div>'
      +'</div>';
    }
  }

  // ── TAB 5: Notices ────────────────────────────────────────────
  function _renderNotice() {
    var body=document.getElementById('por-body');if(!body)return;
    body.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3);">Dang tai thong bao...</div>';
    var apiF=_api();if(!apiF){body.innerHTML='<p style="color:var(--red);padding:16px;">API chua san sang</p>';return;}
    // Load announcements from social feed
    apiF('social_get_feed',{type:'announcement',limit:20},function(e,d){
      var posts=(!e&&d&&d.ok)?d.data:[];
      if(!posts.length){
        body.innerHTML='<div style="text-align:center;padding:36px;color:var(--text3);">'
          +'<div style="font-size:28px;margin-bottom:8px;">&#x1F4E2;</div>'
          +'<div style="font-size:13px;font-weight:700;">Chua co thong bao moi</div>'
        +'</div>';
        return;
      }
      body.innerHTML=posts.map(function(p){
        return '<div class="por-post-card" style="border-left:3px solid #ef4444;">'
          +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
            +'<span style="font-size:16px;">&#x1F4E2;</span>'
            +'<div><div style="font-size:13px;font-weight:800;color:var(--text);">'+_esc(p.author_name)+'</div>'
              +'<div style="font-size:10px;color:var(--text3);">'+_ago(p.created_at)+' truoc</div></div>'
          +'</div>'
          +'<div style="font-size:13px;color:var(--text2);line-height:1.6;white-space:pre-wrap;">'+_esc(p.content)+'</div>'
        +'</div>';
      }).join('');
    });
  }

  // ── Polling 5s ───────────────────────────────────────────────
  function _startPoll() {
    clearInterval(_pollTimer);
    _pollTimer = setInterval(function() {
      if (!document.querySelector('.por-wrap')) { clearInterval(_pollTimer); return; }
      // Check unread count
      var apiF=_api(); if(!apiF) return;
      apiF('msg_unread_count',{},function(e,d){
        var n=(!e&&d&&d.ok)?d.total:0;
        var badge=document.getElementById('por-chat-badge');
        if (badge) { badge.style.display=n>0?'flex':'none'; badge.textContent=n; }
      });
      // Refresh active tab data
      if (_activeTab==='chat' && _curThread) _loadMessages(_curThread.id,false);
      if (_activeTab==='chat') _loadThreadList();
    }, 5000);
  }

  function _shortTime(iso) {
    if (!iso) return '';
    var d=new Date(iso), now=new Date();
    if (now.toDateString()===d.toDateString()) return d.toTimeString().substring(0,5);
    return d.getDate()+'/'+(d.getMonth()+1);
  }

  // ── Exports ──────────────────────────────────────────────────
  window.loadInternalPortal = loadInternalPortal;
  window.loadCongNoiBo      = loadInternalPortal;
  // Redirect các module cũ về portal mới
  window.loadPortalLegacy   = loadInternalPortal;

}());
