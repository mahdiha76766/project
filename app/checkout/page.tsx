'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronDown,
  Landmark,
  MapPin,
  Mail,
  Package,
  Truck,
  Zap,
  Wallet,
  StickyNote
} from 'lucide-react';
import { OrderSummaryPanel, type CheckoutQuote } from '@/components/shop/checkout/OrderSummaryPanel';
import { CardToCardPaymentPanel } from '@/components/shop/checkout/CardToCardPaymentPanel';
import { formatDashCurrency } from '@/lib/dashboard/formats';
import { addressDisplayTitle, formatAddressOption, truncateAddress } from '@/lib/dashboard/address-schema';

type PayMethod = 'wallet' | 'card_to_card';

type BankInfo = {
  enabled: boolean;
  cardNumber: string;
  accountNumber: string;
  accountHolder: string;
  bankName: string;
  instructions: string;
};

type ShippingMethod = {
  _id: string;
  code: string;
  name: string;
  baseCost: number;
  costPerKg?: number;
  estimatedDays?: number;
  allowShippingOnDelivery?: boolean;
};

type CartItem = {
  product: { _id: string; name: string; price: number; discountPrice?: number };
  variantId?: string;
  variantName?: string;
  unitPrice?: number;
  quantity: number;
};

type SavedAddress = {
  _id: string;
  title?: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  postalCode: string;
  addressLine: string;
  plaque?: string;
  unit?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
};

const SHIPPING_ICONS: Record<string, typeof Truck> = {
  POST: Mail,
  TIPAX: Truck,
  SNAPP: Zap
};

