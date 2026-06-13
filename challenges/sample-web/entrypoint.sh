#!/bin/sh
set -e

SSH_USER="${SSH_USER:-team}"
SSH_PASSWORD="${SSH_PASSWORD:-changeme}"

id "$SSH_USER" 2>/dev/null || useradd -m -s /bin/sh "$SSH_USER"
echo "$SSH_USER:$SSH_PASSWORD" | chpasswd

printf '%s' "$FLAG" > /flag.txt
chmod 400 /flag.txt

mkdir -p /app/notes
[ -f /app/notes/welcome.txt ] || printf 'Welcome to NXAD sample service.\n' > /app/notes/welcome.txt

chown -R "$SSH_USER:$SSH_USER" /app

/usr/sbin/sshd -D &

# Run health monitor from protected location (team can't touch)
python /usr/local/share/nxad/health-monitor.py &

start_flask() {
    python /app/app.py &
    FLASK_PID=$!
}

restart() {
    kill "$FLASK_PID" 2>/dev/null
    sleep 1
    start_flask
}

trap restart USR1
start_flask

while true; do
    if ! kill -0 "$FLASK_PID" 2>/dev/null; then
        sleep 2
        start_flask
    fi
    sleep 5
done
