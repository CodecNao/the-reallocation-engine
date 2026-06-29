# Worked Run — `case-ic-layout-fit`

> **Lifecycle status reached:** `RUNNABLE-SAMPLE`
> One real run against repo data + a deliberate break test. Several proposed
> scripts are still typed `[TODO: DEV]` and are *not* claimed to have run. Per
> the recipe lifecycle, an honest `RUNNABLE-SAMPLE` with evidence scores higher
> than a `VERIFIED` with none.

- **Recipe:** `recipes/case-ic-layout-fit.md`
- **By:** `Zhenhao Ma` · 2026-06-29
- **Engine commit:** `nikbearbrown/the-reallocation-engine` @ `574925a`
- **Domain:** IC physical-design / layout roles, OPT→H-1B fit for semiconductor employers

---

## 1. Inputs

| Input | Value | Provenance |
|---|---|---|
| Target posting | A real US memory-chip **IC layout** posting: standard-cell / module / top-level place-and-route, DRC / ERC / LVS through tapeout, Cadence + Calibre. | Real public job posting (summarized; no private data). |
| Target employer | **Micron** (memory manufacturer). | Chosen because it is the realistic employer for the posting. |
| SOC candidate set | `17-2061`, `17-2072`, `17-2071` (engineer-tier) vs `17-3012` (drafter-tier). | `data/BLS/compact/soc_occupation_compact.csv` (2024 OEWS). |
| Scorer input | `data/examples/case-ic-layout-roles.json` — the same posting entered under an **engineer-SOC** and a **drafter-SOC** hypothesis, plus one Form-D-visible control. | Constructed for this run (contents below). |

The classification hypothesis is the heart of the mode: **a job posting never shows
you which SOC the employer will file**, and "Layout Engineer" has no SOC code of
its own.

---

## 2. Commands run (verbatim) and real terminal output

### 2.1 Toolchain conformance (assignment "Before You Start" gate)

```
$ npm run verify
conformance: 131 files (75 md · 30 py · 23 js · 1 sh · 1 yaml · 1 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
✓ manifest check passed (4 warnings)
```

### 2.2 SOC classification band — real BLS data

```
$ grep -E "17-2061|17-2072|17-2071|17-3012" data/BLS/compact/soc_occupation_compact.csv
```

Extracted (median annual wage · cognitive_pivot_score · 2024 OEWS):

| SOC | Title | Median wage | Pivot | Note |
|---|---|---|---|---|
| 17-2061 | Computer Hardware Engineers | $155,020 | 3.999 | alt-titles incl. "Analog IC Design Engineer", "ASIC Design Engineer" |
| 17-2072 | Electronics Engineers, Except Computer | $127,590 | 4.069 | alt-titles incl. "Circuit Design Engineer" |
| 17-2071 | Electrical Engineers | $111,910 | 3.861 | low edge of engineer band |
| **17-3012** | **Electrical & Electronics Drafters** | **$73,720** | **3.25** | alt-titles **also** incl. "Analog Design Engineer", "Analog IC Design Engineer" |

**Smoking gun:** the alternate-title list *"Analog IC Design Engineer"* appears under
**both** the $155K engineer code (17-2061) **and** the $73,720 drafter code (17-3012).
A keyword matcher pointed at BLS's own alias table resolves the *same title* to two
codes **$81,300 apart** in prevailing-wage floor and **0.82** apart in pivot score.

### 2.3 Decision core — scorer on the real posting

```
$ node scripts/score/role-scorer.mjs data/examples/case-ic-layout-roles.json \
    --out-dir /tmp/layout-run --md /tmp/layout-run/layout-score-report.md
✓ scored 3 roles → Apply 1 · Consider 2 · Skip 0 (skip 0%)
```

