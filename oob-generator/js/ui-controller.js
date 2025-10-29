/**
 * OOB Generator - UI Controller Module
 * 
 * Purpose:
 * - Handle all DOM manipulation
 * - Update UI based on state changes
 * - Manage user interactions and events
 * - Control visibility and styling of UI elements
 * 
 * Future Responsibilities:
 * - Render results and table selections
 * - Update button states and availability
 * - Show/hide sections based on selections
 * - Display debug information
 * - Handle modal and overlay visibility
 * 
 * Functions to Extract:
 * - selectTable(): Handle table selection
 * - setScenarioDate(): Handle date selection
 * - updateResultsDisplay(): Render results list
 * - updateDateButtonStates(): Update date button availability
 * - showTableView()/hideTableView(): Control table view modal
 * - viewTableStructure(): Display table structure
 * 
 * UI Sections:
 * - Scenario date toggle
 * - Table selection buttons
 * - Variable input section (ATAF, nationality, mission type)
 * - Roll input section
 * - Results display
/**
 * OOB Generator - UI Controller
 * 
 * Purpose:
 * - Handle DOM manipulation and UI updates
 * - Manage modal displays and overlays
 * - Update results display and interface state
 * 
 * Dependencies: state-manager.js, dice-roller.js, utils.js
 */

/**
 * Update the results display with current results
 */
function updateResultsDisplay() {
  const container = document.getElementById('resultsList');
  const resultsSection = document.getElementById('resultsSection');
  
  // Get current state from state manager
  const state = getAppState();
  const results = state.results;
  const debugMode = getDebugMode();
  
  if (results.length === 0) {
    resultsSection.style.display = 'none';
    return;
  }
  
  resultsSection.style.display = 'block';
  
  const resultsHTML = results.map(result => {
    let rollText = '';
    let variableText = '';
    
    // Only show roll text for NATO tables, not Warsaw Pact
    if (result.faction === 'NATO') {
      if (result.nationRoll && result.aircraftRoll && result.table !== 'A' && result.table !== 'B' && result.table !== 'F') {
        rollText = `(aircraft: ${result.aircraftRoll})`;
      } else if (result.roll) {
        rollText = `(rolled ${result.roll})`;
      }
    }
    
    if (result.atafZone || result.scenarioDate) {
      const parts = [];
      if (result.atafZone) parts.push(result.atafZone);
      // Only show date for date-dependent tables (A, B, C)
      if (result.scenarioDate && (result.table === 'A' || result.table === 'B' || result.table === 'C')) {
        parts.push(result.scenarioDate === 'pre' ? 'Pre-6/1/87' : '6/1/87+');
      }
      if (parts.length > 0) {
        variableText = ` [${parts.join(', ')}]`;
      }
    }
    
    // Determine faction styling
    const factionClass = result.faction === 'NATO' ? 'nato-result' : 'wp-result';
    
    // Build debug display
    let debugDisplay = '';
    if (debugMode && result.debugText && result.debugText.trim()) {
      debugDisplay = `<div style="font-size: 11px; color: #888; font-family: monospace; margin-top: 4px; padding: 2px 4px; background-color: rgba(255,255,255,0.05); border-radius: 2px;">${result.debugText}</div>`;
    }
    
    return `
      <div class="result-item ${factionClass}">
        <div class="result-info">
          <div class="result-table">${result.tableName}${variableText}</div>
          <div class="result-text">
            ${result.result}
            <span class="result-roll">${rollText}</span>
          </div>
          ${debugDisplay}
        </div>
        <button class="action-button remove-result" onclick="removeResult(${result.id})">
          Remove
        </button>
      </div>
    `;
  }).join('');
  
  container.innerHTML = resultsHTML;
}

/**
 * Handle mission type change for Table F and L
 */
function handleMissionTypeChange() {
  const missionType = document.getElementById('missionType').value;
  const tacticalReconNationSelection = document.getElementById('tacticalReconNationSelection');
  
  // Get current state
  const state = getAppState();
  const selectedTable = state.selectedTable;
  
  // Show nation selection only for WP Table L Tactical Recon
  if (selectedTable === 'L' && missionType === 'Tactical Recon') {
    tacticalReconNationSelection.style.display = 'flex';
  } else {
    tacticalReconNationSelection.style.display = 'none';
  }
}

/**
 * Hide the table view modal
 */
function hideTableView() {
  document.getElementById('tableViewOverlay').style.display = 'none';
}

/**
 * Close modal when clicking outside the modal content
 * @param {Event} event - Click event
 */
function closeModalOnOverlayClick(event) {
  if (event.target === event.currentTarget) {
    hideTableView();
  }
}

// Make functions globally available for onclick handlers
window.updateResultsDisplay = updateResultsDisplay;
window.handleMissionTypeChange = handleMissionTypeChange;
window.hideTableView = hideTableView;
window.closeModalOnOverlayClick = closeModalOnOverlayClick;

console.log('OOB Generator: ui-controller.js module loaded (Phase 4 - Component Extraction)');
