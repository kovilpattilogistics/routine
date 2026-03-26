"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AuthService } from "@/services/AuthService";
import { DatabaseService } from "@/services/DatabaseService";
import styles from "./register.module.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { user, loading } = useAuth();
  const router = useRouter();

  // Already signed in — route appropriately
  useEffect(() => {
    if (loading || !user) return;
    DatabaseService.getInstance()
      .hasCompletedOnboarding(user.uid)
      .then((done) => router.replace(done ? "/planner" : "/onboarding"))
      .catch(() => router.replace("/onboarding"));
  }, [user, loading, router]);

  if (loading) return null;
  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (name.trim().length < 2) { setError("Name must be at least 2 characters."); return; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    setIsLoading(true);
    try {
      const u = await AuthService.getInstance().register(email, password);
      // Save initial profile, then go to onboarding for the rest
      try {
        const db = DatabaseService.getInstance();
        await db.createUserProfile(u.uid, {
          name: name.trim(),
          email,
          onboardingComplete: false,
        });
        // Initialize v2 Default Groups
        await db.initDefaultGroups(u.uid);
      } catch (e) {
        console.error("Initial profile/group save failed:", e);
      }
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Could not create account. Please try again.");
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span className={styles.logoText}>MonkGrid <span className={styles.vTag}>v2</span></span>
        </div>

        <div className={styles.heading}>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Build better habits, starting today</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>Full Name</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Email Address</label>
            <input
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? <span className={styles.btnSpinner} /> : null}
            {isLoading ? "Creating account…" : "Register — It's free"}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{" "}
          <Link href="/login" className={styles.switchLink}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
