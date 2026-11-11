import React from "react";
import { Mail, ArrowDown } from "lucide-react";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import ContactoForm from "@/components/contacto/ContactoForm";

const EMAIL_CONTACTO = "victoria.x.simulacion@gmail.com";

export default function Contacto() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          ¡Estamos para escucharte!
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          ¿Tenés alguna consulta, sugerencia o encontraste algún inconveniente? Nos encantaría saber de vos.
        </p>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Completá el siguiente formulario y nos pondremos en contacto con vos. Si lo preferís, también
          podés escribirnos directamente por correo electrónico.
        </p>

        <div className="mt-10">
          <ContactoForm />
        </div>

        <div className="mt-16 border-t border-border/60 pt-10 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            ¿Preferís escribirnos directamente?
          </p>
          <a
            href={`mailto:${EMAIL_CONTACTO}`}
            className="mt-4 inline-flex items-center gap-2 text-lg font-medium text-foreground transition-colors hover:text-primary"
          >
            <Mail className="h-5 w-5" /> {EMAIL_CONTACTO}
          </a>
          <p className="mt-2 text-sm text-muted-foreground">Podés enviarnos un correo cuando quieras.</p>
          <div className="mt-10 flex justify-center">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground">
              <ArrowDown className="h-4 w-4" />
            </span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}