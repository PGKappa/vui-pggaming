import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="h-15 flex w-full flex-row justify-center gap-6">
      <Link
        href="/dogs"
        className="flex w-full flex-row items-center justify-center gap-2 py-1 transition-all"
      >
        <img src="/calcio/dogs.png" alt="Dogs" />
        <div className="flex flex-col leading-none">
          <span className="text-xs font-medium">Dogs</span>
          <span className="text-[10px] text-gray-500">00:00</span>
        </div>
      </Link>

      <Link
        href="/horses"
        className="flex w-full flex-row items-center justify-center gap-2 py-1 transition-all"
      >
        <img src="/calcio/horses.png" alt="Horses" />
        <div className="flex flex-col leading-none">
          <span className="text-xs font-medium">Horses</span>
          <span className="text-[10px] text-gray-500">00:00</span>
        </div>
      </Link>

      <Link
        href="/"
        className="flex w-full flex-col items-center justify-center rounded-md bg-red-600 py-1 transition-all"
      >
        <img src="/calcio/ball.svg" alt="Football" />
      </Link>
    </nav>
  )
}
