# Documentación de archivos — VictoriaX

Este documento describe, archivo por archivo, el código fuente del repositorio (proyecto **Base44** + **React/Vite**). Generado a partir del análisis del contenido real de cada archivo.

## Cómo leer las columnas

| Columna | Significado |
|---|---|
| **Frontend/Vistas** | ¿Renderiza UI, páginas o componentes visuales? |
| **Backend** | ¿Contiene lógica de servidor o de integración directa con el backend (no solo config)? |
| **Base de datos** | ¿Define esquemas de datos o hace lectura/escritura de datos persistentes? |
| **Configuración** | ¿Es configuración del proyecto/build/tooling? |
| **Seguridad** | ¿Maneja autenticación, roles, permisos o control de acceso? |
| **Depende de Base44** | ¿Necesita el SDK/backend/plataforma Base44 para funcionar? *Totalmente* = no funciona sin Base44. *Parcialmente* = usa Base44 solo para una parte (ej. imágenes alojadas, o solo lo referencia). *No* = funciona de forma autónoma. |
| **Módulo** | ¿A qué parte funcional de la app pertenece: **Modo Estudio**, **Modo Libre**, **Home** (landing), o **General** (transversal / compartido / no pertenece a ninguno de los anteriores)? |

> Nota: no se documentan `package-lock.json`, `dist/**` (salida de build generada automáticamente) ni `node_modules/` por ser artefactos generados, no código fuente escrito a mano.

---

## 1. Raíz del proyecto y configuración

| Archivo | Qué hace | Frontend/Vistas | Backend | Base de datos | Configuración | Seguridad | Depende de Base44 | Módulo |
|---|---|---|---|---|---|---|---|---|
| `.gitignore` | Define qué archivos/carpetas Git debe ignorar (env, logs, node_modules, dist, config local de Base44). | No | No | No | Sí | No | Parcialmente | General |
| `.npmrc` | Configura npm para aplicar un "cooldown" de 7 días antes de instalar versiones recién publicadas de paquetes (mitigación de supply-chain). | No | No | No | Sí | No | No | General |
| `AGENTS.md` | Guía para agentes de IA que trabajan en el repo: explica que es un proyecto Base44, comandos recomendados y archivos clave. | No | No | No | Sí | No | Totalmente | General |
| `README.md` | Documentación para desarrolladores: cómo clonar, instalar, correr localmente con el CLI de Base44 y publicar cambios. | No | No | No | Sí | No | Totalmente | General |
| `components.json` | Configuración de shadcn/ui: estilo, alias de rutas (`@/components`, `@/lib`, etc.) y ubicación de Tailwind/CSS para generar componentes UI. | No | No | No | Sí | No | No | General |
| `eslint.config.js` | Configuración de ESLint (reglas de React, hooks e imports no usados) aplicada a todo el frontend. | No | No | No | Sí | No | No | General |
| `index.html` | HTML raíz de la app Vite/React; monta `#root`, referencia el manifest y carga `src/main.jsx`; usa el logo de Base44 como favicon. | Sí | No | No | Sí | No | Parcialmente | General |
| `jsconfig.json` | Configuración de JS/TS (alias `@/*`, opciones del compilador) para tipado/autocompletado. | No | No | No | Sí | No | No | General |
| `package.json` | Manifiesto npm: scripts (dev/build/lint/typecheck) y dependencias, incluyendo `@base44/sdk` y `@base44/vite-plugin`. | No | No | No | Sí | No | Parcialmente | General |
| `postcss.config.js` | Configura PostCSS con los plugins Tailwind CSS y Autoprefixer para el pipeline de estilos. | No | No | No | Sí | No | No | General |
| `tailwind.config.js` | Configuración de Tailwind CSS: rutas de contenido, tema extendido (colores, radios, fuentes, animaciones). | Sí | No | No | Sí | No | No | General |
| `vite.config.js` | Configuración de Vite: registra el plugin oficial de Base44 (HMR, navegación, analytics, visual edit agent) y el plugin de React. | No | No | No | Sí | No | Totalmente | General |

## 2. Configuración y esquema de Base44 (`base44/`)

