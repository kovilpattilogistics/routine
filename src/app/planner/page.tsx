"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useHabits } from "@/context/HabitContext";
import { DatabaseService, UserProfile, Group, Habit } from "@/services/DatabaseService";
import { GamificationService, XP_REWARDS } from "@/services/GamificationService";

// v2 Components
import { GroupListAccordion } from "@/components/GroupListAccordion";
import { HabitGridV2 } from "@/components/HabitGridV2";
import { MonkHeader } from "@/components/MonkHeader";
import { NewGroupModal } from "@/components/NewGroupModal";
import { AddHabitInline } from "@/components/AddHabitInline";
import { CellDetailsModal } from "@/components/CellDetailsModal";
import { AIInsightCard } from "@/components/AIInsightCard";
import { MonkHabitSheet } from "@/components/MonkHabitSheet";

import styles from "./planner.module.css";
import { AnimatePresence, motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function PlannerPage() {
  const { user, loading: authLoading } = useAuth();
  const { 
    groups, activeGroupId, setActiveGroupId, habits, loading: habitsLoading,
    toggleHabit, addGroup, refreshGroups, refreshHabits
  } = useHabits();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [cellModalData, setCellModalData] = useState<{ habitId: string; dateStr: string; habitName: string } | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [latestAction, setLatestAction] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    DatabaseService.getInstance().getUserProfile(user.uid).then(setProfile);
  }, [user]);

  if (authLoading || habitsLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className={styles.loadingText}
        >
          Initializing MonkGrid...
        </motion.div>
      </div>
    );
  }

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const todayStr = new Date().toISOString().split("T")[0];

  const handleToggle = async (habitId: string, dateStr: string, isCompleted: boolean, intensity: number) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // Trigger AI response for today
    if (dateStr === todayStr) {
      setLatestAction(isCompleted ? `Completed: ${habit.name}` : `Unmarked: ${habit.name}`);
    }

    // Context handles optimistic UI and DB write
    await toggleHabit(habitId, dateStr, isCompleted, intensity);

    // XP Logic (Bonus checks handled here in Page level for simplicity in v2)
    let xpAward = isCompleted ? XP_REWARDS.HABIT_COMPLETION : -XP_REWARDS.HABIT_COMPLETION;
    if (intensity === 2) xpAward += XP_REWARDS.EXCEEDED_GOAL;

    // TODO: Detect Group Completion for +25 XP
    // TODO: Detect Full Day Completion for +75 XP

    const newTotalXP = (profile?.totalXP || 0) + xpAward;
    setProfile(prev => prev ? { ...prev, totalXP: newTotalXP } : null);
    await DatabaseService.getInstance().addXP(user.uid, xpAward);
  };

  const handleAddHabit = async (data: any) => {
    if (!user || !activeGroupId) return;
    const id = `h-${Date.now()}`;
    const newHabit: Habit = {
      id, ...data, groupId: activeGroupId, 
      sortOrder: habits.length, completedDays: {},
      currentStreak: 0, bestStreak: 0, totalCompletions: 0
    };
    await DatabaseService.getInstance().addHabit(user.uid, activeGroupId, newHabit);
    await refreshHabits();
    setIsAddHabitOpen(false);
  };

  const handleAddGroup = async (name: string, emoji: string, color: any) => {
    await addGroup(name, emoji, color);
    setIsNewGroupModalOpen(false);
  };

  return (
    <div className={styles.v2Container}>
      <MonkHeader profile={profile!} uid={user.uid} />

      <main className={styles.v2Main}>
        {/* AI Insight (Retained from v1) */}
        {profile && <AIInsightCard profile={profile} habits={habits} latestAction={latestAction} />}

        {/* Section: Vertical Accordion Groups */}
        <GroupListAccordion 
          groups={groups}
          activeGroupId={activeGroupId}
          onSelect={setActiveGroupId}
          onNewGroup={() => setIsNewGroupModalOpen(true)}
          habits={habits}
          renderGrid={(groupId) => {
            const groupHabits = habits.filter(h => h.groupId === groupId);
            const activeGroup = groups.find(g => g.id === groupId);
            
            return (
              <div className={styles.accordionGridWrap}>
                <HabitGridV2 
                  habits={groupHabits} 
                  onToggle={handleToggle}
                  onHabitClick={setSelectedHabit}
                  onLongPressCell={(habitId, dateStr) => {
                    const h = habits.find(h => h.id === habitId);
                    if (h) setCellModalData({ habitId, dateStr, habitName: h.name });
                  }}
                />

                {!isAddHabitOpen ? (
                  <button className={styles.addHabitBtn} onClick={() => setIsAddHabitOpen(true)}>
                    <span>＋</span> Add Habit to {activeGroup?.name}
                  </button>
                ) : (
                  <AddHabitInline 
                    onSave={handleAddHabit} 
                    onCancel={() => setIsAddHabitOpen(false)} 
                  />
                )}
              </div>
            );
          }}
        />
      </main>

      {/* Modals */}
      <NewGroupModal 
        isOpen={isNewGroupModalOpen} 
        onClose={() => setIsNewGroupModalOpen(false)} 
        onSave={handleAddGroup}
      />

      {cellModalData && (
        <CellDetailsModal 
          isOpen={!!cellModalData}
          onClose={() => setCellModalData(null)}
          habitName={cellModalData.habitName}
          dateStr={cellModalData.dateStr}
          onSave={async (details) => {
            if (!user || !activeGroupId) return;
            await DatabaseService.getInstance().updateHabitEntryDetails(
              user.uid, activeGroupId, cellModalData.habitId, cellModalData.dateStr, details
            );
          }}
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

      {/* Floating Action / Sign Out */}
      <button className={styles.signOutFab} onClick={() => signOut(auth!)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
      </button>

      {/* CSS Variables Injector for Theme Colors */}
      <style jsx global>{`
        :root {
          --theme-red: #ef4444;
          --theme-blue: #3b82f6;
          --theme-green: #22c55e;
          --theme-purple: #a855f7;
          --theme-orange: #f97316;
          --theme-pink: #ec4899;
          --theme-teal: #14b8a6;
          --theme-gold: #facc15;
        }
      `}</style>
    </div>
  );
}
