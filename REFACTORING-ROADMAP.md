# Refactoring Roadmap

A prioritized plan to reduce fragility in the data layer and improve the reliability of the processor-to-print pipeline. Each phase is independent and delivers value on its own.

---

## The Core Problem

The app's biggest source of bugs is not any single file — it's the **invisible contract** between 27 table processors and the print generator. Each processor returns a slightly different result shape, and the print generator has to guess which shape it's receiving. When a new processor doesn't match the pattern the print generator expects, flights silently fail to print.

This was the root cause of every runtime bug we've fixed: `taskingResults` vs `taskings`, missing `nationality` fields, Mi-8 name mapping gaps, WPTableJ returning text strings instead of result objects. The code *works* — the problem is that nothing *enforces* the contract between the two sides.

The roadmap below addresses this from highest-impact/lowest-effort to lowest-impact/highest-effort.

---

## Phase 1: Define and Enforce the Result Contract

**Effort:** ~4-6 hours | **Impact:** Prevents the #1 category of bugs | **Risk:** Low

### What

Create a `ResultSchema` module that:
1. Documents the exact shape every processor must return
2. Provides builder functions so processors don't have to manually construct return objects
3. Validates results at the boundary between processors and the print generator

### Why This First

Every bug we've fixed in the last two sessions was a contract violation. The fix each time was "change a property name" or "add a missing field" — trivial once found, but invisible until a user hits it. A schema catches these at development time instead of production time.

### Design

**New file: `shared/oob-generator/js/result-schema.js`**

```javascript
/**
 * ResultSchema — Canonical result shapes for the processor→print pipeline.
 *
 * Every table processor returns one of two shapes:
 *   1. SingleFlight  — One aircraft type, one or more identical flights
 *   2. CompoundResult — Multiple distinct flights or taskings bundled together
 *
 * The print generator should never inspect raw processor output directly.
 * It should always receive results that have passed through validate().
 */
const ResultSchema = (() => {

  // ── The canonical flight object ──────────────────────────────
  // Every flight that appears on a printed card has exactly these fields.
  function createFlight(fields) {
    return {
      aircraftType:   fields.aircraftType   || 'Unknown',
      aircraftId:     fields.aircraftId     || null,
      nationality:    fields.nationality    || '',
      tasking:        fields.tasking        || '',
      flightSize:     fields.flightSize     || 2,
      flightCount:    fields.flightCount    || 1,
      ordnance:       fields.ordnance       || null,
      text:           fields.text           || '',
      debugInfo:      fields.debugInfo      || null,
    };
  }

  // ── Single-flight result ─────────────────────────────────────
  // Tables A, B, F, G, H, L, A2, B2, F2, G2, L2
  function singleFlight(meta, flightFields) {
    return {
      table:    meta.table,
      faction:  meta.faction,
      flights:  [createFlight(flightFields)],
      text:     flightFields.text || '',
      debugInfo: meta.debugInfo || null,
    };
  }

  // ── Compound result (multiple flights/taskings) ──────────────
  // Tables C, D, E, I, J, K, C2, D2, E2, I2, J2, K2, D3, J3, H2
  function compoundResult(meta, flightArray) {
    return {
      table:    meta.table,
      faction:  meta.faction,
      flights:  flightArray.map(createFlight),
      text:     meta.text || flightArray.map(f => f.text).join('\n'),
      debugInfo: meta.debugInfo || null,
    };
  }

  // ── Validation ───────────────────────────────────────────────
  // Call this at the boundary: after a processor returns, before
  // the print generator consumes. Catches missing/wrong fields early.
  const REQUIRED_FLIGHT_FIELDS = [
    'aircraftType', 'nationality', 'tasking', 'flightSize', 'flightCount'
  ];

  function validate(result, context = '') {
    const errors = [];
    if (!result.table)   errors.push('missing result.table');
    if (!result.faction)  errors.push('missing result.faction');
    if (!Array.isArray(result.flights)) {
      errors.push('result.flights must be an array');
    } else {
      result.flights.forEach((f, i) => {
        REQUIRED_FLIGHT_FIELDS.forEach(field => {
          if (f[field] === undefined || f[field] === '') {
            errors.push(`flights[${i}].${field} is missing or empty`);
          }
        });
      });
    }
    if (errors.length > 0) {
      console.warn(`[ResultSchema] ${context}: ${errors.join('; ')}`);
    }
    return errors;
  }

  return { createFlight, singleFlight, compoundResult, validate };
})();
```

