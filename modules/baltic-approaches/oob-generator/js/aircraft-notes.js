/**
 * Aircraft Notes Module
 * Handles application of aircraft note rules for all nations
 */

/**
 * Map nation code to note rules key based on module
 * @param {string} nationCode - Nation code from aircraft data
 * @param {string} module - Module identifier (RS or BA)
 * @returns {string} Mapped nation code for note rules lookup
 */
function getNationKey(nationCode, module) {
  if (module === 'BA') {
    // Baltic Approaches module mappings
    if (['UK', 'FRG', 'DK', 'NE'].includes(nationCode)) {
      return 'NATO_BA';
    } else if (nationCode === 'US') {
      // For BA module, US can be USN or USMC - determine from context if needed
      // For now, we'll use a single USN/USMC handler
      return 'USN'; // Will be handled by applyUSNUSMC_Notes
    } else if (nationCode === 'USSR') {
      return 'USSR_BA';
    } else if (nationCode === 'POL') {
      return 'POL';
    } else if (nationCode === 'SE') {
      return 'SE';
    }
  }
  // Red Storm module or unmapped - return original nation code
  return nationCode;
}

/**
 * Apply aircraft note rules to modify aircraft data
 * @param {object} aircraftData - Original aircraft data
 * @param {string} tasking - Mission tasking
 * @param {object} noteRulesData - Note rules database
 * @param {string} nationCode - Nation code (US, UK, FRG, USSR, GDR, BEL, CAN, HOL)
 * @param {string} sourceTable - Table ID where the aircraft was generated from
 * @param {object} weaponsData - Weapons database with ratings
 * @param {string} module - Module identifier (RS or BA) - optional, defaults to RS
 * @returns {object} Modified aircraft data
 */
function applyDesignerNoteRules(aircraftData, tasking, noteRulesData, nationCode, sourceTable, weaponsData, module = 'RS') {
  // Early return if no note rules data or no notes on aircraft
  if (!noteRulesData || !aircraftData.notes) {
    return aircraftData;
  }
  
  // Create a shallow copy to avoid modifying the original object
  const modifiedData = { ...aircraftData };
  
  // Initialize special rules array if not present
  if (!modifiedData.specialRules) {
    modifiedData.specialRules = [];
  }
  
  // Define taskings with no air-to-ground capability
  const airToGroundNoneTasks = ['CAP', 'Close Escort', 'Recon', 'Escort Jamming', 'Standoff Jamming', 'CSAR', 'Transport', 'Laser Designation', 'Chaff Laying', 'Fast FAC'];
  const isAirToGroundCapable = !airToGroundNoneTasks.includes(tasking) && (modifiedData.bomb && modifiedData.bomb !== '-');
  
  // Parse aircraft notes into array (e.g., "A, B, C, E" -> ["A", "B", "C", "E"])
  const notes = aircraftData.notes.split(',').map(n => n.trim());
  
  // Map nation code based on module
  const mappedNation = getNationKey(nationCode, module);
  
  // Apply nation-specific notes
  if (mappedNation === 'US') {
    applyUSNotes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable, weaponsData);
  } else if (mappedNation === 'UK') {
    applyUKNotes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable, weaponsData);
  } else if (mappedNation === 'FRG') {
    applyFRGNotes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable);
  } else if (mappedNation === 'USSR') {
    applyUSSRNotes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable);
  } else if (mappedNation === 'GDR') {
    applyGDRNotes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable, weaponsData);
  } else if (['BEL', 'CAN', 'HOL'].includes(mappedNation)) {
    applyBECANENotes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable);
  }
  // Baltic Approaches module nations
  else if (mappedNation === 'NATO_BA') {
    applyNATOBA_Notes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable);
  } else if (mappedNation === 'USN' || mappedNation === 'USMC') {
    applyUSNUSMC_Notes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable);
  } else if (mappedNation === 'USSR_BA') {
    applyUSSR_BA_Notes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable);
  } else if (mappedNation === 'POL') {
    applyPOL_Notes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable, weaponsData);
  } else if (mappedNation === 'SE') {
    applySE_Notes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable);
  }
  
  return modifiedData;
}

/**
 * Apply US aircraft notes
 */
