"use client"

import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Send, Twitter } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useState } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "../src/firebase"
import Image from "next/image"
import Logo from "../../images/Logo.png"

interface Category {
  id: string
  name: string
  order: number
}

const Footer = () => {
  const router = useRouter()
  const [year, setYear] = useState("")
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const collectionRef = collection(db, "categories")
    const q = query(collectionRef, orderBy("order"))

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const categoryList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        order: doc.data().order || 0,
      }))
      setCategories(categoryList)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    setYear(new Date().getFullYear().toString())
  }, [])

  return (
    <footer className="bg-gradient-to-b text-gray-600 border-t">
      {/* Main Footer Content */}
      <div className="container mx-auto py-10 px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <Link href={'/'} className="flex items-center">
                  <div className="flex items-center">
                    <Image
                      src={Logo}
                      alt="Logo"
                      className="w-10 h-10 shadow-black/50 transition-transform duration-300"
                    />
                  </div>
                </Link>
              </div>
              <h2 className="text-xl font-bold ml-1">Gr<span className="text-green-700">ocer</span>y Mart</h2>
            </div>
            {/* <p className="text-sm text-gray-500 mt-4">
              Your one-stop destination for fresh produce, pantry essentials, and specialty foods. We're committed to
              quality and sustainability.
            </p> */}
            {/* <div className="flex items-center space-x-2 mt-4">
              <Link
                href="https://www.facebook.com"
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-green-100 transition-colors duration-300"
              >
                <Facebook className="h-4 w-4" />
              </Link>
              <Link
                href="https://www.instagram.com"
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-green-100 transition-colors duration-300"
              >
                <Instagram className="h-4 w-4" />
              </Link>
              <Link
                href="mailto:info@grocerymart.com"
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-green-100 transition-colors duration-300"
              >
                <Mail className="h-4 w-4" />
              </Link>
            </div> */}
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b pb-2 text-green-700">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about-us"
                  className="text-sm hover:text-green-700 transition-colors duration-300 flex items-center gap-2"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm hover:text-green-700 transition-colors duration-300 flex items-center gap-2"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm hover:text-green-700 transition-colors duration-300 flex items-center gap-2"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/faqs"
                  className="text-sm hover:text-green-700 transition-colors duration-300 flex items-center gap-2"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/contact-us"
                  className="text-sm hover:text-green-700 transition-colors duration-300 flex items-center gap-2"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b pb-2 text-green-700">Categories</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.name.replace(/\s+/g, '-')}`}
                  className="text-sm hover:text-green-700 transition-colors duration-300 flex items-center gap-2"
                >
                  {category.name}
                </Link>
              ))}
              {categories.length > 8 && (
                <Link href="/categories" className="text-sm hover:text-green-700 font-medium hover:underline">
                  View all →
                </Link>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b pb-2 text-green-700">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                <span className="text-sm">India</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-green-700 flex-shrink-0" />
                <Link href="tel:+919876543210" className="text-sm">+91 9876543210</Link>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-green-700 flex-shrink-0" />
                <Link href="mailto:support@grocerymart.com" className="text-sm">support@grocerymart.com</Link>
              </li>
            </ul>
            <div className="pt-4">
              <p className="text-xs text-gray-500">Business Hours: Mon-Sat 8AM-9PM, Sun 9AM-6PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-gray-50 border-t">
        <div className="container mx-auto py-6 px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 text-center md:text-left">
              &copy; {year} Grocery Mart. All rights reserved. "Grocery Mart" is owned & managed by "Grocery Mart
              Commerce Private Limited".
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="https://www.facebook.com"
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-green-100 transition-colors duration-300"
              >
                <Facebook className="h-4 w-4" />
              </Link>
              <Link
                href="https://x.com"
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-green-100 transition-colors duration-300"
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                href="https://www.instagram.com"
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-green-100 transition-colors duration-300"
              >
                <Instagram className="h-4 w-4" />
              </Link>
              <Link
                href=""
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-green-100 transition-colors duration-300"
              >
                <Linkedin className="h-4 w-4" />
              </Link>
              <Link
                href="mailto:info@grocerymart.com"
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-green-100 transition-colors duration-300"
              >
                <Mail className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
