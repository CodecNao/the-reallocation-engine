#!/usr/bin/env node
// apply-fixes.mjs — apply the three fixes to scripts/score/role-scorer.mjs.
//
// Exact-string replacement with assertions. Every target must appear EXACTLY
// once; if a target is missing or ambiguous, nothing is written and the script
// exits non-zero. A patcher that half-applies is worse than one that refuses.
//
// Usage (from the repository root):
//   node assignments/submissions/zhenhao-ma/apply-fixes.mjs --dry-run
//   node assignments/submissions/zhenhao-ma/apply-fixes.mjs
//
// Undo:  git checkout -- scripts/score/role-scorer.mjs
//
// RUN THE PRE-FIX HARNESS AND THE BREAK ATTEMPTS FIRST. Patch 1 removes the
// behaviour that break attempt 3 documents; once applied, that evidence is gone.

import fs from 'node:fs';

const FILE = 'scripts/score/role-scorer.mjs';
const dryRun = process.argv.includes('--dry-run');

const PATCHES = [
  {
    id: 'G2',
    what: 'a gate with no evidence is no longer defaulted to 1.0',
    find: `  const liveness = num(role.liveness?.factor) ?? 1;
  const timeline = num(role.timeline?.factor) ?? 1;
  const gates = [
    { key: 'liveness', factor: liveness, source: role.liveness?.source || SRC.record },
    { key: 'timeline', factor: timeline, source: role.timeline?.source || SRC.input },
  ];
  const gateProduct = gates.reduce((s, g) => s * g.factor, 1);
  const composite = voteSum * gateProduct;`,
    replace: `  // A gate with no evidence behind it is not an open gate. Absence of a
  // measurement is not a measurement of 1.0 — defaulting it to one lets a
  // posting nobody checked score identically to a posting verified live, and
  // makes the audit trace report "source: record" for a record that does not
  // exist. We decline to score rather than substitute a value.
  const missingGates = [];
  const readGate = (key, obj, defSrc) => {
    const f = num(obj?.factor);
    if (f == null) { missingGates.push(key); return null; }
    return { key, factor: f, source: obj.source || defSrc };
  };
  const liveGate = readGate('liveness', role.liveness, SRC.record);
  const timeGate = readGate('timeline', role.timeline, SRC.input);

  if (missingGates.length) {
    return {
      role_id: role.role_id ?? null,
      company: role.company ?? null,
      title: role.title ?? null,
      composite: null,
      recommendation: 'Insufficient evidence',
      machine_recommendation: 'Insufficient evidence',
      reason: \`cannot score: no evidence for gate(s) \${missingGates.join(', ')}. \` +
              \`A missing gate is not an open gate — supply the measurement, or \` +
              \`record why it is unavailable.\`,
      override: null,
      trace: {
        votes: votes.map((v) => ({ factor: v.key, value: v.p, weight: v.weight, contribution: Number((v.p * v.weight).toFixed(4)), source: v.source })),
        vote_sum: Number(voteSum.toFixed(4)),
        gates: [liveGate, timeGate].filter(Boolean),
        missing_gates: missingGates,
        gate_product: null,
        arithmetic: 'not computed — missing gate evidence',
      },
    };
  }

  const gates = [liveGate, timeGate];
  const liveness = liveGate.factor;
  const timeline = timeGate.factor;
  const gateProduct = gates.reduce((s, g) => s * g.factor, 1);
  const composite = voteSum * gateProduct;`,
  },

  {
    id: 'G4',
    what: 'work authorization is no longer read as sponsorship independence',
    find: `function applyProfile(weights, profile) {
  const w = { ...weights };
  const auth = (profile?.authorization || '').toLowerCase();
  const needsSponsor = profile == null ? true
    : !/citizen|permanent|green|gc|pr\\b|no.?sponsor|authorized/.test(auth);
  if (!needsSponsor) w.sponsorship = 0; // a perfect-fit non-sponsor is no longer a skip
  return { w, needsSponsor };
}`,
    replace: `// Deciding whether a person's binding constraint applies is too consequential
// to infer from substring matching. "Work authorized" and "needs no sponsorship"
// are different claims: an F-1 candidate on OPT makes the first, and the second
// is false for them. The previous pattern contained the bare token "authorized",
// so "F-1 OPT, work authorized" zeroed the sponsorship weight — silently
// deleting the one constraint governing that candidate's entire search.
const STATUS_REQUIRING_SPONSORSHIP =
  /\\b(f-?1|j-?1|m-?1|opt|cpt|stem\\s*opt|ead|h-?1b|h-?4|l-?1|o-?1|tn|cap[-\\s]?exempt|student\\s*visa)\\b/;
const STATUS_NOT_REQUIRING_SPONSORSHIP =
  /\\b(u\\.?s\\.?\\s*citizen|citizen|naturalized|permanent\\s*resident|green\\s*card|lpr|gc|asylee|refugee)\\b/;

function applyProfile(weights, profile) {
  const w = { ...weights };
  const warnings = [];

  let needsSponsor;
  if (profile == null) {
    needsSponsor = true;                        // unchanged: assume the constraint binds
  } else if (typeof profile.needs_sponsorship === 'boolean') {
    needsSponsor = profile.needs_sponsorship;   // an explicit field always wins
  } else {
    const auth = (profile.authorization || '').toLowerCase();
    // Order matters: a nonimmigrant status is decisive even when the same
    // sentence also says the person is currently authorized to work.
    if (STATUS_REQUIRING_SPONSORSHIP.test(auth)) {
      needsSponsor = true;
    } else if (STATUS_NOT_REQUIRING_SPONSORSHIP.test(auth)) {
      needsSponsor = false;
    } else {
      needsSponsor = true;                      // unrecognised → the constraint binds
      warnings.push(\`authorization "\${profile.authorization ?? ''}" not recognised; assuming sponsorship IS required. Set profile.needs_sponsorship explicitly.\`);
    }
    warnings.push('sponsorship requirement was INFERRED from free text, not read from a field. Verify before trusting any recommendation.');
  }

  if (!needsSponsor) w.sponsorship = 0; // a perfect-fit non-sponsor is no longer a skip
  return { w, needsSponsor, warnings };
}`,
  },

  {
    id: 'G5-stdout',
    what: 'no skip rate is printed when there are no observations',
    find: "  console.log(`✓ scored ${scored.length} roles → Apply ${by('Apply')} · Consider ${by('Consider')} · Skip ${by('Skip')} (skip ${(by('Skip') / scored.length * 100).toFixed(0)}%)`);",
    replace: `  // A rate over zero observations is not a small number; it is not a number.
  // Roles returned as "Insufficient evidence" were never scored, so they are
  // reported separately rather than silently diluting the denominator.
  const nScoreable = scored.filter((s) => s.composite != null).length;
  const nUnscored = scored.length - nScoreable;
  const skipRate = nScoreable === 0 ? 'n/a — no roles scored' : \`\${(by('Skip') / nScoreable * 100).toFixed(0)}%\`;
  console.log(\`✓ scored \${nScoreable} of \${scored.length} roles → Apply \${by('Apply')} · Consider \${by('Consider')} · Skip \${by('Skip')} (skip \${skipRate})\` + (nUnscored ? \` · \${nUnscored} unscored (insufficient evidence)\` : ''));`,
  },

  {
    id: 'G5-markdown',
    what: 'the same guard in the markdown report, and no health verdict from a sample of zero',
    find: "  o.push(`**Summary:** ${scored.length} roles → Apply ${by('Apply').length} · Consider ${by('Consider').length} · Skip ${by('Skip').length}. **Skip rate ${(by('Skip').length / scored.length * 100).toFixed(0)}%** ${by('Skip').length / scored.length >= 0.5 ? '(healthy — a good run skips at least half)' : '(below the ~50% a healthy run skips; check the inputs)'}.`);",
    replace: `  const nScoreable = scored.filter((s) => s.composite != null).length;
  const nUnscored = scored.length - nScoreable;
  if (nScoreable === 0) {
    // No verdict on run health from a sample of zero. That judgment would be
    // fabricated, and a fabricated judgment about sample health is worse than none.
    o.push(\`**Summary:** \${scored.length} roles, none scoreable. **Skip rate: n/a** — no observations to compute one from.\`);
  } else {
    const skipShare = by('Skip').length / nScoreable;
    o.push(\`**Summary:** \${nScoreable} of \${scored.length} roles scored → Apply \${by('Apply').length} · Consider \${by('Consider').length} · Skip \${by('Skip').length}\` +
      (nUnscored ? \` · \${nUnscored} unscored (insufficient evidence)\` : '') +
      \`. **Skip rate \${(skipShare * 100).toFixed(0)}%** \${skipShare >= 0.5 ? '(healthy — a good run skips at least half)' : '(below the ~50% a healthy run skips; check the inputs)'}.\`);
  }`,
  },

  {
    id: 'G2-sort',
    what: 'unscored roles sort last instead of unpredictably',
    find: '  for (const s of scored.sort((a, b) => b.composite - a.composite)) {',
    replace: `  // composite may now be null ("Insufficient evidence"). Subtracting null
  // yields NaN, and a NaN comparator makes the sort order arbitrary — which
  // would hide unscored roles at a random position instead of surfacing them.
  const rank = (x) => (x.composite == null ? -Infinity : x.composite);
  for (const s of scored.sort((a, b) => rank(b) - rank(a))) {`,
  },
];

