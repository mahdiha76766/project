import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { approvePaymentReceipt, rejectPaymentReceipt } from '@/lib/payment/receipt-service';

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const admin = await getSessionUser();
    const { id } = await params;
    const body = await req.json();
    const action = body.action === 'reject' ? 'reject' : 'approve';
    const note = body.note ? String(body.note) : undefined;

    const receipt =
      action === 'approve'
        ? await approvePaymentReceipt(id, admin!.userId, note)
        : await rejectPaymentReceipt(id, admin!.userId, note);

    return NextResponse.json({ receipt, message: action === 'approve' ? 'رسید تأیید شد' : 'رسید رد شد' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطا در بررسی رسید';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
