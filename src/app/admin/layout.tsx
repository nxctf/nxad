"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdminLogin = pathname === "/admin/login"

  if (isAdminLogin) {
    return <>{children}</>
  }

  return (
    <div className="flex-1 flex flex-col relative z-10 w-full pt-16">
      {/* Tech background decorations for Admin area */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.06),transparent_50%)]" />
      <div className="fixed inset-x-0 top-0 h-96 pointer-events-none z-0 bg-purple-500/[0.015] blur-3xl" />

      <AdminSidebar />

      <div className="flex-1 flex flex-col w-full md:pl-64">
        {children}
      </div>
    </div>
  )
}
