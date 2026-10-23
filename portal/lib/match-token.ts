import { SignJWT, jwtVerify } from 'jose';
import { signingKey } from './auth';
import { portalHomeUrl } from './match-terms';

const AUDIENCE = 'match-link';

export type MatchLinkAction = 'accept' | 'decline';

export type MatchLink = {
  userId: string;
  readyAt: string;
  action: MatchLinkAction;
};

export async function signMatchLink(link: MatchLink): Promise<string> {
  return new SignJWT({
    readyAt: link.readyAt,
    action: link.action,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(link.userId)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('21d')
    .sign(signingKey());
}

export async function readMatchLink(token: string): Promise<MatchLink | null> {
  if (!token || token.length > 4000) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), { audience: AUDIENCE });
    const userId = payload.sub || '';
    const readyAt = typeof payload.readyAt === 'string' ? payload.readyAt : '';
    const action = payload.action === 'accept' || payload.action === 'decline' ? payload.action : '';
    if (!userId || !readyAt || !action) return null;
    return { userId, readyAt, action };
  } catch {
    return null;
  }
}

export async function matchActionUrl(link: MatchLink): Promise<string> {
  const token = await signMatchLink(link);
  const base = portalHomeUrl().replace(/\/$/, '');
  return `${base}/api/account/match/email?token=${encodeURIComponent(token)}`;
}