function applyUSNotes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable, weaponsData) {
  // US Note A: AIM-9 and/or AIM-7 depletions are (6) if tasked with Bombing or SEAD
  if (notes.includes('A') && (tasking === 'Bombing' || tasking === 'SEAD')) {
    // Modify IRM (AIM-9) depletion to 6 if present
    if (modifiedData.irm) {
      modifiedData.irm = modifiedData.irm.replace(/\{\d+\}/, '{6}');
    }
    // Modify RHM (AIM-7) depletion to 6 if present
    if (modifiedData.rhm) {
      modifiedData.rhm = modifiedData.rhm.replace(/\{\d+\}/, '{6}');
    }
  }
  
  // US Note B: F-15 special radar capability - auto BVR/2 targets
  if (notes.includes('B')) {
    modifiedData.specialRules.push('Auto BVR/2 targets [11.44]');
  }
  
  // US Note C: Reduced bomb load for Deep Strike Raid (Table D)
  if (notes.includes('C') && sourceTable === 'D' && isAirToGroundCapable) {
    if (modifiedData.bomb && modifiedData.bomb.includes('/')) {
      const bombParts = modifiedData.bomb.split('/');
      if (bombParts.length === 2) {
        modifiedData.bomb = bombParts[1].trim();
      }
    }
  }
  
  // US Note D: AN/ASX-1 TISEO system - auto visual ID
  if (notes.includes('D')) {
    modifiedData.specialRules.push('AN/ASX-1 TISEO. Auto visual ID. See note D.');
  }
  
  // US Note E: Large aircraft - special rules for size and SAM defense
  if (notes.includes('E')) {
    modifiedData.specialRules.push('Large aircraft [19.22], [6.40]; poor SAM defense [15.32].');
  }
  
  // US Note F: Spot jam capability
  if (notes.includes('F')) {
    modifiedData.specialRules.push('May Spot Jam [19.34] two radars at the same time.');
  }
  
  // US Note G: Defensive Wheel formation
  if (notes.includes('G')) {
    modifiedData.specialRules.push('May enter Defensive Wheel formation [7.1].');
  }
  
  // US Note H: LGB only, internal bay
  if (notes.includes('H') && isAirToGroundCapable) {
    modifiedData.specialRules.push('Only load allowed is LGB(1). Internal bomb bay, use clean ratings while laden.');
  }
  
  // US Note I: GBU-15 glide bomb
  if (notes.includes('I') && isAirToGroundCapable) {
    modifiedData.specialRules.push('GBU-15(V)B glide bomb. May use EOGB day or night.');
  }
  
  // US Note J: Variable missile types - requires per-flight dice rolls
  if (notes.includes('J')) {
    rollVariableMissiles(modifiedData, weaponsData);
  }
  
  // US Note K: SAR recon capability
  if (notes.includes('K')) {
    modifiedData.specialRules.push('Synthetic Aperture Radar (SAR) recon capability [24.2].');
  }
  
  // US Note L: Shrike or HARM selection
  if (notes.includes('L') && isAirToGroundCapable) {
    modifiedData.specialRules.push('Shrike or HARM; if Shrikes, also normal bomb point load.');
  }
  
  // US Note M: AGM-65D Maverick
  if (notes.includes('M') && isAirToGroundCapable) {
    modifiedData.specialRules.push('AGM-65D Maverick IR Missile. May use EOGM day or night.');
  }
  
  // US Note N: Bombing profile restrictions
  if (notes.includes('N') && isAirToGroundCapable) {
    modifiedData.specialRules.push('Only Level Bombing and Radar Bombing profiles allowed.');
  }
  
  // US Note O: NCTR capability
  if (notes.includes('O')) {
    modifiedData.specialRules.push('NCTR: Auto visual ID. See note O.');
  }
  
  // US Note P: Multirole aircraft
  if (notes.includes('P') && (tasking === 'SEAD' || tasking === 'Chaff Laying')) {
    modifiedData.specialRules.push('Multirole aircraft [8.37].');
  }
  
  // US Note Q: Zoom climb restriction
  if (notes.includes('Q')) {
    modifiedData.specialRules.push('Zoom Climb [6.33] not allowed.');
  }
  
  // US Note R: Laser Spot Tracker
  if (notes.includes('R') && isAirToGroundCapable) {
    modifiedData.specialRules.push('LGB only within 2 hexes of NATO armor/mech.');
  }
  
  // US Note S: SUU-23 Gun Pod - roll per flight
  if (notes.includes('S')) {
    const gunPodRoll = Math.floor(Math.random() * 10) + 1;
    if (gunPodRoll <= 5) {
      const suu23 = weaponsData && weaponsData.guns && weaponsData.guns['SUU-23'];
      const gunRating = suu23 ? suu23.stdRtg : 2;
      modifiedData.gun = `+${gunRating} {4}`;
    }
  }
}

/**
 * Apply UK aircraft notes
 */
function applyUKNotes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable, weaponsData) {
  // UK Note A: No AIM-9 for certain taskings
  if (notes.includes('A')) {
    if (tasking === 'Bombing' || tasking === 'SEAD' || tasking === 'Rescue Support') {
      modifiedData.irm = null;
    }
  }
  
  // UK Note B: Rocket pods option
  if (notes.includes('B') && isAirToGroundCapable) {
    modifiedData.specialRules.push('May substitute Rocket Pods for bombs.');
  }
  
  // UK Note C: Internal bay
  if (notes.includes('C') && isAirToGroundCapable) {
    modifiedData.specialRules.push('Internal bay. May only carry regular bombs in bay. Use clean ratings while laden.');
  }
  
  // UK Note D: Gun pod - roll per flight
  if (notes.includes('D')) {
    const gunPodRoll = Math.floor(Math.random() * 10) + 1;
    if (gunPodRoll <= 5) {
      const suu23 = weaponsData && weaponsData.guns && weaponsData.guns['SUU-23'];
      const gunRating = suu23 ? suu23.stdRtg : 2;
      modifiedData.gun = `+${gunRating} {4}`;
    }
  }
  
  // UK Note E: Max turns as free turns
  if (notes.includes('E')) {
    modifiedData.specialRules.push('May do Max Turns as Free Turns [6.32].');
  }
  
  // UK Note F: LGB requires external designation
  if (notes.includes('F') && isAirToGroundCapable) {
    modifiedData.specialRules.push('LGB only allowed using laser designation [17.68] by another flight.');
  }
  
  // UK Note G: Spot jam capability
  if (notes.includes('G')) {
    modifiedData.specialRules.push('May Spot Jam [19.34] one radar.');
  }
  
  // UK Note H: Lower bomb load for Deep Strike
  if (notes.includes('H') && sourceTable === 'D' && isAirToGroundCapable) {
    if (modifiedData.bomb && modifiedData.bomb.includes('/')) {
      const bombParts = modifiedData.bomb.split('/');
      if (bombParts.length === 2) {
        modifiedData.bomb = bombParts[1].trim();
      }
    }
  }
  
  // UK Note I: Defensive Wheel formation
  if (notes.includes('I')) {
    modifiedData.specialRules.push('May enter Defensive Wheel formation [7.1].');
  }
  
  // UK Note J: Pave Spike laser designator
  if (notes.includes('J') && isAirToGroundCapable) {
    modifiedData.specialRules.push('AN/AWQ-23E Pave Spike Pod. May laser designate [17.69] for other flights.');
  }
  
  // UK Note K: Photo recon restrictions
  if (notes.includes('K') && tasking === 'Recon') {
    modifiedData.specialRules.push('May only do photo recon runs [24.1] at Deck altitude. Side Looking Camera [24.1] not allowed.');
  }
  
  // UK Note L: Inertial nav/attack system
  if (notes.includes('L') && isAirToGroundCapable) {
    modifiedData.specialRules.push('Inertial navigation/attack system. May use Toss Bombing [17.34] profile without Radar capability.');
  }
  
  // UK Note M: Variable radar capability - roll per flight
  if (notes.includes('M')) {
    const radarRoll = Math.floor(Math.random() * 10) + 1;
    if (radarRoll >= 4 && modifiedData.radar) {
      const radarMatch = modifiedData.radar.match(/^(.+?)\s*\[(\d+)\](.*)$/);
      if (radarMatch) {
        const radarBase = radarMatch[1];
        modifiedData.radar = `${radarBase} [12]`;
        modifiedData.radarModifier = '8+: -2';
      }
    }
  }
  
  // UK Note N: No AIM-9 for Recon
  if (notes.includes('N')) {
    if (tasking === 'Recon') {
      modifiedData.irm = null;
    }
  }
  
  // UK Note O: Zoom climb restriction
  if (notes.includes('O')) {
    modifiedData.specialRules.push('Zoom Climb [6.33] not allowed.');
  }
}

