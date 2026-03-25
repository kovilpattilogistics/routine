import React from "react";
import styles from "./Button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
}

export function Button({
  className = "",
  variant = "primary",
  fullWidth = false,
  children,
  ...props
}: ButtonProps) {
  const cn = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button className={cn} {...props}>
      {children}
    </button>
  );
}
