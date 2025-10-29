/**
 * WPTableH - Warsaw Pact Fighter Sweep Processor
 * 
 * Table H: Warsaw Pact Defensive Fighter Sweep (Combat Air Patrol)
 * 
 * Structure:
 * - Two-roll system: Nation → Aircraft
 * - Multiple flight configuration (4 x 2-ship flights)
 * - All flights are CAP mission
 * - Similar to Table G but with multiple flights
 * 
 * Processing Flow:
 * 1. Roll for nation (1-10)
 * 2. Roll for aircraft (1-10) within nation (applies to all flights)
 * 3. Handle sub-rolls for variants (MiG-25PD/Su-27S)
 * 4. Format as: "{Nation}: 4 x {2} {Aircraft}, CAP"
 */

class WPTableH extends BaseTableProcessor {
  constructor(tableData) {
    super('H', tableData);
  }

  /**
   * Process Table H roll
   * 
   * @param {object} params - (No parameters needed for Table H)
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
    
    // Roll for aircraft (applies to all flights)
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
    
    // Handle sub-rolls for aircraft variants
    let finalAircraftType = aircraftResult.aircraftType;
    let additionalSubRollDebug = null;
    
    if (aircraftResult.aircraftType.includes('¹')) {
      const subRollDebugResult = makeDebugRoll(10, 'Sub-roll');
      const subRoll = subRollDebugResult.roll;
      
      if (aircraftResult.aircraftType.includes('MiG-25PD/Su-27S¹')) {
        finalAircraftType = subRoll <= 5 ? 'MiG-25PD' : 'Su-27S';
      }
      
      additionalSubRollDebug = subRollDebugResult.debugEntry;
    }
    
    // Format result text (4 flights x 2 aircraft)
    const resultText = `${nationResult.nationName}: ${this.tableData.flightCount} x {${this.tableData.flightSize}} ${finalAircraftType}, CAP`;
    
    // Build debug text
    const debugText = this.buildDebugText({
      nationRollDebug: nationResult.nationRollDebug,
      aircraftRollDebug: aircraftResult.aircraftRollDebug,
      subRollDebug: additionalSubRollDebug
    });
    
    return this.formatResult({
      nationRoll: nationResult.nationRoll,
      aircraftRoll: aircraftResult.aircraftRoll,
      text: resultText,
      debugText: debugText
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WPTableH;
}

console.log('WPTableH processor loaded');
