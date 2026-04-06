import { UserProfile, DatabaseService, Group, Habit } from "./DatabaseService";
import { Timestamp } from "firebase/firestore";

export class RoutineGeneratorService {
  /**
   * Generates a fully custom routine by mimicking an AI pipeline using deterministic rules.
   * Based on the user's focusArea, struggle, fitnessGoal, activityLevel, wakeTime, sleepTarget.
   */
  public static async generateCustomRoutine(userId: string, profile: UserProfile): Promise<void> {
    const db = DatabaseService.getInstance();
    
    // Accumulate draft groups and habits
    interface DraftGroup {
      name: string;
      emoji: string;
      themeColor: Group["themeColor"];
      habits: { name: string; emoji: string }[];
    }
    
    const draftGroups: DraftGroup[] = [];

    // 1. Morning Momentum
    const morning: DraftGroup = {
      name: "Morning Momentum",
      emoji: "🌅",
      themeColor: "orange",
      habits: [
        { name: "Make the bed", emoji: "🛏️" },
        { name: "Drink a glass of water", emoji: "💧" }
      ]
    };
    
    if (profile.struggle === "focus" || profile.struggle === "overwhelm") {
      morning.habits.push({ name: "10-Min Mindfulness/Meditation", emoji: "🧘" });
    }
    if (profile.struggle === "motivation") {
      morning.habits.push({ name: "Review long-term goals (1m)", emoji: "🎯" });
    }
    draftGroups.push(morning);
    
    // 2. Focus & Work
    const focus: DraftGroup = {
      name: profile.focusArea === "learning" ? "Learning & Growth" : 
            profile.focusArea === "career" ? "Career & Deep Work" : "Daily Focus",
      emoji: profile.focusArea === "learning" ? "📚" : "💻",
      themeColor: "blue",
      habits: []
    };
    
    if (profile.struggle === "procrastination") {
      focus.habits.push({ name: "Eat the Frog (Do hardest task first)", emoji: "🐸" });
    } else {
      focus.habits.push({ name: "Identify Top 3 Priorities", emoji: "📝" });
    }
    
    if (profile.focusArea === "learning") {
      focus.habits.push({ name: "Read 10 pages", emoji: "📖" });
      focus.habits.push({ name: "30m course progress", emoji: "🎓" });
    } else if (profile.focusArea === "career") {
      focus.habits.push({ name: "90m Deep Work Block", emoji: "🛠️" });
      focus.habits.push({ name: "Inbox zero", emoji: "📧" });
    } else if (profile.focusArea === "finance") {
      focus.habits.push({ name: "Log daily expenses", emoji: "🧾" });
      focus.habits.push({ name: "No-spend day", emoji: "💰" });
    }
    
    if (focus.habits.length > 0) {
      draftGroups.push(focus);
    }
    
    // 3. Fitness & Body
    const fitness: DraftGroup = {
      name: "Body & Health",
      emoji: "💪",
      themeColor: "red",
      habits: []
    };
    
    if (profile.fitnessGoal === "muscle") {
      fitness.habits.push({ name: "Strength Training Block", emoji: "🏋️" });
      fitness.habits.push({ name: "Hit daily protein target", emoji: "🥩" });
    } else if (profile.fitnessGoal === "fat_loss") {
      fitness.habits.push({ name: "Hit 10k Steps", emoji: "🚶" });
      fitness.habits.push({ name: "Stay in caloric deficit", emoji: "🥗" });
    } else {
      fitness.habits.push({ name: "20m Active Movement", emoji: "🏃" });
    }
    
    if (profile.activityLevel === "sedentary") {
      fitness.habits.push({ name: "15m stretching break", emoji: "🧘" });
    }
    
    if (profile.dietaryPreference === "vegan" || profile.dietaryPreference === "vegetarian") {
      fitness.habits.push({ name: "Take B12/Iron supplement", emoji: "💊" });
    }
    draftGroups.push(fitness);
    
    // 4. Evening Wind-Down
    const evening: DraftGroup = {
      name: "Evening Wind-Down",
      emoji: "🌙",
      themeColor: "purple",
      habits: [
        { name: "No caffeine after 2 PM", emoji: "☕" },
        { name: "Screens off 45m before bed", emoji: "📱" }
      ]
    };
    
    if (profile.struggle === "overwhelm" || profile.struggle === "forgetting") {
      evening.habits.push({ name: "Layout clothes for tomorrow", emoji: "👕" });
      evening.habits.push({ name: "5-Min Brain Dump", emoji: "🧠" });
    }
    
    draftGroups.push(evening);
    
    // Create the DB items via Batch to avoid UI flicker
    // We increment sortOrder so they sit neatly together
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
      await db.addGroup(userId, newGroup);
      
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
        await db.addHabit(userId, groupId, newHabit);
      }
    }
  }
}
