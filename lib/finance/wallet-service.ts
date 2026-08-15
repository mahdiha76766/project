import mongoose, { type ClientSession } from 'mongoose';
import { Wallet, WalletHold, WalletTransaction } from '@/models';
import { env } from '@/server/config/env';
import { writeAuditLog } from '@/lib/finance/audit';
import { generateTransactionId } from '@/lib/finance/ids';
import { runInTransaction } from '@/lib/db/transaction';

type SessionOpts = { session?: ClientSession };

async function withOptionalSession<T>(fn: (session: ClientSession | undefined) => Promise<T>, existing?: ClientSession): Promise<T> {
  return runInTransaction(fn, existing);
}

export async function getOrCreateWallet(userId: string, opts?: SessionOpts) {
  const query = Wallet.findOne({ user: userId });
  if (opts?.session) query.session(opts.session);
  let wallet = await query;
  if (!wallet) {
  const created = await Wallet.create(
      [{ user: userId, availableBalance: 0, blockedBalance: 0, currency: 'IRR', version: 0 }],
      opts?.session ? { session: opts.session } : undefined
    );
    wallet = created[0];
  }
  return wallet;
}

async function recordTransaction(
  params: {
    userId: string;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    blockedBefore: number;
    blockedAfter: number;
    referenceType?: string;
    referenceId?: string;
    description?: string;
    idempotencyKey?: string;
    performedBy?: string;
  },
  session?: ClientSession
) {
  if (params.idempotencyKey) {
    const existing = await WalletTransaction.findOne({ idempotencyKey: params.idempotencyKey }).session(session ?? null);
    if (existing) return existing;
  }
  const [tx] = await WalletTransaction.create(
    [
      {
        transactionId: generateTransactionId(),
        user: params.userId,
        type: params.type,
        amount: params.amount,
        balanceBefore: params.balanceBefore,
        balanceAfter: params.balanceAfter,
        blockedBefore: params.blockedBefore,
        blockedAfter: params.blockedAfter,
        referenceType: params.referenceType ?? '',
        referenceId: params.referenceId,
        description: params.description ?? '',
        idempotencyKey: params.idempotencyKey,
        performedBy: params.performedBy ?? params.userId
      }
    ],
    { session }
  );
  return tx;
}

export async function deposit(
  userId: string,
  amount: number,
  meta?: { referenceType?: string; referenceId?: string; description?: string; idempotencyKey?: string; performedBy?: string },
  opts?: SessionOpts
) {
  if (amount <= 0) throw new Error('مبلغ واریز باید بیشتر از صفر باشد');
  return withOptionalSession(async (session) => {
    const wallet = await getOrCreateWallet(userId, { session });
    const balanceBefore = wallet.availableBalance;
    const blockedBefore = wallet.blockedBalance;
    const updated = await Wallet.findOneAndUpdate(
      { _id: wallet._id, version: wallet.version },
      { $inc: { availableBalance: amount, version: 1 } },
      { new: true, session }
    );
    if (!updated) throw new Error('خطا در به‌روزرسانی کیف پول');
    const tx = await recordTransaction(
      {
        userId,
        type: 'DEPOSIT',
        amount,
        balanceBefore,
        balanceAfter: updated.availableBalance,
        blockedBefore,
        blockedAfter: updated.blockedBalance,
        ...meta
      },
      session
    );
    await writeAuditLog({
      actor: meta?.performedBy ?? userId,
      action: 'wallet.deposit',
      entityType: 'Wallet',
      entityId: String(wallet._id),
      metadata: { amount, transactionId: tx.transactionId },
      session
    });
    return { wallet: updated, transaction: tx };
  }, opts?.session);
}

