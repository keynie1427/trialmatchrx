#!/usr/bin/env bash
# =============================================================================
# MyTrialMatchRx — Fix Firebase Functions v2 TypeScript Errors
# Fixes `.schedule().onRun(context)` v1 syntax → v2 `onSchedule()` syntax
# =============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ok()  { echo -e "${GREEN}✔ $1${NC}"; }
err() { echo -e "${RED}✘ $1${NC}"; }

FUNCTIONS_INDEX="functions/src/index.ts"

if [ ! -f "$FUNCTIONS_INDEX" ]; then
  err "File not found: $FUNCTIONS_INDEX — run this from your project root"
  exit 1
fi

# Back up
cp "$FUNCTIONS_INDEX" "${FUNCTIONS_INDEX}.bak2"
echo "Backed up → ${FUNCTIONS_INDEX}.bak2"
echo ""

python3 - "$FUNCTIONS_INDEX" <<'PYEOF'
import sys

path = sys.argv[1]
with open(path, 'r') as f:
    src = f.read()

# ---------------------------------------------------------------------------
# 1. Add onSchedule to the firebase-functions/v2 import at the top
#    The file currently imports: import * as functions from 'firebase-functions';
#    We add a v2 scheduler import below it.
# ---------------------------------------------------------------------------
old_import = "import * as functions from 'firebase-functions';"
new_import  = (
    "import * as functions from 'firebase-functions';\n"
    "import { onSchedule } from 'firebase-functions/v2/scheduler';"
)

if "from 'firebase-functions/v2/scheduler'" not in src:
    if old_import in src:
        src = src.replace(old_import, new_import)
        print("  [1] ✔ Added firebase-functions/v2/scheduler import")
    else:
        print("  [1] ✘ Could not find firebase-functions import line — check manually")
else:
    print("  [1] Already importing v2/scheduler — skipping")

# ---------------------------------------------------------------------------
# 2. Fix syncTrials: v1 pubsub.schedule().onRun(context) → v2 onSchedule()
# ---------------------------------------------------------------------------
old_sync = (
    "export const syncTrials = functions.pubsub\n"
    "  .schedule('every 24 hours')\n"
    "  .onRun(async (context) => {"
)
new_sync = (
    "export const syncTrials = onSchedule('every 24 hours', async () => {"
)

if old_sync in src:
    src = src.replace(old_sync, new_sync)
    print("  [2] ✔ Fixed syncTrials → onSchedule('every 24 hours')")
elif "onSchedule('every 24 hours'" in src:
    print("  [2] Already using v2 onSchedule — skipping")
else:
    print("  [2] ✘ Could not find syncTrials declaration — check manually")

# ---------------------------------------------------------------------------
# 3. Fix processAlerts: v1 pubsub.schedule().timeZone().onRun(context) → v2
# ---------------------------------------------------------------------------
old_alerts = (
    "export const processAlerts = functions.pubsub\n"
    "  .schedule('every monday 09:00')\n"
    "  .timeZone('America/New_York')\n"
    "  .onRun(async (context) => {"
)
new_alerts = (
    "export const processAlerts = onSchedule(\n"
    "  { schedule: 'every monday 09:00', timeZone: 'America/New_York' },\n"
    "  async () => {"
)

if old_alerts in src:
    src = src.replace(old_alerts, new_alerts)
    print("  [3] ✔ Fixed processAlerts → onSchedule with timeZone option")
elif "onSchedule(" in src and "every monday" in src:
    print("  [3] Already using v2 onSchedule — skipping")
else:
    print("  [3] ✘ Could not find processAlerts declaration — check manually")

with open(path, 'w') as f:
    f.write(src)

PYEOF

echo ""
echo "Verifying..."
grep "onSchedule" "$FUNCTIONS_INDEX" | head -5
echo ""

echo "Running tsc to confirm no errors..."
cd functions && npx tsc --noEmit 2>&1 && echo -e "${GREEN}✔ TypeScript compilation clean${NC}" || true
cd ..

echo ""
echo "========================================"
echo " Next steps:"
echo "========================================"
echo ""
echo "1. Re-authenticate with Vercel (if needed):"
echo "   vercel login"
echo ""
echo "2. Deploy frontend:"
echo "   vercel --prod"
echo ""
echo "3. Deploy Firebase functions:"
echo "   cd functions && firebase deploy --only functions"
echo ""
