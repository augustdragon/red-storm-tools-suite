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
   * @param {object} params - Processing parameters (no nationality param needed - it's rolled)
   * @returns {object} Result object with naval strike raid information
   */
  process(params) {
    // Roll for nationality (1-6 USSR, 7-8 GDR, 9-10 POL)
    const nationalityRoll = makeDebugRoll(10, 'J3 Nationality');
    const roll = nationalityRoll.roll;
    
    let nationality;
    if (roll <= 6) {
      nationality = 'USSR';
    } else if (roll <= 8) {
      nationality = 'GDR';
    } else {
      nationality = 'POL';
    }

    const nationalityData = this.tableData.nationalities[nationality];
    if (!nationalityData) {
      return {
        text: `Error: Unknown nationality "${nationality}" for Table J3`,
        error: `Unknown nationality "${nationality}"`
      };
    }

    const flights = [];
    const debugRolls = [nationalityRoll.debugEntry];

    // Process each flight type - roll aircraft ONCE per tasking, all flights get same aircraft
    for (const flightConfig of nationalityData.flights) {
      const { type, flightSize, flightCount, aircraft } = flightConfig;

      // Roll for aircraft TYPE once for this tasking (not per flight)
      const aircraftResult = this.rollForAircraft(aircraft, `${type} Aircraft`);
      if (aircraftResult.error) {
        return {
          text: `Error: ${aircraftResult.error}`,
          error: aircraftResult.error
        };
      }
      debugRolls.push(aircraftResult.aircraftRollDebug);

      // Create flight objects - one per line with same aircraft type
      for (let i = 0; i < flightCount; i++) {
        // Roll for ordnance per flight if this is SEAD or Naval Strike
        let ordnance = 'Air-to-Air';
        if (type === 'SEAD' || type === 'Naval Strike') {
          const ordnanceRolls = this.tableData.ordnanceRolls[type];
          if (ordnanceRolls) {
            const ordnanceResult = this.rollForOrdnance(ordnanceRolls, `${type} Flight ${i + 1} Ordnance`);
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
          aircraftType: aircraftResult.aircraftType,
          aircraftId: aircraftResult.aircraftId,
          flightSize: flightSize,
          tasking: type,
          ordnance: ordnance
        });
      }
    }

    // Format result text like D3 - one flight per line
    let resultText = `${nationality} Naval Strike Raid<br>`;
    for (const flight of flights) {
      const ordnanceDisplay = flight.ordnance && flight.ordnance !== 'Air-to-Air' && flight.ordnance !== 'None' && flight.ordnance !== 'Air-to-Air Only'
        ? ` (${flight.ordnance})`
        : '';
      resultText += `1 x {${flight.flightSize}} ${nationality} ${flight.aircraft}, ${flight.tasking}${ordnanceDisplay}<br>`;
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
