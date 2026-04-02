"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./landing.module.css";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/planner");
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className={styles.page}>
      {/* Background — same CSS gradient as login/register */}
      <div className={styles.bg} />

      {/* Glass card — identical structure to login/register */}
      <div className={styles.card}>
        {/* Logo — same as auth pages */}
        <div className={styles.logoMark}>
          <div className={styles.premiumLogo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className={styles.logoText}>
            MonkGrid <span className={styles.vTag}>v2</span>
          </span>
        </div>

        {/* Badge */}
        <span className={styles.eyebrow}>Your day. Your rules.</span>

        {/* Heading */}
        <div className={styles.heading}>
          <h1 className={styles.title}>
            Build habits that<br />build <span>your life.</span>
          </h1>
          <p className={styles.subtitle}>
            A calm space to plan your day, track your goals,<br />and show up — every single day.
          </p>
        </div>

        {/* Feature teasers */}
        <div className={styles.features}>
          <div className={styles.featureRow}>
            <span className={styles.featureIcon}>📅</span>
            <span>31-day habit grid with streak tracking</span>
          </div>
          <div className={styles.featureRow}>
            <span className={styles.featureIcon}>🏆</span>
            <span>XP & level system to keep you motivated</span>
          </div>
          <div className={styles.featureRow}>
            <span className={styles.featureIcon}>🤖</span>
            <span>AI-powered daily insights</span>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Primary CTA */}
        <Link href="/register" className={styles.ctaPrimary}>
          <span>Get Started — It&#39;s free</span>
          <span className={styles.ctaArrow}>→</span>
        </Link>

        {/* Already have account */}
        <p className={styles.switchText}>
          Already have an account?{" "}
          <Link href="/login" className={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
