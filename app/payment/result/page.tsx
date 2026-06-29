import { PaymentResultView } from '@/components/shop/PaymentResultView';

export default async function PaymentResultPage({
  searchParams
}: {
  searchParams: Promise<{ orderId?: string; status?: string; invoiceNumber?: string; message?: string }>;
}) {
  const params = await searchParams;
  return <PaymentResultView params={params} />;
}
