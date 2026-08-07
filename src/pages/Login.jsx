import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Image } from "@/components/ui/image";
import Wordmark from "@/components/brand/Wordmark";
import ThemeToggle from "@/components/theme/ThemeToggle";
import UtnAccessCard from "@/components/login/UtnAccessCard";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src="https://media.base44.com/images/public/6a71341ab9dae936a9cf65a7/5f712e98a_generated_e5aabbd5.png"
          alt="Nodos de datos translúcidos con patrones de circuito"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0A0D14]/70" />
        <div className="relative flex h-full flex-col justify-between p-14">
          <div className="text-white">
            <Wordmark withTagline />
          </div>
          <div className="max-w-md text-white">
            <h2 className="font-heading text-4xl font-semibold leading-tight">
              Modo Estudio
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/70">
              Iniciá sesión con tu cuenta institucional para acceder al camino de aprendizaje,
              resolver los ejercicios de la cátedra y comparar tu solución con la resolución
              propuesta.
            </p>
            <p className="mt-8 text-sm text-white/50">
              El Modo Libre no requiere cuenta: podés modelar y ejecutar simulaciones sin
              iniciar sesión.
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="absolute left-6 right-6 top-6 flex items-center justify-between lg:left-auto lg:right-10 lg:top-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <ThemeToggle />
        </div>

        <UtnAccessCard onAccess={() => navigate("/seleccion-rol")} />

        <Link
          to="/modo-libre"
          className="mt-10 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Continuar sin iniciar sesión al Modo Libre
        </Link>
        <Link to="/" className="mt-4 hidden items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:inline-flex">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
      </div>
    </div>
  );
}