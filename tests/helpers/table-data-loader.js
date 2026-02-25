/**
 * Table Data Loader — Load OOB Table and Aircraft JSON Files
 * ===========================================================
 *
 * Provides convenient functions to load the JSON data files that the
 * OOB generators use. In the browser, these files are loaded via fetch().
 * In Node.js tests, we use require() which synchronously reads and parses
 * the JSON file.
 *
 * Data sources:
 *   - Red Storm tables: modules/red-storm/oob-generator/data/
 *   - Baltic Approaches tables: modules/baltic-approaches/oob-generator/data/
 *   - Shared aircraft data: shared/data/
 *
 * Usage in tests:
 *   const { loadAllTables, loadAircraftDb } = require('../helpers/table-data-loader');
 *   const tables = loadAllTables();       // All tables from both modules
 *   const aircraft = loadAircraftDb();    // All aircraft (NATO + WP)
 */

const path = require('path');

// Base path to the rs-tools-hosted directory
const ROOT = path.join(__dirname, '..', '..');

/**
 * Load Red Storm NATO tables (A-F).
 * @returns {object} Table data keyed by table ID
 */
function loadRSNatoTables() {
    return require(path.join(ROOT, 'modules', 'red-storm', 'oob-generator', 'data', 'nato-tables.json'));
}

/**
 * Load Red Storm Warsaw Pact tables (G-L).
 * @returns {object} Table data keyed by table ID
 */
function loadRSWPTables() {
    return require(path.join(ROOT, 'modules', 'red-storm', 'oob-generator', 'data', 'wp-tables.json'));
}

/**
 * Load Baltic Approaches NATO tables (A2-F2).
 * @returns {object} Table data keyed by table ID
 */
function loadBANatoTables() {
    return require(path.join(ROOT, 'modules', 'baltic-approaches', 'oob-generator', 'data', 'nato-tables.json'));
}

/**
 * Load Baltic Approaches Warsaw Pact tables (G2-L2).
 * @returns {object} Table data keyed by table ID
 */
function loadBAWPTables() {
    return require(path.join(ROOT, 'modules', 'baltic-approaches', 'oob-generator', 'data', 'wp-tables.json'));
}

/**
 * Load all tables from both modules into a single merged object.
 * This matches the structure that getTableDataSource() returns in the browser.
 *
 * @returns {object} All tables keyed by ID (A-L, A2-F2, G2-L2, etc.)
 */
function loadAllTables() {
    return {
        ...loadRSNatoTables(),
        ...loadRSWPTables(),
        ...loadBANatoTables(),
        ...loadBAWPTables(),
    };
}

/**
 * Load the master NATO aircraft database.
 * Skips metadata keys (prefixed with underscore).
 *
 * @returns {object} Aircraft keyed by name
 */
function loadAircraftNATO() {
    return require(path.join(ROOT, 'shared', 'data', 'aircraft-nato.json'));
}

/**
 * Load the master Warsaw Pact aircraft database.
 * Skips metadata keys (prefixed with underscore).
 *
 * @returns {object} Aircraft keyed by name
 */
function loadAircraftWP() {
    return require(path.join(ROOT, 'shared', 'data', 'aircraft-wp.json'));
}

/**
 * Load both aircraft databases and merge them into a single lookup object.
 * Metadata keys (prefixed with _) are excluded.
 *
 * Each aircraft entry has an `id` field that OOB table entries reference
 * via their `aircraftId` field. This merged database allows cross-referencing.
 *
 * @returns {object} All aircraft keyed by name, with a byId lookup map
 */
function loadAircraftDb() {
    const nato = loadAircraftNATO();
    const wp = loadAircraftWP();

    // Merge both databases, excluding metadata keys
    const merged = {};
    const byId = {};

    for (const [key, aircraft] of Object.entries(nato)) {
        if (key.startsWith('_')) continue;
        merged[key] = aircraft;
        if (aircraft.id) byId[aircraft.id] = aircraft;
    }
    for (const [key, aircraft] of Object.entries(wp)) {
        if (key.startsWith('_')) continue;
        merged[key] = aircraft;
        if (aircraft.id) byId[aircraft.id] = aircraft;
    }

    return { byName: merged, byId };
}

module.exports = {
    loadRSNatoTables,
    loadRSWPTables,
    loadBANatoTables,
    loadBAWPTables,
    loadAllTables,
    loadAircraftNATO,
    loadAircraftWP,
    loadAircraftDb,
    ROOT,
};
