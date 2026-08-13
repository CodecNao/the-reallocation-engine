#!/usr/bin/env bash
# break-attempts.sh — deliberate attempts to make the harness lie.
#
# Step 4 of the capstone: "try to make your own contribution produce a wrong
# answer. The break attempt is worth more than a clean run."
#
# Each attempt temporarily damages role-scorer.mjs, runs the harness against the
# damaged version, and restores from git. Restoration uses `git checkout --`, so
# it is exact — but the script verifies it anyway after every attempt, because a
# script that silently leaves the scorer modified would poison every later run.
#
# RUN THIS BEFORE APPLYING ANY FIX. Attempt 3 documents pre-fix behaviour that
# the fix is designed to remove; once patched, that evidence is gone.
#
# Usage:  bash assignments/submissions/zhenhao-ma/break-attempts.sh
# Run from the repository root.

set -u

SCORER="scripts/score/role-scorer.mjs"
HARNESS="scripts/score/scorer-harness.mjs"

if [ ! -f "$SCORER" ] || [ ! -f "$HARNESS" ]; then
  echo "FATAL: run from the repository root (scripts/score/ not found)."; exit 2
fi

if [ -n "$(git status --porcelain "$SCORER")" ]; then
  echo "FATAL: $SCORER already has uncommitted changes."
  echo "This script restores by discarding them. Commit or stash first."; exit 2
fi

restore() {
  git checkout -- "$SCORER"
  if [ -n "$(git status --porcelain "$SCORER")" ]; then
    echo "!!! RESTORE FAILED — $SCORER is still modified. Fix before continuing."; exit 2
  fi
  echo "   [scorer restored, verified clean]"
}

banner() {
  echo
  echo "════════════════════════════════════════════════════════════════════"
  echo "$1"
  echo "════════════════════════════════════════════════════════════════════"
}

echo "Break attempts against the scorer behaviour harness"
echo "scorer commit: $(git log --oneline -1)"
echo "node: $(node --version)"
echo "date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# ─────────────────────────────────────────────────────────────────────────────
banner "ATTEMPT 1 — can the harness report a finding from a run that never happened?"
cat <<'EOT'
Damage: make the scorer exit(1) immediately, so it writes no output at all.
The hazard: runScorer() returns json:null, every composite reads as null, and a
careless check compares null to null and reports "IDENTICAL — therefore FAIL".
That would be finding-shaped output with no run behind it.

PASS CONDITION: exit code 2 (harness could not run), NOT exit code 1 (findings).
EOT
echo
printf 'process.exit(1);\n' > /tmp/_ba_prefix.$$
cat /tmp/_ba_prefix.$$ "$SCORER" > /tmp/_ba_scorer.$$ && cp /tmp/_ba_scorer.$$ "$SCORER"
node "$HARNESS" 2>&1 | tail -12
A1=${PIPESTATUS[0]}
echo "--> EXIT: $A1   (2 = harness refused to report · 1 = it fabricated findings)"
rm -f /tmp/_ba_prefix.$$ /tmp/_ba_scorer.$$
restore

# ─────────────────────────────────────────────────────────────────────────────
banner "ATTEMPT 2 — can the suite go green while testing nothing? (drift)"
cat <<'EOT'
Damage: rename the field the scorer reads, liveness.factor -> liveness.value.
The fixture still sets .factor, so the scorer now never sees it and falls back
to its default of 1.0. This simulates the most likely real-world drift: someone
renames a field and the tests keep passing against a value never supplied.

PASS CONDITION: G1 FAILS. If G1 still passes, the guard is decoration.
EOT
echo
sed -i '' 's/role\.liveness?\.factor/role.liveness?.value/' "$SCORER"
node "$HARNESS" --only G1 2>&1 | tail -10
A2=${PIPESTATUS[0]}
echo "--> EXIT: $A2   (1 = drift was caught · 0 = the guard is blind)"
restore

# ─────────────────────────────────────────────────────────────────────────────
banner "ATTEMPT 3 — will an unverified posting be recommended? (pre-fix evidence)"
cat <<'EOT'
No damage. This records what the UNPATCHED scorer does with a role for which
liveness was never measured — the "ghost posting scored live" case.
Capture this now; the G2 fix removes the behaviour and with it the evidence.
EOT
echo
cat > /tmp/_ba_ghost.$$.json <<'EOT'
[{
  "role_id": "GHOST-001",
  "company": "Fictional Semiconductor A",
  "title": "Physical Design Engineer (fixture)",
  "sponsorship": { "p": 0.8, "tier": "proven", "source": "record" },
  "fit": { "p": 0.7, "source": "model-judgment" },
  "timeline": { "factor": 1.0, "source": "your-input" }
}]
EOT
echo "Fixture: no liveness field at all. Nobody ever checked if this job exists."
echo
node "$SCORER" /tmp/_ba_ghost.$$.json --out-dir /tmp/_ba_out.$$ 2>&1
echo
echo "--- what the scorer decided ---"
node -e '
const f=process.argv[1];
const r=JSON.parse(require("fs").readFileSync(f,"utf8")).roles[0];
console.log("composite      :", r.composite);
console.log("recommendation :", r.recommendation);
console.log("reason         :", r.reason);
console.log("gates in trace :", JSON.stringify(r.trace.gates));
' "/tmp/_ba_out.$$/role-scores.json"
echo
echo "--> If this says Apply, an unverified posting just earned a recommendation,"
echo "    and the audit trace reports liveness 1.0 as though it were measured."
rm -rf /tmp/_ba_ghost.$$.json /tmp/_ba_out.$$

# ─────────────────────────────────────────────────────────────────────────────
banner "ATTEMPT 4 — can a gate be demoted to a vote without the guard firing?"
cat <<'EOT'
Damage: change composite = voteSum * gateProduct  to  voteSum + gateProduct*0.1.
This is the capstone's named build failure: a gate folded in as a weighted
addend, so a dead posting merely lowers the score instead of zeroing it.

PASS CONDITION: G1 FAILS. This is the exact regression the guard exists for.
EOT
echo
sed -i '' 's/const composite = voteSum \* gateProduct;/const composite = voteSum + gateProduct * 0.1;/' "$SCORER"
grep -n "const composite = voteSum" "$SCORER"
echo
node "$HARNESS" --only G1 2>&1 | tail -10
A4=${PIPESTATUS[0]}
echo "--> EXIT: $A4   (1 = the guard fired · 0 = the guard is decoration)"
restore

# ─────────────────────────────────────────────────────────────────────────────
banner "SUMMARY"
echo "Attempt 1 (fabricated finding)  exit $A1  — want 2"
echo "Attempt 2 (silent drift)        exit $A2  — want 1"
echo "Attempt 3 (ghost posting)       see the recommendation printed above"
echo "Attempt 4 (gate demoted)        exit $A4  — want 1"
echo
echo "Final tree state:"
git status --porcelain
echo
echo "If any file above is modified, restoration failed. Do not proceed."
