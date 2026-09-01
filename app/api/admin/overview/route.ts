import { NextResponse } from 'next/server';
import { BlogPost, Category, ContactInquiry, DownloadAsset, Product, User } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requirePanel } from '@/lib/api/guards';
import { roleHasCapability } from '@/server/permissions';

export async function GET() {
  const auth = await requirePanel();
  if (auth.error) return auth.error;

  await connectToDatabase();
  const canSeeUsers = roleHasCapability(auth.user.role, 'users');

  const [products, categories, articles, downloads, messages, unreadMessages, users] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    BlogPost.countDocuments(),
    DownloadAsset.countDocuments(),
    ContactInquiry.countDocuments(),
    ContactInquiry.countDocuments({ status: 'NEW' }),
    canSeeUsers ? User.countDocuments() : Promise.resolve(0)
  ]);

  return NextResponse.json({
    overview: {
      products,
      categories,
      articles,
      downloads,
      messages,
      unreadMessages,
      users
    }
  });
}