/**
 * Apply FRG aircraft notes
 */
function applyFRGNotes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable) {
  // FRG Note A: AIM-9 depletion {6} for Bombing/SEAD/Rescue Support
  if (notes.includes('A')) {
    if (tasking === 'Bombing' || tasking === 'SEAD' || tasking === 'Rescue Support') {
      modifiedData.irmDepletion = 6;
    }
  }
  
  // FRG Note B: May substitute Rocket Pods for bombs
  if (notes.includes('B') && isAirToGroundCapable) {
    modifiedData.specialRules.push('May substitute Rocket Pods [17.63] for bombs.');
  }
  
  // FRG Note C: May enter Defensive Wheel
  if (notes.includes('C')) {
    modifiedData.specialRules.push('May enter Defensive Wheel formation [7.1].');
  }
  
  // FRG Note D: May Spot Jam one radar
  if (notes.includes('D')) {
    modifiedData.specialRules.push('May Spot Jam [19.34] one radar.');
  }
  
  // FRG Note E: Use lower bomb load for Deep Strike Raids (Table D)
  if (notes.includes('E') && sourceTable === 'D' && isAirToGroundCapable) {
    if (modifiedData.bomb && modifiedData.bomb.includes('/')) {
      const bombParts = modifiedData.bomb.split('/');
      modifiedData.bomb = bombParts[1].trim();
    }
  }
  
  // FRG Note F: Synthetic Aperture Radar (SAR) recon capability
  if (notes.includes('F')) {
    modifiedData.specialRules.push('Synthetic Aperture Radar (SAR) recon capability [24.2].');
  }
  
  // FRG Note G: No AIM-9 for Bombing/SEAD/Rescue Support
  if (notes.includes('G')) {
    if (tasking === 'Bombing' || tasking === 'SEAD' || tasking === 'Rescue Support') {
      modifiedData.irm = null;
    }
  }
  
  // FRG Note H: Multirole aircraft
  if (notes.includes('H') && (tasking === 'SEAD' || tasking === 'Chaff Laying')) {
    modifiedData.specialRules.push('Multirole aircraft [8.37].');
  }
  
  // FRG Note I: Zoom Climb not allowed
  if (notes.includes('I')) {
    modifiedData.specialRules.push('Zoom Climb [6.33] not allowed.');
  }
}

/**
 * Apply USSR aircraft notes
 */
function applyUSSRNotes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable) {
  // USSR Note A: No IRM/RHM for Bombing/SEAD/Rescue Support/Chaff Laying
  if (notes.includes('A')) {
    if (tasking === 'Bombing' || tasking === 'SEAD' || tasking === 'Rescue Support' || tasking === 'Chaff Laying') {
      modifiedData.irm = null;
      modifiedData.rhm = null;
    }
  }
  
  // USSR Note B: Jam rating 2n for Bombing/SEAD
  if (notes.includes('B')) {
    if (tasking === 'Bombing' || tasking === 'SEAD') {
      modifiedData.jam = '2n';
    }
  }
  
  // USSR Note C: Soviet Doctrine does not apply
  if (notes.includes('C')) {
    modifiedData.specialRules.push('Soviet Doctrine rule [11.32] does not apply.');
  }
  
  // USSR Note D: Roll for IRM load (R-60 vs R-60M)
  if (notes.includes('D') && modifiedData.irm) {
    rollSovietIRM_R60(modifiedData);
  }
  
  // USSR Note E: Internal Chaff Dispenser
  if (notes.includes('E')) {
    modifiedData.specialRules.push('Internal Chaff Dispenser. May carry Chaff [17.68] and use clean ratings.');
  }
  
  // USSR Note F: May enter Defensive Wheel
  if (notes.includes('F')) {
    modifiedData.specialRules.push('May enter Defensive Wheel formation [7.1].');
  }
  
  // USSR Note G: AS-6 or Kh-28 options
  if (notes.includes('G') && isAirToGroundCapable) {
    modifiedData.specialRules.push('May carry AS-6(2) or Kh-28(2), not both.');
  }
  
  // USSR Note H: Roll for IRM load (R-60M vs R-73)
  if (notes.includes('H') && modifiedData.irm) {
    rollSovietIRM_R73(modifiedData);
  }
  
  // USSR Note I: Dual bomb loads for mission range
  if (notes.includes('I') && isAirToGroundCapable) {
    applyDualBombLoad(modifiedData, sourceTable, tasking);
  }
  
  // USSR Note J: May Spot Jam two radars
  if (notes.includes('J')) {
    modifiedData.specialRules.push('May Spot Jam [19.34] two radars at same time.');
  }
  
  // USSR Note K: May Spot Jam one radar
  if (notes.includes('K')) {
    modifiedData.specialRules.push('May Spot Jam [19.34] one radar.');
  }
  
  // USSR Note L: Large Aircraft restrictions
  if (notes.includes('L') && isAirToGroundCapable) {
    modifiedData.specialRules.push('Large Aircraft [19.22] (see [6.40] for climbing limitations) and Poor SAM Defense [15.32]. May not carry CBU or Anti-Runway ordnance.');
  }
  
  // USSR Note M: SAR recon capability
  if (notes.includes('M')) {
    modifiedData.specialRules.push('Synthetic Aperture Radar (SAR) recon capability [24.2].');
  }
  
  // USSR Note N: SEAD missiles only for SEAD missions
  if (notes.includes('N')) {
    if (tasking !== 'SEAD' && modifiedData.ordnance) {
      const seadMissiles = ['Kh-25MP', 'Kh-28M', 'Kh-58'];
      let ordnanceParts = modifiedData.ordnance.split(',').map(o => o.trim());
      ordnanceParts = ordnanceParts.filter(ord => !seadMissiles.some(m => ord.includes(m)));
      modifiedData.ordnance = ordnanceParts.join(', ');
    }
  }
  
  // USSR Note O: Standoff Jamming arc restrictions (Escort Jamming only)
  if (notes.includes('O') && tasking === 'Escort Jamming') {
    modifiedData.specialRules.push('Standoff Jamming arc in forward or rear arcs (Escort Jamming [19.32]).');
  }
  
  // USSR Note P: No bomb load for Recon
  if (notes.includes('P')) {
    if (tasking === 'Recon') {
      modifiedData.bomb = null;
    }
  }
  
  // USSR Note Q: Multirole aircraft
  if (notes.includes('Q') && (tasking === 'SEAD' || tasking === 'Chaff Laying')) {
    modifiedData.specialRules.push('Multirole aircraft [8.37].');
  }
  
  // USSR Note R: May carry Chaff for specific missions
  if (notes.includes('R')) {
    if (tasking === 'Chaff Laying' || tasking === 'Escort Jamming') {
      modifiedData.specialRules.push('May carry Chaff [17.68] (Chaff Laying or Escort Jamming [19.32]).');
    }
  }
  
  // USSR Note S: May swap bombs for KMGU
  if (notes.includes('S') && isAirToGroundCapable) {
    modifiedData.specialRules.push('May swap regular bombs for KMGU [17.66].');
  }
  
  // USSR Note T: Standoff Jamming arc forward/rear only
  if (notes.includes('T')) {
    modifiedData.specialRules.push('Standoff Jamming arc only in forward or rear, not beam.');
  }
  
  // USSR Note U: No R-27 for Bombing/SEAD/Rescue Support
  if (notes.includes('U')) {
    if (tasking === 'Bombing' || tasking === 'SEAD' || tasking === 'Rescue Support') {
      if (modifiedData.rhm && modifiedData.rhm.includes('R-27')) {
        modifiedData.rhm = null;
      }
    }
  }
  
  // USSR Note V: May swap bombs for BETAB-500
  if (notes.includes('V') && isAirToGroundCapable) {
    modifiedData.specialRules.push('May swap regular bombs for BETAB-500 Anti-Runway Bombs [17.04].');
  }
  
  // USSR Note W: Zoom Climb not allowed
  if (notes.includes('W')) {
    modifiedData.specialRules.push('Zoom Climb [6.33] not allowed.');
  }
}

