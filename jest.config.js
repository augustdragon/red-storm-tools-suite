/**
 * Jest Configuration for Red Storm Tools Suite
 * =============================================
 *
 * Configures Jest to test browser-targeted JavaScript that uses global
 * variables and script-tag loading (not ES modules or CommonJS).
 *
 * Key decisions:
 *   - testEnvironment: 'node' — We mock browser globals ourselves rather than
 *     using jsdom, since the processor code only needs window/document stubs
 *     (not a full DOM). This is faster and more predictable.
 *
 *   - setupFiles: Runs test-globals.js first to create the
 *     window/document stubs, then load-processors.js to execute all processor
 *     files in global scope (mimicking <script> tag loading in the browser).
 *
 *   - testTimeout: 120000 (2 minutes) — Distribution tests run 100K iterations
 *     per table variant, which can take 30-60 seconds on slower machines.
 */

module.exports = {
    // Use Node environment (not jsdom) — we provide our own browser stubs
    testEnvironment: 'node',

    // Root directory for test discovery
    roots: ['<rootDir>/tests'],

    // Setup files run before each test suite.
    // Only test-globals.js is loaded globally (browser stubs for window/document).
    // load-processors.js is loaded on-demand by e2e tests that need processor classes.
    setupFiles: [
        '<rootDir>/tests/setup/test-globals.js',
    ],

    // Test file patterns — look for .test.js files in the tests directory
    testMatch: ['**/tests/**/*.test.js'],

    // Extended timeout for statistical tests (distribution tests run 100K+ iterations)
    testTimeout: 120000,

    // Verbose output shows individual test names
    verbose: true,

    // Coverage configuration (when running with --coverage)
    collectCoverageFrom: [
        'shared/oob-generator/js/**/*.js',
        '!shared/oob-generator/js/app.js',
        '!shared/oob-generator/js/ui-controller.js',
        '!shared/oob-generator/js/print-generator.js',
        '!shared/oob-generator/js/state-manager.js',
    ],
};
