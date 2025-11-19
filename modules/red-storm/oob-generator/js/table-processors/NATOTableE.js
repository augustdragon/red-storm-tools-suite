/**
 * NATOTableE - NATO Combat Rescue Processor
 * 
 * Table E: NATO Combat Rescue (Search & Rescue Mission)
 * 
 * Structure:
 * - Nationality-based system (US, UK, FRG, CAN)
 * - Each nationality has 2-3 flight types with specific configurations
 * - Single roll per flight type: Aircraft only (no nation roll)
 * - Different rescue configurations by nation
 * 
 * Nationality Mapping:
 * - US: US rescue package
 * - UK/BE/NE: UK rescue package
 * - FRG: German rescue package
 * - CAN: US rescue package (Canadians use US rescue)
 * 
 * Flight Types:
 * - Rescue: Primary rescue aircraft
 * - Escort: Armed escort fighters
 * - RESCAP: Rescue Combat Air Patrol (optional, FRG only)
 */

class NATOTableE extends BaseTableProcessor {
  constructor(tableData) {
    super('E', tableData);
  }

  /**
   * Process Table E roll
   * 
   * @param {object} params
   * @param {string} params.nationality - Crew nationality (US, UK, FRG, CAN, BE, NE)
   * @returns {object} Result with all flight types for the nationality
   */
  process(params) {
    let { nationality } = params;
    
    // Handle nationality mapping
    if (nationality === 'UK' || nationality === 'BE' || nationality === 'NE') {
      nationality = 'UK';
    } else if (nationality === 'CAN') {
      nationality = 'US';
    }
    
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
        debugText: aircraftResult.aircraftRollDebug
      });
      
      debugParts.push(this.stripBrackets(aircraftResult.aircraftRollDebug));
    }
    
    // Combine all results
    const combinedText = results.map(r => r.text).join('<br>');
    const combinedDebug = debugParts.length > 0 ? `[${debugParts.join(' | ')}]` : '';
    
    return {
      nationality: nationality,
      raidType: nationalityData.name,
      flightResults: results,
      text: combinedText,
      debugText: combinedDebug
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NATOTableE;
}

console.log('NATOTableE processor loaded');
