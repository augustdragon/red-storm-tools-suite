/**
 * Test Globals — Browser Environment Stubs
 * ==========================================
 *
 * The OOB processor files are written for the browser: they reference
 * `window`, `document`, and `console` as globals. When running in Node.js
 * under Jest, we need to provide stubs for these so the processor code
 * can load without errors.
 *
 * What we stub:
 *   - window: A plain object that serves as the global namespace.
 *     Processors attach their classes to window (e.g., window.TableProcessorFactory).
 *   - document: Minimal stub with getElementById() returning a dummy element.
 *     Only needed because some processor console.log calls happen at load time.
 *   - console.log: Already available in Node, but we silence the "loaded" messages
 *     that each processor file outputs to keep test output clean.
 *
 * Why not jsdom?
 *   jsdom is a full browser simulation (~4MB, slower startup). The processor
 *   code doesn't actually manipulate the DOM — it just needs window as a
 *   namespace and document for a few edge cases. These lightweight stubs are
 *   sufficient and much faster.
 *
 * This file runs before load-processors.js via Jest's setupFilesAfterFramework.
 */

// Create a window object if it doesn't exist (Node.js doesn't have one)
if (typeof window === 'undefined') {
    global.window = global;
}

// Minimal document stub — some processor files reference document at load time
if (typeof document === 'undefined') {
    global.document = {
        // getElementById stub returns a dummy element with basic properties.
        // This prevents errors when processor code tries to update UI elements
        // during initialization (those calls are no-ops in tests).
        getElementById: () => ({
            textContent: '',
            innerHTML: '',
            style: {},
            classList: {
                add: () => {},
                remove: () => {},
                toggle: () => {},
                contains: () => false,
            },
            addEventListener: () => {},
            appendChild: () => {},
            querySelectorAll: () => [],
        }),

        createElement: (tag) => ({
            tagName: tag,
            textContent: '',
            innerHTML: '',
            style: {},
            classList: {
                add: () => {},
                remove: () => {},
            },
            appendChild: () => {},
            setAttribute: () => {},
        }),

        querySelectorAll: () => [],
        querySelector: () => null,
    };
}

// Suppress processor "loaded" messages during tests.
// Save the original console.log so tests can restore it if needed.
const _originalConsoleLog = console.log;
global._originalConsoleLog = _originalConsoleLog;

// Filter out noisy messages from processor files during test runs.
// Processor code logs "loaded" messages and D3 processor logs detailed grouping info.
const _originalLog = console.log.bind(console);
console.log = (...args) => {
    const msg = args[0];
    if (typeof msg === 'string' && (
        msg.includes('module loaded') ||
        msg.includes('processor loaded') ||
        msg.includes('class loaded') ||
        msg.includes('Factory loaded') ||
        msg.includes('OOB Generator:') ||
        msg.includes('[D3 ') ||
        msg.includes('Using hybrid') ||
        msg.includes('Using embedded') ||
        msg.includes('Checking embedded') ||
        msg.startsWith('Table ')
    )) {
        return; // Suppress these messages
    }
    _originalLog(...args);
};

// debugMode is a global that dice-roller.js references
global.debugMode = false;