| Archivo | Qué hace | Frontend/Vistas | Backend | Base de datos | Configuración | Seguridad | Depende de Base44 | Módulo |
|---|---|---|---|---|---|---|---|---|
| `base44/config.jsonc` | Configuración del proyecto Base44: comandos de instalación, build, serve y carpeta de salida usados por el CLI/plataforma. | No | Sí | No | Sí | No | Totalmente | General |
| `base44/entities/Curso.jsonc` | Esquema de la entidad "Curso" (código, nombre, período lectivo, fechas, cierre forzado). | No | No | Sí | No | No | Totalmente | General (módulo Cursos) |
| `base44/entities/Ejercicio.jsonc` | Esquema de la entidad "Ejercicio" (número, título, consigna en HTML). | No | No | Sí | No | No | Totalmente | Modo Estudio |
| `base44/entities/Entrega.jsonc` | Esquema de la entidad "Entrega" (usuario, ejercicio, análisis previo, estado de entrega/visualización). | No | No | Sí | No | No | Totalmente | Modo Estudio |
| `base44/entities/Inscripcion.jsonc` | Esquema de la entidad "Inscripción" que relaciona un Usuario con un Curso. | No | No | Sí | No | No | Totalmente | General (módulo Cursos) |
| `base44/entities/User.jsonc` | Esquema del usuario nativo de Base44 con un campo `role` (admin/user) usado por el sistema de auth de la plataforma. | No | No | Sí | No | Sí | Totalmente | General |
| `base44/entities/Usuario.jsonc` | Esquema de la entidad de dominio "Usuario" (username, email, nombre completo y rol: ADMINISTRADOR/DOCENTE/ESTUDIANTE). | No | No | Sí | No | Sí | Totalmente | General |

## 3. Núcleo de la app, API y librerías (`src/`, `src/api/`, `src/lib/`, `src/utils/`, `src/hooks/`)

| Archivo | Qué hace | Frontend/Vistas | Backend | Base de datos | Configuración | Seguridad | Depende de Base44 | Módulo |
|---|---|---|---|---|---|---|---|---|
| `src/App.jsx` | Componente raíz: envuelve la app con `AuthProvider`, `QueryClientProvider` y `Router`, y define todas las rutas. | Sí | No | No | No | Sí | Parcialmente | General |
| `src/main.jsx` | Punto de entrada de React que monta `App` en el DOM (`#root`). | Sí | No | No | No | No | No | General |
| `src/index.css` | Hoja de estilos global: fuentes, directivas de Tailwind y variables CSS de tema (claro/oscuro). | Sí | No | No | No | No | No | General |
| `src/api/base44Client.js` | Crea e inicializa el cliente SDK de Base44 (`createClient`) con appId, token y URLs; usado por toda la app para hablar con el backend. | No | Sí | No | No | No | Totalmente | General |
| `src/lib/AuthContext.jsx` | Contexto de autenticación: verifica settings públicas y sesión del usuario contra el backend de Base44, maneja errores de auth y logout/redirect a login. | Sí | Sí | No | No | Sí | Totalmente | General |
| `src/lib/PageNotFound.jsx` | Página 404; si el usuario autenticado es admin, agrega una nota adicional. Consulta al usuario vía Base44. | Sí | No | No | No | Sí | Parcialmente | General |
| `src/lib/analisisPrevio.js` | Lógica de dominio pura (sin dependencias externas) para modelar y validar el "Análisis Previo" (metodologías, variables, eventos), usada tanto por Modo Libre como por Modo Estudio. | No | No | No | No | No | No | General (compartido Modo Libre + Modo Estudio) |
| `src/lib/analisisPrevioStorage.js` | Capa de persistencia del Análisis Previo usando `localStorage` (guardar/cargar/limpiar); solo la usa Modo Libre (Modo Estudio persiste en Base44 vía `Entrega`). | No | No | No | No | No | No | Modo Libre |
| `src/lib/app-params.js` | Resuelve parámetros de arranque de la app (appId, token, URLs) desde la URL o `localStorage`, incluyendo variables de entorno `VITE_BASE44_*`. | No | No | No | Sí | Sí | Totalmente | General |
| `src/lib/authReturnTo.js` | Valida y sanea el parámetro `returnTo` para evitar redirecciones abiertas (open redirect) tras el login. | No | No | No | No | Sí | Parcialmente | General |
| `src/lib/cursos.js` | Helpers de dominio para cursos: nombre a mostrar, etiquetas de período lectivo, año lectivo y cálculo de vigencia. | No | No | No | No | No | No | General (módulo Cursos) |
| `src/lib/permisos.js` | Patrón Strategy de permisos por rol (ADMINISTRADOR/DOCENTE/ESTUDIANTE): define qué puede hacer cada rol (crear curso, editar perfiles, ver estadísticas, etc.). | No | No | No | No | Sí | No | General |
| `src/lib/query-client.js` | Instancia y configura el `QueryClient` de TanStack React Query (opciones de refetch y reintentos). | No | No | No | No | No | No | General |
| `src/lib/sesionUsuario.jsx` | Contexto de sesión de usuario "seam" desacoplado de la autenticación real; guarda el usuario simulado en `localStorage` y expone permisos según su rol. | Sí | No | No | No | Sí | No | General |
| `src/lib/utils.js` | Utilidades genéricas: función `cn` para combinar clases CSS (clsx + tailwind-merge) y detección de iframe. | No | No | No | No | No | No | General |
| `src/utils/index.ts` | Exporta `createPageUrl`, helper para construir URLs de página a partir de un nombre. | No | No | No | No | No | No | General |
| `src/hooks/use-mobile.jsx` | Hook que detecta si el viewport es de tamaño móvil (breakpoint 768px) usando `matchMedia`. | Sí | No | No | No | No | No | General |
| `src/hooks/use-size.jsx` | Hook que mide el tamaño de un elemento referenciado usando `getBoundingClientRect` y `ResizeObserver`. | Sí | No | No | No | No | No | General |