/**
 * Apply GDR aircraft notes
 */
function applyGDRNotes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable, weaponsData) {
  // GDR Note A: No IRM/RHM for Bombing/SEAD/Chaff Laying
  if (notes.includes('A')) {
    if (tasking === 'Bombing' || tasking === 'SEAD' || tasking === 'Chaff Laying') {
      modifiedData.irm = null;
      modifiedData.rhm = null;
    }
  }
  
  // GDR Note B: May swap bombs for KMGU
  if (notes.includes('B') && isAirToGroundCapable) {
    modifiedData.specialRules.push('May swap regular bombs for KMGU [17.66].');
  }
  
  // GDR Note C: Roll for IRM load (R-60 vs R-60M)
  if (notes.includes('C') && modifiedData.irm) {
    rollSovietIRM_R60(modifiedData);
  }
  
  // GDR Note D: Dual bomb loads for mission range
  if (notes.includes('D') && isAirToGroundCapable) {
    applyDualBombLoad(modifiedData, sourceTable, tasking);
  }
  
  // GDR Note E: Only Bombs, AT CBU, or Rockets allowed
  if (notes.includes('E') && isAirToGroundCapable) {
    modifiedData.specialRules.push('Only Bombs, AT CBU, or Rockets allowed.');
    // Remove prohibited ordnance types as safety net
    if (modifiedData.rolledOrdnance) {
      modifiedData.rolledOrdnance = modifiedData.rolledOrdnance
        .replace(/\s*\+\s*EOGM\/ARM/g, '')
        .replace(/\s*\+\s*EOGM/g, '')
        .replace(/\s*\+\s*ARM/g, '')
        .replace(/\s*\+\s*LGB\/EOGB/g, '')
        .replace(/\s*\+\s*EOGB\/LGB/g, '')
        .replace(/\s*\+\s*LGB/g, '')
        .replace(/\s*\+\s*EOGB/g, '')
        .trim();
      if (modifiedData.rolledOrdnance === '') {
        modifiedData.rolledOrdnance = null;
      }
    }
  }
  
  // GDR Note F: Roll for 23mm Gun Pod
  if (notes.includes('F')) {
    const gunRoll = Math.floor(Math.random() * 10) + 1;
    if (gunRoll <= 6) {
      const gunPod = weaponsData.guns['23mm Gun Pod'];
      const gunRating = gunPod ? gunPod.stdRtg : 2;
      
      if (modifiedData.gun) {
        modifiedData.gun += `, 23mm Gun Pod +${gunRating} {4}`;
      } else {
        modifiedData.gun = `23mm Gun Pod +${gunRating} {4}`;
      }
    }
  }
  
  // GDR Note G: May enter Defensive Wheel
  if (notes.includes('G')) {
    modifiedData.specialRules.push('May enter Defensive Wheel formation [7.1].');
  }
  
  // GDR Note H: May carry Chaff for Chaff Laying
  if (notes.includes('H') && tasking === 'Chaff Laying') {
    modifiedData.specialRules.push('May carry Chaff [17.68] if tasked with Chaff Laying.');
  }
  
  // GDR Note I: Jam rating 2n for Bombing/SEAD
  if (notes.includes('I')) {
    if (tasking === 'Bombing' || tasking === 'SEAD') {
      modifiedData.jam = '2n';
    }
  }
  
  // GDR Note J: Multirole aircraft
  if (notes.includes('J') && (tasking === 'SEAD' || tasking === 'Chaff Laying')) {
    modifiedData.specialRules.push('Multirole aircraft [8.37].');
  }
}

/**
 * Apply BE/CA/NE aircraft notes (Belgium, Canada, Netherlands)
 */
function applyBECANENotes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable) {
  // BE/CA/NE Note A: AIM-9 depletion {6} for Bombing/SEAD
  if (notes.includes('A')) {
    if (tasking === 'Bombing' || tasking === 'SEAD') {
      modifiedData.irmDepletion = 6;
    }
  }
  
  // BE/CA/NE Note B: May substitute Rocket Pods for bombs
  if (notes.includes('B') && isAirToGroundCapable) {
    modifiedData.specialRules.push('May substitute Rocket Pods [17.63] for bombs.');
  }
  
  // BE/CA/NE Note C: Use lower bomb load for Deep Strike Raids (Table D)
  if (notes.includes('C') && sourceTable === 'D' && isAirToGroundCapable) {
    if (modifiedData.bomb && modifiedData.bomb.includes('/')) {
      const bombParts = modifiedData.bomb.split('/');
      modifiedData.bomb = bombParts[1].trim();
    }
  }
  
  // BE/CA/NE Note D: No AIM-9 for Bombing
  if (notes.includes('D')) {
    if (tasking === 'Bombing') {
      modifiedData.irm = null;
    }
  }
  
  // BE/CA/NE Note E: Multirole aircraft
  if (notes.includes('E') && (tasking === 'SEAD' || tasking === 'Chaff Laying')) {
    modifiedData.specialRules.push('Multirole aircraft [8.37].');
  }
}

