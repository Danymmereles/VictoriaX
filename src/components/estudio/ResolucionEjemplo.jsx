import React from "react";
import { Construction } from "lucide-react";
import { Image } from "@/components/ui/image";

// Ejemplo del formato de resolución (texto + foto). Contenido real por ejercicio
// se cargará más adelante — por ahora es el mismo ejemplo para todos.
export default function ResolucionEjemplo() {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card/40 p-6">
      <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Construction className="w-4 h-4" /> Ejemplo de formato — resolución real en construcción
      </p>
      <h3 className="mt-4 font-heading text-xl font-semibold">Resolución</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Este es un ejemplo del formato en el que se mostrará la resolución de cada ejercicio: un
        desarrollo escrito paso a paso, acompañado de imágenes (diagramas, tablas resueltas,
        capturas de la simulación). La resolución definitiva de este ejercicio se cargará más
        adelante.
      </p>
      <div className="mt-5 rounded-xl border border-dashed border-border p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Ejemplo de desarrollo:</strong> se plantea la
          metodología elegida, se resuelve la tabla de eventos paso a paso y se detalla el
          cálculo de las f.d.p. involucradas hasta llegar a los resultados pedidos.
        </p>
      </div>
      <Image
        src="https://media.base44.com/images/public/6a71341ab9dae936a9cf65a7/d86758d03_generated_image.png"
        alt="Ejemplo ilustrativo de resolución"
        className="mt-5 h-56 w-full max-w-md rounded-xl border border-border"
        fittingType="fit"
      />
    </section>
  );
}