import React from "react";
import { Building2, Mail } from "lucide-react";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import EquipoList from "@/components/equipo/EquipoList";

const EMAIL_CONTACTO = "victoria.x.simulacion@gmail.com";

const ASUNTO_INSTITUCIONAL = encodeURIComponent("Propuesta institucional · VictoriaX");
const CUERPO_INSTITUCIONAL = encodeURIComponent(
  [
    "Hola, quiero incorporar VictoriaX a mi universidad.",
    "",
    "Universidad:",
    "Facultad:",
    "Cátedra / materia:",
    "Cantidad de cursos:",
    "Cantidad estimada de estudiantes:",
    "",
    "Gracias.",
  ].join("\n")
);

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

        <div className="mt-14 rounded-3xl border border-border/70 bg-gradient-to-br from-[#73C3EE]/10 via-[#AF9BEF]/10 to-[#EA84B4]/10 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Propuesta institucional
          </p>
          <h2 className="mt-4 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            ¿Querés agregar la plataforma a tu universidad?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Si sos docente o parte de una cátedra y querés incorporar VictoriaX a tus materias,
            escribinos y te enviamos una propuesta con el presupuesto según la cantidad de cursos
            y estudiantes.
          </p>
          <a
            href={`mailto:${EMAIL_CONTACTO}?subject=${ASUNTO_INSTITUCIONAL}&body=${CUERPO_INSTITUCIONAL}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#73C3EE] via-[#AF9BEF] to-[#EA84B4] px-6 py-3.5 text-sm font-medium text-[#0A0D14] transition-transform hover:scale-[1.02]"
          >
            <Building2 className="h-4 w-4" />
            Pedir una propuesta
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