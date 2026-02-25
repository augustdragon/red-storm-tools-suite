/**
 * ResultSchema — Canonical Result Contract for OOB Generators
 * ============================================================
 *
 * This module defines the ONE universal shape that every table processor
 * result should eventually conform to:
 *
 *   {
 *     table:      string,       // Table identifier (e.g., "A", "D3", "J3")
 *     faction:    string,       // "NATO" or "WP"
 *     raidType:   string|null,  // Raid/mission description (if applicable)
 *     flights:    Flight[],     // Array of canonical flight objects
 *     text:       string,       // Combined display text (HTML-formatted)
 *     debugRolls: string        // Combined debug/roll info
 *   }
 *
 * Each Flight in the array has this shape:
 *
 *   {
 *     aircraftType:      string,       // Aircraft name (e.g., "F-15C")
 *     aircraftId:        string|null,  // Database identifier
 *     nationality:       string,       // Display nationality (e.g., "US")
 *     actualNationality: string|null,  // Resolved nationality code
 *     tasking:           string,       // Mission type (e.g., "CAP", "SEAD")
 *     flightSize:        number,       // Aircraft per flight
 *     flightCount:       number,       // Number of flights
 *     ordnance:          string|null,  // Ordnance type (if applicable)
 *     sourceTable:       string|null,  // Originating table ID
 *     text:              string        // Flight-level display text
 *   }
 *
 * WHY THIS EXISTS
 * ---------------
 * The 27 table processors return five different result shapes (single-flight,
 * multi-tasking, flights-array, combat-rescue, base-format). The print
 * generator had a fragile ~70-line conditional block to detect and flatten
 * each shape. This module replaces that guesswork with:
 *
 *   1. Builder functions (createFlight, createResult) for new code
 *   2. A normalize() adapter that converts ANY old-style result into the
 *      canonical shape — so processors can be migrated one at a time
 *   3. A validate() function that catches contract violations early
 *
 * MIGRATION STRATEGY
 * ------------------
 * Phase 1 (this file): normalize() is called in processFlights() as an
 * adapter layer. No processors are changed yet.
 *
 * Future phases: Processors adopt createFlight/createResult directly,
 * and the normalize() fallback is eventually removed.
 *
 * SCRIPT LOAD ORDER
 * -----------------
 * Load after utils.js, before print-generator.js and processors:
 *   <script src="utils.js"></script>
 *   <script src="result-schema.js"></script>   <!-- THIS FILE -->
 *   <script src="dice-roller.js"></script>
 *   <script src="print-generator.js"></script>
 */

