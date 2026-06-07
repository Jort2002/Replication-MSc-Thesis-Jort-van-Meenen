"use client"
import { SERVICES, ServiceId } from "@/lib/scenarios"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface ServiceIconProps {
  serviceId: ServiceId
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

// Simple Icons CDN slug for each service (https://simpleicons.org)
const ICON_SLUG: Partial<Record<ServiceId, string>> = {
  typeform:         "typeform",
  google_forms:     "googleforms",
  tally:            "tally",
  google_sheets:    "googlesheets",
  slack:            "slack",
  gmail:            "gmail",
  mailchimp:        "mailchimp",
  klaviyo:          "klaviyo",
  notion:           "notion",
  google_analytics: "googleanalytics",
  meta_ads:         "meta",
  google_ads:       "googleads",
  linkedin_ads:     "linkedin",
  eventbrite:       "eventbrite",
  zoom:             "zoom",
  luma:             "luma",
  google_calendar:  "googlecalendar",
  hubspot:          "hubspot",
  rss:              "rss",
  twitter:          "x",
  instagram:        "instagram",
}

// Fallback letters for services not on Simple Icons
const FALLBACK_LETTERS: Record<ServiceId, string> = {
  typeform: "Tf", google_forms: "GF", tally: "Ta", google_sheets: "GS",
  slack: "Sl", gmail: "Gm", mailchimp: "Mc", klaviyo: "Kl", notion: "No",
  google_analytics: "GA", meta_ads: "Ma", google_ads: "GA", linkedin_ads: "Li",
  eventbrite: "Ev", zoom: "Zo", luma: "Lu", google_calendar: "GC",
  hubspot: "Hs", rss: "RS", twitter: "X", instagram: "Ig", mention_app: "Mn",
}

const sizeClasses = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-xs",
  lg: "w-11 h-11 text-sm",
}

const imgSizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
}

// Services where the brand color is too light for white icons — use dark icon instead
const USE_DARK_ICON: Set<ServiceId> = new Set(["mailchimp"])

export function ServiceIcon({ serviceId, size = "md", showLabel, className }: ServiceIconProps) {
  const service = SERVICES[serviceId]
  const letters = FALLBACK_LETTERS[serviceId] ?? "?"
  const slug = ICON_SLUG[serviceId]
  const [imgError, setImgError] = useState(false)

  const bgColor = service.color === "#000000" ? "#1a1a2e" : service.color
  const iconColor = USE_DARK_ICON.has(serviceId) ? "1a1a2e" : "ffffff"
  const showLogo = slug && !imgError

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "rounded-xl flex items-center justify-center shadow-sm font-bold text-white flex-shrink-0",
          sizeClasses[size]
        )}
        style={{ backgroundColor: bgColor }}
        title={service.name}
      >
        {showLogo ? (
          <img
            src={`https://cdn.simpleicons.org/${slug}/${iconColor}`}
            alt={service.name}
            className={cn(imgSizeClasses[size], "object-contain")}
            onError={() => setImgError(true)}
          />
        ) : (
          letters
        )}
      </div>
      {showLabel && (
        <span className="text-[10px] text-muted-foreground leading-tight text-center max-w-[56px] truncate">
          {service.name}
        </span>
      )}
    </div>
  )
}
