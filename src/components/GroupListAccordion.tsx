"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
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

export function GroupListAccordion({ groups, activeGroupId, onSelect, onNewGroup, habits, renderGrid }: GroupListAccordionProps) {
  const { deleteGroup } = useHabits();
  
  const getGroupProgress = (groupId: string) => {
    const groupHabits = habits.filter(h => h.groupId === groupId);
    if (groupHabits.length === 0) return 0;
    
    const todayStr = new Date().toISOString().split("T")[0];
    const completedCount = groupHabits.filter(h => !!h.completedDays?.[todayStr]).length;
    return (completedCount / groupHabits.length) * 100;
  };

  return (
    <div className={styles.accordionContainer}>
      {groups.map((group) => {
        const isActive = group.id === activeGroupId;
        const progress = getGroupProgress(group.id);
        const isAllDone = progress === 100 && habits.filter(h => h.groupId === group.id).length > 0;

        return (
          <div key={group.id} className={`${styles.groupRowWrapper} ${isActive ? styles.active : ""}`}>
            <motion.div 
              className={`${styles.groupRow} ${styles[`theme_${group.themeColor}`]}`}
              onClick={() => onSelect(isActive ? "" : group.id)} // Toggle off if already active? User said "at one time only one should be open"
              whileTap={{ scale: 0.98 }}
            >
              <div className={styles.rowLayout}>
                <div className={styles.emoji}>{group.emoji}</div>
                <div className={styles.meta}>
                  <div className={styles.name}>{group.name}</div>
                  <div className={styles.badge}>{habits.filter(h => h.groupId === group.id).length} habits</div>
                </div>

                <div className={styles.rightSide}>
                  <button 
                    className={styles.deleteGroupBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete the group "${group.name}" and all its habits?`)) {
                        deleteGroup(group.id);
                      }
                    }}
                    title="Delete Group"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                  <motion.div 
                    className={styles.chevron}
                    animate={{ rotate: isActive ? 180 : 0 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {isActive && (
                <motion.div 
                  className={styles.gridExpansion}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 30, stiffness: 200 }}
                >
                  <div className={styles.gridInternal}>
                    {renderGrid(group.id)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <button className={styles.addGroupRow} onClick={onNewGroup}>
        <span className={styles.plus}>＋</span> Create New Group
      </button>
    </div>
  );
}
