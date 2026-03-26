"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./NewGroupModal.module.css";
import { Group } from "@/services/DatabaseService";

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, emoji: string, color: Group['themeColor']) => void;
}

const EMOJIS = ["💪", "💊", "🥗", "🧴", "🧘", "🚿", "💧", "☕", "🍎", "🏃", "📚", "✍️", "🎹", "💻", "🧹", "🪴", "🐕", "🐈", "😴", "🧠", "🔥", "✨", "🏹", "🎨", "🎭", "🎮", "🔋", "🛠️", "📅", "✅"];
const COLORS: Group['themeColor'][] = ["red", "blue", "green", "purple", "orange", "pink", "teal", "gold"];

export function NewGroupModal({ isOpen, onClose, onSave }: NewGroupModalProps) {
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), selectedEmoji, selectedColor);
    setName("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay} onClick={onClose}>
          <motion.div 
            className={styles.modal} 
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <h2 className={styles.title}>Create New Group</h2>
            
            <div className={styles.field}>
              <label>Group Name</label>
              <input 
                type="text" 
                maxLength={24} 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Morning Routine"
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label>Icon</label>
              <div className={styles.emojiGrid}>
                {EMOJIS.map(e => (
                  <button 
                    key={e} 
                    className={`${styles.emojiBtn} ${selectedEmoji === e ? styles.active : ""}`}
                    onClick={() => setSelectedEmoji(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>Theme Color</label>
              <div className={styles.colorGrid}>
                {COLORS.map(c => (
                  <button 
                    key={c} 
                    className={`${styles.colorBtn} ${styles[`bg_${c}`]} ${selectedColor === c ? styles.activeColor : ""}`}
                    onClick={() => setSelectedColor(c)}
                  />
                ))}
              </div>
            </div>

            <button className={styles.saveBtn} onClick={handleSave} disabled={!name.trim()}>
              Save Group
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
