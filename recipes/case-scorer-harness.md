---
status: DRAFT
todos_open: 0
last_gate: null
attestation: null
recipe_version: 0.1.0
type: recipe
---

# Recipe — Scorer Gate & Weight Behaviour Harness

*Status is DRAFT until a human has run the harness on a real clone and recorded
the output. Promote to RUNNABLE-SAMPLE only after §7 Verification Checks has been
executed and §8 Logging has been written. Do not promote on the strength of this
document alone.*

## 1. Executive Summary

The Bayesian Role Scorer (`scripts/score/role-scorer.mjs`, Ch.11) is the decision
core: it turns upstream evidence into Apply / Consider / Skip. Chapter 11 makes
behavioural promises about how it must combine that evidence — gates multiply,
weights are profile-conditional, every term is traceable. Those promises live in
prose. Prose does not fail a build.

This recipe runs `scripts/score/scorer-harness.mjs`, which converts each promise
into an executable assertion and reports PASS/FAIL per promise with the numbers
that justify the verdict. It calls the scorer through its real command-line
interface as a subprocess; it does not import, patch, or modify the scorer.

The harness classifies its own checks, because "this is broken" and "someone
must decide this" are different claims and the engine's own honesty rules do not
permit collapsing them:

- **guard** — a promise believed to already hold; the check prevents regression.
- **bug** — a defect with a correct answer requiring no new authorial decision.
- **open-question** — behaviour the book leaves explicitly unpinned. The check
  proves the *consequence* of the current setting and hands the decision back to
  a maintainer. It does not propose a value, because proposing one would mean
  inventing a number the record does not contain.

Only guards and bugs set a failing exit code. `--strict` makes open questions
gate as well.

## 2. Required Reads (in this order, before running anything)

1. `recipes/_shared.md` — the shared recipe contract, especially Verified-Data
   Rules 5, 6, 7, 9 and the Phase Gates.
2. `DATA_CONTRACT.md` — ownership rules; confirms nothing under `data/ats/` is
   touched by this recipe.
3. `scripts/score/role-scorer.mjs` — read the `CONFIG` block and `applyProfile()`
   in full. Every assertion in the harness refers to behaviour visible here.
4. `logs/RUN_LOG.md` — the last entry, to see whether the scorer has changed
   since the previous harness run.
5. `output/scorer-harness-results.json` if it exists — the previous result set.
   Read the audit before proposing new work (Verified-Data Rule 4).

## 3. Phase Gates

Do not proceed past a gate that has not passed. Each gate has a failure path; a
gate without a failure path is decoration.

| Gate | Passes when | Failure path |
|---|---|---|
| **P0 Baseline** | On an unmodified checkout of `upstream/main`, `npm ci` succeeds and `npm run verify` and `npm run doctor` both exit 0 | Record the baseline failure in `logs/RUN_LOG.md` and stop. Do not attribute a pre-existing upstream failure to this contribution. |
| **P1 Target** | At least one check classified `bug` reports FAIL, and the failing line of the scorer can be named | If every `bug` check passes, the harness has no target. Stop and report that finding honestly rather than manufacturing a defect to catch. |
| **P2 Fix** | After the patch, previously failing `bug` checks report PASS | If a fix flips any other check from PASS to FAIL, revert the fix. Ship the harness alone — a harness without its fix is still a valid contribution. |
| **P3 Ethics** | No file under `data/ats/`, no résumé, no personal file appears in `git status`; `npm run doctor` exits 0 | The run does not happen. This gate precedes publication, not follows it. |
| **P4 Logging** | A `logs/RUN_LOG.md` entry exists naming inputs, outputs, result and open issues | Not gradeable, not mergeable. |

## 4. Primary Stored Tools

The following stored commands are used. **No pre-existing stored script tests
scorer behaviour** — that absence is the gap this contribution closes, and it was
confirmed by reading `package.json` and `scripts/` before any new code was
written (Stored Script Gate, `_shared.md` §Phase Gates 3).

```bash
npm ci
npm run verify          # scripts/conformance.mjs + scripts/manifest-check.mjs
npm run doctor          # scripts/doctor.mjs
npm run score           # scripts/score/role-scorer.mjs — the system under test
```

New in this contribution:

```bash
node scripts/score/scorer-harness.mjs
```

## 5. Workflow

