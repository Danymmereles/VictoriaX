import { useEffect } from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({
  fallback = <DefaultFallback />,
  unauthenticatedElement = <Navigate to="/login" replace />,
}) {
  const { user, isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    if (authError.type === 'domain_restricted') {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-lg rounded-xl border border-border bg-card p-8 text-center">
            <h1 className="font-heading text-2xl font-semibold">Acceso al Modo Estudio</h1>
            <p className="mt-4 text-muted-foreground">{authError.message}</p>
            <Link to="/modo-libre" className="mt-6 inline-block text-primary underline">
              Continuar al Modo Libre
            </Link>
          </div>
        </div>
      );
    }
    return unauthenticatedElement;
  }

  if (isAuthenticated && !user?.email?.toLowerCase().endsWith("@frba.utn.edu.ar")) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-lg rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="font-heading text-2xl font-semibold">Acceso al Modo Estudio</h1>
          <p className="mt-4 text-muted-foreground">
            Para acceder al Modo Estudio necesitás una cuenta @frba.utn.edu.ar. Podés continuar
            usando el Modo Libre.
          </p>
          <Link to="/modo-libre" className="mt-6 inline-block text-primary underline">
            Continuar al Modo Libre
          </Link>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  return <Outlet />;
}
