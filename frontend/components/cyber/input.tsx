import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "w-full rounded-xl border border-border-strong bg-bg-input px-[18px] py-[14px] text-[15px] text-text-primary placeholder:text-text-muted transition-all duration-150",
            "focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary-dim",
            icon && "pl-12",
            error && "border-risk-critical focus:border-risk-critical focus:ring-risk-critical-dim",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
