<?php
/**
 * Health Check Endpoint
 * =====================
 *
 * GET /api/health
 *
 * Returns a simple status response to verify the API is running and
 * can connect to the database. Useful for:
 *   - Docker health checks
 *   - The comparison test page (api-test.html)
 *   - Quick smoke tests after deployment
 *
 * Response format:
 *   { "status": "ok", "database": "connected", "aircraft_count": 117 }
 *
 * If the database connection fails, returns:
 *   { "status": "ok", "database": "error", "error": "..." }
 *
 * The endpoint always returns 200 — the "status" field indicates API health,
 * while "database" indicates database connectivity separately.
 */

require_once __DIR__ . '/../db.php';

$response = [
    'status' => 'ok',
    'timestamp' => date('c'),
];

try {
    $pdo = getDbConnection();

    // Quick query to verify both connectivity and that seed data loaded
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM aircraft');
    $row = $stmt->fetch();

    $response['database'] = 'connected';
    $response['aircraft_count'] = (int)$row['count'];
} catch (Exception $e) {
    $response['database'] = 'error';
    $response['error'] = $e->getMessage();
}

echo json_encode($response, JSON_PRETTY_PRINT);
