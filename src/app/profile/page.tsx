"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { DatabaseService, UserProfile } from "@/services/DatabaseService";
import { RoutineGeneratorService } from "@/services/RoutineGeneratorService";
import { NotificationService } from "@/services/NotificationService";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./profile.module.css";
import { cn } from "@/lib/utils";

const FOCUS_LABELS: Record<string, string> = {
  health: "Health & Fitness",
  career: "Career & Work",
  learning: "Learning & Skills",
  relationships: "Relationships",
  finance: "Finance & Money",
  wellness: "Me-time & Wellness",
};

const ROLE_LABELS: Record<string, string> = {
  building_habits: "Building new habits",
  getting_structured: "Getting more structured",
  fixing_routine: "Fixing my routine",
};

const STRUGGLE_LABELS: Record<string, string> = {
  procrastination: "Procrastination",
  focus: "Losing Focus",
  forgetting: "Forgetting",
  overwhelm: "Feeling Overwhelmed",
  motivation: "Low Motivation",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary (Desk Job)",
  light: "Lightly Active",
  moderate: "Moderately Active",
  active: "Very Active",
  athlete: "Athlete",
};

const DIET_LABELS: Record<string, string> = {
  none: "No Preference",
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  keto: "Keto",
  paleo: "Paleo",
};

const FITNESS_LABELS: Record<string, string> = {
  muscle: "Build Muscle",
  fat_loss: "Lose Fat",
  endurance: "Endurance",
  general_health: "General Health",
};

const REMINDER_LABELS: Record<string, string> = {
  none: "No Reminders",
  daily: "Once a day (Gentle Nudge)",
  morning_evening: "Morning & Evening (Start/End)",
  intensive: "Every 4 Hours (Intensive)",
};