// ===== BALTIC APPROACHES MODULE NOTES =====

/**
 * Apply NATO (BA) aircraft notes
 * Nations: UK, FRG, DK, NE (mapped to NATO_BA in BA module)
 * 
 * MODIFICATION NOTES (4):
 * A - AIM-9 depletion {6} for Bombing/SEAD/Recon/Rescue Support
 * C - Lower bomb load for Deep Strike/Naval Strike (tables D/E)
 * F - Remove AIM-9 for Bombing/Naval Strike/SEAD/Rescue Support
 * H - Remove AIM-9 for Bombing/SEAD
 * 
 * PRINT-ONLY NOTES (7):
 * B - Large Aircraft restrictions
 * D - Internal bay restrictions
 * E - Pave Spike laser designator
 * G - Multirole aircraft
 * I - Zoom Climb not allowed
 * J - Max Turns as Free Turns
 * K - Defensive Wheel formation
 */
function applyNATOBA_Notes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable) {
  // Process modification notes first (depletion changes, bomb load changes)
  // Then process weapon removal notes last
  
  // NATO Note A: AIM-9 depletion {6} - MODIFICATION
  if (notes.includes('A') && (tasking === 'Bombing' || tasking === 'SEAD' || tasking === 'Recon' || tasking === 'Rescue Support')) {
    if (modifiedData.irm) {
      modifiedData.irm = modifiedData.irm.replace(/\{\d+\}/, '{6}');
    }
  }
  
  // NATO Note B: Large Aircraft - PRINT ONLY
  if (notes.includes('B')) {
    modifiedData.specialRules.push('Large Aircraft [19.22] (see [6.40] for climbing limitations) and Poor SAM Defense [15.32].');
  }
  
  // NATO Note C: Lower bomb load for Deep Strike/Naval Strike - MODIFICATION
  if (notes.includes('C') && (sourceTable === 'D' || sourceTable === 'E') && isAirToGroundCapable) {
    if (modifiedData.bomb && modifiedData.bomb.includes('/')) {
      const bombParts = modifiedData.bomb.split('/');
      modifiedData.bomb = bombParts[1].trim();
    }
  }
  
  // NATO Note D: Internal bay - PRINT ONLY
  if (notes.includes('D') && isAirToGroundCapable) {
    modifiedData.specialRules.push('Internal bay. May only carry regular bombs in the bay. Use clean ratings while laden.');
  }
  
  // NATO Note E: Pave Spike laser designator - PRINT ONLY
  if (notes.includes('E') && isAirToGroundCapable) {
    modifiedData.specialRules.push('AN/AVQ-23E Pave Spike Pod. May laser designate [17.69] for other flights.');
  }
  
  // NATO Note G: Multirole aircraft - PRINT ONLY
  if (notes.includes('G') && (tasking === 'SEAD' || tasking === 'Chaff Laying')) {
    modifiedData.specialRules.push('Multirole aircraft [8.37].');
  }
  
  // NATO Note I: Zoom Climb not allowed - PRINT ONLY
  if (notes.includes('I')) {
    modifiedData.specialRules.push('Zoom Climb [6.33] not allowed.');
  }
  
  // NATO Note J: Max Turns as Free Turns - PRINT ONLY
  if (notes.includes('J')) {
    modifiedData.specialRules.push('May do Max Turns as Free Turns [6.32].');
  }
  
  // NATO Note K: Defensive Wheel - PRINT ONLY
  if (notes.includes('K')) {
    modifiedData.specialRules.push('May enter Defensive Wheel formation [7.1].');
  }
  
  // Process weapon removal notes LAST so they don't interfere with modifications
  
  // NATO Note F: No AIM-9 for certain taskings - MODIFICATION (WEAPON REMOVAL)
  if (notes.includes('F')) {
    if (tasking === 'Bombing' || tasking === 'Naval Strike' || tasking === 'SEAD' || tasking === 'Rescue Support') {
      modifiedData.irm = null;
    }
  }
  
  // NATO Note H: No AIM-9 for Bombing/SEAD - MODIFICATION (WEAPON REMOVAL)
  if (notes.includes('H')) {
    if (tasking === 'Bombing' || tasking === 'SEAD') {
      modifiedData.irm = null;
    }
  }
}

/**
 * Apply USN/USMC aircraft notes
 * Nation: US (mapped to USN or USMC in BA module)
 * 
 * MODIFICATION NOTES (3):
 * A - Lower bomb load for Deep Strike/Naval Strike (tables D/E)
 * H - AIM-7 depletion {6} for Bombing/SEAD/Recon/Rescue Support
 * K - Recon missile load: AIM-9L {6}, AIM-7M {6}
 * 
 * PRINT-ONLY NOTES (10):
 * B - Spot Jam two radars
 * C - Defensive Wheel formation
 * D - Escort Jamming with HARM
 * E - Multirole aircraft
 * F - Zoom Climb not allowed
 * G - Max Turns as Free Turns
 * I - AIM-7 and AIM-54 combined
 * J - Maritime Patrol with Harpoon
 * L - AAX-1 sensor auto visual ID
 * M - Large Aircraft restrictions
 */
