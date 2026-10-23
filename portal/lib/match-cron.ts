import { deadlineFrom, formatDeadline } from './business-days';
import { createMatchSubscription, stripeAutoBillingEnabled } from './match-billing';
import {
  sendChargeAlert,
  sendMatchAutoClientEmail,
  sendMatchAcceptedInternalEmail,
  sendMatchReminderEmail,
} from './match-email';
import {
  acceptMatch,
  claimBillingNotified,
  claimClientNotified,
  claimReminder,
  getMatchByUserId,
  listMatchWork,
  openBillingStart,
  releaseBillingNotified,
  releaseClientNotified,
  releaseReminder,
  saveSubscription,
  type MatchPackage,
  type MatchWork,
} from './match';
import { matchActionUrl } from './match-token';
import { getUserById } from './users';

const DAY_MS = 24 * 60 * 60 * 1000;

function profileFrom(row: MatchWork, acceptUrl: string, declineUrl: string) {
  return {
    to: row.email,
    fullName: row.fullName,
    eaName: row.eaName,
    eaPhotoUrl: row.eaPhotoUrl,
    eaVideoUrl: row.eaVideoUrl,
    experience: row.experience,
    languages: row.languages,
    tools: row.tools,
    strengths: row.strengths,
    timezone: row.timezone,
    hours: row.hours,
    pmName: row.pmName,
    pmEmail: row.pmEmail,
    deadlineLabel: formatDeadline(row.matchReadyAt),
    acceptUrl,
    declineUrl,
  };
}

async function actionUrls(row: MatchWork): Promise<{ acceptUrl: string; declineUrl: string }> {
  const acceptUrl = await matchActionUrl({ userId: row.userId, readyAt: row.matchReadyAt, action: 'accept' });
  const declineUrl = row.presentation === 1
    ? await matchActionUrl({ userId: row.userId, readyAt: row.matchReadyAt, action: 'decline' })
    : '';
  return { acceptUrl, declineUrl };
}

async function maybeSubscribe(row: MatchWork, billingStartAt: string): Promise<string> {
  if (!stripeAutoBillingEnabled() || row.stripeSubscriptionId) return row.stripeSubscriptionId;
  const created = await createMatchSubscription({
    userId: row.userId,
    plan: row.plan,
    customerId: row.stripeCustomerId,
    paymentMethodId: row.defaultPaymentMethodId,
    billingStartAt,
  });
  if (!created.ok) return '';
  await saveSubscription(row.userId, created.subscriptionId);
  return created.subscriptionId;
}

async function autoAccept(row: MatchWork, nowIso: string): Promise<boolean> {
  const status = await acceptMatch({
    userId: row.userId,
    acceptedAt: nowIso,
    ip: '',
    userAgent: 'vercel-cron',
    method: 'auto',
  });
  if (status !== 'accepted') return false;
  const fresh = await getMatchByUserId(row.userId);
  const billingStartAt = fresh?.billingStartAt || nowIso;
  const subscriptionId = await maybeSubscribe({ ...row, stripeSubscriptionId: fresh?.stripeSubscriptionId || '' }, billingStartAt);
  const clientClaimed = await claimClientNotified(row.userId, nowIso);
  if (clientClaimed) {
    const sent = await sendMatchAutoClientEmail({
      to: row.email,
      fullName: row.fullName,
      eaName: row.eaName,
    });
    if (!sent) await releaseClientNotified(row.userId, nowIso);
  }
  const alertClaimed = await claimBillingNotified(row.userId, nowIso);
  if (alertClaimed) {
    const sent = await sendMatchAcceptedInternalEmail({
      fullName: row.fullName,
      email: row.email,
      eaName: row.eaName,
      acceptedAt: nowIso,
      stripeCustomerId: row.stripeCustomerId,
      method: 'auto',
      chargeNow: !subscriptionId,
      subscriptionStarted: Boolean(subscriptionId),
    });
    if (!sent) await releaseBillingNotified(row.userId, nowIso);
  }
  return true;
}

