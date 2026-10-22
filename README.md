# Barber Booking

## Deploy frontend and API together on Vercel

Import the repository root as one Vercel project. The root `vercel.json`
defines two Vercel Services:

- `client` builds the Vite app from `client/` and serves its `dist/` output.
- `server` runs the Express app from `server/`.

Public requests to `/api/*` are routed to `server`; all other requests go to
`client`. The client app also rewrites page URLs such as `/services` to its
`index.html` so React Router can handle them. The browser calls the API using
relative `/api` URLs, keeping the same public domain without a service binding.

Set these environment variables in the Vercel project settings:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never prefix this with `VITE_`)
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (needed by the client service for admin login; set them for Production and Preview as needed)
- `CLIENT_ORIGIN` (the deployed website URL)
- `ADMIN_APPOINTMENTS_URL` (the deployed website URL followed by `/admin/rendez-vous`)
- `SMTP_USER`, `SMTP_PASSWORD`, and, if needed, `SMTP_HOST` / `SMTP_PORT`
- `NOTIFICATION_EMAIL`
- `BUSINESS_TIMEZONE` (normally `Africa/Tunis`)

Do not set `VITE_API_URL` for this same-domain deployment. Keep `server/.env`
local and configure production secrets through Vercel's environment settings.
Vite embeds `VITE_` variables into the client during its build, so redeploy
after adding or changing them. Use the Supabase anon/publishable key for
`VITE_SUPABASE_ANON_KEY`, never the service-role key.

After deployment, verify `/api/health`, public services and availability,
booking submission, admin login, image upload, and email notifications.