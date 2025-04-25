"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/src/firebase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, CircleCheck } from "lucide-react";

interface UserData {
  id: string
  name: string
  email: string
  role: string
  phoneNumber?: string
}

const Request = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        router.push("/");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", authUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            id: authUser.uid,
            name: userData.name || "",
            email: authUser.email || "",
            role: userData.role || "user",
            phoneNumber: userData.phoneNumber || "",
          })
        } else {
          console.error("User document does not exist");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    })

    return () => unsubscribe();
  }, [router])

  const handleRequestRoleChange = () => {
    if (user) {
      router.push(`/request/${user.id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
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
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Role Description</CardTitle>
            <Info className="h-5 w-5 text-green-700" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <CircleCheck className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Admin</h3>
                <p className="text-sm text-muted-foreground">
                  Can manage users, update settings, and monitor system activities.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CircleCheck className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">User</h3>
                <p className="text-sm text-muted-foreground">
                  A regular customer using the app to browse products, add items to cart, and place orders.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CircleCheck className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Manager</h3>
                <p className="text-sm text-muted-foreground">
                  Manages store operations including stock, orders, and delivery coordination. Often oversees staff performance
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CircleCheck className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Editor</h3>
                <p className="text-sm text-muted-foreground">
                  Manages content such as product descriptions, banners, offers, and announcements on the site.
                </p>
              </div> 
            </div>

            <div className="flex items-start gap-2">
              <CircleCheck className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Analyst</h3>
                <p className="text-sm text-muted-foreground">
                  Accesses sales, customer behavior, and inventory reports to provide business insights.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CircleCheck className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Support</h3>
                <p className="text-sm text-muted-foreground">
                  Handles customer queries, complaints, and feedback via chat, email, or call.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full bg-green-700 hover:bg-green-800" onClick={handleRequestRoleChange}>
            Request for role change
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Request;