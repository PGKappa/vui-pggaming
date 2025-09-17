import { cn } from '@/virtual-lib/utils'
import { t } from 'i18next'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export default function Navbar() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const initCode = searchParams.get('init_code')
  const skin = searchParams.get('skin') || 'default'

  const queryParams = new URLSearchParams()
  if (initCode) queryParams.set('init_code', initCode)
  if (skin) queryParams.set('skin', skin)
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''

  const isActive = (path: string) => {
    return pathname.includes(path)
  }

  return (
    <nav className="flex w-full flex-row gap-1 bg-primary-foreground p-0.5 text-black">
      <Link
        href={`/virtual/dogs${queryString}`}
        className={cn(
          'flex w-full flex-row items-center justify-center gap-2 px-2 py-2',
          isActive('/virtual/dogs') &&
            'bg-accent text-accent-foreground hover:bg-accent/90',
        )}
        prefetch={false}
      >
        <Image
          src="/dogs.png"
          alt="Dogs"
          width={60}
          height={33}
          className="h-5 w-10"
          priority
        />
        <span className="text-xs font-medium">{t('dogs')}</span>
      </Link>

      <Link
        href={`/virtual/horses${queryString}`}
        className={cn(
          'flex w-full flex-row items-center justify-center gap-2 px-2 py-2',
          isActive('/virtual/horses') &&
            'bg-accent text-accent-foreground hover:bg-accent/90',
        )}
        prefetch={false}
      >
        <Image
          src="/horses.png"
          alt="Horses"
          width={60}
          height={36}
          className="h-6 w-10"
          priority
        />
        <span className="text-xs font-medium">{t('horses')}</span>
      </Link>

      <Link
        href={`/virtual/calcio${queryString}`}
        className={cn(
          'flex w-full flex-row items-center justify-center px-2 py-2',
          isActive('/virtual/calcio')
            ? 'bg-accent text-accent-foreground hover:bg-accent/90'
            : 'hover:bg-accent/90',
        )}
        prefetch={false}
      >
        <Image
          src="/soccer.svg"
          alt="Calcio"
          width={60}
          height={36}
          className="h-6 w-auto"
        />
        <span className="text-xs font-medium">{t('football')}</span>
      </Link>
    </nav>
  )
}
