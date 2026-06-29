import { AuditLog } from '@/models';
import type { ClientSession } from 'mongoose';

type AuditParams = {
  actor?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  session?: ClientSession;
};

export async function writeAuditLog(params: AuditParams) {
  const doc = {
    actor: params.actor,
    actorRole: params.actorRole ?? '',
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: params.metadata ?? {},
    ip: params.ip ?? ''
  };
  if (params.session) {
    await AuditLog.create([doc], { session: params.session });
  } else {
    await AuditLog.create(doc);
  }
}
