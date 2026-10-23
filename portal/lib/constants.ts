// Versioned acknowledgment text. Bump when the sentence the client agrees to changes.
export const ACK_VERSION = 'v2';

export const SWITCH_ACK_TEXT =
  'I agree to switch to a 12-month initial period beginning today, at the 12-month rate, under the Teleforce Terms and my Order. All other terms remain unchanged.';

export const ADD_EA_ACK_TEXT =
  'This request is an additional order under the Teleforce Terms. Nothing is charged while we search and match. Billing starts when that EA kicks off, or 3 business days after I accept the match.';

export const SESSION_COOKIE = 'tf_session';
export const SESSION_TTL_DAYS = 7;

/** Same URL as src/consts.ts ONBOARDING_CALENDLY_URL. Inline widget via Calendly’s widget.js. */
export const ONBOARDING_CALENDLY_URL = 'https://calendly.com/tryteleforce-sales';
