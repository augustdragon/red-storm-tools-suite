/**
 * NATOTableE2 - Baltic Approaches NATO Combat Rescue Processor
 * 
 * Table E2: NATO Combat Rescue (Baltic Approaches)
 * 
 * Structure:
 * - Nationality-based system (FRG, DK, SE)
 * - Each nationality has specific flight configurations
 * - Aircraft determination varies by flight type
 * - FRG has both Rescue Support and CSAR flights
 * - DK and SE have only CSAR flights
 * 
 * Nationality Mapping:
 * - FRG: German rescue package (Rescue Support + CSAR)
 * - DK: Danish rescue package (CSAR only)
 * - SE: Swedish rescue package (CSAR only)
 * 
 * Special Rules:
 * - CSAR flights for FRG vary by hex type (land/sea)
 * - Nationality determined by downed crew location
 */

class NATOTableE2 extends BaseTableProcessor {
  constructor(tableData) {
    super('E2', tableData);
  }

  /**
   * Process NATO Table E2 - Combat Rescue
   * 
   * @param {object} params - Processing parameters
   * @param {string} params.nationality - Crew nationality (FRG, DK, SE)
   * @param {string} [params.hexType] - Hex type for FRG CSAR ("land" or "sea")
   * @returns {object} Result object with rescue flight information
   */
  process(params) {
    const { nationality, hexType } = params;
    
    if (!nationality) {
      return {
        text: 'Error: Nationality is required for Table E2',
        error: 'Missing nationality parameter',
        setupNote: this.tableData.setupEntry?.text || null
      };
    }

    const nationalityData = this.tableData.nationalities[nationality];
    if (!nationalityData) {
      return {
        text: `Error: Unknown nationality "${nationality}" for Table E2`,
        error: 'Invalid nationality',
        setupNote: this.tableData.setupEntry?.text || null
      };
    }

    const results = [];
    const debugRolls = [];

    try {
      // Process each flight type for this nationality
      for (const flightData of nationalityData.flights) {
        const flightResult = this.processFlightType(flightData, nationality, hexType);
        if (flightResult.error) {
          throw new Error(`${flightData.type}: ${flightResult.error}`);
        }
        results.push(flightResult);
        debugRolls.push(...flightResult.debugRolls);
      }
    } catch (error) {
      return {
        text: `Error processing E2 rescue: ${error.message}`,
        error: error.message
      };
    }

    // Combine results
    const resultText = results.map(r => r.text).join('<br>');

    return {
      text: resultText,
      result: resultText,
      table: 'E2',
      faction: 'NATO',
      nationality: nationality,
      missionType: 'Combat Rescue',
      flights: results,
      debugRolls: debugRolls,
      ordnanceNote: this.tableData.ordnanceNote || null,
      setupNote: this.tableData.setupEntry?.text || null
    };
  }

  /**
   * Process a single flight type
   * 
   * @param {object} flightData - Flight configuration data
   * @param {string} nationality - Nationality code
   * @param {string} hexType - Hex type for special cases
   * @returns {object} Flight result
   */
  processFlightType(flightData, nationality, hexType) {
    const { type, flightSize, flightCount, aircraft, description } = flightData;

    // Handle special aircraft determination for FRG CSAR
    if (type === 'CSAR' && nationality === 'FRG' && aircraft.land && aircraft.sea) {
      if (!hexType) {
        return {
          error: 'Hex type (land/sea) required for FRG CSAR flights'
        };
      }
      
      const aircraftType = hexType === 'sea' ? aircraft.sea : aircraft.land;
      const flightText = `${flightCount} x {${flightSize}} ${aircraftType}, ${type}`;
      
      return {
        text: flightText,
        type: type,
        nationality: nationality,
        aircraftType: aircraftType,
        flightSize: flightSize,
        flightCount: flightCount,
        hexType: hexType,
        debugRolls: [`${type} Aircraft: ${hexType} hex -> ${aircraftType}`]
      };
    }

    // Handle standard aircraft roll
    if (aircraft && typeof aircraft === 'object' && !aircraft.land && !aircraft.sea) {
      const aircraftResult = this.rollForAircraft(aircraft, `${type} Aircraft`);
      if (aircraftResult.error) {
        return { error: aircraftResult.error };
      }

      const flightText = `${flightCount} x {${flightSize}} ${aircraftResult.aircraftType}, ${type}`;
      
      return {
        text: flightText,
        type: type,
        nationality: nationality,
        aircraftType: aircraftResult.aircraftType,
        flightSize: flightSize,
        flightCount: flightCount,
        debugRolls: [aircraftResult.aircraftRollDebug]
      };
    }

    // Handle direct aircraft assignment (DK, SE CSAR)
    if (typeof aircraft === 'object' && aircraft['1-10']) {
      const aircraftResult = this.rollForAircraft(aircraft, `${type} Aircraft`);
      if (aircraftResult.error) {
        return { error: aircraftResult.error };
      }

      const flightText = `${flightCount} x {${flightSize}} ${aircraftResult.aircraftType}, ${type}`;
      
      return {
        text: flightText,
        type: type,
        nationality: nationality,
        aircraftType: aircraftResult.aircraftType,
        flightSize: flightSize,
        flightCount: flightCount,
        debugRolls: [aircraftResult.aircraftRollDebug]
      };
    }

    return {
      error: `Unknown aircraft configuration for ${type} flight`
    };
  }
}