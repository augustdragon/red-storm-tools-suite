/**
 * WPTableJ - Warsaw Pact Deep Strike Raid Processor
 * 
 * Table J: Warsaw Pact Deep Strike Raid (Long-Range Offensive Mission)
 * 
 * Structure:
 * - USSR-only table (no nation roll needed)
 * - Five-tasking system: Close Escort, CAP, SEAD, Bombing, Recon
 * - Single aircraft roll per tasking
 * - All taskings generated automatically in one raid
 * - No ordnance rolls (grouped flights)
 * 
 * Flight Configuration:
 * - Close Escort: 4 x 4-ship flights
 * - CAP: 4 x 2-ship flights
 * - SEAD: 2 x 4-ship flights
 * - Bombing: 4 x 4-ship flights
 * - Recon: 2 x 2-ship flights
 */

class WPTableJ extends BaseTableProcessor {
  constructor(tableData) {
    super('J', tableData);
  }

  /**
   * Process a single tasking
   * 
   * @param {string} taskingName - The tasking type
   * @param {object} taskingData - Tasking configuration
   * @returns {object} Tasking result
   */
  processTasking(taskingName, taskingData) {
    // Table J is USSR-only, so skip nation roll and use USSR directly
    const nationData = taskingData.nations['1-10'];
    
    if (!nationData) {
      return {
        tasking: taskingName,
        text: `Error: No nation data for ${taskingName}`,
        debugText: ''
      };
    }
    
    // Roll for aircraft
    const aircraftResult = this.rollForAircraft(nationData.aircraft, `${taskingName} Aircraft`);
    
    if (aircraftResult.error) {
      return {
        tasking: taskingName,
        text: `Error: ${aircraftResult.error}`,
        debugText: this.buildDebugText({ 
          aircraftRollDebug: aircraftResult.aircraftRollDebug 
        })
      };
    }
    
    // Handle sub-rolls for aircraft variants
    let finalAircraftType = aircraftResult.aircraftType;
    let subRollDebug = null;
    
    if (aircraftResult.aircraftType.includes('²')) {
      const subRollResult = makeDebugRoll(10, `${taskingName} Sub-roll`);
      
      if (aircraftResult.aircraftType.includes('MiG-23²')) {
        if (subRollResult.roll <= 4) finalAircraftType = 'MiG-23M';
        else if (subRollResult.roll <= 8) finalAircraftType = 'MiG-23MF';
        else finalAircraftType = 'MiG-23ML';
      }
      
      subRollDebug = subRollResult.debugEntry;
    }
    
    // Format result (no ordnance for Table J)
    let $nationality = 'USSR';
    const resultText = `${taskingData.flightCount} x {${taskingData.flightSize}} ${$nationality} ${finalAircraftType}, ${taskingName}`;
    
    // Build debug text (no nation roll since it's always USSR)
    let debugText = this.stripBrackets(aircraftResult.aircraftRollDebug);
    if (subRollDebug) {
      debugText += ` | ${this.stripBrackets(subRollDebug)}`;
    }
    
    return {
      tasking: taskingName,
      nation: 'USSR',
      text: resultText,
      debugText: debugText
    };
  }

  /**
   * Process Table J roll (all taskings)
   * 
   * @param {object} params - (No parameters needed for Table J)
   * @returns {object} Combined result from all taskings
   */
  process(params) {
    const taskingResults = [];
    const debugParts = [];
    
    // Process all taskings
    const allTaskings = Object.keys(this.tableData.taskings);
    
    for (const taskingName of allTaskings) {
      const taskingData = this.tableData.taskings[taskingName];
      const taskingResult = this.processTasking(taskingName, taskingData);
      
      // Format: "{count} x {size} {aircraft}, {tasking}" (no nation prefix since it's always USSR)
      taskingResults.push(taskingResult.text);
      debugParts.push(`${taskingName}: ${taskingResult.debugText}`);
    }
    
    // Combine all results with line breaks (like Table D)
    const combinedText = taskingResults.join('<br>');
    const combinedDebug = debugParts.length > 0 ? `[${debugParts.join(' | ')}]` : '';
    
    return {
      nationRoll: null,
      aircraftRoll: null,
      text: combinedText,
      debugText: combinedDebug
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WPTableJ;
}

console.log('WPTableJ processor loaded');
