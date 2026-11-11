import React from "react";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import EquipoList from "@/components/equipo/EquipoList";
import { Image } from "@/components/ui/image";

const FOTO_UTN =
  "https://base44.app/api/apps/6a71341ab9dae936a9cf65a7/files/mp/public/6a71341ab9dae936a9cf65a7/a5717d602_utn-frba-entrada.png";

export default function SobreNosotros() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Proyecto VictoriaX</p>
        <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Sobre nosotros
        </h1>

        <div className="mt-12 space-y-14">
          <section>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Conocé la historia detrás de VictoriaX
            </h2>
            <div className="mt-5 flow-root space-y-4 text-base leading-relaxed text-muted-foreground">
              <figure className="mb-4 sm:float-right sm:ml-6 sm:mb-2 sm:w-[280px] lg:w-[320px]">
                <Image
                  src={FOTO_UTN}
                  alt="Entrada de la sede de UTN FRBA"
                  className="block aspect-[4/3] w-full overflow-hidden rounded-xl border border-border"
                />
              </figure>
              <p>
                VictoriaX nace como un proyecto académico desarrollado en el marco de las cátedras
                de <strong className="font-semibold text-foreground">Simulación</strong> y{" "}
                <strong className="font-semibold text-foreground">Proyecto Final</strong> de la
                carrera de Ingeniería en Sistemas de Información de la Universidad Tecnológica
                Nacional, Facultad Regional Buenos Aires (UTN FRBA).
              </p>
              <p>
                Somos un equipo de cinco estudiantes que nos encontramos transitando la etapa final
                de nuestra carrera, unidos por el interés de aplicar nuestros conocimientos para
                desarrollar soluciones tecnológicas que aporten valor a la educación.
              </p>
              <p>
                Además, dos integrantes de nuestro equipo se desempeñan como ayudantes de cátedra,
                lo que nos permite conocer de cerca las necesidades y los desafíos que surgen
                durante el proceso de enseñanza y aprendizaje.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              De una idea existente a una nueva experiencia
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                VictoriaX surge a partir de la evolución de un proyecto desarrollado anteriormente,
                con el objetivo de modernizarlo y ampliar sus posibilidades.
              </p>
              <p>
                Nuestro trabajo se centra en la{" "}
                <strong className="font-semibold text-foreground">
                  actualización de las tecnologías, la optimización del funcionamiento, la
                  incorporación y mejora de funcionalidades y el diseño de una experiencia de
                  usuario más intuitiva y accesible
                </strong>
                .
              </p>
              <p>
                Sin embargo, nuestro propósito va más allá de la renovación tecnológica: buscamos
                que VictoriaX se convierta en una herramienta que acompañe tanto a estudiantes como
                a docentes.
              </p>
              <p>
                Para los estudiantes, queremos ofrecer un espacio donde puedan explorar, modelar y
                comprender los conceptos de Simulación de manera práctica e interactiva.
              </p>
              <p>
                Para los docentes, buscamos proporcionar herramientas que faciliten el
                acompañamiento y seguimiento del aprendizaje, complementando las actividades de la
                materia.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Nuestro propósito
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>Creemos que la tecnología puede transformar la manera en que aprendemos y enseñamos.</p>
              <p>
                Por eso, con VictoriaX buscamos acercar la teoría a la práctica, promover el
                aprendizaje activo y contribuir a una experiencia educativa más dinámica, intuitiva
                y enriquecedora.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Conocé a nuestro equipo
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Detrás de VictoriaX hay cinco futuros profesionales de Ingeniería en Sistemas de
              Información que aportan sus conocimientos, experiencias e ideas para hacer posible
              este proyecto.
            </p>
            <div className="mt-8">
              <EquipoList />
            </div>
            <p className="mt-10 border-t border-border/60 pt-6 text-sm italic text-muted-foreground">
              Un proyecto creado por estudiantes, pensado para acompañar a quienes enseñan y aprenden.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}