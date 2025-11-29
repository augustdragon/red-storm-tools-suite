/**
 * WPTableG2 - Baltic Approaches WP QRA Flight Processor
 * 
 * Table G2: WP QRA Flight (Baltic Approaches)
 * 
 * Structure:
 * - Quick Reaction Alert flights sitting ready
 * - Date-based variations (15-20 May, 21-31 May, 1-15 June)
 * - Single roll for nation, nation determines aircraft
 * - Fixed result format: "1 x {2} [QRA], CAP"
 * 
 * Flight Configuration:
 * - 1 flight x 2 aircraft
 * - Always CAP tasking
 * - Set up in Ready status if at on-map airfield
 */

class WPTableG2 extends BaseTableProcessor {
  constructor(tableData) {
    super('G2', tableData);
  }

  /**
   * Process WP Table G2 - QRA Flight
   * 
   * @param {object} params - Processing parameters
   * @param {number|string} params.scenarioDate - Ordinal date (1, 2, 3) or date range string
   * @returns {object} Result object with QRA flight information
   */
  process(params) {
    let { scenarioDate } = params;
    
    if (!scenarioDate) {
      return { 
        text: 'Error: Scenario date is required for Table G2',
        error: 'Missing scenario date parameter'
      };
    }

    // If scenarioDate is numeric (ordinal), convert to date range string
    if (typeof scenarioDate === 'number' && window.BA_DATE_RANGES) {
      scenarioDate = window.BA_DATE_RANGES[scenarioDate];
    }

    // Get date range data
    const dateRangeData = this.tableData.dateRanges[scenarioDate];
    if (!dateRangeData || !dateRangeData.nations) {
      return {
        text: `Error: No data found for scenario date "${scenarioDate}"`,
        error: 'Invalid scenario date'
      };
    }

    // Roll for nation first
    const nationResult = this.rollForNation(dateRangeData.nations, 'Nation');
    if (nationResult.error) {
      return {
        text: `Error: ${nationResult.error}`,
        error: nationResult.error
      };
    }

    // Roll for aircraft within nation
    const aircraftResult = this.rollForAircraft(nationResult.nationData.aircraft, 'Aircraft');
    if (aircraftResult.error) {
      return {
        text: `Error: ${aircraftResult.error}`,
        error: aircraftResult.error
      };
    }

    const nationality = nationResult.nationName;

    const flights = [{
      faction: 'WP',
      aircraft: aircraftResult.aircraftType,
      flightSize: 2,
      tasking: 'CAP',
      nationality: nationality,
      ordnance: 'Air-to-Air'
    }];

    const resultText = `${nationality}: 1 x {2} ${aircraftResult.aircraftType}, CAP`;

    return {
      text: resultText,
      result: resultText,
      table: 'G2',
      tableName: this.tableData.name,
      faction: 'WP',
      nationality: nationality,
      aircraft: aircraftResult.aircraftType,
      flightSize: 2,
      tasking: 'CAP',
      missionType: 'QRA',
      flights: flights,
      debugRolls: [nationResult.nationRollDebug, aircraftResult.aircraftRollDebug]
    };
  }

  /**
   * Extract nationality from aircraft name
   * Uses standard WP nationality codes: USSR, POL, GDR
   * 
   * @param {string} aircraftName - Name of the aircraft
   * @returns {string} Nationality code
   */
  extractNationality(aircraftName) {
    // Map aircraft types to nationalities based on typical assignments
    const aircraftNationMap = {
      'MiG-23MLD': 'USSR',
      'MiG-29A': 'USSR', 
      'MiG-25PD': 'USSR',
      'MiG-23': 'POL',
      'MiG-21bis': 'POL',
      'MiG-23MF': 'GDR',
      'MiG-21MF': 'GDR',
      'MiG-23ML': 'GDR'
    };

    return aircraftNationMap[aircraftName] || 'USSR'; // Default to USSR
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WPTableG2;
}

console.log('WPTableG2 processor loaded');