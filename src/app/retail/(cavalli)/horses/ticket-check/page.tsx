import { Suspense } from 'react'
import TicketCheckPageContent from '@/retail-components/ticket-check-page-content'

export default function TicketCheckPage() {
  return (
    <Suspense fallback={null}>
      <TicketCheckPageContent returnPath="/retail/horses" />
    </Suspense>
  )
}
