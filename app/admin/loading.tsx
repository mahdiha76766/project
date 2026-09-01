export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-16 animate-pulse rounded-2xl bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
