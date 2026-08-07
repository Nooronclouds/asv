import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const riskBadgeVariants = cva(
  "inline-flex items-center gap-[5px] rounded-full px-[10px] py-[3px] text-[11px] font-semibold uppercase tracking-[0.8px]",
  {
    variants: {
      severity: {
        None: "bg-text-muted-dim text-text-muted",
        Low: "bg-blue-500/10 text-blue-500",
        Medium: "bg-yellow-500/10 text-yellow-500",
        High: "bg-orange-500/10 text-orange-500",
        Critical: "bg-risk-critical-dim text-risk-critical",
      },
    },
    defaultVariants: {
      severity: "None",
    },
  }
);

export interface RiskBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof riskBadgeVariants> {
  showDot?: boolean;
}

const RiskBadge = React.forwardRef<HTMLSpanElement, RiskBadgeProps>(
  ({ className, severity, showDot = false, children, ...props }, ref) => {
    const labels = {
      None: "None",
      Low: "Low",
      Medium: "Medium",
      High: "High",
      Critical: "Critical",
    };

    return (
      <span
        ref={ref}
        className={cn(
          riskBadgeVariants({ severity, className }),
          severity === "Critical" && "animate-border-pulse"
        )}
        {...props}
      >
        {showDot && (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              severity === "None" && "bg-text-muted",
              severity === "Low" && "bg-blue-500",
              severity === "Medium" && "bg-yellow-500",
              severity === "High" && "bg-orange-500",
              severity === "Critical" && "bg-risk-critical"
            )}
          />
        )}
        {children || labels[severity || "None"]}
      </span>
    );
  }
);
RiskBadge.displayName = "RiskBadge";

// Risk dot component for use in lists
const RiskDot = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { 
    severity?: "None" | "Low" | "Medium" | "High" | "Critical";
    risk?: "safe" | "moderate" | "critical" | "None" | "Low" | "Medium" | "High" | "Critical";
  }
>(({ className, severity, risk, ...props }, ref) => {
  const activeSeverity = severity || (
    risk === "critical" ? "Critical" :
    risk === "moderate" ? "Medium" :
    risk === "safe" ? "None" : (risk as any)
  ) || "None";

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        activeSeverity === "None" && "bg-text-muted",
        activeSeverity === "Low" && "bg-blue-500",
        activeSeverity === "Medium" && "bg-yellow-500",
        activeSeverity === "High" && "bg-orange-500",
        activeSeverity === "Critical" && "bg-risk-critical",
        className
      )}
      {...props}
    />
  );
});
RiskDot.displayName = "RiskDot";

export { RiskBadge, RiskDot, riskBadgeVariants };
