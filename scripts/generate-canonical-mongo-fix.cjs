/**
 * Generates scripts/fix-products-from-canonical.mongodb.js
 * from uploads/_canonical-portal-groups.json (built from reference xlsx).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const groupsPath = path.join(root, 'uploads', '_canonical-portal-groups.json');
const outPath = path.join(root, 'scripts', 'fix-products-from-canonical.mongodb.js');

if (!fs.existsSync(groupsPath)) {
  console.error('Missing', groupsPath, '- run excel extract first');
  process.exit(1);
}

const groups = JSON.parse(fs.readFileSync(groupsPath, 'utf8'));
const groupsLit = JSON.stringify(groups, null, 2);

const script = `/* global use, db, print, printjson */
// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('nedicon1_web');

/**
 * اصلاح محصولات بر اساس فایل مرجع:
 * products_upload_20260728_103435.xlsx
 *
 * - نام / وزن / قیمت دقیقاً مطابق اکسل مرجع
 * - هر source_row = یک محصول جدا (مثلاً دو ردیف روغن کرچک)
 * - حذف واریانت‌های اشتباه مثل ۱۰۰گرم / ۲۰۰گرم
 * - مثال: فلفل قرمز ایرانی + کیلو = ۶۰۰٬۰۰۰ تومان
 *
 * قبل از اجرا از DB بکاپ بگیرید.
 * کل این فایل را در Playground اجرا کنید.
 */

const CANONICAL_GROUPS = ${groupsLit};

function norm(s) {
  return String(s || '')
    .trim()
    .replace(/\\u200c/g, '')
    .replace(/\\s+/g, ' ')
    .toLowerCase();
}

function isJunkWeight(label) {
  const t = norm(label).replace(/\\s+/g, '');
  if (!t) return false;
  // ۱۰۰گرم / ۲۰۰ گرم / 100g / 250گرم و مشابه — در فایل مرجع نیستند
  if (/^(100|200|250|50|150|300|400|500)(گرم|gr|g)$/i.test(t)) return true;
  if (/^(100|200|250|50|150)g$/i.test(t)) return true;
  if (/^\\d{2,4}گرم$/.test(t)) return true;
  return false;
}

const report = {
  updated: [],
  skippedNoMatch: [],
  junkRemoved: [],
  felfelCheck: null
};

const claimedIds = new Set();

for (const group of CANONICAL_GROUPS) {
  const skus = (group.variants || []).map((v) => String(v.sku || '').trim()).filter(Boolean);
  if (!skus.length) continue;

  let product = db.getCollection('products').findOne({
    $or: [{ sku: { $in: skus } }, { 'variants.sku': { $in: skus } }]
  });

  // اگر همین سند قبلاً برای source_row دیگری استفاده شده، محصول جدا لازم است
  if (product && claimedIds.has(String(product._id))) {
    product = null;
  }

  if (!product) {
    const byName = db.getCollection('products').find({ name: group.name }).toArray();
    product = byName.find((p) => !claimedIds.has(String(p._id))) || null;
  }

  if (!product) {
    report.skippedNoMatch.push({
      name: group.name,
      sourceRow: group.sourceRow,
      skus
    });
    continue;
  }

  claimedIds.add(String(product._id));

  const oldVariants = Array.isArray(product.variants) ? product.variants : [];
  const stockBySku = {};
  for (const v of oldVariants) {
    const sku = String(v.sku || '').trim();
    if (sku) stockBySku[sku] = Number(v.stock || 0);
  }

  const nextVariants = (group.variants || []).map((v, i) => {
    const sku = String(v.sku || '').trim();
    const prev = oldVariants.find((x) => String(x.sku || '').trim() === sku) || {};
    const row = {
      name: v.name || 'پیش‌فرض',
      sku,
      price: Number(v.price || 0),
      portalPrice: Number(v.portalPrice != null ? v.portalPrice : v.price || 0),
      hasSitePrice: Boolean(prev.hasSitePrice) || false,
      sitePercent: prev.sitePercent,
      hasWholesale: i === 0 ? Boolean(product.hasWholesale || prev.hasWholesale) : false,
      wholesaleDirection: prev.wholesaleDirection || product.wholesaleDirection || 'less',
      wholesaleMode: prev.wholesaleMode || product.wholesaleMode || 'percent',
      wholesalePercent:
        prev.wholesalePercent != null ? prev.wholesalePercent : product.wholesalePercent,
      wholesaleAmount:
        prev.wholesaleAmount != null ? prev.wholesaleAmount : product.wholesaleAmount,
      wholesaleQty: prev.wholesaleQty || product.wholesaleQty || '',
      stock: stockBySku[sku] != null ? stockBySku[sku] : Number(prev.stock || 0),
      weight: prev.weight,
      weightUnit: prev.weightUnit,
      containerSize: v.containerSize || v.name || '',
      isDefault: i === 0
    };
    if (prev._id) row._id = prev._id;
    return row;
  });

  const primary = nextVariants[0] || {};
  const attrs = Object.assign({}, product.attributes || {}, {
    sourceRow: group.sourceRow || undefined,
    excelSlug: group.slug || undefined,
    source: 'canonical-excel-fix'
  });

  db.getCollection('products').updateOne(
    { _id: product._id },
    {
      $set: {
        name: group.name,
        price: Number(primary.price || 0),
        portalPrice: Number(primary.portalPrice || primary.price || 0),
        sku: primary.sku || product.sku,
        containerSize: primary.containerSize || '',
        variants: nextVariants,
        attributes: attrs,
        updatedAt: new Date()
      }
    }
  );

  report.updated.push({
    _id: String(product._id),
    from: product.name,
    to: group.name,
    sourceRow: group.sourceRow,
    variants: nextVariants.map((v) => ({ sku: v.sku, name: v.name, price: v.price }))
  });
}

