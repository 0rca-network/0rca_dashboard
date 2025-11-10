import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-tertiary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary CTA - Bright cyan with dark text
        default: "bg-[#64f2d1] text-[#111827] hover:bg-[#64f2d1]/90 shadow-lg shadow-[#64f2d1]/20 font-semibold",
        
        // Secondary - Outlined with accent
        secondary: "border-2 border-accent-tertiary text-accent-tertiary hover:bg-accent-tertiary/10",
        
        // Destructive
        destructive: "bg-error text-white hover:bg-error/90",
        
        // Outline
        outline: "border border-border text-text-primary hover:bg-surface-hover",
        
        // Ghost
        ghost: "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
        
        // Link
        link: "text-accent-tertiary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
