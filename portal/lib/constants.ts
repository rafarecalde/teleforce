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

/** Same URL as src/consts.ts ONBOARDING_CALENDLY_URL. Inline widget via Calendly’s widget.js. */
export const ONBOARDING_CALENDLY_URL = 'https://calendly.com/tryteleforce-sales';
