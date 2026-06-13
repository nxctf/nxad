import os
import signal
import time
from pathlib import Path
from urllib.request import urlopen, Request

NOTES_DIR = Path("/app/notes")
APP_PY = Path("/app/app.py")
BACKUP_APP = Path("/usr/local/share/nxad/app.py")
BACKUP_MONITOR = Path("/usr/local/share/nxad/health-monitor.py")
FLASK_PORT = int(os.environ.get("PORT", "8000"))
CHECK_INTERVAL = 7
MAX_FAILS = 2

# UID/GID for the team user so restored files have correct ownership
TEAM_UID = os.stat("/app").st_uid
TEAM_GID = os.stat("/app").st_gid


def check_flask():
    req = Request(f"http://127.0.0.1:{FLASK_PORT}/health")
    try:
        resp = urlopen(req, timeout=5)
        return resp.status == 200
    except Exception:
        return False


def check_notes():
    req = Request(f"http://127.0.0.1:{FLASK_PORT}/read?file=welcome.txt")
    try:
        resp = urlopen(req, timeout=5)
        body = resp.read().decode("utf-8", errors="replace")
        return "Welcome to NXAD" in body
    except Exception:
        return False


def fix_notes():
    NOTES_DIR.mkdir(exist_ok=True)
    welcome = NOTES_DIR / "welcome.txt"
    welcome.write_text(
        "Welcome to NXAD sample service. Defend this service and find other teams' flags.\n",
        encoding="utf-8",
    )
    os.chown(str(welcome), TEAM_UID, TEAM_GID)


def restore_app():
    if BACKUP_APP.exists() and (not APP_PY.exists() or APP_PY.stat().st_size == 0):
        APP_PY.write_text(BACKUP_APP.read_text(encoding="utf-8"), encoding="utf-8")
        os.chown(str(APP_PY), TEAM_UID, TEAM_GID)
        return True
    return False


def restart_flask():
    os.kill(1, signal.SIGUSR1)


def main():
    fails = 0
    while True:
        app_restored = restore_app()
        flask_ok = check_flask()
        notes_ok = check_notes() if flask_ok else False

        if flask_ok and notes_ok and not app_restored:
            fails = 0
            time.sleep(CHECK_INTERVAL)
            continue

        if not notes_ok:
            fix_notes()

        restart_flask()
        fails += 1

        if fails > MAX_FAILS:
            restore_app()
            fails = 0

        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()
