# Simple Container Challenge

This setup deploys one vulnerable web container per team. Each container receives one flag from NXAD's MongoDB data.

## Model

```txt
1 team = 1 container = 1 service = 1 flag
```

Example for 4 teams:

```txt
team01 -> nxad-challenge-team01 -> http://localhost:10001 -> team01 flag
team02 -> nxad-challenge-team02 -> http://localhost:10201 -> team02 flag
team03 -> nxad-challenge-team03 -> http://localhost:10401 -> team03 flag
team04 -> nxad-challenge-team04 -> http://localhost:10601 -> team04 flag
```

Note: the default base port is 10000. If `CHALLENGE_PORT_BASE` is not set, the system starts at 10000 so it does not conflict with other services.

## Files

```txt
challenges/sample-web/              # reusable challenge template with template docker-compose.yml
```

## Before Deploying

1. Start NXAD:

```bash
docker compose up -d
```

2. Login admin:

```txt
http://<nxad-host>:3000/admin/login
```

3. Create or initialize teams in the admin panel.

## Deploy Challenges

From the admin panel:

1. Navigate to **Deploy** (`/admin/deploy`)
2. Click **"Deploy All"**

The system will:

- Auto-scan challenge templates from `challenges/` directories.
- Read teams from MongoDB.
- Generate per-challenge docker-compose files in `challenges/data/<challenge>/docker-compose.yml`.
- Build and run one challenge container per team per challenge.

Default base port is `10000`. To use a different base port:

```bash
CHALLENGE_PORT_BASE=8000 docker compose up -d
```

## Stop Challenges

```bash
./scripts/stop-challenges.sh
```

## Sample Vulnerability

The sample web service has an intentional path traversal vulnerability:

```txt
/read?file=welcome.txt
```

The flag is stored at:

```txt
/flag.txt (owned by root, read-only)
```

Attack example:

```bash
# From attacker team's container, fetch another team's flag:
curl "http://<target-ip>:10001/read?file=../../flag.txt"
```

Teams cannot delete or modify `/flag.txt` even with sudo.

Submit the captured flag value to NXAD at `/login`.

## SSH Access For Patching

Each team gets SSH access to their own container. Credentials are visible on the team dashboard:

```txt
Team a  http://localhost:10001 | SSH: localhost:10000 user=team pass=d9bab424263b
Team b  http://localhost:10201 | SSH: localhost:10200 user=team pass=1b024be49ac4
```

SSH into your container:

```bash
ssh -p 10000 team@<host-ip>
```

Once inside, view the flag:

```bash
cat /flag.txt
```

Patch the vulnerability by editing the source code:

```bash
vi /app/app.py
```

The vuln is in the `read_file()` function. To patch it, add path validation:

```python
# Add above: target = NOTES_DIR / filename
if ".." in filename or filename.startswith("/"):
    return Response("forbidden", status=403)
```

or fixed cepet
```bash
sed -i 's/target = NOTES_DIR \/ filename/target = NOTES_DIR \/ filename\n    if ".." in filename or filename.startswith("/"):\n        return Response("forbidden", status=403)/' /app/app.py
nxad-restart
```

Restart the service after patching (SUID binary, runs as root):

```bash
nxad-restart
```

Now attackers can no longer read your flag.

Note: if you break the service entirely, a health monitor will auto-restart it within 7 seconds. If you delete `notes/welcome.txt`, the monitor will regenerate it. This prevents permanent damage, but a clean patch is still up to you.

## How Teams Play

- Team defends their own container (patch the vuln).
- Team attacks other teams' exposed ports.
- Captured flags are submitted to NXAD.
- NXAD updates attack/defense score.
- Flags stay in the container permanently — defense means blocking attackers, not deleting the flag.

## Scaling Later

After this works, you can move to:

- 1 team = 1 VM with many services.
- 1 service = 1 flag.
- `flagsPerTeam` equals number of services.
- 4 teams and 3 services means 12 flags total.
