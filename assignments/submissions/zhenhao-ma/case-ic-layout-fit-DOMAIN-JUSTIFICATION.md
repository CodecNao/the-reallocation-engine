# Domain Justification — `case-ic-layout-fit`

## Who uses this, and in exactly what situation

An international graduate student **transitioning from software engineering into IC
physical design (layout)**, on OPT, targeting US semiconductor employers
(memory / analog / full-custom), who must decide — posting by posting — whether a
role is worth an application that depends on H-1B sponsorship. The defining detail
is the career switch: someone who came up in software does **not** yet carry the
folk knowledge that "layout" is a *drafting* keyword in the federal occupation
system, and that the same job can be filed under codes ~$81K apart.

## The information asymmetry — what this person cannot see from a posting

A job posting shows the title, the tools, and the tasks. It hides the two facts
that actually decide sponsorship viability:

1. **Which SOC code the employer will file.** "Layout Engineer" has no SOC of its
   own. The mode reads the real BLS compact table and lays out the band: engineer
   tier `17-2061` $155,020 / `17-2072` $127,590 / `17-2071` $111,910, versus
   drafter `17-3012` **$73,720** — a **$81,300 prevailing-wage-floor swing** and a
   pivot-score gap of 0.82, for the *same work*. The trap is provable from BLS's
   own data: the alias **"Analog IC Design Engineer" appears under both** the
   $155K engineer code and the $73.7K drafter code, so a keyword matcher resolves
   one title to two very different futures.
2. **Whether the employer is even in the dataset.** The sponsorship layer is built
   from SEC Form D private offerings; public chipmakers file no Form D. Verified by
   the run: **Micron, NVIDIA, Qualcomm, Intel, Broadcom, and TI returned 0 hits**
   across the sampled Form D company records. The engine is blind to exactly the
   employers that hire the most layout engineers.

Neither fact is legible to the applicant until the LCA — too late to re-target.

## How it connects to the engine layers

- **The Cognitive Pivot** — the mode consumes each SOC's `cognitive_pivot_score`.
  Its sharpest finding is that this signal is currently **disconnected** from the
  decision core: the scorer's `role_quality` weight is `0` (flagged `[VERIFY]` in
  the script itself), so the engineer-vs-drafter classification — the whole point —
  contributes nothing to the recommendation.
- **80 Days to Stay** — the mode exposes the structural Form D coverage gap and
  refuses to convert "absent" into "non-sponsor."
- **Job-Ops** — liveness stays a hard multiplier gate; a dead posting is zeroed
  regardless of how strong the votes are.

## Failure modes (domain-specific — the shape of the error, and who can't catch it)

**1. The silent drafter-trap pass.** Because `role_quality` weight is 0, the same
posting under an engineer-SOC and a drafter-SOC hypothesis scores **identically
(verified: 0.217 = 0.217)**. The mode can return a clean "Consider" for a role the
employer intends to file at the $73.7K drafter floor, and nothing in the output
looks wrong. *Who struggles most to catch it:* the software-to-layout switcher this
mode is built for — they have the engineering skill but not the classification
instinct, so they read "Consider," apply, and meet the wage-floor cliff only at the
LCA. The error is hardest to catch for precisely the person most likely to hit it.

**2. The "Skip the giant" false negative.** If employer-absence is encoded as
sponsorship tier "None" instead of "unknown," the mode **Skips Micron, NVIDIA, and
every public chipmaker** — and the skip looks like diligent filtering. *Who
struggles to catch it:* an international student who trusts the data layer and reads
"not in the dataset" as "doesn't sponsor," silently deleting their best targets.
The mode guards against this by **dropping the sponsorship vote** rather than
zeroing it — verified to move Micron from Skip (0.178) to Consider (0.217),
forcing a manual LCA check instead of a confident wrong answer.