Run verbatim. Do not substitute paths.

```bash
# Step 1 — baseline (Gate P0)
git fetch upstream
git checkout -b contrib/<name>-scorer-harness upstream/main
npm ci
npm run verify
npm run doctor

# Step 2 — place the harness and confirm it compiles under the conformance gate
#          (scripts/conformance.mjs runs `node --check` on every .mjs)
node --check scripts/score/scorer-harness.mjs

# Step 3 — run the harness against the unmodified scorer (Gate P1)
node scripts/score/scorer-harness.mjs; echo "EXIT: $?"

# Step 4 — inspect the machine-readable result
cat output/scorer-harness-results.json

# Step 5 — a single check in isolation, when investigating one failure
node scripts/score/scorer-harness.mjs --only G4

# Step 6 — after applying the patch (Gate P2), re-run and compare
node scripts/score/scorer-harness.mjs; echo "EXIT: $?"

# Step 7 — conformance before push (Gate P3)
git status
npm run verify && npm run doctor
```

## 6. Output Contract

| Artifact | Path | Kind |
|---|---|---|
| Human PASS/FAIL report | stdout | ephemeral |
| Machine result set | `output/scorer-harness-results.json` | generated — never committed as a source of truth |
| Exit code | shell | 0 = guards and bugs held · 1 = a gating check failed · 2 = harness could not run |

Every entry in the JSON carries `kind`, `chapter`, `invariant`, `expectation`,
`result`, `surprise`, and the `observations` (the actual composites) that justify
the verdict. A verdict with no observation behind it is not emitted.

`expectation` records what reading the source predicted. It is written to the
output so that a mismatch between prediction and observation is visible as a
`surprise` flag rather than silently absorbed. **It never decides PASS/FAIL.**

Fixtures are fictional. The harness writes only to a temp directory and to
`output/`. It reads nothing from `data/`.

## 7. Verification Checks

The harness verifies the scorer. These verify the harness — run them before
trusting a single number it prints.

1. `node --check scripts/score/scorer-harness.mjs` exits 0.
2. `node scripts/score/scorer-harness.mjs --only G1` exits 0, proving the runner,
   subprocess invocation, and JSON parsing all work on a check expected to pass.
   A harness that fails everything is indistinguishable from a broken harness.
3. Each FAIL prints the two composites it compared. A FAIL with no numbers behind
   it is a harness bug, not a finding.
4. Re-running twice produces identical verdicts. Fixtures are deterministic;
   instability means the runner is wrong.
5. `git status` after a run shows no modification to `role-scorer.mjs`. The
   harness must not mutate its subject.
6. Any check flagged `surprise: true` is investigated before the run is reported.
   The observed result stands; this document is corrected to match it.

## 8. Logging Rules

Append to `logs/RUN_LOG.md` after every run against a real clone:

```markdown
## YYYY-MM-DD — Scorer behaviour harness

- **Recipe:** case-scorer-harness
- **Inputs:** scripts/score/role-scorer.mjs @ <commit sha>, fictional fixtures
- **Outputs:** output/scorer-harness-results.json
- **Result:** <n> checks, <n> PASS, <n> gating FAIL, <n> open question(s)
- **Open issues:** <the checks still failing, and why each is or is not fixable>
```

Log the commit SHA of the scorer, not just the date. A harness result is only
meaningful against a named version of its subject. Never log personal data.

## 9. Stop Conditions

Stop and hand back to a human when any of these is true:

- **Baseline is red.** `verify` or `doctor` fails on an unmodified checkout. Stop
  at Gate P0; the contribution cannot be distinguished from the pre-existing fault.
- **Every bug check passes.** There is no target. Report it; do not introduce a
  defect in order to catch one.
- **A check reports `surprise: true`.** The source reading was wrong somewhere.
  Stop, re-read the scorer, correct this recipe.
- **A fix would require choosing an unpinned value.** Do not select a weight, a
  threshold, or a rate that the book and the design doc leave open. Report the
  consequence and stop. Prefer "not implemented yet" to a fabricated constant.
- **The harness would need to read `data/`.** It must not. If a check seems to
  require real postings, the check is mis-scoped.
- **`git status` shows a private file.** Stop at Gate P3. The run does not happen.

The harness reports whether promises hold. It cannot decide what the engine
*should* promise. That judgment stays with a maintainer.
