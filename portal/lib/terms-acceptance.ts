import { db } from './db';
import { userInsert, type NewUser } from './users';

export type NewTermsAcceptance = {
  id: string;
  userId: string;
  signedName: string;
  termsVersion: string;
  termsContentHash: string;
  acceptedAt: string;
  ip: string;
  ua: string;
};

/** Account row and acceptance row commit together. Email is sent after this returns. */
export async function insertAccountWithAcceptance(
  user: NewUser,
  acceptance: NewTermsAcceptance,
): Promise<void> {
  const client = await db();
  await client.batch(
    [
      userInsert(user),
      {
        sql: `INSERT INTO terms_acceptances (
          id, user_id, signed_name, terms_version, terms_content_hash,
          accepted_at, ip, ua, email_sent_at, email_error
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, '')`,
        args: [
          acceptance.id,
          acceptance.userId,
          acceptance.signedName,
          acceptance.termsVersion,
          acceptance.termsContentHash,
          acceptance.acceptedAt,
          acceptance.ip,
          acceptance.ua,
        ],
      },
    ],
    'write',
  );
}

export async function recordTermsEmailResult(
  acceptanceId: string,
  result: { sentAt: string | null; error: string },
): Promise<void> {
  const client = await db();
  await client.execute({
    sql: `UPDATE terms_acceptances SET email_sent_at = ?, email_error = ? WHERE id = ?`,
    args: [result.sentAt, result.error.slice(0, 500), acceptanceId],
  });
}
