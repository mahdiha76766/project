'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, History, Loader2, LogOut, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { MathCaptcha, type CaptchaValue } from '@/components/security/MathCaptcha';
import { AddProductModal } from '@/components/price-portal/AddProductModal';
import { PriceHistoryModal, type HistoryTarget } from '@/components/price-portal/PriceHistoryModal';
import { computeSitePrice } from '@/lib/price-portal/site-price';
import {
  computeWholesalePrice,
  type WholesaleDirection,
  type WholesaleMode
} from '@/lib/price-portal/wholesale';
import { coercePriceToman } from '@/lib/shop/price-currency';

type PortalRow = {
  productId: string;
  variantId: string | null;
  productName: string;
  variantLabel: string;
  variantSku?: string;
  sizeAmount: number | null;
  price: number;
  sitePrice: number;
  hasSitePrice: boolean;
  sitePercent: number | null;
  hasWholesale: boolean;
  wholesaleDirection: WholesaleDirection;
  wholesaleMode: WholesaleMode;
  wholesalePercent: number | null;
  wholesaleAmount: number | null;
  wholesaleQty: string;
  wholesalePrice: number | null;
  discountPrice: number | null;
  inStock: boolean;
  isDefault: boolean;
};

type RowDraft = {
  price: string;
  discountPrice: string;
  hasSitePrice: boolean;
  sitePercent: string;
  hasWholesale: boolean;
  wholesaleDirection: WholesaleDirection;
  wholesaleMode: WholesaleMode;
  wholesalePercent: string;
  wholesaleAmount: string;
  wholesaleQty: string;
  applyProportional: boolean;
  inStock: boolean;
  saving: boolean;
  saved: boolean;
  error: string;
  showDiscount: boolean;
};

function rowKey(row: {
  productId: string;
  variantId: string | null;
  variantSku?: string;
  variantLabel?: string;
}) {
  // هرگز به 'base' مشترک برای چند واریانت برنگرد — باعث قاطی قیمت لحظه‌ای می‌شود
  if (row.variantId) return `${row.productId}:${row.variantId}`;
  if (row.variantSku) return `${row.productId}:sku:${row.variantSku}`;
  if (row.variantLabel) return `${row.productId}:label:${row.variantLabel}`;
  return `${row.productId}:base`;
}

function formatFa(n: number) {
  return n.toLocaleString('fa-IR');
}

