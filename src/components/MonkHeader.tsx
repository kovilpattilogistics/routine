"use client";

import React from "react";
import styles from "./MonkHeader.module.css";
import Link from "next/link";
import { UserProfile } from "@/services/DatabaseService";
import { GamificationService } from "@/services/GamificationService";

export function MonkHeader({ profile, uid }: { profile: UserProfile; uid: string }) {
  const currentLevel = GamificationService.getCurrentLevel(profile.totalXP || 0);
  const progress = GamificationService.getLevelProgress(profile.totalXP || 0);

  return (
    <div className={styles.headerWrap}>
      <div className={styles.topRow}>
        <Link href="/profile" className={styles.userInfo} style={{ textDecoration: 'none' }}>
          <img 
            src={`https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${uid}`} 
            alt="Avatar" 
            className={styles.avatar} 
          />
          <div className={styles.nameBlock}>
            <span className={styles.name}>{profile.name}</span>
            <span className={styles.levelTag}>⚡ {currentLevel.title}</span>
          </div>
        </Link>
        <div className={styles.xpNumber}>
          {profile.totalXP || 0} XP
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
