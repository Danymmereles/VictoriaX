import React, { createContext, useContext, useEffect, useState } from "react";
import { getPermisos } from "@/lib/permisos";

// ===========================================================================
// Seam de autenticacion (desacoplado)
// ---------------------------------------------------------------------------
// Hoy: la pagina de Seleccion de Rol (temporal) setea el usuario simulado.
// Mañana: el autenticador de la facultad / propio setea aca el usuario real.
// El resto de la app consume useSesionUsuario() y no sabe de donde viene.
// Reemplazar el origen del usuario sin tocar consumidores = cambio localizado.
// ===========================================================================

const SesionUsuarioContext = createContext(null);
const STORAGE_KEY = "vx-sesion-usuario";

export function SesionUsuarioProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (usuario) localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    else localStorage.removeItem(STORAGE_KEY);
  }, [usuario]);

  const permisos = usuario ? getPermisos(usuario.rol) : null;

  return (
    <SesionUsuarioContext.Provider
      value={{
        usuario,
        permisos,
        iniciarSesion: (u) => setUsuario(u),
        cerrarSesion: () => setUsuario(null),
      }}
    >
      {children}
    </SesionUsuarioContext.Provider>
  );
}

export function useSesionUsuario() {
  const ctx = useContext(SesionUsuarioContext);
  if (!ctx) {
    return { usuario: null, permisos: null, iniciarSesion: () => {}, cerrarSesion: () => {} };
  }
  return ctx;
}