async function remind(row: MatchWork, nowIso: string): Promise<boolean> {
  const claimed = await claimReminder(row.userId, nowIso);
  if (!claimed) return false;
  const urls = await actionUrls(row);
  const sent = await sendMatchReminderEmail(profileFrom(row, urls.acceptUrl, urls.declineUrl));
  if (!sent) {
    await releaseReminder(row.userId, nowIso);
    return false;
  }
  return true;
}

async function bill(row: MatchWork, fresh: MatchPackage, nowIso: string): Promise<boolean> {
  if (!fresh.billingStartAt || fresh.billingNotifiedAt) return false;
  const subscriptionId = await maybeSubscribe(
    { ...row, stripeSubscriptionId: fresh.stripeSubscriptionId },
    fresh.billingStartAt,
  );
  const claimed = await claimBillingNotified(row.userId, nowIso);
  if (!claimed) return false;
  const sent = await sendChargeAlert({
    fullName: row.fullName,
    email: row.email,
    eaName: fresh.eaName || row.eaName,
    billingStartAt: fresh.billingStartAt,
    stripeCustomerId: row.stripeCustomerId,
    subscriptionStarted: Boolean(subscriptionId),
  });
  if (!sent) {
    await releaseBillingNotified(row.userId, nowIso);
    return false;
  }
  return true;
}

async function autoClientRetry(row: MatchWork, fresh: MatchPackage, nowIso: string): Promise<void> {
  if (fresh.acceptanceMethod !== 'auto' || fresh.clientNotifiedAt) return;
  const claimed = await claimClientNotified(row.userId, nowIso);
  if (!claimed) return;
  const sent = await sendMatchAutoClientEmail({
    to: row.email,
    fullName: row.fullName,
    eaName: fresh.eaName || row.eaName,
  });
  if (!sent) await releaseClientNotified(row.userId, nowIso);
}

/** Hourly pass: reminder, auto-accept, and billing start. One row never stops the rest. */
export async function runMatchCron(now = new Date()): Promise<{ reminded: number; autoAccepted: number; billed: number }> {
  const nowIso = now.toISOString();
  const rows = await listMatchWork();
  let reminded = 0;
  let autoAccepted = 0;
  let billed = 0;
  for (const row of rows) {
    try {
      if (!row.matchAcceptedAt && !row.declinedAt) {
        const deadline = deadlineFrom(row.matchReadyAt);
        const deadlineMs = deadline ? new Date(deadline).getTime() : Number.NaN;
        if (!deadline || Number.isNaN(deadlineMs)) continue;
        if (now.getTime() >= deadlineMs) {
          if (await autoAccept(row, nowIso)) autoAccepted += 1;
          continue;
        }
        if (!row.reminderSentAt && now.getTime() >= deadlineMs - DAY_MS) {
          if (await remind(row, nowIso)) reminded += 1;
        }
        continue;
      }
      if (!row.matchAcceptedAt) continue;
      await openBillingStart(row.userId, nowIso);
      const fresh = await getMatchByUserId(row.userId);
      if (!fresh) continue;
      if (await bill(row, fresh, nowIso)) billed += 1;
      await autoClientRetry(row, fresh, nowIso);
    } catch (err) {
      console.error('match cron row failed', row.userId, err instanceof Error ? err.message : 'error');
    }
  }
  return { reminded, autoAccepted, billed };
}

/** After kickoff is marked done, open billing if that date is the earlier one. */
export async function settleBillingForUser(userId: string): Promise<void> {
  const nowIso = new Date().toISOString();
  await openBillingStart(userId, nowIso);
  const match = await getMatchByUserId(userId);
  const user = await getUserById(userId);
  if (!match?.billingStartAt || !user || match.billingNotifiedAt) return;
  const row: MatchWork = {
    ...match,
    email: user.email,
    fullName: user.fullName,
    plan: user.plan,
    stripeCustomerId: user.stripeCustomerId,
    defaultPaymentMethodId: user.defaultPaymentMethodId,
  };
  await bill(row, match, nowIso);
}
