"use client";

import LogInPage from "@/app/auth/LogIn";
import { db } from "@/app/src/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home, ShoppingBag } from "lucide-react";
import { Autoplay, Navigation, Parallax } from "swiper/modules";
 
interface Product {
  id: string;
  productName: string;
  price: number;
  discountedPrice: number;
  imageUrl: string;
  quantity: string;
  description: string;
  category: string;
}
interface ProductImages {
  [key: string]: string
  productId: string
}
interface MostSeller {
  id: string;
  productName: string;
  quantity: string;
}

const ProductDetailsPage = () => {
  const [cart, setCart] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const [activeDialog, setActiveDialog] = useState<"sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null>(null);
  const productName = params["productName"];
  const [mostSeller, setMostSeller] = useState<MostSeller[]>([]);
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [productImages, setProductImages] = useState<string[]>([]);
  const swiperRef = useRef<SwiperType | null>(null);
  const thumbSwiperRef = useRef<SwiperType | null>(null);

  const category = Array.isArray(params?.categories)
    ? decodeURIComponent(params.categories[0])
    : decodeURIComponent(params?.categories || "")

  useEffect(() => {
    const auth = getAuth();
    let unsubscribeFromCart: (() => void) | null = null;
      
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const cartRef = doc(db, 'cart', user.uid);
      
        unsubscribeFromCart = onSnapshot(cartRef, (cartDoc) => {
          if (cartDoc.exists()) {
            setCart(cartDoc.data()?.products || []);
          } else {
            setCart([]);
          }
        }, (error) => {
          console.error('Error in cart snapshot:', error);
        });
      } else {
        setCart([]);
        if (unsubscribeFromCart) {
          unsubscribeFromCart();
          unsubscribeFromCart = null;
        }
      }
    });
      
    return () => {
      unsubscribeAuth();
      if (unsubscribeFromCart) unsubscribeFromCart();
    };
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
  
    const fetchProductById = () => {
      setLoading(true);
  
      if (typeof productName === "string") {
        const productRef = doc(db, "products", productName);
  
        unsubscribe = onSnapshot(productRef, async (productDoc) => {
          if (productDoc.exists()) {
            const data = productDoc.data();
            const product = {
              id: productDoc.id,
              productName: data.productName,
              description: data.description,
              price: parseFloat(data.price),
              discountedPrice: parseFloat(data.discountedPrice),
              imageUrl: data.imageUrl,
              quantity: data.quantity || "0",
              category: data.category,
            } as Product;
  
            setProducts([product]);

            // Fetch product images from productImages collection
            try {
              const productImagesRef = doc(db, "productImages", productDoc.id)
              const productImagesDoc = await getDoc(productImagesRef)

              if (productImagesDoc.exists()) {
                const imagesData = productImagesDoc.data() as ProductImages
                const images: string[] = []
                let index = 0
                while (imagesData[`imageUrl${index === 0 ? "" : index}`]) {
                  images.push(imagesData[`imageUrl${index === 0 ? "" : index}`])
                  index++
                }

                setProductImages(images)
              } else {
                setProductImages([product.imageUrl])
              }
            } catch (error) {
              console.error("Error fetching product images:", error)
              setProductImages([product.imageUrl])
            }
          } else {
            console.log("No such product!");
            setProducts([]);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching product:", error);
          setLoading(false);
        });
      }
    };
  
    fetchProductById();
  
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [productName]);

  const updateCart = async (updatedCart: Product[]) => {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error("No user logged in");
        return
      }

      setCart(updatedCart);

      const cartRef = doc(db, "cart", userId);
      await setDoc(cartRef, { products: updatedCart }, { merge: true });
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  }

  // Increment item quantity
  const incrementQuantity = (product: Product) => {
    const updatedCart = [...cart];
    const existingProductIndex = updatedCart.findIndex((item) => item.id === product.id);

    if (existingProductIndex !== -1) {
      const currentQuantity = Number.parseInt(updatedCart[existingProductIndex].quantity);

      if (currentQuantity < Number.parseInt(product.quantity)) {
        updatedCart[existingProductIndex].quantity = (currentQuantity + 1).toString();
        updateCart(updatedCart);
      } else {
        toast.error(`${product.productName} is out of stock!`, {
          style: { backgroundColor: '', color: 'red' },
        });
      }
    } else {
      if (Number.parseInt(product.quantity) > 0) {
        updatedCart.push({ ...product, quantity: "1" });
        updateCart(updatedCart);
      } else {
        toast.error(`${product.productName} is out of stock!`, {
          style: { backgroundColor: '', color: 'red' },
        });
      }
    }
  }

  // Decrement item quantity
  const decrementQuantity = (product: Product) => {
    const updatedCart = [...cart];
    const existingProductIndex = updatedCart.findIndex((item) => item.id === product.id);

    if (existingProductIndex !== -1) {
      const currentQuantity = Number.parseInt(updatedCart[existingProductIndex].quantity);
      if (currentQuantity > 1) {
        updatedCart[existingProductIndex].quantity = (currentQuantity - 1).toString();
        updateCart(updatedCart)
      } else {
        updatedCart.splice(existingProductIndex, 1);
        updateCart(updatedCart);
      }
    }
  }

  // If user is not login then it navigate to login and by clicking redirect to checkout
  const addToCart = (product: Product) => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
      setActiveDialog("log-in");
      return;
    }

    const updatedCart = [...cart];
    const existingProductIndex = updatedCart.findIndex((item) => item.id === product.id);

    if (existingProductIndex !== -1) {
      const currentQuantity = Number.parseInt(updatedCart[existingProductIndex].quantity);

      if (currentQuantity < Number.parseInt(product.quantity)) {
        updatedCart[existingProductIndex].quantity = (currentQuantity + 1).toString();
        updateCart(updatedCart);
        toast.success(`Added ${product.productName} to the cart!`, {
          style: { backgroundColor: '', color: 'green' },
        });
      } else {
        toast.error(`${product.productName} is out of stock!`);
      }
    } else {
      if (Number.parseInt(product.quantity) > 0) {
        updatedCart.push({ ...product, quantity: "1" });
        updateCart(updatedCart);
        toast.success(`Added ${product.productName} to the cart!`, {
          action: {
            label: "Checkout",
              onClick: () => {
                router.push('/checkout');
              },
            },
          duration: 2000,
          style: { backgroundColor: '', color: 'green' },
        });
      } else {
        toast.error(`${product.productName} is out of stock!`);
      }
    }
  }

  useEffect(() => {
    const fetchMostSeller = async () => {
      try {
        const mostSellerQuery = query(
        collection(db, 'mostseller'),
        orderBy('quantity', 'desc'),
        // limit(10)
        );
      
        const querySnapshot = await getDocs(mostSellerQuery);
      
        const mostSellerData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as MostSeller[];
      
        // console.log('Most Seller Data:', mostSellerData);
        setMostSeller(mostSellerData);
      } catch (error) {
        console.error('Error fetching most seller data:', error);
      }
    };
        
    fetchMostSeller();
  }, []);
  
    const mostSellerMap = new Map( mostSeller.map(ms => [ms.id, parseInt(ms.quantity)]));
      
    // filter and sort featured products by most sold quantity
    const filterMostSeller = mostSeller
      .filter(product => mostSellerMap.has(product.id))
      .sort((a, b) => {
        const aQuantity = mostSellerMap.get(a.id) || 0;
        const bQuantity = mostSellerMap.get(b.id) || 0;
        return bQuantity - aQuantity;
      })
      .slice(0, 3);
  
    const mostSellerIds = new Set(filterMostSeller.map(p => p.id));
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-200 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!products.length) {
    return <p className="text-center py-8 text-gray-600">No products found for "{category}"</p>
  }

  // const getAllProductImages = (productName: string) => {
  //   const images = [];
  //   const extensions = ['jpg', 'png', 'jpeg'];
  //   try {
  //     for (const ext of extensions) {
  //       try {
  //         const image = require(`../../../images/Grocery/${productName}/0.${ext}`);
  //         images.push(image);
  //       } catch {}
  //     }
      
  //     for (let i = 1; i <= 10; i++) {
  //       for (const ext of extensions) {
  //         try {
  //           const image = require(`../../../images/Grocery/${productName}/${i}.${ext}`);
  //           images.push(image);
  //         } catch {}
  //       }
  //     }
  //   } catch {}
    
  //   return images.length > 0 ? images : ['path/to/fallback.jpg'];
  // };

  return (
    <>
      <Toaster />
        <div className="">
        <div className="container mx-auto px-2 mb-10">
        {products.map((product) => {
          const productInCart = cart.find((item) => item.id === product.id)
          const quantityInCart = productInCart ? Number.parseInt(productInCart.quantity) : 0
          const isOutOfStock = Number.parseInt(product.quantity) === 0
          const isMostSeller = mostSellerIds.has(product.id);
          // const images = getAllProductImages(product.productName);

          return (
            <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 pt-6 border-b p-6">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/" className="flex text-lg items-center gap-1 text-green-700 hover:text-green-800">
                        <Home className="w-4 h-4"/>
                        <span>Home</span>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink onClick={() => router.push(`/categories/${product.category.replace(/\s+/g, '-')}`)} className="text-lg text-green-700 hover:text-green-800">{product.category}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-lg text-gray-500">{product.productName}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="w-full mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className={`relative flex justify-center items-center p-8 ${isOutOfStock ? 'bg-white opacity-50' : 'bg-white'}`}>
                  {isOutOfStock && (
                    <div className="absolute flex items-center">
                      <span className="text-white bg-black text-sm rounded-xl font-bold p-2">Out of Stock</span>
                    </div>
                  )}

                  <div className="flex flex-col">
                    <div className="w-80 mb-4">
                        <Swiper
                          modules={[Autoplay, Navigation, Parallax]}
                          spaceBetween={0}
                          slidesPerView={1}
                          onSwiper={(swiper) => (swiperRef.current = swiper)}
                          onSlideChange={(swiper) => {
                            setActiveIndex(swiper.activeIndex);
                            thumbSwiperRef.current?.slideTo(swiper.activeIndex);
                          }}
                          className="w-full rounded-md"
                        >
                          {productImages.map((image, index) => (
                            <SwiperSlide key={index}>
                              <div
                                className={`cursor-pointer w-full rounded-md`}
                                onClick={() => setActiveIndex(index)}
                              >
                                <img
                                  src={image || "/placeholder.svg"}
                                  alt={`${product.productName} ${index > 0 ? index : ""}`}
                                  className="w-full h-80 object-contain"
                                />
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>

                      {productImages.length > 1 && productImages.length < 5 && (
                        <div className="flex overflow-x-auto gap-2 w-full py-2">
                          {productImages.map((image, index) => (
                            <div
                              key={index}
                              className={`cursor-pointer min-w-16 h-16 border-2 rounded-md ${
                                activeIndex === index ? "border-green-700" : "border-gray-200"
                              }`}
                              // onClick={() => setActiveIndex(index)}
                              onClick={() => { swiperRef.current?.slideTo(index) }}
                            >
                              <img
                                src={image || "/placeholder.svg"}
                                alt={`${product.productName} ${index > 0 ? index : ""}`}
                                className="w-full h-full object-contain rounded-sm"
                                width={60}
                                height={60}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {productImages.length > 5 && (
                      <div className="relative w-80">
                      <Swiper
                        modules={[Navigation]}
                        spaceBetween={0}
                        slidesPerView={4.5}
                        // navigation
                        className="w-80"
                        onSwiper={(swiper) => (thumbSwiperRef.current = swiper)}
                      >
                        {productImages.map((image, index) => (
                          <SwiperSlide key={index}>
                            <div
                              onClick={() => {
                                setActiveIndex(index);
                                swiperRef.current?.slideTo(index);
                                thumbSwiperRef.current?.slideTo(index);
                              }}
                              className={`cursor-pointer border-2 rounded-md w-16 h-16 flex items-center justify-center ${
                                activeIndex === index ? "border-green-700" : "border-gray-200"
                              }`}
                            >
                              <img
                                src={image || "/placeholder.svg"}
                                alt={`Thumbnail ${index}`}
                                className="w-full h-full object-contain rounded-sm"
                                width={60}
                                height={60}
                              />
                            </div>
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                    )}

                  </div>

                </div>
                {/* Product Details */}
                <div className="min-[768px]:border-l min-[768px]:p-2">
                <div className="space-y-4 p-6">
                  {/* <div className="hidden md:block">
                    <nav className="text-sm text-gray-500 mb-4">
                      <span className="text-gray-900 font-medium">Home</span> /
                      <span className="text-gray-900 font-medium"> {product.category}</span> /
                      <span> {product.productName}</span>
                    </nav>
                  </div> */}

                  <h1 className="text-2xl font-bold text-gray-900">{product.productName}</h1>
                  
                  {isMostSeller && (
                    <div className="bg-orange-100 text-orange-700 text-xs w-20 font-bold px-2 py-1 rounded-bl-md rounded-tr-md">
                      Most seller
                    </div>
                  )}

                  <div className="border-t border-gray-200"></div>

                  <p className="text-gray-700">{product.description}</p>

                  {/* Price */}
                  <div className="text-xs">
                    {product.price > product.discountedPrice ? (
                      <>
                        <div className="text-gray-500">
                          MRP: <span className="line-through">₹{product.price}</span>
                        </div>
                        <div className="text-[22px] font-bold items-center flex">₹{product.discountedPrice}
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-lg ml-2">
                            {(((product.price - product.discountedPrice) / product.price) * 100).toFixed(0)}% OFF
                          </span>
                        </div>
                        <div className="text-gray-600">
                          (Inclusive of all taxes)
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xl font-bold">₹{product.price}</div>
                        <div className="text-gray-600">
                          (Inclusive of all taxes)
                        </div>
                      </>
                    )}
                  </div>

                  {/* If the products is out of stock then ADD button will disappear */}
                  {isOutOfStock && <p className="text-gray-500 font-bold">Out of Stock</p>}

                  <div className="flex w-[80px] items-center gap-1 text-white bg-green-700 rounded-md">
                    {isOutOfStock ? (
                      <span></span>
                  ) : (
                    quantityInCart > 0 ? (
                      <>
                        <button
                          onClick={() => decrementQuantity(product)}
                          className="px-3 py-2 rounded-md justify-center items-center"
                        >
                          -
                        </button>
                        <span className="text-md font-bold">{quantityInCart}</span>
                        <button
                          onClick={() => incrementQuantity(product)}
                          className="px-3 py-2 rounded-md justify-center items-center"
                        >
                          +
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-700 rounded-md"
                      >
                        {/* <svg viewBox="0 0 151.5 154.5" preserveAspectRatio="xMidYMid meet" 
                          className="w-5 h-5 -ml-2"
                        >
                          <g>
                            <path
                              fillOpacity="1"
                              fill="none"
                              d="M 35.5,-0.5 C 62.1667,-0.5 88.8333,-0.5 115.5,-0.5C 135.833,3.16667 147.833,15.1667 151.5,35.5C 151.5,63.1667 151.5,90.8333 151.5,118.5C 147.833,138.833 135.833,150.833 115.5,154.5C 88.8333,154.5 62.1667,154.5 35.5,154.5C 15.1667,150.833 3.16667,138.833 -0.5,118.5C -0.5,90.8333 -0.5,63.1667 -0.5,35.5C 3.16667,15.1667 15.1667,3.16667 35.5,-0.5 Z"
                            ></path>
                          </g>
                          <g>
                            <path
                              fillOpacity="0.93"
                              fill="#15803d"
                              d="M 41.5,40.5 C 45.8333,40.5 50.1667,40.5 54.5,40.5C 57.0108,51.5431 59.6775,62.5431 62.5,73.5C 74.1667,73.5 85.8333,73.5 97.5,73.5C 99.4916,67.1906 101.492,60.8573 103.5,54.5C 91.8476,53.6675 80.1809,53.1675 68.5,53C 65.8333,51 65.8333,49 68.5,47C 82.1667,46.3333 95.8333,46.3333 109.5,47C 110.578,47.6739 111.245,48.6739 111.5,50C 108.806,60.4206 105.139,70.4206 100.5,80C 88.8381,80.4999 77.1714,80.6665 65.5,80.5C 65.2865,82.1439 65.6198,83.6439 66.5,85C 78.5,85.3333 90.5,85.6667 102.5,86C 111.682,90.8783 113.516,97.7117 108,106.5C 99.0696,112.956 92.0696,111.289 87,101.5C 86.2716,98.7695 86.4383,96.1029 87.5,93.5C 83.2047,92.3391 78.8713,92.1725 74.5,93C 77.4896,99.702 75.8229,105.035 69.5,109C 59.4558,111.977 53.4558,108.31 51.5,98C 51.8236,93.517 53.8236,90.017 57.5,87.5C 58.6309,85.9255 58.7975,84.2588 58,82.5C 55,71.1667 52,59.8333 49,48.5C 46.2037,47.7887 43.3704,47.122 40.5,46.5C 39.2291,44.1937 39.5624,42.1937 41.5,40.5 Z"
                            ></path>
                          </g>
                        </svg> */}
                        <ShoppingBag className="w-5 h-5"/>
                        <span className="text-md font-bold">ADD</span>
                      </button>
                    )
                    )}
                  </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          )
        })}
        </div>
      </div>

      {activeDialog === "log-in" && <LogInPage activeDialog={activeDialog} setActiveDialog={setActiveDialog} />}
    </>
  )
}

export default ProductDetailsPage;
