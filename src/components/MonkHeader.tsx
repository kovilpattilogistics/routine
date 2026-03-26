"use client";

import React from "react";
import styles from "./MonkHeader.module.css";
import Link from "next/link";
import { UserProfile } from "@/services/DatabaseService";
import { GamificationService } from "@/services/GamificationService";

export function MonkHeader({ profile, uid, onPastDataClick }: { 
  profile: UserProfile | null; 
  uid: string;
  onPastDataClick?: () => void;
}) {
  const currentLevel = GamificationService.getCurrentLevel(profile?.totalXP || 0);
  const progress = GamificationService.getLevelProgress(profile?.totalXP || 0);

  return (
    <div className={styles.headerWrap}>
      <div className={styles.topRow}>
        <div className={styles.headerLeft}>
          <Link href="/profile" className={styles.userInfo} style={{ textDecoration: 'none' }}>
            <img 
              src={`https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${uid}`} 
              alt="Avatar" 
              className={styles.avatar} 
            />
            <div className={styles.nameBlock}>
              <span className={styles.name}>{profile?.name || "Initializing..."}</span>
              <span className={styles.levelTag}>⚡ {currentLevel.title}</span>
            </div>
          </Link>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.pastDataBtn} onClick={onPastDataClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Past data</span>
          </button>
          <div className={styles.xpNumber}>
            {profile?.totalXP || 0} XP
          </div>
        </div>
      </div>

      <div>
        <div className={styles.xpBarWrapper}>
          <div 
            className={styles.xpBarFill} 
            style={{ width: `${progress.percentage}%` }} 
          />
        </div>
        <div className={styles.xpNextLabel}>
          {progress.currentXPInLevel} / {progress.currentXPInLevel + progress.xpRequiredForNext} to {progress.nextLevelTitle}
        </div>
      </div>
    </div>
  );
}
