import { cn } from '@/lib/utils/cn';

function looksLikeHtml(value: string) {
  return /<[a-z][\s\S]*>/i.test(value);
}

export function RichHtmlContent({
  html,
  className
}: {
  html: string;
  className?: string;
}) {
  if (!html) return null;

  if (looksLikeHtml(html)) {
    return (
      <div
        className={cn(
          'prose prose-sm max-w-none text-sm leading-8 text-surface-700 sm:text-base',
          '[&_h2]:text-lg [&_h2]:font-black [&_h3]:text-base [&_h3]:font-bold',
          '[&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5',
          '[&_blockquote]:border-r-4 [&_blockquote]:border-brand-300 [&_blockquote]:pr-3',
          '[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl',
          '[&_video]:my-4 [&_video]:w-full [&_video]:max-w-full [&_video]:rounded-xl [&_video]:bg-black',
          '[&_a]:text-brand-600 [&_a]:underline',
          className
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return <div className={cn('whitespace-pre-wrap text-sm leading-8 text-surface-700 sm:text-base', className)}>{html}</div>;
}
