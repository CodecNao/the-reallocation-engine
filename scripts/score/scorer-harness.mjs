#!/usr/bin/env node
// scorer-harness.mjs — gate & weight BEHAVIOR harness for the Bayesian Role
// Scorer (scripts/score/role-scorer.mjs, book Chapter 11).
//
// WHAT THIS IS
//   Ch.11 makes behavioral promises about the decision core:
//     • liveness and timeline are GATES — multipliers, not addends, so a ghost
//       posting or an impossible start date zeroes the composite regardless of
//       how strong the votes are;
//     • every term is traceable to a source type;
//     • weights are a function of the candidate profile, not constants.
//   Prose promises are not enforcement. This harness turns each promise into an
//   executable assertion that fails loudly when the promise is broken.
//
// WHAT THIS IS NOT
//   It is not a unit-test suite for internal functions, and it does not import
//   anything from role-scorer.mjs. It runs the scorer as a subprocess through
//   its real CLI and reads the real role-scores.json it writes. It therefore
//   tests OBSERVABLE BEHAVIOR — the contract a caller depends on — not
//   implementation detail. role-scorer.mjs is not modified or imported.
//
// FIXTURES
//   All fixtures are fictional. No real company/role pair, no file from
//   data/ats/, no personal data. The harness writes only to a temp directory
//   and to output/.
//
// USAGE
//   node scripts/score/scorer-harness.mjs                # run all checks
//   node scripts/score/scorer-harness.mjs --only G3      # run one check
//   node scripts/score/scorer-harness.mjs --json-only    # suppress table
//
// CHECK KINDS — not every failing assertion is a bug, and conflating the two
// would itself be a form of over-claiming:
//   guard         — a promise the scorer is believed to already keep. Exists so
//                   a future change cannot quietly break it. Failing = regression.
//   bug           — a defect with a correct answer that does not require any new
//                   authorial decision. Failing = something to fix.
//   open-question — behaviour the book leaves explicitly unpinned. The harness
//                   can prove the consequence, but choosing the right value is a
//                   maintainer's call, not a test's. Reported loudly; does NOT
//                   set a failing exit code, because "someone must decide this"
//                   is not the same claim as "this is broken."
//
// EXIT CODES
//   0 = every guard and bug check held (open questions may still be reported).
//   1 = at least one guard or bug check failed.
//   2 = the harness itself could not run (scorer missing, bad invocation).
//   --strict makes open questions gate too.
//   A non-zero exit is the point: this is meant to sit in a conformance gate.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCORER = path.resolve(HERE, 'role-scorer.mjs');
const REPO_ROOT = path.resolve(HERE, '..', '..');
const OUT_DIR = path.join(REPO_ROOT, 'output');

// ───────────────────────────────────────────────────────────────────────────
// Fixtures — fictional, and deliberately boring. The base role sits clearly
// above the Apply threshold with both gates open, so that any movement in the
// composite is attributable to the single field a check varies.
// ───────────────────────────────────────────────────────────────────────────
const BASE_ROLE = {
  role_id: 'FIXTURE-001',
  company: 'Fictional Semiconductor A',
  title: 'Physical Design Engineer (fixture — not a real posting)',
  sponsorship: { p: 0.8, tier: 'proven', source: 'record' },
  fit: { p: 0.7, source: 'model-judgment' },
  role_quality: { p: 0.9, source: 'record' },
  liveness: { factor: 1.0, source: 'record' },
  timeline: { factor: 1.0, source: 'your-input' },
};

const role = (id, patch = {}) => {
  const r = JSON.parse(JSON.stringify(BASE_ROLE));
  Object.assign(r, patch, { role_id: id });
  return r;
};
const withoutKey = (id, key) => {
  const r = role(id);
  delete r[key];
  return r;
};

// ───────────────────────────────────────────────────────────────────────────
// Runner — invoke the real scorer CLI on a fixture, return its parsed output.
// ───────────────────────────────────────────────────────────────────────────
let TMP_ROOT = null;
const tmpdir = () => (TMP_ROOT ??= fs.mkdtempSync(path.join(os.tmpdir(), 'scorer-harness-')));
let runSeq = 0;

