import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { institucionDeUsuario, LISTA_INSTITUCIONES } from "@/lib/instituciones";

// Formulario reutilizable de perfil (DER USUARIO).
// `editable` se controla con permisos del diagrama de seguridad:
//   - perfil propio  -> puedoEditarPerfil
//   - perfil ajeno   -> puedoEditarOtrosPerfiles (solo admin)
export default function PerfilForm({
  usuario,
  editable = true,
  rolEditable = editable,
  institucionEditable = rolEditable,
  onSave,
  saving = false,
}) {
  const [form, setForm] = useState({
    nombre_usuario: usuario?.nombre_usuario || "",
    email: usuario?.email || "",
    nombre_completo: usuario?.nombre_completo || "",
    institucion: institucionDeUsuario(usuario),
    rol: usuario?.rol || "ESTUDIANTE",
  });

  const opcionesInstitucion =
    form.institucion && !LISTA_INSTITUCIONES.includes(form.institucion)
      ? [form.institucion, ...LISTA_INSTITUCIONES]
      : LISTA_INSTITUCIONES;

  function cambiar(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  function submit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Campo label="Nombre de usuario" valor={form.nombre_usuario} onChange={cambiar("nombre_usuario")} editable={editable} />
      <Campo label="Nombre completo" valor={form.nombre_completo} onChange={cambiar("nombre_completo")} editable={editable} />
      <Campo label="Email" type="email" valor={form.email} onChange={cambiar("email")} editable={editable} />

      <div>
        <label className="text-sm font-medium text-muted-foreground">Institución</label>
        <select
          value={form.institucion}
          onChange={cambiar("institucion")}
          disabled={!institucionEditable}
          className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {opcionesInstitucion.map((institucion) => (
            <option key={institucion} value={institucion}>{institucion}</option>
          ))}
        </select>
      </div>

      {usuario?.puedeUsarModoEstudio && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">Rol</label>
          <select
            value={form.rol}
            onChange={cambiar("rol")}
            disabled={!rolEditable}
            className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="ADMINISTRADOR">Administrador</option>
            <option value="DOCENTE">Docente</option>
            <option value="ESTUDIANTE">Estudiante</option>
          </select>
        </div>
      )}

      {editable && (
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#73C3EE] via-[#AF9BEF] to-[#EA84B4] px-6 py-3 text-sm font-medium text-[#0A0D14] transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar cambios
        </button>
      )}
    </form>
  );
}

function Campo({ label, valor, onChange, editable, type = "text" }) {
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={valor}
        onChange={onChange}
        disabled={!editable}
        className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}