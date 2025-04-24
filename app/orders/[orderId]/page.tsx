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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@radix-ui/react-separator';
import { ArrowLeft, Copy, Download, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast, Toaster } from 'sonner';

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
  orderStatus?: string;
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
  
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "Processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case "Shipped":
        return <Badge className="bg-purple-100 text-purple-800">Shipped</Badge>
      case "Out for Delivery":
        return <Badge className="bg-amber-100 text-amber-800">Out for Delivery</Badge>
      case "Delivered":
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(order.orderId);
    toast.info("Copy to Clipboard",{
      style: { backgroundColor: '', color: 'green' },
    }

    )
  }
  
  return (
    <>
    <Toaster className='items-center flex justify-center'/>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
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
      <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.push("/orders")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </div>

        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-white border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Order Summary</CardTitle>
                <CardDescription>Order #{order.orderId}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {order.paymentStatus === "Pending" && (
                  <Button
                    onClick={() => router.push(`/checkout?orderId=${order.orderId}`)}
                    className="bg-green-700 hover:bg-green-700"
                  >
                    Pay Now
                  </Button>
                )}
                {order.paymentStatus !== "Pending" && (
                  <Button variant="outline" size="sm" className="gap-1" onClick={generateInvoicePdf}>
                    <Download className="h-4 w-4" />
                    Invoice
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 mb-4">
              <span>Arrived at {formatTime(order.createdAt)}</span>
              
              {order.paymentStatus !== "Pending" && (
                <>
                  <span>•</span>
                  <span>Status: {getStatusBadge(order.orderStatus)}</span>
                </>
              )}
              <span>•</span>
              <span>Payment: {getStatusBadge(order.paymentStatus)}</span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="p-6 -mt-4">
              <h3 className="text-lg font-semibold mb-4">
                {order.products?.reduce((total, product) => total + Number(product.quantity), 0)} items in this order
              </h3>

              <div className="space-y-4">
                {order.products?.map((product) => (
                  <div key={product.id} className="flex flex-col sm:flex-row gap-4 pb-4 border-b">
                    <div className="flex-shrink-0">
                      <img
                        src={product.imageUrl || "/placeholder.svg"}
                        alt={product.productName}
                        className="w-20 h-20 object-cover rounded-md border border-gray-200"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{product.productName}</h4>
                      <p className="text-sm text-gray-500 mb-1">{product.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Qty: {product.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">
                        ₹{(product.discountedPrice * product.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-6">
              <h3 className="text-lg font-semibold mb-4">Bill Details</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items Total</span>
                  <span>₹{totalPrice}</span>
                </div>

                {totalSavedAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">- ₹{totalSavedAmount}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Delivery Charges</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="w-64">
                            <h4 className="font-semibold mb-1">Delivery Charge</h4>
                            <p className="text-sm">
                              <span className="text-blue-500 font-medium">FREE</span> for first few orders
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-blue-500 font-medium">FREE</span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg pt-2">
                  <span>Bill Total</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Order Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Order ID</h4>
                  <p className="flex mb-4 items-center cursor-pointer" onClick={handleCopy}>
                    {order.orderId}
                    <Copy className='h-4 w-4 ml-1'/>
                  </p>

                  <h4 className="text-sm font-medium text-gray-500 mb-1">Payment</h4>
                  <p className="mb-4 flex items-center gap-2">{getStatusBadge(order.paymentStatus)}</p>

                  <h4 className="text-sm font-medium text-gray-500 mb-1">Order Placed</h4>
                  <p>{formatDate(order.createdAt)}</p>
                </div>

                {order.paymentStatus !== 'Pending' && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Deliver To</h4>
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
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </>
  )
}

export default OrderDetails;