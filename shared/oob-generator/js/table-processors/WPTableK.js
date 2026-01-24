/**
 * WPTableK - Warsaw Pact Combat Rescue Processor
 * 
 * Table K: Warsaw Pact Combat Rescue (Search & Rescue Mission)
 * 
 * Structure:
 * - Nationality-based system (USSR, GDR)
 * - Each nationality has 2-3 flight types with specific configurations
 * - Single roll per flight type: Aircraft only (no nation roll)
 * - Similar to NATO Table E but for Warsaw Pact nations
 * 
 * Flight Types:
 * - Rescue: Primary rescue helicopters
 * - Escort: Armed escort fighters
 * - RESCAP: Rescue Combat Air Patrol (optional, depends on nationality)
 */

class WPTableK extends BaseTableProcessor {
  constructor(tableData) {
    super('K', tableData);
  }

  /**
   * Process Table K roll
   * 
   * @param {object} params
   * @param {string} params.nationality - Crew nationality (USSR, GDR)
   * @returns {object} Result with all flight types for the nationality
   */
  process(params) {
    const { nationality } = params;
    
    const nationalityData = this.tableData.nationalities[nationality];
    
    if (!nationalityData) {
      return this.formatResult({
        text: `Error: Unknown nationality ${nationality}`,
        debugText: '[ERROR: Invalid nationality]'
      });
    }
    
    const results = [];
    const debugParts = [];
    
    // Generate each flight type for this nationality
    for (const flightData of nationalityData.flights) {
      // Roll for aircraft type
      const aircraftResult = this.rollForAircraft(flightData.aircraft, `${flightData.type} Aircraft`);
      
      if (aircraftResult.error) {
        results.push({
          flightType: flightData.type,
          aircraftRoll: aircraftResult.aircraftRoll,
          text: `Error: ${aircraftResult.error}`,
          debugText: this.buildDebugText({ aircraftRollDebug: aircraftResult.aircraftRollDebug })
        });
        continue;
      }
      
      const resultText = `${flightData.flightCount} x {${flightData.flightSize}} ${aircraftResult.aircraftType}, ${flightData.type}`;
      
      results.push({
        flightType: flightData.type,
        aircraftRoll: aircraftResult.aircraftRoll,
        text: resultText,
        nationality: nationality,
        aircraftType: aircraftResult.aircraftType,
        aircraftId: aircraftResult.aircraftId,
        flightSize: flightData.flightSize,
        flightCount: flightData.flightCount,
        tasking: flightData.type,
        debugText: aircraftResult.aircraftRollDebug
      });
      
      debugParts.push(this.stripBrackets(aircraftResult.aircraftRollDebug));
    }
    
    // Combine all results (same format as NATO Table E)
    const combinedText = results.map(r => r.text).join('<br>');
    const combinedDebug = debugParts.length > 0 ? `[${debugParts.join(' | ')}]` : '';
    
    return {
      table: 'K',
      faction: 'WP',
      nationality: nationality,
      raidType: nationalityData.name,
      flightResults: results,
      flights: results,
      text: combinedText,
      result: combinedText,
      debugText: combinedDebug
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WPTableK;
}

console.log('WPTableK processor loaded');
