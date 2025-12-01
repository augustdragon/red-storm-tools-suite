/**
 * WPTableI2 - Baltic Approaches WP Bombing Raid Processor
 * 
 * Table I2: WP Bombing Raid (Baltic Approaches)
 * 
 * Structure:
 * - Roll for nationality first (1-4 GDR, 5-8 POL, 9-10 USSR)
 * - Each nationality has three taskings: Close Escort, SEAD, Bombing
 * - Fixed flight configurations per nationality
 * - Ordnance rolls for SEAD and Bombing flights
 * 
 * Nationalities:
 * - GDR: 3x{4} Close Escort, 2x{4} SEAD, 5x{4} Bombing
 * - POL: 3x{4} Close Escort, 2x{4} SEAD, 5x{4} Bombing
 * - USSR: 3x{4} Close Escort, 2x{4} SEAD, 5x{4} Bombing
 */

class WPTableI2 extends BaseTableProcessor {
  constructor(tableData) {
    super('I2', tableData);
  }

  /**
   * Process WP Table I2 - Bombing Raid
   * 
   * @param {object} params - Processing parameters (none required)
   * @returns {object} Result object with bombing raid information
   */
  process(params) {
    // Roll for nationality: 1-4 GDR, 5-8 POL, 9-10 USSR
    const nationalityRoll = this.rollDie(10);
    let nationality;
    
    if (nationalityRoll <= 4) {
      nationality = 'GDR';
    } else if (nationalityRoll <= 8) {
      nationality = 'POL';
    } else {
      nationality = 'USSR';
    }

    const nationalityData = this.tableData.nationalities[nationality];
    if (!nationalityData) {
      return {
        text: `Error: Unknown nationality "${nationality}" for Table I2`,
        error: `Unknown nationality "${nationality}"`
      };
    }

    const flights = [];
    const debugRolls = [`Raid Nationality: ${nationalityRoll} → ${nationality}`];
    const taskingOrder = ['Close Escort', 'SEAD', 'Bombing'];

    // Process each tasking
    for (const taskingName of taskingOrder) {
      const taskingData = nationalityData.taskings[taskingName];
      if (!taskingData) continue;

      const { flightSize, flightCount, aircraft } = taskingData;

      // Roll for aircraft ONCE per tasking (all flights use same aircraft type)
      const aircraftResult = this.rollForAircraft(aircraft, `${taskingName} Aircraft`);
      if (aircraftResult.error) {
        return {
          text: `Error: ${aircraftResult.error}`,
          error: aircraftResult.error
        };
      }
      
      const aircraftType = aircraftResult.aircraftType;
      debugRolls.push(aircraftResult.aircraftRollDebug);

      // Generate flights for this tasking (all use same aircraft type)
      for (let i = 1; i <= flightCount; i++) {
        // Roll for ordnance if this is SEAD or Bombing
        let ordnance = 'Air-to-Air';
        if (taskingName === 'SEAD' || taskingName === 'Bombing') {
          const ordnanceRolls = nationalityData.ordnanceRolls[taskingName];
          if (ordnanceRolls) {
            // Check for Note E restriction (GDR/POL MiG-21 variants can only carry basic ordnance)
            if ((nationality === 'GDR' || nationality === 'POL') && aircraftType.includes('MiG-21')) {
              ordnance = "Bombs/CBU/Rockets";
            } else {
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
        }

        flights.push({
          faction: 'WP',
          nationality: nationality,
          aircraft: aircraftType,
          flightSize: flightSize,
          tasking: taskingName,
          ordnance: ordnance
        });
      }
    }

    // Format result text to match RS Table I style
    const resultLines = [];
    //resultLines.push(`${nationality} Bombing Raid`);
    
    // Build tasking results for flight sheet compatibility
    const taskingResults = [];
    
    for (const taskingName of taskingOrder) {
      const taskingFlights = flights.filter(f => f.tasking === taskingName);
      if (taskingFlights.length === 0) continue;
      
      const flightSize = taskingFlights[0].flightSize;
      
      if (taskingName === 'Close Escort') {
        // Close Escort: Grouped format like RS for display
        const aircraftList = taskingFlights.map(f => f.aircraft).join(', ');
        resultLines.push(`1 x {${flightSize}} ${nationality} ${aircraftList}, ${taskingName}`);
        
        // Add individual flights to taskings array for flight sheet generation
        for (const flight of taskingFlights) {
          taskingResults.push({
            tasking: taskingName,
            text: `1 x {${flightSize}} ${nationality} ${flight.aircraft}, ${taskingName}`,
            nationality: nationality,
            aircraftType: flight.aircraft,
            flightSize: flightSize,
            flightCount: 1
          });
        }
      } else {
        // SEAD and Bombing: Individual flights with ordnance, nationality prefix like Table C
        for (const flight of taskingFlights) {
          const flightText = flight.ordnance && flight.ordnance !== 'Air-to-Air' 
            ? `1 x {${flight.flightSize}} ${flight.nationality} ${flight.aircraft}, ${taskingName} (${flight.ordnance})`
            : `1 x {${flight.flightSize}} ${flight.nationality} ${flight.aircraft}, ${taskingName}`;
          
          resultLines.push(flightText);
          
          // Add each individual flight to taskings array
          taskingResults.push({
            tasking: taskingName,
            text: flightText,
            nationality: flight.nationality,
            aircraftType: flight.aircraft,
            flightSize: flight.flightSize,
            flightCount: 1,
            ordnance: flight.ordnance
          });
        }
      }
    }
    
    const resultText = resultLines.join('<br>');

    return {
      text: resultText,
      result: nationalityData.result,
      table: 'I2',
      tableName: this.tableData.name,
      faction: 'WP',
      nationality: nationality,
      raidType: 'Bombing',
      taskings: taskingResults,
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
  module.exports = WPTableI2;
}

console.log('WPTableI2 processor loaded');