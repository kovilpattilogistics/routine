import { UserProfile, Group, Habit } from "./DatabaseService";
import { Timestamp, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export class RoutineGeneratorService {
  /**
   * Generates a fully custom routine leveraging behavioral science overrides
   * such as chronological energy mapping, bandwidth shrinking, and friction constraints.
   */
  public static async generateCustomRoutine(userId: string, profile: UserProfile): Promise<void> {
    
    interface DraftGroup {
      name: string;
      emoji: string;
      themeColor: Group["themeColor"];
      habits: { name: string; emoji: string }[];
    }
    
    const draftGroups: DraftGroup[] = [];

    // -- 1. Psychometric Algorithmic Multipliers --
    const shrinkHabits = profile.dailyFreeTime === "under_1h";
    const capHabits = profile.habitConsistency === "struggle" || profile.primaryDriver === "survival";
    const isNightOwl = profile.peakEnergy === "late_night";
    const isPeace = profile.primaryDriver === "peace";

    // -- 2. Volume Constraint (The "Survival" / "Struggle" path) --
    // If the user struggles to stick OR just wants mental peace/survival, we strictly cap friction
    // by only generating ONE master group with a max of 3 micro-habits.
    if (capHabits) {
      const survivalGroup: DraftGroup = {
        name: isPeace ? "Gentle Start" : "Survival Basics",
        emoji: "🧘",
        themeColor: "green",
        habits: [
          { name: "Drink a glass of water", emoji: "💧" },
          { name: "1-Min Priority Draft", emoji: "📝" },
          { name: shrinkHabits ? "5m stretch" : "15m walk", emoji: "🚶" }
        ]
      };
      
      // Inject single environmental trigger
      if (profile.workEnvironment === "wfh") {
         survivalGroup.habits.push({ name: "Shut down laptop at 5 PM", emoji: "💻" });
      } else if (profile.workEnvironment === "commuter") {
         survivalGroup.habits.push({ name: "Prep bag the night before", emoji: "🎒" });
      }
      
      draftGroups.push(survivalGroup);
    } 
    // -- 3. Scaled Multi-Group Path (For normal & optimizers) --
    else {
      // A. Morning Block
      const morning: DraftGroup = {
        name: isPeace ? "Morning Calm" : "Morning Momentum",
        emoji: "🌅",
        themeColor: "orange",
        habits: [
          { name: "Make the bed", emoji: "🛏️" },
          { name: "Drink a glass of water", emoji: "💧" }
        ]
      };
      
      // Night owls should not be burdened with heavy goals in the morning
      if (!isNightOwl) {
        morning.habits.push({ name: "Review long-term goals", emoji: "🎯" });
        if (profile.struggle === "procrastination") {
           morning.habits.push({ name: "Eat the Frog (Hardest task)", emoji: "🐸" });
        }
      }
      draftGroups.push(morning);
      
      // B. Focus & Work Block
      const focusDuration = shrinkHabits ? "15m Sprint" : "90m Block";
      const focusName = isPeace ? `Protect ${focusDuration}` : `Aggressive ${focusDuration}`;
      
      const focus: DraftGroup = {
        name: profile.focusArea === "learning" ? "Learning" : profile.focusArea === "finance" ? "Wealth" : "Deep Work",
        emoji: profile.focusArea === "finance" ? "💰" : "💻",
        themeColor: "blue",
        habits: [
          { name: focusName, emoji: "🛠️" }
        ]
      };
      
      if (profile.focusArea === "learning") {
         focus.habits.push({ name: shrinkHabits ? "Read 2 pages" : "Read 10 pages", emoji: "📖" });
      } else if (profile.focusArea === "career") {
         focus.habits.push({ name: "Inbox Zero", emoji: "📧" });
      }
      
      // Environment trigger
      if (profile.workEnvironment === "wfh") {
         focus.habits.push({ name: "Fake Commute (Walk outside)", emoji: "🚶" });
      }
      draftGroups.push(focus);
      
      // C. Fitness Block
      const gymDuration = shrinkHabits ? "15m" : "45m";
      const fitness: DraftGroup = {
        name: "Body & Health",
        emoji: "💪",
        themeColor: "red",
        habits: [
          { name: profile.fitnessGoal === "muscle" ? `${gymDuration} Strength` : `${gymDuration} Movement`, emoji: "🏋️" }
        ]
      };

      if (profile.activityLevel === "sedentary") {
        fitness.habits.push({ name: "Stand up every hour", emoji: "🧍" });
      }
      draftGroups.push(fitness);

      // D. Evening Block
      const evening: DraftGroup = {
        name: "Evening Wind-Down",
        emoji: "🌙",
        themeColor: "purple",
        habits: [
          { name: "Screens off 45m before bed", emoji: "📱" }
        ]
      };
      
      // Shift cognitive load to late night for night owls
      if (isNightOwl) {
         evening.habits.push({ name: "Late Night Focus Block", emoji: "🦉" });
         if (profile.struggle === "procrastination") {
            evening.habits.push({ name: "Eat the Frog (Night Version)", emoji: "🐸" });
         }
      } else {
         evening.habits.push({ name: "5-Min Brain Dump", emoji: "🧠" });
      }
      
      draftGroups.push(evening);
    }
    
    // -- 4. Atomic Database Committing --
    const batch = writeBatch(db);
    let sortOrderGroup = 10; 
    
    for (const dg of draftGroups) {
      const groupId = `genG_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      
      const newGroup: Group = {
        id: groupId,
        name: dg.name,
        emoji: dg.emoji,
        themeColor: dg.themeColor,
        sortOrder: sortOrderGroup++,
        isDeleted: false,
        createdAt: Timestamp.now()
      };
      const groupRef = doc(db, "users", userId, "groups", groupId);
      batch.set(groupRef, newGroup);
      
      let sortOrderHabit = 0;
      for (const dh of dg.habits) {
        const habitId = `genH_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const newHabit: Habit = {
          id: habitId,
          name: dh.name,
          groupId: groupId,
          emoji: dh.emoji,
          frequency: "daily",
          sortOrder: sortOrderHabit++,
          currentStreak: 0,
          bestStreak: 0,
          totalCompletions: 0,
          completedDays: {}
        };
        const habitRef = doc(db, "users", userId, "groups", groupId, "habits", habitId);
        batch.set(habitRef, { ...newHabit, createdAt: Timestamp.now() });
      }
    }
    
    await batch.commit();
  }
}
