import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

export function FieldLabel({ text }: { text: string }) { return <label className="mb-1 block text-xs font-semibold text-surface-500">{text}</label>; }

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`h-11 w-full rounded-full border border-paper-200 bg-paper-50 px-4 text-sm outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-200 ${props.className || ''}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-24 w-full rounded-[1.25rem] border border-paper-200 bg-paper-50 px-4 py-3 text-sm outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-200 ${props.className || ''}`} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`h-11 w-full rounded-full border border-paper-200 bg-paper-50 px-4 text-sm outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-200 ${props.className || ''}`} />;
}
