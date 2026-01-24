/**
 * WPTableI - Warsaw Pact Bombing Raid Processor
 * 
 * Table I: Warsaw Pact Bombing Raid (Offensive Mission)
 * 
 * Structure:
 * - Nationality-based system (USSR vs GDR)
 * - Three-tasking system: Close Escort, SEAD, Bombing
 * - Nationality roll (1-8 USSR, 9-10 GDR) then aircraft roll per tasking
 * - SEAD and Bombing get individual ordnance rolls, Close Escort does not
 * - Different ordnance tables for USSR vs GDR
 * 
 * Flight Configuration (by nationality):
 * - USSR: Close Escort (4x4), SEAD (2x4), Bombing (4x4)
 * - GDR: Close Escort (4x4), SEAD (2x4), Bombing (4x4)
 * 
 * Ordnance Tables:
 * - USSR: 1-5 Bombs/CBU/Rockets, 6-7 +EOGM/ARM, 8-10 +EOGB/LGB
 * - GDR: 1-6 Bombs/CBU/Rockets, 7-10 +EOGM
 * 
 * Modifiers:
 * - Su-17M4, MiG-27K: +1 to ordnance roll
 * - Su-24: +2 to ordnance roll
 * - SEAD flights: Always add "+ ARM"
 */

class WPTableI extends BaseTableProcessor {
  constructor(tableData) {
    super('I', tableData);
  }

  /**
   * Calculate ordnance availability for Table I (nationality-specific)
   * 
   * @param {number} roll - Base ordnance roll (1-10)
   * @param {string} nationality - USSR or GDR
   * @param {string} aircraftType - Aircraft type for modifiers
   * @param {string} tasking - Mission tasking type
   * @returns {string} Ordnance description
   */
  getOrdnanceAvailability(roll, nationality, aircraftType, tasking) {
    // GDR Note E: MiG-21 variants can only carry Bombs/CBU/Rockets
    // This prevents advanced ordnance (EOGM, ARM, LGB, EOGB) from being rolled
    // Only applies to air-to-ground taskings (SEAD, Bombing)
    // Return with Note E text to remind players of the restriction
    if (nationality === 'GDR' && aircraftType.includes('MiG-21') && (tasking === 'SEAD' || tasking === 'Bombing')) {
      return "Bombs/CBU/Rockets (Note E: Only Bombs, AT CBU, or Rockets)";
    }
    
    // Apply aircraft-specific modifiers
    let modifiedRoll = roll;
    
    if (aircraftType.includes('Su-17M4') || aircraftType.includes('MiG-27K')) {
      modifiedRoll += 1;
    } else if (aircraftType.includes('Su-24')) {
      modifiedRoll += 2;
    }
    
    // Cap at 10
    modifiedRoll = Math.min(modifiedRoll, 10);
    
    // Determine ordnance based on nationality and modified roll
    let ordnance;
    if (nationality === 'USSR') {
      if (modifiedRoll <= 5) {
        ordnance = "Bombs/CBU/Rockets";
      } else if (modifiedRoll <= 7) {
        ordnance = "Bombs/CBU/Rockets + EOGM/ARM";
      } else {
        ordnance = "Bombs/CBU/Rockets + EOGM/ARM + EOGB/LGB";
      }
    } else { // GDR
      if (modifiedRoll <= 6) {
        ordnance = "Bombs/CBU/Rockets";
      } else {
        ordnance = "Bombs/CBU/Rockets + EOGM";
      }
    }
    
    // SEAD flights always get ARM
    if (tasking === 'SEAD') {
      ordnance += " + ARM";
    }
    
    return ordnance;
  }

