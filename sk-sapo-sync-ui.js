// ================================================================
// Sales_SapoSync.gs — SonKhang ERP v5.4.0
// Sapo Realtime Sync:
//   - GAS Time Trigger: sapoAutoSync() chay moi 5 phut
//   - Track last_sync_id de chi lay don moi
//   - Push notification khi co don moi
//   - sapoSetupTrigger() / sapoRemoveTrigger()
//   - sapoGetSyncStatus() cho UI polling
// ================================================================

var SYNC_VERSION = '5.4.0';

// ── Setup / Remove triggers ──────────────────────────────────────
// Chay 1 lan trong GAS Editor: sapoSetupTrigger()
function sapoSetupTrigger() {
  // Xoa trigger cu
  sapoRemoveTrigger();
  // Tao trigger moi: chay moi 5 phut
  ScriptApp.newTrigger('sapoAutoSync')
    .timeBased()
    .everyMinutes(5)
    .create();
  Logger.log('[SapoSync] Trigger created: every 5 minutes');
  return { ok:true, msg:'Trigger da tao: sapoAutoSync() chay moi 5 phut' };
}

function sapoRemoveTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === 'sapoAutoSync') {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });
  Logger.log('[SapoSync] Removed ' + removed + ' triggers');
  return { ok:true, removed:removed };
}

function sapoGetTriggerStatus(body) {
  body = body || {};
  var triggers = ScriptApp.getProjectTriggers();
  var active = triggers.filter(function(t){ return t.getHandlerFunction() === 'sapoAutoSync'; });
  return {
    ok: true,
    trigger_active: active.length > 0,
    trigger_count : active.length,
    msg: active.length > 0 ? 'Auto sync moi 5 phut dang hoat dong' : 'Chua bat auto sync'
  };
}

// ── Core auto sync function (called by trigger) ──────────────────
function sapoAutoSync() {
  var startTime = new Date();
  Logger.log('[sapoAutoSync v'+SYNC_VERSION+'] Start: ' + startTime.toISOString());

  var props    = PropertiesService.getScriptProperties();
  var lastId   = Number(props.getProperty('SAPO_LAST_ORDER_ID') || 0);
  var lastSync = props.getProperty('SAPO_LAST_SYNC_TIME') || '';

  try {
    // Lay don hang moi hon lastId
    var endpoint = '/admin/orders.json?limit=50&since_id=' + lastId;
    var res = _sapoRequest(endpoint, 'get');

    if (!res.ok) {
      Logger.log('[sapoAutoSync] API error: ' + res.error);
      _updateSyncStatus('error', res.error, 0);
      return;
    }

    var orders = res.data.orders || [];
    Logger.log('[sapoAutoSync] Got ' + orders.length + ' new orders since id=' + lastId);

    if (!orders.length) {
      _updateSyncStatus('ok', 'No new orders', 0);
      return;
    }

    // Xu ly tung don
    var synced = 0;
    var maxId  = lastId;
    var newOrders = [];

    orders.forEach(function(o) {
      try {
        var mapped = _mapSapoOrder(o);
        if (!mapped || !mapped.sapo_id) return;
        _upsertSapoOrderToERP(mapped);
        synced++;
        if (Number(o.id) > maxId) maxId = Number(o.id);
        newOrders.push({ id:o.id, code:o.code, khach:mapped.khach_ten, tong:mapped.tong_tt });
      } catch(e2) {
        Logger.log('[sapoAutoSync] Error order ' + o.id + ': ' + e2.message);
      }
    });

    // Cap nhat last sync ID
    if (maxId > lastId) {
      props.setProperty('SAPO_LAST_ORDER_ID', String(maxId));
    }
    props.setProperty('SAPO_LAST_SYNC_TIME', startTime.toISOString());
    props.setProperty('SAPO_LAST_SYNC_COUNT', String(synced));
    props.setProperty('SAPO_PENDING_NOTIFY', JSON.stringify(newOrders));

    Logger.log('[sapoAutoSync] Done: synced=' + synced + ' maxId=' + maxId);
    _updateSyncStatus('ok', 'Synced ' + synced + ' orders', synced);

    // Gui email thong bao neu co don moi
    if (synced > 0) {
      _notifyNewOrders(newOrders);
    }

  } catch(e) {
    Logger.log('[sapoAutoSync] Exception: ' + e.message);
    _updateSyncStatus('error', e.message, 0);
  }
}

