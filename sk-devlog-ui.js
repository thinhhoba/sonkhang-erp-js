/* ================================================================
 * sk-devlog-ui.js  SonKhang ERP v5.14
 * Realtime Changelog & Masterplan UI
 * Tabs: Changelog | Masterplan | Ghi nhan
 * Poll GAS moi 60s tu dong cap nhat
 * [v5.14] 21/03/2026 — Initial build
 * ================================================================ */
(function () {
'use strict';

var _api    = function(){ return typeof window.api==='function'?window.api:null; };
var _ct     = function(){ return typeof window.getContent==='function'?window.getContent():document.getElementById('sk-ct'); };
var _esc    = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
var _toast  = function(m,t){ if(typeof window.skToast==='function') window.skToast(m,t||'ok'); };
var _isAdmin= function(){ return typeof window.skRole==='function'&&['admin','manager'].indexOf(window.skRole())>=0; };

// ── Colors ────────────────────────────────────────────────────────
var C = {
  feature : ['rgba(0,214,143,.12)','rgba(0,214,143,.3)','var(--green)'],
  bugfix  : ['rgba(255,77,109,.12)','rgba(255,77,109,.3)','var(--red)'],
  deploy  : ['rgba(79,111,255,.12)','rgba(79,111,255,.3)','var(--accent2)'],
  hotfix  : ['rgba(255,77,109,.2)','rgba(255,77,109,.5)','var(--red)'],
  refactor: ['rgba(251,191,36,.12)','rgba(251,191,36,.3)','var(--yellow)'],
  system  : ['rgba(160,174,192,.1)','rgba(160,174,192,.3)','var(--text3)'],
  test    : ['rgba(0,182,255,.1)','rgba(0,182,255,.3)','var(--cyan)'],
};
var TYPE_ICON = {
  feature:'&#x2728;', bugfix:'&#x1F41B;', deploy:'&#x1F680;',
  hotfix:'&#x1F525;', refactor:'&#x1F527;', system:'&#x2699;', test:'&#x1F9EA;',
};
var TYPE_LABEL = {
  feature:'Tinh nang', bugfix:'Sua loi', deploy:'Deploy',
  hotfix:'Hotfix', refactor:'Cai tien', system:'He thong', test:'Kiem thu',
};

// ── State ─────────────────────────────────────────────────────────
var ST = {
  tab: 'changelog',
  entries: [],
  masterplan: [],
  stats: null,
  filter_type: '',
  filter_q: '',
  poll_timer: null,
  last_sync: null,
  loading: false,
};

// ── Main loader ───────────────────────────────────────────────────
function loadDevLog() {
  var ct = _ct(); if (!ct) return;

  ct.innerHTML = '<div class="fade-in" style="padding:24px;">'
    + '<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:20px;">'
      + '<div>'
        + '<h1 style="font-size:22px;font-weight:900;margin:0;">&#x1F4D3; DevLog</h1>'
        + '<p style="font-size:12px;color:var(--text3);margin:4px 0 0;">Changelog &middot; Masterplan &middot; Tien do phat trien &mdash; cap nhat realtime moi 60s</p>'
      + '</div>'
      + '<div style="display:flex;gap:8px;align-items:center;">'
        + '<span id="dl-sync-dot" style="width:8px;height:8px;border-radius:50%;background:var(--text3);display:inline-block;"></span>'
        + '<span id="dl-sync-label" style="font-size:11px;color:var(--text3);">Chua dong bo</span>'
        + '<button id="dl-refresh" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">&#x21BA; Lam moi</button>'
      + '</div>'
    + '</div>'
    + '<div style="display:flex;gap:4px;margin-bottom:16px;" id="dl-tabs">'
      + _tabBtn('changelog','&#x1F4CB; Changelog',true)
      + _tabBtn('masterplan','&#x1F4CA; Masterplan',false)
      + (_isAdmin() ? _tabBtn('push','&#x2795; Ghi nhan',false) : '')
    + '</div>'
    + '<div id="dl-body"></div>'
  + '</div>';

  // Tab events
  ct.querySelectorAll('[data-dl-tab]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      _setTab(btn.getAttribute('data-dl-tab'));
    });
  });

  document.getElementById('dl-refresh').addEventListener('click', function() {
    _loadAll(true);
  });

  _loadAll(true);
  _startPolling();
}

