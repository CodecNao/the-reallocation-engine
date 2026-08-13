# PR description — paste into GitHub

**Title:** `Add gate & weight behaviour harness for the role scorer (+3 fixes, 1 open question)`

**Branch:** `contrib/zhenhao-ma-scorer-harness` → `main` (cut from `3124767`)

---

## The gap this closes

`scripts/score/role-scorer.mjs` is the decision core. Chapter 11 makes specific
behavioural promises about it: liveness and timeline are gates rather than
addends, weights are conditional on the candidate profile, every term traces to
its source. Nothing in the repository enforces any of them. I checked
`package.json` and `scripts/` before writing anything — there is no test that
would notice if a gate quietly became a vote.

This PR adds `scripts/score/scorer-harness.mjs`, which turns each promise into an
executable assertion. It runs the scorer through its real CLI as a subprocess and
compares composites. It does not import, patch, or modify the scorer, and it adds
no dependencies — Node built-ins only, like the scorer itself.

## What it found on unmodified `main`

```
5 checks · 1 PASS · 4 FAIL (3 gating, 1 open question)   EXIT: 1
```

| Check | Kind | Result | Finding |
|---|---|---|---|
| G1 gates are multipliers, not votes | guard | PASS | promise holds; check prevents regression |
| G2 absent evidence is not passing evidence | bug | FAIL | a role with no liveness evidence scores identically to one verified live (both 0.49) |
| G3 `role_quality` reaches the composite | open question | FAIL | at weight 0, the entire Ch.9 subsystem is invisible to the decision core |
| G4 authorization vs. sponsorship independence | bug | FAIL | 2 of 5 authorization strings misclassified |
| G5 no rate without observations | bug | FAIL | an empty run prints `skip NaN%` |

**G4 is the one I would look at first.** `applyProfile()` matches the bare token
`authorized`, which is a substring of `"F-1 OPT, work authorized"`. A candidate
who accurately describes their status — currently authorized to work, needing
H-1B sponsorship next year — is classified as not needing sponsorship. The
weight is set to 0 and the single constraint governing their entire search
disappears from the composite; employers who never sponsor stop being penalised.
It fails quietly, in the direction of optimism, for exactly the population this
engine exists to serve.

**G2's deeper problem is the audit trail, not the score.** A role with no
liveness evidence is not merely scored — it is scored as `Apply`, with reason
"gates healthy", and its trace reads:

```json
{"factor":"liveness","multiplier":1,"source":"record"}
```

`source: "record"` for a measurement that was never taken. A reader auditing that
row term-by-term, exactly as Ch.11 instructs, is misled by the provenance field
itself.

## What I fixed, and what I deliberately did not

After the patch:

```
5 checks · 4 PASS · 1 FAIL (0 gating, 1 open question)   EXIT: 0
```

- **G2** — a gate with no evidence is no longer defaulted to `1.0`. The role
  returns `composite: null`, `recommendation: "Insufficient evidence"`, and names
  the missing gate. I did not substitute a safer default such as `0.5`: no record
  supports it. Downstream, `renderMarkdown()` now sorts null composites last
  (subtracting null yields NaN and an arbitrary sort order) and reports unscored
  roles separately rather than diluting the skip-rate denominator.
- **G4** — nonimmigrant status is now decisive over any "work authorized"
  phrasing; an explicit `profile.needs_sponsorship` boolean takes precedence over
  text parsing; unrecognised input assumes the constraint binds; and every
  inferred determination emits a warning. Misclassification: 2 of 5 → 0 of 5.
- **G5** — no skip rate is printed when there are no observations to compute one
  from, and no run-health verdict is drawn from a sample of zero.

**Not fixed — the `role_quality` weight.** The harness proves the consequence of
leaving it at zero: two roles differing only in role quality receive identical
composites, so the Ch.9 subsystem contributes nothing to any recommendation. It
does not propose a value, and neither do I. The scorer's own comment marks it
`[VERIFY]`, and neither Ch.11 nor the design doc pins a number — so any weight I
chose would be invented, and an invented constant in the decision core presented
as a fix is worse than the visibly-unset zero it replaces. The check is
classified `open-question`: it reports loudly and does not set a failing exit
code. `--strict` makes it gate, for anyone who wants the build red until that
decision is made.

