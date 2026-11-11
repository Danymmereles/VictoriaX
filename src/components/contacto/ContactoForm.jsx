import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";

const MOTIVOS = ["Consulta", "Sugerencia", "Inconveniente técnico", "Otro"];

const VACIO = { nombre: "", email: "", motivo: "", mensaje: "" };

export default function ContactoForm() {
  const [form, setForm] = useState(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim() || !form.email.trim() || !form.motivo || !form.mensaje.trim()) {
      setError("Completá todos los campos para enviar tu mensaje.");
      return;
    }
    setEnviando(true);
    try {
      await base44.entities.MensajeContacto.create({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        motivo: form.motivo,
        mensaje: form.mensaje.trim(),
      });
      setEnviado(true);
    } catch {
      setError("No se pudo enviar tu mensaje. Intentá nuevamente en unos instantes.");
    } finally {
      setEnviando(false);
    }
  }

  function reiniciar() {
    setForm(VACIO);
    setEnviado(false);
  }

  if (enviado) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 font-heading text-2xl font-semibold">¡Gracias por escribirnos!</h2>
        <p className="mt-3 text-muted-foreground">
          Recibimos tu mensaje y nos pondremos en contacto a la brevedad.
        </p>
        <Button variant="outline" className="mt-8" onClick={reiniciar}>
          Enviar otro mensaje
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          placeholder="Tu nombre"
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          placeholder="nombre@ejemplo.com"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Motivo de contacto</Label>
        <Select value={form.motivo} onValueChange={(v) => set("motivo", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccioná una opción" />
          </SelectTrigger>
          <SelectContent>
            {MOTIVOS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mensaje">Mensaje</Label>
        <Textarea
          id="mensaje"
          rows={6}
          placeholder="Contanos en qué podemos ayudarte..."
          value={form.mensaje}
          onChange={(e) => set("mensaje", e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-center pt-2">
        <Button type="submit" disabled={enviando} className="px-8">
          {enviando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…
            </>
          ) : (
            "Enviar mensaje"
          )}
        </Button>
      </div>
    </form>
  );
}