'use client';

import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { auth, db } from '../src/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { DateTime } from 'luxon';

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
 
  return (
    <div className="p-4 pb-20 max-w-[900px] mx-auto pt-10">
      <h2 className="text-2xl font-bold mb-6">Your Orders</h2>
      {/* If user doesn't order items */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">No orders found.</p>
      ) : (
        //  If user ordered
        <div className="grid gap- grid-cols-1">
          {orders && sortOrderByDate.map((order) => (
            <div
              key={order.orderId}
              className="relative bg-white shadow-2xl border-gray-200 transition-all duration-300"
            >
              <div className="flex flex-col p-4 md:p-6">
                <div className="flex items-center">
                  <img
                    onClick={() => router.push(`/orders/${order.orderId}`)}
                    src="https://blinkit.com/8d522e40eef136ba3498.png"
                    alt="Order"
                    className="w-10 h-10 rounded-md object-cover mr-4 cursor-pointer"
                  />
                  <div className='items-center'>
                    <p className="text-md font-bold mb-3">
                      {order.orderId}
                      <span className="mx-2">•</span>
                      ₹{order.totalAmount}
                        <span className={`ml-4 p-1 rounded-md text-xs
                        ${order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-500'}`} >
                          {order.orderStatus || 'Not Paid'}
                        </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div> 

                {/* By clicking, it will navigate to see placed orders details */}
                <div className="hidden min-[600px]:block justify-end">
                  <button
                    onClick={() => router.push(`/orders/${order.orderId}`)}
                    className="absolute top-5 right-5 py-2 px-2 rounded-md text-xs text-green-700 border-1 border-gray-400 cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
              <p className='border-b border-gray-200 mr-10 ml-10'></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