function applyUSNUSMC_Notes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable) {
  // USN/USMC Note A: Lower bomb load for Deep Strike/Naval Strike - MODIFICATION
  if (notes.includes('A') && (sourceTable === 'D' || sourceTable === 'E') && isAirToGroundCapable) {
    if (modifiedData.bomb && modifiedData.bomb.includes('/')) {
      const bombParts = modifiedData.bomb.split('/');
      modifiedData.bomb = bombParts[1].trim();
    }
  }
  
  // USN/USMC Note B: Spot Jam two radars - PRINT ONLY
  if (notes.includes('B')) {
    modifiedData.specialRules.push('May Spot Jam [19.34] two radars at the same time.');
  }
  
  // USN/USMC Note C: Defensive Wheel - PRINT ONLY
  if (notes.includes('C')) {
    modifiedData.specialRules.push('May enter Defensive Wheel formation [7.1].');
  }
  
  // USN/USMC Note D: Escort Jamming with HARM - PRINT ONLY
  if (notes.includes('D') && tasking === 'Escort Jamming') {
    modifiedData.specialRules.push('If tasked with Escort Jamming [8.341] may carry HARMs [17.54] and attack naval or land radar targets.');
  }
  
  // USN/USMC Note E: Multirole aircraft - PRINT ONLY
  if (notes.includes('E') && (tasking === 'SEAD' || tasking === 'Chaff Laying')) {
    modifiedData.specialRules.push('Multirole aircraft [8.37].');
  }
  
  // USN/USMC Note F: Zoom Climb not allowed - PRINT ONLY
  if (notes.includes('F')) {
    modifiedData.specialRules.push('Zoom Climb [6.33] not allowed.');
  }
  
  // USN/USMC Note G: Max Turns as Free Turns - PRINT ONLY
  if (notes.includes('G')) {
    modifiedData.specialRules.push('May do Max Turns as Free Turns [6.32].');
  }
  
  // USN/USMC Note H: AIM-7 depletion {6} - MODIFICATION
  if (notes.includes('H') && (tasking === 'Bombing' || tasking === 'SEAD' || tasking === 'Recon' || tasking === 'Rescue Support')) {
    if (modifiedData.rhm) {
      modifiedData.rhm = modifiedData.rhm.replace(/\{\d+\}/, '{6}');
    }
  }
  
  // USN/USMC Note I: AIM-7 and AIM-54 combined - PRINT ONLY
  if (notes.includes('I')) {
    modifiedData.specialRules.push('Flights may carry AIM-7 and AIM-54 RHM at the same time.');
  }
  
  // USN/USMC Note J: Maritime Patrol with Harpoon - PRINT ONLY
  if (notes.includes('J') && tasking === 'Maritime Patrol') {
    modifiedData.specialRules.push('If tasked with Maritime Patrol, may carry Harpoon and attack naval targets.');
  }
  
  // USN/USMC Note K: Recon missile load - MODIFICATION
  if (notes.includes('K') && tasking === 'Recon') {
    if (modifiedData.irm) {
      modifiedData.irm = modifiedData.irm.replace(/\{\d+\}/, '{6}');
    }
    if (modifiedData.rhm) {
      modifiedData.rhm = modifiedData.rhm.replace(/\{\d+\}/, '{6}');
    }
  }
  
  // USN/USMC Note L: AAX-1 sensor - PRINT ONLY
  if (notes.includes('L')) {
    modifiedData.specialRules.push('AAX-1 sensor: Automatic visual ID at end of Detection Phase of one detected enemy flight in forward arc, line of sight, and same altitude at 1-8 hex range. Day only.');
  }
  
  // USN/USMC Note M: Large Aircraft - PRINT ONLY
  if (notes.includes('M')) {
    modifiedData.specialRules.push('Large Aircraft [19.22] (see [6.40] for climbing limitations) and Poor SAM Defense [15.32].');
  }
}

/**
 * Apply USSR (BA) aircraft notes
 * Nation: USSR (mapped to USSR_BA in BA module)
 * 
 * MODIFICATION NOTES (1):
 * B - Lower bomb load for Deep Strike/Naval Strike (tables J/K)
 * 
 * PRINT-ONLY NOTES (7):
 * A - Large Aircraft restrictions (no Rockets/CBU/AT CBU/Anti-Runway)
 * C - SSM data relay long range (Deck 8, Low+ 36)
 * D - SSM data relay medium range (Deck 8, Low+ 24)
 * E - Defensive Wheel formation
 * F - Kh-25/AP and KMGU options
 * G - Zoom Climb not allowed
 * H - Semi-conformal AS-4 station
 */
function applyUSSR_BA_Notes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable) {
  // USSR_BA Note A: Large Aircraft restrictions - PRINT ONLY
  if (notes.includes('A')) {
    modifiedData.specialRules.push('Large Aircraft [19.22] (see [6.40] for climbing limitations) and Poor SAM Defense [15.32]. May not carry Rockets, CBU, AT CBU, or Anti-Runway ordnance.');
  }
  
  // USSR_BA Note B: Lower bomb load for Deep Strike/Naval Strike - MODIFICATION
  if (notes.includes('B') && (sourceTable === 'J' || sourceTable === 'K') && isAirToGroundCapable) {
    if (modifiedData.bomb && modifiedData.bomb.includes('/')) {
      const bombParts = modifiedData.bomb.split('/');
      modifiedData.bomb = bombParts[1].trim();
    }
  }
  
  // USSR_BA Note C: SSM data relay long range - PRINT ONLY
  if (notes.includes('C')) {
    modifiedData.specialRules.push('SSM Missile data relay [35.94], maximum ranges: Deck 8 Hexes, Low+: 36 Hexes.');
  }
  
  // USSR_BA Note D: SSM data relay medium range - PRINT ONLY
  if (notes.includes('D')) {
    modifiedData.specialRules.push('SSM Missile data relay [35.94], maximum ranges: Deck 8 Hexes, Low+: 24 Hexes.');
  }
  
  // USSR_BA Note E: Defensive Wheel - PRINT ONLY
  if (notes.includes('E')) {
    modifiedData.specialRules.push('May enter Defensive Wheel formation [7.1].');
  }
  
  // USSR_BA Note F: Kh-25/AP and KMGU - PRINT ONLY
  if (notes.includes('F') && isAirToGroundCapable) {
    if (tasking === 'SEAD') {
      modifiedData.specialRules.push('Kh-25/AP only allowed if tasked with SEAD. May swap regular bombs for KMGU [17.66].');
    } else {
      modifiedData.specialRules.push('May swap regular bombs for KMGU [17.66].');
    }
  }
  
  // USSR_BA Note G: Zoom Climb not allowed - PRINT ONLY
  if (notes.includes('G')) {
    modifiedData.specialRules.push('Zoom Climb [6.33] not allowed.');
  }
  
  // USSR_BA Note H: Semi-conformal AS-4 station - PRINT ONLY
  if (notes.includes('H') && isAirToGroundCapable) {
    modifiedData.specialRules.push('Semi-conformal center station. May load AS-4(1) instead of AS-4(2) and use clean ratings.');
  }
}

/**
 * Apply Poland aircraft notes
 * Nation: POL
 * 
 * MODIFICATION NOTES (4):
 * A - Remove IRM/RHM for Bombing/SEAD/Chaff Laying
 * B - Roll for IRM type: R-13M (1-5) or R-60 (6-10)
 * C - Lower bomb load for Deep Strike/Naval Strike (tables J/K)
 * F - Roll for 23mm Gun Pod: Yes (1-6) or No (7-10)
 * 
 * PRINT-ONLY NOTES (7):
 * D - Chaff capability for Chaff Laying
 * E - Ordnance restrictions (Bombs/AT CBU/Rockets only)
 * G - Defensive Wheel formation
 * H - SSM data relay (Deck 8, Low+ 25)
 * I - Short Horn surface search radar
 * J - Multirole aircraft
 * K - KMGU option
 */
