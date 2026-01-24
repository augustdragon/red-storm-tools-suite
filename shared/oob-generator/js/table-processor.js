/**
 * OOB Generator - Table Lookup and Resolution Module
 * 
 * Purpose:
 * - Process OOB table lookups
 * - Resolve table rolls to aircraft types
 * - Handle complex table logic (nested rolls, variants)
 * - Generate formatted results
 * 
 * Future Responsibilities:
 * - Load and parse table data from JSON files
 * - Perform table lookups based on roll results
 * - Handle special cases (date variants, ATAF zones, nationalities)
 * - Process nested rolls and sub-tables
 * - Format results for display
 * 
 * Functions to Extract:
 * - generateResult(): Main result generation function
 * - processTableRoll(): Process a single table roll
 * - resolveAircraft(): Resolve aircraft type from roll
 * - handleNestedRolls(): Process tables with nested rolls
 * 
 * Table Types to Support:
 * - Simple nation/aircraft tables (G, H)
 * - Date-variant tables (A, B, C)
 * - Tasking-based tables (C, D, I, J)
 * - Nationality-based tables (E, I, K)
 * - Mission-type tables (F, L)
 * 
 * Note: Currently all table processing is in generateResult() function
 * This module will isolate table logic for better maintainability.
 */

// Placeholder for table processing module
// Future: centralize result normalization here so table processors emit consistent fields.
function normalizeTableResult(result) {
  if (!result || typeof result !== 'object') return result;
  if (result.aircraftType && !result.aircraftId) {
    result.aircraftId = result.aircraftId || null;
  }
  return result;
}

if (typeof window !== 'undefined') {
  window.normalizeTableResult = normalizeTableResult;
}

console.log('OOB Generator: table-processor.js module loaded');
