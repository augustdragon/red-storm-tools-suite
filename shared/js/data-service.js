/**
 * DataService — Abstraction Layer for Data Loading
 * ==================================================
 *
 * Provides a unified interface for loading data regardless of whether it
 * comes from static JSON files or the MySQL API. This is the key POC
 * component that allows the app to transparently switch between data sources.
 *
 * Three modes:
 *   'json' — Always load from static JSON files (current behavior)
 *   'api'  — Always load from the PHP API (requires Docker/server)
 *   'auto' — Try API first, fall back to JSON if API is unavailable
 *
 * The 'auto' mode is the default for development: when Docker is running,
 * it uses the API; when serving files directly (e.g., file:// or a simple
 * HTTP server without Docker), it falls back to JSON seamlessly.
 *
 * Usage:
 *   <script src="../shared/js/data-service.js"></script>
 *   <script>
 *     DataService.getAircraftNATO().then(data => {
 *       // data is the same structure regardless of source
 *       console.log(data);
 *     });
 *   </script>
 *
 * Cache behavior:
 *   Once loaded, data is cached in memory for the page session.
 *   Call DataService.clearCache() to force a reload.
 *
 * Adding new data types (future expansion):
 *   1. Add a new PHP endpoint (e.g., endpoints/weapons.php)
 *   2. Add a method here: getWeapons: () => load('weapons', 'weapons', 'data/weapons.json')
 *   3. Update the consumer page to use DataService.getWeapons()
 */

const DataService = (() => {
    // ---- Configuration ----

    /**
     * Data source mode:
     *   'json' — Static JSON files only (safest, always works)
     *   'api'  — PHP API only (requires Docker or server with MySQL)
     *   'auto' — Try API first, fall back to JSON on failure
     */
    const DATA_SOURCE = 'json';

    /**
     * Base URL for API requests. When served from the Docker PHP container,
     * this is relative to the document root. Adjust if deploying to a
     * different path structure (e.g., '/redstormtools/api' on Hostinger).
     */
    const API_BASE = '/api';

    /**
     * In-memory cache for loaded data.
     * Key: string identifier (e.g., 'ac-nato')
     * Value: parsed JSON data
     */
    const cache = {};

    /**
     * Load data from the appropriate source, with caching.
     *
     * This is the core function. It implements the source selection logic:
     *   1. Check cache first (instant return if previously loaded)
     *   2. If mode is 'api' or 'auto', try the API endpoint
     *   3. If API fails and mode is 'auto', fall back to JSON file
     *   4. If mode is 'json', go straight to the JSON file
     *
     * @param {string} key — Cache key (e.g., 'ac-nato')
     * @param {string|null} apiEndpoint — API path after API_BASE (e.g., 'aircraft?faction=NATO')
     *                                     Pass null if no API endpoint exists yet
     * @param {string} jsonPath — Relative path to the static JSON file
     * @returns {Promise<object>} Parsed data (same structure from either source)
     */
    async function load(key, apiEndpoint, jsonPath) {
        // Return cached data if available
        if (cache[key]) {
            return cache[key];
        }

        // Try API if the mode supports it and an endpoint is defined
        if (apiEndpoint && (DATA_SOURCE === 'api' || DATA_SOURCE === 'auto')) {
            try {
                const response = await fetch(`${API_BASE}/${apiEndpoint}`);
                if (response.ok) {
                    cache[key] = await response.json();
                    console.log(`[DataService] Loaded '${key}' from API`);
                    return cache[key];
                }
                // Non-OK response — if mode is 'api', this is a hard failure
                if (DATA_SOURCE === 'api') {
                    throw new Error(`API returned ${response.status} for ${apiEndpoint}`);
                }
                // In 'auto' mode, log and fall through to JSON
                console.warn(`[DataService] API returned ${response.status} for '${key}', falling back to JSON`);
            } catch (err) {
                // Network error, API not running, etc.
                if (DATA_SOURCE === 'api') {
                    throw err; // In strict API mode, don't fall back
                }
                console.warn(`[DataService] API unavailable for '${key}': ${err.message}. Falling back to JSON`);
            }
        }

        // Load from static JSON file
        const response = await fetch(jsonPath);
        if (!response.ok) {
            throw new Error(`Failed to load JSON file: ${jsonPath} (${response.status})`);
        }
        cache[key] = await response.json();
        console.log(`[DataService] Loaded '${key}' from JSON file`);
        return cache[key];
    }

    // ---- Public API ----
    // Each method maps a logical data type to its API endpoint and JSON file path.
    // Methods without an API endpoint (null) always load from JSON — these will
    // be connected to API endpoints when/if the full migration happens.

    return {
        /**
         * Load NATO aircraft data.
         * API endpoint: GET /api/aircraft?faction=NATO
         * JSON fallback: data/aircraft-nato.json
         */
        getAircraftNATO: () => load('ac-nato', 'aircraft?faction=NATO', 'data/aircraft-nato.json'),

        /**
         * Load Warsaw Pact aircraft data.
         * API endpoint: GET /api/aircraft?faction=WP
         * JSON fallback: data/aircraft-wp.json
         */
        getAircraftWP: () => load('ac-wp', 'aircraft?faction=WP', 'data/aircraft-wp.json'),

        // ---- JSON-only methods (no API endpoint yet) ----
        // These methods bypass the API entirely and always load from JSON.
        // When the full migration expands beyond the POC, each would get
        // an API endpoint and the null would be replaced with the path.

        /** Load weapons/missile data */
        getWeapons: () => load('weapons', null, 'data/weapons.json'),

        /** Load aircraft note rules */
        getNoteRules: () => load('notes', null, 'data/aircraft-note-rules.json'),

        /** Load aircraft name mappings (aliases, OOB table names) */
        getNameMapping: () => load('names', null, 'data/aircraft-name-mapping.json'),

        /** Load surface search radar data */
        getRadars: () => load('radars', null, 'data/surface-search-radars.json'),

        /**
         * Clear the in-memory cache, forcing the next load() call to
         * re-fetch from the source. Useful for testing and debugging.
         */
        clearCache: () => {
            Object.keys(cache).forEach(k => delete cache[k]);
            console.log('[DataService] Cache cleared');
        },

        /**
         * Get the current data source mode.
         * @returns {string} 'json', 'api', or 'auto'
         */
        getMode: () => DATA_SOURCE,
    };
})();
