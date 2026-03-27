import { db as firebaseDb } from "@/lib/firebase";
import { 
  doc, setDoc, getDoc, collection, getDocs, updateDoc, 
  deleteDoc, query, where, Timestamp, writeBatch, increment, Firestore
} from "firebase/firestore";

const db = firebaseDb as Firestore;

export interface Group {
  id: string;
  name: string;
  emoji: string;
  themeColor: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' | 'gold';
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
  onboardingComplete?: boolean;
  // MonkGrid Additions
  totalXP?: number;
  currentLevel?: number;
  badges?: string[];
  createdAt?: Timestamp;
}

export interface HabitEntry {
  completed: boolean;
  intensity: number; // 1=Done, 2=Exceeded, 3=Max
  note?: string;
  photoURL?: string;
  mood?: string; // 😴,😐,😊,💪,🔥
  completedAt?: Timestamp;
}

export interface Habit {
  id: string;
  name: string;
  groupId: string; // New: association with parent group
  emoji?: string;
  frequency: 'daily' | 'weekdays' | 'custom';
  customDays?: string[]; // ['Mon', 'Wed']
  createdAt?: Timestamp;
  currentStreak?: number;
  bestStreak?: number;
  totalCompletions?: number;
  sortOrder: number;
  
  // Denormalized summary for fast Grid loading
  completedDays?: Record<string, number | null>; 
}

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
    // Initialize MonkGrid defaults
    await setDoc(userRef, { 
      ...data, 
      totalXP: 0, 
      currentLevel: 1, 
      badges: [] 
    }, { merge: true });
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const docSnap = await getDoc(doc(db, "users", userId));
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, data as any);
  }

  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const p = await this.getUserProfile(userId);
    return !!p?.onboardingComplete;
  }

  async addXP(userId: string, xpAmount: number, newLevel?: number) {
    const userRef = doc(db, "users", userId);
    const updates: any = { totalXP: increment(xpAmount) };
    if (newLevel) updates.currentLevel = newLevel;
    await updateDoc(userRef, updates);
  }

  // ── HABITS & ENTRIES ─────────────────────────────────────

  // ── GROUPS ────────────────────────────────────────────────
  
  async getGroups(userId: string): Promise<Group[]> {
    const q = query(
      collection(db, "users", userId, "groups"), 
      where("isDeleted", "==", false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Group))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async addGroup(userId: string, group: Group) {
    const groupRef = doc(db, "users", userId, "groups", group.id);
    await setDoc(groupRef, { ...group, createdAt: Timestamp.now() });
  }

  async updateGroup(userId: string, groupId: string, data: Partial<Group>) {
    const groupRef = doc(db, "users", userId, "groups", groupId);
    await updateDoc(groupRef, data as any);
  }

  async deleteGroup(userId: string, groupId: string) {
    const groupRef = doc(db, "users", userId, "groups", groupId);
    await updateDoc(groupRef, { isDeleted: true });
  }

  async initDefaultGroups(userId: string) {
    const defaults: Omit<Group, 'id'>[] = [
      { name: "Gym", emoji: "💪", themeColor: "red", sortOrder: 0, isDeleted: false, createdAt: Timestamp.now() },
      { name: "Supplements", emoji: "💊", themeColor: "blue", sortOrder: 1, isDeleted: false, createdAt: Timestamp.now() },
      { name: "Food Habits", emoji: "🥗", themeColor: "green", sortOrder: 2, isDeleted: false, createdAt: Timestamp.now() },
      { name: "Skin & Hair", emoji: "🧴", themeColor: "purple", sortOrder: 3, isDeleted: false, createdAt: Timestamp.now() }
    ];

    const batch = writeBatch(db);
    for (const d of defaults) {
      const gId = `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const gRef = doc(db, "users", userId, "groups", gId);
      batch.set(gRef, { ...d, id: gId });
      
      // Add 2 placeholder habits per group
      const h1Id = `h1-${gId}`;
      const h1Ref = doc(db, "users", userId, "groups", gId, "habits", h1Id);
      batch.set(h1Ref, {
        id: h1Id, name: `Sample ${d.name} 1`, groupId: gId, emoji: d.emoji,
        frequency: 'daily', sortOrder: 0, currentStreak: 0, bestStreak: 0,
        totalCompletions: 0, completedDays: {}, createdAt: Timestamp.now()
      });
    }
    await batch.commit();
  }

  // ── HABITS & ENTRIES ─────────────────────────────────────

  async getHabits(userId: string, groupId: string): Promise<Habit[]> {
    const q = query(collection(db, "users", userId, "groups", groupId, "habits"));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Habit))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async addHabit(userId: string, groupId: string, habit: Habit) {
    const habitRef = doc(db, "users", userId, "groups", groupId, "habits", habit.id);
    await setDoc(habitRef, {
      ...habit,
      createdAt: Timestamp.now(),
      currentStreak: 0,
      bestStreak: 0,
      totalCompletions: 0,
      completedDays: {}
    });
  }

  async deleteHabit(userId: string, groupId: string, habitId: string) {
    await deleteDoc(doc(db, "users", userId, "groups", groupId, "habits", habitId));
  }

  async toggleHabitEntry(
    userId: string, 
    groupId: string,
    habitId: string, 
    dateStr: string, 
    isCompleted: boolean, 
    intensity: number = 1
  ) {
    const batch = writeBatch(db);
    const entryRef = doc(db, "users", userId, "groups", groupId, "habits", habitId, "entries", dateStr);
    
    if (isCompleted) {
      batch.set(entryRef, {
        completed: true,
        intensity: intensity,
        completedAt: Timestamp.now(),
      }, { merge: true });
    } else {
      batch.delete(entryRef);
    }

    const habitRef = doc(db, "users", userId, "groups", groupId, "habits", habitId);
    batch.update(habitRef, {
      [`completedDays.${dateStr}`]: isCompleted ? intensity : null,
      totalCompletions: increment(isCompleted ? 1 : -1)
    });

    await batch.commit();
  }

  async updateHabit(userId: string, groupId: string, habitId: string, data: Partial<Habit>) {
    const habitRef = doc(db, "users", userId, "groups", groupId, "habits", habitId);
    await updateDoc(habitRef, data as any);
  }

  async moveHabitToGroup(userId: string, oldGroupId: string, newGroupId: string, habitId: string) {
    const oldRef = doc(db, "users", userId, "groups", oldGroupId, "habits", habitId);
    const newRef = doc(db, "users", userId, "groups", newGroupId, "habits", habitId);
    
    const snap = await getDoc(oldRef);
    if (!snap.exists()) return;
    
    const habitData = snap.data();
    const batch = writeBatch(db);
    
    // Move habit doc
    batch.set(newRef, { ...habitData, groupId: newGroupId });
    batch.delete(oldRef);
    
    // Move entries (limit to 450 to stay safe with Firestore batch limit)
    const entriesSnap = await getDocs(query(collection(db, "users", userId, "groups", oldGroupId, "habits", habitId, "entries")));
    entriesSnap.docs.slice(0, 450).forEach(docSnap => {
      const newEntryRef = doc(db, "users", userId, "groups", newGroupId, "habits", habitId, "entries", docSnap.id);
      batch.set(newEntryRef, docSnap.data());
      batch.delete(docSnap.ref);
    });
    
    await batch.commit();
  }
}
