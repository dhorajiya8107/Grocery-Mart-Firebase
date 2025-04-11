'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../src/firebase';
import { toast, Toaster } from 'sonner';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  productName: string;
  price: number;
  discountedPrice: number;
  imageUrl: string;
  quantity: number;
  description: string;
}

const CartPage = () => {
  const [cart, setCart] = useState<Product[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const auth = getAuth();

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

  // Fetch the cart data from firestore
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

            console.log('Cart data:', updatedProducts);
            setCart(updatedProducts);
          }
        } else {
          console.log('No cart data found for user:', userId);
          await setDoc(cartRef, { products: [] });
          setCart([]);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };

      fetchCart();
  }, [userId]);

  // Updating cart
  const updateCart = async (updatedProducts: Product[]) => {
    if (userId) {
      const cartRef = doc(db, 'cart', userId);
      await setDoc(cartRef, { products: updatedProducts });
    }
  };

  // Remove cart item
  const removeFromCart = async (productId: string) => {
    const previousCart = [...cart];
    const updatedCart = cart.filter((item) => item.id !== productId);
  
    setCart(updatedCart);
    updateCart(updatedCart);
  
    await toast('Item removed from cart', {
      action: {
        label: 'Undo',
        onClick: () => {
          setCart(previousCart);
          updateCart(previousCart);
          toast.success('Removed item has been added!');
        },
      },
      duration: 2000,
    });
  };
  

  // Increment item quantity
  const incrementQuantity = async (productId: string) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((product) => 
        product.id === productId 
          ? { ...product, quantity: Number(product.quantity) + 1 }
          : product
      );
      updateCart(updatedCart);
      return updatedCart;
    });
  };
  
  // Decrement item quantity
  const decrementQuantity = async (productId: string) => {
    setCart((prevCart) => {
      const updatedCart = prevCart
        .map((product) => {
          if (product.id === productId) {
            if (product.quantity > 1) {
              return { ...product, quantity: product.quantity - 1 };
            }
            return null;
          }
          return product;
        })
        .filter((product) => product !== null);
  
      updateCart(updatedCart);
      return updatedCart;
    });
  };
  
  // Total amount of items added in the cart
  const totalAmount = cart.reduce((total, product) => {
    const discountedPrice = isNaN(Number(product.discountedPrice)) 
      ? 0
      : product.discountedPrice;

    return total + (discountedPrice * product.quantity);
  }, 0);

  // Saved Amount
  const totalSavedAmount = cart.reduce((total, product) => {
    const originalPrice = isNaN(Number(product.price))
      ? 0
      : product.price * product.quantity;
  
    const discountedPrice = isNaN(Number(product.discountedPrice))
      ? 0
      : product.discountedPrice * product.quantity;
  
    const savedAmount = originalPrice - discountedPrice;
  
    return total + savedAmount;
  }, 0);

  const totalPrice = cart.reduce((total, product) => {
    const originalPrice = isNaN(Number(product.price))
      ? 0
      : product.price * product.quantity;
  
    return total + originalPrice;
  }, 0);
  
  // Total item added to cart
  const totalItems = cart.reduce((total, product) => total + (Number(product.quantity) || 0), 0);

  // By this, user order has been added to firestore
  const handleProceedToCheckout = async () => {
    if (!userId || cart.length === 0 || isSubmitting) return;
  
    console.log("Total Saved Amount:", totalSavedAmount);
    console.log("Total items:", totalItems);
  
    setIsSubmitting(true);
  
    try {
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userRef);
      const lastOrderId = userSnapshot.exists() ? userSnapshot.data().lastOrderId : null;
  
      if (lastOrderId) {
        const orderRef = doc(db, 'orders', lastOrderId);
        const orderSnapshot = await getDoc(orderRef);
  
        if (orderSnapshot.exists()) {
          const paymentStatus = orderSnapshot.data().paymentStatus;
  
          if (paymentStatus === 'Pending') {
            await setDoc(orderRef, {
              orderId: lastOrderId,
              userId,
              products: cart,
              totalAmount,
              totalItems,
              paymentStatus: 'Pending',
              createdAt: orderSnapshot.data().createdAt || new Date().toISOString(),
            }, { merge: true });
  
            console.log(`Order updated with ID: ${lastOrderId}`);
            router.push(`/checkout?orderId=${lastOrderId}`);
            return;
          } else {
            console.log(`Last order with ID ${lastOrderId} is already paid.`);
          }
        }
      }
  
      const orderId = Math.floor(Math.random() * 1000000000);
      const formattedOrderId = `ORD${orderId}`;
      const newOrderRef = doc(collection(db, 'orders'), formattedOrderId);
  
      await setDoc(newOrderRef, {
        orderId: formattedOrderId,
        userId,
        products: cart,
        totalAmount,
        totalItems,
        paymentStatus: 'Pending',
        createdAt: new Date().toISOString(),
      });
  
      console.log(`New order placed with ID: ${formattedOrderId}`);
  
      await setDoc(userRef, { lastOrderId: formattedOrderId }, { merge: true });
  
      router.push(`/checkout?orderId=${formattedOrderId}`);
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  
  // On clicking, it will redirect to product details page
  const handleProductClick = (product: { productName: string; id: any; }) => {
    const formattedProductName = product.productName.replace(/\s+/g, '-');
    router.push(`/pd/${product.id}?${formattedProductName}`);
  };
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userId) {
    return <div>Please log in to view your cart.</div>;
  }

  return (
    <>
    <Toaster />
    <div className='bg-gray-100 w-full min-h-screen xl:pl-40 xl:pr-40 pt-2 pb-20'>
    <div className="container mx-auto p-5">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      <div className="flex flex-col md:flex-row space-y-4 md:space-x-8">
        <div className="flex-1">
          {/* If user doesn't add any items */}
          {cart.length === 0 ? (
          <>
            <div className="flex flex-col items-center justify-center text-center pt-40">
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
            <div className='w-full'>
              {cart.map((product) => (
                <div key={product.id} className="relative" onClick={() => handleProductClick(product)}>
                <div className="flex flex-col min-[400px]:flex-row w-full bg-white p-4 justify-between items-center mb-4 border shadow-md rounded-md">
                  <div className="flex items-center w-full sm:w-auto">
                    <img src={product.imageUrl} alt={product.productName} className="w-24 h-24 sm:w-32 sm:h-32 rounded-md object-cover mr-4"/>
                    <div>
                      <p className="text-lg sm:text-2xl font-bold">{product.productName}</p>
                      <p className="text-sm text-gray-500 mb-2">{product.description}</p>
                      <p className="text-lg mb-2">Total Price: ₹ 
                        {product.discountedPrice && !isNaN(Number(product.discountedPrice)) 
                          ? (product.discountedPrice * product.quantity)
                          : '₹0.00'}
                      </p>
                      <div className='flex items-center'>
                      <p className="text-lg text-gray-500 mr-2">Quantity: </p>
                      <div className="flex bg-green-700 text-white rounded-md" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => decrementQuantity(product.id)} 
                          className="py-1 px-2 text-xs"
                        >
                          -
                        </button>
                        <p className='py-1 px-3'>{product.quantity}</p>
                        <button 
                          onClick={() => incrementQuantity(product.id)} 
                          className="py-1 px-2 text-xs"
                        >
                          +
                        </button>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromCart(product.id)
                  }}
                  className="absolute top-1 right-2 py-2 px-2 rounded-md text-xs hover:bg-gray-200"
                >
                X
                </button>
                </div>
              ))}

              {/* Order summary */}
              <div className="w-90 max-[432px]:w-full bg-white rounded-md shadow-md p-4">
               <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                <div className="flex justify-between mb-2 pr-4 pl-4">
                  <p>
                    Items total 
                    <span className='font-bold ml-2 text-sm text-blue-500 bg-blue-200 px-1 py-0.5 rounded-md'>
                      Saved ₹{totalSavedAmount}
                    </span>
                    {/* ({totalItems} items) */}
                  </p>
                  <div className='flex'>
                    <p className='line-through mr-2 text-gray-500'>₹{totalPrice}</p>
                    <p className="font-bold">₹{totalAmount}</p>
                  </div>
                </div>

                <div className="flex justify-between mb-4 pr-4 pl-4">
                  <p className="flex items-center">
                    Delivery charges
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="black" viewBox="0 0 24 24" className="ml-1">
                      <circle cx="12" cy="12" r="10" stroke="black" strokeWidth="2" fill="none" />
                      <path d="M12 7v6" stroke="black" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="12" cy="16" r="1.5" fill="black" />
                    </svg>
                  </p>
                  <div className="flex">
                    <p className='line-through text-sm mr-1 text-gray-500'>₹30</p>
                    <p className='text-blue-500 text-sm font-bold'>FREE</p>
                  </div>
                </div>
                <div className="flex justify-between font-bold mb-4 pr-4 pl-4">
                  <p>Grand total</p>
                  <p>₹{totalAmount}</p>
                </div>
                <div className="relative pt-2 pb-2">
                  <div className="absolute top-0 left-0 w-full">
                    <svg
                      className="w-full"
                      height="12"
                      viewBox="0 0 1200 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill="#BFDBFE"
                        d="M0 10 L20 0 L40 10 L60 0 L80 10 L100 0 L120 10 L140 0 L160 10 L180 0 L200 10 L220 0 L240 10 L260 0 L280 10 L300 0 L320 10 L340 0 L360 10 L380 0 L400 10 L420 0 L440 10 L460 0 L480 10 L500 0 L520 10 L540 0 L560 10 L580 0 L600 10 L620 0 L640 10 L660 0 L680 10 L700 0 L720 10 L740 0 L760 10 L780 0 L800 10 L820 0 L840 10 L860 0 L880 10 L900 0 L920 10 L940 0 L960 10 L980 0 L1000 10 L1020 0 L1040 10 L1060 0 L1080 10 L1100 0 L1120 10 L1140 0 L1160 10 L1180 0 L1200 10 V20 H0 Z"
                      ></path>
                    </svg>
                  </div>
                  <div className="flex justify-between font-bold text-blue-500 bg-blue-200 w-full p-2 rounded-b-xl">
                    <p>Your total saving</p>
                    <p>₹{totalSavedAmount}</p>
                  </div>
                </div>
            <button
              onClick={handleProceedToCheckout} 
              className="w-full bg-green-700 text-white py-2 rounded-md cursor-pointer flex justify-between items-center hover:bg-green-800 transition duration-300 shadow-md hover:shadow-lg"
            >
              <div className="ml-4 text-xs flex flex-col items-start">
                <p>₹{totalAmount}</p>
                <p className='font-thin'>TOTAL</p>
              </div>
              <p className=" font-normal flex items-center mr-4">
                Proceed
                <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 -rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              </p>
            </button>
          </div>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
    </div>
    </>
  );
};

export default CartPage;