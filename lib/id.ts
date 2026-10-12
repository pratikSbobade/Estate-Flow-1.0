// Collision-safe IDs. The old 4-digit random IDs could repeat, and because
// saves use upsert, a repeat would silently overwrite an existing record.
export const newId = (prefix: string): string => {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${rand.toUpperCase()}`;
};
