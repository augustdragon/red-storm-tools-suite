# OOB Generator Test Harness

## Overview

This test suite validates the Order of Battle (OOB) generators — the core feature of Red Storm Tools that converts dice rolls into aircraft flight assignments. The generators use a two-stage d10 system: the first roll selects a nation, the second selects an aircraft type within that nation. The JSON table data encodes these dice ranges and must cover values 1-10 exactly at every level.

The harness runs in Node.js using Jest 29, even though the OOB processor code is written as browser scripts. A hybrid loading strategy bridges this gap (see [Loading Browser JS in Node.js](#loading-browser-js-in-nodejs) below).

## Quick Start

```bash
cd rs-tools-hosted
npm install           # First time only
npm test              # Run all 184 tests (~10 seconds)
npm run test:quick    # Range coverage + aircraft ID tests only (~1 second)
npm run test:e2e      # End-to-end processor tests only (~1 second)
npm run test:rng      # RNG quality tests only
```

## Current Status

**184 tests total — 184/184 passing** (deterministic tests are 100% green; statistical distribution tests may show occasional borderline failures which are expected noise at alpha=0.01)

| Category | Tests | Status |
|----------|-------|--------|
| Range Coverage | 32 | All pass |
| Aircraft ID Validation | 4 | All pass |
| End-to-End (RS NATO A-F) | 36 | All pass |
| End-to-End (RS WP G-L) | 30 | All pass |
| End-to-End (BA NATO A2-F2) | 47 | All pass |
| End-to-End (BA WP G2-L2) | 24 | All pass |
| Nation Distribution | 4 | Statistical |
| Aircraft Distribution | 4 | Statistical |
| RNG Quality | 3 | All pass |

The distribution tests run 100,000 iterations per variant with chi-squared at alpha=0.01. With 100+ distributions tested per run, ~1% borderline failures are expected statistical noise — different distributions fail each run, all with marginal deviations. These are not data errors.

## Project Layout

```
rs-tools-hosted/
  package.json              # Jest dependency + npm scripts
  jest.config.js            # Test environment config
  tests/
    TEST-HARNESS.md         # This file
    SCAN-COMPARISON.md      # Detailed comparison of JSON data vs physical game scans
    setup/
      test-globals.js       # Browser environment stubs (window, document)
      load-processors.js    # Load all 28 processor classes into Node.js
    helpers/
      table-data-loader.js  # require() all JSON table/aircraft files
      table-enumerator.js   # Recursive range object finder + validator
      chi-squared-helper.js # Statistical test utility
    coverage/
      range-coverage.test.js         # Validates d10 ranges cover 1-10
      aircraft-id-validation.test.js # Cross-refs IDs against aircraft DB
    distribution/
      nation-distribution.test.js    # 100K iterations, chi-squared
      aircraft-distribution.test.js  # Same for aircraft within nations
    rng/
      rng-quality.test.js            # 1M rolls, uniformity + correlation
    e2e/
      table-a-f.test.js    # RS NATO end-to-end (Tables A-F)
      table-g-l.test.js    # RS WP end-to-end (Tables G-L)
      table-a2-f2.test.js  # BA NATO end-to-end (Tables A2-F2)
      table-g2-l2.test.js  # BA WP end-to-end (Tables G2-L2)
```

## Test Categories

### 1. Range Coverage (Deterministic, < 1 second)

**File:** `tests/coverage/range-coverage.test.js`

The most important tests. They walk every OOB table JSON file, find all range objects (objects whose keys are die roll ranges like `"1-4"`, `"5-6"`, `"7-10"`), and verify each covers values 1-10 exactly — no gaps, no overlaps.

**How it works:**
- `table-enumerator.js` recursively descends the JSON tree, including into arrays (needed for Combat Rescue tables E and K which store flights in arrays)
- At each node, it checks if ALL keys match the pattern `/^\d+(-\d+)?$/`
- When it finds a range object, it creates a 10-slot coverage array and marks which slots each range covers
- A valid range object has every slot covered exactly once

**What it finds:** The recursive walker discovers **290 range objects** across all four table sets (RS NATO, RS WP, BA NATO, BA WP). Each is validated independently.

**Why it matters:** A gap means certain dice rolls produce no result (the processor crashes or returns an error). An overlap means some dice rolls could match two different entries (the processor picks whichever it finds first, which may not be the intended result). Both are real gameplay bugs.

### 2. Aircraft ID Validation (Deterministic, < 1 second)

**File:** `tests/coverage/aircraft-id-validation.test.js`

Validates that every `aircraftId` referenced in the OOB tables exists in the master aircraft databases (`aircraft-nato.json` and `aircraft-wp.json`).

**What it checks:**
- **382 non-null IDs** — each must exist in the aircraft database
- **21 null IDs** — expected special cases (sub-rolls like `"MiG-23²"`, split types like `"F-4G/F-4E"`, player choices like `"MiG-23MF/ML¹"`)
- **36 orphaned aircraft** — in the database but never referenced by any OOB table (informational, not failures)

Orphaned aircraft are not bugs. Some aircraft exist in the database for reference purposes only (missiles like AGM-69A SRAM, naval aviation like Sea Harrier FRS.1, helicopters like Mi-8, etc.).

### 3. Distribution Tests (Statistical, ~8 seconds)

**Files:** `tests/distribution/nation-distribution.test.js`, `aircraft-distribution.test.js`

For each table variant, runs 100,000 simulated dice rolls and compares the observed frequency of each nation/aircraft against the expected frequency based on range width. Uses chi-squared goodness-of-fit at alpha=0.01.

**Example:** If a nation has range `"1-4"` (width 4), it should appear ~40% of the time. Over 100K rolls, that's ~40,000 hits. The chi-squared test checks if the actual count deviates significantly from expectation.

**Note:** These tests are inherently probabilistic. At alpha=0.01 with 100+ distributions tested, ~1 borderline failure per run is expected. Different distributions fail each run. This is not a data issue.

### 4. RNG Quality (Statistical, ~1 second)

**File:** `tests/rng/rng-quality.test.js`

Validates that `Math.random()` (the dice engine) produces fair results:
- **1M roll uniformity:** Each d10 value (1-10) should appear within 1% of 10%
- **Sequential correlation:** Roll N should not predict roll N+1
- **Runs test:** Above/below-median sequences should have expected run count

These are sanity checks. JavaScript's `Math.random()` is well-tested, but confirming it in our specific usage pattern gives confidence.

### 5. End-to-End Processor Tests (Deterministic, ~1 second)

**Files:** `tests/e2e/table-a-f.test.js`, `table-g-l.test.js`, `table-a2-f2.test.js`, `table-g2-l2.test.js`

Tests the actual processor code by mocking `Math.random()` to force every possible d10 x d10 combination (100 combos per variant). For each combination, verifies:
- No exceptions thrown
- Result has a `.text` field
- Result text doesn't start with "Error"

Notable test details:
- **Table E2 (BA Combat Rescue):** FRG tests provide `hexType` parameter ('land' and 'sea') since CSAR aircraft depends on hex type (CH-53 for land, Mk41 Sea King for sea). DK and SE tests don't require hexType.
- **Table D3 (BA Naval Strike):** Uses two date ranges (`['15-31 May', '1-15 June']`) unlike the standard three used by other BA tables.
- **Table L (RS Special Missions):** Standoff Jamming and Tactical Recon are tested separately. Tactical Recon requires a `tacticalReconNation` parameter ('USSR' or 'GDR') since nationality is a scenario choice, not a die roll.

**Mock strategy:**
```javascript
// The dice roller uses: Math.floor(Math.random() * 10) + 1
// To force result R, we need Math.random() to return (R - 1) / 10
function mockRollSequence(rollValues) {
    let callIndex = 0;
    const originalRandom = Math.random;
    jest.spyOn(Math, 'random').mockImplementation(() => {
        if (callIndex < rollValues.length) {
            const roll = rollValues[callIndex++];
            return (roll - 1) / 10;
        }
        return originalRandom(); // Fallback for sub-rolls
    });
}
```

## Data-Driven Sub-Roll Variants

Some aircraft entries in the OOB tables require a third die roll to determine the specific variant. For example, `MiG-23²` (footnote 2) requires a sub-roll: 1-4 = MiG-23M, 5-8 = MiG-23MF, 9-10 = MiG-23ML. Similarly, `F-4²` resolves to F-4D or F-4E.

### The Problem: Hardcoded Superscript Matching

The original implementation used hardcoded string matching in each processor — checking for Unicode superscript characters (`²`, `¹`) or ASCII approximations (`Aı`, `A1`) in the aircraft name, then branching to the correct sub-roll logic. This was fragile:
- Each processor had its own copy of the sub-roll logic
- Adding or changing a variant required editing JavaScript, not just data
- Some processors handled certain variants but not others (e.g., WPTableH handled USSR MiG-25PD/Su-27S but silently failed on GDR MiG-23MF/ML)

### The Solution: `variants` Field in JSON Data

Aircraft entries that require sub-rolls now declare their variants directly in the JSON data:

```json
{
  "3-4": {
    "name": "MiG-23²",
    "aircraftId": null,
    "variants": {
      "1-4":  { "name": "MiG-23M",  "aircraftId": "USSR-MIG-23M-1" },
      "5-8":  { "name": "MiG-23MF", "aircraftId": "POL-MIG-23MF-1" },
      "9-10": { "name": "MiG-23ML", "aircraftId": "GDR-MIG-23ML-1" }
    }
  }
}
```

The `variants` object uses the same range-key format as all other OOB data (d10 ranges covering 1-10). When `rollForAircraft()` finds a `variants` field on the matched entry, it passes it through in the result. Each processor then calls `resolveVariants()` — a single generic method on `BaseTableProcessor` — to roll the sub-die and look up the final aircraft.

### Entries Using `variants`

| Table | Section | Entry | Variant Outcomes |
|-------|---------|-------|-----------------|
| G (RS WP) | USSR QRA | MiG-25PD/Su-27S¹ | 1-5: MiG-25PD, 6-10: Su-27S |
| H (RS WP) | USSR Fighter Sweep | MiG-25PD/Su-27S¹ | 1-5: MiG-25PD, 6-10: Su-27S |
| H (RS WP) | GDR Fighter Sweep | MiG-23MF/ML¹ | 1-5: MiG-23MF, 6-10: MiG-23ML |
| I (RS WP) | USSR SEAD | MiG-23² | 1-4: MiG-23M, 5-8: MiG-23MF, 9-10: MiG-23ML |
| I (RS WP) | USSR Bombing | MiG-23² | 1-4: MiG-23M, 5-8: MiG-23MF, 9-10: MiG-23ML |
| I (RS WP) | GDR Close Escort | MiG-23MF/ML¹ | 1-5: MiG-23MF, 6-10: MiG-23ML |
| I (RS WP) | GDR SEAD | MiG-23² | 1-4: MiG-23M, 5-8: MiG-23MF, 9-10: MiG-23ML |
| C (RS NATO) | US Bombing (pre) | F-4² | 1-5: F-4D, 6-10: F-4E |
| C (RS NATO) | US Bombing (post) | F-4² | 1-5: F-4D, 6-10: F-4E |

### Processors Using `resolveVariants()`

All processors that encounter sub-roll entries now use the same pattern:

```javascript
if (aircraftResult.variants) {
  const variantResult = this.resolveVariants(aircraftResult.variants, 'Sub-roll');
  finalAircraftType = variantResult.finalAircraftType || finalAircraftType;
  finalAircraftId = variantResult.finalAircraftId;
  subRollDebug = variantResult.subRollDebug;
}
```

Processors refactored: WPTableG, WPTableH, WPTableI, WPTableJ, NATOTableC.

The legacy `handleSubRoll()` and `handleSubRollWithId()` methods have been removed from `BaseTableProcessor` — no processors call them anymore.

### Patterns NOT Converted to `variants`

Some aircraft-name-driven logic serves a different purpose and was intentionally left as-is:

- **Ordnance modifiers** (NATOTableC, NATOTableC2, WPTableI, WPTableI2): Aircraft type checks like `includes('F-16')` for ordnance roll bonuses (+2). These are game rules applied after aircraft resolution, not sub-roll variant selection.
- **Split SEAD types** (NATOTableC): `F-4G/F-4E` and `F-4G/F-16C` split a SEAD flight group into two different aircraft types (2 flights of each). This is handled by `processSplitSEAD()` and is structurally different from a variant sub-roll.
- **MiG-21 ordnance restriction** (WPTableI, WPTableI2): GDR/POL MiG-21 variants can only carry basic ordnance (Note E). This is a restriction check, not variant resolution.

---

## Loading Browser JS in Node.js

The 28 processor files are browser `<script>` tags — they attach classes to `window` and reference `document` at load time. Running them in Jest's Node.js environment required solving two problems:

### Problem 1: Browser globals don't exist in Node.js

**Solution:** `test-globals.js` (runs via Jest `setupFiles`) creates:
- `global.window = global` — processors attach classes to `window`, which becomes `global`
- `global.document` — minimal stub with `getElementById()`, `createElement()`, etc.
- `global.debugMode = false` — referenced by `dice-roller.js`
- Filtered `console.log` — suppresses noisy "loaded" messages from processor files

### Problem 2: Class declarations and Jest's Math.random mock

We need processors to use the *same* `Math.random` that Jest mocks with `jest.spyOn()`. Several approaches were tried and rejected:

| Approach | Why it failed |
|----------|---------------|
| `vm.runInThisContext()` | Separate V8 context, doesn't share Jest's sandbox |
| `vm.createContext(sandbox)` | Math.random in sandbox isn't the one Jest mocks |
| `(0, eval)(code)` | Class declarations in eval are block-scoped, not accessible after eval |

**Final solution — `require()` with `module.exports`:**

All 28 processor files have the standard Node.js export guard at the end:
```javascript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClassName;
}
```

This is a no-op in the browser (where `module` is undefined) and enables `require()` in Node.js. The loader in `load-processors.js` then assigns each class to `global`:

```javascript
// Utility files use window.X = X pattern (window === global)
require(path.join(SHARED_JS, 'utils.js'));
require(path.join(SHARED_JS, 'dice-roller.js'));

// All processors export their class
global.BaseTableProcessor = require(path.join(PROCESSORS_DIR, 'BaseTableProcessor.js'));
global.NATOTableA = require(path.join(PROCESSORS_DIR, 'NATOTableA.js'));
// ... etc for all 28 processors
```

This ensures all processor classes share Jest's `Math.random`, which is critical for the mock-based e2e tests.

## How to Add Tests

### Adding a new processor test

1. Ensure the processor file has `module.exports` (add the guard if missing)
2. Add a `require()` + `global` assignment line in `load-processors.js`
3. Create a new test file in `tests/e2e/` following the pattern in existing files
4. Load the processor via `require('../setup/load-processors')`
5. Use `mockRollSequence()` to force specific dice values

### Adding a new table data file

1. Add a loader function in `table-data-loader.js`
2. The range coverage tests will automatically pick up new range objects via recursive walking

## Key Helper Modules

### table-data-loader.js

Provides `require()`-based loading for all JSON data files:
- `loadRSNatoTables()` / `loadRSWPTables()` — Red Storm tables
- `loadBANatoTables()` / `loadBAWPTables()` — Baltic Approaches tables
- `loadAllTables()` — All four merged
- `loadAircraftDb()` — Both aircraft files with `byId` and `byName` lookups

### table-enumerator.js

Recursive tree walker for finding and validating range objects:
- `isRangeKey(key)` — Does the string match `/^\d+(-\d+)?$/`?
- `isRangeObject(obj)` — Are ALL keys range strings?
- `findAllRangeObjects(node)` — Walk the tree (including arrays), yield `{path, obj}` for each range object
- `validateRangeCoverage(rangeObj)` — Check 1-10 coverage, return `{valid, gaps, overlaps}`

### chi-squared-helper.js

Statistical testing utility:
- `chiSquaredTest(observed, expected, alpha)` — Goodness-of-fit test
- `calculateExpectedFrequencies(ranges, iterations)` — Expected counts from range widths
- Critical value table for df 1-20 at alpha 0.05 and 0.01

---

## Data Errors Found and Fixed

The test harness surfaced real data errors in the OOB table JSON files. All were verified against physical game scans (see `SCAN-COMPARISON.md` for the full comparison report).

### Issues Found by Tests, Fixed via Scan Verification

| Table | Module | Issue | Root Cause | Fix |
|-------|--------|-------|------------|-----|
| **C** | RS NATO | SEAD post FRG had overlapping ranges `"6-9"` and `"8-9"` | Spurious `"8-9": Alpha Jet` entry | Removed Alpha Jet — only belongs in Bombing section |
| **F** | RS NATO | Standoff Jamming nations gap at value 10 | Missing UK/FRG nation entry | Added `"10": UK/FRG` with Falcon 20F and HFB 320 Hansa Jet |
| **F** | RS NATO | Tactical Recon nation ranges completely wrong | JSON had 1-6 US, 7-8 UK, 9-10 FRG | Corrected to 1-3 US, 4-5 UK, 6-9 FRG, 10 BE/NE per scan |
| **G** | RS WP | USSR aircraft 5-10 all wrong; GDR had wrong aircraft and merged entries | Aircraft were shifted or substituted | Corrected 7 entries (see below) |
| **H** | RS WP | USSR aircraft shifted by erroneous MiG-21bis insertion; GDR had wrong aircraft and merged entries | MiG-21bis inserted at 1-2, pushing everything down | Corrected 7 entries (see below) |
| **K** | RS WP | GDR Rescue Support aircraft completely wrong | MiG-21bis/MiG-23BN instead of MiG-21SPS/MiG-21MF | Corrected both entries |
| **J** | RS WP | Bombing aircraft names wrong | `Su-24M` should be `Su-24` (base); `Su-24M4` should be `Su-24M` | Corrected both names and aircraft IDs |
| **L** | RS WP | Standoff Jamming had bogus GDR nation; Tactical Recon had wrong aircraft names | GDR An-26 entry shouldn't exist; GDR MiG-21R→MiG-21M, Su-22M4R→Su-22M4; USSR Su-17M3R→Su-17M3 | Removed GDR nation, corrected 3 aircraft names |
| **G2** | BA WP | USSR aircraft gap at values 7-8 | MiG-29A range was `"6"` instead of `"6-8"` | Changed to `"6-8"` |
| **I2** | BA WP | USSR Bombing aircraft overlap at values 6-7 | MiG-23MLA range was `"6-10"` instead of `"8-10"` | Changed to `"8-10"` |

### Table G — Detailed Corrections

**USSR** (3 of 5 entries wrong):
| Roll | Was | Now |
|------|-----|-----|
| 5-6 | MiG-23ML | **MiG-23MLA** |
| 7-8 | MiG-29A | **MiG-23MLD** |
| 9-10 | MiG-25PD/Su-27S | **MiG-29A** |

**GDR** (restructured from 2 → 3 entries):
| Roll | Was | Now |
|------|-----|-----|
| 1-6 | MiG-21bis | **MiG-21MF** |
| 7 | *(merged into 7-10 MiG-23ML)* | **MiG-21SPS** |
| 8-10 | *(merged into 7-10 MiG-23ML)* | **MiG-21bis** |

### Table H — Detailed Corrections

**USSR** (3 of 5 entries wrong — MiG-21bis removed, aircraft shifted back):
| Roll | Was | Now |
|------|-----|-----|
| 1-2 | MiG-21bis | **MiG-23M** |
| 3-4 | MiG-23M | **MiG-23MLA** |
| 5-6 | MiG-23MLA | **MiG-23MLD** |

**GDR** (restructured from 2 → 4 entries):
| Roll | Was | Now |
|------|-----|-----|
| 1-5 | MiG-21bis | **MiG-21MF** |
| 6 | *(merged into 6-10 MiG-23ML)* | **MiG-21SPS** |
| 7-9 | *(merged into 6-10 MiG-23ML)* | **MiG-21bis** |
| 10 | *(merged into 6-10 MiG-23ML)* | **MiG-23MF/ML** (sub-roll) |

### Test Infrastructure Fixes

| Area | Issue | Fix |
|------|-------|-----|
| `table-enumerator.js` | Couldn't find range objects inside arrays (Tables E, K) | Added array traversal to `findAllRangeObjects()` |
| `table-a2-f2.test.js` | E2 FRG tests missing `hexType` parameter | Added land/sea test variants |
| `table-a2-f2.test.js` | D3 used wrong date ranges | Changed to `['15-31 May', '1-15 June']` per scan |
| `table-g-l.test.js` | Table L Tactical Recon test didn't provide `tacticalReconNation` | Split into separate Standoff Jamming and Tactical Recon tests |
| `load-processors.js` | Temp file approach for 4 BA processors caused Jest worker collisions | Added `module.exports` to all 4 files, eliminated temp file hack |

### Remaining Items (Need Scan Verification)

These items are documented in `SCAN-COMPARISON.md` and require checking against the physical game tables:

All tables have been verified against physical game scans. No remaining items.

| Table | Result |
|-------|--------|
| **A** | MATCH — verified all 4 ATAF/date variants |
| **B** | MATCH — verified all 4 ATAF/date variants |
| **D** | MATCH — verified all 5 taskings |
| **J** | FIXED — Bombing had Su-24M/Su-24M4, corrected to Su-24/Su-24M |
| **L** | FIXED — Removed GDR Standoff Jamming, corrected Tactical Recon names |