## 4. Páginas (`src/pages/`)

| Archivo | Qué hace | Frontend/Vistas | Backend | Base de datos | Configuración | Seguridad | Depende de Base44 | Módulo |
|---|---|---|---|---|---|---|---|---|
| `CursoDetalle.jsx` | Detalle de un curso (docentes/estudiantes, integrantes, avance por alumno, estadísticas por ejercicio, vista de resoluciones); carga curso, inscripciones, usuarios, ejercicios y entregas desde Base44. | Sí | No | Sí | No | Sí | Totalmente | General (módulo Cursos) |
| `Cursos.jsx` | Lista, busca, crea, edita y elimina cursos (y sus inscripciones); muestra "todos los cursos" o "mis cursos" según el rol. | Sí | No | Sí | No | Sí | Totalmente | General (módulo Cursos) |
| `Diagrama.jsx` | Página placeholder estática: anuncia que el diagrama de flujo (paso siguiente al Análisis Previo de Modo Libre) se habilitará en una próxima etapa. | Sí | No | No | No | No | No | Modo Libre |
| `EjercicioEstudio.jsx` | Muestra la consigna de un ejercicio, permite completar/entregar el análisis previo, y controla el acceso a la resolución (bloqueo tras verla) y a estadísticas según el rol. | Sí | No | Sí | No | Sí | Totalmente | Modo Estudio |
| `ForgotPassword.jsx` | Formulario para solicitar un link de restablecimiento de contraseña vía el servicio de autenticación de Base44. | Sí | No | No | No | Sí | Totalmente | General |
| `Home.jsx` | Landing page que compone secciones de marketing (Hero, Modes, Flow, Legacy, Audiences, Project), sin lógica de datos propia. | Sí | No | No | No | No | No | Home |
| `Login.jsx` | Página de inicio de sesión: branding institucional y delega el acceso a `UtnAccessCard`, redirige a selección de rol o a Modo Libre sin cuenta. | Sí | No | No | No | Sí | Parcialmente | General |
| `MiPerfil.jsx` | Muestra y permite editar el perfil del usuario logueado (según permisos), actualizando sus datos en Base44. | Sí | No | Sí | No | Sí | Totalmente | General |
| `ModoEstudio.jsx` | Lista los ejercicios de la guía de trabajos prácticos para elegir cuál resolver en el Modo Estudio. | Sí | No | Sí | No | Sí | Totalmente | Modo Estudio |
| `ModoLibre.jsx` | Formulario de "Análisis Previo" del Modo Libre (metodología, variables, tabla de eventos, eventos futuros), con persistencia local; no requiere sesión. | Sí | No | No | No | No | No | Modo Libre |
| `OAuthConsent.jsx` | Página de consentimiento OAuth del servidor MCP de la app: muestra herramientas/accesos solicitados por un cliente AI y envía la decisión de aprobar/denegar al backend. | Sí | No | No | No | Sí | Totalmente | General |
| `Participantes.jsx` | Listado completo de usuarios con edición de perfiles ajenos, restringido a roles con permiso para ver/editar otros perfiles. | Sí | No | Sí | No | Sí | Totalmente | General |
| `Register.jsx` | Formulario de registro (email/contraseña), verificación por código OTP y registro con Google, usando la autenticación de Base44. | Sí | No | No | No | Sí | Totalmente | General |
| `ResetPassword.jsx` | Formulario para establecer nueva contraseña a partir de un token recibido por URL. | Sí | No | No | No | Sí | Totalmente | General |
| `SeleccionRol.jsx` | Página temporal de selección de rol (Administrador/Docente/Estudiante): busca un usuario de ejemplo con ese rol e inicia sesión simulada. | Sí | No | Sí | No | Sí | Totalmente | General |

