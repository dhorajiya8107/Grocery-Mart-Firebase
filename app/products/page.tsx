'use client';

import { useRouter } from 'next/navigation';
import { collection, doc, getDocs, query, setDoc, getDoc, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/app/src/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LogInPage from '@/app/auth/LogIn';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Image from 'next/image';
import tr from "../../images/Grocery/Aashirvaad Shudh Chakki Atta/0.jpg";
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
  
const Products = () => {
  const [cart, setCart] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDialog, setActiveDialog] = useState<"sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const [mostSeller, setMostSeller] = useState<MostSeller[]>([]);

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
      } as Product;
    })
    
    setProducts(productList);
    setLoading(false);
  }, (error) => {
    console.error("Error fetching real-time products:", error);
    setLoading(false);
  });
    
  return () => unsubscribe();
  }, []);

  // Filtered products by searching
  const filteredProducts = products.filter(
    (product) =>
      product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())  ||
      product.discountedPrice?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  // useEffect(() => {
  //   if (cart.length > 0) {
  //     localStorage.setItem('cart', JSON.stringify(cart));
  //   }
  // }, [cart]);

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
      toast.error(`${product.productName} is out of stock!`, {
        style: { backgroundColor: '', color: 'red' },
      });
    }
  }
  };

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
const filterMostSeller = products
  .filter(product => mostSellerMap.has(product.id))
  .sort((a, b) => {
    const aQuantity = mostSellerMap.get(a.id) || 0;
    const bQuantity = mostSellerMap.get(b.id) || 0;
    return bQuantity - aQuantity;
  })
  .slice(0, 3);

const mostSellerIds = new Set(filterMostSeller.map(p => p.id));

  // On clicking, it will redirect to product details page
  const handleProductClick = (product: { productName: string; id: any; }) => {
    const formattedProductName = product.productName.replace(/\s+/g, '-');
    router.push(`/product-details/${product.id}?${formattedProductName}`);
  };

  const getAllProductImages = (productName: string) => {
    const images = [];
    const extensions = ['jpg', 'png', 'jpeg'];
    try {
      for (const ext of extensions) {
        try {
          const image = require(`../../images/Grocery/${productName}/0.${ext}`);
          images.push(image);
        } catch {}
      }
    } catch {}
    
    return images.length > 0 ? images : [tr];
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!products.length) {
    return <p className="text-center pt-2">No products found.</p>;
  }

  return (
    <>
    <Toaster className='text-green-500'/>
    <div className='flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen pb-20'>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-xl font-bold pl-10 mb-3 capitalize justify-start items-center flex bg-white w-full h-12">Featured Products</h1>
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Search by products name or description or price..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-300 pl-10 py-3 rounded-lg focus:outline-none focus:ring-2 transition"
          />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {products && filteredProducts.map((product) => {
          const productInCart = cart.find(item => item.id === product.id);
          const quantityInCart = productInCart ? parseInt(productInCart.quantity) : 0;
          const isOutOfStock = parseInt(product.quantity) === 0;
          const discountPercentage = product.price > product.discountedPrice
            ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
            : 0
          const isMostSeller = mostSellerIds.has(product.id);
          const images = getAllProductImages(product.productName);

          return (
            <div key={product.id} className='pt-2' onClick={() => handleProductClick(product)}>
              <div className={`card shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden
                ${isOutOfStock ? 'bg-white opacity-50' : 'bg-white'} relative`}>

              {/* If products is out of stock then this will display */}
              <div>
              </div>
              <div className="relative">
                {discountPercentage > 0 && (
                  <span className="absolute bg-emerald-100 text-emerald-700 text-xs font-bold py-1 px-2 rounded-br-md rounded-tl-md">
                    {discountPercentage}% OFF
                  </span>
                )}
                {isMostSeller && (
                    <div className="absolute right-0 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-bl-md rounded-tr-md">
                      Most seller
                    </div>
                  )}
                {isOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white bg-black text-sm rounded-xl font-bold p-2">Out of Stock</span>
                   </div>
                )}
                <img
                  src={product.imageUrl}
                  alt={product.productName}
                  className="w-full h-full object-cover p-2"
                />
                {/* <Image 
                  src={images[0]}
                  alt={product.productName} 
                  className="w-full h-full object-cover p-2"
                /> */}
                <p className='border-b border-gray-200 mt-3 mr-3 ml-3'></p>
              </div>
              <div className="p-3">
                    <p className="text-xs text-emerald-700 font-medium line-clamp-1">{product.category}</p>
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
            </div>
            </div>
          );
        })}
        </div>
        {filteredProducts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-xl font-medium text-gray-700 mb-2">No products found</div>
            <p className="text-gray-500">We couldn't find any products matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>

    {/* If user is not login then it navigate to login */}
    {activeDialog === 'log-in' && (
      <LogInPage
        activeDialog={activeDialog}
        setActiveDialog={setActiveDialog}
      />
    )}
    </>
  );
};

export default Products;
