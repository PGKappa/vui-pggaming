'use client'

// Ricerca risultati del web: è lo stesso componente della cassa retail
// (stanleybet), alimentato con i dati del contesto virtual.
import SearchEventResults from '@/retail-components/search-event-results'
import {
  RootContext as RetailRootContext,
  type RootContextType as RetailRootContextType,
} from '@/retail-contexts/root-context'
import { RootContext } from '@/virtual-contexts/root-context'
import { getOperatorFromUrl } from '@/virtual-lib/utils'
import { useRouter } from 'next/navigation'
import { useContext, useMemo } from 'react'

export default function ResultsPage() {
  const { initCode } = useContext(RootContext)
  const router = useRouter()

  // torna alla pagina da cui si è arrivati; aperta da link diretto (nessuna
  // pagina precedente) va ai cani, mantenendo init_code, skin, operator...
  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push(`/virtual/dogs${window.location.search}`)
  }

  // il componente retail legge dal contesto retail solo questi campi:
  // eventResults vuoto → "ultime 10" carica i risultati dall'API
  const retailContext = useMemo<RetailRootContextType>(
    () => ({
      initCode,
      operator: getOperatorFromUrl('bingoal'),
      getTimezone: () => 'Europe/Rome',
      eventResults: [],
      isLoadingEvents: false,
      setSearchEventResults: () => {},
      setActiveDrawer: () => {},
    }),
    [initCode],
  )

  return (
    // retail-default: stessi colori della ricerca retail, solo in questa pagina
    <div className="retail-default w-full bg-background pt-[10px] text-foreground">
      <div className="h-[calc(100dvh-70px)] min-h-[480px] overflow-hidden">
        <RetailRootContext.Provider value={retailContext}>
          <SearchEventResults onBack={goBack} />
        </RetailRootContext.Provider>
      </div>
    </div>
  )
}
