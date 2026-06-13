# Challenge And VM Setup Guide

This guide explains what you need to prepare when creating Attack-Defense challenges for NXAD.

## What You Need

- NXAD running and accessible by admins/teams.
- One VM, container, or service instance per team.
- One or more vulnerable services.
- A unique flag per team, per service if needed.
- Network rules that allow teams to attack other team services.
- Clear rules for what is in scope.

## Recommended First Setup

For your first event, use one vulnerable web service and one VM/container per team.

Example:

```txt
NXAD: 192.168.56.101:3000

team01 service: 192.168.56.111:8080
team02 service: 192.168.56.112:8080
team03 service: 192.168.56.113:8080
```

## Step 1: Create Teams In NXAD

Open admin panel:

```txt
http://<nxad-ip>:3000/admin/login
```

Then create teams from the admin panel. Each team needs:

- Team name
- Username
- Password

If you use the initialize page, NXAD can generate flags for teams automatically.

## Step 2: Put Flags Into Team Services

Each team-owned service must contain that team's flag.

Example for `team01`:

```txt
/opt/challenge/flag.txt
NXAD{team01_generated_flag}
```

Example for `team02`:

```txt
/opt/challenge/flag.txt
NXAD{team02_generated_flag}
```

The value inside the service must match the flag stored in NXAD.

## Step 3: Deploy Identical Vulnerable Services

Each team should receive the same service code, but with a different flag.

Simple service layout:

```txt
/opt/challenge/
├── app.py
├── flag.txt
└── docker-compose.yml
```

The vulnerability should allow attackers to read or derive the flag, but defenders should be able to patch it.

## Step 4: Give Teams Access

Give each team access only to their own VM/container.

Example:

```txt
team01 -> SSH to 192.168.56.111
team02 -> SSH to 192.168.56.112
team03 -> SSH to 192.168.56.113
```

Teams should not have admin access to NXAD or other team boxes.

## Step 5: Test Before Starting

Before the event:

- Login as admin.
- Confirm teams exist.
- Confirm flags exist in NXAD.
- Confirm each VM/service contains the correct flag.
- Try submitting another team's flag from a test team account.
- Confirm scoreboard updates.
- Confirm team services are reachable from other teams.

## VM vs Docker

Use **VMs** if:

- You want teams to SSH and patch the whole machine.
- You want realistic infra.
- You need stronger isolation.

Use **Docker containers** if:

- You want fast setup.
- You only need web/service challenges.
- You are running a smaller internal event.

For beginners, Docker is easier. For a more realistic Attack-Defense event, VMs are better.

## Flag Strategy

Use one unique flag per team per challenge.

Example:

```txt
team01-web: NXAD{...}
team02-web: NXAD{...}
team03-web: NXAD{...}
```

Avoid using the same flag for every team, because NXAD needs to know which team owns each flag.

## Simple Manual Workflow

1. Create teams in NXAD.
2. Copy each generated flag from admin panel.
3. Put the matching flag into that team's VM/service.
4. Start all services.
5. Let teams login to NXAD and their own VM.
6. Start the competition.

## Example Challenge Idea

Create a small vulnerable Flask app:

- `/` shows service status.
- `/profile?file=...` has path traversal.
- `flag.txt` is stored on disk.
- Teams can patch path traversal after they find it.
- Attackers exploit other teams before they patch.

## Important Rules To Write For Teams

- Do not attack NXAD.
- Do not attack infrastructure outside assigned IP ranges.
- Do not delete other teams' services permanently.
- Do not perform destructive attacks unless explicitly allowed.
- Keep your service online.
- Submit captured flags only through NXAD.

## Recommended Network Separation

```txt
Admin network:
- NXAD
- MongoDB
- Admin browser

Team network:
- Team VMs/services
- Team clients
```

If possible, keep MongoDB inaccessible from teams.

## Next Improvements You Can Build Later

- Service health checker.
- Automatic VM/container provisioning.
- Automatic flag injection.
- Flag rotation per round.
- SLA scoring based on service uptime.
- Per-service scoreboard.
