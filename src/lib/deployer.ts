import { execSync } from "child_process"
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from "fs"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import connectDB from "@/lib/mongodb"
import Challenge from "@/models/Challenge"
import Deployment from "@/models/Deployment"
import Flag from "@/models/Flag"
import Team from "@/models/Team"

const CHALLENGES_DIR = "/challenges"
const DATA_DIR = join(CHALLENGES_DIR, "data")

interface DeployResult {
  success: boolean
  message: string
  deployments: Array<{
    teamName: string
    challengeName: string
    httpPort: number
    sshPort: number
    sshPassword: string
    status: string
  }>
}

function getEnv(key: string, fallback: string): string {
  return process.env[key] || fallback
}

function generateSshPassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let pwd = ""
  for (let i = 0; i < 12; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}

function calculatePorts(
  teamIndex: number,
  challengeIndex: number,
): { httpPort: number; sshPort: number } {
  const base = parseInt(getEnv("CHALLENGE_PORT_BASE", "10000"), 10)
  const perTeam = parseInt(getEnv("CHALLENGE_PORTS_PER_TEAM", "200"), 10)
  const serviceBase = base + teamIndex * perTeam + challengeIndex * 2
  return { sshPort: serviceBase, httpPort: serviceBase + 1 }
}

function slug(name: string): string {
  return name.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase()
}

async function syncChallengesFromFilesystem() {
  const dirs = readdirSync(CHALLENGES_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())
  for (const dir of dirs) {
    if (dir.name === "data") continue
    const metaFile = join(CHALLENGES_DIR, dir.name, "challenge.json")
    if (!existsSync(metaFile)) continue
    try {
      const meta = JSON.parse(readFileSync(metaFile, "utf-8"))
      const existing = await Challenge.findOne({ name: meta.name })
      if (!existing) {
        await Challenge.create({
          name: meta.name,
          title: meta.title || dir.name,
          description: meta.description || "",
          directory: dir.name,
          dockerfile: meta.dockerfile || "Dockerfile",
          internalHttpPort: meta.internalHttpPort || 8000,
          internalSshPort: meta.internalSshPort || 22,
          enabled: meta.enabled !== false,
        })
      }
    } catch {
      // skip invalid entries
    }
  }
}

