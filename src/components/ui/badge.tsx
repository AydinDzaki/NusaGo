import * as React from "react";

const badgeVariants = {
  variant: {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
    destructive: "border-transparent bg-destructive text-white hover:bg-destructive/90",
    outline: "text-foreground hover:bg-accent hover:text-accent-foreground",
  },
};

function getBadgeClasses(variant = "default", className = "") {
  const baseClasses = "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-colors";
  const variantClasses = badgeVariants.variant[variant] || badgeVariants.variant.default;
  
  return `${baseClasses} ${variantClasses} ${className}`.trim();
}

function Badge({
  className = "",
  variant = "default",
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof badgeVariants.variant;
}) {
  return (
    <span
      className={getBadgeClasses(variant, className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge, badgeVariants };