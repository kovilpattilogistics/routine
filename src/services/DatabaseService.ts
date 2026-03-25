import { db as firebaseDb } from "@/lib/firebase";
import { 
  doc, setDoc, getDoc, collection, getDocs, updateDoc, 
  deleteDoc, query, where, Timestamp, writeBatch, increment, Firestore
} from "firebase/firestore";

const db = firebaseDb as Firestore;

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
  category?: string;
  // MonkGrid Additions
  emoji?: string;
  createdAt?: Timestamp;
  currentStreak?: number;
  bestStreak?: number;
  totalCompletions?: number;
  
  // Denormalized purely for client-side Grid fast rendering without causing 100s of reads
  completedDays?: Record<string, boolean | number>; 
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

  async getHabits(userId: string): Promise<Habit[]> {
    const q = query(collection(db, "users", userId, "habits"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit));
  }

  async addHabit(userId: string, habit: Habit) {
    const habitRef = doc(db, "users", userId, "habits", habit.id);
    await setDoc(habitRef, {
      name: habit.name,
      emoji: habit.emoji || "🔥",
      category: habit.category || "General",
      createdAt: Timestamp.now(),
      currentStreak: 0,
      bestStreak: 0,
      totalCompletions: 0,
      completedDays: {}
    });
  }

  async deleteHabit(userId: string, habitId: string) {
    await deleteDoc(doc(db, "users", userId, "habits", habitId));
  }

  /**
   * Complex toggle: writes to the deep subcollection AND updates the denormalized grid cache.
   */
  async toggleHabitEntry(
    userId: string, 
    habitId: string, 
    dateStr: string, 
    isCompleted: boolean, 
    intensity: number = 1
  ) {
    const batch = writeBatch(db);
    
    // 1. The deep subcollection entry
    const entryRef = doc(db, "users", userId, "habits", habitId, "entries", dateStr);
    
    if (isCompleted) {
      batch.set(entryRef, {
        completed: true,
        intensity: intensity,
        completedAt: Timestamp.now(),
      }, { merge: true });
    } else {
      batch.delete(entryRef); // Erase if unmarked
    }

    // 2. The denormalized summary on the Habit doc for fast Grid loading
    const habitRef = doc(db, "users", userId, "habits", habitId);
    batch.update(habitRef, {
      [`completedDays.${dateStr}`]: isCompleted ? intensity : null,
      totalCompletions: increment(isCompleted ? 1 : -1)
    });

    await batch.commit();
  }

  /**
   * Save rich media details to a habit entry (Note, Mood, Photo) via Long-Press
   */
  async updateHabitEntryDetails(
    userId: string, 
    habitId: string, 
    dateStr: string, 
    details: Partial<HabitEntry>
  ) {
    const entryRef = doc(db, "users", userId, "habits", habitId, "entries", dateStr);
    await setDoc(entryRef, details, { merge: true });
  }
}
