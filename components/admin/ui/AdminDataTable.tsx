import type { ReactNode } from 'react';
import { AdminTable } from './AdminTable';

type Column<T> = { header: ReactNode; render: (item: T) => ReactNode; className?: string };

export function AdminDataTable<T>({
  data,
  columns,
  rowKey,
  emptyMessage = 'موردی یافت نشد.'
}: {
  data: T[];
  columns: Column<T>[];
  rowKey: (item: T) => string;
  emptyMessage?: string;
}) {
  const head = (
    <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-right [&>th]:text-sm [&>th]:font-semibold [&>th]:text-slate-600">
      {columns.map((c, i) => (
        <th key={i}>{c.header}</th>
      ))}
    </tr>
  );

  return (
    <AdminTable head={head}>
      {data.length ? (
        data.map((row) => (
          <tr key={rowKey(row)} className="[&>td]:px-4 [&>td]:py-3 [&>td]:text-sm [&>td]:text-slate-700">
            {columns.map((c, i) => (
              <td key={i} className={c.className || ''}>
                {c.render(row)}
              </td>
            ))}
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-500">
            {emptyMessage}
          </td>
        </tr>
      )}
    </AdminTable>
  );
}

export default AdminDataTable;
