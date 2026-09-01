import { FileText } from 'lucide-react';
import { FpBadge } from '@/components/feedar/ui/Badge';

export function FpDownloadCard({
  title,
  description,
  href,
  type,
  size
}: {
  title: string;
  description: string;
  href: string;
  type: string;
  size?: string;
}) {
  return (
    <article className="fp-card flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-800">
        <FileText className="h-5 w-5" />
      </span>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <FpBadge>{type}</FpBadge>
          {size ? <span className="text-xs text-surface-400">{size}</span> : null}
        </div>
        <h2 className="mt-2 text-lg font-bold text-surface-900">{title}</h2>
        <p className="mt-2 text-sm leading-7 text-surface-500">{description}</p>
        <a href={href} className="fp-btn-primary mt-4 inline-flex !px-4 !py-2 text-xs" target={href.startsWith('/') ? undefined : '_blank'} rel={href.startsWith('/') ? undefined : 'noreferrer'} download={href.endsWith('.pdf') || undefined}>
          دریافت فایل
        </a>
      </div>
    </article>
  );
}