## 5. Componentes de negocio (`src/components/`, excluyendo `ui/`)

| Archivo | Qué hace | Frontend/Vistas | Backend | Base de datos | Configuración | Seguridad | Depende de Base44 | Módulo |
|---|---|---|---|---|---|---|---|---|
| `AuthLayout.jsx` | Layout visual reutilizable (icono, título, subtítulo, tarjeta central, footer) para pantallas de autenticación. | Sí | No | No | No | No | No | General |
| `GoogleIcon.jsx` | SVG decorativo del logo de Google, usado en botones de login social. | Sí | No | No | No | No | No | General |
| `ProtectedRoute.jsx` | Guarda de rutas: chequea sesión (`useAuth`) y, según estado (cargando, error, no registrado, no autenticado), muestra fallback o renderiza el `Outlet` protegido. | Sí | No | No | No | Sí | Parcialmente | General |
| `ScrollToTop.jsx` | Hace scroll al inicio (o a un anchor) cada vez que cambia la ruta. | Sí | No | No | No | No | No | General |
| `UserNotRegisteredError.jsx` | Pantalla estática de error: informa que el usuario no está registrado y debe contactar al administrador. | Sí | No | No | No | Sí | No | General |
| `analisis/AnalisisPrevioPanel.jsx` | Panel compuesto del "Análisis Previo": orquesta metodología, variables, tabla de eventos y validación. Usado únicamente por `EjercicioEstudio.jsx`. | Sí | No | No | No | No | No | Modo Estudio |
| `analisis/EventosFuturos.jsx` | Formulario de lista editable para declarar "eventos futuros" (sigla + evento de referencia). Usado tanto por Modo Libre como dentro del panel de Modo Estudio. | Sí | No | No | No | No | No | General (compartido Modo Libre + Modo Estudio) |
| `analisis/MetodologiaSelector.jsx` | Selector visual (tarjetas) para elegir metodología: "Evento a Evento" o "Delta T Constante". Compartido por ambos modos. | Sí | No | No | No | No | No | General (compartido Modo Libre + Modo Estudio) |
| `analisis/TablaEventos.jsx` | Componente "router" que renderiza la tabla de eventos correcta (EaE o Delta T). Compartido por ambos modos. | Sí | No | No | No | No | No | General (compartido Modo Libre + Modo Estudio) |
| `analisis/TablaEventosDeltaT.jsx` | Tabla editable de eventos para la metodología Delta T Constante. Compartido por ambos modos. | Sí | No | No | No | No | No | General (compartido Modo Libre + Modo Estudio) |
| `analisis/TablaEventosEaE.jsx` | Tabla editable de eventos para la metodología Evento a Evento. Compartido por ambos modos. | Sí | No | No | No | No | No | General (compartido Modo Libre + Modo Estudio) |
| `analisis/VariableControlImplicita.jsx` | Lista editable de variables de control con opción de marcarla "implícita" (checkbox). Usado únicamente dentro de `AnalisisPrevioPanel` (Modo Estudio). | Sí | No | No | No | No | No | Modo Estudio |
| `analisis/VariableList.jsx` | Lista reutilizable y editable de variables (datos, estado, resultado), con soporte opcional de configuración vectorial. Compartido por ambos modos. | Sí | No | No | No | No | No | General (compartido Modo Libre + Modo Estudio) |
| `analisis/VectorConfigDialog.jsx` | Diálogo modal para configurar la dimensión de una variable vectorial. Compartido por ambos modos (vía `VariableList`). | Sí | No | No | No | No | No | General (compartido Modo Libre + Modo Estudio) |
| `brand/Wordmark.jsx` | Logotipo/wordmark "VictoriaX" con link a home; usado en Footer, NavBar, Login y SeleccionRol. | Sí | No | No | No | No | No | General |
| `cursos/AvanceEstudiante.jsx` | Panel expandible que agrupa, por alumno, el estado de sus entregas (borrador/entregado/finalizado). | Sí | No | No | No | No | No | General (módulo Cursos) |
| `cursos/CursoForm.jsx` | Formulario modal para crear/editar un curso y asignar docentes al crearlo; usa `ROLES` de permisos para filtrar docentes. | Sí | No | No | No | Sí | No | General (módulo Cursos) |
| `cursos/EstadisticasCurso.jsx` | Panel expandible con estadísticas por ejercicio del curso (alumnos que resolvieron / vieron la resolución). | Sí | No | No | No | No | No | General (módulo Cursos) |
| `cursos/IntegrantesPanel.jsx` | Gestiona integrantes (docentes/alumnos) de un curso: agrega/elimina inscripciones vía `base44.entities.Inscripcion`, respeta permiso `puedeGestionar`. | Sí | Sí | Sí | No | Sí | Totalmente | General (módulo Cursos) |
| `cursos/ResolucionEstudiante.jsx` | Diálogo que muestra el resumen completo del análisis previo entregado por un estudiante. | Sí | No | No | No | No | No | General (módulo Cursos) |
| `estudio/EstadisticasPlaceholder.jsx` | Placeholder visual estático: sección de estadísticas en construcción. Usado únicamente en `EjercicioEstudio.jsx`. | Sí | No | No | No | No | No | Modo Estudio |
| `estudio/ResolucionEjemplo.jsx` | Ejemplo estático del formato futuro de resolución de un ejercicio (texto + imagen alojada en Base44). Usado únicamente en `EjercicioEstudio.jsx`. | Sí | No | No | No | No | Parcialmente | Modo Estudio |
| `home/Audiences.jsx` | Sección de landing: audiencias del producto (alumnos, docentes, graduados). Usado únicamente en `Home.jsx`. | Sí | No | No | No | No | No | Home |
| `home/Flow.jsx` | Sección de landing: flujo de trabajo (análisis previo → diagrama → ejecución → resultados). Usado únicamente en `Home.jsx`. | Sí | No | No | No | No | No | Home |
| `home/Footer.jsx` | Pie de página con enlaces institucionales, de plataforma y del proyecto; usado en casi todas las páginas de la app (no solo Home). | Sí | No | No | No | No | No | General |
| `home/Hero.jsx` | Hero de la landing con CTA a "Modo Libre"/"Modo Estudio"; usa `useSesionUsuario` para adaptar el link, muestra imagen de Base44. Usado únicamente en `Home.jsx`. | Sí | No | No | No | No | Parcialmente | Home |
| `home/Legacy.jsx` | Sección de landing con timeline del legado del proyecto Victoria hacia VictoriaX. Usado únicamente en `Home.jsx`. | Sí | No | No | No | No | No | Home |
| `home/Modes.jsx` | Compara "Modo Libre" y "Modo Estudio", adapta textos/links según sesión, muestra imágenes de Base44. Usado únicamente en `Home.jsx`. | Sí | No | No | No | No | Parcialmente | Home |
| `home/NavBar.jsx` | Barra de navegación: links de landing, toggle de tema, menú de usuario condicionado por sesión y permisos; usada en casi todas las páginas de la app (no solo Home). | Sí | No | No | No | Sí | No | General |
| `home/Project.jsx` | Sección de landing: respaldo académico/institucional del proyecto (cátedras y UTN.BA). Usado únicamente en `Home.jsx`. | Sí | No | No | No | No | No | Home |
| `login/UtnAccessCard.jsx` | Tarjeta de acceso institucional (login) con logo UTN y botón que dispara `onAccess` recibida por props. Usado únicamente en `Login.jsx`. | Sí | No | No | No | Sí | No | General |
| `perfil/PerfilForm.jsx` | Formulario reutilizable de edición de perfil (nombre, email, nombre completo, rol); usado en `MiPerfil.jsx` y `Participantes.jsx`. | Sí | No | No | No | Sí | No | General |
| `theme/ThemeToggle.jsx` | Botón que alterna tema claro/oscuro, persiste preferencia en `localStorage` y aplica clase `dark` al documento. | Sí | No | No | No | No | No | General |

