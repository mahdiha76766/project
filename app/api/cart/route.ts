import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Cart, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { cartLineKey, findVariant, variantInStock, type ProductLike } from '@/lib/product/variants';
import { cartItemsCount, normalizeCartVariantId, serializeCartItems } from '@/lib/cart/serialize';

function matchCartItem(
  item: { product: { toString: () => string }; variantId?: { toString: () => string } | null },
  productId: string,
  variantId?: string | null
) {
  const sameProduct = String(item.product) === String(productId);
  if (!sameProduct) return false;
  const itemVariant = item.variantId ? String(item.variantId) : '';
  const targetVariant = variantId ? String(variantId) : '';
  return itemVariant === targetVariant;
}

async function loadUserCart(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  return Cart.findOne({ user: userId });
}

async function cartResponse(cart: { items: Parameters<typeof serializeCartItems>[0] } | null) {
  const items = await serializeCartItems(cart?.items ?? []);
  return { items, count: cartItemsCount(items) };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ items: [], count: 0 });
  await connectToDatabase();
  const cart = await loadUserCart(user.userId);
  const { items, count } = await cartResponse(cart);
  return NextResponse.json({ items, count });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });

  try {
    await connectToDatabase();
    const { productId, variantId, quantity = 1, weight, volume } = await req.json();
    const rawProductId = String(productId || '').trim();

    if (!rawProductId || !mongoose.Types.ObjectId.isValid(rawProductId)) {
      return NextResponse.json({ error: 'محصول نامعتبر است' }, { status: 400 });
    }

    const product = (await Product.findById(rawProductId).lean()) as ProductLike | null;
    if (!product?._id) return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });

    const variant = findVariant(product, variantId);
    if (!variant) return NextResponse.json({ error: 'نوع محصول نامعتبر است' }, { status: 400 });
    if (!variantInStock(variant, quantity)) {
      return NextResponse.json({ error: `موجودی «${variant.name}» کافی نیست` }, { status: 400 });
    }

    const canonicalProductId = String(product._id);
    const resolvedVariantId = normalizeCartVariantId(variant);

    let cart = await loadUserCart(user.userId);
    const line = {
      product: canonicalProductId,
      variantId: resolvedVariantId,
      quantity: Math.max(1, Number(quantity) || 1),
      weight,
      volume
    };

    if (!cart) {
      cart = await Cart.create({ user: user.userId, items: [line] });
    } else {
      const existing = cart.items.find((i: Parameters<typeof matchCartItem>[0]) =>
        matchCartItem(i, canonicalProductId, resolvedVariantId)
      );
      if (existing) {
        const nextQty = existing.quantity + line.quantity;
        if (!variantInStock(variant, nextQty)) {
          return NextResponse.json({ error: `موجودی «${variant.name}» کافی نیست` }, { status: 400 });
        }
        existing.quantity = nextQty;
      } else {
        cart.items.push(line);
      }
      await cart.save();
    }

    const fresh = await Cart.findById(cart._id).lean();
    const { items, count } = await cartResponse(fresh as { items: Parameters<typeof serializeCartItems>[0] } | null);

    if (!count) {
      return NextResponse.json({ error: 'افزودن به سبد انجام نشد. لطفاً دوباره تلاش کنید.' }, { status: 500 });
    }

    return NextResponse.json({ items, count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در افزودن به سبد';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });

  try {
    await connectToDatabase();
    const { productId, variantId, quantity } = await req.json();
    if (!productId || !mongoose.Types.ObjectId.isValid(String(productId)) || quantity < 1) {
      return NextResponse.json({ error: 'درخواست نامعتبر است' }, { status: 400 });
    }

    const cart = await loadUserCart(user.userId);
    if (!cart) return NextResponse.json({ error: 'سبد خرید یافت نشد' }, { status: 404 });

    const item = cart.items.find((i: Parameters<typeof matchCartItem>[0]) =>
      matchCartItem(i, String(productId), variantId)
    );
    if (!item) return NextResponse.json({ error: 'قلم سبد یافت نشد' }, { status: 404 });

    const product = (await Product.findById(item.product).lean()) as ProductLike | null;
    if (!product?._id) return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });

    const variant = findVariant(product, variantId || (item.variantId ? String(item.variantId) : undefined));
    if (!variantInStock(variant!, quantity)) {
      return NextResponse.json({ error: `حداکثر موجودی «${variant?.name}» ${variant?.stock} عدد است` }, { status: 400 });
    }

    item.quantity = quantity;
    await cart.save();

    const fresh = await Cart.findById(cart._id).lean();
    const { items, count } = await cartResponse(fresh as { items: Parameters<typeof serializeCartItems>[0] } | null);
    return NextResponse.json({ items, count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در به‌روزرسانی سبد';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });

  await connectToDatabase();
  const { productId, variantId } = await req.json();

  const cart = await loadUserCart(user.userId);
  if (!cart) return NextResponse.json({ ok: true });

  cart.items = cart.items.filter(
    (i: Parameters<typeof matchCartItem>[0]) => !matchCartItem(i, String(productId), variantId)
  );
  await cart.save();
  return NextResponse.json({ ok: true, lineKey: cartLineKey(String(productId), variantId) });
}
