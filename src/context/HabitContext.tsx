"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { DatabaseService, Group, Habit, UserProfile } from "@/services/DatabaseService";
import { useAuth } from "./AuthContext";

interface HabitContextType {
  groups: Group[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string) => void;
  habits: Habit[];
  loading: boolean;
  refreshGroups: () => Promise<void>;
  refreshHabits: () => Promise<void>;
  toggleHabit: (habitId: string, dateStr: string, isCompleted: boolean, intensity: number) => Promise<void>;
  addGroup: (name: string, emoji: string, color: Group['themeColor']) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshGroups = useCallback(async () => {
    if (!user) return;
    const db = DatabaseService.getInstance();
    const g = await db.getGroups(user.uid);
    setGroups(g);
    if (g.length > 0 && !activeGroupId) {
      setActiveGroupId(g[0].id);
    }
    setLoading(false);
  }, [user, activeGroupId]);

  const refreshHabits = useCallback(async () => {
    if (!user || !activeGroupId) return;
    const db = DatabaseService.getInstance();
    const h = await db.getHabits(user.uid, activeGroupId);
    setHabits(h);
  }, [user, activeGroupId]);

  useEffect(() => {
    refreshGroups();
  }, [user, refreshGroups]);

  useEffect(() => {
    refreshHabits();
  }, [activeGroupId, refreshHabits]);

  const toggleHabit = async (habitId: string, dateStr: string, isCompleted: boolean, intensity: number) => {
    if (!user || !activeGroupId) return;

    // Optimistic Update
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          completedDays: {
            ...h.completedDays,
            [dateStr]: isCompleted ? intensity : null
          }
        };
      }
      return h;
    }));

    try {
      await DatabaseService.getInstance().toggleHabitEntry(
        user.uid, activeGroupId, habitId, dateStr, isCompleted, intensity
      );
    } catch (err) {
      console.error("Toggle failed", err);
      // Revert on error
      refreshHabits();
    }
  };

  const addGroup = async (name: string, emoji: string, color: Group['themeColor']) => {
    if (!user) return;
    const id = `${Date.now()}`;
    const newGroup: Group = {
      id, name, emoji, themeColor: color,
      sortOrder: groups.length, isDeleted: false,
      createdAt: (new Date()) as any // Placeholder, Firestore will set via setDoc helper
    };
    
    setGroups(prev => [...prev, newGroup]);
    setActiveGroupId(id);
    await DatabaseService.getInstance().addGroup(user.uid, newGroup);
  };

  const deleteGroup = async (groupId: string) => {
    if (!user) return;
    setGroups(prev => prev.filter(g => g.id !== groupId));
    if (activeGroupId === groupId) {
      setActiveGroupId(groups.find(g => g.id !== groupId)?.id || null);
    }
    await DatabaseService.getInstance().deleteGroup(user.uid, groupId);
  };

  return (
    <HabitContext.Provider value={{ 
      groups, activeGroupId, setActiveGroupId, habits, loading, 
      refreshGroups, refreshHabits, toggleHabit, addGroup, deleteGroup 
    }}>
      {children}
    </HabitContext.Provider>
  );
}

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) throw new Error("useHabits must be used within HabitProvider");
  return context;
};
