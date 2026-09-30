function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const EYE_OPEN = `<svg class="eye-open" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
const EYE_SHUT = `<svg class="eye-shut" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A11 11 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-4.1 4.6M6.1 6.7C3.6 8.4 2 12 2 12s3.5 7 10 7a11 11 0 0 0 4.2-.8M9.9 9.9a3 3 0 0 0 4.2 4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function passwordToggle(id: string): string {
  return `<button type="button" class="eye" aria-label="Show password" aria-pressed="false" aria-controls="${id}" onclick="var i=document.getElementById(this.getAttribute('aria-controls'));if(!i)return;var s=i.type==='password';i.type=s?'text':'password';this.setAttribute('aria-pressed',s?'true':'false');this.setAttribute('aria-label',s?'Hide password':'Show password');this.classList.toggle('is-shown',s);">${EYE_OPEN}${EYE_SHUT}</button>`;
}

/**
 * Safari already keeps a password-manager fill on a normal input. Chrome
 * (including Face ID) only previews the login, then drops it when React
 * hydration clears the input name. These stay plain HTML: no value, no
 * onChange, and Chrome's username / current-password tokens.
 */
export default function LoginForm({ signupHref, error }: { signupHref: string; error: string }) {
  const errorHtml = error
    ? `<div class="note err" role="alert">${escapeHtml(error)}</div>`
    : '';
  const html = `<form action="/api/auth/login" method="post" autocomplete="on"><div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="you@company.com" required></div><div class="field"><label for="password">Password</label><div class="pw"><input id="password" name="password" type="password" autocomplete="current-password" required>${passwordToggle('password')}</div></div>${errorHtml}<button class="btn btn-primary btn-full" type="submit">Sign in</button><p class="auth-foot">New client? <a href="${escapeHtml(signupHref)}">Complete signup</a> after your discovery call.</p></form>`;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
