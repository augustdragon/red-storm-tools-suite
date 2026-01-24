/**
 * NATOTableD2 - Baltic Approaches NATO Deep Strike Raid Processor
 * 
 * Table D2: NATO Deep Strike Raid (Baltic Approaches)
 * 
 * Structure:
 * - Five-tasking system: Escort Jamming, CAP, SEAD, Bombing, Recon
 * - Each tasking has fixed configuration (no date variants)
 * - Two-roll system per tasking: Nation → Aircraft
 * - No ordnance rolls (fixed ordnance restrictions in note)
 * - All aircraft use lower bomb load values (similar to Red Storm Table D)
 * 
 * Flight Configuration:
 * - Escort Jamming: 1 flight x 1 aircraft (always EF-111A)
 * - CAP: 4 flights x 2 aircraft each
 * - SEAD: 3 flights x 2 aircraft each
 * - Bombing: 4 flights x 4 aircraft each
 * - Recon: 2 flights x 2 aircraft each
 * 
 * Note: Indented values in source show nation/aircraft selection based on die rolls.
 *
 * Ordnance Note: All aircraft use lower bomb point load, if applicable.
 * Bombing and SEAD flights may only carry Bombs, ARM, EOGM, EOGB, LGB, or ASM ordnance.
 * Recon flights may only carry air-to-air missiles and guns.
 */

class NATOTableD2 extends BaseTableProcessor {
  constructor(tableData) {
    super('D2', tableData);
    
    // Flight configurations from source document
    this.flightConfigs = {
      'Escort Jamming': { count: 1, size: 1 },
      'CAP': { count: 4, size: 2 },
      'SEAD': { count: 3, size: 2 },
      'Bombing': { count: 4, size: 4 },
      'Recon': { count: 2, size: 2 }
    };
  }

  /**
   * Process NATO Table D2 - Deep Strike Raid
   * 
   * @param {object} params - Processing parameters (none required for D2)
   * @returns {object} Result object with deep strike raid information
   */
  process(params) {
    const taskings = ['Escort Jamming', 'CAP', 'SEAD', 'Bombing', 'Recon'];
    const allFlights = [];
    const debugRolls = [];
    const resultLines = [];

    try {
      for (const tasking of taskings) {
        const taskingResults = this.processTasking(tasking);
        if (taskingResults.error) {
          throw new Error(`${tasking}: ${taskingResults.error}`);
        }
        // taskingResults is now an array of individual flight entries
        allFlights.push(...taskingResults);
        
        // Collect debug rolls and result text
        for (const flight of taskingResults) {
          debugRolls.push(...flight.debugRolls);
          resultLines.push(flight.text);
        }
      }
    } catch (error) {
      return {
        text: `Error processing D2 raid: ${error.message}`,
        error: error.message
      };
    }

    // Format results like Table D
    const resultText = resultLines.join('<br>');

    return {
      text: resultText,
      result: resultText,
      table: 'D2',
      tableName: this.tableData.name,
      faction: 'NATO',
      raidType: 'Deep Strike',
      taskings: allFlights,
      debugRolls: debugRolls,
      ordnanceNote: this.tableData.ordnanceNote || null
    };
  }

