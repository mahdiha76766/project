export const StatCard = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-2xl bg-white p-4 shadow-sm border border-amber-100">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-black text-amber-900">{value}</p>
  </div>
);
