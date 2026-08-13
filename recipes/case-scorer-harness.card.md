---
status: DRAFT
todos_open: 0
last_gate: null
attestation: null
recipe_version: 0.1.0
type: card
pairs_with: recipes/case-scorer-harness.md
---

# Card — Scorer Gate & Weight Behaviour Harness

*The human half of the pair. If you change this card, change
`recipes/case-scorer-harness.md` in the same commit, and vice versa. A card that
describes a recipe that no longer exists is worse than no card.*

## Purpose

The role scorer decides whether a job is worth your time. Chapter 11 promises it
behaves in specific ways — a dead posting can't be rescued by a strong score, and
the weights change depending on whether you need visa sponsorship. Those promises
are written in prose, and prose can't fail a build.

This harness turns each promise into a test that runs. When someone changes the
scorer, the harness says which promises still hold.

## What it can verify

- That a closed gate (dead posting, impossible start date) drives the composite
  to zero and produces `Skip`, rather than merely lowering the score.
- That a half-open gate scales the composite proportionally — i.e. that the gate
  really is a multiplier and not an addend wearing a multiplier's name.
- Whether a role with **no** liveness evidence scores the same as a role verified
  live.
- Whether `role_quality` changes the composite at all.
- Whether a candidate's stated work authorization is correctly translated into
  "needs sponsorship" — checked across a table of realistic authorization strings.
- Whether the scorer prints a rate when it has no observations to compute one from.

## What it cannot verify

- **Whether the weights are right.** It can prove that `role_quality` at weight
  zero makes the Ch.9 subsystem invisible. It cannot tell you what the weight
  should be — the book marks that `[VERIFY]` and pins no number, so any value
  this harness proposed would be invented. That decision belongs to a maintainer.
- **Whether the upstream evidence is true.** It feeds fictional fixtures. If the
  sponsorship tier or liveness factor arriving from Ch.7/Ch.8 is wrong, every
  assertion here still passes. This tests combination, not measurement.
- **Whether the threshold of 0.30 is correct** for any real person's situation.
- **Whether "Apply" was good advice.** No test can verify that. It requires
  knowing what happened after the application, which the engine never sees.
- **Anything about real postings.** It reads nothing from `data/`.

## Dependencies

- Node (the version used for the recorded run is logged in
  `output/scorer-harness-results.json` as `node_version`).
- `scripts/score/role-scorer.mjs` must exist at that path and accept
  `<roles.json> [--profile p.json] --out-dir <dir>`. If the scorer's CLI changes,
  the harness breaks loudly rather than silently passing — see Failure mode 2.
- No npm packages beyond what the repo already installs. The harness uses only
  Node built-ins.
- Write access to a temp directory and to `output/`.

## Commands, annotated

```bash
node scripts/score/scorer-harness.mjs
# Runs every check. Prints a PASS/FAIL block per promise with the composites
# behind each verdict. Writes output/scorer-harness-results.json.
# Exit 0 = guards and bugs held. Exit 1 = a gating check failed.
# Exit 2 = the harness itself couldn't run — treat as "no result", not "pass".

node scripts/score/scorer-harness.mjs --only G4
# One check. Use when investigating a single failure; the full run is noisy.

node scripts/score/scorer-harness.mjs --strict
# Makes open questions gate too. Use when you want the build red until the
# maintainer has decided the unpinned weights.

node scripts/score/scorer-harness.mjs --json-only
# Suppresses the table. For CI, where only the exit code and the JSON matter.
```

## What it produces

- A human-readable report on stdout, one block per promise, each carrying the
  chapter it comes from and the numbers that decided the verdict.
- `output/scorer-harness-results.json` — machine-readable, one record per check.
  **Generated. Not a source of truth. Do not commit it as one.**
- An exit code meaningful enough to sit in a conformance gate.

## Failure modes

**1. Drift — the harness passes because it is testing a scorer that no longer
exists in this form.** The most likely long-run failure. Someone renames
`liveness.factor` to `liveness.score`; the harness's fixture no longer sets a
field the scorer reads; the scorer defaults it to 1.0 and every gate check passes
against a value the harness never actually supplied. The suite goes green while
verifying nothing. *Detection:* G1 is the canary — it asserts a numeric
relationship (`half-open gate halves the composite`) that cannot hold by accident
if the field is being ignored. *Mitigation:* the logged scorer commit SHA in
`RUN_LOG.md` lets you see when the subject changed under the test. *Residual
risk:* real, and not fully closed. A green harness is evidence, not proof.

**2. Contract violation — the harness reports a finding the run did not produce.**
If `role-scorer.mjs` exits non-zero or writes no `role-scores.json`, `runScorer()`
returns `json: null`, and a careless check could read `composite` as `null` and
compare `null === null` — reporting "IDENTICAL, therefore FAIL" from two runs that
never happened. That would be a fabricated finding: finding-shaped output with no
script behind it, the exact failure the engine exists to prevent. *Mitigation:*
every check null-guards its composites before comparing and returns
`harnessError`, which exits 2 rather than 1. *Read the exit code before the
verdict:* a 2 means there is no result, and no number from that run may be quoted.

**3. Over-claiming — an open question reported as a bug.** The role_quality weight
is unset, not wrong. Filing it as a defect, or worse, "fixing" it by picking a
number, would put an invented constant into the decision core and dress it as a
correction. *Mitigation:* the `kind` field, the separate exit-code treatment, and
the refusal to propose a value. *This is a discipline, not a mechanism* — a future
contributor can still mislabel a check. Review the `kind` on every check added.

**4. False confidence from fictional fixtures.** Every check passes on a fixture
built to be well-formed. Real evidence records are missing fields, carry strings
where numbers belong, and arrive with nulls. The harness currently proves the
scorer behaves correctly on clean input. It does not prove it behaves correctly on
the input it will actually receive. *Status:* not implemented. This is the largest
honest gap in the contribution.

**5. Prediction contaminating observation.** Each check carries an `expectation`
recorded from reading the source. If that field were ever consulted when deciding
PASS/FAIL, the harness would confirm its author's beliefs instead of testing the
scorer. *Mitigation:* `expectation` is written to output and used only to raise a
`surprise` flag. When prediction and observation disagree, the observation stands
and the recipe is corrected.

## What a human still has to decide

Whether `role_quality` should carry weight. Whether the Consider band's floor is
right. Whether a candidate who wrote "work authorized" meant "I don't need
sponsorship" or "I have an EAD and will need an H-1B next year" — the harness can
prove the current parse gets the second case wrong, but only a person can confirm
what a given user meant. Every one of those is a judgment the machine hands back.
