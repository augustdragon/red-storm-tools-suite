/**
 * NATOTableA2 - Baltic Approaches NATO QRA Flight Processor
 * 
 * Table A2: NATO QRA Flight (Baltic Approaches)
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

class NATOTableA2 extends BaseTableProcessor {
  constructor(tableData, tableId = 'A2') {
    super(tableId, tableData);
  }

  /**
   * Process NATO Table A2 - QRA Flight
   * 
   * @param {object} params - Processing parameters
   * @param {number|string} params.scenarioDate - Ordinal date (1, 2, 3) or date range string
   * @returns {object} Result object with QRA flight information
   */
  process(params) {
    let { scenarioDate } = params;
    
    // Check if this is A2-SE variant (no date ranges, direct nations)
    if (this.tableData.nations && !this.tableData.dateRanges) {
      // A2-SE variant - use direct nations structure
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
      const resultText = `1 x 2 [QRA], CAP (${nationResult.nationName}: ${aircraftResult.aircraftType})`;

      return {
        text: resultText,
        result: resultText,
        table: this.tableId,
        faction: 'NATO',
        nationality: nationResult.nationName,
        aircraftType: aircraftResult.aircraftType,
        aircraftId: aircraftResult.aircraftId,
        flightSize: 2,
        flightCount: 1,
        quantity: 1,
        tasking: 'CAP',
        debugRolls: [
          nationResult.nationRollDebug,
          aircraftResult.aircraftRollDebug
        ],
        setupNote: this.tableData.setupEntry?.text || null
      };
    }
    
    // Standard A2 variant with date ranges
    if (!scenarioDate) {
      return { 
        text: 'Error: Scenario date is required for Table A2',
        error: 'Missing scenario date parameter'
      };
    }

    // If scenarioDate is numeric (ordinal), convert to date range string
    // This allows processors to work with both old string format and new ordinal format
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
    const resultText = `1 x 2 [QRA], CAP (${nationResult.nationName}: ${aircraftResult.aircraftType})`;

    return {
      text: resultText,
      result: resultText,
      table: this.tableId,
      faction: 'NATO',
      nationality: nationResult.nationName,
      aircraftType: aircraftResult.aircraftType,
      aircraftId: aircraftResult.aircraftId,
      flightSize: 2,
      flightCount: 1,
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NATOTableA2;
}
