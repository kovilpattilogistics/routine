import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  writeBatch,
  increment,
  deleteField,
} from "firebase/firestore";

// ── TYPES ────────────────────────────────────────────────────

export interface Group {
  id: string;
  name: string;
  emoji: string;
  themeColor: "red" | "blue" | "green" | "purple" | "orange" | "pink" | "teal" | "gold";
  sortOrder: number;
  isDeleted: boolean;
  createdAt: Timestamp;
}

export interface UserProfile {
  name: string;
  email?: string;
  role?: string;
  struggle?: string;
  age?: number;
  height?: number;
  weight?: number;
  wakeTime?: string;
  focusArea?: string;
  firstTask?: string;
  
  // New Lifestyle & Fitness Metrics
  sleepTarget?: number;
  activityLevel?: string;
  fitnessGoal?: string;
  dietaryPreference?: string;
  
  // Custom Avatar
  avatarSeed?: string;
  avatarStyle?: "adventurer" | "micah" | "bottts" | "notionists";
  
  // Push Notifications
  fcmToken?: string;
  reminderFrequency?: "none" | "daily" | "morning_evening" | "intensive";

  onboardingComplete?: boolean;
  totalXP?: number;
  currentLevel?: number;
  badges?: string[];
  createdAt?: Timestamp;
}

export interface HabitEntry {
  completed: boolean;
  intensity: number; // 1=Done, 2=Exceeded
  note?: string;
  photoURL?: string;
  mood?: string;
  completedAt?: Timestamp;
}

export interface Habit {
  id: string;
  name: string;
  groupId: string;
  emoji?: string;
  frequency: "daily" | "weekdays" | "custom";
  customDays?: string[];
  createdAt?: Timestamp;
  currentStreak?: number;
  bestStreak?: number;
  totalCompletions?: number;
  sortOrder: number;
  // Denormalized for fast grid loading — key is YYYY-MM-DD, value is intensity (1|2) or null/undefined
  completedDays?: Record<string, number | null>;
}

// ── SERVICE ──────────────────────────────────────────────────

export class DatabaseService {
  private static instance: DatabaseService;
  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // ── PROFILE ──────────────────────────────────────────────

