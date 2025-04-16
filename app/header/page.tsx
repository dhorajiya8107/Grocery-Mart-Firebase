"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, User, onAuthStateChanged } from "firebase/auth";
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
import { ChevronDown, KeyRound, LogOut, MapPin, Package, Plus, Search, Settings, ShoppingCart, UserIcon } from "lucide-react";
import SearchBar from "../search-bar/page";
import AddAddressPage from "@/components/AddAddress";
import ForgotPasswordPage from "../auth/ForgetPassword";


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
  const [preFilledEmail, setPreFilledEmail] = useState('');

  const { useSearchParams } = require('next/navigation');
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
  const [isScrolled, setIsScrolled] = useState(false)
  const [loginEmail, setLoginEmail] = useState("");

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
    // console.log("User:", user)
    // console.log("Redirect Path:", redirectPath)

    if (user && redirectPath) {
      router.push(redirectPath)
      localStorage.removeItem("redirectAfterLogin")
    }
  }, [user])
  
  

  return (
    <>
      {menuOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black/30 backdrop-blur-xs z-10"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
      <header className={`sticky top-0 z-40 w-full border-b bg-white transition-shadow duration-300 ${isScrolled ? "shadow-md" : ""}`}>
        <div className="relative flex flex-wrap justify-between items-center p-4 md:p-6 z-20">
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
            className="w-full max-w-[600px] mt-2 md:mt-0 max-[1084px]:max-w-[500px] max-[1050px]:max-w-[400px] max-[926px]:max-w-[350px] max-[826px]:max-w-[300px] max-[778px]:max-w-[250px] max-[679px]:max-w-[200px] hidden min-[600px]:block"
          >
            <div className="flex items-center px-3 bg-gray-50 py-1 shadow shadow-gray-300 text-black rounded-full w-full">
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
                <div className="relative text-gray-500">
                  <button
                    className="flex items-center text-md px-2 py-1 sm:px-3 sm:py-2 rounded-full hover:bg-gray-100 transition cursor-pointer"
                    onClick={() => setMenuOpen((prev) => !prev)}
                  >
                    <UserIcon className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="hidden sm:inline text-gray-700 font-medium">Account</span>
                    <ChevronDown className={`w-4 h-4 ml-1 text-gray-500 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>
                <button
                  className="text-lg rounded-lg gap-2 px-4 py-2 transition-colors duration-300 text-white cursor-pointer flex justify-center items-center bg-green-700"
                  onClick={() => router.push("/cart")}
                >
                  <ShoppingCart className="w-5 h-5"/>
                  {cartQuantity === 0 ? (
                    <span className="text-base mt-1 text-white mr-2 font-bold text-center mb-2 text-[13px] lg:text-[14.7px]">
                      My Cart
                    </span>
                  ) : (
                    <span className="text-base mt-1 text-white mr-2 font-bold text-center mb-2 text-[13px] lg:text-[14.7px]">
                      {cartQuantity} items
                    </span>
                  )}
                </button>

                {menuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute right-1 top-full -mt-1 bg-white text-gray-700 rounded-bl-xl rounded-br-2xl p-2 w-64 z-50">
                    <div className="p-3 border-b-2 border-gray-100 mb-1">
                      <p className="font-bold ">My Account</p>
                      <p className="text-sm text-gray-500 mr-2">{user?.email}</p>
                    </div>
                    <div className="py-1">
                    {(role === "admin" || role === "user") && (
                      <div className="border-b-2 border-gray-100">
                        <button
                          className="w-full flex items-center gap-2 text-sm text-left py-2 px-4 hover:bg-gray-100 rounded-md mb-2"
                          onClick={() => {
                            router.push("/orders")
                            setMenuOpen(false)
                          }}
                        >
                          <Package className="w-4 h-4 text-gray-500" /> My Orders
                        </button>
                        <button className="w-full flex items-center gap-2 text-sm text-left py-2 px-4 hover:bg-gray-100 rounded-md mb-2"
                          onClick={() => {
                            setActiveDialog("address");
                            setMenuOpen(false);
                          }}
                        >
                          <MapPin className="w-4 h-4 text-gray-500" /> Address
                        </button>
                      </div>
                    )}
                    {role === "admin" && (
                      <div className="border-gray-100 my-1 pt-1 border-b-2">
                        <p className="px-3 py-1 text-xs font-medium text-gray-500">Admin Controls</p>
                        <button
                          className="w-full text-sm text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 rounded-md mb-2"
                          onClick={() => {
                            router.push("/add-product")
                            setMenuOpen(false)
                          }}
                        >
                          <Plus className="w-4 h-4 text-gray-500" /> Add Product
                        </button>
                        <button
                          className="w-full text-sm text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 rounded-md mb-2"
                          onClick={() => {
                            router.push("/add-categories")
                            setMenuOpen(false)
                          }}
                        >
                          <Plus className="w-4 h-4 text-gray-500" /> Add Categories
                        </button>
                        <button
                          className="w-full text-sm text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 rounded-md mb-2"
                          onClick={() => {
                            router.push("/order-status")
                            setMenuOpen(false)
                          }}
                        >
                          <Settings className="w-4 h-4 text-gray-500" /> Order Status
                        </button>
                        <button
                          className="w-full text-sm text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 rounded-md mb-2"
                          onClick={() => {
                            router.push("/change-role")
                            setMenuOpen(false)
                          }}
                        >
                          <Settings className="w-4 h-4 text-gray-500" /> Change Role
                        </button>
                      </div>
                    )}
                    <div>
                    {(role === "admin" || role ===  "user") && (
                    <div className="">
                      <button
                        className="w-full text-sm text-left py-2 px-4 flex items-center gap-2 hover:bg-gray-100 rounded-md mb-2"
                        onClick={() => {
                          setActiveDialog("change-password")
                          setMenuOpen(false)
                        }}
                      >
                      <KeyRound className="w-4 h-4 text-gray-500" /> Change Password
                    </button>
                    </div>
                    )}
                    <button
                      className="w-full text-sm text-left py-2 px-4 flex items-center gap-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-md mb-2"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 text-red-500" /> Logout
                    </button>
                    </div>
                    </div>
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
                  className="w-12 px-4 py-2 items-center justify-center flex rounded-lg cursor-pointer bg-green-700"
                  onClick={handleCartClick}
                >
                  <ShoppingCart className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="block min-[600px]:hidden pb-4 px-4">
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
      {pathname !== "/search-bar" && pathname !== "/checkout" && pathname !== "/" && <SubHeader />}
      {activeDialog === "sign-up" && <SignUpPage activeDialog={activeDialog} setActiveDialog={setActiveDialog} />}
      {activeDialog === "log-in" && <LogInPage activeDialog={activeDialog} setActiveDialog={setActiveDialog} />}
      {activeDialog === "address" && <AddAddressPage activeDialog={activeDialog} setActiveDialog={setActiveDialog} />}
      {activeDialog === "change-password" && (<ChangePasswordPage activeDialog={activeDialog} setActiveDialog={setActiveDialog} />)}
      {pathname == "/search-bar" && <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />}
      {activeDialog === "forget-password" && ( <ForgotPasswordPage activeDialog={activeDialog} setActiveDialog={setActiveDialog} 
      preFilledEmail={loginEmail}/>)}

    </>
  )
}

export default Header;