export async function hold(
  userId: string,
  amount: number,
  meta: { reason: string; referenceType: string; referenceId?: string; paymentId?: string; expiresAt?: Date },
  opts?: SessionOpts
) {
  if (amount <= 0) throw new Error('مبلغ بلوکه باید بیشتر از صفر باشد');
  return withOptionalSession(async (session) => {
    const wallet = await getOrCreateWallet(userId, { session });
    if (wallet.availableBalance < amount) throw new Error('موجودی کیف پول کافی نیست');
    const balanceBefore = wallet.availableBalance;
    const blockedBefore = wallet.blockedBalance;
    const updated = await Wallet.findOneAndUpdate(
      { _id: wallet._id, version: wallet.version, availableBalance: { $gte: amount } },
      { $inc: { availableBalance: -amount, blockedBalance: amount, version: 1 } },
      { new: true, session }
    );
    if (!updated) throw new Error('موجودی کیف پول کافی نیست');
    const expiresAt = meta.expiresAt ?? new Date(Date.now() + env.ORDER_PAYMENT_TIMEOUT_MINUTES * 60_000);
    const [holdDoc] = await WalletHold.create(
      [
        {
          user: userId,
          amount,
          reason: meta.reason,
          referenceType: meta.referenceType,
          referenceId: meta.referenceId,
          status: 'ACTIVE',
          paymentId: meta.paymentId,
          expiresAt
        }
      ],
      { session }
    );
    await recordTransaction(
      {
        userId,
        type: 'HOLD',
        amount,
        balanceBefore,
        balanceAfter: updated.availableBalance,
        blockedBefore,
        blockedAfter: updated.blockedBalance,
        referenceType: meta.referenceType,
        referenceId: meta.referenceId,
        description: meta.reason
      },
      session
    );
    return { wallet: updated, hold: holdDoc };
  }, opts?.session);
}

export async function captureHold(holdId: string, meta?: { description?: string; referenceType?: string }, opts?: SessionOpts) {
  return withOptionalSession(async (session) => {
    const hold = await WalletHold.findById(holdId).session(session ?? null);
    if (!hold) throw new Error('بلوکه یافت نشد');
    if (hold.status !== 'ACTIVE') throw new Error('بلوکه قابل برداشت نیست');
    const wallet = await getOrCreateWallet(String(hold.user), { session });
    const balanceBefore = wallet.availableBalance;
    const blockedBefore = wallet.blockedBalance;
    const updated = await Wallet.findOneAndUpdate(
      { _id: wallet._id, version: wallet.version, blockedBalance: { $gte: hold.amount } },
      { $inc: { blockedBalance: -hold.amount, version: 1 } },
      { new: true, session }
    );
    if (!updated) throw new Error('خطا در برداشت از بلوکه');
    hold.status = 'CAPTURED';
    await hold.save({ session });
    const tx = await recordTransaction(
      {
        userId: String(hold.user),
        type: 'ORDER_PAYMENT',
        amount: hold.amount,
        balanceBefore,
        balanceAfter: updated.availableBalance,
        blockedBefore,
        blockedAfter: updated.blockedBalance,
        referenceType: meta?.referenceType ?? hold.referenceType,
        referenceId: hold.referenceId ? String(hold.referenceId) : undefined,
        description: meta?.description ?? hold.reason
      },
      session
    );
    return { wallet: updated, hold, transaction: tx };
  }, opts?.session);
}

export async function releaseHold(holdId: string, opts?: SessionOpts) {
  return withOptionalSession(async (session) => {
    const hold = await WalletHold.findById(holdId).session(session ?? null);
    if (!hold) throw new Error('بلوکه یافت نشد');
    if (hold.status !== 'ACTIVE') return { hold };
    const wallet = await getOrCreateWallet(String(hold.user), { session });
    const balanceBefore = wallet.availableBalance;
    const blockedBefore = wallet.blockedBalance;
    const updated = await Wallet.findOneAndUpdate(
      { _id: wallet._id, version: wallet.version, blockedBalance: { $gte: hold.amount } },
      { $inc: { availableBalance: hold.amount, blockedBalance: -hold.amount, version: 1 } },
      { new: true, session }
    );
    if (!updated) throw new Error('خطا در آزادسازی بلوکه');
    hold.status = 'RELEASED';
    await hold.save({ session });
    await recordTransaction(
      {
        userId: String(hold.user),
        type: 'RELEASE',
        amount: hold.amount,
        balanceBefore,
        balanceAfter: updated.availableBalance,
        blockedBefore,
        blockedAfter: updated.blockedBalance,
        referenceType: hold.referenceType,
        referenceId: hold.referenceId ? String(hold.referenceId) : undefined,
        description: 'آزادسازی بلوکه'
      },
      session
    );
    return { wallet: updated, hold };
  }, opts?.session);
}

