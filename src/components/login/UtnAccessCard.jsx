import React from "react";
import { Image } from "@/components/ui/image";

const UTN_LOGO = "https://media.base44.com/images/public/user_6a0a67179f994f2bd4488bb8/3d47b98da_image.png";

export default function UtnAccessCard({ onAccess }) {
  return (
    <div className="w-full max-w-md rounded-2xl border-2 border-[#B01739] bg-white p-8 text-center shadow-2xl">
      <h2 className="font-heading text-2xl font-medium text-slate-700">Acceso Usuario Institucional</h2>
      <Image src={UTN_LOGO} alt="UTN.BA — Universidad Tecnológica Nacional, Facultad Regional Buenos Aires" className="mx-auto mt-8 h-32 w-full object-contain" fittingType="fit" />
      <button
        onClick={onAccess}
        className="mt-8 w-full rounded-md bg-gradient-to-r from-[#73C3EE] via-[#AF9BEF] to-[#EA84B4] py-4 text-lg font-medium text-[#0A0D14] transition-transform hover:scale-[1.02]"
      >
        Acceder a VictoriaX
      </button>
      <p className="mt-6 text-sm leading-relaxed text-slate-500">
        Acceso para usuarios del Sistema Integrado de Aplicaciones de la UTN.BA
      </p>
    </div>
  );
}