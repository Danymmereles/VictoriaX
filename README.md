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

## Usuarios y autenticación (API propia + MySQL)

Los usuarios, contraseñas y sesiones viven en **MySQL** y se gestionan con la API de `backend/` (Node.js 20+, Drizzle ORM y `mysql2`). El frontend (`src/api/authClient.js`) llama a esa API; ya no usa Supabase ni la entidad `Usuario` de Base44. El resto de los datos (cursos, ejercicios, entregas) todavía está en Base44 y se va a migrar por etapas.

- Las contraseñas se guardan con **scrypt**; nunca en claro.
- Cada login verificado y activo crea una sesión de **7 días** en `SESION` (se guarda el SHA-256 del token). Cerrar sesión la borra; cambiar o recuperar la contraseña cierra las demás sesiones.
- El registro requiere confirmar el email. La cuenta queda sin sesión hasta usar el enlace de verificación, válido por 24 horas. Los enlaces de recuperación vencen en una hora y solo pueden usarse una vez.
- Las cuentas pueden estar `ACTIVO` o `SUSPENDIDO`; suspender una cuenta invalida sus sesiones activas. La API envía notificaciones con Resend si `RESEND_API_KEY` y `EMAIL_FROM` están configurados; sin clave, registra el destinatario, asunto y contenido/enlace para pruebas locales.
- El registro y el login aceptan cualquier email válido. Cuentas `@frba.utn.edu.ar` y `@frre.utn.edu.ar` tienen acceso a Modo Estudio; las demás se registran con institución `Externa` y usan Modo Libre. Login y `/api/auth/me` devuelven `puedeUsarModoEstudio`.
- Solo un `ADMIN` puede editar a otros usuarios, cambiar roles o instituciones. El listado de participantes devuelve solo los usuarios de la misma institución.

### Endpoints

| Método | Ruta | Auth |
|---|---|---|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/verify-email` | — |
| POST | `/api/auth/login` | — |
| POST | `/api/auth/forgot-password` | — |
| POST | `/api/auth/reset-password` | — |
| GET | `/api/auth/me` | Bearer |
| POST | `/api/auth/logout` | Bearer |
| POST | `/api/auth/password` | Bearer |
| GET | `/api/usuarios` | Bearer |
| PATCH | `/api/usuarios/:id` | Bearer |

`register` recibe `email`, `password`, `confirmPassword` y `nombreCompleto`; las contraseñas deben coincidir exactamente. `verify-email` recibe `{ "token": "..." }`. Recuperar contraseña usa `forgot-password` con `{ "email": "..." }` y `reset-password` con `{ "token": "...", "newPassword": "..." }`. `forgot-password` devuelve el mismo 200 exista o no una cuenta activa para ese email.

### Puesta en marcha local

1. MySQL corre en el contenedor Docker `victoriaX`, publicado en `127.0.0.1:3307` (base `victoriaX`, usuario de aplicación `victoriax_app`).
2. Copiá `backend/.env.example` a `backend/.env` y completá `DATABASE_URL`.
3. `cd backend && npm install`
4. `npm run migrate`: aplica los SQL de `backend/migrations/` que falten (se registran en la tabla `MIGRACION`).
5. `npm run seed:local`: crea o restablece las cuentas demo (solo con una base en localhost).
6. `npm start`: levanta la API en `http://localhost:3001`. Después, en la raíz, `npm run dev` para el frontend. Si la API está en otra URL, definí `VITE_API_URL` en `.env.local`.
7. `npm test`: tests de la API.

Cuentas demo (solo para desarrollo local):

| Email | Contraseña | Rol |
|---|---|---|
| `alumno@frba.utn.edu.ar` | `VictoriaX123` | `ALUMNO` |
| `docente@frba.utn.edu.ar` | `VictoriaX123` | `DOCENTE` |
| `admin@frba.utn.edu.ar` | `VictoriaX123` | `ADMIN` |

## Publish Your Changes

After pushing your changes to git, open the Base44 dashboard and publish the app:

```bash
base44 dashboard open
```

## Docs & Support

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Base44 CLI command reference: [https://docs.base44.com/developers/references/cli/commands/introduction](https://docs.base44.com/developers/references/cli/commands/introduction)

Support: [https://app.base44.com/support](https://app.base44.com/support)
