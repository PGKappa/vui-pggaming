'use client'

// "Le mie scommesse" del web: è la Lista ticket della cassa retail
// (stanleybet), alimentata con i ticket giocati da questo browser, perché
// /api/ticket/list è riservato al cassiere ("Level error" col codice giocatore).
import TicketListPageContent from '@/retail-components/ticket-list-page-content'
import {
  RootContext as RetailRootContext,
  type RootContextType as RetailRootContextType,
} from '@/retail-contexts/root-context'
import {
  TicketListSourceContext,
  type TicketListSource,
} from '@/retail-lib/ticket-list-source'
import { RootContext } from '@/virtual-contexts/root-context'
import TicketDetailsDialog from '@/virtual-components/ticket-details-dialog'
import { fetchStoredTicketList } from '@/virtual-lib/ticket-history'
import { createPGVirtualAPICall, getOperatorFromUrl } from '@/virtual-lib/utils'
import { useRouter } from 'next/navigation'
import { useContext, useMemo } from 'react'

export default function MyBetsPage() {
  const { initCode, getCurrencySymbol } = useContext(RootContext)
  const router = useRouter()

  // torna alla pagina da cui si è arrivati; aperta da link diretto va ai
  // levrieri, mantenendo init_code, skin, operator...
  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push(`/virtual/dogs${window.location.search}`)
  }

  const retailContext = useMemo<RetailRootContextType>(
    () => ({
      initCode,
      // il dettaglio ticket (/api/ticket/{id}) usa lo stesso operatore della giocata
      operator: getOperatorFromUrl('bingoal'),
      getCurrencySymbol,
      getTimezone: () => 'Europe/Rome',
      isLoadingEvents: false,
      setSearchEventResults: () => {},
      setActiveDrawer: () => {},
    }),
    [initCode, getCurrencySymbol],
  )

  const source = useMemo<TicketListSource>(
    () => ({
      readOnly: true,
      utcTimes: true,
      // dettaglio con la grafica del pannello admin (pgPlatformAdmin)
      DetailDialog: TicketDetailsDialog,
      fetchList: async (request) =>
        initCode
          ? fetchStoredTicketList(initCode, request, async (ticketId) => {
              const response = await createPGVirtualAPICall(
                `/api/ticket/${ticketId}`,
                initCode,
              )
              return response.json()
            })
          : ({ ret_code: 0, description: '', items: [], info: null } as any),
    }),
    [initCode],
  )

  return (
    // retail-default: stessi colori della lista ticket retail, solo qui
    <div className="retail-default">
      <RetailRootContext.Provider value={retailContext}>
        <TicketListSourceContext.Provider value={source}>
          <TicketListPageContent
            returnPath="/virtual/dogs"
            onBack={goBack}
            fullWidth
          />
        </TicketListSourceContext.Provider>
      </RetailRootContext.Provider>
    </div>
  )
}
