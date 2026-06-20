#!/usr/bin/env bash
# =============================================================================
# MyTrialMatchRx — Fix admin page TypeError + missing icons
# =============================================================================
set -e
GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
ok()  { echo -e "${GREEN}✔ $1${NC}"; }
err() { echo -e "${RED}✘ $1${NC}"; }

ADMIN_PAGE="src/app/trial-matcher/admin/page.tsx"
MANIFEST="public/manifest.json"

echo ""
echo "========================================"
echo " MyTrialMatchRx — Admin + Icon Fixes"
echo "========================================"
echo ""

# ---------------------------------------------------------------------------
# FIX 1 — Admin page: guard parsedRules.rules against undefined/.map crash
# ---------------------------------------------------------------------------
echo "--- Fix 1: admin/page.tsx — parsedRules TypeError ---"

[ ! -f "$ADMIN_PAGE" ] && err "File not found: $ADMIN_PAGE" && exit 1
cp "$ADMIN_PAGE" "${ADMIN_PAGE}.bak"

python3 - "$ADMIN_PAGE" <<'PYEOF'
import sys
path = sys.argv[1]
with open(path, 'r') as f:
    src = f.read()

# Fix 1a: guard the .rules array before .map()
old = "                    {((parsedRules as any).rules || parsedRules as any[]).map((rule: any, i: number) => ("
new = "                    {((parsedRules as any).rules ?? []).map((rule: any, i: number) => ("
if old in src:
    src = src.replace(old, new)
    print("  [1a] ✔ Guarded parsedRules.rules with ?? []")
elif new in src:
    print("  [1a] Already patched")
else:
    print("  [1a] ✘ Pattern not found — check manually")

# Fix 1b: guard parsedRules.summary.autoConfirmed
old2 = "                        ✓ {(parsedRules as any).summary.autoConfirmed} auto-confirmed"
new2 = "                        ✓ {(parsedRules as any).summary?.autoConfirmed ?? 0} auto-confirmed"
if old2 in src:
    src = src.replace(old2, new2)
    print("  [1b] ✔ Guarded summary.autoConfirmed")

# Fix 1c: guard parsedRules.summary.needsReview
old3 = "                        {(parsedRules as any).summary.needsReview > 0 && ("
new3 = "                        {((parsedRules as any).summary?.needsReview ?? 0) > 0 && ("
if old3 in src:
    src = src.replace(old3, new3)
    print("  [1c] ✔ Guarded summary.needsReview")

old4 = "                            ⚠ {(parsedRules as any).summary.needsReview} need review"
new4 = "                            ⚠ {(parsedRules as any).summary?.needsReview ?? 0} need review"
if old4 in src:
    src = src.replace(old4, new4)
    print("  [1d] ✔ Guarded summary.needsReview display")

# Fix 1e: guard parsedRules.summary.manualOnly
old5 = "                        {(parsedRules as any).summary.manualOnly > 0 && ("
new5 = "                        {((parsedRules as any).summary?.manualOnly ?? 0) > 0 && ("
if old5 in src:
    src = src.replace(old5, new5)
    print("  [1e] ✔ Guarded summary.manualOnly")

old6 = "                            {(parsedRules as any).summary.manualOnly} manual only"
new6 = "                            {(parsedRules as any).summary?.manualOnly ?? 0} manual only"
if old6 in src:
    src = src.replace(old6, new6)
    print("  [1f] ✔ Guarded summary.manualOnly display")

# Fix 1g: guard validation fields
old7 = "                          Live validation: {(parsedRules as any).validation.matchCount} of {(parsedRules as any).validation.totalPatients} patients matched"
new7 = "                          Live validation: {(parsedRules as any).validation?.matchCount ?? 0} of {(parsedRules as any).validation?.totalPatients ?? 0} patients matched"
if old7 in src:
    src = src.replace(old7, new7)
    print("  [1g] ✔ Guarded validation.matchCount/totalPatients")

old8 = "                        {(parsedRules as any).validation.plausibilityMessage}"
new8 = "                        {(parsedRules as any).validation?.plausibilityMessage}"
if old8 in src:
    src = src.replace(old8, new8)
    print("  [1h] ✔ Guarded validation.plausibilityMessage")

