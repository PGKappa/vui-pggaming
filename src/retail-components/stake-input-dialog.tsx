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

export default function StakeInputDialog({
  open,
  initialValue,
  onClose,
  onConfirm,
}: StakeDialogProps) {
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
      <DialogContent className="w-[600px] p-0">
        <DialogHeader className="bg-accent p-4">
          <DialogTitle className="text-center text-lg font-bold text-accent-foreground">
            Insert Stake Amount
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-3">
            <input
              className="flex-1 border border-input bg-background px-4 py-2 text-right text-xl font-bold"
              value={tempValue}
              readOnly
            />
            <Button className="h-12 w-28 bg-betSlip" onClick={removeLastDigit}>
              <Delete
                style={{ width: '40px', height: '40px' }}
                className="text-betSlip-header-foreground"
              />
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Blocchi - preset + */}
            <div className="flex justify-between gap-4">
              {/* Bottone - */}
              <div className="flex items-center">
                <Button
                  onClick={decrease}
                  className="h-full w-28 bg-tertiary text-3xl text-accent-foreground"
                >
                  -
                </Button>
              </div>

              {/* Valori preimpostati */}
              <div className="grid flex-grow grid-cols-2 gap-3">
                {[0.5, 1, 2, 5, 10, 50, 75, 100].map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => addAmount(amount)}
                    className="h-12 w-full bg-tertiary text-[20px] font-bold text-white hover:bg-tertiary/80"
                  >
                    +{amount.toFixed(2)}€
                  </Button>
                ))}
              </div>

              {/* Bottone + */}
              <div className="flex items-center">
                <Button
                  onClick={increase}
                  className="h-full w-28 bg-tertiary text-5xl text-accent-foreground"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Tastierino numerico */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, '.', ''].map((val, i) => (
                <Button
                  key={i}
                  disabled={val === ''}
                  onClick={() => appendValue(val.toString())}
                  className="h-14 w-full bg-accent text-xl text-accent-foreground"
                >
                  {val}
                </Button>
              ))}
            </div>

            {/* Bottoni Delete e Done */}
            <div className="mt-2 flex gap-2">
              <Button
                className="flex-1 bg-gray-600 text-[16px] text-white hover:bg-gray-700"
                onClick={resetValue}
              >
                Delete
              </Button>
              <Button
                className="flex-1 bg-green-600 text-[16px] text-white hover:bg-green-700"
                onClick={() => onConfirm(parseFloat(tempValue))}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