function _tabBtn(id, label, active) {
  return '<button data-dl-tab="' + id + '" style="border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;'
    + (active
        ? 'background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);'
        : 'background:var(--bg3);border:1px solid var(--border2);color:var(--text3);')
    + '">' + label + '</button>';
}

function _setTab(tab) {
  ST.tab = tab;
  document.querySelectorAll('[data-dl-tab]').forEach(function(b) {
    var active = b.getAttribute('data-dl-tab') === tab;
    b.style.cssText = 'border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;'
      + (active
          ? 'background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);'
          : 'background:var(--bg3);border:1px solid var(--border2);color:var(--text3);');
  });
  _renderTab();
}

// ── Load data ─────────────────────────────────────────────────────
function _loadAll(force) {
  if (ST.loading && !force) return;
  ST.loading = true;
  var api = _api(); if (!api) { ST.loading = false; return; }

  var done = 0;
  function _check() { done++; if (done >= 2) { ST.loading = false; _renderTab(); _updateSyncStatus(); } }

  api('devlog_get', { limit:100, type:ST.filter_type, q:ST.filter_q }, function(e,d) {
    if (!e && d && d.ok) {
      ST.entries = d.data || [];
      ST.stats   = d.by_type || null;
    }
    _check();
  });

  api('masterplan_get', {}, function(e,d) {
    if (!e && d && d.ok) ST.masterplan = d.data || [];
    _check();
  });
}

function _startPolling() {
  if (ST.poll_timer) clearInterval(ST.poll_timer);
  ST.poll_timer = setInterval(function() {
    if (document.getElementById('dl-body')) _loadAll(false);
    else { clearInterval(ST.poll_timer); ST.poll_timer = null; }
  }, 60000);
}

function _updateSyncStatus() {
  ST.last_sync = new Date();
  var dot   = document.getElementById('dl-sync-dot');
  var label = document.getElementById('dl-sync-label');
  if (dot)   dot.style.background = 'var(--green)';
  if (label) label.textContent = _fmtTime(ST.last_sync);
}

function _fmtTime(d) {
  if (!d) return '';
  var h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
  return (h<10?'0'+h:h)+':'+(m<10?'0'+m:m)+':'+(s<10?'0'+s:s);
}

function _fmtAgo(iso) {
  if (!iso) return '';
  var diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return diff + 'g truoc';
  if (diff < 3600) return Math.round(diff/60) + ' phut truoc';
  if (diff < 86400)return Math.round(diff/3600) + ' gio truoc';
  return Math.round(diff/86400) + ' ngay truoc';
}

// ── Render dispatcher ─────────────────────────────────────────────
function _renderTab() {
  if (ST.tab === 'changelog')  _renderChangelog();
  else if (ST.tab === 'masterplan') _renderMasterplan();
  else if (ST.tab === 'push')  _renderPushForm();
}

