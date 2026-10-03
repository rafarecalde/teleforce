// Versioned acknowledgment text (kept for when this is wired to real billing).
export const ACK_VERSION = 'v1';

export const SWITCH_ACK_TEXT =
  'I agree to amend my Executive Assistant Services Agreement to a 12-month initial period beginning today, at the 12-month rate. All other terms remain unchanged.';

export const ADD_EA_ACK_TEXT =
  "This request is an additional order under my existing Executive Assistant Services Agreement. I won't be charged until the new EA starts.";

export const SESSION_COOKIE = 'tf_session';
export const SESSION_TTL_DAYS = 7;

/** Same URL as src/consts.ts ONBOARDING_CALENDLY_URL. Inline widget via Calendly’s widget.js. */
export const ONBOARDING_CALENDLY_URL = 'https://calendly.com/tryteleforce-sales';

/** Same sentence as EA_PAY_LINE in src/consts.ts. */
export const EA_PAY_LINE = 'You don’t pay until your EA starts.';

/**
 * Billing-start sentence from the /ea/signup pay-copy.
 * The earlier of kickoff (EA goes live) or 3 business days after match.
 */
export const SUBSCRIPTION_START_COPY =
  'Your subscription starts when your EA goes live, or 3 business days after you’ve been matched and met your EA — whichever comes first.';

/** Full /ea/signup pay-copy, under “Provide your payment information”. */
export const PAYMENT_STEP_COPY = `You won’t be charged at this step. ${SUBSCRIPTION_START_COPY}`;

/** /ea/signup #pay-note. */
export const PAYMENT_CARD_NOTE = 'Card details go through Stripe and aren’t stored on this site.';
