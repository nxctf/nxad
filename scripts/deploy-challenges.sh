#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GENERATED_DIR="$ROOT_DIR/challenges/generated"
COMPOSE_FILE="$GENERATED_DIR/docker-compose.yml"
BASE_PORT="${CHALLENGE_BASE_PORT:-9000}"
SSH_BASE_PORT="${CHALLENGE_SSH_BASE_PORT:-9022}"

mkdir -p "$GENERATED_DIR"

if ! docker compose -f "$ROOT_DIR/docker-compose.yml" ps --status running mongodb >/dev/null 2>&1; then
  echo "MongoDB service is not running. Start NXAD first with: docker compose up -d"
  exit 1
fi

MONGO_JS="$(mktemp)"
trap 'rm -f "$MONGO_JS"' EXIT

cat > "$MONGO_JS" <<'EOF'
const target = db.getSiblingDB(process.env.MONGODB_DATABASE || "nxad");
target.teams.find({}, { name: 1, flags: 1, _id: 0 }).sort({ name: 1 }).forEach((team) => {
  const flag = Array.isArray(team.flags) ? team.flags[0] : null;
  if (team.name && flag) print(team.name + "\t" + flag);
});
EOF

docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T mongodb sh -c '
mongosh --quiet -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --file /dev/stdin
' < "$MONGO_JS" > "$GENERATED_DIR/teams.txt"

TEAM_LINES="$(cat "$GENERATED_DIR/teams.txt")"

if [ -z "$TEAM_LINES" ]; then
  echo "No teams with flags found. Create teams from the NXAD admin panel first."
  exit 1
fi

cat > "$COMPOSE_FILE" <<'YAML'
services:
YAML

index=0
while IFS='' read -r line; do
  team="${line%%$'\t'*}"
  flag="${line#*$'\t'}"

  [ -n "$team" ] || continue
  [ -n "$flag" ] || continue
  [ "$team" = "$flag" ] && continue

  safe_team="$(printf '%s' "$team" | tr -cs '[:alnum:]' '-' | tr '[:upper:]' '[:lower:]' | sed 's/^-//; s/-$//')"
  [ -n "$safe_team" ] || safe_team="team-$index"
  port=$((BASE_PORT + index))
  ssh_port=$((SSH_BASE_PORT + index))
  ssh_pass="$(openssl rand -hex 6)"

  cat >> "$COMPOSE_FILE" <<YAML
  nxad-challenge-$safe_team:
    build:
      context: ../sample-web
    container_name: nxad-challenge-$safe_team
    restart: unless-stopped
    environment:
      TEAM_NAME: "$team"
      SERVICE_NAME: "sample-web"
      FLAG: "$flag"
      SSH_USER: "team"
      SSH_PASSWORD: "$ssh_pass"
    ports:
      - "$port:8000"
      - "$ssh_port:22"
    networks:
      - nxad-challenges

YAML

  printf 'Team %-20s http://localhost:%-4s | SSH: localhost:%-4s user=team pass=%s\n' "$team" "$port" "$ssh_port" "$ssh_pass"
  index=$((index + 1))
done <<< "$TEAM_LINES"

cat >> "$COMPOSE_FILE" <<'YAML'
networks:
  nxad-challenges:
    driver: bridge
YAML

echo "Generated $COMPOSE_FILE"
docker compose -f "$COMPOSE_FILE" up -d --build
