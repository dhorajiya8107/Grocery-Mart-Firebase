"use client"

import { useState, useEffect } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore"
import { db } from "../src/firebase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import successAnimation from "../../animation/Animation - 1742460011298.json"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Briefcase, Check, CreditCard, Home, Hotel, InfoIcon, MapPin, Package, ShieldCheck, Truck, Wallet } from "lucide-react"
import AddAddressPage from "@/components/AddAddress"
import { toast, Toaster } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

interface Product {
  id: string
  productName: string
  price: number
  discountedPrice: number
  imageUrl: string
  quantity: number
  description: string
}

interface Address {
  defaultAddress: boolean
  address: string
  floor?: string
  area: string
  landmark?: string
  name: string
  phoneNumber: string
  addressId: string
  createdAt?: number
  updatedAt?: number
  addressType: "home" | "work" | "hotel" | "other"
  block?: string
  state?: string
  country?: string
}

interface PostOffice {
  Block?: string
  State: string
  Country: string
}

const CheckoutPage = () => {
  const [cart, setCart] = useState<Product[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false)
  const [paymentMethod, setPaymentMethod] = useState<string>("Credit Card")
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false)
  const [processingPayment, setProcessingPayment] = useState<boolean>(false)
  const router = useRouter()
  const auth = getAuth()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get("orderId")
  const [order, setOrder] = useState<any>(null)
  // const Payment_Methods = ["Credit Card", "Debit Card", "UPI", "Net Banking"]
  const Payment_Methods = [
    { id: 'credit', name: 'Credit Card', icon: <CreditCard size={20} /> },
    { id: 'debit', name: 'Debit Card', icon: <CreditCard size={20} /> },
    { id: 'upi', name: 'UPI', icon: <Wallet size={20} /> },
    { id: 'netbanking', name: 'Net Banking', icon: <Wallet size={20} /> }
  ];
  const [addresses, setAddresses] = useState<Address[]>([])
  const [mode, setMode] = useState<"view" | "add" | "edit">("view")
  const [activeDialog, setActiveDialog] = useState<
    "sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null
  >(null)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)

  // If user is login then set userId otherwise null
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        setUserId(user.uid)
      } else {
        setUserId(null)
        if (!auth.currentUser) {
          router.replace("/")
          return
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Fetch the orders data from firestore to find orderId
  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        try {
          const orderRef = doc(db, "orders", orderId)
          const orderSnap = await getDoc(orderRef)

          if (orderSnap.exists()) {
            setOrder(orderSnap.data())
          } else {
            console.log("Order not found")
          }
        } catch (error) {
          console.error("Error fetching order:", error)
        }
      }
    }

    fetchOrder()
  }, [orderId])

  useEffect(() => {
    const auth = getAuth()

    const subscribeToAddresses = (userId: string) => {
      try {
        const addressRef = collection(db, "addresses")
        const q = query(addressRef, where("userId", "==", userId))

        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const addressesData = snapshot.docs.map((doc) => ({
              ...(doc.data() as Address),
              id: doc.id,
            }))

            setAddresses(addressesData)
            const defaultAddress = addressesData.find((address) => address.defaultAddress)
            if (defaultAddress) {
              setSelectedAddressId(defaultAddress.addressId)
            }
            setMode("view")
          } else {
            setMode("add")
          }
        })

        return unsubscribe
      } catch (error) {
        console.error("Error subscribing to addresses:", error)
      }
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
        const unsubscribeAddresses = subscribeToAddresses(user.uid)

        return () => unsubscribeAddresses?.()
      }
    })

    return () => unsubscribeAuth()
  }, [])

  // Fetch cart data from firestore
  useEffect(() => {
    const fetchCart = async () => {
      if (!userId) return

      try {
        const cartRef = doc(db, "cart", userId)
        const cartDoc = await getDoc(cartRef)

        if (cartDoc.exists()) {
          const cartData = cartDoc.data()
          if (cartData?.products) {
            const updatedProducts = cartData.products.map((product: Product) => {
              const discountedPrice = isNaN(Number(product.discountedPrice)) ? product.price : product.discountedPrice

              return {
                ...product,
                discountedPrice,
              }
            })

            setCart(updatedProducts)
          }
        }
      } catch (error) {
        console.error("Error fetching cart:", error)
      }
    }

    if (userId) {
      fetchCart()
    }
  }, [userId])

  // Total amount of items added in the cart
  const totalAmount = cart.reduce((total, product) => {
    const discountedPrice = isNaN(Number(product.discountedPrice)) ? 0 : product.discountedPrice

    return total + discountedPrice * product.quantity
  }, 0)

  // Total saved amount
  const totalSavedAmount = cart.reduce((total, product) => {
    const originalPrice = isNaN(Number(product.price)) ? 0 : product.price * product.quantity
    const discountedPrice = isNaN(Number(product.discountedPrice)) ? 0 : product.discountedPrice * product.quantity
    return total + (originalPrice - discountedPrice)
  }, 0)

  //Total item added to cart
  const totalItems = cart.reduce((total, product) => total + (Number(product.quantity) || 0), 0)

  // Handle payment from user
  const handleConfirmPayment = async () => {
    if (processingPayment) return

    setProcessingPayment(true)
    try {
      if (orderId && order) {
        const orderRef = doc(db, "orders", orderId)

        await updateDoc(orderRef, {
          selectedAddressId,
          orderStatus: "Processing",
          paymentStatus: "Paid",
        })

        const paymentRef = doc(collection(db, "payment"))
        const paymentId = paymentRef.id

        await setDoc(paymentRef, {
          paymentId,
          orderId,
          userId: order.userId,
          totalAmount: order.totalAmount,
          paymentMethod,
          createdAt: new Date().toISOString(),
        })

        for (const product of order.products) {
          const productRef = doc(db, "products", product.id)
          const mostSellerRef = doc(db, "mostseller", product.id)

          await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef)
            const mostSellerDoc = await transaction.get(mostSellerRef)

            if (!productDoc.exists()) {
              throw new Error(`Product ${product.id} not found`)
            }

            const currentQuantity = productDoc.data().quantity || 0
            const newQuantity = currentQuantity - product.quantity

            if (newQuantity < 0) {
              toast.info(`Not enough stock for product ${product.productName}. Try after sometime.`)
              throw new Error(`Not enough stock for product ${product.productName}`)
            }

            transaction.update(productRef, { quantity: newQuantity })
            // updating products total quantity sells
            if (mostSellerDoc.exists()) {
              const existingQuantity = Number(mostSellerDoc.data().quantity || 0)
              const incomingQuantity = Number(product.quantity)
              transaction.update(mostSellerRef, {
                quantity: existingQuantity + incomingQuantity,
              })
            } else {
              transaction.set(mostSellerRef, {
                id: product.id,
                quantity: Number(product.quantity),
                productName: product.productName,
              })
            }
          })
        }

        const cartRef = doc(db, "cart", order.userId)
        await setDoc(cartRef, { products: [] })

        console.log("Payment successful!")
        setPaymentSuccess(true)
        setIsPopoverOpen(false)

        setTimeout(() => {
          router.push("/")
        }, 3000)
      }
    } catch (error) {
      console.error("Payment failed:", error)
      toast.error("Payment failed. Please try again.")
    } finally {
      setProcessingPayment(false)
    }
  }

  // For opening edit dialog
  const openAddressDialog = (address: Address) => {
    setActiveDialog("address")
  }

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId)
  }

  // Handle checkout and checking if product is out of stock or not
  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.info("Please select an address before proceeding to checkout.")
      setActiveDialog("address")
      return
    }

    if (!userId) {
      toast.error("User ID is missing.")
      return
    }

    try {
      const cartRef = doc(db, "cart", userId)
      const cartSnap = await getDoc(cartRef)

      if (!cartSnap.exists()) {
        toast.error("Cart not found.")
        return
      }

      const cartData = cartSnap.data()
      const updatedProducts: any[] | ((prevState: Product[]) => Product[]) = []
      let hasOutOfStock = false

      for (const item of cartData.products) {
        const productRef = doc(db, "products", item.id)
        const productSnap = await getDoc(productRef)

        if (productSnap.exists()) {
          const productData = productSnap.data()
          const availableQty = productData.quantity || 0

          if (availableQty === 0) {
            hasOutOfStock = true
            toast.info(`"${productData.productName}" is out of stock and has been removed from your cart.`)
          } else {
            updatedProducts.push(item)
          }
        }
      }

      await updateDoc(cartRef, { products: updatedProducts })

      if (hasOutOfStock) {
        if (orderId) {
          const orderRef = doc(db, "orders", orderId)

          const totalItems = updatedProducts.reduce((total, product) => total + (Number(product.quantity) || 0), 0)
          await updateDoc(orderRef, {
            products: updatedProducts,
            totalItems: totalItems,
          })
        }

        setCart(updatedProducts)
        setOrder((prev: any) => ({ ...prev, products: updatedProducts }))
        return
      }

      setIsPopoverOpen(true)
    } catch (error) {
      console.error("Checkout error:", error)
      toast.error("Something went wrong while checking stock.")
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <div className="text-xl font-medium">Please log in to continue to checkout</div>
        <Button onClick={() => router.push("/")} className="bg-green-600 hover:bg-green-700">
          Return to Home
        </Button>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {cart.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-gray-100 p-6 rounded-full mb-6">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Your Cart is <span className="text-green-700">Empty!</span>
                </h2>
                <p className="text-gray-500 mb-8 max-w-md">Add items to your cart before proceeding to checkout.</p>
                <Button
                  onClick={() => router.push("/")}
                  className="bg-green-700 hover:bg-green-800 flex items-center gap-2"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-screen">
              <div className="lg:col-span-2 space-y-6">
               <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
                {/* Delivery Address Section */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <MapPin className="mr-2 h-5 w-5 text-green-700" />
                        Delivery Address
                      </h2>
                      {addresses.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveDialog("address")}
                          className="text-green-700 border-green-700 hover:bg-green-50"
                        >
                          Change
                        </Button>
                      )}
                    </div>

                    {addresses.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-1">
                        {addresses
                          .filter((address) => address.defaultAddress)
                          .slice(0, 1)
                          .map((address, index) => (
                            <div
                              key={address.addressId || index}
                              className={`border rounded-lg p-4 relative hover:shadow-md transition-shadow ${
                                selectedAddressId === address.addressId
                                  ? "border-green-700 bg-green-50"
                                  : "border-gray-200"
                              }`}
                              onClick={() => handleSelectAddress(address.addressId)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {address.addressType === "home" && <Home size={20} className="text-green-700" />}
                                  {address.addressType === "work" && (
                                    <Briefcase size={20} className="text-green-700" />
                                  )}
                                  {address.addressType === "hotel" && <Hotel size={20} className="text-green-700" />}
                                  {address.addressType === "other" && <MapPin size={20} className="text-green-700" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-base capitalize">
                                      {address.name} • {address.addressType || "Home"}
                                    </h3>
                                    {address.defaultAddress && (
                                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">{address.phoneNumber}</p>
                                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">
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
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 mb-4">No delivery address found</p>
                        <Button
                          onClick={() => setActiveDialog("address")}
                          className="bg-green-700 hover:bg-green-800"
                        >
                          Add New Address
                        </Button>
                      </div>
                    )}
                  </CardContent>  
                </Card>

                {/* Order Items Section */}
                <Card>
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-6 border-b">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <Package className="mr-2 h-5 w-5 text-green-600" />
                        Order Items
                      </h2>
                      <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                        {totalItems} {totalItems === 1 ? "item" : "items"}
                      </span>
                    </div>

                    <div className="divide-y">
                      {cart.map((product) => (
                        <div key={product.id} className="flex p-6 gap-4">
                          <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-md overflow-hidden">
                            <img
                              src={product.imageUrl}
                              alt={product.productName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{product.productName}</h3>
                            <div className="flex mt-1 justify-between">
                              <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                              <div className="text-right">
                                <p className="font-bold text-gray-900">
                                  ₹{(product.discountedPrice * product.quantity)}
                                </p>
                                {/* {product.price > product.discountedPrice && (
                                  <p className="text-sm text-gray-500 line-through">
                                    ₹{(product.price * product.quantity)}
                                  </p>
                                )} */}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <span>Qty: {product.quantity}</span>
                              <span className="mx-2">•</span>
                              <span>₹{product.discountedPrice} each</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Info */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <Truck className="mr-2 h-5 w-5 text-green-700" />
                      <h2 className="text-xl font-bold text-gray-900">Delivery Information</h2>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="bg-green-100 p-1 rounded-full">
                            <Check className="h-4 w-4 text-green-700" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">Free Delivery</h3>
                          <p className="text-sm text-green-700 mt-1">Your order qualifies for free delivery!</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary Section */}
              <div className="lg:col-span-1 min-[1024px]:pt-[68px]">
                <Card className="sticky top-[83px]">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
                        </span>
                        <span className="font-medium">₹{totalAmount}</span>
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
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <div className="flex items-center mb-2">
                        <ShieldCheck className="h-5 w-5 text-green-700 mr-2" />
                        <span className="text-sm font-medium">Secure Checkout</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Your payment information is processed securely. We do not store credit card details.
                      </p>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      disabled={!selectedAddressId}
                      className="w-full bg-green-700 hover:bg-green-800 text-white py-6 rounded-md"
                    >
                      Proceed to Payment
                    </Button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                      By placing your order, you agree to our Terms of Service and Privacy Policy
                     </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Dialog */}
      <Dialog open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
            <DialogDescription>Choose how you'd like to pay for your order.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid gap-4">
              {Payment_Methods.map((method) => (
                <div
                  key={method.id}
                  className={`flex items-center space-x-3 space-y-0 rounded-md border p-4 ${
                    paymentMethod === method.name ? "border-green-700 bg-green-50" : "border-gray-200"
                  }`}
                  onClick={() => setPaymentMethod(method.name)}
                >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  paymentMethod === method.name ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {method.icon}
                </div>
                <div className="flex-1">
                 <p className="font-medium">{method.name}</p>
               </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-gray-700">Order Total:</span>
              <span className="font-bold text-lg">₹{totalAmount}</span>
            </div>
            <Button
              onClick={handleConfirmPayment}
              disabled={processingPayment}
              className="w-full py-6 bg-green-700 hover:bg-green-800"
            >
              {processingPayment ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                "Complete Payment"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* After payment will be success */}
      {paymentSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-md p-8 rounded-lg shadow-xl flex flex-col items-center">
            <div className="w-24 h-24 mb-4">
              <Lottie animationData={successAnimation} loop={false} />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 text-center mb-6">
              Your order has been placed successfully. You will receive a confirmation shortly.
            </p>
            <Button onClick={() => router.push("/")} className="w-full bg-green-600 hover:bg-green-800">
              Return to Home
            </Button>
          </div>
        </div>
      )}

      {activeDialog === "address" && <AddAddressPage activeDialog={activeDialog} setActiveDialog={setActiveDialog} />}
    </>
  )
}

export default CheckoutPage;