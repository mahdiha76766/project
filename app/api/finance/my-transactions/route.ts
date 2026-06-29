import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireUser } from '@/lib/api/guards';
import { WalletTransaction, PaymentReceipt, User } from '@/models';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';

export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  await connectToDatabase();

  const { page, limit, skip } = getPaginationParams(req.url);
  const url = new URL(req.url);
  const query: Record<string, unknown> = { user: auth.user.userId };
  const type = url.searchParams.get('type');
  const search = url.searchParams.get('search');
  if (type && !type.startsWith('CARD_TO_CARD')) query.type = type;
  if (search) query.$or = [{ transactionId: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];

  const [walletItems, walletTotal, receipts] = await Promise.all([
    WalletTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WalletTransaction.countDocuments(query),
    PaymentReceipt.find({ user: auth.user.userId }).sort({ createdAt: -1 }).limit(50).lean()
  ]);

  const receiptRows = receipts
    .filter((r) => !type || type.startsWith('CARD_TO_CARD'))
    .map((r) => ({
      transactionId: `C2C-${String(r._id).slice(-8)}`,
      type: r.type === 'wallet_topup' ? 'CARD_TO_CARD_DEPOSIT' : 'CARD_TO_CARD_ORDER',
      amount: r.amount,
      balanceAfter: 0,
      description:
        r.status === 'PENDING'
          ? `کارت به کارت — در انتظار تأیید (فاکتور ${r.invoiceNumber})`
          : r.status === 'APPROVED'
            ? `کارت به کارت — تأیید شده (فاکتور ${r.invoiceNumber})`
            : `کارت به کارت — رد شده (فاکتور ${r.invoiceNumber})`,
      createdAt: r.createdAt as Date,
      receiptStatus: r.status,
      invoiceNumber: r.invoiceNumber,
      isCardToCard: true as const
    }));

  type WalletTxRow = {
    transactionId: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: Date;
    isCardToCard: false;
    referenceType?: string;
    referenceId?: string;
    relatedUser?: { name: string; mobile: string } | null;
  };

  const walletRows: WalletTxRow[] = walletItems.map((w) => ({
    transactionId: String(w.transactionId),
    type: String(w.type),
    amount: Number(w.amount),
    balanceAfter: Number(w.balanceAfter),
    description: String(w.description ?? ''),
    createdAt: w.createdAt as Date,
    isCardToCard: false as const,
    referenceType: w.referenceType ? String(w.referenceType) : undefined,
    referenceId: w.referenceId ? String(w.referenceId) : undefined,
    relatedUser: null
  }));

  const transferUserIds = walletItems
    .filter((w) => w.referenceType === 'transfer' && w.referenceId)
    .map((w) => String(w.referenceId));

  if (transferUserIds.length > 0) {
    const users = await User.find({ _id: { $in: transferUserIds } }).select('name mobile').lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));
    for (const row of walletRows) {
      if (row.referenceType === 'transfer' && row.referenceId) {
        const u = userMap.get(row.referenceId);
        if (u) {
          row.relatedUser = { name: u.name || '', mobile: u.mobile || '' };
          if (row.type === 'TRANSFER_OUT') {
            row.description = `انتقال به ${u.name || u.mobile}`;
          } else if (row.type === 'TRANSFER_IN') {
            row.description = `دریافت انتقال از ${u.name || u.mobile}`;
          }
        }
      }
    }
  }

  type TxRow = (typeof receiptRows)[number] | WalletTxRow;

  const merged: TxRow[] = [...receiptRows, ...walletRows]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return NextResponse.json({
    ...paginatedResponse(merged, walletTotal + receiptRows.length, page, limit),
    items: merged
  });
}
