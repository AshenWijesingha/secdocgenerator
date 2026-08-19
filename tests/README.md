# Tests

## `rls.test.sql` — Row Level Security

The security of this app rests on one claim: **a portal's config cannot be read
without going through the resolve-portal Edge Function.** If that fails,
revocation, expiry, view limits and passcodes all become advisory.

Run it against a throwaway Postgres (no Supabase account needed):

```bash
export PATH=/usr/lib/postgresql/16/bin:$PATH
initdb -D /tmp/pg -A trust -U postgres
pg_ctl -D /tmp/pg -o "-k /tmp -p 55432" -l /tmp/pg.log start
createdb -h /tmp -p 55432 -U postgres sdtest

# stub the pieces Supabase provides
psql -h /tmp -p 55432 -U postgres -d sdtest <<'SQL'
create schema auth;
create table auth.users (id uuid primary key, email text);
create role anon nologin; create role authenticated nologin;
create role service_role nologin bypassrls;
create function auth.uid() returns uuid language sql stable as
  $f$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $f$;
SQL

for f in supabase/migrations/*.sql; do
  psql -v ON_ERROR_STOP=1 -h /tmp -p 55432 -U postgres -d sdtest -f "$f"
done
psql -h /tmp -p 55432 -U postgres -d sdtest -f tests/rls.test.sql
```

Cases 1, 2, 3, 9, 10 and 13 are expected to raise errors — that is the pass
condition. Case 6 must report `UPDATE 0` (a silent no-op, not a steal).

## `qr.test.mjs` — QR encoder

Checks the encoder module-for-module against the `qrcode` reference for every
version 1-20 and round-trips output through the `jsqr` decoder. Both are
dev-only:

```bash
npm i -D qrcode jsqr && node tests/qr.test.mjs
```
