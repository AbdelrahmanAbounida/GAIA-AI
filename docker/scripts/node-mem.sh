#!/bin/sh
set -e

# Detect Docker / K8s memory limit
if [ -f /sys/fs/cgroup/memory.max ]; then
  MEM_LIMIT_BYTES=$(cat /sys/fs/cgroup/memory.max)
elif [ -f /sys/fs/cgroup/memory/memory.limit_in_bytes ]; then
  MEM_LIMIT_BYTES=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes)
else
  MEM_LIMIT_BYTES=""
fi

# Default if unlimited
if [ -z "$MEM_LIMIT_BYTES" ] || [ "$MEM_LIMIT_BYTES" = "max" ]; then
  MEM_MB=4096
else
  MEM_MB=$((MEM_LIMIT_BYTES / 1024 / 1024))
fi

PERCENT=${NODE_MEM_PERCENT:-75}
MAX_OLD_SPACE=$((MEM_MB * PERCENT / 100))

export NODE_OPTIONS="--max-old-space-size=${MAX_OLD_SPACE}"

echo "Using NODE_OPTIONS=${NODE_OPTIONS}"

exec "$@"
