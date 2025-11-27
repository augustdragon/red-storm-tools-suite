/**
 * NATOTableD3 - Baltic Approaches NATO Naval Strike Raid Processor
 * 
 * Table D3: NATO Naval Strike Raid (Baltic Approaches)
 * 
 * Structure:
 * - Static raid compositions based on date and nationality
 * - Date determines available nationalities (15-31 May vs 1-15 June)
 * - Single nationality roll determines complete raid package
 * - No individual aircraft or tasking rolls - predefined flight packages
 * 
 * Flight Generation:
 * - Roll once for nationality based on date
 * - Output complete predefined raid package for that nationality
 * - Each nationality has fixed flight types, sizes, and aircraft
 */

class NATOTableD3 extends BaseTableProcessor {
  constructor(tableData) {
    super('D3', tableData);
  }

  /**
   * Process NATO Table D3 - Naval Strike Raid
   * 
   * @param {object} params - Processing parameters
   * @param {number|string} params.scenarioDate - Ordinal date (1, 2, 3) or date range string
   * @returns {object} Result object with complete raid package
   */
  process(params) {
    let { scenarioDate } = params;
    
    if (!scenarioDate) {
      return { 
        text: 'Error: Scenario date is required for Table D3',
        error: 'Missing scenario date parameter'
      };
    }

    // If scenarioDate is numeric (ordinal), convert using COMBINED_MAY mapping
    // D3 combines both May periods into '15-31 May'
    if (typeof scenarioDate === 'number' && window.BA_DATE_RANGES_COMBINED_MAY) {
      scenarioDate = window.BA_DATE_RANGES_COMBINED_MAY[scenarioDate];
    }

    // Get nationality rolls for the specified date range
    const nationalityRolls = this.tableData.nationalityRolls[scenarioDate];
    if (!nationalityRolls) {
      return {
        text: `Error: No D3 data found for date "${scenarioDate}"`,
        error: `No D3 data found for date "${scenarioDate}"`
      };
    }

    // Roll for nationality
    const nationalityResult = this.rollForNationality(nationalityRolls, `D3 Nationality (${scenarioDate})`);
    if (nationalityResult.error) {
      return {
        text: `Error: ${nationalityResult.error}`,
        error: nationalityResult.error,
        debugRolls: []
      };
    }

    // Generate complete raid package
    const raidPackage = this.generateRaidPackage(nationalityResult.nationalityData);
    
    return {
      text: raidPackage.text,
      nationality: nationalityResult.nationality,
      scenarioDate: scenarioDate,
      raidType: 'Naval Strike',
      flights: raidPackage.flights,
      debugRolls: [nationalityResult.nationalityRollDebug]
    };
  }

  /**
   * Roll for nationality based on date range
   * 
   * @param {object} nationalityRolls - Nationality roll ranges for the date
   * @param {string} rollLabel - Label for debug output
   * @returns {object} Nationality selection result
   */
  rollForNationality(nationalityRolls, rollLabel = 'Nationality') {
    const nationalityRollResult = makeDebugRoll(10, rollLabel);
    const roll = nationalityRollResult.roll;
    
    // Find matching nationality based on roll ranges
    for (const [range, nationalityData] of Object.entries(nationalityRolls)) {
      const [min, max] = parseRange(range);
      if (roll >= min && roll <= max) {
        return {
          nationalityRoll: roll,
          nationalityRollDebug: nationalityRollResult.debugEntry,
          nationality: nationalityData.nationality,
          nationalityData
        };
      }
    }
    
    return {
      nationalityRoll: roll,
      nationalityRollDebug: nationalityRollResult.debugEntry,
      nationality: null,
      nationalityData: null,
      error: `No nationality found for roll ${roll}`
    };
  }

