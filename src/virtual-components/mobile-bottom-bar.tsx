'use client'

// Barra fissa in basso della versione mobile (sotto lg): un solo posto, sempre
// raggiungibile col pollice, per le tre cose che servono mentre si gioca.
//   [ Le mie scommesse ]  [   SCHEDINA (n)   ]  [ Classifica ]  ← solo calcio
// La schedina si apre come foglio dal basso quasi a tutto schermo; si chiude
// con la maniglia in alto o toccando fuori.
import { BetsContext } from '@/virtual-contexts/bets-context'
import { cn } from '@/virtual-lib/utils'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ChevronDown, ReceiptText, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BettingSlip } from './lazy-components'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet'

/** altezza della barra: le pagine lasciano questo spazio in fondo */
export const MOBILE_BAR_SPACE =
  'mb-[calc(4rem+env(safe-area-inset-bottom))] lg:mb-0'

const sideItemClass =
  'flex h-12 w-20 shrink-0 flex-col items-center justify-center gap-0.5 rounded-sm text-[10px] font-semibold uppercase leading-tight text-navbarBg-foreground/85 transition-colors active:bg-white/10'

/** foglio dal basso con maniglia di chiusura, comune a schedina e classifica */
export function MobileSheet(props: {
  title: string
  trigger: ReactNode
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetTrigger asChild>{props.trigger}</SheetTrigger>
      <SheetContent
        side="bottom"
        // il tasto X di default copre l'intestazione: si chiude dalla maniglia
        className="flex h-[92dvh] flex-col gap-0 overflow-hidden rounded-t-lg border-0 p-0 [&>button:last-child]:hidden"
      >
        <VisuallyHidden>
          <SheetTitle>{props.title}</SheetTitle>
          <SheetDescription />
        </VisuallyHidden>
        <SheetClose
          className="flex h-7 w-full shrink-0 items-center justify-center bg-card-header text-card-header-foreground/70"
          aria-label={props.title}
        >
          <span className="h-1 w-10 rounded-full bg-current" />
        </SheetClose>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {props.children}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function MobileBottomBar(props: {
  /** tasto in più a destra (es. classifica del calcio) */
  extra?: ReactNode
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const { betEntries } = useContext(BetsContext)
  const count = betEntries.length
  const [slipOpen, setSlipOpen] = useState(false)

  // piccolo "salto" del contatore quando si aggiunge una giocata: conferma
  // che la scelta è finita in schedina senza aprirla
  const [bump, setBump] = useState(false)
  const previous = useRef(count)
  useEffect(() => {
    if (count > previous.current) {
      setBump(true)
      const id = setTimeout(() => setBump(false), 300)
      previous.current = count
      return () => clearTimeout(id)
    }
    previous.current = count
  }, [count])

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 bg-navbarBg px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-2px_8px_rgba(0,0,0,0.25)] lg:hidden">
      <button
        type="button"
        className={sideItemClass}
        onClick={() => router.push(`/virtual/bets${window.location.search}`)}
      >
        <ReceiptText className="size-5" />
        <span className="line-clamp-2 text-center">{t('my_bets')}</span>
      </button>

      <MobileSheet
        title={t('bet_slip')}
        open={slipOpen}
        onOpenChange={setSlipOpen}
        trigger={
          <button
            type="button"
            className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-sm bg-footer-betslip px-3 text-md font-bold uppercase text-footer-betslip-foreground shadow-sm transition-transform active:scale-[0.98]"
          >
            <span className="truncate">{t('bet_slip')}</span>
            <span
              className={cn(
                'flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-sm font-bold tabular-nums text-black transition-transform duration-300',
                bump && 'scale-125',
              )}
            >
              {count}
            </span>
            <ChevronDown className="size-4 rotate-180 opacity-80" />
          </button>
        }
      >
        <BettingSlip />
      </MobileSheet>

      {props.extra ?? <span className="w-20 shrink-0" aria-hidden />}
    </nav>
  )
}

/** tasto laterale della barra, per i fogli aggiuntivi (es. classifica) */
export function MobileBarSheetItem(props: {
  title: string
  children: ReactNode
}) {
  return (
    <MobileSheet
      title={props.title}
      trigger={
        <button type="button" className={sideItemClass}>
          <Trophy className="size-5" />
          <span className="line-clamp-2 text-center">{props.title}</span>
        </button>
      }
    >
      {props.children}
    </MobileSheet>
  )
}
