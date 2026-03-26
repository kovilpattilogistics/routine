"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DatabaseService, UserProfile } from "@/services/DatabaseService";
import styles from "./onboarding.module.css";

// ── Data ───────────────────────────────────────────────────────────────
const ROLES = [
  { value: "building_habits", emoji: "🌱", title: "Build new habits", sub: "Starting from scratch, one step at a time" },
  { value: "getting_structured", emoji: "🗂️", title: "Get more structured", sub: "Turn the chaos into a clear, calm system" },
  { value: "fixing_routine", emoji: "🔧", title: "Fix my routine", sub: "I have habits but can't make them stick" },
] as const;

const STRUGGLES = [
  { value: "procrastination", emoji: "⏸️", label: "Procrastination" },
  { value: "focus", emoji: "🎯", label: "Losing Focus" },
  { value: "forgetting", emoji: "🧠", label: "Forgetting" },
  { value: "overwhelm", emoji: "🌊", label: "Feeling Overwhelmed" },
  { value: "motivation", emoji: "🔋", label: "Low Motivation" },
] as const;

const FOCUS_AREAS = [
  { value: "health", emoji: "💪", label: "Health & Fitness" },
  { value: "career", emoji: "💼", label: "Career & Work" },
  { value: "learning", emoji: "📚", label: "Learning & Skills" },
  { value: "relationships", emoji: "🤝", label: "Relationships" },
  { value: "finance", emoji: "💰", label: "Finance & Money" },
  { value: "wellness", emoji: "🌿", label: "Me-time & Wellness" },
] as const;

const TOTAL_STEPS = 6;

