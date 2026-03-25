// Level Definitions based on the MonkGrid Master Prompt
export const LEVEL_THRESHOLDS = [
  { level: 1, title: "Monk Rookie", minXP: 0 },
  { level: 2, title: "Monk Apprentice", minXP: 200 },
  { level: 3, title: "Monk Pro", minXP: 500 },
  { level: 4, title: "Monk Expert", minXP: 1000 },
  { level: 5, title: "Monk Master", minXP: 2000 },
  { level: 6, title: "Monk Legend", minXP: 4000 },
];

export const XP_REWARDS = {
  HABIT_COMPLETION: 10,
  EXCEEDED_GOAL: 20,       // Double tap (Prompt specifies 20XP for exceeded in general rules)
  PERFECT_DAY: 25,         // All habits in a day
  STREAK_7_DAY: 50,
  STREAK_30_DAY: 150,
};

export class GamificationService {
  /**
   * Determine the current level title and index based on total XP
   */
  static getCurrentLevel(totalXP: number) {
    // Traverse backwards to find the highest level threshold met
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalXP >= LEVEL_THRESHOLDS[i].minXP) {
        return LEVEL_THRESHOLDS[i];
      }
    }
    return LEVEL_THRESHOLDS[0];
  }

  /**
   * Calculate progress to the next level
   */
  static getLevelProgress(totalXP: number) {
    const current = this.getCurrentLevel(totalXP);
    const currentIdx = LEVEL_THRESHOLDS.findIndex(l => l.level === current.level);
    
    // If max level reached
    if (currentIdx === LEVEL_THRESHOLDS.length - 1) {
      return {
        currentXPInLevel: totalXP - current.minXP,
        xpRequiredForNext: 0,
        percentage: 100,
        nextLevelTitle: "Max Level"
      };
    }

    const next = LEVEL_THRESHOLDS[currentIdx + 1];
    const xpRequiredForNext = next.minXP - current.minXP;
    const currentXPInLevel = totalXP - current.minXP;
    const percentage = Math.min(100, Math.max(0, (currentXPInLevel / xpRequiredForNext) * 100));

    return {
      currentXPInLevel,
      xpRequiredForNext,
      percentage,
      nextLevelTitle: next.title
    };
  }

  /**
   * Check if a new level threshold just crossed
   */
  static didLevelUp(oldXP: number, newXP: number): boolean {
    const oldLevel = this.getCurrentLevel(oldXP).level;
    const newLevel = this.getCurrentLevel(newXP).level;
    return newLevel > oldLevel;
  }
}
