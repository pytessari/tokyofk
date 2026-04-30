import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ruby)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-1)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-[1px]",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--ruby)] text-white shadow-[0_0_0_1px_oklch(from_var(--ruby)_l_c_h/0.6)] hover:bg-[oklch(from_var(--ruby)_calc(l+0.04)_c_h)] active:bg-[oklch(from_var(--ruby)_calc(l-0.04)_c_h)]",
        primary:
          "bg-ruby-gradient text-white shadow-[0_0_20px_oklch(from_var(--ruby)_l_c_h/0.4)] hover:brightness-110 active:brightness-95",
        secondary:
          "bg-[color:var(--surface-3)] text-[color:var(--text-1)] border border-[color:var(--line)] hover:bg-[color:var(--surface-4)] hover:border-[color:var(--line-strong)]",
        outline:
          "border border-[color:var(--line-strong)] bg-transparent text-[color:var(--text-1)] hover:bg-[color:var(--surface-3)]",
        ghost:
          "bg-transparent text-[color:var(--text-2)] hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-1)]",
        danger:
          "bg-[color:var(--danger)] text-[color:var(--danger-fg)] hover:brightness-110 active:brightness-90",
        "danger-outline":
          "border border-[color:var(--danger)]/60 bg-transparent text-[oklch(from_var(--danger)_0.85_c_h)] hover:bg-[oklch(from_var(--danger)_l_c_h/0.12)]",
        success:
          "bg-[color:var(--success)] text-[color:var(--success-fg)] hover:brightness-110 active:brightness-90",
        link: "text-[color:var(--ruby)] underline-offset-4 hover:underline px-0",
        // legacy
        destructive:
          "bg-[color:var(--danger)] text-white hover:brightness-110",
      },
      size: {
        default: "h-9 px-4 py-2 text-sm",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-sm",
        xl: "h-12 rounded-md px-8 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Spinner = () => (
  <svg
    className="h-4 w-4 animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading, loadingText, disabled, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Spinner />
            <span>{loadingText ?? children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
