"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import styles from "./MonkEntryModal.module.css";
import { cn } from "@/lib/utils";

interface MonkEntryModalProps {
  dateStr: string;
  habitName: string;
  initialNote?: string;
  initialMood?: string;
  onSave: (note: string, mood: string) => void;
  onClose: () => void;
}

const MOODS = ["😴", "😐", "😊", "💪", "🔥"];

export function MonkEntryModal({ dateStr, habitName, initialNote = "", initialMood = "", onSave, onClose }: MonkEntryModalProps) {
  const [note, setNote] = useState(initialNote);
  const [mood, setMood] = useState(initialMood);

  // Format YYYY-MM-DD into a readable label
  const dateObj = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
  const formattedDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', options) : dateStr;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div 
        className={styles.modalContent}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.dateLabel}>{formattedDate}</span>
          <span className={styles.habitName}>{habitName}</span>
        </div>

        <textarea
          className={styles.textArea}
          placeholder="How did it go? (e.g., Did 20 pushups but felt tired...)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className={styles.emojiRow}>
          {MOODS.map(m => (
            <button
              key={m}
              className={cn(styles.emojiBtn, mood === m && styles.emojiActive)}
              onClick={() => setMood(m)}
            >
              {m}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.btnSave} onClick={() => onSave(note, mood)}>
            Save Entry
          </button>
        </div>
      </motion.div>
    </div>
  );
}
