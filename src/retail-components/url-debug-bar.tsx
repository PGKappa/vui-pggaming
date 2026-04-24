'use client'

import { CashierContext } from '@/retail-contexts/cashier-context'
import { EventsContext } from '@/retail-contexts/events-context'
import { useContext, useEffect, useRef, useState } from 'react'

type ChangeEvent = {
  time: string
  from: string | null
  to: string | null
}

const HISTORY_SIZE = 6
const MAX_CONSOLE_ERRORS = 5

type ConsoleEntry = {
  time: string
  level: 'error' | 'warn'
  message: string
}


const getCircularReplacer = () => {
  const seen = new WeakSet()
  return (_: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]'
      seen.add(value)
    }
    return value
  }
}


const safeStringify = (a: any): string => {
  if (typeof a === 'string') return a
  try {
    return JSON.stringify(a, getCircularReplacer())?.slice(0, 200) ?? String(a)
  } catch {
    try {
      return String(a)
    } catch {
      return '[unserializable]'
    }
  }
}

/**
 * Barra di debug fissa in basso — visibile SOLO con `debug=1` nell'URL.
 *
 * Mostra: init_code, operator, terminal, shopId, cashier status, lingua,
 * currency, versione API/FE, eventi carosello, risultati, disciplina,
 * pathname, URL changes, userid changes, init_code changes.
 */
