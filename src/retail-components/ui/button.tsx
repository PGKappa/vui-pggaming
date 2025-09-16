import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/retail-lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm',
        outline: 'border border-input bg-background shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4',
        betNow: 'font-bold text-lg bg-bet text-bet-foreground shadow',
        navbar: 'bg-secondary text-accent-foreground',
        navbarSelected: 'bg-tertiary text-tertiary-foreground',
        market: 'bg-secondary text-accent-foreground',
        marketSelected: 'bg-tertiary text-tertiary-foreground',
        history: 'bg-accent text-accent-foreground',
        ticketButton: 'bg-navbarButton text-black font-bold',
        ticketFilter: 'bg-background text-foreground',
        info: 'bg-chart-1 text-muted',
        action: 'rounded-[8px] bg-tertiary text-tertiary-foreground',
      },
      size: {
        default: 'h-10 w-10',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-2',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7',
        'icon-lg': 'h-10 w-10',
        'icon-history': 'px-10 py-0.5 text-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
