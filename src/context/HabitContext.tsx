"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DatabaseService, Group, Habit } from "@/services/DatabaseService";
import { useAuth } from "./AuthContext";

interface HabitContextType {
  groups: Group[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string) => void;
  habits: Habit[];
  loading: boolean;
  refreshHabits: () => Promise<void>;
  toggleHabit: (
    habitId: string,
    dateStr: string,
    isCompleted: boolean,
    intensity: number
  ) => Promise<void>;
  addGroup: (
    name: string,
    emoji: string,
    color: Group["themeColor"]
  ) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  reorderHabits: (
    groupId: string,
    newOrderedHabits: Habit[]
  ) => Promise<void>;
  moveHabit: (
    habitId: string,
    fromGroupId: string,
    toGroupId: string
  ) => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  // Track the active group id in a ref so snapshot callbacks don't stale-close over it
  const activeGroupIdRef = useRef<string | null>(null);
  activeGroupIdRef.current = activeGroupId;

  // ── Real-time group listener ──────────────────────────────
  useEffect(() => {
    if (!user) {
      setGroups([]);
      setHabits([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "users", user.uid, "groups"),
      where("isDeleted", "==", false)
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const freshGroups = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as Group))
        .sort((a, b) => a.sortOrder - b.sortOrder);

      setGroups(freshGroups);

      // Auto-select first group if none selected
      if (freshGroups.length > 0 && !activeGroupIdRef.current) {
        setActiveGroupId(freshGroups[0].id);
      }

      // Fetch all habits for all groups in parallel (single waterfall step)
      if (freshGroups.length > 0) {
        const db_svc = DatabaseService.getInstance();
        const results = await Promise.all(
          freshGroups.map((g) => db_svc.getHabits(user.uid, g.id))
        );
        setHabits(results.flat());
      } else {
        setHabits([]);
      }

      setLoading(false);
    });

    return unsub;
  }, [user]);

  // ── Manual habit refresh (used after add/move operations) ─
  const refreshHabits = useCallback(async () => {
    if (!user) return;
    const db_svc = DatabaseService.getInstance();
    const currentGroups = groups;
    if (currentGroups.length === 0) return;
    const results = await Promise.all(
      currentGroups.map((g) => db_svc.getHabits(user.uid, g.id))
    );
    setHabits(results.flat());
  }, [user, groups]);

  // ── Toggle habit (optimistic) ─────────────────────────────
  const toggleHabit = useCallback(
    async (
      habitId: string,
      dateStr: string,
      isCompleted: boolean,
      intensity: number
    ) => {
      if (!user || !activeGroupIdRef.current) return;

      // Find which group this habit belongs to
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      const groupId = habit.groupId;

      // Optimistic update
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habitId) return h;
          return {
            ...h,
            completedDays: {
              ...h.completedDays,
              [dateStr]: isCompleted ? intensity : null,
            },
          };
        })
      );

      try {
        await DatabaseService.getInstance().toggleHabitEntry(
          user.uid,
          groupId,
          habitId,
          dateStr,
          isCompleted,
          intensity
        );
      } catch (err) {
        console.error("Toggle failed — reverting", err);
        // Revert on failure
        setHabits((prev) =>
          prev.map((h) => {
            if (h.id !== habitId) return h;
            const reverted = { ...h.completedDays };
            if (isCompleted) delete reverted[dateStr];
            else reverted[dateStr] = intensity;
            return { ...h, completedDays: reverted };
          })
        );
      }
    },
    [user, habits]
  );

  // ── Add group (optimistic) ────────────────────────────────
  const addGroup = useCallback(
    async (name: string, emoji: string, color: Group["themeColor"]) => {
      if (!user) return;
      const id = `grp-${Date.now()}`;
      const newGroup: Group = {
        id,
        name,
        emoji,
        themeColor: color,
        sortOrder: groups.length,
        isDeleted: false,
        createdAt: { toDate: () => new Date() } as any,
      };
      // onSnapshot will pick up the real doc; this just gives instant UI
      setActiveGroupId(id);
      await DatabaseService.getInstance().addGroup(user.uid, newGroup);
    },
    [user, groups.length]
  );

  // ── Delete group (optimistic) ─────────────────────────────
  const deleteGroup = useCallback(
    async (groupId: string) => {
      if (!user) return;
      // Optimistic: remove from local state
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      setHabits((prev) => prev.filter((h) => h.groupId !== groupId));
      if (activeGroupIdRef.current === groupId) {
        const remaining = groups.filter((g) => g.id !== groupId);
        setActiveGroupId(remaining[0]?.id || null);
      }
      await DatabaseService.getInstance().deleteGroup(user.uid, groupId);
    },
    [user, groups]
  );

  // ── Delete habit (optimistic) ─────────────────────────────
  const deleteHabit = useCallback(
    async (habitId: string) => {
      if (!user) return;
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      // Optimistic remove
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      await DatabaseService.getInstance().deleteHabit(
        user.uid,
        habit.groupId,
        habitId
      );
    },
    [user, habits]
  );

  // ── Reorder habits within a group ─────────────────────────
  const reorderHabits = useCallback(
    async (groupId: string, newOrderedHabits: Habit[]) => {
      if (!user) return;
      setHabits((prev) => {
        const others = prev.filter((h) => h.groupId !== groupId);
        const reordered = newOrderedHabits.map((h, i) => ({
          ...h,
          sortOrder: i,
        }));
        return [...others, ...reordered];
      });
      const db_svc = DatabaseService.getInstance();
      await Promise.all(
        newOrderedHabits.map((h, i) =>
          db_svc.updateHabit(user.uid, groupId, h.id, { sortOrder: i })
        )
      );
    },
    [user]
  );

  // ── Move habit to another group ───────────────────────────
  const moveHabit = useCallback(
    async (habitId: string, fromGroupId: string, toGroupId: string) => {
      if (!user || fromGroupId === toGroupId) return;
      // Optimistic
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, groupId: toGroupId, sortOrder: 9999 } : h
        )
      );
      await DatabaseService.getInstance().moveHabitToGroup(
        user.uid,
        fromGroupId,
        toGroupId,
        habitId
      );
      // Sync actual data after move
      await refreshHabits();
    },
    [user, refreshHabits]
  );

  return (
    <HabitContext.Provider
      value={{
        groups,
        activeGroupId,
        setActiveGroupId,
        habits,
        loading,
        refreshHabits,
        toggleHabit,
        addGroup,
        deleteGroup,
        deleteHabit,
        reorderHabits,
        moveHabit,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) throw new Error("useHabits must be used within HabitProvider");
  return context;
};
