import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from './ui/button'
import { t } from 'i18next'
import BallSvg from './ball'
import { /* usePathname, */ useSearchParams } from 'next/navigation'

export default function Navbar() {
  const searchParams = useSearchParams()
  /* const pathname = usePathname() */
  const initCode = searchParams.get('init_code')
  return (
    <nav className="flex w-full flex-row gap-1 bg-primary-foreground p-0.5 text-black">
      <Link
        href={`/virtual/cani${initCode ? `?init_code=${initCode}` : ''}`}
        className={cn(
          buttonVariants({ variant: 'navbar' }),
          'flex w-full flex-row items-center justify-center gap-2',
        )}
        prefetch={false}
      >
        <Image
          src="/dogs.png"
          alt="Dogs"
          width={69}
          height={33}
          className="h-6 w-auto"
          priority
        />
        <span className="text-xs font-medium">{t('dogs')}</span>
      </Link>

      <Link
        href={`/virtual/cavalli${initCode ? `?init_code=${initCode}` : ''}`}
        className={cn(
          buttonVariants({ variant: 'navbar' }),
          'flex w-full flex-row items-center justify-center gap-2',
        )}
        prefetch={false}
      >
        <Image
          src="/horses.png"
          alt="Horses"
          width={60}
          height={36}
          className="h-6 w-auto"
          priority
        />
        <span className="text-xs font-medium">{t('horses')}</span>
      </Link>

      <Link
        href={`/virtual/calcio${initCode ? `?init_code=${initCode}` : ''}`}
        className="flex w-full flex-row items-center justify-center gap-2 rounded-sm bg-accent transition-all hover:bg-accent/90"
        prefetch={false}
      >
        <BallSvg className="stroke-accent-foreground" />
      </Link>
    </nav>
  )
}
