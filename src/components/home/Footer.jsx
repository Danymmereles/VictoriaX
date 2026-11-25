import React from "react";
import { Link } from "react-router-dom";
import Wordmark from "@/components/brand/Wordmark";
import { useSesionUsuario } from "@/lib/sesionUsuario";

export default function Footer() {
  const { usuario } = useSesionUsuario();
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-[100rem] flex-col gap-10 px-6 py-16 lg:flex-row lg:items-start lg:justify-between lg:px-12">
        <div className="max-w-sm">
          <Wordmark withTagline />
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Plataforma de aprendizaje de simulación evento a evento y delta t constante.
            Heredera de Victoria (2017).
          </p>
        </div>
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Plataforma</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link to="/modo-libre" className="hover:text-foreground text-muted-foreground">Modo Libre</Link></li>
              {(!usuario || usuario.puedeUsarModoEstudio) && (
                <li>
                  <Link to={usuario ? "/modo-estudio" : "/login"} className="hover:text-foreground text-muted-foreground">
                    Modo Estudio
                  </Link>
                </li>
              )}
              <li><Link to="/#flujo" className="hover:text-foreground text-muted-foreground">Cómo funciona</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Proyecto</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link to="/#legado" className="hover:text-foreground text-muted-foreground">Legado Victoria</Link></li>
              <li><Link to="/#proyecto" className="hover:text-foreground text-muted-foreground">Cátedras</Link></li>
              <li><Link to="/sobre-nosotros" className="hover:text-foreground text-muted-foreground">Sobre nosotros</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Institución</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><a href="https://www.frba.utn.edu.ar" target="_blank" rel="noreferrer" className="hover:text-foreground text-muted-foreground">UTN.BA</a></li>
              <li><Link to="/contacto" className="hover:text-foreground text-muted-foreground">Contacto</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 px-6 py-6 text-center text-xs text-muted-foreground lg:px-12">
        © {new Date().getFullYear()} VictoriaX · Proyecto Final · Ingeniería en Sistemas de Información · UTN.BA
      </div>
    </footer>
  );
}