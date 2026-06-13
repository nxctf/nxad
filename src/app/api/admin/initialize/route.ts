import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Team from "@/models/Team"
import Flag from "@/models/Flag"
import ChatMessage from "@/models/ChatMessage"
import { cookies } from "next/headers"

// Helper function to generate random flags (hashes)
function generateFlags(count: number): string[] {
  const flags: string[] = []
  for (let i = 0; i < count; i++) {
    const uuid = `placeholder-${i}-${Date.now()}`
    flags.push(uuid)
  }
  return flags
}

export async function POST(request: Request) {
  try {
    const adminCookie = cookies().get("admin")
    if (!adminCookie) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { teams } = body

    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid teams data. Expected an array of team objects." },
        { status: 400 },
      )
    }

    await connectToDatabase()

    // Clear existing data
    await Team.deleteMany({})
    await Flag.deleteMany({})
    await ChatMessage.deleteMany({})

    const createdTeams = []

    for (const teamData of teams) {
      if (!teamData.name || !teamData.username || !teamData.password) {
        return NextResponse.json(
          { success: false, message: "Each team must have a name, username, and password." },
          { status: 400 },
        )
      }

      const team = await Team.create({
        name: teamData.name,
        username: teamData.username,
        password: teamData.password,
        score: 0,
        flags: [],
      })

      createdTeams.push({ name: team.name, username: team.username })
    }

    return NextResponse.json({
      success: true,
      message: "Competition initialized successfully. Flags will be generated during challenge deployment.",
      teams: createdTeams,
    })
  } catch (error) {
    console.error("Initialization error:", error)
    return NextResponse.json({ message: "An error occurred during initialization", success: false }, { status: 500 })
  }
}
