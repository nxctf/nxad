"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/login?tab=admin")
  }, [router])

  return (
    <div className="flex-1 flex items-center justify-center text-white font-bold py-20">
      Redirecting to Admin Portal...
    </div>
  )
}
