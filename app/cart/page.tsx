import Link from 'next/link';

export default function CartPage() {
  return <main className="mx-auto max-w-5xl p-6"><h1 className="text-2xl font-bold">سبد خرید</h1><p className="mt-3">مدیریت سبد برای مهمان (localStorage/cookie) و کاربر لاگین‌شده (MongoDB) از طریق API انجام می‌شود.</p><Link href="/checkout" className="mt-4 inline-block rounded bg-amber-800 px-4 py-2 text-white">ادامه به checkout</Link></main>;
}
