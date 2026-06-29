export function AdminPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-2">
      <h1 className="text-2xl font-black text-slate-900">{title}</h1>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </header>
  );
}
