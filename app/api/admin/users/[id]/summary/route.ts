import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireAdmin } from '@/lib/api/guards';
import { FinancePayment, Order, User, Wallet, WalletTransaction } from '@/models';
import { deposit } from '@/lib/finance/wallet-service';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  await connectToDatabase();

  const user = await User.findById(id).select('name mobile email role createdAt').lean();
  if (!user) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });

  const [orders, transactions, payments, wallet] = await Promise.all([
    Order.find({ user: id }).sort({ createdAt: -1 }).limit(20).lean(),
    WalletTransaction.find({ user: id }).sort({ createdAt: -1 }).limit(20).lean(),
    FinancePayment.find({ userId: id }).sort({ createdAt: -1 }).limit(20).lean(),
    Wallet.findOne({ user: id }).lean()
  ]);

  return NextResponse.json({ user, orders, transactions, payments, wallet });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  await connectToDatabase();

  try {
    const { action, amount, description } = await req.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'مبلغ باید معتبر و بزرگتر از صفر باشد' }, { status: 400 });
    }

    const { getOrCreateWallet } = await import('@/lib/finance/wallet-service');
    const wallet = await getOrCreateWallet(id);

    if (action === 'deposit') {
      await deposit(id, amount, {
        description: description || 'شارژ دستی توسط مدیریت',
        performedBy: auth.user.userId
      });
      return NextResponse.json({ ok: true, message: 'کیف پول کاربر با موفقیت شارژ شد.' });
    } else if (action === 'withdraw') {
      if (wallet.availableBalance < amount) {
        return NextResponse.json({ error: 'موجودی کیف پول کاربر کافی نیست' }, { status: 400 });
      }
      const { Wallet: WalletModel, WalletTransaction: WTModel } = await import('@/models');
      const { generateTransactionId } = await import('@/lib/finance/ids');
      const { writeAuditLog } = await import('@/lib/finance/audit');
      
      const balanceBefore = wallet.availableBalance;
      const blockedBefore = wallet.blockedBalance;
      
      const updated = await WalletModel.findOneAndUpdate(
        { _id: wallet._id, version: wallet.version, availableBalance: { $gte: amount } },
        { $inc: { availableBalance: -amount, version: 1 } },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ error: 'موجودی کیف پول کافی نیست یا همزمان تغییر کرده است' }, { status: 400 });
      }
      
      const tx = await WTModel.create([
        {
          transactionId: generateTransactionId(),
          user: id,
          type: 'WITHDRAWAL',
          amount,
          balanceBefore,
          balanceAfter: updated.availableBalance,
          blockedBefore,
          blockedAfter: updated.blockedBalance,
          description: description || 'کاهش دستی موجودی توسط مدیریت',
          performedBy: auth.user.userId
        }
      ]);
      
      await writeAuditLog({
        actor: auth.user.userId,
        action: 'wallet.withdraw_manual',
        entityType: 'Wallet',
        entityId: String(wallet._id),
        metadata: { amount, transactionId: tx[0].transactionId }
      });
      
      return NextResponse.json({ ok: true, message: 'مبلغ مورد نظر با موفقیت از کیف پول کاربر کسر شد.' });
    } else {
      return NextResponse.json({ error: 'عملیات نامعتبر است' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در انجام عملیات مالی' }, { status: 400 });
  }
}
