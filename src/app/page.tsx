'use client'

import { RootContext } from '@/contexts/root-context'
import { useContext } from 'react'

export default function Home() {
  const { currentUser } = useContext(RootContext)
  return <div className="flex flex-row justify-center gap-2"></div>
}
