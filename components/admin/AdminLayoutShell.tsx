'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell, Search, LayoutDashboard, Package, Shapes, ShoppingCart, TicketPercent, Truck, Users, MessageSquare, Newspaper, Image, Settings, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/admin', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/admin/products', label: 'محصولات', icon: Package },
  { href: '/admin/categories', label: 'دسته‌بندی‌ها', icon: Shapes },
  { href: '/admin/orders', label: 'سفارش‌ها', icon: ShoppingCart },
  { href: '/admin/coupons', label: 'کدهای تخفیف', icon: TicketPercent },
  { href: '/admin/shipping', label: 'روش‌های ارسال', icon: Truck },
  { href: '/admin/users', label: 'کاربران', icon: Users },
  { href: '/admin/reviews', label: 'نظرات', icon: MessageSquare },
  { href: '/admin/blog', label: 'بلاگ', icon: Newspaper },
  { href: '/admin/banners', label: 'بنرها', icon: Image },
  { href: '/admin/settings', label: 'تنظیمات', icon: Settings }
];

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return <div className="min-h-screen bg-slate-50 text-slate-900"><div className="flex">
    <aside className="hidden w-72 border-l border-slate-200 bg-white p-4 lg:block">{navItems.map(({href,label,icon:Icon}) => <Link key={href} href={href} className={`mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${pathname===href?'bg-amber-100 text-amber-900':'hover:bg-slate-100'}`}><Icon size={18}/>{label}</Link>)}</aside>
    <div className="flex-1">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2"><button className="rounded-lg border p-2 lg:hidden" onClick={()=>setOpen(true)}><Menu size={18}/></button><h1 className="font-black">پنل ادمین فروشگاه</h1></div>
        <div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-xl border px-3 py-2 md:flex"><Search size={16}/><span className="text-xs text-slate-500">جستجو...</span></div><button className="rounded-lg border p-2"><Bell size={18}/></button></div>
      </header>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  </div>
  {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={()=>setOpen(false)}><aside className="h-full w-72 bg-white p-4" onClick={(e)=>e.stopPropagation()}><div className="mb-3 flex items-center justify-between"><strong>منو ادمین</strong><button onClick={()=>setOpen(false)}><X size={18}/></button></div>{navItems.map(({href,label,icon:Icon}) => <Link onClick={()=>setOpen(false)} key={href} href={href} className={`mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${pathname===href?'bg-amber-100 text-amber-900':'hover:bg-slate-100'}`}><Icon size={18}/>{label}</Link>)}</aside></div>}
  </div>;
}
