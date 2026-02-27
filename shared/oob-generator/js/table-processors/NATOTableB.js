/**
 * NATOTableB - NATO CAP Flight Processor
 * 
 * Table B: NATO Combat Air Patrol (Defensive Fighter Sweep)
 * 
 * Structure:
 * - Has zones (2ATAF/4ATAF) with scenario dates (pre/post)
 * - Two-roll system: Nation roll (1-10) → Aircraft roll (1-10)
 * - All flights are 2-ship CAP missions
 * 
 * Processing Flow:
 * 1. Select zone data based on atafZone and scenarioDate
 * 2. Roll for nation (1-10) within zone
 * 3. Roll for aircraft (1-10) within nation
 * 4. Format as: "{Nation}: 1 x {2} {Aircraft}, CAP"
 */

class NATOTableB extends BaseTableProcessor {
  constructor(tableData) {
    super('B', tableData);
  }

  /**
   * Process Table B roll
   * 
   * @param {object} params
   * @param {string} params.atafZone - '2ATAF' or '4ATAF'
   * @param {string} params.scenarioDate - 'pre' or 'post'
   * @returns {object} Result with nation, aircraft, and formatted text
   */
  process(params) {
    const { atafZone, scenarioDate } = params;

    // Get the specific zone data for this zone and date
    const zoneData = this.tableData.zones[atafZone][scenarioDate];
    
    if (!zoneData) {
      return this.formatResult({
        text: `Error: No data found for ${atafZone} / ${scenarioDate}`,
        debugText: '[ERROR: Invalid zone data]'
      });
    }

    // Roll for nation
    const nationResult = this.rollForNation(zoneData.nations, 'Nation');
    
    if (nationResult.error) {
      return this.formatResult({
        nationRoll: nationResult.nationRoll,
        text: `Error: ${nationResult.error}`,
        debugText: this.buildDebugText({ nationRollDebug: nationResult.nationRollDebug })
      });
    }

    // Roll for aircraft within selected nation
    const aircraftResult = this.rollForAircraft(nationResult.nationData.aircraft, 'Aircraft');
    
    if (aircraftResult.error) {
      return this.formatResult({
        nationRoll: nationResult.nationRoll,
        aircraftRoll: aircraftResult.aircraftRoll,
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

    // Format result text (always 2-ship flight)
    const resultText = `${resolvedNation}: 1 x {2} ${aircraftResult.aircraftType}, CAP`;

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
      flightSize: 2,
      flightCount: 1,
      tasking: 'CAP',
      text: resultText,
      debugText: debugText
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NATOTableB;
}

console.log('NATOTableB processor loaded');
