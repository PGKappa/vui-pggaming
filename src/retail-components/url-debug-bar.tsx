'use client'

import { CashierContext } from '@/retail-contexts/cashier-context'
import { useContext, useEffect, useRef, useState } from 'react'

type ChangeEvent = {
  time: string
  from: string | null
  to: string | null
}

const HISTORY_SIZE = 6

/**
 * Barra di debug fissa in basso che mostra l'URL corrente, il valore di
 * `init_code` e i dati restituiti dalla cashier init (cash_init).
 *
 * Utile in produzione quando il browser e' nascosto e non si vede la barra
 * degli indirizzi, per capire SE e QUANDO l'URL / i dati del cashier
 * cambiano durante l'esecuzione.
 *
 * - Legge `window.location.href` con un polling breve (300ms) in modo da
 *   intercettare qualsiasi modifica dell'URL, anche quelle fatte tramite
 *   `history.pushState`/`replaceState` che non emettono eventi standard.
 * - Monitora esplicitamente `init_code` (dall'URL) e `userid` (derivato
 *   da cash_init) e mostra old -> new ad ogni variazione, cosi' si
 *   riesce a capire in quale momento e verso quale valore sono cambiati.
 */
export default function UrlDebugBar() {
  const cashier = useContext(CashierContext)

  const [url, setUrl] = useState<string>('')
  const [initCode, setInitCode] = useState<string | null>(null)
  const [initCodeChanges, setInitCodeChanges] = useState<ChangeEvent[]>([])
  const [userIdChanges, setUserIdChanges] = useState<ChangeEvent[]>([])
  const [urlChangeCount, setUrlChangeCount] = useState(0)
  const [lastUrlChange, setLastUrlChange] = useState<string>('')
  const prevUrlRef = useRef<string>('')
  const prevInitCodeRef = useRef<string | null | undefined>(undefined)
  const prevUserIdRef = useRef<string | null | undefined>(undefined)

  // Poll window.location e tracking cambi URL / init_code
  useEffect(() => {
    if (typeof window === 'undefined') return

    const update = () => {
      const currentUrl = window.location.href
      if (currentUrl === prevUrlRef.current) return

      const isFirst = prevUrlRef.current === ''
      prevUrlRef.current = currentUrl
      setUrl(currentUrl)

      let currentInitCode: string | null = null
      try {
        const params = new URLSearchParams(window.location.search)
        currentInitCode = params.get('init_code')
      } catch {
        currentInitCode = null
      }
      setInitCode(currentInitCode)

      if (!isFirst) {
        setUrlChangeCount((c) => c + 1)
        setLastUrlChange(new Date().toLocaleTimeString())
      }

      if (prevInitCodeRef.current === undefined) {
        prevInitCodeRef.current = currentInitCode
      } else if (prevInitCodeRef.current !== currentInitCode) {
        const prev = prevInitCodeRef.current
        prevInitCodeRef.current = currentInitCode
        setInitCodeChanges((h) =>
          [
            ...h,
            {
              time: new Date().toLocaleTimeString(),
              from: prev ?? null,
              to: currentInitCode,
            },
          ].slice(-HISTORY_SIZE),
        )
      }
    }

    update()
    const interval = setInterval(update, 300)
    window.addEventListener('popstate', update)
    window.addEventListener('hashchange', update)
    return () => {
      clearInterval(interval)
      window.removeEventListener('popstate', update)
      window.removeEventListener('hashchange', update)
    }
  }, [])

  // Estrai i campi rilevanti da cashierData (cash_init). Il payload e'
  // tipizzato come `any`, quindi proviamo diverse combinazioni di nomi
  // per trovare l'userid a prescindere da come sia stato esposto.
  const cashierData: any = cashier.cashierData
  const configs: any = cashierData?.configs
  const userTypeRaw = configs?.user_type
  const terminalFromCfg =
    Array.isArray(configs?.terminals) && configs.terminals.length > 0
      ? configs.terminals[0]
      : undefined
  const userIdCandidates = [
    cashierData?.userid,
    cashierData?.userId,
    cashierData?.user_id,
    cashierData?.user?.id,
    cashierData?.user?.userid,
    cashierData?.user?.user_id,
    configs?.userid,
    configs?.userId,
    configs?.user_id,
    configs?.user?.id,
  ].filter((v) => v !== undefined && v !== null && v !== '')
  const userId =
    userIdCandidates.length > 0 ? String(userIdCandidates[0]) : null

  // Tracking cambi userid (derivato dal CashierContext)
  useEffect(() => {
    if (prevUserIdRef.current === undefined) {
      prevUserIdRef.current = userId
      return
    }
    if (prevUserIdRef.current !== userId) {
      const prev = prevUserIdRef.current
      prevUserIdRef.current = userId
      setUserIdChanges((h) =>
        [
          ...h,
          {
            time: new Date().toLocaleTimeString(),
            from: prev ?? null,
            to: userId,
          },
        ].slice(-HISTORY_SIZE),
      )
    }
  }, [userId])

  const cashInitKeys =
    cashierData && typeof cashierData === 'object'
      ? Object.keys(cashierData).sort().join(', ')
      : ''

  const cashierStatus = cashier.hasCashierError
    ? 'error'
    : cashier.isLoadingCashier
      ? 'loading'
      : cashierData
        ? 'ok'
        : 'idle'

  const initCodeChanged = initCodeChanges.length > 0
  const userIdChanged = userIdChanges.length > 0
  const hasAlert = initCodeChanged || userIdChanged

  const formatChange = (c: ChangeEvent) =>
    `[${c.time}] ${c.from ?? '(missing)'} -> ${c.to ?? '(missing)'}`

  return (
    <div
      data-testid="url-debug-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        // Superiore a splash screen (9999) e a qualsiasi dialog/overlay
        zIndex: 2147483647,
        background: hasAlert ? 'rgba(80, 0, 0, 0.92)' : 'rgba(0, 0, 0, 0.88)',
        color: '#00ff88',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        padding: '4px 8px',
        lineHeight: 1.35,
        pointerEvents: 'none',
        wordBreak: 'break-all',
        whiteSpace: 'pre-wrap',
        borderTop: `1px solid ${hasAlert ? '#ff5555' : '#00ff88'}`,
      }}
    >
      <div>
        <span style={{ color: '#ffcc00' }}>init_code:</span>{' '}
        <span style={{ color: initCode ? '#00ff88' : '#ff5555' }}>
          {initCode ?? '(missing)'}
        </span>
        <span style={{ color: '#888' }}>{'  |  '}</span>
        <span style={{ color: '#ffcc00' }}>ctx init_code:</span>{' '}
        <span
          style={{
            color:
              cashier.initCode && cashier.initCode === initCode
                ? '#00ff88'
                : cashier.initCode
                  ? '#ff5555'
                  : '#888',
          }}
        >
          {cashier.initCode ?? '(none)'}
        </span>
        <span style={{ color: '#888' }}>{'  |  '}</span>
        <span style={{ color: '#ffcc00' }}>URL changes:</span> {urlChangeCount}
        {lastUrlChange && (
          <>
            <span style={{ color: '#888' }}>{'  |  '}</span>
            <span style={{ color: '#ffcc00' }}>last:</span> {lastUrlChange}
          </>
        )}
      </div>
      <div>
        <span style={{ color: '#ffcc00' }}>userid:</span>{' '}
        <span style={{ color: userId ? '#00ff88' : '#ff5555' }}>
          {userId ?? '(not found)'}
        </span>
        <span style={{ color: '#888' }}>{'  |  '}</span>
        <span style={{ color: '#ffcc00' }}>operator:</span>{' '}
        {cashier.operator ?? '-'}
        <span style={{ color: '#888' }}>{'  |  '}</span>
        <span style={{ color: '#ffcc00' }}>terminal:</span>{' '}
        {cashier.terminalId ?? terminalFromCfg ?? '-'}
        <span style={{ color: '#888' }}>{'  |  '}</span>
        <span style={{ color: '#ffcc00' }}>user_type:</span>{' '}
        {userTypeRaw ?? '-'}
        <span style={{ color: '#888' }}>{'  |  '}</span>
        <span style={{ color: '#ffcc00' }}>playerId:</span>{' '}
        {cashier.userData?.playerId ?? '-'}
        <span style={{ color: '#888' }}>{'  |  '}</span>
        <span style={{ color: '#ffcc00' }}>cash_init:</span>{' '}
        <span
          style={{
            color:
              cashierStatus === 'ok'
                ? '#00ff88'
                : cashierStatus === 'error'
                  ? '#ff5555'
                  : '#ffaa66',
          }}
        >
          {cashierStatus}
        </span>
      </div>
      <div style={{ opacity: 0.85 }}>
        <span style={{ color: '#ffcc00' }}>URL:</span> {url}
      </div>
      {initCodeChanged && (
        <div style={{ color: '#ff8888', fontWeight: 'bold' }}>
          <span style={{ color: '#ff3333' }}>!! init_code CHANGED x</span>
          {initCodeChanges.length}
          <span style={{ color: '#ff3333' }}>{' -> '}</span>
          {initCodeChanges.map(formatChange).join('  ||  ')}
        </div>
      )}
      {userIdChanged && (
        <div style={{ color: '#ff8888', fontWeight: 'bold' }}>
          <span style={{ color: '#ff3333' }}>!! userid CHANGED x</span>
          {userIdChanges.length}
          <span style={{ color: '#ff3333' }}>{' -> '}</span>
          {userIdChanges.map(formatChange).join('  ||  ')}
        </div>
      )}
      {cashInitKeys && (
        <div style={{ opacity: 0.7, color: '#88ccff' }}>
          <span style={{ color: '#ffcc00' }}>cash_init keys:</span>{' '}
          {cashInitKeys}
        </div>
      )}
    </div>
  )
}