  /**
   * Generate complete raid package for a nationality
   * 
   * @param {object} nationalityData - Nationality data with predefined flights
   * @returns {object} Complete raid package with text and flight data
   */
  generateRaidPackage(nationalityData) {
    const flights = [];
    const flightTexts = [];

    // Process each predefined flight in the raid package
    nationalityData.flights.forEach(flightDef => {
      const { type, flightSize, flightCount, aircraft } = flightDef;
      
      // Extract nationality code for display
      const nationality = this.extractNationalityCode(aircraft, nationalityData.nationality);
      
      // Generate grouped flight text like D2 format
      const flightText = `${flightCount} x {${flightSize}} ${nationality} ${aircraft}, ${type}`;
      flightTexts.push(flightText);
      
      // Create flight object for printing (represents the group)
      flights.push({
        text: flightText,
        result: flightText,
        table: 'D3',
        faction: 'NATO',
        tasking: type,
        nationality: nationality,
        aircraftType: aircraft,
        flightSize: flightSize,
        flightCount: flightCount,
        quantity: flightCount  // Number of flights in this group
      });
    });

    return {
      text: flightTexts.join('<br>'),
      flights: flights
    };
  }

  /**
   * Extract nationality code from aircraft string using database lookup
   * 
   * @param {string} aircraft - Aircraft name (may include nationality in parentheses)
   * @param {string} nationalityName - Nationality name from raid data
   * @returns {string} Nationality code for display
   */
  extractNationalityCode(aircraft, nationalityName) {
    console.log('D3 NATIONALITY DEBUG:', {
      aircraft,
      nationalityName,
      aircraftDBAvailable: !!window.aircraftNATO,
      aircraftDBKeys: window.aircraftNATO ? Object.keys(window.aircraftNATO).length : 0
    });
    
    // Check if aircraft has nationality in parentheses like "F-16A (DK)"
    const nationalityMatch = aircraft.match(/\(([^)]+)\)$/);
    if (nationalityMatch) {
      console.log('D3: Found explicit nationality in parentheses:', nationalityMatch[1]);
      return nationalityMatch[1];
    }
    
    // For multi-national raids, use aircraft database to determine nationality
    if (nationalityName === 'FRG/DK') {
      // Get aircraft data to check its nation - try multiple name variations
      const aircraftDB = window.aircraftNATO || {};
      let aircraftData = null;
      
      console.log('D3: Attempting aircraft database lookup for:', aircraft);
      
      // Try exact match first
      aircraftData = aircraftDB[aircraft];
      console.log('D3: Exact match result for "' + aircraft + '":', aircraftData);
      
      // If not found, try adding common suffixes
      if (!aircraftData) {
        const commonSuffixes = [' Draken', ' Atlantic 2'];
        for (const suffix of commonSuffixes) {
          const extendedName = aircraft + suffix;
          if (aircraftDB[extendedName]) {
            aircraftData = aircraftDB[extendedName];
            console.log('D3: Found aircraft with extended name:', extendedName, aircraftData);
            break;
          } else {
            console.log('D3: Extended name not found:', extendedName);
          }
        }
      }
      
      // If still not found, try removing common words/suffixes
      if (!aircraftData) {
        const simplifiedName = aircraft.replace(/\s+(Atlantic\s+\d+|Draken)$/i, '');
        if (simplifiedName !== aircraft && aircraftDB[simplifiedName]) {
          aircraftData = aircraftDB[simplifiedName];
          console.log('D3: Found aircraft with simplified name:', simplifiedName, aircraftData);
        } else {
          console.log('D3: Simplified name not found or same as original:', simplifiedName);
        }
      }
      
      console.log('D3: Final aircraft database lookup result for', aircraft, ':', aircraftData);
      
      if (aircraftData && aircraftData.nation) {
        // Check if the aircraft's nation matches one of the raid nations
        const raidNations = ['FRG', 'DK'];
        console.log('D3: Aircraft nation from DB:', aircraftData.nation, 'Raid nations:', raidNations);
        if (raidNations.includes(aircraftData.nation)) {
          console.log('D3: Using aircraft DB nation:', aircraftData.nation);
          return aircraftData.nation;
        }
      }
      
      // Fallback: default to FRG for FRG/DK raids
      console.log('D3: Defaulting to FRG for FRG/DK raid');
      return 'FRG';
    }
    
    // For single-nation raids, map nationality names to codes
    const nationalityMap = {
      'UK': 'UK',
      'USAF': 'US',
      'USN': 'US',
      'USMC': 'US'
    };
    
    const result = nationalityMap[nationalityName] || nationalityName;
    console.log('D3: Single-nation mapping result:', result);
    return result;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NATOTableD3;
}

console.log('NATOTableD3 processor loaded');