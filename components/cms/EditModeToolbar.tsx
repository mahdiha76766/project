'use client';

import { Pencil, X, Sparkles } from 'lucide-react';
import { useSiteContent } from '@/components/cms/SiteContentProvider';
import { cn } from '@/lib/utils/cn';

export function EditModeToolbar() {
  const { isAdmin, editMode, setEditMode } = useSiteContent();

  if (!isAdmin) return null;

  return (
    <>
      {editMode ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[180] border-b-2 border-amber-400 bg-amber-500/95 px-4 py-2 text-center text-sm font-bold text-white shadow-lg backdrop-blur">
          <Sparkles className="inline h-4 w-4 ml-1" />
          حالت ویرایش فعال — روی هر بخش کلیک کنید تا ویرایش شود
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setEditMode(!editMode)}
        className={cn(
          'fixed bottom-6 left-6 z-[190] inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black shadow-2xl transition hover:scale-[1.02] active:scale-[0.98]',
          editMode
            ? 'bg-surface-900 text-white hover:bg-surface-800'
            : 'bg-gradient-to-l from-amber-500 to-brand-600 text-white hover:from-amber-400 hover:to-brand-500'
        )}
      >
        {editMode ? (
          <>
            <X className="h-4 w-4" />
            خروج از ویرایش
          </>
        ) : (
          <>
            <Pencil className="h-4 w-4" />
            ویرایش سایت
          </>
        )}
      </button>
    </>
  );
}
