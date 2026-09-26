import { NextResponse } from 'next/server';
import { getSession } from './auth';
import { HttpError } from './http';
import { getUserById, type User } from './users';

export async function requireUser(): Promise<User> {
  const session = await getSession();
  if (!session) throw new HttpError(401, 'Sign in required.');
  const user = await getUserById(session.userId);
  if (!user || user.id !== session.userId) throw new HttpError(401, 'Sign in required.');
  return user;
}

export function accountError(err: unknown, fallback: string): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(fallback, err instanceof Error ? err.message : 'error');
  return NextResponse.json({ error: fallback }, { status: 500 });
}
