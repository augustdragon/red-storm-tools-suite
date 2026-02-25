/**
 * JSON-to-SQL Migration Script for Aircraft Data
 * ================================================
 *
 * Reads the shared aircraft JSON files (aircraft-nato.json and aircraft-wp.json)
 * and generates SQL INSERT statements that populate the `aircraft` table defined
 * in db/init/001-schema.sql.
 *
 * How it works:
 *   1. Loads both JSON files from shared/data/
 *   2. Iterates every aircraft entry (skipping metadata keys like _version)
 *   3. Flattens the nested weapons:{} object into individual columns
 *   4. Preserves complex nested data (speeds, ordnance, capabilities, aliases)
 *      as JSON strings for storage in MySQL JSON columns
 *   5. Writes all INSERT statements to db/init/002-seed-aircraft.sql
 *
 * The output file is placed in db/init/ so Docker's mysql entrypoint will
 * automatically execute it after the schema file (001-schema.sql) during
 * the first `docker-compose up`.
 *
 * Usage:
 *   cd rs-tools-hosted
 *   node db/migrate/json-to-sql.js
 *
 * Requirements:
 *   - Node.js (any recent version)
 *   - No npm dependencies — uses only built-in fs and path modules
 */

const fs = require('fs');
const path = require('path');

// Paths relative to the rs-tools-hosted directory
const DATA_DIR = path.join(__dirname, '..', '..', 'shared', 'data');
const OUTPUT_FILE = path.join(__dirname, '..', 'init', '002-seed-aircraft.sql');

/**
 * Escape a string value for safe inclusion in a SQL statement.
 * Handles null values, single quotes, and backslashes.
 *
 * @param {*} value - The value to escape
 * @returns {string} SQL-safe string: 'value' or NULL
 */
