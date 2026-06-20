"use client"

import Link from "next/link"
import Image from "next/image"
import { Home, ShoppingBag, Search, ArrowLeft, Package } from "lucide-react"
import { useState, useEffect } from "react"

export default function NotFound() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Animated 404 Text */}
        <div className="mb-8">
          <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 animate-pulse">
            404
          </h1>
          <div className="relative mt-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-2">
              Oops! Page Not Found
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              The page you&apos;re looking for seems to have wandered off. Don&apos;t worry, even our best products sometimes get misplaced!
            </p>
          </div>
        </div>

        {/* Illustration */}
        <div className="mb-8 relative">
          <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
            {/* Company Logo */}
            <div className="relative w-32 h-32 md:w-40 md:h-40">
              <Image
                src="/assets/images/logo.png"
                alt="Company Logo"
                fill
                className="object-contain filter drop-shadow-lg"
                priority
              />
            </div>
            
            {/* Floating question marks */}
            <div className="absolute top-0 left-8 text-3xl text-pink-400 animate-bounce delay-100">?</div>
            <div className="absolute top-4 right-8 text-2xl text-purple-400 animate-bounce delay-300">?</div>
            <div className="absolute top-8 left-4 text-xl text-pink-300 animate-bounce delay-500">?</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Link href="/">
            <button className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </Link>
          
          <Link href="/products">
            <button className="flex items-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg border border-gray-200">
              <ShoppingBag className="w-5 h-5" />
              Shop Products
            </button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <p className="text-gray-600 mb-4">Or explore these popular sections:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/about" className="text-pink-500 hover:text-pink-600 underline decoration-pink-200 hover:decoration-pink-400 transition-colors">
              About Us
            </Link>
            <Link href="/contact" className="text-pink-500 hover:text-pink-600 underline decoration-pink-200 hover:decoration-pink-400 transition-colors">
              Contact
            </Link>
            <Link href="/privacy-policy" className="text-pink-500 hover:text-pink-600 underline decoration-pink-200 hover:decoration-pink-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-pink-500 hover:text-pink-600 underline decoration-pink-200 hover:decoration-pink-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto">
          <p className="text-gray-600 mb-4">Looking for something specific?</p>
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full px-6 py-4 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 text-gray-700 shadow-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  window.location.href = `/products?search=${encodeURIComponent(e.target.value.trim())}`
                }
              }}
            />
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-pink-500 text-white p-2 rounded-full hover:bg-pink-600 transition-colors"
              onClick={(e) => {
                const input = e.target.closest("div").querySelector("input")
                if (input.value.trim()) {
                  window.location.href = `/products?search=${encodeURIComponent(input.value.trim())}`
                }
              }}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-pink-300 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-purple-300 rounded-full animate-pulse opacity-40 delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-3 h-3 bg-pink-400 rounded-full animate-pulse opacity-50 delay-500"></div>
        <div className="absolute bottom-40 right-10 w-5 h-5 bg-purple-400 rounded-full animate-pulse opacity-30 delay-700"></div>
      </div>
    </div>
  )
} 