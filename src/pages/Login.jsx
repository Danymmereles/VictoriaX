import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { esEmailUtn } from "@/lib/instituciones";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!esEmailUtn(email)) {
      setError("El Modo Estudio es exclusivo para la comunidad académica de UTN (@frba.utn.edu.ar o @frre.utn.edu.ar).");
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      navigate("/");
    } catch (authError) {
      setError(authError.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      icon={Lock}
      title="Iniciar sesión"
      subtitle="Accedé al Modo Estudio con tu cuenta institucional UTN.BA."
      footer={
        <>
          ¿Todavía no tenés cuenta?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Registrate
          </Link>
        </>
      }
    >
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-destructive/10 dark:bg-destructive/20 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email institucional</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@frba.utn.edu.ar"
              className="h-12 pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ingresando…</> : "Iniciar sesión"}
        </Button>
      </form>
    </AuthLayout>
  );
}