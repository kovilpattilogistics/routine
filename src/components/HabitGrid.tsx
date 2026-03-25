"use client";

import React from "react";
import styles from "./HabitGrid.module.css";
import { Habit } from "@/services/DatabaseService";

interface HabitGridProps {
  habits: Habit[];
  dates: string[]; // array of 'YYYY-MM-DD' sorted oldest to newest (left to right)
  toggleTask: (habitId: string, dateStr: string) => void;
}

export function HabitGrid({ habits, dates, toggleTask }: HabitGridProps) {
  if (habits.length === 0) return null;

  // Formatting date for header (e.g. '22/02' from 'YYYY-MM-DD')
  const formatDate = (dateStr: string) => {
    const [, month, day] = dateStr.split("-");
    return `${day}/${month}`;
  };

  return (
    <div className={styles.gridWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thName}>Routine</th>
            {dates.map((date) => (
              <th key={date} className={`${styles.th} ${styles.dateCol}`}>
                {formatDate(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habits.map((habit) => (
            <tr key={habit.id} className={styles.tr}>
              <td className={styles.tdName}>{habit.name}</td>
              {dates.map((date) => {
                const isCompleted = habit.completedDays?.[date] === true;

                return (
                  <td key={date} className={styles.tdCell}>
                    <button
                      className={styles.cellBtn}
                      onClick={() => toggleTask(habit.id, date)}
                      aria-label={`Toggle ${habit.name} on ${date}`}
                    >
                      {isCompleted ? (
                        <span className={styles.x}>x</span>
                      ) : (
                        <div className={styles.dot} />
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
