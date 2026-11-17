import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, UserCircle, LogOut, GraduationCap, Menu, X } from "lucide-react";
import Wordmark from "@/components/brand/Wordmark";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useSesionUsuario } from "@/lib/sesionUsuario";
import { toast } from "sonner";

const links = [
  { label: "Modos", href: "#modos" },
  { label: "Cómo funciona", href: "#flujo" },
  { label: "Legado", href: "#legado" },
  { label: "Proyecto", href: "#proyecto" },
  { label: "Sobre nosotros", href: "sobre-nosotros" },
  { label: "Contacto", href: "contacto" },
];

const itemMovil =
  "flex items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground";

export default function NavBar() {
  const navigate = useNavigate();
  const { usuario, permisos, cerrarSesion } = useSesionUsuario();
  const [menuAbierto, setMenuAbierto] = useState(false);

  async function salir() {
    try {
      await cerrarSesion();
      setMenuAbierto(false);
      navigate("/");
    } catch (error) {
      toast.error(error.message || "No se pudo cerrar la sesión.");
    }
  }

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[100rem] items-center justify-between px-6 lg:px-12">
        <Wordmark />
        <nav className="hidden lg:flex items-center gap-10">
          {links.map((l) => (
            <Link key={l.href} to={`/${l.href}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden lg:flex items-center gap-3">
            {usuario ? (
              <>
                <Link to="/cursos" className="hidden items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
                  <GraduationCap className="w-4 h-4" /> Cursos
                </Link>
                {permisos?.puedoVisualizarOtrosPerfiles && (
                  <Link to="/participantes" className="hidden items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
                    <Users className="w-4 h-4" /> Participantes
                  </Link>
                )}
                <Link to="/perfil" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  <UserCircle className="w-4 h-4" /> Mi perfil
                </Link>
                <button onClick={salir} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  <LogOut className="w-4 h-4" /> Salir
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-gradient-to-r from-[#73C3EE] via-[#AF9BEF] to-[#EA84B4] px-5 py-2.5 text-sm font-medium text-[#0A0D14] transition-transform hover:scale-[1.03]"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>

      {menuAbierto && (
        <div className="border-t border-border/60 bg-background/95 px-6 py-4 lg:hidden">
          <nav className="flex flex-col">
            {links.map((l) => (
              <Link key={l.href} to={`/${l.href}`} onClick={cerrarMenu} className={itemMovil}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col border-t border-border/60 pt-3">
            {usuario ? (
              <>
                <Link to="/cursos" onClick={cerrarMenu} className={itemMovil}>
                  <GraduationCap className="w-4 h-4" /> Cursos
                </Link>
                {permisos?.puedoVisualizarOtrosPerfiles && (
                  <Link to="/participantes" onClick={cerrarMenu} className={itemMovil}>
                    <Users className="w-4 h-4" /> Participantes
                  </Link>
                )}
                <Link to="/perfil" onClick={cerrarMenu} className={itemMovil}>
                  <UserCircle className="w-4 h-4" /> Mi perfil
                </Link>
                <button onClick={salir} className={`${itemMovil} text-left`}>
                  <LogOut className="w-4 h-4" /> Salir
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={cerrarMenu}
                className="rounded-full bg-gradient-to-r from-[#73C3EE] via-[#AF9BEF] to-[#EA84B4] px-5 py-2.5 text-center text-sm font-medium text-[#0A0D14]"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}