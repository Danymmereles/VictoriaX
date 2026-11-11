import React from "react";
import { Mail } from "lucide-react";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import EquipoList from "@/components/equipo/EquipoList";

const EMAIL_CONTACTO = "victoria.x.simulacion@gmail.com";

export default function Contacto() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-3xl px-6 py-20 lg:px-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          ¡Estamos para escucharte!
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          ¿Tenés alguna pregunta, sugerencia o necesitás ayuda? ¡Nos encantaría saber de vos!
        </p>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Podés escribirnos para resolver tus dudas, compartir tus ideas o contarnos cualquier
          inconveniente que hayas tenido.
        </p>

        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Contactanos por correo electrónico
          </p>
          <a
            href={`mailto:${EMAIL_CONTACTO}`}
            className="mt-4 inline-flex items-center gap-3 text-xl font-medium text-foreground transition-colors hover:text-primary sm:text-2xl"
          >
            <Mail className="h-6 w-6 text-primary" />
            {EMAIL_CONTACTO}
          </a>
        </div>

        <div className="mt-16 border-t border-border/60 pt-10">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">Nuestro equipo</h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Detrás de VictoriaX hay cinco estudiantes de Ingeniería en Sistemas de Información.
            Podés contactarlos directamente por LinkedIn o por correo electrónico.
          </p>
          <div className="mt-8">
            <EquipoList mostrarEmail />
          </div>
        </div>

        <p className="mt-12 text-lg font-medium">¡Esperamos tu mensaje!</p>
      </main>
      <Footer />
    </div>
  );
}