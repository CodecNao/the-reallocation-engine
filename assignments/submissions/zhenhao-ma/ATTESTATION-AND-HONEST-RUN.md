# Verified-Data Attestation & Honest Run

**Contribution:** `scripts/score/scorer-harness.mjs` — gate & weight behaviour harness
**Contributor:** Zhenhao Ma
**Scorer under test:** `scripts/score/role-scorer.mjs` @ upstream `3124767`
**Run date:** 2026-08-13 · **Node:** v24.15.0 · **Python:** 3.9.18 · macOS

Raw output archived at:

- `assignments/submissions/zhenhao-ma/runs/prefix-run.txt` — unpatched scorer
- `assignments/submissions/zhenhao-ma/runs/break-attempts.txt` — the four break attempts
- `assignments/submissions/zhenhao-ma/runs/postfix-run.txt` — patched scorer

Every figure below was read from those files. Nothing here was completed from
memory or from a description of what the harness does.

---

# Step 3 — The Verified-Data Attestation

## 3.1 The verified / inferred boundary

| Field emitted | Class | Traces to |
|---|---|---|
| `checks[].id`, `.name`, `.kind` | authored constant | contributor's design decision in `scorer-harness.mjs`; not a measurement |
| `checks[].chapter`, `.invariant` | **authored claim** | contributor's reading of Ch.8/9/11. **Not machine-verified.** A reviewer must confirm the chapters say what the checks claim. |
| `checks[].expectation` | contributor prediction | recorded from source reading; raises a `surprise`/`DIFFERS FROM BASELINE` flag only. Never decides a verdict. |
| `checks[].result` | script-output | derived from composites returned by real subprocess runs of `role-scorer.mjs` |
| composites (0.49, 0.245, 0) | script-output | arithmetic performed by `role-scorer.mjs` on fictional fixtures |
| `role_quality` weight `0` | script-output | printed by the scorer's own `trace.votes[].weight` — not asserted by the harness |
| "2 of 5 authorization strings misclassified" | script-output over an **authored sample** | counted from the five strings listed in the G4 table. The table is a contributor-written sample, **not a population.** |
| fixture inputs (`sponsorship.p 0.8`, `fit.p 0.7`, …) | **your-input, invented** | written by the contributor for testing. Describe no real company or posting. |
| `Fictional Semiconductor A` | your-input, deliberately fictional | not a real employer |
| Node version, timestamps | record | `process.version`, `Date` |
| attribution of a failure to a specific line | **model-judgment** | the harness proves the *behaviour*; a human inferred the *cause* |

**The boundary in one sentence:** this contribution verifies **behaviour under
fictional input**. It emits no coverage rate, no sponsorship rate, no calibration
figure, and no claim about any real employer or posting. No number in it is a
measurement of the world.

## 3.2 Every number traces

| Number | Where shown | Produced by | Class |
|---|---|---|---|
| 5 checks · 1 PASS · 4 FAIL (3 gating, 1 open question), EXIT 1 | pre-fix summary, PR, portfolio | `node scripts/score/scorer-harness.mjs` on upstream `3124767` | script-output |
| 5 checks · 4 PASS · 1 FAIL (0 gating, 1 open question), EXIT 0 | post-fix summary, PR, portfolio | same command after `apply-fixes.mjs` | script-output |
| 2 of 5 authorization strings misclassified (pre-fix) → 0 of 5 (post-fix) | PR, portfolio, video | G4 check table | script-output over authored sample |
| composite 0.49 | G1/G2/G3 observations, break attempt 3 | `role-scorer.mjs` arithmetic on fixtures | script-output |
| 0.49 × 0.5 = 0.245 | G1 multiplicativity assertion | same | script-output |
| `role_quality` weight 0 | G3 observation | scorer's audit trace | script-output |
| liveness multiplier 1, `source: "record"` on an unmeasured gate | break attempt 3 | scorer's audit trace | script-output |
| 98 insertions, 13 deletions, 1 file | PR | `git diff --stat` | script-output |
| 10575 → 15106 bytes | patch log | `apply-fixes.mjs` | script-output |
| 131 → 132 files conforming | baseline vs post-fix | `npm run verify` | script-output |
| break attempts: exit 2 / 1 / — / 1 | Step 4.4 | `break-attempts.sh` | script-output |

