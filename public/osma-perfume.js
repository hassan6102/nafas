/* OSMA Perfumes — shared storefront helpers.
   Classic script: exposes window.OsmaPerfume (works on file:// and http). */
(function () {
  'use strict';

  var WA = '201111447123';

  // قيم الداشبورد (عربي) -> نص العرض في الموقع (إنجليزي)
  var EN = {
    gender: { 'رجالي': 'Men', 'حريمي': 'Women', 'للجنسين': 'Unisex' },
    family: { 'خشبي': 'Woody', 'شرقي': 'Oriental', 'زهري': 'Floral', 'حمضي': 'Citrus', 'فواكه': 'Fruity', 'عودي': 'Oud', 'مسكي': 'Musky', 'أروماتيك': 'Aromatic', 'أكواتيك': 'Aquatic', 'جورماند': 'Gourmand', 'جلدي': 'Leather', 'بودري': 'Powdery', 'فريش': 'Fresh' },
    season: { 'صيف': 'Summer', 'شتاء': 'Winter', 'ربيع': 'Spring', 'خريف': 'Autumn' },
    occasion: { 'يومي': 'Daily', 'عمل': 'Office', 'سهرة': 'Evening', 'رسمي': 'Formal', 'رياضي': 'Sport', 'مناسبات': 'Special occasions', 'رومانسي': 'Romantic' },
    type: { 'أصلي': 'Original', 'تستر (Tester)': 'Tester', 'ديكانت (عينة مفصولة)': 'Decant (sample)', 'زيت عطري': 'Perfume oil', 'مستوحى من': 'Inspired by', 'طقم هدايا': 'Gift set' },
    badge: { 'جديد': 'New', 'الأكثر مبيعًا': 'Best seller', 'وصل حديثًا': 'Just arrived', 'نادر': 'Rare', 'عرض خاص': 'Special offer' }
  };

  function strip(s) { return String(s == null ? '' : s).replace(/[\u064B-\u065F\u0670]/g, '').trim(); }
  var DICT = {};
  Object.keys(EN).forEach(function (k) {
    DICT[k] = {};
    Object.keys(EN[k]).forEach(function (a) { DICT[k][strip(a)] = EN[k][a]; });
  });
  function t(kind, v) { return (DICT[kind] && DICT[kind][strip(v)]) || v; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return 'EGP ' + Number(n || 0).toLocaleString('en-US'); }

  // المنتجات المخفية / المسودات ما بتظهرش للعميل
  function isVisible(p) { return !p.status || strip(p.status) === strip('منشور'); }
  function hasBadge(p, name) { return (p.badges || []).some(function (b) { return strip(b) === strip(name); }); }

  function variantsOf(p) {
    if (Array.isArray(p.variants) && p.variants.length) {
      return p.variants.map(function (v) {
        return { size: Number(v.size) || 0, price: Number(v.price) || 0, oldPrice: Number(v.oldPrice) || 0, stock: Math.max(0, Number(v.stock) || 0), sku: v.sku || '' };
      }).sort(function (a, b) { return a.size - b.size; });
    }
    return [{ size: 0, price: Number(p.price) || 0, oldPrice: Number(p.oldPrice) || 0, stock: Math.max(0, Number(p.stock) || 0), sku: '' }];
  }
  function totalStock(p) { return variantsOf(p).reduce(function (s, v) { return s + v.stock; }, 0); }
  function discountPct(v) { return v.oldPrice > v.price ? Math.round((v.oldPrice - v.price) / v.oldPrice * 100) : 0; }
  function bestDiscount(p) { return Math.max.apply(null, variantsOf(p).map(discountPct)); }
  function createdMs(p) { return p.createdAt && p.createdAt.seconds ? p.createdAt.seconds * 1000 : 0; }

  // أرخص حجم متاح (أو أرخص حجم لو الكل نافد)
  function cheapest(p) {
    var vs = variantsOf(p);
    var pool = vs.filter(function (v) { return v.stock > 0; });
    if (!pool.length) pool = vs;
    return pool.reduce(function (m, v) { return v.price < m.price ? v : m; }, pool[0]);
  }
  function sizeRange(p) {
    var s = variantsOf(p).map(function (v) { return v.size; }).filter(Boolean);
    if (!s.length) return '';
    var a = Math.min.apply(null, s), b = Math.max.apply(null, s);
    return a === b ? a + ' ml' : a + ' – ' + b + ' ml';
  }

  function searchText(p) {
    var n = p.notes || {};
    var fam = (p.families || []).map(function (f) { return f + ' ' + t('family', f); });
    return [p.name, p.nameEn, p.brand, p.sku, p.category, p.concentration, p.similarTo]
      .concat(n.top || [], n.middle || [], n.base || [], fam).join(' ').toLowerCase();
  }

  function waLink(p, o) {
    o = o || {};
    var parts = ['أهلاً، عايز أطلب العطر ده: ' + p.name];
    if (p.brand) parts.push('الماركة: ' + p.brand);
    if (o.variant && o.variant.size) parts.push('الحجم: ' + o.variant.size + ' مل');
    if (o.qty) parts.push('العدد: ' + o.qty);
    if (o.variant && o.variant.price) parts.push('السعر: ' + o.variant.price + ' ج.م');
    var sku = (o.variant && o.variant.sku) || p.sku;
    if (sku) parts.push('كود المنتج: ' + sku);
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(parts.join(' - '));
  }

  // كارت المنتج الموحد (الرئيسية + كل المنتجات)
  function cardHtml(p) {
    var out = totalStock(p) === 0;
    var low = cheapest(p);
    var multi = variantsOf(p).length > 1;
    var img = p.imageUrl || p.image || 'assets/img/icon - Copy.png';
    var link = 'product-details.html?id=' + encodeURIComponent(p.id);
    var badges = [];
    if (out) badges.push('<span class="osma-badge osma-badge-out">Sold out</span>');
    else {
      var pct = discountPct(low);
      if (pct) badges.push('<span class="osma-badge osma-badge-sale">-' + pct + '%</span>');
      (p.badges || []).slice(0, 2).forEach(function (b) { badges.push('<span class="osma-badge">' + esc(t('badge', b)) + '</span>'); });
    }
    var price = (multi ? '<small class="osma-from">From</small>' : '') +
      '<span class="current-price">' + money(low.price) + '</span>' +
      (low.oldPrice > low.price ? ' <span class="old-price" style="text-decoration:line-through;color:#999;font-size:14px;margin-left:5px;">' + money(low.oldPrice) + '</span>' : '');
    var meta = [p.concentration, t('gender', p.gender), sizeRange(p)].filter(Boolean).map(esc).join(' · ');
    return '<div class="product-card' + (out ? ' osma-soldout' : '') + '">' +
      '<div class="product-image position-relative">' +
      (badges.length ? '<div class="osma-badges">' + badges.join('') + '</div>' : '') +
      '<img src="' + esc(img) + '" alt="' + esc(p.name) + '" loading="lazy" style="aspect-ratio:1;object-fit:cover;width:100%;">' +
      '<div class="product-overlay"><div class="product-actions">' +
      '<a href="' + link + '" class="action-btn" title="Details"><i class="bi bi-eye"></i></a>' +
      (out ? '' : '<a href="' + waLink(p) + '" target="_blank" rel="noopener" class="action-btn" title="WhatsApp"><i class="bi bi-whatsapp"></i></a>') +
      '</div></div></div>' +
      '<div class="product-details text-center mt-3">' +
      '<div class="product-category" style="color:#666;font-size:.9rem;">' + esc(p.brand || p.category || 'Perfume') + '</div>' +
      '<h5 class="product-title mt-1 mb-1"><a href="' + link + '" style="color:#222;text-decoration:none;font-weight:600;">' + esc(p.name) + '</a></h5>' +
      (meta ? '<div class="osma-card-meta">' + meta + '</div>' : '') +
      '<div class="product-price" style="color:var(--osma-primary);font-weight:700;font-size:1.1rem;">' + price + '</div>' +
      '</div></div>';
  }

  var CSS = '' +
    '.osma-badges{position:absolute;top:10px;left:10px;z-index:3;display:flex;flex-direction:column;gap:6px;align-items:flex-start}' +
    '.osma-badge{background:var(--osma-primary,#8b7355);color:#fff;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;line-height:1.2}' +
    '.osma-badge-sale{background:#b3402a}.osma-badge-out{background:#444}' +
    '.osma-soldout .product-image img{filter:grayscale(.6);opacity:.65}' +
    '.osma-card-meta{color:#777;font-size:.85rem;margin-bottom:6px}' +
    '.osma-from{color:#888;font-size:.8rem;font-weight:400;margin-right:6px}' +
    '.custom-size-btn{border:1px solid #ccc;background:#fff;color:#333;padding:8px 18px;border-radius:20px;font-weight:600;transition:all .2s;display:flex;flex-direction:column;align-items:center;line-height:1.25;min-width:92px;cursor:pointer}' +
    '.custom-size-btn small{font-weight:400;font-size:.75rem;color:#888}' +
    '.custom-size-btn:hover:not(:disabled){border-color:var(--osma-primary);color:var(--osma-primary)}' +
    '.custom-size-btn.active{background:var(--osma-primary);border-color:var(--osma-primary);color:#fff;box-shadow:0 4px 10px rgba(139,115,85,.3)}' +
    '.custom-size-btn.active small{color:rgba(255,255,255,.85)}' +
    '.custom-size-btn:disabled{opacity:.45;cursor:not-allowed;text-decoration:line-through}' +
    '.osma-tags{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 4px}' +
    '.osma-tag{border:1px solid rgba(139,115,85,.35);color:var(--osma-primary);padding:3px 12px;border-radius:20px;font-size:.85rem;background:#fff}' +
    '.osma-tag-solid{background:var(--osma-primary);color:#fff;border-color:var(--osma-primary)}' +
    '.osma-profile{margin:22px 0;padding:18px 20px;background:#fff;border-radius:14px;border:1px solid rgba(139,115,85,.15)}' +
    '.osma-profile h6{color:var(--osma-primary);font-weight:700;margin:0 0 10px}' +
    '.osma-pyramid-row{display:flex;gap:12px;align-items:baseline;padding:8px 0;border-bottom:1px dashed #eee}' +
    '.osma-pyramid-row:last-child{border-bottom:0}' +
    '.osma-pyramid-label{width:74px;flex:none;font-weight:700;color:var(--osma-primary);font-size:.9rem}' +
    '.osma-note{display:inline-block;background:var(--osma-bg,#f8f6f0);padding:3px 11px;border-radius:14px;font-size:.85rem;margin:2px 4px 2px 0}' +
    '.osma-meter{display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap}' +
    '.osma-meter-label{width:80px;font-weight:600;font-size:.9rem}' +
    '.osma-dots{display:flex;gap:5px}.osma-dot{width:24px;height:8px;border-radius:4px;background:#e6e0d5}.osma-dot.on{background:var(--osma-primary)}' +
    '.osma-meter small{color:#777}' +
    '.osma-summary{background:var(--osma-bg,#f8f6f0);border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:.92rem}' +
    '.osma-summary .row-line{display:flex;justify-content:space-between;gap:10px}.osma-summary .total{font-weight:700;color:var(--osma-primary);border-top:1px dashed #d8cfbf;margin-top:6px;padding-top:6px}';

  function injectStyles() {
    if (document.getElementById('osma-perfume-css')) return;
    var s = document.createElement('style');
    s.id = 'osma-perfume-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  injectStyles();

  window.OsmaPerfume = {
    WA: WA, t: t, esc: esc, strip: strip, money: money, isVisible: isVisible, hasBadge: hasBadge,
    variantsOf: variantsOf, totalStock: totalStock, discountPct: discountPct, bestDiscount: bestDiscount,
    createdMs: createdMs, cheapest: cheapest, sizeRange: sizeRange, searchText: searchText,
    waLink: waLink, cardHtml: cardHtml
  };
})();
