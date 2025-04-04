import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from './ui/button'
import { t } from 'i18next'
import BallSvg from './ball'

export default function Navbar() {
  return (
    <nav className="flex w-full flex-row gap-1 bg-primary-foreground p-0.5 text-black">
      <Link
        href="/dogs"
        className={cn(
          buttonVariants({ variant: 'navbar' }),
          'flex w-full flex-row items-center justify-center gap-2',
        )}
        prefetch={false}
      >
        <Image
          src="/calcio/dogs.png"
          alt="Dogs"
          width={69}
          height={33}
          className="h-6 w-auto"
          priority
        />
        <span className="text-xs font-medium">{t('dogs')}</span>
      </Link>

      <Link
        href="/horses"
        className={cn(
          buttonVariants({ variant: 'navbar' }),
          'flex w-full flex-row items-center justify-center gap-2',
        )}
        prefetch={false}
      >
        <Image
          src="/calcio/horses.png"
          alt="Horses"
          width={60}
          height={36}
          className="h-6 w-auto"
          priority
        />
        <span className="text-xs font-medium">{t('horses')}</span>
      </Link>

      <Link
        href="/"
        className="flex w-full flex-row items-center justify-center gap-2 rounded-sm bg-accent transition-all hover:bg-accent/90"
        prefetch={false}
      >
        <BallSvg className="stroke-accent-foreground" />
      </Link>
    </nav>
  )
}
