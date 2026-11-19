// Struttura della pagina mostrata mentre arriva la risposta della cassa:
// stessa griglia delle pagine (contenuto + schedina), così al caricamento non
// c'è uno schermo vuoto e il layout non salta quando arrivano i dati.

function Block({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-sm bg-card shadow-sm ${className}`}>
      <div className="h-full w-full rounded-sm bg-muted/60" />
    </div>
  )
}

export default function PageSkeleton() {
  return (
    <div
      aria-busy="true"
      className="mx-auto grid w-full max-w-[1920px] grid-cols-1 items-start gap-3 bg-columnL-background p-2 sm:p-3 lg:grid-cols-[minmax(0,1fr)_400px]"
    >
      <div className="flex min-w-0 flex-col gap-3">
        {/* riquadro live */}
        <Block className="h-14" />
        {/* carosello eventi */}
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <Block key={index} className="h-24 min-w-[160px] flex-1" />
          ))}
        </div>
        {/* scheda della corsa / partita */}
        <Block className="h-[420px]" />
      </div>

      {/* schedina */}
      <div className="hidden lg:block lg:h-[max(calc(100vh-84px),716px)]">
        <Block className="h-full" />
      </div>
    </div>
  )
}