function _updateSyncStatus(status, msg, count) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SAPO_SYNC_STATUS', JSON.stringify({
    status  : status,
    msg     : msg,
    count   : count,
    ts      : new Date().toISOString()
  }));
}

// ── API endpoints for UI ─────────────────────────────────────────

// sapoGetSyncStatus — UI poll moi 30s de hien thong bao
function sapoGetSyncStatus(body) {
  body = body || {};
  var props = PropertiesService.getScriptProperties();

  var lastStatus = null;
  try {
    var raw = props.getProperty('SAPO_SYNC_STATUS');
    if (raw) lastStatus = JSON.parse(raw);
  } catch(e) {}

  var pending = [];
  try {
    var pRaw = props.getProperty('SAPO_PENDING_NOTIFY');
    if (pRaw) {
      pending = JSON.parse(pRaw) || [];
      // Xoa pending sau khi da lay
      if (pending.length > 0) {
        props.setProperty('SAPO_PENDING_NOTIFY', '[]');
      }
    }
  } catch(e) {}

  var triggers = ScriptApp.getProjectTriggers();
  var active   = triggers.filter(function(t){ return t.getHandlerFunction() === 'sapoAutoSync'; });

  return {
    ok              : true,
    trigger_active  : active.length > 0,
    last_sync_time  : props.getProperty('SAPO_LAST_SYNC_TIME') || '',
    last_sync_count : Number(props.getProperty('SAPO_LAST_SYNC_COUNT') || 0),
    last_order_id   : Number(props.getProperty('SAPO_LAST_ORDER_ID') || 0),
    status          : lastStatus,
    new_orders      : pending  // don moi chua duoc hien thi
  };
}

// sapoManualSync — Sync ngay khong can doi trigger
function sapoManualSync(body) {
  body = body || {};
  var startTime = new Date();
  var props     = PropertiesService.getScriptProperties();

  // Force sync tat ca neu reset=true
  if (body.reset) {
    props.deleteProperty('SAPO_LAST_ORDER_ID');
    Logger.log('[sapoManualSync] Reset last_order_id');
  }

  sapoAutoSync();

  return {
    ok             : true,
    synced_at      : startTime.toISOString(),
    last_sync_count: Number(props.getProperty('SAPO_LAST_SYNC_COUNT') || 0),
    msg            : 'Sync hoan thanh'
  };
}

// sapoResetSync — Reset ve 0, sync lai tu dau
function sapoResetSync(body) {
  body = body || {};
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty('SAPO_LAST_ORDER_ID');
  props.deleteProperty('SAPO_LAST_SYNC_TIME');
  props.deleteProperty('SAPO_LAST_SYNC_COUNT');
  props.deleteProperty('SAPO_PENDING_NOTIFY');
  props.deleteProperty('SAPO_SYNC_STATUS');
  return { ok:true, msg:'Da reset sync state. Lan sync tiep theo se lay tat ca don.' };
}

// ── Email notification ───────────────────────────────────────────
function _notifyNewOrders(orders) {
  try {
    var ss      = _getSS();
    var cfSheet = ss.getSheetByName('Config') || ss.getSheetByName('CaiDat');
    if (!cfSheet) return;
    var data    = cfSheet.getDataRange().getValues();
    var email   = '';
    for (var i=0;i<data.length;i++) {
      if (String(data[i][0]).trim().toUpperCase() === 'ADMIN_EMAIL') {
        email = String(data[i][1]||'').trim();
        break;
      }
    }
    if (!email || email.indexOf('@') < 0) return;

    var count   = orders.length;
    var subject = '[SonKhang ERP] ' + count + ' don hang moi tu Sapo';
    var body    = 'Da nhan ' + count + ' don hang moi tu Sapo:\n\n';
    orders.forEach(function(o,i) {
      body += (i+1) + '. Don ' + o.code + ' - ' + o.khach + ' - ' + (o.tong||0) + 'd\n';
    });
    body += '\nVao ERP de xu ly: https://erp.sonkhang.vn';

    MailApp.sendEmail({ to:email, subject:subject, body:body });
    Logger.log('[sapoAutoSync] Email sent to ' + email);
  } catch(e) {
    Logger.log('[_notifyNewOrders] ' + e.message);
  }
}

