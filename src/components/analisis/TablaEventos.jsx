import React from "react";
import { METODOLOGIAS } from "@/lib/analisisPrevio";
import TablaEventosEaE from "./TablaEventosEaE";
import TablaEventosDeltaT from "./TablaEventosDeltaT";

export default function TablaEventos({ analisis, onChange, error = false, filasConError = [] }) {
  const { metodologia, eventos, variables } = analisis;
  function setFilas(filas) {
    onChange({ ...eventos, filas });
  }

  if (!metodologia) {
    return (
      <p className="text-sm text-muted-foreground">
        Seleccioná una metodología para ver la tabla de eventos correspondiente.
      </p>
    );
  }
  if (metodologia === METODOLOGIAS.EVENTO_A_EVENTO) {
    return <TablaEventosEaE filas={eventos.filas || []} onChange={setFilas} controlVars={variables.control} filasConError={filasConError} />;
  }
  return <TablaEventosDeltaT eventos={eventos} onChange={onChange} controlVars={variables.control} />;
}