# Teaching a decision engine to fail out loud

**A behaviour harness for the Reallocation Engine's role scorer**
Zhenhao Ma · `«FILL: PR link»` · `«FILL: demo link»`

---

## The problem

The Reallocation Engine helps international students decide which jobs are worth
applying to. Its decision core takes evidence about a role — is the employer
known to sponsor, is the posting still live, does the timeline fit a visa window
— and combines it into one recommendation: Apply, Consider, or Skip.

For someone on an F-1 visa, that recommendation is expensive to get wrong. A
wasted application is a week of a finite runway. The failure that costs the most
is not the system crashing. It is the system returning a well-formed, confident,
*wrong* answer — a `Apply` for an employer who has never filed an H-1B petition.
Nothing in the output looks unusual. There is no error to notice.

The engine's design documents make careful promises about how the decision core
must behave. Gates like liveness must *multiply*, so that a dead posting collapses
the score rather than merely lowering it. Weights must respond to the candidate's
visa situation. Those promises are written in prose.

Prose cannot fail a build. I checked the repository before writing anything:
nothing there would notice if a gate quietly stopped being a gate.

## What I built

`scorer-harness.mjs` — a behaviour harness that converts each of the engine's
stated promises into an executable assertion.

It does not test functions. It runs the scorer as a subprocess through its real
command-line interface, feeds it fixtures that differ in exactly one field, and
compares the resulting scores. That design choice matters: it tests the contract
a caller actually depends on, and it required no changes to the code under test.

```
   fixture (one field varied)
            │
            ▼
   role-scorer.mjs  ──►  role-scores.json
            │                   │
            └───────────────────┘
                    │
                    ▼
        assert the promised relationship
                    │
                    ▼
   PASS / FAIL  +  the composites behind the verdict
```

The harness classifies its own findings, which turned out to be the most
important design decision in the project:

- **guard** — a promise the system already keeps; the check prevents regression
- **bug** — a defect with a correct answer
- **open question** — behaviour the design deliberately leaves unpinned

Only the first two set a failing exit code.

## The measurable improvement

| | Before | After |
|---|---|---|
| Behavioural promises enforced by an executable check | 0 | 5 |
| Checks passing | 1 | 4 |
| Gating failures in the decision core | 3 | 0 |
| Authorization strings misclassified, of the 5 tested | 2 | 0 |
| Harness exit code | 1 | 0 |

The number worth stating precisely: of five realistic work-authorization strings,
two were translated into the wrong sponsorship requirement before the fix and
none after. That is a count over a five-row sample I wrote — not a measured error
rate over real users, and I am not going to describe it as one.

One open question is deliberately left failing. More on that below.

## The finding

The engine decided whether a candidate needs visa sponsorship by pattern-matching
free text against a list of tokens. One of those tokens was `authorized`.

An F-1 student on OPT is *currently work-authorized* and *will need sponsorship
next year*. Both are true at once. Typing the accurate sentence — `"F-1 OPT, work
authorized"` — matched the token, and the engine concluded that sponsorship was
not a constraint. It set that weight to zero and scored every employer as if visa
status were irrelevant.

The single factor that governs an international student's entire job search was
being silently removed, for the users the system was built to serve, in the
direction that produces false optimism.

The fix makes visa status decisive over any "authorized" phrasing, prefers an
explicit structured field over parsing prose, assumes the constraint binds when
input is unrecognised, and labels every inferred determination as inferred.

A second finding is quieter and, I think, worse. A posting whose liveness was
never checked did not merely get scored — it got `Apply`, with the reason "gates
healthy", and an audit trace reading:

```json
{"factor":"liveness","multiplier":1,"source":"record"}
```

`source: "record"` for a measurement nobody ever took. The system's central
promise is that every term traces to its source; here the provenance field itself
asserts something false. A reader auditing that row term-by-term — exactly what
the design instructs them to do — would be misled by the audit trail.

## What I found by attacking my own work

