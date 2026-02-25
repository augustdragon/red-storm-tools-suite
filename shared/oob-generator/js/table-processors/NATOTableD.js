/**
 * NATOTableD - NATO Deep Strike Raid Processor
 * 
 * Table D: NATO Deep Strike Raid (Long-Range Offensive Mission)
 * 
 * Structure:
 * - Five-tasking system: Escort Jamming, CAP, SEAD, Bombing, Recon
 * - Each tasking has fixed configuration (no date variants)
 * - Two-roll system per tasking: Nation → Aircraft
 * - No ordnance rolls (grouped flights)
 * - Special handling for split aircraft types in SEAD (F-4G/F-4E, F-4G/F-16C)
 * 
 * Flight Configuration:
 * - Escort Jamming: 2 flights x 1 aircraft each
 * - CAP: 4 flights x 2 aircraft each
 * - SEAD: 4 flights x 2 aircraft each
 * - Bombing: 4 flights x 4 aircraft each
 * - Recon: 2 flights x 2 aircraft each
 */

class NATOTableD extends BaseTableProcessor {
  constructor(tableData) {
    super('D', tableData);
    
    // Tasking configuration
    this.taskings = ['Escort Jamming', 'CAP', 'SEAD', 'Bombing', 'Recon'];
    this.flightSizes = { 'Escort Jamming': 1, 'CAP': 2, 'SEAD': 2, 'Bombing': 4, 'Recon': 2 };
    this.flightCounts = { 'Escort Jamming': 2, 'CAP': 4, 'SEAD': 4, 'Bombing': 4, 'Recon': 2 };
  }

  /**
   * Process a single tasking
   * 
   * @param {string} tasking - The tasking type
   * @returns {object} Tasking result
   */
  processTasking(tasking) {
    const taskingVariant = this.tableData.taskings[tasking];
    
    if (!taskingVariant) {
      console.error(`Table D: No tasking data for "${tasking}"`);
      console.error('Available taskings:', Object.keys(this.tableData.taskings || {}));
      return {
        tasking,
        text: `Error: No tasking data for ${tasking}`,
        debugText: ''
      };
    }
    
    if (!taskingVariant.nations) {
      console.error(`Table D: Tasking "${tasking}" has no nations property`);
      console.error('Tasking data:', taskingVariant);
      return {
        tasking,
        text: `Error: No nation data for ${tasking}`,
        debugText: ''
      };
    }
    
    // Roll for nation
    const nationResult = this.rollForNation(taskingVariant.nations, `${tasking} Nation`);
    
    if (nationResult.error) {
      return {
        tasking,
        nationRoll: nationResult.nationRoll,
        aircraftRoll: null,
        nationName: null,
        text: `Error: ${nationResult.error}`,
        debugText: this.buildDebugText({ nationRollDebug: nationResult.nationRollDebug })
      };
    }
    
    // Roll for aircraft
    const aircraftResult = this.rollForAircraft(nationResult.nationData.aircraft, `${tasking} Aircraft`);
    
    if (aircraftResult.error) {
      return {
        tasking,
        nationRoll: nationResult.nationRoll,
        aircraftRoll: aircraftResult.aircraftRoll,
        nationName: nationResult.nationName,
        text: `Error: ${aircraftResult.error}`,
        debugText: this.buildDebugText({
          nationRollDebug: nationResult.nationRollDebug,
          aircraftRollDebug: aircraftResult.aircraftRollDebug
        })
      };
    }
    
    const flightSize = this.flightSizes[tasking];
    const flightCount = this.flightCounts[tasking];
    let resultText = '';
    
    // Handle special split aircraft types for SEAD — return an array of
    // separate entries so each aircraft type can be resolved individually
    // during print generation.
    if (tasking === 'SEAD' && nationResult.nationName === 'US' &&
        (aircraftResult.aircraftType === 'F-4G/F-4E' || aircraftResult.aircraftType === 'F-4G/F-16C')) {
      const [aircraft1, aircraft2] = aircraftResult.aircraftType.split('/');
      const baseDebug = `[${tasking}: ${this.stripBrackets(nationResult.nationRollDebug)} | ${this.stripBrackets(aircraftResult.aircraftRollDebug)}]`;
      return [aircraft1, aircraft2].map(aircraft => ({
        tasking,
        nationRoll: nationResult.nationRoll,
        aircraftRoll: aircraftResult.aircraftRoll,
        nationName: nationResult.nationName,
        nationality: nationResult.nationName,
        aircraftType: aircraft,
        aircraftId: null,
        flightSize: flightSize,
        flightCount: flightCount / 2,
        text: `${flightCount / 2} x {${flightSize}} ${nationResult.nationName} ${aircraft}, ${tasking}`,
        debugText: baseDebug
      }));
    }

    // Standard result
    resultText = `${flightCount} x {${flightSize}} ${nationResult.nationName} ${aircraftResult.aircraftType}, ${tasking}`;

    return {
      tasking,
      nationRoll: nationResult.nationRoll,
      aircraftRoll: aircraftResult.aircraftRoll,
      nationName: nationResult.nationName,
      nationality: nationResult.nationName,
      aircraftType: aircraftResult.aircraftType,
      aircraftId: aircraftResult.aircraftId,
      flightSize: flightSize,
      flightCount: flightCount,
      text: resultText,
      debugText: `[${tasking}: ${this.stripBrackets(nationResult.nationRollDebug)} | ${this.stripBrackets(aircraftResult.aircraftRollDebug)}]`
    };
  }

  /**
   * Process Table D roll (all five taskings)
   * 
   * @param {object} params - (No parameters needed for Table D)
   * @returns {object} Combined result from all taskings
   */
  process(params) {
    const results = [];

    for (const tasking of this.taskings) {
      const taskingResult = this.processTasking(tasking);
      // Split SEAD returns an array of entries; flatten into results
      if (Array.isArray(taskingResult)) {
        results.push(...taskingResult);
      } else {
        results.push(taskingResult);
      }
    }
    
    // Combine all results
    const combinedText = results.map(r => r.text).join('<br>');
    const combinedDebug = results.map(r => r.debugText).filter(Boolean).join(' ');
    
    return {
      taskings: results,
      text: combinedText,
      debugText: combinedDebug
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NATOTableD;
}

console.log('NATOTableD processor loaded');