// ── Component ──────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Answers
  const [role, setRole] = useState<string>("");
  const [struggle, setStruggle] = useState<string>("");
  // Physical details
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [physicalError, setPhysicalError] = useState("");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [focusArea, setFocusArea] = useState<string>("");
  const [firstTask, setFirstTask] = useState("");
  const [taskCategory, setTaskCategory] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) return null;
  if (!user) return null;

  const progress = (step / TOTAL_STEPS) * 100;

  const advance = (nextStep: number) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 220);
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const profileUpdate: Partial<UserProfile> = {
      role: role as any,
      struggle: struggle as any,
      wakeTime,
      focusArea,
      onboardingComplete: true,
      ...(age ? { age: Number(age) } : {}),
      ...(heightCm ? { height: Number(heightCm) } : {}),
      ...(weightKg ? { weight: Number(weightKg) } : {}),
    };

    try {
      // Try to update profile; fall back to create if it doesn't exist
      try {
        await DatabaseService.getInstance().updateUserProfile(user.uid, profileUpdate);
      } catch {
        await DatabaseService.getInstance().createUserProfile(user.uid, profileUpdate);
      }

      // Initialize default groups first to ensure the hierarchy exists
      await DatabaseService.getInstance().initDefaultGroups(user.uid);
      
      // Add first task as a habit if provided
      if (firstTask.trim()) {
        const groups = await DatabaseService.getInstance().getGroups(user.uid);
        const targetGroupId = groups[0]?.id; // Put in the first group (e.g., Gym or Wellness)
        
        if (targetGroupId) {
          const habit = { 
            id: Date.now().toString(), 
            name: firstTask.trim(), 
            groupId: targetGroupId,
            emoji: "✨",
            frequency: 'daily' as const,
            sortOrder: 0,
            completedDays: {} 
          };
          await DatabaseService.getInstance().addHabit(user.uid, targetGroupId, habit);
        }
      }
    } catch (e) {
      console.error("Onboarding save error:", e);
      // Don't block the user — mark complete and continue
      try { await DatabaseService.getInstance().updateUserProfile(user.uid, { onboardingComplete: true }); } catch {}
    } finally {
      setSubmitting(false);
      router.push("/planner");
    }
  };

  return (
    <div className={styles.root}>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Step counter */}
      <div className={styles.stepLabel}>{step} of {TOTAL_STEPS}</div>

      {/* Screen content */}
      <div className={`${styles.screen} ${animating ? styles.screenExit : styles.screenEnter}`}>

        {/* ── SCREEN 1: Role ── */}
        {step === 1 && (
          <div className={styles.screenInner}>
            <h1 className={styles.question}>What brings you here?</h1>
            <p className={styles.hint}>We'll personalise your planner around your answer.</p>
            <div className={styles.cardGrid}>
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`${styles.roleCard} ${role === r.value ? styles.roleCardActive : ""}`}
                  onClick={() => { setRole(r.value); advance(2); }}
                >
                  <span className={styles.roleEmoji}>{r.emoji}</span>
                  <span className={styles.roleTitle}>{r.title}</span>
                  <span className={styles.roleSub}>{r.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── SCREEN 2: Struggle ── */}
        {step === 2 && (
          <div className={styles.screenInner}>
            <h1 className={styles.question}>What holds you back most?</h1>
            <p className={styles.hint}>Pick the one that resonates. Honest answer works best.</p>
            <div className={styles.chipGrid}>
              {STRUGGLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={`${styles.chip} ${struggle === s.value ? styles.chipActive : ""}`}
                  onClick={() => { setStruggle(s.value); advance(3); }}
                >
                  <span className={styles.chipEmoji}>{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
            <button className={styles.backBtn} onClick={() => advance(1)}>← Back</button>
          </div>
        )}

        {/* ── SCREEN 3: Physical Details ── */}
        {step === 3 && (
          <div className={styles.screenInner}>
            <h1 className={styles.question}>Tell us about yourself</h1>
            <p className={styles.hint}>We use this to personalise your routine goals. All fields are optional.</p>
            <div className={styles.physicalGrid}>
              <div className={styles.physicalField}>
                <label className={styles.physicalLabel}>Age</label>
                <div className={styles.physicalInputWrap}>
                  <input className={styles.physicalInput} type="number" placeholder="25" min="10" max="120" value={age} onChange={(e) => setAge(e.target.value)} />
                  <span className={styles.physicalUnit}>yrs</span>
                </div>
              </div>
              <div className={styles.physicalField}>
                <label className={styles.physicalLabel}>Height</label>
                <div className={styles.physicalInputWrap}>
                  <input className={styles.physicalInput} type="number" placeholder="170" min="50" max="300" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
                  <span className={styles.physicalUnit}>cm</span>
                </div>
              </div>
              <div className={styles.physicalField}>
                <label className={styles.physicalLabel}>Weight</label>
                <div className={styles.physicalInputWrap}>
                  <input className={styles.physicalInput} type="number" placeholder="70" min="20" max="300" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
                  <span className={styles.physicalUnit}>kg</span>
                </div>
              </div>
            </div>
            {physicalError && <p className={styles.fieldError}>{physicalError}</p>}
            <div className={styles.navRow}>
              <button className={styles.backBtn} onClick={() => advance(2)}>← Back</button>
              <button className={styles.nextBtn} onClick={() => {
                setPhysicalError("");
                if (age && (Number(age) < 10 || Number(age) > 120)) { setPhysicalError("Enter a valid age."); return; }
                if (heightCm && (Number(heightCm) < 50 || Number(heightCm) > 300)) { setPhysicalError("Enter height in cm (50–300)."); return; }
                if (weightKg && (Number(weightKg) < 20 || Number(weightKg) > 300)) { setPhysicalError("Enter weight in kg (20–300)."); return; }
                advance(4);
              }}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── SCREEN 4: Wake time ── */}
        {step === 4 && (
          <div className={styles.screenInner}>
            <h1 className={styles.question}>When does your day begin?</h1>
            <p className={styles.hint}>We'll schedule your first task here so you start strong.</p>
            <div className={styles.timePickerWrap}>
              <div className={styles.timeDisplay}>{wakeTime}</div>
              <input className={styles.timeSlider} type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
              <p className={styles.timeHint}>
                {parseInt(wakeTime) < 6 ? "🌙 You're an early riser! Impressive." :
                  parseInt(wakeTime) < 9 ? "🌅 Morning person — great for deep work." :
                  parseInt(wakeTime) < 12 ? "☀️ Mid-morning start — solid rhythm." :
                  "🌃 Night owl — we'll plan your day accordingly."}
              </p>
            </div>
            <div className={styles.navRow}>
              <button className={styles.backBtn} onClick={() => advance(3)}>← Back</button>
              <button className={styles.nextBtn} onClick={() => advance(5)}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── SCREEN 5: Focus area ── */}
        {step === 5 && (
          <div className={styles.screenInner}>
            <h1 className={styles.question}>Which area needs the most love?</h1>
            <p className={styles.hint}>This becomes your primary focus in the planner.</p>
            <div className={styles.tileGrid}>
              {FOCUS_AREAS.map((f) => (
                <button key={f.value} type="button"
                  className={`${styles.tile} ${focusArea === f.value ? styles.tileActive : ""}`}
                  onClick={() => { setFocusArea(f.value); advance(6); }}
                >
                  <span className={styles.tileEmoji}>{f.emoji}</span>
                  <span className={styles.tileLabel}>{f.label}</span>
                </button>
              ))}
            </div>
            <button className={styles.backBtn} onClick={() => advance(4)}>← Back</button>
          </div>
        )}

        {/* ── SCREEN 6: First task ── */}
        {step === 6 && (
          <form className={styles.screenInner} onSubmit={handleFinish}>
            <h1 className={styles.question}>Set your first task.</h1>
            <p className={styles.hint}>Leave here with something created — your activation moment.</p>
            <div className={styles.taskInputWrap}>
              <input className={styles.taskInput} type="text" placeholder="e.g. Drink 8 glasses of water" value={firstTask} onChange={(e) => setFirstTask(e.target.value)} autoFocus />
              <select className={styles.taskCategory} value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)}>
                <option value="">Category (optional)</option>
                {FOCUS_AREAS.map((f) => <option key={f.value} value={f.value}>{f.emoji} {f.label}</option>)}
              </select>
            </div>
            <div className={styles.navRow}>
              <button type="button" className={styles.backBtn} onClick={() => advance(5)}>← Back</button>
              <button type="submit" className={styles.doneBtn} disabled={submitting}>
                {submitting ? <span className={styles.spinner} /> : null}
                {submitting ? "Setting up…" : "Let's go 🚀"}
              </button>
            </div>
            {!firstTask.trim() && (
              <button type="submit" className={styles.skipLink} disabled={submitting}>Skip for now</button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
