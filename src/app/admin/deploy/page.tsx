"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AlertDialog } from "@/components/alert-dialog"
import { Rocket, Square, RefreshCw, Loader2, Server, CheckCircle, XCircle, Clock } from "lucide-react"

type Deployment = {
  _id: string
  teamName: string
  challengeName: string
  httpPort: number
  sshPort: number
  status: string
  containerId: string
  updatedAt: string
}

export default function AdminDeployPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [host, setHost] = useState("localhost")
  const [alert, setAlert] = useState<{
    show: boolean
    type: "error" | "success" | "warning" | "info"
    title: string
    message: string
  }>({ show: false, type: "error", title: "", message: "" })
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/check-auth")
        if (!res.ok) router.push("/admin/login")
        else fetchStatus()
      } catch {
        router.push("/admin/login")
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    setHost(window.location.hostname)
  }, [])

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/deploy")
      if (res.ok) setDeployments(await res.json())
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const showAlert = (type: "error" | "success" | "warning" | "info", title: string, message: string) => {
    setAlert({ show: true, type, title, message })
  }

  const handleDeploy = async () => {
    setDeploying(true)
    try {
      const res = await fetch("/api/admin/deploy", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        showAlert("success", "Deployed", `Successfully deployed ${data.deployments.length} services`)
      } else {
        showAlert("error", "Deploy Failed", data.message)
      }
      fetchStatus()
    } catch (err: any) {
      showAlert("error", "Error", err.message)
    }
    setDeploying(false)
  }

  const handleStop = async () => {
    setStopping(true)
    try {
      const res = await fetch("/api/admin/deploy", { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        showAlert("success", "Stopped", "All challenges stopped")
      } else {
        showAlert("error", "Stop Failed", data.message)
      }
      fetchStatus()
    } catch (err: any) {
      showAlert("error", "Error", err.message)
    }
    setStopping(false)
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case "deploying":
        return <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />
      case "stopped":
        return <Square className="h-5 w-5 text-gray-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-400" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Deploy Challenges</h1>
              <p className="text-gray-400 mt-1">Deploy or stop challenge containers</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchStatus} className="border-gray-700 text-gray-400">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={handleDeploy}
                disabled={deploying}
                className="bg-green-600 hover:bg-green-700"
              >
                {deploying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                Deploy All
              </Button>
              <Button
                onClick={handleStop}
                disabled={stopping}
                variant="outline"
                className="border-red-800 text-red-400 hover:bg-red-900/30"
              >
                {stopping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
                Stop All
              </Button>
            </div>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Server className="h-5 w-5" />
                Deployment Status
              </CardTitle>
              <CardDescription className="text-gray-400">
                Challenge containers host: {host}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-gray-400">Loading...</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-left">
                      <th className="p-4">Team</th>
                      <th className="p-4">Challenge</th>
                      <th className="p-4">HTTP Port</th>
                      <th className="p-4">SSH Port</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deployments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          No deployments yet. Click "Deploy All" to start.
                        </td>
                      </tr>
                    ) : (
                      deployments.map((dep) => (
                        <tr key={dep._id} className="border-b border-gray-700 text-white">
                          <td className="p-4 font-medium">{dep.teamName}</td>
                          <td className="p-4 text-gray-300">{dep.challengeName}</td>
                          <td className="p-4 text-gray-300">{dep.httpPort}</td>
                          <td className="p-4 text-gray-300">{dep.sshPort}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {statusIcon(dep.status)}
                              <span className="text-sm capitalize">{dep.status}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-400 text-sm">
                            {new Date(dep.updatedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {alert.show && <AlertDialog
        onClose={() => setAlert({ ...alert, show: false })}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />}
    </div>
  )
}
