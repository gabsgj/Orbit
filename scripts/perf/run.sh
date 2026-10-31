#!/usr/bin/env bash
# =============================================================================
# run.sh — execute every perf EXPLAIN script and capture timestamped results.
#
# Usage:
#   ./scripts/perf/run.sh
#   DATABASE_URL=postgresql://user:pass@host:5432/db ./scripts/perf/run.sh
#
# Output: scripts/perf/results/<name>-YYYYMMDD.txt  (one per SQL file)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results"
DATE_STAMP="$(date +%Y%m%d)"
DB="${DATABASE_URL:-postgresql://orbit_app:orbit@localhost:5432/orbit}"

mkdir -p "${RESULTS_DIR}"

echo "════════════════════════════════════════════════════════"
echo " Orbit perf evidence run"
echo " DB:      ${DB}"
echo " Results: ${RESULTS_DIR}"
echo " Date:    ${DATE_STAMP}"
echo "════════════════════════════════════════════════════════"

for sql in "${SCRIPT_DIR}"/explain-*.sql; do
  name="$(basename "${sql}" .sql)"
  out="${RESULTS_DIR}/${name}-${DATE_STAMP}.txt"
  echo ""
  echo "▸ Running ${name} → ${out}"
  psql "${DB}" \
    --set ON_ERROR_STOP=1 \
    --echo-all \
    --file="${sql}" \
    2>&1 | tee "${out}"
  echo "  ✔ done (${out})"
done

echo ""
echo "All perf evidence captured in ${RESULTS_DIR}/"
echo "Review with:  ls -la ${RESULTS_DIR}/"
