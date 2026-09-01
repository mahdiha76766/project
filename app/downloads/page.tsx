import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { FpAlert } from '@/components/feedar/ui/Alert';
import { FpPageHero } from '@/components/feedar/ui/PageHero';
import { FpDownloadCard } from '@/components/feedar/ui/DownloadCard';
import { FpEmptyState } from '@/components/feedar/ui/EmptyState';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { FEEDAR_BRAND } from '@/lib/brand/feedar';
import { withDatabase } from '@/lib/db/safe-query';
import { DownloadAsset } from '@/models';

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata({
    title: 'دانلودها',
    description: `کاتالوگ، بروشور و پروفایل شرکت ${FEEDAR_BRAND.nameFa}`,
    canonicalPath: '/downloads'
  });
}

const KIND_LABEL: Record<string, string> = {
  pdf: 'PDF',
  brochure: 'بروشور',
  catalog: 'کاتالوگ',
  info: 'اطلاعات محصول'
};

export default async function DownloadsPage() {
  const items = (await withDatabase(
    () => DownloadAsset.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
    []
  )) as unknown as Array<{ title: string; description?: string; fileUrl: string; kind?: string; _id: unknown }>;

  return (
    <>
      <FpPageHero
        kicker="منابع"
        title="دانلودها و بروشورها"
        description="منابع معرفی شرکت و سبد محصولات برای همکاران علمی و تجاری."
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'دانلودها' }]}
      />
      <Container className="space-y-6 py-12">
        {!items.length ? (
          <FpEmptyState
            title="آرشیو در حال تکمیل است"
            description="پس از بارگذاری PDF در پنل مدیریت، فایل‌ها از همین صفحه قابل دریافت خواهند بود."
            actionHref="/contact"
            actionLabel="درخواست کاتالوگ"
          />
        ) : (
          items.map((item) => (
            <FpDownloadCard
              key={String(item._id)}
              title={item.title}
              description={item.description || ''}
              href={item.fileUrl}
              type={KIND_LABEL[item.kind || 'pdf'] || 'PDF'}
            />
          ))
        )}
        {items.length ? <FpAlert title="نکته">فایل‌ها پس از کلیک مستقیماً از سرور فیدار فارمد دریافت می‌شوند.</FpAlert> : null}
      </Container>
    </>
  );
}