  async createUserProfile(userId: string, data: Partial<UserProfile>) {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      { ...data, totalXP: 0, currentLevel: 1, badges: [] },
      { merge: true }
    );
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, "users", userId));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, data as Record<string, unknown>);
  }

  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    return !!profile?.onboardingComplete;
  }

  async addXP(userId: string, xpAmount: number, newLevel?: number) {
    const userRef = doc(db, "users", userId);
    const updates: Record<string, unknown> = { totalXP: increment(xpAmount) };
    if (newLevel) updates.currentLevel = newLevel;
    await updateDoc(userRef, updates);
  }

  // ── GROUPS ──────────────────────────────────────────────

  async getGroups(userId: string): Promise<Group[]> {
    const q = query(
      collection(db, "users", userId, "groups"),
      where("isDeleted", "==", false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as Group))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async addGroup(userId: string, group: Group) {
    const groupRef = doc(db, "users", userId, "groups", group.id);
    await setDoc(groupRef, { ...group, createdAt: Timestamp.now() });
  }

  async updateGroup(userId: string, groupId: string, data: Partial<Group>) {
    const groupRef = doc(db, "users", userId, "groups", groupId);
    await updateDoc(groupRef, data as Record<string, unknown>);
  }

  async deleteGroup(userId: string, groupId: string) {
    const groupRef = doc(db, "users", userId, "groups", groupId);
    await updateDoc(groupRef, { isDeleted: true });
  }

  async initDefaultGroups(userId: string) {
    const defaults: Omit<Group, "id">[] = [
      { name: "Gym", emoji: "💪", themeColor: "red", sortOrder: 0, isDeleted: false, createdAt: Timestamp.now() },
      { name: "Supplements", emoji: "💊", themeColor: "blue", sortOrder: 1, isDeleted: false, createdAt: Timestamp.now() },
      { name: "Food Habits", emoji: "🥗", themeColor: "green", sortOrder: 2, isDeleted: false, createdAt: Timestamp.now() },
      { name: "Skin & Hair", emoji: "🧴", themeColor: "purple", sortOrder: 3, isDeleted: false, createdAt: Timestamp.now() },
    ];

    const batch = writeBatch(db);
    for (const d of defaults) {
      const gId = `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const gRef = doc(db, "users", userId, "groups", gId);
      batch.set(gRef, { ...d, id: gId });

      const h1Id = `h1-${gId}`;
      const h1Ref = doc(db, "users", userId, "groups", gId, "habits", h1Id);
      batch.set(h1Ref, {
        id: h1Id,
        name: `Sample ${d.name} 1`,
        groupId: gId,
        emoji: d.emoji,
        frequency: "daily",
        sortOrder: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalCompletions: 0,
        completedDays: {},
        createdAt: Timestamp.now(),
      });
    }
    await batch.commit();
  }

  // ── HABITS ──────────────────────────────────────────────

  async getHabits(userId: string, groupId: string): Promise<Habit[]> {
    const q = query(
      collection(db, "users", userId, "groups", groupId, "habits")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as Habit))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async addHabit(userId: string, groupId: string, habit: Habit) {
    const habitRef = doc(
      db,
      "users",
      userId,
      "groups",
      groupId,
      "habits",
      habit.id
    );
    await setDoc(habitRef, {
      ...habit,
      createdAt: Timestamp.now(),
      currentStreak: 0,
      bestStreak: 0,
      totalCompletions: 0,
      completedDays: {},
    });
  }

  async deleteHabit(userId: string, groupId: string, habitId: string) {
    await deleteDoc(
      doc(db, "users", userId, "groups", groupId, "habits", habitId)
    );
  }

  async toggleHabitEntry(
    userId: string,
    groupId: string,
    habitId: string,
    dateStr: string,
    isCompleted: boolean,
    intensity = 1,
    oldDates: string[] = []
  ) {
    const habitRef = doc(
      db,
      "users",
      userId,
      "groups",
      groupId,
      "habits",
      habitId
    );
    
    const updates: Record<string, any> = {
      [`completedDays.${dateStr}`]: isCompleted ? intensity : deleteField(),
      totalCompletions: increment(isCompleted ? 1 : -1),
    };
    
    // Prune old dates > 90 days to keep doc size small
    for (const oldDate of oldDates) {
      if (oldDate !== dateStr) {
        updates[`completedDays.${oldDate}`] = deleteField();
      }
    }

    await updateDoc(habitRef, updates);
  }

  async updateHabit(
    userId: string,
    groupId: string,
    habitId: string,
    data: Partial<Habit>
  ) {
    const habitRef = doc(
      db,
      "users",
      userId,
      "groups",
      groupId,
      "habits",
      habitId
    );
    await updateDoc(habitRef, data as Record<string, unknown>);
  }

  async batchUpdateHabits(
    userId: string,
    groupId: string,
    updates: { id: string; data: Partial<Habit> }[]
  ) {
    const batch = writeBatch(db);
    for (const update of updates) {
      const habitRef = doc(db, "users", userId, "groups", groupId, "habits", update.id);
      batch.update(habitRef, update.data as Record<string, unknown>);
    }
    await batch.commit();
  }

  async updateHabitEntryDetails(
    userId: string,
    groupId: string,
    habitId: string,
    dateStr: string,
    details: Partial<HabitEntry>
  ) {
    const entryRef = doc(
      db,
      "users",
      userId,
      "groups",
      groupId,
      "habits",
      habitId,
      "entries",
      dateStr
    );
    await setDoc(entryRef, details, { merge: true });
  }

  async moveHabitToGroup(
    userId: string,
    oldGroupId: string,
    newGroupId: string,
    habitId: string
  ) {
    const oldRef = doc(
      db,
      "users",
      userId,
      "groups",
      oldGroupId,
      "habits",
      habitId
    );
    const newRef = doc(
      db,
      "users",
      userId,
      "groups",
      newGroupId,
      "habits",
      habitId
    );

    const snap = await getDoc(oldRef);
    if (!snap.exists()) return;

    const habitData = snap.data();
    const batch = writeBatch(db);
    batch.set(newRef, { ...habitData, groupId: newGroupId });
    batch.delete(oldRef);

    // Move entries (capped at 450 stays safe within Firestore batch limit of 500)
    const entriesSnap = await getDocs(
      query(
        collection(
          db,
          "users",
          userId,
          "groups",
          oldGroupId,
          "habits",
          habitId,
          "entries"
        )
      )
    );
    entriesSnap.docs.slice(0, 450).forEach((docSnap) => {
      const newEntryRef = doc(
        db,
        "users",
        userId,
        "groups",
        newGroupId,
        "habits",
        habitId,
        "entries",
        docSnap.id
      );
      batch.set(newEntryRef, docSnap.data());
      batch.delete(docSnap.ref);
    });

    await batch.commit();
  }
}
