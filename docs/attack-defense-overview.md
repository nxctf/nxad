# Attack-Defense Overview

Attack-Defense is a CTF format where every team usually runs the same vulnerable service. Teams must keep their own service alive, patch vulnerabilities, and attack other teams to steal flags.

## Main Roles

- **NXAD**: scoreboard, flag submission, admin panel, team management, scoring, and passive points.
- **Challenge VM or service**: the actual vulnerable target that teams attack and defend.
- **Team**: defends their own service and attacks other teams.
- **Admin**: creates teams, assigns flags, monitors scoreboard, and manages competition state.

## Basic Flow

1. Admin creates teams in NXAD.
2. Admin generates or assigns flags for each team.
3. Each team gets a VM/container/service with their own flag inside it.
4. Teams login to their own VM/service and patch/defend it.
5. Teams scan and exploit other teams' services to read their flags.
6. Captured flags are submitted to NXAD.
7. NXAD calculates points and updates the scoreboard.

## Scoring Model In This Project

- **Attack points** (default: +100): gained when a team submits another team's flag.
- **Defense penalty** (default: -25): deducted from the owner when their flag is captured.
- **Self flag points** (default: +25): awarded when a team submits its own flag via the service vulnerability.
- **Passive points** (default: +1 per 5 min per non-submitting team): calculated as `(total_teams - 1) - teams_that_submitted_your_flag`. The more teams that capture your flag, the fewer passive points you earn.

## What NXAD Does Not Do Yet

NXAD is not currently an automatic VM provisioner. It does not create Vulnbox VMs, deploy services, rotate flags, or check service availability by itself.

You still need to prepare the challenge infrastructure manually or with your own automation.

## Recommended Simple Architecture

```txt
Admin Browser
    |
    v
NXAD Web App + MongoDB
    |
    v
Scoreboard / Flag Submission

Teams Network
├── team01 VM/service
├── team02 VM/service
├── team03 VM/service
└── teamXX VM/service
```

## Common Competition Pattern

- Every team gets an identical vulnerable service.
- Every team has a different secret flag.
- Services are reachable from other teams.
- Teams are allowed to patch their own service.
- Teams are not allowed to destroy infrastructure, attack NXAD, or attack out-of-scope machines.

## Minimal Example

If you have 3 teams:

```txt
team01 owns flag: NXAD{team01_secret}
team02 owns flag: NXAD{team02_secret}
team03 owns flag: NXAD{team03_secret}
```

Then:

- `team01` submits `NXAD{team02_secret}` and gets attack points.
- `team02` loses defense penalty.
- `team02` submitting `NXAD{team02_secret}` is treated as own-flag behavior.

## Practical Advice

- Start with one simple vulnerable web service before making many services.
- Keep the network simple for the first event.
- Test flag submission before the event starts.
- Make sure teams can reach each other's services.
- Keep NXAD separated from the attack network if possible.
