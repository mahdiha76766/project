/**
 * Quick identity tests for price-portal variant keys.
 * Run: node scripts/test-portal-variant-identity.cjs
 */
const assert = require('assert');

function formatVariantLabel(v) {
  if (v.containerSize) return v.containerSize;
  return v.name || 'پیش‌فرض';
}

function resolvePortalVariantKey(productId, variant, index = 0) {
  if (variant._id) return String(variant._id);
  const sku = String(variant.sku || '').trim();
  if (sku) return `sku:${sku}`;
  const label = formatVariantLabel({
    name: variant.name || 'پیش‌فرض',
    containerSize: variant.containerSize
  });
  return `idx:${productId}:${index}:${label}`;
}

function rowKey(row) {
  if (row.variantId) return `${row.productId}:${row.variantId}`;
  if (row.variantSku) return `${row.productId}:sku:${row.variantSku}`;
  if (row.variantLabel) return `${row.productId}:label:${row.variantLabel}`;
  return `${row.productId}:base`;
}

const productId = 'prod1';
const half = { sku: 'NS-0133-2', name: 'نیم لیتر', containerSize: 'نیم لیتر' };
const liter = { sku: 'NS-0134-2', name: '1لیتر', containerSize: '1لیتر' };

const keyHalf = resolvePortalVariantKey(productId, half, 0);
const keyLiter = resolvePortalVariantKey(productId, liter, 1);

assert.notStrictEqual(keyHalf, keyLiter, 'keys must differ for half vs liter');
assert.strictEqual(keyHalf, 'sku:NS-0133-2');
assert.strictEqual(keyLiter, 'sku:NS-0134-2');

const rowHalf = {
  productId,
  variantId: keyHalf,
  variantSku: half.sku,
  variantLabel: 'نیم لیتر'
};
const rowLiter = {
  productId,
  variantId: keyLiter,
  variantSku: liter.sku,
  variantLabel: '1لیتر'
};

assert.notStrictEqual(rowKey(rowHalf), rowKey(rowLiter), 'draft keys must not collide');

// legacy bug: both null variantId → same base key
const buggyHalf = rowKey({ productId, variantId: null });
const buggyLiter = rowKey({ productId, variantId: null });
assert.strictEqual(buggyHalf, buggyLiter, 'documents the old bug');

// with sku fallback even if variantId null
assert.notStrictEqual(
  rowKey({ productId, variantId: null, variantSku: half.sku }),
  rowKey({ productId, variantId: null, variantSku: liter.sku })
);

console.log('ok: portal variant identity tests passed');
