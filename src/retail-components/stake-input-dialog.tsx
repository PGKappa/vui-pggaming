'use client'

import { Button } from '@/retail-components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/retail-components/ui/dialog'
import { Delete } from 'lucide-react'
import { useEffect, useState } from 'react'

interface StakeDialogProps {
  open: boolean
  initialValue: number
  onClose: () => void
  onConfirm: (value: number) => void
}

export default function StakeInputDialog({ open, initialValue, onClose, onConfirm }: StakeDialogProps) {
  const [tempValue, setTempValue] = useState(initialValue.toFixed(2))

  useEffect(() => {
    if (open) {
      setTempValue(initialValue.toFixed(2))
    }
  }, [open, initialValue])

  const appendValue = (val: string) => {
    setTempValue((prev) => (prev === '0.00' ? val : prev + val))
  }

  const addAmount = (amount: number) => {
    const parsed = parseFloat(tempValue) || 0
    setTempValue((parsed + amount).toFixed(2))
  }

  const removeLastDigit = () => {
    setTempValue((prev) => {
      const withoutLast = prev.slice(0, -1)
      return withoutLast === '' || withoutLast === '.' ? '0.00' : withoutLast
    })
  }

  const resetValue = () => {
    setTempValue('0.00')
  }

  const increase = () => {
    setTempValue((prev) => (parseFloat(prev) + 0.5).toFixed(2))
  }

  const decrease = () => {
    setTempValue((prev) => Math.max(parseFloat(prev) - 0.5, 0).toFixed(2))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[800px] p-0">
        <DialogHeader className="bg-accent p-4">
          <DialogTitle className="text-center text-lg font-bold text-accent-foreground">
            Insert Stake Amount
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-3">
            <input
              className="flex-1 border border-input bg-background px-4 py-2 text-right font-bold text-xl"
              value={tempValue}
              readOnly
            />
            <Button className='bg-betSlip h-12 w-36' onClick={removeLastDigit}>
              <Delete style={{ width: '40px', height: '40px' }} className='text-betSlip-header-foreground'/>
            </Button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <div className="flex flex-col gap-2">
              <Button onClick={decrease} className="bg-accent text-accent-foreground h-full w-full text-4xl">-</Button>
            </div>
            <div className="col-span-3 grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <Button key={i + 1} onClick={() => appendValue((i + 1).toString())} className="bg-accent text-accent-foreground h-14 w-full text-xl">{i + 1}</Button>
              ))}
              <Button className="bg-accent text-accent-foreground h-14 w-full text-xl"></Button>
              <Button onClick={() => appendValue('0')} className="bg-accent text-accent-foreground h-14 w-full text-xl">0</Button>
              <Button onClick={() => appendValue('.')} className="bg-accent text-accent-foreground h-14 w-full text-xl">.</Button>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={increase} className="bg-accent text-accent-foreground h-full w-full text-4xl">+</Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[0.5, 1, 2, 5, 10, 50, 75, 100].map((amount) => (
              <Button
                key={amount}
                onClick={() => addAmount(amount)}
                className="h-12 w-full text-lg font-bold text-white bg-tertiary hover:bg-tertiary/80"
              >
                + € {amount.toFixed(2)}
              </Button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              className="flex-1 bg-gray-600 text-white text-md hover:bg-gray-700"
              onClick={resetValue}
            >
              Delete
            </Button>
            <Button
              className="flex-1 bg-green-600 text-white text-md hover:bg-green-700"
              onClick={() => onConfirm(parseFloat(tempValue))}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
