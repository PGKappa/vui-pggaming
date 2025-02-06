import Link from 'next/link'
import { buttonVariants } from './ui/button'

export default function Navbar() {
  return (
    <nav className="flex flex-row justify-center gap-1">
      <Link
        href="dogs"
        className={buttonVariants({ variant: 'ghost', className: 'hover:bg-red-300' })}
      >
        Dogs
      </Link>
      <Link
        href="horses"
        className={buttonVariants({
          variant: 'ghost',
          className: 'hover:bg-red-300',
        })}
      >
        Horses
      </Link>
      <Link
        href="/"
        className={buttonVariants({
          variant: 'default',
          className: 'bg-red-600 hover:bg-red-700',
        })}
      >
        Live Virtual Football
      </Link>
    </nav>
  )
}
