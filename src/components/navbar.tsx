import { cn } from '@/lib/utils'
import Link from 'next/link'
import { buttonVariants } from './ui/button'

export default function Navbar() {
  return (
    <nav className="h-15 flex w-full flex-row justify-center gap-1 bg-primary-foreground p-0.5 text-primary">
      <Link
        href="/dogs"
        className={cn(
          buttonVariants({ variant: 'navbar' }),
          'flex w-full flex-row items-center justify-center gap-2 py-1',
        )}
      >
        <img src="/calcio/dogs.png" alt="Dogs" />
        <div className="flex flex-col leading-none">
          <span className="text-xs font-medium">Dogs</span>
          <span className="text-[10px] text-gray-500">00:00</span>
        </div>
      </Link>

      <Link
        href="/horses"
        className={cn(
          buttonVariants({ variant: 'navbar' }),
          'flex w-full flex-row items-center justify-center gap-2 py-1',
        )}
      >
        <img src="/calcio/horses.png" alt="Horses" />
        <div className="flex flex-col leading-none">
          <span className="text-xs font-medium">Horses</span>
          <span className="text-[10px] text-muted-foreground">00:00</span>
        </div>
      </Link>

      <Link
        href="/"
        className="flex w-full flex-col items-center justify-center rounded-sm bg-accent py-1 transition-all hover:bg-accent/90"
      >
        <img src="/calcio/ball.svg" alt="Football" />
      </Link>
    </nav>
  )
}
