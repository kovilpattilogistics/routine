"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AuthService } from "@/services/AuthService";
import { DatabaseService } from "@/services/DatabaseService";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const { user, loading } = useAuth();
  const router = useRouter();

  // Returning user — check onboarding status
  useEffect(() => {
    if (loading || !user) return;
    setChecking(true);
    DatabaseService.getInstance()
      .hasCompletedOnboarding(user.uid)
      .then((done) => router.replace(done ? "/planner" : "/onboarding"))
      .catch(() => router.replace("/onboarding"))
      .finally(() => setChecking(false));
  }, [user, loading, router]);

  if (loading || checking) {
    return (
      <div className={styles.page}>
        <div className={styles.loader}><span className={styles.spinner} /></div>
      </div>
    );
  }

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    setIsLoading(true);
    try {
      await AuthService.getInstance().signIn(email, password);
      // redirect handled by useEffect above
    } catch (err: any) {
      setError(err.message || "Unable to sign in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background with overlay */}
      <div className={styles.bg} />
      <div className={styles.overlay} />

      {/* Back link */}
      <Link href="/" className={styles.backLink}>← Home</Link>

      {/* Card */}
      <div className={styles.card}>
        <div className={styles.logoMark}>
          <div className={styles.premiumLogo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span className={styles.logoText}>Monk</span>
        </div>

        <div className={styles.heading}>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to continue your journey</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>Email address</label>
            <input
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? <span className={styles.btnSpinner} /> : null}
            {isLoading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className={styles.switchText}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className={styles.switchLink}>Register</Link>
        </p>
      </div>
    </div>
  );
}
