#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/challenges/generated/docker-compose.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "No generated challenge compose file found."
  exit 0
fi

docker compose -f "$COMPOSE_FILE" down
