"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DatabaseService, TodoItem } from "@/services/DatabaseService";
import styles from "./TodayTodos.module.css";

interface TodayTodosProps {
  userId: string;
  baseDate: Date;
}

export function TodayTodos({ userId, baseDate }: TodayTodosProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickAddText, setQuickAddText] = useState("");

  const localDateStr = baseDate.toLocaleDateString("en-CA"); // YYYY-MM-DD local

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await DatabaseService.getInstance().getTodosForDate(userId, localDateStr);
      setTodos(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId, localDateStr]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleToggle = async (todo: TodoItem) => {
    // Optimistic
    const nextState = !todo.done;
    setTodos((prev) =>
      prev
        .map((t) => (t.id === todo.id ? { ...t, done: nextState } : t))
        .sort((a, b) => {
          if (a.done !== b.done) return a.done ? 1 : -1;
          return a.sortOrder - b.sortOrder;
        })
    );

    await DatabaseService.getInstance().updateTodo(userId, todo.id, { done: nextState });
  };

  const handleCreate = async (e?: React.KeyboardEvent | React.FocusEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;

    const trimmed = quickAddText.trim();
    if (!trimmed) return;

    setQuickAddText(""); // clear input instantly

    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      userId,
      date: localDateStr,
      title: trimmed,
      done: false,
      sortOrder: todos.length,
    };

    // Optimistic Add
    setTodos((prev) => [...prev, newTodo].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return a.sortOrder - b.sortOrder;
    }));

    await DatabaseService.getInstance().addTodo(userId, newTodo);
  };

  const handleDelete = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await DatabaseService.getInstance().deleteTodo(userId, id);
  };

  const handleUpdateTitle = async (id: string, newTitle: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t)));
    await DatabaseService.getInstance().updateTodo(userId, id, { title: newTitle });
  };

  const handleUpdateNotes = async (id: string, newNotes: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, notes: newNotes } : t)));
    await DatabaseService.getInstance().updateTodo(userId, id, { notes: newNotes });
  };

  if (loading) {
    return (
      <div className={styles.todosContainer}>
        <div className={`${styles.todoList} animate-fade-in`}>
          <div className="skeleton" style={{ height: "40px", width: "100%", marginBottom: "8px" }} />
          <div className="skeleton" style={{ height: "40px", width: "100%", marginBottom: "8px" }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.todosContainer} animate-fade-in`}>
      {todos.length === 0 && (
        <div className={styles.emptyState}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <div>No tasks planned for this day.</div>
        </div>
      )}

      <div className={styles.todoList}>
        {todos.map((todo) => (
          <div key={todo.id} className={`${styles.todoRow} ${todo.done ? styles.done : ""}`}>
            <div className={styles.checkboxWrap} onClick={() => handleToggle(todo)}>
              <div className={`${styles.checkbox} ${todo.done ? styles.checked : ""}`}>
                <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            <div className={styles.contentWrap}>
              <input
                className={styles.todoTitle}
                value={todo.title}
                onChange={(e) => {
                  // Direct controlled state update for responsiveness
                  setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, title: e.target.value } : t)));
                }}
                onBlur={(e) => handleUpdateTitle(todo.id, e.target.value)}
                placeholder="To-do..."
              />
              {/* Optional expanding notes */}
              {(!todo.done || todo.notes) && (
                <textarea
                  className={styles.todoNotes}
                  value={todo.notes || ""}
                  onChange={(e) => {
                    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, notes: e.target.value } : t)));
                  }}
                  onBlur={(e) => handleUpdateNotes(todo.id, e.target.value)}
                  placeholder="Notes (optional)..."
                  rows={1}
                  onInput={(e) => {
                    // Auto-expand textarea
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
              )}
            </div>

            <button
              className={styles.deleteBtn}
              onClick={() => handleDelete(todo.id)}
              aria-label="Delete task"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className={styles.quickAddRow}>
        <div className={styles.quickAddPlus}>+</div>
        <input
          className={styles.quickAddInput}
          value={quickAddText}
          onChange={(e) => setQuickAddText(e.target.value)}
          onKeyDown={handleCreate}
          onBlur={handleCreate} // save on lost focus too
          placeholder="Add to-do for this day..."
        />
      </div>
    </div>
  );
}
