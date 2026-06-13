"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Flag, Clock, Trophy, LogOut, ArrowRight, User, Settings } from "lucide-react"

export default function Home() {
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
    // 1. Try cookies first (instant)
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

    // 2. Fallback to API checks
    try {
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
      console.error("Admin check failed", e)
    }

    try {
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
      console.error("Team check failed", e)
    }

    setUserRole("guest")
    setUsername(null)
    setLoading(false)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      if (userRole === "admin") {
        await fetch("/api/admin/logout", { method: "POST" })
        window.location.href = "/login?tab=admin"
      } else {
        await fetch("/api/logout", { method: "POST" })
        window.location.href = "/login"
      }
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  return (
    <div className="flex-1 flex flex-col relative z-10 px-4 pt-24 pb-10 lg:pt-28 lg:pb-16">
      <main className="flex-1 container mx-auto">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/[0.06] backdrop-blur-md mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400">
              Attack & Defense Active Mode
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
            Welcome to the Arena
          </h2>
          <p className="text-base sm:text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Submit flags, attack other teams, and defend your own flags to dominate the scoreboard.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Left Card: Dynamic authentication response */}
            <Card className="glass-card-interactive border-white/[0.05] text-left transition-all duration-300 flex flex-col justify-between">
              <div>
                <CardHeader>
                  {loading ? (
                    <>
                      <CardTitle className="text-emerald-400 font-extrabold text-xl flex items-center gap-2">
                        <User className="h-5 w-5 animate-pulse text-emerald-400" />
                        Arena Auth
                      </CardTitle>
                      <CardDescription className="text-gray-400">Verifying session details...</CardDescription>
                    </>
                  ) : userRole === "team" ? (
                    <>
                      <CardTitle className="text-emerald-400 font-extrabold text-xl flex items-center gap-2">
                        <User className="h-5 w-5 text-emerald-400" />
                        Active Team: {username}
                      </CardTitle>
                      <CardDescription className="text-gray-400">Authenticated Participant Session</CardDescription>
                    </>
                  ) : userRole === "admin" ? (
                    <>
                      <CardTitle className="text-purple-400 font-extrabold text-xl flex items-center gap-2">
                        <Settings className="h-5 w-5 text-purple-400" />
                        Admin Mode Active
                      </CardTitle>
                      <CardDescription className="text-gray-400">Authenticated Administrator Session</CardDescription>
                    </>
                  ) : (
                    <>
                      <CardTitle className="text-emerald-400 font-extrabold text-xl flex items-center gap-2">
                        <Shield className="h-5 w-5 text-emerald-400" />
                        Team Login
                      </CardTitle>
                      <CardDescription className="text-gray-400">Access your team dashboard</CardDescription>
                    </>
                  )}
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-12 flex items-center text-gray-500 text-sm">
                      Retrieving status from server, please wait...
                    </div>
                  ) : userRole === "team" ? (
                    <p className="text-gray-300 text-sm leading-relaxed">
                      You are logged in! You can access your team dashboard, submit flags, secure services, and view real-time logs.
                    </p>
                  ) : userRole === "admin" ? (
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Logged in as Administrator. You have full control to configure parameters, deploy flags, manage teams, and view chats.
                    </p>
                  ) : (
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Login to submit flags, configure SSH defenses, and track your team status.
                    </p>
                  )}
                </CardContent>
              </div>
              <CardFooter className="pt-2">
                {loading ? (
                  <Button className="w-full bg-emerald-600/50 cursor-wait text-white py-6 rounded-xl font-bold border-none" disabled>
                    Loading state...
                  </Button>
                ) : userRole === "team" ? (
                  <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                    <Link href="/dashboard" className="flex-1">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-500 transition-all duration-300 font-bold rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] border-none text-white py-6 flex items-center justify-center gap-1.5">
                        Dashboard <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      onClick={handleLogout}
                      variant="outline" 
                      className="border-red-950/80 hover:bg-red-950/60 hover:border-red-800 bg-red-950/20 text-red-400 py-6 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </Button>
                  </div>
                ) : userRole === "admin" ? (
                  <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                    <Link href="/admin" className="flex-1">
                      <Button className="w-full bg-purple-600 hover:bg-purple-500 transition-all duration-300 font-bold rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] border-none text-white py-6 flex items-center justify-center gap-1.5">
                        Admin Panel <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      onClick={handleLogout}
                      variant="outline" 
                      className="border-red-950/80 hover:bg-red-950/60 hover:border-red-800 bg-red-950/20 text-red-400 py-6 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </Button>
                  </div>
                ) : (
                  <Link href="/login" className="w-full">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500 transition-all duration-300 font-bold rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] border-none text-white py-6 flex items-center justify-center gap-1">
                      Enter Dashboard <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>

            {/* Right Card: Scoreboard */}
            <Card className="glass-card-interactive border-white/[0.05] text-left flex flex-col justify-between">
              <div>
                <CardHeader>
                  <CardTitle className="text-blue-400 font-extrabold text-xl flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-blue-400" />
                    Scoreboard
                  </CardTitle>
                  <CardDescription className="text-gray-400">View competition standings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm leading-relaxed">Check the live points, team rankings, and real-time statistics graph.</p>
                </CardContent>
              </div>
              <CardFooter className="pt-2">
                <Link href="/scoreboard" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 transition-all duration-300 font-bold rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] border-none text-white py-6 flex items-center justify-center gap-1">
                    View Scoreboard <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/[0.05] text-left mb-8 shadow-xl">
            <h3 className="text-xl sm:text-2xl font-black mb-6 text-yellow-500 tracking-wide flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Competition Rules
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-bold mb-3 flex items-center text-emerald-400">
                  <Flag className="mr-2 h-5 w-5" /> Flag Submission
                </h4>
                <ul className="text-gray-300 space-y-2.5 pl-4 text-sm sm:text-base">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Submit your own flag: <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15">+25 points</span></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Submit another team's flag: <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15">+100 points</span> for you, <span className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/15">-25 points</span> for them</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Each team can submit a specific flag only once</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Different teams can submit the same flag</span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-white/[0.06] pt-6">
                <h4 className="text-lg font-bold mb-3 flex items-center text-blue-400">
                  <Clock className="mr-2 h-5 w-5" /> Passive Points
                </h4>
                <ul className="text-gray-300 space-y-2.5 pl-4 text-sm sm:text-base">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    <span>Teams earn <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15">+1 point every 5 minutes</span> for each flag they own.</span>
                  </li>
                  <li className="text-xs sm:text-sm text-gray-400 italic pl-3 border-l-2 border-emerald-500/40 my-2 bg-white/[0.02] py-2 rounded-r-lg">
                    Passive points formula: (total teams - 1) - teams that submitted your flag
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    <span>This rewards teams for successfully defending their flags from attacks.</span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-white/[0.06] pt-6">
                <h4 className="text-lg font-bold mb-3 flex items-center text-yellow-500">
                  <Shield className="mr-2 h-5 w-5" /> Strategy & Defense
                </h4>
                <ul className="text-gray-300 space-y-2.5 pl-4 text-sm sm:text-base">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                    <span>Balance between attacking other teams and defending your own flags</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                    <span>The team with the highest score at the end of the competition wins</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/[0.05] text-center shadow-lg">
            <h3 className="text-xs font-bold mb-4 text-gray-400 uppercase tracking-widest">Links & Resources</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a
                href="https://github.com/nxctf/nxad"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold flex items-center gap-1"
              >
                GitHub Repository
              </a>
              <span className="hidden sm:inline text-white/10">|</span>
              <a
                href="https://nxctf.my.id"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors font-semibold"
              >
                nxctf.my.id
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
