/**
 * WPTableL - Warsaw Pact Special Missions Processor
 * 
 * Table L: Warsaw Pact Special Missions (Specialized Support Roles)
 * 
 * Structure:
 * - Mission-type based system (Standoff Jamming, Tactical Recon)
 * - Two-roll system: Nation → Aircraft
 * - Each mission type has different nation distributions and aircraft options
 * - Fixed flight configurations per mission type
 * - Similar to NATO Table F but for Warsaw Pact
 * 
 * Mission Types:
 * - Standoff Jamming: Electronic warfare (2 x 2-ship flights)
 * - Tactical Recon: Reconnaissance missions (varies by nation selection)
 */

class WPTableL extends BaseTableProcessor {
  constructor(tableData) {
    super('L', tableData);
  }

  /**
   * Process Table L roll
   * 
   * @param {object} params
   * @param {string} params.missionType - Mission type (Standoff Jamming, Tactical Recon)
   * @param {string} params.tacticalReconNation - For Tactical Recon, the selected nation (optional)
   * @returns {object} Result with nation, aircraft, and formatted text
   */
  process(params) {
    let { missionType, tacticalReconNation } = params;
    
    // Handle Tactical Recon mission type with specific nation selection
    if (missionType && missionType.includes('|')) {
      const parts = missionType.split('|');
      missionType = parts[0];
      tacticalReconNation = parts[1];
    }
    
    const missionData = this.tableData.missionTypes ? this.tableData.missionTypes[missionType] : null;
    
    if (!missionData) {
      return this.formatResult({
        text: `Error: Unknown mission type ${missionType}`,
        debugText: '[ERROR: Invalid mission type]'
      });
    }
    
    // For Tactical Recon with specific nation, skip nation roll
    if (missionType === 'Tactical Recon' && tacticalReconNation) {
      // Tactical Recon uses nationData structure, not nations structure
      const nationData = missionData.nationData ? missionData.nationData[tacticalReconNation] : null;
      
      if (!nationData) {
        return this.formatResult({
          text: `Error: Nation ${tacticalReconNation} not found for Tactical Recon. Available: ${Object.keys(missionData.nationData || {}).join(', ')}`,
          debugText: '[ERROR: Invalid nation]'
        });
      }
      
      // Roll for aircraft only
      const aircraftResult = this.rollForAircraft(nationData.aircraft, 'Aircraft');
      
      if (aircraftResult.error) {
        return this.formatResult({
          aircraftRoll: aircraftResult.aircraftRoll,
          nationName: tacticalReconNation,
          text: `Error: ${aircraftResult.error}`,
          debugText: this.buildDebugText({ aircraftRollDebug: aircraftResult.aircraftRollDebug })
        });
      }
      
      const resultText = `${tacticalReconNation}: ${missionData.flightCount} x {${missionData.flightSize}} ${aircraftResult.aircraftType}, ${missionType}`;
      
      return this.formatResult({
        missionType: missionType,
        nationRoll: null,
        aircraftRoll: aircraftResult.aircraftRoll,
        nationName: tacticalReconNation,
        nationality: tacticalReconNation,
        flightSize: missionData.flightSize,
        flightCount: missionData.flightCount,
        tasking: missionType,
        text: resultText,
        debugText: this.buildDebugText({ aircraftRollDebug: aircraftResult.aircraftRollDebug })
      });
    }
    
    // Standard processing: Roll for nation
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
    const resultText = `${nationResult.nationName}: ${missionData.flightCount} x {${missionData.flightSize}} ${aircraftResult.aircraftType}, ${missionType}`;
    
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
  module.exports = WPTableL;
}

console.log('WPTableL processor loaded');