const ResultSchema = (function () {
  'use strict';

  // =========================================================================
  //  BUILDERS — Use these when writing NEW processor code
  // =========================================================================

  /**
   * Create a canonical flight object with sensible defaults.
   *
   * Every field that might be missing gets a safe default via `??`
   * (nullish coalescing), so callers only need to supply what they have.
   *
   * @param {object} fields - Flight properties (all optional, but
   *   aircraftType, nationality, tasking, flightSize are expected)
   * @returns {object} Canonical flight object
   *
   * @example
   *   createFlight({
   *     aircraftType: 'F-15C',
   *     nationality: 'US',
   *     tasking: 'CAP',
   *     flightSize: 4,
   *   });
   */
  function createFlight(fields) {
    return {
      aircraftType:      fields.aircraftType      ?? '',
      aircraftId:        fields.aircraftId         ?? null,
      nationality:       fields.nationality        ?? '',
      actualNationality: fields.actualNationality  ?? null,
      tasking:           fields.tasking            ?? '',
      flightSize:        fields.flightSize         ?? 0,
      flightCount:       fields.flightCount        ?? 1,
      ordnance:          fields.ordnance           ?? null,
      sourceTable:       fields.sourceTable        ?? null,
      text:              fields.text               ?? '',
    };
  }

  /**
   * Create the universal result envelope.
   *
   * Accepts a single flight OR an array of flights. A single flight is
   * automatically wrapped in an array so downstream code always gets
   * `result.flights[]`.
   *
   * @param {object} meta - Top-level metadata:
   *   @param {string} meta.table    - Table identifier (e.g., "A", "D3")
   *   @param {string} meta.faction  - "NATO" or "WP"
   *   @param {string} [meta.raidType] - Raid/mission description
   *   @param {string} [meta.text]   - Combined display text
   *   @param {string} [meta.debugRolls] - Combined debug info
   * @param {object|object[]} flightOrArray - One flight or array of flights
   * @returns {object} Canonical result object
   *
   * @example
   *   createResult(
   *     { table: 'A', faction: 'NATO', text: '...', debugRolls: '...' },
   *     createFlight({ aircraftType: 'F-15C', ... })
   *   );
   */
  function createResult(meta, flightOrArray) {
    const flights = Array.isArray(flightOrArray)
      ? flightOrArray.map(createFlight)
      : [createFlight(flightOrArray || {})];

    return {
      table:      meta.table      ?? '',
      faction:    meta.faction     ?? '',
      raidType:   meta.raidType    ?? null,
      flights:    flights,
      text:       meta.text        ?? '',
      debugRolls: meta.debugRolls  ?? '',
    };
  }

  // =========================================================================
  //  VALIDATOR — Catches contract violations at the boundary
  // =========================================================================

  /**
   * Validate a canonical result object. Returns an array of error strings.
   * An empty array means the result is valid.
   *
   * Also logs each error via console.warn so problems are visible in both
   * the browser console and test output.
   *
   * @param {object} result  - The result to validate
   * @param {string} context - Label for log messages (e.g., table ID)
   * @returns {string[]} Array of validation error messages (empty = valid)
   *
   * @example
   *   const errors = validate(myResult, 'Table A');
   *   if (errors.length > 0) { console.error('Invalid:', errors); }
   */
  function validate(result, context) {
    var errors = [];
    var prefix = '[ResultSchema] ' + (context || 'unknown') + ': ';

    // Top-level checks
    if (!result || typeof result !== 'object') {
      errors.push(prefix + 'result is not an object');
      return errors; // Can't check anything else
    }

    if (!result.table) {
      errors.push(prefix + 'missing "table"');
    }

    if (result.faction !== 'NATO' && result.faction !== 'WP') {
      errors.push(prefix + 'faction must be "NATO" or "WP", got "' + result.faction + '"');
    }

    if (!Array.isArray(result.flights) || result.flights.length === 0) {
      errors.push(prefix + 'flights must be a non-empty array');
      return errors; // Can't check individual flights
    }

    // Per-flight checks
    for (var i = 0; i < result.flights.length; i++) {
      var f = result.flights[i];
      var fPrefix = prefix + 'flights[' + i + ']: ';

      if (!f.aircraftType) {
        errors.push(fPrefix + 'missing aircraftType');
      }
      if (!f.nationality) {
        errors.push(fPrefix + 'missing nationality');
      }
      if (!f.tasking) {
        errors.push(fPrefix + 'missing tasking');
      }
      if (typeof f.flightSize !== 'number' || f.flightSize <= 0) {
        errors.push(fPrefix + 'flightSize must be a positive number, got ' + f.flightSize);
      }
      if (typeof f.flightCount !== 'number' || f.flightCount <= 0) {
        errors.push(fPrefix + 'flightCount must be a positive number, got ' + f.flightCount);
      }
    }

    // Log warnings for visibility
    for (var j = 0; j < errors.length; j++) {
      console.warn(errors[j]);
    }

    return errors;
  }

  // =========================================================================
  //  NORMALIZER — Converts any old-style result into canonical shape
  // =========================================================================

  /**
   * Convert any processor result into the canonical shape.
   *
   * This is the migration bridge. It detects which of the five known result
   * shapes is present and transforms it. Once all processors use
   * createResult() directly, this function becomes unnecessary.
   *
   * Detection order (most specific → least specific):
   *   1. Already canonical (has flights[] + table + faction)  → return as-is
   *   2. Has taskings[]   → map each tasking into a flight    → wrap
   *   3. Has flights[]    → normalize each entry              → wrap
   *   4. Has flightResults[] → treat like flights[]           → wrap
   *   5. Flat single-flight → wrap in one-element flights[]   → wrap
   *
   * Field aliases handled:
   *   - aircraft       → aircraftType
   *   - nationName     → nationality
   *   - debugText      → debugRolls
   *   - flightType     → tasking
   *   - type           → tasking
   *   - quantity        → flightCount
   *   - sourceTable     → (used as table fallback)
   *
   * @param {object} rawResult      - The processor's raw result object
   * @param {string} fallbackFaction - Faction to use if not in the result
   * @param {string} [fallbackTable] - Table ID to use if not found in result
   * @returns {object} Canonical result object
   *
   * @example
   *   // In processFlights():
   *   const normalized = ResultSchema.normalize(flight, flight.faction, flight.table);
   */
  function normalize(rawResult, fallbackFaction, fallbackTable) {
    if (!rawResult || typeof rawResult !== 'object') {
      return createResult(
        { table: fallbackTable || '', faction: fallbackFaction || '', text: '', debugRolls: '' },
        []
      );
    }

    // Helper: resolve common field aliases for a single flight-like object
    function resolveAliases(obj) {
      return {
        aircraftType:      obj.aircraftType || obj.aircraft || '',
        aircraftId:        obj.aircraftId   ?? null,
        nationality:       obj.nationality  || obj.nationName || '',
        actualNationality: obj.actualNationality ?? null,
        tasking:           obj.tasking || obj.flightType || obj.type || '',
        flightSize:        obj.flightSize   ?? 0,
        flightCount:       obj.flightCount  || obj.quantity || 1,
        ordnance:          obj.ordnance     ?? null,
        sourceTable:       obj.sourceTable  || obj.table || null,
        text:              obj.text         ?? '',
      };
    }

    /**
     * Extract top-level metadata from the raw result.
     * Looks at the top level first, then falls back to nested flights/taskings
     * for the table ID (since some processors only set table inside entries).
     */
    function extractMeta(raw) {
      // Try to find table: top-level → nested flights → nested taskings → fallback
      var table = raw.table || raw.sourceTable || '';
      if (!table && Array.isArray(raw.flights) && raw.flights.length > 0) {
        table = raw.flights[0].table || raw.flights[0].sourceTable || '';
      }
      if (!table && Array.isArray(raw.taskings) && raw.taskings.length > 0) {
        table = raw.taskings[0].sourceTable || raw.taskings[0].table || '';
      }
      if (!table) {
        table = fallbackTable || '';
      }

      return {
        table:      table,
        faction:    raw.faction || fallbackFaction || '',
        raidType:   raw.raidType || null,
        text:       raw.text || '',
        debugRolls: raw.debugRolls || raw.debugText || '',
      };
    }

    var meta = extractMeta(rawResult);

    // ----- Case 1: Already canonical -----
    // Has flights[] AND table AND faction — assume it's already normalized.
    // Still normalize each flight entry in case of alias usage.
    if (Array.isArray(rawResult.flights) && rawResult.flights.length > 0
        && rawResult.table && rawResult.faction) {
      return {
        table:      meta.table,
        faction:    meta.faction,
        raidType:   meta.raidType,
        flights:    rawResult.flights.map(function (f) {
          return createFlight(resolveAliases(f));
        }),
        text:       meta.text,
        debugRolls: meta.debugRolls,
      };
    }

    // ----- Case 2: Has taskings[] (Tables C, D, I, J, etc.) -----
    // Each tasking entry is a flight-like object with its own rolls.
    var taskingsArray = rawResult.taskings;
    if (Array.isArray(taskingsArray) && taskingsArray.length > 0) {
      var taskingFlights = taskingsArray.map(function (t) {
        return createFlight(resolveAliases(t));
      });
      return {
        table:      meta.table,
        faction:    meta.faction,
        raidType:   meta.raidType,
        flights:    taskingFlights,
        text:       meta.text,
        debugRolls: meta.debugRolls,
      };
    }

    // ----- Case 3: Has flights[] but missing table or faction -----
    // (Tables like D3, J3 that set flights[] but may lack table/faction
    //  at the top level — or flightResults[] from Table E)
    var flightsArray = rawResult.flights || rawResult.flightResults;
    if (Array.isArray(flightsArray) && flightsArray.length > 0) {
      var normalizedFlights = flightsArray.map(function (f) {
        return createFlight(resolveAliases(f));
      });
      return {
        table:      meta.table,
        faction:    meta.faction,
        raidType:   meta.raidType,
        flights:    normalizedFlights,
        text:       meta.text,
        debugRolls: meta.debugRolls,
      };
    }

    // ----- Case 4: Flat single-flight object (Tables A, B, G, H, etc.) -----
    // The result IS the flight — wrap it in an envelope.
    var singleFlight = createFlight(resolveAliases(rawResult));
    return {
      table:      meta.table,
      faction:    meta.faction,
      raidType:   meta.raidType,
      flights:    [singleFlight],
      text:       meta.text,
      debugRolls: meta.debugRolls,
    };
  }

  // =========================================================================
  //  PUBLIC API
  // =========================================================================

  return {
    createFlight: createFlight,
    createResult: createResult,
    validate:     validate,
    normalize:    normalize,
  };

})();

// Export for both browser (window.ResultSchema) and Node.js (module.exports)
if (typeof window !== 'undefined') {
  window.ResultSchema = ResultSchema;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResultSchema;
}