## The break attempts found three defects in my own harness

Reported because they are the most useful thing in this PR.

1. **A fabricated finding.** With the scorer stubbed to `exit(1)`, G4 read
   `undefined` for every profile and reported *"5 of 5 misclassified"* — from a
   scorer that never ran.
2. **A false pass on silence.** G5 tests for `NaN` in stdout. A dead scorer emits
   no stdout, which contains no `NaN`, so it reported PASS.
3. **A correct fix misread as a broken harness.** After the G2 patch made
   `composite` legitimately `null`, the G2 check reported `NO RESULT` — its
   success criterion had not moved with the invariant it tested.

Fixes: a `requireRun()` precondition on every check (nothing may be concluded
from a subprocess that did not complete), a distinct `NO RESULT` verdict separate
from `FAIL`, and a G2 criterion that recognises an explicit refusal to score as
satisfying the promise.

The clean run found none of these. Only attacking the harness did.

## Verified vs. inferred

**Verified (script-output):** every PASS/FAIL, every composite quoted, the
`role_quality` weight of 0 (printed by the scorer's own audit trace), the
"2 of 5" count, and the conformance results. All from real subprocess runs.

**Inferred (contributor judgment):** that these five invariants are the ones the
book promises — I read the chapters and decided. Also the attribution of each
failure to a specific line: the harness proves the *behaviour*, I inferred the
*cause*.

**Invented by design (fixtures):** every input value. Fixtures are fictional and
describe no real employer or posting. Nothing here is a measurement of the labour
market; no coverage rate, sponsorship rate, or calibration figure is emitted
anywhere. The "2 of 5" is a count over five strings I wrote — not an error rate
over real users.

## The one limitation I cannot verify

**Fixtures are clean; real evidence records are not.** Every check runs against a
well-formed fixture I wrote. Real records arrive with missing fields, strings
where numbers belong, and nulls in unexpected places. This harness demonstrates
that the scorer behaves correctly on tidy input. It does not demonstrate that it
behaves correctly on the input it will actually receive, and I cannot show that
without real records I am not committing. Documented as failure mode 4 in the
card; not closed by this PR.

## Conformance and privacy

```
$ npm run verify
conformance: 132 files (75 md · 30 py · 24 js · 1 sh · 1 yaml · 1 json)
✓ all conform    ✓ manifest check passed (4 warnings)

$ npm run doctor
✓ no private/PII paths are tracked
```

Baseline before the change was 131 files, same four warnings — one of which was
`W1 ignore path not in .gitignore: output/`. The harness writes there, so this PR
adds that line: it protects the generated artifact and clears a pre-existing
warning.

Note: `npm ci` fails on this repository because no `package-lock.json` is
committed. Not addressed here — neither the scorer nor the harness needs any
dependency, which is why `verify` and `doctor` run regardless.

No `data/ats/` contents, no PII, all fixture companies fictional.
`output/scorer-harness-results.json` is generated and gitignored, not committed
as a source of truth.

## Chapters satisfied

Ch.8 (EMPTY vs ERROR, applied at the decision core) · Ch.9 (role quality) ·
Ch.11 (gates as multipliers, profile-conditional weights, traceable terms) ·
Ch.16 (the build and the honest run).

## Files

```
scripts/score/scorer-harness.mjs                    new    the harness
scripts/score/role-scorer.mjs                       mod    +98 −13
recipes/case-scorer-harness.md                      new    AI recipe
recipes/case-scorer-harness.card.md                 new    human card
.gitignore                                          mod    output/
logs/RUN_LOG.md                                     mod    run entry
assignments/submissions/zhenhao-ma/                  new    attestation, runs, patch script
```
