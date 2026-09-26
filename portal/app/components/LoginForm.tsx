function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
  const html = `<form action="/api/auth/login" method="post" autocomplete="on"><div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="you@company.com" required></div><div class="field"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required></div><button class="btn btn-primary btn-full" type="submit">Sign in</button>${errorHtml}<p class="muted" style="font-size:12.5px;margin-top:14px">New client? <a href="${escapeHtml(signupHref)}">Complete signup</a> after your discovery call.</p></form>`;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
