"use client";

import React, { useState, useEffect } from "react";
import styles from "./MonkGrid.module.css";
import { Habit } from "@/services/DatabaseService";
import { MonkCell } from "./MonkCell";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface MonkGridProps {
  habits: Habit[];
  onToggleEntry: (habitId: string, dateStr: string, isCompleted: boolean, isExceeded: boolean) => void;
  onHabitClick: (habit: Habit) => void;
  days: string[]; // array of YYYY-MM-DD (Mon-Sun)
  todayStr: string;
}

const PASTEL_THEMES = [
  styles.themeOrange,
  styles.themePurple,
  styles.themeBlue,
  styles.themeGreen
];

export function MonkGrid({ habits, onToggleEntry, onHabitClick, days, todayStr }: MonkGridProps) {
  const [shakingRowId, setShakingRowId] = useState<string | null>(null);
  const [glowingDay, setGlowingDay] = useState<string | null>(null);

  useEffect(() => {
    if (glowingDay) {
      confetti({
        particleCount: 100,
        spread: 120,
        origin: { y: -0.1 },
        colors: ["#22c55e", "#fde047", "#ffffff"]
      });
      const timer = setTimeout(() => setGlowingDay(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [glowingDay]);

  const handleToggle = (habitId: string, dateStr: string, newStatus: "DONE" | "EXCEEDED" | "EMPTY") => {
    const isCompleted = newStatus !== "EMPTY";
    const isExceeded = newStatus === "EXCEEDED";

    // Detect Streak Break
    const habit = habits.find((h) => h.id === habitId);
    if (!isCompleted && habit && habit.currentStreak && habit.currentStreak >= 3) {
      setShakingRowId(habitId);
      setTimeout(() => setShakingRowId(null), 400); // empathy shake duration
    }

    onToggleEntry(habitId, dateStr, isCompleted, isExceeded);

    // Detect Perfect Day
    if (isCompleted) {
      const otherHabits = habits.filter(h => h.id !== habitId);
      const allOthersDone = otherHabits.every(h => h.completedDays?.[dateStr]);
      if (allOthersDone && otherHabits.length > 0) {
        setGlowingDay(dateStr);
      }
    }
  };

  return (
    <div className={styles.cardList}>
      {habits.map((habit, idx) => {
        const isShaking = shakingRowId === habit.id;
        const themeClass = PASTEL_THEMES[idx % PASTEL_THEMES.length];
        
        // Status of today
        const stateToday = habit.completedDays?.[todayStr];
        const isTodayDone = !!stateToday;
        const isTodayExceeded = stateToday === 2;

        return (
          <div key={habit.id} className={cn(styles.habitCard, themeClass, isShaking && styles.shakeCard)}>
            
            {/* Header: Icon, Name */}
            <div className={styles.cardHeader}>
              <div className={styles.cardInfo} onClick={() => onHabitClick(habit)}>
                <span className={styles.emoji}>{habit.emoji || "🚶"}</span>
                <span className={styles.habitName}>{habit.name}</span>
              </div>
            </div>

            {/* Streak Subheader */}
            <p className={styles.streakText}>Streak: {habit.currentStreak || 0} Day{habit.currentStreak !== 1 ? 's' : ''}</p>

            {/* Weekly 7-Day View */}
            <div className={styles.weekGrid}>
              {days.map((dateStr) => {
                const dateObj = new Date(dateStr);
                const dayName = dateObj.toLocaleDateString("en-US", { weekday: 'short' }); // Mon, Tue
                
                const stateVal = habit.completedDays?.[dateStr];
                let status: "EMPTY" | "DONE" | "EXCEEDED" | "MISSED" = "EMPTY";
                  
                if (stateVal === 1 || !!stateVal) status = "DONE";
                else if (stateVal === 2) status = "EXCEEDED";
                else if (dateStr < todayStr) status = "MISSED";

                const isToday = dateStr === todayStr;
                const isGlowingCell = glowingDay === dateStr;

                return (
                  <div key={dateStr} className={cn(styles.dayCol, isToday && styles.todayPill, isGlowingCell && styles.goldenGlow)}>
                    <span className={cn(styles.dayLabel, isToday && styles.dayLabelActive)}>
                      {dayName}
                    </span>
                    <div className={styles.cellWrapper}>
                      <MonkCell
                        id={`${habit.id}-${dateStr}`}
                        status={status}
                        disabled={!isToday}
                        onToggle={(newStat) => handleToggle(habit.id, dateStr, newStat)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