const MANUAL_ADDRESS = '__manual__';

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [wallet, setWallet] = useState({ availableBalance: 0, blockedBalance: 0 });
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    province: '',
    city: '',
    postalCode: '',
    addressLine: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  });
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [shippingMethodId, setShippingMethodId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [method, setMethod] = useState<PayMethod>('card_to_card');
  const [useWalletBalance, setUseWalletBalance] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedMethod = useMemo(
    () => shippingMethods.find((m) => String(m._id) === shippingMethodId),
    [shippingMethods, shippingMethodId]
  );

  const courierPaidShipping = Boolean(
    selectedMethod?.allowShippingOnDelivery && selectedMethod?.code !== 'POST'
  );

  useEffect(() => {
    void Promise.all([
      fetch('/api/cart').then((r) => r.json()),
      fetch('/api/shipping/methods').then((r) => r.json()),
      fetch('/api/wallet').then((r) => r.json()).catch(() => ({ wallet: { availableBalance: 0, blockedBalance: 0 } })),
      fetch('/api/dashboard/addresses').then((r) => r.json()).catch(() => ({ items: [] })),
      fetch('/api/card-to-card/info').then((r) => r.json()).catch(() => null)
    ]).then(([cart, shipping, walletRes, addrRes, bank]) => {
      setCartItems(cart.items || []);
      const methods = shipping.methods || [];
      setShippingMethods(methods);
      if (methods[0]) setShippingMethodId(String(methods[0]._id));
      if (walletRes.wallet) setWallet(walletRes.wallet);
      const addresses: SavedAddress[] = addrRes.items || [];
      setSavedAddresses(addresses);
      setUseManualAddress(addresses.length === 0);
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
        setAddress({
          fullName: defaultAddr.recipientName,
          phone: defaultAddr.phone,
          province: defaultAddr.province,
          city: defaultAddr.city,
          postalCode: defaultAddr.postalCode,
          addressLine: [defaultAddr.addressLine, defaultAddr.plaque ? `پلاک ${defaultAddr.plaque}` : '', defaultAddr.unit ? `واحد ${defaultAddr.unit}` : '']
            .filter(Boolean)
            .join('، '),
          latitude: defaultAddr.latitude,
          longitude: defaultAddr.longitude
        });
      }
      if (bank) setBankInfo(bank);
    });
  }, []);

  const loadQuote = async (coupon = appliedCoupon) => {
    if (!shippingMethodId || !cartItems.length) return;
    setQuoteLoading(true);
    try {
      const res = await fetch('/api/checkout/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingMethodId, couponCode: coupon })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'خطا در محاسبه');
      setQuote({
        subtotal: d.subtotal,
        shippingCost: d.shippingCost,
        shippingPayableNow: d.shippingPayableNow,
        shippingDueOnDelivery: d.shippingDueOnDelivery,
        shippingPaymentTiming: d.shippingPaymentTiming,
        courierPaidShipping: d.courierPaidShipping,
        discount: d.discount,
        total: d.total,
        shippingMethod: d.shippingMethod
      });
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در محاسبه');
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    void loadQuote();
  }, [shippingMethodId, appliedCoupon, cartItems.length]);

  const applyCoupon = () => {
    setAppliedCoupon(couponCode.trim());
  };

  const applyAddress = (addr: SavedAddress) => {
    setUseManualAddress(false);
    setSelectedAddressId(addr._id);
    setAddress({
      fullName: addr.recipientName,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      postalCode: addr.postalCode,
      addressLine: [addr.addressLine, addr.plaque ? `پلاک ${addr.plaque}` : '', addr.unit ? `واحد ${addr.unit}` : '']
        .filter(Boolean)
        .join('، '),
      latitude: addr.latitude,
      longitude: addr.longitude
    });
  };

  const handleAddressSelect = (value: string) => {
    if (value === MANUAL_ADDRESS) {
      setUseManualAddress(true);
      setSelectedAddressId('');
      return;
    }
    const addr = savedAddresses.find((a) => a._id === value);
    if (addr) applyAddress(addr);
  };

  const selectedSavedAddress = savedAddresses.find((a) => a._id === selectedAddressId);

  const submit = async () => {
    if (!address.fullName || !address.phone || !address.addressLine) {
      setError('لطفاً آدرس تحویل را کامل وارد کنید.');
      return;
    }
    if (method === 'card_to_card' && !receiptFile) {
      setError('لطفاً تصویر رسید کارت به کارت را بارگذاری کنید.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: { ...address, note: orderNote.trim() || undefined },
          shippingMethodId,
          couponCode: appliedCoupon,
          paymentTiming: 'ONLINE',
          payMethod: method
        })
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutData.error || 'خطا در checkout');

      if (method === 'card_to_card') {
        const fd = new FormData();
        fd.append('file', receiptFile!);
        fd.append('invoiceNumber', checkoutData.invoiceNumber);
        fd.append('type', 'order');
        fd.append('useWallet', useWalletBalance ? 'true' : 'false');
        const receiptRes = await fetch('/api/payment/receipt', { method: 'POST', body: fd });
        const receiptData = await receiptRes.json();
        if (!receiptRes.ok) throw new Error(receiptData.error || 'خطا در ثبت رسید');
        router.push(`/dashboard/orders/${checkoutData.orderId}?receipt=pending`);
        return;
      }

      const payRes = await fetch('/api/payment/invoice/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `checkout-${checkoutData.invoiceNumber}` },
        body: JSON.stringify({ invoiceNumber: checkoutData.invoiceNumber, method: 'wallet' })
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error || 'خطا در پرداخت');

      router.push(`/payment/result?invoiceNumber=${checkoutData.invoiceNumber}&status=paid`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  const walletDeduction = useWalletBalance ? Math.min(quote?.total || 0, wallet.availableBalance) : 0;
  const payableC2CAmount = Math.max(0, (quote?.total || 0) - walletDeduction);

  if (!cartItems.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Package className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-4 text-slate-500">سبد خرید شما خالی است.</p>
        <Link href="/" className="mt-4 inline-block font-bold text-amber-700">
          مشاهده محصولات
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">تسویه حساب</h1>
          <p className="mt-1 text-sm text-slate-500">سفارش خود را نهایی و پرداخت کنید</p>
        </div>
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-amber-300"
        >
          <ArrowLeft className="h-4 w-4" />
          بازگشت به سبد
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-600" />
              <h2 className="font-black text-slate-900">آدرس تحویل</h2>
            </div>

            {savedAddresses.length > 0 ? (
              <div className="relative mt-4">
                <select
                  value={useManualAddress ? MANUAL_ADDRESS : selectedAddressId}
                  onChange={(e) => handleAddressSelect(e.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pl-10 text-sm font-bold text-slate-800 outline-none focus:border-amber-500"
                >
                  {savedAddresses.map((addr) => (
                    <option key={addr._id} value={addr._id}>
                      {formatAddressOption(addr)}
                    </option>
                  ))}
                  <option value={MANUAL_ADDRESS}>+ وارد کردن آدرس جدید</option>
                </select>
                <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            ) : null}

            {!useManualAddress && selectedSavedAddress ? (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                <p className="font-bold text-slate-800">{addressDisplayTitle(selectedSavedAddress)}</p>
                <p>گیرنده: {selectedSavedAddress.recipientName} · {selectedSavedAddress.phone}</p>
                <p>{truncateAddress(selectedSavedAddress.addressLine, 80)}</p>
                <p>{selectedSavedAddress.city}، {selectedSavedAddress.province} · کدپستی {selectedSavedAddress.postalCode}</p>
              </div>
            ) : null}

            {savedAddresses.length === 0 || useManualAddress ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  ['fullName', 'نام گیرنده'],
                  ['phone', 'موبایل'],
                  ['province', 'استان'],
                  ['city', 'شهر'],
                  ['postalCode', 'کد پستی'],
                  ['addressLine', 'آدرس کامل']
                ].map(([key, label]) => (
                  <input
                    key={key}
                    placeholder={label}
                    value={address[key as keyof typeof address]}
                    onChange={(e) => {
                      setSelectedAddressId('');
                      setUseManualAddress(true);
                      setAddress({ ...address, [key]: e.target.value });
                    }}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-amber-500"
                  />
                ))}
              </div>
            ) : null}

            <Link href="/dashboard/addresses" className="mt-3 inline-block text-xs font-bold text-amber-700">
              مدیریت آدرس‌های ذخیره‌شده
            </Link>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-amber-600" />
              <h2 className="font-black text-slate-900">روش ارسال</h2>
            </div>
            <div className="mt-4 space-y-3">
              {shippingMethods.map((m) => {
                const Icon = SHIPPING_ICONS[m.code] || Truck;
                const selected = shippingMethodId === String(m._id);
                const courierPaid = Boolean(m.allowShippingOnDelivery && m.code !== 'POST');
                return (
                  <label
                    key={String(m._id)}
                    className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 transition ${
                      selected ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-200' : 'border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        className="accent-amber-600"
                        checked={selected}
                        onChange={() => setShippingMethodId(String(m._id))}
                      />
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${selected ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-bold text-slate-800">{m.name}</p>
                        <p className="text-xs text-slate-500">
                          {m.estimatedDays ? `تحویل تقریبی ${m.estimatedDays.toLocaleString('fa-IR')} روز` : 'ارسال استاندارد'}
                        </p>
                        {courierPaid ? (
                          <p className="mt-1 text-[11px] font-bold text-sky-700">هزینه ارسال مستقیماً به پیک پرداخت می‌شود</p>
                        ) : null}
                      </div>
                    </div>
                    {courierPaid ? (
                      <span className="shrink-0 text-xs font-bold text-slate-500">خارج از فاکتور</span>
                    ) : (
                      <span className="shrink-0 text-sm font-black text-slate-800">
                        {formatDashCurrency(m.baseCost)}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {courierPaidShipping ? (
              <p className="mt-4 rounded-xl bg-sky-50 p-3 text-xs leading-6 text-sky-800">
                هزینه ارسال این روش توسط شما مستقیماً به پیک پرداخت می‌شود و در فاکتور فروشگاه لحاظ نمی‌گردد.
              </p>
            ) : selectedMethod?.code === 'POST' ? (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                هزینه ارسال پستی در فاکتور محاسبه و نمایش داده می‌شود.
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-amber-600" />
              <h2 className="font-black text-slate-900">روش پرداخت</h2>
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-700">
                موجودی کیف پول: {formatDashCurrency(wallet.availableBalance)}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {([
                  ['card_to_card', 'کارت به کارت', Landmark],
                  ['wallet', 'کیف پول', Wallet]
                ] as const).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMethod(value)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                      method === value
                        ? 'border-amber-500 bg-white text-amber-900'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {method === 'card_to_card' && wallet.availableBalance > 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={useWalletBalance}
                    onChange={(e) => setUseWalletBalance(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 accent-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-sm">
                    <p className="font-bold text-slate-800">استفاده از موجودی کیف پول</p>
                    <p className="mt-1 text-xs text-slate-500">
                      مایل هستم مبلغ <span className="font-bold text-slate-700">{formatDashCurrency(wallet.availableBalance)}</span> از موجودی کیف پولم کسر شود و مابقی را کارت به کارت کنم.
                    </p>
                  </div>
                </label>
              </div>
            ) : null}

            {method === 'card_to_card' ? (
              useWalletBalance && payableC2CAmount === 0 ? (
                <div className="mt-4 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-900 border border-amber-200">
                  <p className="font-bold mb-1">💡 راهنمایی پرداخت</p>
                  موجودی کیف پول شما کل مبلغ فاکتور را پوشش می‌دهد. نیازی به واریز کارت به کارت نیست! لطفاً روش پرداخت را روی <span className="font-bold text-amber-950">"کیف پول"</span> تنظیم کنید تا تراکنش شما فوراً و خودکار تأیید شود.
                </div>
              ) : (
                <CardToCardPaymentPanel
                  bankInfo={bankInfo}
                  amount={useWalletBalance ? payableC2CAmount : quote?.total}
                  file={receiptFile}
                  onFileSelect={setReceiptFile}
                />
              )
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-amber-600" />
              <h2 className="font-black text-slate-900">یادداشت سفارش (اختیاری)</h2>
            </div>
            <textarea
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="مثلاً: تماس قبل از تحویل، ساعت مناسب و..."
              rows={3}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
          </section>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : null}

          <button
            type="button"
            onClick={submit}
            disabled={loading || quoteLoading}
            className="w-full rounded-xl bg-amber-700 py-4 font-black text-white transition hover:bg-amber-800 disabled:opacity-60"
          >
            {loading ? 'در حال پردازش...' : method === 'card_to_card' ? 'ثبت سفارش و ارسال رسید' : `پرداخت ${quote ? formatDashCurrency(quote.total) : ''}`}
          </button>
        </div>

        <OrderSummaryPanel
          items={cartItems}
          quote={quote}
          couponCode={couponCode}
          onCouponChange={setCouponCode}
          onApplyCoupon={applyCoupon}
          applyingCoupon={quoteLoading}
        />
      </div>
    </main>
  );
}