function runScorer(roles, profile = null) {
  const dir = fs.mkdtempSync(path.join(tmpdir(), `run${runSeq++}-`));
  const rolesPath = path.join(dir, 'roles.json');
  fs.writeFileSync(rolesPath, JSON.stringify(roles, null, 2));

  const args = [SCORER, rolesPath, '--out-dir', dir];
  if (profile) {
    const p = path.join(dir, 'profile.json');
    fs.writeFileSync(p, JSON.stringify(profile, null, 2));
    args.push('--profile', p);
  }

  const proc = spawnSync(process.execPath, args, { encoding: 'utf8' });
  const jsonPath = path.join(dir, 'role-scores.json');
  let parsed = null;
  if (fs.existsSync(jsonPath)) {
    try { parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); } catch { /* reported below */ }
  }
  return {
    status: proc.status,
    stdout: (proc.stdout || '').trim(),
    stderr: (proc.stderr || '').trim(),
    json: parsed,
    byId: Object.fromEntries((parsed?.roles ?? []).map((r) => [r.role_id, r])),
  };
}

const composite = (run, id) => run.byId[id]?.composite ?? null;
const near = (a, b, eps = 1e-9) => a != null && b != null && Math.abs(a - b) <= eps;

// requireRun — the precondition every check must clear before it is entitled to
// an opinion. A check that draws a conclusion from a subprocess that never
// completed is reporting a finding with no run behind it, which is the exact
// failure this project exists to prevent.
//
// Added after a break attempt found two ways to violate it: with the scorer
// stubbed to exit(1) immediately, G4 read `undefined` for every profile and
// reported "5 of 5 misclassified" — a fabricated finding — while G5 observed an
// empty stdout, found no NaN in it, and reported PASS. Under `--only`, either
// would have produced a confident exit code from nothing at all.
//
// "I found nothing" and "I could not look" are different claims. This keeps the
// harness from confusing them.
function requireRun(...runs) {
  for (const r of runs) {
    if (r.status !== 0 || r.json == null) {
      const why = r.status !== 0 ? `scorer exited ${r.status}` : 'scorer wrote no role-scores.json';
      const first = (r.stderr || '').split('\n').filter(Boolean)[0] || '';
      return fail(`no result — ${why}. Nothing may be concluded from this run.${first ? ` stderr: ${first}` : ''}`);
    }
  }
  return null;
}

