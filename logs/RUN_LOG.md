# Recipe Run Log

Human-readable history for recipe-driven work.

Use this file to record what was run, what worked, what failed, and what should
be tested next. Keep entries short. Do not include secrets, real phone numbers,
private emails, or sensitive application notes.

## 2026-06-12 — Wrote Tutorial 00 (Exercise Zero) in full

- **Recipe:** manual
- **Inputs:** `docs/search-profile-design.md` v3, `data/bls/compact/soc_occupation_compact.csv` schema, MYCROFT.md attestation rules
- **Outputs:** `docs/tutorials/00-personal-layer.md` — privacy-first setup (gitignore gate), paste-ready agent prompt (3 tasks with hard stops), resume.json schema with evidence fields and attested timestamp, full 8-question conditional intake tree (visa block only after a "no" at Q4), gaps draft with 3 required student edits (kill a row / rewrite a row / write one startable plan), migration rule, 4 exercises (delete test, inflation hunt, multi-model SOC second opinion, six-hour test), what-can-go-wrong table; index updated to ready
- **Result:** Exercise Zero runnable today in Claude Code with zero new scripts. Extraction-corrections count gives each student a personal fluency-vs-truth measurement on day one.
- **Open issues:** SOC matching quality from free text untested against real student answers; the agent prompt should be re-tested once the config generator lands (Tutorial 01 hand-edit note then changes); per-section attestation flags deliberately omitted in favor of one file-level timestamp — revisit if students attest carelessly.

## 2026-06-12 — Dropped personas for conditional intake; added gaps file + Exercise Zero