## 6. Componentes UI genéricos (`src/components/ui/`) — basados en shadcn/ui + Radix UI

Todos son primitivas de interfaz reutilizables, sin lógica de negocio, sin backend, sin permisos y sin dependencia de Base44 (salvo la excepción indicada). Al ser genéricos y reutilizables en toda la app, todos pertenecen al módulo **General**.

| Archivo | Qué hace | Frontend/Vistas | Backend | Base de datos | Configuración | Seguridad | Depende de Base44 | Módulo |
|---|---|---|---|---|---|---|---|---|
| `accordion.jsx` | Acordeón colapsable (Radix UI). | Sí | No | No | No | No | No | General |
| `alert-dialog.jsx` | Diálogo modal de alerta/confirmación (Radix UI). | Sí | No | No | No | No | No | General |
| `alert.jsx` | Alerta/mensaje destacado con variantes de estilo. | Sí | No | No | No | No | No | General |
| `aspect-ratio.jsx` | Contenedor que mantiene relación de aspecto fija (Radix UI). | Sí | No | No | No | No | No | General |
| `avatar.jsx` | Avatar de usuario con imagen y fallback (Radix UI). | Sí | No | No | No | No | No | General |
| `badge.jsx` | Etiqueta/insignia con variantes de estilo. | Sí | No | No | No | No | No | General |
| `breadcrumb.jsx` | Ruta de navegación (breadcrumb). | Sí | No | No | No | No | No | General |
| `button.jsx` | Botón reutilizable con variantes de estilo. | Sí | No | No | No | No | No | General |
| `calendar.jsx` | Selector de fecha/calendario (react-day-picker). | Sí | No | No | No | No | No | General |
| `card.jsx` | Contenedor tipo tarjeta (header/content/footer). | Sí | No | No | No | No | No | General |
| `carousel.jsx` | Carrusel de contenido (embla-carousel). | Sí | No | No | No | No | No | General |
| `chart.jsx` | Wrapper de gráficos sobre Recharts con theming y tooltips/legend. | Sí | No | No | No | No | No | General |
| `checkbox.jsx` | Casilla de verificación (Radix UI). | Sí | No | No | No | No | No | General |
| `collapsible.jsx` | Contenedor colapsable/expandible (Radix UI). | Sí | No | No | No | No | No | General |
| `command.jsx` | Paleta de comandos/búsqueda tipo cmdk. | Sí | No | No | No | No | No | General |
| `context-menu.jsx` | Menú contextual (clic derecho) (Radix UI). | Sí | No | No | No | No | No | General |
| `dialog.jsx` | Diálogo/modal genérico (Radix UI). | Sí | No | No | No | No | No | General |
| `drawer.jsx` | Panel deslizante tipo "drawer" (vaul). | Sí | No | No | No | No | No | General |
| `dropdown-menu.jsx` | Menú desplegable (Radix UI). | Sí | No | No | No | No | No | General |
| `form.jsx` | Integra react-hook-form con labels, mensajes de error y contexto de campo. | Sí | No | No | No | No | No | General |
| `hover-card.jsx` | Tarjeta emergente al pasar el cursor (Radix UI). | Sí | No | No | No | No | No | General |
| `image.jsx` | Imagen responsiva con detección de URLs de Wix Media/Base44 (`media.base44.com`) para transformaciones (resize, crop, WebP) y fallback. | Sí | No | No | No | No | Parcialmente | General |
| `input-otp.jsx` | Campo de entrada para códigos OTP (input-otp). | Sí | No | No | No | No | No | General |
| `input.jsx` | Campo de texto estilizado. | Sí | No | No | No | No | No | General |
| `label.jsx` | Etiqueta accesible para campos de formulario (Radix UI). | Sí | No | No | No | No | No | General |
| `menubar.jsx` | Barra de menú tipo aplicación de escritorio (Radix UI). | Sí | No | No | No | No | No | General |
| `navigation-menu.jsx` | Menú de navegación con submenús desplegables (Radix UI). | Sí | No | No | No | No | No | General |
| `pagination.jsx` | Controles de paginación. | Sí | No | No | No | No | No | General |
| `popover.jsx` | Ventana emergente contextual (Radix UI). | Sí | No | No | No | No | No | General |
| `progress.jsx` | Barra de progreso (Radix UI). | Sí | No | No | No | No | No | General |
| `radio-group.jsx` | Grupo de botones de opción (radio) (Radix UI). | Sí | No | No | No | No | No | General |
| `resizable.jsx` | Paneles redimensionables (react-resizable-panels). | Sí | No | No | No | No | No | General |
| `scroll-area.jsx` | Área de desplazamiento personalizada (Radix UI). | Sí | No | No | No | No | No | General |
| `select.jsx` | Selección desplegable (Radix UI). | Sí | No | No | No | No | No | General |
| `separator.jsx` | Línea separadora visual (Radix UI). | Sí | No | No | No | No | No | General |
| `sheet.jsx` | Panel lateral deslizante tipo modal (Radix UI Dialog). | Sí | No | No | No | No | No | General |
| `sidebar.jsx` | Barra lateral compleja: estado expandido/colapsado, soporte móvil, atajo de teclado, persistencia vía cookie. | Sí | No | No | No | No | No | General |
| `skeleton.jsx` | Placeholder animado de carga. | Sí | No | No | No | No | No | General |
| `slider.jsx` | Control deslizante de rango (Radix UI). | Sí | No | No | No | No | No | General |
| `sonner.jsx` | Notificaciones toast (sonner), con soporte de tema (next-themes). | Sí | No | No | No | No | No | General |
| `switch.jsx` | Interruptor on/off (Radix UI). | Sí | No | No | No | No | No | General |
| `table.jsx` | Componentes de tabla HTML estilizados. | Sí | No | No | No | No | No | General |
| `tabs.jsx` | Pestañas (Radix UI). | Sí | No | No | No | No | No | General |
| `textarea.jsx` | Área de texto multilínea estilizada. | Sí | No | No | No | No | No | General |
| `toast.jsx` | Primitivas de notificaciones toast (Radix UI). | Sí | No | No | No | No | No | General |
| `toaster.jsx` | Renderiza la lista de toasts activos usando `use-toast`. | Sí | No | No | No | No | No | General |
| `toggle-group.jsx` | Grupo de botones de alternancia (Radix UI). | Sí | No | No | No | No | No | General |
| `toggle.jsx` | Botón de alternancia (toggle) con variantes de estilo. | Sí | No | No | No | No | No | General |
| `tooltip.jsx` | Tooltip/información emergente (Radix UI). | Sí | No | No | No | No | No | General |
| `use-toast.jsx` | Hook + store en memoria (reducer + listeners) para el estado global de toasts. | Sí | No | No | No | No | No | General |

