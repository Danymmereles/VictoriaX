import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, MailWarning } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { authClient } from "@/api/authClient";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState({ loading: Boolean(token), error: "" });

  useEffect(() => {
    let active = true;
    if (!token) {
      setState({ loading: false, error: "El enlace de verificación no es válido." });
      return () => { active = false; };
    }
    authClient.verifyEmail(token)
      .then(() => active && setState({ loading: false, error: "" }))
      .catch((error) => active && setState({ loading: false, error: error.message }));
    return () => { active = false; };
  }, [token]);

  const Icon = state.loading ? Loader2 : state.error ? MailWarning : CheckCircle;
  return (
    <AuthLayout
      icon={Icon}
      title={state.loading ? "Verificando email" : state.error ? "No se pudo verificar" : "Email verificado"}
      subtitle={state.loading ? "Estamos validando el enlace." : state.error || "Tu cuenta ya está activa. Iniciá sesión para continuar."}
      footer={state.loading ? null : (
        <div className="flex flex-col items-center justify-center gap-3">
          <Link
            to={state.error ? "/register" : "/login"}
            className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {state.error ? "Crear cuenta nuevamente" : "Iniciar sesión"}
          </Link>
          {state.error && (
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Volver al inicio de sesión
            </Link>
          )}
        </div>
      )}
    >
      {state.loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="Cargando" />
        </div>
      )}
    </AuthLayout>
  );
}