No number appears in the submission without a row here.

## 3.3 The ethics gate

### (a) Privacy — PASS

Verified on the branch before any commit:

```
$ git log --oneline HEAD -- search/resume.json
(empty — no commit on this branch has ever touched it)

$ git ls-files | grep -i resume
chapters/13-resumes-that-survive-the-filter.md
d3/13-resumes-that-survive-the-filter-fig-0{1..4}.html
images/13-resumes-that-survive-the-filter-fig-0{1..4}.{png,svg}
pantry/13-resumes-that-survive-the-filter-cajal.md
prompts/13-resumes-that-survive-the-filter.md
resumes/{aarav-patel,maya-sehgal,priya-nair,rohan-desai}-cv.md
scripts/resumes/{README.md,generate-pdf.mjs}
```

Every match is book content or one of the four **fictional** example CVs shipped
by upstream. The contributor's real résumé is not among them.

This mattered: an earlier fork of this repository had a real personal résumé at
`search/resume.json` tracked from a setup exercise. This branch was cut from
`upstream/main` specifically so that history could not follow it, and the check
above confirms it did not.

`npm run doctor` (post-fix):

```
PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked
```

- [x] No `data/ats/` content tracked or staged
- [x] `search/resume.json` absent from this branch's history and working tree
- [x] No `.env`, key, personal email, or phone in any added file
- [x] All fixture companies fictional
- [x] `output/scorer-harness-results.json` is generated — added to `.gitignore`, not committed
- [x] `npm run doctor` exits 0

### (b) Honesty — PASS

- [x] No coverage rate, liveness rate, or calibration figure is emitted anywhere
- [x] The one metric-shaped number ("2 of 5") is reported with its denominator
      and labelled as a count over an authored sample
- [x] `role_quality` is classified `open-question`, not a defect; no weight proposed
- [x] `expectation` fields influence no verdict
- [x] Every FAIL carries the composites that produced it
- [x] Checks that could not run report `NO RESULT`, never `FAIL`

**Gate result: PASS.** The run happened.

### (c) Human sign-off

Not self-certified by the tooling. Signed by a person who read the archived
output and confirms it matches what the terminal showed.

Signed: `«FILL: your name»`  Date: `«FILL»`

---

# Step 4 — The Honest Run

## 4.1 Plausibility audit — performed before trusting the verdicts

| Question | Expected | Observed |
|---|---|---|
| Does liveness 0.0 collapse the composite? | yes | `closed gate (liveness 0.0) → composite 0` ✓ |
| Is the gate multiplicative, not additive? | 0.49 × 0.5 = 0.245 | `half-open gate (0.5) scaled 0.49 → 0.245` ✓ |
| Does a closed gate produce `Skip`, not a low `Apply`? | `Skip`, reason says "gated" | ✓ |
| Does the base fixture clear the 0.30 threshold? | ~0.49 → `Apply` | ✓ |
| Do repeat runs agree? | identical | ✓ across four separate invocations |

The audit passed, so the verdicts below were trusted. Had the arithmetic not
reproduced by hand, nothing further would have been reported.

## 4.2 Baseline — unmodified `upstream/main`

```
$ npm run verify
conformance: 131 files (75 md · 30 py · 23 js · 1 sh · 1 yaml · 1 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
✓ manifest check passed (4 warnings)

$ npm run doctor
  ✓ node v24.15.0   ✓ python3 3.9.18
  ✓ no private/PII paths are tracked
  recipes: 42/42 carry lifecycle frontmatter
```

Baseline **green**. Two observations recorded rather than fixed:

1. `npm ci` fails — upstream ships no `package-lock.json`. Not a defect in this
   contribution and not patched. Neither the scorer nor the harness needs any
   dependency; both use Node built-ins only, which is why `verify` and `doctor`
   run regardless.
2. `manifest-check` already warned `W1 ignore path not in .gitignore: output/`
   before this contribution existed. The harness writes to `output/`, so adding
   that line both protects the generated artifact and clears a pre-existing warning.

## 4.3 The harness run — pre-fix, real output

