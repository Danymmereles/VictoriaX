# Guía rápida para levantar y probar VictoriaX

Esta guía cubre el frontend, los usuarios demo locales y el inicio de sesión real con Supabase Auth. No hace falta levantar PostgreSQL ni la API de `backend/` para probar autenticación desde el frontend.

## Requisitos

- Node.js 20 o superior y npm.
- Acceso al repositorio y, para la prueba real, al proyecto Supabase configurado.

## 1. Instalar y levantar el frontend

Desde la raíz del repositorio:

```bash
npm install
npm run dev
```

Abrí la dirección local que muestra Vite, normalmente `http://localhost:5173`.

## 2.1 Probar sin conectar una base

En desarrollo, la autenticación local está activada por defecto. No necesita `.env.local`, Supabase, PostgreSQL ni la API. En **Iniciar sesión**, usá una de estas cuentas:

| Usuario | Contraseña | Rol |
|---|---|---|
| `alumno@frba.utn.edu.ar` | `VictoriaX123` | `ALUMNO` |
| `docente@frba.utn.edu.ar` | `VictoriaX123` | `DOCENTE` |
| `admin@frba.utn.edu.ar` | `VictoriaX123` | `ADMIN` |

También podés registrarte desde el formulario: las cuentas nuevas locales empiezan como estudiantes y quedan guardadas en el navegador. El admin demo puede editar participantes y roles. Esta información es local a ese navegador; borrar sus datos del sitio la elimina.

## 2.2 Probar Supabase Auth

1. En el panel de Supabase, confirmá que esté habilitado el proveedor de autenticación por email y contraseña.
2. En **Authentication → URL Configuration**, agregá `http://localhost:5173` como URL de redirección permitida. Si Vite muestra otro puerto, usá esa dirección.
3. En la raíz del proyecto, creá o editá el archivo `.env.local` que tendrá las credenciales de Supabase:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

   Reemplazá los dos primeros valores con la URL y la publishable key del proyecto. `.env.local` está ignorado por Git. No pongas claves `secret` o `service_role` en variables `VITE_`.
4. Reiniciá `npm run dev` para que Vite cargue las variables. Con `VITE_LOCAL_AUTH=false`, las cuentas demo y otras cuentas ya guardadas localmente siguen usando el navegador; las cuentas nuevas usan Supabase.
5. En el formulario **Crear cuenta**, registrá un email de prueba distinto de las cuentas demo. El registro admite cualquier email; para iniciar sesión en Modo Estudio, el login requiere `@frba.utn.edu.ar`.
6. Si Supabase tiene habilitada la confirmación de email, abrí el correo de confirmación antes de iniciar sesión. Si está deshabilitada, el alta puede dejar la sesión iniciada directamente.
7. Iniciá sesión, recargá la página para comprobar que la sesión persiste y luego cerrala desde **Salir**. En el panel **Authentication → Users** podés comprobar que la cuenta quedó creada.

Las cuentas creadas en Supabase son independientes de los usuarios demo del navegador. Si un email ya está registrado, el formulario informa que hay que iniciar sesión en lugar de indicar que envió una confirmación. Los nuevos registros se tratan como `ALUMNO`; los roles especiales de prueba (`DOCENTE` y `ADMIN`) solo están disponibles en el modo local demo. La autenticación no crea registros de usuario en PostgreSQL.

## Qué servicios usa cada prueba

| Prueba | Frontend | Supabase Auth | Base de negocio / API |
|---|---|---|---|
| Usuarios demo locales | Sí | No | No |
| Registro e inicio de sesión reales | Sí | Sí, excepto las cuentas demo que siguen siendo locales en desarrollo | No |
| Cursos, ejercicios y demás datos de la app | Sí | No para autenticación | Actualmente usan las entidades Base44 existentes |

La API y PostgreSQL de `backend/` tienen una configuración y un flujo de pruebas propios; no son necesarios para los pasos anteriores. Las tablas de negocio en PostgreSQL y la migración de los datos que hoy usan Base44 quedan para una etapa posterior.

## Problemas frecuentes

- **Quiero usar Supabase pero también probar los usuarios demo:** dejá `VITE_LOCAL_AUTH=false`; en desarrollo las cuentas demo/guardadas localmente siguen usando el navegador y los emails nuevos se autentican con Supabase.
- **Faltan variables de Supabase:** comprobá los nombres `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`, sin comillas ni espacios alrededor del `=`.
- **No llega el correo:** revisá la configuración SMTP/confirmación de email y la carpeta de spam del proyecto Supabase.
- **Falla el acceso al Modo Estudio:** usá un email `@frba.utn.edu.ar`; el formulario de registro, en cambio, permite otros dominios.
