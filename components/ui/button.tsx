import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold tracking-wide transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/30 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[#8B0000] via-[#a30c0c] to-[#360000] text-primary-foreground shadow-[0_18px_35px_rgba(139,0,0,0.35)] hover:shadow-[0_26px_55px_rgba(139,0,0,0.45)] hover:brightness-110",
        destructive:
          "bg-destructive text-white shadow-[0_18px_35px_rgba(208,63,63,0.3)] hover:bg-destructive/90",
        outline:
          "border border-white/20 bg-white/10 text-foreground shadow-[0_15px_30px_rgba(0,0,0,0.08)] backdrop-blur hover:border-white/40 hover:bg-white/20 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/20",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_15px_30px_rgba(139,0,0,0.12)] hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground text-foreground/70 dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 has-[>svg]:px-5",
        sm: "h-9 rounded-xl gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 rounded-3xl px-8 has-[>svg]:px-6",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
