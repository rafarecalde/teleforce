import { getSession, type Principal } from './auth';
import { isAdminEmail } from './match';

export async function adminPrincipal(): Promise<Principal | null> {
  try {
    const session = await getSession();
    if (!session || !isAdminEmail(session.email)) return null;
    return session;
  } catch {
    return null;
  }
}
