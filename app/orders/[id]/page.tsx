export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main className="mx-auto max-w-4xl p-6"><h1 className="text-2xl font-bold">جزئیات سفارش</h1><p className="mt-3">شناسه سفارش: {id}</p></main>;
}