function sqlEscape(value) {
    if (value === null || value === undefined) {
        return 'NULL';
    }
    if (typeof value === 'number') {
        return String(value);
    }
    // Convert to string, escape single quotes and backslashes
    const str = String(value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
    return `'${str}'`;
}

/**
 * Convert a JSON value to a SQL JSON column value.
 * Wraps the JSON.stringify output in single quotes for SQL insertion.
 *
 * @param {*} value - Any JSON-serializable value (array, object, etc.)
 * @returns {string} SQL-safe JSON string or NULL
 */
function sqlJson(value) {
    if (value === null || value === undefined) {
        return 'NULL';
    }
    // JSON.stringify produces the canonical representation.
    // We then escape it for SQL insertion.
    const json = JSON.stringify(value);
    return sqlEscape(json);
}

/**
 * Convert a single aircraft JSON entry into an INSERT statement.
 *
 * The aircraft JSON has this shape:
 *   {
 *     name, id, model, nation, crew, rwy, fuel, notes,
 *     weapons: { gun, gunDepletion, irm, irmDepletion, rhm, rhmDepletion },
 *     bomb, sight, rwr, jam, radar, aam, module,
 *     speeds: { clean: {...}, laden: {...} },
 *     ordnance: [...],
 *     capabilities: [...],
 *     aliases: [...],
 *     standoffJammingStrength: "..." (optional),
 *     hideFromReference: true (optional),
 *     nationOptions: [...] (optional)
 *   }
 *
 * @param {string} jsonKey - The top-level key in the JSON file (e.g., "F-15C")
 * @param {object} aircraft - The aircraft data object
 * @param {string} faction - "NATO" or "WP"
 * @returns {string} Complete INSERT INTO statement
 */
function buildInsert(jsonKey, aircraft, faction) {
    // Extract weapons from nested object, defaulting to null
    const weapons = aircraft.weapons || {};

    // Build the column values in the same order as the INSERT column list
    const values = [
        sqlEscape(aircraft.id),                              // id
        sqlEscape(jsonKey),                                   // json_key
        sqlEscape(aircraft.name),                             // name
        sqlEscape(aircraft.model || null),                    // model
        sqlEscape(aircraft.nation),                           // nation
        sqlEscape(faction),                                   // faction
        sqlEscape(aircraft.module),                           // module
        aircraft.crew != null ? aircraft.crew : 'NULL',       // crew
        aircraft.rwy != null ? aircraft.rwy : 'NULL',         // rwy
        sqlEscape(aircraft.fuel != null ? String(aircraft.fuel) : null), // fuel
        sqlEscape(aircraft.notes || null),                    // notes
        sqlEscape(weapons.gun || null),                       // gun
        weapons.gunDepletion != null ? weapons.gunDepletion : 'NULL', // gun_depletion
        sqlEscape(weapons.irm || null),                       // irm
        weapons.irmDepletion != null ? weapons.irmDepletion : 'NULL', // irm_depletion
        sqlEscape(weapons.rhm || null),                       // rhm
        weapons.rhmDepletion != null ? weapons.rhmDepletion : 'NULL', // rhm_depletion
        sqlEscape(aircraft.bomb || null),                     // bomb
        sqlEscape(aircraft.sight || null),                    // sight
        sqlEscape(aircraft.rwr || null),                      // rwr
        sqlEscape(aircraft.jam || null),                      // jam
        sqlEscape(aircraft.radar || null),                    // radar
        sqlEscape(aircraft.aam || null),                      // aam
        sqlEscape(aircraft.standoffJammingStrength || null),  // standoff_jamming_strength
        aircraft.hideFromReference ? 1 : 0,                   // hide_from_reference
        sqlJson(aircraft.speeds || null),                     // speeds (JSON)
        sqlJson(aircraft.ordnance || null),                   // ordnance (JSON)
        sqlJson(aircraft.capabilities || null),               // capabilities (JSON)
        sqlJson(aircraft.aliases || null),                    // aliases (JSON)
        sqlJson(aircraft.nationOptions || null),              // nation_options (JSON)
    ];

    return `INSERT INTO aircraft (id, json_key, name, model, nation, faction, module, crew, rwy, fuel, notes, gun, gun_depletion, irm, irm_depletion, rhm, rhm_depletion, bomb, sight, rwr, jam, radar, aam, standoff_jamming_strength, hide_from_reference, speeds, ordnance, capabilities, aliases, nation_options) VALUES\n  (${values.join(', ')});`;
}

/**
 * Main migration function.
 * Reads both JSON files, generates INSERT statements, writes to output file.
 */
function migrate() {
    console.log('=== Aircraft JSON → SQL Migration ===\n');

    // Load JSON data files
    const natoPath = path.join(DATA_DIR, 'aircraft-nato.json');
    const wpPath = path.join(DATA_DIR, 'aircraft-wp.json');

    console.log(`Reading NATO data from: ${natoPath}`);
    const natoData = JSON.parse(fs.readFileSync(natoPath, 'utf8'));

    console.log(`Reading WP data from: ${wpPath}`);
    const wpData = JSON.parse(fs.readFileSync(wpPath, 'utf8'));

    // Collect all INSERT statements
    const statements = [];
    let natoCount = 0;
    let wpCount = 0;

    // Header comment for the generated SQL file
    statements.push('-- =============================================================================');
    statements.push('-- Auto-generated aircraft seed data');
    statements.push(`-- Generated by: node db/migrate/json-to-sql.js`);
    statements.push(`-- Generated at: ${new Date().toISOString()}`);
    statements.push('-- =============================================================================');
    statements.push('');
    statements.push('-- NATO Aircraft');
    statements.push('-- -------------');

    // Process NATO aircraft
    for (const [key, aircraft] of Object.entries(natoData)) {
        // Skip metadata keys (prefixed with underscore)
        if (key.startsWith('_')) continue;
        statements.push(buildInsert(key, aircraft, 'NATO'));
        natoCount++;
    }

    statements.push('');
    statements.push('-- Warsaw Pact Aircraft');
    statements.push('-- --------------------');

    // Process WP aircraft
    for (const [key, aircraft] of Object.entries(wpData)) {
        if (key.startsWith('_')) continue;
        statements.push(buildInsert(key, aircraft, 'WP'));
        wpCount++;
    }

    // Write the output file
    const output = statements.join('\n') + '\n';
    fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

    console.log(`\nMigration complete!`);
    console.log(`  NATO aircraft: ${natoCount}`);
    console.log(`  WP aircraft:   ${wpCount}`);
    console.log(`  Total:         ${natoCount + wpCount}`);
    console.log(`  Output:        ${OUTPUT_FILE}`);
}

// Run the migration
migrate();
