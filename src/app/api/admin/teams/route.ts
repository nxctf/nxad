import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import connectToDatabase from "@/lib/mongodb"
import Team from "@/models/Team"

// Create a new team
export async function GET() {
  try {
    const adminCookie = cookies().get("admin")
    if (!adminCookie) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }
    await connectToDatabase()
    const teams = await Team.find({}).sort({ name: 1 })
    return NextResponse.json({ success: true, teams })
  } catch (error) {
    console.error("Get teams error:", error)
    return NextResponse.json({ message: "An error occurred fetching teams", success: false }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Check if admin is authenticated
    const adminCookie = cookies().get("admin")
    if (!adminCookie) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const { name, username, password } = await request.json()

    // Validate input
    if (!name || !username || !password) {
      return NextResponse.json(
        { message: "Name, username, and password are required", success: false },
        { status: 400 },
      )
    }

    // Connect to database
    await connectToDatabase()

    // Check if team with this name or username already exists
    const existingTeam = await Team.findOne({ $or: [{ name }, { username }] })
    if (existingTeam) {
      return NextResponse.json(
        { message: "A team with this name or username already exists", success: false },
        { status: 400 },
      )
    }

    // Create team (flags are auto-generated during challenge deployment)
    const team = await Team.create({
      name,
      username,
      password,
      score: 0,
      flags: [],
    })

    return NextResponse.json({
      success: true,
      message: "Team created successfully",
      team: {
        name: team.name,
        username: team.username,
        score: team.score,
        flags: team.flags,
      },
    })
  } catch (error) {
    console.error("Create team error:", error)
    return NextResponse.json({ message: "An error occurred creating the team", success: false }, { status: 500 })
  }
}
