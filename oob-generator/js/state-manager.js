/**
 * OOB Generator - State Management Module
 * 
 * Purpose:
 * - Manage application state (selectedTable, scenarioDate, results, etc.)
 * - Provide state getters and setters
 * - Handle state persistence if needed
 * - Notify subscribers of state changes
 * 
 * Future Responsibilities:
 * - Centralized state storage
 * - State validation and mutation
 * - State history/undo if needed
 * - State persistence (localStorage)
 * 
 * State Properties (from current implementation):
 * - selectedTable: Currently selected OOB table
 * - selectedFaction: NATO or WP
 * - scenarioDate: 'pre' or 'post' (for date-dependent tables)
 * - results: Array of generated flight results
 * - resultCounter: Counter for result IDs
 * - hasGeneratedResults: Flag for results existence
 * - debugMode: Debug mode toggle state
 * 
/**
 * OOB Generator - State Management
 * 
 * Purpose:
 * - Manage application state (selected table, scenario date, results)
 * - Handle state persistence and validation
 * - Coordinate state changes across components
 * 
 * Dependencies: dice-roller.js (for debug mode)
 */

// Application state
let selectedTable = null;
let selectedFaction = null;
let scenarioDate = null;
let hasGeneratedResults = false;
let results = [];
let currentResultId = 1;

/**
 * Set the scenario date and update UI accordingly
 * @param {string} dateValue - 'pre' or 'post'
 */
function setScenarioDate(dateValue) {
  // Don't allow changing date if results exist
  if (hasGeneratedResults) {
    alert('Cannot change scenario date while results exist. Clear results first.');
    return;
  }
  
  scenarioDate = dateValue;
  updateDateButtonStates();
  
  // Clear any existing parameter selections when date changes (with null checks)
  const atafZone = document.getElementById('atafZone');
  const missionType = document.getElementById('missionType');
  const nationality = document.getElementById('nationality');
  const tacticalReconNation = document.getElementById('tacticalReconNation');
  const tacticalReconNationSelection = document.getElementById('tacticalReconNationSelection');
  
  if (atafZone) atafZone.selectedIndex = 0;
  if (missionType) missionType.selectedIndex = 0;
  if (nationality) nationality.selectedIndex = 0;
  if (tacticalReconNation) tacticalReconNation.selectedIndex = 0;
  
  // Hide conditional selectors
  if (tacticalReconNationSelection) {
    tacticalReconNationSelection.style.display = 'none';
  }
  
  // Enable table selection after scenario date is set
  const tableSelection = document.getElementById('tableSelection');
  if (tableSelection) {
    tableSelection.style.opacity = '1';
    tableSelection.style.pointerEvents = 'auto';
  }
  
  // Update status message
  const scenarioStatus = document.getElementById('scenarioStatus');
  if (scenarioStatus) {
    const dateText = dateValue === 'pre' ? 'Pre-6/1/87' : '6/1/87 or later';
    scenarioStatus.textContent = `Scenario Date: ${dateText} - Select table to generate order of battle`;
    scenarioStatus.style.color = '#4caf50'; // Green to indicate ready
  }
  
  console.log(`Scenario date set to: ${dateValue}, table selection enabled`);
}

/**
 * Update the visual state of date buttons
 */
function updateDateButtonStates() {
  const preButton = document.getElementById('preDate');
  const postButton = document.getElementById('postDate');
  
  // Check if buttons exist before modifying them
  if (!preButton || !postButton) {
    console.warn('Date buttons not found in DOM');
    return;
  }
  
  // Disable buttons if results exist
  if (hasGeneratedResults) {
    preButton.disabled = true;
    postButton.disabled = true;
    preButton.style.opacity = '0.5';
    postButton.style.opacity = '0.5';
    preButton.title = 'Clear results to change scenario date';
    postButton.title = 'Clear results to change scenario date';
  } else {
    preButton.disabled = false;
    postButton.disabled = false;
    preButton.style.opacity = '1';
    postButton.style.opacity = '1';
    preButton.title = '';
    postButton.title = '';
  }
  
  // Update active state
  preButton.classList.toggle('active', scenarioDate === 'pre');
  postButton.classList.toggle('active', scenarioDate === 'post');
  
  // Update scenario status message
  const scenarioStatus = document.getElementById('scenarioStatus');
  if (scenarioStatus) {
    if (scenarioDate) {
      const dateText = scenarioDate === 'pre' ? 'Pre-6/1/87' : '6/1/87 or later';
      if (hasGeneratedResults) {
        scenarioStatus.textContent = `Scenario Date: ${dateText} (locked - clear results to change)`;
        scenarioStatus.style.color = '#ff9800'; // Orange for locked
      } else {
        scenarioStatus.textContent = `Scenario Date: ${dateText} - Select table to generate order of battle`;
        scenarioStatus.style.color = '#4caf50'; // Green for ready
      }
    } else {
      scenarioStatus.textContent = 'Select scenario date to enable table generation';
      scenarioStatus.style.color = '#b4c4b4'; // Gray for not ready
    }
  }
}

