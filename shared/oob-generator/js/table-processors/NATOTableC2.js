/**
 * NATOTableC2 - Baltic Approaches NATO CAS Raid Processor
 * 
 * Table C2: NATO CAS Raid (Baltic Approaches)
 * 
 * Structure:
 * - Multi-flight CAS raid system
 * - SEAD flights: 3 x {2} with ordnance rolls
 * - Bombing flights: 3 x {4} with ordnance rolls  
 * - Date-based variations (15-20 May, 21-31 May, 1-15 June)
 * - Each flight generates separate ordnance based on aircraft type
 * 
 * Flight Generation:
 * - 3 SEAD flights of 2 aircraft each
 * - 3 Bombing flights of 4 aircraft each
 * - Each flight gets individual ordnance roll and display line
 */

class NATOTableC2 extends BaseTableProcessor {
  constructor(tableData) {
    super('C2', tableData);
    
    // Define flight counts and sizes for each tasking type
    this.flightConfig = {
      'SEAD': { count: 3, size: 2 },
      'Bombing': { count: 3, size: 4 }
    };
  }

  /**
   * Process NATO Table C2 - CAS Raid
   * 
   * @param {object} params - Processing parameters
   * @param {number|string} params.scenarioDate - Ordinal date (1, 2, 3) or date range string (not used by C2)
   * @returns {object} Result object with CAS raid information
   */
  process(params) {
    const { scenarioDate } = params;
    
    if (!scenarioDate) {
      return { 
        text: 'Error: Scenario date is required for Table C2',
        error: 'Missing scenario date parameter'
      };
    }

    // Get date range data
    if (!this.tableData.taskings) {
      return {
        text: 'Error: No taskings found in table data',
        error: 'Missing taskings data'
      };
    }

    const results = [];
    const debugRolls = [];

    try {
      // Process available taskings from the table
      const availableTaskings = Object.keys(this.tableData.taskings);
      
      for (const taskingKey of availableTaskings) {
        const taskingResult = this.processTaskingFlights(scenarioDate, taskingKey);
        if (taskingResult.error) {
          console.warn(`${taskingKey}: ${taskingResult.error}`);
          continue;
        }
        
        // Add all individual flights from this tasking
        results.push(...taskingResult.flights);
        debugRolls.push(...taskingResult.debugRolls);
      }

      if (results.length === 0) {
        throw new Error('No valid taskings could be processed');
      }

    } catch (error) {
      return {
        text: `Error processing C2 raid: ${error.message}`,
        error: error.message
      };
    }

    // Combine results into multi-line format
    const resultText = results.map(r => r.text).join('<br>');

    return {
      text: resultText,
      result: resultText,
      table: 'C2',
      faction: 'NATO',
      raidType: 'CAS',
      flights: results,
      debugRolls: debugRolls
    };
  }

  /**
   * Process all flights for a specific tasking type
   * 
   * @param {string} scenarioDate - Date range: "15-20 May", "21-31 May", or "1-15 June"
   * @param {string} taskingKey - Key for the tasking (SEAD, Bombing)
   * @returns {object} Multiple flight results
   */
  processTaskingFlights(scenarioDate, taskingKey) {
    const taskingData = this.tableData.taskings[taskingKey];
    if (!taskingData || !taskingData.dateRanges) {
      return { 
        error: `No ${taskingKey} data found in table`
      };
    }

    const taskingDateRange = taskingData.dateRanges[scenarioDate];
    if (!taskingDateRange || !taskingDateRange.nations) {
      return { 
        error: `No ${taskingKey} data found for date "${scenarioDate}"`
      };
    }

    const config = this.flightConfig[taskingKey];
    if (!config) {
      return {
        error: `No flight configuration found for ${taskingKey}`
      };
    }

    // Roll once for nation and aircraft type for this tasking
    const nationResult = this.rollForNation(taskingDateRange.nations, `${taskingKey} Nation`);
    if (nationResult.error) {
      return { error: nationResult.error };
    }

    const aircraftResult = this.rollForAircraft(nationResult.nationData.aircraft, `${taskingKey} Aircraft`);
    if (aircraftResult.error) {
      return { error: aircraftResult.error };
    }

    // Generate individual flights with ordnance rolls
    const flights = [];
    const debugRolls = [nationResult.nationRollDebug, aircraftResult.aircraftRollDebug];
    const ordnanceDebug = [];

    for (let i = 1; i <= config.count; i++) {
      // Roll for ordnance for each flight
      const ordnanceRoll = this.rollDie(10);
      const ordnance = this.getOrdnanceAvailability(ordnanceRoll, aircraftResult.aircraftType, taskingKey);
      
      ordnanceDebug.push(`Flight ${i} Ordnance: ${ordnanceRoll}`);
      
      const flightText = `1 x {${config.size}} ${nationResult.nationName} ${aircraftResult.aircraftType}, ${taskingKey} (${ordnance})`;
      
      flights.push({
        text: flightText,
        result: flightText,
        table: 'C2',
        faction: 'NATO',
        tasking: taskingKey,
        nationality: nationResult.nationName,
        aircraftType: aircraftResult.aircraftType,
        flightSize: config.size,
        quantity: 1,
        ordnance: ordnance
      });
    }

    debugRolls.push(...ordnanceDebug);

    return {
      flights: flights,
      debugRolls: debugRolls
    };
  }

  /**
   * Get ordnance availability based on die roll and aircraft type
   * 
   * @param {number} roll - Die roll result (1-10)
   * @param {string} aircraftType - Aircraft type
   * @param {string} tasking - Tasking type (SEAD, Bombing)
   * @returns {string} Ordnance description
   */
  getOrdnanceAvailability(roll, aircraftType, tasking) {
    // Apply aircraft-specific modifiers (based on Red Storm C logic)
    let modifiedRoll = roll;
    
    if (aircraftType.includes('F-16') || aircraftType.includes('A-10')) {
      modifiedRoll += 2;
    } else if (aircraftType.includes('Tornado') || aircraftType.includes('F/A-18')) {
      modifiedRoll += 1;
    }
    
    // Cap at 10
    modifiedRoll = Math.min(modifiedRoll, 10);
    
    // Determine base ordnance based on modified roll
    let ordnance;
    if (modifiedRoll <= 4) {
      ordnance = "Bombs/CBU/Rockets";
    } else if (modifiedRoll <= 7) {
      ordnance = "Bombs/CBU/Rockets + EOGM";
    } else {
      ordnance = "Bombs/CBU/Rockets + EOGM + LGB/EOGB";
    }
    
    // SEAD flights always get ARM
    if (tasking === 'SEAD') {
      ordnance += " + ARM";
    }
    
    return ordnance;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NATOTableC2;
}