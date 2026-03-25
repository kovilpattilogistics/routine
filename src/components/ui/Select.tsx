import React from "react";
import styles from "./Input.module.css"; // Reuse input styles as they are identical structurally

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = "", id, ...props }: SelectProps) {
  const generatedId = id || React.useId();
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <label htmlFor={generatedId} className={styles.label}>{label}</label>}
      <select id={generatedId} className={`${styles.input} ${styles.select}`} {...props}>
        <option value="" disabled>Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
