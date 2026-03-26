"use client";

import React, { useState, useEffect } from "react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { Habit, HabitEntry } from "@/services/DatabaseService";
import { useHabits } from "@/context/HabitContext";
import styles from "./HabitGridV2.module.css";
import confetti from "canvas-confetti";

interface HabitGridV2Props {
  habits: Habit[];
  onToggle: (habitId: string, dateStr: string, isCompleted: boolean, intensity: number) => void;
  onHabitClick: (habit: Habit) => void;
  onLongPressCell: (habitId: string, dateStr: string) => void;
}

export function HabitGridV2({ habits, onToggle, onHabitClick, onLongPressCell }: HabitGridV2Props) {
  const [items, setItems] = useState(habits);

  // Sync internal state when props change
  React.useEffect(() => {
    setItems(habits);
  }, [habits]);

  const todayStr = new Date().toISOString().split("T")[0];
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  // 9-day rolling window: 3 past, Today (4th), 5 future
  const daysToRender = Array.from({ length: 9 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i); 
    return d.toISOString().split("T")[0];
  });

  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const date = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.toLocaleDateString('en-US', { weekday: 'short' })[0];
    return `${date}/${month} - ${day}`;
  };

  const handleReorder = (newItems: Habit[]) => {
    setItems(newItems);
    // In v2, we'd sync individual sortOrder back to Firestore
  };

  return (
    <div className={styles.gridContainer}>
      <div className={styles.headerRow}>
        <div className={styles.habitMetaSpace} />
        <div className={styles.daysStrip}>
          {daysToRender.map(day => (
            <div key={day} className={`${styles.dayLabel} ${day === todayStr ? styles.today : ""}`}>
              {getDayLabel(day)}
            </div>
          ))}
        </div>
      </div>

      <Reorder.Group axis="y" values={items} onReorder={handleReorder} className={styles.habitList}>
        <AnimatePresence>
          {items.map((habit) => (
            <HabitRow 
              key={habit.id} 
              habit={habit} 
              days={daysToRender} 
              todayStr={todayStr}
              onToggle={onToggle}
              onHabitClick={onHabitClick}
              onLongPressCell={onLongPressCell}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
}

function HabitRow({ habit, days, todayStr, onToggle, onHabitClick, onLongPressCell }: any) {
  const [isBroken, setIsBroken] = useState(false);
  const [showEmpathy, setShowEmpathy] = useState(false);

  // Detect broken streak (>=3 days missed in a row)
  useEffect(() => {
    let missedCount = 0;
    const yesterday = new Date(todayStr);
    yesterday.setDate(yesterday.getDate() - 1);
    
    for (let i = 0; i < 3; i++) {
      const d = new Date(yesterday);
      d.setDate(yesterday.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      if (!habit.completedDays?.[dStr]) missedCount++;
    }

    if (missedCount >= 3 && (habit.currentStreak || 0) > 0) {
      setIsBroken(true);
      setShowEmpathy(true);
    }
  }, [habit.completedDays, todayStr, habit.currentStreak]);

  const handleCellClick = (dateStr: string, currentIntensity: number) => {
    if (dateStr !== todayStr) return; // Strict: Only allow today's edits

    const isCompleted = currentIntensity === 0;
    const newIntensity = isCompleted ? 1 : 0;
    
    if (isCompleted) {
      confetti({
        particleCount: 15,
        spread: 40,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#16a34a']
      });
      setIsBroken(false);
      setShowEmpathy(false);
    }

    onToggle(habit.id, dateStr, isCompleted, newIntensity);
  };

  const handleCellDoubleClick = (dateStr: string) => {
    if (dateStr !== todayStr) return; // Strict: Only today
    onToggle(habit.id, dateStr, true, 2); // Exceeded
    confetti({
      particleCount: 20,
      spread: 60,
      colors: ['#FFC107', '#F59E0B']
    });
  };

  return (
    <Reorder.Item 
      value={habit} 
      className={`${styles.habitRow} ${isBroken ? styles.shake : ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        x: isBroken ? [0, -4, 4, -4, 4, 0] : 0
      }}
      transition={{ 
        x: isBroken ? { duration: 0.4, repeat: 0 } : { duration: 0.2 }
      }}
      exit={{ opacity: 0, y: -10 }}
      whileDrag={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
    >
      <div className={styles.habitMeta} onClick={() => onHabitClick(habit)}>
        <div className={styles.habitTitleRow}>
          <span className={styles.emoji}>{habit.emoji}</span>
          <span className={styles.name}>{habit.name}</span>
        </div>
        <div className={styles.xpBar}>
          <div className={styles.xpFill} style={{ width: `${Math.min(100, (habit.totalCompletions || 0) * 10)}%` }} />
        </div>
        <AnimatePresence>
          {showEmpathy && (
            <motion.p 
              className={styles.empathyMsg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              It's okay — every day is a fresh start 🌱
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.cellsRow}>
        {days.map((day: string) => {
          const intensity = habit.completedDays?.[day] || 0;
          const isFuture = day > todayStr;
          const isDone = intensity === 1;
          const isExceeded = intensity === 2;
          const isMissed = !intensity && day < todayStr;

          return (
            <div 
              key={day} 
              className={`
                ${styles.cell} 
                ${isFuture ? styles.future : ""} 
                ${isDone ? styles.done : ""} 
                ${isExceeded ? styles.exceeded : ""}
                ${isMissed ? styles.missed : ""}
              `}
              onClick={() => handleCellClick(day, intensity)}
              onDoubleClick={() => handleCellDoubleClick(day)}
              onContextMenu={(e) => {
                e.preventDefault();
                onLongPressCell(habit.id, day);
              }}
            >
              {isDone && <div className={styles.ripple} />}
            </div>
          );
        })}
      </div>

      <div className={styles.streakArea}>
        🔥 {habit.currentStreak || 0}
        {isBroken && <span className={styles.brokenEmoji}>😔</span>}
      </div>
    </Reorder.Item>
  );
}