// ───────────────────────────────────────────────────────────────────────────
// Checks. Each states the Ch.11 promise it enforces, then asserts it.
// `expectation` records what reading the source predicts — recorded so that a
// surprise is visible as a surprise, not silently absorbed. It is NEVER used
// to decide pass/fail; only the assertion decides that.
// ───────────────────────────────────────────────────────────────────────────
const CHECKS = [
  {
    id: 'G1',
    kind: 'guard',
    name: 'Gates are multipliers, not votes',
    chapter: 'Ch.11 §"Why liveness and timeline are multipliers"',
    invariant:
      'A closed gate zeroes the composite regardless of vote strength, and a ' +
      'half-open gate halves it. A gate folded in as a weighted addend can do ' +
      'neither.',
    role: 'REGRESSION GUARD — this promise is expected to already hold; the ' +
      'check exists so that a future change cannot quietly demote a gate to a vote.',
    expectation: 'PASS',
    run() {
      const open = runScorer([role('OPEN')]);
      const dead = runScorer([role('DEAD', { liveness: { factor: 0.0, source: 'record' } })]);
      const half = runScorer([role('HALF', { liveness: { factor: 0.5, source: 'record' } })]);
      const blocked = requireRun(open, dead, half); if (blocked) return blocked;

      const cOpen = composite(open, 'OPEN');
      const cDead = composite(dead, 'DEAD');
      const cHalf = composite(half, 'HALF');
      if (cOpen == null || cDead == null || cHalf == null)
        return fail('scorer produced no composite for one or more fixtures');

      const facts = [];
      let ok = true;

      if (!near(cDead, 0)) { ok = false; facts.push(`closed gate did NOT zero the composite (got ${cDead})`); }
      else facts.push(`closed gate (liveness 0.0) → composite ${cDead}`);

      const rec = dead.byId.DEAD?.recommendation;
      const reason = dead.byId.DEAD?.reason ?? '';
      if (rec !== 'Skip') { ok = false; facts.push(`closed gate produced recommendation "${rec}", expected "Skip"`); }
      if (!/gated/i.test(reason)) { ok = false; facts.push(`closed-gate reason does not say it was gated: "${reason}"`); }

      // Multiplicativity: halving the gate must halve the composite. An additive
      // gate term cannot reproduce this for arbitrary vote sums.
      if (!near(cHalf, cOpen * 0.5, 1e-4)) {
        ok = false;
        facts.push(`half-open gate is not multiplicative: ${cOpen} × 0.5 = ${(cOpen * 0.5).toFixed(4)}, got ${cHalf}`);
      } else facts.push(`half-open gate (0.5) scaled ${cOpen} → ${cHalf}`);

      return { ok, facts };
    },
  },

  {
    id: 'G2',
    kind: 'bug',
    name: 'Absent evidence is not passing evidence',
    chapter: 'Ch.8 (EMPTY vs ERROR) applied at the decision core; Ch.16 Step-4 "a ghost posting scored live"',
    invariant:
      'A role with NO liveness evidence must not score identically to a role ' +
      'verified live. "Never checked" and "checked and open" are different ' +
      'epistemic states and must not collapse into the same number.',
    role: 'TARGET — asserts a behaviour the scorer is believed not to have.',
    expectation: 'FAIL',
    run() {
      const missing = runScorer([withoutKey('NO_LIVENESS', 'liveness')]);
      const live = runScorer([role('VERIFIED_LIVE')]);
      const blocked = requireRun(missing, live); if (blocked) return blocked;

      const cMissing = composite(missing, 'NO_LIVENESS');
      const cLive = composite(live, 'VERIFIED_LIVE');
      const recMissing = missing.byId.NO_LIVENESS?.recommendation ?? null;

      // The control must have scored; if it did not, the comparison is meaningless.
      if (cLive == null) return fail('the verified-live control produced no composite — nothing to compare against');
      if (recMissing == null) return fail('scorer returned no record at all for the missing-liveness fixture');

      const facts = [
        `role with no liveness field  → composite ${cMissing == null ? 'null' : cMissing}, recommendation "${recMissing}"`,
        `role with liveness = 1.0     → composite ${cLive}`,
      ];

      // A null composite here is NOT an absent result — it is the scorer
      // explicitly declining to score without evidence, which is the behaviour
      // this check wants. Reading it as "no result" would report a correct fix
      // as a broken harness. (This check originally did exactly that.)
      if (cMissing == null) {
        facts.push(`Declined to score — absence of evidence is refused, not defaulted open.`);
        const mg = missing.byId.NO_LIVENESS?.trace?.missing_gates;
        if (mg) facts.push(`scorer named the missing gate(s): ${JSON.stringify(mg)}`);
        return { ok: true, facts };
      }

      if (near(cMissing, cLive)) {
        facts.push('IDENTICAL — missing liveness evidence is silently treated as a verified-open gate.');
        return { ok: false, facts };
      }
      facts.push('Distinct — absence of evidence is carried through, not defaulted open.');
      return { ok: true, facts };
    },
  },

  {
    id: 'G3',
    kind: 'open-question',
    name: 'role_quality reaches the composite',
    chapter: 'Ch.9 (role quality) feeding Ch.11 (composite)',
    invariant:
      'Two roles differing only in role_quality must not receive the same ' +
      'composite. If they do, the entire Ch.9 role-quality subsystem is ' +
      'invisible to the decision core.',
    role: 'OPEN QUESTION — the weight is marked [VERIFY] in the scorer and is ' +
      'pinned by neither Ch.11 nor the design doc. This check proves the ' +
      'CONSEQUENCE of leaving it at zero; it does not propose a value, because ' +
      'choosing one would be inventing a number the record does not contain. ' +
      'This is the behaviour behind the identical engineer-SOC vs drafter-SOC ' +
      'scores observed in the prior mode build.',
    expectation: 'FAIL',
    run() {
      const hi = runScorer([role('RQ_HIGH', { role_quality: { p: 0.9, source: 'record' } })]);
      const lo = runScorer([role('RQ_LOW', { role_quality: { p: 0.1, source: 'record' } })]);
      const blocked = requireRun(hi, lo); if (blocked) return blocked;

      const cHi = composite(hi, 'RQ_HIGH');
      const cLo = composite(lo, 'RQ_LOW');
      if (cHi == null || cLo == null) return fail('scorer produced no composite for one or more fixtures');

      const w = hi.byId.RQ_HIGH?.trace?.votes?.find((v) => v.factor === 'role_quality')?.weight;
      const facts = [
        `role_quality 0.9 → composite ${cHi}`,
        `role_quality 0.1 → composite ${cLo}`,
        `role_quality weight as emitted in the audit trace: ${w ?? 'term absent from trace'}`,
      ];

      if (near(cHi, cLo)) {
        facts.push('IDENTICAL — role_quality has no influence on the recommendation.');
        return { ok: false, facts };
      }
      facts.push('Distinct — role_quality moves the composite.');
      return { ok: true, facts };
    },
  },

  {
    id: 'G4',
    kind: 'bug',
    name: 'Work authorization is not confused with sponsorship independence',
    chapter: 'Ch.11 §profile-conditional weighting',
    invariant:
      'Sponsorship weight may be dropped ONLY for candidates who genuinely do ' +
      'not need sponsorship. An F-1/OPT candidate is currently work-authorized ' +
      'AND needs future sponsorship; dropping the sponsorship term for them ' +
      'removes their binding constraint.',
    role: 'TARGET — the population this engine exists for is exactly the ' +
      'population this check protects.',
    expectation: 'FAIL',
    run() {
      // Table-driven: each row is an authorization string a real user might
      // type, plus whether that person actually needs sponsorship.
      const CASES = [
        { auth: 'F-1 OPT, work authorized',                          needsSponsor: true },
        { auth: 'F-1 STEM OPT EAD, authorized to work through 2027',  needsSponsor: true },
        { auth: 'F-1 student, will need H-1B sponsorship',            needsSponsor: true },
        { auth: 'U.S. citizen',                                       needsSponsor: false },
        { auth: 'Permanent resident',                                 needsSponsor: false },
      ];

      const facts = [];
      let ok = true;
      for (const c of CASES) {
        const r = runScorer([role('AUTH')], { authorization: c.auth });
        const blocked = requireRun(r); if (blocked) return blocked;
        const got = r.json?.profile_needs_sponsorship;
        const w = r.byId.AUTH?.trace?.votes?.find((v) => v.factor === 'sponsorship')?.weight;
        const verdict = got === c.needsSponsor ? 'ok' : 'MISCLASSIFIED';
        if (got !== c.needsSponsor) ok = false;
        facts.push(
          `"${c.auth}" → needs_sponsorship ${got} (expected ${c.needsSponsor}), ` +
          `sponsorship weight ${w ?? 'term absent'} — ${verdict}`,
        );
      }
      const bad = facts.filter((f) => f.endsWith('MISCLASSIFIED')).length;
      facts.push(`${bad} of ${CASES.length} authorization strings misclassified.`);
      return { ok, facts };
    },
  },

  {
    id: 'G5',
    kind: 'bug',
    name: 'No fabricated number on an empty run',
    chapter: 'DATA_CONTRACT / _shared.md rule 5 — never invent a rate',
    invariant:
      'Scoring an empty role set must not emit a skip rate. A rate computed ' +
      'from zero observations is not a small number; it is not a number.',
    role: 'ROBUSTNESS — small, but it is the contract\'s own rule applied to the scorer.',
    expectation: 'FAIL',
    run() {
      const r = runScorer([]);
      // Without this guard, a scorer that dies before printing anything yields an
      // empty stdout, which contains no NaN, which reads as PASS. Silence is not
      // evidence of correctness.
      const blocked = requireRun(r); if (blocked) return blocked;
      const surfaces = [r.stdout, r.stderr, JSON.stringify(r.json ?? {})].join('\n');
      const facts = [`stdout on empty input: ${r.stdout || '(none)'}`];
      if (/NaN|Infinity/.test(surfaces)) {
        facts.push('Emitted NaN/Infinity where a rate belongs — a non-number printed in a number\'s position.');
        return { ok: false, facts };
      }
      facts.push('No NaN/Infinity emitted on empty input.');
      return { ok: true, facts };
    },
  },
];

