function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Plain HTML, not React <input> elements. On hydration React briefly clears
 * an input's name, and Chrome then drops the password-manager fill.
 */
export default function LoginForm({ signupHref, error }: { signupHref: string; error: string }) {
  const errorHtml = error
    ? `<div class="note err" role="alert">${escapeHtml(error)}</div>`
    : '';
  const html = `<form action="/api/auth/login" method="post" autocomplete="on"><div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="username" placeholder="you@company.com" required></div><div class="field"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required></div><button class="btn btn-primary btn-full" type="submit">Sign in</button>${errorHtml}<p class="muted" style="font-size:12.5px;margin-top:14px">New client? <a href="${escapeHtml(signupHref)}">Complete signup</a> after your discovery call.</p></form>`;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