// ── Debug ────────────────────────────────────────────────────────
function sapoSyncDebug(body) {
  body = body || {};
  var props = PropertiesService.getScriptProperties();
  var triggers = ScriptApp.getProjectTriggers();
  var sapoTriggers = triggers.filter(function(t){ return t.getHandlerFunction() === 'sapoAutoSync'; });

  return {
    ok: true,
    sync_version    : SYNC_VERSION,
    trigger_active  : sapoTriggers.length > 0,
    trigger_count   : sapoTriggers.length,
    last_order_id   : props.getProperty('SAPO_LAST_ORDER_ID') || '0',
    last_sync_time  : props.getProperty('SAPO_LAST_SYNC_TIME') || 'never',
    last_sync_count : props.getProperty('SAPO_LAST_SYNC_COUNT') || '0',
    sync_status     : props.getProperty('SAPO_SYNC_STATUS') || 'null',
    sapo_configured : !!(PropertiesService.getScriptProperties().getProperty('SAPO_API_KEY'))
  };
}

// ================================================================
// SAPO PRODUCT SYNC — v5.4.0
// Dong bo san pham tu Sapo vao BangGia + BienThe_SP
// - sapoSyncProductsFull(): full sync tat ca san pham
// - sapoAutoSyncProducts(): sync san pham moi/cap nhat (since_id)
// - _mapSapoProduct(): map fields Sapo → BangGia schema
// - _upsertSapoProductToERP(): upsert vao BangGia + BienThe_SP
// ================================================================

// ── Map Sapo product → BangGia row ───────────────────────────────
function _mapSapoProduct(p) {
  if (!p || !p.id) return null;
  function S(v) { return v === null || v === undefined ? '' : String(v); }
  function N(v) { return isNaN(parseFloat(v)) ? 0 : parseFloat(v); }

  // Lay variant dau tien lam gia chinh
  var v0     = (p.variants || [])[0] || {};
  var giaBan = N(v0.price);
  var giaGoc = N(v0.compare_at_price) || giaBan;
  var giaSi  = giaBan; // Sapo khong co gia si rieng

  // Lay anh chinh
  var anhUrl = '';
  var imgs = p.images || [];
  if (imgs.length) anhUrl = S(imgs[0].src || imgs[0].url || '');

  // Ma vach tu variant dau tien
  var maVach = S(v0.barcode || v0.sku || '');

  // Danh muc tu product_type
  var danhMuc = S(p.product_type || p.category || '');

  return {
    sapo_id    : S(p.id),
    ma_sp      : 'SAPO-' + S(p.id),
    ten_sp     : S(p.name || p.title || ''),
    gia_ban    : giaBan,
    gia_goc    : giaGoc,
    gia_si     : giaSi,
    don_vi     : S(v0.unit || 'cai'),
    loai       : S(p.product_type || ''),
    danh_muc   : danhMuc,
    ton_kho    : N(v0.inventory_quantity),
    mo_ta      : S((p.body_html || p.description || ''))
                   .replace(/<[^>]*>/g, '').substring(0, 300),
    active     : p.status !== 'archived' && p.status !== 'draft',
    anh_url    : anhUrl,
    ma_vach    : maVach,
    variants   : (p.variants || []).map(function(vr) {
      return {
        sapo_variant_id : S(vr.id),
        ten             : S(vr.title || vr.name || ''),
        sku             : S(vr.sku || ''),
        ma_vach         : S(vr.barcode || ''),
        gia_ban         : N(vr.price),
        gia_goc         : N(vr.compare_at_price) || N(vr.price),
        ton_kho         : N(vr.inventory_quantity),
        thuoc_tinh      : _parseVariantOptions(p, vr),
        anh_url         : ''
      };
    })
  };
}

// Parse option1/option2/option3 thành object {Mau: 'Do', Size: 'M'}
function _parseVariantOptions(product, variant) {
  var result = {};
  var opts = product.options || [];
  if (variant.option1 && opts[0]) result[S(opts[0].name)] = S(variant.option1);
  if (variant.option2 && opts[1]) result[S(opts[1].name)] = S(variant.option2);
  if (variant.option3 && opts[2]) result[S(opts[2].name)] = S(variant.option3);
  function S(v) { return v === null || v === undefined ? '' : String(v); }
  return result;
}

