"use client";

import React, { useRef, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./MonkCell.module.css";
import { cn } from "@/lib/utils";

interface MonkCellProps {
  id: string;
  status: "EMPTY" | "DONE" | "EXCEEDED" | "MISSED";
  onToggle: (newStatus: "DONE" | "EXCEEDED" | "EMPTY") => void;
  disabled?: boolean;
}

export function MonkCell({ id, status, onToggle, disabled = false }: MonkCellProps) {
  const [ripples, setRipples] = useState<number[]>([]);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerConfetti = (rect: DOMRect, isExceeded: boolean) => {
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: isExceeded ? 20 : 10,
      spread: 60,
      origin: { x, y },
      colors: isExceeded ? ["#fde047", "#eab308", "#ffffff"] : ["#22c55e", "#16a34a", "#ffffff"],
      ticks: 100, // fade out quickly
      disableForReducedMotion: true,
      zIndex: 100,
    });
  };

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;

    // Haptic feedback for mobile
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(40);
    }

    // Ripple effect
    setRipples((prev) => [...prev, Date.now()]);

    let targetEl: HTMLElement;
    if ("touches" in e) {
      targetEl = e.currentTarget as HTMLElement;
    } else {
      targetEl = e.currentTarget as HTMLElement;
    }
    const rect = targetEl.getBoundingClientRect();

    // Logic for Single vs Double tap (Empty -> Done -> Exceeded -> Empty)
    if (status === "EMPTY" || status === "MISSED") {
      onToggle("DONE");
      triggerConfetti(rect, false);
    } else if (status === "DONE") {
      onToggle("EXCEEDED");
      triggerConfetti(rect, true);
    } else {
      onToggle("EMPTY");
    }
  };

  const cssClasses = cn(
    styles.cellWrap,
    status === "DONE" && styles.cellDone,
    status === "EXCEEDED" && styles.cellExceeded,
    status === "MISSED" && styles.cellMissed,
    disabled && "opacity-50 cursor-not-allowed" // arbitrary tailwind utility mimicking
  );

  return (
    <div 
      className={cssClasses}
      onClick={handleInteraction}
      title={status}
    >
      {/* SVG Icon Rendering */}
      {(status === "DONE" || status === "EXCEEDED") && (
        <svg style={{ position: "relative", zIndex: 10 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
      {status === "MISSED" && (
        <svg style={{ position: "relative", zIndex: 10, color: "rgba(255, 82, 82, 0.6)" }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      )}

      <AnimatePresence>
        {ripples.map((key) => (
          <motion.div
            key={key}
            className={styles.ripple}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            onAnimationComplete={() => {
              setRipples((prev) => prev.filter((r) => r !== key));
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
