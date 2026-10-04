# Base44 Project

Use this repository to run and edit the app locally, then publish changes back through Base44.

Any change pushed to the repo will also be reflected in the Base44 Builder.

## Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. Install the Base44 CLI: `npm install -g base44@latest`.

See the [Base44 CLI docs](https://docs.base44.com/developers/references/cli/get-started/overview) if you want to run Base44 commands directly.

## Run Locally

Run the full local development environment from the project root:

```bash
base44 dev
```

`base44 dev` starts the local Base44 development backend and, when this app is configured for it, also starts the frontend dev server for you. Use the frontend URL printed by the command.

For example, when the Base44 project config includes a `serveCommand`, `base44 dev` can launch the frontend too:

```json5
{
  "site": {
    "serveCommand": "npm run dev"
  }
}
```

In a Base44 project this lives in `base44/config.jsonc`.

For a short Spanish guide to starting the frontend and testing local demo users or Supabase Auth, see [Guía rápida para levantar y probar VictoriaX](docs/PRUEBAS-LOCALES.md).

## Run Only The Frontend

If you only want to work on the frontend against the hosted Base44 backend, run:

```bash
npm run dev
```

Open the local URL printed by Vite.

## Use The Hosted Backend

For frontend-only development, create or update `.env.local` in the project root:

```bash
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
```

`VITE_BASE44_APP_ID` identifies the Base44 app.

`VITE_BASE44_APP_BASE_URL` tells the Base44 Vite plugin where to send local `/api` requests. Point it at your deployed Base44 app URL when you want the local frontend to use the hosted backend.

When you use `base44 dev`, the command injects the local Base44 values for you, so `.env.local` is mainly needed for frontend-only workflows.

## Frontend authentication (Supabase Auth)

The existing login and registration screens authenticate directly with Supabase Auth through `src/api/authClient.js`. In development, only the three predefined demo users use local authentication; every other login and new registration uses Supabase Auth. Configure the root `.env.local` with the Supabase project URL and publishable key to use Supabase. The demo accounts can still be tested without these variables.

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The publishable key is intended for frontend use. Never expose a Supabase secret/service-role key through a `VITE_` variable.
For hosted builds, configure these same `VITE_SUPABASE_*` variables in the hosting environment; `.env.local` is ignored and stays on the developer machine.

The frontend expires Supabase and local demo sessions seven days after login; activity does not extend the deadline, and open tabs share the session state. Existing sessions without a recorded start time receive one initial seven-day window. This client-side limit is for application behavior only and is not a server-enforced security boundary.

## Standalone Auth API (Supabase + PostgreSQL)

The separate API in `backend/` uses Node.js 20+, the Supabase Auth SDK, Drizzle ORM and PostgreSQL's `pg` driver; the HTTP server and test runner are built into Node. The frontend login does not call this API. It remains available for standalone API development and its database integration tests.

Registration accepts any valid email and creates the account with the `ALUMNO` role when using the standalone API. Only Modo Estudio requires an `@frba.utn.edu.ar` address; that restriction is checked at login and again by the protected API, not just by the frontend.

### Local setup

1. For standalone API development (not needed for the frontend demo), start a **local** Supabase stack and local PostgreSQL. Set `SUPABASE_URL` and its local anon/service-role keys in `backend/.env` (copy `backend/.env.example`). For the local Supabase defaults, the URLs are `http://127.0.0.1:54321` and `postgresql://postgres:postgres@127.0.0.1:54322/postgres`.
2. Run the SQL migration against the local database from the repository root: `cd backend && set -a && . ./.env && set +a && psql "$DATABASE_URL" -f migrations/0001_identity_shadow_schema.sql`.
3. Install the API dependencies: `cd backend && npm install`.
4. Create or refresh the local test account and its shadow row: `npm run seed:local`.
5. Start the API with `npm start` to test it independently. The frontend does not require this API or PostgreSQL to authenticate through Supabase.
6. Run the API tests with `npm test`.

The frontend's local demo auth provides these three accounts without contacting Supabase, the API, or PostgreSQL. All other frontend registrations use Supabase Auth; they are not saved in the browser's local user list:

| Email | Password | Role |
|---|---|---|
| `alumno@frba.utn.edu.ar` | `VictoriaX123` | `ALUMNO` |
| `docente@frba.utn.edu.ar` | `VictoriaX123` | `DOCENTE` |
| `admin@frba.utn.edu.ar` | `VictoriaX123` | `ADMIN` |

When signed in as the local admin, open **Participantes → Editar** to change the demo users' roles. These accounts and role changes stay only in this browser; clearing its site data removes them. Local demo accounts do not create Supabase users or authorize requests to the standalone API. To seed the alumno in local Supabase and PostgreSQL for API testing, run `npm run seed:local`; this seed refuses to run unless **both** services resolve to localhost/127.0.0.1/::1. Never use these shared test credentials in a hosted environment. Keep Supabase secret/service-role keys server-side.

The migration creates the specified user, resolution, feedback, course membership and model-version tables. `CURSO` and `EJERCICIO` include only their key columns because their remaining attributes were not part of the supplied schema. The registration endpoint creates the Supabase identity first and compensates by deleting it if the RDS shadow insert fails; a cross-database ACID transaction is not possible.

New Supabase registrations are treated as `ALUMNO`; the frontend never accepts a role from the signup form. The local demo accounts retain their existing roles. Any future persistent role change must use a trusted admin operation, not client-editable user metadata.

Frontend signup, login and session validation use Supabase Auth directly; the standalone API's separate auth endpoints and PostgreSQL user-shadow table are not part of that frontend flow. Existing course/exercise frontend CRUD still uses the current Base44 entities and needs a separate migration before PostgreSQL can become the business-data store.

## Publish Your Changes

After pushing your changes to git, open the Base44 dashboard and publish the app:

```bash
base44 dashboard open
```

## Docs & Support

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Base44 CLI command reference: [https://docs.base44.com/developers/references/cli/commands/introduction](https://docs.base44.com/developers/references/cli/commands/introduction)

Support: [https://app.base44.com/support](https://app.base44.com/support)
