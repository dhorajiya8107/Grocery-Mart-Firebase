'use client';

import { useState, useEffect, useRef } from 'react';
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
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

interface MostSeller {
  id: string;
  quantity: number;
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
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId');
  const [order, setOrder] = useState<any>(null);
  const Payment_Methods = ['Credit Card', 'Debit Card', 'UPI', 'Net Banking'];
  const [addresses, setAddresses] = useState<Address[]>([])
  const [mode, setMode] = useState<"view" | "add" | "edit">("view")
  const [activeDialog, setActiveDialog] = useState<"sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null>(null);
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
          const mostSellerRef = doc(db, 'mostseller', product.id);
  
          await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef);
            const mostSellerDoc = await transaction.get(mostSellerRef);

            if (!productDoc.exists()) {
              throw new Error(`Product ${product.id} not found`);
            }
  
            const currentQuantity = productDoc.data().quantity || 0;
            const newQuantity = currentQuantity - product.quantity;
  
            if (newQuantity < 0) {
              toast.info(`Not enough stock for product ${product.productName}. Try after sometime.`);
              throw new Error(`Not enough stock for product ${product.productName}`);
            }
  
            transaction.update(productRef, { quantity: newQuantity });
            // updating products total quantity sells
            if (mostSellerDoc.exists()) {
              const existingQuantity = Number(mostSellerDoc.data().quantity || 0);
              const incomingQuantity = Number(product.quantity);
              transaction.update(mostSellerRef, {
                quantity: existingQuantity + incomingQuantity,
              });
            } else {
              transaction.set(mostSellerRef, {
                id: product.id,
                quantity: Number(product.quantity),
                productName: product.productName,
              });
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
      toast.error('Payment failed. Please try again.');
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


  // Handle checkout and checking if product is out of stock or not
  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.info("Please select an address before proceeding to checkout.");
      setActiveDialog("address");
      return;
    }
  
    if (!userId) {
      toast.error("User ID is missing.");
      return;
    }
  
    try {
      const cartRef = doc(db, "cart", userId);
      const cartSnap = await getDoc(cartRef);
  
      if (!cartSnap.exists()) {
        toast.error("Cart not found.");
        return;
      }
  
      const cartData = cartSnap.data();
      const updatedProducts: any[] | ((prevState: Product[]) => Product[]) = [];
      let hasOutOfStock = false;
  
      for (const item of cartData.products) {
        const productRef = doc(db, "products", item.id);
        const productSnap = await getDoc(productRef);
  
        if (productSnap.exists()) {
          const productData = productSnap.data();
          const availableQty = productData.quantity || 0;
  
          if (availableQty === 0) {
            hasOutOfStock = true;
            toast.info(`"${productData.productName}" is out of stock and has been removed from your cart.`);
          } else {
            updatedProducts.push(item);
          }
        }
      }
  
      await updateDoc(cartRef, { products: updatedProducts });
  
      if (hasOutOfStock) {
        if (orderId) {
          const orderRef = doc(db, 'orders', orderId);

          const totalItems = updatedProducts.reduce((total, product) => total + (Number(product.quantity) || 0), 0);
          await updateDoc(orderRef, {
            products: updatedProducts,
            totalItems: totalItems,
          });
        }
        
      
        setCart(updatedProducts);
        setOrder((prev: any) => ({ ...prev, products: updatedProducts }));
        return;
      }
      
  
      setIsPopoverOpen(true);
  
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Something went wrong while checking stock.");
    }
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
    <div className="bg-gray-100 w-full min-h-screen pt-2 ">
      <div className="container mx-auto p-4 xl:pl-32 xl:pr-32">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        {/* {addresses.length === 0 && ( <p>
          
        </p> )} */}
        
        <div className="rounded-lg text-gray-500">
        <div className="flex-1">
          {/* If user doesn't add any items */}
          {cart.length == 0 ? (
            <>
            <div className="flex flex-col items-center justify-center h-screen text-center -mt-40">
              <p className="text-3xl font-semibold tracking-[.025em] mb-8">Your Cart is <span className='text-red-500'>EMPTY!</span></p>
              <p className="text-md text-gray-500 mb-4">Must add items on the cart before you proceed to chekout.</p>
              <button 
                className="bg-green-700 hover:bg-green-700 text-white rounded-md pl-2 pr-2 font-bold text-sm flex items-center justify-center cursor-pointer"
                onClick={() => router.push(`/`)}
              >
                <svg
                  viewBox="0 0 151.5 154.5"
                  preserveAspectRatio="xMidYMid meet"
                  className="max-w-[50px] h-[50px] -ml-2"
                >
                  <g>
                    <path
                      fillOpacity="1"
                      fill="green"
                      d="M 35.5,-0.5 C 62.1667,-0.5 88.8333,-0.5 115.5,-0.5C 135.833,3.16667 147.833,15.1667 151.5,35.5C 151.5,63.1667 151.5,90.8333 151.5,118.5C 147.833,138.833 135.833,150.833 115.5,154.5C 88.8333,154.5 62.1667,154.5 35.5,154.5C 15.1667,150.833 3.16667,138.833 -0.5,118.5C -0.5,90.8333 -0.5,63.1667 -0.5,35.5C 3.16667,15.1667 15.1667,3.16667 35.5,-0.5 Z"
                    ></path>
                  </g>
                  <g>
                    <path
                      fillOpacity="0.93"
                      fill="white"
                      d="M 41.5,40.5 C 45.8333,40.5 50.1667,40.5 54.5,40.5C 57.0108,51.5431 59.6775,62.5431 62.5,73.5C 74.1667,73.5 85.8333,73.5 97.5,73.5C 99.4916,67.1906 101.492,60.8573 103.5,54.5C 91.8476,53.6675 80.1809,53.1675 68.5,53C 65.8333,51 65.8333,49 68.5,47C 82.1667,46.3333 95.8333,46.3333 109.5,47C 110.578,47.6739 111.245,48.6739 111.5,50C 108.806,60.4206 105.139,70.4206 100.5,80C 88.8381,80.4999 77.1714,80.6665 65.5,80.5C 65.2865,82.1439 65.6198,83.6439 66.5,85C 78.5,85.3333 90.5,85.6667 102.5,86C 111.682,90.8783 113.516,97.7117 108,106.5C 99.0696,112.956 92.0696,111.289 87,101.5C 86.2716,98.7695 86.4383,96.1029 87.5,93.5C 83.2047,92.3391 78.8713,92.1725 74.5,93C 77.4896,99.702 75.8229,105.035 69.5,109C 59.4558,111.977 53.4558,108.31 51.5,98C 51.8236,93.517 53.8236,90.017 57.5,87.5C 58.6309,85.9255 58.7975,84.2588 58,82.5C 55,71.1667 52,59.8333 49,48.5C 46.2037,47.7887 43.3704,47.122 40.5,46.5C 39.2291,44.1937 39.5624,42.1937 41.5,40.5 Z"
                    ></path>
                  </g>
                </svg>
                RETURN TO SHOP
              </button>
            </div>
          </>
          ) : (
          // If user added items in their cart
          <>
          <div className="bg-white shadow-md">
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
            </>
          )}
        </div>

          {/* <div className="flex justify-between font-bold text-lg p-4 pr-10">
            <p>Total:</p>
            <p>₹{totalAmount}</p>
          </div> */}

          {/* Popover will be open when user click on Proceed to Payment button */}
          
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
