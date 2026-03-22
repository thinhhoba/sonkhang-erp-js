// [v5.28] 22/03/2026 — sk-messaging-ui.js
// Internal Messaging: Threads + Chat + Real-time polling
(function () {
  'use strict';
  var _api   = function(){ return typeof window.api==='function'?window.api:null; };
  var _ct    = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
  var _esc   = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var _toast = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };

  var _myEmail = '', _myName = '';
  var _curThread = null;
  var _pollTimer = null;
  var _lastMsgId = null;

  function _getSession() {
    try { var r=localStorage.getItem('sk_session_data'); return r?JSON.parse(r):null; } catch(e){return null;}
  }

  function loadMessaging() {
    var ct = _ct(); if (!ct) return;
    var sess = _getSession();
    _myEmail = sess && sess.email ? sess.email.toLowerCase() : '';
    _myName  = sess && sess.name  ? sess.name  : '';

    ct.innerHTML = '<div class="fade-in" style="display:grid;grid-template-columns:300px 1fr;height:calc(100vh - 120px);max-height:720px;border:1px solid var(--border);border-radius:18px;overflow:hidden;margin:24px;">'
      // Left: thread list
      + '<div style="background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;">'
        + '<div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">'
          + '<span style="font-size:14px;font-weight:900;color:var(--text);">&#x1F4AC; Tin nhan</span>'
          + '<button onclick="window._msgNewChat()" title="Tin nhan moi" style="background:var(--accent);border:none;color:#fff;border-radius:8px;width:28px;height:28px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">+</button>'
        + '</div>'
        + '<div id="msg-threads" style="flex:1;overflow-y:auto;"></div>'
      + '</div>'
      // Right: chat window
      + '<div style="display:flex;flex-direction:column;background:var(--bg);" id="msg-chat-area">'
        + '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text3);">'
          + '<div style="text-align:center;">'
            + '<div style="font-size:40px;margin-bottom:12px;">&#x1F4AC;</div>'
            + '<div style="font-size:13px;font-weight:700;">Chon mot cuoc tro chuyen</div>'
            + '<div style="font-size:11px;margin-top:4px;">hoac bat dau nhan tin moi</div>'
          + '</div>'
        + '</div>'
      + '</div>'
    + '</div>';

    _loadThreads();
    _startPoll();
  }

  function _loadThreads() {
    var apiF = _api(); if (!apiF) return;
    var el = document.getElementById('msg-threads');
    if (!el) return;
    apiF('msg_get_threads', {}, function(e, d) {
      if (!el) return;
      var threads = (!e&&d&&d.ok) ? d.data : [];
      if (!threads.length) {
        el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3);font-size:12px;">Chua co tin nhan nao.<br>Nhan "+" de bat dau!</div>';
        return;
      }
      el.innerHTML = threads.map(function(t) {
        var others = t.participants.filter(function(p){ return p !== _myEmail; });
        var displayName = t.title || (others[0] || 'Nhom chat');
        var initials = displayName.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
        var isActive = _curThread && _curThread.id === t.id;
        return '<div class="msg-thread-item" onclick="window._msgOpenThread('+JSON.stringify(t)+')" '
          + 'style="display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;transition:background .1s;'
          + (isActive ? 'background:rgba(79,111,255,.1);' : '')+'border-bottom:1px solid var(--border);">'
          + '<div style="position:relative;flex-shrink:0;">'
            + '<div style="width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,#4f6fff88,#06d6d688);'
              + 'display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800;">'+initials+'</div>'
            + (t.unread>0 ? '<span style="position:absolute;top:-3px;right:-3px;background:#ef4444;color:#fff;font-size:9px;font-weight:800;'
              + 'min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg2);">'+t.unread+'</span>' : '')
          + '</div>'
          + '<div style="flex:1;min-width:0;">'
            + '<div style="font-size:12.5px;font-weight:700;color:var(--text);">'+_esc(displayName)+'</div>'
            + '<div style="font-size:11px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
              + _esc((t.last_msg||'').substring(0,40)||(t.last_msg?'...':''))+'</div>'
          + '</div>'
          + '<div style="font-size:9px;color:var(--text3);flex-shrink:0;">'+_shortTime(t.last_ts)+'</div>'
        + '</div>';
      }).join('');
    });
  }

  window._msgOpenThread = function(thread) {
    _curThread = thread;
    _lastMsgId = null;
    _loadThreads(); // refresh active state
    _openChatWindow(thread);
    _loadMessages(thread.id, true);
  };

  function _openChatWindow(thread) {
    var area = document.getElementById('msg-chat-area');
    if (!area) return;
    var others = thread.participants.filter(function(p){ return p !== _myEmail; });
    var displayName = thread.title || others[0] || 'Nhom chat';

    area.innerHTML = '<div style="padding:12px 16px;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;align-items:center;gap:10px;">'
        + '<div style="width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#4f6fff,#06d6d6);'
          + 'display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:800;">'
          + displayName.substring(0,2).toUpperCase()
        + '</div>'
        + '<div><div style="font-size:13px;font-weight:800;color:var(--text);">'+_esc(displayName)+'</div>'
          + '<div style="font-size:10px;color:#22c55e;">Online</div>'
        + '</div>'
      + '</div>'
      + '<div id="msg-bubbles" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;"></div>'
      + '<div style="padding:12px 14px;border-top:1px solid var(--border);background:var(--bg2);display:flex;gap:8px;">'
        + '<input id="msg-input" type="text" placeholder="Nhap tin nhan..." '
          + 'style="flex:1;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:10px;'
          + 'padding:9px 12px;font-size:13px;font-family:inherit;">'
        + '<button onclick="window._msgSend()" style="background:var(--accent);border:none;color:#fff;border-radius:10px;'
          + 'padding:9px 16px;font-size:13px;cursor:pointer;font-family:inherit;">&#x27A4;</button>'
      + '</div>';

    // Enter key
    var inp = area.querySelector('#msg-input');
    if (inp) inp.addEventListener('keydown', function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); window._msgSend(); } });
  }

  function _loadMessages(threadId, scroll) {
    var el = document.getElementById('msg-bubbles');
    if (!el) return;
    var apiF = _api(); if (!apiF) return;
    apiF('msg_get_messages',{thread_id:threadId},function(e,d){
      if (!el) return;
      var msgs = (!e&&d&&d.ok) ? d.data : [];
      if (!msgs.length && scroll) {
        el.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:12px;margin:auto;">Chua co tin nhan. Bat dau tro chuyen!</div>';
        return;
      }
      el.innerHTML = msgs.map(function(m) {
        var isMine = m.is_mine;
        return '<div style="display:flex;justify-content:'+(isMine?'flex-end':'flex-start')+';">'
          + '<div style="max-width:70%;'
            + (isMine
                ? 'background:var(--accent);color:#fff;border-radius:16px 16px 4px 16px;'
                : 'background:var(--bg2);color:var(--text);border:1px solid var(--border);border-radius:16px 16px 16px 4px;')
            + 'padding:9px 13px;font-size:13px;line-height:1.5;">'
            + '<div style="white-space:pre-wrap;word-break:break-word;">'+_esc(m.content)+'</div>'
            + '<div style="font-size:9px;opacity:.6;margin-top:3px;text-align:right;">'+_shortTime(m.created_at)+(m.read_at?'  &#x2714;&#x2714;':'')+'</div>'
          + '</div>'
        + '</div>';
      }).join('');
      if (scroll) { el.scrollTop = el.scrollHeight; }
      else if (msgs.length) { el.scrollTop = el.scrollHeight; }
    });
  }

  window._msgSend = function() {
    if (!_curThread) return;
    var inp  = document.getElementById('msg-input');
    var text = inp ? inp.value.trim() : '';
    if (!text) return;
    if (inp) inp.value = '';
    var apiF = _api(); if (!apiF) return;
    apiF('msg_send',{thread_id:_curThread.id,content:text},function(e,d){
      if (!e&&d&&d.ok) _loadMessages(_curThread.id, false);
      else _toast((d&&d.error)||'Loi gui tin nhan','error');
    });
  };

  window._msgNewChat = function() {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.addEventListener('click', function(ev){ if(ev.target===overlay) overlay.remove(); });

    overlay.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:16px;width:100%;max-width:420px;padding:24px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
        + '<span style="font-size:15px;font-weight:900;">Tin nhan moi</span>'
        + '<button onclick="this.closest(\'[style*=fixed]\').remove()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:20px;">x</button>'
      + '</div>'
      + '<div style="margin-bottom:12px;">'
        + '<label style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:4px;">Email nguoi nhan</label>'
        + '<input id="nc-email" type="email" placeholder="email@example.com" style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:9px 10px;font-size:13px;font-family:inherit;box-sizing:border-box;">'
      + '</div>'
      + '<div style="margin-bottom:16px;">'
        + '<label style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:4px;">Tin nhan dau tien</label>'
        + '<textarea id="nc-msg" rows="3" placeholder="Xin chao..." style="width:100%;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;padding:9px 10px;font-size:13px;font-family:inherit;resize:none;box-sizing:border-box;"></textarea>'
      + '</div>'
      + '<button id="nc-send-btn" style="width:100%;background:var(--accent);border:none;color:#fff;border-radius:10px;padding:11px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">Bat dau tro chuyen</button>'
    + '</div>';

    var sendBtn = overlay.querySelector('#nc-send-btn');
    sendBtn.addEventListener('click', function() {
      var toEmail = (overlay.querySelector('#nc-email')||{}).value||'';
      var msg     = (overlay.querySelector('#nc-msg')  ||{}).value||'';
      if (!toEmail||!msg.trim()) { _toast('Nhap email va tin nhan','error'); return; }
      sendBtn.disabled = true; sendBtn.textContent = 'Dang gui...';
      var apiF = _api(); if (!apiF) return;
      apiF('msg_get_or_create_thread',{to_email:toEmail.trim().toLowerCase()},function(e,d){
        if (e||!d||!d.ok) { _toast((d&&d.error)||'Loi tao cuoc tro chuyen','error'); sendBtn.disabled=false; sendBtn.textContent='Bat dau tro chuyen'; return; }
        var tid = d.thread_id;
        apiF('msg_send',{thread_id:tid,content:msg.trim()},function(e2,d2){
          overlay.remove();
          if (!e2&&d2&&d2.ok) { _toast('Da gui tin nhan','ok'); _loadThreads(); }
          else _toast((d2&&d2.error)||'Loi','error');
        });
      });
    });

    document.body.appendChild(overlay);
    setTimeout(function(){ var inp=overlay.querySelector('#nc-email'); if(inp)inp.focus(); }, 100);
  };

  // ── Real-time polling 5s ─────────────────────────────────────
  function _startPoll() {
    clearInterval(_pollTimer);
    _pollTimer = setInterval(function() {
      if (!document.getElementById('msg-threads')) { clearInterval(_pollTimer); return; }
      _loadThreads();
      if (_curThread) _loadMessages(_curThread.id, false);
      // Update notification badge
      var apiF = _api(); if (!apiF) return;
      apiF('msg_unread_count',{},function(e,d){
        if (!e&&d&&d.ok&&d.total>0) {
          var bellDot = document.getElementById('mmn-bell-count');
          if (bellDot) { bellDot.style.display='flex'; bellDot.textContent=d.total; }
        }
      });
    }, 5000);
  }

  function _shortTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    var now = new Date();
    if (now.toDateString() === d.toDateString())
      return d.toTimeString().substring(0,5);
    return d.getDate()+'/'+(d.getMonth()+1);
  }

  window.loadMessaging = loadMessaging;
  window.loadTinNhan   = loadMessaging;

}());
