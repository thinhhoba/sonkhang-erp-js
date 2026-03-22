// [v5.28] 22/03/2026 — sk-social-ui.js
// Internal Social Network: Feed, Post, Like, Comment
(function () {
  'use strict';
  var _api   = function(){ return typeof window.api==='function'?window.api:null; };
  var _ct    = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
  var _esc   = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };

  var _page = 1, _loading = false, _allLoaded = false;
  var _myEmail = '', _myName = '';

  var _TYPE_STYLE = {
    'post'        : { label:'Bai viet',    color:'#4f6fff', icon:'&#x1F4DD;' },
    'announcement': { label:'Thong bao',   color:'#ef4444', icon:'&#x1F4E2;' },
    'kudos'       : { label:'Khen thuong', color:'#f59e0b', icon:'&#x1F3C6;' },
  };
  var _ROLE_COLOR = {
    'admin':'#ef4444','manager':'#f59e0b','sales':'#4f6fff',
    'accountant':'#10b981','warehouse':'#06b6d4','hr':'#a855f7','driver':'#f97316',
  };

  function _getSession() {
    try {
      var r = localStorage.getItem('sk_session_data');
      return r ? JSON.parse(r) : null;
    } catch(e) { return null; }
  }

  function loadSocial() {
    var ct = _ct(); if (!ct) return;
    _page = 1; _allLoaded = false;
    var sess = _getSession();
    _myEmail = sess && sess.email ? sess.email.toLowerCase() : '';
    _myName  = sess && sess.name  ? sess.name  : '';
    var myRole = sess && sess.role ? sess.role : '';

    ct.innerHTML = '<div class="fade-in" style="max-width:680px;margin:0 auto;padding:24px;" id="soc-wrap">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">'
        + '<h1 style="font-size:20px;font-weight:900;margin:0;">&#x1F465; Mang xa hoi noi bo</h1>'
        + '<div style="display:flex;gap:8px;">'
          + '<button id="soc-filter-all" onclick="window._socFilter(\'all\')" style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Tat ca</button>'
          + '<button id="soc-filter-ann" onclick="window._socFilter(\'announcement\')" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Thong bao</button>'
          + '<button id="soc-filter-kudo" onclick="window._socFilter(\'kudos\')" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:8px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Khen thuong</button>'
        + '</div>'
      + '</div>'

      // Composer
      + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:16px;">'
        + '<div style="display:flex;gap:10px;align-items:flex-start;">'
          + '<div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#4f6fff,#06d6d6);'
            + 'display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800;flex-shrink:0;">'
            + (_myName||'?').substring(0,2).toUpperCase()
          + '</div>'
          + '<div style="flex:1;">'
            + '<textarea id="soc-composer" placeholder="Ban dang nghi gi? Chia se voi dong nghiep..." rows="3" '
              + 'style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:10px;'
              + 'padding:10px 12px;font-size:13px;font-family:inherit;resize:none;box-sizing:border-box;">'
            + '</textarea>'
            + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">'
              + '<div style="display:flex;gap:8px;">'
                + '<select id="soc-post-type" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text3);border-radius:7px;padding:5px 8px;font-size:11px;font-family:inherit;">'
                  + '<option value="post">&#x1F4DD; Bai viet</option>'
                  + '<option value="kudos">&#x1F3C6; Khen thuong</option>'
                  + (myRole==='admin'||myRole==='manager' ? '<option value="announcement">&#x1F4E2; Thong bao</option>' : '')
                + '</select>'
              + '</div>'
              + '<button onclick="window._socPost()" id="soc-post-btn" style="background:var(--accent);border:none;color:#fff;border-radius:9px;padding:8px 20px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">&#x1F4E4; Dang bai</button>'
            + '</div>'
          + '</div>'
        + '</div>'
      + '</div>'

      // Feed container
      + '<div id="soc-feed"></div>'
      + '<div id="soc-load-more" style="text-align:center;padding:16px;">'
        + '<button onclick="window._socLoadMore()" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:9px;padding:9px 24px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tai them</button>'
      + '</div>'
    + '</div>';

    _loadFeed(1, null, true);
  }

  var _curFilter = null;
  window._socFilter = function(type) {
    _curFilter = type === 'all' ? null : type;
    _page = 1; _allLoaded = false;
    _loadFeed(1, _curFilter, true);
    ['all','ann','kudo'].forEach(function(k) {
      var btn = document.getElementById('soc-filter-'+k);
      if (!btn) return;
      var isActive = (k==='all'&&!_curFilter)||(k==='ann'&&_curFilter==='announcement')||(k==='kudo'&&_curFilter==='kudos');
      btn.style.background    = isActive ? 'var(--accent)' : 'var(--bg3)';
      btn.style.color         = isActive ? '#fff' : 'var(--text3)';
      btn.style.border        = isActive ? 'none' : '1px solid var(--border2)';
    });
  };

  function _loadFeed(page, type, replace) {
    if (_loading) return;
    _loading = true;
    var feed = document.getElementById('soc-feed');
    if (replace && feed) feed.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);">Dang tai...</div>';
    var apiF = _api(); if (!apiF) { _loading=false; return; }
    var params = { page:page||1, limit:8 };
    if (type) params.type = type;
    apiF('social_get_feed', params, function(e,d) {
      _loading = false;
      if (!feed) return;
      var posts = (!e&&d&&d.ok) ? (d.data||[]) : [];
      if (replace) feed.innerHTML = '';
      if (!posts.length && replace) {
        feed.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--text3);">'
          + '<div style="font-size:36px;margin-bottom:10px;">&#x1F4AC;</div>'
          + '<div style="font-size:13px;font-weight:700;">Chua co bai dang nao</div>'
          + '<div style="font-size:11px;margin-top:4px;">Hay la nguoi dau tien chia se!</div>'
        + '</div>';
      }
      posts.forEach(function(p) {
        var el = document.createElement('div');
        el.innerHTML = _buildPostCard(p);
        feed.appendChild(el.firstChild);
      });
      _page = page;
      if (!d || d.page >= d.pages) _allLoaded = true;
      var lmBtn = document.getElementById('soc-load-more');
      if (lmBtn) lmBtn.style.display = _allLoaded ? 'none' : 'block';
    });
  }

  window._socLoadMore = function() {
    if (!_allLoaded) _loadFeed(_page+1, _curFilter, false);
  };

  function _buildPostCard(p) {
    var initials = (p.author_name||'?').split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
    var ago      = _timeAgo(p.created_at);
    var ts       = _TYPE_STYLE[p.type] || _TYPE_STYLE.post;
    var rc       = _ROLE_COLOR[p.author_role] || '#64748b';
    var isLiked  = false; // would need extra data to know
    var isOwn    = p.author_email.toLowerCase() === _myEmail;

    return '<div class="soc-post-card" id="soc-p-'+p.id+'" '
      + 'style="background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:12px;">'
      // Header
      + '<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">'
        + '<div style="width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,'+rc+','+rc+'88);'
          + 'display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:900;flex-shrink:0;">'
          + initials
        + '</div>'
        + '<div style="flex:1;">'
          + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
            + '<span style="font-size:13px;font-weight:800;color:var(--text);">'+_esc(p.author_name)+'</span>'
            + (p.pinned ? '<span style="font-size:9px;background:#ef444422;color:#ef4444;border-radius:4px;padding:1px 5px;font-weight:800;">&#x1F4CC; Ghim</span>' : '')
            + '<span style="font-size:9px;background:'+ts.color+'22;color:'+ts.color+';border-radius:5px;padding:1px 6px;font-weight:800;">'+ts.label+'</span>'
          + '</div>'
          + '<div style="font-size:10px;color:var(--text3);margin-top:2px;">'+_esc(ago)+'</div>'
        + '</div>'
        + (isOwn ? '<button onclick="window._socDeletePost(\''+p.id+'\')" title="Xoa" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:16px;padding:2px;">&#x2715;</button>' : '')
      + '</div>'
      // Content
      + '<div style="font-size:13px;color:var(--text2);line-height:1.65;white-space:pre-wrap;margin-bottom:12px;">'+_esc(p.content)+'</div>'
      // Actions
      + '<div style="display:flex;align-items:center;gap:12px;border-top:1px solid var(--border);padding-top:10px;">'
        + '<button onclick="window._socLike(\''+p.id+'\')" id="soc-like-'+p.id+'" '
          + 'style="display:flex;align-items:center;gap:5px;background:none;border:none;color:var(--text3);cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;transition:color .12s;padding:4px 8px;border-radius:7px;">'
          + '&#x2764; <span id="soc-lc-'+p.id+'">'+p.likes_count+'</span>'
        + '</button>'
        + '<button onclick="window._socToggleComments(\''+p.id+'\')" '
          + 'style="display:flex;align-items:center;gap:5px;background:none;border:none;color:var(--text3);cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;padding:4px 8px;border-radius:7px;">'
          + '&#x1F4AC; Binh luan'
        + '</button>'
      + '</div>'
      // Comments section (hidden initially)
      + '<div id="soc-cmt-'+p.id+'" style="display:none;margin-top:12px;">'
        + '<div id="soc-cmts-'+p.id+'"></div>'
        + '<div style="display:flex;gap:8px;margin-top:8px;">'
          + '<input id="soc-cin-'+p.id+'" type="text" placeholder="Binh luan..." '
            + 'style="flex:1;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:7px 10px;font-size:12px;font-family:inherit;">'
          + '<button onclick="window._socComment(\''+p.id+'\')" '
            + 'style="background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Gui</button>'
        + '</div>'
      + '</div>'
    + '</div>';
  }

  window._socPost = function() {
    var apiF   = _api(); if (!apiF) return;
    var content= (document.getElementById('soc-composer')||{}).value||'';
    var type   = (document.getElementById('soc-post-type')||{}).value||'post';
    if (!content.trim()) { _toast('Nhap noi dung bai viet','error'); return; }
    var btn = document.getElementById('soc-post-btn');
    if (btn) { btn.disabled=true; btn.textContent='Dang...'; }
    apiF('social_create_post',{content:content,type:type},function(e,d){
      if (btn) { btn.disabled=false; btn.textContent='Dang bai'; }
      if (!e&&d&&d.ok) {
        _toast('Da dang bai viet!','ok');
        var c=document.getElementById('soc-composer'); if(c) c.value='';
        _loadFeed(1, _curFilter, true);
      } else _toast((d&&d.error)||'Loi','error');
    });
  };

  window._socLike = function(postId) {
    var apiF = _api(); if (!apiF) return;
    apiF('social_toggle_like',{post_id:postId},function(e,d){
      if (!e&&d&&d.ok) {
        var btn = document.getElementById('soc-like-'+postId);
        var cnt = document.getElementById('soc-lc-'+postId);
        if (cnt) cnt.textContent = d.likes_count;
        if (btn) btn.style.color = d.liked ? '#ef4444' : 'var(--text3)';
      }
    });
  };

  window._socToggleComments = function(postId) {
    var el = document.getElementById('soc-cmt-'+postId);
    if (!el) return;
    if (el.style.display === 'none') {
      el.style.display = 'block';
      _loadComments(postId);
    } else {
      el.style.display = 'none';
    }
  };

  function _loadComments(postId) {
    var el = document.getElementById('soc-cmts-'+postId);
    if (!el) return;
    el.innerHTML = '<div style="font-size:11px;color:var(--text3);">Dang tai...</div>';
    var apiF = _api(); if (!apiF) return;
    apiF('social_get_comments',{post_id:postId},function(e,d){
      if (!d||!d.ok||!d.data.length) { el.innerHTML='<div style="font-size:11px;color:var(--text3);">Chua co binh luan.</div>'; return; }
      el.innerHTML = d.data.map(function(c) {
        return '<div style="display:flex;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);">'
          + '<div style="width:28px;height:28px;border-radius:8px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--text3);flex-shrink:0;">'
            + (c.author_name||'?').substring(0,2).toUpperCase()
          + '</div>'
          + '<div><div style="font-size:12px;font-weight:700;color:var(--text);">'+_esc(c.author_name)+'</div>'
            + '<div style="font-size:12px;color:var(--text2);">'+_esc(c.content)+'</div>'
            + '<div style="font-size:10px;color:var(--text3);">'+_timeAgo(c.created_at)+'</div>'
          + '</div></div>';
      }).join('');
    });
  }

  window._socComment = function(postId) {
    var apiF = _api(); if (!apiF) return;
    var inp  = document.getElementById('soc-cin-'+postId);
    var text = inp ? inp.value.trim() : '';
    if (!text) return;
    apiF('social_add_comment',{post_id:postId,content:text},function(e,d){
      if (!e&&d&&d.ok) { if(inp) inp.value=''; _loadComments(postId); }
      else _toast((d&&d.error)||'Loi','error');
    });
  };

  window._socDeletePost = function(postId) {
    _toast('Chuc nang xoa bai dang dang phat trien','error');
  };

  function _timeAgo(iso) {
    if (!iso) return '';
    var diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)    return Math.round(diff) + 'g truoc';
    if (diff < 3600)  return Math.round(diff/60) + ' phut truoc';
    if (diff < 86400) return Math.round(diff/3600) + ' gio truoc';
    return Math.round(diff/86400) + ' ngay truoc';
  }

  window.loadSocial   = loadSocial;
  window.loadMangXaHoi = loadSocial;

}());
