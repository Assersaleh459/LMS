#!/usr/bin/env bash
# RLS regression suite — runs against the real Supabase Postgres image in Docker.
#
#   bash supabase/tests/rls/run.sh                 # phase2_schema.sql (what prod uses)
#   bash supabase/tests/rls/run.sh phase2.sql      # the other phase-2 variant
#
# Builds a throwaway container: platform stub → schema.sql → phase2 → every migration
# → seed.sql → fixtures, then runs 20_tests.sql as each role (anon, student, parent,
# teachers, admins, chain/MoE, a second school). Each test is rolled back. Exits 1 on
# any FAIL. Requires only Docker.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SB="$(cd "$HERE/../.." && pwd)"
PHASE2="${1:-phase2_schema.sql}"
VERSION="$(cat "$SB/.temp/postgres-version" 2>/dev/null || echo 17.6.1.121)"
IMAGE="supabase/postgres:$VERSION"
C="lms-rls-test-$$"

cleanup() { docker rm -f "$C" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "Starting $IMAGE ..."
docker run -d --name "$C" -e POSTGRES_PASSWORD=postgres "$IMAGE" >/dev/null
# The entrypoint runs init on a temporary server, then restarts; wait for the final one.
ready=0
for _ in $(seq 1 120); do
  if docker logs "$C" 2>&1 | sed -n '/init process complete/,$p' | grep -q "ready to accept connections"; then
    ready=1; break
  fi
  sleep 2
done
[ "$ready" -eq 1 ] || { echo "Postgres did not become ready"; docker logs --tail 20 "$C"; exit 1; }

psql_as() {  # role, extra psql args...
  local role="$1"; shift
  docker exec -i -e PGPASSWORD=postgres -e PGOPTIONS="${PGOPTIONS:-}" "$C" \
    psql -U "$role" -h localhost -d postgres -X -q -v ON_ERROR_STOP=1 "$@"
}
apply() {
  echo "  applying ${1#"$SB"/}"
  PGOPTIONS='-c client_min_messages=warning' psql_as postgres < "$1" >/dev/null \
    || { echo "FAILED applying $1"; exit 1; }
}

PGOPTIONS='-c client_min_messages=warning' psql_as supabase_admin < "$HERE/00_platform_stub.sql" >/dev/null
apply "$SB/schema.sql"
apply "$SB/$PHASE2"
for f in "$SB"/migrations/*.sql; do apply "$f"; done
apply "$SB/seed.sql"
apply "$HERE/10_fixtures.sql"

RESULTS="$(psql_as postgres -t < "$HERE/20_tests.sql" 2>&1 | sed -n 's/^.*NOTICE:  //p')"
PASS="$(grep -c '^PASS' <<<"$RESULTS" || true)"
FAIL="$(grep -c '^FAIL' <<<"$RESULTS" || true)"

grep '^FAIL' <<<"$RESULTS" || true
echo "RLS suite ($PHASE2): $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && [ "$PASS" -gt 0 ]
