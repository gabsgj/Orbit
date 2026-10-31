import * as React from "react";
import { cn } from "@/shared/lib/utils";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, actions, children, ...props }, ref) => {
    if (title || description || actions) {
      return (
        <div
          ref={ref}
          className={cn("flex items-start justify-between gap-4 p-5 pb-3", className)}
          {...props}
        >
          <div>
            <h3 className="text-base font-semibold leading-tight tracking-tight text-[hsl(var(--foreground))]">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {description}
              </p>
            ) : null}
          </div>
          {actions}
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-5 pb-3", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base font-semibold leading-tight tracking-tight text-[hsl(var(--foreground))]",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-[hsl(var(--muted-foreground))]", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-5 pt-0 border-t border-[hsl(var(--border))] mt-4",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
