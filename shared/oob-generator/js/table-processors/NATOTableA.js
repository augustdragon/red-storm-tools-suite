/**
 * NATOTableA - NATO QRA Flight Processor
 * 
 * Table A: NATO Quick Reaction Alert (Scrambled Interceptors)
 * 
 * Structure:
 * - Has variants based on ATAF zone (2ATAF/4ATAF) and scenario date (pre/post)
 * - Two-roll system: Nation roll (1-10) → Aircraft roll (1-10)
 * - Each variant has different nation distributions
 * - All flights are CAP (Combat Air Patrol) mission
 * 
 * Processing Flow:
 * 1. Select variant based on atafZone and scenarioDate
 * 2. Roll for nation (1-10) within variant
 * 3. Roll for aircraft (1-10) within nation
 * 4. Format as: "{Nation}: 1 x {flightSize} {Aircraft}, CAP"
 */

class NATOTableA extends BaseTableProcessor {
  constructor(tableData) {
    super('A', tableData);
  }

  /**
   * Process Table A roll
   * 
   * @param {object} params
   * @param {string} params.atafZone - '2ATAF' or '4ATAF'
   * @param {string} params.scenarioDate - 'pre' or 'post'
   * @returns {object} Result with nation, aircraft, and formatted text
   */
  process(params) {
    const { atafZone, scenarioDate } = params;

    // Get the specific variant for this zone and date
    const variant = this.tableData.variants[atafZone][scenarioDate];
    
    if (!variant) {
      return this.formatResult({
        text: `Error: No data found for ${atafZone} / ${scenarioDate}`,
        debugText: '[ERROR: Invalid variant]'
      });
    }

    // Roll for nation
    const nationResult = this.rollForNation(variant.nations, 'Nation');
    
    if (nationResult.error) {
      return this.formatResult({
        text: `Error: ${nationResult.error}`,
        debugText: this.buildDebugText({ nationRollDebug: nationResult.nationRollDebug })
      });
    }

    // Roll for aircraft within selected nation
    const aircraftResult = this.rollForAircraft(nationResult.nationData.aircraft, 'Aircraft');
    
    if (aircraftResult.error) {
      return this.formatResult({
        nationRoll: nationResult.nationRoll,
        nationName: nationResult.nationName,
        text: `Error: ${aircraftResult.error}`,
        debugText: this.buildDebugText({
          nationRollDebug: nationResult.nationRollDebug,
          aircraftRollDebug: aircraftResult.aircraftRollDebug
        })
      });
    }

    // Resolve composite nationalities (e.g., "NE/CAN" → "CAN" for CF-18A)
    const resolvedNation = this.resolveCompositeNation(
      nationResult.nationName, aircraftResult.aircraftType, aircraftResult.aircraftId
    );

    // Format result text
    const resultText = `${resolvedNation}: 1 x {${this.tableData.flightSize}} ${aircraftResult.aircraftType}, CAP`;

    // Build debug text
    const debugText = this.buildDebugText({
      nationRollDebug: nationResult.nationRollDebug,
      aircraftRollDebug: aircraftResult.aircraftRollDebug
    });

    return this.formatResult({
      nationRoll: nationResult.nationRoll,
      aircraftRoll: aircraftResult.aircraftRoll,
      nationName: resolvedNation,
      nationality: resolvedNation,
      aircraftType: aircraftResult.aircraftType,
      aircraftId: aircraftResult.aircraftId,
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
  module.exports = NATOTableA;
}

console.log('NATOTableA processor loaded');
