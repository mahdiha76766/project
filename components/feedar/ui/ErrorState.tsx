export function FpErrorState({
  title = 'خطا در دریافت اطلاعات',
  description = 'لطفاً چند لحظه بعد دوباره تلاش کنید.'
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div role="alert" className="rounded-3xl border border-red-100 bg-red-50 px-6 py-10 text-center">
      <p className="font-bold text-red-950">{title}</p>
      <p className="mt-2 text-sm text-red-800">{description}</p>
    </div>
  );
}
