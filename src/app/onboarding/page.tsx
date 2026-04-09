"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DatabaseService, UserProfile } from "@/services/DatabaseService";
import styles from "./onboarding.module.css";

// ── Data ───────────────────────────────────────────────────────────────
const PRIMARY_DRIVERS = [
  { value: "peace", emoji: "🧘", title: "Mental Peace & Healing", sub: "I need calm and simple daily wins" },
  { value: "ambition", emoji: "🚀", title: "Ambition & Growth", sub: "I'm here to optimise and dominate" },
  { value: "survival", emoji: "🛟", title: "Survival & Structure", sub: "I just need to stop drowning in chaos" },
] as const;

const STRUGGLES = [
  { value: "procrastination", emoji: "⏸️", label: "Procrastination" },
  { value: "focus", emoji: "🎯", label: "Losing Focus" },
  { value: "forgetting", emoji: "🧠", label: "Forgetting" },
  { value: "overwhelm", emoji: "🌊", label: "Feeling Overwhelmed" },
  { value: "motivation", emoji: "🔋", label: "Low Motivation" },
] as const;

const CHRONOTYPES = [
  { value: "early_morning", emoji: "🌅", title: "Early Bird", sub: "Sharpest at 6 AM" },
  { value: "mid_day", emoji: "☀️", title: "Mid-Day Grinder", sub: "Steady pace from 10 to 4" },
  { value: "late_night", emoji: "🦉", title: "Night Owl", sub: "I come alive after 9 PM" },
] as const;

const FREE_TIMES = [
  { value: "under_1h", emoji: "⏱️", title: "Under 1 hour", sub: "Barely scraping by" },
  { value: "1_3h", emoji: "⏳", title: "1-3 hours", sub: "A moderate chunk of evening time" },
  { value: "over_3h", emoji: "🕰️", title: "3+ hours", sub: "Lots of free time to deploy" },
] as const;

const ENVIRONMENTS = [
  { value: "wfh", emoji: "🏠", title: "Work From Home", sub: "My desk is my dining table" },
  { value: "commuter", emoji: "🏢", title: "Commuter / Office", sub: "I have to physically go to work" },
  { value: "student", emoji: "🎒", title: "Student / Nomadic", sub: "Always shifting environments" },
] as const;

const HABIT_BASELINES = [
  { value: "struggle", emoji: "🧗", title: "I struggle to stick", sub: "I always quit around Day 4" },
  { value: "consistent", emoji: "🚶", title: "Somewhat consistent", sub: "I hit 50-70% of my goals" },
  { value: "optimizer", emoji: "📈", title: "Optimization freak", sub: "I want to track 15 things perfectly" },
] as const;

const FOCUS_AREAS = [
  { value: "health", emoji: "💪", label: "Health & Fitness" },
  { value: "career", emoji: "💼", label: "Career & Work" },
  { value: "learning", emoji: "📚", label: "Learning & Skills" },
  { value: "relationships", emoji: "🤝", label: "Relationships" },
  { value: "finance", emoji: "💰", label: "Finance & Money" },
  { value: "wellness", emoji: "🌿", label: "Me-time & Wellness" },
] as const;

const TOTAL_STEPS = 9;

