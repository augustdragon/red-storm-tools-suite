/**
 * WPTableH2 - Baltic Approaches WP Fighter Sweep Processor
 * 
 * Table H2: WP Fighter Sweep (Baltic Approaches)
 * 
 * Structure:
 * - Date-based system (15-31 May, 1 June+)
 * - Squadron-sized CAP flights with jamming capability
 * - 3 or 4 aircraft per flight depending on date
 * - MiG-23MLD standard, some with 2n defensive jamming
 * 
 * Date Periods:
 * - 15-31 May: 3x{4} CAP flights
 * - 1 June+: 3x{4} CAP flights
 * - Additional jamming capability in later period
 */

class WPTableH2 extends BaseTableProcessor {
  constructor(tableData) {
    super('H2', tableData);
  }

  /**
   * Process WP Table H2 - Fighter Sweep
   * 
   * @param {object} params - Processing parameters
   * @param {number|string} params.scenarioDate - Ordinal date (1, 2, 3) or date range string
   * @returns {object} Result object with fighter sweep information
   */
  process(params) {
    let { scenarioDate } = params;
    
    if (!scenarioDate) {
      return { 
        text: 'Error: Scenario date is required for Table H2',
        error: 'Missing scenario date parameter'
      };
    }

    // If scenarioDate is numeric (ordinal), convert using COMBINED_MAY mapping
    // H2 combines both May periods into '15-31 May'
    if (typeof scenarioDate === 'number' && window.BA_DATE_RANGES_COMBINED_MAY) {
      scenarioDate = window.BA_DATE_RANGES_COMBINED_MAY[scenarioDate];
    }

    // Get date range data
    const dateRangeData = this.tableData.dateRanges[scenarioDate];
    if (!dateRangeData || !dateRangeData.nations) {
      return {
        text: `Error: No data found for scenario date "${scenarioDate}"`,
        error: 'Invalid scenario date'
      };
    }

    // Roll for nation
    const nationResult = this.rollForNation(dateRangeData.nations, 'Nation');
    if (nationResult.error) {
      return {
        text: `Error: ${nationResult.error}`,
        error: nationResult.error
      };
    }

    // Roll for aircraft (applies to all 3 flights)
    const aircraftResult = this.rollForAircraft(nationResult.nationData.aircraft, 'Aircraft');
    if (aircraftResult.error) {
      return {
        text: `Error: ${aircraftResult.error}`,
        error: aircraftResult.error
      };
    }

    const flightCount = 3;
    const flightSize = 4;

    // Create flights array (all flights use same aircraft)
    const flights = [];
    for (let i = 0; i < flightCount; i++) {
      flights.push({
        faction: 'WP',
        nationality: nationResult.nationName,
        aircraft: aircraftResult.aircraftType,
        flightSize: flightSize,
        tasking: 'CAP',
        ordnance: 'Air-to-Air'
      });
    }

    // Format result text
    const resultText = `${nationResult.nationName}: ${flightCount} x {${flightSize}} ${aircraftResult.aircraftType}, CAP`;

    return {
      text: resultText,
      result: resultText,
      table: 'H2',
      tableName: this.tableData.name,
      faction: 'WP',
      nationality: nationResult.nationName,
      aircraft: aircraftResult.aircraftType,
      flightSize: flightSize,
      flightCount: flightCount,
      tasking: 'CAP',
      flights: flights,
      debugRolls: [
        nationResult.nationRollDebug,
        aircraftResult.aircraftRollDebug
      ],
      additionalNote: this.tableData.additionalNote || null
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WPTableH2;
}

console.log('WPTableH2 processor loaded');