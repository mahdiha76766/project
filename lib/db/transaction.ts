import mongoose, { type ClientSession } from 'mongoose';

let isTransactionSupported = true;

/**
 * Runs the given function inside a MongoDB transaction if transactions are supported
 * (i.e. if running on a Replica Set or mongos). If transactions are not supported,
 * it falls back to running the function normally without a transaction/session.
 */
export async function runInTransaction<T>(
  fn: (session: ClientSession | undefined) => Promise<T>,
  existingSession?: ClientSession
): Promise<T> {
  if (existingSession) {
    return fn(existingSession);
  }

  if (!isTransactionSupported) {
    return fn(undefined);
  }

  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (error: any) {
    const isNoReplicaSetError =
      error?.code === 20 ||
      error?.codeName === 'IllegalOperation' ||
      String(error?.message).includes('Transaction numbers are only allowed') ||
      String(error?.message).includes('replica set') ||
      String(error?.message).includes('transactions are only supported');

    if (isNoReplicaSetError) {
      console.warn(
        '[db] MongoDB Transactions are not supported by this server (running standalone MongoDB). Falling back to non-transactional execution.'
      );
      isTransactionSupported = false;
      return fn(undefined);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
