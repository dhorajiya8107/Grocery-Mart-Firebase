'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, where, getDocs, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/app/src/firebase";
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
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RoleChangeRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  // If user is login then set userId otherwise null
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null); 
       if (!auth.currentUser) {
        router.replace('/');
       return;
      }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Checking login user role
    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setLoading(true);
          try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
    
            if (userSnap.exists()) {
              const userRole = userSnap.data()?.role;
              setRole(userRole);
    
              if (userRole !== 'admin' && userRole !== 'user') {
                router.push('/');
              }
            } else {
              router.push('/');
            }
          } catch (error) {
            console.error('Error checking user role:', error);
            router.push('/');
          } finally {
            setLoading(false);
          }
        } else {
          router.push('/');
        }
      });
    
      return () => unsubscribe();
    }, [router]);

    useEffect(() => {
      if (!userId) return;
  
      const q = query(
        collection(db, "roleChangeRequests"),
        where('userId', '==', userId)
      );
  
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const requestsData: RoleChangeRequest[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data() as Omit<RoleChangeRequest, "id">;
            requestsData.push({
              id: doc.id,
              ...data,
            });
          });
          setRequests(requestsData);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching role requests:", error);
          setLoading(false);
        }
      );
  
      return () => unsubscribe();
    }, [userId]);

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

  if (role !== 'admin' && role !== 'user') {
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