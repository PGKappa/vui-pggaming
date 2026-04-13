'use client'

import { useState } from 'react'
import { Button } from '@/retail-components/ui/button'
import { Input } from '@/retail-components/ui/input'
import TicketCheckDialog from '@/retail-components/ticket-check-dialog'
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [ticketId, setTicketId] = useState<number | null>(null)
  const router = useRouter()

  const handleClick = (val: string) => {
    if (val === '⌫') {
      setCode((prev) => prev.slice(0, -1))
    } else {
      setCode((prev) => prev + val)
    }
  }

  const handleSubmit = () => {
    const id = parseInt(code, 10)
    if (!isNaN(id) && id > 0) {
      setTicketId(id)
      setDialogOpen(true)
    }
  }

  return (
    <main className="fixed bottom-0 left-0 right-0 top-[60px] z-50 flex flex-col justify-between bg-black py-4 text-accent-foreground lg:py-6">
      {/* Title Bar */}
      <div className="relative bottom-[20px] mb-5 flex h-[48px] w-full items-center justify-between border-b border-white/10 bg-accent pb-4 lg:h-[64px]">
        <div className="w-10" />
        <h1 className="pt-3 text-[13px] font-bold uppercase tracking-widest text-white lg:text-[16px]">
          {t('ticket_check', 'Ticket Check')}
        </h1>
        <Button
          variant="navbar"
          onClick={() => router.push('/retail/horses')}
          className="h-8 w-8 bg-accent lg:h-10 lg:w-10"
        >
          <XIcon className="h-8 w-8 lg:h-10 lg:w-10" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-[16px] font-semibold lg:text-[22px]">
          {t('scan_or_enter_code')}
        </p>
        <Input
          className="mt-6 h-10 w-[320px] bg-white text-center text-[16px] font-bold text-foreground lg:mt-10 lg:h-12 lg:w-[480px] lg:text-[20px]"
          readOnly
          value={code}
        />
        <div className="mt-6 flex flex-col space-y-1 lg:mt-10 lg:space-y-2">
          {KEY_LAYOUT.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="flex justify-center space-x-1 lg:space-x-2"
            >
              {row.map((key) => (
                <Button
                  key={key}
                  className="h-12 w-12 rounded-none bg-secondary text-[16px] font-bold text-tertiary-foreground lg:h-20 lg:w-20 lg:text-[22px]"
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
          className="h-12 w-[90vw] bg-bet text-[16px] font-bold text-white lg:h-16 lg:w-[1200px] lg:text-[20px]"
          onClick={handleSubmit}
        >
          {t('confirm')}
        </Button>
      </div>

      <TicketCheckDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ticketId={ticketId}
      />
    </main>
  )
}
