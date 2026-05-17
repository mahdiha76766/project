export const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl bg-white p-4 shadow-sm border border-amber-100">
    <h2 className="mb-3 text-lg font-bold text-amber-900">{title}</h2>
    {children}
  </section>
);
