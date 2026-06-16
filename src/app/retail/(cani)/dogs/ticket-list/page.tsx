import { Suspense } from 'react'
import TicketListPageContent from '@/retail-components/ticket-list-page-content'

export default function TicketListPage() {
  return (
    <Suspense fallback={null}>
      <TicketListPageContent returnPath="/retail/dogs" />
    </Suspense>
  )
}
