import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";

import { authClient } from "@/api/authClient";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendConfirmation, setResendConfirmation] = useState("");

  const isUnverifiedEmail =
    error.toLowerCase().includes("verificá tu email") ||
    error.toLowerCase().includes("verifica tu email");

  async function handleResendVerification() {
    setResending(true);
    setResendConfirmation("");
    try {
      await authClient.resendVerification(email);
      setResendConfirmation("Te enviamos un nuevo correo de verificación. Revisá tu casilla.");
    } catch (err) {
      setResendConfirmation(err.message || "No se pudo reenviar el correo.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResendConfirmation("");

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
      subtitle="Iniciá sesión para continuar en VictoriaX."
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
          <p>{error}</p>
          {isUnverifiedEmail && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="font-semibold underline hover:opacity-80 disabled:opacity-50"
              >
                {resending ? "Enviando..." : "Reenviar correo de verificación"}
              </button>
            </div>
          )}
        </div>
      )}
      {resendConfirmation && (
        <p role="status" className="mb-4 rounded-lg bg-primary/10 p-3 text-sm text-foreground">
          {resendConfirmation}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
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
      <p className="mt-4 text-center text-sm">
        <Link to="/forgot-password" className="font-medium text-primary hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </AuthLayout>
  );
}