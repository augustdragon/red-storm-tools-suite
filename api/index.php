<?php
/**
 * API Router — Front Controller
 * ==============================
 *
 * This is the single entry point for all API requests. Apache's .htaccess
 * rewrite rules send every /api/* request here.
 *
 * The router:
 *   1. Parses the request URI to extract the endpoint name
 *   2. Sets CORS headers (allows the app served on any port to call the API)
 *   3. Routes to the matching endpoint file in endpoints/
 *   4. Returns 404 JSON for unknown endpoints
 *
 * Endpoint mapping:
 *   GET /api/health    → endpoints/health.php
 *   GET /api/aircraft  → endpoints/aircraft.php
 *
 * Adding a new endpoint:
 *   1. Create endpoints/my-endpoint.php
 *   2. Add 'my-endpoint' to the $routes whitelist below
 *   3. Access it at GET /api/my-endpoint
 */

// ---- CORS Headers ----
// These headers allow the frontend (which may be served from a different
// port or origin during development) to make API requests.
// Access-Control-Allow-Origin: * means any origin can call this API.
// In production, you'd restrict this to your actual domain.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Handle CORS preflight requests.
// Browsers send an OPTIONS request before cross-origin GET/POST to check
// if the server allows the actual request. We respond with 200 and exit.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ---- Parse the endpoint from the URI ----
// REQUEST_URI might be "/api/aircraft?faction=NATO"
// We strip the "/api/" prefix and the query string to get "aircraft"
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Remove the /api/ prefix to get just the endpoint name
// Handle both /api/endpoint and /api/endpoint/ (with trailing slash)
$endpoint = trim(str_replace('/api/', '', $path), '/');

// ---- Route whitelist ----
// Only explicitly listed endpoints are routable. This prevents directory
// traversal attacks (e.g., /api/../../etc/passwd) from reaching the filesystem.
$routes = [
    'health'   => __DIR__ . '/endpoints/health.php',
    'aircraft' => __DIR__ . '/endpoints/aircraft.php',
];

// ---- Dispatch ----
if (isset($routes[$endpoint])) {
    require $routes[$endpoint];
} else {
    http_response_code(404);
    echo json_encode([
        'error' => 'Endpoint not found',
        'available' => array_keys($routes),
    ]);
}
