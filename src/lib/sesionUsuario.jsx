import React, { createContext, useContext, useEffect, useState } from "react";
import { getPermisos } from "@/lib/permisos";
import { useAuth } from "@/lib/AuthContext";

const SesionUsuarioContext = createContext(null);

export function SesionUsuarioProvider({ children }) {
  const { user, logout } = useAuth();
  const [perfilActualizado, setPerfilActualizado] = useState(null);

  useEffect(() => {
    setPerfilActualizado(null);
  }, [user?.id_usuario]);

  const rolAplicacion = {
    ADMIN: "ADMINISTRADOR",
    DOCENTE: "DOCENTE",
    ALUMNO: "ESTUDIANTE",
  };
  const usuario = user
    ? {
        ...user,
        id: user.id_usuario,
        rol: rolAplicacion[user.rol] || "ESTUDIANTE",
        ...perfilActualizado,
      }
    : null;
  const permisos = usuario ? getPermisos(usuario.rol) : null;

  return (
    <SesionUsuarioContext.Provider
      value={{
        usuario,
        permisos,
        iniciarSesion: (actualizado) => {
          if (usuario && actualizado?.id === usuario.id) {
            setPerfilActualizado({
              nombre_completo: actualizado.nombre_completo,
              nombre_usuario: actualizado.nombre_usuario,
              ...(actualizado.institucion ? { institucion: actualizado.institucion } : {}),
            });
          }
        },
        cerrarSesion: () => logout(),
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