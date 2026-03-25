import { Habit, UserProfile } from "@/services/DatabaseService";

/**
 * Transforms the visual habit grid into a text-based format Gemini can "read"
 * e.g. 
 * Routine: Read Book
 * Last 14 days (Oldest to Newest): [Missed, Done, Done, Missed...]
 */
export function buildHabitMatrixString(habits: Habit[], days: string[]): string {
  if (!habits || habits.length === 0) return "No habits tracked yet.";

  let matrixText = "HABIT COMPLETION HISTORY (Past 14 Days, Oldest to Newest):\n";
  
  habits.forEach(habit => {
    matrixText += `- ${habit.name}: [`;
    const streakData = days.map(dayStr => habit.completedDays?.[dayStr] ? 'DONE' : 'MISSED');
    matrixText += streakData.join(", ") + "]\n";
  });

  return matrixText;
}

export function buildUserProfileContext(profile: UserProfile): string {
  const age = profile.age ? `${profile.age} years old` : "Unknown age";
  const height = profile.height ? `${profile.height} cm` : "Unknown height";
  const weight = profile.weight ? `${profile.weight} kg` : "Unknown weight";
  const bmiStr = (profile.height && profile.weight) 
    ? `(BMI roughly: ${(profile.weight / ((profile.height/100)*(profile.height/100))).toFixed(1)})` 
    : "";

  return `
USER PROFILE:
- Age: ${age}
- Height/Weight: ${height}, ${weight} ${bmiStr}
- Primary Intent/Role: ${profile.role || "improving lifestyle"}
- Biggest Struggle: ${profile.struggle || "consistency"}
- Focus Area: ${profile.focusArea || "general wellbeing"}
- Day Starts At: ${profile.wakeTime || "morning"}
`;
}
