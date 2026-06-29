import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

export function formatJalaliDate(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new DateObject({ date, calendar: persian, locale: persian_fa }).format('YYYY/MM/DD');
}

export function formatJalaliDateTime(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new DateObject({ date, calendar: persian, locale: persian_fa }).format('YYYY/MM/DD HH:mm');
}

export function isoToDateObject(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new DateObject({ date, calendar: persian, locale: persian_fa });
}

export function dateObjectToIso(value: DateObject | null | undefined) {
  if (!value) return '';
  const converted = new DateObject(value).toDate();
  if (Number.isNaN(converted.getTime())) return '';
  return converted.toISOString();
}

export function isoToDateInputValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}
