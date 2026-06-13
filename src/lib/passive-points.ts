import connectToDatabase from "./mongodb"
import Team from "@/models/Team"
import Flag from "@/models/Flag"
import SystemLog from "@/models/SystemLog"
import { getCurrentConfig } from "./config"

// Store the interval ID so we can clear it later
let passivePointsInterval: NodeJS.Timeout | null = null

// Store the status of the passive points mechanism
const passivePointsStatus = {
  running: false,
  lastRun: null as Date | null,
  nextRun: null as Date | null,
  pointsAwarded: 0,
  startedAt: null as Date | null,
  scheduledStart: null as Date | null,
  scheduledEnd: null as Date | null,
}

// Function to check if we're within the scheduled time window
function isWithinScheduledTime(): boolean {
  const now = new Date()

  // If no schedule is set, always allow
  if (!passivePointsStatus.scheduledStart && !passivePointsStatus.scheduledEnd) {
    return true
  }

  // Check start time
  if (passivePointsStatus.scheduledStart && now < passivePointsStatus.scheduledStart) {
    return false
  }

  // Check end time
  if (passivePointsStatus.scheduledEnd && now > passivePointsStatus.scheduledEnd) {
    return false
  }

  return true
}

// Function to award passive points
export async function awardPassivePoints() {
  try {
    console.log("Running passive points calculation...")

    // Check if we're within the scheduled time window
    if (!isWithinScheduledTime()) {
      console.log("Outside scheduled time window, skipping passive points award")

      // Update next run time using current config
      const config = getCurrentConfig()
      const now = new Date()
      passivePointsStatus.nextRun = new Date(now.getTime() + config.PASSIVE_POINTS_INTERVAL)

      return { pointsAwarded: 0, skipped: true, reason: "Outside scheduled time window" }
    }

    // Connect to database
    await connectToDatabase()

    // Get current configuration
    const config = getCurrentConfig()

    // Get total teams for point calculation
    const totalTeams = await Team.countDocuments({})
    const otherTeamCount = Math.max(0, totalTeams - 1)

    // Get all flags
    const flags = await Flag.find({})

    // Track points awarded in this run
    let pointsAwarded = 0
    const awardDetails: Array<{ team: string; points: number }> = []

    // Process each flag
    for (const flag of flags) {
      // Count how many OTHER teams have submitted this flag
      const otherSubmissions = flag.submissions.filter((submission) => submission.team !== flag.owner)

      // Points = (total other teams) - (teams that already submitted)
      // Max = otherTeamCount (if no one submitted), Min = 0 (if all submitted)
      const points = Math.max(0, otherTeamCount - otherSubmissions.length)

      if (points > 0) {
        const ownerTeam = await Team.findOne({ name: flag.owner })

        if (ownerTeam) {
          ownerTeam.score += points
          await ownerTeam.save()
          pointsAwarded += points
          awardDetails.push({ team: flag.owner, points })

          console.log(
            `Awarded ${points} passive point(s) to ${flag.owner} for flag (${otherSubmissions.length}/${otherTeamCount} other teams submitted)`,
          )
        }
      }
    }

    // Log the passive points calculation event
    if (pointsAwarded > 0) {
      const detailsText = awardDetails
        .map((a) => `**${a.team}** (+${a.points} pts)`)
        .join(", ")

      await SystemLog.create({
        type: "passive-points",
        points: pointsAwarded,
        message: `Calculated passive points. Awarded to: ${detailsText}.`,
        details: awardDetails,
      })
    } else {
      await SystemLog.create({
        type: "passive-points",
        points: 0,
        message: `Calculated passive points. No points awarded (all services breached or no teams registered).`,
        details: [],
      })
    }

    // Update status
    const now = new Date()
    passivePointsStatus.lastRun = now
    passivePointsStatus.nextRun = new Date(now.getTime() + config.PASSIVE_POINTS_INTERVAL)
    passivePointsStatus.pointsAwarded += pointsAwarded

    console.log(`Passive points run complete. Awarded ${pointsAwarded} points.`)

    return { pointsAwarded }
  } catch (error) {
    console.error("Error in passive points calculation:", error)
    return { error: "Failed to award passive points" }
  }
}

// Function to restart passive points with new interval
export function restartPassivePointsWithNewInterval() {
  if (passivePointsInterval) {
    console.log("Restarting passive points mechanism with new interval...")

    // Stop current interval
    clearInterval(passivePointsInterval)

    // Get current config
    const config = getCurrentConfig()

    // Start new interval with updated configuration
    passivePointsInterval = setInterval(awardPassivePoints, config.PASSIVE_POINTS_INTERVAL)

    // Update next run time
    const now = new Date()
    passivePointsStatus.nextRun = new Date(now.getTime() + config.PASSIVE_POINTS_INTERVAL)

    console.log(`Passive points restarted with ${config.PASSIVE_POINTS_INTERVAL}ms interval`)

    return true
  }
  return false
}

