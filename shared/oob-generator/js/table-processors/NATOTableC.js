/**
 * NATOTableC - NATO Bombing Raid Processor
 * 
 * Table C: NATO Bombing Raid (Offensive Mission)
 * 
 * Structure:
 * - Three-tasking system: CAP, SEAD, Bombing
 * - Each tasking has pre/post scenario date variants
 * - Two-roll system per tasking: Nation → Aircraft
 * - SEAD and Bombing get individual ordnance rolls per flight
 * - Special handling for split aircraft types (F-4G/F-4E, F-4G/F-16C)
 * 
 * Flight Configuration:
 * - CAP: 4 flights x 2 aircraft each (no ordnance)
 * - SEAD: 4 flights x 2 aircraft each (with ordnance + ARM)
 * - Bombing: 4 flights x 4 aircraft each (with ordnance)
 * 
 * Ordnance Table (modified by aircraft type):
 * - Rolls 1-4: Bombs/CBU/Rockets
 * - Rolls 5-7: Bombs/CBU/Rockets + EOGM
 * - Rolls 8-10: Bombs/CBU/Rockets + EOGM + LGB/EOGB
 * 
 * Modifiers:
 * - F-16, A-10: +2 to ordnance roll
 * - Tornado GR1, Tornado IDS, CF-18: +1 to ordnance roll
 * - SEAD flights: Always add "+ ARM"
 */

class NATOTableC extends BaseTableProcessor {
  constructor(tableData) {
    super('C', tableData);
    
    // Tasking configuration
    this.taskings = ['CAP', 'SEAD', 'Bombing'];
    this.flightSizes = { 'CAP': 2, 'SEAD': 2, 'Bombing': 4 };
    this.flightCounts = { 'CAP': 4, 'SEAD': 4, 'Bombing': 4 };
  }

