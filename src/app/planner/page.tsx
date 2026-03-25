"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { DatabaseService, Habit, UserProfile } from "@/services/DatabaseService";
import { GamificationService, XP_REWARDS } from "@/services/GamificationService";
import { MonkGrid } from "@/components/MonkGrid";
import { MonkHeader } from "@/components/MonkHeader";
import { AIInsightCard } from "@/components/AIInsightCard";
import { MonkEntryModal } from "@/components/MonkEntryModal";
import { MonkHabitSheet } from "@/components/MonkHabitSheet";
import styles from "./planner.module.css";
import { AnimatePresence } from "framer-motion";

export default function PlannerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [latestAction, setLatestAction] = useState<string | undefined>(undefined);
  
  // Right-click Entry Modal State
  const [modalData, setModalData] = useState<{ habitId: string; dateStr: string; habitName: string; initialNote?: string; initialMood?: string } | null>(null);

  // Drill-down Sheet State
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Generate 7-day rolling window with Today in the exact center (T-3 to T+3)
  const getCenteredWeek = () => {
    const todayObj = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(todayObj);
      d.setDate(todayObj.getDate() - 3 + i);
      return d.toISOString().split("T")[0];
    });
  };
  const currentWeekDays = getCenteredWeek();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const p = await DatabaseService.getInstance().getUserProfile(user.uid);
      setProfile(p);
      const h = await DatabaseService.getInstance().getHabits(user.uid);
      setHabits(h || []);
      setDataLoading(false);
    };
    loadData();
  }, [user]);

  if (loading || dataLoading || !user) {
    return (
      <div className={styles.container}>
        <div style={{ margin: "auto", padding: "40px", color: "var(--text-muted)" }}>
          Entering MonkGrid...
        </div>
      </div>
    );
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const id = Date.now().toString();
    const task: Habit = { 
      id, 
      name: newTask.trim(), 
      category: profile?.focusArea, 
      completedDays: {},
      totalCompletions: 0,
      currentStreak: 0
    };
    
    setHabits((p) => [...p, task]);
    setNewTask("");
    await DatabaseService.getInstance().addHabit(user.uid, task);
  };

  const handleToggleEntry = async (habitId: string, dateStr: string, isCompleted: boolean, isExceeded: boolean) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const oldState = habit.completedDays?.[dateStr];
    const newStateIntensity = !isCompleted ? null : (isExceeded ? 2 : 1);

    // Optimistic UI Update
    setHabits((prev) =>
      prev.map((h) => h.id === habitId ? { 
        ...h, 
        completedDays: { ...h.completedDays, [dateStr]: newStateIntensity as number | boolean } 
      } : h)
    );

    // Trigger AI response if it's today
    if (dateStr === todayStr) {
      if (isExceeded) setLatestAction(`Exceeded: ${habit.name}`);
      else if (isCompleted) setLatestAction(`Completed: ${habit.name}`);
      else setLatestAction(`Unmarked: ${habit.name}`);
    }

    // Database Write
    await DatabaseService.getInstance().toggleHabitEntry(user.uid, habitId, dateStr, isCompleted, isExceeded ? 2 : 1);

    // XP calculation
    let xpAward = 0;
    if (isCompleted && !oldState) xpAward = XP_REWARDS.HABIT_COMPLETION; // Went from empty to done
    if (isExceeded && oldState === 1) xpAward = XP_REWARDS.EXCEEDED_GOAL; // Upgraded from done to exceeded
    if (!isCompleted && oldState) xpAward = -(oldState === 2 ? XP_REWARDS.HABIT_COMPLETION + XP_REWARDS.EXCEEDED_GOAL : XP_REWARDS.HABIT_COMPLETION); // Reverted

    if (xpAward !== 0) {
      const newTotalXP = (profile?.totalXP || 0) + xpAward;
      setProfile(prev => prev ? { ...prev, totalXP: newTotalXP } : null);
      await DatabaseService.getInstance().addXP(user.uid, xpAward);
    }
  };

  const handleSaveEntryDetails = async (note: string, mood: string) => {
    if (!modalData) return;
    await DatabaseService.getInstance().updateHabitEntryDetails(user.uid, modalData.habitId, modalData.dateStr, { note, mood });
    setModalData(null);
  };

  return (
    <div className={styles.container}>
      <MonkHeader profile={profile!} uid={user.uid} />

      <main className={styles.main}>
        {profile && <AIInsightCard profile={profile} habits={habits} latestAction={latestAction} />}

        <div className={styles.section}>
          <p className={styles.sectionLabel}>The Journey</p>

          {habits.length === 0 && (
            <p className={styles.emptyState}>
              No disciplines forged yet. Add your first routine below.
            </p>
          )}

          <div onContextMenu={(e) => {
            e.preventDefault();
            // We need the habitId and dateStr from the clicked element
            // In a robust app, we'd pass an onRightClick down to MonkCell
            // For now, if the target has an id like "habitId-dateStr":
            const target = e.target as HTMLElement;
            const cell = target.closest('[id]');
            if (cell && cell.id) {
              const [habitId, ...dateParts] = cell.id.split('-');
              const dateStr = dateParts.join('-');
              const habit = habits.find(h => h.id === habitId);
              if (habit && dateStr.length === 10) {
                setModalData({ habitId, dateStr, habitName: habit.name });
              }
            }
          }}>
            <MonkGrid 
              habits={habits} 
              days={currentWeekDays} 
              todayStr={todayStr}
              onToggleEntry={handleToggleEntry} 
              onHabitClick={(h) => setSelectedHabit(h)}
            />
          </div>

          <form onSubmit={handleAddTask} className={styles.addRow}>
            <span className={styles.addIcon}>+</span>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Forge a new discipline... (press Enter)"
              className={styles.input}
            />
          </form>
        </div>
      </main>

      <button className={styles.fab} onClick={async () => await signOut(auth!)} aria-label="Sign Out">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
        </svg>
      </button>

      {modalData && (
        <MonkEntryModal
          habitName={modalData.habitName}
          dateStr={modalData.dateStr}
          onSave={handleSaveEntryDetails}
          onClose={() => setModalData(null)}
        />
      )}

      <AnimatePresence>
        {selectedHabit && (
          <MonkHabitSheet 
            habit={selectedHabit} 
            onClose={() => setSelectedHabit(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
