import { User } from '@/models';
import { createProforma } from '@/lib/invoice/invoice-service';

export async function createWalletTopupInvoice(userId: string, amount: number, expiresInMinutes?: number) {
  const user = await User.findById(userId).lean() as { name?: string; mobile?: string; email?: string } | null;
  return createProforma({
    userId,
    type: 'wallet_topup',
    items: [{ title: 'شارژ کیف پول', unitPrice: amount }],
    relatedEntity: { type: 'wallet_topup', id: userId },
    buyerInfo: { name: user?.name, mobile: user?.mobile },
    expiresInMinutes
  });
}
