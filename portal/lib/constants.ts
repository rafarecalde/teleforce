// Versioned acknowledgment text (kept for when this is wired to real billing).
export const ACK_VERSION = 'v1';

export const SWITCH_ACK_TEXT =
  'I agree to amend my Executive Assistant Services Agreement to a 12-month initial period beginning today, at the 12-month rate. All other terms remain unchanged.';

export const ADD_EA_ACK_TEXT =
  "This request is an additional order under my existing Executive Assistant Services Agreement. I won't be charged until the new EA starts.";

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
