'use client'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/retail-components/ui/button'
import { Input } from '@/retail-components/ui/input'
import TicketCheckDialog from '@/retail-components/ticket-check-dialog'
import { cn } from '@/retail-lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

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

const COMPACT_KEY_CLASS = cn(
  'rounded-md bg-secondary font-bold text-tertiary-foreground',
  'h-[48px] w-[58px] text-[16px]',
)

const COMPACT_RECEIPT_IMAGE_CLASS = 'h-auto w-[200px] object-contain opacity-90'

interface TicketCheckPageContentProps {
  returnPath?: string
}

/**
 * Estrae l'id numerico del ticket leggendo le cifre da destra fino al primo
 * carattere non numerico: 'PG20930' -> 20930, '10:PG1064' -> 1064, '1100' -> 1100.
 * Restituisce null se non c'è una parte numerica finale valida.
 */
export function extractTicketId(code: string): number | null {
  const match = code.trim().match(/(\d+)$/)
  if (!match) {
    return null
  }
  const id = parseInt(match[1], 10)
  return Number.isNaN(id) || id <= 0 ? null : id
}

export default function TicketCheckPageContent(
  _props: TicketCheckPageContentProps,
) {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  // Precompila il campo con il ticket passato in query string (?ticket=PG1100)
  const ticketParam = (searchParams.get('ticket') ?? '').trim().toUpperCase()
  const [code, setCode] = useState(ticketParam)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [ticketId, setTicketId] = useState<number | null>(null)

  useEffect(() => {
    if (ticketParam) {
      setCode(ticketParam)
    }
  }, [ticketParam])

  const handleClick = (val: string) => {
    if (val === '⌫') {
      setCode((prev) => prev.slice(0, -1))
    } else {
      setCode((prev) => prev + val)
    }
  }

  const handleSubmit = () => {
    const id = extractTicketId(code)
    if (id === null) {
      toast.error(t('invalid_ticket_format', 'Formato ticket non corretto'))
      return
    }
    setTicketId(id)
    setDialogOpen(true)
  }

  const stadiumStyle = {
    backgroundImage: "url('/bg-stadium.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } as const

  return (
    <>
      {/* ≥1400px (es. 1920×1080): layout originale */}
      <main
        className="fixed bottom-0 left-0 right-0 top-[60px] z-50 hidden min-h-0 flex-col justify-between py-4 text-accent-foreground min-[1400px]:flex min-[1400px]:py-6"
        style={stadiumStyle}
      >
        <div className="pointer-events-none absolute left-[191px] top-[108px] flex flex-col items-center">
          <div className="mb-[9px] h-[44px] w-full rounded-sm bg-red-900 px-2 pt-3 text-center text-[15px] font-bold uppercase text-white">
            RICEVUTA DI PAGAMENTO
          </div>
          <Image
            src="/esTicket2.png"
            alt="Ricevuta di pagamento"
            width={270}
            height={273}
            className="w-[260px] opacity-90"
          />
        </div>

        <div className="pointer-events-none absolute right-[191px] top-[108px] flex flex-col items-center">
          <div className="mb-[9px] h-[44px] w-full rounded-sm bg-red-900 px-2 pt-3 text-center text-[15px] font-bold uppercase text-white">
            RICEVUTA CASH OUT
          </div>
          <Image
            src="/esTicket1.png"
            alt="Ricevuta cash out"
            width={270}
            height={273}
            className="w-[260px] opacity-90"
          />
        </div>

        <div className="relative bottom-[20px] flex h-16 shrink-0 items-center justify-center bg-secondary text-accent-foreground">
          <h1 className="text-[16px] font-bold uppercase">
            {t('ticket_check', 'Ticket Check')}
          </h1>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="relative bottom-[80px] text-[22px] font-semibold">
            {t('scan_or_enter_code')}
          </p>

          <Input
            className="relative bottom-[110px] mt-10 h-10 w-[370px] rounded-md bg-white text-center text-[20px] font-bold text-foreground"
            readOnly
            value={code}
          />

          <div className="relative top-[15px] mt-40 flex flex-row items-start space-x-6">
            <div className="flex flex-col space-y-2">
              {LETTER_LAYOUT.map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center space-x-2">
                  {row.map((key) => (
                    <Button
                      key={key}
                      className="h-[60px] w-[76px] rounded-md bg-secondary font-sans text-[23px] font-bold text-tertiary-foreground"
                      onClick={() => handleClick(key)}
                    >
                      {key}
                    </Button>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex flex-col space-y-2">
              {NUMPAD_LAYOUT.map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center space-x-2">
                  {row.map((key) => (
                    <Button
                      key={key}
                      className="h-[60px] w-[76px] rounded-md bg-secondary text-[23px] font-bold text-tertiary-foreground"
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
            className="h-16 w-[1865px] max-w-[calc(100vw-2rem)] rounded-md bg-bet font-sans text-[22px] font-bold uppercase text-white"
            onClick={handleSubmit}
          >
            {t('confirm')}
          </Button>
        </div>
      </main>

      {/* <1400px (es. 1280×720): layout compatto */}
      <main
        className="fixed bottom-0 left-0 right-0 top-[64px] z-50 flex min-h-0 flex-col text-accent-foreground min-[1400px]:hidden"
        style={stadiumStyle}
      >
        <div className="pointer-events-none absolute left-6 top-[84px] flex w-[200px] flex-col items-center">
          <div className="mb-[6px] flex h-[36px] w-full items-center justify-center rounded-sm bg-red-900 px-2 text-center text-[11px] font-bold uppercase leading-tight text-white">
            RICEVUTA DI PAGAMENTO
          </div>
          <Image
            src="/esTicket2.png"
            alt="Ricevuta di pagamento"
            width={270}
            height={273}
            className={COMPACT_RECEIPT_IMAGE_CLASS}
          />
        </div>

        <div className="pointer-events-none absolute right-6 top-[84px] flex w-[200px] flex-col items-center">
          <div className="mb-[6px] flex h-[36px] w-full items-center justify-center rounded-sm bg-red-900 px-2 text-center text-[11px] font-bold uppercase leading-tight text-white">
            RICEVUTA CASH OUT
          </div>
          <Image
            src="/esTicket1.png"
            alt="Ricevuta cash out"
            width={270}
            height={273}
            className={COMPACT_RECEIPT_IMAGE_CLASS}
          />
        </div>

        <div className="relative z-10 flex h-10 shrink-0 items-center justify-center bg-secondary">
          <h1 className="text-[13px] font-bold uppercase">
            {t('ticket_check', 'Ticket Check')}
          </h1>
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center space-y-3 px-4 py-2">
          <p className="max-w-[560px] text-center text-[15px] font-semibold leading-snug">
            {t('scan_or_enter_code')}
          </p>

          <Input
            className="h-10 w-full max-w-[320px] rounded-md bg-white text-center text-[16px] font-bold text-foreground"
            readOnly
            value={code}
          />

          <div className="mt-2 flex flex-row items-start space-x-3">
            <div className="flex flex-col space-y-1">
              {LETTER_LAYOUT.map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center space-x-1">
                  {row.map((key) => (
                    <Button
                      key={key}
                      className={COMPACT_KEY_CLASS}
                      onClick={() => handleClick(key)}
                    >
                      {key}
                    </Button>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex flex-col space-y-1">
              {NUMPAD_LAYOUT.map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center space-x-1">
                  {row.map((key) => (
                    <Button
                      key={key}
                      className={COMPACT_KEY_CLASS}
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

        <div className="relative z-10 shrink-0 px-4 pb-3 pt-1">
          <Button
            className="mx-auto h-12 w-full max-w-[860px] rounded-md bg-bet font-sans text-[16px] font-bold uppercase text-white"
            onClick={handleSubmit}
          >
            {t('confirm')}
          </Button>
        </div>
      </main>

      <TicketCheckDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ticketId={ticketId}
      />
    </>
  )
}
