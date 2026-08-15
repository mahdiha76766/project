import 'server-only';

import mongoose, { type Document, type Model } from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongoose';

function normalizeId(id: unknown) {
  return String(id || '').trim();
}

/** Excel-imported products store `_id` as plain strings; Mongoose casts to ObjectId and misses them. */
export async function findDocByAnyId<T>(model: Model<T>, id: string) {
  await connectToDatabase();
  const trimmed = normalizeId(id);
  if (!trimmed) return null;

  const raw = await model.collection.findOne({ _id: trimmed } as Record<string, unknown>);
  if (raw) return model.hydrate(raw as never) as Document & T;

  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const doc = await model.findById(trimmed);
    if (doc) return doc;
  }

  return null;
}

export async function updateDocByAnyId<T>(
  model: Model<T>,
  id: string,
  update: Record<string, unknown>,
  options?: { new?: boolean; runValidators?: boolean }
) {
  await connectToDatabase();
  const trimmed = normalizeId(id);
  if (!trimmed) return null;

  const raw = await model.collection.findOneAndUpdate(
    { _id: trimmed } as Record<string, unknown>,
    { $set: update },
    { returnDocument: 'after' }
  );

  if (raw) {
    return options?.new === false ? null : (model.hydrate(raw as never) as Document & T);
  }

  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    return model.findByIdAndUpdate(trimmed, update, {
      new: options?.new ?? true,
      runValidators: options?.runValidators ?? true
    });
  }

  return null;
}

/** Persist a hydrated doc whose `_id` may be a string (mongoose `.save()` fails on those). */
export async function persistDocByAnyId<T>(model: Model<T>, doc: Document & T) {
  await connectToDatabase();
  if (!doc._id) throw new Error('شناسه سند نامعتبر است');

  const payload = doc.toObject({ depopulate: true }) as Record<string, unknown>;
  delete payload.__v;

  // Hydrated docs cast string _ids to ObjectId — filter must use string for excel-imported rows.
  const idStr = String(doc._id);
  let result = await model.collection.updateOne({ _id: idStr } as Record<string, unknown>, { $set: payload });

  if (result.matchedCount === 0) {
    result = await model.collection.updateOne({ _id: doc._id } as Record<string, unknown>, { $set: payload });
  }

  if (result.matchedCount === 0) {
    throw new Error('ذخیره نشد — سند یافت نشد.');
  }

  return doc;
}

export async function deleteDocByAnyId<T>(model: Model<T>, id: string) {
  await connectToDatabase();
  const trimmed = normalizeId(id);
  if (!trimmed) return false;

  const byString = await model.collection.deleteOne({ _id: trimmed } as Record<string, unknown>);
  if (byString.deletedCount > 0) return true;

  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const byObjectId = await model.deleteOne({ _id: trimmed } as never);
    return byObjectId.deletedCount > 0;
  }

  return false;
}