```
$ node scripts/score/scorer-harness.mjs; echo "EXIT: $?"

✓ G1  PASS  [guard]  Gates are multipliers, not votes
   · closed gate (liveness 0.0) → composite 0
   · half-open gate (0.5) scaled 0.49 → 0.245

✗ G2  FAIL  [bug]  Absent evidence is not passing evidence
   · role with no liveness field  → composite 0.49
   · role with liveness = 1.0     → composite 0.49
   · IDENTICAL — missing liveness evidence is silently treated as a verified-open gate.

? G3  FAIL  [open-question]  role_quality reaches the composite
   · role_quality 0.9 → composite 0.49
   · role_quality 0.1 → composite 0.49
   · role_quality weight as emitted in the audit trace: 0
   · IDENTICAL — role_quality has no influence on the recommendation.

✗ G4  FAIL  [bug]  Work authorization is not confused with sponsorship independence
   · "F-1 OPT, work authorized" → needs_sponsorship false (expected true), sponsorship weight 0 — MISCLASSIFIED
   · "F-1 STEM OPT EAD, authorized to work through 2027" → needs_sponsorship false (expected true), sponsorship weight 0 — MISCLASSIFIED
   · "F-1 student, will need H-1B sponsorship" → needs_sponsorship true (expected true), sponsorship weight 0.35 — ok
   · "U.S. citizen" → needs_sponsorship false (expected false), sponsorship weight 0 — ok
   · "Permanent resident" → needs_sponsorship false (expected false), sponsorship weight 0 — ok
   · 2 of 5 authorization strings misclassified.

✗ G5  FAIL  [bug]  No fabricated number on an empty run
   · stdout on empty input: ✓ scored 0 roles → Apply 0 · Consider 0 · Skip 0 (skip NaN%)
   · Emitted NaN/Infinity where a rate belongs — a non-number printed in a number's position.

5 checks · 1 PASS · 4 FAIL (3 gating, 1 open question)
EXIT: 1
```

All five results matched the predictions recorded from reading the source: zero
surprises. Full file: `runs/prefix-run.txt`.

## 4.4 The break attempt

Four attempts to make the contribution produce a wrong answer.
**Two of them succeeded**, and both found defects in the harness itself.

### Attempt 1 — can the harness report a finding from a run that never happened?

Damage: `process.exit(1)` prepended to the scorer, so it writes nothing.

**FIRST RUN — the harness lied, twice:**

```
5 checks · 1 PASS · 1 FAIL (1 gating) · 3 HARNESS ERROR · 1 surprise(s)

✓ G5  PASS  [bug]  No fabricated number on an empty run
   · stdout on empty input: (none)
   · No NaN/Infinity emitted on empty input.
```

- **G4 reported a finding from nothing.** It read `undefined` for every profile,
  compared that to the expected values, and reported *"5 of 5 authorization
  strings misclassified"* — a fabricated finding, produced by a scorer that never
  ran. This is precisely the failure mode named in the card, committed by the
  tool written to prevent it.
- **G5 passed on silence.** Its test is "stdout contains no NaN". A dead scorer
  prints nothing, nothing contains no NaN, so a run that never happened was
  certified correct.

The process exit code was 2 only because three *other* checks errored honestly.
Under `--only G5` or `--only G4`, either would have returned a confident exit 0
or 1 from nothing at all.

**Fix:** a `requireRun()` precondition on every check — if the subprocess did not
exit 0 or wrote no JSON, the check returns `NO RESULT` and may conclude nothing.
The verdict label `FAIL` was also separated from `NO RESULT`, since calling an
absent result a failure is the same conflation one level up.

**AFTER THE FIX:**

```
5 checks · 0 PASS · 0 FAIL (0 gating, 0 open questions) · 5 HARNESS ERROR
--> EXIT: 2   (2 = harness refused to report · 1 = it fabricated findings)
```

### Attempt 2 — can the suite go green while testing nothing? (drift)

Damage: renamed `liveness.factor` → `liveness.value` in the scorer, so the
fixture's field is never read and the gate silently defaults to 1.0.

```
   · closed gate did NOT zero the composite (got 0.49)
   · closed gate produced recommendation "Apply", expected "Skip"
   · half-open gate is not multiplicative: 0.49 × 0.5 = 0.2450, got 0.49
--> EXIT: 1   (1 = drift was caught)
```

