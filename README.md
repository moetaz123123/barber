# Barber Booking

## Deploy frontend and API together on Vercel

Create a Vercel project from the repository root. The Vite client is built to
`client/dist`, while requests under `/api/*` are handled by the Express
serverless function in `api/[...path].js`. The client uses relative `/api`
requests when `VITE_API_URL` is not set, so the deployed website and API share
one public URL.

Set these environment variables in the Vercel project settings:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never prefix this with `VITE_`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `CLIENT_ORIGIN` (the deployed website URL)
- `ADMIN_APPOINTMENTS_URL` (the deployed website URL followed by `/admin/rendez-vous`)
- `SMTP_USER`, `SMTP_PASSWORD`, and, if needed, `SMTP_HOST` / `SMTP_PORT`
- `NOTIFICATION_EMAIL`
- `BUSINESS_TIMEZONE` (normally `Africa/Tunis`)

Do not set `VITE_API_URL` for this same-domain deployment. Keep `server/.env`
local and configure production secrets through Vercel's environment settings.

After deployment, verify `/api/health`, public services and availability,
booking submission, admin login, image upload, and email notifications.