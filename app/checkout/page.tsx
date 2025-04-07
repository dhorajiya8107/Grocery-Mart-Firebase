'use client';

import { useState, useEffect } from 'react';
import { useRouter  } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, onSnapshot, query, runTransaction, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../src/firebase';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import successAnimation from '../../animation/Animation - 1742460011298.json';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Briefcase, Check, Home, Hotel, MapPin } from 'lucide-react';
import AddAddressPage from '@/components/AddAddress';
import { toast, Toaster } from 'sonner';
import { useSearchParams } from 'next/navigation';
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface Product {
  id: string;
  productName: string;
  price: number;
  discountedPrice: number;
  imageUrl: string;
  quantity: number;
  description: string;
}

interface Address {
  defaultAddress: boolean;
  address: string;
  floor?: string;
  area: string;
  landmark?: string;
  name: string;
  phoneNumber: string;
  addressId: string;
  createdAt?: number;
  updatedAt?: number;
  addressType: "home" | "work" | "hotel" | "other";
  block?: string;
  state?: string;
  country?: string;
}

interface PostOffice {
  Block?: string;
  State: string;
  Country: string;
}

const CheckoutPage = () => {
  const [cart, setCart] = useState<Product[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('Credit Card');
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const router = useRouter();
  const auth = getAuth();
  // const searchParams = useSearchParams();
  // const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId');
  const [order, setOrder] = useState<any>(null);
  const Payment_Methods = ['Credit Card', 'Debit Card', 'UPI', 'Net Banking'];
  const [addresses, setAddresses] = useState<Address[]>([])
  const [mode, setMode] = useState<"view" | "add" | "edit">("view")
  const [addressType, setAddressType] = useState<"home" | "work" | "hotel" | "other">("home")
  const [activeDialog, setActiveDialog] = useState<"sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null>(null);
  const [currentAddressId, setCurrentAddressId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  

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

  // Fetch the orders data from firestore to find orderId
  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        try {
          const orderRef = doc(db, 'orders', orderId);
          const orderSnap = await getDoc(orderRef);

          if (orderSnap.exists()) {
            setOrder(orderSnap.data());
          } else {
            console.log('Order not found');
          }
        } catch (error) {
          console.error('Error fetching order:', error);
        }
      }
    };

    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    const auth = getAuth();
  
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
  
            setAddresses(addressesData);
            const defaultAddress = addressesData.find((address) => address.defaultAddress);
            if (defaultAddress) {
              setSelectedAddressId(defaultAddress.addressId);
            }
            setMode("view");
          } else {
            setMode("add");
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
  

  // Fetch cart data from firestore
  useEffect(() => {
    const fetchCart = async () => {
      if (!userId) return;

      try {
        const cartRef = doc(db, 'cart', userId);
        const cartDoc = await getDoc(cartRef);

        if (cartDoc.exists()) {
          const cartData = cartDoc.data();
          if (cartData?.products) {
            const updatedProducts = cartData.products.map((product: Product) => {
              const discountedPrice = isNaN(Number(product.discountedPrice))
                ? product.price
                : product.discountedPrice;

              return {
                ...product,
                discountedPrice,
              };
            });

            setCart(updatedProducts);
          }
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };

    if (userId) {
      fetchCart();
    }
  }, [userId]);


  // Total amount of items added in the cart
  const totalAmount = cart.reduce((total, product) => {
    const discountedPrice = isNaN(Number(product.discountedPrice))
      ? 0
      : product.discountedPrice;

    return total + discountedPrice * product.quantity;
  }, 0);

  //Total item added to cart
  const totalItems = cart.reduce((total, product) => total + (Number(product.quantity) || 0), 0);

  // Handle payment from user
  const handleConfirmPayment = async () => {
    try {
      if (orderId && order) {
        const orderRef = doc(db, 'orders', orderId);
  
        await updateDoc(orderRef, {
          selectedAddressId,
          orderStatus: 'Processing',
          paymentStatus: 'Paid',
        });
  
        const paymentRef = doc(collection(db, 'payment'));
        const paymentId = paymentRef.id;
  
        await setDoc(paymentRef, {
          paymentId,
          orderId,
          userId: order.userId,
          totalAmount: order.totalAmount,
          paymentMethod,
          createdAt: new Date().toISOString(),
        });
  
        for (const product of order.products) {
          const productRef = doc(db, 'products', product.id);
          await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef);
            if (productDoc.exists()) {
              const currentQuantity = productDoc.data().quantity || 0;
              const newQuantity = currentQuantity - product.quantity;
  
              if (newQuantity < 0) {
                throw new Error(`Not enough stock for product ${product.productName}`);
              }
  
              transaction.update(productRef, { quantity: newQuantity });
            }
          });
        }
        const cartRef = doc(db, 'cart', order.userId);
        await setDoc(cartRef, { products: [] });
  
        console.log('Payment successful!');
        setPaymentSuccess(true);
        setIsPopoverOpen(false);
  
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  // useEffect(() => {
  //   if (addresses.length === 0) {
  //     setActiveDialog("address");
  //   }
  // }, [addresses]);
  

  // For opening edit dialog
  const openAddressDialog = (address: Address) => {
      setActiveDialog("address");
  };

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
  };

  const handleCheckout = () => {
    if (!selectedAddressId) {
      toast.info("Please select an address before proceeding to checkout.");
      setActiveDialog("address");
      return;
    }
    setIsPopoverOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userId) {
    return <div className='text-center text-2xl pt-30'>Please log in to continue to checkout.</div>;
  }

  return (
    <>
    <Toaster />
    <div className="bg-gray-50 w-full min-h-screen pt-2 ">
      <div className="container mx-auto p-4 xl:pl-32 xl:pr-32">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        {/* {addresses.length === 0 && ( <p>
          
        </p> )} */}
        <div className="">
          {addresses.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-4 mb-4">
              {addresses
                .filter((address) => address.defaultAddress)
                .slice(0, 1)
                .map((address, index) => (
                  <div
                  key={address.addressId || index}
                  className={`border rounded-lg p-1 relative hover:shadow-md transition-shadow bg-white cursor-pointer ${
                    selectedAddressId === address.addressId 
                      ? address.defaultAddress 
                        ? "border-green-700"
                        : "border-green-500"
                      : "border-gray-300"
                  }`}                  
                  onClick={() => handleSelectAddress(address.addressId)}
                >
                              <div className="flex items-start gap-2">
                                <div className="mt-1">
                                  {address.addressType === "home" && <Home size={20} className="text-green-700" />}
                                  {address.addressType === "work" && <Briefcase size={20} className="text-green-700" />}
                                  {address.addressType === "hotel" && <Hotel size={20} className="text-green-700" />}
                                  {address.addressType === "other" && <MapPin size={20} className="text-green-700" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start">
                                    <h3 className="font-medium text-base capitalize">{address.addressType || "Home"}</h3>
                                  </div>
                                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                                    {[
                                      address.floor,
                                      address.address,
                                      address.landmark,
                                      address.area,
                                      address.block,
                                      address.state,
                                      address.country,
                                    ]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>
                                </div>
                              </div>
                        <Button
                          className="w-full mt-4 bg-green-700 hover:bg-green-800"
                          onClick={() => {
                            openAddressDialog(address);
                          }}>
                          Change or Edit Address
                        </Button>
                            </div>
                            
                          ))}
                        </div>
                      </>
                    ): (
                      <div className=' grid grid-cols-4'>
                        <Button className='w-full mt-4 bg-green-700 hover:bg-green-800' onClick={() => setActiveDialog("address")}>
                          Add Address
                        </Button>
                      </div>
                    )}
          </div>
        <div className="bg-white rounded-lg shadow-md text-gray-500">
          <div className='text-lg justify-between flex p-8 border-b pr-10 bg-gray-100'>
            <p className='font-bold text-xl'>My Cart</p>
            <p>{totalItems} items</p>
          </div>
          {cart.map((product) => (
            <div key={product.id} className="flex items-center justify-between border-b p-4 pr-10">
              <div className="flex items-center">
                <p className='text-lg p-6 pr-12'>{product.quantity}</p>
                <img src={product.imageUrl} alt={product.productName} className="w-32 h-32 object-cover mr-4 max-[640px]:w-20 max-[640px]:h-20" />
                <div>
                  <p className="min-[640px]:text-xl font-semibold text-lg">{product.productName}</p>
                  <p className='min-[640px]:text-lg text-sm'>{product.description}</p>
                  <p className="font-semibold">₹{product.discountedPrice}</p>
                </div>
              </div>
              <p className="text-lg font-bold hidden sm:block">₹{(product.discountedPrice * product.quantity)}</p>
            </div>
          ))}

          {/* <div className="flex justify-between font-bold text-lg p-4 pr-10">
            <p>Total:</p>
            <p>₹{totalAmount}</p>
          </div> */}

          {/* Popover will be open when user click on Proceed to Payment button */}
          <Dialog open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            {/* <DialogTrigger asChild> */}
              <div className='justify-center flex p-4'>
                <button
                  className={`w-100 h-14 text-white py-2 rounded-md transition duration-300 shadow-md ${
                    selectedAddressId
                      ? "bg-green-700 hover:bg-green-800"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                  onClick={handleCheckout}
                >
                Pay Now (Total: ₹{totalAmount})
              </button>
              </div>
            {/* </DialogTrigger> */}

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Payment Method</DialogTitle>
                <DialogDescription>
                  Please select a payment method to complete your order.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {Payment_Methods.map((method) => (
                  <div
                    key={method}
                    className={`cursor-pointer p-3 border rounded-md ${
                      paymentMethod === method ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-between items-center">
                <p className="font-bold">Total: ₹{totalAmount}</p>
                <button
                  onClick={handleConfirmPayment}
                  className="bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800 transition"
                >
                  Confirm Payment
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* After payment will be success */}
      {paymentSuccess && (
        <div className="fixed inset-0 bg-gray-200 flex justify-center items-center">
          <div className="bg-white w-96 p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className='flex justify-between items-center mb-2'>
              <h2 className="text-xl font-bold text-green-700">Payment Successful!</h2>
              <Lottie 
                animationData={successAnimation}
                loop={false}
                style={{ width: 50, height: 50}}
              />
            </div>
            <p>Your order has been placed successfully.</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 bg-green-700 text-white py-2 w-full rounded-md hover:bg-green-800"
            >
              Go to Home
            </button>
          </div>
        </div>
      )}
    </div>
    {activeDialog === "address" && <AddAddressPage activeDialog={activeDialog} setActiveDialog={setActiveDialog}/>}
    </>
  );
};

export default CheckoutPage;
