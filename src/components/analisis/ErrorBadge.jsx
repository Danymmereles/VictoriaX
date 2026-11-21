import React from "react";
import { AlertTriangle } from "lucide-react";

// Distintivo que señala el bloque del análisis previo que origina un error bloqueante.
export default function ErrorBadge({ children = "Falta cargar", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-destructive ${className}`}
    >
      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
      {children}
    </span>
  );
}