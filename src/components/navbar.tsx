"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, LogOut, Shield, User, Trophy, Home, Layers, Users, Flag, Clock, Sliders, MessageSquare, Settings, X, Rocket, ChevronDown } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"

export default function Navbar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<"guest" | "team" | "admin">("guest")
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift()
    return null
  }

  const checkAuth = async () => {
    // 1. Try checking cookies first
    const teamCookie = getCookie("team")
    const adminCookie = getCookie("admin")

    if (adminCookie) {
      setUserRole("admin")
      setUsername(adminCookie)
      setLoading(false)
      return
    } else if (teamCookie) {
      setUserRole("team")
      setUsername(teamCookie)
      setLoading(false)
      return
    }

    // 2. Fetch server-side check-auth status (handles httpOnly cookies)
    try {
      // Check admin status
      const adminRes = await fetch("/api/admin/check-auth")
      if (adminRes.ok) {
        const data = await adminRes.json()
        if (data.authenticated) {
          setUserRole("admin")
          setUsername(data.admin)
          setLoading(false)
          return
        }
      }
    } catch (e) {
      console.error("Admin auth check error in navbar:", e)
    }

    try {
      // Check team status
      const teamRes = await fetch("/api/check-auth")
      if (teamRes.ok) {
        const data = await teamRes.json()
        if (data.authenticated) {
          setUserRole("team")
          setUsername(data.team)
          setLoading(false)
          return
        }
      }
    } catch (e) {
      console.error("Team auth check error in navbar:", e)
    }

    setUserRole("guest")
    setUsername(null)
    setLoading(false)
  }

  useEffect(() => {
    checkAuth()
  }, [pathname])



  const handleLogout = async () => {
    try {
      if (userRole === "admin") {
        await fetch("/api/admin/logout", { method: "POST" })
        window.location.href = "/admin/login"
      } else {
        await fetch("/api/logout", { method: "POST" })
        window.location.href = "/login"
      }
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  // Links definitions based on role
  const getLinks = () => {
    switch (userRole) {
      case "admin":
        return [
          { href: "/", label: "Home", icon: Home },
          { href: "/admin", label: "Admin", icon: Settings },
          { href: "/scoreboard", label: "Scoreboard", icon: Trophy },
        ]
      case "team":
        return [
          { href: "/", label: "Home", icon: Home },
          { href: "/dashboard", label: "Dashboard", icon: Layers },
          { href: "/scoreboard", label: "Scoreboard", icon: Trophy },
        ]
      case "guest":
      default:
        return [
          { href: "/", label: "Home", icon: Home },
          { href: "/scoreboard", label: "Scoreboard", icon: Trophy },
          { href: "/login", label: "Login", icon: User },
        ]
    }
  }

  const links = getLinks()

  const navLinkClass = (href: string) => {
    const isActive = href === "/admin"
      ? pathname === "/admin" || pathname.startsWith("/admin/")
      : pathname === href
    return `inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[14px] font-bold tracking-wide transition-all duration-200 focus:outline-none select-none border border-transparent ${
      isActive
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/5"
        : "text-gray-300 hover:bg-white/[0.04] hover:text-white"
    }`
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/[0.05] bg-[#0b0f19]/75 backdrop-blur-xl transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Brand */}
            <div className="flex items-center">
              <Link href="/" className="group flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <Shield className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent group-hover:opacity-85 transition-opacity">
                  NXAD
                </span>
              </Link>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center space-x-2">
              {links.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span className={navLinkClass(link.href)}>
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </span>
                </Link>
              ))}



              {!loading && userRole === "team" && (
                <div className="flex items-center space-x-4 pl-4 border-l border-white/[0.08]">
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#111622]/60 border border-white/[0.06] shadow-inner">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-gray-200 tracking-wide">{username}</span>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="border-red-950/80 hover:bg-red-950/60 hover:border-red-800 bg-red-950/20 text-red-400 h-9 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1.5" />
                    Logout
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile hamburger menu */}
            <div className="md:hidden flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-white/[0.04] focus:outline-none rounded-xl"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-[#0b0f19]/95 border-white/[0.06] text-white p-6 shadow-2xl backdrop-blur-xl">
                  <SheetTitle className="text-lg font-black tracking-wider bg-gradient-to-r from-emerald-400 via-teal-455 to-emerald-500 bg-clip-text text-transparent border-b border-white/[0.06] pb-4 mb-4">
                    NXAD Menu
                  </SheetTitle>
                  <div className="flex flex-col space-y-3">
                    {links.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <span className={`${navLinkClass(link.href)} w-full flex items-center`}>
                          <link.icon className="h-4 w-4 mr-2" />
                          {link.label}
                        </span>
                      </Link>
                    ))}



                    {!loading && userRole === "team" && (
                      <div className="pt-4 border-t border-white/[0.06] flex flex-col space-y-4">
                        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#111622]/60 border border-white/[0.06] shadow-inner">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-semibold text-gray-200 tracking-wide">
                            {username}
                          </span>
                        </div>
                        <Button
                          onClick={handleLogout}
                          variant="outline"
                          className="w-full border-red-950/80 hover:bg-red-950/60 hover:border-red-800 bg-red-950/20 text-red-400 transition-all duration-200 font-semibold"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