// ── Component ──────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Answers
  const [primaryDriver, setPrimaryDriver] = useState<string>("");
  const [struggle, setStruggle] = useState<string>("");
  const [peakEnergy, setPeakEnergy] = useState<string>("");
  const [dailyFreeTime, setDailyFreeTime] = useState<string>("");
  const [workEnvironment, setWorkEnvironment] = useState<string>("");
  const [habitConsistency, setHabitConsistency] = useState<string>("");
  
  // Physical details
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [physicalError, setPhysicalError] = useState("");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [focusArea, setFocusArea] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const progress = (step / TOTAL_STEPS) * 100;

  const advance = (nextStep: number) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 220);
  };

  const handleFinish = async (
    e?: React.FormEvent | React.MouseEvent,
    overrideFocusArea?: string
  ) => {
    e?.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const profileUpdate: Partial<UserProfile> = {
      primaryDriver: primaryDriver as any,
      struggle: struggle as any,
      peakEnergy: peakEnergy as any,
      dailyFreeTime: dailyFreeTime as any,
      workEnvironment: workEnvironment as any,
      habitConsistency: habitConsistency as any,
      wakeTime,
      focusArea: overrideFocusArea || focusArea,
      onboardingComplete: true,
      ...(age ? { age: Number(age) } : {}),
      ...(heightCm ? { height: Number(heightCm) } : {}),
      ...(weightKg ? { weight: Number(weightKg) } : {}),
    };

    try {
      try {
        await DatabaseService.getInstance().updateUserProfile(user.uid, profileUpdate);
      } catch {
        await DatabaseService.getInstance().createUserProfile(user.uid, profileUpdate);
      }
    } catch (e) {
      console.error("Onboarding save error:", e);
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

        {/* ── SCREEN 1: Driver ── */}
        {step === 1 && (
          <div className={styles.screenInner}>
            <h1 className={styles.question}>What is your primary driver right now?</h1>
            <p className={styles.hint}>We will frame your habits around your actual goals.</p>
            <div className={styles.cardGrid}>
              {PRIMARY_DRIVERS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`${styles.roleCard} ${primaryDriver === r.value ? styles.roleCardActive : ""}`}
                  onClick={() => { setPrimaryDriver(r.value); advance(2); }}
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

        {/* ── SCREEN 3: Chronotype ── */}
        {step === 3 && (
          <div className={styles.screenInner}>
            <h1 className={styles.question}>When is your peak energy?</h1>
            <p className={styles.hint}>We will place your heaviest habits here.</p>
            <div className={styles.cardGrid}>
              {CHRONOTYPES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`${styles.roleCard} ${peakEnergy === r.value ? styles.roleCardActive : ""}`}
                  onClick={() => { setPeakEnergy(r.value); advance(4); }}
                >
                  <span className={styles.roleEmoji}>{r.emoji}</span>
                  <span className={styles.roleTitle}>{r.title}</span>
                  <span className={styles.roleSub}>{r.sub}</span>
                </button>
              ))}
            </div>
            <button className={styles.backBtn} onClick={() => advance(2)}>← Back</button>
          </div>
        )}

        {/* ── SCREEN 4: Bandwidth ── */}
        {step === 4 && (
          <div className={styles.screenInner}>
            <h1 className={styles.question}>How much free time do you realistically have?</h1>
            <p className={styles.hint}>Be brutally honest. High friction destroys new habits.</p>
            <div className={styles.cardGrid}>
              {FREE_TIMES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`${styles.roleCard} ${dailyFreeTime === r.value ? styles.roleCardActive : ""}`}
                  onClick={() => { setDailyFreeTime(r.value); advance(5); }}
                >
                  <span className={styles.roleEmoji}>{r.emoji}</span>
                  <span className={styles.roleTitle}>{r.title}</span>
                  <span className={styles.roleSub}>{r.sub}</span>
                </button>
              ))}
            </div>
            <button className={styles.backBtn} onClick={() => advance(3)}>← Back</button>
          </div>
        )}

        {/* ── SCREEN 5: Environment ── */}
        {step === 5 && (
          <div className={styles.screenInner}>
            <h1 className={styles.question}>Where do you spend most of your day?</h1>
            <p className={styles.hint}>We'll use this to build environmental triggers.</p>
            <div className={styles.cardGrid}>
              {ENVIRONMENTS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`${styles.roleCard} ${workEnvironment === r.value ? styles.roleCardActive : ""}`}
                  onClick={() => { setWorkEnvironment(r.value); advance(6); }}
                >
                  <span className={styles.roleEmoji}>{r.emoji}</span>
                  <span className={styles.roleTitle}>{r.title}</span>
                  <span className={styles.roleSub}>{r.sub}</span>
                </button>
              ))}
            </div>
            <button className={styles.backBtn} onClick={() => advance(4)}>← Back</button>
          </div>
        )}

        {/* ── SCREEN 6: Baseline ── */}
        {step === 6 && (
          <div className={styles.screenInner}>
            <h1 className={styles.question}>What is your current habit baseline?</h1>
            <p className={styles.hint}>This dictates how many habits we should assign you.</p>
            <div className={styles.cardGrid}>
              {HABIT_BASELINES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`${styles.roleCard} ${habitConsistency === r.value ? styles.roleCardActive : ""}`}
                  onClick={() => { setHabitConsistency(r.value); advance(7); }}
                >
                  <span className={styles.roleEmoji}>{r.emoji}</span>
                  <span className={styles.roleTitle}>{r.title}</span>
                  <span className={styles.roleSub}>{r.sub}</span>
                </button>
              ))}
            </div>
            <button className={styles.backBtn} onClick={() => advance(5)}>← Back</button>
          </div>
        )}

        {/* ── SCREEN 7: Physical Details ── */}
        {step === 7 && (
          <div className={styles.screenInner}>
            <h1 className={styles.question}>Tell us about your body</h1>
            <p className={styles.hint}>We use this to personalise physical metrics. All fields optional.</p>
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
              <button className={styles.backBtn} onClick={() => advance(6)}>← Back</button>
              <button className={styles.nextBtn} onClick={() => {
                setPhysicalError("");
                if (age && (Number(age) < 10 || Number(age) > 120)) { setPhysicalError("Enter a valid age."); return; }
                if (heightCm && (Number(heightCm) < 50 || Number(heightCm) > 300)) { setPhysicalError("Enter height in cm (50–300)."); return; }
                if (weightKg && (Number(weightKg) < 20 || Number(weightKg) > 300)) { setPhysicalError("Enter weight in kg (20–300)."); return; }
                advance(8);
              }}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── SCREEN 8: Wake time ── */}
        {step === 8 && (
          <div className={styles.screenInner}>
            <h1 className={styles.question}>When does your day begin?</h1>
            <p className={styles.hint}>We'll schedule your first task here.</p>
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
              <button className={styles.backBtn} onClick={() => advance(7)}>← Back</button>
              <button className={styles.nextBtn} onClick={() => advance(9)}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── SCREEN 9: Focus area ── */}
        {step === 9 && (
          <div className={styles.screenInner}>
            <h1 className={styles.question}>Which area needs the most love?</h1>
            <p className={styles.hint}>This determines the content category of your habits.</p>
            <div className={styles.tileGrid}>
              {FOCUS_AREAS.map((f) => (
                <button key={f.value} type="button"
                  className={`${styles.tile} ${focusArea === f.value ? styles.tileActive : ""}`}
                  onClick={(e) => { 
                    setFocusArea(f.value); 
                    handleFinish(e, f.value); 
                  }}
                  disabled={submitting}
                >
                  <span className={styles.tileEmoji}>{f.emoji}</span>
                  <span className={styles.tileLabel}>{f.label}</span>
                </button>
              ))}
            </div>
            
            {submitting && <div className={styles.spinner} style={{ margin: "20px auto" }} />}
            
            <button className={styles.backBtn} onClick={() => advance(8)} disabled={submitting}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
