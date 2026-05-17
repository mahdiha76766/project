import type { ReactNode } from 'react';

export function AdminTable({ head, children }: { head: ReactNode; children: ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-slate-600">{head}</thead><tbody className="divide-y divide-slate-100">{children}</tbody></table></div></div>;
}