with open(path, 'w') as f:
    f.write(src)
PYEOF

ok "admin/page.tsx patched"
echo ""

# ---------------------------------------------------------------------------
# FIX 2 — Generate missing favicon.ico and icon.svg
# ---------------------------------------------------------------------------
echo "--- Fix 2: Generate missing public/favicon.ico and icon.svg ---"

# Create a simple SVG icon (teal DNA/cross motif matching the brand)
cat > public/icon.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#05c8ae"/>
  <text x="16" y="22" font-family="system-ui,sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">Rx</text>
</svg>
SVG
ok "Created public/icon.svg"

# Generate favicon.ico from the PNG if it exists, otherwise copy the 192 PNG
if [ -f "public/icon-192.png" ]; then
  # Use sips (built-in macOS) to create a 32x32 PNG, then wrap as ICO
  sips -z 32 32 public/icon-192.png --out /tmp/favicon-32.png &>/dev/null || true
  
  # Create a minimal valid ICO file using Python
  python3 <<'PYEOF'
import struct, os

png_path = '/tmp/favicon-32.png'
ico_path = 'public/favicon.ico'

if not os.path.exists(png_path):
    # Fall back to the 192 PNG as-is
    import shutil
    shutil.copy('public/icon-192.png', png_path)

with open(png_path, 'rb') as f:
    png_data = f.read()

# ICO header: ICONDIR
ico_header = struct.pack('<HHH', 0, 1, 1)  # reserved, type=1 (ICO), count=1

# ICONDIRENTRY: width, height, colorCount, reserved, planes, bitCount, bytesInRes, imageOffset
entry_offset = 6 + 16  # header + one entry
ico_entry = struct.pack('<BBBBHHII', 32, 32, 0, 0, 1, 32, len(png_data), entry_offset)

with open(ico_path, 'wb') as f:
    f.write(ico_header + ico_entry + png_data)

print(f"  Created {ico_path} ({len(png_data)} bytes PNG embedded)")
PYEOF
  ok "Created public/favicon.ico"
else
  err "public/icon-192.png not found — favicon.ico not created"
fi

echo ""

# ---------------------------------------------------------------------------
# FIX 3 — Fix manifest.json icon size if wrong
# ---------------------------------------------------------------------------
echo "--- Fix 3: Verify manifest.json icon sizes ---"

if [ -f "$MANIFEST" ]; then
  python3 - "$MANIFEST" <<'PYEOF'
import json, subprocess, sys, os

manifest_path = sys.argv[1]
with open(manifest_path, 'r') as f:
    manifest = json.load(f)

icons = manifest.get('icons', [])
changed = False

for icon in icons:
    src = icon.get('src', '').lstrip('/')
    declared = icon.get('sizes', '')
    
    if not os.path.exists(f'public/{src}'):
        print(f"  ✘ Missing: public/{src}")
        continue
    
    # Get actual size using sips
    result = subprocess.run(
        ['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', f'public/{src}'],
        capture_output=True, text=True
    )
    
    actual_w = actual_h = None
    for line in result.stdout.splitlines():
        if 'pixelWidth' in line:
            actual_w = line.split(':')[1].strip()
        if 'pixelHeight' in line:
            actual_h = line.split(':')[1].strip()
    
    if actual_w and actual_h:
        actual_size = f"{actual_w}x{actual_h}"
        if actual_size != declared:
            print(f"  ⚠ {src}: declared {declared}, actual {actual_size} — fixing")
            icon['sizes'] = actual_size
            changed = True
        else:
            print(f"  ✔ {src}: {declared} matches actual size")

if changed:
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    print("  ✔ manifest.json updated with correct sizes")
else:
    print("  ✔ manifest.json sizes all correct")
PYEOF
else
  err "public/manifest.json not found"
fi

echo ""
echo "========================================"
echo " Deploying..."
echo "========================================"
echo ""
vercel --prod --force

echo ""
echo "========================================"
echo " All done!"
echo "========================================"