| Role | Composite | Rec | Audit (term · value · weight · source) |
|---|---|---|---|
| Funded fabless startup (Form-D-visible **control**), 17-2072 | **0.484** | **Apply** | sponsorship 0.9·0.35 [record]; fit 0.85·0.3 [model]; role_quality 0.814·**0** [record] × liveness 1 × timeline 0.85 |
| Micron — memory layout, **17-2072 engineer** hypothesis | **0.217** | **Consider** | *(sponsorship term dropped — dataset-absent)*; fit 0.85·0.3 [model]; role_quality 0.814·**0** [record] × liveness 1 × timeline 0.85 |
| Micron — same posting, **17-3012 drafter** hypothesis | **0.217** | **Consider** | *(sponsorship term dropped)*; fit 0.85·0.3 [model]; role_quality 0.65·**0** [record] × liveness 1 × timeline 0.85 |

### 2.4 Deliberate break / verify test

```
$ node scripts/score/role-scorer.mjs /tmp/break-test.json ...
✓ scored 3 roles → Apply 0 · Consider 0 · Skip 3 (skip 100%)
```

| Probe | Composite | Result |
|---|---|---|
| Strong engineer role, **liveness = 0.0** (ghost posting) | **0.000** | **Skip** — `gated: liveness ≈ 0.000` ✓ gate fires |
| role_quality = **1.0** (max) | 0.150 | Skip |
| role_quality = **0.0** (min), all else identical | **0.150** | Skip — **identical composite** ✓ role_quality is inert |

### 2.5 Public-employer coverage check — real Form D records

```
$ python3 (scan data/sec/form-d/processed/**/*.json for chipmaker names)
total company rows scanned: 200
  micron            : 0 hits
  nvidia            : 0 hits
  qualcomm          : 0 hits
  intel             : 0 hits
  broadcom          : 0 hits
  texas instruments : 0 hits
```

All 200 sampled rows are private offerings (e.g. `DICKERSON PIKE LLC`, $1.8M raise).
Public chipmakers file no Form D, so the company universe has **no row** for them.

---

## 3. Verified vs. inferred

**Verified (came from data or a script that ran):**
- The four SOC wages and pivot scores — read from the BLS compact CSV.
- The shared alternate title `"Analog IC Design Engineer"` under both 17-2061/17-2072 **and** 17-3012 — read from the CSV.
- `npm run verify` passes (131 files conform).
- The scorer arithmetic, the three recommendations, and the audit trail — emitted by the scorer.
- **role_quality weight = 0 ⇒ the SOC signal does not move the composite** — proven by §2.4 (1.0 and 0.0 both give 0.150).
- The liveness gate zeroes a strong-but-dead posting — proven by §2.4 (0.000, Skip).
- Micron / NVIDIA / Qualcomm / Intel / Broadcom / TI absent from 200 sampled Form D company records — grep returned 0 each.

**Inferred (my judgment — NOT established by data):**
- **Which SOC the employer will actually file.** Unknowable from the posting — this is the asymmetry the mode exists to surface, not resolve.
- `role_quality.p = pivot / 5` is *my* normalization; the pivot→[0,1] mapping is not pinned by the repo.
- `fit = 0.85` is a model judgment that the posting is full-custom engineering, not drafting.
- Micron sponsorship as `"unknown"` with the vote **dropped** (not `tier:"None"`): absence ≠ non-sponsor. Setting p=0 would wrongly Skip; dropping the vote demotes to Consider and forces a manual check. That choice is mine.
- `liveness`/`timeline` factors are placeholder `your-input` values.
- The "Funded fabless startup" control is **illustrative**, not a specific named sponsor.

---

## 4. Verification method

- **Re-ran** the scorer on a separate `break-test.json` to isolate single variables.
- **Parsed the JSON** output (`/tmp/layout-run/role-scores.json`) and cross-checked the printed `Apply 1 · Consider 2 · Skip 0` count against the rows.
- **Cross-checked arithmetic:** Micron engineer row = `0.85·0.30 × 1 × 0.85 = 0.21675 ≈ 0.217` ✓ (no sponsorship term).
- **Deliberate break:** ghost posting (liveness 0) → correctly gated to 0.000; role_quality min/max → correctly identical, confirming the weight-zero claim rather than assuming it.

---

## 5. Reflection

**What went well.** Every number in my mode's thesis reproduced from real repo data:
the $54K (17-2072 vs 17-3012) and $81K (17-2061 vs 17-3012) wage-floor swings, the
~0.82 pivot gap, and the BLS alias-table collision that *is* the classification
trap. The gates behave correctly: a dead Micron posting cannot sneak through.