function applyPOL_Notes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable, weaponsData) {
  // POL Note A: No IRM/RHM for certain taskings - MODIFICATION
  if (notes.includes('A')) {
    if (tasking === 'Bombing' || tasking === 'SEAD' || tasking === 'Chaff Laying') {
      modifiedData.irm = null;
      modifiedData.rhm = null;
    }
  }
  
  // POL Note B: Roll for IRM type - MODIFICATION (with dice roll)
  if (notes.includes('B') && modifiedData.irm) {
    const irmRoll = Math.floor(Math.random() * 10) + 1;
    const depletionMatch = modifiedData.irm.match(/\{\d+\}/);
    const depletion = depletionMatch ? depletionMatch[0] : '{3}';
    
    if (irmRoll <= 5) {
      modifiedData.irm = `R-13M ${depletion}`;
      if (modifiedData.aam) {
        modifiedData.aam = modifiedData.aam.replace(/R-13M\/R-60/g, 'R-13M');
      }
    } else {
      modifiedData.irm = `R-60 ${depletion}`;
      if (modifiedData.aam) {
        modifiedData.aam = modifiedData.aam.replace(/R-13M\/R-60/g, 'R-60');
      }
    }
  }
  
  // POL Note C: Lower bomb load for Deep Strike/Naval Strike - MODIFICATION
  if (notes.includes('C') && (sourceTable === 'J' || sourceTable === 'K') && isAirToGroundCapable) {
    if (modifiedData.bomb && modifiedData.bomb.includes('/')) {
      const bombParts = modifiedData.bomb.split('/');
      modifiedData.bomb = bombParts[1].trim();
    }
  }
  
  // POL Note D: Chaff capability - PRINT ONLY
  if (notes.includes('D') && tasking === 'Chaff Laying') {
    modifiedData.specialRules.push('May carry Chaff [17.68] if tasked with Chaff Laying.');
  }
  
  // POL Note E: Ordnance restrictions - PRINT ONLY
  if (notes.includes('E') && isAirToGroundCapable) {
    modifiedData.specialRules.push('Only Bombs, AT CBU, or Rocket Pods allowed.');
    // Remove prohibited ordnance types as safety net
    if (modifiedData.rolledOrdnance) {
      modifiedData.rolledOrdnance = modifiedData.rolledOrdnance
        .replace(/\s*\+\s*EOGM\/ARM/g, '')
        .replace(/\s*\+\s*EOGM/g, '')
        .replace(/\s*\+\s*ARM/g, '')
        .replace(/\s*\+\s*LGB\/EOGB/g, '')
        .replace(/\s*\+\s*EOGB\/LGB/g, '')
        .replace(/\s*\+\s*LGB/g, '')
        .replace(/\s*\+\s*EOGB/g, '')
        .trim();
      if (modifiedData.rolledOrdnance === '') {
        modifiedData.rolledOrdnance = null;
      }
    }
  }
  
  // POL Note F: 23mm Gun Pod roll - MODIFICATION (with dice roll)
  if (notes.includes('F')) {
    const gunRoll = Math.floor(Math.random() * 10) + 1;
    if (gunRoll <= 6) {
      const gunPod = weaponsData && weaponsData.guns && weaponsData.guns['23mm Gun Pod'];
      const gunRating = gunPod ? gunPod.stdRtg : 2;
      
      if (modifiedData.gun) {
        modifiedData.gun += `, 23mm Gun Pod +${gunRating} {4}`;
      } else {
        modifiedData.gun = `23mm Gun Pod +${gunRating} {4}`;
      }
    }
  }
  
  // POL Note G: Defensive Wheel - PRINT ONLY
  if (notes.includes('G')) {
    modifiedData.specialRules.push('May enter Defensive Wheel formation [7.1].');
  }
  
  // POL Note H: SSM data relay - PRINT ONLY
  if (notes.includes('H')) {
    modifiedData.specialRules.push('SSM missile data relay [35.94], max range at Deck: 8 hexes, Low+: 25 hexes.');
  }
  
  // POL Note I: Short Horn radar - PRINT ONLY
  if (notes.includes('I')) {
    modifiedData.specialRules.push('Short Horn surface search radar. Stats: Column D / LD [12], 10+: -2, all arcs.');
  }
  
  // POL Note J: Multirole aircraft - PRINT ONLY
  if (notes.includes('J') && (tasking === 'SEAD' || tasking === 'Chaff Laying')) {
    modifiedData.specialRules.push('Multirole aircraft [8.37].');
  }
  
  // POL Note K: KMGU option - PRINT ONLY
  if (notes.includes('K') && isAirToGroundCapable) {
    modifiedData.specialRules.push('May swap regular bombs for KMGU [17.66].');
  }
}

/**
 * Apply Sweden aircraft notes
 * Nation: SE
 * 
 * MODIFICATION NOTES (3):
 * A - Remove AIM-4/AIM-9 for Bombing/SEAD
 * C - AIM-9 depletion {6} and remove RHM for Bombing
 * E - Roll for AIM-9 type: AIM-9P (1-6) or AIM-9L (7-10)
 * 
 * PRINT-ONLY NOTES (5):
 * B - Rocket Pods only
 * D - Multirole aircraft
 * F - Spot Jam one radar
 * G - Standoff Jamming arc restrictions (forward/rear only)
 * H - No AT/AP CBU allowed
 */
