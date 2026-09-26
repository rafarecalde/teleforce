import bcrypt from 'bcryptjs';

// Hash of a non-secret placeholder so a missing account still spends a compare.
const DUMMY_HASH = '$2b$12$oxfTzi3R4oPwOh.ZAczzmO4R5wt4LUedQvJb.NgpDJ00ktqebOMlq';

export function passwordOk(password: string): boolean {
  const bytes = Buffer.byteLength(password);
  return password.length >= 8 && bytes >= 8 && bytes <= 72;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/** Always runs a compare. Returns false when there is no stored hash. */
export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  const matched = await bcrypt.compare(password, hash || DUMMY_HASH);
  return Boolean(hash) && matched;
}
