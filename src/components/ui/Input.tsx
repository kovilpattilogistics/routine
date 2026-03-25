import React from "react";
import styles from "./Input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", id, ...props }: InputProps) {
  const generatedId = id || React.useId();
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <label htmlFor={generatedId} className={styles.label}>{label}</label>}
      <input id={generatedId} className={styles.input} {...props} />
    </div>
  );
}