**What the mode / engine got wrong or could not see (the real findings):**

1. **The decision core is blind to the SOC trap.** The same posting under an
   $81K-apart classification scores **identically (0.217 = 0.217)** because
   `role_quality` weight is 0 — and the script itself flags that weight `[VERIFY]`,
   unpinned by the book. The signal layout-fit exists to surface contributes
   *nothing* to the recommendation as shipped.
2. **The data layer is blind to Micron.** Form D is private-offering only, so the
   highest-weight vote (`sponsorship`, 0.35) **drops out** for public chipmakers.
   Micron can only ever reach **Consider**, never **Apply**, on evidence alone —
   compare the 0.484 control. The engine cannot auto-clear exactly the employers
   that hire the most layout engineers.

**Next steps (proposed, marked TODO — not claimed to run):**
- `[TODO: DEV]` Add an **SOC-classification phase gate**: if the posting reads
  full-custom/analog but the inferred filing SOC is 17-3012, **flag a wage-floor
  mismatch** *before* the composite — a hard stop, not a vote. (Connects to the
  **Cognitive Pivot** layer.)
- `[TODO: VERIFY]` Propose a non-zero `role_quality` weight, or feed pivot in as a
  gate, so the classification signal can actually move the decision.
- `[TODO: DEV]` Add a **stop condition**: employer absent from Form D ⇒ refuse to
  score sponsorship, emit "outside coverage — verify LCA manually." (Connects to
  **80 Days to Stay**.)
- *Open question:* wire public **DOL LCA** data to cover Micron, or stay small and
  warn the user to check it themselves. Genuinely undecided.

---

## Attestation

- **Recipe:** `case-ic-layout-fit` v0.2.0
- **By:** `Zhenhao Ma` · 2026-06-29

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `npm run verify` | 131 files conform, manifest pass (4 warn) | toolchain green |
| `score` on layout JD (eng vs drafter SOC) | both 0.217, Consider | SOC split invisible to composite |
| `score` control (Form-D sponsor) | 0.484, Apply | sponsorship record clears Apply |
| break: liveness = 0 | 0.000, Skip (gated) | closed gate zeroes composite |
| break: role_quality 1.0 vs 0.0 | both 0.150 | role_quality weight 0 ⇒ inert |
| grep Form D for 6 public chipmakers | 0 hits each / 200 rows | public employers absent |

### Did not test
- No script yet detects the SOC trap automatically (still `[TODO: DEV]`); the
  engineer-vs-drafter call was made by a human reading the posting.
- Coverage check used the **sample** processed set (200 rows), not the full
  extracted Form D dataset.
- Did not run `ats:liveness` against a live Micron URL.

### Broke during testing, fixed
- First attempt set Micron `sponsorship.tier:"None"` → wrongly produced **Skip**.
  Changed to dropping the vote with `tier:"unknown"` so absence reads as
  "verify manually," not "does not sponsor." (Composite moved 0.178 → 0.217,
  Skip → Consider.)

---

## RUN_LOG entry (append to `logs/RUN_LOG.md`)

```
### 2026-06-29 — case-ic-layout-fit (RUNNABLE-SAMPLE)
- mode: case-ic-layout-fit v0.2.0
- inputs: real Micron memory-layout posting; SOC set {17-2061/72/71, 17-3012}; data/examples/case-ic-layout-roles.json
- commands: npm run verify; node scripts/score/role-scorer.mjs (layout JD + break test); grep SOC compact; scan Form D processed
- outputs: /tmp/layout-run/role-scores.{json,md}; /tmp/break/r.md
- result: engineer-SOC and drafter-SOC score identically (0.217) — role_quality weight 0; Micron drops sponsorship vote → Consider not Apply; gate test 0.000 Skip confirmed
- open issues: SOC-trap detector [TODO: DEV]; role_quality weight [TODO: VERIFY]; public-employer stop condition [TODO: DEV]; DOL LCA coverage (open question)
- no secrets, no private application data
```
