import type { ReactNode } from 'react';

export const DashCard = ({ title, children }: { title: string; children: ReactNode }) => <section className='rounded-2xl border bg-white p-4 shadow-sm'><h2 className='text-sm font-black text-slate-800'>{title}</h2><div className='mt-3'>{children}</div></section>;
export const DashEmpty = ({ text }: { text: string }) => <div className='rounded-xl border border-dashed p-6 text-center text-sm text-slate-500'>{text}</div>;
export const DashLoading = () => <div className='space-y-2'>{Array.from({ length: 3 }).map((_, i) => <div key={i} className='h-10 animate-pulse rounded bg-slate-100' />)}</div>;
export const DashError = ({ text }: { text: string }) => <div className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>{text}</div>;
