import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Deployment from "@/models/Deployment"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const teamCookie = cookieStore.get("team")

  await connectDB()
  const deployments = await Deployment.find({ status: "running" }).lean()

  const host = process.env.HOST_IP || "127.0.0.1"

  // Group by team
  const teamMap: Record<string, any> = {}

  for (const dep of deployments) {
    if (!teamMap[dep.teamName]) {
      teamMap[dep.teamName] = {
        teamName: dep.teamName,
        services: [],
      }
    }
    const currentTeamName = teamCookie ? teamCookie.value : null
    teamMap[dep.teamName].services.push({
      challengeName: dep.challengeName,
      httpPort: dep.httpPort,
      sshPort: dep.sshPort,
      httpUrl: `http://${host}:${dep.httpPort}/`,
      sshCommand: `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p ${dep.sshPort} team@${host}`,
      sshPassword: dep.teamName === currentTeamName ? dep.sshPassword : undefined,
    })
  }

  const allTeams = Object.values(teamMap)
  const currentTeam = teamCookie ? teamCookie.value : null

  return NextResponse.json({
    host,
    currentTeam,
    myServices: currentTeam ? teamMap[currentTeam]?.services || [] : [],
    targets: allTeams.filter((t: any) => t.teamName !== currentTeam),
    allTeams,
  })
}
