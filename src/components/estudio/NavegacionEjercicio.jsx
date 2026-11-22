import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ListChecks } from "lucide-react";

const estiloBoton =
  "inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-6 py-3 text-sm text-muted-foreground transition-colors hover:border-[#AF9BEF] hover:text-foreground";

export default function NavegacionEjercicio({ anterior, siguiente }) {
  const volverArriba = () => window.scrollTo(0, 0);

  return (
    <nav className="mt-8 flex items-center justify-between gap-4 border-t border-border/60 pt-6">
      {anterior ? (
        <Link to={`/modo-estudio/${anterior.id}`} onClick={volverArriba} className={estiloBoton}>
          <ArrowLeft className="w-4 h-4" /> Ejercicio anterior
        </Link>
      ) : (
        <span />
      )}
      {siguiente ? (
        <Link to={`/modo-estudio/${siguiente.id}`} onClick={volverArriba} className={estiloBoton}>
          Ejercicio siguiente <ArrowRight className="w-4 h-4" />
        </Link>
      ) : (
        <Link to="/modo-estudio" onClick={volverArriba} className={estiloBoton}>
          <ListChecks className="w-4 h-4" /> Finalizar guía
        </Link>
      )}
    </nav>
  );
}