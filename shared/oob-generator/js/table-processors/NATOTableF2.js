/**
 * NATOTableF2 - Baltic Approaches NATO Special Missions Processor
 * 
 * Table F2: NATO Special Missions (Baltic Approaches)
 * 
 * Structure:
 * - Mission-type based system
 * - Currently only "Maritime Patrol" mission type
 * - Single roll for nation, nation determines aircraft
 * - Fixed flight configuration: 1 x 1 aircraft
 * - Very straightforward single flight generator
 * 
 * Mission Types:
 * - Maritime Patrol: Single aircraft patrol mission
 */

class NATOTableF2 extends BaseTableProcessor {
  constructor(tableData) {
    super('F2', tableData);
  }

  /**
   * Process NATO Table F2 - Special Missions
   * 
   * @param {object} params - Processing parameters
   * @param {string} [params.missionType] - Mission type (defaults to "Maritime Patrol")
   * @returns {object} Result object with special mission information
   */
  process(params) {
    const { missionType = 'Maritime Patrol' } = params;
    
    // F2 has a simple structure with nations directly, no missionTypes wrapper
    if (!this.tableData.nations) {
      return {
        text: 'Error: Invalid F2 table data structure',
        error: 'Missing nations data'
      };
    }

    // Roll for nation
    const nationResult = this.rollForNation(this.tableData.nations, 'Nation');
    if (nationResult.error) {
      return {
        text: `Error: ${nationResult.error}`,
        error: nationResult.error
      };
    }

    // Roll for aircraft
    const aircraftResult = this.rollForAircraft(nationResult.nationData.aircraft, 'Aircraft');
    if (aircraftResult.error) {
      return {
        text: `Error: ${aircraftResult.error}`,
        error: aircraftResult.error
      };
    }

    // Generate result text
    const flightSize = this.tableData.flightSize || 1;
    const flightCount = this.tableData.flightCount || 1;
    const resultText = `${flightCount} x ${flightSize} ${missionType} (${nationResult.nationName}: ${aircraftResult.aircraftType})`;

    return {
      text: resultText,
      result: resultText,
      table: 'F2',
      faction: 'NATO',
      missionType: missionType,
      tasking: missionType,
      nationality: nationResult.nationName,
      aircraftType: aircraftResult.aircraftType,
      aircraftId: aircraftResult.aircraftId,
      flightSize: flightSize,
      flightCount: flightCount,
      debugRolls: [
        nationResult.nationRollDebug,
        aircraftResult.aircraftRollDebug
      ]
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NATOTableF2;
}
