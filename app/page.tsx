"use client"

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { collection, getDocs, query, limit, orderBy, doc, setDoc, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "./src/firebase";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay, Parallax } from "swiper/modules";
import { toast, Toaster } from "sonner";

import Cat1 from "../images/Home/Cat1.png";
import Cat2 from "../images/Home/Cat2.png";
import Cat3 from "../images/Home/Cat3.png";
import Cat4 from "../images/Home/Cat4.png";
import Cat5 from "../images/Home/Cat5.png";
import Cat6 from "../images/Home/Cat6.png";
import Cat7 from "../images/Home/Cat7.png";
import Cat8 from "../images/Home/Cat8.png";
import Cat9 from "../images/Home/Cat9.png";
import BabyCare from "../images/Home/BabyCare.jpg";
import Protein from "../images/Home/Protien.jpg";
import Tea from "../images/Home/Tea.jpg";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { ChevronRight } from "lucide-react";

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
interface MostSeller {
  id: string;
  productName: string;
  quantity: string;
}

const categories = [
  { name: "Vegetables & Fruits", image: Cat1, path: "Vegetables & Fruits" },
  { name: "Dairy & Bread", image: Cat2, path: "Dairy & Bread" },
  { name: "Tea, Coffee and More", image: Cat3, path: "Tea, Coffee & Health Drinks" },
  { name: "Atta, Rice and Dal", image: Cat4, path: "Atta, Rice & Dal" },
  { name: "Munchies", image: Cat5, path: "Munchies" },
  { name: "Sauces and Spreads", image: Cat6, path: "Sauces & Spreads" },
  { name: "Body Care", image: Cat7, path: "Body Care" },
  { name: "Ice Creams and More", image: Cat8, path: "Ice Creams & Frozen Desserts" },
  { name: "Cold Drinks", image: Cat9, path: "Cold Drinks & Juices" },
]

