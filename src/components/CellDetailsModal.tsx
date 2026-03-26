"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./CellDetailsModal.module.css";

interface CellDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { note: string, mood: string }) => void;
  habitName: string;
  dateStr: string;
  initialNote?: string;
  initialMood?: string;
}

const MOODS = ["😴", "😐", "😊", "💪", "🔥"];

export function CellDetailsModal({ 
  isOpen, onClose, onSave, habitName, dateStr, initialNote = "", initialMood = "😊" 
}: CellDetailsModalProps) {
  const [note, setNote] = useState(initialNote);
  const [mood, setMood] = useState(initialMood);

  const handleSave = () => {
    onSave({ note, mood });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay} onClick={onClose}>
          <motion.div 
            className={styles.modal} 
            onClick={e => e.stopPropagation()}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className={styles.header}>
              <div className={styles.dragHandle} />
              <h2 className={styles.title}>{habitName}</h2>
              <p className={styles.subtitle}>{new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>

            <div className={styles.content}>
              <div className={styles.field}>
                <label>How was it? (Note)</label>
                <textarea 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add details about your session..."
                  rows={4}
                />
              </div>

              <div className={styles.field}>
                <label>Your Mood</label>
                <div className={styles.moodGrid}>
                  {MOODS.map(m => (
                    <button 
                      key={m} 
                      className={`${styles.moodBtn} ${mood === m ? styles.activeMood : ""}`}
                      onClick={() => setMood(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.photoPlaceholder}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Upload Photo (Soon)</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.ghostBtn} onClick={onClose}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave}>Save Entry</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
