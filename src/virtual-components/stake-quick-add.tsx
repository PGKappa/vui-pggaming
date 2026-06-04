'use client'

import { Button } from '@/virtual-components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/virtual-components/ui/popover'
import { useState } from 'react'

interface StakeQuickAddProps {
  /** Element that acts as the popover trigger */
  children: React.ReactNode
  /** Called when a quick-add button is pressed */
  onAdd: (amount: number) => void
  /** Quick-add amounts, e.g. [1, 2, 3, 4, 5, 10] */
  amounts: number[]
}

export default function StakeQuickAdd({
  children,
  onAdd,
  amounts,
}: StakeQuickAddProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        side="top"
        align="start"
        sideOffset={6}
      >
        <div className="flex flex-row gap-1">
          {amounts.map((amt) => (
            <Button
              key={amt}
              variant="ghost"
              size="sm"
              className="rounded-sm border border-border bg-betSlip text-xs font-semibold"
              onClick={() => {
                onAdd(amt)
                setOpen(false)
              }}
            >
              +{amt}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
