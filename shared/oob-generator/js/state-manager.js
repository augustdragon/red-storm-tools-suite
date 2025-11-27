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
 * @param {string} dateValue - Scenario date ID (e.g., 'pre', 'post', 'may-early', etc.)
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
    let dateText = dateValue;
    
    // For Baltic Approaches ordinal dates (1, 2, 3), use BA_DATE_RANGES mapping
    if (typeof dateValue === 'number' && window.BA_DATE_RANGES) {
      dateText = window.BA_DATE_RANGES[dateValue] || dateValue;
    }
    // For string dates, try module configuration
    else if (window.ModuleConfig) {
      const currentModule = window.ModuleConfig.getCurrentModule();
      const moduleConfig = window.ModuleConfig.getModuleConfig(currentModule);
      if (moduleConfig && moduleConfig.scenarioDates && moduleConfig.scenarioDates[dateValue]) {
        dateText = moduleConfig.scenarioDates[dateValue].label;
      }
    }
    
    scenarioStatus.textContent = `Scenario Date: ${dateText} - Select table to generate order of battle`;
    scenarioStatus.style.color = '#4caf50'; // Green to indicate ready
  }
  
}

/**
 * Update the visual state of date buttons
 */
function updateDateButtonStates() {
  const currentDate = getScenarioDate();
  const dateButtons = document.querySelectorAll('.scenario-date-button');
  
  dateButtons.forEach(button => {
    // Extract date value from onclick attribute
    const onclickAttr = button.getAttribute('onclick');
    let buttonDate = null;
    
    if (onclickAttr) {
      // Support both string and numeric date values
      const stringMatch = onclickAttr.match(/setScenarioDate\('([^']+)'\)/);
      const numericMatch = onclickAttr.match(/setScenarioDate\((\d+)\)/);
      
      if (stringMatch) {
        buttonDate = stringMatch[1];
      } else if (numericMatch) {
        buttonDate = parseInt(numericMatch[1]);
      }
    }
    
    // Disable buttons if results exist
    if (hasGeneratedResults) {
      button.disabled = true;
      button.style.opacity = '0.5';
      button.title = 'Clear results to change scenario date';
    } else {
      button.disabled = false;
      button.style.opacity = '1';
      button.title = '';
      
      // Update button appearance based on selection
      // Use loose equality to handle both string and numeric comparisons
      if (buttonDate == currentDate) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    }
  });
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
  
  // Reset number of rolls to 1 when switching tables (for both input types)
  const rollCountBasic = document.getElementById('rollCountBasic');
  const rollCountVariable = document.getElementById('rollCountVariable');
  if (rollCountBasic) {
    rollCountBasic.value = '1';
  }
  if (rollCountVariable) {
    rollCountVariable.value = '1';
  }
  
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
        
        // Populate nationality dropdown based on faction and module
        if (hasNationality) {
          const crewNationalitySelect = document.getElementById('crewNationality');
          if (crewNationalitySelect) {
            crewNationalitySelect.innerHTML = '';
            
            // Determine module from table ID (if it ends with '2', it's Baltic Approaches)
            const isBalticApproaches = tableId.endsWith('2');
            
            if (faction === 'NATO') {
              if (isBalticApproaches) {
                // Baltic Approaches Table E2 - NATO Combat Rescue
                crewNationalitySelect.innerHTML = `
                  <option value="FRG">FRG</option>
                  <option value="DK">DK</option>
                  <option value="SE">SE</option>
                `;
              } else {
                // Red Storm Table E - NATO Combat Rescue
                crewNationalitySelect.innerHTML = `
                  <option value="US">US</option>
                  <option value="UK">UK/BE/NE</option>
                  <option value="FRG">FRG</option>
                  <option value="CAN">CAN (uses US rescue)</option>
                `;
              }
            } else if (faction === 'WP') {
              if (isBalticApproaches) {
                // Different options for different WP tables
                if (tableId === 'J3') {
                  // Naval Strike Raid (J3) - all WP nations
                  crewNationalitySelect.innerHTML = `
                    <option value="USSR">USSR</option>
                    <option value="GDR">GDR</option>
                    <option value="POL">POL</option>
                  `;
                } else {
                  // K2 - Combat Rescue (GDR only)
                  crewNationalitySelect.innerHTML = `
                    <option value="GDR">GDR</option>
                    <option value="GDR Naval">GDR Naval</option>
                  `;
                }
              } else {
                // Red Storm Table K - WP Combat Rescue
                crewNationalitySelect.innerHTML = `
                  <option value="USSR">USSR</option>
                  <option value="GDR">GDR</option>
                `;
              }
            }
            
            // Trigger nationality change handler to show/hide hex type selection for E2
            if (typeof window.handleNationalityChange === 'function') {
              window.handleNationalityChange();
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
      
      // For E2 table, trigger nationality change handler to show hex type if FRG is selected
      if (tableId === 'E2' && typeof window.handleNationalityChange === 'function') {
        window.handleNationalityChange();
      }
      
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

/**
 * Set the current module for state management
 * @param {string} moduleName - Module name (e.g., 'red-storm', 'baltic-approaches')
 */
function setModule(moduleName) {
    console.log('OOB Generator: Setting module:', moduleName);
    window.CURRENT_MODULE = moduleName;
    
    // Reset state when switching modules
    scenarioDate = null;
    selectedTable = null;
    selectedFaction = null;
    hasGeneratedResults = false;
    
    console.log('OOB Generator: Module set and state reset for:', moduleName);
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
window.setModule = setModule;
window.clearAllResults = clearAllResults;

console.log('OOB Generator: state-manager.js module loaded (Phase 4 - Component Extraction)');
