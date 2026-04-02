"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./MonkHabitSheet.module.css";
import { Habit } from "@/services/DatabaseService";

interface MonkHabitSheetProps {
  habit: Habit;
  onClose: () => void;
}

export function MonkHabitSheet({ habit, onClose }: MonkHabitSheetProps) {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Generate completion rate over last 30 days
  const calculateRate = () => {
    if (!habit.completedDays) return 0;
    let daysDone = 0;
    const today = new Date();
    for(let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const str = d.toISOString().split("T")[0];
        if (habit.completedDays[str]) daysDone++;
    }
    return Math.round((daysDone / 30) * 100);
  };

  const handleFetchAiTip = async () => {
    setLoadingAi(true);
    try {
      const resp = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Match the actual /api/ai schema
          profile: { name: "User", focusArea: "health" }, // minimal placeholder
          habits: [habit],
          trigger: {
            type: "TASK_TOGGLE",
            actionPayload: `Drilldown on habit: ${habit.name}. Total completions: ${habit.totalCompletions}. Streak: ${habit.currentStreak}. Provide a specific, actionable 2-sentence tip.`,
          },
        }),
      });
      const data = await resp.json();
      setAiInsight(
        data?.data?.message ||
        "Keep pushing forward. Consistency is the true key to this discipline."
      );
    } catch {
      setAiInsight("Keep showing up — every completion builds momentum.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <motion.div 
        className={styles.sheet}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.emoji}>{habit.emoji || "🔥"}</span>
            <span className={styles.title}>{habit.name}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{habit.currentStreak || 0}</span>
            <span className={styles.statLabel}>Current Streak</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{habit.bestStreak || habit.currentStreak || 0}</span>
            <span className={styles.statLabel}>Best Streak</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{habit.totalCompletions || 0}</span>
            <span className={styles.statLabel}>Total Times</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{calculateRate()}%</span>
            <span className={styles.statLabel}>30-Day Rate</span>
          </div>
        </div>

        <div className={styles.aiSection}>
          {!aiInsight && !loadingAi && (
            <button className={styles.aiBtn} onClick={handleFetchAiTip}>
              ✨ Tap for personal guidance
            </button>
          )}
          {loadingAi && <div className={styles.shimmer}>Reflecting on your routine...</div>}
          {aiInsight && !loadingAi && (
            <div className={styles.aiText}>
              <strong>Guidance: </strong>
              <p>{aiInsight}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
