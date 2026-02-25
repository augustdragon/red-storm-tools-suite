<?php
/**
 * Database Connection — PDO Singleton
 * ====================================
 *
 * Provides a single shared PDO database connection for the API.
 * Uses the singleton pattern so multiple endpoint calls in the same
 * request reuse the same connection (no redundant connects).
 *
 * PDO (PHP Data Objects) is PHP's database abstraction layer. It supports
 * prepared statements, which prevent SQL injection by separating the query
 * structure from user-supplied values.
 *
 * Key PDO options used:
 *   ERRMODE_EXCEPTION — Throw exceptions on SQL errors instead of silent fails
 *   FETCH_ASSOC       — Return rows as associative arrays (column_name => value)
 *   EMULATE_PREPARES  — Disabled for true prepared statements (better security)
 *
 * Usage:
 *   require_once __DIR__ . '/db.php';
 *   $pdo = getDbConnection();
 *   $stmt = $pdo->prepare('SELECT * FROM aircraft WHERE faction = ?');
 *   $stmt->execute(['NATO']);
 *   $rows = $stmt->fetchAll();
 */

/**
 * Get or create the shared PDO database connection.
 *
 * @return PDO The database connection
 * @throws PDOException If the connection fails
 */
function getDbConnection() {
    // Static variable persists across calls within the same request.
    // This is the singleton — first call creates it, subsequent calls reuse it.
    static $pdo = null;

    if ($pdo === null) {
        // Load credentials from config.php
        $config = require __DIR__ . '/config.php';

        // Build the DSN (Data Source Name) — the connection string PDO needs.
        // Format: mysql:host=<hostname>;dbname=<database>;charset=utf8mb4
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=utf8mb4',
            $config['db_host'],
            $config['db_name']
        );

        // Create the PDO connection with our preferred options
        $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
            // Throw exceptions on errors — much easier to debug than silent failures
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,

            // Return rows as associative arrays: ['column_name' => 'value']
            // (instead of both numeric and named keys)
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

            // Use real prepared statements (not emulated) for better security.
            // With emulation off, the query and parameters are sent separately
            // to MySQL, making SQL injection impossible at the protocol level.
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }

    return $pdo;
}
