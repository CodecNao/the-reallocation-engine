# Proposed fixes to `scripts/score/role-scorer.mjs`

Three patches, one refusal. Each patch is justified by a harness check that fails
before it and passes after it. The refusal is the important one.

**Apply these only after recording the pre-fix harness run.** The pre-fix output
is the evidence; a fix applied before the run erases it.

---

## Patch 1 — G2: absent gate evidence must not be read as an open gate

### The defect

```js
const liveness = num(role.liveness?.factor) ?? 1;
const timeline = num(role.timeline?.factor) ?? 1;
```

`?? 1` means a role for which liveness was **never checked** receives the same
gate multiplier as a role **checked and confirmed live**. Two different epistemic
states — "no evidence" and "positive evidence" — collapse into one number, and
the collapse favours the optimistic reading. A posting that was never verified
scores exactly like a verified-open one and can be recommended `Apply`.

This is the engine's own EMPTY-vs-ERROR discipline (Ch.8) failing at the point
where it matters most: the decision core.

### Why the fix is not "pick a safer default"

Substituting `?? 0.5` would be inventing a number. There is no record behind it.
The honest response to missing evidence is to decline to score, not to guess a
multiplier and carry the guess forward as if it were measured.

### The patch

```js
// BEFORE
  const liveness = num(role.liveness?.factor) ?? 1;
  const timeline = num(role.timeline?.factor) ?? 1;
  const gates = [
    { key: 'liveness', factor: liveness, source: role.liveness?.source || SRC.record },
    { key: 'timeline', factor: timeline, source: role.timeline?.source || SRC.input },
  ];
  const gateProduct = gates.reduce((s, g) => s * g.factor, 1);
  const composite = voteSum * gateProduct;
```

```js
// AFTER
  // A gate with no evidence behind it is not an open gate. Absence of a
  // measurement is not a measurement of 1.0, and defaulting it to one lets an
  // unverified posting score identically to a verified-live one. We decline to
  // score rather than substitute a value no record supports.
  const missingGates = [];
  const gateFactor = (key, obj, defSrc) => {
    const f = num(obj?.factor);
    if (f == null) { missingGates.push(key); return null; }
    return { key, factor: f, source: obj.source || defSrc };
  };
  const liveGate = gateFactor('liveness', role.liveness, SRC.record);
  const timeGate = gateFactor('timeline', role.timeline, SRC.input);

  if (missingGates.length) {
    return {
      role_id: role.role_id ?? null,
      company: role.company ?? null,
      title: role.title ?? null,
      composite: null,
      recommendation: 'Insufficient evidence',
      machine_recommendation: 'Insufficient evidence',
      reason: `cannot score: no evidence for gate(s) ${missingGates.join(', ')}. ` +
              `A missing gate is not an open gate; supply the measurement or ` +
              `record explicitly why it is unavailable.`,
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
  const composite = voteSum * gateProduct;
```

### Downstream consequence you must handle

`composite` can now be `null`, and a new recommendation value
`Insufficient evidence` exists. `renderMarkdown()` sorts on `b.composite -
a.composite` and the summary counts only Apply/Consider/Skip. Both need updating,
or unscored roles will sort unpredictably and vanish from the counts — **which
would be a second silent failure introduced by the fix for the first one.**
Check this explicitly in the post-fix run.

### Verification

`node scripts/score/scorer-harness.mjs --only G2` moves FAIL → PASS.
`--only G1` must remain PASS.

---

## Patch 2 — G4: work authorization is not sponsorship independence

### The defect

```js
const needsSponsor = profile == null ? true
  : !/citizen|permanent|green|gc|pr\b|no.?sponsor|authorized/.test(auth);
if (!needsSponsor) w.sponsorship = 0;
```

The token `authorized` matches the substring in `"F-1 OPT, work authorized"`. An
F-1 student who accurately describes their status — currently authorized to work,
and needing H-1B sponsorship next year — is classified as not needing sponsorship.
The sponsorship weight is set to zero, and the single constraint that governs
their entire search is silently removed from the decision core. Employers who
never sponsor stop being penalised and can surface as `Apply`.

This is a wrong answer produced quietly, in favour of the user's optimism, for
precisely the population the engine exists to serve.

Two further hazards in the same expression: `gc` matches inside unrelated words,
and no term is anchored, so matching is substring-based throughout.

### The patch

```js
// BEFORE
function applyProfile(weights, profile) {
  const w = { ...weights };
  const auth = (profile?.authorization || '').toLowerCase();
  const needsSponsor = profile == null ? true
    : !/citizen|permanent|green|gc|pr\b|no.?sponsor|authorized/.test(auth);
  if (!needsSponsor) w.sponsorship = 0;
  return { w, needsSponsor };
}
```

