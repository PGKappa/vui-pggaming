'use client'

// Componenti pesanti caricati a parte (next/dynamic): il loro codice non pesa
// sul primo caricamento della pagina e si scarica quando serve, o prima, a
// browser inattivo, così all'apertura è già pronto.
import useMediaQuery from '@/virtual-lib/use-media-query'
import type { TicketDetailsDialogProps } from './ticket-details-dialog'
import dynamic from 'next/dynamic'
import { ComponentProps, useEffect, useState } from 'react'

const loadBettingSlip = () => import('./betting-slip')
const loadTicketDetailsDialog = () => import('./ticket-details-dialog')
const loadLatecomersDialog = () => import('./latecomers-dialog')

/** scarica in anticipo il codice della schedina (in parallelo alla cassa) */
export function preloadBettingSlip() {
  loadBettingSlip().catch(() => {})
}

// esegue `task` quando il browser è libero (o dopo poco, dove non c'è
// requestIdleCallback, es. Safari)
function whenIdle(task: () => void) {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(task, { timeout: 3000 })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(task, 1500)
  return () => clearTimeout(id)
}

export const BettingSlip = dynamic(loadBettingSlip, {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[300px] w-full animate-pulse rounded-sm bg-card shadow-sm" />
  ),
})

/**
 * Schedina della colonna destra, solo da lg in su. Prima restava montata
 * (nascosta) anche su mobile, dove la schedina è già nel foglio della barra
 * in basso: calcoli e controlli giravano due volte per niente.
 */
export function DesktopBettingSlip() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  return isDesktop ? <BettingSlip /> : null
}

// Monta il componente alla prima apertura e lo lascia montato (così si vede
// l'animazione di chiusura); il codice si precarica a browser inattivo
function useMountOnFirstOpen(open: boolean, preload: () => Promise<unknown>) {
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) setMounted(true)
  }, [open])
  useEffect(() => whenIdle(() => void preload().catch(() => {})), [preload])
  return mounted || open
}

const TicketDetailsDialogLazy = dynamic(loadTicketDetailsDialog, {
  ssr: false,
})

export function LazyTicketDetailsDialog(props: TicketDetailsDialogProps) {
  const mounted = useMountOnFirstOpen(props.open, loadTicketDetailsDialog)
  return mounted ? <TicketDetailsDialogLazy {...props} /> : null
}

const LatecomersDialogLazy = dynamic(loadLatecomersDialog, { ssr: false })

export function LazyLatecomersDialog(
  props: ComponentProps<typeof LatecomersDialogLazy>,
) {
  const mounted = useMountOnFirstOpen(props.isOpen, loadLatecomersDialog)
  return mounted ? <LatecomersDialogLazy {...props} /> : null
}
