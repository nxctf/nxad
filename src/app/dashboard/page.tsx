"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Flag, AlertTriangle, Trophy, Server, Crosshair, Terminal, Globe, Key } from "lucide-react"
import { CountdownTimer } from "@/components/countdown-timer"
import { FlagNotificationSystem } from "@/components/flag-notification"
import { AlertDialog } from "@/components/alert-dialog"
import { TeamChat } from "@/components/team-chat"

type SubmittedFlag = {
  value: string
  owner: string
}

type PassivePointsStatus = {
  running: boolean
  nextRun: string | null
  lastRun: string | null
  pointsAwarded: number
  startedAt: string | null
}

export default function DashboardPage() {
  const [team, setTeam] = useState<string | null>(null)
  const [score, setScore] = useState<number>(0)
  const [flag, setFlag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedFlags, setSubmittedFlags] = useState<SubmittedFlag[]>([])
  const [passivePointsStatus, setPassivePointsStatus] = useState<PassivePointsStatus>({
    running: false,
    nextRun: null,
    lastRun: null,
    pointsAwarded: 0,
    startedAt: null,
  })
  const [config, setConfig] = useState({
    SELF_FLAG_POINTS: 10,
    ATTACK_POINTS: 200,
    DEFENSE_PENALTY: 50,
    PASSIVE_POINTS_VALUE: 1,
    PASSIVE_POINTS_INTERVAL: 1200000,
  })
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
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [myServices, setMyServices] = useState<any[]>([])
  const [targets, setTargets] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/check-auth")
        const data = await response.json()

        if (!response.ok) {
          router.push("/login")
          return
        }

        setTeam(data.team)
        setScore(data.score)
        setSubmittedFlags(data.submittedFlags || [])
      } catch (error) {
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        const res = await fetch("/api/deployments")
        if (res.ok) {
          const data = await res.json()
          setMyServices(data.myServices || [])
          setTargets(data.targets || [])
        }
      } catch (err) {
        console.error("Failed to fetch deployments", err)
      }
    }
    fetchDeployments()
    const interval = setInterval(fetchDeployments, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/admin/config")
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setConfig(data.config)
          }
        }
      } catch (error) {
        console.error("Failed to fetch config:", error)
      }
    }

    fetchConfig()
  }, [])

  useEffect(() => {
    const fetchPassivePointsStatus = async () => {
      try {
        const response = await fetch("/api/admin/passive-points")
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setPassivePointsStatus(data.status)
          }
        }
      } catch (error) {
        console.error("Failed to fetch passive points status:", error)
      }
    }

    fetchPassivePointsStatus()

    // Refresh status every 30 seconds
    const interval = setInterval(fetchPassivePointsStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/submit-flag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ flag }),
      })

      const data = await response.json()

      if (response.ok) {
        setAlert({
          show: true,
          type: "success",
          title: "Flag Submitted Successfully",
          message: data.message,
        })

        // Update score
        setScore(data.newScore)
        setFlag("")

        // Update remaining attempts
        if (data.remaining !== undefined) {
          setRemainingAttempts(data.remaining)
        }

        // Refresh data to get updated submitted flags
        const authResponse = await fetch("/api/check-auth")
        const authData = await authResponse.json()
        setSubmittedFlags(authData.submittedFlags || [])
      } else {
        // Handle rate limit
        if (response.status === 429) {
          setAlert({
            show: true,
            type: "warning",
            title: "Rate Limit Exceeded",
            message: data.message,
          })
        } else {
          setAlert({
            show: true,
            type: "error",
            title: "Submission Failed",
            message: data.message,
          })
        }

        // Update remaining attempts
        if (data.remaining !== undefined) {
          setRemainingAttempts(data.remaining)
        }
      }
    } catch (error) {
      setAlert({
        show: true,
        type: "error",
        title: "Error",
        message: "An error occurred during flag submission",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeAlert = () => {
    setAlert({ ...alert, show: false })
  }

  if (!team) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col relative z-10 pt-24 pb-10 px-4">
      <FlagNotificationSystem />

      {alert.show && <AlertDialog type={alert.type} title={alert.title} message={alert.message} onClose={closeAlert} />}

      <main className="flex-1 container mx-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header Metadata Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-white/[0.06]">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-emerald-400 uppercase">Arena Dashboard</h2>
              <p className="text-gray-450 text-sm mt-1">Defend your services and submit captured flags to score points.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <CountdownTimer running={passivePointsStatus.running} nextRun={passivePointsStatus.nextRun} />
              <div className="flex items-center space-x-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/[0.06] shadow-sm">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Team:</span>
                <span className="text-sm font-black text-emerald-450">{team}</span>
                <span className="text-white/10 px-1">|</span>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Score:</span>
                <span className="text-sm font-black text-emerald-400">{score}</span>
              </div>
            </div>
          </div>

          {/* My Services */}
          {myServices.length > 0 && (
            <Card className="glass-card border-white/[0.05] shadow-2xl rounded-2xl mb-6">
              <CardHeader className="border-b border-white/[0.04] pb-4">
                <CardTitle className="text-lg text-emerald-450 font-extrabold flex items-center gap-2">
                  <Server className="h-5 w-5 text-emerald-400 animate-pulse" />
                  My Services (Defend)
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Your isolated challenge containers. Keep these services secure to prevent flag theft.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myServices.map((svc: any, i: number) => (
                    <div key={i} className="bg-white/[0.005] border border-white/[0.05] rounded-lg p-3 shadow-sm hover:border-emerald-500/25 hover:bg-white/[0.01] transition-all duration-200">
                      <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {svc.challengeName}
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Globe className="h-3 w-3 text-blue-400" />
                          <span className="font-semibold text-gray-400 text-[11px]">Web:</span>
                          <a href={svc.httpUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline break-all">
                            {svc.httpUrl}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Terminal className="h-3 w-3 text-emerald-400" />
                          <span className="font-semibold text-gray-400 text-[11px]">SSH:</span>
                          <code className="text-[10px] text-emerald-350 bg-white/5 border border-white/[0.05] px-1.5 py-0.5 rounded break-all">{svc.sshCommand}</code>
                        </div>
                        {svc.sshPassword && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Key className="h-3 w-3 text-yellow-400" />
                            <span className="font-semibold text-gray-400 text-[11px]">Pass:</span>
                            <code className="text-[10px] text-yellow-300 bg-white/5 border border-white/[0.05] px-1.5 py-0.5 rounded">{svc.sshPassword}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Targets */}
          {targets.length > 0 && (
            <Card className="glass-card border-white/[0.05] shadow-2xl rounded-2xl mb-6">
              <CardHeader className="border-b border-white/[0.04] pb-4">
                <CardTitle className="text-lg text-red-450 font-extrabold flex items-center gap-2">
                  <Crosshair className="h-5 w-5 text-red-400 animate-pulse" />
                  Targets (Attack)
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Exploit these services on rival systems to capture and submit their flags.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {targets.map((t: any, i: number) => (
                    <div key={i} className="bg-white/[0.005] border border-white/[0.05] rounded-lg p-3 shadow-sm hover:border-red-500/25 hover:bg-white/[0.01] transition-all duration-200">
                      <h3 className="font-bold text-red-400 text-xs mb-2 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        {t.teamName}
                      </h3>
                      <div className="space-y-3">
                        {t.services.map((svc: any, j: number) => (
                          <div key={j} className="text-xs space-y-1 border-t border-white/[0.04] pt-2 first:border-none first:pt-0">
                            <div className="text-gray-300 font-bold text-[11px]">{svc.challengeName}</div>
                            <div className="flex items-center gap-1 text-gray-405 break-all">
                              <Globe className="h-2.5 w-2.5 text-blue-400 shrink-0" />
                              <a href={svc.httpUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline truncate text-[11px]">
                                {svc.httpUrl}
                              </a>
                            </div>
                            {svc.sshCommand && (
                              <div className="flex items-center gap-1 text-gray-405 truncate">
                                <Terminal className="h-2.5 w-2.5 text-gray-450 shrink-0" />
                                <span className="font-mono text-[9px] text-gray-400">
                                  {svc.sshCommand.split("@")[1] ? `team@${svc.sshCommand.split("@")[1]}` : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Flag Submission */}
              <Card className="glass-card border-white/[0.05] shadow-2xl rounded-2xl">
                <CardHeader className="border-b border-white/[0.04] pb-4">
                  <CardTitle className="text-lg text-emerald-400 font-extrabold flex items-center gap-2">
                    <Flag className="h-5 w-5 text-emerald-450" />
                    Flag Submission
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    Enter any flags found from defensive patches or successful exploits.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmitFlag} className="space-y-4">
                    <div className="space-y-2.5">
                      <Label htmlFor="flag" className="text-gray-300 font-bold text-xs uppercase tracking-wider">
                        Submit Flag
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="flag"
                          value={flag}
                          onChange={(e) => setFlag(e.target.value)}
                          placeholder="flag{...} or uuid (e.g. 123e4567-...)"
                          required
                          className="bg-white/5 border-white/[0.08] text-white rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 glass-input py-6 text-sm flex-1"
                        />
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 transition-all duration-300 font-bold rounded-xl hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] border-none text-white px-6" disabled={isSubmitting}>
                          {isSubmitting ? "Submitting..." : "Submit"}
                        </Button>
                      </div>
                      {remainingAttempts !== null && (
                        <p className="text-xs text-gray-400 mt-1 italic pl-1">
                          Remaining submissions: {remainingAttempts} of 10 per minute
                        </p>
                      )}
                    </div>
                  </form>

                  <div className="mt-6 p-4 bg-white/[0.01] rounded-xl border border-white/[0.06] shadow-inner">
                    <h3 className="text-sm font-extrabold mb-2.5 text-yellow-500 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Submission Rules
                    </h3>
                    <ul className="text-gray-300 space-y-2 text-xs sm:text-sm pl-1">
                      <li className="flex items-center gap-1.5">
                        <span className="h-1 w-1 bg-emerald-450 rounded-full" />
                        <span>Submit your own flag: <span className="text-emerald-450 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">+{config.SELF_FLAG_POINTS} points</span> (patch validation)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="h-1 w-1 bg-emerald-450 rounded-full" />
                        <span>Submit another team's flag: <span className="text-emerald-450 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">+{config.ATTACK_POINTS} points</span> for you, <span className="text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded">-{config.DEFENSE_PENALTY} points</span> for them</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="h-1 w-1 bg-yellow-450 rounded-full" />
                        <span>Specific flags can only be submitted once per team.</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="h-1 w-1 bg-yellow-450 rounded-full" />
                        <span>Rate Limit: <span className="text-yellow-450 font-semibold">10 attempts per minute</span>. Avoid scripting spam.</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Submitted Flags */}
              <Card className="glass-card border-white/[0.05] shadow-2xl rounded-2xl">
                <CardHeader className="border-b border-white/[0.04] pb-4">
                  <CardTitle className="text-lg text-blue-450 font-extrabold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-blue-400" />
                    Submitted Flags
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    History of flags successfully captured and submitted by your team.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {submittedFlags.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {submittedFlags.map((submittedFlag, index) => (
                        <div
                          key={index}
                          className={`p-3.5 rounded-xl border transition-all duration-200 ${
                            submittedFlag.owner === team
                              ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
                              : "bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10"
                          }`}
                        >
                          <div className="font-mono text-xs text-gray-200 break-all">{submittedFlag.value}</div>
                          <div className="mt-2 text-xs font-semibold flex justify-between">
                            {submittedFlag.owner === team ? (
                              <span className="text-emerald-400">Your flag</span>
                            ) : (
                              <span className="text-blue-400">From {submittedFlag.owner}</span>
                            )}
                            {submittedFlag.owner === team ? (
                              <span className="text-emerald-500">+{config.SELF_FLAG_POINTS} points</span>
                            ) : (
                              <span className="text-blue-400">+{config.ATTACK_POINTS} points</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8 text-sm italic">You haven't submitted any flags yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="glass-card border-white/[0.05] shadow-2xl rounded-2xl">
                <CardHeader className="pb-3 border-b border-white/[0.04]">
                  <CardTitle className="text-lg text-purple-400 font-extrabold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <Link href="/scoreboard" className="w-full block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 font-bold rounded-xl transition-all duration-300 text-white py-5">
                      View Scoreboard
                    </Button>
                  </Link>
                  <Link href="/rules" className="w-full block">
                    <Button variant="outline" className="w-full border-white/[0.08] hover:bg-white/[0.04] text-gray-300 font-bold rounded-xl py-5">
                      Competition Rules
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Team Communication */}
              <Card className="glass-card border-white/[0.05] shadow-2xl rounded-2xl">
                <CardHeader className="pb-3 border-b border-white/[0.04]">
                  <CardTitle className="text-lg text-purple-400 font-extrabold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-450" />
                    Team Communication
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-xs">
                    Broadcast general messages to other squads or communicate strategies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 p-0 md:p-4">
                  <TeamChat teamName={team} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
