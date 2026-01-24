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
    
    // For D3 table, append nationality to table name if available
    let displayTableName = result.tableName;
    if (result.table === 'D3' && result.nationality) {
      displayTableName = `${result.tableName} - ${result.nationality} Raid`;
    }
    
    return `
      <div class="result-item ${factionClass}">
        <div class="result-info">
          <div class="result-table">${displayTableName}${variableText}</div>
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

/**
 * Make rolls with variables (ATAF zone, nationality, or mission type)
 */
function makeRollsWithVariables() {
  const currentTable = getSelectedTable();
  if (!currentTable) return;
  
  const rollCountElement = document.getElementById('rollCountVariable');
  if (!rollCountElement) {
    console.error('rollCountVariable element not found');
    return;
  }
  
  const rollCount = parseInt(rollCountElement.value);
  if (rollCount < 1 || rollCount > 20) {
    alert('Please enter a number between 1 and 20');
    return;
  }

  const dataSource = getTableDataSource();
  const table = dataSource[currentTable];
  
  if (!table) {
    console.error(`Table ${currentTable} not found in data source`);
    alert(`Table ${currentTable} data not available`);
    return;
  }
  
  // Get variable selections with null checks
  let atafZone = null;
  let crewNationality = null;
  let selectedMissionType = null;
  let tacticalReconNation = null;
  
  if (table.hasATAF) {
    const atafElement = document.getElementById('atafZone');
    atafZone = atafElement ? atafElement.value : null;
  } else if (table.hasNationality) {
    const nationalityElement = document.getElementById('crewNationality');
    crewNationality = nationalityElement ? nationalityElement.value : null;
    
    // For Baltic Approaches E2 with FRG nationality, include hex type
    if (currentTable === 'E2' && crewNationality === 'FRG') {
      const hexTypeElement = document.getElementById('hexType');
      const hexType = hexTypeElement ? hexTypeElement.value : 'land';
      atafZone = `${crewNationality}:${hexType}`;
    } else {
      // Use nationality as atafZone parameter for simplicity
      atafZone = crewNationality;
    }
  } else if (table.hasMissionType) {
    const missionElement = document.getElementById('missionType');
    selectedMissionType = missionElement ? missionElement.value : null;
    
    // For Table L Tactical Recon, get the selected nation
    if (currentTable === 'L' && selectedMissionType === 'Tactical Recon') {
      const tacticalElement = document.getElementById('tacticalReconNation');
      tacticalReconNation = tacticalElement ? tacticalElement.value : null;
      // Pass mission type and nation as a combined parameter
      atafZone = `${selectedMissionType}|${tacticalReconNation}`;
    } else {
      // Use mission type as atafZone parameter for simplicity
      atafZone = selectedMissionType;
    }
  }
  
  // Use global scenario date instead of dropdown
  const currentScenarioDate = getScenarioDate();
  
  for (let i = 0; i < rollCount; i++) {
    const result = getTableResultWithVariables(currentTable, atafZone, currentScenarioDate);
    
    const resultEntry = {
      id: Date.now() + i, // Use timestamp + index for unique ID
      table: currentTable,
      faction: getSelectedFaction(),
      tableName: table.name,
      atafZone: atafZone,
      scenarioDate: scenarioDate,
      nationRoll: result.nationRoll,
      aircraftRoll: result.aircraftRoll,
      nationName: result.nationName,
      result: result.text,
      aircraftType: result.aircraftType,
      aircraftId: result.aircraftId,
      flightSize: result.flightSize,
      flightCount: result.flightCount,
      tasking: result.tasking,
      ordnance: result.ordnance,
      nationCode: result.nationCode,
      sourceTable: result.sourceTable,
      debugText: result.debugText || result.debugInfo?.join(' | ') || '', // Handle both debugText and legacy debugInfo
      timestamp: new Date().getTime() + i, // Ensure unique timestamps
      // Preserve structured data from table processors (WPTableI2, D3, J3, etc.)
      taskings: result.taskings,
      flights: result.flights,
      nationality: result.nationality
    };
    
    console.log('[UI CONTROLLER] Storing result entry:', resultEntry);
    console.log('[UI CONTROLLER] Result has flights array:', !!result.flights, 'Count:', result.flights?.length);
    if (result.flights) {
      result.flights.forEach((f, idx) => {
        console.log(`[UI CONTROLLER] Flight ${idx}: nationality=${f.nationality}, aircraft=${f.aircraftType}`);
      });
    }
    
    addResult(resultEntry);
  }
  
  updateResultsDisplay();
  updateDateButtonStates(); // Update button states
}

/**
 * Make rolls with basic parameters (no variables)
 */
function makeRolls() {
  const currentTable = getSelectedTable();
  if (!currentTable) return;
  
  const rollCount = parseInt(document.getElementById('rollCountBasic').value);
  if (rollCount < 1 || rollCount > 20) {
    alert('Please enter a number between 1 and 20');
    return;
  }

  // Check if Table C or D and scenario date is required
  const currentScenarioDate = getScenarioDate();
  if ((currentTable === 'C' || currentTable === 'D') && currentTable !== 'D' && !currentScenarioDate) {
    alert('Please select a scenario date first.');
    return;
  }

  const dataSource = getTableDataSource();
  const table = dataSource[currentTable];
  
  for (let i = 0; i < rollCount; i++) {
    let result;
    console.log(`Making roll ${i+1} for table ${currentTable}`);
    
    // All tables now use getTableResultWithVariables through processor architecture
    if (currentTable === 'C') {
      result = getTableResultWithVariables(currentTable, null, currentScenarioDate);
    } else if (currentTable === 'D' || currentTable === 'G' || currentTable === 'H' || currentTable === 'I' || currentTable === 'J') {
      console.log(`Routing ${currentTable} to getTableResultWithVariables`);
      result = getTableResultWithVariables(currentTable, null, null);
    } else {
      result = getTableResultWithVariables(currentTable, null, null);
    }
    
    console.log(`Result for ${currentTable}:`, result);
    
    const resultEntry = {
      id: Date.now() + Math.random(), // Use timestamp + random for unique ID
      table: currentTable,
      faction: getSelectedFaction(),
      tableName: table.name,
      nationRoll: result.nationRoll,
      aircraftRoll: result.aircraftRoll,
      result: result.text,
      aircraftType: result.aircraftType,
      aircraftId: result.aircraftId,
      flightSize: result.flightSize,
      flightCount: result.flightCount,
      tasking: result.tasking,
      ordnance: result.ordnance,
      nationCode: result.nationCode,
      sourceTable: result.sourceTable,
      debugText: result.debugText || result.debugInfo?.join(' | ') || '', // Handle both debugText and legacy debugInfo
      scenarioDate: currentTable === 'C' ? currentScenarioDate : undefined,
      timestamp: new Date().getTime() + i, // Ensure unique timestamps
      // Preserve structured data from table processors (WPTableI2, D3, J3, etc.)
      taskings: result.taskings,
      flights: result.flights,
      nationality: result.nationality
    };
    
    console.log(`Result entry for display:`, resultEntry);
    
    addResult(resultEntry);
  }
  
  updateResultsDisplay();
  updateDateButtonStates(); // Update button states
  // Keep parameter box visible - don't call cancelSelection()
}

// Make functions globally available for onclick handlers
window.updateResultsDisplay = updateResultsDisplay;
window.handleMissionTypeChange = handleMissionTypeChange;
window.hideTableView = hideTableView;
window.closeModalOnOverlayClick = closeModalOnOverlayClick;
window.makeRolls = makeRolls;
window.makeRollsWithVariables = makeRollsWithVariables;

console.log('OOB Generator: ui-controller.js module loaded (Phase 4 - Component Extraction)');