export const ALL_BADGES = [
  { id: "7_day_streak", icon: "🔥", title: "7-Day Streak", desc: "Completed a habit 7 days in a row" },
  { id: "30_day_legend", icon: "🏆", title: "30-Day Legend", desc: "Completed a habit 30 days in a row" },
  { id: "perfect_week", icon: "💎", title: "Perfect Week", desc: "Completed all habits every day Mon-Sun" },
  { id: "early_bird", icon: "🌅", title: "Early Bird", desc: "Habit done before 8 AM for 5 days" },
  { id: "century_club", icon: "💯", title: "Century Club", desc: "Total 100 habit completions" },
  { id: "monk_in_progress", icon: "🧘", title: "Monk in Progress", desc: "Used the app 14 days" },
  { id: "comeback_kid", icon: "⚡", title: "Comeback Kid", desc: "Returned after missing 3+ days" },
];

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [rerollingAvatar, setRerollingAvatar] = useState(false);
  
  // Generator States
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");

  // Edit States
  const [editAge, setEditAge] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editStruggle, setEditStruggle] = useState("");
  const [editFocusArea, setEditFocusArea] = useState("");
  const [editWakeTime, setEditWakeTime] = useState("");
  const [editSleepTarget, setEditSleepTarget] = useState("");
  const [editFitnessGoal, setEditFitnessGoal] = useState("");
  const [editActivityLevel, setEditActivityLevel] = useState("");
  const [editDietaryPref, setEditDietaryPref] = useState("");
  const [editReminderFrequency, setEditReminderFrequency] = useState("");

  const [enablingPush, setEnablingPush] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    DatabaseService.getInstance()
      .getUserProfile(user.uid)
      .then((p) => {
        if (p) {
          setProfile(p);
          populateEditStates(p);
        }
      })
      .catch(console.error)
      .finally(() => setProfileLoading(false));
  }, [user]);

  const populateEditStates = (p: UserProfile) => {
    setEditAge(p.age?.toString() ?? "");
    setEditHeight(p.height?.toString() ?? "");
    setEditWeight(p.weight?.toString() ?? "");
    setEditRole(p.role ?? "");
    setEditStruggle(p.struggle ?? "");
    setEditFocusArea(p.focusArea ?? "");
    setEditWakeTime(p.wakeTime ?? "");
    setEditSleepTarget(p.sleepTarget?.toString() ?? "");
    setEditFitnessGoal(p.fitnessGoal ?? "");
    setEditActivityLevel(p.activityLevel ?? "");
    setEditDietaryPref(p.dietaryPreference ?? "");
    setEditReminderFrequency(p.reminderFrequency ?? "none");
  };

  if (loading || profileLoading) {
    return (
      <div className={styles.loadingScreen}>
        <span className={styles.spinner} />
      </div>
    );
  }

  if (!user || !profile) return null;

  const handleSave = async () => {
    setSaveError("");
    setSaving(true);
    try {
      const updates: Partial<UserProfile> = {
        age: editAge ? Number(editAge) : undefined,
        height: editHeight ? Number(editHeight) : undefined,
        weight: editWeight ? Number(editWeight) : undefined,
        role: editRole || undefined,
        struggle: editStruggle || undefined,
        focusArea: editFocusArea || undefined,
        wakeTime: editWakeTime || undefined,
        sleepTarget: editSleepTarget ? Number(editSleepTarget) : undefined,
        fitnessGoal: editFitnessGoal || undefined,
        activityLevel: editActivityLevel || undefined,
        dietaryPreference: editDietaryPref || undefined,
        reminderFrequency: (editReminderFrequency as "none" | "daily" | "morning_evening" | "intensive") || undefined,
      };

      await DatabaseService.getInstance().updateUserProfile(user.uid, updates);
      setProfile((p) => p ? { ...p, ...updates } : p);
      setIsEditing(false);
    } catch (e) {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRerollAvatar = async () => {
    if (!user || rerollingAvatar) return;
    setRerollingAvatar(true);
    const newSeed = Math.random().toString(36).substring(2, 10);
    // Focus heavily on adventurer and micah as they produce the best cartoon/character shapes
    const stylesOpt = ["adventurer", "micah", "bottts", "notionists", "avataaars"];
    const newStyle = stylesOpt[Math.floor(Math.random() * stylesOpt.length)];
    
    try {
      await DatabaseService.getInstance().updateUserProfile(user.uid, {
        avatarSeed: newSeed,
        avatarStyle: newStyle as "adventurer" | "micah" | "bottts" | "notionists"
      });
      setProfile(p => p ? { ...p, avatarSeed: newSeed, avatarStyle: newStyle as "adventurer" | "micah" | "bottts" | "notionists" } : p);
    } catch {
      // ignore
    } finally {
      setRerollingAvatar(false);
    }
  };

  const handleEnablePush = async () => {
    if (!user) return;
    setEnablingPush(true);
    try {
      const token = await NotificationService.enablePushNotifications(user.uid);
      if (token && profile) {
         setProfile({ ...profile, fcmToken: token, reminderFrequency: (editReminderFrequency as "none" | "daily" | "morning_evening" | "intensive") || "daily" });
         setEditReminderFrequency("daily");
      }
    } finally {
      setEnablingPush(false);
    }
  };

  const handleGenerateRoutine = async () => {
    if (!user || !profile || generating) return;
    setGenerating(true);
    
    try {
      setGenerationStep("Analyzing profile metrics...");
      await new Promise(r => setTimeout(r, 800));
      
      setGenerationStep("Building Morning Momentum...");
      await new Promise(r => setTimeout(r, 700));
      
      setGenerationStep("Mapping Fitness Goals...");
      await new Promise(r => setTimeout(r, 700));
      
      setGenerationStep("Finalizing Planner...");
      await RoutineGeneratorService.generateCustomRoutine(user.uid, profile);
      
      router.push("/planner");
    } catch (e: unknown) {
      setSaveError("Failed to generate routine. Try again.");
      setGenerating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const avatarStyle = profile.avatarStyle || "adventurer";
  const avatarSeed = profile.avatarSeed || user.uid;
  const avatarUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  return (
    <div className={styles.root}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <Link href="/planner" className={styles.backLink}>
          ← Planner
        </Link>
        <div style={{ flex: 1 }} />
        {!isEditing ? (
            <button className={styles.editBtn} onClick={() => { populateEditStates(profile); setIsEditing(true); }}>Edit Profile</button>
        ) : (
            <div className={styles.editActions}>
              <button className={styles.cancelBtn} onClick={() => { setIsEditing(false); setSaveError(""); }}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
        )}
      </header>

      <main className={styles.main}>
        {/* Avatar + name section */}
        <div className={styles.avatarRow}>
          <div className={styles.avatarCol}>
            <div className={styles.avatarWrap}>
              <img
                src={avatarUrl}
                alt="avatar"
                className={styles.avatar}
              />
            </div>
            <button 
              className={styles.rerollBtn} 
              onClick={handleRerollAvatar}
              disabled={rerollingAvatar}
            >
              ⟳ Reroll Avatar
            </button>
          </div>
          <div>
            <h1 className={styles.profileName}>{profile.name || "User"}</h1>
            <p className={styles.profileEmail}>{user.email}</p>
          </div>
        </div>

        {saveError && <p className={styles.saveError} style={{marginBottom: "20px"}}>{saveError}</p>}
        <div className={styles.divider} style={{marginTop: 0}} />

        {/* Generate Custom Routine Banner */}
        {!isEditing && (
            <div className={styles.generateBanner}>
                <div className={styles.genContent}>
                    <h3 className={styles.genTitle}>✨ Build My Smart Routine</h3>
                    <p className={styles.genDesc}>Our smart engine will analyze your lifestyle metrics to construct a personalized plan. Be sure to edit your profile below first!</p>
                </div>
                <button 
                  className={styles.genBtn} 
                  onClick={handleGenerateRoutine}
                  disabled={generating}
                >
                  {generating ? (
                    <><span className={styles.spinner} style={{width: 14, height: 14, borderLeftColor: "#111", borderBottomColor: "#111", borderRightColor: "#111", borderTopColor: "transparent" }} /> {generationStep}</>
                  ) : "Generate Plan →"}
                </button>
            </div>
        )}

        {/* Journey snapshot */}
        <section className={styles.section} style={{ marginBottom: "24px" }}>
          <p className={styles.sectionLabel}>Your Journey</p>
          {isEditing ? (
            <div className={styles.editGrid}>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Here To</label>
                <select className={styles.editSelect} value={editRole} onChange={e => setEditRole(e.target.value)}>
                  <option value="">Select...</option>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Goal Focus</label>
                <select className={styles.editSelect} value={editFocusArea} onChange={e => setEditFocusArea(e.target.value)}>
                  <option value="">Select...</option>
                  {Object.entries(FOCUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>Main Struggle</label>
                <select className={styles.editSelect} value={editStruggle} onChange={e => setEditStruggle(e.target.value)}>
                  <option value="">Select...</option>
                  {Object.entries(STRUGGLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className={styles.infoGrid} style={{ marginBottom: "16px" }}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Here to</span>
                <span className={styles.infoValue}>{ROLE_LABELS[profile.role || ""] ?? profile.role ?? "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Focus area</span>
                <span className={styles.infoValue}>{FOCUS_LABELS[profile.focusArea || ""] ?? profile.focusArea ?? "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Main Struggle</span>
                <span className={styles.infoValue}>{STRUGGLE_LABELS[profile.struggle || ""] ?? profile.struggle ?? "—"}</span>
              </div>
            </div>
          )}
        </section>

        {/* Daily Rhythm */}
        <section className={styles.section} style={{ marginBottom: "24px" }}>
          <p className={styles.sectionLabel}>Daily Rhythm</p>
          {isEditing ? (
             <div className={styles.editGrid}>
                <div className={styles.editField}>
                  <label className={styles.editLabel}>Wake Time</label>
                  <input className={styles.editInput} type="time" value={editWakeTime} onChange={(e) => setEditWakeTime(e.target.value)} />
                </div>
                <div className={styles.editField}>
                  <label className={styles.editLabel}>Target Sleep <span className={styles.unit}>hrs</span></label>
                  <input className={styles.editInput} type="number" step="0.5" min="4" max="14" placeholder="8" value={editSleepTarget} onChange={(e) => setEditSleepTarget(e.target.value)} />
                </div>
             </div>
          ) : (
            <div className={styles.infoGrid} style={{ marginBottom: "16px" }}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Day starts at</span>
                <span className={styles.infoValue}>{profile.wakeTime || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Target Sleep</span>
                <span className={styles.infoValue}>{profile.sleepTarget ? `${profile.sleepTarget} hrs` : "—"}</span>
              </div>
            </div>
          )}
        </section>

        {/* Body & Health */}
        <section className={styles.section} style={{ marginBottom: "24px" }}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>Body & Health</p>
          </div>

          {isEditing ? (
            <div className={styles.editGridFull}>
               <div className={styles.editGrid} style={{ marginBottom: 0 }}>
                  <div className={styles.editField}>
                    <label className={styles.editLabel}>Age <span className={styles.unit}>yrs</span></label>
                    <input className={styles.editInput} type="number" min="10" max="120" placeholder="25" value={editAge} onChange={(e) => setEditAge(e.target.value)} />
                  </div>
                  <div className={styles.editField}>
                    <label className={styles.editLabel}>Height <span className={styles.unit}>cm</span></label>
                    <input className={styles.editInput} type="number" min="50" max="300" placeholder="170" value={editHeight} onChange={(e) => setEditHeight(e.target.value)} />
                  </div>
                  <div className={styles.editField}>
                    <label className={styles.editLabel}>Weight <span className={styles.unit}>kg</span></label>
                    <input className={styles.editInput} type="number" min="20" max="300" placeholder="70" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} />
                  </div>
               </div>
               
               <div className={styles.editGrid} style={{ marginBottom: 0 }}>
                  <div className={styles.editField}>
                    <label className={styles.editLabel}>Fitness Goal</label>
                    <select className={styles.editSelect} value={editFitnessGoal} onChange={e => setEditFitnessGoal(e.target.value)}>
                      <option value="">Select...</option>
                      {Object.entries(FITNESS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className={styles.editField}>
                    <label className={styles.editLabel}>Activity Level</label>
                    <select className={styles.editSelect} value={editActivityLevel} onChange={e => setEditActivityLevel(e.target.value)}>
                      <option value="">Select...</option>
                      {Object.entries(ACTIVITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className={styles.editField}>
                    <label className={styles.editLabel}>Dietary Preference</label>
                    <select className={styles.editSelect} value={editDietaryPref} onChange={e => setEditDietaryPref(e.target.value)}>
                      <option value="">Select...</option>
                      {Object.entries(DIET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
               </div>
            </div>
          ) : (
            <div className={styles.editGridFull}>
               <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Age</span>
                    <span className={styles.infoValue}>{profile.age ? `${profile.age} yrs` : "—"}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Height</span>
                    <span className={styles.infoValue}>{profile.height ? `${profile.height} cm` : "—"}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Weight</span>
                    <span className={styles.infoValue}>{profile.weight ? `${profile.weight} kg` : "—"}</span>
                  </div>
               </div>

               <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Fitness Goal</span>
                    <span className={styles.infoValue}>{FITNESS_LABELS[profile.fitnessGoal || ""] ?? profile.fitnessGoal ?? "—"}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Activity Level</span>
                    <span className={styles.infoValue}>{ACTIVITY_LABELS[profile.activityLevel || ""] ?? profile.activityLevel ?? "—"}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Dietary Pref</span>
                    <span className={styles.infoValue}>{DIET_LABELS[profile.dietaryPreference || ""] ?? profile.dietaryPreference ?? "—"}</span>
                  </div>
               </div>
            </div>
          )}
        </section>

        <div className={styles.divider} />

        {/* Push Reminders Area */}
        <section className={styles.section} style={{ marginBottom: "24px" }}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>App Settings & Reminders</p>
          </div>
          
          <div className={styles.editGridFull}>
             {isEditing ? (
                <div className={styles.editField}>
                   <label className={styles.editLabel}>Nudge Frequency</label>
                   <select className={styles.editSelect} value={editReminderFrequency} onChange={e => setEditReminderFrequency(e.target.value)}>
                      {Object.entries(REMINDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                   </select>
                   <p className={styles.unit} style={{marginTop: 4}}>Set how often our smart coach checks in with you.</p>
                </div>
             ) : (
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Nudge Frequency</span>
                    <span className={styles.infoValue}>{REMINDER_LABELS[profile.reminderFrequency || "none"] ?? "No Reminders"}</span>
                  </div>
                </div>
             )}

             {(!profile.fcmToken || profile.fcmToken === "") && !isEditing && (
                <button 
                  className={styles.genBtn} 
                  style={{marginTop: 12, background: "rgba(99, 102, 241, 0.1)", color: "#6366f1", border: "1px solid rgba(99, 102, 241, 0.2)"}}
                  onClick={handleEnablePush}
                  disabled={enablingPush}
                >
                   {enablingPush ? "Enabling..." : "🔔 Enable Mobile Push Notifications"}
                </button>
             )}
          </div>
        </section>

        <div className={styles.divider} />

        {/* My Badges */}
        <section className={styles.section} style={{ marginBottom: "24px" }}>
          <p className={styles.sectionLabel}>My Badges</p>
          <div className={styles.badgeGrid}>
            {ALL_BADGES.map(badge => {
              const isEarned = profile.badges?.includes(badge.id);
              return (
                <div 
                  key={badge.id} 
                  className={cn(styles.badgeCard, isEarned ? styles.badgeEarned : styles.badgeLocked)}
                >
                  <span className={styles.badgeIcon}>
                    {badge.icon}
                    {!isEarned && <span className={styles.lockIcon}>🔒</span>}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span className={styles.badgeTitle}>{badge.title}</span>
                    <span className={styles.badgeDesc}>{badge.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className={styles.divider} />

        {/* Sign out */}
        <section className={styles.section}>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            Sign out
          </button>
        </section>
      </main>
    </div>
  );
}
