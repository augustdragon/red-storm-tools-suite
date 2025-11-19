/**
 * BaseTableProcessor - Abstract base class for all table processors
 * 
 * Purpose:
 * - Define standard interface that all table processors must implement
 * - Provide common utility methods for table processing
 * - Ensure consistent structure across all processors
 * 
 * Each table processor handles:
 * - Rolling for nation (if applicable)
 * - Rolling for aircraft type
 * - Handling sub-rolls and special cases
 * - Generating ordnance assignments
 * - Formatting result output
 */

class BaseTableProcessor {
  /**
   * @param {string} tableId - The table identifier (A-L)
   * @param {object} tableData - The table data from JSON
   */
  constructor(tableId, tableData) {
    this.tableId = tableId;
    this.tableData = tableData;
  }

  /**
   * Main processing method - must be implemented by subclasses
   * 
   * @param {object} params - Processing parameters
   * @param {string} params.atafZone - ATAF zone or mission type (if applicable)
   * @param {string} params.scenarioDate - 'pre' or 'post' (if applicable)
   * @param {string} params.nationality - Specific nationality for some tables
   * @returns {object} Result object with text, rolls, and debug info
   */
  process(params) {
    throw new Error('process() must be implemented by subclass');
  }

  /**
   * Roll for nation based on table structure
   * 
   * @param {object} nationsData - Nations data from table
   * @param {string} rollLabel - Label for debug output
   * @returns {object} { nationRoll, nationName, nationData }
   */
  rollForNation(nationsData, rollLabel = 'Nation') {
    const nationRollResult = makeDebugRoll(10, rollLabel);
    const nationRoll = nationRollResult.roll;
    
    // Find matching nation based on roll ranges
    for (const [range, nationData] of Object.entries(nationsData)) {
      const [min, max] = parseRange(range);
      if (nationRoll >= min && nationRoll <= max) {
        return {
          nationRoll,
          nationRollDebug: nationRollResult.debugEntry,
          nationName: nationData.name,
          nationData
        };
      }
    }
    
    return {
      nationRoll,
      nationRollDebug: nationRollResult.debugEntry,
      nationName: null,
      nationData: null,
      error: `No nation found for roll ${nationRoll}`
    };
  }

  /**
   * Roll for aircraft type based on nation data
   * 
   * @param {object} aircraftData - Aircraft data from nation
   * @param {string} rollLabel - Label for debug output
   * @returns {object} { aircraftRoll, aircraftType }
   */
  rollForAircraft(aircraftData, rollLabel = 'Aircraft') {
    // Validate aircraftData exists
    if (!aircraftData || typeof aircraftData !== 'object') {
      return {
        error: `Invalid aircraft data: ${aircraftData === null ? 'null' : typeof aircraftData}`
      };
    }
    
    const aircraftRollResult = makeDebugRoll(10, rollLabel);
    const aircraftRoll = aircraftRollResult.roll;
    
    // Find matching aircraft based on roll ranges
    for (const [range, aircraft] of Object.entries(aircraftData)) {
      const [min, max] = parseRange(range);
      if (aircraftRoll >= min && aircraftRoll <= max) {
        return {
          aircraftRoll,
          aircraftRollDebug: aircraftRollResult.debugEntry,
          aircraftType: aircraft
        };
      }
    }
    
    return {
      aircraftRoll,
      aircraftRollDebug: aircraftRollResult.debugEntry,
      aircraftType: null,
      error: `No aircraft found for roll ${aircraftRoll}`
    };
  }

  /**
   * Handle aircraft sub-rolls for superscript references
   * 
   * @param {string} aircraftType - Aircraft type that may have superscript
   * @param {string} rollLabel - Label for debug output
   * @returns {object} { finalAircraftType, subRollDebug }
   */
  handleSubRoll(aircraftType, rollLabel = 'Sub-roll') {
    if (!aircraftType || (!aircraftType.includes('²') && !aircraftType.includes('¹'))) {
      return { finalAircraftType: aircraftType, subRollDebug: null };
    }
    
    const subRollResult = makeDebugRoll(10, rollLabel);
    let finalAircraftType = aircraftType;
    
    // Handle common sub-roll patterns
    if (aircraftType.includes('F-4²')) {
      finalAircraftType = subRollResult.roll <= 5 ? 'F-4D' : 'F-4E';
    } else if (aircraftType.includes('MiG-23²')) {
      if (subRollResult.roll <= 4) finalAircraftType = 'MiG-23M';
      else if (subRollResult.roll <= 8) finalAircraftType = 'MiG-23MF';
      else finalAircraftType = 'MiG-23ML';
    } else if (aircraftType.includes('MiG-23MF/ML¹')) {
      finalAircraftType = subRollResult.roll <= 5 ? 'MiG-23MF' : 'MiG-23ML';
    }
    
    return {
      finalAircraftType,
      subRollDebug: subRollResult.debugEntry
    };
  }

  /**
   * Build debug text from processing steps
   * 
   * @param {object} steps - Object containing debug entries from each step
   * @returns {string} Formatted debug text
   */
  buildDebugText(steps) {
    if (!getDebugMode()) return '';
    
    const entries = [];
    
    if (steps.nationRollDebug) entries.push(steps.nationRollDebug);
    if (steps.aircraftRollDebug) entries.push(steps.aircraftRollDebug);
    if (steps.subRollDebug) entries.push(steps.subRollDebug);
    if (steps.additionalDebug) entries.push(...steps.additionalDebug);
    
    return entries.filter(Boolean).join(' | ');
  }

  /**
   * Safely strip brackets from debug string
   * Handles null/undefined values gracefully
   * 
   * @param {string} debugStr - Debug string that may contain brackets
   * @returns {string} String with brackets removed, or empty string if null
   */
  stripBrackets(debugStr) {
    return debugStr ? debugStr.replace(/[\[\]]/g, '') : '';
  }

  /**
   * Format basic result output
   * 
   * @param {object} data - Result data
   * @returns {object} Formatted result with text, rolls, and debug
   */
  formatResult(data) {
    return {
      nationRoll: data.nationRoll || null,
      aircraftRoll: data.aircraftRoll || null,
      nationName: data.nationName || null,
      text: data.text,
      debugText: data.debugText || ''
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseTableProcessor;
}

console.log('BaseTableProcessor class loaded');
