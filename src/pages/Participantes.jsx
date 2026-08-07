import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, UserCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
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

  async function cargar() {
    setCargando(true);
    try {
      setLista(await base44.entities.Usuario.list());
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
    try {
      await base44.entities.Usuario.update(seleccionado.id, form);
      await cargar();
      setSeleccionado(null);
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
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Nombre completo</th>
                  <th className="px-5 py-4">Usuario</th>
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
                    <td className="px-5 py-4 text-muted-foreground">{u.nombre_usuario}</td>
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

          <aside className="lg:col-span-2">
            {seleccionado ? (
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
                    usuario={seleccionado}
                    editable={permisos.puedoEditarOtrosPerfiles}
                    rolEditable={permisos.puedoCambiarRol}
                    onSave={guardarOtro}
                    saving={saving}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
                <UserCircle className="mx-auto w-8 h-8 text-muted-foreground" />
                <p className="mt-3">Selecciona un participante para editar su perfil.</p>
              </div>
            )}
          </aside>
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