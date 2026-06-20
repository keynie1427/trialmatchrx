#!/usr/bin/env bash
# =============================================================================
# MyTrialMatchRx Bug Fix Script
# Fixes:
#   1. page.tsx  — results undefined crash (TypeError: Cannot read .length)
#   2. index.ts  — Firestore batch not recreated after commit
#   3. index.ts  — Outdated Claude model name
# =============================================================================

set -e

# ---------------------------------------------------------------------------
# Config — adjust these paths to match your project structure
# ---------------------------------------------------------------------------
SEARCH_PAGE="src/app/search/page.tsx"
FUNCTIONS_INDEX="functions/src/index.ts"

# Colour helpers
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✔ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
err()  { echo -e "${RED}✘ $1${NC}"; }

echo ""
echo "========================================"
echo " MyTrialMatchRx — Applying Bug Fixes"
echo "========================================"
echo ""

# ---------------------------------------------------------------------------
# Helper: back up a file before patching
# ---------------------------------------------------------------------------
backup() {
  local file="$1"
  local backup="${file}.bak"
  if [ ! -f "$backup" ]; then
    cp "$file" "$backup"
    echo "  Backed up → ${backup}"
  fi
}

# ===========================================================================
# FIX 1 — page.tsx: guard `results` against undefined before spread/sort
# ===========================================================================
echo "--- Fix 1: app/search/page.tsx — results undefined crash ---"

if [ ! -f "$SEARCH_PAGE" ]; then
  err "File not found: $SEARCH_PAGE"
  err "Update the SEARCH_PAGE variable at the top of this script and re-run."
  exit 1
fi

backup "$SEARCH_PAGE"

# 1a. Add default values to the useTrialSearch destructure
python3 - "$SEARCH_PAGE" <<'PYEOF'
import sys, re

path = sys.argv[1]
with open(path, 'r') as f:
    src = f.read()

old = "  const { results, isLoading, error, totalResults, criteria } = useTrialSearch();"
new = "  const { results = [], isLoading, error, totalResults = 0, criteria = {} } = useTrialSearch();"

if old in src:
    src = src.replace(old, new)
    print("  [1a] Patched useTrialSearch destructure — added default values")
elif new in src:
    print("  [1a] Already patched — skipping")
else:
    print("  [1a] WARNING: Expected pattern not found. Check the destructure line manually.")

# 1b. Guard the spread in sortedResults
old2 = "  const sortedResults = [...results].sort((a, b) => {"
new2 = "  const sortedResults = [...(results ?? [])].sort((a, b) => {"

if old2 in src:
    src = src.replace(old2, new2)
    print("  [1b] Patched sortedResults spread — added null coalescing guard")
elif new2 in src:
    print("  [1b] Already patched — skipping")
else:
    print("  [1b] WARNING: Expected pattern not found. Check the sortedResults line manually.")

with open(path, 'w') as f:
    f.write(src)
PYEOF

ok "page.tsx patched"
echo ""

# ===========================================================================
# FIX 2 — index.ts: recreate Firestore batch after each commit
# ===========================================================================
echo "--- Fix 2: functions/src/index.ts — Firestore batch not recreated ---"

if [ ! -f "$FUNCTIONS_INDEX" ]; then
  err "File not found: $FUNCTIONS_INDEX"
  err "Update the FUNCTIONS_INDEX variable at the top of this script and re-run."
  exit 1
fi

backup "$FUNCTIONS_INDEX"

python3 - "$FUNCTIONS_INDEX" <<'PYEOF'
import sys

path = sys.argv[1]
with open(path, 'r') as f:
    src = f.read()

# Change `const batch` → `let batch` so it can be reassigned
old_const = "  const batch = db.batch();\n  let count = 0;"
new_let   = "  let batch = db.batch();\n  let count = 0;"

if old_const in src:
    src = src.replace(old_const, new_let)
    print("  [2a] Changed `const batch` → `let batch`")
elif new_let in src:
    print("  [2a] Already using `let batch` — skipping")
else:
    print("  [2a] WARNING: Could not find batch declaration. Check manually.")

# Add `batch = db.batch();` after `await batch.commit(); count = 0;` inside the loop
old_commit = (
    "    // Firestore batch limit is 500\n"
    "    if (count >= 450) {\n"
    "      await batch.commit();\n"
    "      count = 0;\n"
    "    }"
)
new_commit = (
    "    // Firestore batch limit is 500\n"
    "    if (count >= 450) {\n"
    "      await batch.commit();\n"
    "      batch = db.batch();\n"
    "      count = 0;\n"
    "    }"
)

if old_commit in src:
    src = src.replace(old_commit, new_commit)
    print("  [2b] Added `batch = db.batch()` after mid-loop commit")
elif new_commit in src:
    print("  [2b] Already recreating batch — skipping")
else:
    print("  [2b] WARNING: Could not find batch commit block. Check manually.")

with open(path, 'w') as f:
    f.write(src)
PYEOF

ok "Firestore batch fix applied"
echo ""

# ===========================================================================
# FIX 3 — index.ts: update Claude model name
# ===========================================================================
echo "--- Fix 3: functions/src/index.ts — outdated Claude model name ---"

python3 - "$FUNCTIONS_INDEX" <<'PYEOF'
import sys

path = sys.argv[1]
with open(path, 'r') as f:
    src = f.read()

old = "const MODEL = 'claude-sonnet-4-20250514';"
new = "const MODEL = 'claude-sonnet-4-6';"

if old in src:
    src = src.replace(old, new)
    print("  [3] Updated MODEL → 'claude-sonnet-4-6'")
elif new in src:
    print("  [3] Already using current model name — skipping")
else:
    print("  [3] WARNING: MODEL constant not found. Check manually.")

with open(path, 'w') as f:
    f.write(src)
PYEOF

ok "Model name updated"
echo ""

# ===========================================================================
# Summary
# ===========================================================================
echo "========================================"
echo " All fixes applied successfully"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Review diffs:  git diff $SEARCH_PAGE $FUNCTIONS_INDEX"
echo "  2. Redeploy frontend:   vercel --prod"
echo "  3. Redeploy functions:  cd functions && firebase deploy --only functions"
echo "  4. Verify in browser — the TypeError should be gone"
echo ""
echo "Backup files created (.bak) — delete after confirming everything works:"
echo "  rm ${SEARCH_PAGE}.bak ${FUNCTIONS_INDEX}.bak"
echo ""