// Function to start the passive points mechanism
export function startPassivePoints(scheduledStart?: string, scheduledEnd?: string) {
  // If already running, don't start again
  if (passivePointsInterval) {
    return {
      success: false,
      message: "Passive points mechanism is already running",
      status: getPassivePointsStatus(),
    }
  }

  // Set scheduled times if provided
  if (scheduledStart) {
    passivePointsStatus.scheduledStart = new Date(scheduledStart)
  }
  if (scheduledEnd) {
    passivePointsStatus.scheduledEnd = new Date(scheduledEnd)
  }

  // Get current configuration
  const config = getCurrentConfig()

  // Start the interval using current configured interval
  passivePointsInterval = setInterval(awardPassivePoints, config.PASSIVE_POINTS_INTERVAL)

  // Update status
  const now = new Date()
  passivePointsStatus.running = true
  passivePointsStatus.startedAt = now
  passivePointsStatus.nextRun = new Date(now.getTime() + config.PASSIVE_POINTS_INTERVAL)

  // Run immediately for the first time
  awardPassivePoints()

  console.log("Passive points mechanism started")
  console.log(
    `Interval: ${config.PASSIVE_POINTS_INTERVAL}ms (${Math.floor(config.PASSIVE_POINTS_INTERVAL / 60000)} minutes)`,
  )
  console.log(`Points per flag: ${config.PASSIVE_POINTS_VALUE}`)
  if (scheduledStart) {
    console.log(`Scheduled to start at: ${passivePointsStatus.scheduledStart}`)
  }
  if (scheduledEnd) {
    console.log(`Scheduled to end at: ${passivePointsStatus.scheduledEnd}`)
  }

  return {
    success: true,
    message: "Passive points mechanism started",
    status: getPassivePointsStatus(),
  }
}

// Function to stop the passive points mechanism
export function stopPassivePoints() {
  // If not running, nothing to stop
  if (!passivePointsInterval) {
    return {
      success: false,
      message: "Passive points mechanism is not running",
      status: getPassivePointsStatus(),
    }
  }

  // Clear the interval
  clearInterval(passivePointsInterval)
  passivePointsInterval = null

  // Update status
  passivePointsStatus.running = false
  passivePointsStatus.nextRun = null

  console.log("Passive points mechanism stopped")

  return {
    success: true,
    message: "Passive points mechanism stopped",
    status: getPassivePointsStatus(),
  }
}

// Function to update the schedule
export function updatePassivePointsSchedule(scheduledStart?: string, scheduledEnd?: string) {
  if (scheduledStart) {
    passivePointsStatus.scheduledStart = new Date(scheduledStart)
  }
  if (scheduledEnd) {
    passivePointsStatus.scheduledEnd = new Date(scheduledEnd)
  }

  console.log("Passive points schedule updated")
  if (scheduledStart) {
    console.log(`New start time: ${passivePointsStatus.scheduledStart}`)
  }
  if (scheduledEnd) {
    console.log(`New end time: ${passivePointsStatus.scheduledEnd}`)
  }

  return {
    success: true,
    message: "Schedule updated successfully",
    status: getPassivePointsStatus(),
  }
}

// Function to get the current status
export function getPassivePointsStatus() {
  const config = getCurrentConfig()

  return {
    running: passivePointsStatus.running,
    lastRun: passivePointsStatus.lastRun ? passivePointsStatus.lastRun.toISOString() : null,
    nextRun: passivePointsStatus.nextRun ? passivePointsStatus.nextRun.toISOString() : null,
    pointsAwarded: passivePointsStatus.pointsAwarded,
    startedAt: passivePointsStatus.startedAt ? passivePointsStatus.startedAt.toISOString() : null,
    scheduledStart: passivePointsStatus.scheduledStart ? passivePointsStatus.scheduledStart.toISOString() : null,
    scheduledEnd: passivePointsStatus.scheduledEnd ? passivePointsStatus.scheduledEnd.toISOString() : null,
    interval: config.PASSIVE_POINTS_INTERVAL,
    withinSchedule: isWithinScheduledTime(),
    passivePointsValue: config.PASSIVE_POINTS_VALUE,
  }
}

// Function to get the interval in milliseconds
export function getPassivePointsInterval() {
  const config = getCurrentConfig()
  return config.PASSIVE_POINTS_INTERVAL
}
