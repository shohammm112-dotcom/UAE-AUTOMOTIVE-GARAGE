import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthContextDto } from "@/types/api";
import { ApiClient } from "../api/client";
import { TokenProvider } from "./TokenProvider";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthContextDto | null;
  loginWithMockDevToken: () => Promise<void>;
  logout: () => void;
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
    setIsLoading(true);
    // In the real system, this would trigger Firebase OAuth/Popup.
    // For now, we inject a token that the MockAuthTokenVerifier in the backend will accept.
    const mockToken = "test-token-alice";
    TokenProvider.setToken(mockToken);
    localStorage.setItem("dev_auth_token", mockToken);
    
    await fetchProfile();
  };

  const logout = () => {
    TokenProvider.setToken(null);
    localStorage.removeItem("dev_auth_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        loginWithMockDevToken,
        logout,
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
