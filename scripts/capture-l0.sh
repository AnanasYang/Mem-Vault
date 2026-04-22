#!/bin/bash
# L0 Capture Script - Extract today's conversations from OpenClaw sessions
# Usage: ./capture-l0.sh [YYYY-MM-DD]

set -e

# Config
SESSIONS_DIR="${HOME}/.openclaw/agents/main/sessions"
OUTPUT_DIR="${HOME}/.openclaw/workspace/memory-core/Memory/L0-state"
DATE="${1:-$(date +%Y-%m-%d)}"
OUTPUT_FILE="${OUTPUT_DIR}/daily-${DATE}.jsonl"

# Ensure output directory exists
mkdir -p "${OUTPUT_DIR}"

# Convert date to timestamps for filtering
START_TS=$(date -d "${DATE} 00:00:00" +%s%3N 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "${DATE} 00:00:00" +%s000)
END_TS=$(date -d "${DATE} 23:59:59.999" +%s%3N 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "${DATE} 23:59:59" +%s000)

echo "📥 Capturing L0 for ${DATE}..."
echo "   Output: ${OUTPUT_FILE}"

# Temporary file for processing
TEMP_FILE=$(mktemp)
trap "rm -f ${TEMP_FILE}" EXIT

# Find all jsonl files (excluding deleted/reset backups)
find "${SESSIONS_DIR}" -maxdepth 1 -name "*.jsonl" ! -name "*.deleted.*" ! -name "*.reset.*" -type f | while read -r session_file; do
    SESSION_ID=$(basename "${session_file}" .jsonl)
    
    # Extract message entries for the target date
    jq -r --arg session_id "${SESSION_ID}" --argjson start_ts "${START_TS}" --argjson end_ts "${END_TS}" '
        select(.type == "message" and .timestamp != null) |
        select((.timestamp | sub("\\.[0-9]+Z?$"; "Z") | fromdateiso8601 * 1000) >= $start_ts) |
        select((.timestamp | sub("\\.[0-9]+Z?$"; "Z") | fromdateiso8601 * 1000) <= $end_ts) |
        {
            ts: .timestamp,
            role: .message.role,
            content: (.message.content | if type == "array" then map(select(.type == "text") | .text) | join("") else . end),
            sessionId: $session_id
        } | select(.content != null and .content != "") | tostring
    ' "${session_file}" 2>/dev/null
done | jq -s 'sort_by(.ts)' | jq -c '.[]' > "${TEMP_FILE}" 2>/dev/null || true

# Move temp file to final output
if [ -s "${TEMP_FILE}" ]; then
    mv "${TEMP_FILE}" "${OUTPUT_FILE}"
    COUNT=$(wc -l < "${OUTPUT_FILE}")
    echo "✅ Captured ${COUNT} messages to ${OUTPUT_FILE}"
else
    echo "⚠️ No messages found for ${DATE}"
    touch "${OUTPUT_FILE}"
fi

# List the output file
ls -la "${OUTPUT_FILE}"
