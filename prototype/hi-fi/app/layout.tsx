import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { LangProvider } from "@/components/lang-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Ajora — Automatiseer je marketing",
  description: "Beschrijf wat je wilt automatiseren in gewone taal. Ajora bouwt het stap voor stap.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background font-sans">
        <LangProvider>
          {children}
        </LangProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