---

## Resumen de dependencia de Base44

- **Totalmente dependientes** (no funcionan sin el SDK/backend de Base44): configuración del proyecto (`base44/*`, `vite.config.js`, `AGENTS.md`, `README.md`), `src/api/base44Client.js`, `src/lib/AuthContext.jsx`, `src/lib/app-params.js`, y todas las páginas que leen/escriben entidades (Cursos, CursoDetalle, EjercicioEstudio, MiPerfil, ModoEstudio, OAuthConsent, Participantes, Register, ForgotPassword, ResetPassword, SeleccionRol) además de `cursos/IntegrantesPanel.jsx`.
- **Parcialmente dependientes** (usan Base44 solo para un aspecto puntual, como imágenes alojadas o config de build, pero su lógica principal no depende de la plataforma): `index.html`, `package.json`, `.gitignore`, `App.jsx`, `PageNotFound.jsx`, `authReturnTo.js`, `Login.jsx`, `ProtectedRoute.jsx`, `home/Hero.jsx`, `home/Modes.jsx`, `estudio/ResolucionEjemplo.jsx`, `ui/image.jsx`.
- **Independientes** (funcionan por su cuenta, sin backend de Base44): toda la lógica de dominio de "Análisis Previo" (`src/lib/analisisPrevio.js`, `analisisPrevioStorage.js`, `cursos.js`, `permisos.js`), `ModoLibre.jsx`, `Diagrama.jsx`, `Home.jsx` y sus secciones, `sesionUsuario.jsx` (sesión simulada vía `localStorage`), y **todos** los componentes de `src/components/ui/` (excepto `image.jsx`).