### How Processors Adopt It

Processors don't need to change their internal logic. Only the final `return` statement changes. Example for NATOTableA (currently returns via `formatResult()`):

```javascript
// Before
return this.formatResult({
  nationRoll, aircraftRoll, nationName, nationality,
  aircraftType, aircraftId, flightSize, flightCount: 1,
  tasking: 'CAP', text, debugText
});

// After
return ResultSchema.singleFlight(
  { table: this.tableId, faction: 'NATO', debugInfo: debugText },
  { aircraftType, aircraftId, nationality, tasking: 'CAP',
    flightSize: this.tableData.flightSize, flightCount: 1, text }
);
```

### How Print Generator Adopts It

The key simplification: `processFlights()` no longer needs to check for `flights` vs `taskings` vs `flightResults`. Every result has `result.flights[]`. The 70-line conditional block at line 1348 becomes:

```javascript
processFlights(results) {
  const processed = [];
  for (const result of results) {
    ResultSchema.validate(result, result.table);
    for (const flight of result.flights) {
      processed.push({ ...flight, faction: result.faction });
    }
  }
  return processed;
}
```

### Migration Strategy

1. Add `result-schema.js` — no existing code changes yet
2. Add validation calls in `processFlights()` alongside existing logic (log warnings, don't break)
3. Migrate processors one at a time, running tests after each
4. Once all 27 processors use the schema, remove the old conditional paths from `processFlights()`

### Test Coverage

Add a new test file `tests/e2e/result-schema.test.js` that:
- Runs every processor with mocked rolls
- Passes each result through `ResultSchema.validate()`
- Fails if any result has validation errors

This catches contract violations automatically for all future changes.

---

## Phase 2: Eliminate Data File Duplication

**Effort:** ~2-3 hours | **Impact:** Prevents data drift bugs | **Risk:** Low

### The Problem

The same data exists in up to 6 copies:
```
shared/data/aircraft-nato.json                    ← canonical
modules/red-storm/oob-generator/data/aircraft-nato.json
modules/baltic-approaches/oob-generator/data/aircraft-nato.json
```
(And the same for `aircraft-wp.json`, `weapons.json`, `aircraft-name-mapping.json`, `aircraft-note-rules.json`.)

When we fix a data error (like the Mi-8 mapping), we have to manually sync to all copies. If we miss one, a module silently uses stale data.

### The Fix

1. **Keep one canonical copy** in `shared/data/`
2. **Change all HTML pages** to load from the shared path using a relative URL
3. **Update `module-config.js`** data paths to point to shared
4. **Delete the module-level duplicates** (or replace with symlinks/redirects on Hostinger)

### What Changes

Every OOB generator `index.html` currently loads data relative to its own directory:
```javascript
fetch('data/aircraft-nato.json')  // resolves to modules/red-storm/oob-generator/data/
```

Change to:
```javascript
fetch('../../../../shared/data/aircraft-nato.json')
// or better: use DataService/ModuleConfig to resolve the path
```

The cleanest approach is to have `module-config.js` resolve all data paths to the shared location:
```javascript
data: {
  aircraftNATO: `${sharedBase}/data/aircraft-nato.json`,
  // ...
}
```

### What Stays Module-Specific

- `nato-tables.json` and `wp-tables.json` — these ARE module-specific (different tables per module)
- `table-metadata.json` — module-specific table descriptions
- Any module-only data (naval data, SSM data for BA)

### Verification

After consolidation, run the full Jest test suite. The tests load data via `require()` from fixed paths, so they validate the canonical data. Browser testing confirms the HTML pages resolve paths correctly.

---

## Phase 3: Clean Up the Aircraft Lookup Cascade

**Effort:** ~3-4 hours | **Impact:** Eliminates the second most common bug category | **Risk:** Medium

### The Problem

The print generator has a 4-tier aircraft lookup cascade (name mapping → ID index → exact key → alias search) spread across ~100 lines. This cascade exists because processors return aircraft names in inconsistent formats, and the print generator has to figure out what they meant.

With the `aircraftId` field now present on nearly all results (thanks to the variants refactoring), most of this cascade is unnecessary. If a processor provides an `aircraftId`, we should look up by ID — period.

### The Fix

Simplify `generateDesignerFlightCard()` aircraft resolution:

```javascript
// New: Simple, direct lookup
function lookupAircraft(flight, aircraftNATO, aircraftWP, nameMappingData) {
  const db = flight.faction === 'NATO' ? aircraftNATO : aircraftWP;

  // Priority 1: Direct ID lookup (most results have this now)
  if (flight.aircraftId && db) {
    for (const [key, data] of Object.entries(db)) {
      if (data.id === flight.aircraftId) return { key, data };
    }
  }

  // Priority 2: Exact key match
  if (db && db.hasOwnProperty(flight.aircraftType)) {
    return { key: flight.aircraftType, data: db[flight.aircraftType] };
  }

  // Priority 3: Name mapping (handles table shorthand → DB key)
  if (nameMappingData) {
    const mapped = resolveMappedName(flight, nameMappingData);
    if (mapped && db && db.hasOwnProperty(mapped.name)) {
      return { key: mapped.name, data: db[mapped.name] };
    }
  }

  // Priority 4: Alias search (last resort)
  if (db) {
    for (const [key, data] of Object.entries(db)) {
      if (data.aliases && data.aliases.includes(flight.aircraftType)) {
        return { key, data };
      }
    }
  }

  console.warn(`[LOOKUP] Aircraft not found: ${flight.aircraftType} (ID: ${flight.aircraftId})`);
  return null;
}
```

### What This Enables

- The lookup is now a standalone function, testable in Jest
- Add `tests/unit/aircraft-lookup.test.js` that exercises all 4 tiers with known data
- The test can catch name mapping gaps before they reach production

### Remaining Special Cases

Some processors still return `null` aircraftId for valid reasons:
- Split SEAD flights (`F-4G/F-4E`) — two aircraft types per result
- Player choice entries (`MiG-23MF/ML¹` in tables without variants)

These still need the name mapping cascade. But they're a small, enumerable set we can test exhaustively.

---

## Phase 4: Remove Debug Logging from Production Code

**Effort:** ~1-2 hours | **Impact:** Performance + readability | **Risk:** Very low

### The Problem

`processFlights()` has 15 `console.log()` calls that fire on every flight generation. `generateDesignerFlightCard()` has another ~10. These were added during debugging and left in. They clutter the browser console and make it harder to spot real errors.

### The Fix

1. Replace all debug logging with a conditional debug utility:
   ```javascript
   const DEBUG = window.debugMode || false;
   function debugLog(...args) { if (DEBUG) console.log(...args); }
   ```
2. Change `console.log('[FLIGHT CARD]...')` → `debugLog('[FLIGHT CARD]...')`
3. Keep `console.warn()` and `console.error()` calls — those flag real problems

This is mechanical and low-risk. The existing `debugMode` flag from `dice-roller.js` already exists.

---

## Phase 5: Standardize Processor Architecture

**Effort:** ~6-8 hours | **Impact:** Long-term maintainability | **Risk:** Medium

### The Problem

The 27 processors have two distinct architectural generations:
- **RS processors (A-L):** Use `formatResult()`, return `debugText` strings, don't include `table` or `faction`
- **BA processors (A2-L2):** Return raw objects with `table`, `faction`, `debugRolls[]`, `result`, `setupNote`

This means the print generator has two different code paths, and any new processor has to match whichever convention the developer happens to look at first.

### The Fix

After Phase 1 (ResultSchema) is in place, incrementally update all processors to use the schema builders. This naturally standardizes them because the schema enforces a single shape.

Priority order (by complexity and risk):

| Priority | Processors | Pattern | Notes |
|----------|-----------|---------|-------|
| 1 | A, B, G, H | Simple single-flight | Easiest — just wrap in `singleFlight()` |
| 2 | F, L, F2, L2 | Single mission | Similar to above, add `missionType` |
| 3 | A2, B2, G2, H2 | BA single-flight | Already close to schema; align |
| 4 | E, K, E2, K2, D3, J3 | Multi-flight (`flights[]`) | Already use `flights` — align entries |
| 5 | C, D, I, J, C2, D2, I2, J2 | Multi-tasking (`taskings[]`) | Rename to `flights[]`, align entries |

### What formatResult() Becomes

Once all processors use `ResultSchema`, the `formatResult()` method in `BaseTableProcessor` can be removed. It currently just passes through properties — the schema builders replace it.

---

## Phase 6: Build a Pre-Print Validation Page

**Effort:** ~3-4 hours | **Impact:** User-facing quality assurance | **Risk:** Very low

### The Problem

When the print generator fails to find an aircraft, it silently skips the card. The user only notices when they count their flight sheets and realize one is missing. The error is only visible in the browser console.

### The Fix

Add a pre-print validation step that shows the user exactly what will be printed before opening the print window:

1. **Validation summary** — Before generating cards, scan all results and flag:
   - Aircraft that won't resolve in the database
   - Missing nationality or tasking fields
   - Any `ResultSchema.validate()` warnings
2. **Preview panel** — Show a list of "Table X → F-15C (US, CAP, 2-ship)" entries
3. **Print button** — Only enabled when all flights validate

This is a UI addition, not a refactor. It can be built as a modal or a dedicated section in the OOB generator page.

---

## Phase 7: Consolidate name-mapping Into Aircraft DB

**Effort:** ~4-5 hours | **Impact:** Reduces indirection | **Risk:** Medium

### The Problem

`aircraft-name-mapping.json` exists because OOB table entries use shorthand names (e.g., "Tornado IDS" or "F-4") that don't exactly match the aircraft database keys (e.g., "Tornado IDS (GR.1)" or "F-4E"). This mapping layer is a persistent source of bugs — if a new table entry uses a name not in the mapping, it silently fails.

### The Fix

Move mapping data into the aircraft database itself, as additional aliases:

```json
{
  "F-4E": {
    "name": "F-4E Phantom II",
    "id": "US-F-4E-1",
    "aliases": ["F-4E", "F-4", "Phantom"],
    "tableNames": ["F-4", "F-4E"],   // ← names used in OOB tables
    ...
  }
}
```

Then remove the separate `aircraft-name-mapping.json` file entirely. The lookup cascade (Phase 3) already checks aliases — `tableNames` would be searched the same way.

### Migration

1. Write a script that reads `aircraft-name-mapping.json` and merges each entry's mapped name into the corresponding aircraft's `tableNames` array
2. Update the lookup function to check `tableNames` alongside `aliases`
3. Remove `aircraft-name-mapping.json` from all data directories
4. Update all `fetch()` calls and `DataService` methods that load it

### Risk

Higher than other phases because it touches the aircraft database structure. Must verify with the full test suite + browser testing.

---

## Implementation Order

```
Phase 1 ─── Result Contract ────── Highest impact, lowest risk
  │                                 Prevents the #1 bug category
  ▼
Phase 2 ─── Data Deduplication ─── Quick win, prevents data drift
  │
  ▼
Phase 3 ─── Lookup Cleanup ──────── Depends on Phase 1 (aircraftId reliable)
  │
  ▼
Phase 4 ─── Debug Logging ────────── Trivial, do anytime
  │
  ▼
Phase 5 ─── Processor Standardize ─ Depends on Phase 1 (uses ResultSchema)
  │
  ▼
Phase 6 ─── Pre-Print Validation ── Independent, user-facing quality
  │
  ▼
Phase 7 ─── Name Mapping Merge ──── Depends on Phase 3 (lookup simplified)
```

Phases 1-4 are the high-value work. Phases 5-7 are "nice to have" and can be deferred indefinitely without harm.

---

## What This Roadmap Does NOT Include

- **MySQL migration** — The POC plan exists separately. It's orthogonal to these fixes and doesn't address the contract fragility problem (a database can't help if the API returns the same inconsistent shapes).
- **React/SPA migration** — The app works well as multi-page HTML. A framework migration would be a rewrite, not a refactor. Not justified for the current scope.
- **New features** — This roadmap is purely about making what exists more reliable. New features (user-saved scenarios, additional modules, etc.) are separate conversations.
- **Hostinger deployment** — All changes here work on both local dev and production. No infrastructure changes needed.

---

## Success Metrics

After completing Phases 1-4:
- Zero silent print failures — every aircraft either resolves or shows a clear error
- New processors can be built by copying a template and changing the logic — the return shape is guaranteed by the schema
- Data fixes happen in one place — no more 6-file sync
- The browser console is clean during normal operation
- The test suite validates the contract for every processor automatically
