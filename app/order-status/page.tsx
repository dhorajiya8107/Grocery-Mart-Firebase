'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { auth, db } from '../src/firebase';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

const OrderStatus = () => {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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
    
            if (userRole !== 'admin') {
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

  // Fetch user orders from firestore
  useEffect(() => {
    const fetchOrders = async () => {
        try {
          const ordersQuery = query(
            collection(db, 'orders'),
            where('paymentStatus', '==', 'Paid'),
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

    if (role === 'admin') {
        setLoading(true);
        fetchOrders();
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

  const filteredOrders = orders.filter(
    (order) =>
      order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.orderStatus?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status filtering logic
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

    if (role !== 'admin') {
      return null;
    }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 pt-10 pb-20">
      <div className="max-w-[900px] mx-auto bg-white shadow-xl rounded-lg p-4">
        <h2 className="text-2xl font-bold p-4">Manage Orders Status</h2>
        {/* Search Bar */}
        <div className="relative mb-6">
          <Input
            type="text"
            placeholder="Search by orderId..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          />
        </div>
        <div className="grid grid-cols-1">
          {filteredOrders.map((order) => (
            <div
              key={order.orderId}
              className="relative border-gray-200 transition-all duration-300"
            >
              <div className="flex flex-col p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className='flex'>
                    <img
                      src="https://blinkit.com/8d522e40eef136ba3498.png"
                      alt="Order"
                      className="w-10 h-10 rounded-md object-cover mr-4 cursor-pointer"
                    />
                    <div>
                      <p className="text-md font-bold whitespace-nowrap">Order ID: {order.orderId}</p>
                      <p className="text-sm text-gray-600">
                        Total: ₹{order.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Status: <span className={`p-1 rounded-md text-sm
                          ${order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-white'}`} >
                            {order.orderStatus}
                          </span>
                      </p>
                    </div>
                  </div>
                <div className="flex relative mt-7">
                  <Button
                    onClick={() => handleOrderStatus(order.orderStatus || '', order.orderId)}
                    disabled={!getNextStatus(order.orderStatus || '')}
                    className={`p-2 border rounded-md ml-auto text-xs transition ${
                      !getNextStatus(order.orderStatus || '')
                        ? 'bg-gray-200 cursor-not-allowed text-gray-500'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {getNextStatus(order.orderStatus || '') || 'Delivered'}
                  </Button>
                </div>
                </div>
              </div>
              <p className='border-b border-gray-200 mr-10 ml-10'></p>
            </div>
          ))}

            {filteredOrders.length === 0 && (
              <p className="text-gray-500 py-6 text-xl text-center">
                No orders found.
              </p>
            )}
        </div> 
      </div>
    </div>
  );
};

export default OrderStatus;