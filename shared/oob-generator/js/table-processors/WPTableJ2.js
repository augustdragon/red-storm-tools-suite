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

      // Group flights like RS Table J (no ordnance display per rules)
      const taskingDisplay = taskingName === 'Deep Strike' ? 'Bombing' : taskingName;
      const groupedText = `${flightCount} x {${flightSize}} USSR ${aircraftType}, ${taskingDisplay}`;
      
      taskingResults.push({
        tasking: taskingDisplay,
        text: groupedText,
        nationality: 'USSR',
        aircraftType: aircraftType,
        aircraftId: aircraftResult.aircraftId,
        flightSize: flightSize,
        flightCount: flightCount
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
      debugRolls: debugRolls,
      ordnanceNote: this.tableData.ordnanceNote || null,
      additionalNote: this.tableData.additionalNote || null
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WPTableJ2;
}

console.log('WPTableJ2 processor loaded');
