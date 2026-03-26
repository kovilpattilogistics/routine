"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./PastDataModal.module.css";

interface PastDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  currentDate: Date;
}

export function PastDataModal({ isOpen, onClose, onSelect, currentDate }: PastDataModalProps) {
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleApply = () => {
    const d = new Date(year, month, 15); // Set to middle of month for balanced view
    onSelect(d);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          <motion.div 
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className={styles.header}>
              <h2 className={styles.title}>Select Timeframe</h2>
              <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>

            <p className={styles.description}>Jump to any month to review your past activity and streaks.</p>

            <div className={styles.selectors}>
              <div className={styles.field}>
                <label className={styles.label}>Month</label>
                <select 
                  className={styles.select} 
                  value={month} 
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                >
                  {months.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Year</label>
                <select 
                  className={styles.select} 
                  value={year} 
                  onChange={(e) => setYear(parseInt(e.target.value))}
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.resetBtn} onClick={() => onSelect(new Date())}>Reset to Today</button>
              <button className={styles.applyBtn} onClick={handleApply}>View Data</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
