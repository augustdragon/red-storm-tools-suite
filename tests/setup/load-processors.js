/**
 * Load Processors — Execute Browser JS in Node.js
 * =================================================
 *
 * The table processor files are written as browser scripts. We need to
 * make all their classes available as globals for Jest tests.
 *
 * Hybrid loading strategy:
 *
 *   1. For utility files (utils.js, dice-roller.js) that attach to `window`:
 *      Use indirect eval since they do `window.parseRange = parseRange`,
 *      and we've set `global.window = global`. After eval, the functions
 *      are on global.
 *
 *   2. For processor files WITH module.exports (24 files):
 *      Use Node's `require()` directly. The class is exported normally
 *      and we assign it to global.
 *
 *   3. For ALL processor files (including BA NATO A2, B2, E2, F2):
 *      All processor files now have module.exports, so they are loaded
 *      with require() and assigned to global.
 *
 * This ensures all classes share the same `Math.random()` as Jest
 * (critical for jest.spyOn mocking in e2e tests).
 *
 * Usage:
 *   In e2e test files:
 *     require('../setup/load-processors');
 */

const path = require('path');

// Base directories
const SHARED_JS = path.join(__dirname, '..', '..', 'shared', 'oob-generator', 'js');
const PROCESSORS_DIR = path.join(SHARED_JS, 'table-processors');

/**
 * Load all processor scripts and expose their classes as globals.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
function loadAllProcessors() {
    if (global.__processorsLoaded) return;

    // ---- Set up browser globals ----
    // Processors reference window, document, and debugMode at load time.
    if (typeof global.window === 'undefined') {
        global.window = global;
    }
    if (typeof global.document === 'undefined') {
        const dummyEl = () => ({
            textContent: '', innerHTML: '', style: {},
            classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
            addEventListener: () => {}, appendChild: () => {}, querySelectorAll: () => [],
            setAttribute: () => {},
        });
        global.document = {
            getElementById: dummyEl,
            createElement: dummyEl,
            querySelectorAll: () => [],
            querySelector: () => null,
        };
    }
    if (typeof global.debugMode === 'undefined') {
        global.debugMode = false;
    }

    // ---- 1. Load utility files (these use window.X = X pattern) ----
    // utils.js does: window.parseRange = parseRange
    // dice-roller.js does: window.makeDebugRoll = makeDebugRoll
    // Since window === global, these become true globals after require.
    require(path.join(SHARED_JS, 'utils.js'));
    require(path.join(SHARED_JS, 'dice-roller.js'));
    global.ResultSchema = require(path.join(SHARED_JS, 'result-schema.js'));

    // ---- 2. Load processor files WITH module.exports ----
    // Each file exports its class via: if (typeof module !== 'undefined') module.exports = ClassName
    // We require it and assign the result to global.

    // Base class (needed before subclasses)
    global.BaseTableProcessor = require(path.join(PROCESSORS_DIR, 'BaseTableProcessor.js'));

    // RS NATO (A-F)
    global.NATOTableA = require(path.join(PROCESSORS_DIR, 'NATOTableA.js'));
    global.NATOTableB = require(path.join(PROCESSORS_DIR, 'NATOTableB.js'));
    global.NATOTableC = require(path.join(PROCESSORS_DIR, 'NATOTableC.js'));
    global.NATOTableD = require(path.join(PROCESSORS_DIR, 'NATOTableD.js'));
    global.NATOTableE = require(path.join(PROCESSORS_DIR, 'NATOTableE.js'));
    global.NATOTableF = require(path.join(PROCESSORS_DIR, 'NATOTableF.js'));

    // BA NATO — C2, D2, D3 HAVE exports
    global.NATOTableC2 = require(path.join(PROCESSORS_DIR, 'NATOTableC2.js'));
    global.NATOTableD2 = require(path.join(PROCESSORS_DIR, 'NATOTableD2.js'));
    global.NATOTableD3 = require(path.join(PROCESSORS_DIR, 'NATOTableD3.js'));

    // RS WP (G-L)
    global.WPTableG = require(path.join(PROCESSORS_DIR, 'WPTableG.js'));
    global.WPTableH = require(path.join(PROCESSORS_DIR, 'WPTableH.js'));
    global.WPTableI = require(path.join(PROCESSORS_DIR, 'WPTableI.js'));
    global.WPTableJ = require(path.join(PROCESSORS_DIR, 'WPTableJ.js'));
    global.WPTableK = require(path.join(PROCESSORS_DIR, 'WPTableK.js'));
    global.WPTableL = require(path.join(PROCESSORS_DIR, 'WPTableL.js'));

    // BA WP (G2-L2)
    global.WPTableG2 = require(path.join(PROCESSORS_DIR, 'WPTableG2.js'));
    global.WPTableH2 = require(path.join(PROCESSORS_DIR, 'WPTableH2.js'));
    global.WPTableI2 = require(path.join(PROCESSORS_DIR, 'WPTableI2.js'));
    global.WPTableJ2 = require(path.join(PROCESSORS_DIR, 'WPTableJ2.js'));
    global.WPTableJ3 = require(path.join(PROCESSORS_DIR, 'WPTableJ3.js'));
    global.WPTableK2 = require(path.join(PROCESSORS_DIR, 'WPTableK2.js'));
    global.WPTableL2 = require(path.join(PROCESSORS_DIR, 'WPTableL2.js'));

    // ---- 3. Load BA NATO files (A2, B2, E2, F2) ----
    // These files now have module.exports, so require() works directly.
    global.NATOTableA2 = require(path.join(PROCESSORS_DIR, 'NATOTableA2.js'));
    global.NATOTableB2 = require(path.join(PROCESSORS_DIR, 'NATOTableB2.js'));
    global.NATOTableE2 = require(path.join(PROCESSORS_DIR, 'NATOTableE2.js'));
    global.NATOTableF2 = require(path.join(PROCESSORS_DIR, 'NATOTableF2.js'));

    // ---- 4. Factory (must load last — references all processor classes) ----
    const factoryExports = require(path.join(PROCESSORS_DIR, 'TableProcessorFactory.js'));
    global.TableProcessorFactory = factoryExports.TableProcessorFactory || factoryExports;
    global.getTableProcessorFactory = factoryExports.getTableProcessorFactory;

    global.__processorsLoaded = true;
}

// Auto-execute on require
loadAllProcessors();

module.exports = { loadAllProcessors };
