"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group, Habit } from "@/services/DatabaseService";
import { useHabits } from "@/context/HabitContext";
import styles from "./GroupCarousel.module.css";

interface GroupCarouselProps {
  groups: Group[];
  activeGroupId: string | null;
  onSelect: (id: string) => void;
  onNewGroup: () => void;
  habits: Habit[]; // All habits to calculate group progress
}

export function GroupCarousel({ groups, activeGroupId, onSelect, onNewGroup, habits }: GroupCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const getGroupProgress = (groupId: string) => {
    const groupHabits = habits.filter(h => h.groupId === groupId);
    if (groupHabits.length === 0) return 0;
    
    const todayStr = new Date().toISOString().split("T")[0];
    const completedCount = groupHabits.filter(h => !!h.completedDays?.[todayStr]).length;
    return (completedCount / groupHabits.length) * 100;
  };

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = 240;
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className={styles.carouselWrapper}>
      {/* Desktop Arrows */}
      <button className={`${styles.navBtn} ${styles.prev}`} onClick={() => scroll("left")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      <div className={styles.carouselContainer} ref={containerRef}>
        <div className={styles.cardList}>
          {groups.map((group) => {
            const isActive = group.id === activeGroupId;
            const progress = getGroupProgress(group.id);
            const isAllDone = progress === 100 && habits.filter(h => h.groupId === group.id).length > 0;
            
            return (
              <motion.div
                key={group.id}
                className={`${styles.groupCard} ${isActive ? styles.active : ""} ${styles[`theme_${group.themeColor}`]}`}
                onClick={() => onSelect(group.id)}
                whileTap={{ scale: 0.95 }}
                animate={{ 
                  scale: isActive ? 1.05 : 1,
                  opacity: isActive ? 1 : 0.7 
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {/* Progress Arc */}
                <svg className={styles.progressCircle} viewBox="0 0 100 60">
                  <path
                    d="M 10,50 A 40,40 0 1,1 90,50"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <motion.path
                    d="M 10,50 A 40,40 0 1,1 90,50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: progress / 100 }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>

                <div className={styles.emoji}>{group.emoji}</div>
                <div className={styles.name}>{group.name}</div>
                
                <div className={styles.badge}>
                  {habits.filter(h => h.groupId === group.id).length} habits
                </div>

                {/* Shimmer Overlay for Completion */}
                <AnimatePresence>
                  {isAllDone && (
                    <motion.div 
                      className={styles.doneOverlay}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div 
                        className={styles.shimmer}
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      />
                      <div className={styles.check}>✅</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* New Group Card */}
          <div className={styles.newGroupCard} onClick={onNewGroup}>
            <div className={styles.newIcon}>＋</div>
            <div className={styles.newName}>New Group</div>
          </div>
        </div>
      </div>

      <button className={`${styles.navBtn} ${styles.next}`} onClick={() => scroll("right")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  );
}
