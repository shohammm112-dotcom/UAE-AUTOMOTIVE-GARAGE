import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthContextDto } from "@/types/api";
import { ApiClient } from "../api/client";
import { TokenProvider } from "./TokenProvider";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthContextDto | null;
  loginWithMockDevToken: () => Promise<void>;
  loginWithStaffDevToken: (role: "advisor" | "manager") => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// DEFERRED: Real Firebase Auth integration
// The actual production provider will be connected in Antigravity.
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const data = await ApiClient.get<{ user: AuthContextDto }>("/auth/me");
      setUser(data.user);
    } catch (error) {
      console.error("Failed to fetch profile", error);
      TokenProvider.setToken(null);
      localStorage.removeItem("dev_auth_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check local storage for existing session
    const savedToken = localStorage.getItem("dev_auth_token");
    if (savedToken) {
      TokenProvider.setToken(savedToken);
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loginWithMockDevToken = async () => {
    // Dev-only affordance. Vite replaces `import.meta.env.DEV` with `false` at
    // build time, so everything below is unreachable in a production bundle and
    // is stripped by minification - the token literal never ships.
    if (!import.meta.env.DEV) return;
    setIsLoading(true);
    // In the real system, this would trigger Firebase OAuth/Popup.
    // For now, we inject a token that the MockAuthTokenVerifier in the backend will accept.
    const mockToken = "test-token-alice";
    TokenProvider.setToken(mockToken);
    localStorage.setItem("dev_auth_token", mockToken);
    
    await fetchProfile();
  };

  const loginWithStaffDevToken = async (role: "advisor" | "manager") => {
    // Dev-only affordance - see loginWithMockDevToken. These two token strings
    // grant `advisor` and `workshop_manager`+`admin` respectively, so they must
    // never reach a production bundle.
    if (!import.meta.env.DEV) return;
    setIsLoading(true);
    const mockToken = role === "manager" ? "test-token-staff-manager" : "test-token-staff-advisor";
    TokenProvider.setToken(mockToken);
    localStorage.setItem("dev_auth_token", mockToken);
    
    await fetchProfile();
  };

  const logout = () => {
    TokenProvider.setToken(null);
    localStorage.removeItem("dev_auth_token");
    setUser(null);
  };

  const hasRole = (role: string) => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        loginWithMockDevToken,
        loginWithStaffDevToken,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