// ── Upsert vào BangGia + BienThe_SP ─────────────────────────────
function _upsertSapoProductToERP(product) {
  if (!product || !product.sapo_id) return { ok:false, error:'Invalid product' };
  try {
    var ss      = _getSS();
    var bgSheet = ss.getSheetByName('BangGia');
    var btSheet = ss.getSheetByName('BienThe_SP');
    if (!bgSheet) return { ok:false, error:'Sheet BangGia khong ton tai' };

    var now      = new Date();
    var bgData   = bgSheet.getDataRange().getValues();
    var maSP     = product.ma_sp;
    var foundRow = -1;
    var existId  = '';

    // Tim SP cu theo ma_sp (col 1)
    for (var i = 1; i < bgData.length; i++) {
      if (String(bgData[i][1]) === maSP) {
        foundRow = i + 1;
        existId  = String(bgData[i][0]);
        break;
      }
    }

    var spId = existId || maSP;

    // Col order: ID(0) MA_SP(1) TEN_SP(2) GIA_BAN(3) GIA_GOC(4) GIA_SI(5)
    //            DON_VI(6) LOAI(7) DANH_MUC(8) TON_KHO(9) MO_TA(10) ACTIVE(11)
    //            ANH_URL(12) THUONG_HIEU(13) MA_VACH(14) CO_BIEN_THE(15) UPDATED(16)
    var hasVariants = product.variants && product.variants.length > 1;
    var row = [
      spId,
      maSP,
      product.ten_sp,
      product.gia_ban,
      product.gia_goc,
      product.gia_si,
      product.don_vi,
      product.loai,
      product.danh_muc,
      product.ton_kho,
      product.mo_ta,
      product.active ? 'TRUE' : 'FALSE',
      product.anh_url,
      '',              // THUONG_HIEU - bo trong, khong tu Sapo
      product.ma_vach,
      hasVariants ? 'TRUE' : 'FALSE',
      now
    ];

    if (foundRow > 0) {
      bgSheet.getRange(foundRow, 1, 1, row.length).setValues([row]);
    } else {
      bgSheet.appendRow(row);
    }

    // Sync bien the neu co (chi sync khi > 1 bien the, vi 1 variant = san pham don)
    if (btSheet && hasVariants) {
      _syncProductVariants(btSheet, spId, product.variants, now);
    }

    return { ok:true, id:spId, action: foundRow > 0 ? 'updated' : 'created' };
  } catch(e) {
    Logger.log('[_upsertSapoProductToERP] ' + e.message);
    return { ok:false, error:e.message };
  }
}

function _syncProductVariants(btSheet, spId, variants, now) {
  var btData = btSheet.getDataRange().getValues();
  // Build map variant_id → row index
  var variantMap = {};
  for (var i = 1; i < btData.length; i++) {
    // Col 1 = SP_CHA_ID, check cả sapo variant id trong col 13 (extra)
    if (String(btData[i][1]) === spId) {
      var skuKey = String(btData[i][3]); // SKU = Sapo variant ID stored as SKU
      variantMap[skuKey] = i + 1;
    }
  }

  variants.forEach(function(vr) {
    var sku     = vr.sku || ('SAPO-VR-' + vr.sapo_variant_id);
    var btRow   = [
      spId + '-' + vr.sapo_variant_id,  // ID
      spId,                              // SP_CHA_ID
      vr.ten || 'Mac dinh',             // TEN
      sku,                               // SKU
      JSON.stringify(vr.thuoc_tinh),    // THUOC_TINH_JSON
      vr.gia_ban,                        // GIA_BAN
      vr.gia_goc,                        // GIA_GOC
      0,                                 // GIA_SI
      vr.ton_kho,                        // TON_KHO
      vr.ma_vach,                        // MA_VACH
      vr.anh_url,                        // ANH_URL
      'TRUE',                            // ACTIVE
      now                                // UPDATED
    ];

    var existRow = variantMap[sku];
    if (existRow) {
      btSheet.getRange(existRow, 1, 1, btRow.length).setValues([btRow]);
    } else {
      btSheet.appendRow(btRow);
    }
  });
}

