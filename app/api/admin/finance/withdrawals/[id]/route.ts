import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireAdmin } from '@/lib/api/guards';
import { WithdrawalRequest } from '@/models';
import { writeAuditLog } from '@/lib/finance/audit';
import { notifyUser } from '@/lib/finance/notification-service';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  await connectToDatabase();
  const body = await req.json();
  const item = await WithdrawalRequest.findById(id);
  if (!item) return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });

  item.status = body.status ?? item.status;
  item.adminNote = body.adminNote ?? item.adminNote;
  item.processedBy = auth.user.userId;
  item.processedAt = new Date();
  await item.save();

  await writeAuditLog({
    actor: auth.user.userId,
    actorRole: auth.user.role,
    action: 'withdrawal.updated',
    entityType: 'WithdrawalRequest',
    entityId: id,
    metadata: { status: item.status }
  });

  await notifyUser(
    String(item.user),
    'به‌روزرسانی برداشت',
    `وضعیت درخواست برداشت شما: ${item.status}`
  );

  return NextResponse.json({ item });
}
