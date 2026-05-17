export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<{ orderId?: string; status?: string }> }) {
  const params = await searchParams;
  return <main className="mx-auto max-w-xl p-6"><h1 className="text-2xl font-bold">نتیجه پرداخت</h1><p className="mt-3">وضعیت: {params.status}</p><p>شماره سفارش: {params.orderId}</p></main>;
}
