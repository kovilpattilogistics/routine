"use client";

import React, { useEffect, useState } from "react";
import styles from "./AIInsightCard.module.css";
import { UserProfile, Habit } from "@/services/DatabaseService";

interface AIInsightCardProps {
  profile: UserProfile;
  habits: Habit[];
  latestAction?: string; // string representing the habit name just toggled
}

interface AIResponse {
  type: "praise" | "streak_recovery" | "nudge" | "insight";
  message: string;
  focus: string;
}

export function AIInsightCard({ profile, habits, latestAction }: AIInsightCardProps) {
  const [insightData, setInsightData] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // Persist closed state within the session so reopening planner doesn't re-show
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("ai_insight_closed") !== "1";
  });

  const [lastProcessedAction, setLastProcessedAction] = useState<string | undefined>(undefined);

  useEffect(() => {
    const isAppLoad = !lastProcessedAction && !latestAction;
    const isNewAction = latestAction && latestAction !== lastProcessedAction;

    if (!isAppLoad && !isNewAction) return;
    if (!isVisible) return;

    // Guard: don't fire if profile is essentially empty (fresh registration before onboarding)
    if (!profile.role && !profile.struggle && !profile.age && !profile.focusArea) return;

    const fetchInsight = async () => {
      setLoading(true);
      setError(false);

      const trigger = isAppLoad
        ? { type: "APP_LOAD" }
        : { type: "TASK_TOGGLE", actionPayload: latestAction };

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, habits, trigger }),
        });

        if (!res.ok) throw new Error("API failed");

        const payload = await res.json();
        if (!payload?.data) throw new Error("Empty AI response");
        setInsightData(payload.data);
      } catch (err) {
        console.error("Failed to load AI insight:", err);
        setInsightData({
          type: "insight",
          message: "Keep showing up — consistency compounds over time.",
          focus: "Consistency",
        });
        setError(true);
      } finally {
        setLoading(false);
        if (latestAction) setLastProcessedAction(latestAction);
      }
    };

    const timeoutId = setTimeout(fetchInsight, 600);
    return () => clearTimeout(timeoutId);
  }, [profile, habits, latestAction, lastProcessedAction, isVisible]);

  const renderIcon = (type?: string) => {
    switch(type) {
      case 'praise': return <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />; // Star
      case 'streak_recovery': return <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />; // Shield/Warning
      case 'nudge': return <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />; // Check circle
      default: return <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />; // Spark
    }
  };

  // Removed the 'if (error) return null' block to ensure the fallback always renders!

  const themeClass = insightData?.type ? (styles as any)[`theme_${insightData.type}`] : styles.theme_insight;

  if (!isVisible) return null;

  return (
    <div className={`${styles.card} ${themeClass}`}>
      <button 
        className={styles.closeBtn}
        onClick={() => {
          setIsVisible(false);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("ai_insight_closed", "1");
          }
        }}
        aria-label="Close insight"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {renderIcon(insightData?.type)}
          </svg>
        </div>
        <span className={styles.title}>
          {loading ? "AI is thinking..." : "AI Coach"}
        </span>
        {insightData?.focus && !loading && (
          <span className={styles.focusTag}>{insightData.focus}</span>
        )}
      </div>

      {loading ? (
        <div className={styles.shimmerLines}>
          <div className={styles.shimmerLine} style={{ width: "90%" }} />
          <div className={styles.shimmerLine} style={{ width: "70%" }} />
        </div>
      ) : (
        <p className={styles.insightText}>{insightData?.message}</p>
      )}
    </div>
  );
}
