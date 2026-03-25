"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { DatabaseService, UserProfile } from "@/services/DatabaseService";
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
  const [editAge, setEditAge] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

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
          setEditAge(p.age?.toString() ?? "");
          setEditHeight(p.height?.toString() ?? "");
          setEditWeight(p.weight?.toString() ?? "");
        }
      })
      .catch(console.error)
      .finally(() => setProfileLoading(false));
  }, [user]);

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
      await DatabaseService.getInstance().updateUserProfile(user.uid, {
        age: editAge ? Number(editAge) : undefined,
        height: editHeight ? Number(editHeight) : undefined,
        weight: editWeight ? Number(editWeight) : undefined,
      });
      setProfile((p) => p ? {
        ...p,
        age: editAge ? Number(editAge) : undefined,
        height: editHeight ? Number(editHeight) : undefined,
        weight: editWeight ? Number(editWeight) : undefined,
      } : p);
      setIsEditing(false);
    } catch (e) {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const initials = profile.name
    ? profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className={styles.root}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <Link href="/planner" className={styles.backLink}>
          ← Planner
        </Link>
      </header>

      <main className={styles.main}>
        {/* Avatar + name section */}
        <div className={styles.avatarRow}>
          <div className={styles.avatarWrap}>
            <img
              src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${user.uid}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
              alt="avatar"
              className={styles.avatar}
            />
          </div>
          <div>
            <h1 className={styles.profileName}>{profile.name || "User"}</h1>
            <p className={styles.profileEmail}>{user.email}</p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Journey snapshot */}
        {(profile.role || profile.struggle || profile.focusArea) && (
          <>
            <section className={styles.section}>
              <p className={styles.sectionLabel}>Your Journey</p>
              <div className={styles.infoGrid}>
                {profile.role && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Here to</span>
                    <span className={styles.infoValue}>{ROLE_LABELS[profile.role] ?? profile.role}</span>
                  </div>
                )}
                {profile.struggle && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Working on</span>
                    <span className={styles.infoValue}>{STRUGGLE_LABELS[profile.struggle] ?? profile.struggle}</span>
                  </div>
                )}
                {profile.focusArea && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Focus area</span>
                    <span className={styles.infoValue}>{FOCUS_LABELS[profile.focusArea] ?? profile.focusArea}</span>
                  </div>
                )}
                {profile.wakeTime && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Day starts at</span>
                    <span className={styles.infoValue}>{profile.wakeTime}</span>
                  </div>
                )}
              </div>
            </section>
            <div className={styles.divider} />
          </>
        )}

        {/* My Badges */}
        <section className={styles.section}>
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

        {/* Physical details */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>Physical Details</p>
            {!isEditing && (
              <button className={styles.editBtn} onClick={() => setIsEditing(true)}>Edit</button>
            )}
          </div>

          {isEditing ? (
            <div className={styles.editGrid}>
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
          ) : (
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
          )}

          {isEditing && (
            <div className={styles.editActions}>
              {saveError && <p className={styles.saveError}>{saveError}</p>}
              <button className={styles.cancelBtn} onClick={() => { setIsEditing(false); setSaveError(""); }}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
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
