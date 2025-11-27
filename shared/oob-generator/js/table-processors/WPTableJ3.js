/**
 * WPTableJ3 - Baltic Approaches WP Naval Strike Raid Processor
 * 
 * Table J3: WP Naval Strike Raid (Baltic Approaches)
 * 
 * Structure:
 * - Nationality-based system (USSR, GDR, POL)
 * - Each nationality has flights array with Maritime Patrol, SEAD, Naval Strike, Recon
 * - Ordnance rolls for SEAD and Naval Strike
 * 
 * Nationalities:
 * - USSR: 1x{1} Maritime Patrol, 2x{4} SEAD, 4x{4} Naval Strike, 3x{1} Recon
 * - GDR: 1x{1} Maritime Patrol, 2x{4} SEAD, 4x{4} Naval Strike, 2x{1} Recon
 * - POL: 1x{1} Maritime Patrol, 2x{4} SEAD, 4x{4} Naval Strike, 2x{1} Recon
 */

class WPTableJ3 extends BaseTableProcessor {
  constructor(tableData) {
    super('J3', tableData);
  }

  /**
   * Process WP Table J3 - Naval Strike Raid
   * 
   * @param {object} params - Processing parameters
   * @param {string} params.nationality - Raid nationality (USSR, GDR, POL)
   * @returns {object} Result object with naval strike raid information
   */
  process(params) {
    const { nationality } = params;
    
    if (!nationality) {
      return { 
        text: 'Error: Nationality is required for Table J3',
        error: 'Missing nationality parameter'
      };
    }

    const nationalityData = this.tableData.nationalities[nationality];
    if (!nationalityData) {
      return {
        text: `Error: Unknown nationality "${nationality}" for Table J3`,
        error: `Unknown nationality "${nationality}"`
      };
    }

    const flights = [];
    const debugRolls = [];

    // Process each flight type
    for (const flightConfig of nationalityData.flights) {
      const { type, flightSize, flightCount, aircraft } = flightConfig;

      // Generate flights for this type
      for (let i = 1; i <= flightCount; i++) {
        // Roll for aircraft
        const aircraftResult = this.rollForAircraft(aircraft, `${type} Flight ${i} Aircraft`);
        if (aircraftResult.error) {
          return {
            text: `Error: ${aircraftResult.error}`,
            error: aircraftResult.error
          };
        }

        // Roll for ordnance if this is SEAD or Naval Strike
        let ordnance = 'Air-to-Air';
        if (type === 'SEAD' || type === 'Naval Strike') {
          const ordnanceRolls = this.tableData.ordnanceRolls[type];
          if (ordnanceRolls) {
            const ordnanceResult = this.rollForOrdnance(ordnanceRolls, `${type} Flight ${i} Ordnance`);
            if (ordnanceResult.error) {
              return {
                text: `Error: ${ordnanceResult.error}`,
                error: ordnanceResult.error
              };
            }
            ordnance = ordnanceResult.ordnanceType;
            debugRolls.push(ordnanceResult.ordnanceRollDebug);
          }
        } else if (type === 'Maritime Patrol') {
          ordnance = 'None';
        } else if (type === 'Recon') {
          ordnance = 'Air-to-Air Only';
        }

        flights.push({
          faction: 'WP',
          nationality: nationality,
          aircraft: aircraftResult.aircraftType,
          flightSize: flightSize,
          tasking: type,
          ordnance: ordnance
        });

        debugRolls.push(aircraftResult.aircraftRollDebug);
      }
    }

    // Format result text
    let resultText = `${nationality} Naval Strike Raid<br>`;
    let currentTasking = '';
    for (const flight of flights) {
      if (flight.tasking !== currentTasking) {
        currentTasking = flight.tasking;
        const taskingFlights = flights.filter(f => f.tasking === currentTasking);
        resultText += `<br>${taskingFlights.length} x {${flight.flightSize}} [${currentTasking}], ${currentTasking}<br>`;
      }
      if (flight.ordnance && flight.ordnance !== 'Air-to-Air' && flight.ordnance !== 'None') {
        resultText += `${flight.nationality}: ${flight.aircraft} (${flight.ordnance})<br>`;
      } else {
        resultText += `${flight.nationality}: ${flight.aircraft}<br>`;
      }
    }

    return {
      text: resultText,
      result: nationalityData.result,
      table: 'J3',
      tableName: this.tableData.name,
      faction: 'WP',
      nationality: nationality,
      flights: flights,
      debugRolls: debugRolls,
      ordnanceNote: this.tableData.ordnanceNote || null
    };
  }

  /**
   * Roll for ordnance availability
   */
  rollForOrdnance(ordnanceRolls, rollName) {
    const roll = makeDebugRoll(10, rollName);
    const rollValue = roll.roll;

    // Find matching ordnance range
    for (const [range, ordnanceType] of Object.entries(ordnanceRolls)) {
      const [min, max] = this.parseRange(range);
      if (rollValue >= min && rollValue <= max) {
        return {
          ordnanceType: ordnanceType,
          ordnanceRoll: rollValue,
          ordnanceRollDebug: roll.debug
        };
      }
    }

    return {
      error: `No ordnance found for roll ${rollValue}`,
      ordnanceRoll: rollValue,
      ordnanceRollDebug: roll.debug
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WPTableJ3;
}

console.log('WPTableJ3 processor loaded');
