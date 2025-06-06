'use client'

import { useState } from 'react'
import { Button } from '@/retail-components/ui/button'
import { Input } from '@/retail-components/ui/input'
import { useRouter } from 'next/navigation'
import { XIcon } from 'lucide-react'

const KEY_LAYOUT = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', '7', '8', '9', '-'],
  ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', '4', '5', '6', '0'],
  ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'WWW', '1', '2', '3', '⌫'],
]

export default function TicketCheckPage() {
  const [code, setCode] = useState('')
  const router = useRouter()

  const handleClick = (val: string) => {
    if (val === '⌫') {
      setCode((prev) => prev.slice(0, -1))
    } else {
      setCode((prev) => prev + val)
    }
  }

  const handleSubmit = () => {
    console.log('[TicketCheck] Submitted code:', code)
  }

  return (
    <main className="fixed inset-0 z-50 flex flex-col justify-between bg-accent px-4 py-6 text-accent-foreground">
      <Button
        variant="navbar"
        onClick={() => router.back()}
        className="absolute right-4 top-4 hover:opacity-80"
      >
        <XIcon className="h-6 w-6" />
      </Button>

      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-[22px] font-semibold">
          Scan receipts or enter the code.
        </p>

        <Input
          className="mt-10 h-12 w-[480px] bg-muted text-center text-[20px] font-bold text-foreground"
          readOnly
          value={code}
        />

        <div className="mt-10 flex flex-col gap-1">
          {KEY_LAYOUT.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-2">
              {row.map((key) => (
                <Button
                  key={key}
                  className="h-20 w-20 rounded-none bg-tertiary text-[22px] font-bold text-tertiary-foreground hover:bg-tertiary/80"
                  onClick={() => handleClick(key)}
                >
                  {key}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          className="h-16 w-[1200px] bg-green-600 text-[20px] font-bold text-white hover:bg-green-700"
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>
    </main>
  )
}