export async function deployAll(): Promise<DeployResult> {
  try {
    await connectDB()
    await syncChallengesFromFilesystem()
    await stopAll()

    const challenges = await Challenge.find({ enabled: true }).sort({ name: 1 }).lean()
    if (!challenges.length) {
      return { success: false, message: "No enabled challenges found", deployments: [] }
    }

    const teams = await Team.find({}).lean()
    if (!teams.length) {
      return { success: false, message: "No teams found", deployments: [] }
    }

    try {
      execSync("docker network inspect nxad-challenges 2>/dev/null", { stdio: "ignore" })
    } catch {
      execSync("docker network create nxad-challenges 2>&1", { timeout: 10000 })
    }

    const allDeployments: DeployResult["deployments"] = []

    for (let ci = 0; ci < challenges.length; ci++) {
      const challenge = challenges[ci]
      const templatePath = join(CHALLENGES_DIR, challenge.directory, "docker-compose.yml")

      if (!existsSync(templatePath)) {
        continue
      }

      const template = readFileSync(templatePath, "utf-8")
      const services: string[] = []
      const challengeDeployments: DeployResult["deployments"] = []

      for (let ti = 0; ti < teams.length; ti++) {
        const team = teams[ti]
        const { sshPort, httpPort } = calculatePorts(ti, ci)
        const sshPassword = generateSshPassword()

        let flag = await Flag.findOne({ owner: team.name, challenge: challenge.name }).lean()
        if (!flag) {
          const flagValue = uuidv4()
          flag = await Flag.create({
            value: flagValue,
            owner: team.name,
            challenge: challenge.name,
          })
          await Team.updateOne(
            { name: team.name },
            { $addToSet: { flags: flagValue } },
          )
        }

        await Deployment.findOneAndUpdate(
          { teamName: team.name, challengeName: challenge.name },
          {
            teamName: team.name,
            challengeName: challenge.name,
            httpPort,
            sshPort,
            sshPassword,
            status: "deploying",
            flag: flag.value,
          },
          { upsert: true },
        )

        const challengeContext = join(CHALLENGES_DIR, challenge.directory)

        const service = template
          .replace(/\{\{TEAM_NAME_SLUG\}\}/g, slug(team.name))
          .replace(/\{\{TEAM_NAME\}\}/g, team.name)
          .replace(/\{\{CHALLENGE_NAME\}\}/g, challenge.name)
          .replace(/\{\{CONTEXT\}\}/g, challengeContext)
          .replace(/\{\{CHALLENGE_DIRECTORY\}\}/g, challenge.directory)
          .replace(/\{\{DOCKERFILE\}\}/g, challenge.dockerfile || "Dockerfile")
          .replace(/\{\{FLAG\}\}/g, flag.value)
          .replace(/\{\{SSH_PASSWORD\}\}/g, sshPassword)
          .replace(/\{\{SSH_PORT\}\}/g, String(sshPort))
          .replace(/\{\{HTTP_PORT\}\}/g, String(httpPort))
          .replace(/\{\{INTERNAL_SSH_PORT\}\}/g, String(challenge.internalSshPort || 22))
          .replace(/\{\{INTERNAL_HTTP_PORT\}\}/g, String(challenge.internalHttpPort || 8000))

        services.push(service)

        challengeDeployments.push({
          teamName: team.name,
          challengeName: challenge.name,
          httpPort,
          sshPort,
          sshPassword,
          status: "deploying",
        })
      }

      const challengeDataDir = join(DATA_DIR, challenge.name)
      if (!existsSync(challengeDataDir)) {
        mkdirSync(challengeDataDir, { recursive: true })
      }

      const composeYaml = `services:
${services.join("")}
networks:
  nxad-challenges:
    driver: bridge
    external: true
`

      const composePath = join(challengeDataDir, "docker-compose.yml")
      writeFileSync(composePath, composeYaml, "utf-8")

      try {
        const result = execSync(
          `docker compose -f "${composePath}" up -d --build 2>&1`,
          { timeout: 300000, maxBuffer: 10 * 1024 * 1024 },
        )
        const output = result.toString()
        const containerIdRegex = /(?:Container|Started)\s+(\S+)/g
        let match
        const startedContainers: string[] = []
        while ((match = containerIdRegex.exec(output)) !== null) {
          startedContainers.push(match[1])
        }

        for (const dep of challengeDeployments) {
          const expectedName = `nxad-challenge-${slug(dep.teamName)}-${slug(dep.challengeName)}`
          await Deployment.findOneAndUpdate(
            { teamName: dep.teamName, challengeName: dep.challengeName },
            {
              status: "running",
              containerId: startedContainers.find((c) =>
                c.includes(expectedName),
              ) || "",
            },
          )
          dep.status = "running"
        }
      } catch (err: any) {
        console.error(`Deploy failed for challenge ${challenge.name}:`, err.message)
      }

      allDeployments.push(...challengeDeployments)
    }

    const failed = allDeployments.filter((d) => d.status === "deploying")
    if (failed.length > 0) {
      await Deployment.updateMany(
        { status: "deploying" },
        { status: "failed" },
      )
      for (const dep of failed) dep.status = "failed"
    }

    return {
      success: true,
      message: `Deployed ${allDeployments.length} services across ${challenges.length} challenges`,
      deployments: allDeployments,
    }
  } catch (err: any) {
    await Deployment.updateMany({ status: "deploying" }, { status: "failed" })
    return {
      success: false,
      message: `Deploy failed: ${err.message || err}`,
      deployments: [],
    }
  }
}

export async function stopAll(): Promise<DeployResult> {
  try {
    await connectDB()

    if (existsSync(DATA_DIR)) {
      const challengeDirs = readdirSync(DATA_DIR)
      for (const dir of challengeDirs) {
        const composePath = join(DATA_DIR, dir, "docker-compose.yml")
        if (existsSync(composePath)) {
          try {
            execSync(`docker compose -f "${composePath}" down 2>&1`, { timeout: 120000 })
          } catch {
            // ignore
          }
        }
      }
    }

    try {
      execSync(
        'docker ps -aq --filter "name=nxad-challenge-" | xargs -r docker rm -f 2>&1',
        { timeout: 30000 },
      )
    } catch {}

    await Deployment.deleteMany({})
    try { execSync(`rm -rf "${DATA_DIR}"`, { timeout: 5000 }) } catch {}

    return { success: true, message: "All challenges stopped", deployments: [] }
  } catch (err: any) {
    return {
      success: false,
      message: `Stop failed: ${err.message || err}`,
      deployments: [],
    }
  }
}

export async function getDeployStatus() {
  const deployments = await Deployment.find({}).sort({ teamName: 1, challengeName: 1 }).lean()
  return deployments
}
