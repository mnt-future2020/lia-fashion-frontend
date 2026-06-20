"use client"
import Link from "next/link"
import Image from "next/image"
import { Phone, Mail, MapPin, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import axios from '../../../lib/axios';

export default function Footer() {
  const [company, setCompany] = useState(null)
  const currentYear = new Date().getFullYear()
  
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await axios.get("/api/company")
        setCompany(res.data)
      } catch (e) {
        setCompany(null)
      }
    }
    fetchCompany()
  }, [])

  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo and Description Section */}
          <div className="space-y-4 max-w-sm">
            <Link href="/" className="inline-block">
              <Image
                src="/assets/images/logo.png"
                alt="Lia Fashions"
                width={80}
                height={80}
                className="h-16 md:h-20 w-auto"
              />
            </Link>
            <p className="text-sm md:text-base text-gray-400">
              we believe style is personal and timeless. Every design you see is a
              reflection of love for craftsmanship, detail, and individuality.
            </p>
            <p className="text-sm md:text-base text-gray-400">
              Thank you for walking this journey with us — one graceful step at a
              time.
            </p>
          </div>

          {/* Useful Links Section */}
          <div className="space-y-4">
            <h3 className="text-white text-lg md:text-xl font-medium border-b border-gray-700 pb-2">
              Useful links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="flex items-center text-gray-400 hover:text-gray-300"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="flex items-center text-gray-400 hover:text-gray-300"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  <span>About us</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="flex items-center text-gray-400 hover:text-gray-300"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  <span>Contact</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/reviews"
                  className="flex items-center text-gray-400 hover:text-gray-300"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  <span>Reviews</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Terms and Policy Section */}
          <div className="space-y-4">
            <h3 className="text-white text-lg md:text-xl font-medium border-b border-gray-700 pb-2">
              Terms And Policies
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/shipping-policy"
                  className="flex items-center text-gray-400 hover:text-gray-300"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  <span>Shipping policy</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="flex items-center text-gray-400 hover:text-gray-300"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  <span>Refund Policy</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="flex items-center text-gray-400 hover:text-gray-300"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="flex items-center text-gray-400 hover:text-gray-300"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info Section */}
          <div className="space-y-6">
            <h3 className="text-white text-lg md:text-xl font-medium border-b border-gray-700 pb-2">
              Contact Info
            </h3>
            <div className="flex flex-col space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-500/10 shrink-0">
                  <Phone className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm uppercase tracking-wide">
                    TEL:
                  </p>
                  <p className="text-gray-400 break-words">{company?.mobile_no || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-500/10 shrink-0">
                  <Mail className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm uppercase tracking-wide">
                    EMAIL:
                  </p>
                  <p className="text-gray-400 break-words">{company?.email || "-"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-500/10 shrink-0">
                  <MapPin className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm uppercase tracking-wide">
                    LOCATION:
                  </p>
                  <p className="text-gray-400 break-words">{company ? `${company.district || ''}${company.district && company.state ? ', ' : ''}${company.state || ''}` : "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="bg-gray-900 py-4 px-4 text-center text-xs sm:text-sm text-gray-400 mt-8">
        <p className="container mx-auto">
          © {currentYear}{" "}
          <Link 
            href="https://www.mntfuture.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-pink-400 hover:text-pink-300 transition-colors"
          >
            MnT
          </Link>
          . All Rights Reserved.
        </p>
      </div>
    </footer>
  )
}