'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, Eye } from 'lucide-react';
import { Section } from './Section';
import { RtlForwardArrow } from './RtlForwardArrow';
import { resolveImage } from '@/lib/shop/resolve-image';
import type { HomeBlogPost } from '@/lib/shop/home-types';

export function HomeBlog({ posts }: { posts: HomeBlogPost[] }) {
  if (!posts.length) return null;

  const [hero, ...rest] = posts;

  return (
    <Section bg="default" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-brand-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-accent-100/50 blur-3xl" />

      <div className="relative mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
            <BookOpen className="h-3.5 w-3.5" />
            مجله سلامت و تغذیه
          </span>
          <h2 className="mt-3 text-2xl font-black text-surface-900 sm:text-3xl">اخبار و مقالات</h2>
          <p className="mt-2 max-w-lg text-sm text-surface-500">
            تازه‌ترین مطالب علمی، خبری و آموزشی فیدار فارمد
          </p>
        </div>
        <Link href="/blog" className="site-btn-outline inline-flex items-center gap-2">
          همه مطالب
          <RtlForwardArrow />
        </Link>
      </div>

      <div className="relative grid gap-5 lg:grid-cols-12">
        {/* Featured */}
        <Link
          href={`/blog/${hero.slug}`}
          className="group relative overflow-hidden rounded-3xl border border-surface-200 bg-surface-900 shadow-card lg:col-span-7"
        >
          <img
            src={resolveImage(hero.coverImage)}
            alt={hero.title}
            className="aspect-[16/10] w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100 lg:aspect-auto lg:h-full lg:min-h-[22rem]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <span className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
              {hero.category || 'ویژه'}
            </span>
            <h3 className="mt-3 text-xl font-black leading-snug text-white sm:text-2xl">{hero.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-7 text-white/80">{hero.excerpt}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-300">
              مطالعه مقاله
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
            </span>
          </div>
        </Link>

        {/* Side stack */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          {rest.slice(0, 3).map((post, i) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex gap-4 overflow-hidden rounded-2xl border border-surface-200 bg-surface-0 p-3 transition hover:border-brand-200 hover:shadow-soft"
            >
              <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-32">
                <img
                  src={resolveImage(post.coverImage)}
                  alt={post.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
                <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg bg-surface-0/90 text-[10px] font-black text-brand-700 shadow">
                  {String(i + 2).padStart(2, '0')}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
                  {post.category || 'مقاله'}
                </span>
                <h4 className="mt-1 line-clamp-2 text-sm font-black text-surface-900 group-hover:text-brand-700">
                  {post.title}
                </h4>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-surface-500">{post.excerpt}</p>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-surface-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    جدید
                  </span>
                  {post.views ? (
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.views.toLocaleString('fa-IR')}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}

          {rest.length > 3 ? (
            <Link
              href="/blog"
              className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-4 text-center text-sm font-bold text-brand-800 transition hover:bg-brand-50"
            >
              + {rest.length - 3} مطلب دیگر در مجله
            </Link>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
