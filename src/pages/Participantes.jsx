import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Users } from "lucide-react";
import { authClient } from "@/api/authClient";
import { useSesionUsuario } from "@/lib/sesionUsuario";
import { ROLES } from "@/lib/permisos";
import { institucionDeUsuario } from "@/lib/instituciones";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import PerfilForm from "@/components/perfil/PerfilForm";

const FILTROS_ROL = [
  { value: "TODOS", label: "Todos los roles" },
  { value: "SUPER_ADMINISTRADOR", label: "Super administrador" },
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "DOCENTE", label: "Docente" },
  { value: "ESTUDIANTE", label: "Estudiante" },
];

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function Participantes() {
  const { usuario, permisos } = useSesionUsuario();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [rolFiltro, setRolFiltro] = useState("TODOS");
  const [institucionFiltro, setInstitucionFiltro] = useState("TODAS");

  const institucionSesion = institucionDeUsuario(usuario);
  // El super admin recibe los usuarios de todas las instituciones y puede filtrar por una.
  const esSuper = Boolean(permisos?.puedoVerTodasLasInstituciones);
  const instituciones = useMemo(
    () => [...new Set(lista.map(institucionDeUsuario))].sort((a, b) => a.localeCompare(b, "es")),
    [lista],
  );
  const deLaInstitucion = (u) =>
    esSuper
      ? institucionFiltro === "TODAS" || institucionDeUsuario(u) === institucionFiltro
      : institucionDeUsuario(u) === institucionSesion;
  const alcance = esSuper
    ? institucionFiltro === "TODAS" ? "todas las instituciones" : institucionFiltro
    : institucionSesion;

  async function cargar() {
    setCargando(true);
    try {
      setError("");
      setLista(await authClient.listUsers());
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los participantes.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    return lista
      .filter(deLaInstitucion)
      .filter((u) => rolFiltro === "TODOS" || u.rol === rolFiltro)
      .filter((u) => {
        if (!termino) return true;
        return [u.nombre_completo, u.email].some((campo) =>
          normalizar(campo).includes(termino),
        );
      });
  }, [lista, busqueda, rolFiltro, institucionFiltro, institucionSesion, esSuper]);

  // Guarda de acceso: solo quien puede visualizar otros perfiles (Admin, Docente)
  if (!usuario || !permisos?.puedoVisualizarOtrosPerfiles) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <main className="mx-auto max-w-2xl px-6 py-32 text-center">
          <Users className="mx-auto w-10 h-10 text-[#AF9BEF]" />
          <h1 className="mt-6 font-heading text-3xl font-semibold">Acceso restringido</h1>
          <p className="mt-4 text-muted-foreground">
            Solo los administradores y docentes pueden ver el listado de participantes.
          </p>
          <Link to="/" className="mt-8 inline-block text-[#AF9BEF] hover:underline">Volver al inicio</Link>
        </main>
        <Footer />
      </div>
    );
  }

  async function guardarOtro(form) {
    setSaving(true);
    setError("");
    try {
      await authClient.updateUser(seleccionado.id, form);
      await cargar();
      setSeleccionado(null);
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Administracion</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">Participantes</h1>
          <p className="mt-4 text-muted-foreground">
            Usuarios registrados en <span className="font-medium text-foreground">{alcance}</span>.
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-lg bg-destructive/10 dark:bg-destructive/20 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-10 grid gap-8">
          {seleccionado && permisos.puedoEditarOtrosPerfiles && (
            <aside className="mx-auto w-full max-w-2xl">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl font-semibold">Editar perfil</h2>
                  <button
                    onClick={() => setSeleccionado(null)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cerrar
                  </button>
                </div>
                <div className="mt-6">
                  <PerfilForm
                    key={seleccionado.id}
                    usuario={seleccionado}
                    editable={permisos.puedoEditarOtrosPerfiles}
                    rolEditable={permisos.puedoCambiarRol}
                    institucionEditable={permisos.puedoCambiarRol}
                    permitirSuperAdmin={permisos.puedoOtorgarSuperAdmin}
                    onSave={guardarOtro}
                    saving={saving}
                  />
                </div>
              </div>
            </aside>
          )}

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre completo o email"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm"
                aria-label="Buscar participantes"
              />
            </div>
            <select
              value={rolFiltro}
              onChange={(e) => setRolFiltro(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
              aria-label="Filtrar por rol"
            >
              {FILTROS_ROL.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
            </select>
            {esSuper && (
              <select
                value={institucionFiltro}
                onChange={(e) => setInstitucionFiltro(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                aria-label="Filtrar por institución"
              >
                <option value="TODAS">Todas las instituciones</option>
                {instituciones.map((inst) => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>
            )}
            {(busqueda || rolFiltro !== "TODOS" || institucionFiltro !== "TODAS") && (
              <button
                onClick={() => {
                  setBusqueda("");
                  setRolFiltro("TODOS");
                  setInstitucionFiltro("TODAS");
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Nombre completo</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Rol</th>
                  <th className="px-5 py-4">Institución</th>
                  <th className="px-5 py-4 text-right">Accion</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Cargando…</td></tr>
                ) : filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                      {lista.length === 0
                        ? "Sin participantes."
                        : "No hay participantes que coincidan con la búsqueda."}
                    </td>
                  </tr>
                ) : filtrados.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-5 py-4 font-medium">{u.nombre_completo}</td>
                    <td className="px-5 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-5 py-4"><BadgeRol rol={u.rol} /></td>
                    <td className="px-5 py-4 text-muted-foreground">{institucionDeUsuario(u)}</td>
                    <td className="px-5 py-4 text-right">
                      {/* Un administrador no puede editar a un super administrador. */}
                      {permisos.puedoEditarOtrosPerfiles &&
                      (u.rol !== ROLES.SUPER_ADMINISTRADOR || permisos.puedoOtorgarSuperAdmin) ? (
                        <button
                          onClick={() => setSeleccionado(u)}
                          className="text-sm font-medium text-[#AF9BEF] hover:underline"
                        >
                          Editar
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Solo lectura</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            {filtrados.length} de {lista.filter(deLaInstitucion).length} participantes
            {esSuper ? (institucionFiltro === "TODAS" ? " en total." : ` de ${institucionFiltro}.`) : " de tu institución."}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function BadgeRol({ rol }) {
  const styles = {
    SUPER_ADMINISTRADOR: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    ADMINISTRADOR: "bg-[#73C3EE]/15 text-[#73C3EE]",
    DOCENTE: "bg-[#AF9BEF]/15 text-[#AF9BEF]",
    ESTUDIANTE: "bg-[#EA84B4]/15 text-[#EA84B4]",
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${styles[rol] || ""}`}>
      {rol}
    </span>
  );
}