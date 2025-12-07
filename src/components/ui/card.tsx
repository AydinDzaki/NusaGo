import * as React from "react";

function Card({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`bg-card text-card-foreground flex flex-col gap-6 rounded-xl border ${className}`}
      {...props}
    />
  );
}

function CardHeader({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 ${className}`}
      {...props}
    />
  );
}

function CardTitle({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <h4
      className={`leading-none ${className}`}
      {...props}
    />
  );
}

function CardDescription({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <p
      className={`text-muted-foreground ${className}`}
      {...props}
    />
  );
}

function CardAction({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`col-start-2 row-span-2 row-start-1 self-start justify-self-end ${className}`}
      {...props}
    />
  );
}

function CardContent({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`px-6 [&:last-child]:pb-6 ${className}`}
      {...props}
    />
  );
}

function CardFooter({ className = "", ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`flex items-center px-6 pb-6 [.border-t]:pt-6 ${className}`}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};