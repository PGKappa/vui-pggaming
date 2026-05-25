'use client'
import { useState } from 'react'
import { Button } from '@/retail-components/ui/button'
import { Input } from '@/retail-components/ui/input'
import TicketCheckDialog from '@/retail-components/ticket-check-dialog'
import { useTranslation } from 'react-i18next'

const LETTER_LAYOUT = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
  ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'WWW'],
]

const NUMPAD_LAYOUT = [
  ['7', '8', '9', '-'],
  ['4', '5', '6', '0'],
  ['1', '2', '3', '⌫'],
]

interface TicketCheckPageContentProps {
  returnPath?: string
}

export default function TicketCheckPageContent(
  _props: TicketCheckPageContentProps,
) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [ticketId, setTicketId] = useState<number | null>(null)

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
          <main
          className="fixed bottom-0 left-0 right-0 top-[60px] z-50 flex flex-col justify-between py-4 text-accent-foreground lg:py-6"
          style={{
            backgroundImage: "url('/bg-stadium.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            
          }}
        >
         {/* RICEVUTA DI PAGAMENTO - alto sinistra */}
        <div className="absolute left-[191px] top-[108px] flex flex-col items-center pointer-events-none">
          <div className="w-full h-[44px] bg-red-900 text-white text-[15px] font-bold  uppercase text-center pt-3 px-2
   mb-[9px]">
            RICEVUTA DI PAGAMENTO
          </div>
          <img
            src="/esTicket2.png"
            alt="Ricevuta di pagamento"
            className="w-[270px] lg:w-[260px] lg:h-[273px] opacity-90"
          />
        </div>

        {/* RICEVUTA CASH OUT - alto destra */}
        <div className="absolute right-[191px] top-[108px] flex flex-col items-center pointer-events-none">
          <div className="w-full h-[44px] bg-red-900 text-white text-[15px] font-bold  uppercase text-center pt-3 px-2
   mb-[9px]">
            RICEVUTA CASH OUT
          </div>
          <img
            src="/esTicket1.png"
            alt="Ricevuta cash out"
            className="w-[270px] lg:w-[260px] lg:h-[273px] opacity-90"
          />
        </div>
        
      {/* Title Bar */}
      <div className="relative bottom-[20px] flex h-10 shrink-0 items-center justify-center bg-secondary text-accent-foreground lg:h-16">
        <h1 className="text-[12px] font-bold uppercase lg:text-[16px]">
          {t('ticket_check', 'Ticket Check')}
        </h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-[16px] font-semibold lg:text-[22px] relative bottom-[80px]">
          {t('scan_or_enter_code')}
        </p>

        <Input
          className="mt-6 h-10 w-[320px] bg-white text-center text-[16px] font-bold text-foreground lg:mt-10 lg:h-10 lg:w-[370px] lg:text-[20px] relative bottom-[110px] rounded-md"
          readOnly
          value={code}
        />

        <div className="mt-6 flex flex-row items-start gap-4 lg:mt-40 lg:gap-6 relative top-[15px]">
          {/* Lettere */}
          <div className="flex flex-col space-y-1 lg:space-y-2">
            {LETTER_LAYOUT.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className="flex justify-center space-x-1 lg:space-x-2"
              >
                {row.map((key) => (
                  <Button
                    key={key}
                    className="h-12 w-12 rounded-md bg-secondary text-[16px] font-bold text-tertiary-foreground lg:h-[60px] lg:w-[76px] lg:text-[23px] lg:font-sans"
                    onClick={() => handleClick(key)}
                  >
                    {key}
                  </Button>
                ))}
              </div>
            ))}
          </div>

          {/* Numpad */}
          <div className="flex flex-col space-y-1 lg:space-y-2">
            {NUMPAD_LAYOUT.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className="flex justify-center space-x-1 lg:space-x-2"
              >
                {row.map((key) => (
                  <Button
                    key={key}
                    className="h-12 w-12 rounded-md bg-secondary text-[16px] font-bold text-tertiary-foreground lg:h-[60px] lg:w-[76px] lg:text-[23px]"
                    onClick={() => handleClick(key)}
                  >
                    {key}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          className="h-12 w-[90vw] bg-bet text-[16px] font-bold text-white lg:h-16 lg:w-[1865px] rounded-md lg:text-[23px] uppercase"
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