const fail = (msg) => ({ ok: false, facts: [msg], harnessError: true });

// ───────────────────────────────────────────────────────────────────────────
// Driver
// ───────────────────────────────────────────────────────────────────────────
function main() {
  const argv = process.argv.slice(2);
  const jsonOnly = argv.includes('--json-only');
  const strict = argv.includes('--strict');
  const onlyIdx = argv.indexOf('--only');
  const only = onlyIdx >= 0 ? argv[onlyIdx + 1] : null;

  if (!fs.existsSync(SCORER)) {
    console.error(`✗ harness cannot run: scorer not found at ${SCORER}`);
    process.exit(2);
  }

  const selected = only ? CHECKS.filter((c) => c.id === only) : CHECKS;
  if (selected.length === 0) {
    console.error(`✗ no check matches --only ${only}. Known: ${CHECKS.map((c) => c.id).join(', ')}`);
    process.exit(2);
  }

  const results = [];
  for (const c of selected) {
    let r;
    try { r = c.run(); }
    catch (e) { r = fail(`harness threw: ${e.message}`); }
    results.push({
      id: c.id,
      kind: c.kind,
      name: c.name,
      chapter: c.chapter,
      invariant: c.invariant,
      role: c.role,
      expectation: c.expectation,
      // A check that could not run has no verdict. Labelling that state "FAIL"
      // would collapse "I looked and the promise was broken" into "I could not
      // look" — the precise conflation this harness exists to prevent, committed
      // by the harness itself. NO RESULT is its own outcome.
      result: r.harnessError ? 'NO RESULT' : r.ok ? 'PASS' : 'FAIL',
      surprise: !r.harnessError && (r.ok ? 'PASS' : 'FAIL') !== c.expectation,
      harness_error: !!r.harnessError,
      observations: r.facts,
    });
  }

  const failed = results.filter((r) => r.result === 'FAIL' && !r.harness_error);
  const gating = failed.filter((r) => strict || r.kind !== 'open-question');
  const openQ = failed.filter((r) => r.kind === 'open-question');
  const errored = results.filter((r) => r.harness_error);
  const surprises = results.filter((r) => r.surprise);

  if (!jsonOnly) {
    console.log('\nScorer gate & weight behaviour harness');
    console.log(`target: ${path.relative(REPO_ROOT, SCORER)}   node ${process.version}   ${new Date().toISOString()}`);
    console.log('─'.repeat(78));
    for (const r of results) {
      const mark = r.harness_error ? '!' : r.result === 'PASS' ? '✓' : r.kind === 'open-question' ? '?' : '✗';
      console.log(`\n${mark} ${r.id}  ${r.result.padEnd(9)}  [${r.kind}]  ${r.name}`);
      console.log(`   promise : ${r.invariant.replace(/\s+/g, ' ')}`);
      console.log(`   source  : ${r.chapter}`);
      for (const o of r.observations) {
        // Observations may quote multi-line subprocess stdout verbatim. Indent
        // continuation lines rather than letting them break the bullet column —
        // the quoted text is evidence and must not be truncated to fit.
        const [first, ...rest] = String(o).split('\n');
        console.log(`   · ${first}`);
        for (const line of rest) console.log(`       ${line.trim()}`);
      }
      if (r.surprise) console.log(`   ⚠ DIFFERS FROM BASELINE — recorded expectation for UNPATCHED upstream was ${r.expectation}, observed ${r.result}. Expected if a fix has been applied; otherwise the source reading was wrong. Either way the observation stands, not the prediction.`);
    }
    console.log('\n' + '─'.repeat(78));
    console.log(`${results.length} checks · ${results.filter((r) => r.result === 'PASS').length} PASS · ${failed.length} FAIL (${gating.length} gating, ${openQ.length} open question${openQ.length === 1 ? '' : 's'})${errored.length ? ` · ${errored.length} HARNESS ERROR` : ''}${surprises.length ? ` · ${surprises.length} surprise(s)` : ''}`);
    if (gating.length) console.log('A gating FAIL is the harness working: it names a promise the scorer does not keep and that has a correct answer.');
    if (openQ.length) console.log('An open question is NOT a bug report. It proves a consequence and hands the decision back to a maintainer. Run with --strict to make these gate too.');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, 'scorer-harness-results.json');
  fs.writeFileSync(outFile, JSON.stringify({
    _harness: 'scorer-gate-weight-behaviour',
    _target: path.relative(REPO_ROOT, SCORER),
    _fixtures: 'fictional; no real posting, no data/ats/, no personal data',
    generated: new Date().toISOString(),
    node_version: process.version,
    strict_mode: strict,
    summary: {
      checks: results.length,
      pass: results.filter((r) => r.result === 'PASS').length,
      fail: failed.length,
      fail_gating: gating.length,
      fail_open_questions: openQ.length,
      harness_errors: errored.length,
      surprises: surprises.length,
    },
    checks: results,
  }, null, 2));
  if (!jsonOnly) console.log(`wrote ${path.relative(REPO_ROOT, outFile)}`);

  if (TMP_ROOT) fs.rmSync(TMP_ROOT, { recursive: true, force: true });
  process.exit(errored.length ? 2 : gating.length ? 1 : 0);
}

main();
