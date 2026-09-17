import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, BookOpen, GraduationCap, ArrowLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSesionUsuario } from "@/lib/sesionUsuario";
import { ROLES } from "@/lib/permisos";
import Wordmark from "@/components/brand/Wordmark";
import ThemeToggle from "@/components/theme/ThemeToggle";

// ===========================================================================
// Pagina TEMPORAL de seleccion de rol (desacoplada).
// Será reemplazada por el autenticador de la facultad y despues por el propio.
// Solo acopla: setea el usuario simulado en el seam de sesion y redirige al Home.
// ===========================================================================

const roles = [
  {
    key: ROLES.ADMINISTRADOR,
    titulo: "Administrador",
    desc: "Acceso total: gestiona cursos, visualiza y edita todos los perfiles y ve el listado completo de participantes.",
    icon: Shield,
    color: "from-[#73C3EE] to-[#AF9BEF]",
  },
  {
    key: ROLES.DOCENTE,
    titulo: "Docente",
    desc: "Edita su perfil y visualiza otros perfiles. Gestiona la retroalimentacion de sus cursos.",
    icon: BookOpen,
    color: "from-[#AF9BEF] to-[#EA84B4]",
  },
  {
    key: ROLES.ESTUDIANTE,
    titulo: "Estudiante",
    desc: "Edita su perfil personal. No accede al listado de participantes.",
    icon: GraduationCap,
    color: "from-[#EA84B4] to-[#73C3EE]",
  },
];

export default function SeleccionRol() {
  const navigate = useNavigate();
  const { iniciarSesion } = useSesionUsuario();
  const [cargando, setCargando] = useState(null);
  const [error, setError] = useState("");

  async function elegir(rolKey) {
    setCargando(rolKey);
    setError("");
    try {
      const lista = await base44.entities.Usuario.list();
      const usuario = (lista || []).find((u) => u.rol === rolKey);
      if (!usuario) {
        setError(`No hay un usuario de ejemplo con rol ${rolKey}.`);
        return;
      }
      iniciarSesion(usuario);
      navigate("/");
    } catch (e) {
      setError("No se pudo iniciar sesión: " + (e?.message || "error desconocido"));
    } finally {
      setCargando(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[100rem] items-center justify-between px-6 lg:px-12">
          <Wordmark />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Acceso de prueba</p>
        <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Elegi un rol para visualizar la plataforma
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Este selector es temporal y sera reemplazado por el autenticador institucional de la
          UTN.BA. Cada rol ingresa con un perfil de ejemplo precargado.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {roles.map(({ key, titulo, desc, icon: Icon, color }) => {
            const esperando = cargando === key;
            return (
              <button
                key={key}
                onClick={() => elegir(key)}
                disabled={cargando !== null}
                className="group flex flex-col rounded-2xl border border-border bg-card p-7 text-left transition-all hover:-translate-y-1 hover:border-[#AF9BEF] disabled:opacity-60"
              >
                <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${color} text-[#0A0D14]`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="mt-6 font-heading text-2xl font-semibold">{titulo}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#AF9BEF] group-hover:text-foreground">
                  {esperando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {esperando ? "Ingresando…" : "Ingresar con este rol"}
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}