function main() {
  if (!fs.existsSync(FILE)) {
    console.error(`FATAL: ${FILE} not found. Run from the repository root.`);
    process.exit(2);
  }

  let src = fs.readFileSync(FILE, 'utf8');
  const original = src;
  const applied = [];

  for (const p of PATCHES) {
    const hits = src.split(p.find).length - 1;
    if (hits !== 1) {
      console.error(`\n✗ ABORT — patch ${p.id}: target found ${hits} times, expected exactly 1.`);
      console.error('  Nothing has been written. The scorer may have changed upstream;');
      console.error('  re-read the source and update this patch rather than forcing it.');
      console.error(`\n  Target began:\n    ${p.find.split('\n')[0]}`);
      process.exit(1);
    }
    src = src.replace(p.find, p.replace);
    applied.push(p);
  }

  console.log(`Patching ${FILE}`);
  for (const p of applied) console.log(`  ✓ ${p.id.padEnd(12)} ${p.what}`);

  if (dryRun) {
    console.log(`\n--dry-run: all ${applied.length} targets matched exactly once. Nothing written.`);
    process.exit(0);
  }

  fs.writeFileSync(FILE, src);
  console.log(`\nWrote ${FILE} (${original.length} → ${src.length} bytes).`);
  console.log('\nNext:');
  console.log('  node --check scripts/score/role-scorer.mjs');
  console.log('  node scripts/score/scorer-harness.mjs; echo "EXIT: $?"');
  console.log('  npm run verify && npm run doctor');
  console.log('\nUndo:  git checkout -- scripts/score/role-scorer.mjs');
}

main();
