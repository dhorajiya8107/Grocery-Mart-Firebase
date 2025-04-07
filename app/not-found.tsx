'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

export default function NotFound() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Content />
    </Suspense>
  )
}

function Content() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
      {q && <p>No results for: <strong>{q}</strong></p>}
    </div>
  )
}
