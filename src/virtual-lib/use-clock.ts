'use client'

import { DependencyList, useEffect, useSyncExternalStore } from 'react'

// Orologio unico per tutti i conti alla rovescia e i controlli al secondo.
// - un solo timer invece di uno per componente
// - scatta all'inizio di ogni secondo: tutti i timer cambiano insieme, in un
//   unico render, e il MM:SS non resta indietro di quasi un secondo
// - fermo con la scheda nascosta; al ritorno si aggiorna subito

type Listener = () => void

let now = Date.now()
const listeners = new Set<Listener>()
let timeoutId: ReturnType<typeof setTimeout> | undefined
let visibilityBound = false

function isHidden() {
  return typeof document !== 'undefined' && document.hidden
}

function stop() {
  if (timeoutId !== undefined) clearTimeout(timeoutId)
  timeoutId = undefined
}

function schedule() {
  stop()
  if (listeners.size === 0 || isHidden()) return
  // qualche ms dopo il cambio di secondo, per non cadere appena prima
  const delay = 1000 - (Date.now() % 1000) + 5
  timeoutId = setTimeout(tick, delay)
}

function tick() {
  now = Date.now()
  listeners.forEach((listener) => listener())
  schedule()
}

function onVisibilityChange() {
  if (isHidden()) stop()
  else tick()
}

export function subscribeClock(listener: Listener) {
  if (!visibilityBound && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
    visibilityBound = true
  }
  listeners.add(listener)
  if (listeners.size === 1) {
    // orologio rimasto fermo (nessun iscritto): si riparte dall'ora attuale
    now = Date.now()
    schedule()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) stop()
  }
}

const getSnapshot = () => now

/** ora attuale (ms), aggiornata a ogni secondo: il componente si ridisegna */
export function useNow(): number {
  return useSyncExternalStore(subscribeClock, getSnapshot, getSnapshot)
}

/**
 * Esegue `callback` subito e poi a ogni secondo, senza ridisegnare il
 * componente: per i controlli che aggiornano lo stato solo quando qualcosa
 * cambia davvero.
 */
export function useClockEffect(callback: () => void, deps: DependencyList) {
  useEffect(() => {
    callback()
    return subscribeClock(callback)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