/**
 * Initialize parameter selections based on current state
 */
function initializeParameterSelections() {
  // Reset all dropdowns to default with null checks
  const atafZone = document.getElementById('atafZone');
  const missionType = document.getElementById('missionType');
  const nationality = document.getElementById('nationality');
  const tacticalReconNation = document.getElementById('tacticalReconNation');
  const tacticalReconNationSelection = document.getElementById('tacticalReconNationSelection');
  
  if (atafZone) atafZone.selectedIndex = 0;
  if (missionType) missionType.selectedIndex = 0;
  if (nationality) nationality.selectedIndex = 0;
  if (tacticalReconNation) tacticalReconNation.selectedIndex = 0;
  
  // Hide conditional elements
  if (tacticalReconNationSelection) {
    tacticalReconNationSelection.style.display = 'none';
  }
  
  // Clear any previous table selection styling
  document.querySelectorAll('.table-button').forEach(button => {
    button.classList.remove('selected');
  });
  
  selectedTable = null;
}

/**
 * Select a table and update the UI
 * @param {string} tableId - Table identifier (A-L)
 * @param {string} faction - NATO or WP
 */
function selectTable(tableId, faction) {
  selectedTable = tableId;
  selectedFaction = faction;
  
  // Update visual selection with null safety
  document.querySelectorAll('.table-button').forEach(button => {
    button.classList.remove('selected');
  });
  
  // Find the clicked table button
  const targetButton = document.querySelector(`.table-button[onclick*="selectTable('${tableId}'"]`);
  
  if (targetButton) {
    targetButton.classList.add('selected');
  } else {
    console.warn(`Could not find table button for ${tableId}`);
  }
  
  // Show/hide UI elements based on table requirements
  const dataSource = getTableDataSource();
  const table = dataSource[tableId];
  
  if (table) {
    console.log(`Selected table ${tableId}: ${table.name}`);
    
    // Handle different table types and their UI requirements
    const hasATAF = table.hasATAF;
    const hasTasking = table.hasTasking;
    const hasNationality = table.hasNationality;
    const hasMissionType = table.hasMissionType;
    
    // Hide all sections first
    const rollInputSection = document.getElementById('rollInputSection');
    const variableSelectionSection = document.getElementById('variableSelectionSection');
    const atafSelection = document.getElementById('atafSelection');
    const nationalitySelection = document.getElementById('nationalitySelection');
    const missionTypeSelection = document.getElementById('missionTypeSelection');
    const tacticalReconNationSelection = document.getElementById('tacticalReconNationSelection');
    
    if (rollInputSection) rollInputSection.classList.remove('active');
    if (variableSelectionSection) variableSelectionSection.classList.remove('active');
    
    // Determine which section to show based on table requirements
    if (hasATAF || hasNationality || hasMissionType) {
      // Tables with variables use variableSelectionSection
      if (variableSelectionSection) variableSelectionSection.classList.add('active');
      
      // Update the display name
      const variableTableDisplay = document.getElementById('variableTableDisplay');
      if (variableTableDisplay) {
        variableTableDisplay.textContent = `${faction} Table ${tableId} - ${table.name.split(' - ')[1] || table.name}`;
      }
      
      // Show/hide specific parameter selections
      if (atafSelection) atafSelection.style.display = hasATAF ? 'flex' : 'none';
      if (nationalitySelection) {
        nationalitySelection.style.display = hasNationality ? 'flex' : 'none';
        
        // Populate nationality dropdown based on faction
        if (hasNationality) {
          const crewNationalitySelect = document.getElementById('crewNationality');
          if (crewNationalitySelect) {
            crewNationalitySelect.innerHTML = '';
            
            if (faction === 'NATO') {
              // Table E - NATO Combat Rescue
              crewNationalitySelect.innerHTML = `
                <option value="US">US</option>
                <option value="UK">UK/BE/NE</option>
                <option value="FRG">FRG</option>
                <option value="CAN">CAN (uses US rescue)</option>
              `;
            } else if (faction === 'WP') {
              // Table K - WP Combat Rescue
              crewNationalitySelect.innerHTML = `
                <option value="USSR">USSR</option>
                <option value="GDR">GDR</option>
              `;
            }
          }
        }
      }
      if (missionTypeSelection) {
        missionTypeSelection.style.display = hasMissionType ? 'flex' : 'none';
        
        // Populate mission type dropdown based on table's available mission types
        if (hasMissionType && table.missionTypes) {
          const missionTypeSelect = document.getElementById('missionType');
          if (missionTypeSelect) {
            missionTypeSelect.innerHTML = '';
            
            // Add options for each available mission type
            Object.keys(table.missionTypes).forEach(missionKey => {
              const mission = table.missionTypes[missionKey];
              const option = document.createElement('option');
              option.value = missionKey;
              option.textContent = mission.name || missionKey;
              missionTypeSelect.appendChild(option);
            });
          }
        }
      }
      if (tacticalReconNationSelection) tacticalReconNationSelection.style.display = 'none'; // Initially hidden
      
    } else {
      // Simple tables use rollInputSection
      if (rollInputSection) rollInputSection.classList.add('active');
      
      // Update the display name
      const selectedTableDisplay = document.getElementById('selectedTableDisplay');
      if (selectedTableDisplay) {
        selectedTableDisplay.textContent = `${faction} Table ${tableId} - ${table.name.split(' - ')[1] || table.name}`;
      }
    }
    
    // Update status to show table selection
    const scenarioStatus = document.getElementById('scenarioStatus');
    if (scenarioStatus) {
      scenarioStatus.textContent = `Selected: ${table.name} - Configure parameters and generate`;
      scenarioStatus.style.color = '#4caf50';
    }
  } else {
    console.error(`Table ${tableId} not found in data source`);
    alert(`Error: Table ${tableId} data not available. Please try again.`);
  }
}

