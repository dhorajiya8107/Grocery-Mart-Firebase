'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { collection, doc, getDoc, getDocs, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '@/app/src/firebase';
import InvoicePdf, { InvoicePdfRef } from '@/app/src/invoicePdf';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

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
  products?: Product[];
  selectedAddressId: string;
  totalItems: number;
};

interface Address {
  id: string;
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

const OrderDetails = () => {
  const params = useParams();
  const orderId = params['orderId'];
  const [order, setOrder] = useState<Order | null>(null);
  const router = useRouter();
  const invoiceRef = useRef<InvoicePdfRef | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [address, setAddress] = useState<Address[]>([]);

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

    useEffect(() => {
      const fetchOrder = async () => {
        if (!userId || !orderId) return;
        
        console.log('Fetching orderId:', orderId);
  
        if (typeof orderId === 'string') {
          try {
            const orderQuery = query(
              collection(db, 'orders'),
              where('orderId', '==', orderId)
            );
  
            const orderSnapshot = await getDocs(orderQuery);
            if (!orderSnapshot.empty) {
              const orderData = orderSnapshot.docs[0].data() as Order;
              setOrder(orderData);
            } else {
              setOrder(null);
            }
          } catch (error) {
            console.error('Error fetching order:', error);
            setOrder(null);
          }
        }
      };
  
      fetchOrder();
  }, [orderId, userId]);

  useEffect(() => {
    // const auth = getAuth();
  
    const subscribeToAddresses = (userId: string) => {
      try {
        const addressRef = collection(db, "addresses");
        const q = query(addressRef, where("userId", "==", userId));
  
        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const addressesData = snapshot.docs.map((doc) => ({
              ...(doc.data() as Address),
              id: doc.id,
            }));
  
            setAddress(addressesData);
          }
        });
  
        return unsubscribe;
      } catch (error) {
        console.error("Error subscribing to addresses:", error);
      }
    };
  
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        const unsubscribeAddresses = subscribeToAddresses(user.uid);
  