export default function UrlDebugBar() {
  const cashier = useContext(CashierContext)
  const events = useContext(EventsContext)

  const [visible, setVisible] = useState(false)
  const [url, setUrl] = useState<string>('')
  const [initCode, setInitCode] = useState<string | null>(null)
  const [initCodeChanges, setInitCodeChanges] = useState<ChangeEvent[]>([])
  const [userIdChanges, setUserIdChanges] = useState<ChangeEvent[]>([])
  const [urlChangeCount, setUrlChangeCount] = useState(0)
  const [lastUrlChange, setLastUrlChange] = useState<string>('')
  const [now, setNow] = useState(() => new Date())
  const [consoleErrors, setConsoleErrors] = useState<ConsoleEntry[]>([])
  const prevUrlRef = useRef<string>('')
  const prevInitCodeRef = useRef<string | null | undefined>(undefined)
  const prevUserIdRef = useRef<string | null | undefined>(undefined)

  // Poll window.location e tracking cambi URL / init_code
  useEffect(() => {
    if (typeof window === 'undefined') return

    const update = () => {
      const currentUrl = window.location.href
      // Check debug param on every poll (in case URL changes)
      try {
        const params = new URLSearchParams(window.location.search)
        setVisible(params.get('debug') === '1')
      } catch {
        setVisible(false)
      }

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

  // Intercetta console.error e console.warn
  useEffect(() => {
    const origError = console.error
    const origWarn = console.warn

    const capture =
      (level: 'error' | 'warn') =>
      (...args: any[]) => {
        const msg = args
          .map(safeStringify)
          .join(' ')
          .slice(0, 300)
        setConsoleErrors((prev) =>
          [
            ...prev,
            { time: new Date().toLocaleTimeString(), level, message: msg },
          ].slice(-MAX_CONSOLE_ERRORS),
        )
        if (level === 'error') origError.apply(console, args)
        else origWarn.apply(console, args)
      }

    console.error = capture('error') as typeof console.error
    console.warn = capture('warn') as typeof console.warn

    return () => {
      console.error = origError
      console.warn = origWarn
    }
  }, [])

  // Clock aggiornato ogni secondo per il timestamp live
  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [visible])

  // Estrai i campi rilevanti da cashierData
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

  // Tracking cambi userid
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

  // Non renderizzare nulla se debug non è attivo
  if (!visible) return null

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

  // Info aggiuntive dal cashier
  const lang = cashierData?.dictInfo?.lang ?? '-'
  const currency = cashier.getCurrencyCode?.() ?? '-'
  const currencySymbol = cashier.getCurrencySymbol?.() ?? '-'
  const timezone = cashier.getTimezone?.() ?? '-'
  const apiVersion = cashier.getVersion?.() ?? '-'
  const feVersion = process.env.NEXT_PUBLIC_FE_VERSION ?? 'dev'
  const shopId =
    typeof window !== 'undefined'
      ? (localStorage.getItem('shopId') ?? '-')
      : '-'
  const minStake = cashier.getMinStake?.() ?? '-'
  const minBet = cashier.getMinBet?.() ?? '-'
  const maxWin = cashier.getMaxWin?.() ?? '-'
  const channels = cashier.getChannels?.() ?? []
  const stakeButtons = cashier.getStakeButtons?.() ?? []
  const retCode = cashierData?.ret_code ?? '-'

  // Info dagli eventi
  const upcomingCount = events.upcomingEvents?.length ?? 0
  const resultsCount = events.eventResults?.length ?? 0
  const eventsLoading = events.isLoadingEvents
  const disciplines = [
    ...new Set(events.upcomingEvents?.map((e) => e.discipline) ?? []),
  ]

  // Pathname corrente (senza query)
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '-'

  const S = ({ color = '#888' }: { color?: string }) => (
    <span style={{ color }}>{' | '}</span>
  )
  const L = ({ children, c = '#ffcc00' }: { children: string; c?: string }) => (
    <span style={{ color: c }}>{children}:</span>
  )

  return (
    <div
      data-testid="url-debug-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 2147483647,
        background: hasAlert ? 'rgba(80, 0, 0, 0.92)' : 'rgba(0, 0, 0, 0.92)',
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
      {/* Riga 1: Cashier core */}
      <div>
        <L>cash_init</L>{' '}
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
        {retCode !== '-' && <> (ret_code: {String(retCode)})</>}
        <S /> <L>init_code</L>{' '}
        <span style={{ color: initCode ? '#00ff88' : '#ff5555' }}>
          {initCode ?? '(missing)'}
        </span>
        <S /> <L>operator</L> {cashier.operator ?? '-'}
        <S /> <L>shop</L> {shopId}
        <S /> <L>terminal</L> {cashier.terminalId ?? terminalFromCfg ?? '-'}
        <S /> <L>user_type</L> {userTypeRaw ?? '-'}
        <S /> <L>userid</L>{' '}
        <span style={{ color: userId ? '#00ff88' : '#ff5555' }}>
          {userId ?? '(not found)'}
        </span>
        <S /> <L>playerId</L> {cashier.userData?.playerId ?? '-'}
      </div>

      {/* Riga 2: Configurazione */}
      <div>
        <L>lang</L> {lang}
        <S /> <L>currency</L> {currency} ({currencySymbol})
        <S /> <L>timezone</L> {timezone}
        <S /> <L>version</L> API {apiVersion} / FE {feVersion}
        <S /> <L>minStake</L> {String(minStake)}
        <S /> <L>minBet</L> {String(minBet)}
        <S /> <L>maxWin</L> {String(maxWin)}
        <S /> <L>stakeButtons</L> [{stakeButtons.join(', ')}]
        <S /> <L>channels</L> {channels.length} (
        {channels.map((c: any) => c?.name ?? '?').join(', ')})
      </div>

      {/* Riga 3: Eventi */}
      <div>
        <L>events</L>{' '}
        <span style={{ color: eventsLoading ? '#ffaa66' : '#00ff88' }}>
          {eventsLoading ? 'loading' : 'ready'}
        </span>
        <S /> <L>upcoming</L> {upcomingCount}
        <S /> <L>results</L> {resultsCount}
        <S /> <L>disciplines</L>{' '}
        {disciplines.length > 0 ? disciplines.join(', ') : '-'}
        <S /> <L>page</L> {pathname}
        <S /> <L>URL changes</L> {urlChangeCount}
        {lastUrlChange && <> (last: {lastUrlChange})</>}
        <S /> <L>clock</L> {now.toLocaleTimeString()}
      </div>

      {/* Riga 4: URL */}
      <div style={{ opacity: 0.8 }}>
        <L>URL</L> {url}
      </div>

      {/* Alert: init_code cambiato */}
      {initCodeChanged && (
        <div style={{ color: '#ff8888', fontWeight: 'bold' }}>
          <span style={{ color: '#ff3333' }}>!! init_code CHANGED x</span>
          {initCodeChanges.length}
          <span style={{ color: '#ff3333' }}>{' -> '}</span>
          {initCodeChanges.map(formatChange).join('  ||  ')}
        </div>
      )}

      {/* Alert: userid cambiato */}
      {userIdChanged && (
        <div style={{ color: '#ff8888', fontWeight: 'bold' }}>
          <span style={{ color: '#ff3333' }}>!! userid CHANGED x</span>
          {userIdChanges.length}
          <span style={{ color: '#ff3333' }}>{' -> '}</span>
          {userIdChanges.map(formatChange).join('  ||  ')}
        </div>
      )}

      {/* Console errors/warnings */}
      {consoleErrors.length > 0 && (
        <div
          style={{
            borderTop: '1px solid #ff5555',
            marginTop: 2,
            paddingTop: 2,
          }}
        >
          <span style={{ color: '#ff5555', fontWeight: 'bold' }}>
            console ({consoleErrors.length}):
          </span>
          {consoleErrors.map((entry, i) => (
            <div
              key={i}
              style={{
                color: entry.level === 'error' ? '#ff5555' : '#ffaa66',
                opacity: 0.9,
              }}
            >
              <span style={{ color: '#888' }}>[{entry.time}]</span>{' '}
              <span
                style={{
                  color: entry.level === 'error' ? '#ff3333' : '#ffaa00',
                  fontWeight: 'bold',
                }}
              >
                {entry.level.toUpperCase()}
              </span>{' '}
              {entry.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}