// Versioned acknowledgment text — store the version alongside the timestamp so
// we always know exactly which wording a client agreed to.
export const ACK_VERSION = 'v1';

export const SWITCH_ACK_TEXT =
  'I agree to amend my Executive Assistant Services Agreement to a 12-month initial period beginning today, at the 12-month rate. All other terms remain unchanged.';

export const ADD_EA_ACK_TEXT =
  "This request is an additional order under my existing Executive Assistant Services Agreement. I won't be charged until the new EA starts.";

export const SESSION_COOKIE = 'tf_session';
export const SESSION_TTL_DAYS = 7;
export const MAGIC_TTL_MIN = 15;

// Subscription statuses we treat as "current" in the portal.
export const LIVE_STATUSES: readonly string[] = ['active', 'trialing', 'past_due'];

// Rate limits for the login endpoint.
export const RL_WINDOW_MS = 15 * 60 * 1000;
export const RL_PER_EMAIL = 5;
export const RL_PER_IP = 20;
