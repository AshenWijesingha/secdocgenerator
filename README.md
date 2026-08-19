# SecureDoc Portal

Build a protected viewer for a Google Doc — copy blocking, watermarking,
session limits, DevTools detection — and share it as a link or a QR code.

**Frontend:** Next.js static export on GitHub Pages.
**Backend:** Supabase (Postgres + RLS + one Edge Function).

GitHub Pages cannot run server code, so the backend is Supabase rather than
Next.js API routes. [docs/BACKEND.md](docs/BACKEND.md) explains the split and
the security model.

## Layout

```
app/            Next.js App Router — builder, viewer, owner dashboard
lib/            shared logic: portal builder, QR encoder, embed URLs, config codec
supabase/       migrations + the resolve-portal Edge Function
tests/          SQL policy tests and the QR encoder verification
index.html      the original dependency-free single-file generator
```

`index.html` still works on its own with no build step and no backend — open
it from disk and it generates a portal. It is copied to `/standalone.html` on
deploy and stays the offline fallback.

## Development

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # static export into out/
```

Without Supabase configured the app still runs: it produces self-contained
fragment links, and the short-link features explain that they need a backend.

## What the protections actually do

The in-portal measures are deterrents against casual copying, not a guarantee.
Anyone who can read a document on screen can photograph it. What the backend
adds is control over the *link* — revoke it, expire it, cap the number of
opens, require a passcode, and see every attempt including the refused ones.