// ══════════════════════════════════════════════════════════════════
// TAB 1: CHANGELOG
// ══════════════════════════════════════════════════════════════════
function _renderChangelog() {
  var el = document.getElementById('dl-body'); if (!el) return;

  // Stats bar
  var statsHtml = '';
  if (ST.stats) {
    statsHtml = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">';
    Object.keys(ST.stats).forEach(function(t) {
      var c = C[t] || C.system;
      statsHtml += '<span style="background:' + c[0] + ';border:1px solid ' + c[1] + ';color:' + c[2] + ';'
        + 'border-radius:6px;padding:3px 10px;font-size:11px;font-weight:800;cursor:pointer;" data-filter-type="' + t + '">'
        + (TYPE_ICON[t]||'') + ' ' + (TYPE_LABEL[t]||t) + ' <span style="opacity:.7">(' + ST.stats[t] + ')</span></span>';
    });
    // Reset filter
    statsHtml += '<span style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);'
      + 'border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700;cursor:pointer;" data-filter-type="">Tat ca</span>';
    statsHtml += '</div>';
  }

  // Search bar
  var searchHtml = '<div style="display:flex;gap:8px;margin-bottom:14px;align-items:center;">'
    + '<input id="dl-q" type="text" placeholder="Tim kiem..." value="' + _esc(ST.filter_q) + '" '
    + 'style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:12px;font-family:inherit;">'
    + '<button id="dl-q-btn" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:8px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Tim</button>'
    + '</div>';

  // Timeline entries
  var entries = ST.entries;
  var timelineHtml = '';
  if (!entries.length) {
    timelineHtml = '<div style="text-align:center;padding:48px;color:var(--text3);">'
      + '<div style="font-size:32px;margin-bottom:12px;">&#x1F4C2;</div>'
      + '<div style="font-weight:700;font-size:14px;">Chua co entries</div>'
      + '<div style="font-size:12px;margin-top:6px;">Dung tab "Ghi nhan" de them entry dau tien</div>'
      + '</div>';
  } else {
    // Group by version
    var groups = {};
    var groupOrder = [];
    entries.forEach(function(e) {
      var v = e.version || 'unknown';
      if (!groups[v]) { groups[v] = []; groupOrder.push(v); }
      groups[v].push(e);
    });

    timelineHtml = '<div style="position:relative;">';
    groupOrder.forEach(function(ver) {
      var items = groups[ver];
      timelineHtml += '<div style="margin-bottom:24px;">'
        // Version header
        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
          + '<span style="font-family:monospace;font-weight:900;font-size:14px;color:var(--accent2);'
            + 'background:rgba(79,111,255,.12);border:1px solid rgba(79,111,255,.25);padding:3px 12px;border-radius:6px;">v' + _esc(ver) + '</span>'
          + '<div style="flex:1;height:1px;background:var(--border);"></div>'
          + '<span style="font-size:11px;color:var(--text3);">' + items.length + ' thay doi</span>'
        + '</div>'
        // Items
        + '<div style="display:flex;flex-direction:column;gap:8px;padding-left:4px;">';

      items.forEach(function(entry) {
        var c = C[entry.type] || C.system;
        var icon = TYPE_ICON[entry.type] || '&#x25CF;';
        var label = TYPE_LABEL[entry.type] || entry.type;
        timelineHtml += '<div style="display:flex;gap:12px;padding:12px 14px;background:var(--bg2);'
          + 'border:1px solid var(--border);border-left:3px solid ' + c[2] + ';border-radius:8px;position:relative;">'
          // Type badge
          + '<div style="flex-shrink:0;">'
            + '<span style="background:' + c[0] + ';border:1px solid ' + c[1] + ';color:' + c[2] + ';'
              + 'border-radius:5px;padding:2px 8px;font-size:10px;font-weight:800;">'
              + icon + ' ' + label + '</span>'
          + '</div>'
          // Content
          + '<div style="flex:1;min-width:0;">'
            + '<div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:2px;">' + _esc(entry.title) + '</div>'
            + (entry.body ? '<div style="font-size:11px;color:var(--text3);line-height:1.5;margin-top:4px;">' + _esc(entry.body) + '</div>' : '')
          + '</div>'
          // Meta
          + '<div style="flex-shrink:0;text-align:right;">'
            + '<div style="font-size:10px;color:var(--text3);">' + _fmtAgo(entry.created_at) + '</div>'
            + '<div style="font-size:10px;color:var(--text3);margin-top:2px;">@' + _esc(entry.author) + '</div>'
            + (_isAdmin()
                ? '<button class="dl-del-btn" data-id="' + _esc(entry.id) + '" style="background:none;border:none;color:var(--red);font-size:11px;cursor:pointer;margin-top:4px;opacity:.5;">&#x2715;</button>'
                : '')
          + '</div>'
        + '</div>';
      });

      timelineHtml += '</div></div>';
    });
    timelineHtml += '</div>';
  }

  el.innerHTML = statsHtml + searchHtml + timelineHtml;

  // Filter by type
  el.querySelectorAll('[data-filter-type]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      ST.filter_type = btn.getAttribute('data-filter-type');
      _loadAll(true);
    });
  });

  // Search
  var qBtn = document.getElementById('dl-q-btn');
  var qInp = document.getElementById('dl-q');
  if (qBtn && qInp) {
    qBtn.addEventListener('click', function() {
      ST.filter_q = qInp.value.trim();
      _loadAll(true);
    });
    qInp.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) { ST.filter_q = qInp.value.trim(); _loadAll(true); }
    });
  }

  // Delete buttons
  el.querySelectorAll('.dl-del-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = btn.getAttribute('data-id');
      if (!confirm('Xoa entry ' + id + '?')) return;
      _api()('devlog_delete', { id:id }, function(e, d) {
        if (!e && d && d.ok) { _toast('Da xoa', 'ok'); _loadAll(true); }
        else _toast((d && d.error) || 'Loi xoa', 'error');
      });
    });
  });
}