// ── Full sync tất cả sản phẩm từ Sapo ───────────────────────────
function sapoSyncProductsFull(body) {
  body = body || {};
  var cfg = _getSapoConfig();
  if (!cfg.api_key || !cfg.base_url) {
    return { ok:false, error:'Chua cau hinh Sapo - chay sapoInitConfig()' };
  }

  // Ensure sheets ton tai
  try { ensureProductSheets(); } catch(e2) {
    Logger.log('[sapoSyncProductsFull] ensureProductSheets: ' + e2.message);
  }

  var page = 1, created = 0, updated = 0, errors = 0, dbg = [];
  Logger.log('[sapoSyncProductsFull] Start - base_url:' + cfg.base_url);

  while (true) {
    var res = _sapoRequest('/admin/products.json?limit=50&page=' + page, 'get');
    if (!res.ok) {
      errors++;
      dbg.push({ page:page, error:res.error });
      if (res.code === 429) { Utilities.sleep(3000); continue; }
      if (errors >= 3) break;
      Utilities.sleep(1000); continue;
    }

    var products = res.data.products || [];
    dbg.push({ page:page, count:products.length });
    Logger.log('[sapoSyncProductsFull] Page ' + page + ': ' + products.length + ' products');
    if (!products.length) break;

    products.forEach(function(p) {
      try {
        var mapped = _mapSapoProduct(p);
        if (!mapped) return;
        var r = _upsertSapoProductToERP(mapped);
        if (r.ok) {
          if (r.action === 'created') created++;
          else updated++;
        } else {
          errors++;
          Logger.log('[sapoSyncProductsFull] upsert error: ' + r.error);
        }
      } catch(e2) {
        errors++;
        Logger.log('[sapoSyncProductsFull] err: ' + e2.message);
      }
    });

    if (products.length < 50) break;
    page++;
    if (page > 100) break;
    Utilities.sleep(400);
  }

  // Cap nhat last sync time
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SAPO_LAST_PRODUCT_SYNC', new Date().toISOString());
  props.setProperty('SAPO_LAST_PRODUCT_COUNT', String(created + updated));

  Logger.log('[sapoSyncProductsFull] Done: created=' + created + ' updated=' + updated + ' errors=' + errors);
  return {
    ok      : true,
    created : created,
    updated : updated,
    errors  : errors,
    pages   : page,
    debug   : dbg,
    msg     : 'Dong bo ' + (created + updated) + ' san pham'
              + (created ? ' (' + created + ' moi' : '')
              + (updated ? (created ? ', ' : ' (') + updated + ' cap nhat' : '')
              + ((created || updated) ? ')' : '')
  };
}

// ── Auto sync products trong trigger ────────────────────────────
// Goi cung cap trigger sapoAutoSync neu muon sync ca san pham
function sapoAutoSyncProducts() {
  var props   = PropertiesService.getScriptProperties();
  var lastRaw = props.getProperty('SAPO_LAST_PRODUCT_SYNC') || '';
  var last    = lastRaw ? new Date(lastRaw) : new Date(0);
  var now     = new Date();

  // Chi sync san pham moi 6 gio (san pham it thay doi hon don hang)
  if ((now - last) < 6 * 3600 * 1000) {
    Logger.log('[sapoAutoSyncProducts] Skip - last sync: ' + lastRaw);
    return { ok:true, skipped:true, next_sync_in_hours: 6 };
  }

  Logger.log('[sapoAutoSyncProducts] Running full product sync...');
  return sapoSyncProductsFull({});
}

// ── Endpoint cho UI ──────────────────────────────────────────────
function sapoGetProductSyncStatus(body) {
  body = body || {};
  var props = PropertiesService.getScriptProperties();
  return {
    ok                   : true,
    last_sync_time       : props.getProperty('SAPO_LAST_PRODUCT_SYNC') || '',
    last_sync_count      : Number(props.getProperty('SAPO_LAST_PRODUCT_COUNT') || 0),
    trigger_active       : ScriptApp.getProjectTriggers()
                             .some(function(t){ return t.getHandlerFunction() === 'sapoAutoSync'; })
  };
}
