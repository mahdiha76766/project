import { FinancePayment, Wallet, WalletTransaction } from '@/models';

export async function getFinanceSummary() {
  const [walletAgg, paidToday, totalTransactions] = await Promise.all([
    Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalAvailable: { $sum: '$availableBalance' },
          totalBlocked: { $sum: '$blockedBalance' }
        }
      }
    ]),
    FinancePayment.aggregate([
      {
        $match: {
          status: 'PAID',
          verifiedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } }
    ]),
    WalletTransaction.countDocuments()
  ]);

  return {
    totalAvailableBalance: walletAgg[0]?.totalAvailable ?? 0,
    totalBlockedBalance: walletAgg[0]?.totalBlocked ?? 0,
    paidTodayCount: paidToday[0]?.count ?? 0,
    paidTodayAmount: paidToday[0]?.amount ?? 0,
    totalTransactions
  };
}

export async function getFinanceTrend(period: 'daily' | 'monthly' = 'daily', days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const dateFormat = period === 'monthly' ? '%Y-%m' : '%Y-%m-%d';
  const [payments, transactions] = await Promise.all([
    FinancePayment.aggregate([
      { $match: { status: 'PAID', verifiedAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$verifiedAt' } },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    WalletTransaction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          count: { $sum: 1 },
          volume: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  return { payments, transactions, period, since };
}
