/**
 * NATOTableB2 - Baltic Approaches NATO B2 Processor
 * 
 * Table B2: NATO B2 (Baltic Approaches)
 * 
 * Structure:
 * - Fixed NATO B2 table result
 * - Simple lookup table with die ranges
 * - Each result specifies complete flight information
 * - Format: "{flights} x {aircraft_count} [status], {tasking}"
 */

class NATOTableB2 extends BaseTableProcessor {
  constructor(tableData) {
    super('B2', tableData);
  }

  /**
   * Process NATO Table B2 - CAP Flight
   * 
   * @param {object} params - Processing parameters
   * @param {number|string} params.scenarioDate - Ordinal date (1, 2, 3) or date range string
   * @returns {object} Result object with CAP flight information
   */
  process(params) {
    let { scenarioDate } = params;
    
    if (!scenarioDate) {
      return { 
        text: 'Error: Scenario date is required for Table B2',
        error: 'Missing scenario date parameter'
      };
    }

    // Validate table data structure - B2 uses dateRanges like A2
    if (!this.tableData || !this.tableData.dateRanges) {
      return {
        text: 'Error: Invalid table data for B2',
        error: 'Missing date ranges data'
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

    // Roll for nation
    const nationResult = this.rollForNation(dateRangeData.nations, 'Nation');
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
    const flightSize = this.tableData.flightSize || 2;
    const resultText = `1 x ${flightSize} [CAP], CAP (${nationResult.nationName}: ${aircraftResult.aircraftType})`;

    return {
      text: resultText,
      result: resultText,
      table: 'B2',
      faction: 'NATO',
      nationality: nationResult.nationName,
      aircraftType: aircraftResult.aircraftType,
      flightSize: flightSize,
      quantity: 1,
      tasking: 'CAP',
      debugRolls: [
        nationResult.nationRollDebug,
        aircraftResult.aircraftRollDebug
      ],
      setupNote: this.tableData.setupEntry?.text || null
    };
  }
}