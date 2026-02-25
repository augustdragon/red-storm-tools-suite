/**
 * WPTableG - Warsaw Pact QRA Flight Processor
 * 
 * Table G: Warsaw Pact Quick Reaction Alert (Scrambled Interceptors)
 * 
 * Structure:
 * - Simple two-roll system: Nation → Aircraft
 * - Single flight configuration (1 x 4-ship flight)
 * - All flights are CAP mission
 * - Similar structure to NATO Table A but with WP nations
 * 
 * Processing Flow:
 * 1. Roll for nation (1-10)
 * 2. Roll for aircraft (1-10) within nation
 * 3. Handle sub-rolls for variants (MiG-25PD/Su-27S)
 * 4. Format as: "{Nation}: 1 x {4} {Aircraft}, CAP"
 */

class WPTableG extends BaseTableProcessor {
  constructor(tableData) {
    super('G', tableData);
  }

  /**
   * Process Table G roll
   * 
   * @param {object} params - (No parameters needed for Table G)
   * @returns {object} Result with nation, aircraft, and formatted text
   */
  process(params) {
    // Roll for nation
    const nationResult = this.rollForNation(this.tableData.nations, 'Nation');
    
    if (nationResult.error) {
      return this.formatResult({
        nationRoll: nationResult.nationRoll,
        text: `Error: ${nationResult.error}`,
        debugText: this.buildDebugText({ nationRollDebug: nationResult.nationRollDebug })
      });
    }
    
    // Roll for aircraft
    const aircraftResult = this.rollForAircraft(nationResult.nationData.aircraft, 'Aircraft');
    
    if (aircraftResult.error) {
      return this.formatResult({
        nationRoll: nationResult.nationRoll,
        aircraftRoll: aircraftResult.aircraftRoll,
        text: `Error: ${aircraftResult.error}`,
        debugText: this.buildDebugText({
          nationRollDebug: nationResult.nationRollDebug,
          aircraftRollDebug: aircraftResult.aircraftRollDebug
        })
      });
    }
    
    // Handle sub-rolls for aircraft variants (data-driven via "variants" field)
    let finalAircraftType = aircraftResult.aircraftType;
    let finalAircraftId = aircraftResult.aircraftId;
    let additionalSubRollDebug = null;

    if (aircraftResult.variants) {
      const variantResult = this.resolveVariants(aircraftResult.variants, 'Sub-roll');
      finalAircraftType = variantResult.finalAircraftType || finalAircraftType;
      finalAircraftId = variantResult.finalAircraftId;
      additionalSubRollDebug = variantResult.subRollDebug;
    }
    
    // Format result text (always 1 x 4-ship flight)
    const resultText = `${nationResult.nationName}: 1 x {${this.tableData.flightSize}} ${finalAircraftType}, CAP`;
    
    // Build debug text
    const debugText = this.buildDebugText({
      nationRollDebug: nationResult.nationRollDebug,
      aircraftRollDebug: aircraftResult.aircraftRollDebug,
      subRollDebug: additionalSubRollDebug
    });
    
    return this.formatResult({
      nationRoll: nationResult.nationRoll,
      aircraftRoll: aircraftResult.aircraftRoll,
      nationName: nationResult.nationName,
      nationality: nationResult.nationName,
      aircraftType: finalAircraftType,
      aircraftId: finalAircraftId,
      flightSize: this.tableData.flightSize,
      flightCount: 1,
      tasking: 'CAP',
      text: resultText,
      debugText: debugText
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WPTableG;
}

console.log('WPTableG processor loaded');
