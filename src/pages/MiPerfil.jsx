import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, UserCircle } from "lucide-react";
import { authClient } from "@/api/authClient";
import { useSesionUsuario } from "@/lib/sesionUsuario";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import PerfilForm from "@/components/perfil/PerfilForm";

export default function MiPerfil() {
  const { usuario, permisos, iniciarSesion } = useSesionUsuario();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!usuario) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <main className="mx-auto max-w-2xl px-6 py-32 text-center">
          <UserCircle className="mx-auto w-10 h-10 text-[#AF9BEF]" />
          <h1 className="mt-6 font-heading text-3xl font-semibold">No hay sesion activa</h1>
          <p className="mt-4 text-muted-foreground">Inicia sesion para ver tu perfil.</p>
          <Link to="/login" className="mt-8 inline-block text-[#AF9BEF] hover:underline">Iniciar sesion</Link>
        </main>
        <Footer />
      </div>
    );
  }

  async function guardar(form) {
    setSaving(true);
    setError("");
    try {
      const actualizado = await authClient.updateUser(usuario.id, form);
      iniciarSesion({ ...usuario, ...actualizado });
    } catch (e) {
      setError(e?.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Perfil</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">Mi perfil</h1>
          <p className="mt-4 text-muted-foreground">
            Rol actual: <span className="font-medium text-foreground">{usuario.rol}</span>
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-8">
          {error && (
            <p className="mb-6 rounded-lg bg-destructive/10 dark:bg-destructive/20 px-4 py-3 text-sm text-destructive">{error}</p>
          )}
          <PerfilForm
            usuario={usuario}
            editable={permisos?.puedoEditarPerfil}
            rolEditable={false}
            onSave={guardar}
            saving={saving}
          />
        </div>

        <Link
          to="/perfil/cambiar-contrasena"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          <KeyRound className="h-4 w-4 text-[#AF9BEF]" aria-hidden="true" />
          Cambiar contraseña
        </Link>
      </main>
      <Footer />
    </div>
  );
}