// ══════════════════════════════════════════════════════════════════
// TAB 2: MASTERPLAN
// ══════════════════════════════════════════════════════════════════
function _renderMasterplan() {
  var el = document.getElementById('dl-body'); if (!el) return;
  var modules = ST.masterplan;

  if (!modules.length) {
    el.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text3);">'
      + '<div style="font-size:32px;">&#x1F4CA;</div>'
      + '<div style="font-weight:700;margin-top:12px;">Chua co du lieu masterplan</div>'
      + '</div>';
    return;
  }

  // Overall progress
  var avg = Math.round(modules.reduce(function(s,m){ return s + m.progress; }, 0) / modules.length);
  var overallColor = avg >= 90 ? 'var(--green)' : avg >= 70 ? 'var(--accent2)' : 'var(--yellow)';

  var html = ''
    // Overall KPI
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:20px;margin-bottom:20px;display:flex;align-items:center;gap:20px;">'
      + '<div style="text-align:center;flex-shrink:0;">'
        + '<div style="font-size:40px;font-weight:900;color:' + overallColor + ';">' + avg + '%</div>'
        + '<div style="font-size:11px;color:var(--text3);margin-top:2px;">Tong tien do</div>'
      + '</div>'
      + '<div style="flex:1;">'
        + '<div style="height:12px;background:var(--bg3);border-radius:6px;overflow:hidden;">'
          + '<div style="height:100%;width:' + avg + '%;background:' + overallColor + ';border-radius:6px;transition:width .6s;"></div>'
        + '</div>'
        + '<div style="display:flex;justify-content:space-between;margin-top:6px;font-size:10px;color:var(--text3);">'
          + '<span>' + modules.length + ' phan he</span>'
          + '<span>ERP v5.14</span>'
        + '</div>'
      + '</div>'
    + '</div>'
    // Module grid
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">';

  modules.forEach(function(m) {
    var pct = Number(m.progress) || 0;
    var color = pct >= 90 ? 'var(--green)' : pct >= 75 ? 'var(--accent2)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';
    var statusLabel = pct >= 95 ? 'Hoan chinh' : pct >= 80 ? 'On dinh' : pct >= 60 ? 'Dang phat trien' : 'Khoi dau';
    var statusBg    = pct >= 95 ? 'rgba(0,214,143,.15)' : pct >= 80 ? 'rgba(79,111,255,.12)' : pct >= 60 ? 'rgba(251,191,36,.12)' : 'rgba(255,77,109,.12)';

    html += '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">'
        + '<div>'
          + '<div style="font-size:13px;font-weight:900;color:var(--text);">' + _esc(m.label) + '</div>'
          + '<div style="font-size:11px;color:var(--text3);margin-top:2px;">' + _esc(m.note || '') + '</div>'
        + '</div>'
        + '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">'
          + '<span style="font-size:18px;font-weight:900;color:' + color + ';">' + pct + '%</span>'
          + '<span style="background:' + statusBg + ';color:' + color + ';border-radius:4px;padding:1px 7px;font-size:9px;font-weight:800;">' + statusLabel + '</span>'
        + '</div>'
      + '</div>'
      + '<div style="height:8px;background:var(--bg3);border-radius:4px;overflow:hidden;margin-bottom:8px;">'
        + '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:4px;transition:width .5s;"></div>'
      + '</div>'
      // Edit button (admin)
      + (_isAdmin() ? '<div style="display:flex;justify-content:flex-end;margin-top:6px;">'
          + '<button class="mp-edit-btn" data-module="' + _esc(m.module) + '" data-pct="' + pct + '" data-label="' + _esc(m.label) + '" data-note="' + _esc(m.note||'') + '" '
          + 'style="background:none;border:none;color:var(--text3);font-size:11px;cursor:pointer;">&#x270F; Sua</button>'
        + '</div>' : '')
      + (m.updated_at ? '<div style="font-size:9px;color:var(--text3);margin-top:4px;">Cap nhat: ' + _fmtAgo(m.updated_at) + '</div>' : '')
    + '</div>';
  });

  html += '</div>';
  el.innerHTML = html;

  // Edit progress buttons
  el.querySelectorAll('.mp-edit-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      _showEditProgressModal(
        btn.getAttribute('data-module'),
        btn.getAttribute('data-label'),
        parseInt(btn.getAttribute('data-pct')),
        btn.getAttribute('data-note')
      );
    });
  });
}