  /**
   * Calculate ordnance availability based on roll and aircraft type
   * 
   * @param {number} roll - Base ordnance roll (1-10)
   * @param {string} aircraftType - Aircraft type for modifiers
   * @param {string} tasking - Mission tasking type
   * @returns {string} Ordnance description
   */
  getOrdnanceAvailability(roll, aircraftType, tasking) {
    // Apply aircraft-specific modifiers
    let modifiedRoll = roll;
    
    if (aircraftType.includes('F-16') || aircraftType.includes('A-10')) {
      modifiedRoll += 2;
    } else if (aircraftType.includes('Tornado GR1') || aircraftType.includes('Tornado IDS') || aircraftType.includes('CF-18')) {
      modifiedRoll += 1;
    }
    
    // Cap at 10
    modifiedRoll = Math.min(modifiedRoll, 10);
    
    // Determine ordnance based on modified roll
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

  /**
   * Process a single tasking
   * 
   * @param {string} tasking - The tasking type
   * @param {string} scenarioDate - 'pre' or 'post'
   * @returns {object} Tasking result
   */
  processTasking(tasking, scenarioDate) {
    const taskingVariant = this.tableData.taskings[tasking][scenarioDate];
    
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
    
    // Handle sub-rolls for aircraft variants (data-driven via "variants" field)
    let finalAircraftType = aircraftResult.aircraftType;
    let finalAircraftId = aircraftResult.aircraftId;
    let subRollResult = { subRollDebug: null };

    if (aircraftResult.variants) {
      const variantResult = this.resolveVariants(aircraftResult.variants, `${tasking} Sub-roll`);
      finalAircraftType = variantResult.finalAircraftType || finalAircraftType;
      finalAircraftId = variantResult.finalAircraftId;
      subRollResult = { subRollDebug: variantResult.subRollDebug };
    }
    
    const flightSize = this.flightSizes[tasking];
    const flightCount = this.flightCounts[tasking];
    let resultText = '';
    let additionalDebug = [];
    
    // Handle special split aircraft types for SEAD
    if (tasking === 'SEAD' && nationResult.nationName === 'US' && aircraftResult.aircraftType === 'F-4G/F-4E') {
      return this.processSplitSEAD(nationResult.nationName, 'F-4G', 'F-4E', flightSize, nationResult, aircraftResult);
    }
    
    if (tasking === 'SEAD' && nationResult.nationName === 'US' && aircraftResult.aircraftType === 'F-4G/F-16C') {
      return this.processSplitSEAD(nationResult.nationName, 'F-4G', 'F-16C', flightSize, nationResult, aircraftResult);
    }
    
    // CAP flights: No ordnance, grouped
    if (tasking === 'CAP') {
      resultText = `${flightCount} x {${flightSize}} ${nationResult.nationName} ${finalAircraftType}, ${tasking}`;
      
      return {
        tasking,
        nationRoll: nationResult.nationRoll,
        aircraftRoll: aircraftResult.aircraftRoll,
        nationName: nationResult.nationName,
        nationality: nationResult.nationName,
        aircraftType: finalAircraftType,
        aircraftId: finalAircraftId,
        flightSize: flightSize,
        flightCount: flightCount,
        text: resultText,
        debugText: this.buildDebugText({
          nationRollDebug: nationResult.nationRollDebug,
          aircraftRollDebug: aircraftResult.aircraftRollDebug,
          subRollDebug: subRollResult.subRollDebug,
          additionalDebug: subRollResult.subRollDebug ? [`→ ${finalAircraftType}`] : []
        })
      };
    }
    
    // SEAD and Bombing: Individual ordnance rolls per flight
    const individualFlights = [];
    const ordnanceDebug = [];
    
    for (let i = 1; i <= flightCount; i++) {
      const ordnanceRollResult = makeDebugRoll(10, `${tasking} Flight ${i} Ordnance`);
      const ordnance = this.getOrdnanceAvailability(ordnanceRollResult.roll, finalAircraftType, tasking);
      
      ordnanceDebug.push(`Flight ${i} Ordnance: ${ordnanceRollResult.roll}`);
      individualFlights.push(`1 x {${flightSize}} ${nationResult.nationName} ${finalAircraftType}, ${tasking} (${ordnance})`);
    }
    
    resultText = individualFlights.join('<br>');
    
    if (subRollResult.subRollDebug) {
      additionalDebug.push(` | ${this.stripBrackets(subRollResult.subRollDebug)} → ${finalAircraftType}`);
    }
    additionalDebug.push(` | ${ordnanceDebug.join(' | ')}`);
    
    return {
      tasking,
      nationRoll: nationResult.nationRoll,
      aircraftRoll: aircraftResult.aircraftRoll,
      nationName: nationResult.nationName,
      nationality: nationResult.nationName,
      aircraftType: finalAircraftType,
      aircraftId: finalAircraftId,
      flightSize: flightSize,
      flightCount: flightCount,
      text: resultText,
      debugText: `[${tasking}: ${this.stripBrackets(nationResult.nationRollDebug)} | ${this.stripBrackets(aircraftResult.aircraftRollDebug)}${additionalDebug.join('')}]`
    };
  }

  /**
   * Process split SEAD flights (F-4G/F-4E or F-4G/F-16C)
   * 
   * @param {string} nationName - Nation name
   * @param {string} aircraft1 - First aircraft type
   * @param {string} aircraft2 - Second aircraft type
   * @param {number} flightSize - Flight size
   * @param {object} nationResult - Nation roll result
   * @param {object} aircraftResult - Aircraft roll result
   * @returns {object} Split SEAD result
   */
  processSplitSEAD(nationName, aircraft1, aircraft2, flightSize, nationResult, aircraftResult) {
    const flights = [];
    const ordnanceDebug = [];
    
    // 2 flights of first aircraft type
    for (let i = 1; i <= 2; i++) {
      const ordnanceRollResult = makeDebugRoll(10, `SEAD ${aircraft1} Flight ${i} Ordnance`);
      const ordnance = this.getOrdnanceAvailability(ordnanceRollResult.roll, aircraft1, 'SEAD');
      ordnanceDebug.push(`${aircraft1} Flight ${i} Ordnance: ${ordnanceRollResult.roll}`);
      flights.push(`1 x {${flightSize}} ${nationName} ${aircraft1}, SEAD (${ordnance})`);
    }
    
    // 2 flights of second aircraft type
    for (let i = 1; i <= 2; i++) {
      const ordnanceRollResult = makeDebugRoll(10, `SEAD ${aircraft2} Flight ${i} Ordnance`);
      const ordnance = this.getOrdnanceAvailability(ordnanceRollResult.roll, aircraft2, 'SEAD');
      ordnanceDebug.push(`${aircraft2} Flight ${i} Ordnance: ${ordnanceRollResult.roll}`);
      flights.push(`1 x {${flightSize}} ${nationName} ${aircraft2}, SEAD (${ordnance})`);
    }
    
    return {
      tasking: 'SEAD',
      nationRoll: nationResult.nationRoll,
      aircraftRoll: aircraftResult.aircraftRoll,
      nationName: nationResult.nationName,
      nationality: nationResult.nationName,
      aircraftType: `${aircraft1}/${aircraft2}`,
      aircraftId: null,
      flightSize: flightSize,
      flightCount: 4,
      text: flights.join('<br>'),
      debugText: `[SEAD: ${this.stripBrackets(nationResult.nationRollDebug)} | ${this.stripBrackets(aircraftResult.aircraftRollDebug)} | ${ordnanceDebug.join(' | ')}]`
    };
  }

  /**
   * Process Table C roll (all three taskings)
   * 
   * @param {object} params
   * @param {string} params.scenarioDate - 'pre' or 'post'
   * @returns {object} Combined result from all taskings
   */
  process(params) {
    const { scenarioDate } = params;
    
    const results = [];
    
    for (const tasking of this.taskings) {
      const taskingResult = this.processTasking(tasking, scenarioDate);
      results.push(taskingResult);
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
  module.exports = NATOTableC;
}

console.log('NATOTableC processor loaded');
