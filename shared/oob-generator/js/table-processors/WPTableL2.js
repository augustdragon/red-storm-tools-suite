/**
 * WPTableL2 - Baltic Approaches WP Special Missions Processor
 * 
 * Table L2: WP Special Missions (Baltic Approaches)
 * 
 * Structure:
 * - Mission-type based system
 * - Two mission types: Standoff Jamming, Maritime Patrol
 * - USSR only
 * - Fixed 1x{1} flights
 */

class WPTableL2 extends BaseTableProcessor {
  constructor(tableData) {
    super('L2', tableData);
  }

  /**
   * Process WP Table L2 - Special Missions
   * 
   * @param {object} params - Processing parameters
   * @param {string} params.missionType - Mission type (Standoff Jamming or Maritime Patrol)
   * @returns {object} Result object with special mission information
   */
  process(params) {
    const { missionType } = params;
    
    if (!missionType) {
      return { 
        text: 'Error: Mission type is required for Table L2',
        error: 'Missing mission type parameter'
      };
    }

    const missionData = this.tableData.missionTypes[missionType];
    if (!missionData) {
      return {
        text: `Error: Unknown mission type "${missionType}" for Table L2`,
        error: `Unknown mission type "${missionType}"`
      };
    }

    const { flightSize, flightCount, nations } = missionData;
    const nationData = nations['1-10']; // USSR only

    // Roll for aircraft
    const aircraftResult = this.rollForAircraft(nationData.aircraft, 'Aircraft');
    if (aircraftResult.error) {
      return {
        text: `Error: ${aircraftResult.error}`,
        error: aircraftResult.error
      };
    }

    const flights = [{
      faction: 'WP',
      nationality: 'USSR',
      aircraft: aircraftResult.aircraftType,
      flightSize: flightSize,
      tasking: missionType,
      ordnance: missionType === 'Standoff Jamming' ? 'None' : 'Maritime'
    }];

    const resultText = `USSR: ${flightCount} x {${flightSize}} ${aircraftResult.aircraftType}, ${missionType}`;

    return {
      text: resultText,
      result: resultText,
      table: 'L2',
      tableName: this.tableData.name,
      faction: 'WP',
      nationality: 'USSR',
      missionType: missionType,
      aircraft: aircraftResult.aircraftType,
      flightSize: flightSize,
      flightCount: flightCount,
      flights: flights,
      debugRolls: [aircraftResult.aircraftRollDebug],
      ordnanceNote: missionData.ordnanceNote || null
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WPTableL2;
}

console.log('WPTableL2 processor loaded');