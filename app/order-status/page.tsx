'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { auth, db } from '../src/firebase';
import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomPagination } from '@/components/CustomPagination';
import { ArrowRight, CheckCircle, Info, Package, Search, Truck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@radix-ui/react-select';
import { Badge } from '@/components/ui/badge';

type User = {
  email: string;
  name: string;
  role: string;
  lastOrderId?: string;
  userId: string;
};

type Product = {
    id: string;
    description: string;
    productName: string;
    price: number;
    quantity: number;
    discountedPrice: number;
    imageUrl: string;
  };
  
  type Order = {
    userId: string;
    orderId: string;
    createdAt: string;
    totalAmount: number;
    paymentStatus?: string;
    orderStatus?: string,
    products?: Product[];
  };

  interface Address {
    userId: string;
    defaultAddress: boolean;
    address: string;
    floor: string;
    area: string;
    landmark: string;
    name: string;
    phoneNumber: string;
    addressId: string;
    createdAt: number;
    updatedAt: number;
    addressType: "home" | "work" | "hotel" | "other";
    pinCode: string;
    block: string;
    state: string;
    country: string;
  }

const OrderStatus = () => {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [address, setAddress] = useState<Address[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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
    
            if (userRole !== 'admin' && userRole !== 'superadmin') {
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
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
  
        if (!querySnapshot.empty) {
          const usersList: User[] = querySnapshot.docs.map((doc) => ({
            userId: doc.id,
            ...(doc.data() as Omit<User, "userId">),
          }));
          setUsers(usersList);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
  
    fetchUsers();
  }, []);

  // Fetch user orders from firestore
  useEffect(() => {
    const fetchOrders = async () => {
        try {
          const ordersQuery = query(
            collection(db, 'orders'),
            where('paymentStatus', '==', 'Paid'),
            // orderBy('createdAt', 'asc'),
          );
  
          const querySnapshot = await getDocs(ordersQuery);
          const userOrders: Order[] = querySnapshot.docs.map((doc) => {
            const { ...data } = doc.data() as Omit<Order, 'orderId'>;
  
            return {
              orderId: doc.id,
              ...data,
            };
          })
          .filter((order) => order.orderStatus !== 'Delivered');
          setOrders(userOrders);
        } catch (error) {
          console.error('Error fetching orders: ', error);
        } finally {
          setLoading(false);
        }
    };

    if (role === 'admin' || role === 'superadmin') {
        setLoading(true);
        fetchOrders();
      }
  }, [role]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const addressRef = collection(db, "addresses");
        const querySnapshot = await getDocs(addressRef);
  
        if (!querySnapshot.empty) {
          const addressesData: Address[] = querySnapshot.docs.map((doc) => {
            const data = doc.data() as Address
            return {
              id: doc.id,
              ...data,
            };
          });
  
          setAddress(addressesData);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
      }
    };
  
    if (role === 'admin' || role === 'superadmin') {
      fetchAddresses();
    }
  }, [role]);

  // Update order status in firestore
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        orderStatus: newStatus,
      });

      setOrders((orders) =>
        orders.map((order) =>
          order.orderId === orderId
            ? { ...order, orderStatus: newStatus }
            : order
        )
      );
    } catch (error) {
      console.error('Error updating order status for ${orderId}:', error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const userAddress = address.find((address) => address.userId === order.userId);
    const foundUser = users.find((u) => u.userId === order.userId);
  
    return (
      order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderStatus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userAddress?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userAddress?.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      foundUser?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastCategory = currentPage * itemsPerPage;
  const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstCategory, indexOfLastCategory);
  
  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'Processing':
        return 'Shipped';
      case 'Shipped':
        return 'Out for Delivery';
      case 'Out for Delivery':
        return 'Delivered';
      case 'Delivered':
        return null;
      default:
        return 'null';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Processing":
        return <Package className="h-4 w-4" />
      case "Shipped":
        return <ArrowRight className="h-4 w-4" />
      case "Out for Delivery":
        return <Truck className="h-4 w-4" />
      case "Delivered":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Processing":
        return "bg-blue-100 text-blue-800"
      case "Shipped":
        return "bg-purple-100 text-purple-800"
      case "Out for Delivery":
        return "bg-amber-100 text-amber-800"
      case "Delivered":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleOrderStatus = (orderStatus: string, orderId: string) => {
    const nextStatus = getNextStatus(orderStatus || '');
    if (nextStatus) {
      updateOrderStatus(orderId, nextStatus);
    }
  };

    if (loading) {
        return (
          <div className="flex h-screen items-center justify-center">
            <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
          </div>
        );
      }

    if (role !== 'admin' && role !== 'superadmin') {
      return null;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 pt-10 pb-20">
        <div className="max-w-6xl mx-auto">
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">Manage Orders</CardTitle>
              <CardDescription>View and update the status of customer orders</CardDescription>
            </CardHeader>
  
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by order ID, customer name, email or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 py-2 border-gray-200"
                  />
                </div>
              </div>
  
              {currentOrders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
                  <p className="text-gray-500">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentOrders
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((order) => {
                    const userAddress = address.find((address) => address.userId === order.userId)
                    const foundUser = users.find((u) => u.userId === order.userId)
                    const nextStatus = getNextStatus(order.orderStatus || "")
  
                    return (
                      <Card key={order.orderId} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="flex-1 p-4 md:p-6">
                              <div className="flex items-start gap-4">
                                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                  <Package className="h-6 w-6 text-gray-600" />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-sm sm:text-base">
                                      #{order.orderId}
                                    </h3>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge variant="outline" className={getStatusColor(order.orderStatus || "")}>
                                            <span className="flex items-center gap-1">
                                              {getStatusIcon(order.orderStatus || "")}
                                              <span>{order.orderStatus || "Processing"}</span>
                                            </span>
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Current order status</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-500">
                                    <p>
                                      <span className="font-medium text-gray-700">Customer:</span>{" "}
                                      {userAddress?.name || "Not Found"}
                                    </p>
                                    <p>
                                      <span className="font-medium text-gray-700">Email: </span>
                                      {foundUser?.email || "Not Found"}
                                    </p>
                                    <p>
                                      <span className="font-medium text-gray-700">Phone: </span>
                                      {userAddress?.phoneNumber || "Not Found"}
                                    </p>
                                    <p>
                                      <span className="font-medium text-gray-700">Total: </span>₹
                                      {order.totalAmount}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-end p-4 md:p-6 md:w-60">
                              <Button
                                onClick={() => handleOrderStatus(order.orderStatus || "", order.orderId)}
                                disabled={!nextStatus}
                                variant={nextStatus ? "default" : "outline"}
                                className="w-full"
                              >
                                {nextStatus ? (
                                  <>
                                    Mark as {nextStatus}
                                    {getStatusIcon(nextStatus)}
                                  </>
                                ) : (
                                  "Delivered"
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
  
              {/* {filteredOrders.length > itemsPerPage && (
                <div className="mt-6"> */}
                  {filteredOrders.length > 0 && (
                    <CustomPagination
                      totalCount={filteredOrders.length}
                      page={currentPage}
                      pageSize={itemsPerPage}
                      onPageChange={(newPage) => setCurrentPage(newPage)}
                      onPageSizeChange={(newSize) => {
                        setItemsPerPage(Number(newSize));
                        setCurrentPage(1);
                      }}
                      pageSizeOptions={[3, 5, 10, 15, 20, 50]}
                    />
                  )}
                {/* </div>
              )} */}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  export default OrderStatus;
  