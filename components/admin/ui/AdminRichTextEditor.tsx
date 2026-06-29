'use client';

import { ProRichTextEditor } from '@/components/cms/ProRichTextEditor';
import { FieldLabel } from './AdminField';

type AdminRichTextEditorProps = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  uploadFolder?: 'products' | 'blog' | 'banners';
};

export function AdminRichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 280,
  uploadFolder = 'products'
}: AdminRichTextEditorProps) {
  return (
    <div>
      {label ? <FieldLabel text={label} /> : null}
      <ProRichTextEditor value={value} onChange={onChange} placeholder={placeholder} minHeight={minHeight} uploadFolder={uploadFolder} />
    </div>
  );
}
