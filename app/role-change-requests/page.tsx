"use client";

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

const RoleRequestsPage = () =>  {
  const [requests, setRequests] = useState<RoleChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RoleChangeRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

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
    
              if (userRole !== 'superadmin') {
                router.push('/');
              }
            } else {
              router.push('/');
            }
          } catch (error) {
            console.error('Error checking user role:', error);
            router.push('/');
          } finally {
            fetchRoleRequests();
            setLoading(false);
          }
        } else {
          router.push('/');
        }
      });
    
      return () => unsubscribe();
    }, [router]);

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
        await updateDoc(doc(db, "users", selectedRequest.userId), {
          role: selectedRequest.requestedRole,
        })
      }

      toast.success(`Request ${status === "approved" ? "approved" : "rejected"} successfully`,{
        style: { color : 'green'}
      })
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

  if ( role !== 'superadmin' ) {
    return null;
  }

  return (
    <>
    <Toaster  className='text-green-500' />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 pt-10 pb-20">
     <div className="max-w-6xl mx-auto bg-white border-none shadow-lg p-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Role Change Requests</h1>
          <p className="text-gray-500">Manage and review role change applications</p>
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
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(request)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
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

      {selectedRequest && (
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-7xl">
            <DialogHeader>
              <DialogTitle>Role Change Request Details</DialogTitle>
              <DialogDescription>Review the application details before making a decision</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 text-sm">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium text-gray-500">Applicant Information</h3>
                  <p>
                    <span className="font-medium">Name:</span> {selectedRequest.name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {selectedRequest.email}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span> {selectedRequest.phoneNumber}
                  </p>
                  <p>
                    <span className=""></span>
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-medium text-gray-500">Role Information</h3>
                  <p>
                    <span className="font-medium">Current Role:</span> {selectedRequest.currentRole}
                  </p>
                  <p>
                    <span className="font-medium">Requested Role:</span> {selectedRequest.requestedRole}
                  </p>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-medium text-gray-500">Request Status</h3>
                  <div className="flex items-center">
                    {selectedRequest.status === "pending" && <Clock className="h-4 w-4 text-yellow-500 mr-1" />}
                    {selectedRequest.status === "approved" && <CheckCircle className="h-4 w-4 text-green-700 mr-1" />}
                    {selectedRequest.status === "rejected" && <XCircle className="h-4 w-4 text-red-500 mr-1" />}
                    <span className="capitalize">{selectedRequest.status}</span>
                  </div>
                  <p>
                    <span className="font-medium">Submitted:</span> {formatDate(selectedRequest.createdAt)}
                  </p>
                  {selectedRequest.updatedAt && (
                    <p>
                      <span className="font-medium">Last Updated:</span> {formatDate(selectedRequest.updatedAt)}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-500">Reason for Change</h3>
                  <div className="bg-gray-50 p-3 rounded-md text-sm break-words">{selectedRequest.reason}</div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-500">Duties & Responsibilities</h3>
                  <div className="bg-gray-50 p-3 rounded-md text-sm break-words">{selectedRequest.duties}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-500">Admin Notes</h3>
              <Textarea
                placeholder="Add notes about this request (only visible to admins)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                disabled={selectedRequest.status !== "pending" || isProcessing}
                className=""
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {selectedRequest.status === "pending" ? (
                <>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 bg-red-100 hover:bg-red-200 hover:text-red-700"
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-1 h-4 w-4" />
                    )}
                    Reject Request
                  </Button>
                  <Button
                    className="bg-green-700 hover:bg-green-800"
                    onClick={() => handleUpdateStatus("approved")}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-1 h-4 w-4" />
                    )}
                    Approve Request
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
    </div>
    </>
  )
}
export default RoleRequestsPage;
