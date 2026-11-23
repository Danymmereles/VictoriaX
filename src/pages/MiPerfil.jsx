import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Trash2, UserCircle } from "lucide-react";
import { authClient } from "@/api/authClient";
import { useSesionUsuario } from "@/lib/sesionUsuario";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import PerfilForm from "@/components/perfil/PerfilForm";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MiPerfil() {
  const navigate = useNavigate();
  const { usuario, permisos, iniciarSesion, cerrarSesion } = useSesionUsuario();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [passwordEliminar, setPasswordEliminar] = useState("");
  const [errorEliminar, setErrorEliminar] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  async function handleEliminarCuenta(e) {
    e.preventDefault();
    setErrorEliminar("");
    if (!passwordEliminar) {
      setErrorEliminar("Ingresá tu contraseña para confirmar.");
      return;
    }
    setDeleting(true);
    try {
      await authClient.deleteAccount(passwordEliminar);
      await cerrarSesion();
      navigate("/");
    } catch (err) {
      setErrorEliminar(err.message || "No se pudo eliminar la cuenta.");
      setDeleting(false);
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
          {usuario.puedeUsarModoEstudio && (
            <p className="mt-4 text-muted-foreground">
              Rol actual: <span className="font-medium text-foreground">{usuario.rol}</span>
            </p>
          )}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-8">
          {error && (
            <p className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
          )}
          <PerfilForm
            usuario={usuario}
            editable={permisos?.puedoEditarPerfil}
            rolEditable={false}
            onSave={guardar}
            saving={saving}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/perfil/cambiar-contrasena"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <KeyRound className="h-4 w-4 text-[#AF9BEF]" aria-hidden="true" />
            Cambiar contraseña
          </Link>
        </div>

        <div className="mt-12 rounded-2xl border border-destructive/30 bg-destructive/5 p-8">
          <h2 className="font-heading text-xl font-semibold text-destructive">Eliminar cuenta</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Al eliminar tu cuenta se cerrarán todas tus sesiones y se borrarán tus datos de forma permanente. Esta acción no se puede deshacer.
          </p>
          <button
            type="button"
            onClick={() => {
              setPasswordEliminar("");
              setErrorEliminar("");
              setModalEliminarAbierto(true);
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90"
          >
            <Trash2 className="h-4 w-4" /> Eliminar cuenta
          </button>
        </div>
      </main>
      <Footer />

      <AlertDialog open={modalEliminarAbierto} onOpenChange={setModalEliminarAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmás la eliminación de tu cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible y borrará tu cuenta de VictoriaX de forma permanente. Ingresá tu contraseña actual para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleEliminarCuenta} className="space-y-4 py-2">
            {errorEliminar && (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{errorEliminar}</p>
            )}
            <div>
              <Input
                type="password"
                placeholder="Tu contraseña actual"
                value={passwordEliminar}
                onChange={(e) => setPasswordEliminar(e.target.value)}
                disabled={deleting}
                autoFocus
                required
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting} onClick={() => setModalEliminarAbierto(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                type="submit"
                disabled={deleting || !passwordEliminar}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Eliminando..." : "Confirmar y eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}