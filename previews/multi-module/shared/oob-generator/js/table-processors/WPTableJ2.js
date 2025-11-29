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
    const taskingResults = [];
    const flights = [];
    const debugRolls = [];
    const taskingOrder = ['Escort Jamming', 'Close Escort', 'Deep Strike', 'Recon'];

    // Process each tasking (one aircraft roll per tasking)
    for (const taskingName of taskingOrder) {
      const taskingData = this.tableData.taskings[taskingName];
      if (!taskingData) continue;

      const { flightSize, flightCount, nations } = taskingData;
      const nationData = nations['1-10']; // USSR only

      // Roll for aircraft ONCE per tasking
      const aircraftResult = this.rollForAircraft(nationData.aircraft, `${taskingName} Aircraft`);
      if (aircraftResult.error) {
        return {
          text: `Error: ${aircraftResult.error}`,
          error: aircraftResult.error
        };
      }

      const aircraftType = aircraftResult.aircraftType;
      debugRolls.push(aircraftResult.aircraftRollDebug);

      // Determine ordnance and build individual flight records
      const flightLines = [];
      for (let i = 1; i <= flightCount; i++) {
        let ordnance = 'Air-to-Air';
        
        if (taskingName === 'Escort Jamming') {
          ordnance = 'Jamming';
        } else if (taskingName === 'Recon') {
          ordnance = 'Air-to-Air Only';
        } else if (taskingName === 'Deep Strike') {
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
        }
        
        // Build flight record for flight sheet generation
        flights.push({
          faction: 'WP',
          nationality: 'USSR',
          aircraft: aircraftType,
          flightSize: flightSize,
          tasking: taskingName === 'Deep Strike' ? 'Bombing' : taskingName,
          ordnance: ordnance,
          sourceTable: 'J2'
        });

        // Build individual flight line with ordnance display
        const taskingDisplay = taskingName === 'Deep Strike' ? 'Bombing' : taskingName;
        const ordnanceDisplay = ordnance && ordnance !== 'Air-to-Air' && ordnance !== 'Jamming' && ordnance !== 'Air-to-Air Only'
          ? ` (${ordnance})`
          : '';
        const flightLine = `1 x {${flightSize}} USSR ${aircraftType}, ${taskingDisplay}${ordnanceDisplay}`;
        flightLines.push(flightLine);
      }

      // Add all flight lines to results
      flightLines.forEach(line => {
        taskingResults.push({
          tasking: taskingName === 'Deep Strike' ? 'Bombing' : taskingName,
          text: line
        });
      });
    }

    // Combine all results with line breaks (like RS Table J)
    const combinedText = taskingResults.map(r => r.text).join('<br>');

    return {
      text: combinedText,
      result: this.tableData.result,
      table: 'J2',
      tableName: this.tableData.name,
      faction: 'WP',
      nationality: 'USSR',
      taskings: taskingResults,
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