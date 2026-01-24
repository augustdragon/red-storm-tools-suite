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
   * Roll a die with specified number of sides
   * @param {number} sides - Number of sides on the die
   * @returns {number} Random number between 1 and sides
   */
  rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
  }

  /**
   * Parse a range string into min/max values
   * @param {string} range - Range string (e.g., "1-4" or "5")
   * @returns {number[]} Array with [min, max] values
   */
  parseRange(range) {
    if (!range || typeof range !== 'string') return [0, 0];
    
    if (range.includes('-')) {
      const [min, max] = range.split('-').map(n => parseInt(n.trim()));
      return [min, max];
    } else {
      const num = parseInt(range.trim());
      return [num, num];
    }
  }

  /**
   * Check if a value falls within a range string
   * @param {number} value - Value to check
   * @param {string} range - Range string (e.g., "1-4" or "5")
   * @returns {boolean} True if value is in range
   */
  isInRange(value, range) {
    const [min, max] = this.parseRange(range);
    return value >= min && value <= max;
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
        this.lastNationResult = { nationName: nationData.name, nationData };
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
        const resolvedAircraft = this.normalizeAircraftEntry(aircraft);
        this.lastAircraftResult = {
          aircraftType: resolvedAircraft.name,
          aircraftId: resolvedAircraft.aircraftId
        };
        return {
          aircraftRoll,
          aircraftRollDebug: aircraftRollResult.debugEntry,
          aircraftType: resolvedAircraft.name,
          aircraftId: resolvedAircraft.aircraftId
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
    return this.handleSubRollWithId(aircraftType, null, rollLabel);
  }

  /**
   * Handle aircraft sub-rolls for superscript references while preserving ID context
   * 
   * @param {string} aircraftType - Aircraft type that may have superscript
   * @param {string|null} aircraftId - Aircraft ID (if already resolved)
   * @param {string} rollLabel - Label for debug output
   * @returns {object} { finalAircraftType, finalAircraftId, subRollDebug }
   */
  handleSubRollWithId(aircraftType, aircraftId = null, rollLabel = 'Sub-roll') {
    if (!aircraftType || (!aircraftType.includes('Aı') && !aircraftType.includes('A1'))) {
      return { finalAircraftType: aircraftType, finalAircraftId: aircraftId, subRollDebug: null };
    }
    
    const subRollResult = makeDebugRoll(10, rollLabel);
    let finalAircraftType = aircraftType;
    let finalAircraftId = aircraftId;
    
    // Handle common sub-roll patterns
    if (aircraftType.includes('F-4Aı')) {
      finalAircraftType = subRollResult.roll <= 5 ? 'F-4D' : 'F-4E';
      finalAircraftId = null;
    } else if (aircraftType.includes('MiG-23Aı')) {
      if (subRollResult.roll <= 4) finalAircraftType = 'MiG-23M';
      else if (subRollResult.roll <= 8) finalAircraftType = 'MiG-23MF';
      else finalAircraftType = 'MiG-23ML';
      finalAircraftId = null;
    } else if (aircraftType.includes('MiG-23MF/MLA1')) {
      finalAircraftType = subRollResult.roll <= 5 ? 'MiG-23MF' : 'MiG-23ML';
      finalAircraftId = null;
    }
    
    return {
      finalAircraftType,
      finalAircraftId,
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
      nationality: data.nationality || data.nationCode || data.nationName || this.lastNationResult?.nationName || null,
      aircraftType: data.aircraftType || this.lastAircraftResult?.aircraftType || null,
      aircraftId: data.aircraftId || this.lastAircraftResult?.aircraftId || null,
      flightSize: data.flightSize || this.tableData.flightSize || null,
      flightCount: data.flightCount || this.tableData.flightCount || data.quantity || null,
      tasking: data.tasking || null,
      sourceTable: data.sourceTable || this.tableId,
      text: data.text,
      debugText: data.debugText || ''
    };
  }

  /**
   * Normalize aircraft entry from table data
   * 
   * @param {object|string} aircraftEntry - Aircraft entry from table data
   * @returns {object} { name, aircraftId }
   */
  normalizeAircraftEntry(aircraftEntry) {
    if (!aircraftEntry || typeof aircraftEntry !== 'object' || Array.isArray(aircraftEntry)) {
      return { name: aircraftEntry, aircraftId: null };
    }

    const name = aircraftEntry.name || aircraftEntry.aircraft || aircraftEntry.display || aircraftEntry.model || '';
    return {
      name,
      aircraftId: aircraftEntry.aircraftId || null
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseTableProcessor;
}

console.log('BaseTableProcessor class loaded');
