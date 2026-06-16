'use client'
import Image from 'next/image'
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
      <div className="pointer-events-none absolute left-[191px] top-[108px] flex flex-col items-center">
        <div className="mb-[9px] h-[44px] w-full rounded-sm bg-red-900 px-2 pt-3 text-center text-[15px] font-bold uppercase text-white">
          RICEVUTA DI PAGAMENTO
        </div>
        <Image
          src="/esTicket2.png"
          alt="Ricevuta di pagamento"
          width={270}
          height={273}
          className="w-[270px] opacity-90 lg:h-[273px] lg:w-[260px]"
        />
      </div>

      {/* RICEVUTA CASH OUT - alto destra */}
      <div className="pointer-events-none absolute right-[191px] top-[108px] flex flex-col items-center">
        <div className="mb-[9px] h-[44px] w-full rounded-sm bg-red-900 px-2 pt-3 text-center text-[15px] font-bold uppercase text-white">
          RICEVUTA CASH OUT
        </div>
        <Image
          src="/esTicket1.png"
          alt="Ricevuta cash out"
          width={270}
          height={273}
          className="w-[270px] opacity-90 lg:h-[273px] lg:w-[260px]"
        />
      </div>

      {/* Title Bar */}
      <div className="relative bottom-[20px] flex h-10 shrink-0 items-center justify-center bg-secondary text-accent-foreground lg:h-16">
        <h1 className="text-[12px] font-bold uppercase lg:text-[16px]">
          {t('ticket_check', 'Ticket Check')}
        </h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="relative bottom-[80px] text-[16px] font-semibold lg:text-[22px]">
          {t('scan_or_enter_code')}
        </p>

        <Input
          className="relative bottom-[110px] mt-6 h-10 w-[320px] rounded-md bg-white text-center text-[16px] font-bold text-foreground lg:mt-10 lg:h-10 lg:w-[370px] lg:text-[20px]"
          readOnly
          value={code}
        />

        <div className="relative top-[15px] mt-6 flex flex-row items-start space-x-4 lg:mt-40 lg:space-x-6">
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
                    className="h-12 w-12 rounded-md bg-secondary text-[16px] font-bold text-tertiary-foreground lg:h-[60px] lg:w-[76px] lg:font-sans lg:text-[23px]"
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
          className="h-12 w-[90vw] rounded-md bg-bet font-sans text-[16px] font-bold uppercase text-white lg:h-16 lg:w-[1865px] lg:text-[22px]"
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