export async function withdraw(
  userId: string,
  amount: number,
  meta?: { description?: string; performedBy?: string },
  opts?: SessionOpts
) {
  if (amount < env.WALLET_MIN_WITHDRAWAL) {
    throw new Error(`حداقل مبلغ برداشت ${env.WALLET_MIN_WITHDRAWAL.toLocaleString('fa-IR')} تومان است`);
  }
  return withOptionalSession(async (session) => {
    const wallet = await getOrCreateWallet(userId, { session });
    if (wallet.availableBalance < amount) throw new Error('موجودی کیف پول کافی نیست');
    const balanceBefore = wallet.availableBalance;
    const blockedBefore = wallet.blockedBalance;
    const updated = await Wallet.findOneAndUpdate(
      { _id: wallet._id, version: wallet.version, availableBalance: { $gte: amount } },
      { $inc: { availableBalance: -amount, version: 1 } },
      { new: true, session }
    );
    if (!updated) throw new Error('موجودی کیف پول کافی نیست');
    const tx = await recordTransaction(
      {
        userId,
        type: 'WITHDRAWAL',
        amount,
        balanceBefore,
        balanceAfter: updated.availableBalance,
        blockedBefore,
        blockedAfter: updated.blockedBalance,
        description: meta?.description ?? 'برداشت از کیف پول',
        performedBy: meta?.performedBy ?? userId
      },
      session
    );
    await writeAuditLog({
      actor: meta?.performedBy ?? userId,
      action: 'wallet.withdraw',
      entityType: 'Wallet',
      entityId: String(wallet._id),
      metadata: { amount, transactionId: tx.transactionId },
      session
    });
    return { wallet: updated, transaction: tx };
  }, opts?.session);
}

export async function refundToWallet(
  userId: string,
  amount: number,
  meta?: { referenceType?: string; referenceId?: string; description?: string },
  opts?: SessionOpts
) {
  return deposit(userId, amount, { ...meta, description: meta?.description ?? 'بازگشت وجه' }, opts);
}

export async function transfer(
  fromUserId: string,
  toUserId: string,
  amount: number,
  meta?: { description?: string; idempotencyKey?: string },
  opts?: SessionOpts
) {
  if (fromUserId === toUserId) throw new Error('انتقال به خود مجاز نیست');
  if (amount <= 0) throw new Error('مبلغ انتقال باید بیشتر از صفر باشد');
  return withOptionalSession(async (session) => {
    const fromWallet = await getOrCreateWallet(fromUserId, { session });
    if (fromWallet.availableBalance < amount) throw new Error('موجودی کیف پول کافی نیست');
    const fromBefore = fromWallet.availableBalance;
    const fromBlockedBefore = fromWallet.blockedBalance;
    const fromUpdated = await Wallet.findOneAndUpdate(
      { _id: fromWallet._id, version: fromWallet.version, availableBalance: { $gte: amount } },
      { $inc: { availableBalance: -amount, version: 1 } },
      { new: true, session }
    );
    if (!fromUpdated) throw new Error('موجودی کیف پول کافی نیست');
    const toWallet = await getOrCreateWallet(toUserId, { session });
    const toBefore = toWallet.availableBalance;
    const toBlockedBefore = toWallet.blockedBalance;
    const toUpdated = await Wallet.findOneAndUpdate(
      { _id: toWallet._id, version: toWallet.version },
      { $inc: { availableBalance: amount, version: 1 } },
      { new: true, session }
    );
    if (!toUpdated) throw new Error('خطا در واریز به مقصد');
    const outTx = await recordTransaction(
      {
        userId: fromUserId,
        type: 'TRANSFER_OUT',
        amount,
        balanceBefore: fromBefore,
        balanceAfter: fromUpdated.availableBalance,
        blockedBefore: fromBlockedBefore,
        blockedAfter: fromUpdated.blockedBalance,
        referenceType: 'transfer',
        referenceId: toUserId,
        description: meta?.description ?? 'انتقال اعتبار',
        idempotencyKey: meta?.idempotencyKey
      },
      session
    );
    const inTx = await recordTransaction(
      {
        userId: toUserId,
        type: 'TRANSFER_IN',
        amount,
        balanceBefore: toBefore,
        balanceAfter: toUpdated.availableBalance,
        blockedBefore: toBlockedBefore,
        blockedAfter: toUpdated.blockedBalance,
        referenceType: 'transfer',
        referenceId: fromUserId,
        description: meta?.description ?? 'دریافت اعتبار'
      },
      session
    );
    await writeAuditLog({
      actor: fromUserId,
      action: 'wallet.transfer',
      entityType: 'Wallet',
      entityId: String(fromWallet._id),
      metadata: { toUserId, amount, outTransactionId: outTx.transactionId, inTransactionId: inTx.transactionId },
      session
    });
    return { fromWallet: fromUpdated, toWallet: toUpdated, outTransaction: outTx, inTransaction: inTx };
  }, opts?.session);
}

export async function getWalletBalance(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  return {
    availableBalance: wallet.availableBalance,
    blockedBalance: wallet.blockedBalance,
    currency: wallet.currency
  };
}
