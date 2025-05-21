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
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-accent text-accent-foreground px-4">
      <Button
        variant="navbarSelected"
        onClick={() => router.back()}
        className="absolute right-4 top-4 hover:opacity-80"
      >
        <XIcon className="h-6 w-6 text-accent-foreground" />
      </Button>

      <p className="mb-2 text-md font-semibold">
        Scan receipts or enter the code.
      </p>

      <Input
        className="mb-6 w-[360px] h-8 text-center text-lg font-bold bg-muted text-foreground"
        readOnly
        value={code}
      />

      <div className="flex flex-col gap-1">
        {KEY_LAYOUT.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-2">
            {row.map((key) => (
              <Button
                key={key}
                className="h-14 w-14 rounded-none bg-tertiary text-tertiary-foreground hover:bg-tertiary/80 text-md font-bold"
                onClick={() => handleClick(key)}
              >
                {key}
              </Button>
            ))}
          </div>
        ))}
      </div>

      <Button
        className="mt-6 w-[850px] bg-green-600 text-white hover:bg-green-700 text-md font-bold"
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </main>
  )
}