const App = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [mostSeller, setMostSeller] = useState<MostSeller[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({});
  const [activeDialog, setActiveDialog] = useState<"sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    })

    return () => unsubscribe();
  }, [])

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

  // Fetch featured products
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const productsQuery = query(
          collection(db, "products"),
          // orderBy("discountedPrice", "asc"),
          // limit(10),
        )

        const querySnapshot = await getDocs(productsQuery);
        const products: Product[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          products.push({
            id: doc.id,
            productName: data.productName,
            description: data.description || "",
            price: Number.parseFloat(data.price) || 0,
            discountedPrice: Number.parseFloat(data.discountedPrice) || 0,
            imageUrl: data.imageUrl || "",
            quantity: data.quantity || "0",
            category: data.category || "",
          })
        })

        setFeaturedProducts(products)
      } catch (error) {
        console.error("Error fetching featured products:", error)
      }
    }

    fetchFeaturedProducts()
  }, [])

  // Fetch products by category
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        const categoriesToFetch = ["Vegetables & Fruits", "Munchies", "Dairy & Bread"]
        const categoryProductsMap: Record<string, Product[]> = {}

        for (const category of categoriesToFetch) {
          const productsQuery = query(collection(db, "products"), where("category", "==", category), limit(8))

          const querySnapshot = await getDocs(productsQuery)
          const products: Product[] = []

          querySnapshot.forEach((doc) => {
            const data = doc.data()
            products.push({
              id: doc.id,
              productName: data.productName,
              description: data.description || "",
              price: Number.parseFloat(data.price) || 0,
              discountedPrice: Number.parseFloat(data.discountedPrice) || 0,
              imageUrl: data.imageUrl || "",
              quantity: data.quantity || "0",
              category: data.category || "",
            })
          })

          if (products.length > 0) {
            categoryProductsMap[category] = products
          }
        }

        setCategoryProducts(categoryProductsMap)
      } catch (error) {
        console.error("Error fetching category products:", error)
      }
    }

    fetchCategoryProducts()
  }, [])

  const updateCart = async (updatedCart: Product[]) => {
      try {
        const auth = getAuth();
        const userId = auth.currentUser?.uid;
        if (!userId) {
          console.error('No user logged in');
          return;
        }
    
        setCart(updatedCart);
    
        const cartRef = doc(db, 'cart', userId);
        await setDoc(cartRef, { products: updatedCart }, { merge: true });
    
      } catch (error) {
        console.error('Error updating cart:', error);
      }
    };
  
    // Increment item quantity
    const incrementQuantity = (product: Product) => {
      const updatedCart = [...cart];
      const existingProductIndex = updatedCart.findIndex(item => item.id === product.id);
    
      if (existingProductIndex !== -1) {
        const currentQuantity = parseInt(updatedCart[existingProductIndex].quantity);
        
        if (currentQuantity < parseInt(product.quantity)) {
          updatedCart[existingProductIndex].quantity = (currentQuantity + 1).toString();
          updateCart(updatedCart);
        } else {
          toast.error(`${product.productName} is out of stock!`, {
            style: { backgroundColor: '', color: 'red' },
          });
        }
      } else {
        if (parseInt(product.quantity) > 0) {
          updatedCart.push({ ...product, quantity: '1' });
          updateCart(updatedCart);
        } else {
          toast.error(`${product.productName}  is out of stock!`,{
            style: { backgroundColor: '', color: 'red' },
          });
        }
      }
    };
  
    // Decrement item quantity
    const decrementQuantity = (product: Product) => {
      const updatedCart = [...cart];
      const existingProductIndex = updatedCart.findIndex(item => item.id === product.id);
    
      if (existingProductIndex !== -1) {
        const currentQuantity = parseInt(updatedCart[existingProductIndex].quantity);
        if (currentQuantity > 1) {
          updatedCart[existingProductIndex].quantity = (currentQuantity - 1).toString();
          updateCart(updatedCart);
        } else {
          updatedCart.splice(existingProductIndex, 1);
          updateCart(updatedCart);
        }
      }
    };
  
    // If user is not login then it  navigate to login and by clicking redirect to checkout 
    const addToCart = (product: Product) => {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
  
      if (!userId) {
        setActiveDialog('log-in');
        return;
      }
      const updatedCart = [...cart];
      const existingProductIndex = updatedCart.findIndex(item => item.id === product.id);
  
      if (existingProductIndex !== -1) {
        const currentQuantity = parseInt(updatedCart[existingProductIndex].quantity);
  
      if (currentQuantity < parseInt(product.quantity)) {
        updatedCart[existingProductIndex].quantity = (currentQuantity + 1).toString();
        updateCart(updatedCart);
        toast.success(`Added ${product.productName} to the cart!`, {
          style: { backgroundColor: '', color: 'green' },
        });
      } else {
        toast.error(`${product.productName} is out of stock!`, {
          style: { backgroundColor: '', color: 'red' },
        });
      }
    } else {
      if (parseInt(product.quantity) > 0) {
        updatedCart.push({ ...product, quantity: '1' });
        updateCart(updatedCart);
        toast.success(`Added ${product.productName} to the cart!`, {
          style: { backgroundColor: '', color: 'green' },
        });
      } else {
        toast.error(`${product.productName} is out of stock!`, {
          style: { backgroundColor: '', color: 'red' },
        });
      }
    }
    }

    // Fetch most seller products
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
  const filterMostSeller3 = featuredProducts
    .filter(product => mostSellerMap.has(product.id))
    .sort((a, b) => {
      const aQuantity = mostSellerMap.get(a.id) || 0;
      const bQuantity = mostSellerMap.get(b.id) || 0;
      return bQuantity - aQuantity;
    })

    const filterMostSeller = featuredProducts
    .filter(product => mostSellerMap.has(product.id))
    .sort((a, b) => {
      const aQuantity = mostSellerMap.get(a.id) || 0;
      const bQuantity = mostSellerMap.get(b.id) || 0;
      return bQuantity - aQuantity;
    })
    .slice(0, 3);

    const mostSellerIds3 = new Set(filterMostSeller3.map(p => p.id));
    const mostSellerIds = new Set(filterMostSeller.map(p => p.id));

  // On clicking, it will redirect to product details page
  const handleProductClick = (product: { productName: string; id: any; }) => {
    const formattedProductName = product.productName.replace(/\s+/g, '-');
    router.push(`/pd/${product.id}?${formattedProductName}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="h-16 w-16 border-4 border-gray-200 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      <Toaster />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Banner */}
        <section className="mt-4 sm:mt-8 mb-12">
          <div className="rounded-xl overflow-hidden shadow-lg">
            <Swiper
              modules={[Autoplay, Navigation, Pagination, Parallax]}
              spaceBetween={0}
              slidesPerView={1}
              loop={true}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              parallax
              className="w-full aspect-[19/7] sm:aspect-[16/6]"
            >
              <SwiperSlide>
                <div className="relative w-full h-full">
                  <Image
                    src={Protein}
                    alt="Protein & Sports Supplements"
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    onClick={() => router.push(`/categories/Protein%20&%20Sports%20Supplements`)}
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="relative w-full h-full">
                  <Image
                    src={Tea}
                    alt="Tea, Coffee & Health Drinks"
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    onClick={() => router.push(`/categories/Tea,%20Coffee%20&%20Health%20Drinks`)}
                  />
                </div>
              </SwiperSlide>
              <SwiperSlide>
                <div className="relative w-full h-full">
                  <Image
                    src={BabyCare}
                    alt="Baby Care"
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    onClick={() => router.push(`/categories/Baby%20Care`)}
                  />
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </section>

        {/* Product Categories */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Product Categories</h2>
            <button
              className="flex items-center text-sm text-green-700 font-medium hover:text-green-800 transition-colors cursor-pointer"
              onClick={() => router.push("/categories")}
            >
              View all
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <Swiper
            modules={[Autoplay, Navigation, Parallax]}
            spaceBetween={16}
            slidesPerView={2.5}
            breakpoints={{
              640: { slidesPerView: 3.5, spaceBetween: 20 },
              768: { slidesPerView: 4.5, spaceBetween: 24 },
              1024: { slidesPerView: 6, spaceBetween: 24 },
            }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            className="w-full"
          >
            {categories.map((category, index) => (
              <SwiperSlide key={index}>
                <div
                  className="flex flex-col items-center group cursor-pointer"
                  onClick={() => router.push(`/categories/${category.path.replace(/\s+/g, '-')}`)}
                >
                  <div className="relative w-full aspect-square mb-3 overflow-hidden group-hover:scale-105 rounded-full bg-white shadow-md transition-all duration-300 group-hover:shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 opacity-50"></div>
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-300"
                    />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 text-center line-clamp-2 group-hover:text-green-700">
                    {category.name}
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>

        {/* Featured Products Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Featured Products</h2>
            <button
              className="flex items-center text-sm text-green-700 font-medium hover:text-green-800 transition-colors cursor-pointer"
              onClick={() => router.push("/products")}
            >
              View all
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <Swiper
              modules={[Autoplay, Navigation, Parallax]}
              spaceBetween={16}
              slidesPerView={2.2}
              breakpoints={{
                640: { slidesPerView: 3, spaceBetween: 16 },
                768: { slidesPerView: 4, spaceBetween: 20 },
                1024: { slidesPerView: 5, spaceBetween: 24 },
              }}
              className="w-full"
            >

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filterMostSeller3.map((product, index) => {
              const isOutOfStock = Number.parseInt(product.quantity) === 0
              const productInCart = cart.find(item => item.id === product.id);
              const quantityInCart = productInCart ? parseInt(productInCart.quantity) : 0;
              const discountPercentage =
                product.price > product.discountedPrice
                  ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
                  : 0;
              const isMostSeller = mostSellerIds3.has(product.id);

              return (
                <SwiperSlide
                  key={product.id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg relative ${isOutOfStock ? 'bg-white opacity-50' : 'bg-white'}`}
                  onClick={() => handleProductClick(product)}
                >

                  {discountPercentage > 0 && (
                    <div className="absolute bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-br-md rounded-tl-md z-10">
                      {discountPercentage}% OFF
                    </div>
                  )}
                  
                  {index < 3 && (
                    <div className="absolute right-0 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-bl-md rounded-tr-md z-10">
                      Most seller
                    </div>
                  )}

                  <div className="relative w-full aspect-square bg-gray-50">
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white bg-black text-sm rounded-xl font-bold p-2">Out of Stock</span>
                      </div>
                    )}
                    <img
                      src={product.imageUrl}
                      alt={product.productName}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>

                  <div className="p-3">
                    <p className="text-xs text-green-700 font-medium line-clamp-1">{product.category}</p>
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 h-10">
                      {product.productName}
                    </h3>
                    <h3 className="text-sm text-gray-500 mb-2 line-clamp-1">
                      {product.description}
                    </h3>
                    <div className="flex justify-between items-center mt-2">
                      <div className="md:flex items-baseline gap-1">
                        {product.price > product.discountedPrice ? (
                          <>
                            <p className="text-sm font-bold">₹{product.discountedPrice}</p>
                            <p className="text-xs text-gray-500 line-through">₹{product.price}</p>
                          </>
                        ) : (
                          <p className="text-sm font-bold">₹{product.price}</p>
                        )}
                      </div>

                    {/* If the products is out of stock then ADD button will disappear */}
                    <div className="flex w-[80px] items-center gap-1 bg-green-700 rounded-md" onClick={(e) => e.stopPropagation()}>
                      {isOutOfStock ? (
                        <span className="px-3 py-5 bg-white w-full items-center"></span>
                      ) : (
                      quantityInCart > 0 ? (
                        <>
                          <button
                            onClick={() => decrementQuantity(product)}
                            className="px-3 py-2 text-white rounded-md"
                          >
                            -
                          </button>
                          <span className="text-white bg-green-700 text-md font-bold">{quantityInCart}</span>
                          <button
                            onClick={(e) => incrementQuantity(product)}
                            className="px-3 py-2 text-white rounded-md"
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => addToCart(product)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-700 rounded-md"
                        >
                          <svg viewBox="0 0 151.5 154.5" preserveAspectRatio="xMidYMid meet" 
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
                          </svg>
                          <span className="text-md font-bold">ADD</span>
                        </button>
                        )
                      )}
                    </div>
                    </div>
                  </div>
                </SwiperSlide>
                )
              })}
          </div>
          </Swiper>
        </section>

        {Object.entries(categoryProducts).map(([category, products]) => (
          <section key={category} className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{category}</h2>
              <button
                className="flex items-center text-sm text-green-700 font-medium hover:text-green-800 transition-colors cursor-pointer"
                onClick={() => router.push(`/categories/${category.replace(/\s+/g, "-")}`)}
              >
                View all
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            <Swiper
              modules={[Autoplay, Navigation, Parallax]}
              spaceBetween={16}
              slidesPerView={2.2}
              breakpoints={{
                640: { slidesPerView: 3, spaceBetween: 16 },
                768: { slidesPerView: 4, spaceBetween: 20 },
                1024: { slidesPerView: 5, spaceBetween: 24 },
              }}
              className="w-full"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {products.sort((a, b) => {

                  const mostSellerMap = new Map(mostSeller.map(ms => [ms.id, parseInt(ms.quantity)]));
                  const quantityA = mostSellerMap.get(a.id) || 0;
                  const quantityB = mostSellerMap.get(b.id) || 0;
                  return quantityB - quantityA; 
                })
              .map((product) => {
              const isOutOfStock = Number.parseInt(product.quantity) === 0
              const productInCart = cart.find(item => item.id === product.id);
              const quantityInCart = productInCart ? parseInt(productInCart.quantity) : 0;
              const discountPercentage =
                product.price > product.discountedPrice
                  ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
                  : 0
              const isMostSeller = mostSellerIds.has(product.id);

              return (
                <SwiperSlide
                  key={product.id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg relative ${isOutOfStock ? 'bg-white opacity-50' : 'bg-white'}`}
                  onClick={() => handleProductClick(product)}
                >
                  {discountPercentage > 0 && (
                    <div className="absolute bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-br-md rounded-tl-md z-10">
                      {discountPercentage}% OFF
                    </div>
                  )}

                  {isMostSeller && (
                    <div className="absolute right-0 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-bl-md rounded-tr-md z-10">
                      Most seller
                    </div>
                  )}

                  <div className="relative w-full aspect-square bg-gray-50">
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white bg-black text-sm rounded-xl font-bold p-2">Out of Stock</span>
                      </div>
                    )}
                    <img
                      src={product.imageUrl}
                      alt={product.productName}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>

                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 h-10">
                      {product.productName}
                    </h3>
                    <h3 className="text-sm text-gray-500 mb-2 line-clamp-1">
                      {product.description}
                    </h3>
                    <div className="flex justify-between items-center mt-2">
                      <div className="md:flex items-baseline gap-1">
                        {product.price > product.discountedPrice ? (
                          <>
                            <p className="text-sm font-bold">₹{product.discountedPrice}</p>
                            <p className="text-xs text-gray-500 line-through">₹{product.price}</p>
                          </>
                        ) : (
                          <p className="text-sm font-bold">₹{product.price}</p>
                        )}
                      </div>

                    {/* If the products is out of stock then ADD button will disappear */}
                    <div className="flex w-[80px] items-center gap-1 bg-green-700 rounded-md" onClick={(e) => e.stopPropagation()}>
                      {isOutOfStock ? (
                        <span className="px-3 py-5 bg-white w-full items-center"></span>
                      ) : (
                      quantityInCart > 0 ? (
                        <>
                          <button
                            onClick={() => decrementQuantity(product)}
                            className="px-3 py-2 text-white rounded-md"
                          >
                            -
                          </button>
                          <span className="text-white bg-green-700 text-md font-bold">{quantityInCart}</span>
                          <button
                            onClick={(e) => incrementQuantity(product)}
                            className="px-3 py-2 text-white rounded-md"
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => addToCart(product)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-700 rounded-md"
                        >
                          <svg viewBox="0 0 151.5 154.5" preserveAspectRatio="xMidYMid meet" 
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
                          </svg>
                          <span className="text-md font-bold">ADD</span>
                        </button>
                        )
                      )}
                    </div>
                    </div>
                  </div>
                </SwiperSlide>
                )
              })}
          </div>
            </Swiper>
          </section>
        ))}
      </div>
    </div>
  )
}

export default App;