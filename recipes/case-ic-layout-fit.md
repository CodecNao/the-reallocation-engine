---
status: RUNNABLE-SAMPLE
todos_open: 8
last_gate: data-shape gate passed 2026-06-29 (score step ran; gate 4 open — 2 scripts TODO)
attestation: assignments/submissions/zhenhao-ma/case-ic-layout-fit-WORKED-RUN.md
recipe_version: 0.2.0
---

# IC Layout SOC Classification and Sponsorship Fit

## Purpose

Evaluate an IC physical-design / layout posting for OPT→H-1B viability **before**
an application is spent, by separating two things a job posting never shows you:
(1) **which SOC code** the employer will file the role under — "Layout Engineer"
has no SOC of its own, so the same work can be filed as an engineer (17-2061 /
17-2072 / 17-2071) or, because *layout* literally sits inside the drafting
occupation, as a drafter (17-3012) at a far lower prevailing-wage floor; and
(2) **whether the employer is even visible** in the sponsorship dataset, which is
built from SEC Form D private offerings and therefore omits public chipmakers.

Use it when triaging semiconductor layout postings on OPT. Do **not** use it to
conclude that an employer *will* sponsor or *will* file a given SOC — it surfaces
those questions for a human + the LCA, it does not answer them.

## Source Inventory

| Source Node | Node Type | Source URL or Path | Human Check |
|---|---|---|---|
| BLS compact SOC table | file (CSV) | `data/BLS/compact/soc_occupation_compact.csv` | Confirm 2024 OEWS vintage; wages/pivot read, not invented. |
| SOC table provenance | script | `scripts/bls/extract-soc-occupation-table.py` | The script that built the compact CSV (P3 provenance). |
| Role scorer (decision core) | script (ran) | `scripts/score/role-scorer.mjs` | Ch.11 Bayesian scorer; emits audit trail per term. |
| Form D company records | file (JSON) | `data/sec/form-d/processed/` | Private-offering universe; check employer presence/absence. |
| Form D processing | scripts | `scripts/sec/*.py` | Provenance for the company records. |
| Target posting | text | A real public IC-layout JD (summarized; no private data) | Read the JD to make the engineer-vs-drafter call by hand. |
| Scorer input | file (JSON) | `data/examples/case-ic-layout-roles.json` | Built for the run; same posting under two SOC hypotheses. |

## Inputs

| Input | Type | Source | Required? |
|---|---|---|---|
| posting | text / URL | The layout JD: tools (Cadence/Calibre), tasks (P&R, DRC/ERC/LVS, tapeout), seniority. Used to judge engineer vs drafter by hand. | Yes |
| target_employer | text | Company name, checked against `data/sec/form-d/processed/`. | Yes |
| candidate_soc_set | list | The plausible SOC codes for the posting, looked up in the compact CSV (default: 17-2061, 17-2072, 17-2071, 17-3012). | Yes |
| offered_wage | number | Optional. If present, compared against each candidate SOC's prevailing-wage floor. | No |

## Phase Gates

1. **Source gate** — required source paths present or typed-TODO. Test: `test -f data/BLS/compact/soc_occupation_compact.csv && test -d data/sec/form-d/processed`. Human: the student.
2. **Scope gate** — run declares `sample` (no live network, no writes) or an approved live mode before ingest. Test: run-envelope declares `mode`. Human: the student.
3. **Data-shape gate** — every JSON output parses before downstream steps. Test: `node scripts/score/role-scorer.mjs <input> ...` exits 0 and `python3 -m json.tool` parses the emitted `role-scores.json`. Human: the student. **[PASSED 2026-06-29]**
4. **Script-readiness gate** — every step script exists or is a typed `[TODO: DEV]`. Test: scorer exists ✓; `scripts/bls/classify-layout-role.py` and `scripts/lca/semiconductor-layout-sponsorship.py` are **TODO** ✗. Human: domain reviewer. **[OPEN — 2 scripts TODO]**
5. **Approval gate** — live network calls / external writes / immigration-legal conclusions require an approval record. This recipe ran `--sample` only, so no approval needed yet. Human: domain reviewer (immigration-aware).
6. **Report gate** — agent log (JSON) and human report (Markdown) both written. Test: scorer wrote `role-scores.json` + report `.md`. Human: the student. **[PASSED 2026-06-29]**

## Steps

1. **Look up the candidate SOC band.** Labor: AI executes, human reads.
   Command (ran): `grep -E "17-2061|17-2072|17-2071|17-3012" data/BLS/compact/soc_occupation_compact.csv`
   Output: per-code median wage + cognitive_pivot_score. **VERIFIED** — engineer band $111,910–$155,020 vs drafter 17-3012 $73,720; pivot 4.069 vs 3.25.
   Note: the alias `"Analog IC Design Engineer"` appears under **both** 17-2061 and 17-3012 — the classification trap, provable from the table.

