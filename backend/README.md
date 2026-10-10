# Mukiria Eats API

Node.js 20+ REST API for the Mukiria Eats frontend. It preserves the frontend's
`/api` routes and `{ success, message, data }` response envelope. Supabase
Postgres, Supabase Auth, and Supabase Storage replace Django's database,
authentication, and media services.

## Local setup

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql)
   in its SQL Editor.
2. Copy `.env.example` to `.env`; set the project URL, anon key, and service-role
   key from Supabase project settings. Keep the service-role key on the server.
3. Install and start the API:

   ```sh
   npm ci
   npm run dev
   ```

   The API listens on port `8000`, matching the frontend's default
   `http://localhost:8000/api` URL. Set `VITE_API_BASE` in the frontend only when
   deploying the API at a different origin or path.
4. Create each staff user in Supabase Authentication, then insert a matching
   `staff_profiles` row with the same auth user UUID and email. Set the username,
   role (`administrator` or `cashier`), and `is_active`. Staff login accepts that
   username and the Supabase Auth password.
5. Add menu items via the staff dashboard. Meal images are uploaded to the
   public `meal-images` bucket through the API.

## M-Pesa

Set the Daraja credentials and a publicly reachable HTTPS `MPESA_CALLBACK_URL`
in production. Configure the same callback URL in Daraja. Keep `MPESA_ENV` set
to `sandbox` until production credentials are issued. Customer orders always
start unpaid; only a valid Daraja callback can mark them paid.

## Production

- Deploy on a maintained Node.js 20+ runtime using `npm ci` and `npm start`.
- Set `NODE_ENV=production`, exact comma-separated `CORS_ALLOWED_ORIGINS`,
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Configure HTTPS at the platform/load balancer, public media access as required,
  database backups, and secrets in the deployment platform (not source control).
- Set `TRUST_PROXY=true` only when the service is behind a trusted single proxy.
- The `/health` and `/api/health/` endpoints are available for platform probes.
- Apply `supabase/schema.sql` as a privileged Supabase project administrator.
  The API uses the server-only service-role key and checks staff identity/role
  before every staff endpoint; end-user Supabase clients have no table policies.
- Old Django files and local SQLite/media assets are not used by the Node API.
  Export/import any required production records and migrate staff credentials to
  Supabase Auth before switching traffic.

## Checks

```sh
npm test
npm run check
```