function _showEditProgressModal(module, label, pct, note) {
  var old = document.getElementById('dl-modal');
  if (old && old.parentNode) old.parentNode.removeChild(old);

  var ov = document.createElement('div');
  ov.id = 'dl-modal';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
  ov.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--border2);border-radius:16px;padding:24px;width:380px;max-width:95vw;">'
    + '<div style="font-size:15px;font-weight:900;margin-bottom:16px;">Cap nhat tien do: ' + _esc(label) + '</div>'
    + '<div style="margin-bottom:12px;">'
      + '<label style="display:block;font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:5px;">Tien do (%)</label>'
      + '<input id="mp-pct-inp" type="number" min="0" max="100" value="' + pct + '" '
        + 'style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:14px;font-weight:900;box-sizing:border-box;">'
    + '</div>'
    + '<div style="margin-bottom:16px;">'
      + '<label style="display:block;font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:5px;">Ghi chu</label>'
      + '<input id="mp-note-inp" type="text" value="' + _esc(note) + '" '
        + 'style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:12px;box-sizing:border-box;">'
    + '</div>'
    + '<div style="display:flex;justify-content:flex-end;gap:8px;">'
      + '<button id="mp-cancel" style="background:var(--bg3);border:1px solid var(--border2);color:var(--text2);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Huy</button>'
      + '<button id="mp-save" style="background:rgba(0,214,143,.15);border:1px solid rgba(0,214,143,.3);color:var(--green);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Luu</button>'
    + '</div>'
  + '</div>';

  document.body.appendChild(ov);
  ov.addEventListener('click', function(e){ if (e.target === ov) ov.parentNode.removeChild(ov); });
  document.getElementById('mp-cancel').addEventListener('click', function(){ ov.parentNode.removeChild(ov); });
  document.getElementById('mp-save').addEventListener('click', function() {
    var newPct  = parseInt(document.getElementById('mp-pct-inp').value) || 0;
    var newNote = document.getElementById('mp-note-inp').value.trim();
    var btn = document.getElementById('mp-save'); btn.disabled = true;
    _api()('masterplan_update', { module:module, label:label, progress:newPct, note:newNote }, function(e,d) {
      btn.disabled = false;
      if (!e && d && d.ok) {
        _toast(label + ': ' + newPct + '%', 'ok');
        ov.parentNode.removeChild(ov);
        _loadAll(true);
      } else _toast((d && d.error) || 'Loi luu', 'error');
    });
  });
}

