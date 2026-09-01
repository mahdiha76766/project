'use client';

import Link from 'next/link';
import { Menu, Search, ShoppingBag } from 'lucide-react';
import { FpLogo } from '@/components/feedar/ui/Logo';
import { FpSearchInput } from '@/components/feedar/ui/SearchInput';
import { FEEDAR_NAV } from '@/lib/brand/feedar';
import { cn } from '@/lib/utils/cn';
import { CartBadge } from '@/components/shop/CartBadge';
import { CommerceOnly } from '@/components/commerce/SalesProvider';

export function FeedarHeader({
  brandName,
  onOpenMenu
}: {
  brandName: string;
  socials?: { label: string; href: string; icon: string }[];
  onOpenMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-50">
      <div className="bg-ink-900 py-1.5 text-center text-[11px] font-medium tracking-[0.18em] text-gold-200">
        SCIENCE · QUALITY · TRUST
      </div>
      <div className="border-b border-paper-200 bg-paper-50/90 backdrop-blur-md">
        <div className="ph-container flex h-[4.75rem] items-center justify-between gap-4">
          <FpLogo name={brandName} />
          <nav className="hidden items-center gap-1 xl:flex" aria-label="فهرست اصلی">
            {FEEDAR_NAV.map((item) => (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className="inline-flex rounded-full px-3 py-2 text-[13px] font-semibold text-ink-800 transition hover:text-gold-600"
                >
                  {item.label}
                </Link>
                {'children' in item && item.children ? (
                  <div className="invisible absolute end-0 top-full z-50 min-w-52 rounded-3xl border border-paper-200 bg-paper-50 py-2 opacity-0 shadow-card transition group-hover:visible group-hover:opacity-100">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href} className="block px-4 py-2.5 text-sm text-surface-700 hover:bg-paper-100 hover:text-ink-900">
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden w-52 lg:block">
              <FpSearchInput compact />
            </div>
            <CommerceOnly>
              <Link href="/cart" aria-label="سبد خرید" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-paper-200 text-ink-800">
                <ShoppingBag className="h-4 w-4" />
                <CartBadge />
              </Link>
            </CommerceOnly>
            <Link href="/contact" className="hidden rounded-full bg-ink-900 px-4 py-2.5 text-xs font-bold text-paper-50 sm:inline-flex">
              ارتباط علمی
            </Link>
            <Link href="/search" className="flex h-11 w-11 items-center justify-center rounded-full border border-paper-200 lg:hidden" aria-label="جستجو">
              <Search className="h-4 w-4" />
            </Link>
            <button type="button" onClick={onOpenMenu} className="flex h-11 w-11 items-center justify-center rounded-full border border-paper-200 xl:hidden" aria-label="باز کردن منو">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function FeedarMobileMenu({
  open,
  onClose,
  brandName
}: {
  open: boolean;
  onClose: () => void;
  brandName: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] xl:hidden" role="dialog" aria-modal="true" aria-label="منوی موبایل">
      <button type="button" className="absolute inset-0 bg-ink-950/50" aria-label="بستن منو" onClick={onClose} />
      <div className="absolute inset-y-0 start-0 flex w-[min(22rem,92vw)] flex-col overflow-y-auto bg-paper-50 p-6 shadow-card">
        <div className="mb-8 flex items-center justify-between">
          <FpLogo name={brandName} />
          <button type="button" onClick={onClose} className="rounded-full border border-paper-200 px-3 py-1 text-sm">
            بستن
          </button>
        </div>
        <FpSearchInput className="mb-6" />
        <nav className="flex flex-col gap-1">
          {FEEDAR_NAV.map((item) => (
            <div key={item.href}>
              <Link href={item.href} onClick={onClose} className={cn('block rounded-2xl px-3 py-3 text-sm font-semibold text-ink-900 hover:bg-paper-100')}>
                {item.label}
              </Link>
              {'children' in item && item.children
                ? item.children.map((child) => (
                    <Link key={child.href} href={child.href} onClick={onClose} className="block rounded-2xl px-6 py-2 text-sm text-surface-600 hover:bg-paper-100">
                      {child.label}
                    </Link>
                  ))
                : null}
            </div>
          ))}
        </nav>
        <CommerceOnly>
          <Link href="/cart" onClick={onClose} className="mt-6 rounded-full border border-paper-200 px-4 py-3 text-center text-sm font-bold">
            سبد خرید
          </Link>
        </CommerceOnly>
        <Link href="/contact" onClick={onClose} className="mt-3 rounded-full bg-ink-900 px-4 py-3 text-center text-sm font-bold text-paper-50">
          ارتباط علمی
        </Link>
      </div>
    </div>
  );
}
