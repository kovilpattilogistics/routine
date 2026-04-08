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
    // Fallback: If middleware fails or user magically logs in on this page without navigation
    if (!loading && user) {
      router.replace("/planner");
    }
  }, [user, loading, router]);

  return (
    <main className={styles.hero}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>Your day. Your rules.</p>

        <h1 className={styles.headline}>
          Build the habits that<br />
          build <span>your life.</span>
        </h1>

        <p className={styles.sub}>
          A calm space to plan your day, track your goals, and show up — every single day.
        </p>

        <Link href="/register" className={styles.cta}>
          <span className={styles.ctaText}>Get Started — It's free</span>
          <span className={styles.ctaArrow}>→</span>
        </Link>

        <p className={styles.signin}>
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
