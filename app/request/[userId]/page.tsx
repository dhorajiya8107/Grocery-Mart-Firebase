"use client"

import { db } from "@/app/src/firebase";
import { RoleChangeForm } from "@/components/role-change-form";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UserData {
  id: string
  name: string
  email: string
  role: string
  phoneNumber?: string
}

export default function RoleChangePage() {
  const params = useParams();
  const requestId = params?.userId as string;
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Checking login role
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        const uid = user.uid;
        setUserId(uid);

        if ( uid !== requestId ) {
          router.replace('/');
          setLoading(false);
          return;
        }

        try {
          const userRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userRole = userSnap.data()?.role;
            setRole(userRole);

            if (userRole !== 'admin' && userRole !== 'user') {
              router.replace('/');
            }
          } else {
            router.replace('/');
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          router.replace('/');
        } finally {
          setLoading(false);
        }
      } else {
        setUserId(null);
        router.replace('/');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, requestId, userId]);
    
  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        router.push("/")
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
        <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (role !== 'admin' && role !== 'user') {
      return null;
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
