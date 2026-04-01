"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./AddHabitInline.module.css";

interface AddHabitInlineProps {
  onSave: (data: { name: string, emoji: string, frequency: string, customDays: string[] }) => void;
  onCancel: () => void;
  groupName?: string;
}

const EMOJI_PACKAGES: Record<string, string[]> = {
  fitness: ["🏃", "🏋️", "🧘", "🏊", "🚴", "🥊", "⚽", "🏀", "🧗", "🛹"],
  work: ["💻", "📚", "✍️", "📧", "🗓️", "💡", "💼", "📉", "🎯", "🧠"],
  health: ["🍎", "🥗", "💧", "💊", "☕", "🥦", "🥑", "🍳", "🥩", "🍼"],
  mind: ["🧠", "🕯️", "✨", "🕊️", "🌙", "☀️", "🍃", "🌊", "💆", "🧿"],
  hobby: ["🎹", "🎨", "🎮", "🎸", "📷", "🎤", "🧶", "🕺", "🍿", "🧩"],
  home: ["🧹", "🪴", "😴", "🛀", "🧺", "🍳", "🏠", "🧸", "🪞", "👠"],
  default: ["🧘", "🚿", "💧", "🍎", "🏃", "📚", "✍️", "🎹", "💻", "🧹", "🪴", "😴", "🧠", "🔥", "✅", "✨"]
};

const CATEGORY_MAP: Record<string, string> = {
  gym: "fitness", workout: "fitness", run: "fitness", fitness: "fitness", exercise: "fitness", sport: "fitness", lift: "fitness",
  study: "work", code: "work", work: "work", read: "work", writing: "work", write: "work", learn: "work", task: "work",
  eat: "health", food: "health", water: "health", fruit: "health", diet: "health", drink: "health", sleep: "health",
  meditate: "mind", breath: "mind", focus: "mind", zen: "mind", yoga: "mind",
  music: "hobby", play: "hobby", draw: "hobby", game: "hobby", hobby: "hobby",
  clean: "home", house: "home", garden: "home", plant: "home", laundry: "home", kitchen: "home"
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AddHabitInline({ onSave, onCancel, groupName = "" }: AddHabitInlineProps) {
  const [name, setName] = useState("");
  
  const getContextualEmojis = () => {
    const input = (name + " " + groupName).toLowerCase();
    for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
      if (input.includes(kw)) return EMOJI_PACKAGES[cat];
    }
    return EMOJI_PACKAGES.default;
  };

  const currentEmojis = getContextualEmojis();
  const [selectedEmoji, setSelectedEmoji] = useState(currentEmojis[0]);

  // Sync selected emoji when the package changes if it's not in the new package
  React.useEffect(() => {
    if (!currentEmojis.includes(selectedEmoji)) {
      setSelectedEmoji(currentEmojis[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, groupName]); // Intentionally only run when name/group change — not selectedEmoji

  const [frequency, setFrequency] = useState("daily");
  const [customDays, setCustomDays] = useState<string[]>(DAYS);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji: selectedEmoji, frequency, customDays });
    setName("");
  };

  const toggleDay = (day: string) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Keyboard: Enter = save, Escape = cancel
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && name.trim()) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
    >
      <div className={styles.topRow}>
        <div className={styles.emojiPicker}>
          {currentEmojis.slice(0, 8).map((e) => (
            <button
              key={e}
              className={`${styles.emojiBtn} ${selectedEmoji === e ? styles.activeEmoji : ""}`}
              onClick={() => setSelectedEmoji(e)}
              type="button"
            >
              {e}
            </button>
          ))}
        </div>
        <input
          autoFocus
          className={styles.input}
          placeholder="Habit name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className={styles.frequencyRow}>
        <div className={styles.freqPills}>
          {["daily", "weekdays", "custom"].map(f => (
            <button 
              key={f} 
              className={`${styles.pill} ${frequency === f ? styles.activePill : ""}`}
              onClick={() => {
                setFrequency(f);
                if (f === 'weekdays') setCustomDays(DAYS.slice(0, 5));
                if (f === 'daily') setCustomDays(DAYS);
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {frequency === "custom" && (
          <div className={styles.daySelector}>
            {DAYS.map(d => (
              <button 
                key={d} 
                className={`${styles.dayBtn} ${customDays.includes(d) ? styles.activeDay : ""}`}
                onClick={() => toggleDay(d)}
              >
                {d[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        <button className={styles.saveBtn} onClick={handleSave} disabled={!name.trim()}>Save Habit</button>
      </div>
    </motion.div>
  );
}
