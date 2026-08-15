export function AdminAlert({ tone, children }: { tone: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const styles =
    tone === 'error'
      ? 'bg-red-50 text-red-700 border-red-100'
      : tone === 'success'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : 'bg-sky-50 text-sky-700 border-sky-100';
  return <p className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${styles}`}>{children}</p>;
}

export function AdminStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {active ? 'فعال' : 'غیرفعال'}
    </span>
  );
}

export function AdminPrimaryButton({
  children,
  onClick,
  disabled,
  type = 'button'
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="h-11 rounded-xl bg-amber-600 px-5 text-sm font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function AdminCheckbox({
  label,
  checked,
  onChange,
  disabled
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`inline-flex min-h-11 items-center gap-2 text-sm text-slate-700 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-200"
      />
      {label}
    </label>
  );
}
