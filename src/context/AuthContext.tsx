"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { AuthService } from "@/services/AuthService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authService = AuthService.getInstance();
        authService.onAuthStateChange((usr) => {
          setUser(usr as User);
          setLoading(false);
          
          if (usr) {
             // Let the server know we are authenticated (for Middleware redirects)
             document.cookie = "auth_session=true; path=/; max-age=31536000; SameSite=Lax";
          } else {
             // Delete cookie if signed out
             document.cookie = "auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          }
        });
      } catch (e: any) {
        console.error("Firebase auth initialization error:", e);
        setError(e.message || "Failed to initialize Auth");
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const signOut = async () => {
    try {
      await AuthService.getInstance().signOut();
      document.cookie = "auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
