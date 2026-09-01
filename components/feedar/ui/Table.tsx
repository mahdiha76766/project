import { cn } from '@/lib/utils/cn';

export function FpTable({
  headers,
  children,
  className
}: {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('fp-table-wrap', className)}>
      <table className="w-full min-w-[36rem] border-collapse text-right text-sm">
        <thead className="bg-surface-50 text-surface-500">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100 bg-white">{children}</tbody>
      </table>
    </div>
  );
}
