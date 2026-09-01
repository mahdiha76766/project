'use client';

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'حذف',
  cancelLabel = 'انصراف',
  loading = false,
  onConfirm,
  onClose
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="admin-confirm-title" className="text-lg font-black text-surface-900">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-7 text-surface-500">{description}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 rounded-xl border border-surface-200 px-4 text-sm font-semibold text-surface-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-11 rounded-xl bg-red-600 px-4 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? 'در حال انجام...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
