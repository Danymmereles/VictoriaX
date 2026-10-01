import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authClient } from "@/api/authClient";

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
    await authClient.logout();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
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
