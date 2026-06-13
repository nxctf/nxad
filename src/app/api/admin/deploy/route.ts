import { NextResponse } from "next/server"
import { deployAll, stopAll, getDeployStatus } from "@/lib/deployer"
import { cookies } from "next/headers"

async function checkAuth() {
  const cookieStore = await cookies()
  return cookieStore.has("admin")
}

export async function POST() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await deployAll()
  return NextResponse.json(result)
}

export async function DELETE() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await stopAll()
  return NextResponse.json(result)
}

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const status = await getDeployStatus()
  return NextResponse.json(status)
}
