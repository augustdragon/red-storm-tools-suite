/**
 * WPTableJ2 - Baltic Approaches WP Deep Strike Raid Processor
 * 
 * Table J2: WP Deep Strike Raid (Baltic Approaches)
 * 
 * Structure:
 * - USSR only raids
 * - Four taskings: Escort Jamming, Close Escort, Deep Strike, Recon
 * - Fixed configurations: 3x{1} Escort Jamming, 3x{4} Close Escort, 6x{4} Deep Strike, 3x{1} Recon
 * - Ordnance rolls for Deep Strike flights
 * - MiG-23MLD flights have 2n defensive jamming rating
 */

class WPTableJ2 extends BaseTableProcessor {
  constructor(tableData) {
    super('J2', tableData);
  }

  /**
   * Process WP Table J2 - Deep Strike Raid
   * 
   * @param {object} params - Processing parameters (none required - USSR only)
   * @returns {object} Result object with deep strike raid information
   */
  process(params) {
    const flights = [];
    const debugRolls = [];
    const taskingOrder = ['Escort Jamming', 'Close Escort', 'Deep Strike', 'Recon'];

    // Process each tasking
    for (const taskingName of taskingOrder) {
      const taskingData = this.tableData.taskings[taskingName];
      if (!taskingData) continue;

      const { flightSize, flightCount, nations } = taskingData;
      const nationData = nations['1-10']; // USSR only

      // Generate flights for this tasking
      for (let i = 1; i <= flightCount; i++) {
        // Roll for aircraft
        const aircraftResult = this.rollForAircraft(nationData.aircraft, `${taskingName} Flight ${i} Aircraft`);
        if (aircraftResult.error) {
          return {
            text: `Error: ${aircraftResult.error}`,
            error: aircraftResult.error
          };
        }

        // Roll for ordnance if this is Deep Strike
        let ordnance = taskingName === 'Deep Strike' ? 'Bombs' : 'Air-to-Air';
        if (taskingName === 'Deep Strike') {
          const ordnanceRolls = this.tableData.ordnanceRolls['Deep Strike'];
          if (ordnanceRolls) {
            const ordnanceResult = this.rollForOrdnance(ordnanceRolls, `${taskingName} Flight ${i} Ordnance`);
            if (ordnanceResult.error) {
              return {
                text: `Error: ${ordnanceResult.error}`,
                error: ordnanceResult.error
              };
            }
            ordnance = ordnanceResult.ordnanceType;
            debugRolls.push(ordnanceResult.ordnanceRollDebug);
          }
        } else if (taskingName === 'Escort Jamming') {
          ordnance = 'Jamming';
        } else if (taskingName === 'Recon') {
          ordnance = 'Air-to-Air Only';
        }

        flights.push({
          faction: 'WP',
          nationality: 'USSR',
          aircraft: aircraftResult.aircraftType,
          flightSize: flightSize,
          tasking: taskingName === 'Deep Strike' ? 'Bombing' : taskingName,
          ordnance: ordnance,
          sourceTable: 'J'
        });

        debugRolls.push(aircraftResult.aircraftRollDebug);
      }
    }

    // Format result text
    let resultText = `USSR Deep Strike Raid<br>`;
    let currentTasking = '';
    for (const flight of flights) {
      if (flight.tasking !== currentTasking) {
        currentTasking = flight.tasking;
        const taskingFlights = flights.filter(f => f.tasking === currentTasking);
        const displayTasking = currentTasking === 'Bombing' ? 'Deep Strike' : currentTasking;
        resultText += `<br>${taskingFlights.length} x {${flight.flightSize}} [${displayTasking}], ${currentTasking}<br>`;
      }
      // Format: Aircraft (Ordnance) - matches RS table J format
      // Show ordnance for Deep Strike (except plain 'Bombs'), Jamming, and Recon
      if (flight.ordnance && flight.ordnance !== 'Air-to-Air' && flight.ordnance !== 'Bombs') {
        resultText += `${flight.aircraft} (${flight.ordnance})<br>`;
      } else {
        resultText += `${flight.aircraft}<br>`;
      }
    }

    return {
      text: resultText,
      result: this.tableData.result,
      table: 'J2',
      tableName: this.tableData.name,
      faction: 'WP',
      nationality: 'USSR',
      flights: flights,
      debugRolls: debugRolls,
      ordnanceNote: this.tableData.ordnanceNote || null,
      additionalNote: this.tableData.additionalNote || null
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
  module.exports = WPTableJ2;
}

console.log('WPTableJ2 processor loaded');