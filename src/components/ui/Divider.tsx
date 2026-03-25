import React from "react";

export function Divider({ className = "" }: { className?: string }) {
  return (
    <hr 
      className={className} 
      style={{ 
        border: "none", 
        borderTop: "1px solid var(--border-color)", 
        margin: "16px 0",
        width: "100%"
      }} 
    />
  );
}
