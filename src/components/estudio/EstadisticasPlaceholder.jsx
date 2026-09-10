import React from "react";
import { Construction } from "lucide-react";

export default function EstadisticasPlaceholder() {
  return (
    <section className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center">
      <Construction className="mx-auto w-6 h-6 text-muted-foreground" />
      <h3 className="mt-3 font-heading text-lg font-semibold">Estadísticas</h3>
      <p className="mt-2 text-sm text-muted-foreground">Esta sección está en construcción.</p>
    </section>
  );
}