// پاک‌سازی واریانت‌های جینک باقی‌مانده (۱۰۰گرم / ۲۰۰گرم / ...)
db.getCollection('products')
  .find({})
  .forEach((product) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (!variants.length) return;
    const kept = variants.filter((v) => !isJunkWeight(v.name) && !isJunkWeight(v.containerSize));
    if (kept.length === variants.length) return;
    if (!kept.length) return;
    if (!kept.some((v) => v.isDefault)) kept[0].isDefault = true;
    const primary = kept.find((v) => v.isDefault) || kept[0];
    db.getCollection('products').updateOne(
      { _id: product._id },
      {
        $set: {
          variants: kept,
          price: Number(primary.price || product.price || 0),
          portalPrice: Number(
            primary.portalPrice != null
              ? primary.portalPrice
              : primary.price || product.portalPrice || 0
          ),
          containerSize: primary.containerSize || primary.name || '',
          updatedAt: new Date()
        }
      }
    );
    report.junkRemoved.push({
      _id: String(product._id),
      name: product.name,
      removed: variants.length - kept.length,
      kept: kept.map((v) => v.name)
    });
  });

// صحت‌سنجی: فلفل قرمز ایرانی باید کیلو = ۶۰۰۰۰۰ باشد
report.felfelCheck = db
  .getCollection('products')
  .find({
    $or: [
      { name: 'فلفل قرمز ایرانی' },
      { sku: 'NS-0318-1' },
      { 'variants.sku': 'NS-0318-1' }
    ]
  })
  .toArray()
  .map((p) => ({
    _id: String(p._id),
    name: p.name,
    price: p.price,
    portalPrice: p.portalPrice,
    variants: (p.variants || []).map((v) => ({
      name: v.name,
      sku: v.sku,
      price: v.price,
      portalPrice: v.portalPrice,
      containerSize: v.containerSize
    }))
  }));

print('========== RESULT ==========');
print('updated:', report.updated.length);
print('skipped (no mongo match):', report.skippedNoMatch.length);
print('junk cleaned products:', report.junkRemoved.length);
print('--- فلفل قرمز ایرانی ---');
printjson(report.felfelCheck);
print('--- sample skipped ---');
printjson(report.skippedNoMatch.slice(0, 20));
print('--- sample junk removed ---');
printjson(report.junkRemoved.slice(0, 20));
`;

fs.writeFileSync(outPath, script, 'utf8');
console.log('wrote', outPath);
console.log('groups', groups.length, 'bytes', script.length);