2. **Classify the posting engineer-vs-drafter.** Labor: **human judgment** (no script yet).
   Script: `scripts/bls/classify-layout-role.py` — **[TODO: DEV]** propose a keyword+seniority classifier that flags drafter-coded full-custom work. Until built, output is **inferred by a human reading the JD**, never claimed as a run.

3. **Check sponsorship-dataset visibility.** Labor: AI executes, human reads.
   Command (ran): scan `data/sec/form-d/processed/**/*.json` for the employer name.
   Output: present (→ sponsorship vote from record) or **absent** (→ vote dropped, manual LCA check). **VERIFIED** — Micron/NVIDIA/Qualcomm/Intel/Broadcom/TI = 0 hits in the sampled records.

4. **Score the role (decision core).** Labor: AI executes, human reads.
   Command (ran): `node scripts/score/role-scorer.mjs data/examples/case-ic-layout-roles.json --out-dir <dir> --md <report>`
   Output: Apply / Consider / Skip per role with full audit trail; liveness & timeline are multiplier gates. **RAN — RUNNABLE-SAMPLE.**

5. **(Proposed) Resolve public-employer sponsorship.** Labor: AI executes.
   Script: `scripts/lca/semiconductor-layout-sponsorship.py` — **[TODO: DEV]** join public DOL LCA disclosure data to cover employers absent from Form D (e.g. Micron). Output: **proposed**, not run.

6. **Produce human report + agent log.** Labor: AI executes, human approves.
   The scorer already emits both (`role-scores.json` + `.md`). Human report adds the verified-vs-inferred split and the SOC pick. **RAN.**

## Output Contract (P5 — two customers)

### Agent log (JSON) — `logs/case-ic-layout-fit-[DATE].json`
Fields: workflow, run_id, mode, posting_id, target_employer, candidate_soc_set,
soc_band (per code: median_wage, pivot), employer_in_form_d (bool), scored_roles
(composite, recommendation, audit), gate_results, todo_items, stop_conditions,
verified_findings, inferred_findings, generated_at.

### Human report (Markdown) — `reports/generated/case-ic-layout-fit-[DATE].md`
Reader: the student (and an immigration-aware reviewer). Sections: the SOC band
table, the engineer-vs-drafter call **with the human's reasoning**, employer
visibility, the scorer recommendation, **verified vs inferred**, and the one
decision: apply / verify-then-apply / skip.

## What This Mode Can and Cannot Verify

**Can verify (from data/scripts):** the SOC wage + pivot band; the shared-alias
classification collision; whether an employer appears in the Form D records; the
scorer arithmetic and recommendation; that liveness/timeline gates zero a dead or
impossible posting.

**Cannot verify:** which SOC the employer will actually file (the core asymmetry);
layout-specific sponsorship when only company-level data exists; coverage for
public chipmakers via Form D; how automated a specific team is. These stay
**inferred or manual** and are never reported as runs.

## Stop Conditions (refuse to score rather than guess)

- Stop if the posting cannot be read clearly enough to make the engineer-vs-drafter
  call — emit "manual classification required," not a score.
- Stop (drop the sponsorship vote, don't set it to None) if the employer is absent
  from Form D — absence ≠ non-sponsor; emit "outside coverage, verify LCA."
- Stop before any live network call, external write, or immigration-legal
  conclusion unless the approval gate is cleared.
- Stop if a score would depend on a `[TODO: DEV]` script — that component stays
  inferred/manual.

## Proposed Additions (typed TODO — justified)

- `scripts/bls/classify-layout-role.py` **[TODO: DEV]** — the missing automation
  for Step 2. *Why it belongs:* the engineer-vs-drafter call is currently 100%
  human; this is the single biggest gap and the mode's reason to exist.
- `scripts/lca/semiconductor-layout-sponsorship.py` **[TODO: DEV]** — Step 5.
  *Why it belongs:* closes the public-chipmaker blind spot (the Micron gap) by
  joining DOL LCA data. Open design question: integrate vs. warn-and-defer.

## Run Commands

Real, ran (sample mode — no network, no writes):
- `npm run verify`
- `grep -E "17-2061|17-2072|17-2071|17-3012" data/BLS/compact/soc_occupation_compact.csv`
- `node scripts/score/role-scorer.mjs data/examples/case-ic-layout-roles.json --out-dir /tmp/layout-run --md /tmp/layout-run/layout-score-report.md`
- `npm run doctor` (before any PR push — privacy gate)

Proposed orchestration (the repo's `snickerdoodle`/CLI layer is doctrine, not yet a
runnable command for this recipe): **[TODO]** wire steps 1–6 behind one entry point.

## Log template — append to `logs/RUN_LOG.md`

```
### [DATE] — case-ic-layout-fit ([STATUS])
- mode: case-ic-layout-fit v[VERSION]
- inputs: [posting id] · [employer] · SOC set [codes]
- commands: [verbatim commands run]
- outputs: [paths to role-scores.json / report.md]
- result: [SOC band; employer in Form D? ; scorer recs]
- verified: [...]  inferred: [...]
- open issues: [TODO items]
- no secrets, no private application data
```
