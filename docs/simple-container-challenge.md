# Simple Container Challenge

This setup deploys one vulnerable web container per team. Each container receives one flag from NXAD's MongoDB data.

## Model

```txt
1 team = 1 container = 1 service = 1 flag
```

Example for 4 teams:

```txt
team01 -> nxad-challenge-team01 -> http://localhost:9000 -> team01 flag
team02 -> nxad-challenge-team02 -> http://localhost:9001 -> team02 flag
team03 -> nxad-challenge-team03 -> http://localhost:9002 -> team03 flag
team04 -> nxad-challenge-team04 -> http://localhost:9003 -> team04 flag
```

Note: the default base port is 9000. If `CHALLENGE_BASE_PORT` is not set, the script starts at 9000 so it does not conflict with other services.

## Files

```txt
challenges/sample-web/              # reusable challenge template
challenges/generated/docker-compose.yml
scripts/deploy-challenges.sh        # generates and starts team containers
scripts/stop-challenges.sh          # stops generated challenge containers
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

3. Create or initialize teams.

For the simplest setup, use `1` flag per team. If the admin UI generates 5 flags per team, this deploy script will use the first flag for each team.

## Deploy Challenges

```bash
./scripts/deploy-challenges.sh
```

The script will:

- Read teams from NXAD MongoDB.
- Take the first flag owned by each team.
- Generate `challenges/generated/docker-compose.yml`.
- Build and run one challenge container per team.

Default ports start at `9000`.

To use a different base port:

```bash
CHALLENGE_BASE_PORT=8000 CHALLENGE_SSH_BASE_PORT=8022 ./scripts/deploy-challenges.sh
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
curl "http://<target-ip>:9000/read?file=../../flag.txt"
```

Teams cannot delete or modify `/flag.txt` even with sudo.

Submit the captured flag value to NXAD at `/login`.

## SSH Access For Patching

Each team gets SSH access to their own container. The deploy script prints credentials:

```txt
Team a  http://localhost:9000 | SSH: localhost:9022 user=team pass=d9bab424263b
Team b  http://localhost:9001 | SSH: localhost:9023 user=team pass=1b024be49ac4
```

SSH into your container:

```bash
ssh -p 9022 team@<host-ip>
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
