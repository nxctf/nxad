FROM python:3.12-alpine AS builder

RUN apk add --no-cache gcc musl-dev

COPY restart.c /tmp/restart.c
RUN gcc -static -o /tmp/nxad-restart /tmp/restart.c && \
    strip /tmp/nxad-restart

FROM python:3.12-alpine

RUN apk add --no-cache openssh-server shadow

COPY --from=builder /tmp/nxad-restart /usr/local/bin/nxad-restart
RUN chmod 4755 /usr/local/bin/nxad-restart && \
    ssh-keygen -A && \
    mkdir -p /run/sshd && \
    mkdir -p /usr/local/share/nxad

WORKDIR /app

COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ .

# Backup original app files for health monitor restore
RUN cp /app/app.py /usr/local/share/nxad/app.py && \
    cp /app/health-monitor.py /usr/local/share/nxad/health-monitor.py

ENV PORT=8000
ENV FLAG=NXAD{sample_flag}
ENV SSH_USER=team
ENV SSH_PASSWORD=changeme

EXPOSE 8000 22

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
