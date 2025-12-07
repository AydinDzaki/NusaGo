import * as React from "react";

function Input({ className = "", type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={`flex h-9 w-full min-w-0 rounded-md border border-input bg-input-background px-3 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
      {...props}
    />
  );
}

export { Input };