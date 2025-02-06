'use client'

import { RootContext } from '@/contexts/root-context'
import { useContext } from 'react'

export default function Home() {
  const { currentUser } = useContext(RootContext)
  return <h1>Hello World! {currentUser}</h1>
}
