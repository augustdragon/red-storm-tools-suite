/**
 * NATOTableF - NATO Special Missions Processor
 * 
 * Table F: NATO Special Missions (Specialized Support Roles)
 * 
 * Structure:
 * - Mission-type based system (Fast FAC, Standoff Jamming, Tactical Recon)
 * - Two-roll system: Nation → Aircraft
 * - Each mission type has different nation distributions and aircraft options
 * - Fixed flight configurations per mission type
 * 
 * Mission Types:
 * - Fast FAC: Forward Air Controller (2 x 2-ship flights)
 * - Standoff Jamming: Electronic warfare (2 x 2-ship flights)
 * - Tactical Recon: Reconnaissance (2 x 1-ship flights)
 */

class NATOTableF extends BaseTableProcessor {
  constructor(tableData) {
    super('F', tableData);
  }

  /**
   * Process Table F roll
   * 
   * @param {object} params
   * @param {string} params.missionType - Mission type (Fast FAC, Standoff Jamming, Tactical Recon)
   * @returns {object} Result with nation, aircraft, and formatted text
   */
  process(params) {
    const { missionType } = params;
    
    const missionData = this.tableData.missionTypes[missionType];
    
    if (!missionData) {
      return this.formatResult({
        text: `Error: Unknown mission type ${missionType}`,
        debugText: '[ERROR: Invalid mission type]'
      });
    }
    
    // Roll for nation
    const nationResult = this.rollForNation(missionData.nations, 'Nation');
    
    if (nationResult.error) {
      return this.formatResult({
        nationRoll: nationResult.nationRoll,
        text: `Error: ${nationResult.error}`,
        debugText: this.buildDebugText({ nationRollDebug: nationResult.nationRollDebug })
      });
    }
    
    // Roll for aircraft
    const aircraftResult = this.rollForAircraft(nationResult.nationData.aircraft, 'Aircraft');
    
    if (aircraftResult.error) {
      return this.formatResult({
        nationRoll: nationResult.nationRoll,
        aircraftRoll: aircraftResult.aircraftRoll,
        nationName: nationResult.nationName,
        text: `Error: ${aircraftResult.error}`,
        debugText: this.buildDebugText({
          nationRollDebug: nationResult.nationRollDebug,
          aircraftRollDebug: aircraftResult.aircraftRollDebug
        })
      });
    }
    
    // Format result text with mission-specific configuration
    const resultText = `${missionData.flightCount} x {${missionData.flightSize}} ${nationResult.nationName} ${aircraftResult.aircraftType}, ${missionType}`;
    
    // Build debug text
    const debugText = this.buildDebugText({
      nationRollDebug: nationResult.nationRollDebug,
      aircraftRollDebug: aircraftResult.aircraftRollDebug
    });
    
    return this.formatResult({
      missionType: missionType,
      nationRoll: nationResult.nationRoll,
      aircraftRoll: aircraftResult.aircraftRoll,
      nationName: nationResult.nationName,
      nationality: nationResult.nationName,
      flightSize: missionData.flightSize,
      flightCount: missionData.flightCount,
      tasking: missionType,
      text: resultText,
      debugText: debugText
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NATOTableF;
}

console.log('NATOTableF processor loaded');
