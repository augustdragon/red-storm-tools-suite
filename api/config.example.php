<?php
/**
 * API Configuration Template
 * ==========================
 *
 * Copy this file to config.php and fill in your database credentials.
 * config.php is gitignored to prevent accidental credential exposure.
 *
 * For the Docker dev environment, use the values from docker-compose.yml:
 *   DB_HOST = 'mysql'    (Docker service name, resolved by Docker networking)
 *   DB_NAME = 'redstorm_tools'
 *   DB_USER = 'redstorm_user'
 *   DB_PASS = 'redstorm_pass'
 *
 * For Hostinger production (future), these would be your Hostinger MySQL creds.
 */

return [
    'db_host' => 'mysql',
    'db_name' => 'redstorm_tools',
    'db_user' => 'redstorm_user',
    'db_pass' => 'redstorm_pass',
];
