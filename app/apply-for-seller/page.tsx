"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { db } from "@/app/src/firebase"
import { RoleChangeForm } from "@/components/role-change-form"
import { Loader2 } from "lucide-react"

interface UserData {
  id: string
  name: string
  email: string
  role: string
  phoneNumber?: string
}

export default function RoleChangePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        router.push("/login")
        return
      }

      try {
        const userDoc = await getDoc(doc(db, "users", authUser.uid))

        if (userDoc.exists()) {
          const userData = userDoc.data()
          setUser({
            id: authUser.uid,
            name: userData.name || "",
            email: authUser.email || "",
            role: userData.role || "user",
            phoneNumber: userData.phoneNumber || "",
          })
        } else {
          console.error("User document does not exist")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">Unable to load user data. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <RoleChangeForm userData={user} />
    </div>
  )
}
