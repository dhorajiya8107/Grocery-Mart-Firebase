"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// This component safely uses useSearchParams inside Suspense
function NotFoundContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // You can use searchParams safely here
  const referrer = searchParams.get("from") || ""

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Page Not Found</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => router.back()} variant="outline" className="px-6">
          Go Back
        </Button>
        <Button asChild className="bg-green-700 hover:bg-green-800 px-6">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  )
}

export default function NotFound() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">Page Not Found</h2>
          <p className="text-gray-600 mb-8 max-w-md">Loading...</p>
        </div>
      }
    >
      <NotFoundContent />
    </Suspense>
  )
}