```js
// AFTER
// Prefer an explicit structured field. Parsing free text to decide whether a
// person's binding constraint applies is a decision too consequential to infer
// from substring matching — "work authorized" and "needs no sponsorship" are
// different claims, and an F-1 candidate on OPT makes the first while the
// second is false for them.
const STATUS_REQUIRING_SPONSORSHIP =
  /\b(f-?1|j-?1|m-?1|opt|cpt|stem\s*opt|ead|h-?1b|h-?4|l-?1|o-?1|tn|cap[-\s]?exempt|student\s*visa)\b/;
const STATUS_NOT_REQUIRING_SPONSORSHIP =
  /\b(u\.?s\.?\s*citizen|citizen|naturalized|permanent\s*resident|green\s*card|lpr|gc\b|asylee|refugee)\b/;

function applyProfile(weights, profile) {
  const w = { ...weights };
  const warnings = [];

  let needsSponsor;
  if (profile == null) {
    needsSponsor = true;                       // unchanged: assume the constraint binds
  } else if (typeof profile.needs_sponsorship === 'boolean') {
    needsSponsor = profile.needs_sponsorship;  // explicit field wins, always
  } else {
    const auth = (profile.authorization || '').toLowerCase();
    // Order matters. A nonimmigrant status is decisive even when the same
    // sentence also says the person is currently authorized to work.
    if (STATUS_REQUIRING_SPONSORSHIP.test(auth)) {
      needsSponsor = true;
    } else if (STATUS_NOT_REQUIRING_SPONSORSHIP.test(auth)) {
      needsSponsor = false;
    } else {
      needsSponsor = true;                     // unrecognised → the constraint binds
      warnings.push(
        `authorization "${profile.authorization ?? ''}" was not recognised; ` +
        `assuming sponsorship IS required. Set profile.needs_sponsorship ` +
        `explicitly to remove this inference.`);
    }
    warnings.push(
      'sponsorship requirement was INFERRED from free text, not read from a ' +
      'field. Verify it before trusting any recommendation.');
  }

  if (!needsSponsor) w.sponsorship = 0;
  return { w, needsSponsor, warnings };
}
```

Surface `warnings` in the run output and in the markdown header — an inference
that silently drives a weight to zero is exactly the kind of unlabelled judgment
the data contract prohibits (Rule 9).

### Verification

`--only G4` moves FAIL → PASS, with all five authorization strings classified
correctly. Add any additional strings to the table in the harness before claiming
broader coverage; the harness tests exactly the strings it lists and no others.

---

## Patch 3 — G5: no rate without observations

### The defect

```js
console.log(`... (skip ${(by('Skip') / scored.length * 100).toFixed(0)}%)`);
```

On an empty input, `0 / 0` yields `NaN`, and the scorer prints `skip NaN%` — a
non-number occupying the position where a rate belongs. `renderMarkdown()`
contains the same expression and additionally evaluates a healthy/unhealthy
verdict against it.

Small, but it is the data contract's own Rule 5 broken by the scorer itself: a
rate computed from zero observations is not a small number, it is not a number.

### The patch

```js
// BEFORE
  console.log(`✓ scored ${scored.length} roles → Apply ${by('Apply')} · Consider ${by('Consider')} · Skip ${by('Skip')} (skip ${(by('Skip') / scored.length * 100).toFixed(0)}%)`);
```

```js
// AFTER
  const n = scored.length;
  const skipRate = n === 0 ? 'n/a — no roles scored' : `${(by('Skip') / n * 100).toFixed(0)}%`;
  console.log(`✓ scored ${n} roles → Apply ${by('Apply')} · Consider ${by('Consider')} · Skip ${by('Skip')} (skip ${skipRate})`);
```

Apply the same guard in `renderMarkdown()`, and suppress the
"healthy / below the ~50%" verdict entirely when `n === 0`. A judgment about
sample health drawn from a sample of zero is worse than no judgment.

### Verification

`--only G5` moves FAIL → PASS.

---

## Not patched — G3: the `role_quality` weight

```js
role_quality: 0.0,   // [VERIFY] ... UNPINNED
```

**This is not being fixed, and the refusal is deliberate.**

The harness proves the consequence: two roles differing only in `role_quality`
receive identical composites, so the entire Ch.9 role-quality subsystem — the
BLS/O*NET work, the wage and outlook signals — contributes nothing to any
recommendation. That consequence is a measurable fact and it is reported.

What the harness cannot supply is the weight. Neither Ch.11 nor
`docs/search-profile-design.md` pins a value; the scorer's own comment marks it
`[VERIFY]` and calls it "an open authorial decision." Any number chosen here
would be invented, and an invented constant in the decision core, presented as a
correction, is worse than the zero it replaced: the zero is at least visibly
unset and annotated as such.

So the contribution stops at the boundary of what it can verify. The check is
classified `open-question`, it does not set a failing exit code, and it prints
the consequence with the decision handed back to a maintainer. `--strict` is
available for anyone who wants the build red until that decision is made.

This is the recipe's own stop condition being obeyed: *prefer "not implemented
yet" over pretending the system can do more than it can verify.*