  /**
   * Process a single tasking
   * 
   * @param {string} taskingName - The tasking type
   * @param {object} taskingData - Tasking configuration
   * @param {string} nationality - USSR or GDR
   * @returns {object} Tasking result
   */
  processTasking(taskingName, taskingData, nationality) {
    // Roll for aircraft
    const aircraftResult = this.rollForAircraft(taskingData.aircraft, `${taskingName} Aircraft`);
    
    if (aircraftResult.error) {
      return {
        tasking: taskingName,
        text: `Error: ${aircraftResult.error}`,
        debugText: this.buildDebugText({ aircraftRollDebug: aircraftResult.aircraftRollDebug })
      };
    }
    
    // Handle sub-rolls for aircraft variants
    let finalAircraftType = aircraftResult.aircraftType;
    let finalAircraftId = aircraftResult.aircraftId;
    let subRollDebug = null;
    
    if (aircraftResult.aircraftType.includes('²') || aircraftResult.aircraftType.includes('¹')) {
      const subRollResult = makeDebugRoll(10, `${taskingName} Sub-roll`);
      
      if (aircraftResult.aircraftType.includes('MiG-23²')) {
        if (subRollResult.roll <= 4) finalAircraftType = 'MiG-23M';
        else if (subRollResult.roll <= 8) finalAircraftType = 'MiG-23MF';
        else finalAircraftType = 'MiG-23ML';
        finalAircraftId = null;
      } else if (aircraftResult.aircraftType.includes('MiG-23MF/ML¹')) {
        finalAircraftType = subRollResult.roll <= 5 ? 'MiG-23MF' : 'MiG-23ML';
      finalAircraftId = null;
      }
      
      subRollDebug = subRollResult.debugEntry;
    }
    
    let resultText = '';
    let ordnanceDebug = [];
    
    // Handle ordnance based on tasking type
    if (taskingName === 'Close Escort') {
      // Close Escort: No ordnance, grouped
      resultText = `${taskingData.flightCount} x {${taskingData.flightSize}} ${nationality} ${finalAircraftType}, ${taskingName}`;
    } else if (taskingName === 'SEAD' || taskingName === 'Bombing') {
      // SEAD and Bombing: Individual ordnance rolls per flight
      const individualFlights = [];
      
      for (let i = 1; i <= taskingData.flightCount; i++) {
        const ordnanceRollResult = makeDebugRoll(10, `${taskingName} Flight ${i} Ordnance`);
        const ordnance = this.getOrdnanceAvailability(
          ordnanceRollResult.roll,
          nationality,
          finalAircraftType,
          taskingName
        );
        
        ordnanceDebug.push(`Flight ${i} Ordnance: ${ordnanceRollResult.roll}`);
        individualFlights.push(`1 x {${taskingData.flightSize}} ${nationality} ${finalAircraftType}, ${taskingName} (${ordnance})`);
      }
      
      resultText = individualFlights.join('<br>');
    }
    
    // Build debug text for this tasking
    let taskingDebugText = `[${taskingName}: ${this.stripBrackets(aircraftResult.aircraftRollDebug)} → ${finalAircraftType}`;
    
    if (subRollDebug) {
      taskingDebugText += ` | ${this.stripBrackets(subRollDebug)} → ${finalAircraftType}`;
    }
    
    if (ordnanceDebug.length > 0) {
      taskingDebugText += ` | ${ordnanceDebug.join(' | ')}`;
    }
    
    taskingDebugText += ']';
    
    return {
      tasking: taskingName,
      nationality: nationality,
      aircraftType: finalAircraftType,
      aircraftId: finalAircraftId,
      flightSize: taskingData.flightSize,
      flightCount: taskingData.flightCount,
      text: resultText,
      debugText: taskingDebugText
    };
  }

  /**
   * Process Table I roll (nationality, then all taskings)
   * 
   * @param {object} params - (No parameters needed for Table I)
   * @returns {object} Combined result from all taskings
   */
  process(params) {
    // Roll for nationality: 1-8 USSR, 9-10 GDR
    const nationalityRollResult = makeDebugRoll(10, 'Nationality');
    const nationalityRoll = nationalityRollResult.roll;
    
    const selectedNationality = nationalityRoll <= 8 ? 'USSR' : 'GDR';
    
    const nationalityData = this.tableData.nationalities[selectedNationality];
    
    if (!nationalityData) {
      return this.formatResult({
        nationRoll: nationalityRoll,
        text: `Error: Unknown nationality ${selectedNationality}`,
        debugText: this.buildDebugText({ nationRollDebug: nationalityRollResult.debugEntry })
      });
    }
    
    const results = [];
    
    // Process each tasking (Close Escort, SEAD, Bombing)
    for (const [taskingName, taskingData] of Object.entries(nationalityData.taskings)) {
      const taskingResult = this.processTasking(taskingName, taskingData, selectedNationality);
      results.push(taskingResult);
    }
    
    // Combine all results
    const combinedText = results.map(r => r.text).join('<br>');
    const taskingDebug = results.map(r => r.debugText).filter(Boolean).join(' ');
    const combinedDebug = `[Nationality: ${this.stripBrackets(nationalityRollResult.debugEntry)} → ${selectedNationality}] ${taskingDebug}`;
    
    return {
      taskingResults: results,
      text: combinedText,
      debugText: combinedDebug
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WPTableI;
}

console.log('WPTableI processor loaded');
