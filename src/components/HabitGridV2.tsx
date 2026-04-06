"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { Habit } from "@/services/DatabaseService";
import { useHabits } from "@/context/HabitContext";
import styles from "./HabitGridV2.module.css";
import confetti from "canvas-confetti";

// Track arm-and-fire delete state globally per component instance
type ArmedState = { habitId: string; timer: ReturnType<typeof setTimeout> } | null;

interface HabitGridV2Props {
  habits: Habit[];
  onToggle: (
    habitId: string,
    dateStr: string,
    isCompleted: boolean,
    intensity: number
  ) => void;
  onHabitClick: (habit: Habit) => void;
  onLongPressCell: (habitId: string, dateStr: string) => void;
  baseDate?: Date;
  themeColor?: string;
}

// Pre-compute 31 days outside the component — recalculated only when baseDate changes
function getDaysToRender(baseDate: Date): string[] {
  return Array.from({ length: 31 }, (_, i) => {
    const d = new Date(baseDate);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 15 + i);
    return d.toISOString().split("T")[0];
  });
}

function getDayLabel(dateStr: string, compact: boolean): string {
  const d = new Date(dateStr + "T00:00:00"); // force local parse
  const date = d.getDate().toString().padStart(2, "0");

  if (compact) {
    const day = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()];
    return `${date}\n${day}`;
  }
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${date} ${month} ${day}`;
}

// Pre-compute streak for a given date in O(n) — runs once per habit per render
function computeStreakAtDate(
  completedDays: Record<string, number | null | undefined>,
  dateStr: string
): number {
  let streak = 0;
  const current = new Date(dateStr + "T00:00:00");
  for (let i = 0; i < 365; i++) {
    const s = current.toISOString().split("T")[0];
    const intensity = completedDays?.[s];
    if (intensity === 1 || intensity === 2) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function HabitGridV2({
  habits,
  onToggle,
  onHabitClick,
  onLongPressCell,
  baseDate = new Date(),
  themeColor,
}: HabitGridV2Props) {
  const todayRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const days = React.useMemo(() => getDaysToRender(baseDate), [baseDate]);

  // Responsive detection via ResizeObserver — no SSR issues
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setIsCompact(entry.contentRect.width < 600);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scroll today into view on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      todayRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.gridContainer} ref={containerRef}>
      {/* Sticky header row with day labels */}
      <div className={styles.headerRow}>
        <div className={styles.headerSpacer} />
        <div className={styles.daysStrip}>
          {days.map((day) => (
            <div
              key={day}
              ref={day === todayStr ? todayRef : undefined}
              className={`${styles.dayLabel} ${day === todayStr ? styles.today : ""}`}
            >
              {getDayLabel(day, isCompact)
                .split("\n")
                .map((line, i) => (
                  <span key={i} className={i === 1 ? styles.dayName : ""}>
                    {line}
                  </span>
                ))}
            </div>
          ))}
        </div>
        <div className={styles.endSpacer} />
      </div>

      {/* Habit rows */}
      <div className={styles.habitList}>
        {habits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            days={days}
            todayStr={todayStr}
            onToggle={onToggle}
            onHabitClick={onHabitClick}
            onLongPressCell={onLongPressCell}
            themeColor={themeColor || "default"}
          />
        ))}
      </div>
    </div>
  );
}

// ── Memoized HabitRow ──────────────────────────────────────

interface HabitRowProps {
  habit: Habit;
  days: string[];
  todayStr: string;
  onToggle: (
    habitId: string,
    dateStr: string,
    isCompleted: boolean,
    intensity: number
  ) => void;
  onHabitClick: (habit: Habit) => void;
  onLongPressCell: (habitId: string, dateStr: string) => void;
  themeColor: string;
}

const HabitRow = memo(function HabitRow({
  habit,
  days,
  todayStr,
  onToggle,
  onHabitClick,
  onLongPressCell,
  themeColor,
}: HabitRowProps) {
  const { deleteHabit } = useHabits();
  // arm-and-fire: null = disarmed | true = armed
  const [isArmed, setIsArmed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-compute broken streak state — only recalc when completedDays changes
  const isBroken = React.useMemo(() => {
    if (!habit.currentStreak || habit.currentStreak === 0) return false;
    let missedCount = 0;
    
    // Find the date the habit was created to avoid penalizing days before it existed
    let createdDateStr = todayStr;
    if (habit.createdAt) {
      try {
        const createdDate = typeof (habit.createdAt as any).toDate === "function" 
          ? (habit.createdAt as any).toDate() 
          : new Date(habit.createdAt as any);
        createdDateStr = createdDate.toISOString().split("T")[0];
      } catch (e) {
        // Fallback
      }
    }

    for (let i = 1; i <= 3; i++) {
      const d = new Date(todayStr + "T00:00:00");
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      if (dStr < createdDateStr) continue; // Don't count days before creation as missed
      if (!habit.completedDays?.[dStr]) missedCount++;
    }
    return missedCount >= 3;
  }, [habit.completedDays, habit.currentStreak, todayStr, habit.createdAt]);

  const handleCellClick = useCallback(
    (dateStr: string, currentIntensity: number) => {
      if (dateStr !== todayStr) return; // Only today is editable
      const isCompleted = currentIntensity === 0;
      if (isCompleted) {
        confetti({
          particleCount: 20,
          spread: 50,
          origin: { y: 0.65 },
          colors: ["#22c55e", "#16a34a", "#bbf7d0"],
          zIndex: 9999,
        });
      }
      onToggle(habit.id, dateStr, isCompleted, isCompleted ? 1 : 0);
    },
    [habit.id, todayStr, onToggle]
  );

  const handleCellDoubleClick = useCallback(
    (dateStr: string) => {
      if (dateStr !== todayStr) return;
      confetti({
        particleCount: 35,
        spread: 70,
        colors: ["#FFC107", "#F59E0B", "#FEF08A"],
        zIndex: 9999,
      });
      onToggle(habit.id, dateStr, true, 2); // Exceeded
    },
    [habit.id, todayStr, onToggle]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isArmed) {
        // Second tap — fire
        if (disarmTimer.current) clearTimeout(disarmTimer.current);
        setIsArmed(false);
        deleteHabit(habit.id);
      } else {
        // First tap — arm
        if (disarmTimer.current) clearTimeout(disarmTimer.current);
        setIsArmed(true);
        disarmTimer.current = setTimeout(() => setIsArmed(false), 2500);
      }
    },
    [isArmed, deleteHabit, habit.id]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (disarmTimer.current) clearTimeout(disarmTimer.current); };
  }, []);

  // Drag handle — touchstart on the grip icon
  const dragHandleProps = {
    onMouseDown: () => setIsDragging(true),
    onMouseUp: () => setIsDragging(false),
    onTouchStart: () => setIsDragging(true),
    onTouchEnd: () => setIsDragging(false),
  };

  // Pre-parse the creation date for UI evaluation
  let createdDateStr = "1970-01-01";
  if (habit.createdAt) {
    try {
      const createdDate = typeof (habit.createdAt as any).toDate === "function" 
        ? (habit.createdAt as any).toDate() 
        : new Date(habit.createdAt as any);
      createdDateStr = createdDate.toISOString().split("T")[0];
    } catch (e) {
      // fallback
    }
  }

  return (
    <div
      ref={rowRef}
      className={`
        ${styles.habitRow}
        ${themeColor ? styles[`theme_${themeColor}`] || "" : ""}
        ${isBroken ? styles.broken : ""}
        ${isDragging ? styles.dragging : ""}
      `}
    >
      {/* Left: habit meta */}
      <div
        className={styles.habitMeta}
        onClick={() => !isArmed && onHabitClick(habit)}
      >
        <div className={styles.habitTitleRow}>
          <span className={styles.dragHandle} title="Drag to reorder" {...dragHandleProps}>
            ⠿
          </span>
          <span className={styles.emoji}>{habit.emoji || "✅"}</span>
          <span className={styles.name}>{habit.name}</span>

          {/* Delete — arm & fire */}
          <button
            className={`${styles.deleteHabitBtn} ${isArmed ? styles.deleteArmed : ""}`}
            onClick={handleDeleteClick}
            title={isArmed ? "Tap again to delete" : "Delete habit"}
            aria-label={isArmed ? "Confirm delete habit" : "Delete habit"}
          >
            {isArmed ? (
              <span className={styles.armedRing}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </span>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            )}
          </button>
        </div>

        {/* XP progress bar */}
        <div className={styles.xpBar}>
          <div
            className={styles.xpFill}
            style={{ width: `${Math.min(100, (habit.totalCompletions || 0) * 5)}%` }}
          />
        </div>
      </div>

      {/* Right: scrollable cell strip */}
      <div className={styles.cellsRow}>
        {days.map((day) => {
          const intensity = habit.completedDays?.[day] ?? 0;
          const isFuture = day > todayStr;
          const isToday = day === todayStr;
          const isDone = intensity === 1;
          const isExceeded = intensity === 2;
          // Only mark missed if it's before today, BUT also ON or AFTER creation day
          const isMissed = !intensity && day < todayStr && day >= createdDateStr;

          // Compute continuous streak for ALL completed cells (runs fast enough in UI)
          const cellStreak =
            (isDone || isExceeded)
              ? computeStreakAtDate(habit.completedDays || {}, day)
              : 0;

          return (
            <div
              key={day}
              className={[
                styles.cell,
                isFuture ? styles.future : "",
                isToday ? styles.today : "",
                isDone ? styles.done : "",
                isExceeded ? styles.exceeded : "",
                isMissed ? styles.missed : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleCellClick(day, intensity)}
              onDoubleClick={() => handleCellDoubleClick(day)}
              onContextMenu={(e) => {
                e.preventDefault();
                onLongPressCell(habit.id, day);
              }}
            >
              {cellStreak > 1 && (
                <span className={styles.cellStreak}>{cellStreak}</span>
              )}
              {isMissed && <span className={styles.missedCross}>✕</span>}
            </div>
          );
        })}
        <div className={styles.endSpacer} />
      </div>
    </div>
  );
},
// Only re-render if the habit's completedDays, name, or emoji changed
(prev, next) =>
  prev.habit.id === next.habit.id &&
  prev.habit.completedDays === next.habit.completedDays &&
  prev.habit.name === next.habit.name &&
  prev.habit.emoji === next.habit.emoji &&
  prev.habit.totalCompletions === next.habit.totalCompletions &&
  prev.todayStr === next.todayStr &&
  prev.days === next.days &&
  prev.themeColor === next.themeColor
);
