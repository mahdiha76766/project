import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/** فلش جهت «ادامه / ورود» در رابط RTL — همیشه به سمت چپ (جلو در فارسی) */
export function RtlForwardArrow({ className }: { className?: string }) {
  return <ArrowLeft className={cn('h-4 w-4 shrink-0', className)} aria-hidden />;
}
