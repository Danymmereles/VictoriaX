import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, UserPlus, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { esEmailUtn } from "@/lib/instituciones";

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setConfirmationMessage("");
    if (!VALID_EMAIL.test(email.trim())) {
      setError("Ingresá un email válido.");
      return;
    }

    setLoading(true);
    try {
      const result = await register({ nombreCompleto, email, password });
      if (result.accessToken) {
        if (esEmailUtn(email)) {
          navigate("/modo-estudio");
        } else {
          setConfirmationMessage(
            "Tu cuenta se creó correctamente. Para usar el Modo Estudio necesitás una cuenta @frba.utn.edu.ar o @frre.utn.edu.ar; mientras tanto podés acceder al Modo Libre.",
          );
        }
      } else {
        setConfirmationMessage(
          "La cuenta fue creada. Revisá el correo que ingresaste para confirmar tu email y luego iniciá sesión.",
        );
      }
    } catch (registrationError) {
      setError(registrationError.message || "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Crear cuenta"
      subtitle="Creá tu cuenta con email y contraseña."
      footer={
        <>
          ¿Ya tenés una cuenta?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Iniciá sesión
          </Link>
        </>
      }
    >
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {confirmationMessage && (
        <p role="status" className="mb-4 rounded-lg bg-primary/10 p-3 text-sm">
          {confirmationMessage}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nombreCompleto">Nombre completo</Label>
          <div className="relative">
            <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="nombreCompleto"
              autoComplete="name"
              value={nombreCompleto}
              onChange={(event) => setNombreCompleto(event.target.value)}
              className="h-12 pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@ejemplo.com"
              className="h-12 pl-10"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Podés registrarte con cualquier email. Para acceder al Modo Estudio,
            recordá usar una cuenta @frba.utn.edu.ar o @frre.utn.edu.ar.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña (mínimo 8 caracteres)</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 pl-10 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando cuenta…</> : "Crear cuenta"}
        </Button>
      </form>
    </AuthLayout>
  );
}