'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, where, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "@/app/src/firebase";
import { toast, Toaster } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, Clock, Eye } from "lucide-react";

interface RoleChangeRequest {
  id: string
  userId: string
  name: string
  email: string
  currentRole: string
  requestedRole: string
  reason: string
  duties: string
  phoneNumber: string
  status: "pending" | "approved" | "rejected"
  createdAt: any
  updatedAt: any
  notes?: string
}

function YourRequest() {
  const [requests, setRequests] = useState<RoleChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RoleChangeRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        router.push("/")
        return
      }

      try {
        // const userDoc = await getDocs(
        //   query(collection(db, "users"), where("id", "==", authUser.uid), where("role", "in", ["admin", "superadmin", "user"])),
        // )
        

        // if (userDoc.empty) {
        //   toast.error("You don't have permission to access this page")
        //   router.push("/")
        //   return
        // }

        setIsAdmin(true)
        fetchRoleRequests()
      } catch (error) {
        console.error("Error checking admin status:", error)
        router.push("/")
      }
    })

    return () => unsubscribe()
  }, [router])

  const fetchRoleRequests = () => {
    const q = query(collection(db, "roleChangeRequests"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const requestsData: RoleChangeRequest[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<RoleChangeRequest, "id">
          requestsData.push({
            id: doc.id,
            ...data,
          })
        })
        setRequests(requestsData)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching role requests:", error)
        setLoading(false)
      },
    )

    return unsubscribe
  }

  const handleViewDetails = (request: RoleChangeRequest) => {
    setSelectedRequest(request)
    setAdminNotes(request.notes || "")
    setOpenDialog(true)
  }

  const handleUpdateStatus = async (status: "approved" | "rejected") => {
    if (!selectedRequest) return

    setIsProcessing(true)
    try {
      await updateDoc(doc(db, "roleChangeRequests", selectedRequest.id), {
        status,
        notes: adminNotes,
        updatedAt: serverTimestamp(),
      })

      if (status === "approved") {
        // Update user's role in the users collection
        await updateDoc(doc(db, "users", selectedRequest.userId), {
          role: selectedRequest.requestedRole,
        })
      }

      toast.success(`Request ${status === "approved" ? "approved" : "rejected"} successfully`)
      setOpenDialog(false)
    } catch (error) {
      console.error(`Error ${status} request:`, error)
      toast.error(`Failed to ${status} request. Please try again.`)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
    <Toaster position="top-right" />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 pt-10 pb-20">
     <div className="max-w-6xl mx-auto bg-white border-none shadow-lg p-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Your Role Change Requests</h1>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
              {requests.filter((r) => r.status === "pending").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
              {requests.filter((r) => r.status === "approved").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected
            <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
              {requests.filter((r) => r.status === "rejected").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {["pending", "approved", "rejected", "all"].map((tab) => {
           const filteredRequests = tab === "all" ? requests : requests.filter((request) => request.status === tab);

           return(
            <TabsContent key={tab} value={tab} className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">No role change requests found</CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">{request.name}</h3>
                            <p className="text-sm text-gray-500">{request.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(request.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Current Role</p>
                            <p className="text-sm">{request.currentRole}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Requested Role</p>
                            <p className="text-sm">{request.requestedRole}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Submitted On</p>
                            <p className="text-sm">{formatDate(request.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  )))}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
    </div>
    </>
  )
}
export default YourRequest;