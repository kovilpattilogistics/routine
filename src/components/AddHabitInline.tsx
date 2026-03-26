"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./AddHabitInline.module.css";

interface AddHabitInlineProps {
  onSave: (data: { name: string, emoji: string, frequency: string, customDays: string[] }) => void;
  onCancel: () => void;
}

const EMOJIS = ["🧘", "🚿", "💧", "☕", "🍎", "🏃", "📚", "✍️", "🎹", "💻", "🧹", "🪴", "😴", "🧠", "🔥", "✅"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AddHabitInline({ onSave, onCancel }: AddHabitInlineProps) {
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [frequency, setFrequency] = useState("daily"); // daily, weekdays, custom
  const [customDays, setCustomDays] = useState<string[]>(DAYS);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji: selectedEmoji, frequency, customDays });
    setName("");
  };

  const toggleDay = (day: string) => {
    setCustomDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
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
          {EMOJIS.slice(0, 8).map(e => (
            <button 
              key={e} 
              className={`${styles.emojiBtn} ${selectedEmoji === e ? styles.activeEmoji : ""}`}
              onClick={() => setSelectedEmoji(e)}
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
          onChange={e => setName(e.target.value)}
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