The guard fired. The multiplicativity assertion is what caught it: a numeric
relationship cannot hold by accident against a field that is being ignored.

### Attempt 3 — will an unverified posting be recommended? (pre-fix evidence)

No damage. A role with **no liveness field at all** — nobody ever checked whether
the job exists:

```
✓ scored 1 roles → Apply 1 · Consider 0 · Skip 0 (skip 0%)

composite      : 0.49
recommendation : Apply
reason         : composite 0.490 ≥ 0.3, gates healthy
gates in trace : [{"factor":"liveness","multiplier":1,"source":"record"},
                  {"factor":"timeline","multiplier":1,"source":"your-input"}]
```

Two things went wrong, and the second is worse than the first.

1. An unverified posting earned `Apply`, with the reason "gates healthy".
2. **The audit trace claims `source: "record"` for a gate that has no record.**
   The engine's central promise is that every term traces to its source. Here the
   provenance field asserts a measurement that was never taken. A reader auditing
   this row term-by-term — exactly what Ch.11 instructs — would be misled by the
   audit trail itself.

### Attempt 4 — can a gate be demoted to a vote without the guard firing?

Damage: `composite = voteSum * gateProduct` → `voteSum + gateProduct * 0.1`.
This is the capstone's named build failure.

```
90:  const composite = voteSum + gateProduct * 0.1;

   · closed gate did NOT zero the composite (got 0.49)
   · half-open gate is not multiplicative: 0.59 × 0.5 = 0.2950, got 0.54
--> EXIT: 1   (1 = the guard fired)
```

G1 is not decoration.

### A fifth failure, found by the fix rather than by an attempt

Applying the G2 patch made the scorer return `composite: null` for roles with no
gate evidence — the intended behaviour. The G2 check then reported `NO RESULT`
and the whole run exited 2: **the check read a legitimately-null composite as
"the scorer didn't run."** The correct fix had been classified as a broken
harness.

The check's success criterion had not moved with the invariant it was testing.
G2 now recognises an explicit refusal to score as satisfying the promise, and
reports the `missing_gates` the scorer names.

Three separate defects in the harness, all found by attacking it rather than
running it. The clean run found none of them.

## 4.5 Metric readout

This contribution touches no live pipeline, so there is no skip rate or coverage
figure to report, and inventing one would violate the contract.

| Measure | Pre-fix | Post-fix |
|---|---|---|
| Behavioural promises enforced by an executable check | 0 | 5 |
| Checks passing | 1 | 4 |
| Gating failures | 3 | 0 |
| Open questions surfaced with the consequence proven | 1 | 1 |
| Authorization strings misclassified, of the 5 tested | 2 | 0 |
| Harness exit code | 1 | 0 |
| Defects found in the harness itself by break attempts | — | 3, all fixed |

The "2 of 5 → 0 of 5" row is the number worth quoting, and only with its
denominator attached. It is a count over five strings written by the contributor.
It is **not** a measured error rate over real user profiles and must never be
described as one.

Conformance across the change: `verify` 131 → 132 files, all conforming, four
pre-existing warnings unchanged. `doctor` green throughout. Diff: 1 file,
98 insertions, 13 deletions.

## 4.6 What the machine could not know

The harness can prove that `"F-1 OPT, work authorized"` is parsed into the wrong
sponsorship requirement. It cannot know what any particular person meant by those
words. The same sentence from someone with two years of STEM OPT remaining and
from a permanent resident are different sentences, and no pattern matching
recovers the difference. Only asking does — which is why the fix prefers an
explicit `needs_sponsorship` field and labels every text inference as inferred.

It cannot know whether `role_quality` deserves weight. That is a judgment about
what makes a job good, and the book leaves it open on purpose. The harness proves
the consequence of the current zero and stops there.

It cannot know whether an `Apply` was good advice. That would require knowing
what happened after the application — whether the posting was real, whether the
employer sponsored, whether the person was hired. The engine never observes any
of it. Neither does this.

And it cannot verify its own premise. That these five invariants are the ones the
book actually promises is a human reading, recorded as `model-judgment` in the
boundary table above. Every PASS in this run is conditional on that reading being
right, and a maintainer should check it before trusting one.
