import * as React from "react";

function Textarea({ className = "", ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={`resize-none border-input placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 flex min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
      {...props}
    />
  );
}

export { Textarea };