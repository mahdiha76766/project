export function resolveUserId(user: unknown): string {
  if (!user) return '';
  if (typeof user === 'string') return user;
  if (typeof user === 'object' && user !== null && '_id' in user) {
    return String((user as { _id: unknown })._id);
  }
  return String(user);
}