The clean run found three defects in the engine. Deliberately attacking the
harness found three more — in the harness.

I stubbed the scorer to exit immediately, so it produced no output at all, and
re-ran. Two checks reported confident verdicts anyway. One compared `undefined`
against its expected values and announced *"5 of 5 authorization strings
misclassified"* — a finding manufactured from a program that never ran. Another
tested for the string `NaN` in the output, found none in an empty buffer, and
reported PASS. My tool for catching plausible-looking wrong answers was producing
plausible-looking wrong answers.

The third surfaced when the fix landed: once a missing gate legitimately produced
a null score, the check that tested for it read null as "the scorer didn't run"
and reported no result. The check's success criterion hadn't moved with the
invariant it was testing, so a correct fix registered as a broken harness.

All three are now closed — a precondition that refuses to conclude anything from
an incomplete run, a `NO RESULT` verdict kept distinct from `FAIL`, and a
criterion that recognises an explicit refusal to score as satisfying the promise.

I am reporting this because it is the most useful thing I learned. "I found
nothing" and "I could not look" produce identical-looking green checkmarks, and
nothing in a passing test suite distinguishes them unless you build the
distinction in on purpose.

## Verified vs. inferred

I think this distinction is the actual professional signal, so I will be exact
about it.

**Verified.** Every pass, every failure, every score I quote came from running the
real scorer as a subprocess and reading the JSON it wrote. When I report that the
role-quality weight is zero, that is the scorer's own audit trace printing it, not
my claim about it.

**Inferred.** That these five invariants are the ones the design actually
promises — I read the chapters and decided. And when I attribute a failure to a
specific line, the harness proved the *behaviour*; I inferred the *cause*.

**Invented, by design.** Every input. The fixtures are fictional and describe no
real company or posting. This project emits no coverage rate, no sponsorship
rate, no calibration figure. Nothing in it is a measurement of the world, and the
attestation labels each emitted field accordingly.

## Failure modes I designed against

**Drift.** The likeliest long-run failure is not a red suite but a green one. If
someone renames a field, my fixture stops supplying it, the scorer defaults it,
and every gate check passes while testing nothing. One check exists specifically
as the canary: it asserts a numeric relationship — halving a gate must halve the
score — that cannot hold by accident against an ignored field.

**Reporting a finding from a run that never happened.** If the scorer exits
non-zero, two null scores compare as equal, and a careless check would report
"identical, therefore failed" from two runs that never occurred. That is
finding-shaped output with nothing behind it. Every check null-guards before
comparing and exits with a distinct code meaning *no result*, so a caller can
tell "I found nothing" from "I could not look."

**Over-claiming.** The role-quality weight is unset, not wrong. Filing it as a
defect — or "fixing" it by choosing a number — would put an invented constant
into the decision core wearing the costume of a correction. The classification
system exists to stop me doing that.

## The limitation I cannot verify

Every check runs against a well-formed fixture I wrote. Real evidence records
arrive with missing fields, strings where numbers belong, and nulls in places
nobody planned for.

This harness shows the scorer behaves correctly on clean input. It does not show
that it behaves correctly on the input it will actually receive — and I cannot
show that without real records I am not willing to commit. That gap is documented
in the contribution, not papered over. It is the first thing I would build next.

## What the system hands back to a person

The harness can prove that `"F-1 OPT, work authorized"` is parsed into the wrong
sponsorship requirement. It cannot know what any individual meant by those words.
The same sentence from someone with two years of STEM OPT left and from a green
card holder are different sentences, and no pattern matching recovers the
difference. Only asking does.

It cannot decide whether role quality deserves weight — that is a judgment about
what makes a job good, and the design leaves it open on purpose. And it cannot
tell you whether an `Apply` was good advice, because that would require knowing
what happened after the application. The engine never sees that. Neither does
this.

---

*Built as a contribution to `nikbearbrown/the-reallocation-engine`. Full
attestation, run log, and break-attempt record in the PR.*
