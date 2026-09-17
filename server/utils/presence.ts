// Lightweight presence shim used during migration / type-harden passes
// Exports a permissive checkPresence function. Implementations may use Redis or Socket presence.
export async function checkPresence(_userId: string): Promise<boolean> {
  // Migration-friendly default: conservatively return false.
  // Real implementation should query Redis or presence service.
  return false
}
