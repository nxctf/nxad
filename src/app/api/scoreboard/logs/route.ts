import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import SystemLog from "@/models/SystemLog"
import Flag from "@/models/Flag"

export async function GET() {
  try {
    await connectToDatabase()

    // 1. Fetch system logs
    const dbLogs = await SystemLog.find({}).sort({ createdAt: -1 }).limit(50).lean()

    // 2. Fetch flag submissions to dynamically populate past logs
    const flags = await Flag.find({}).lean()
    const submissionLogs: any[] = []

    for (const flag of flags) {
      for (const sub of flag.submissions) {
        const isSelf = sub.team === flag.owner
        const subTime = new Date(sub.submittedAt)
        const id = `${flag._id}-${sub.team}-${subTime.getTime()}`
        
        submissionLogs.push({
          _id: id,
          type: isSelf ? "self-submit" : "attack",
          team: sub.team,
          target: isSelf ? undefined : flag.owner,
          message: isSelf 
            ? `Team **${sub.team}** successfully validated their own service flag.` 
            : `Team **${sub.team}** successfully breached Team **${flag.owner}** and captured their flag!`,
          createdAt: subTime.toISOString(),
          isDynamic: true
        })
      }
    }

    // Merge logs
    const mergedLogs = [
      ...dbLogs.map((log: any) => ({
        ...log,
        createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt
      })), 
      ...submissionLogs
    ]

    // Sort by timestamp desc and take top 50
    const sortedLogs = mergedLogs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50)

    return NextResponse.json({
      success: true,
      logs: sortedLogs
    })
  } catch (error: any) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
