"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield, Flag, Award, Clock, RefreshCw } from "lucide-react"

type ConfigType = {
  SELF_FLAG_POINTS: number
  ATTACK_POINTS: number
  DEFENSE_PENALTY: number
  PASSIVE_POINTS_VALUE: number
  PASSIVE_POINTS_INTERVAL: number
  MAX_SUBMISSIONS_PER_MINUTE: number
  RATE_LIMIT_WINDOW: number
}

export default function RulesPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [config, setConfig] = useState<ConfigType>({
    SELF_FLAG_POINTS: 10,
    ATTACK_POINTS: 200,
    DEFENSE_PENALTY: 50,
    PASSIVE_POINTS_VALUE: 1,
    PASSIVE_POINTS_INTERVAL: 1200000,
    MAX_SUBMISSIONS_PER_MINUTE: 10,
    RATE_LIMIT_WINDOW: 60000,
  })
  const [configLoading, setConfigLoading] = useState(true)

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

  useEffect(() => {
    // Fetch current configuration
    const fetchConfig = async () => {
      try {
        setConfigLoading(true)
        const response = await fetch("/api/config")
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setConfig(data.config)
          }
        }
      } catch (error) {
        console.error("Failed to fetch config:", error)
      } finally {
        setConfigLoading(false)
      }
    }

    fetchConfig()
  }, [])

  const handleBackClick = () => {
    if (isAuthenticated) {
      router.push("/dashboard")
    } else {
      router.push("/")
    }
  }

  const refreshConfig = async () => {
    setConfigLoading(true)
    try {
      const response = await fetch("/api/config")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setConfig(data.config)
        }
      }
    } catch (error) {
      console.error("Failed to refresh config:", error)
    } finally {
      setConfigLoading(false)
    }
  }

  const formatInterval = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`
  }

  return (
    <div className="flex-1 flex flex-col relative z-10 py-10 px-4">
      <main className="flex-1 container mx-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Button
              variant="outline"
              className="border-white/[0.08] hover:bg-white/[0.04] text-gray-300 font-bold rounded-xl px-4 py-5"
              onClick={handleBackClick}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isLoading ? "Loading..." : isAuthenticated ? "Back to Dashboard" : "Back to Home"}
            </Button>

            <Button
              onClick={refreshConfig}
              disabled={configLoading}
              className="bg-emerald-600 hover:bg-emerald-500 transition-all duration-300 font-bold rounded-xl hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] border-none text-white py-5 px-4"
              size="sm"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${configLoading ? "animate-spin" : ""}`} />
              Refresh Rules
            </Button>
          </div>

          <Card className="glass-card border-white/[0.05] shadow-2xl rounded-2xl">
            <CardHeader className="border-b border-white/[0.04] pb-4">
              <CardTitle className="text-2xl text-yellow-500 font-black tracking-wide">Official Competition Rules</CardTitle>
              <CardDescription className="text-gray-400 text-sm mt-1">
                Please read and understand all rules before participating
                {configLoading && <span className="ml-2 text-emerald-450 animate-pulse">(Loading current values...)</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div>
                <h3 className="text-xl font-bold mb-3 flex items-center text-emerald-400">
                  <Flag className="mr-2 h-5 w-5" /> Flag Submission Rules
                </h3>
                <ul className="space-y-3 text-gray-300 text-sm sm:text-base">
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2" />
                    <span>Each team has their own set of unique flags (hashes).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2" />
                    <span>
                      When you submit your own flag, you gain{" "}
                      <strong className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15">
                        {configLoading ? "..." : config.SELF_FLAG_POINTS} points
                      </strong>
                      .
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2" />
                    <span>
                      When you submit another team's flag, you gain{" "}
                      <strong className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15">{configLoading ? "..." : config.ATTACK_POINTS} points</strong>,
                      and the team that owns the flag loses{" "}
                      <strong className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/15">-{configLoading ? "..." : config.DEFENSE_PENALTY} points</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 mt-2" />
                    <span>Each team can submit a specific flag only once.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 mt-2" />
                    <span>Different teams can submit the same flag.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 mt-2" />
                    <span>
                      Rate limit: Maximum{" "}
                      <strong className="text-yellow-400">
                        {configLoading ? "..." : config.MAX_SUBMISSIONS_PER_MINUTE} flag submissions per{" "}
                        {configLoading ? "..." : formatInterval(config.RATE_LIMIT_WINDOW)}
                      </strong>
                      .
                    </span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-white/[0.06] pt-6">
                <h3 className="text-xl font-bold mb-3 flex items-center text-blue-400">
                  <Clock className="mr-2 h-5 w-5" /> Passive Points
                </h3>
                <ul className="space-y-3 text-gray-300 text-sm sm:text-base">
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-2" />
                    <span>
                      Teams earn{" "}
                      <strong className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15">
                        +{configLoading ? "..." : config.PASSIVE_POINTS_VALUE} point
                        {config.PASSIVE_POINTS_VALUE !== 1 ? "s" : ""} every{" "}
                        {configLoading ? "..." : formatInterval(config.PASSIVE_POINTS_INTERVAL)}
                      </strong>{" "}
                      for each flag they own.
                    </span>
                  </li>
                  <li className="text-xs sm:text-sm text-gray-400 italic pl-3 border-l-2 border-emerald-500/40 my-2 bg-white/[0.02] py-2 rounded-r-lg">
                    Passive points formula: (total teams - 1) - teams that submitted your flag
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-2" />
                    <span>This rewards teams for successfully defending their flags from other teams.</span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-white/[0.06] pt-6">
                <h3 className="text-xl font-bold mb-3 flex items-center text-yellow-500">
                  <Shield className="mr-2 h-5 w-5" /> Defense Strategy
                </h3>
                <ul className="space-y-3 text-gray-300 text-sm sm:text-base">
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mt-2" />
                    <span>Protect your flags from being discovered by other teams.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mt-2" />
                    <span>Implement security measures to prevent unauthorized access to your systems.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mt-2" />
                    <span>Monitor your systems for suspicious activities and patch vulnerabilities immediately.</span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-white/[0.06] pt-6">
                <h3 className="text-xl font-bold mb-3 flex items-center text-purple-400">
                  <Award className="mr-2 h-5 w-5" /> Scoring and Winning
                </h3>
                <ul className="space-y-3 text-gray-300 text-sm sm:text-base">
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-2" />
                    <span>The team with the highest score at the end of the competition wins.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-2" />
                    <span>Scores are updated in real-time and can be viewed on the scoreboard.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-2" />
                    <span>In case of a tie, the team that reached the score first wins.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-white/[0.01] rounded-xl border border-white/[0.06] shadow-inner mt-6">
                <h3 className="text-lg font-extrabold mb-4 text-yellow-500">Current Competition Settings</h3>
                {configLoading ? (
                  <div className="flex items-center text-gray-400">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Loading current settings...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                      <div className="text-emerald-450 font-bold text-xs uppercase tracking-wider mb-1">Own Flag Submission</div>
                      <div className="text-gray-300">+{config.SELF_FLAG_POINTS} points</div>
                    </div>
                    <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                      <div className="text-blue-450 font-bold text-xs uppercase tracking-wider mb-1">Successful Attack</div>
                      <div className="text-gray-300">+{config.ATTACK_POINTS} points</div>
                    </div>
                    <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                      <div className="text-red-450 font-bold text-xs uppercase tracking-wider mb-1">Defense Penalty</div>
                      <div className="text-gray-300">-{config.DEFENSE_PENALTY} points</div>
                    </div>
                    <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                      <div className="text-yellow-450 font-bold text-xs uppercase tracking-wider mb-1">Passive Points</div>
                      <div className="text-gray-300">
                        +{config.PASSIVE_POINTS_VALUE} every {formatInterval(config.PASSIVE_POINTS_INTERVAL)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white/[0.01] rounded-xl border border-white/[0.06] shadow-inner">
                <h3 className="text-lg font-extrabold mb-3 text-yellow-500">Important Notes</h3>
                <ul className="space-y-2.5 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mt-2" />
                    <span>The competition administrators have the final say in all disputes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mt-2" />
                    <span>Any form of cheating, DDoS attacks on competition infrastructure, or rule violation will result in immediate disqualification.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mt-2" />
                    <span>Competition settings may be updated by administrators during the event to balance the gameplay.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mt-2" />
                    <span>Have fun, hack ethically, and learn from the experience!</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
