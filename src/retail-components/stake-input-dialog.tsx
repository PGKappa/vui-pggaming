'use client'

import { Button } from '@/retail-components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/retail-components/ui/dialog'
import { Input } from '@/retail-components/ui/input'
import { Delete } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function StakeInputDialog(props: {
  value: number
  setValue: (value: number) => void
}) {
  const { t } = useTranslation()
  const [value, setValue] = useState(props.value)
  const [dialogValue, setDialogValue] = useState(props.value)
  const [open, setOpen] = useState(false)

  // Sync with props.value when it changes from outside
  useEffect(() => {
    setValue(props.value)
  }, [props.value])

  // Reset dialog value when opening the dialog
  useEffect(() => {
    if (open) {
      setDialogValue(value)
    }
  }, [open, value])

  // Functions used multiple times are defined as named functions
  const handleAppendDigit = (digit: string) => {
    setDialogValue((currentValue) => {
      const strValue = currentValue === 0 ? '' : currentValue.toString()
      const newValue = parseFloat(`${strValue}${digit}`) || 0
      return newValue
    })
  }

  const displayValue = dialogValue.toFixed(2)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex w-fit items-center border border-border relative left-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-7 bg-bet p-3 text-[18px] text-bet-foreground"
            onClick={(e) => {
              e.stopPropagation()
              const newValue = value < 0.5 ? 0 : value - 0.5
              setValue(newValue)
              props.setValue(newValue)
            }}
          >
            -
          </Button>
          <Input
            type="number"
            value={value.toFixed(2)}
            className="bg-background-foreground h-8 w-[237px] border-x text-center text-[15px]"
            readOnly
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-7 bg-bet p-3 text-[18px] text-bet-foreground"
            onClick={(e) => {
              e.stopPropagation()
              const newValue = value + 0.5
              setValue(newValue)
              props.setValue(newValue)
            }}
          >
            +
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="w-[600px] p-0">
        <DialogHeader className="bg-accent p-4">
          <DialogTitle className="text-center text-[19px] font-bold text-accent-foreground">
            {t('enter_stake_amount')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-center space-x-3">
            <input
              className="flex-1 border border-input bg-background px-4 py-2 text-right text-xl font-bold"
              value={displayValue}
              readOnly
            />
            <Button
              className="h-12 w-28 bg-betSlip"
              onClick={() =>
                setDialogValue((currentValue) => {
                  const strValue = currentValue.toString()
                  if (strValue.length <= 1) return 0
                  return parseFloat(strValue.slice(0, -1)) || 0
                })
              }
            >
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
                  onClick={() =>
                    setDialogValue((prev) => Math.max(prev - 0.5, 0))
                  }
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
                    onClick={() => setDialogValue((prev) => prev + amount)}
                    className="h-12 w-full bg-tertiary text-[20px] font-bold text-white"
                  >
                    +{amount.toFixed(2)}€
                  </Button>
                ))}
              </div>

              {/* Bottone + */}
              <div className="flex items-center">
                <Button
                  onClick={() => setDialogValue((prev) => prev + 0.5)}
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
                  onClick={() => handleAppendDigit(val.toString())}
                  className="h-14 w-full bg-accent text-xl text-accent-foreground"
                >
                  {val}
                </Button>
              ))}
            </div>

            {/* Bottoni Delete e Done */}
            <div className="mt-2 flex gap-2">
              <Button
                className="flex-1 bg-gray-600 text-[16px] text-white"
                onClick={() => {
                  setDialogValue(0)
                }}
              >
                {t('clear')}
              </Button>
              <Button
                className="flex-1 bg-green-600 text-[16px] text-white"
                onClick={() => {
                  setValue(dialogValue)
                  props.setValue(dialogValue)
                  setOpen(false)
                }}
              >
                {t('done')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
