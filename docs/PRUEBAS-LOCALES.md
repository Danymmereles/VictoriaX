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

En desarrollo, estas tres cuentas demo usan autenticación local automáticamente; no necesitan `.env.local`, Supabase, PostgreSQL ni la API. Las demás cuentas, y todos los registros nuevos, usan Supabase Auth.

| Usuario | Contraseña | Rol |
|---|---|---|
| `alumno@frba.utn.edu.ar` | `VictoriaX123` | `ALUMNO` |
| `docente@frba.utn.edu.ar` | `VictoriaX123` | `DOCENTE` |
| `admin@frba.utn.edu.ar` | `VictoriaX123` | `ADMIN` |

El admin demo puede editar los perfiles y roles de estas cuentas. Esos cambios quedan en el navegador; borrar sus datos del sitio los elimina. Registrarse con uno de los emails demo está reservado y se debe iniciar sesión con su contraseña de prueba.

Las sesiones demo y Supabase vencen siete días después del inicio de sesión, aunque se siga usando la app. El vencimiento se comparte entre pestañas del mismo navegador; al vencer, la app cierra la sesión. Las sesiones que ya existían al publicar el cambio reciben una ventana inicial de siete días desde la primera apertura. Es un límite aplicado por el frontend, no por el servidor.

Para simular el vencimiento sin esperar siete días, con una sesión iniciada ejecutá en la consola del navegador `localStorage.setItem("victoriax-auth-started-at", String(Date.now() - 8 * 24 * 60 * 60 * 1000))` y recargá la página; las otras pestañas abiertas del mismo sitio también deben cerrar la sesión.

## 2.2 Probar Supabase Auth

1. En el panel de Supabase, confirmá que esté habilitado el proveedor de autenticación por email y contraseña.
2. En **Authentication → URL Configuration**, agregá `http://localhost:5173` como URL de redirección permitida. Si Vite muestra otro puerto, usá esa dirección.
3. En la raíz del proyecto, creá o editá el archivo `.env.local` que tendrá las credenciales de Supabase:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

   Reemplazá los dos valores con la URL y la publishable key del proyecto. `.env.local` está ignorado por Git. No pongas claves `secret` o `service_role` en variables `VITE_`.
4. Reiniciá `npm run dev` para que Vite cargue las variables. Las cuentas demo siguen usando autenticación local; las demás cuentas y los nuevos registros van a Supabase.
5. En el formulario **Crear cuenta**, registrá un email de prueba distinto de las cuentas demo. El registro admite cualquier email; para iniciar sesión en Modo Estudio, el login requiere `@frba.utn.edu.ar`.
6. Si Supabase tiene habilitada la confirmación de email, abrí el correo de confirmación antes de iniciar sesión. Si está deshabilitada, el alta puede dejar la sesión iniciada directamente.
7. Iniciá sesión, recargá la página y abrí otra pestaña del mismo sitio para comprobar que la sesión persiste y se comparte; luego cerrala desde **Salir**. En el panel **Authentication → Users** podés comprobar que la cuenta quedó creada.
8. En **Mi perfil**, seleccioná **Cambiar contraseña**. En la página nueva, ingresá la contraseña actual, una nueva de al menos 8 caracteres y su confirmación. Para Supabase se verifica la contraseña actual antes de actualizarla; las cuentas demo guardan el cambio de forma local. Podés volver al perfil con el enlace de la parte superior.

Las cuentas creadas en Supabase son independientes de los usuarios demo del navegador. Si un email ya está registrado, el formulario informa que hay que iniciar sesión en lugar de indicar que envió una confirmación. Los nuevos registros se tratan como `ALUMNO`; los roles especiales de prueba (`DOCENTE` y `ADMIN`) solo están disponibles en el modo local demo. La autenticación no crea registros de usuario en PostgreSQL.

## Qué servicios usa cada prueba

| Prueba | Frontend | Supabase Auth | Base de negocio / API |
|---|---|---|---|
| Usuarios demo locales | Sí | No | No |
| Registro e inicio de sesión de otras cuentas | Sí | Sí | No |
| Cursos, ejercicios y demás datos de la app | Sí | No para autenticación | Actualmente usan las entidades Base44 existentes |

La API y PostgreSQL de `backend/` tienen una configuración y un flujo de pruebas propios; no son necesarios para los pasos anteriores. Las tablas de negocio en PostgreSQL y la migración de los datos que hoy usan Base44 quedan para una etapa posterior.

## Problemas frecuentes

- **Quiero probar un usuario demo sin Supabase:** iniciá sesión con una de las tres cuentas de demo; no necesitás variables de Supabase para ese flujo.
- **Faltan variables de Supabase:** comprobá los nombres `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`, sin comillas ni espacios alrededor del `=`.
- **No llega el correo:** revisá la configuración SMTP/confirmación de email y la carpeta de spam del proyecto Supabase.
- **Falla el acceso al Modo Estudio:** usá un email `@frba.utn.edu.ar`; el formulario de registro, en cambio, permite otros dominios.
