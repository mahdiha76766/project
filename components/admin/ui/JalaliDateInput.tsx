'use client';

import DatePicker from 'react-multi-date-picker';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import 'react-multi-date-picker/styles/colors/teal.css';
import { FieldLabel } from './AdminField';
import { dateObjectToIso, isoToDateObject } from '@/lib/admin/jalali';

type JalaliDateInputProps = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
};

export function JalaliDateInput({ label, value, onChange, placeholder = 'انتخاب تاریخ' }: JalaliDateInputProps) {
  return (
    <div>
      <FieldLabel text={label} />
      <DatePicker
        calendar={persian}
        locale={persian_fa}
        value={isoToDateObject(value)}
        onChange={(selected) => {
          if (!selected) {
            onChange('');
            return;
          }
          const item = Array.isArray(selected) ? selected[0] : selected;
          onChange(dateObjectToIso(item as DateObject));
        }}
        format="YYYY/MM/DD"
        placeholder={placeholder}
        containerClassName="w-full"
        inputClass="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        calendarPosition="bottom-right"
      />
    </div>
  );
}
