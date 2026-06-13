"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, Check, X } from "lucide-react"

type Challenge = {
  _id: string
  name: string
  title: string
  directory: string
  internalHttpPort: number
  internalSshPort: number
  enabled: boolean
}

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/check-auth")
        if (!response.ok) router.push("/admin/login")
        else fetchChallenges()
      } catch {
        router.push("/admin/login")
      }
    }
    checkAuth()
  }, [router])

  const fetchChallenges = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/challenges")
      if (res.ok) setChallenges(await res.json())
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex-1">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Challenges</h1>
              <p className="text-gray-400 mt-1">Challenge templates from filesystem</p>
            </div>
            <Button variant="outline" onClick={fetchChallenges} className="border-gray-700 text-gray-400">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 text-left">
                    <th className="p-4">Name</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">Directory</th>
                    <th className="p-4">Ports (HTTP/SSH)</th>
                    <th className="p-4">Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No challenges found. Add a folder with challenge.json to the challenges/ directory.
                      </td>
                    </tr>
                  ) : (
                    challenges.map((ch) => (
                      <tr key={ch._id} className="border-b border-gray-700 text-white">
                        <td className="p-4 font-medium">{ch.name}</td>
                        <td className="p-4 text-gray-300">{ch.title}</td>
                        <td className="p-4 text-gray-300">{ch.directory}</td>
                        <td className="p-4 text-gray-300">
                          {ch.internalHttpPort} / {ch.internalSshPort}
                        </td>
                        <td className="p-4">
                          {ch.enabled ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <X className="h-4 w-4 text-gray-600" />
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
