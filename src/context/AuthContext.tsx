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
