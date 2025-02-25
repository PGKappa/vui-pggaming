import { cn } from '@/lib/utils'
import Link from 'next/link'
import { buttonVariants } from './ui/button'

export default function Navbar() {
  return (
    <nav className="flex w-full flex-row gap-1 bg-primary-foreground p-0.5 text-primary">
      <Link
        href="/dogs"
        className={cn(
          buttonVariants({ variant: 'navbar' }),
          'flex w-full flex-row items-center justify-center gap-2',
        )}
      >
        <img src="/calcio/dogs.png" alt="Dogs" className="h-6" />
        <span className="text-xs font-medium">Dogs</span>
      </Link>

      <Link
        href="/horses"
        className={cn(
          buttonVariants({ variant: 'navbar' }),
          'flex w-full flex-row items-center justify-center gap-2',
        )}
      >
        <img src="/calcio/horses.png" alt="Horses" className="h-6" />
        <span className="text-xs font-medium">Horses</span>
      </Link>

      <Link
        href="/"
        className="flex w-full flex-row items-center justify-center gap-2 rounded bg-accent transition-all hover:bg-accent/90"
      >
        <img src="/calcio/ball.svg" alt="Football" className="h-6" />
        <span className="text-xs font-medium text-accent-foreground">
          Football
        </span>
      </Link>
    </nav>
  )
}
