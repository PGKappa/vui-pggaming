'use client'

import { useState } from 'react'
import { Button } from '@/retail-components/ui/button'
import { Input } from '@/retail-components/ui/input'
import { useRouter } from 'next/navigation'
import { XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const KEY_LAYOUT = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', '7', '8', '9', '-'],
  ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', '4', '5', '6', '0'],
  ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'WWW', '1', '2', '3', '⌫'],
]

export default function TicketCheckPage() {
  const { t } = useTranslation()
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
    <main className="fixed top-[60px] left-0 right-0 bottom-0 z-50 flex flex-col justify-between bg-black py-4 lg:py-6 text-accent-foreground">

      {/* Title Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5 relative bottom-[20px] bg-accent h-[48px] lg:h-[64px] w-full">
        <div className="w-10" />
        <h1 className="text-[13px] lg:text-[16px] pt-3 font-bold uppercase tracking-widest text-white">
          {t('ticket_check', 'Ticket Check')}
        </h1>
        <Button
          variant="navbar"
          onClick={() => router.back()}
          className="h-8 w-8 lg:h-10 lg:w-10 bg-accent"
        >
          <XIcon className="h-8 w-8 lg:h-10 lg:w-10" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-[16px] lg:text-[22px] font-semibold">{t('scan_or_enter_code')}</p>
        <Input
          className="mt-6 lg:mt-10 h-10 lg:h-12 w-[320px] lg:w-[480px] bg-white text-center text-[16px] lg:text-[20px] font-bold text-foreground"
          readOnly
          value={code}
        />
        <div className="mt-6 lg:mt-10 flex flex-col space-y-1 lg:space-y-2">
          {KEY_LAYOUT.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center space-x-1 lg:space-x-2">
              {row.map((key) => (
                <Button
                  key={key}
                  className="h-12 w-12 lg:h-20 lg:w-20 rounded-none bg-secondary text-[16px] lg:text-[22px] font-bold text-tertiary-foreground"
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
          className="h-12 lg:h-16 w-[90vw] lg:w-[1200px] bg-bet text-[16px] lg:text-[20px] font-bold text-white"
          onClick={handleSubmit}
        >
          {t('confirm')}
        </Button>
      </div>

    </main>
  )
}