function applySE_Notes(modifiedData, notes, tasking, sourceTable, isAirToGroundCapable) {
  // SE Note A: No AIM-4/AIM-9 for Bombing/SEAD - MODIFICATION
  if (notes.includes('A')) {
    if (tasking === 'Bombing' || tasking === 'SEAD') {
      modifiedData.irm = null;
    }
  }
  
  // SE Note B: Rocket Pods only - PRINT ONLY
  if (notes.includes('B') && isAirToGroundCapable) {
    modifiedData.specialRules.push('Only ordnance allowed are Rocket Pods [17.63].');
  }
  
  // SE Note C: AIM-9 depletion {6} and no RHM for Bombing - MODIFICATION
  if (notes.includes('C') && tasking === 'Bombing') {
    if (modifiedData.irm) {
      modifiedData.irm = modifiedData.irm.replace(/\{\d+\}/, '{6}');
    }
    modifiedData.rhm = null;
  }
  
  // SE Note D: Multirole aircraft - PRINT ONLY
  if (notes.includes('D') && (tasking === 'SEAD' || tasking === 'Chaff Laying')) {
    modifiedData.specialRules.push('Multirole aircraft [8.37].');
  }
  
  // SE Note E: Roll for AIM-9 type - MODIFICATION (with dice roll)
  if (notes.includes('E') && modifiedData.irm) {
    const aim9Roll = Math.floor(Math.random() * 10) + 1;
    const depletionMatch = modifiedData.irm.match(/\{\d+\}/);
    const depletion = depletionMatch ? depletionMatch[0] : '{3}';
    
    if (aim9Roll <= 6) {
      modifiedData.irm = `AIM-9P ${depletion}`;
      if (modifiedData.aam) {
        modifiedData.aam = modifiedData.aam.replace(/AIM-9P\/L/g, 'AIM-9P');
      }
    } else {
      modifiedData.irm = `AIM-9L ${depletion}`;
      if (modifiedData.aam) {
        modifiedData.aam = modifiedData.aam.replace(/AIM-9P\/L/g, 'AIM-9L');
      }
    }
  }
  
  // SE Note F: Spot Jam one radar - PRINT ONLY
  if (notes.includes('F')) {
    modifiedData.specialRules.push('May Spot Jam [19.34] one radar.');
  }
  
  // SE Note G: Standoff Jamming arc restrictions - PRINT ONLY
  if (notes.includes('G') && (tasking === 'Escort Jamming' || tasking === 'Standoff Jamming')) {
    modifiedData.specialRules.push('May only place Standoff Jamming arc in forward or rear arcs, not beams.');
  }
  
  // SE Note H: No AT/AP CBU - PRINT ONLY
  if (notes.includes('H')) {
    modifiedData.specialRules.push('No AT or AP CBU [17.61] allowed regardless of task.');
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Roll for US variable missile types (Note J)
 */
function rollVariableMissiles(modifiedData, weaponsData) {
  let aim9Type = '';
  let aim7Type = '';
  
  // Roll for AIM-9 type if aircraft has IRM
  if (modifiedData.irm) {
    const aim9Roll = Math.floor(Math.random() * 10) + 1;
    const irmDepletionMatch = modifiedData.irm.match(/\{(\d+)\}/);
    const irmDepletion = irmDepletionMatch ? irmDepletionMatch[1] : '3';
    
    if (aim9Roll <= 4) {
      // AIM-9L: Std 3, BVR 0
      modifiedData.irm = `+3/+0 {${irmDepletion}}`;
      aim9Type = 'AIM-9L';
    } else {
      // AIM-9M: Std 3, BVR 1
      modifiedData.irm = `+3/+1 {${irmDepletion}}`;
      aim9Type = 'AIM-9M';
    }
  }
  
  // Roll for AIM-7 type if aircraft has RHM
  if (modifiedData.rhm) {
    const aim7Roll = Math.floor(Math.random() * 10) + 1;
    const rhmDepletionMatch = modifiedData.rhm.match(/\{(\d+)\}/);
    const rhmDepletion = rhmDepletionMatch ? rhmDepletionMatch[1] : '3';
    
    if (aim7Roll <= 6) {
      // AIM-7F: Std 3, BVR 1
      modifiedData.rhm = `+3/+1 {${rhmDepletion}}`;
      aim7Type = 'AIM-7F';
    } else {
      // AIM-7M: Std 3, BVR 2
      modifiedData.rhm = `+3/+2 {${rhmDepletion}}`;
      aim7Type = 'AIM-7M';
    }
  }
  
  // Update AAM field with specific missile types rolled
  if (aim9Type && aim7Type) {
    modifiedData.aam = `${aim9Type}, ${aim7Type}`;
  } else if (aim9Type) {
    modifiedData.aam = aim9Type;
  } else if (aim7Type) {
    modifiedData.aam = aim7Type;
  }
}

/**
 * Roll for Soviet IRM (R-60 vs R-60M)
 */
function rollSovietIRM_R60(modifiedData) {
  const irmRoll = Math.floor(Math.random() * 10) + 1;
  
  const depletionMatch = modifiedData.irm.match(/\{(\d+)\}/);
  const irmDepletion = depletionMatch ? depletionMatch[1] : '3';
  
  const ratingMatch = modifiedData.irm.match(/^([^\{]+)/);
  const irmRating = ratingMatch ? ratingMatch[1].trim() : modifiedData.irm;
  
  let rolledIRM;
  if (irmRoll <= 4) {
    rolledIRM = 'R-60';
  } else {
    rolledIRM = 'R-60M';
  }
  
  modifiedData.irm = `${irmRating} {${irmDepletion}}`;
  
  if (modifiedData.aam) {
    modifiedData.aam = modifiedData.aam.replace(/R-60\/60M/g, rolledIRM);
  }
}

/**
 * Roll for Soviet IRM (R-60M vs R-73)
 */
function rollSovietIRM_R73(modifiedData) {
  const irmRoll = Math.floor(Math.random() * 10) + 1;
  let rolledIRM;
  let irmDepletion = modifiedData.irmDepletion;
  
  if (irmRoll <= 5) {
    rolledIRM = 'R-60M (AA-8B)';
  } else {
    rolledIRM = 'R-73 (AA-11)';
  }
  
  modifiedData.irm = `${rolledIRM} {${irmDepletion}}`;
}

/**
 * Apply dual bomb load logic (USSR Note I, GDR Note D)
 */
function applyDualBombLoad(modifiedData, sourceTable, tasking) {
  if (modifiedData.bomb && modifiedData.bomb.includes('/')) {
    const bombParts = modifiedData.bomb.split('/');
    const isDeepStrike = sourceTable === 'J' && (tasking === 'Bombing' || tasking === 'SEAD');
    if (isDeepStrike) {
      // Deep Strike: use lower bomb load (longer range)
      modifiedData.bomb = bombParts[1].trim();
    } else {
      // All other missions: use higher bomb load (shorter range)
      modifiedData.bomb = bombParts[0].trim();
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { applyDesignerNoteRules };
}

// Make available globally for index.html
if (typeof window !== 'undefined') {
  window.applyDesignerNoteRules = applyDesignerNoteRules;
}

console.log('Aircraft notes module loaded');
