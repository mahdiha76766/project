import { Droplets, Leaf, Package } from 'lucide-react';
import { getProductSpecEntries } from '@/lib/product/specs';

type ProductSpecsSectionProps = {
  product: {
    weight?: number;
    weightUnit?: string;
    containerSize?: string;
    usageType?: string;
    attributes?: Record<string, string>;
  };
};

export function ProductSpecsSection({ product }: ProductSpecsSectionProps) {
  const entries = getProductSpecEntries(product);
  if (!entries.length) return null;

  return (
    <div className="border-t border-surface-200 p-6">
      <h2 className="flex items-center gap-2 font-bold text-surface-900">
        <Package className="h-5 w-5 text-brand-600" />
        مشخصات محصول
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <div key={entry.label} className="rounded-xl border border-surface-100 bg-surface-50 p-3">
            <p className="text-xs font-bold text-surface-500">{entry.label}</p>
            <p className="mt-1 text-sm font-semibold text-surface-800">{entry.value}</p>
          </div>
        ))}
      </div>
      {product.usageType === 'EDIBLE' || product.usageType === 'BOTH' ? (
        <p className="mt-4 inline-flex items-center gap-1 text-xs text-brand-700">
          <Leaf className="h-3.5 w-3.5" />
          مناسب مصرف خوراکی
        </p>
      ) : null}
      {product.attributes?.extraction ? (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-surface-500">
          <Droplets className="h-3.5 w-3.5" />
          {product.attributes.extraction}
        </p>
      ) : null}
    </div>
  );
}
