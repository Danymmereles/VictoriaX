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
        <Link to={state.error ? "/register" : "/login"} className="font-medium text-primary hover:underline">
          {state.error ? "Crear cuenta nuevamente" : "Iniciar sesión"}
        </Link>
      )}
    >
      {state.loading && <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" aria-label="Cargando" />}
    </AuthLayout>
  );
}
