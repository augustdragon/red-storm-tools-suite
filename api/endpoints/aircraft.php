<?php
/**
 * Aircraft Data Endpoint
 * ======================
 *
 * GET /api/aircraft?faction=NATO
 * GET /api/aircraft?faction=WP
 *
 * Returns aircraft data in the EXACT same JSON structure as the static
 * aircraft-nato.json and aircraft-wp.json files. This is the core of the
 * POC — proving that data can round-trip through MySQL without loss.
 *
 * The response is a JSON object keyed by aircraft name (the json_key column):
 *   {
 *     "F-15C": {
 *       "name": "F-15C Eagle",
 *       "id": "US-F-15C-1",
 *       "model": "F-15C Eagle",
 *       "nation": "US",
 *       "crew": 1,
 *       ...
 *     },
 *     "F-16A": { ... }
 *   }
 *
 * The reconstruction logic in transformRow() maps flat database columns
 * back into the nested structure the frontend expects (e.g., rebuilding
 * the weapons:{} object from gun, gun_depletion, irm, etc. columns).
 *
 * Query parameters:
 *   faction (required) — "NATO" or "WP"
 *
 * Error responses:
 *   400 — Missing or invalid faction parameter
 *   500 — Database query failed
 */

require_once __DIR__ . '/../db.php';

// ---- Validate input ----
$faction = $_GET['faction'] ?? null;

if (!$faction || !in_array($faction, ['NATO', 'WP'])) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Missing or invalid faction parameter. Use ?faction=NATO or ?faction=WP'
    ]);
    exit;
}

/**
 * Transform a flat database row back into the nested JSON structure
 * that matches the original aircraft JSON files.
 *
 * This is the critical function for the POC. If the output of this function
 * differs from the source JSON, the comparison test page will flag it.
 *
 * Mapping overview:
 *   DB columns → JSON structure
 *   gun, gun_depletion, irm, ... → weapons: { gun, gunDepletion, irm, ... }
 *   speeds (JSON column) → speeds: { clean: {...}, laden: {...} }
 *   ordnance (JSON column) → ordnance: [...]
 *   capabilities (JSON column) → capabilities: [...]
 *   aliases (JSON column) → aliases: [...]
 *
 * @param array $row — Associative array from PDO fetch
 * @return array — Nested structure matching the original JSON
 */
function transformRow(array $row): array {
    // Start with the basic scalar fields
    $aircraft = [
        'name'  => $row['name'],
        'id'    => $row['id'],
        'model' => $row['model'],
    ];

    // Aliases — only include if present in the source data
    $aliases = json_decode($row['aliases'], true);
    if ($aliases !== null) {
        $aircraft['aliases'] = $aliases;
    }

    // Nation options — multi-nation variants (optional field)
    $nationOptions = json_decode($row['nation_options'], true);
    if ($nationOptions !== null) {
        $aircraft['nationOptions'] = $nationOptions;
    }

    $aircraft['nation'] = $row['nation'];

    // Numeric fields: convert string "2" back to integer 2, keep null as null
    $aircraft['crew'] = $row['crew'] !== null ? (int)$row['crew'] : null;
    $aircraft['rwy']  = $row['rwy'] !== null ? (int)$row['rwy'] : null;

    // Fuel: usually numeric but can be "U" (unlimited), so keep as original type
    $fuel = $row['fuel'];
    if ($fuel !== null && is_numeric($fuel)) {
        $aircraft['fuel'] = (int)$fuel;
    } else {
        $aircraft['fuel'] = $fuel;
    }

    $aircraft['notes'] = $row['notes'];

    // Standoff jamming strength (BA module only, optional)
    if ($row['standoff_jamming_strength'] !== null) {
        $aircraft['standoffJammingStrength'] = $row['standoff_jamming_strength'];
    }

    // Reconstruct the nested weapons object from flat columns.
    // The original JSON has: weapons: { gun, gunDepletion, irm, irmDepletion, rhm, rhmDepletion }
    $aircraft['weapons'] = [
        'gun'          => $row['gun'],
        'gunDepletion' => $row['gun_depletion'] !== null ? (int)$row['gun_depletion'] : null,
        'irm'          => $row['irm'],
        'irmDepletion' => $row['irm_depletion'] !== null ? (int)$row['irm_depletion'] : null,
        'rhm'          => $row['rhm'],
        'rhmDepletion' => $row['rhm_depletion'] !== null ? (int)$row['rhm_depletion'] : null,
    ];

    $aircraft['bomb']  = $row['bomb'];
    $aircraft['sight'] = $row['sight'];
    $aircraft['rwr']   = $row['rwr'];
    $aircraft['jam']   = $row['jam'];
    $aircraft['radar'] = $row['radar'];

    // Speeds: stored as JSON column, decode back to nested object
    $speeds = json_decode($row['speeds'], true);
    $aircraft['speeds'] = $speeds;

    // Ordnance: array of loadout objects
    $ordnance = json_decode($row['ordnance'], true);
    $aircraft['ordnance'] = $ordnance !== null ? $ordnance : [];

    // Capabilities: array of strings
    $capabilities = json_decode($row['capabilities'], true);
    $aircraft['capabilities'] = $capabilities !== null ? $capabilities : [];

    $aircraft['aam']    = $row['aam'];
    $aircraft['module'] = $row['module'];

    // hideFromReference: only include if true (matches source JSON behavior)
    if ((int)$row['hide_from_reference'] === 1) {
        $aircraft['hideFromReference'] = true;
    }

    return $aircraft;
}

// ---- Query and respond ----
try {
    $pdo = getDbConnection();

    // Fetch all aircraft for the requested faction, ordered by json_key
    // for consistent output ordering
    $stmt = $pdo->prepare('SELECT * FROM aircraft WHERE faction = ? ORDER BY json_key');
    $stmt->execute([$faction]);
    $rows = $stmt->fetchAll();

    // Build the response object keyed by json_key (matching original JSON structure)
    $result = new \stdClass();
    foreach ($rows as $row) {
        $key = $row['json_key'];
        $result->$key = transformRow($row);
    }

    // JSON_UNESCAPED_SLASHES prevents escaping "/" characters, matching
    // the output format of the original JSON files.
    // JSON_UNESCAPED_UNICODE preserves UTF-8 characters as-is.
    echo json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database query failed',
        'message' => $e->getMessage(),
    ]);
}
