'use client';

import { CustomPagination } from '@/components/CustomPagination';
import { Badge } from '@/components/ui/badge';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { AlertCircle, ArrowRight, CheckCircle, ChevronRight, Info, Package, Truck } from 'lucide-react';
import { DateTime } from 'luxon';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth, db } from '../src/firebase';

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
    orderId: string;
    createdAt: string;
    totalAmount: number;
    paymentStatus?: string;
    orderStatus?: string,
    products?: Product[];
  };

const Orders = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Fetch user orders from firestore
  useEffect(() => {
    const fetchOrders = async () => {
      if (!userId) return;
      
        try {
          const ordersQuery = query(
            collection(db, 'orders'),
            where('userId', '==', userId)
          );
  
          const querySnapshot = await getDocs(ordersQuery);
          const userOrders: Order[] = querySnapshot.docs.map((doc) => {
            const { ...data } = doc.data() as Omit<Order, 'orderId'>;
  
            return {
              orderId: doc.id,
              ...data,
            };
          });
          setOrders(userOrders);
        } catch (error) {
          console.error('Error fetching orders: ', error);
        } finally {
          setLoading(false);
        }
    };

    fetchOrders();
  }, [userId]);

  // Date and Time format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short' ,
      year: '2-digit'
    }).toLowerCase()
    .replace(',', '').replace(' ', ', ') + `, ${date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    }).toLowerCase()}`;
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userId) {
    return <div>Please log in to see order list.</div>;
  }

  // Sorting orders by dateTime
  const sortOrderByDate = orders.sort((a, b) => {
    const beforeDate = DateTime.fromISO(a.createdAt , {zone: 'utc'}).toMillis() || 0;
    const afterDate = DateTime.fromISO(b.createdAt , {zone: 'utc'}).toMillis() || 0;
    return afterDate - beforeDate;
  });

  const indexOfLastCategory = currentPage * itemsPerPage;
  const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
  const currentOrders = orders && sortOrderByDate.slice(indexOfFirstCategory, indexOfLastCategory);
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 pt-10 pb-20">
      <div className='max-w-[900px] mx-auto bg-white shadow-xl rounded-lg p-4 max-[400px]:p-1'>
        <h2 className="text-2xl font-bold p-4">Your Orders</h2>
        <p className='border-b mt-5'></p>
      {/* If user doesn't order items */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">No orders found.</p>
      ) : (
        //  If user ordered
        <div className="grid gap- grid-cols-1">
          {currentOrders.map((order) => (
            <div
              key={order.orderId}
              className="relative bg-white border-gray-200 transition-all duration-300"
              onClick={() => router.push(`/orders/${order.orderId}`)}
            >
              <div className="p-0">
                <div className="flex items-start p-4 md:p-6 cursor-pointer">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {order.orderId}
                            </p>
                            <div className="mt-1 flex items-center flex-wrap gap-x-2 gap-y-1">
                              <div className="flex items-center text-sm text-gray-500">
                                ₹{order.totalAmount}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="mr-2 text-lg">•</span>
                                {formatDate(order.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {order.paymentStatus !== 'Pending' && (
                              <Badge variant="outline" className={getStatusColor(order.orderStatus || "")}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(order.orderStatus || "")}
                                  <span>{order.orderStatus || "Processing"}</span>
                                </span>
                              </Badge>
                            )}
                            {order.paymentStatus == 'Pending' && (
                              <Badge variant="outline" className="text-gray-700">
                                <span className="flex items-center gap-1">
                                  <AlertCircle className='h-4 w-4'/>
                                  <span>Not Paid</span>
                                </span>
                              </Badge>
                            )}
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* {order.paymentStatus !== 'Pending' && (
                          <Badge variant="outline" className={getStatusColor(order.orderStatus || "")}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(order.orderStatus || "")}
                              <span>{order.orderStatus || "Processing"}</span>
                            </span>
                          </Badge>
                        )}
                        {order.paymentStatus == 'Pending' && (
                          <Badge variant="outline" className="text-red-600 bg-red-100">
                            <span className="flex items-center gap-1">
                              <AlertCircle className='h-4 w-4'/>
                              <span>Not Paid</span>
                            </span>
                          </Badge>
                        )} */}
              <p className='border-b border-gray-200 mr-10 ml-10'></p>
            </div>
          ))}
          
          <div className=''>
          {orders.length > 0 && (
            <CustomPagination
              totalCount={orders.length}
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
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Orders;