## Seguridad (roles, permisos y accesos) — dónde vive la lógica

- **`src/lib/permisos.js`**: define el patrón de permisos por rol (ADMINISTRADOR/DOCENTE/ESTUDIANTE) — es el núcleo del control de acceso a nivel de aplicación.
- **`src/lib/AuthContext.jsx`** + **`src/components/ProtectedRoute.jsx`**: manejan la sesión real de Base44 y protegen rutas.
- **`src/lib/sesionUsuario.jsx`**: capa de sesión simulada (independiente de Base44), usada para exponer permisos según el rol elegido en `SeleccionRol.jsx`.
- **`src/lib/authReturnTo.js`**: previene open-redirect tras el login.
- Páginas y componentes que consumen esos permisos para mostrar/ocultar datos o acciones: `Cursos.jsx`, `CursoDetalle.jsx`, `EjercicioEstudio.jsx`, `Participantes.jsx`, `MiPerfil.jsx`, `ModoEstudio.jsx`, `home/NavBar.jsx`, `cursos/CursoForm.jsx`, `cursos/IntegrantesPanel.jsx`, `perfil/PerfilForm.jsx`.

## Resumen por módulo

- **Modo Libre**: `ModoLibre.jsx`, `Diagrama.jsx`, `src/lib/analisisPrevioStorage.js`. No depende de Base44 ni de sesión; persiste todo en `localStorage`.
- **Modo Estudio**: `ModoEstudio.jsx`, `EjercicioEstudio.jsx`, `analisis/AnalisisPrevioPanel.jsx`, `analisis/VariableControlImplicita.jsx`, `estudio/ResolucionEjemplo.jsx`, `estudio/EstadisticasPlaceholder.jsx`, entidades `Ejercicio` y `Entrega` de Base44. Requiere sesión y depende totalmente de Base44.
- **Home**: `Home.jsx` y sus secciones exclusivas (`home/Hero.jsx`, `home/Modes.jsx`, `home/Flow.jsx`, `home/Legacy.jsx`, `home/Audiences.jsx`, `home/Project.jsx`).
- **Compartido entre Modo Libre y Modo Estudio**: `src/lib/analisisPrevio.js` y los componentes reutilizables de `analisis/` (`MetodologiaSelector`, `VariableList`, `TablaEventos`, `TablaEventosDeltaT`, `TablaEventosEaE`, `EventosFuturos`, `VectorConfigDialog`) — se clasifican como **General** por no pertenecer exclusivamente a un modo.
- **General**: todo lo demás — configuración del proyecto, autenticación/sesión, el módulo de Cursos (`Cursos.jsx`, `CursoDetalle.jsx`, `cursos/*`), perfil, participantes, layout compartido (`NavBar`, `Footer`, `Wordmark`, `ThemeToggle`) y los 51 componentes UI genéricos de `src/components/ui/`.

---

*Generado automáticamente a partir del análisis del código fuente del repositorio (rama `main`).*
