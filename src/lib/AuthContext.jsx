import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authClient } from "@/api/authClient";
import { AUTH_SESSION_EXPIRY_KEY } from "@/api/sessionExpiry";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const currentUser = await authClient.me();
      setUser(currentUser);
      setIsAuthenticated(Boolean(currentUser));
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({
        type: error.status === 403 ? "domain_restricted" : "unknown",
        message: error.message,
      });
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  useEffect(() => {
    let expiryTimer;
    const scheduleExpiryCheck = () => {
      window.clearTimeout(expiryTimer);
      if (!isAuthenticated) return;
      const expiresAt = authClient.getSessionExpiresAt();
      if (expiresAt === null) return;
      expiryTimer = window.setTimeout(
        () => void checkUserAuth(),
        Math.max(0, expiresAt - Date.now()),
      );
    };
    const handleStorage = (event) => {
      if (event.key === AUTH_SESSION_EXPIRY_KEY) void checkUserAuth();
    };
    const handleFocus = () => {
      const expiresAt = authClient.getSessionExpiresAt();
      if (expiresAt !== null && expiresAt <= Date.now()) void checkUserAuth();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") handleFocus();
    };

    scheduleExpiryCheck();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearTimeout(expiryTimer);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [checkUserAuth, isAuthenticated, user?.id_usuario]);

  const login = async (credentials) => {
    const currentUser = await authClient.login(credentials);
    setUser(currentUser);
    setIsAuthenticated(true);
    setAuthError(null);
    return currentUser;
  };

  const register = async (details) => {
    const result = await authClient.register(details);
    if (result.accessToken) {
      setUser(result.user);
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    return result;
  };

  const logout = async (shouldRedirect = false) => {
    try {
      await authClient.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(null);
    }
    if (shouldRedirect) window.location.assign("/login");
  };

  const navigateToLogin = () => window.location.assign("/login");

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings: false,
        authError,
        appPublicSettings: null,
        authChecked: !isLoadingAuth,
        logout,
        login,
        register,
        navigateToLogin,
        checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
