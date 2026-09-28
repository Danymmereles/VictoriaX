import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, UserCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { authClient, isLocalAuthEnabled } from "@/api/authClient";
import { useSesionUsuario } from "@/lib/sesionUsuario";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import PerfilForm from "@/components/perfil/PerfilForm";

export default function Participantes() {
  const { usuario, permisos } = useSesionUsuario();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    setCargando(true);
    try {
      setError("");
      setLista(
        isLocalAuthEnabled
          ? await authClient.listUsers()
          : await base44.entities.Usuario.list(),
      );
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los participantes.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  // Guarda de acceso: solo quien puede visualizar otros perfiles (Admin, Docente)
  if (!usuario || !permisos?.puedoVisualizarOtrosPerfiles) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <main className="mx-auto max-w-2xl px-6 py-32 text-center">
          <Users className="mx-auto w-10 h-10 text-[#AF9BEF]" />
          <h1 className="mt-6 font-heading text-3xl font-semibold">Acceso restringido</h1>
          <p className="mt-4 text-muted-foreground">
            Solo los administradores pueden ver el listado completo de participantes.
          </p>
          <Link to="/" className="mt-8 inline-block text-[#AF9BEF] hover:underline">Volver al inicio</Link>
        </main>
        <Footer />
      </div>
    );
  }

  async function guardarOtro(form) {
    setSaving(true);
    setError("");
    try {
      if (isLocalAuthEnabled) {
        await authClient.updateUser(seleccionado.id, form);
      } else {
        await base44.entities.Usuario.update(seleccionado.id, form);
      }
      await cargar();
      setSeleccionado(null);
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Administracion</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">Participantes</h1>
          <p className="mt-4 text-muted-foreground">Listado completo de usuarios registrados en la plataforma.</p>
          {isLocalAuthEnabled && (
            <p className="mt-3 rounded-lg border border-[#AF9BEF]/30 bg-[#AF9BEF]/5 p-3 text-sm text-muted-foreground">
              Modo local: las cuentas y los cambios de rol se guardan en este navegador.
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-10 grid gap-8">
          {seleccionado && permisos.puedoEditarOtrosPerfiles && (
            <aside className="mx-auto w-full max-w-2xl">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-xl font-semibold">Editar perfil</h2>
                  <button
                    onClick={() => setSeleccionado(null)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cerrar
                  </button>
                </div>
                <div className="mt-6">
                  <PerfilForm
                    key={seleccionado.id}
                    usuario={seleccionado}
                    editable={permisos.puedoEditarOtrosPerfiles}
                    rolEditable={permisos.puedoCambiarRol}
                    onSave={guardarOtro}
                    saving={saving}
                  />
                </div>
              </div>
            </aside>
          )}

          <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Nombre completo</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Rol</th>
                  <th className="px-5 py-4 text-right">Accion</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">Cargando…</td></tr>
                ) : lista.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">Sin participantes.</td></tr>
                ) : lista.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-5 py-4 font-medium">{u.nombre_completo}</td>
                    <td className="px-5 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-5 py-4"><BadgeRol rol={u.rol} /></td>
                    <td className="px-5 py-4 text-right">
                      {permisos.puedoEditarOtrosPerfiles ? (
                        <button
                          onClick={() => setSeleccionado(u)}
                          className="text-sm font-medium text-[#AF9BEF] hover:underline"
                        >
                          Editar
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Solo lectura</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!seleccionado && permisos.puedoEditarOtrosPerfiles && (
            <div className="mx-auto w-full max-w-md rounded-2xl border border-dashed border-border bg-card/50 p-5 text-center text-sm text-muted-foreground">
                <UserCircle className="mx-auto w-8 h-8 text-muted-foreground" />
                <p className="mt-3">Selecciona un participante para editar su perfil.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function BadgeRol({ rol }) {
  const styles = {
    ADMINISTRADOR: "bg-[#73C3EE]/15 text-[#73C3EE]",
    DOCENTE: "bg-[#AF9BEF]/15 text-[#AF9BEF]",
    ESTUDIANTE: "bg-[#EA84B4]/15 text-[#EA84B4]",
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${styles[rol] || ""}`}>
      {rol}
    </span>
  );
}