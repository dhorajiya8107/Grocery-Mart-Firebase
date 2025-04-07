"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, type User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/app/src/firebase";
import Link from "next/link";
import LogInPage from "../auth/LogIn";
import SignUpPage from "../auth/SignUp";
import ChangePasswordPage from "../auth/ChangePassword";
import SubHeader from "../sub-header/page";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import Logo from "../../images/Logo.png";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import SearchBar from "../search-bar/page";
import AddAddressPage from "@/components/AddAddress";
import { useSearchParams } from 'next/navigation';

interface Product {
  id: string;
  productName: string;
  price: number;
  discountedPrice: number;
  imageUrl: string;
  quantity: number;
  description: string;
}

const Header = ({ user }: { user: User | null }) => {
  const [activeDialog, setActiveDialog] = useState<"sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null>(null);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [cart, setCart] = useState<Product[]>([]);
  const [cartQuantity, setCartQuantity] = useState<number>(0);
  const [cartAmount, setCartAmount] = useState<number>(0);
  const [role, setRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const pathname = usePathname();
  // const { useSearchParams } = require("next/navigation");
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [placeholderText, setPlaceholderText] = useState('Search by "Butter"');
  const placeholders = [
    'Search by "Vegetables & Fruits"',
    'Search by "Drinks"',
    'Search by "Sauces"',
    'Search by "Milk"',
    'Search by "Butter"'
  ];
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      const currentIndex = placeholders.indexOf(placeholderText);
      const nextIndex = (currentIndex + 1) % placeholders.length;
      setPlaceholderText(placeholders[nextIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, [placeholderText]);

  // Checking user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setRole(userSnap.data()?.role);
        }
      }
    }

    fetchUserRole()
  }, [user])

  // Calculating the totalItems and totalAmount
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setCart([]);
        setCartQuantity(0);
        setCartAmount(0);
        return
      }

      const cartRef = doc(db, "cart", user.uid);
      const unsubscribeCart = onSnapshot(cartRef, (cartSnap) => {
        if (cartSnap.exists()) {
          const data = cartSnap.data();
          if (Array.isArray(data.products)) {
            let totalQuantity = 0;
            let totalAmount = 0;

            const cartItems = data.products.map((product) => {
            const quantity = typeof product.quantity === "number" ? product.quantity : Number.parseInt(product.quantity) || 0;

            totalQuantity += quantity;
            totalAmount += product.discountedPrice * quantity;

              return {
                id: product.id || "",
                productName: product.productName || "",
                price: product.price || 0,
                discountedPrice: product.discountedPrice || 0,
                imageUrl: product.imageUrl || "",
                quantity,
                description: product.description || "",
              }
            })

            setCart(cartItems);
            setCartQuantity(totalQuantity);
            setCartAmount(totalAmount);
          }
        } else {
          setCart([]);
          setCartQuantity(0);
          setCartAmount(0);
        }
      })

      return () => unsubscribeCart()
    })

    return () => unsubscribeAuth()
  }, [])

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Logout Successfully!", user?.email);
      setMenuOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchTerm.trim() !== "") {
      router.push(`/search-bar?q=${encodeURIComponent(searchTerm.trim())}`);
    } else if (pathname === "/search-bar") {
      router.push("/");
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== debouncedSearchTerm) {
        setDebouncedSearchTerm(searchTerm)

        if (pathname === "/search-bar") {
          const currentPath = pathname
          const newSearchParams = new URLSearchParams(searchParams)

          if (searchTerm.trim() === "") {
            newSearchParams.delete("q")
          } else {
            newSearchParams.set("q", searchTerm.trim())
          }

          const newUrl = `${currentPath}?${newSearchParams.toString()}`
          window.history.replaceState(null, "", newUrl)

          if (searchInputRef.current) {
            searchInputRef.current.focus()
          }
        }
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, pathname])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    if (pathname === "/search-bar") {
      const currentPath = pathname
      const newSearchParams = new URLSearchParams(searchParams)

      if (value.trim() === "") {
        newSearchParams.delete("q")
      } else {
        newSearchParams.set("q", value.trim())
      }

      const newUrl = `${currentPath}?${newSearchParams.toString()}`
      window.history.replaceState(null, "", newUrl)
    }
  }

  const handleFocus = (e: React.FocusEvent) => {
    if (pathname !== "/search-bar") {
      router.push(`/search-bar${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ""}`)
    }
  }

  useEffect(() => {
    const query = searchParams.get("q")
    if (query) {
      setSearchTerm(query)
    }
    if (pathname !== `/search-bar` || !searchParams.get("q")) {
      setSearchTerm("")
    }
  }, [pathname, searchParams])

  const handleCartClick = () => {
    if (user) {
      router.push("/cart")
    } else {
      setActiveDialog("log-in")
      localStorage.setItem("redirectAfterLogin", "/cart")
    }
  }

  useEffect(() => {
    const redirectPath = localStorage.getItem("redirectAfterLogin")
    console.log("User:", user)
    console.log("Redirect Path:", redirectPath)

    if (user && redirectPath) {
      router.push(redirectPath)
      localStorage.removeItem("redirectAfterLogin")
    }
  }, [user])
  
  

  return (
    <>
      {menuOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-gray-700 shadow-2xl opacity-15 z-10"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
      <header className="border-b">
        <div className="relative flex flex-wrap justify-between items-center p-4 md:p-4 bg-white z-20">
          <div className="flex items-center cursor-pointer">
            <Link href={"/"} className="flex items-center">
              <div className="flex items-center">
                <Image
                  src={Logo || "/placeholder.svg"}
                  alt="Logo"
                  className="w-10 h-10 shadow-black/50 transition-transform duration-300"
                />
              </div>
              <h1 className="text-sm sm:text-sm md:text-lg font-bold text-gray-700 ml-1 mr-2 sm:ml-2">
                Gr<span className="text-green-700">ocer</span>y Mart
              </h1>
            </Link>
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full max-w-[600px] mt-2 md:mt-0 max-[1050px]:max-w-[500px] max-[926px]:max-w-[400px] max-[826px]:max-w-[300px] max-[687px]:max-w-[200px] hidden min-[554px]:block"
          >
            <div className="flex items-center px-3 py-1 shadow shadow-gray-300 text-black rounded-lg w-full">
              <Search className="w-6 h-6 text-gray-500" />
              <Input
                ref={searchInputRef}
                id="searchInput"
                type="text"
                placeholder={placeholderText}
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={handleFocus}
                className="w-full shadow-none bg-transparent placeholder-gray-500 border-none focus-visible:ring-0 focus:placeholder:opacity-0"
              />
            </div>
          </form>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            {user ? (
              <>
                <div className="relative">
                  <button
                    className="flex items-center text-sm md:text-lg px-2 py-1 sm:px-3 sm:py-2 rounded transition cursor-pointer"
                    onClick={() => setMenuOpen((prev) => !prev)}
                  >
                    <p className="mr-1 sm:mr-2">Account</p>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 ${
                        menuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <button
                  className="w-24 lg:w-30 text-lg rounded-lg transition cursor-pointer flex items-center bg-green-700"
                  onClick={() => router.push("/cart")}
                >
                  <svg
                    viewBox="0 0 151.5 154.5"
                    preserveAspectRatio="xMidYMid meet"
                    className="max-w-[40px] h-[40px] lg:max-w-[50px] lg:h-[50px] flex-shrink-0"
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
                  {cartQuantity === 0 ? (
                    <span className="text-base mt-1 text-white mr-2 font-bold text-center mb-2 text-[13px] lg:text-[14.7px]">
                      My Cart
                    </span>
                  ) : (
                    <span className="text-base mt-1 text-white mr-2 font-bold text-center text-[12px] lg:text-[14.7px]">
                      {cartQuantity} items ₹{cartAmount}
                    </span>
                  )}
                </button>
                {menuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-full bg-white text-black shadow-xl rounded-2xl rounded-tl-none rounded-tr-none p-4 w-64 z-30"
                  >
                    <p className="font-bold ">My Account</p>
                    <p className="text-sm text-gray-500 mr-2">{user?.email}</p>
                    <button
                      className="w-full text-sm text-left py-2 px-4 hover:bg-gray-100 rounded-md mb-2"
                      onClick={() => {
                        router.push("/orders")
                        setMenuOpen(false)
                      }}
                    >
                      My Orders
                    </button>
                    <button className="w-full text-sm text-left py-2 px-4 hover:bg-gray-100 rounded-md mb-2"
                      onClick={() => {
                        setActiveDialog("address");
                        setMenuOpen(false);
                      }}
                    >
                      Address
                    </button>
                    {role === "admin" && (
                      <>
                        <button
                          className="w-full text-sm text-left py-2 px-4 hover:bg-gray-100 rounded-md mb-2"
                          onClick={() => {
                            router.push("/add-product")
                            setMenuOpen(false)
                          }}
                        >
                          Add Product
                        </button>
                        <button
                          className="w-full text-sm text-left py-2 px-4 hover:bg-gray-100 rounded-md mb-2"
                          onClick={() => {
                            router.push("/add-categories")
                            setMenuOpen(false)
                          }}
                        >
                          Add Categories
                        </button>
                        <button
                          className="w-full text-sm text-left py-2 px-4 hover:bg-gray-100 rounded-md mb-2"
                          onClick={() => {
                            router.push("/order-status")
                            setMenuOpen(false)
                          }}
                        >
                          Order Status
                        </button>
                        <button
                          className="w-full text-sm text-left py-2 px-4 hover:bg-gray-100 rounded-md mb-2"
                          onClick={() => {
                            router.push("/change-role")
                            setMenuOpen(false)
                          }}
                        >
                          Change Role
                        </button>
                      </>
                    )}
                    <button
                      className="w-full text-sm text-left py-2 px-4 hover:bg-gray-100 rounded-md mb-2"
                      onClick={() => {
                        setActiveDialog("change-password")
                        setMenuOpen(false)
                      }}
                    >
                      Change Password
                    </button>
                    <button
                      className="w-full text-sm text-left py-2 px-4 bg-orange-500 text-white hover:bg-orange-600 rounded-md mb-2"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex space-x-4 justify-center mt-4 items-center">
                <a className="text-gray-500 text-sm cursor-pointer" onClick={() => setActiveDialog("log-in")}>
                  LOG IN
                </a>
                <a className="text-gray-500 text-sm cursor-pointer" onClick={() => setActiveDialog("sign-up")}>
                  SIGN UP
                </a>
                <button
                  className="w-12 items-center justify-center flex rounded-lg cursor-pointer bg-green-700"
                  onClick={handleCartClick}
                >
        <svg
          viewBox="0 0 151.5 154.5"
          preserveAspectRatio="xMidYMid meet"
          className="max-w-[40px] h-[40px] lg:max-w-[50px] lg:h-[50px] flex-shrink-0"
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
      </button>
              </div>
            )}
          </div>
        </div>

        <div className="block min-[554px]:hidden pb-4 px-4">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex items-center px-3 py-1 shadow shadow-gray-300 text-black rounded-lg w-full">
              <Search className="w-6 h-6 text-gray-500" />
              <Input
                ref={searchInputRef}
                id="searchInput"
                type="text"
                placeholder={placeholderText}
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={handleFocus}
                className="w-full shadow-none bg-transparent placeholder-gray-500 border-none focus-visible:ring-0 focus:placeholder:opacity-0"
              />
            </div>
          </form>
        </div>
      </header>
      {pathname !== "/search-bar" && pathname !== "/checkout" && <SubHeader />}
      {activeDialog === "sign-up" && <SignUpPage activeDialog={activeDialog} setActiveDialog={setActiveDialog} />}
      {activeDialog === "log-in" && <LogInPage activeDialog={activeDialog} setActiveDialog={setActiveDialog} />}
      {activeDialog === "address" && <AddAddressPage activeDialog={activeDialog} setActiveDialog={setActiveDialog} />}
      {activeDialog === "change-password" && (<ChangePasswordPage activeDialog={activeDialog} setActiveDialog={setActiveDialog} />)}
      {pathname == "/search-bar" && <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />}
    </>
  )
}

export default Header;