import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { authClient } from "@/api/authClient";
import { useSesionUsuario } from "@/lib/sesionUsuario";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";

export default function CambiarContrasena() {
  const { usuario } = useSesionUsuario();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  function togglePasswordVisibility(field) {
    setVisiblePasswords((visible) => ({
      ...visible,
      [field]: !visible[field],
    }));
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <main className="mx-auto max-w-2xl px-6 py-32 text-center">
          <KeyRound className="mx-auto h-10 w-10 text-[#AF9BEF]" />
          <h1 className="mt-6 font-heading text-3xl font-semibold">No hay sesión activa</h1>
          <p className="mt-4 text-muted-foreground">Iniciá sesión para cambiar tu contraseña.</p>
          <Link to="/login" className="mt-8 inline-block text-[#AF9BEF] hover:underline">
            Iniciar sesión
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  async function cambiarContrasena(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setMessage("");

    const formData = new FormData(form);
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (newPassword !== confirmPassword) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSaving(true);
    try {
      await authClient.changePassword({ currentPassword, newPassword });
      form.reset();
      setMessage("Tu contraseña se actualizó correctamente.");
    } catch (changeError) {
      setError(changeError?.message || "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link
          to="/perfil"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a mi perfil
        </Link>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Seguridad</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">
            Cambiar contraseña
          </h1>
          <p className="mt-4 text-muted-foreground">
            Confirmá tu contraseña actual y elegí una nueva de al menos 8 caracteres.
          </p>
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-card p-8">
          {error && (
            <p role="alert" className="mb-5 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="mb-5 rounded-lg bg-primary/10 px-4 py-3 text-sm">
              {message}
            </p>
          )}
          <form onSubmit={cambiarContrasena} className="space-y-5">
            <div>
              <label htmlFor="currentPassword" className="text-sm font-medium text-muted-foreground">
                Contraseña actual
              </label>
              <div className="relative mt-2">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={visiblePasswords.currentPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-12 text-sm"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("currentPassword")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={visiblePasswords.currentPassword ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
                  aria-pressed={visiblePasswords.currentPassword}
                >
                  {visiblePasswords.currentPassword
                    ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                    : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="newPassword" className="text-sm font-medium text-muted-foreground">
                Nueva contraseña
              </label>
              <div className="relative mt-2">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={visiblePasswords.newPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-12 text-sm"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("newPassword")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={visiblePasswords.newPassword ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                  aria-pressed={visiblePasswords.newPassword}
                >
                  {visiblePasswords.newPassword
                    ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                    : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">
                Confirmar nueva contraseña
              </label>
              <div className="relative mt-2">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={visiblePasswords.confirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-12 text-sm"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={visiblePasswords.confirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                  aria-pressed={visiblePasswords.confirmPassword}
                >
                  {visiblePasswords.confirmPassword
                    ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                    : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#73C3EE] via-[#AF9BEF] to-[#EA84B4] px-6 py-3 text-sm font-medium text-[#0A0D14] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Actualizando…" : "Actualizar contraseña"}
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