        return () => unsubscribeAddresses?.();
      }
    });
  
    return () => unsubscribeAuth();
  }, []);


    const totalAmount = order?.products?.reduce((total, product) => {
      const discountedPrice = isNaN(Number(product.discountedPrice)) 
        ? 0 
        : product.discountedPrice * product.quantity;
    
      return total + discountedPrice;
    }, 0) || 0;
    
    const totalSavedAmount = order?.products?.reduce((total, product) => {
      const originalPrice = isNaN(Number(product.price)) 
        ? 0 
        : product.price * product.quantity;
    
      const discountedPrice = isNaN(Number(product.discountedPrice)) 
        ? 0 
        : product.discountedPrice * product.quantity;
    
      return total + (originalPrice - discountedPrice);
    }, 0) || 0;
    
    const totalPrice = order?.products?.reduce((total, product) => {
      const originalPrice = isNaN(Number(product.price)) 
        ? 0 
        : product.price * product.quantity;
    
      return total + originalPrice;
    }, 0) || 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short' ,
      year: '2-digit',
    })
    .replace(',', '').replace(' ', ', ') + `, ${date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }).toUpperCase()}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).toLowerCase();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userId) {
    return <div>Please log in to see order details.</div>;
  }

  if (!order) {
    return <p className="text-center">Order not found!</p>;
  }

  // For generating pdf
  const generateInvoicePdf = async () => {
    setIsGeneratingPdf(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
  
    const input = document.getElementById('order-summary');
  
    if (input) {
      input.style.width = '794px';
      input.style.height = '1123px';
  
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
      });
  
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  
      pdf.save(`Order_${order.orderId}.pdf`);
      
      input.style.width = '';
      input.style.height = '';
    }
  
    setIsGeneratingPdf(false);
  };
  
  return (
    <>
    <div className='pt-10 pb-20'>
    <div className="p-4 text-gray-500 max-w-[800px] mx-auto shadow-lg overflow-visible">
      <button onClick={() => {router.push('/orders');}}
      className='text-3xl text-black shadow rounded-md pl-1 pr-1 mb-4'>←</button>
      <div className='justify-between flex'>
        <p className='font-bold text-2xl text-black'>Order summary</p>
        {order.products?.some(product => order.paymentStatus === 'Pending') && (
          <button className='bg-green-100 text-green-700 rounded-md border-1 px-1 py-1 border-green-700 hover:bg-green-200' 
          onClick={() => router.push(`/checkout?orderId=${order.orderId}`)} >
            Pay Now
          </button>
        )}
      </div>
      <div id="order-summary" className='pl-10 pr-10'
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '100%',
        }}>

        {/* For invoice download */}
        {isGeneratingPdf && (
          <InvoicePdf
              ref={invoiceRef}
              orderId={order.orderId}
              paymentStatus={order.paymentStatus || "Pending"}
              orderPlacedDate={formatDate(order.createdAt)}
              items={order.products?.map((product) => ({
                name: product.productName,
                quantity: `${product.quantity}`,
                price: product.discountedPrice || product.price,
                imageUrl: product.imageUrl,
              })) || []}
              discount={totalSavedAmount}
              deliveryCharges="FREE"
              totalPrice={totalAmount}
              totalItem={String(order.products?.reduce((total, product) => total + Number(product.quantity), 0))} 
              selectedAddressId={''}              
              />
          )}
      </div>
      <div className='text-green-700 cursor-pointer flex items-center text-xs mb-2'>
        <button className='flex cursor-pointer' onClick={generateInvoicePdf}>
          Download Invoice 
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48" fill="#15803d" className='flex pl-[3px]'>
            <path d="M38 30V38H10V30H6V38C6 40.2 7.8 42 10 42H38C40.2 42 42 40.2 42 38V30H38ZM34 22L30 22V8H18V22H14L24 32L34 22Z" fill="#15803d"/>
          </svg>
        </button>
      </div>

      <p className='text-xs'>Arrived at {formatTime(order.createdAt)}</p> 
      
      <p className="text-lg mb-2 text-black font-semibold p-4">
        {order.products?.reduce((total, product) => total + Number(product.quantity), 0)} item in this order
      </p>

      {/* Products List */}
      {order.products?.map((product) => (
        <div key={product.id}>
          <div className="relative flex flex-col min-[400px]:flex-row w-full p-4 justify-between items-center mb-4">
            <div className="flex items-center w-full sm:w-auto">
              <img
                src={product.imageUrl}
                alt={product.productName}
                className="w-20 h-20 rounded-md object-cover mr-4 border-gray-200 border-1"
              />
              <div>
                <p className="text-md">
                  {product.productName}
                </p>
                <p className="text-sm mb-2 text-gray-500">
                  {product.description} X {product.quantity}
                </p>
                <p className="font-bold text-md text-black hidden max-[640px]:block">
                  ₹{product.discountedPrice && !isNaN(Number(product.discountedPrice))
                  ? (product.discountedPrice * product.quantity)
                  : '0.00'}
                </p>
                {/* <p>
                  {product.discountedPrice}
                </p> */}
                <p className="absolute top-14 right-1 py-2 px-2 font-bold text-md mb-2 text-black hidden sm:block whitespace-nowrap">
                  ₹{product.discountedPrice && !isNaN(Number(product.discountedPrice))
                  ? (product.discountedPrice * product.quantity)
                  : '0.00'}
                </p>
              </div>
            </div>
          </div>
          <p className="border-gray-100 border-6"></p>
        </div>
      ))}

        {/* Order summary */}
        <div className="bg-white text-sm p-4">
        <h2 className="text-lg font-semibold mb-4 text-black">Bill details</h2>

         <div className="flex justify-between mb-2">
           <p>
             Items total
           </p>
           <div className='flex'>
             <p className="font-bold text-black">₹{totalPrice}</p>
           </div>
         </div>
         {order.products?.some(product => totalSavedAmount != 0 ) && (
           <div className="flex justify-between mb-2">
             <p>
               Discount
             </p>
             <div className='flex'>
               <p className="font-bold">- ₹{totalSavedAmount}</p>
             </div>
           </div>
          )}

         <div className="flex justify-between mb-4">
           <p className="flex items-center">
             Delivery charges
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button variant="outline" className='border-none p-1 -ml-2 shadow-none hover:bg-white'>
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="black" viewBox="0 0 24 24" className="-ml-1">
                       <circle cx="12" cy="12" r="10" stroke="black" strokeWidth="2" fill="none" />
                         <path d="M12 7v6" stroke="black" strokeWidth="2" strokeLinecap="round" />
                       <circle cx="12" cy="16" r="1.5" fill="black" />
                     </svg>
                    </Button>
                 </TooltipTrigger>
                 <TooltipContent className=''>
                   <h1 className='font-bold mb-1'>Delivery charge</h1>
                   <p><span className='text-blue-500 text-bold'>FREE</span> for first few orders</p>
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
           </p>
           <div className="flex">
             {/* <p className='line-through text-sm mr-1 text-gray-500'>₹30</p> */}
             <p className='text-blue-500 text-sm font-bold'>FREE</p>
           </div>
         </div>
         <div className="flex justify-between font-bold mb-4">
           <p className='text-black'>Bill total</p>
           <p className='text-black'>₹{totalAmount}</p>
         </div>
      </div>
      <p className='border-gray-100 border-6'></p>

      <div className="bg-white text-sm p-4">
        <h2 className="text-lg font-semibold mb-4 text-black">Order details</h2>
          <p>Order id</p>
          <p className='text-black mb-2'>{order.orderId}</p>
          <p>Payment</p>
          <p className='text-black mb-2'>{order.paymentStatus}</p>
          <p>Deliver to</p>
          {order.selectedAddressId && (
            <div className="text-black mb-2">
              {(() => {
                const selectedAddress = address.find(address => address.id === order.selectedAddressId);
                return (
                  <p>
                    { selectedAddress ? [
                        selectedAddress.floor,
                        selectedAddress.address,
                        selectedAddress.landmark,
                        selectedAddress.area,
                        selectedAddress.block,
                        selectedAddress.state,
                        selectedAddress.country,
                      ]
                        .filter(Boolean)
                        .join(", ")
                      : "Not Found"}
                  </p>
                );
              })()}
            </div>
          )}
          <p>Order placed</p>
          <p className='text-black mb-2'>placed on {formatDate(order.createdAt)}</p>
      </div>
      {/* <p className='border-gray-100 border-6'></p> */}
    </div>
    </div>
    </>
  );
};

export default OrderDetails;