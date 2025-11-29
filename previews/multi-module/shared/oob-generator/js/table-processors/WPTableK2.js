/**
 * WPTableK2 - Baltic Approaches WP Combat Rescue Processor
 * 
 * Table K2: WP Combat Rescue (Baltic Approaches)
 * 
 * Structure:
 * - GDR only raids (land or naval)
 * - Hex type determines raid type (Land vs Naval)
 * - Land: 2x{2} Rescue Support + 2x{1} Mi-8 CSAR
 * - Naval: 2x{2} Su-22M4 Rescue Support + 2x{1} Mi-14 CSAR
 * - Note: GDR CSAR raids do not receive Rescue Support flights at Night
 */

class WPTableK2 extends BaseTableProcessor {
  constructor(tableData) {
    super('K2', tableData);
  }

  /**
   * Process WP Table K2 - Combat Rescue
   * 
   * @param {object} params - Processing parameters
   * @param {string} params.nationality - Must be 'GDR' or 'GDR Naval'
   * @param {string} params.hexType - 'land' or 'sea' (determines raid type)
   * @returns {object} Result object with combat rescue raid information
   */
  process(params) {
    let { nationality, hexType } = params;
    
    // Default to GDR if not specified
    if (!nationality) {
      nationality = hexType === 'sea' ? 'GDR Naval' : 'GDR';
    }

    // Handle hex type to nationality mapping
    if (hexType === 'sea' && nationality === 'GDR') {
      nationality = 'GDR Naval';
    }

    const nationalityData = this.tableData.nationalities[nationality];
    if (!nationalityData) {
      return {
        text: `Error: Unknown nationality "${nationality}" for Table K2`,
        error: `Unknown nationality "${nationality}"`
      };
    }

    const resultLines = [];
    const flights = [];
    const debugRolls = [];

    // Process each flight type (one aircraft roll per type)
    for (const flightConfig of nationalityData.flights) {
      const { type, flightSize, flightCount, aircraft } = flightConfig;

      // Roll for aircraft once per flight type
      let aircraftType;
      let aircraftDebug = null;

      if (typeof aircraft === 'object' && !Array.isArray(aircraft)) {
        // Aircraft is a roll table
        const aircraftResult = this.rollForAircraft(aircraft, `${type} Aircraft`);
        if (aircraftResult.error) {
          return {
            text: `Error: ${aircraftResult.error}`,
            error: aircraftResult.error
          };
        }
        aircraftType = aircraftResult.aircraftType;
        aircraftDebug = aircraftResult.aircraftRollDebug;
        debugRolls.push(aircraftDebug);
      } else {
        // Fixed aircraft type
        const aircraftValue = Object.values(aircraft)[0];
        aircraftType = aircraftValue;
      }

      // Format result line matching RS Table K style
      const taskingDisplay = type === 'CSAR' ? 'CSAR' : 'Rescue Support';
      resultLines.push(`${flightCount} x {${flightSize}} ${aircraftType}, ${taskingDisplay}`);

      // Build flight records for flight sheet generation
      for (let i = 1; i <= flightCount; i++) {
        flights.push({
          faction: 'WP',
          nationality: 'GDR',
          aircraft: aircraftType,
          flightSize: flightSize,
          tasking: taskingDisplay,
          ordnance: type === 'Rescue Support' ? 'Air-to-Ground' : 'None'
        });
      }
    }

    // Combine all results with line breaks (like RS Table K)
    const combinedText = resultLines.join('<br>');

    return {
      text: combinedText,
      result: nationalityData.result,
      table: 'K2',
      tableName: this.tableData.name,
      faction: 'WP',
      nationality: 'GDR',
      hexType: nationality === 'GDR Naval' ? 'sea' : 'land',
      flights: flights,
      debugRolls: debugRolls,
      ordnanceNote: this.tableData.ordnanceNote || null,
      additionalNote: this.tableData.additionalNote || null
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WPTableK2;
}

console.log('WPTableK2 processor loaded');