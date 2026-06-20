"use client"
import PromoModal from "./PromoModal"

export default function PromoModalClient({ page = "home", delayMs = 0 }: { page?: string, delayMs?: number }) {
  return <PromoModal page={page} delayMs={delayMs} />
}


