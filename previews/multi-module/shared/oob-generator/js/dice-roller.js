/**
 * OOB Generator - Dice Rolling and Probability Module
 * 
 * Purpose:
 * - Handle all random number generation (dice rolls)
 * - Provide probability calculations
 * - Support debug mode for roll transparency
 * - Ensure fair and consistent random results
 * 
 * Future Responsibilities:
 * - Generate random rolls with specified ranges
 * - Track rolls for debug mode
 * - Calculate probabilities for table outcomes
 * - Support different dice types (d10, d6, etc.)
 * 
 * Functions to Extract:
 * - makeDebugRoll(): Generate roll with debug tracking
 * - rollDie(): Basic die roll function
 * - parseRange(): Parse range strings like "1-5" or "7"
/**
 * OOB Generator - Dice Rolling and Probability
 * 
 * Purpose:
 * - Handle all random number generation and dice rolling
 * - Debug mode roll tracking
 * - Probability calculations and range checking
 * 
 * Dependencies: None (self-contained)
 */

// Global debug mode state
let debugMode = false;

/**
 * Toggle debug mode on/off
 */
function toggleDebugMode() {
  debugMode = !debugMode;
  const button = document.getElementById('debugModeButton');
  const status = document.getElementById('debugStatus');
  
  if (debugMode) {
    button.textContent = 'Debug Mode: ON';
    button.style.backgroundColor = '#d32f2f';
    status.textContent = 'All die rolls will be shown';
    status.style.color = '#d32f2f';
  } else {
    button.textContent = 'Debug Mode: OFF';
    button.style.backgroundColor = '#666';
    status.textContent = 'Debug mode shows all die rolls for testing';
    status.style.color = '#888';
  }
  
  // Refresh the results display to show/hide debug information
  if (typeof updateResultsDisplay === 'function') {
    updateResultsDisplay();
  }
}

/**
 * Make a debug-tracked roll
 * @param {number} sides - Number of sides on the die
 * @param {string} description - Description of what this roll is for
 * @returns {object} Object with roll result and debug entry
 */
function makeDebugRoll(sides, description) {
  const roll = Math.floor(Math.random() * sides) + 1;
  const debugEntry = debugMode ? `${description}: ${roll}` : null;
  return { roll, debugEntry };
}

/**
 * Check if a roll falls within a range string (e.g., "1-4" or "7")
 * @param {number} roll - The roll result
 * @param {string} range - Range string like "1-4" or "7"
 * @returns {boolean} True if roll is in range
 */
function isInRange(roll, range) {
  if (range.includes('-')) {
    const [min, max] = range.split('-').map(num => parseInt(num));
    return roll >= min && roll <= max;
  } else {
    return roll === parseInt(range);
  }
}

/**
 * Get the current debug mode state
 * @returns {boolean} Current debug mode state
 */
function getDebugMode() {
  return debugMode;
}

// Make functions globally available for onclick handlers
window.toggleDebugMode = toggleDebugMode;
window.makeDebugRoll = makeDebugRoll;
window.getDebugMode = getDebugMode;

console.log('OOB Generator: dice-roller.js module loaded (Phase 4 - Component Extraction)');
