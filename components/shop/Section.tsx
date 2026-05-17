export const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="my-10">
    <h2 className="mb-4 text-xl font-extrabold text-amber-900">{title}</h2>
    {children}
  </section>
);
