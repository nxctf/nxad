import os
from pathlib import Path

from flask import Flask, Response, render_template, request

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
NOTES_DIR = BASE_DIR / "notes"
FLAG_PATH = Path("/flag.txt")


def ensure_runtime_files():
    NOTES_DIR.mkdir(exist_ok=True)
    welcome = NOTES_DIR / "welcome.txt"
    if not welcome.exists():
        welcome.write_text(
            "Welcome to NXAD sample service. Defend this service and find other teams' flags.\n",
            encoding="utf-8",
        )
    if not FLAG_PATH.exists():
        FLAG_PATH.write_text(os.environ.get("FLAG", "NXAD{missing_flag}"), encoding="utf-8")


@app.route("/")
def index():
    return render_template(
        "index.html",
        team=os.environ.get("TEAM_NAME", "unknown"),
        service=os.environ.get("SERVICE_NAME", "sample-web"),
    )


@app.route("/read")
def read_file():
    filename = request.args.get("file", "welcome.txt")

    # Intentionally vulnerable for the sample challenge: path traversal is possible.
    target = NOTES_DIR / filename
    try:
      content = target.read_text(encoding="utf-8")
    except FileNotFoundError:
      return Response("file not found\n", status=404, mimetype="text/plain")
    except OSError:
      return Response("cannot read file\n", status=400, mimetype="text/plain")

    return Response(content, mimetype="text/plain")


@app.route("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    ensure_runtime_files()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))
