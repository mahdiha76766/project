import type { ReactNode } from 'react';
import { AdminTable } from './AdminTable';

type Column<T> = { header: ReactNode; render: (item: T) => ReactNode; className?: string };

export function AdminDataTable<T>({
  data,
  columns,
  rowKey,
}: {
  data: T[];
  columns: Column<T>[];
  rowKey: (item: T) => string;
}) {
  const head = (
    <tr>
      {columns.map((c, i) => (
        <th key={i} className="px-3 py-3 text-left text-sm font-medium text-slate-600">
          {c.header}
        </th>
      ))}
    </tr>
  );

  return (
    <AdminTable head={head}>
      {data.map((row) => (
        <tr key={rowKey(row)}>
          {columns.map((c, i) => (
            <td key={i} className={`px-3 py-3 text-sm text-slate-700 ${c.className || ''}`}>
              {c.render(row)}
            </td>
          ))}
        </tr>
      ))}
    </AdminTable>
  );
}

export default AdminDataTable;