  /**
   * Process a single tasking - returns array of individual flight entries
   * 
   * @param {string} tasking - The tasking type
   * @returns {Array} Array of individual flight result objects
   */
  processTasking(tasking) {
    const taskingData = this.tableData.taskings[tasking];
    
    if (!taskingData) {
      return {
        tasking,
        text: `Error: No tasking data for ${tasking}`,
        error: `No tasking data for ${tasking}`,
        debugRolls: []
      };
    }

    // Roll for nation
    const nationResult = this.rollForNation(taskingData.nations, `${tasking} Nation`);
    if (nationResult.error) {
      return {
        tasking,
        text: `Error: ${nationResult.error}`,
        error: nationResult.error,
        debugRolls: []
      };
    }

    // Roll for aircraft ONCE per tasking (all flights get same aircraft)
    const aircraftResult = this.rollForAircraft(nationResult.nationData.aircraft, `${tasking} Aircraft`);
    if (aircraftResult.error) {
      return {
        tasking,
        text: `Error: ${aircraftResult.error}`,
        error: aircraftResult.error,
        debugRolls: []
      };
    }

    // Determine flight configuration
    const flightConfig = this.getFlightConfiguration(tasking, taskingData);
    
    const sharedDebugRolls = [
      nationResult.nationRollDebug,
      aircraftResult.aircraftRollDebug
    ];

    // Create individual flight entries
    const flights = [];
    
    // For SEAD and Bombing, roll ordnance per flight
    if (tasking === 'SEAD' || tasking === 'Bombing') {
      const ordnanceRolls = this.tableData.ordnanceRolls?.[tasking];
      if (ordnanceRolls) {
        for (let i = 1; i <= flightConfig.count; i++) {
          const ordnanceResult = this.rollForOrdnance(ordnanceRolls, `${tasking} Flight ${i} Ordnance`);
          if (ordnanceResult.error) {
            return {
              tasking,
              text: `Error: ${ordnanceResult.error}`,
              error: ordnanceResult.error,
              debugRolls: []
            };
          }
          
          const flightText = `1 x {${flightConfig.size}} ${nationResult.nationName} ${aircraftResult.aircraftType}, ${tasking} (${ordnanceResult.ordnanceType})`;
          flights.push({
            tasking,
            text: flightText,
            nationality: nationResult.nationName,
            aircraftType: aircraftResult.aircraftType,
            aircraftId: aircraftResult.aircraftId,
            flightSize: flightConfig.size,
            flightCount: 1,
            ordnance: ordnanceResult.ordnanceType,
            debugRolls: i === 1 ? [...sharedDebugRolls, ordnanceResult.ordnanceRollDebug] : [ordnanceResult.ordnanceRollDebug]
          });
        }
      } else {
        // No ordnance rolls defined, output without ordnance
        for (let i = 1; i <= flightConfig.count; i++) {
          const flightText = `1 x {${flightConfig.size}} ${nationResult.nationName} ${aircraftResult.aircraftType}, ${tasking}`;
          flights.push({
            tasking,
            text: flightText,
            nationality: nationResult.nationName,
            aircraftType: aircraftResult.aircraftType,
            aircraftId: aircraftResult.aircraftId,
            flightSize: flightConfig.size,
            flightCount: 1,
            debugRolls: i === 1 ? sharedDebugRolls : []
          });
        }
      }
    } else {
      // Non-ordnance taskings (CAP, Recon, Escort Jamming) - one entry per flight
      for (let i = 1; i <= flightConfig.count; i++) {
        const flightText = `1 x {${flightConfig.size}} ${nationResult.nationName} ${aircraftResult.aircraftType}, ${tasking}`;
        flights.push({
          tasking,
          text: flightText,
          nationality: nationResult.nationName,
          aircraftType: aircraftResult.aircraftType,
          aircraftId: aircraftResult.aircraftId,
          flightSize: flightConfig.size,
          flightCount: 1,
          debugRolls: i === 1 ? sharedDebugRolls : []
        });
      }
    }

    return flights;
  }

  /**
   * Get flight configuration for a tasking
   * 
   * @param {string} tasking - Tasking type
   * @param {object} taskingData - Tasking data from table
   * @returns {object} Flight configuration with count and size
   */
  getFlightConfiguration(tasking, taskingData) {
    // Use explicit flightCount from data if available
    if (taskingData.flightCount) {
      return {
        count: taskingData.flightCount,
        size: taskingData.flightSize || 2
      };
    }
    
    // Use predefined configs from source document
    const config = this.flightConfigs[tasking];
    
    if (!config) {
      return { count: 1, size: 2 }; // Default
    }
    
    return { count: config.count, size: config.size };
  }

  /**
   * Roll for ordnance type
   * 
   * @param {object} ordnanceRolls - Ordnance roll table
   * @param {string} rollName - Name for debug
   * @returns {object} Roll result
   */
  rollForOrdnance(ordnanceRolls, rollName) {
    const roll = this.rollDie(10);
    
    // Find matching ordnance
    for (const [range, ordnance] of Object.entries(ordnanceRolls)) {
      if (this.isInRange(roll, range)) {
        return {
          ordnanceType: ordnance,
          ordnanceRollDebug: {
            name: rollName,
            roll: roll,
            result: ordnance
          }
        };
      }
    }

    return {
      error: `No ordnance found for roll ${roll}`,
      ordnanceRollDebug: {
        name: rollName,
        roll: roll,
        result: 'ERROR'
      }
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NATOTableD2;
}

console.log('NATOTableD2 processor loaded');
