import React from "react";
import ErrorBadge from "./ErrorBadge";

// Motivo por el que una sigla no es válida o está repetida.
// Se muestra debajo del campo (Variables y Eventos Futuros).
export default function ErrorDeSigla({ mensajes = [] }) {
  return (
    <div className="mt-3 space-y-1.5">
      <ErrorBadge>Sigla no válida</ErrorBadge>
      {mensajes.map((m) => (
        <p key={m} className="text-xs text-destructive">{m}</p>
      ))}
    </div>
  );
}