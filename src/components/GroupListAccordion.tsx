"use client";

import React, { useState, memo, useCallback } from "react";
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  return (
    <div className={styles.accordionContainer}>
      {groups.map((group) => {
        const isActive = group.id === activeGroupId;
        const progress = getGroupProgress(group.id);
        const habitCount = habits.filter((h) => h.groupId === group.id).length;
        const isConfirmingDelete = confirmDeleteId === group.id;

        return (
          <div
            key={group.id}
            className={`${styles.groupRowWrapper} ${isActive ? styles.active : ""}`}
          >
            {/* Group header row */}
            <div
              className={`${styles.groupRow} ${styles[`theme_${group.themeColor}`] || ""}`}
              onClick={() => {
                if (isConfirmingDelete) return;
                onSelect(isActive ? "" : group.id);
              }}
              data-group-id={group.id}
            >
              {/* Progress stripe — CSS conic-gradient, no JS animation */}
              <div
                className={styles.progressStripe}
                style={{
                  width: `${progress}%`,
                }}
              />

              <div className={styles.rowLayout}>
                <div className={styles.emoji}>{group.emoji}</div>
                <div className={styles.meta}>
                  <div className={styles.name}>{group.name}</div>
                  <div className={styles.badge}>{habitCount} habits</div>
                </div>

                <div className={styles.rightSide}>
                  {/* Inline delete confirmation */}
                  {isConfirmingDelete ? (
                    <div
                      className={styles.deleteConfirmInline}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className={styles.deleteConfirmLabel}>
                        Delete group?
                      </span>
                      <button
                        className={styles.confirmYes}
                        onClick={() => {
                          deleteGroup(group.id);
                          setConfirmDeleteId(null);
                        }}
                      >
                        Delete
                      </button>
                      <button
                        className={styles.confirmNo}
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className={styles.deleteGroupBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(group.id);
                      }}
                      title="Delete Group"
                      aria-label="Delete Group"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}

                  <div
                    className={`${styles.chevron} ${isActive ? styles.chevronOpen : ""}`}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion body — CSS grid-template-rows animation (no layout thrash) */}
            <div className={`${styles.gridExpansion} ${isActive ? styles.expansionOpen : ""}`}>
              <div className={styles.gridInternal}>
                {isActive && renderGrid(group.id)}
              </div>
            </div>
          </div>
        );
      })}

      <button className={styles.addGroupRow} onClick={onNewGroup}>
        <span className={styles.plus}>＋</span> Create New Group
      </button>
    </div>
  );
}
