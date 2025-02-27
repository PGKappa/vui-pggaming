import { useCallback, useEffect, useState } from 'react'

type UseFetchOptions = RequestInit

interface UseFetchResponse<T> {
  data: T | null
  error: Error | null
  loading: boolean
  refetch: () => Promise<void>
}

export default function useFetch<T>(
  url: string,
  options?: UseFetchOptions,
): UseFetchResponse<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const fetchData = useCallback(async () => {
    if (!url) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const json = await response.json()
      setData(json)
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('An unknown error occurred'),
      )
    } finally {
      setLoading(false)
    }
  }, [url, options]) //switch to lodash.isequal if options is too complex

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, error, loading, refetch: fetchData }
}
