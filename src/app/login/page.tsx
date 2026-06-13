"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertDialog } from "@/components/alert-dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Lock, ShieldAlert, Users, ArrowLeft, Key } from "lucide-react"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<"team" | "admin">("team")
  
  // Form states
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Alert dialog state
  const [alert, setAlert] = useState<{
    show: boolean
    type: "error" | "success" | "warning" | "info"
    title: string
    message: string
  }>({
    show: false,
    type: "error",
    title: "",
    message: "",
  })

  // Set active tab based on query param on mount/change
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam === "admin") {
      setActiveTab("admin")
    } else {
      setActiveTab("team")
    }
  }, [searchParams])

  // Clear inputs when switching tabs
  const handleTabChange = (val: string) => {
    setActiveTab(val as "team" | "admin")
    setUsername("")
    setPassword("")
    // Sync query parameter
    router.replace(`/login?tab=${val}`)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const endpoint = activeTab === "admin" ? "/api/admin/login" : "/api/login"
    const redirectPath = activeTab === "admin" ? "/admin" : "/dashboard"

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Successful login: perform hard redirect using window.location.href to fully reload sessions and avoid exceptions
        window.location.href = redirectPath
      } else {
        setAlert({
          show: true,
          type: "error",
          title: "Login Failed",
          message: data.message || "Invalid credentials. Please check your username and password.",
        })
      }
    } catch (error) {
      setAlert({
        show: true,
        type: "error",
        title: "Network Error",
        message: "An error occurred during authentication. Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const closeAlert = () => {
    setAlert({ ...alert, show: false })
  }

  const activeColorClass = activeTab === "admin" ? "text-purple-400" : "text-emerald-400"
  const activeBtnClass = activeTab === "admin" 
    ? "bg-purple-600 hover:bg-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]" 
    : "bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
  const inputBorderClass = activeTab === "admin" 
    ? "focus:border-purple-500/50 focus:ring-purple-500/20" 
    : "focus:border-emerald-500/50 focus:ring-emerald-500/20"

  return (
    <div className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 relative z-10">
      {alert.show && <AlertDialog type={alert.type} title={alert.title} message={alert.message} onClose={closeAlert} />}
      
      <Card className="w-full max-w-md glass-card border-white/[0.05] shadow-2xl rounded-2xl p-2 sm:p-4 transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-3">
            <div className={`p-3 bg-white/5 border border-white/10 rounded-full shadow-inner transition-colors duration-300`}>
              {activeTab === "admin" ? (
                <ShieldAlert className="h-9 w-9 text-purple-400" />
              ) : (
                <Users className="h-9 w-9 text-emerald-400" />
              )}
            </div>
          </div>
          <CardTitle className={`text-2xl font-extrabold tracking-wide text-center transition-colors duration-300 ${activeColorClass}`}>
            {activeTab === "admin" ? "Admin Access" : "Team Dashboard"}
          </CardTitle>
          <CardDescription className="text-gray-400 text-center text-sm">
            Enter your credentials to enter the competition arena
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-5">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/[0.08] p-1 rounded-xl h-12">
              <TabsTrigger 
                value="team" 
                className="rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400"
              >
                Team Login
              </TabsTrigger>
              <TabsTrigger 
                value="admin" 
                className="rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400"
              >
                Admin Login
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 opacity-70" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeTab === "admin" ? "Enter admin username" : "Enter your team username"}
                  required
                  className={`bg-white/5 border-white/[0.08] text-white rounded-xl transition-all duration-200 glass-input py-6 text-sm ${inputBorderClass}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 opacity-70" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`bg-white/5 border-white/[0.08] text-white rounded-xl transition-all duration-200 glass-input py-6 text-sm ${inputBorderClass}`}
                />
              </div>

              <Button 
                type="submit" 
                className={`w-full transition-all duration-300 font-bold rounded-xl border-none text-white py-6 mt-4 flex items-center justify-center gap-2 ${activeBtnClass}`} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin text-lg">⏳</span> Authentication...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Sign In
                  </>
                )}
              </Button>
            </form>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-white/[0.06] pt-4 mt-2">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors font-semibold flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to Arena Info
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center text-white font-bold py-20">
        Loading Arena...
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
