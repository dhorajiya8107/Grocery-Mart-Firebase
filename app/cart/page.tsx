"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, setDoc } from "firebase/firestore";
import { ArrowRight, Info, InfoIcon, Minus, Plus, ShoppingBag, ShoppingCart, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { db } from "../src/firebase";

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
  const [products, setProducts] = useState<Product[]>([]);
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
          router.replace("/");
          return;
        }
      }
      setLoading(false);
    })

    return () => unsubscribe();
  }, [])

  // Fetch the cart data from firestore
  useEffect(() => {
    if (!userId) return;
  
    const cartRef = doc(db, "cart", userId);
  
    // Set up real-time listener
    const unsubscribe = onSnapshot(cartRef, (cartDoc) => {
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
      } else {
        console.log("No cart data found for user:", userId);
        setDoc(cartRef, { products: [] });
        setCart([]);
      }
    }, (error) => {
      console.error("Real-time cart listener error:", error);
    });
  
    return () => unsubscribe();
  }, [userId]);

  // Fetch data from the products
    useEffect(() => {
      setLoading(true);
    
      const productQuery = query(
        collection(db, 'products'),
      );
    
      const unsubscribe = onSnapshot(productQuery, (snapshot) => {
        const productList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            productName: data.productName,
            description: data.description,
            price: parseFloat(data.price),
            discountedPrice: parseFloat(data.discountedPrice),
            imageUrl: data.imageUrl,
            quantity: data.quantity || '0',
            expiresAt: data.expiresAt,
          } as Product;
        });
    
        setProducts(productList);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching real-time products:", error);
        setLoading(false);
      });
    
      // Cleanup listener on unmount or category change
      return () => unsubscribe();
    }, []);

    

  // Updating cart
  const updateCart = async (updatedProducts: Product[]) => {
    if (userId) {
      const cartRef = doc(db, "cart", userId);
      await setDoc(cartRef, { products: updatedProducts });
    }
  }

  // Remove cart item
  const removeFromCart = async (productId: string) => {
    const previousCart = [...cart];
    const updatedCart = cart.filter((item) => item.id !== productId);

    setCart(updatedCart);
    updateCart(updatedCart);

    await toast("Item removed from cart", {
      action: {
        label: "Undo",
        onClick: () => {
          setCart(previousCart);
          updateCart(previousCart);
          toast.success("Removed item has been added!", {
            style: { color: 'red' },
          });
        },
      },
      duration: 2000,
    })
  }

  // Increment item quantity
  const incrementQuantity = async (productId: string) => {
    const productInStore = products.find(p => p.id === productId);
    if (!productInStore) return; // Product not found in store
  
    setCart((prevCart) => {
      const updatedCart = prevCart.map((product) => {
        if (product.id === productId) {
          const currentQuantity = Number(product.quantity);
          const availableStock = Number(productInStore.quantity);
  
          if (currentQuantity < availableStock) {
            return { ...product, quantity: currentQuantity + 1 };
          } else {
            toast.error(`${product.productName} is out of stock!`, {
              style: { backgroundColor: '', color: 'red' },
            });
          }
        }
        return product;
      });
  
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
              return { ...product, quantity: product.quantity - 1 }
            }
            return null;
          }
          return product;
        })
        .filter((product): product is Product => product !== null);

      updateCart(updatedCart);
      return updatedCart;
    })
  }

  // Total amount of items added in the cart
  const totalAmount = cart.reduce((total, product) => {
    const discountedPrice = isNaN(Number(product.discountedPrice)) ? 0 : product.discountedPrice

    return total + discountedPrice * product.quantity;
  }, 0)

  // Saved Amount
  const totalSavedAmount = cart.reduce((total, product) => {
    const originalPrice = isNaN(Number(product.price)) ? 0 : product.price * product.quantity;

    const discountedPrice = isNaN(Number(product.discountedPrice)) ? 0 : product.discountedPrice * product.quantity;

    const savedAmount = originalPrice - discountedPrice;

    return total + savedAmount;
  }, 0)

  const totalPrice = cart.reduce((total, product) => {
    const originalPrice = isNaN(Number(product.price)) ? 0 : product.price * product.quantity;

    return total + originalPrice;
  }, 0)

  // Total item added to cart
  const totalItems = cart.reduce((total, product) => total + (Number(product.quantity) || 0), 0);

  // By this, user order has been added to firestore
  const handleProceedToCheckout = async () => {
    if (!userId || cart.length === 0 || isSubmitting) return;

    console.log("Total Saved Amount:", totalSavedAmount);
    console.log("Total items:", totalItems);

    setIsSubmitting(true);

    try {
      const userRef = doc(db, "users", userId);
      const userSnapshot = await getDoc(userRef);
      const lastOrderId = userSnapshot.exists() ? userSnapshot.data().lastOrderId : null;

      if (lastOrderId) {
        const orderRef = doc(db, "orders", lastOrderId);
        const orderSnapshot = await getDoc(orderRef);

        if (orderSnapshot.exists()) {
          const paymentStatus = orderSnapshot.data().paymentStatus;

          if (paymentStatus === "Pending") {
            await setDoc(
              orderRef,
              {
                orderId: lastOrderId,
                userId,
                products: cart,
                totalAmount,
                totalItems,
                paymentStatus: "Pending",
                createdAt: orderSnapshot.data().createdAt || new Date().toISOString(),
              },
              { merge: true },
            )

            console.log(`Order updated with ID: ${lastOrderId}`);
            router.push(`/checkout?orderId=${lastOrderId}`);
            return
          } else {
            console.log(`Last order with ID ${lastOrderId} is already paid.`);
          }
        }
      }

      const orderId = Math.floor(Math.random() * 1000000000);
      const formattedOrderId = `ORD${orderId}`;
      const newOrderRef = doc(collection(db, "orders"), formattedOrderId);

      await setDoc(newOrderRef, {
        orderId: formattedOrderId,
        userId,
        products: cart,
        totalAmount,
        totalItems,
        paymentStatus: "Pending",
        createdAt: new Date().toISOString(),
      })

      console.log(`New order placed with ID: ${formattedOrderId}`);

      await setDoc(userRef, { lastOrderId: formattedOrderId }, { merge: true });

      router.push(`/checkout?orderId=${formattedOrderId}`);
    } catch (error) {
      console.error("Error placing order:", error);
    } finally {
      setIsSubmitting(false)
    }
  }

  // On clicking, it will redirect to product details page
  const handleProductClick = (product: { productName: string; id: any }) => {
    const formattedProductName = product.productName.replace(/\s+/g, "-");
    router.push(`/product-details/${product.id}?${formattedProductName}`);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-200 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <div className="text-xl font-medium">Please log in to view your cart</div>
        <Button onClick={() => router.push("/")} className="bg-green-700 hover:bg-green-800">
          Return to Home
        </Button>
      </div>
    )
  }

  return (
    <>
      <Toaster/>
      <div className="bg-gray-50 pb-20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {cart.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-gray-100 p-6 rounded-full mb-6">
                  <ShoppingCart className="h-16 w-16 text-gray-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Your Cart is <span className="text-green-700">Empty!</span>
                </h2>
                <p className="text-gray-500 mb-8 max-w-md">Add items to your cart before proceeding to checkout.</p>
                <Button
                  onClick={() => router.push("/")}
                  className="bg-green-700 hover:bg-green-800 flex items-center gap-2"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Continue Shopping
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-screen">
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  <div className="flex items-center mb-8">
                    <ShoppingCart className="h-8 w-8 text-green-670 mr-3" />
                    <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
                    {cart.length > 0 && (
                      <span className="ml-3 bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                        {totalItems} {totalItems === 1 ? "item" : "items"}
                      </span>
                    )}
                  </div>
                  {cart.map((product) => {
                    const matchedProduct = products.find(p => p.id === product.id);
                    const isOutOfStock = matchedProduct ? Number(matchedProduct.quantity) === 0 : false;

                    return(
                      <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow duration-300">
                      <CardContent className="p-0">
                        <div className="relative">
                          <div
                            className={`flex flex-co min-[400px]:flex-row p-4 cursor-pointer`}
                            onClick={() => handleProductClick(product)}
                          >
                            <div className={`flex flex-shrink-0 relative items-center justify-center ${isOutOfStock ? 'bg-white opacity-50' : 'bg-white'}`}>
                              {isOutOfStock && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-white bg-black text-sm rounded-xl font-bold p-2">Out of Stock</span>
                                </div>
                              )}
                              <img
                                src={product.imageUrl || "/placeholder.svg"}
                                alt={product.productName}
                                className="w-24 h-24 sm:w-32 sm:h-32 rounded-md object-cover mr-4"
                              />
                            </div>
                            <div className="flex flex-col justify-between w-full min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.productName}</h3>
                              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
              
                              <div className="flex items-center mb-3 text-sm text-gray-700 flex-wrap gap-x-1">
                                <p className="block max-[393px]:hidden">Total Price : </p>
                                <span className="text-lg font-bold text-gray-900"> ₹{(product.discountedPrice * product.quantity)}</span>
                                {product.price > product.discountedPrice && (
                                  <>
                                    <span className="ml-1 text-sm text-gray-500 line-through">₹{product.price}</span>
                                    <span className="ml-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">
                                      {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}%
                                      OFF
                                    </span>
                                  </>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-700 mr-3">Quantity:</span>
                                  <div
                                    className="items-center border border-gray-300 rounded-md overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => decrementQuantity(product.id)}
                                      className="px-3 py-2 text-white bg-green-700 hover:bg-green-700 transition-colors"
                                      aria-label="Decrease quantity"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="px-3 py-2 text-center">{product.quantity}</span>
                                    <button
                                      onClick={() => incrementQuantity(product.id)}
                                      className="px-3 py-2 text-white bg-green-700 hover:bg-green-700 transition-colors"
                                      aria-label="Increase quantity"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFromCart(product.id)
                            }}
                            className="absolute -top-3 right-3 p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors"
                            aria-label="Remove item"
                          >
                            <X className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                    )
                  })}
                </div>
              </div>
              <div className="lg:col-span-1 min-[1024px]:pt-[68px]">
                <Card className="sticky top-[145px]">
                  <CardContent className="p-6 -mt-3">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
                        </span>
                        <span className="font-medium">₹{totalPrice}</span>
                      </div>

                      {totalSavedAmount > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span className="flex items-center">Discount</span>
                          <span className="font-medium">-₹{totalSavedAmount}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="flex items-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" className="hover:bg-white text-md border-none shadow-none p-0 -mt-1 -ml-3">
                                  Delivery
                                  <InfoIcon />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="shadow-md">
                                <div>
                                  <p className="mb-2">Delivery charge</p>
                                  <p className="font-medium text-green-700">FREE</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                        <span className="font-medium text-green-700">FREE</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between mb-6">
                      <span className="text-lg font-bold">Total</span>
                      <div className="text-right">
                        <div className="text-lg font-bold">₹{totalAmount}</div>
                        {/* {totalSavedAmount > 0 && (
                          <div className="text-sm text-green-700">You save ₹{totalSavedAmount}</div>
                        )} */}
                      </div>
                    </div>

                    {totalSavedAmount > 0 && (
                      <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-6">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="bg-green-100 p-1 rounded-full">
                              <Info className="h-4 w-4 text-green-700" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">Total Savings</h3>
                            <p className="text-sm text-green-700 mt-1">
                              You're saving ₹{totalSavedAmount} on this order!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleProceedToCheckout}
                      disabled={isSubmitting}
                      className="w-full -mb-3 bg-green-700 hover:bg-green-800 text-white py-6 rounded-md flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <>
                          Proceed to Checkout
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default CartPage;