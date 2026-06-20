"use client"
import { IconBrandWhatsapp } from "@tabler/icons-react"
import Link from "next/link"

export function WhatsAppFloat() {
  // Using the provided WhatsApp number
  const whatsappNumber = "919384109680" // Formatted for WhatsApp API (removed spaces and added country code)
  const whatsappLink = `https://wa.me/${whatsappNumber}`

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Wave Animation Rings */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
        <div className="absolute inset-0 scale-125 rounded-full bg-green-500/10 animate-pulse" />
        <div className="absolute inset-0 scale-150 rounded-full bg-green-500/5 animate-pulse delay-75" />
      
        {/* WhatsApp Button */}
        <Link
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-full shadow-lg hover:bg-green-600 transition-colors group"
        >
          <IconBrandWhatsapp className="w-9 h-9 text-white transform group-hover:scale-110 transition-transform" />
          
          {/* Tooltip */}
          {/* <span className="absolute right-full mr-3 px-2 py-1 bg-black/75 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Chat with us
          </span> */}
        </Link>
      </div>
    </div>
  )
}