/**
 * Cancel table selection and reset UI
 */
function cancelSelection() {
  initializeParameterSelections();
  
  // Hide roll sections with null checks
  const rollInputSection = document.getElementById('rollInputSection');
  const variableSelectionSection = document.getElementById('variableSelectionSection');
  
  if (rollInputSection) rollInputSection.classList.remove('active');
  if (variableSelectionSection) variableSelectionSection.classList.remove('active');
}

/**
 * Cancel variable selection (for tables with parameters)
 */
function cancelVariableSelection() {
  initializeParameterSelections();
  
  // Hide roll sections with null checks
  const rollInputSection = document.getElementById('rollInputSection');
  const variableSelectionSection = document.getElementById('variableSelectionSection');
  
  if (rollInputSection) rollInputSection.classList.remove('active');
  if (variableSelectionSection) variableSelectionSection.classList.remove('active');
}

/**
 * Add a result to the results array
 * @param {object} result - Result object to add
 */
function addResult(result) {
  result.id = currentResultId++;
  results.push(result);
  hasGeneratedResults = true;
  updateDateButtonStates();
}

/**
 * Remove a result by ID
 * @param {number} resultId - ID of result to remove
 */
function removeResult(resultId) {
  results = results.filter(result => result.id !== resultId);
  
  // Check if all results are gone
  if (results.length === 0) {
    hasGeneratedResults = false;
    updateDateButtonStates(); // Unlock date selection
  }
  
  if (typeof updateResultsDisplay === 'function') {
    updateResultsDisplay();
  }
}

/**
 * Clear all results
 */
function clearAllResults() {
  if (results.length === 0) return;
  
  if (confirm('Are you sure you want to clear all results?')) {
    results = [];
    hasGeneratedResults = false;
    updateDateButtonStates();
    if (typeof updateResultsDisplay === 'function') {
      updateResultsDisplay();
    }
  }
}

/**
 * Get current application state
 * @returns {object} Current state object
 */
function getAppState() {
  return {
    selectedTable,
    scenarioDate,
    hasGeneratedResults,
    results: [...results], // Return copy to prevent mutation
    resultsCount: results.length
  };
}

/**
 * Get current selected table
 * @returns {string|null} Currently selected table ID
 */
function getSelectedTable() {
  return selectedTable;
}

/**
 * Get current scenario date
 * @returns {string|null} Current scenario date
 */
function getScenarioDate() {
  return scenarioDate;
}

/**
 * Get current selected faction
 * @returns {string|null} Current selected faction (NATO or WP)
 */
function getSelectedFaction() {
  return selectedFaction;
}

// Make functions globally available for onclick handlers
window.setScenarioDate = setScenarioDate;
window.selectTable = selectTable;
window.cancelSelection = cancelSelection;
window.cancelVariableSelection = cancelVariableSelection;
window.updateDateButtonStates = updateDateButtonStates;
window.getAppState = getAppState;
window.getSelectedTable = getSelectedTable;
window.getScenarioDate = getScenarioDate;
window.getSelectedFaction = getSelectedFaction;
window.addResult = addResult;

console.log('OOB Generator: state-manager.js module loaded (Phase 4 - Component Extraction)');
