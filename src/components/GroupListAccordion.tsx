"use client";

import React, { useState, useCallback, useRef } from "react";
import { Group, Habit } from "@/services/DatabaseService";
import { useHabits } from "@/context/HabitContext";
import styles from "./GroupListAccordion.module.css";

interface GroupListAccordionProps {
  groups: Group[];
  activeGroupId: string | null;
  onSelect: (id: string) => void;
  onNewGroup: () => void;
  habits: Habit[];
  renderGrid: (groupId: string) => React.ReactNode;
}

export function GroupListAccordion({
  groups,
  activeGroupId,
  onSelect,
  onNewGroup,
  habits,
  renderGrid,
}: GroupListAccordionProps) {
  const { deleteGroup } = useHabits();

  // "armed" state tracks which group's delete button has been tapped once
  const [armedGroupId, setArmedGroupId] = useState<string | null>(null);
  const disarmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayStr = React.useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  );

  const getGroupProgress = useCallback(
    (groupId: string) => {
      const groupHabits = habits.filter((h) => h.groupId === groupId);
      if (groupHabits.length === 0) return 0;
      const done = groupHabits.filter(
        (h) => !!h.completedDays?.[todayStr]
      ).length;
      return (done / groupHabits.length) * 100;
    },
    [habits, todayStr]
  );

  // Arm: first tap — turns icon red + starts 2.5s auto-disarm
  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, groupId: string) => {
      e.stopPropagation();

      if (armedGroupId === groupId) {
        // Second tap → execute delete
        if (disarmTimerRef.current) clearTimeout(disarmTimerRef.current);
        setArmedGroupId(null);
        deleteGroup(groupId);
      } else {
        // First tap → arm
        if (disarmTimerRef.current) clearTimeout(disarmTimerRef.current);
        setArmedGroupId(groupId);
        disarmTimerRef.current = setTimeout(() => {
          setArmedGroupId(null);
        }, 2500);
      }
    },
    [armedGroupId, deleteGroup]
  );

  return (
    <div className={styles.accordionContainer}>
      {groups.map((group) => {
        const isActive = group.id === activeGroupId;
        const progress = getGroupProgress(group.id);
        const habitCount = habits.filter((h) => h.groupId === group.id).length;
        const isArmed = armedGroupId === group.id;

        return (
          <div
            key={group.id}
            className={`${styles.groupRowWrapper} ${isActive ? styles.active : ""}`}
          >
            {/* Group header row */}
            <div
              className={`${styles.groupRow} ${styles[`theme_${group.themeColor}`] || ""}`}
              onClick={() => {
                if (isArmed) return; // don't collapse while armed
                onSelect(isActive ? "" : group.id);
              }}
            >
              {/* Progress stripe */}
              <div
                className={styles.progressStripe}
                style={{ width: `${progress}%` }}
              />

              <div className={styles.rowLayout}>
                {/* Left accent bar for active group */}
                <div className={`${styles.accentBar} ${isActive ? styles.accentBarActive : ""}`} />

                <div className={styles.emoji}>{group.emoji}</div>
                <div className={styles.meta}>
                  <div className={styles.name}>{group.name}</div>
                  <div className={styles.badge}>{habitCount} habit{habitCount !== 1 ? "s" : ""}</div>
                </div>

                <div className={styles.rightSide}>
                  {/* Progress text */}
                  {habitCount > 0 && (
                    <span className={styles.progressText}>
                      {Math.round(progress)}%
                    </span>
                  )}

                  {/* Delete — arm & fire pattern */}
                  <button
                    className={`${styles.deleteGroupBtn} ${isArmed ? styles.deleteArmed : ""}`}
                    onClick={(e) => handleDeleteClick(e, group.id)}
                    title={isArmed ? "Tap again to confirm delete" : "Delete group"}
                    aria-label={isArmed ? "Confirm delete group" : "Delete group"}
                  >
                    {isArmed ? (
                      // Pulsing ring + trash when armed
                      <span className={styles.armedRing}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </span>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    )}
                  </button>

                  {/* Chevron */}
                  <div className={`${styles.chevron} ${isActive ? styles.chevronOpen : ""}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Armed tooltip */}
              {isArmed && (
                <div className={styles.armedTooltip}>
                  Tap trash again to delete · Auto-cancels in 2.5s
                </div>
              )}
            </div>

            {/* Accordion body — CSS grid-template-rows (no layout thrash) */}
            <div className={`${styles.gridExpansion} ${isActive ? styles.expansionOpen : ""}`}>
              <div className={styles.gridInternal}>
                {isActive && renderGrid(group.id)}
              </div>
            </div>
          </div>
        );
      })}

      <button className={styles.addGroupRow} onClick={onNewGroup}>
        <span className={styles.plus}>＋</span> New Group
      </button>
    </div>
  );
}
