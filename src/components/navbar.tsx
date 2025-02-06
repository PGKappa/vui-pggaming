import Link from 'next/link'
import { buttonVariants } from './ui/button'

export default function Navbar() {
  return (
    <nav className="flex flex-row justify-center gap-1">
      <Link
        href="external/dogs"
        className={buttonVariants({ variant: 'ghost' })}
      >
        Dogs
      </Link>
      <Link
        href="external/horses"
        className={buttonVariants({ variant: 'ghost' })}
      >
        Horses
      </Link>
      <Link
        href="/"
        className={buttonVariants({
          variant: 'default',
          className: 'bg-red-600',
        })}
      >
        Live Virtual Football
      </Link>
    </nav>
  )
}
