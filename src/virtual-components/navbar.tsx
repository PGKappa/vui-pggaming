import { cn } from '@/virtual-lib/utils'
import { t } from 'i18next'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

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

  const isActive = (path: string) => {
    return pathname.includes(path)
  }

  const tabClass = (path: string) =>
    cn(
      'flex h-11 flex-1 flex-row items-center justify-center gap-2 rounded-sm px-3 text-sm font-semibold uppercase tracking-wide transition-colors',
      isActive(path)
        ? 'bg-tertiary text-tertiary-foreground shadow-sm'
        : 'text-navbarBg-foreground/85 hover:bg-white/10 hover:text-navbarBg-foreground',
    )

  return (
    <nav className="flex w-full flex-row gap-2 bg-navbarBg p-2">
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
          className="size-7 object-contain"
          priority
        />
        <span>{t('dogs')}</span>
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
          className="size-7 object-contain"
          priority
        />
        <span>{t('horses')}</span>
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
          className="size-7 object-contain brightness-0 invert"
        />
        <span>{t('football')}</span>
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
            <span className="text-sm font-semibold uppercase">{t('dogs')}</span>
          </div>
          <div className="flex h-11 w-full flex-row items-center justify-center gap-2 px-2">
            <div className="h-6 w-10 animate-pulse rounded bg-white/20" />
            <span className="text-sm font-semibold uppercase">
              {t('horses')}
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
