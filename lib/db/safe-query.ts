import { connectToDatabase } from '@/lib/db/mongoose';

export async function withDatabase<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    await connectToDatabase();
    return await query();
  } catch (error) {
    console.error('[db] query failed:', error);
    return fallback;
  }
}
