"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useHabits } from "@/context/HabitContext";
import { DatabaseService, UserProfile, Habit } from "@/services/DatabaseService";
import { GamificationService, XP_REWARDS } from "@/services/GamificationService";

import { GroupListAccordion } from "@/components/GroupListAccordion";
import { HabitGridV2 } from "@/components/HabitGridV2";
import { MonkHeader } from "@/components/MonkHeader";
import { NewGroupModal } from "@/components/NewGroupModal";
import { AddHabitInline } from "@/components/AddHabitInline";
import { CellDetailsModal } from "@/components/CellDetailsModal";
import { AIInsightCard } from "@/components/AIInsightCard";
import { MonkHabitSheet } from "@/components/MonkHabitSheet";
import { PastDataModal } from "@/components/PastDataModal";

import styles from "./planner.module.css";

export default function PlannerPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    groups,
    activeGroupId,
    setActiveGroupId,
    habits,
    loading: habitsLoading,
    toggleHabit,
    addGroup,
    refreshHabits,
  } = useHabits();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  // Per-group add-habit state — keyed by groupId so switching groups resets the form
  const [addHabitForGroupId, setAddHabitForGroupId] = useState<string | null>(null);
  const [cellModalData, setCellModalData] = useState<{
    habitId: string;
    dateStr: string;
    habitName: string;
  } | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [latestAction, setLatestAction] = useState<string | undefined>(undefined);
  const [baseDate, setBaseDate] = useState(new Date());
  const [isPastDataModalOpen, setIsPastDataModalOpen] = useState(false);

  // Accumulate XP changes
  const pendingXPAward = useRef(0);
  const xpDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  // Load profile separately — doesn't block habit grid from rendering
  useEffect(() => {
    if (!user) return;
    DatabaseService.getInstance()
      .getUserProfile(user.uid)
      .then((p) => { setProfile(p); setProfileLoading(false); })
      .catch(() => setProfileLoading(false));
  }, [user]);

  const todayStr = new Date().toISOString().split("T")[0];

  const handleToggle = useCallback(
    async (habitId: string, dateStr: string, isCompleted: boolean, intensity: number) => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      if (dateStr === todayStr) {
        setLatestAction(isCompleted ? `Completed: ${habit.name}` : `Unmarked: ${habit.name}`);
      }

      await toggleHabit(habitId, dateStr, isCompleted, intensity);

      // XP — only award if user profile is loaded
      if (profile && user) {
        let xpAward = isCompleted ? XP_REWARDS.HABIT_COMPLETION : -XP_REWARDS.HABIT_COMPLETION;
        if (intensity === 2) xpAward += XP_REWARDS.EXCEEDED_GOAL;
        const newTotalXP = (profile.totalXP || 0) + xpAward;
        setProfile((prev) => (prev ? { ...prev, totalXP: newTotalXP } : null));
        
        // Debounce the network write to save on Firebase write operations
        pendingXPAward.current += xpAward;
        if (xpDebounceTimer.current) clearTimeout(xpDebounceTimer.current);
        xpDebounceTimer.current = setTimeout(() => {
          if (pendingXPAward.current !== 0) {
            DatabaseService.getInstance().addXP(user.uid, pendingXPAward.current).catch(console.error);
            pendingXPAward.current = 0;
          }
        }, 3000);
      }
    },
    [habits, todayStr, toggleHabit, profile, user]
  );

  const handleAddHabit = useCallback(
    async (data: { name: string; emoji: string; frequency: string; customDays: string[] }) => {
      if (!user || !addHabitForGroupId) return;
      const id = `h-${Date.now()}`;
      const newHabit: Habit = {
        id,
        ...data,
        frequency: data.frequency as Habit["frequency"],
        groupId: addHabitForGroupId,
        sortOrder: habits.filter((h) => h.groupId === addHabitForGroupId).length,
        completedDays: {},
        currentStreak: 0,
        bestStreak: 0,
        totalCompletions: 0,
        createdAt: { toDate: () => new Date() } as any,
      };
      await DatabaseService.getInstance().addHabit(user.uid, addHabitForGroupId, newHabit);
      await refreshHabits();
      setAddHabitForGroupId(null);
    },
    [user, addHabitForGroupId, habits, refreshHabits]
  );

  const handleAddGroup = useCallback(
    async (name: string, emoji: string, color: any) => {
      await addGroup(name, emoji, color);
      setIsNewGroupModalOpen(false);
    },
    [addGroup]
  );

  // Show skeleton during initial load — not a blank white screen
  if (authLoading || habitsLoading) {
    return (
      <div className={styles.v2Container}>
        <div className={styles.skeletonHeader}>
          <div className={`${styles.skeletonAvatar} skeleton`} />
          <div className={styles.skeletonLines}>
            <div className={`${styles.skeletonLine} skeleton`} style={{ width: "140px" }} />
            <div className={`${styles.skeletonLine} skeleton`} style={{ width: "90px" }} />
          </div>
        </div>
        <div className={styles.skeletonBody}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${styles.skeletonGroup} skeleton`} />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  return (
    <div className={styles.v2Container}>
      <MonkHeader
        profile={profile}
        uid={user.uid}
        onPastDataClick={() => setIsPastDataModalOpen(true)}
      />

      {isPastDataModalOpen && (
        <PastDataModal
          isOpen={isPastDataModalOpen}
          onClose={() => setIsPastDataModalOpen(false)}
          onSelect={(date: Date) => {
            setBaseDate(date);
            setIsPastDataModalOpen(false);
          }}
          currentDate={baseDate}
          minDate={
            profile?.createdAt && typeof (profile.createdAt as any).toDate === "function"
              ? (profile.createdAt as any).toDate()
              : new Date()
          }
        />
      )}

      <main className={styles.v2Main}>
        {/* AI Insight — loads async, doesn't block page */}
        {profile && (
          <AIInsightCard
            profile={profile}
            habits={habits}
            latestAction={latestAction}
          />
        )}

        {groups.length === 0 && !habitsLoading ? (
          <div className={styles.emptyCanvasNudge}>
            <div className={styles.emptyIcon}>✨</div>
            <h2>You have a blank canvas.</h2>
            <p>Let's create your first routine and start building momentum.</p>
            <button
              onClick={() => setIsNewGroupModalOpen(true)}
              className={styles.emptyNudgeBtn}
            >
              Create a Group
            </button>
          </div>
        ) : (
          <GroupListAccordion
            groups={groups}
            activeGroupId={activeGroupId}
            onSelect={(id) => {
              // Close add-habit form when switching groups
              setAddHabitForGroupId(null);
              setActiveGroupId(id);
            }}
            onNewGroup={() => setIsNewGroupModalOpen(true)}
            habits={habits}
            renderGrid={(groupId) => {
              const groupHabits = habits.filter((h) => h.groupId === groupId);
              const grp = groups.find((g) => g.id === groupId);
              const isAddingHere = addHabitForGroupId === groupId;

              return (
                <div className={styles.accordionGridWrap}>
                  <HabitGridV2
                    habits={groupHabits}
                    onToggle={handleToggle}
                    onHabitClick={setSelectedHabit}
                    onLongPressCell={(habitId, dateStr) => {
                      const h = habits.find((h) => h.id === habitId);
                      if (h) setCellModalData({ habitId, dateStr, habitName: h.name });
                    }}
                    baseDate={baseDate}
                    themeColor={grp?.themeColor}
                  />

                  {!isAddingHere ? (
                    <button
                      className={styles.addHabitBtn}
                      onClick={() => setAddHabitForGroupId(groupId)}
                    >
                      <span>＋</span> Add Habit to {grp?.name}
                    </button>
                  ) : (
                    <AddHabitInline
                      onSave={handleAddHabit}
                      onCancel={() => setAddHabitForGroupId(null)}
                      groupName={grp?.name}
                    />
                  )}
                </div>
              );
            }}
          />
        )}
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
              user.uid,
              activeGroupId,
              cellModalData.habitId,
              cellModalData.dateStr,
              details
            );
          }}
        />
      )}

      {selectedHabit && (
        <MonkHabitSheet
          habit={selectedHabit}
          onClose={() => setSelectedHabit(null)}
        />
      )}
    </div>
  );
}
