"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

// Reusable marketing popup modal
// Fetches dynamic content from backend and controls show frequency via localStorage
// Props:
// - page: string identifier of the page rendering this modal (e.g. "home")
// - endpoint: optional API endpoint to fetch config from (default: /api/promo-popup)
// Expected API response shape (flexible; unknown fields ignored):
// {
//   id: number|string,
//   enabled: boolean,
//   title: string,
//   message: string,
//   cta_label: string,
//   cta_url: string,
//   image: string | null,
//   theme: { bg?: string, titleColor?: string, textColor?: string, ctaBg?: string, ctaText?: string },
//   target_pages: string[] | 'all',
//   frequency: 'always' | 'once' | 'daily'
// }
export default function PromoModal({ page = "home", endpoint = "/api/promo-popup", delayMs = 0 }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState(null)

  // Helpers for frequency control
  const shouldShow = (cfg) => {
    if (!cfg?.enabled) return false
    // Page targeting
    if (Array.isArray(cfg?.target_pages) && cfg.target_pages.length > 0) {
      if (!cfg.target_pages.includes(page)) return false
    }
    const id = String(cfg?.id ?? "default")
    const key = `promoPopup_${id}`
    const freq = cfg?.frequency || "once"
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    if (!raw) return true
    try {
      const { lastShown } = JSON.parse(raw)
      if (!lastShown) return true
      if (freq === "always") return true
      if (freq === "once") return false
      if (freq === "daily") {
        const last = new Date(lastShown)
        const now = new Date()
        return now.toDateString() !== last.toDateString()
      }
      return false
    } catch {
      return true
    }
  }

  const markShown = (cfg) => {
    if (!cfg) return
    const id = String(cfg?.id ?? "default")
    const key = `promoPopup_${id}`
    try {
      localStorage.setItem(key, JSON.stringify({ lastShown: new Date().toISOString() }))
    } catch {}
  }

  useEffect(() => {
    let cancelled = false
    let timerId = null
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${endpoint}?page=${encodeURIComponent(page)}`)
        if (!res.ok) { setLoading(false); return }
        const data = await res.json().catch(() => null)
        if (cancelled) return
        setConfig(data || null)
        const display = shouldShow(data || null)
        if (display) {
          const show = () => {
            if (cancelled) return
            setOpen(true)
            markShown(data || null)
          }
          if (delayMs && delayMs > 0) {
            timerId = setTimeout(show, delayMs)
          } else {
            show()
          }
        }
      } catch {
        // fail silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchConfig()
    return () => { cancelled = true; if (timerId) clearTimeout(timerId) }
  }, [page, endpoint, delayMs])

  if (loading || !open || !config) return null

  const title = config?.title || "DISCOUNT SALE"
  const message = config?.message || "By taking maxi at offer price ₹799 FREE SHIPPING!"
  const ctaLabel = config?.cta_label || "SHOP NOW"
  const ctaUrl = config?.cta_url || "/"
  const theme = config?.theme || {}

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-md shadow-xl w-full max-w-md overflow-hidden">
        {/* Close */}
        <button
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute right-2 top-2 h-8 w-8 inline-flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          ×
        </button>

        {/* Optional Image */}
        {config?.image && (
          <div className="relative w-full h-40">
            <Image src={config.image} alt={title} fill className="object-cover" />
          </div>
        )}

        <div className="p-6 text-center">
          <h2
            className="text-2xl font-extrabold tracking-wide mb-3"
            style={{ color: theme.titleColor || "#166534" }}
          >
            {title}
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: theme.textColor || "#111827" }}>
            {message}
          </p>
          <Link
            href={ctaUrl}
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center px-6 py-3 rounded-md font-semibold"
            style={{
              backgroundColor: theme.ctaBg || "#1d4ed8",
              color: theme.ctaText || "#ffffff"
            }}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}


