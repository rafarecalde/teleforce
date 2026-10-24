// Versioned acknowledgment text. Bump when the sentence the client agrees to changes.
export const ACK_VERSION = 'v3';

export const SWITCH_ACK_TEXT =
  'I agree to switch to a 12-month initial period beginning today, at the 12-month rate, under the Teleforce Terms and my Order. All other terms remain unchanged.';

/** Client-facing billing line. Same substance as src/consts.ts EA_PAY_LINE. */
export const BILLING_LINE =
  'Nothing is charged at signup. Billing starts at kickoff or 3 business days after you accept — whichever comes first — or the day your match is accepted automatically. Then the same day each month.';

export const ADD_EA_ACK_TEXT =
  'This request is an additional order under the Teleforce Terms. Nothing is charged at signup. Billing starts when that EA kicks off or 3 business days after I accept — whichever comes first — or the day the match is accepted automatically. Then the same day each month.';

export const SESSION_COOKIE = 'tf_session';
export const SESSION_TTL_DAYS = 7;

/** Same default as src/consts.ts. Override with ONBOARDING_CALENDLY_URL. */
export const ONBOARDING_CALENDLY_URL = 'https://calendly.com/tryteleforce-sales';

/**
 * Scheduler for the onboarding call. `ONBOARDING_CALENDLY_URL` wins when it
 * is an http(s) URL. Otherwise the default above is used.
 */
export function onboardingCalendlyUrl(): string {
  const configured = process.env.ONBOARDING_CALENDLY_URL?.trim() ?? '';
  if (!configured) return ONBOARDING_CALENDLY_URL;
  try {
    const url = new URL(configured);
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) {
      console.error('ONBOARDING_CALENDLY_URL is not an http(s) URL; using the default');
      return ONBOARDING_CALENDLY_URL;
    }
    return url.href;
  } catch {
    console.error('ONBOARDING_CALENDLY_URL is not an http(s) URL; using the default');
    return ONBOARDING_CALENDLY_URL;
  }
}

/**
 * Scheduler for the kickoff after a match is accepted. `KICKOFF_CALENDLY_URL`
 * wins when it is an http(s) URL. Otherwise kickoff uses the onboarding
 * scheduler, which itself defaults to `ONBOARDING_CALENDLY_URL`.
 */
export function kickoffCalendlyUrl(): string {
  const configured = process.env.KICKOFF_CALENDLY_URL?.trim() ?? '';
  if (!configured) return onboardingCalendlyUrl();
  try {
    const url = new URL(configured);
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) {
      console.error('KICKOFF_CALENDLY_URL is not an http(s) URL; using the onboarding scheduler');
      return onboardingCalendlyUrl();
    }
    return url.href;
  } catch {
    console.error('KICKOFF_CALENDLY_URL is not an http(s) URL; using the onboarding scheduler');
    return onboardingCalendlyUrl();
  }
}
