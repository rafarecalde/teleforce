`terms.md` in this directory is a byte-for-byte copy of `src/legal/terms.md`.

The portal hashes this file when someone accepts the Terms at signup. The
marketing page at `/terms` renders the source file. Keep the two copies
identical whenever counsel changes the Terms, then redeploy the portal and the
marketing site.

If a running portal can read both files and they differ, signup stops rather
than record acceptance of the wrong text. Re-acceptance for people who already
have an account is not implemented.
