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

Los usuarios, contraseñas y sesiones viven en **MySQL** y se gestionan con la API de `backend/` (Node.js 20+, Drizzle ORM y `mysql2`). El frontend (`src/api/authClient.js`) llama a esa API; ya no usa Supabase ni la entidad `Usuario` de Base44. También están en MySQL los ejercicios (`EJERCICIO`) y el análisis previo de cada usuario (`ANALISIS_PREVIO` + `RESOLUCION`, en Modo Estudio y Modo Libre). También los cursos (`CURSO`) y sus integrantes (`INSCRIPCION`): el administrador ve todos los de su institución y es el único que los crea, edita y elimina; docentes y alumnos ven solo los cursos donde están inscriptos, y los docentes gestionan integrantes y ven el avance de sus alumnos. Los cursos de Base44 se importan con `npm run import:cursos -- <archivo.json>` (sin inscripciones).

- Cada análisis previo tiene su `RESOLUCION`: con `id_ejercicio` en Modo Estudio (una por usuario y ejercicio) o sin ejercicio en Modo Libre (sin límite). Estados: `BORRADOR` → `ENTREGADO` (al entregar) → `FINALIZADO` (cuando el alumno ve la resolución; ya no se puede modificar).

- Las contraseñas se guardan con **scrypt**; nunca en claro.
- Cada login verificado y activo crea una sesión de **7 días** en `SESION` (se guarda el SHA-256 del token). Cerrar sesión la borra; cambiar o recuperar la contraseña cierra las demás sesiones.
- El registro requiere confirmar el email. La cuenta queda sin sesión hasta usar el enlace de verificación, válido por 24 horas. Los enlaces de recuperación vencen en una hora y solo pueden usarse una vez.
- Las cuentas pueden estar `ACTIVO` o `SUSPENDIDO`; suspender una cuenta invalida sus sesiones activas. La API envía notificaciones con Resend si `RESEND_API_KEY` y `EMAIL_FROM` están configurados; sin clave, registra el destinatario, asunto y contenido/enlace para pruebas locales.
- El registro y el login aceptan cualquier email válido. Cuentas `@frba.utn.edu.ar` y `@frre.utn.edu.ar` tienen acceso a Modo Estudio; las demás se registran con institución `Externa` y usan Modo Libre. Login y `/api/auth/me` devuelven `puedeUsarModoEstudio`.
- Solo un `ADMIN` puede editar a otros usuarios, cambiar roles o instituciones. El listado de participantes devuelve solo los usuarios de la misma institución.
- `SUPER_ADMIN` ve y administra todas las instituciones: filtra participantes y cursos por institución y elige de qué institución ver la guía del Modo Estudio (`?institucion=` en `/api/usuarios`, `/api/ejercicios` y `/api/cursos`; para el resto de los roles ese parámetro se ignora). Solo otro `SUPER_ADMIN` puede otorgar o quitar el rol; el primero se crea con `npm run set:super-admin -- <email>`.

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
| GET, POST | `/api/ejercicios` | Bearer |
| GET, PATCH, DELETE | `/api/ejercicios/:id` | Bearer |
| GET | `/api/resoluciones?ejercicio=:id` · `?modo=libre` | Bearer |
| POST | `/api/resoluciones` | Bearer |
| GET, PATCH | `/api/resoluciones/:id` | Bearer |
| GET | `/api/instituciones` | Bearer |
| GET, POST | `/api/cursos` | Bearer |
| GET, PATCH, DELETE | `/api/cursos/:id` | Bearer |
| POST | `/api/cursos/:id/integrantes` | Bearer |
| DELETE | `/api/cursos/:id/integrantes/:idUsuario` | Bearer |
| GET | `/api/cursos/:id/resoluciones` | Bearer |

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
| `superadmin@frba.utn.edu.ar` | `VictoriaX123` | `SUPER_ADMIN` |

## Publish Your Changes

After pushing your changes to git, open the Base44 dashboard and publish the app:

```bash
base44 dashboard open
```

## Docs & Support

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Base44 CLI command reference: [https://docs.base44.com/developers/references/cli/commands/introduction](https://docs.base44.com/developers/references/cli/commands/introduction)

Support: [https://app.base44.com/support](https://app.base44.com/support)
