"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, ArrowLeft, RefreshCw, ChevronDown, ChevronUp, Scroll, ShieldAlert, Award, ShieldCheck } from "lucide-react"
import { CountdownTimer } from "@/components/countdown-timer"
import { StatsGraph } from "@/components/stats-graph"
import { useRouter } from "next/navigation"

type TeamScore = {
  team: string
  score: number
  rank: number
}

type PassivePointsStatus = {
  running: boolean
  nextRun: string | null
  lastRun: string | null
  pointsAwarded: number
  startedAt: string | null
}

export default function ScoreboardPage() {
  const [scores, setScores] = useState<TeamScore[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [passivePointsStatus, setPassivePointsStatus] = useState<PassivePointsStatus>({
    running: false,
    nextRun: null,
    lastRun: null,
    pointsAwarded: 0,
    startedAt: null,
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if the user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/check-auth")
        const data = await response.json()
        setIsAuthenticated(response.ok && data.authenticated)
      } catch (error) {
        console.error("Auth check error:", error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const fetchScores = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/scoreboard")
      const data = await response.json()

      if (response.ok) {
        // Sort by score (highest first) and add rank
        const sortedScores = data.scores
          .sort((a: TeamScore, b: TeamScore) => b.score - a.score)
          .map((team: TeamScore, index: number) => ({
            ...team,
            rank: index + 1,
          }))

        setScores(sortedScores)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Failed to fetch scoreboard", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/scoreboard/logs")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setLogs(data.logs)
        }
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    }
  }

  const handleRefreshAll = () => {
    fetchScores()
    fetchLogs()
  }

  useEffect(() => {
    fetchScores()
    fetchLogs()

    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchScores()
      fetchLogs()
    }, 30000)

    return () => clearInterval(intervalId)
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

  const getRowClass = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/[0.02] hover:bg-yellow-500/[0.05] transition-colors"
    if (rank === 2) return "bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
    if (rank === 3) return "bg-amber-600/[0.02] hover:bg-amber-600/[0.05] transition-colors"
    return "hover:bg-white/[0.02] transition-colors"
  }

  const handleBackClick = () => {
    if (isAuthenticated) {
      router.push("/dashboard")
    } else {
      router.push("/")
    }
  }

  return (
    <div className="flex-1 flex flex-col relative z-10 pt-24 pb-10 px-4">
      <main className="flex-1 container mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <Button
              variant="outline"
              className="border-white/[0.08] hover:bg-white/[0.04] text-gray-300 font-bold rounded-xl px-4 py-5"
              onClick={handleBackClick}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isLoading ? "Loading..." : isAuthenticated ? "Back to Dashboard" : "Back to Home"}
            </Button>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <CountdownTimer
                running={passivePointsStatus.running}
                nextRun={passivePointsStatus.nextRun}
                className="mr-2"
              />

              <Button className="bg-emerald-600 hover:bg-emerald-500 transition-all duration-300 font-bold rounded-xl hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] border-none text-white py-5" onClick={handleRefreshAll} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""} text-white`} />
                Refresh Board
              </Button>
            </div>
          </div>

          {/* Stats Graph */}
          <div className="mb-8 glass-card rounded-2xl border border-white/[0.05] p-1 sm:p-2 overflow-hidden">
            <StatsGraph />
          </div>

          <Card className="glass-card border-white/[0.05] shadow-2xl rounded-2xl">
            <CardHeader className="border-b border-white/[0.04] pb-4">
              <CardTitle className="text-2xl flex items-center justify-center font-black tracking-wide">
                <Trophy className="mr-2 h-6 w-6 text-yellow-400" /> Live Scoreboard
              </CardTitle>
              <CardDescription className="text-center text-gray-400 text-sm mt-1">
                {lastUpdated ? <>Last updated: {lastUpdated.toLocaleTimeString()}</> : <>Loading scores...</>}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading && scores.length === 0 ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-wide">Loading scoreboard...</p>
                </div>
              ) : scores.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.005]">
                  <table className="w-full text-left">
                    <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                      <tr>
                        <th className="px-3 py-2 text-gray-400 font-extrabold text-[10px] uppercase tracking-wider w-24">Rank</th>
                        <th className="px-3 py-2 text-gray-400 font-extrabold text-[10px] uppercase tracking-wider">Team</th>
                        <th className="px-3 py-2 text-gray-400 font-extrabold text-[10px] uppercase tracking-wider text-right w-32">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {scores.map((team) => (
                        <tr key={team.team} className={`transition-all duration-150 ${getRowClass(team.rank)}`}>
                          <td className="px-3 py-2 font-bold text-xs">
                            {team.rank === 1 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-450 border border-yellow-500/20 text-[10px] font-black">
                                🏆 1st
                              </span>
                            )}
                            {team.rank === 2 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-400/10 text-gray-300 border border-gray-400/20 text-[10px] font-black">
                                🥈 2nd
                              </span>
                            )}
                            {team.rank === 3 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-600/10 text-amber-500 border border-amber-600/20 text-[10px] font-black">
                                🥉 3rd
                              </span>
                            )}
                            {team.rank > 3 && (
                              <span className="inline-flex items-center justify-center h-5 w-7 rounded bg-white/[0.03] border border-white/[0.05] text-gray-400 font-mono text-[10px]">
                                #{team.rank}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs font-semibold text-gray-200">{team.team}</td>
                          <td className="px-3 py-2 font-black text-right text-xs">
                            {team.score >= 0 ? (
                              <span className="text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/10 font-mono">{team.score} pts</span>
                            ) : (
                              <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/10 font-mono">{team.score} pts</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No scores available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Logs Accordion */}
          <Card className="glass-card border-white/[0.05] shadow-2xl rounded-2xl mt-8">
            <CardHeader className="border-b border-white/[0.04] pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center font-black tracking-wide">
                  <Scroll className="mr-2 h-5 w-5 text-emerald-400" /> Event Logs
                </CardTitle>
                <CardDescription className="text-gray-400 text-xs mt-1">
                  Timeline of attacks, defenses, and passive points
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={fetchLogs} 
                className="text-gray-405 hover:text-white"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 pb-2">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-6 text-sm italic">No logs recorded yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {logs.map((log) => {
                    const isExpanded = expandedLogId === log._id
                    const timeStr = new Date(log.createdAt).toLocaleTimeString()
                    
                    let icon = <ShieldCheck className="h-3.5 w-3.5 text-emerald-450" />
                    let typeLabel = "Validation"
                    let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/15"

                    if (log.type === "attack") {
                      icon = <ShieldAlert className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                      typeLabel = "Breach"
                      badgeColor = "bg-red-500/10 text-red-400 border-red-500/15"
                    } else if (log.type === "passive-points") {
                      icon = <Award className="h-3.5 w-3.5 text-blue-400" />
                      typeLabel = "Passive"
                      badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/15"
                    }

                    return (
                      <div 
                        key={log._id}
                        className="border border-white/[0.04] rounded-lg bg-white/[0.005] overflow-hidden transition-all duration-200"
                      >
                        {/* Accordion Header */}
                        <div 
                          onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                          className="flex items-center justify-between p-2 px-3 cursor-pointer hover:bg-white/[0.02] select-none"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                              {icon}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${badgeColor} self-start sm:self-auto`}>
                                {typeLabel}
                              </span>
                              <p className="text-[11px] text-gray-300 font-medium line-clamp-1 max-w-[200px] sm:max-w-md">
                                {log.message.replace(/\*\*/g, "")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] text-gray-500 font-bold">{timeStr}</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
                          </div>
                        </div>

                        {/* Accordion Content */}
                        {isExpanded && (
                          <div className="p-4 border-t border-white/[0.04] bg-white/[0.005] text-xs text-gray-450 space-y-2 animate-slideIn">
                            <div className="flex justify-between">
                              <span>Event Type:</span>
                              <span className="font-bold text-gray-300 capitalize">{log.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Timestamp:</span>
                              <span className="font-bold text-gray-300">{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                            {log.team && (
                              <div className="flex justify-between">
                                <span>Attacking/Submitting Team:</span>
                                <span className="font-bold text-emerald-400">{log.team}</span>
                              </div>
                            )}
                            {log.target && (
                              <div className="flex justify-between">
                                <span>Target/Breached Team:</span>
                                <span className="font-bold text-red-400">{log.target}</span>
                              </div>
                            )}
                            {log.points !== undefined && (
                              <div className="flex justify-between">
                                <span>Points Delta:</span>
                                <span className={`font-bold ${log.points > 0 ? "text-emerald-450" : "text-gray-405"}`}>
                                  {log.points > 0 ? `+${log.points}` : log.points} pts
                                </span>
                              </div>
                            )}
                            <div className="border-t border-white/[0.04] pt-2.5 mt-2">
                              <span className="block mb-1 text-[10px] uppercase font-bold text-gray-550">System Log message:</span>
                              <p className="text-gray-250 leading-relaxed font-mono bg-white/[0.01] p-2 rounded-lg border border-white/[0.04]">
                                {log.message}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