// ══════════════════════════════════════════════════════════════════
// TAB 3: GHI NHAN (admin only)
// ══════════════════════════════════════════════════════════════════
function _renderPushForm() {
  var el = document.getElementById('dl-body'); if (!el) return;
  if (!_isAdmin()) {
    el.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text3);">Chi admin/manager moi co quyen ghi nhan.</div>';
    return;
  }

  var TYPES = ['feature','bugfix','deploy','hotfix','refactor','system','test'];
  var typeOpts = TYPES.map(function(t) {
    return '<option value="' + t + '">' + (TYPE_ICON[t]||'') + ' ' + (TYPE_LABEL[t]||t) + '</option>';
  }).join('');

  el.innerHTML = '<div style="max-width:600px;">'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:20px;">'
      + '<div style="font-size:14px;font-weight:900;margin-bottom:16px;">&#x2795; Ghi nhan thay doi moi</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">'
        + '<div><label style="display:block;font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:5px;">Phien ban *</label>'
          + '<input id="pf-ver" type="text" placeholder="VD: 5.14.1" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:12px;font-family:inherit;box-sizing:border-box;"></div>'
        + '<div><label style="display:block;font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:5px;">Loai *</label>'
          + '<select id="pf-type" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:12px;font-family:inherit;">' + typeOpts + '</select></div>'
      + '</div>'
      + '<div style="margin-bottom:12px;">'
        + '<label style="display:block;font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:5px;">Tieu de *</label>'
        + '<input id="pf-title" type="text" placeholder="Mo ta ngan gon thay doi..." style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:12px;font-family:inherit;box-sizing:border-box;">'
      + '</div>'
      + '<div style="margin-bottom:16px;">'
        + '<label style="display:block;font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;margin-bottom:5px;">Chi tiet (tuy chon)</label>'
        + '<textarea id="pf-body" rows="4" placeholder="Mo ta chi tiet: files thay doi, ly do, cach fix..." style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:12px;font-family:inherit;resize:vertical;box-sizing:border-box;"></textarea>'
      + '</div>'
      + '<div style="display:flex;justify-content:flex-end;">'
        + '<button id="pf-submit" style="background:rgba(79,111,255,.15);border:1px solid rgba(79,111,255,.3);color:var(--accent2);border-radius:8px;padding:10px 20px;font-size:13px;font-weight:900;cursor:pointer;font-family:inherit;">&#x1F680; Ghi nhan</button>'
      + '</div>'
    + '</div>'
    // Preview recent
    + '<div style="margin-top:20px;">'
      + '<div style="font-size:12px;font-weight:800;color:var(--text3);margin-bottom:8px;">5 ENTRY GAN NHAT</div>'
      + '<div id="pf-recent">' + _recentEntries(5) + '</div>'
    + '</div>'
  + '</div>';

  document.getElementById('pf-submit').addEventListener('click', function() {
    var ver   = (document.getElementById('pf-ver').value   || '').trim();
    var type  = (document.getElementById('pf-type').value  || '').trim();
    var title = (document.getElementById('pf-title').value || '').trim();
    var body  = (document.getElementById('pf-body').value  || '').trim();
    if (!ver || !title) { _toast('Nhap phien ban va tieu de', 'error'); return; }
    var btn = document.getElementById('pf-submit');
    btn.disabled = true; btn.textContent = 'Dang ghi...';
    _api()('devlog_push', { version:ver, type:type, title:title, body:body, author:'admin' }, function(e,d) {
      btn.disabled = false; btn.textContent = '&#x1F680; Ghi nhan';
      if (!e && d && d.ok) {
        _toast('Da ghi nhan: ' + title, 'ok');
        document.getElementById('pf-ver').value   = '';
        document.getElementById('pf-title').value = '';
        document.getElementById('pf-body').value  = '';
        _loadAll(true);
      } else _toast((d && d.error) || 'Loi ghi nhan', 'error');
    });
  });
}

function _recentEntries(n) {
  var items = ST.entries.slice(0, n);
  if (!items.length) return '<div style="color:var(--text3);font-size:12px;padding:8px;">Chua co entries.</div>';
  return items.map(function(e) {
    var c = C[e.type] || C.system;
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;margin-bottom:6px;">'
      + '<span style="background:' + c[0] + ';border:1px solid ' + c[1] + ';color:' + c[2] + ';border-radius:4px;padding:1px 7px;font-size:10px;font-weight:800;flex-shrink:0;">'
        + (TYPE_ICON[e.type]||'') + ' ' + (TYPE_LABEL[e.type]||e.type) + '</span>'
      + '<span style="font-size:12px;font-weight:700;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _esc(e.title) + '</span>'
      + '<span style="font-family:monospace;font-size:10px;color:var(--accent2);flex-shrink:0;">v' + _esc(e.version) + '</span>'
      + '<span style="font-size:10px;color:var(--text3);flex-shrink:0;">' + _fmtAgo(e.created_at) + '</span>'
    + '</div>';
  }).join('');
}

// ── Public API: gọi từ module khác ────────────────────────────────
window.skDevlogPush = function(version, type, title, body) {
  var api = typeof window.api === 'function' ? window.api : null;
  if (!api) return;
  api('devlog_push', { version:version, type:type||'system', title:title, body:body||'', author:'system' }, function(){});
};

window.loadDevLog = loadDevLog;
window.loadChangeLog = loadDevLog;

})();
