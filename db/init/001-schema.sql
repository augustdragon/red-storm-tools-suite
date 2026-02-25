-- =============================================================================
-- Red Storm Tools Suite — Aircraft Table Schema
-- =============================================================================
--
-- This is the POC schema for the MySQL data layer. It stores aircraft data
-- that was previously held in static JSON files (aircraft-nato.json and
-- aircraft-wp.json).
--
-- Design decisions:
--
--   FLAT COLUMNS for simple scalar fields:
--     name, nation, crew, fuel, etc. — these map directly from JSON keys
--     to SQL columns. This gives us indexing, filtering, and type safety.
--
--   JSON COLUMNS for nested/variable structures:
--     speeds, ordnance, capabilities, aliases — these have complex nested
--     structures (speeds has clean/laden, each with combat/dash/maneuver)
--     that would require multiple junction tables to fully normalize. Since
--     this data is read-only and always consumed as a unit, storing it as
--     JSON preserves the original structure and simplifies the API layer.
--
--   VARCHAR for numeric-ish fields (fuel, bomb, sight, rwr, jam, radar):
--     Many of these contain mixed values like "U" (unlimited), "+1",
--     "-/-", "C/3d", "Surf", etc. They're display strings, not numbers.
--
-- The PHP API reconstructs the original nested JSON structure from these
-- flat rows, so the frontend receives byte-identical data regardless of
-- whether it came from the static JSON file or the database.
-- =============================================================================

CREATE TABLE IF NOT EXISTS aircraft (
    -- Primary key: the aircraft's unique identifier (e.g., "US-F-15C-1")
    id VARCHAR(50) PRIMARY KEY,

    -- The JSON object key used to look up this aircraft (e.g., "F-15C")
    -- This is the top-level key in the original JSON files.
    json_key VARCHAR(100) NOT NULL,

    -- Display name and model (often identical, sometimes model has NATO code)
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100),

    -- Nation code: US, UK, FRG, BE, NE, CAN, DK, SE, USSR, GDR, POL, etc.
    nation VARCHAR(10) NOT NULL,

    -- Faction: NATO or WP (Warsaw Pact)
    faction ENUM('NATO', 'WP') NOT NULL,

    -- Module: RS (Red Storm) or BA (Baltic Approaches)
    module ENUM('RS', 'BA') NOT NULL,

    -- Crew count (1-9 typically)
    crew TINYINT,

    -- Runway requirement (landing strip length class)
    rwy TINYINT,

    -- Fuel: usually an integer, but can be "U" (unlimited) for large aircraft
    fuel VARCHAR(5),

    -- Notes: comma-separated note codes like "B, C, I" referencing rule modifiers
    notes VARCHAR(100),

    -- Weapons — flattened from the nested weapons:{} object
    gun VARCHAR(30),
    gun_depletion TINYINT,
    irm VARCHAR(30),
    irm_depletion TINYINT,
    rhm VARCHAR(30),
    rhm_depletion TINYINT,

    -- Bomb sight modifier (e.g., "1", "+1", null)
    bomb VARCHAR(10),
    -- Bombing sight value
    sight VARCHAR(10),

    -- Radar Warning Receiver (e.g., "-/-", "C/3d", "A")
    rwr VARCHAR(20),
    -- ECM jamming capability (e.g., "2n", null)
    jam VARCHAR(20),

    -- Aircraft radar (e.g., "Surf", null — simple string, not the full radar object)
    radar VARCHAR(30),

    -- Air-to-air missile type (e.g., "AIM-9L", "R-60")
    aam VARCHAR(30),

    -- Standoff jamming strength (BA module only, e.g., "10/20/40")
    standoff_jamming_strength VARCHAR(30),

    -- Whether to hide this aircraft from the reference page
    hide_from_reference TINYINT(1) DEFAULT 0,

    -- JSON columns for complex nested structures
    -- These store the exact JSON from the source files.
    speeds JSON COMMENT 'Nested speed data: {clean: {combat, dash, maneuver}, laden: {...}}',
    ordnance JSON COMMENT 'Array of ordnance loadout objects',
    capabilities JSON COMMENT 'Array of capability strings like ["Recon", "TFR", "Night"]',
    aliases JSON COMMENT 'Array of alternative names for this aircraft',
    nation_options JSON COMMENT 'Array of nation codes this aircraft can belong to (multi-nation variants)',

    -- Indexes for common query patterns
    INDEX idx_nation (nation),
    INDEX idx_faction (faction),
    INDEX idx_module (module),
    INDEX idx_json_key (json_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
