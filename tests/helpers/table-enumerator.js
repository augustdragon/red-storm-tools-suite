/**
 * Table Enumerator — Walk OOB Table Structures
 * ==============================================
 *
 * The OOB table JSON files have deeply nested structures with several
 * different organizational patterns across tables:
 *
 *   Red Storm NATO:  table > variants > ataf > date > nations > aircraft
 *   Red Storm WP:    table > nations > aircraft  (flat, no variants)
 *   Baltic NATO:     table > dateRanges > date > nations > aircraft
 *   Baltic WP:       table > dateRanges > date > nations > aircraft
 *
 * This module provides utilities to recursively walk these structures and
 * find all "range objects" — objects whose keys are die roll ranges like
 * "1-4", "5-6", "7-10". These appear at both the nation level and the
 * aircraft level within each nation.
 *
 * The primary use case is the range coverage test: for every range object,
 * verify that the ranges cover exactly 1-10 with no gaps or overlaps.
 *
 * Usage in tests:
 *   const { findAllRangeObjects } = require('../helpers/table-enumerator');
 *   const tables = loadAllTables();
 *   const rangeObjects = findAllRangeObjects(tables);
 *   // rangeObjects is an array of { path, obj } where obj has range-string keys
 */

/**
 * Check if a string looks like a die roll range.
 * Valid formats: "1", "5", "10", "1-4", "5-6", "7-10"
 *
 * @param {string} key - The key to check
 * @returns {boolean} True if the key is a range string
 */
function isRangeKey(key) {
    return /^\d+(-\d+)?$/.test(key);
}

/**
 * Check if an object is a "range object" — an object where ALL keys
 * are range strings. This identifies the objects that represent die roll
 * lookup tables (e.g., { "1-4": {...}, "5-6": {...}, "7-10": {...} }).
 *
 * We require at least 1 key to avoid false positives on empty objects.
 *
 * @param {object} obj - The object to check
 * @returns {boolean} True if all keys are range strings
 */
function isRangeObject(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    const keys = Object.keys(obj);
    if (keys.length === 0) return false;
    return keys.every(isRangeKey);
}

/**
 * Parse a range string into [min, max] values.
 * "1-4" → [1, 4]
 * "5"   → [5, 5]
 *
 * @param {string} range - Range string
 * @returns {number[]} [min, max]
 */
function parseRange(range) {
    if (range.includes('-')) {
        const [min, max] = range.split('-').map(Number);
        return [min, max];
    }
    const num = Number(range);
    return [num, num];
}

/**
 * Recursively walk a table structure and find all range objects.
 *
 * This function descends through the JSON tree, identifying objects whose
 * keys are all range strings. When it finds one, it records the path and
 * the object, then continues recursing INTO the range object's values
 * to find nested range objects (e.g., aircraft ranges within a nation).
 *
 * Skips:
 *   - Arrays (ordnance, capabilities, etc.)
 *   - Primitive values
 *   - Keys starting with _ (metadata)
 *   - Known non-range object keys (name, aircraft, aircraftId, etc.)
 *
 * @param {*} node - Current node in the JSON tree
 * @param {string} path - Dot-notation path for identification (e.g., "A.variants.2ATAF.pre.nations")
 * @param {Array} results - Accumulator for found range objects
 * @returns {Array<{path: string, obj: object}>} All range objects found
 */
function findAllRangeObjects(node, path = '', results = []) {
    if (!node || typeof node !== 'object') {
        return results;
    }

    // Recurse into arrays to find range objects inside (e.g., flights arrays
    // in combat rescue tables E and K contain aircraft range objects)
    if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
            if (node[i] && typeof node[i] === 'object') {
                findAllRangeObjects(node[i], `${path}[${i}]`, results);
            }
        }
        return results;
    }

    // Check if this node itself is a range object
    if (isRangeObject(node)) {
        results.push({ path, obj: node });

        // Continue recursing into the values of this range object
        // to find nested range objects (e.g., aircraft within nations)
        for (const [key, value] of Object.entries(node)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                findAllRangeObjects(value, `${path}[${key}]`, results);
            }
        }
        return results;
    }

    // Not a range object — recurse into its values
    for (const [key, value] of Object.entries(node)) {
        // Skip metadata and known leaf fields
        if (key.startsWith('_')) continue;
        if (typeof value !== 'object' || value === null) continue;

        // Skip known non-range fields that are objects but not range lookups
        const skipKeys = [
            'speeds', 'weapons', 'ordnance', 'capabilities', 'aliases',
            'radar', 'style', 'print', 'features', 'setup', 'data',
        ];
        if (skipKeys.includes(key)) continue;

        const childPath = path ? `${path}.${key}` : key;
        findAllRangeObjects(value, childPath, results);
    }

    return results;
}

/**
 * Validate that a range object covers exactly 1-10 with no gaps or overlaps.
 *
 * Strategy:
 *   1. Create a coverage array of 10 slots (representing die values 1-10)
 *   2. For each range key, mark which slots it covers
 *   3. Check that every slot is covered exactly once
 *
 * @param {object} rangeObj - Object with range-string keys
 * @returns {{valid: boolean, gaps: number[], overlaps: number[], ranges: string[]}}
 */
function validateRangeCoverage(rangeObj) {
    // coverage[i] = number of ranges covering die value (i+1)
    // Index 0 = die value 1, index 9 = die value 10
    const coverage = new Array(10).fill(0);
    const ranges = Object.keys(rangeObj);

    for (const range of ranges) {
        const [min, max] = parseRange(range);
        for (let i = min; i <= max; i++) {
            if (i >= 1 && i <= 10) {
                coverage[i - 1]++;
            }
        }
    }

    const gaps = [];
    const overlaps = [];
    for (let i = 0; i < 10; i++) {
        if (coverage[i] === 0) gaps.push(i + 1);
        if (coverage[i] > 1) overlaps.push(i + 1);
    }

    return {
        valid: gaps.length === 0 && overlaps.length === 0,
        gaps,
        overlaps,
        ranges,
        coverage,
    };
}

/**
 * Get all table IDs that exist in a tables data object.
 * Filters out metadata keys.
 *
 * @param {object} tables - Tables data from loadAllTables()
 * @returns {string[]} Array of table IDs (e.g., ['A', 'B', ..., 'L2'])
 */
function getTableIds(tables) {
    return Object.keys(tables).filter(k => !k.startsWith('_'));
}

module.exports = {
    isRangeKey,
    isRangeObject,
    parseRange,
    findAllRangeObjects,
    validateRangeCoverage,
    getTableIds,
};
