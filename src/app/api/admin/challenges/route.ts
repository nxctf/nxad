import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Challenge from "@/models/Challenge"
import { cookies } from "next/headers"

async function checkAuth() {
  const cookieStore = await cookies()
  return cookieStore.has("admin")
}

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await connectDB()
  const challenges = await Challenge.find({}).sort({ name: 1 }).lean()
  return NextResponse.json(challenges)
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    await connectDB()
    const { name, title, description, directory, dockerfile, internalHttpPort, internalSshPort, enabled } = body

    if (!name || !title || !directory) {
      return NextResponse.json({ error: "name, title, and directory are required" }, { status: 400 })
    }

    const existing = await Challenge.findOne({ name })
    if (existing) {
      return NextResponse.json({ error: "Challenge with this name already exists" }, { status: 409 })
    }

    const challenge = await Challenge.create({
      name,
      title,
      description: description || "",
      directory,
      dockerfile: dockerfile || "Dockerfile",
      internalHttpPort: internalHttpPort || 8000,
      internalSshPort: internalSshPort || 22,
      enabled: enabled !== false,
    })

    return NextResponse.json(challenge, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
