import { RootContext } from '@/virtual-contexts/root-context'
import { Discipline } from '@/virtual-lib/types'
import { cn } from '@/virtual-lib/utils'
import { t } from 'i18next'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useContext, useEffect, useState } from 'react'

// Conto alla rovescia (MM:SS) verso l'evento più vicino della disciplina,
// nello stesso formato del carosello eventi (useTimeLeft)
function formatTimeLeft(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function NextEventTimer({ discipline }: { discipline: Discipline }) {
  const { upcomingEvents, upcomingRounds } = useContext(RootContext)
  const [timeLeft, setTimeLeft] = useState<string>()

  useEffect(() => {
    const update = () => {
      const now = Date.now()
      const times =
        discipline === Discipline.FOOTBALL
          ? (upcomingRounds ?? []).map((round) =>
              new Date(round.mag_event?.[0]?.startTime ?? NaN).getTime(),
            )
          : (upcomingEvents ?? [])
              .filter((event) => event.discipline === discipline)
              .map((event) => new Date(event.time).getTime())
      const next = Math.min(
        ...times.filter((time) => Number.isFinite(time) && time > now),
      )
      setTimeLeft(
        Number.isFinite(next) ? formatTimeLeft(next - now) : undefined,
      )
    }

    update()
    const intervalId = setInterval(update, 1000)
    return () => clearInterval(intervalId)
  }, [discipline, upcomingEvents, upcomingRounds])

  if (!timeLeft) return null

  return (
    <span className="rounded-sm bg-white px-1 text-center text-[10px] font-bold tabular-nums leading-tight text-black md:min-w-[56px] md:px-2 md:py-0.5 md:text-sm">
      {timeLeft}
    </span>
  )
}

function NavbarContent() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const initCode = searchParams.get('init_code')
  const skin = searchParams.get('skin') || 'default'
  const operator = searchParams.get('operator') || searchParams.get('partner')

  const queryParams = new URLSearchParams()
  if (initCode) queryParams.set('init_code', initCode)
  if (skin) queryParams.set('skin', skin)
  if (operator) queryParams.set('operator', operator)
  const betTemplate = searchParams.get('bet')
  if (betTemplate) queryParams.set('bet', betTemplate)
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''

  // confronto esatto sul percorso: '/virtual/dogs' non deve risultare attivo
  // su '/virtual/dogs8'
  const isActive = (path: string) => {
    const current = pathname.replace(/\/+$/, '')
    return current === path || current.startsWith(`${path}/`)
  }

  const tabClass = (path: string) =>
    cn(
      // mobile: nome su due righe piccole e timer sotto, senza icona
      'flex h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-sm px-1 text-center text-[10px] font-semibold uppercase leading-tight transition-colors md:flex-row md:gap-2 md:px-3 md:text-sm md:tracking-wide',
      isActive(path)
        ? 'bg-tertiary text-tertiary-foreground shadow-sm'
        : 'text-navbarBg-foreground/85 hover:bg-white/10 hover:text-navbarBg-foreground',
    )

  return (
    <nav className="flex w-full flex-row gap-1 bg-navbarBg p-2 md:gap-2">
      <Link
        href={`/virtual/dogs${queryString}`}
        className={tabClass('/virtual/dogs')}
        prefetch={false}
      >
        <Image
          src="/dog.png"
          alt="Dogs"
          width={60}
          height={33}
          className="hidden size-7 object-contain md:block"
          priority
        />
        <span>{t('dog6_racing')}</span>
        {/* il timer serve solo sulle discipline non selezionate */}
        {!isActive('/virtual/dogs') && (
          <NextEventTimer discipline={Discipline.DOGS} />
        )}
      </Link>

      <Link
        href={`/virtual/dogs8${queryString}`}
        className={tabClass('/virtual/dogs8')}
        prefetch={false}
      >
        <Image
          src="/dog.png"
          alt="Dogs 8"
          width={60}
          height={33}
          className="hidden size-7 object-contain md:block"
        />
        <span>{t('dog8_racing')}</span>
        {/* il timer serve solo sulle discipline non selezionate */}
        {!isActive('/virtual/dogs8') && (
          <NextEventTimer discipline={Discipline.DOGS8} />
        )}
      </Link>

      <Link
        href={`/virtual/horses${queryString}`}
        className={tabClass('/virtual/horses')}
        prefetch={false}
      >
        <Image
          src="/horse.png"
          alt="Horses"
          width={60}
          height={36}
          className="hidden size-7 object-contain md:block"
          priority
        />
        <span>{t('horse6_racing')}</span>
        {/* il timer serve solo sulle discipline non selezionate */}
        {!isActive('/virtual/horses') && (
          <NextEventTimer discipline={Discipline.HORSES} />
        )}
      </Link>

      <Link
        href={`/virtual/calcio${queryString}`}
        className={tabClass('/virtual/calcio')}
        prefetch={false}
      >
        <Image
          src="/soccer.png"
          alt="Calcio"
          width={42}
          height={42}
          className="hidden size-7 object-contain brightness-0 invert md:block"
        />
        <span>{t('football')}</span>
        {/* il timer serve solo sulle discipline non selezionate */}
        {!isActive('/virtual/calcio') && (
          <NextEventTimer discipline={Discipline.FOOTBALL} />
        )}
      </Link>
    </nav>
  )
}

export default function Navbar() {
  return (
    <Suspense
      fallback={
        <nav className="flex w-full flex-row gap-2 bg-navbarBg p-2 text-navbarBg-foreground">
          <div className="flex h-11 w-full flex-row items-center justify-center gap-2 px-2">
            <div className="h-5 w-10 animate-pulse rounded bg-white/20" />
            <span className="text-sm font-semibold uppercase">
              {t('dog6_racing')}
            </span>
          </div>
          <div className="flex h-11 w-full flex-row items-center justify-center gap-2 px-2">
            <div className="h-5 w-10 animate-pulse rounded bg-white/20" />
            <span className="text-sm font-semibold uppercase">
              {t('dog8_racing')}
            </span>
          </div>
          <div className="flex h-11 w-full flex-row items-center justify-center gap-2 px-2">
            <div className="h-6 w-10 animate-pulse rounded bg-white/20" />
            <span className="text-sm font-semibold uppercase">
              {t('horse6_racing')}
            </span>
          </div>
          <div className="flex h-11 w-full flex-row items-center justify-center gap-2 px-2">
            <div className="h-6 w-10 animate-pulse rounded bg-white/20" />
            <span className="text-sm font-semibold uppercase">
              {t('football')}
            </span>
          </div>
        </nav>
      }
    >
      <NavbarContent />
    </Suspense>
  )
}
