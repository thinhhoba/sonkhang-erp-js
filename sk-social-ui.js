// [v5.29.1] 22/03/2026 — sk-social-ui.js
// Mang Xa Hoi Noi Bo v2.0 — Upgraded Social Network
// Tinh nang: Feed, Post, Like/React, Comment, Search, Real-time, @Mention
// [DESIGN] Premium dark, card-based, animated interactions
// ================================================================
(function () {
  'use strict';

  var _api   = function(){ return typeof window.api==='function'?window.api:null; };
  var _ct    = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
  var _esc   = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };
  var _ago   = function(iso){
    if (!iso) return '';
    var diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)    return Math.round(diff) + 'g';
    if (diff < 3600)  return Math.round(diff/60) + ' phut truoc';
    if (diff < 86400) return Math.round(diff/3600) + ' gio truoc';
    if (diff < 86400*7) return Math.round(diff/86400) + ' ngay truoc';
    var d = new Date(iso);
    return d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear();
  };

  // ── State ────────────────────────────────────────────────────
  var _page = 1, _loading = false, _allLoaded = false;
  var _curFilter = null, _searchQ = '';
  var _myEmail = '', _myName = '', _myRole = '';
  var _pollTimer = null, _postCache = {};

  // ── Constants ─────────────────────────────────────────────────
  var ROLE_COLOR = {
    admin:'#ef4444',manager:'#f59e0b',sales:'#4f6fff',
    accountant:'#10b981',warehouse:'#06b6d4',hr:'#a855f7',driver:'#f97316',
  };
  var ROLE_LABEL = {
    admin:'Quan tri',manager:'Quan ly',sales:'Ban hang',
    accountant:'Ke toan',warehouse:'Kho',hr:'Nhan su',driver:'Tai xe',
  };
  var POST_TYPE = {
    post:         { label:'Bai viet',    icon:'&#x1F4DD;', color:'#4f6fff' },
    announcement: { label:'Thong bao',   icon:'&#x1F4E2;', color:'#ef4444' },
    kudos:        { label:'Khen thuong', icon:'&#x1F3C6;', color:'#f59e0b' },
  };
  var REACTIONS = [
    { key:'like',  icon:'&#x2764;',  label:'Thich'   },
    { key:'haha',  icon:'&#x1F606;', label:'Ha ha'   },
    { key:'wow',   icon:'&#x1F62E;', label:'Wow'     },
    { key:'clap',  icon:'&#x1F44F;', label:'Hay qua' },
  ];

  function _getSess() {
    try { var r=localStorage.getItem('sk_session_data'); return r?JSON.parse(r):null; } catch(e){return null;}
  }

  // ── CSS ───────────────────────────────────────────────────────
  function _injectCSS() {
    if (document.getElementById('sk-soc-css')) return;
    var s = document.createElement('style');
    s.id = 'sk-soc-css';
    s.textContent = [
      '.soc-wrap{max-width:700px;margin:0 auto;padding:20px 24px;}',
      '.soc-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:18px;}',
      '.soc-filter-bar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;align-items:center;}',
      '.soc-filter-btn{border-radius:8px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .12s;border:1px solid var(--border2);background:var(--bg3);color:var(--text3);}',
      '.soc-filter-btn.active{background:var(--accent);border-color:var(--accent);color:#fff;}',
      '.soc-search-bar{display:flex;gap:6px;margin-bottom:16px;}',
      '.soc-composer{background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:16px;}',
      '.soc-composer-av{width:38px;height:38px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:900;}',
      '.soc-composer-txt{width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:10px;padding:10px 12px;font-size:13px;font-family:inherit;resize:none;box-sizing:border-box;transition:border .15s;}',
      '.soc-composer-txt:focus{outline:none;border-color:rgba(79,111,255,.5);}',
      '.soc-post-card{background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:12px;transition:border .15s;}',
      '.soc-post-card:hover{border-color:var(--border2);}',
      '.soc-avatar{border-radius:11px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;flex-shrink:0;}',
      '.soc-action-btn{display:flex;align-items:center;gap:5px;background:none;border:none;color:var(--text3);cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;padding:5px 10px;border-radius:8px;transition:all .12s;}',
      '.soc-action-btn:hover{background:var(--bg3);color:var(--text);}',
      '.soc-action-btn.liked{color:#ef4444;}',
      '.soc-react-bar{display:flex;align-items:center;gap:6px;border-top:1px solid var(--border);padding-top:10px;margin-top:10px;flex-wrap:wrap;}',
      '.soc-cmt-section{margin-top:12px;border-top:1px solid var(--border);padding-top:10px;}',
      '.soc-cmt-item{display:flex;gap:8px;padding:6px 0;}',
      '.soc-cmt-bubble{background:var(--bg3);border-radius:10px;padding:8px 11px;flex:1;}',
      '.soc-cmt-name{font-size:11px;font-weight:800;color:var(--text);margin-bottom:2px;}',
      '.soc-cmt-text{font-size:12px;color:var(--text2);}',
      '.soc-cmt-input-row{display:flex;gap:6px;margin-top:8px;}',
      '.soc-empty{text-align:center;padding:48px 16px;color:var(--text3);}',
      '.soc-empty-icon{font-size:40px;margin-bottom:12px;}',
      '.soc-loadmore{text-align:center;padding:16px;}',
      '.soc-pin-badge{background:rgba(239,68,68,.12);color:#ef4444;border:1px solid rgba(239,68,68,.2);border-radius:5px;padding:1px 7px;font-size:9px;font-weight:800;}',
      '.soc-type-badge{border-radius:5px;padding:1px 7px;font-size:9px;font-weight:800;}',
      '.soc-mention{color:var(--accent2);font-weight:700;cursor:pointer;}',
      '.soc-mention:hover{text-decoration:underline;}',
      '.soc-poll-bar{display:flex;align-items:center;gap:6px;margin-bottom:6px;}',
      '.soc-poll-fill{height:6px;border-radius:99px;transition:width .4s;}',
      '.soc-react-popup{position:absolute;bottom:calc(100% + 4px);left:0;background:var(--bg2);border:1px solid var(--border2);border-radius:12px;padding:6px;display:flex;gap:4px;box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:100;white-space:nowrap;}',
      '.soc-react-item{font-size:20px;cursor:pointer;padding:4px 6px;border-radius:8px;transition:transform .1s;}',
      '.soc-react-item:hover{transform:scale(1.25);background:var(--bg3);}',
    ].join('');
    document.head.appendChild(s);
  }

  // ── Main loader ───────────────────────────────────────────────
  function loadSocial() {
    _injectCSS();
    var ct = _ct(); if (!ct) return;
    var sess = _getSess();
    _myEmail = (sess && sess.email ? sess.email.toLowerCase() : '');
    _myName  = (sess && sess.name  ? sess.name  : 'Ban');
    _myRole  = (sess && sess.role  ? sess.role  : '');
    _page = 1; _allLoaded = false; _postCache = {};

    var rc   = ROLE_COLOR[_myRole] || '#4f6fff';
    var init = _myName.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();

    ct.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'soc-wrap fade-in';

    // ── Header ────────────────────────────────────────────────
    wrap.innerHTML = '<div class="soc-header">'
      + '<div>'
        + '<h1 style="font-size:20px;font-weight:900;margin:0;">&#x1F465; Mang Xa Hoi Noi Bo</h1>'
        + '<p style="font-size:11px;color:var(--text3);margin:3px 0 0;">Chia se · Tuong tac · Ket noi dong nghiep</p>'
      + '</div>'
      + '<div style="display:flex;gap:6px;">'
        + '<button onclick="window._socRefresh()" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:9px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x21BA; Lam moi</button>'
      + '</div>'
    + '</div>'

    // ── Search ────────────────────────────────────────────────
    + '<div class="soc-search-bar">'
      + '<input id="soc-search-inp" type="text" placeholder="Tim kiem bai dang, tac gia..." '
        + 'style="flex:1;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:10px;padding:9px 12px;font-size:12px;font-family:inherit;">'
      + '<button onclick="window._socSearch()" style="background:var(--accent);border:none;color:#fff;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
    + '</div>'

    // ── Filter bar ────────────────────────────────────────────
    + '<div class="soc-filter-bar" id="soc-filters">'
      + '<button class="soc-filter-btn active" data-f="" onclick="window._socFilter(\'\')">&#x1F4F0; Tat ca</button>'
      + '<button class="soc-filter-btn" data-f="post" onclick="window._socFilter(\'post\')">&#x1F4DD; Bai viet</button>'
      + '<button class="soc-filter-btn" data-f="announcement" onclick="window._socFilter(\'announcement\')">&#x1F4E2; Thong bao</button>'
      + '<button class="soc-filter-btn" data-f="kudos" onclick="window._socFilter(\'kudos\')">&#x1F3C6; Khen thuong</button>'
    + '</div>'

    // ── Composer ──────────────────────────────────────────────
    + '<div class="soc-composer">'
      + '<div style="display:flex;gap:10px;">'
        + '<div class="soc-composer-av" id="soc-my-av" style="width:38px;height:38px;background:linear-gradient(135deg,'+rc+','+rc+'88);">'+init+'</div>'
        + '<div style="flex:1;">'
          + '<textarea id="soc-compose-txt" class="soc-composer-txt" rows="2" '
            + 'placeholder="Chia se dieu gi do voi dong nghiep... (dung @ de nhac ten)"></textarea>'
          + '<div id="soc-mention-list" style="display:none;"></div>'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">'
            + '<div style="display:flex;gap:6px;align-items:center;">'
              + '<select id="soc-post-type" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:5px 8px;font-size:11px;font-family:inherit;">'
                + '<option value="post">&#x1F4DD; Bai viet</option>'
                + '<option value="kudos">&#x1F3C6; Khen thuong</option>'
                + (['admin','manager'].indexOf(_myRole)>-1 ? '<option value="announcement">&#x1F4E2; Thong bao</option>' : '')
              + '</select>'
              + '<span id="soc-char-count" style="font-size:10px;color:var(--text3);">0/500</span>'
            + '</div>'
            + '<button id="soc-post-btn" onclick="window._socSubmitPost()" style="background:var(--accent);border:none;color:#fff;border-radius:9px;padding:7px 20px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">&#x1F4E4; Dang bai</button>'
          + '</div>'
        + '</div>'
      + '</div>'
    + '</div>'

    // ── Feed ──────────────────────────────────────────────────
    + '<div id="soc-feed"></div>'
    + '<div id="soc-loadmore" class="soc-loadmore" style="display:none;">'
      + '<button onclick="window._socLoadMore()" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:10px;padding:9px 28px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Xem them</button>'
    + '</div>';

    ct.appendChild(wrap);
    _bindComposer();
    _loadFeed(1, null, true);
    _startPoll();
  }

  // ── Composer: char count + @mention ──────────────────────────
  function _bindComposer() {
    var txt = document.getElementById('soc-compose-txt');
    var cnt = document.getElementById('soc-char-count');
    if (!txt) return;
    txt.addEventListener('input', function() {
      var len = txt.value.length;
      if (cnt) { cnt.textContent = len+'/500'; cnt.style.color = len>450?'var(--red)':'var(--text3)'; }
      // @mention autocomplete
      var lastAt = txt.value.lastIndexOf('@');
      if (lastAt > -1) {
        var fragment = txt.value.substring(lastAt+1).replace(/\s.*/,'');
        if (fragment.length >= 1) { _showMentionList(fragment); return; }
      }
      _hideMentionList();
    });
    txt.addEventListener('keydown', function(e) {
      if (e.key==='Enter' && e.ctrlKey) { e.preventDefault(); window._socSubmitPost(); }
    });
  }

  function _showMentionList(q) {
    var apiF=_api(); if(!apiF){_hideMentionList();return;}
    var el=document.getElementById('soc-mention-list'); if(!el) return;
    apiF('hrm_get_employees',{search:q,limit:5},function(e,d){
      var emps=(!e&&d&&d.ok)?d.data:[];
      if(!emps.length){_hideMentionList();return;}
      el.style.cssText='background:var(--bg2);border:1px solid var(--border2);border-radius:10px;padding:4px;margin-top:4px;';
      el.innerHTML = emps.map(function(emp){
        var name=emp.ten_nv||emp.name||emp.email||'';
        return '<div onclick="window._socInsertMention(\''+_esc(name)+'\')" '
          +'style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;cursor:pointer;" '
          +'onmouseover="this.style.background=\'var(--bg3)\'" onmouseout="this.style.background=\'\';">'
          +'<div style="width:26px;height:26px;border-radius:7px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;">'+name.substring(0,2).toUpperCase()+'</div>'
          +'<div><div style="font-size:12px;font-weight:700;color:var(--text);">'+_esc(name)+'</div>'
            +'<div style="font-size:10px;color:var(--text3);">'+_esc(emp.phong_ban||emp.department||emp.chuc_vu||'')+'</div>'
          +'</div>'
        +'</div>';
      }).join('');
      el.style.display='block';
    });
  }
  function _hideMentionList() {
    var el=document.getElementById('soc-mention-list'); if(el){el.style.display='none';el.innerHTML='';}
  }
  window._socInsertMention = function(name) {
    var txt=document.getElementById('soc-compose-txt'); if(!txt) return;
    var val=txt.value;
    var lastAt=val.lastIndexOf('@');
    txt.value = val.substring(0,lastAt)+'@'+name+' '+val.substring(lastAt+name.length+1).replace(/^\S*/,'');
    _hideMentionList();
    txt.focus();
  };

  // ── Load feed ─────────────────────────────────────────────────
  function _loadFeed(page, type, replace) {
    if (_loading) return;
    _loading = true;
    var feed = document.getElementById('soc-feed');
    if (replace && feed) {
      feed.innerHTML = '<div class="soc-empty"><div class="soc-empty-icon">&#x1F504;</div><div style="font-size:12px;">Dang tai...</div></div>';
    }
    var apiF = _api(); if (!apiF) { _loading=false; return; }
    var params = { page:page||1, limit:10 };
    if (type) params.type = type;
    if (_searchQ) params.q = _searchQ;
    apiF('social_get_feed', params, function(e,d) {
      _loading = false;
      if (!feed) return;
      var posts = (!e&&d&&d.ok) ? (d.data||[]) : [];
      if (replace) feed.innerHTML = '';
      if (!posts.length && replace) {
        feed.innerHTML = '<div class="soc-empty">'
          +'<div class="soc-empty-icon">&#x1F4AC;</div>'
          +'<div style="font-size:14px;font-weight:700;">Chua co bai dang nao</div>'
          +'<div style="font-size:12px;margin-top:6px;">Hay la nguoi dau tien chia se!</div>'
        +'</div>';
        return;
      }
      posts.forEach(function(p) {
        _postCache[p.id] = p;
        var card = document.createElement('div');
        card.id  = 'soc-card-' + p.id;
        card.innerHTML = _buildCard(p);
        feed.appendChild(card);
      });
      _page = page;
      _allLoaded = !d || d.page >= d.pages;
      var lm = document.getElementById('soc-loadmore');
      if (lm) lm.style.display = _allLoaded ? 'none' : 'block';
    });
  }

  // ── Build post card HTML ──────────────────────────────────────
  function _buildCard(p) {
    var initials = (p.author_name||'?').split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
    var rc       = ROLE_COLOR[p.author_role] || '#64748b';
    var rl       = ROLE_LABEL[p.author_role] || p.author_role || '';
    var pt       = POST_TYPE[p.type] || POST_TYPE.post;
    var isOwn    = p.author_email && p.author_email.toLowerCase() === _myEmail;
    var ago      = _ago(p.created_at);

    // Render @mention as colored spans
    var contentHtml = _renderMentions(_esc(p.content || ''));

    return '<div class="soc-post-card" id="spc-'+p.id+'">'
      // Header
      + '<div style="display:flex;align-items:flex-start;gap:11px;margin-bottom:11px;">'
        + '<div class="soc-avatar" style="width:40px;height:40px;font-size:14px;background:linear-gradient(135deg,'+rc+','+rc+'88);">'+initials+'</div>'
        + '<div style="flex:1;min-width:0;">'
          + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
            + '<span style="font-size:13px;font-weight:800;color:var(--text);">'+_esc(p.author_name)+'</span>'
            + (rl ? '<span style="background:'+rc+'18;color:'+rc+';border-radius:4px;padding:1px 6px;font-size:9px;font-weight:800;">'+_esc(rl)+'</span>' : '')
            + '<span class="soc-type-badge" style="background:'+pt.color+'18;color:'+pt.color+';">'+pt.icon+' '+pt.label+'</span>'
            + (p.pinned ? '<span class="soc-pin-badge">&#x1F4CC; Ghim</span>' : '')
          + '</div>'
          + '<div style="font-size:10px;color:var(--text3);margin-top:2px;">'+_esc(ago)+'</div>'
        + '</div>'
        + (isOwn
            ? '<button onclick="window._socDelete(\''+p.id+'\')" title="Xoa" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:15px;padding:2px 4px;border-radius:5px;opacity:.5;">&#x2715;</button>'
            : '')
      + '</div>'
      // Content
      + '<div style="font-size:13px;color:var(--text2);line-height:1.65;white-space:pre-wrap;margin-bottom:12px;">'+contentHtml+'</div>'
      // Reactions
      + '<div class="soc-react-bar">'
        + '<div style="position:relative;" id="soc-reactwrap-'+p.id+'">'
          + '<button class="soc-action-btn" id="soc-likebtn-'+p.id+'" '
            + 'onclick="window._socLike(\''+p.id+'\')" '
            + 'onmouseenter="window._socShowReacts(\''+p.id+'\')" '
            + 'onmouseleave="window._socHideReacts(\''+p.id+'\')">'
            + '<span id="soc-likeico-'+p.id+'">&#x2764;</span>'
            + '<span id="soc-likecnt-'+p.id+'">'+p.likes_count+'</span>'
          + '</button>'
          + '<div id="soc-reactpop-'+p.id+'" class="soc-react-popup" style="display:none;" '
            + 'onmouseenter="window._socKeepReacts(\''+p.id+'\')" onmouseleave="window._socHideReacts(\''+p.id+'\')">'
            + REACTIONS.map(function(r){
                return '<div class="soc-react-item" title="'+r.label+'" onclick="window._socReact(\''+p.id+'\',\''+r.key+'\')">'+r.icon+'</div>';
              }).join('')
          + '</div>'
        + '</div>'
        + '<button class="soc-action-btn" onclick="window._socToggleCmt(\''+p.id+'\')">'
          + '&#x1F4AC; <span id="soc-cmtcnt-'+p.id+'">0</span>'
        + '</button>'
        + '<div style="margin-left:auto;display:flex;gap:4px;">'
          + ((['admin','manager'].indexOf(_myRole)>-1)
              ? '<button class="soc-action-btn" onclick="window._socPin(\''+p.id+'\')" title="'+(p.pinned?'Bo ghim':'Ghim')+'">&#x1F4CC;</button>'
              : '')
        + '</div>'
      + '</div>'
      // Comments section (lazy loaded)
      + '<div id="soc-cmts-'+p.id+'" class="soc-cmt-section" style="display:none;"></div>'
    + '</div>';
  }

  // ── @mention rendering ────────────────────────────────────────
  function _renderMentions(html) {
    return html.replace(/@([\w\s]{2,30})/g, function(match, name) {
      return '<span class="soc-mention">@'+name+'</span>';
    });
  }

  // ── Filter + Search ───────────────────────────────────────────
  window._socFilter = function(type) {
    _curFilter = type || null;
    _page = 1; _allLoaded = false; _searchQ = '';
    document.querySelectorAll('.soc-filter-btn').forEach(function(b){
      b.className = 'soc-filter-btn' + (b.getAttribute('data-f')===type ? ' active' : '');
    });
    _loadFeed(1, _curFilter, true);
  };

  window._socSearch = function() {
    var inp = document.getElementById('soc-search-inp');
    _searchQ  = inp ? inp.value.trim() : '';
    _curFilter= null;
    _page = 1; _allLoaded = false;
    document.querySelectorAll('.soc-filter-btn').forEach(function(b){ b.className='soc-filter-btn'; });
    var allBtn = document.querySelector('.soc-filter-btn[data-f=""]');
    if (allBtn) allBtn.className = 'soc-filter-btn active';
    _loadFeed(1, null, true);
  };

  window._socRefresh = function() { _loadFeed(1, _curFilter, true); };
  window._socLoadMore = function() { if (!_allLoaded) _loadFeed(_page+1, _curFilter, false); };

  // ── Post submit ───────────────────────────────────────────────
  window._socSubmitPost = function() {
    var apiF = _api(); if (!apiF) return;
    var txt  = document.getElementById('soc-compose-txt');
    var type = (document.getElementById('soc-post-type')||{}).value || 'post';
    var content = txt ? txt.value.trim() : '';
    if (!content) { _toast('Nhap noi dung bai dang','error'); return; }
    if (content.length > 500) { _toast('Bai viet qua dai (toi da 500 ky tu)','error'); return; }
    var btn = document.getElementById('soc-post-btn');
    if (btn) { btn.disabled=true; btn.textContent='Dang...'; }
    apiF('social_create_post',{content:content,type:type},function(e,d){
      if (btn) { btn.disabled=false; btn.textContent='&#x1F4E4; Dang bai'; }
      if (!e&&d&&d.ok) {
        _toast('&#x2728; Da dang bai viet!','ok');
        if (txt) txt.value='';
        var cnt=document.getElementById('soc-char-count'); if(cnt) cnt.textContent='0/500';
        _loadFeed(1,_curFilter,true);
      } else _toast((d&&d.error)||'Loi dang bai','error');
    });
  };

  // ── Like / Reactions ──────────────────────────────────────────
  var _reactTimers = {};

  window._socLike = function(postId) {
    var apiF=_api(); if(!apiF) return;
    apiF('social_toggle_like',{post_id:postId},function(e,d){
      if (!e&&d&&d.ok) {
        var cnt=document.getElementById('soc-likecnt-'+postId);
        var btn=document.getElementById('soc-likebtn-'+postId);
        if (cnt) cnt.textContent=d.likes_count;
        if (btn) btn.className='soc-action-btn'+(d.liked?' liked':'');
      }
    });
  };

  window._socShowReacts = function(id) {
    clearTimeout(_reactTimers[id]);
    var pop=document.getElementById('soc-reactpop-'+id); if(pop) pop.style.display='flex';
  };
  window._socKeepReacts = function(id) { clearTimeout(_reactTimers[id]); };
  window._socHideReacts = function(id) {
    _reactTimers[id]=setTimeout(function(){
      var pop=document.getElementById('soc-reactpop-'+id); if(pop) pop.style.display='none';
    },300);
  };
  window._socReact = function(postId, reactionKey) {
    var ico=REACTIONS.find(function(r){return r.key===reactionKey;});
    // Animate reaction
    var btn=document.getElementById('soc-likebtn-'+postId);
    if (btn && ico) {
      var icoEl=document.getElementById('soc-likeico-'+postId);
      if (icoEl) icoEl.textContent=ico.icon;
      btn.className='soc-action-btn liked';
    }
    window._socHideReacts(postId);
    window._socLike(postId); // backend reuse toggle like
  };

  // ── Comments ──────────────────────────────────────────────────
  window._socToggleCmt = function(postId) {
    var el=document.getElementById('soc-cmts-'+postId); if(!el) return;
    if (el.style.display==='none'||!el.style.display) {
      el.style.display='block';
      _loadCmts(postId);
    } else { el.style.display='none'; }
  };

  function _loadCmts(postId) {
    var el=document.getElementById('soc-cmts-'+postId); if(!el) return;
    el.innerHTML='<div style="font-size:11px;color:var(--text3);">Dang tai...</div>';
    var apiF=_api(); if(!apiF) return;
    var init=_myName.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
    var rc=ROLE_COLOR[_myRole]||'#64748b';
    apiF('social_get_comments',{post_id:postId},function(e,d){
      var cmts=(!e&&d&&d.ok)?d.data:[];
      var cnt=document.getElementById('soc-cmtcnt-'+postId);
      if (cnt) cnt.textContent=cmts.length;
      el.innerHTML=cmts.map(function(c){
        return '<div class="soc-cmt-item">'
          +'<div class="soc-avatar" style="width:28px;height:28px;font-size:10px;background:var(--bg3);color:var(--text3);">'+c.author_name.substring(0,2).toUpperCase()+'</div>'
          +'<div class="soc-cmt-bubble">'
            +'<div class="soc-cmt-name">'+_esc(c.author_name)+' <span style="font-weight:400;color:var(--text3);font-size:10px;">'+_ago(c.created_at)+'</span></div>'
            +'<div class="soc-cmt-text">'+_renderMentions(_esc(c.content))+'</div>'
          +'</div>'
        +'</div>';
      }).join('')
      +'<div class="soc-cmt-input-row">'
        +'<div class="soc-avatar" style="width:28px;height:28px;font-size:10px;background:linear-gradient(135deg,'+rc+','+rc+'88);">'+init+'</div>'
        +'<input id="soc-cin-'+postId+'" type="text" placeholder="Them binh luan..." '
          +'style="flex:1;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:6px 10px;font-size:12px;font-family:inherit;">'
        +'<button onclick="window._socPostCmt(\''+postId+'\')" '
          +'style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Gui</button>'
      +'</div>';
      // Enter to submit
      var cinp=document.getElementById('soc-cin-'+postId);
      if (cinp) cinp.addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();window._socPostCmt(postId);}});
    });
  }

  window._socPostCmt = function(postId) {
    var inp=document.getElementById('soc-cin-'+postId);
    var txt=inp?inp.value.trim():'';
    if (!txt) return;
    var apiF=_api(); if(!apiF) return;
    apiF('social_add_comment',{post_id:postId,content:txt},function(e,d){
      if (!e&&d&&d.ok) { if(inp) inp.value=''; _loadCmts(postId); }
      else _toast((d&&d.error)||'Loi','error');
    });
  };

  // ── Pin + Delete ──────────────────────────────────────────────
  window._socPin = function(postId) {
    var apiF=_api(); if(!apiF) return;
    apiF('fulfillment_flexible_update',{id:postId},function(){
      _toast('Tinh nang ghim dang phat trien','error');
    });
  };

  window._socDelete = function(postId) {
    if (!confirm('Xoa bai dang nay?')) return;
    _toast('Tinh nang xoa dang phat trien','error');
  };

  // ── Real-time poll 10s ────────────────────────────────────────
  function _startPoll() {
    clearInterval(_pollTimer);
    _pollTimer = setInterval(function() {
      if (!document.getElementById('soc-feed')) { clearInterval(_pollTimer); return; }
      // Silent refresh: only if page 1 and no search
      if (_page===1 && !_searchQ) {
        var apiF=_api(); if(!apiF) return;
        var params={page:1,limit:10};
        if (_curFilter) params.type=_curFilter;
        apiF('social_get_feed',params,function(e,d){
          if (!e&&d&&d.ok&&d.data) {
            var feed=document.getElementById('soc-feed'); if(!feed) return;
            // Check if first post changed
            if (d.data.length && (!_postCache[d.data[0].id])) {
              // New post appeared — prepend without full reload
              var card=document.createElement('div');
              card.id='soc-card-'+d.data[0].id;
              card.style.animation='fadeInDown .3s ease';
              card.innerHTML=_buildCard(d.data[0]);
              _postCache[d.data[0].id]=d.data[0];
              feed.insertBefore(card, feed.firstChild);
            }
          }
        });
      }
    }, 10000);
  }

  // ── Exports ───────────────────────────────────────────────────
  window.loadSocial    = loadSocial;
  window.loadMangXaHoi = loadSocial;

}());