function PriceText({
  value,
  className = ''
}: {
  value: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`} dir="rtl">
      <span className="tabular-nums" dir="ltr">
        {formatFa(value)}
      </span>
      <span>تومان</span>
    </span>
  );
}

function parseDigits(value: string) {
  return value.replace(/[^\d]/g, '');
}

function MiniCheck({
  checked,
  onChange,
  label,
  activeClass = 'border-neutral-900 bg-neutral-900'
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  activeClass?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 select-none">
      <span
        className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
          checked ? activeClass : 'border-neutral-300 bg-white'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
          aria-label={label}
        />
        {checked ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} aria-hidden /> : null}
      </span>
      <span className="text-[11px] font-medium text-neutral-700">{label}</span>
    </label>
  );
}

export function PricePortalClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: '', answer: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [items, setItems] = useState<PortalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [historyTarget, setHistoryTarget] = useState<HistoryTarget | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    productId: string;
    productName: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const initDrafts = useCallback((rows: PortalRow[]) => {
    const next: Record<string, RowDraft> = {};
    for (const row of rows) {
      const key = rowKey(row);
      next[key] = {
        price: String(row.price || 0),
        discountPrice: row.discountPrice ? String(row.discountPrice) : '',
        hasSitePrice: Boolean(row.hasSitePrice),
        sitePercent: row.sitePercent ? String(row.sitePercent) : '',
        hasWholesale: Boolean(row.hasWholesale),
        wholesaleDirection: row.wholesaleDirection === 'more' ? 'more' : 'less',
        wholesaleMode: row.wholesaleMode === 'amount' ? 'amount' : 'percent',
        wholesalePercent: row.wholesalePercent ? String(row.wholesalePercent) : '',
        wholesaleAmount: row.wholesaleAmount != null ? String(row.wholesaleAmount) : '',
        wholesaleQty: row.wholesaleQty || '',
        applyProportional: false,
        inStock: Boolean(row.inStock),
        saving: false,
        saved: false,
        error: '',
        showDiscount: Boolean(row.discountPrice)
      };
    }
    setDrafts(next);
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/price-portal/products', { credentials: 'same-origin' });
    setLoading(false);
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items || []);
    setAuthed(true);
    initDrafts(data.items || []);
  }, [initDrafts]);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/price-portal/auth', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        if (data.authed) {
          await loadProducts();
          return;
        }
      }
      setAuthed(false);
    })();
  }, [loadProducts]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    const res = await fetch('/api/price-portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ password, captchaToken: captcha.token, captchaAnswer: captcha.answer })
    });
    const data = await res.json().catch(() => ({}));
    setLoginLoading(false);
    if (!res.ok) {
      setLoginError(data.error || 'ورود ناموفق بود');
      return;
    }
    setPassword('');
    void loadProducts();
  };

  const logout = async () => {
    await fetch('/api/price-portal/auth', { method: 'DELETE', credentials: 'same-origin' });
    setAuthed(false);
    setItems([]);
    setDrafts({});
  };

  const saveRow = async (row: PortalRow) => {
    const key = rowKey(row);
    const draft = drafts[key];
    if (!draft) return;

    // خالی / نامعتبر / علامت → ۰ (در اکسل هم ۰ ذخیره می‌شود)
    const price = coercePriceToman(draft.price);
    const discountPrice = draft.discountPrice.trim()
      ? coercePriceToman(draft.discountPrice)
      : null;
    const sitePercent = draft.hasSitePrice ? Number(draft.sitePercent) : null;
    const wholesalePercent = draft.hasWholesale ? Number(draft.wholesalePercent) : null;
    const wholesaleAmount = draft.hasWholesale
      ? coercePriceToman(draft.wholesaleAmount)
      : null;
    const wholesaleMode: WholesaleMode = draft.wholesaleMode === 'amount' ? 'amount' : 'percent';

    if (price < 0) {
      setDrafts((prev) => ({ ...prev, [key]: { ...draft, error: 'قیمت نامعتبر است' } }));
      return;
    }
    if (draft.hasSitePrice) {
      if (!Number.isFinite(sitePercent!) || sitePercent! < 1 || sitePercent! > 100) {
        setDrafts((prev) => ({
          ...prev,
          [key]: { ...draft, error: 'درصد تفاوت باید بین ۱ تا ۱۰۰ باشد' }
        }));
        return;
      }
    }
    if (draft.hasWholesale) {
      if (wholesaleMode === 'percent') {
        if (!Number.isFinite(wholesalePercent!) || wholesalePercent! < 1 || wholesalePercent! > 100) {
          setDrafts((prev) => ({
            ...prev,
            [key]: { ...draft, error: 'درصد قیمت عمده باید بین ۱ تا ۱۰۰ باشد' }
          }));
          return;
        }
      } else if (!Number.isFinite(wholesaleAmount!) || wholesaleAmount! < 0) {
        setDrafts((prev) => ({
          ...prev,
          [key]: { ...draft, error: 'مبلغ تغییر عمده نامعتبر است' }
        }));
        return;
      }
    }

    const wholesaleQtyValue = draft.hasWholesale
      ? draft.wholesaleQty.trim() || row.variantLabel || ''
      : '';

    setDrafts((prev) => ({ ...prev, [key]: { ...draft, saving: true, error: '', saved: false } }));

    const res = await fetch('/api/price-portal/products/price', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        productId: row.productId,
        variantId: row.variantId,
        variantSku: row.variantSku || null,
        price,
        discountPrice,
        hasSitePrice: draft.hasSitePrice,
        sitePercent: draft.hasSitePrice ? sitePercent : null,
        hasWholesale: draft.hasWholesale,
        wholesaleDirection: draft.hasWholesale ? draft.wholesaleDirection : 'less',
        wholesaleMode: draft.hasWholesale ? wholesaleMode : 'percent',
        wholesalePercent: draft.hasWholesale && wholesaleMode === 'percent' ? wholesalePercent : null,
        wholesaleAmount: draft.hasWholesale && wholesaleMode === 'amount' ? wholesaleAmount : null,
        wholesaleQty: wholesaleQtyValue,
        inStock: draft.inStock,
        applyProportional: draft.applyProportional
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDrafts((prev) => ({
        ...prev,
        [key]: { ...draft, saving: false, error: data.error || 'خطا در ذخیره' }
      }));
      return;
    }

    const nextSitePrice = Number(data.sitePrice ?? (draft.hasSitePrice ? computeSitePrice(price, sitePercent!) : price));
    const nextPercent = draft.hasSitePrice ? Number(data.sitePercent ?? sitePercent) : null;
    const nextWholesaleDirection: WholesaleDirection =
      data.wholesaleDirection === 'more' || draft.wholesaleDirection === 'more' ? 'more' : 'less';
    const nextWholesaleMode: WholesaleMode =
      data.wholesaleMode === 'amount' || wholesaleMode === 'amount' ? 'amount' : 'percent';
    const nextWholesalePercent =
      draft.hasWholesale && nextWholesaleMode === 'percent'
        ? Number(data.wholesalePercent ?? wholesalePercent)
        : null;
    const nextWholesaleAmount =
      draft.hasWholesale && nextWholesaleMode === 'amount'
        ? Number(data.wholesaleAmount ?? wholesaleAmount)
        : null;
    const nextWholesaleQty = draft.hasWholesale
      ? String(data.wholesaleQty ?? wholesaleQtyValue).trim() || row.variantLabel || ''
      : '';
    const nextWholesalePrice =
      draft.hasWholesale
        ? Number(
            data.wholesalePrice ??
              computeWholesalePrice(price, {
                direction: nextWholesaleDirection,
                mode: nextWholesaleMode,
                percent: nextWholesalePercent,
                amount: nextWholesaleAmount
              })
          )
        : null;

    const siblingUpdates = Array.isArray(data.proportionalUpdates)
      ? (data.proportionalUpdates as Array<{
          variantId: string | null;
          portalPrice: number;
          sitePrice: number;
          hasSitePrice: boolean;
          sitePercent: number | null;
          discountPrice: number | null;
        }>)
      : [];

    setItems((prev) =>
      prev.map((r) => {
        if (rowKey(r) === key) {
          return {
            ...r,
            price,
            sitePrice: nextSitePrice,
            hasSitePrice: draft.hasSitePrice,
            sitePercent: nextPercent,
            hasWholesale: draft.hasWholesale,
            wholesaleDirection: nextWholesaleDirection,
            wholesaleMode: nextWholesaleMode,
            wholesalePercent: nextWholesalePercent,
            wholesaleAmount: nextWholesaleAmount,
            wholesaleQty: nextWholesaleQty,
            wholesalePrice: nextWholesalePrice,
            inStock: Boolean(data.inStock ?? draft.inStock),
            discountPrice: discountPrice && discountPrice > 0 ? discountPrice : null
          };
        }
        const sibling = siblingUpdates.find(
          (s) => rowKey({ productId: row.productId, variantId: s.variantId }) === rowKey(r)
        );
        if (!sibling) return r;
        return {
          ...r,
          price: sibling.portalPrice,
          sitePrice: sibling.sitePrice,
          hasSitePrice: sibling.hasSitePrice,
          sitePercent: sibling.sitePercent,
          discountPrice: sibling.discountPrice && sibling.discountPrice > 0 ? sibling.discountPrice : null
        };
      })
    );
    setDrafts((prev) => {
      const next = { ...prev };
      next[key] = {
        ...draft,
        sitePercent: nextPercent ? String(nextPercent) : '',
        wholesalePercent: nextWholesalePercent ? String(nextWholesalePercent) : '',
        wholesaleAmount: nextWholesaleAmount != null ? String(nextWholesaleAmount) : '',
        wholesaleQty: nextWholesaleQty,
        wholesaleDirection: nextWholesaleDirection,
        wholesaleMode: nextWholesaleMode,
        saving: false,
        saved: true,
        error: ''
      };
      for (const sibling of siblingUpdates) {
        const sKey = rowKey({ productId: row.productId, variantId: sibling.variantId });
        const cur = next[sKey];
        if (!cur) continue;
        next[sKey] = {
          ...cur,
          price: String(sibling.portalPrice),
          discountPrice:
            sibling.discountPrice && sibling.discountPrice > 0 ? String(sibling.discountPrice) : '',
          hasSitePrice: sibling.hasSitePrice,
          sitePercent: sibling.sitePercent ? String(sibling.sitePercent) : '',
          saved: true,
          error: ''
        };
      }
      return next;
    });
    setTimeout(() => {
      setDrafts((prev) => {
        const next = { ...prev };
        const clearSaved = (k: string) => {
          const cur = next[k];
          if (!cur) return;
          next[k] = { ...cur, saved: false };
        };
        clearSaved(key);
        for (const sibling of siblingUpdates) {
          clearSaved(rowKey({ productId: row.productId, variantId: sibling.variantId }));
        }
        return next;
      });
    }, 2000);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    const res = await fetch(`/api/price-portal/products/${encodeURIComponent(deleteTarget.productId)}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    const data = await res.json().catch(() => ({}));
    setDeleting(false);
    if (!res.ok) {
      setDeleteError(data.error || 'حذف ناموفق بود');
      return;
    }

    const removedId = deleteTarget.productId;
    setDeleteTarget(null);
    setItems((prev) => prev.filter((r) => r.productId !== removedId));
    setDrafts((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (key.startsWith(`${removedId}:`)) delete next[key];
      }
      return next;
    });
  };

  const updateDraft = (
    key: string,
    patch: Partial<
      Pick<
        RowDraft,
        | 'price'
        | 'discountPrice'
        | 'hasSitePrice'
        | 'sitePercent'
        | 'hasWholesale'
        | 'wholesaleDirection'
        | 'wholesaleMode'
        | 'wholesalePercent'
        | 'wholesaleAmount'
        | 'wholesaleQty'
        | 'applyProportional'
        | 'showDiscount'
        | 'inStock'
      >
    >
  ) => {
    setDrafts((prev) => {
      const cur = prev[key];
      if (!cur) return prev;
      return { ...prev, [key]: { ...cur, ...patch, saved: false, error: '' } };
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) => r.productName.toLowerCase().includes(q) || r.variantLabel.toLowerCase().includes(q)
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, PortalRow[]>();
    for (const row of filtered) {
      const list = map.get(row.productName) || [];
      list.push(row);
      map.set(row.productName, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col justify-center bg-white px-5 py-10">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-center text-lg font-bold text-neutral-900">لیست قیمت</h1>
          <p className="mt-1 text-center text-sm text-neutral-500">رمز عبور را وارد کنید</p>

          <form onSubmit={(e) => void login(e)} className="mt-8 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-base outline-none focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-100"
              placeholder="رمز عبور"
              autoComplete="current-password"
              autoFocus
            />

            <MathCaptcha onChange={setCaptcha} className="!rounded-xl !border-neutral-200 !from-neutral-50 !to-white !p-3" />

            {loginError ? <p className="text-center text-sm text-red-600">{loginError}</p> : null}

            <button
              type="submit"
              disabled={loginLoading || !password || !captcha.answer}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-neutral-900 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'ورود'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو..."
                className="h-11 w-full rounded-xl border-0 bg-neutral-100 pr-10 pl-3 text-sm outline-none focus:bg-neutral-200/80"
              />
            </div>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              aria-label="محصول جدید"
              title="محصول جدید"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white active:bg-emerald-700"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => void loadProducts()}
              aria-label="بروزرسانی"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 active:bg-neutral-200"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="خروج"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 active:bg-neutral-200"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs text-neutral-400">
              {filtered.length.toLocaleString('fa-IR')} ردیف
              {query ? ` · جستجو: «${query}»` : ''}
            </p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" />
              محصول جدید
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 pb-10">
        {!filtered.length ? (
          <p className="py-16 text-center text-sm text-neutral-400">محصولی یافت نشد</p>
        ) : (
          <div className="space-y-4">
            {grouped.map(([productName, rows]) => (
              <section key={`${rows[0]?.productId || productName}:${productName}`}>
                <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
                  <h2 className="min-w-0 truncate text-right text-xs font-bold text-neutral-700">
                    {productName}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError('');
                      setDeleteTarget({
                        productId: rows[0].productId,
                        productName
                      });
                    }}
                    aria-label="حذف محصول"
                    title="حذف کامل محصول"
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 text-[10px] font-bold text-red-600 active:bg-red-100"
                  >
                    <Trash2 className="h-3 w-3" />
                    حذف
                  </button>
                </div>
                <div className="space-y-1.5">
                  {rows.map((row) => {
                    const key = rowKey(row);
                    const draft = drafts[key];
                    if (!draft) return null;

                    const percentNum = Number(draft.sitePercent);
                    const previewSite =
                      draft.hasSitePrice && Number.isFinite(percentNum) && percentNum >= 1 && percentNum <= 100
                        ? computeSitePrice(Number(draft.price) || 0, percentNum)
                        : null;

                    const wholesalePercentNum = Number(draft.wholesalePercent);
                    const wholesaleAmountNum = Number(draft.wholesaleAmount);
                    const previewWholesale =
                      draft.hasWholesale &&
                      ((draft.wholesaleMode === 'percent' &&
                        Number.isFinite(wholesalePercentNum) &&
                        wholesalePercentNum >= 1 &&
                        wholesalePercentNum <= 100) ||
                        (draft.wholesaleMode === 'amount' &&
                          Number.isFinite(wholesaleAmountNum) &&
                          wholesaleAmountNum >= 0))
                        ? computeWholesalePrice(Number(draft.price) || 0, {
                            direction: draft.wholesaleDirection,
                            mode: draft.wholesaleMode,
                            percent: wholesalePercentNum,
                            amount: wholesaleAmountNum
                          })
                        : null;

                    const siblingCapable =
                      rows.length > 1 &&
                      row.sizeAmount != null &&
                      row.sizeAmount > 0 &&
                      rows.some(
                        (r) =>
                          rowKey(r) !== key && r.sizeAmount != null && Number(r.sizeAmount) > 0
                      );

                    const changed =
                      String(row.price) !== draft.price ||
                      String(row.discountPrice || '') !== (draft.discountPrice || '') ||
                      Boolean(row.hasSitePrice) !== draft.hasSitePrice ||
                      String(row.sitePercent || '') !== (draft.sitePercent || '') ||
                      Boolean(row.hasWholesale) !== draft.hasWholesale ||
                      (row.wholesaleDirection || 'less') !== draft.wholesaleDirection ||
                      (row.wholesaleMode || 'percent') !== draft.wholesaleMode ||
                      String(row.wholesalePercent || '') !== (draft.wholesalePercent || '') ||
                      String(row.wholesaleAmount ?? '') !== (draft.wholesaleAmount || '') ||
                      String(row.wholesaleQty || '') !== (draft.wholesaleQty || '') ||
                      Boolean(row.inStock) !== draft.inStock;

                    return (
                      <div
                        key={key}
                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5"
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span className="truncate text-[11px] font-medium text-neutral-500">
                            {row.variantLabel}
                          </span>
                          {draft.saved ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
                              <Check className="h-3 w-3" />
                              ذخیره
                            </span>
                          ) : null}
                        </div>

                        <input
                          type="text"
                          inputMode="numeric"
                          enterKeyHint="done"
                          value={draft.price}
                          onChange={(e) => updateDraft(key, { price: parseDigits(e.target.value) })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && changed && !draft.saving) void saveRow(row);
                          }}
                          aria-label="قیمت پایه"
                          className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-left text-base font-bold text-neutral-900 outline-none focus:border-neutral-400 focus:bg-white"
                          dir="ltr"
                        />

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <MiniCheck
                            checked={draft.inStock}
                            onChange={(v) => updateDraft(key, { inStock: v })}
                            label={draft.inStock ? 'موجود' : 'ناموجود'}
                            activeClass="border-emerald-600 bg-emerald-600"
                          />
                          <MiniCheck
                            checked={draft.hasSitePrice}
                            onChange={(v) =>
                              updateDraft(key, {
                                hasSitePrice: v,
                                sitePercent: v && !draft.sitePercent ? '1' : draft.sitePercent
                              })
                            }
                            label="سایت"
                            activeClass="border-emerald-600 bg-emerald-600"
                          />
                          <MiniCheck
                            checked={draft.hasWholesale}
                            onChange={(v) =>
                              updateDraft(key, {
                                hasWholesale: v,
                                wholesaleMode: draft.wholesaleMode || 'percent',
                                wholesalePercent:
                                  v && !draft.wholesalePercent ? '10' : draft.wholesalePercent,
                                wholesaleAmount: draft.wholesaleAmount,
                                wholesaleQty:
                                  v && !draft.wholesaleQty.trim()
                                    ? row.variantLabel || ''
                                    : draft.wholesaleQty
                              })
                            }
                            label="عمده"
                            activeClass="border-amber-600 bg-amber-600"
                          />
                          {siblingCapable ? (
                            <MiniCheck
                              checked={draft.applyProportional}
                              onChange={(v) => updateDraft(key, { applyProportional: v })}
                              label="نسبت وزن"
                              activeClass="border-sky-600 bg-sky-600"
                            />
                          ) : null}
                        </div>

                        {draft.hasSitePrice ? (
                          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-neutral-600">
                            <span className="shrink-0">٪سایت</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={draft.sitePercent}
                              onChange={(e) => {
                                const raw = parseDigits(e.target.value);
                                if (!raw) {
                                  updateDraft(key, { sitePercent: '' });
                                  return;
                                }
                                updateDraft(key, {
                                  sitePercent: String(Math.min(100, Math.max(1, Number(raw))))
                                });
                              }}
                              className="h-7 w-12 rounded border border-neutral-200 bg-white px-1 text-center text-xs font-bold outline-none focus:border-neutral-400"
                              dir="ltr"
                            />
                            {previewSite != null ? (
                              <span className="min-w-0 truncate">
                                <PriceText value={previewSite} className="font-semibold text-neutral-800" />
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        {draft.hasWholesale ? (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-600">
                            <div className="inline-flex overflow-hidden rounded border border-neutral-200">
                              <button
                                type="button"
                                onClick={() => updateDraft(key, { wholesaleDirection: 'less' })}
                                className={`h-7 px-2 text-[11px] font-medium ${
                                  draft.wholesaleDirection === 'less'
                                    ? 'bg-neutral-900 text-white'
                                    : 'bg-white text-neutral-600'
                                }`}
                              >
                                کمتر
                              </button>
                              <button
                                type="button"
                                onClick={() => updateDraft(key, { wholesaleDirection: 'more' })}
                                className={`h-7 px-2 text-[11px] font-medium ${
                                  draft.wholesaleDirection === 'more'
                                    ? 'bg-neutral-900 text-white'
                                    : 'bg-white text-neutral-600'
                                }`}
                              >
                                بیشتر
                              </button>
                            </div>
                            <div className="inline-flex overflow-hidden rounded border border-neutral-200">
                              <button
                                type="button"
                                onClick={() =>
                                  updateDraft(key, {
                                    wholesaleMode: 'percent',
                                    wholesalePercent: draft.wholesalePercent || '10'
                                  })
                                }
                                className={`h-7 px-2 text-[11px] font-medium ${
                                  draft.wholesaleMode === 'percent'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-white text-neutral-600'
                                }`}
                              >
                                درصد
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateDraft(key, {
                                    wholesaleMode: 'amount',
                                    wholesaleAmount: draft.wholesaleAmount || ''
                                  })
                                }
                                className={`h-7 px-2 text-[11px] font-medium ${
                                  draft.wholesaleMode === 'amount'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-white text-neutral-600'
                                }`}
                              >
                                مبلغ
                              </button>
                            </div>
                            {draft.wholesaleMode === 'amount' ? (
                              <>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={draft.wholesaleAmount}
                                  onChange={(e) =>
                                    updateDraft(key, { wholesaleAmount: parseDigits(e.target.value) })
                                  }
                                  className="h-7 w-24 rounded border border-neutral-200 bg-white px-1 text-center text-xs font-bold outline-none focus:border-neutral-400"
                                  dir="ltr"
                                  aria-label="مبلغ عمده"
                                  placeholder="تومان"
                                />
                                <span>تومان</span>
                              </>
                            ) : (
                              <>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={draft.wholesalePercent}
                                  onChange={(e) => {
                                    const raw = parseDigits(e.target.value);
                                    if (!raw) {
                                      updateDraft(key, { wholesalePercent: '' });
                                      return;
                                    }
                                    updateDraft(key, {
                                      wholesalePercent: String(Math.min(100, Math.max(1, Number(raw))))
                                    });
                                  }}
                                  className="h-7 w-11 rounded border border-neutral-200 bg-white px-1 text-center text-xs font-bold outline-none focus:border-neutral-400"
                                  dir="ltr"
                                  aria-label="درصد عمده"
                                />
                                <span>٪</span>
                              </>
                            )}
                            <input
                              type="text"
                              value={draft.wholesaleQty}
                              onChange={(e) => updateDraft(key, { wholesaleQty: e.target.value })}
                              placeholder={row.variantLabel || 'مقدار'}
                              className="h-7 min-w-0 flex-1 rounded border border-neutral-200 bg-white px-2 text-right text-xs outline-none focus:border-neutral-400"
                              aria-label="برچسب مقدار عمده"
                            />
                            {previewWholesale != null ? (
                              <span className="basis-full truncate">
                                <PriceText
                                  value={previewWholesale}
                                  className="font-semibold text-neutral-800"
                                />
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        {draft.showDiscount ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={draft.discountPrice}
                            onChange={(e) =>
                              updateDraft(key, { discountPrice: parseDigits(e.target.value) })
                            }
                            placeholder="تخفیف"
                            className="mt-1.5 h-8 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2 text-left text-sm outline-none focus:border-neutral-400"
                            dir="ltr"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateDraft(key, { showDiscount: true })}
                            className="mt-1 text-[10px] text-neutral-400"
                          >
                            + تخفیف
                          </button>
                        )}

                        {draft.error ? (
                          <p className="mt-1 text-right text-[11px] text-red-600">{draft.error}</p>
                        ) : null}

                        <div className="mt-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setHistoryTarget({
                                productId: row.productId,
                                variantId: row.variantId,
                                productName: row.productName,
                                variantLabel: row.variantLabel,
                                currentPrice: Number(draft.price) || row.price
                              })
                            }
                            aria-label="تاریخچه"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 active:bg-neutral-50"
                          >
                            <History className="h-4 w-4" />
                          </button>

                          {changed ? (
                            <button
                              type="button"
                              disabled={draft.saving}
                              onClick={() => void saveRow(row)}
                              className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-lg bg-neutral-900 text-sm font-bold text-white active:scale-[0.99] disabled:opacity-60"
                            >
                              {draft.saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : draft.applyProportional ? (
                                'ذخیره + نسبت وزن'
                              ) : (
                                'ذخیره'
                              )}
                            </button>
                          ) : (
                            <div className="flex h-10 min-w-0 flex-1 items-center rounded-lg bg-neutral-50 px-2.5 text-[11px] text-neutral-500">
                              <PriceText value={row.hasSitePrice ? row.sitePrice : row.price} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {historyTarget ? (
        <PriceHistoryModal target={historyTarget} onClose={() => setHistoryTarget(null)} />
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-title"
          dir="rtl"
        >
          <button
            type="button"
            className="absolute inset-0 bg-neutral-950/50"
            aria-label="بستن"
            disabled={deleting}
            onClick={() => {
              if (!deleting) setDeleteTarget(null);
            }}
          />
          <div className="relative z-10 w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:mx-4 sm:rounded-2xl">
            <h3 id="delete-product-title" className="text-right text-base font-bold text-neutral-900">
              حذف کامل محصول؟
            </h3>
            <p className="mt-2 text-right text-sm leading-6 text-neutral-600">
              «{deleteTarget.productName}» از لیست سایت و فایل اکسل قیمت کاملاً حذف می‌شود. این کار قابل
              بازگشت نیست.
            </p>
            {deleteError ? (
              <p className="mt-3 text-right text-xs text-red-600">{deleteError}</p>
            ) : null}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex h-11 flex-1 items-center justify-center rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 active:bg-neutral-50 disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDeleteProduct()}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 text-sm font-bold text-white active:bg-red-700 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                حذف کن
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AddProductModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={async () => {
          await loadProducts();
        }}
      />
    </div>
  );
}

export function PricePortalAdminHints({
  pathSlug,
  baseUrl
}: {
  pathSlug: string;
  baseUrl: string;
}) {
  const fullUrl = `${baseUrl.replace(/\/$/, '')}/${pathSlug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/50 px-3 py-2.5 text-sm">
      <span className="font-bold text-brand-800">لینک پورتال:</span>
      <code className="rounded-lg bg-white px-2 py-1 text-xs text-surface-700" dir="ltr">
        {fullUrl}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-bold text-brand-700 shadow-sm"
      >
        <Copy className="h-3.5 w-3.5" />
        کپی
      </button>
      <a
        href={`/${pathSlug}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2 py-1 text-xs font-bold text-white"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        باز کردن
      </a>
    </div>
  );
}
