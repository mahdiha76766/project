import { notFound } from 'next/navigation';

const steps = ['PENDING_PAYMENT','PAID','PROCESSING','PACKED','SHIPPED','DELIVERED'];

async function getOrder(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/dashboard/orders/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.item;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const active = Math.max(0, steps.indexOf(order.orderStatus));

  return <div className='space-y-4'>
    <section className='rounded-2xl border bg-white p-4'>
      <h2 className='text-lg font-black'>جزئیات سفارش #{String(order._id).slice(-8)}</h2>
      <div className='mt-3 grid gap-2 text-sm md:grid-cols-2'>
        <p>مبلغ کل: {order.totalAmount.toLocaleString('fa-IR')}</p>
        <p>تخفیف: {Number(order.discountAmount || 0).toLocaleString('fa-IR')}</p>
        <p>هزینه ارسال: {Number(order.shippingAmount || 0).toLocaleString('fa-IR')}</p>
        <p>روش پرداخت: {order.paymentMethod || '-'}</p>
        <p>وضعیت پرداخت: {order.paymentStatus}</p>
        <p>وضعیت سفارش: {order.orderStatus}</p>
        <p>کد رهگیری: {order.trackingCode || '-'}</p>
        <p>تاریخ ثبت: {new Date(order.createdAt).toLocaleDateString('fa-IR')}</p>
      </div>
    </section>

    <section className='rounded-2xl border bg-white p-4'>
      <h3 className='font-black'>روند سفارش</h3>
      <div className='mt-4 flex flex-wrap gap-2'>{steps.map((s, i)=><div key={s} className={`rounded-xl px-3 py-2 text-xs font-bold ${i<=active?'bg-emerald-100 text-emerald-800':'bg-slate-100 text-slate-500'}`}>{s}</div>)}</div>
    </section>

    <section className='rounded-2xl border bg-white p-4'>
      <h3 className='font-black'>محصولات خریداری‌شده</h3>
      <div className='mt-3 space-y-2'>{order.items.map((it:any,idx:number)=><div key={idx} className='rounded-xl border p-3 text-sm'><p className='font-bold'>{it.product?.name || 'محصول'}</p><p>تعداد: {it.quantity}</p><p>قیمت: {it.price.toLocaleString('fa-IR')}</p></div>)}</div>
    </section>

    <section className='rounded-2xl border bg-white p-4 text-sm'>
      <h3 className='font-black'>آدرس ارسال</h3>
      <p className='mt-2'>{order.shippingAddress?.fullName} - {order.shippingAddress?.phone}</p>
      <p>{order.shippingAddress?.province}، {order.shippingAddress?.city}، {order.shippingAddress?.addressLine}</p>
      <p>کدپستی: {order.shippingAddress?.postalCode}</p>
    </section>
  </div>;
}
