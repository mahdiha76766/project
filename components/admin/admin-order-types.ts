export type OrderItemRow = {
  quantity: number;
  price: number;
  variantId?: string;
  variantName?: string;
  sku?: string;
  product?: { name?: string; images?: string[]; slug?: string } | string;
};

export type AdminOrderRow = {
  _id: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  trackingCode?: string;
  trackingUrl?: string;
  shippingMethodName?: string;
  invoiceNumber?: string;
  createdAt: string;
  items?: OrderItemRow[];
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    province?: string;
    city?: string;
    postalCode?: string;
    addressLine?: string;
    latitude?: number;
    longitude?: number;
  };
  user?: { _id?: string; name?: string; mobile?: string };
};

export function productName(item: OrderItemRow) {
  const p = item.product;
  const base = !p || typeof p === 'string' ? 'محصول' : p.name || 'محصول';
  return item.variantName ? `${base} — ${item.variantName}` : base;
}

export function productImage(item: OrderItemRow) {
  const p = item.product;
  if (!p || typeof p === 'string') return undefined;
  return p.images?.[0];
}

export function itemCount(order: AdminOrderRow) {
  return order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
}
