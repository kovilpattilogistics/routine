"use client";

import React, { useMemo } from "react";
import styles from "./MonkHeader.module.css";
import Link from "next/link";
import { UserProfile } from "@/services/DatabaseService";
import { GamificationService } from "@/services/GamificationService";

// Generate a deterministic avatar color + initials — no external fetch needed
function getAvatarProps(name: string, uid: string) {
  const COLORS = [
    "#7C3AED", "#DB2777", "#EA580C", "#16A34A",
    "#0284C7", "#B45309", "#475569", "#DC2626",
  ];
  // Hash uid to pick a stable color
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  const color = COLORS[Math.abs(hash) % COLORS.length];
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return { color, initials };
}

export function MonkHeader({
  profile,
  uid,
  onPastDataClick,
}: {
  profile: UserProfile | null;
  uid: string;
  onPastDataClick?: () => void;
}) {
  const totalXP = profile?.totalXP || 0;

  // Memoize so XP computations don't run on every render
  const currentLevel = useMemo(
    () => GamificationService.getCurrentLevel(totalXP),
    [totalXP]
  );
  const progress = useMemo(
    () => GamificationService.getLevelProgress(totalXP),
    [totalXP]
  );

  const { color, initials } = useMemo(
    () => getAvatarProps(profile?.name || "", uid),
    [profile?.name, uid]
  );

  return (
    <div className={styles.headerWrap}>
      <div className={styles.topRow}>
        {/* Avatar + name — no external fetch */}
        <Link href="/profile" className={styles.userInfo}>
          <div className={styles.avatar} style={{ background: color }}>
            {initials}
          </div>
          <div className={styles.nameBlock}>
            <span className={styles.name}>{profile?.name || "Loading..."}</span>
            <span className={styles.levelTag}>⚡ {currentLevel.title}</span>
          </div>
        </Link>

        <div className={styles.headerRight}>
          <button
            className={styles.pastDataBtn}
            onClick={onPastDataClick}
            aria-label="View past data"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Past data</span>
          </button>
          <div className={styles.xpNumber}>{totalXP} Focus</div>
        </div>
      </div>

      {/* XP progress bar */}
      <div className={styles.xpBarWrapper}>
        <div
          className={styles.xpBarFill}
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <div className={styles.xpNextLabel}>
        {progress.currentXPInLevel} /{" "}
        {progress.currentXPInLevel + progress.xpRequiredForNext} Focus to reach{" "}
        {progress.nextLevelTitle}
      </div>
    </div>
  );
}
