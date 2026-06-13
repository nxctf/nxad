import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NXAD",
  description: "NX Attack And Defense competition platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-[#0b0f19] text-gray-100 selection:bg-emerald-500/20 selection:text-emerald-400 relative overflow-x-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {/* Tech Scanlines and Radial Glowing Mesh Orbs */}
          <div className="fixed inset-0 pointer-events-none z-0 bg-ctfd opacity-[0.25]" />
          <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.07),transparent_55%)]" />
          <div className="fixed inset-x-0 top-0 h-96 pointer-events-none z-0 bg-emerald-500/[0.015] blur-3xl" />
          <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.03),transparent_40%)]" />
          
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1 flex flex-col w-full">
              {children}
            </div>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