- **Recipe:** manual (human design input: don't invent personas, ask for relevant facts — past for resume, future for wants/constraints; generate an editable gaps file; gaps migrate to resume with evidence; this is the first exercise)
- **Inputs:** `docs/search-profile-design.md` v3, `data/bls/compact/soc_occupation_compact.csv` (skill_*_lv / ability_*_lv columns)
- **Outputs:** design doc revised — personas replaced by conditional intake over canonical fields (question tree branches on answers, no labels); new gaps-file section (generated draft from O*NET levels + scanned-posting keyword frequency, human-owned thereafter, regenerate-as-diff, migration-to-resume.json only with evidence); Exercise Zero defined; tutorials index gains Tutorial 00 (planned)
- **Result:** Personal layer is three files with distinct epistemic status: resume.json (attested past), profile.yml (declared future), gaps.md (managed delta). Aspirational resume entries become structurally impossible. Engine extends from application allocator to development allocator (gaps = what to build in the six hours).
- **Open issues:** gap computation quality unknown until tried against a real resume + SOC pair; Tutorial 00 not yet written; intake question tree not yet drafted.

## 2026-06-12 — Added profile metadata + personas to the design

- **Recipe:** manual (human design input: resume facts ≠ search metadata; US citizens shouldn't see visa questions; start with a few personas, add later)
- **Inputs:** `docs/search-profile-design.md` v2
- **Outputs:** new "Profile metadata" section — four starting personas (international student, US new grad, employed-and-quietly-looking, flexible/part-time); two-layer model: canonical profile fields + personas as intake routing/defaults only; scorer weights become a function of profile fields (sponsorship weight ≈ 0 for citizens, timeline gate persona-conditional)
- **Result:** Persona proliferation avoided — combinations are field combinations, not new personas; engine reads fields, never labels. New-persona criterion is evidence-driven (recurring intake combinations the presets serve badly).
- **Open issues:** discretion mechanics for the employed persona (employer-affiliate exclusion list source?); whether persona presets live in data/ as a versioned file (recommended) or in the intake recipe prose.

## 2026-06-12 — Revised profile design: roles-first intake + resume.json layer

- **Recipe:** manual (human design input: never ask for companies; ask what they want to do → SOC codes → suggest companies; resume converted to verified JSON, generated docs derive from it)
- **Inputs:** `docs/search-profile-design.md` v1, `data/bls/compact/soc_occupation_compact.csv`, `scripts/resumes/`
- **Outputs:** design doc revised — 5-step pipeline (intake → SOC resolution with human confirmation gate → generate → review/prune → scan); new resume.json section (upload → extract → field-by-field human attestation → all resume artifacts generated as projections, never rewrites); search/ layout extended; course-project mapping section (student H-1B probability tools and resume-JSON converters are the engine's missing components)
- **Result:** Companies are now an output of the engine, not an input. Resume claims become machine-checkable against attested source fields — verified-data contract extended to the student's own history.
- **Open issues:** unchanged 4 open decisions + new: JSON Resume schema as-is vs extended; where extraction-hallucination checking lives (conformance script vs gate checklist).

## 2026-06-12 — Designed profile-driven config generation

- **Recipe:** manual (triggered by human design question: why does a human hand-edit portals.yml?)
- **Inputs:** `recipes/_profile.template.md`, `scripts/ats/detect-ats.py`, `data/bls/compact/soc_occupation_compact.csv` (alternate_titles columns), `data/80-days-to-stay/`, `scripts/ats/scan.mjs` (REALLOCATION_ENGINE_PORTALS env var)
- **Outputs:** `docs/search-profile-design.md` (intake → search/profile.yml → generated portals.yml with O*NET + curated synonym expansion, evidence-derived company suggestions, gitignored personal `search/` folder); Tutorial 01 Step 1 reframed (hand-editing = looking under the hood, not steady state)
- **Result:** Design connects four existing-but-disconnected pieces: profile template, detect-ats.py, O*NET alternate titles, sponsorship data. Human reads/judges generated config; never writes it.
- **Open issues:** Generator script, synonyms seed file, profile recipe, and `.gitignore` entry not yet built — design awaits approval on 4 open decisions (folder name, intake form, suggestion cap, fate of personal files in data/ats/).

## 2026-06-12 — Verified Greenhouse API liveness; fixed tutorial browser-check step

- **Recipe:** manual (triggered by human observation: `job-boards.greenhouse.io/databricks` redirects to the company careers site; same pattern at Duolingo)
- **Inputs:** `scripts/ats/providers/greenhouse.mjs` (read: provider derives `boards-api.greenhouse.io/v1/boards/<slug>/jobs` and fetches with `redirect: 'error'`); fetched the Databricks and Duolingo API endpoints directly
- **Outputs:** `docs/tutorials/01-first-scan.md` Step 6 rewritten (verify against the API JSON, not the board page, with explanation of the redirect pattern); new what-can-go-wrong row
- **Result:** Both APIs live and serving: Databricks ≈97 KB payload, 100+ postings; Duolingo ≈78 KB, ≈80 postings. The browser redirect is a UI relocation, not an API removal — human-facing board pages increasingly redirect to branded careers sites while the JSON API keeps serving. Scanner unaffected by design (API-only + redirect:'error'). This partially closes the prior open issue "provider fetch not verified": the endpoint is confirmed reachable and serving from this environment's fetch tool, though still not via the scanner process itself.
- **Open issues:** Job counts are approximate (counted from match listings, not a parsed total). If Greenhouse ever moves or gates boards-api, the provider fails loudly (`fetch failed` / redirect error) — correct behavior, but worth a tutorial-02 liveness note. Some companies may genuinely leave Greenhouse; a redirected board page plus a 404 from boards-api is the signature of that case.

## 2026-06-12 — Added tutorials layer (docs/tutorials/)

- **Recipe:** manual
- **Inputs:** `data/ats/portals.example.yml`, `scripts/ats/scan.mjs` (usage header, flags, default paths), `package.json`, MYCROFT.md conventions
- **Outputs:** `docs/tutorials/01-first-scan.md` (full predict→run→inspect→judge→record walkthrough with 6 graduated exercises and a what-can-go-wrong table), `docs/tutorials/README.md` (index; tutorials 02–05 marked planned), `DOMAIN.md` first-win section now points to the tutorial
- **Result:** The first-win command is no longer a bare one-liner; a student can complete the scan loop unassisted. Exercise 6 rehearses the attestation format; exercise 4 teaches the conformance/adequacy boundary by deliberate breakage.
- **Open issues:** Sample output numbers in Step 5 are illustrative (live fetch is blocked in this sandbox — could not capture a real success report). Tutorials 02–05 are titles only. Exercise 4's typo-provider behavior was not executed; the tutorial asks the student to discover it, but an instructor should verify the actual error message once on an unrestricted machine.

## 2026-06-12 — First honest run: BLS extract + ATS scan dry-run

- **Recipe:** manual (pre-recipe verification run under MYCROFT.md contract)
- **Inputs:** `scripts/bls/extract-soc-occupation-table.py` against `data/bls/db-30-2-text/` + `data/bls/oesm24nat/`; `npm run ats:scan -- --dry-run` with `REALLOCATION_ENGINE_PORTALS=data/ats/portals.example.yml`
- **Outputs:** `data/bls/compact/soc_occupation_compact.csv` (1,016 occupations; SHA-256 recorded in audit), `data/bls/bls-audit.md` (962/1,016 = 94.7% matched to OEWS 2024 detailed SOC rows)
- **Result:** BLS extractor runs clean after the `Skills.txt` fix; audit generated and read; CSV schema unchanged (`skill_*` columns intact). ATS scan loaded the example portal config, matched the Greenhouse provider, ran filter/dedup/report logic, and wrote nothing in dry-run mode — machinery verified.
- **Open issues:** ATS scan's live fetch failed in the sandboxed environment (network egress blocked) — provider fetch is **not** verified end-to-end; rerun on an unrestricted machine. BLS extractor was not executed pre-fix, so "failed before fix" is inferred from the missing `Recipes.txt` file, not observed. `playwright`/`sharp` not installed; only `js-yaml`/`glob` were needed for this run.

## 2026-06-12 — Fixed rename-shrapnel bugs; added lifecycle frontmatter

- **Recipe:** manual
- **Inputs:** `scripts/bls/extract-soc-occupation-table.py`, `scripts/ats/analyze-patterns.py`, `scripts/ats/README.md`, 8 core recipe files
- **Outputs:** three one-line fixes (`Recipes.txt`→`Skills.txt`; `modes/RUN_LOG.md`→`logs/RUN_LOG.md` in script and README; audit prose "recipe Level scores"→"skill Level scores"); MYCROFT.md lifecycle frontmatter added to `_shared` (type: contract) and `scan`, `pipeline`, `oferta`, `tracker`, `pdf`, `patterns`, `update` (status: DRAFT, todos_open: 11 each)
- **Result:** Known defects 1–2 from DOMAIN.md closed. Recipe status is now machine-readable.
- **Open issues:** `scripts/cowork-agentic-repo.py` still contains mangled prose ("Recipes and recipes…") — cosmetic, not load-bearing. The 33 non-core recipes have no frontmatter yet.

## 2026-06-11 — Established MYCROFT.md as source of truth

- **Recipe:** manual
- **Inputs:** architecture review of the full repo; Codex cross-review; Gru SDD; principles discussion (Cowork session)
- **Outputs:** `MYCROFT.md` (new — constitution v0.1.0: 8 principles, verification stack, recipe lifecycle, TODO-closure evidence, attestation format), `DOMAIN.md` (new — domain manifest: actual layout, runnable command surface, known gaps/defects), `CLAUDE.md` (rewritten as pointer to MYCROFT.md), `AGENTS.md` (rewritten as pointer; also removed "recipes, recipes" rename shrapnel)
- **Result:** One governing file; precedence rule explicit; current-vs-planned architecture separated (domain layout is current; `data/raw`/`data/verified`/snickerdoodle CLI marked roadmap). Claude Code named as v0 runtime.
- **Open issues:** Known defects listed in DOMAIN.md §Known gaps: BLS `Recipes.txt` bug, `modes/RUN_LOG.md` path bug, scorer unimplemented, no recipe has a logged run, doctor script not built, person-named recipes need privacy review, skill/recipe terminology in manuscript unreconciled. README and `docs/` not yet updated to cite MYCROFT.md.

## 2026-05-28 — Recipe folder converted to verified-data workflows

- **Recipe:** manual
- **Inputs:** `recipes/`, `scripts/`, `README.md`, `DATA_CONTRACT.md`
- **Outputs:** `recipes/_shared.md`, `recipes/README.md`, active recipes, and draft/helper recipe files
- **Result:** Recipes now point students toward repo scripts, audits, and logs instead of prompt-only recipes.
- **Open issues:** Some workflows remain intentionally marked as draft until supporting scripts exist.

## 2026-05-28 — Removed copied Job-Ops source tree

- **Recipe:** manual
- **Inputs:** `data/career-ops-main/`, `scripts/ats/`, `recipes/`, `resumes/`
- **Outputs:** `.gitignore`, `README.md`, `DATA_CONTRACT.md`, provider docs
- **Result:** Removed the copied reference directory after useful pieces had been adapted into maintained repo paths.
- **Open issues:** Provenance now lives in docs and adapted files, not in a local source copy.

## 2026-05-28 — Normalized data directory names

- **Recipe:** manual
- **Inputs:** old mixed-case 80 Days and BLS data directories, `data/sec/form-d/`
- **Outputs:** `data/80-days-to-stay/`, `data/bls/`, lower-kebab SEC extracted folders, updated docs/scripts
- **Result:** Source/reference data directories now use lower-case kebab-case names. Maintained automation now uses lowercase `scripts/` by repo convention.
- **Open issues:** Some source data filenames and JSON field values still preserve upstream naming.

## 2026-06-13 -- Context parity + privacy pass + doctor (consolidated; re-logged after a git reset dropped prior entries)

- **Parity:** brought this repo to the Madison/Mycroft context architecture — ported `conformance.mjs`/`to-markdown.mjs`/`build-instructions.mjs`, added `instructions/` (6 shared rule modules + `reallocation-engine.md` + manifest) compiling to generated root `AGENTS.md`/`CLAUDE.md`, plus `.claude/` hooks (archive-guard + conformance-check) and `.github/workflows/verify.yml` (conformance + instruction drift guard). `MYCROFT.md` confirmed identical to the other Mycroft-domain repos.
- **Privacy pass (gap #6):** 14 person-named case-study recipes anonymized -> `case-*.md` role slugs; student names + Canvas submission-IDs scrubbed. Verified zero residual PII repo-wide. Git **history** also purged via `git filter-repo` (--invert-paths on the 14 old paths + --replace-text on names/IDs); force-pushed.
- **doctor (gap #5):** `scripts/doctor.mjs` (`npm run doctor`) — environment + npm-command-target + domain-dir checks + recipe-status dashboard. Surfaced gap #8: only 7/42 recipes carry lifecycle frontmatter; declared todos_open (77) vs 518 body `[TODO` markers.
- **Note:** a later `git reset`/`filter-repo` reverted edits to pre-existing tracked files (DOMAIN.md gaps reconciliation, this log, package.json scripts, generated AGENTS/CLAUDE) while new files survived; re-applied 2026-06-13. New files were unaffected.
- **Result:** doctor + conformance green; DOMAIN.md known-gaps reconciled (#1,#2,#5,#6 resolved; #3,#4,#7,#8 open).

## 2026-06-13 -- Backfill recipe lifecycle frontmatter (gap #8)

- **Commands:** One-off migration over recipes/ (excl. README + templates): prepended a `status/todos_open/last_gate/attestation/recipe_version` block to the 34 recipes that lacked one, injected the lifecycle keys into `_shared.md` (kept `type: contract`), and reconciled `todos_open` to the true `[TODO`-marker body count everywhere. 7 already-stamped recipes unchanged (idempotent).
- **Result:** doctor now reports 42/42 recipes with frontmatter, 0 missing; declared todos_open == body markers (518 = 518, mismatch gone). Conformance clean. DOMAIN gap #8 resolved.
- **Open issues:** All 42 remain `status: DRAFT` — promotion past DRAFT still requires a real gated run (gap #4) + attestation. Frontmatter is now the substrate for that lifecycle tracking.

## 2026-06-13 -- Build the Bayesian Role Scorer (gap #3)

- **Skill:** Implement the book's Chapter-11 decision core — the composite role scorer / combiner.
- **Inputs:** spec from `chapters/11-the-bayesian-role-scorer.md` (composite form, weights sponsorship 0.35 / fit 0.30, multiplicative liveness+timeline gates, threshold ~0.3, Apply/Consider/Skip, override discipline, auditability thesis) + `docs/search-profile-design.md` (weights are a function of the profile, not constants). Confirmed exact structure by reproducing the chapter's worked example backward.
- **Commands:** Wrote `scripts/score/role-scorer.mjs` — combiner only (reads per-role evidence records; does not compute components). Multiplicative gates × weighted votes; profile-conditional sponsorship weight (→0 when authorization doesn't need sponsorship); per-term audit trace with source labels (record / model-judgment / your-input); documented-override support (override without a reason is ignored, per Ch.11); JSON + Markdown report + skip-rate summary. Config block annotates every weight/threshold with provenance; role_quality weight + Consider floor left as documented `[VERIFY]` defaults (not pinned by the chapter). Built fixture `data/examples/ch11-roles.json` reproducing the chapter's two roles + gate/Consider/override cases. Wired `npm run score`.
- **Result:** Verified against the book — Cambridge biotech composite 0.446 → Apply; identical-fit non-sponsor 0.178 → Skip; ghost posting gated to 0 → Skip; Likely-tier → Consider; documented override flips Skip→Apply and records the reason. Conformance clean; doctor sees the new command. DOMAIN gap #3 resolved.
- **Open issues:** `[VERIFY]` weights (role_quality, Consider floor) need confirmation vs the system design document before real decisions. The scorer is a pure combiner — wiring the upstream feeds (Ch.7/8/9/10) to emit the per-role evidence envelope is separate (the run-envelope schema is still `[TODO: DEFINE]` in recipes/pipeline.md) and tied to the honest run (gap #4).

## 2026-06-14 -- The honest run (gap #4): first gated, logged recipe run

- **Recipe:** `oferta` (Ch.11 Bayesian role scorer), **sample mode**, run id `oferta-2026-06-14-001`.
- **Command:** `npm run score data/examples/ch11-roles.json` (stored script; no ad-hoc code).
- **Inputs:** verified fixture `data/examples/ch11-roles.json` + run-envelope (`mode: sample`).
- **Gates:** 1 Source ✓ · 2 Scope ✓ (sample) · 3 Data-shape ✓ · 4 Script-readiness ✓ · 5 Approval n/a (no live network/writes/model) · 6 Report ✓. Human adequacy gate: **PENDING attestation.**
- **Result:** 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%). Cambridge 0.446 / non-sponsor 0.178 reproduce Ch.11. Output fully sourced (record / model-judgment / your-input).
- **Artifacts:** `logs/oferta-2026-06-14.json`, `reports/generated/oferta-2026-06-14.md`, `data/examples/role-scores.{json,md}`.
- **Flags:** skip-rate 40% < 50% (curated fixture, expected); `role_quality` weight 0 [VERIFY] drops the Ch.9 signal (gap #3); 1 documented override.
- **Open:** machine half of P4 done; **human adequacy (P4 second half) outstanding** — attest to promote `oferta` past DRAFT.

## 2026-06-14 -- Rename MYCROFT.md → SNICKERDOODLE.md (constitution rebrand)

- **Why:** disambiguate this repo's constitution from the shared **Mycroft** agent-OS frame it was forked from. Renamed to a cookie-recipe name fitting the book's "recipe" vocabulary.
- **Did:** `git mv MYCROFT.md SNICKERDOODLE.md`; rebranded the file's own identity (`# SNICKERDOODLE`, "Snickerdoodle is an agent-operating system…", lineage line preserved). Swapped every `MYCROFT.md` path/governance reference (instructions/ source, `conformance.mjs` required-files list, `manifest.yml` `@import`, CI comment, `DOMAIN.md`, `status.md`, `archive/README.md`, docs/). Rebranded this-repo "Mycroft" prose (P4, "a Snickerdoodle domain", audit doc); **kept** the cross-repo "Madison and Mycroft" shared-library mention.
- **Rebuilt:** `node scripts/build-instructions.mjs --promote` → `AGENTS.md` + `CLAUDE.md` regenerated; `CLAUDE.md` now imports `@SNICKERDOODLE.md`.
- **Untouched:** `data/` CSVs (real company names containing "mycroft") and prior RUN_LOG history (append-only).
- **Result:** conformance + doctor green; no stale `MYCROFT.md` outside data/history.
## 2026-08-13 — Scorer gate & weight behaviour harness

- **Recipe:** case-scorer-harness
- **Inputs:** `scripts/score/role-scorer.mjs` @ upstream `3124767`; fictional
  fixtures generated in-process; no file from `data/` read
- **Outputs:** `scripts/score/scorer-harness.mjs` (new),
  `output/scorer-harness-results.json` (generated, gitignored),
  `assignments/submissions/zhenhao-ma/runs/{prefix,break-attempts,postfix}-run.txt`
- **Result:** Pre-fix 5 checks · 1 PASS · 4 FAIL (3 gating, 1 open question),
  exit 1. All five outcomes matched the predictions recorded from reading the
  source — zero surprises. Post-fix 5 checks · 4 PASS · 1 FAIL (0 gating,
  1 open question), exit 0. `verify` 131 → 132 files conforming, four
  pre-existing warnings unchanged; `doctor` green throughout; privacy check clean.
- **Fixes applied:** G2 (a gate with no evidence no longer defaults to 1.0 —
  returns `Insufficient evidence` and names the missing gate), G4 (nonimmigrant
  status is decisive over "work authorized" phrasing; explicit
  `needs_sponsorship` field preferred; text inference now warns), G5 (no skip
  rate emitted from zero observations). Diff: 1 file, +98 −13.
- **Break attempts:** four run against the unpatched scorer. Two succeeded, and
  both found defects in the harness rather than the engine — G4 reported
  "5 of 5 misclassified" from a scorer stubbed to exit(1) (a fabricated finding),
  and G5 reported PASS against an empty stdout (silence read as correctness). A
  third defect surfaced when the G2 fix landed: the check read a legitimately-null
  composite as "no result". All three fixed — `requireRun()` precondition,
  `NO RESULT` verdict distinct from `FAIL`, and a G2 criterion that accepts an
  explicit refusal to score.
- **Open issues:**
  - G3 (`role_quality` weight) left failing on purpose. The weight is marked
    `[VERIFY]` in the scorer and pinned by neither Ch.11 nor the design doc.
    The harness proves the consequence — two roles differing only in role quality
    receive identical composites — and proposes no value, because choosing one
    would mean inventing a constant the record does not contain. Classified
    `open-question`; does not gate. Run with `--strict` to make it gate.
  - Fixtures are well-formed by construction. The harness proves the scorer
    behaves on clean input, not on the malformed records it will actually
    receive. Largest remaining gap; not closed.
  - `npm ci` fails on this repository — no `package-lock.json` is committed. Not
    addressed; neither the scorer nor the harness has dependencies.
  - `manifest-check` warnings for `reports/generated/`, `archive/`, and
    `private/` remain. Only `output/` was added to `.gitignore`, because only it
    is written by this contribution.
