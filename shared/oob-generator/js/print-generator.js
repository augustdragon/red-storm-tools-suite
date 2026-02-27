/**
 * OOB Generator - Shared Print Framework
 * 
 * Provides configurable flight sheet generation for all modules
 * while allowing module-specific customization.
 */

class PrintGenerator {
  constructor(moduleConfig = null) {
    // Get current module configuration
    if (!moduleConfig) {
      const currentModuleId = window.ModuleConfig ? window.ModuleConfig.getCurrentModule() : 'red-storm';
      moduleConfig = window.ModuleConfig ? window.ModuleConfig.getModuleConfig(currentModuleId) : null;
    }
    
    this.moduleConfig = moduleConfig;
    this.config = {
      // Module identification
      moduleName: moduleConfig?.name || 'unknown',
      
      // Data file paths (from module config)
      dataFiles: {
        aircraftNATO: moduleConfig?.data?.aircraftNATO || 'data/aircraft-nato.json',
        aircraftWP: moduleConfig?.data?.aircraftWP || 'data/aircraft-wp.json',
        noteRules: moduleConfig?.data?.noteRules || 'data/aircraft-note-rules.json',
        weapons: moduleConfig?.data?.weapons || 'data/weapons.json',
        nameMapping: moduleConfig?.data?.nameMapping || 'data/aircraft-name-mapping.json',
        surfaceRadars: moduleConfig?.data?.surfaceRadars || 'data/surface-search-radars.json'
      },
      
      // Faction configuration
      factions: ['NATO', 'WP'],
      
      // Mission types that require special handling
      specialMissions: ['CSAR'],
      
      // Print layout options
      layout: {
        maxAircraftPerRow: 6,
        pageBreakBetweenFactions: true,
        groupSpecialMissions: true
      }
    };
  }

  /**
   * Generate printable flight sheet using Red Storm's designer layout
   * @param {Array} results - Array of flight results
   * @returns {Promise<void>}
   */
  async generatePrintableSheet(results) {
    if (!results || results.length === 0) {
      alert('No flights generated yet. Generate some flights first!');
      return;
    }

    try {
      // Load module data files
      const dataFiles = await this.loadDataFiles();
      
      // Process and sort flights
      const processedFlights = this.processFlights(results);
      const sortedFlights = this.sortFlights(processedFlights);

      // Generate flight cards using Red Storm's designer layout
      let allCardsHTML = '';
      const natoFlights = sortedFlights.filter(f => f.faction === 'NATO');
      const wpFlights = sortedFlights.filter(f => f.faction === 'WP');
      
      // Generate NATO cards first
      for (let i = 0; i < natoFlights.length; i++) {
        const flight = natoFlights[i];
        const isLastNATOFlight = i === natoFlights.length - 1 && wpFlights.length > 0;
        
        const cardHTML = await this.generateDesignerFlightCard(
          flight,
          dataFiles.aircraftNATO,
          dataFiles.aircraftWP,
          dataFiles.noteRules,
          dataFiles.weapons,
          dataFiles.nameMapping,
          isLastNATOFlight
        );
        allCardsHTML += cardHTML;
      }
      
      // Generate WP cards
      for (const flight of wpFlights) {
        const cardHTML = await this.generateDesignerFlightCard(
          flight,
          dataFiles.aircraftNATO,
          dataFiles.aircraftWP,
          dataFiles.noteRules,
          dataFiles.weapons,
          dataFiles.nameMapping,
          false
        );
        allCardsHTML += cardHTML;
      }

      // Create complete HTML document
      const htmlContent = this.generateDesignerSheetHTML(allCardsHTML);
      
      // Create print window and display
      const printWindow = this.createPrintWindow();
      if (!printWindow) {
        alert('Please allow pop-ups to generate flight sheets');
        return;
      }
      
      this.writeToPrintWindow(printWindow, htmlContent);
      
    } catch (error) {
      console.error('Error generating flight sheet:', error);
      alert('Error generating flight sheet. Check console for details.');
    }
  }

  /**
   * Generate a single designer flight card
   * @param {object} flight - Flight result object
   * @param {object} aircraftNATO - NATO aircraft database
   * @param {object} aircraftWP - WP aircraft database  
   * @param {object} noteRulesData - Aircraft note rules database
   * @param {object} weaponsData - Weapons database
   * @param {object} nameMappingData - Aircraft name mapping
   * @param {boolean} isLastNATOFlight - Whether this is the last NATO flight
   * @returns {Promise<string>} HTML for flight card
   */
  async generateDesignerFlightCard(flight, aircraftNATO, aircraftWP, noteRulesData, weaponsData, nameMappingData, isLastNATOFlight = false) {
    // Parse result text to extract flight info
    const resultText = flight.result || flight.text || '';
    const faction = flight.faction || 'NATO';

    
    const flightsArray = flight.flights || (flight.result && typeof flight.result === 'object' && flight.result.flights);
    const taskingsArray = flight.taskings || (flight.result && typeof flight.result === 'object' && flight.result.taskings);

    if (Array.isArray(flightsArray) || Array.isArray(taskingsArray)) {
      const entries = Array.isArray(flightsArray) ? flightsArray : taskingsArray;
      let allHTML = '';
      const cardGroups = [];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const mergedFlight = {
          ...flight,
          ...entry,
          flights: null,
          taskings: null,
          result: entry.text || entry.result || resultText
        };
        const isLastPart = i === entries.length - 1;
        const applyPageBreakToThisFlight = isLastNATOFlight && isLastPart;

        const cardHTML = await this.generateDesignerFlightCard(
          mergedFlight,
          aircraftNATO,
          aircraftWP,
          noteRulesData,
          weaponsData,
          nameMappingData,
          applyPageBreakToThisFlight
        );

        const isCSARGroup = cardHTML.includes('compact-csar-card');
        cardGroups.push({ html: cardHTML, isCsar: isCSARGroup });

        if (isCSARGroup) {
          const pageBreakStyle = applyPageBreakToThisFlight ? ' style="page-break-after: always;"' : '';
          allHTML += `<div class="csar-container"${pageBreakStyle}>\n${cardHTML}\n</div>\n`;
        } else {
          allHTML += cardHTML;
        }
      }

      return allHTML;
    }

    // Single flight processing
    // Priority: Use structured data from table processors, fallback to defaults
    let aircraftType = flight.aircraftType || 'Unknown';
    let aircraftId = flight.aircraftId || null;
    let flightSize = flight.flightSize || 2;
    let numFlights = flight.flightCount || 1;
    let nationCode = flight.actualNationality || flight.nationality || flight.nationCode || '';
    
    console.log('[FLIGHT CARD] Starting card generation for:', aircraftType);
    console.log('[FLIGHT CARD] Initial nationality from flight.nationality:', nationCode);
    console.log('[FLIGHT CARD] Full flight object:', flight);
    let tasking = flight.tasking || '';
    let rolledOrdnance = '';
    
    // Determine if this tasking should display ordnance
    // Only air-to-ground attack missions show ordnance on flight cards
    const ordnanceTaskings = ['SEAD', 'Bombing', 'Strike', 'Deep Strike', 'Naval Strike', 'Rescue Support'];
    const shouldShowOrdnance = ordnanceTaskings.some(t => tasking.includes(t));
    
    // Process ordnance from structured data - filter out base "Bombs/CBU/Rockets"
    if (flight.ordnance && shouldShowOrdnance) {
      const fullOrdnance = flight.ordnance;
      
      if (fullOrdnance.includes('+')) {
        // Split on '+' and remove "Bombs/CBU/Rockets", keep additional ordnance
        const parts = fullOrdnance.split('+').map(p => p.trim());
        const additionalParts = parts.filter(part => 
          part !== 'Bombs/CBU/Rockets' && 
          part !== ''
        );
        if (additionalParts.length > 0) {
          rolledOrdnance = '+' + additionalParts.join(' +');
        }
      } else if (fullOrdnance !== 'Bombs/CBU/Rockets') {
        // Single ordnance that's not just base load
        rolledOrdnance = fullOrdnance;
      }
    }
    
    const missingFields = [];
    if (!aircraftType || aircraftType === 'Unknown') missingFields.push('aircraftType');
    if (!aircraftId && (!aircraftType || aircraftType === 'Unknown')) missingFields.push('aircraftId');
    if (!flight.flightSize) missingFields.push('flightSize');
    if (!flight.flightCount) missingFields.push('flightCount');
    if (!nationCode) missingFields.push('nationality');
    if (!tasking) missingFields.push('tasking');
    if (missingFields.length > 0) {
      console.warn('[FLIGHT CARD] Missing structured fields; legacy parsing disabled:', {
        missingFields,
        flight,
        resultText
      });
    }

    const originalAircraftType = aircraftType;

    // Apply name mapping
    const factionKey = faction === 'NATO' ? 'NATO' : 'WP';
    let mappedName = null;
    if (typeof aircraftType === 'string') {
      aircraftType = aircraftType.trim();
    }

    if (nameMappingData && nameMappingData[factionKey] && aircraftType && typeof aircraftType === 'string') {
      let mappedEntry = null;
      
      if (factionKey === 'WP' && nationCode && nameMappingData[factionKey][nationCode]) {
        mappedEntry = nameMappingData[factionKey][nationCode][aircraftType];
      }
      
      if (!mappedEntry && nameMappingData[factionKey][aircraftType]) {
        mappedEntry = nameMappingData[factionKey][aircraftType];
      }
      
      if (mappedEntry) {
        if (typeof mappedEntry === 'string') {
          mappedName = mappedEntry;
        } else if (typeof mappedEntry === 'object') {
          if (mappedEntry.name) {
            mappedName = mappedEntry.name;
          }
          if (!aircraftId && mappedEntry.aircraftId) {
            aircraftId = mappedEntry.aircraftId;
          }
        }
      }
    } else if (typeof aircraftType !== 'string') {
      console.error('Aircraft type is not a string:', aircraftType, typeof aircraftType);
      aircraftType = String(aircraftType || 'Unknown');
    }
    
    // Get aircraft data - check by key, then by aliases
    const aircraftDB = faction === 'NATO' ? aircraftNATO : aircraftWP;
    let rawAircraftData = null;
    let matchedAircraftKey = null;

    if (mappedName && aircraftDB && Object.prototype.hasOwnProperty.call(aircraftDB, mappedName)) {
      aircraftType = mappedName;
    } else if (mappedName) {
      console.warn('[AIRCRAFT LOOKUP] Mapping name not found in DB, keeping original aircraftType:', {
        originalAircraftType: aircraftType,
        mappedName
      });
    }
    
    console.log(`[AIRCRAFT LOOKUP] Searching for: "${aircraftType}" (type: ${typeof aircraftType}) in ${faction} database`);
    console.log(`[AIRCRAFT LOOKUP] Flight object keys:`, Object.keys(flight));
    console.log(`[AIRCRAFT LOOKUP] Flight.aircraftType:`, flight.aircraftType);
    console.log(`[AIRCRAFT LOOKUP] Flight.nationality:`, flight.nationality);
    console.log(`[AIRCRAFT LOOKUP] Flight.tasking:`, flight.tasking);
    console.log(`[AIRCRAFT LOOKUP] Flight.aircraftId:`, aircraftId);
    

    const aircraftIdIndex = this.aircraftIdIndex ? this.aircraftIdIndex[factionKey] : null;

    if (aircraftId && aircraftIdIndex && aircraftIdIndex[aircraftId]) {
      rawAircraftData = aircraftIdIndex[aircraftId].data;
      matchedAircraftKey = aircraftIdIndex[aircraftId].key;
      console.log(`[AIRCRAFT LOOKUP] Found by aircraftId "${aircraftId}" -> "${matchedAircraftKey}"`);
    } else if (aircraftId && aircraftIdIndex) {
      console.warn(`[AIRCRAFT LOOKUP] No aircraft found for aircraftId "${aircraftId}" in ${faction} database`);
    }

    // First try exact match by key
    const hasExactKey = !!(aircraftType && aircraftDB && Object.prototype.hasOwnProperty.call(aircraftDB, aircraftType));
    if (!rawAircraftData && hasExactKey) {
      rawAircraftData = aircraftDB[aircraftType];
      matchedAircraftKey = aircraftType;
      console.log(`[AIRCRAFT LOOKUP] ?" Found exact match for "${aircraftType}"`);
    }

    if (!rawAircraftData && aircraftId && aircraftDB && typeof aircraftDB === 'object') {
      for (const [key, data] of Object.entries(aircraftDB)) {
        if (key.startsWith('_')) continue;
        if (data && data.id === aircraftId) {
          rawAircraftData = data;
          matchedAircraftKey = key;
          console.log(`[AIRCRAFT LOOKUP] Found by aircraftId scan "${aircraftId}" -> "${matchedAircraftKey}"`);
          break;
        }
      }
    }

    if (!rawAircraftData) {
      console.log(`[AIRCRAFT LOOKUP] No exact match, searching aliases...`);
      // Search by aliases
      for (const [key, data] of Object.entries(aircraftDB)) {
        if (key.startsWith('_')) continue;
        
        if (data.aliases && Array.isArray(data.aliases)) {
          if (data.aliases.includes(aircraftType)) {
            rawAircraftData = data;
            matchedAircraftKey = key;
            console.log(`[AIRCRAFT LOOKUP] ?" Found via alias "${aircraftType}" -> "${key}"`);
            break;
          }
        }
      }
    }

    if (!rawAircraftData) {
      console.error(`[AIRCRAFT LOOKUP] ?- FAILED: Aircraft not found: "${aircraftType}" in ${faction} database`);
      console.error(`[AIRCRAFT LOOKUP] Available aircraft in ${faction}:`, Object.keys(aircraftDB).filter(k => !k.startsWith('_')).slice(0, 10).join(', '), '...');
    }

    if (!rawAircraftData) {
      console.warn(`Skipping flight card generation - aircraft "${aircraftType}" not found`);
      return '';
    }
    
    // Convert to designer format
    let aircraftData = this.convertAircraftData(rawAircraftData, nationCode, weaponsData, aircraftType);

    const aliasRequested = originalAircraftType && rawAircraftData.aliases && Array.isArray(rawAircraftData.aliases)
      ? rawAircraftData.aliases.includes(originalAircraftType)
      : false;
    if (aliasRequested && aircraftData) {
      const canonicalKey = matchedAircraftKey || aircraftType;
      const shouldOverride = canonicalKey && canonicalKey !== originalAircraftType;
      if (shouldOverride) {
        aircraftData.model = this.applyAliasDisplayName(
          aircraftData.model,
          canonicalKey,
          originalAircraftType
        );
      }
    }
    
    // Apply note rules if available
    if (noteRulesData && window.applyDesignerNoteRules) {
      const sourceTable = flight.sourceTable || flight.table || '';
      // Use the aircraft's module field and nation field from the aircraft data
      const moduleCode = aircraftData.module || rawAircraftData.module || 'RS';
      const aircraftNation = rawAircraftData.nation || nationCode;
      aircraftData = window.applyDesignerNoteRules(aircraftData, tasking, noteRulesData, aircraftNation, sourceTable, weaponsData, moduleCode);
    }
    
    // Generate cards for each flight
    let allCardsHTML = '';
    let hasCSAR = false;
    let csarCardCount = 0;
    const csarGroupSize = 4;
    
    for (let flightNum = 0; flightNum < numFlights; flightNum++) {
      const isLastCard = flightNum === numFlights - 1;
      const applyPageBreak = isLastNATOFlight && isLastCard;
      
      // Detect CSAR by tasking or capabilities (all CSAR flights are helicopters)
      const isCSAR = tasking && tasking.toUpperCase().trim() === 'CSAR';
      // Use compact cards for all CSAR helicopters (they have minimal/no combat data)
      const hasCSARCapability = aircraftData && aircraftData.capabilities && aircraftData.capabilities.includes('CSAR');
      const useCompactCSAR = isCSAR || hasCSARCapability;
      console.log(`Flight ${flightNum + 1}/${numFlights}: ${aircraftType}, Tasking: "${tasking}", CSAR: ${isCSAR}, Has CSAR capability: ${hasCSARCapability}, Compact: ${useCompactCSAR}`);
      
      if (useCompactCSAR) {
        hasCSAR = true;
        
        // Start new CSAR container if this is the first card or we've hit the group size
        if (csarCardCount === 0) {
          allCardsHTML += '<div class="csar-container">\n';
        }
        
        console.log(`Generating compact CSAR card for ${aircraftType}`);
        allCardsHTML += this.generateCompactCSARCard(
          aircraftType,
          aircraftData,
          flightSize,
          nationCode,
          tasking,
          faction,
          false  // Never apply page break to individual cards
        );
        
        csarCardCount++;
        
        // Close container after 4 cards or if this is the last card
        if (csarCardCount === csarGroupSize || isLastCard) {
          allCardsHTML += '</div>\n';
          
          // Apply page break wrapper if this is the last NATO flight and last CSAR card
          const needsPageBreak = isLastNATOFlight && isLastCard;
          if (needsPageBreak) {
            // Wrap the last container in a page break div
            const lastContainerStart = allCardsHTML.lastIndexOf('<div class="csar-container">');
            const beforeContainer = allCardsHTML.substring(0, lastContainerStart);
            const container = allCardsHTML.substring(lastContainerStart);
            allCardsHTML = beforeContainer + '<div style="page-break-after: always !important; break-after: page !important;" class="page-break-after-nato">\n' + container + '</div>\n';
          }
          
          csarCardCount = 0;
        }
      } else {
        console.log(`Generating regular designer card for ${aircraftType}`);
        allCardsHTML += this.generateSingleDesignerCard(
          aircraftType,
          aircraftData,
          flightSize,
          nationCode,
          tasking,
          faction,
          applyPageBreak,
          rolledOrdnance
        );
      }
    }
    
    // Close any unclosed CSAR container (shouldn't happen but safety check)
    if (hasCSAR && csarCardCount > 0) {
      allCardsHTML += '</div>\n';
      
      // Apply page break if needed
      const needsPageBreak = isLastNATOFlight;
      if (needsPageBreak) {
        // Wrap the last container in a page break div
        const lastContainerStart = allCardsHTML.lastIndexOf('<div class="csar-container">');
        const beforeContainer = allCardsHTML.substring(0, lastContainerStart);
        const container = allCardsHTML.substring(lastContainerStart);
        allCardsHTML = beforeContainer + '<div style="page-break-after: always !important; break-after: page !important;" class="page-break-after-nato">\n' + container + '</div>\n';
      }
    }
    
    return allCardsHTML;
  }


  /**
   * Convert JSON aircraft data to designer display format
   * @param {object} jsonData - Raw aircraft JSON from database
   * @param {string} nationCode - Nation code for display
   * @param {object} weaponsData - Weapons database with ratings
   * @param {string} aircraftKey - Aircraft type key from database
   * @returns {object} Designer-formatted aircraft data
   */
  convertAircraftData(jsonData, nationCode, weaponsData, aircraftKey = null) {
    if (!jsonData) return null;
    
    const printConfig = this.moduleConfig?.print;
    const dataStructure = printConfig?.dataStructure;
    const conversion = printConfig?.conversion;
    
    // Helper function to get nested property value
    function getNestedValue(obj, path) {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    // Helper function to extract speed for a specific altitude band (Red Storm format)
    function extractSpeedForBand(speedString, index) {
      if (!speedString || speedString === 'N/A') return 'N/A';
      const values = speedString.split('/');
      return values[index] || 'N/A';
    }
    
    // Helper function to look up weapon ratings
    function getWeaponRatings(weaponName, weaponClass) {
      if (!weaponName || !weaponsData) return { stdRtg: 0, bvrRtg: null };
      
      const category = weaponClass === 'Gun' ? weaponsData.guns : weaponsData.missiles;
      if (!category) return { stdRtg: 0, bvrRtg: null };
      
      const weapon = category[weaponName];
      if (weapon) {
        return { stdRtg: weapon.stdRtg || 0, bvrRtg: weapon.bvrRtg };
      }
      
      return { stdRtg: 0, bvrRtg: null };
    }
    
    // Build weapon display strings based on module configuration
    let gunDisplay = '';
    let irmDisplay = '';
    let rhmDisplay = '';
    
    if (dataStructure?.weaponPaths) {
      const gunName = getNestedValue(jsonData, dataStructure.weaponPaths.gun);
      const gunDepletion = getNestedValue(jsonData, dataStructure.weaponPaths.gunDepletion);
      
      if (gunName && gunDepletion) {
        const { stdRtg } = getWeaponRatings(gunName, 'Gun');
        gunDisplay = `+${stdRtg} {${gunDepletion}}`;
      }
      
      const irmName = getNestedValue(jsonData, dataStructure.weaponPaths.irm);
      const irmDepletion = getNestedValue(jsonData, dataStructure.weaponPaths.irmDepletion);
      
      if (irmName && irmDepletion) {
        const { stdRtg, bvrRtg } = getWeaponRatings(irmName, 'IRM');
        const bvrStr = bvrRtg !== null ? `/${bvrRtg >= 0 ? '+' : ''}${bvrRtg}` : '/NA';
        irmDisplay = `+${stdRtg}${bvrStr} {${irmDepletion}}`;
      }
      
      const rhmName = getNestedValue(jsonData, dataStructure.weaponPaths.rhm);
      const rhmDepletion = getNestedValue(jsonData, dataStructure.weaponPaths.rhmDepletion);
      
      if (rhmName && rhmDepletion) {
        // Handle multiple RHM weapons (e.g., F-14A with AIM-7M and AIM-54C)
        if (Array.isArray(rhmName) && Array.isArray(rhmDepletion)) {
          const rhmParts = rhmName.map((weapon, index) => {
            const { stdRtg, bvrRtg } = getWeaponRatings(weapon, 'RHM');
            const stdStr = typeof stdRtg === 'string' && (stdRtg.startsWith('+') || stdRtg.startsWith('-')) 
              ? stdRtg 
              : `+${stdRtg}`;
            const bvrStr = bvrRtg !== null ? `/${bvrRtg >= 0 ? '+' : ''}${bvrRtg}` : '';
            return `${stdStr}${bvrStr} {${rhmDepletion[index]}}`;
          });
          rhmDisplay = rhmParts.join(', ');
        } else {
          // Single RHM weapon
          const { stdRtg, bvrRtg } = getWeaponRatings(rhmName, 'RHM');
          const stdStr = typeof stdRtg === 'string' && (stdRtg.startsWith('+') || stdRtg.startsWith('-')) 
            ? stdRtg 
            : `+${stdRtg}`;
          const bvrStr = bvrRtg !== null ? `/${bvrRtg >= 0 ? '+' : ''}${bvrRtg}` : '';
          rhmDisplay = `${stdStr}${bvrStr} {${rhmDepletion}}`;
        }
      }
    }
    
    // Build radar display
    let radarDisplay = null;
    let radarModifier = null;
    let surfaceRadarDisplay = null;
    
    if (jsonData.radar) {
      if (typeof jsonData.radar === 'object' && jsonData.radar.name) {
        // Radar is an object with air-to-air capabilities
        radarDisplay = jsonData.radar.name;
        if (jsonData.radar.type) {
          // For dual-mode radars, exclude "Surf" and any associated range from the air-to-air display
          let airRadarType = jsonData.radar.type;
          // Remove "Surf [number]" or just "Surf" from the type string
          airRadarType = airRadarType.replace(/,?\s*Surf\s*\[\d+\]/gi, '').replace(/,?\s*Surf/gi, '');
          // Clean up any trailing commas or extra spaces
          airRadarType = airRadarType.replace(/,\s*$/, '').replace(/^\s*,/, '').trim();
          if (airRadarType) radarDisplay += ` ${airRadarType}`;
        }
        if (jsonData.radar.range) radarDisplay += ` [${jsonData.radar.range}]`;
        if (jsonData.radar.modifier) radarModifier = jsonData.radar.modifier;
        
        // Always check if surface radar data exists for this aircraft
        const lookupKey = aircraftKey ? aircraftKey.replace(/\s*\([^)]*\)\s*/g, '').trim() : (jsonData.name || jsonData.model);
        const surfRadar = this.lookupSurfaceRadar(lookupKey, aircraftKey);
        if (surfRadar) {
          const surfParts = [];
          // Only include radar name if it's different from the air-to-air radar
          if (surfRadar.radar && surfRadar.radar !== jsonData.radar.name) {
            surfParts.push(surfRadar.radar);
          }
          if (surfRadar.col) surfParts.push(`Col ${surfRadar.col}`);
          if (surfRadar.detect) surfParts.push(surfRadar.detect);
          if (surfRadar.arcs) surfParts.push(`Arcs ${surfRadar.arcs}`);
          surfaceRadarDisplay = `Surf: ${surfParts.join(', ')}`;
        }
      } else if (jsonData.radar === 'Surf' || jsonData.radar === 'surf') {
        // Radar is surface-only
        // Try multiple lookup keys: stripped aircraft key, original aircraft key, and aircraft name
        const lookupKey = aircraftKey ? aircraftKey.replace(/\s*\([^)]*\)\s*/g, '').trim() : (jsonData.name || jsonData.model);
        console.log('Surface radar lookup for:', { aircraftKey, lookupKey, name: jsonData.name });
        
        // Try lookups in order: stripped key, original key, name field
        let surfRadar = this.lookupSurfaceRadar(lookupKey, aircraftKey);
        if (!surfRadar && jsonData.name && jsonData.name !== lookupKey && jsonData.name !== aircraftKey) {
          surfRadar = this.lookupSurfaceRadar(jsonData.name);
        }
        
        console.log('Surface radar result:', surfRadar);
        if (surfRadar) {
          const surfParts = [];
          surfParts.push('Surf:');
          if (surfRadar.radar) surfParts.push(surfRadar.radar);
          if (surfRadar.col) surfParts.push(`Col ${surfRadar.col}`);
          if (surfRadar.detect) surfParts.push(surfRadar.detect);
          if (surfRadar.arcs) surfParts.push(`Arcs ${surfRadar.arcs}`);
          radarDisplay = surfParts.join(' ');
        } else {
          radarDisplay = 'Surf';
        }
      }
    }
    
    const rwrDisplay = (jsonData.rwr && jsonData.rwr !== '-' && jsonData.rwr !== '-/-') ? jsonData.rwr : null;
    const jamDisplay = (jsonData.jam && jsonData.jam !== '-' && jsonData.jam !== '-/-') ? jsonData.jam : null;
    
    const ordnanceStr = jsonData.ordnance && jsonData.ordnance.length > 0
      ? jsonData.ordnance.map(o => o.quantity ? `${o.type}(${o.quantity})` : o.type).join(', ')
      : '';
    
    const capabilitiesStr = jsonData.capabilities && jsonData.capabilities.length > 0
      ? jsonData.capabilities.join(', ')
      : '';
    
    // Handle speed data based on module configuration
    let speeds = {};
    let speedsLaden = null;
    
    if (conversion?.speedFormat === 'separated' && dataStructure?.speedPaths?.clean) {
      // Handle different speed orders: Red Storm (VH/H/M/L) vs Baltic Approaches (L/M/H/VH)
      const cleanSpeedData = getNestedValue(jsonData, dataStructure.speedPaths.clean);
      if (cleanSpeedData) {
        const altitudeBands = ['VH', 'H', 'M', 'L/D'];
        let indices;
        
        if (conversion?.speedOrder === 'LMHVH') {
          // Baltic Approaches order: L/M/H/VH (indices 0,1,2,3)
          indices = { 'L/D': 0, 'M': 1, 'H': 2, 'VH': 3 };
        } else {
          // Red Storm order: VH/H/M/L (indices 3,2,1,0) - default
          indices = { 'VH': 3, 'H': 2, 'M': 1, 'L/D': 0 };
        }
        
        altitudeBands.forEach(band => {
          const idx = indices[band];
          speeds[band] = {
            combat: extractSpeedForBand(cleanSpeedData.combat, idx),
            dash: extractSpeedForBand(cleanSpeedData.dash, idx),
            maneuver: extractSpeedForBand(cleanSpeedData.maneuver, idx)
          };
        });
      }
      
      // Handle laden speeds if available
      const ladenPath = dataStructure.speedPaths.laden;
      if (ladenPath) {
        const ladenSpeedData = getNestedValue(jsonData, ladenPath);
        if (ladenSpeedData) {
          speedsLaden = {};
          const altitudeBands = ['VH', 'H', 'M', 'L/D'];
          let indices;
          
          if (conversion?.speedOrder === 'LMHVH') {
            // Baltic Approaches order: L/M/H/VH (indices 0,1,2,3)
            indices = { 'L/D': 0, 'M': 1, 'H': 2, 'VH': 3 };
          } else {
            // Red Storm order: VH/H/M/L (indices 3,2,1,0) - default
            indices = { 'VH': 3, 'H': 2, 'M': 1, 'L/D': 0 };
          }
          
          altitudeBands.forEach(band => {
            const idx = indices[band];
            speedsLaden[band] = {
              combat: extractSpeedForBand(ladenSpeedData.combat, idx),
              dash: extractSpeedForBand(ladenSpeedData.dash, idx),
              maneuver: extractSpeedForBand(ladenSpeedData.maneuver, idx)
            };
          });
        }
      }
    } else if (conversion?.speedFormat === 'simple' && dataStructure?.speedPaths?.clean) {
      // Baltic Approaches format: simple speed values
      const speedData = getNestedValue(jsonData, dataStructure.speedPaths.clean);
      if (speedData && typeof speedData === 'object') {
        // Convert to Red Storm format for compatibility
        speeds = {
          'H': {
            combat: speedData.combat || '-',
            dash: speedData.dash || '-',
            maneuver: speedData.maneuver || '-'
          },
          'M': {
            combat: speedData.combat || '-',
            dash: speedData.dash || '-', 
            maneuver: speedData.maneuver || '-'
          },
          'L/D': {
            combat: speedData.combat || '-',
            dash: speedData.dash || '-',
            maneuver: speedData.maneuver || '-'
          }
        };
      }
    }
    
    // Get basic field values using module configuration
    const basicFields = dataStructure?.basicFields || {};
    
    return {
      model: getNestedValue(jsonData, basicFields.name) || getNestedValue(jsonData, basicFields.model) || jsonData.name,
      nation: getNestedValue(jsonData, basicFields.nation) || jsonData.nation || nationCode,
      crew: getNestedValue(jsonData, basicFields.crew) || jsonData.crew,
      rwy: getNestedValue(jsonData, basicFields.runway) || jsonData.runway || jsonData.rwy,
      fuel: getNestedValue(jsonData, basicFields.fuel) || jsonData.fuel,
      notes: getNestedValue(jsonData, basicFields.notes) || jsonData.notes,
      gun: gunDisplay,
      irm: irmDisplay,
      rhm: rhmDisplay,
      rwr: rwrDisplay,
      jam: jamDisplay,
      standoffJammingStrength: jsonData.standoffJammingStrength,
      ordnance: ordnanceStr,
      aam: jsonData.aam,
      bomb: jsonData.bomb,
      sight: jsonData.sight,
      capabilities: capabilitiesStr,
      speeds: speeds,
      speedsClean: speeds,
      speedsLaden: speedsLaden,
      radar: radarDisplay,
      radarModifier: radarModifier,
      surfaceRadar: surfaceRadarDisplay
    };
  }

  /**
   * Replace the canonical aircraft name on the card with the rolled alias while keeping any descriptive suffix.
   */
  applyAliasDisplayName(baseModel, canonicalKey, aliasName) {
    if (!aliasName) return baseModel;
    if (!baseModel) return aliasName;

    if (canonicalKey && canonicalKey !== aliasName && baseModel.includes(canonicalKey)) {
      return baseModel.replace(canonicalKey, aliasName);
    }

    const firstSpace = baseModel.indexOf(' ');
    if (firstSpace > 0) {
      return `${aliasName}${baseModel.substring(firstSpace)}`;
    }

    return aliasName;
  }

  /**
   * Generate a single flight card using exact designer layout
   * @param {string} aircraftType - Aircraft name
   * @param {object} aircraftData - Designer-formatted aircraft data
   * @param {number} flightSize - Number of aircraft in flight
   * @param {string} nationCode - Nation code (FRG, USSR, etc.)
   * @param {string} tasking - Mission tasking
   * @param {string} faction - NATO or WP
   * @param {boolean} applyPageBreak - Whether to apply page-break-before to this card
   * @param {string} rolledOrdnance - Ordnance additions from table roll
   * @returns {string} HTML for single flight card
   */
  generateSingleDesignerCard(aircraftType, aircraftData, flightSize, nationCode, tasking, faction, applyPageBreak = false, rolledOrdnance = '') {
    // Use default data if aircraft not found
    if (!aircraftData) {
      aircraftData = {
        model: aircraftType,
        crew: '?',
        rwy: '?',
        fuel: 18,
        notes: '',
        gun: '',
        irm: '',
        rhm: '',
        speeds: {}
      };
    }
    
    // Determine if laden values should be shown
    const airToGroundNoneTasks = ['CAP', 'Close Escort', 'Recon', 'Escort Jamming', 'Standoff Jamming', 'CSAR', 'Transport', 'Laser Designation', 'Chaff Laying', 'Fast FAC'];
    const hasAirToGroundOrdnance = (aircraftData.ordnance && aircraftData.ordnance.length > 0) || 
                                   (aircraftData.bomb && aircraftData.bomb !== '-');
    const showLaden = aircraftData.speedsLaden && hasAirToGroundOrdnance && !airToGroundNoneTasks.includes(tasking);
    
    // Determine roundel image
    const roundelMap = this.moduleConfig?.print?.roundels || {
      'US': 'USAF.jpg',
      'USAF': 'USAF.jpg',
      'USN': 'USAF.jpg',
      'USMC': 'USAF.jpg',
      'UK': 'UK.jpg',
      'UK(RAF)': 'UK.jpg',
      'UK(RN)': 'UK.jpg',
      'FRG': 'FRG.jpg',
      'FRG/DK': 'FRG.jpg',  // Default for mixed raids
      'DK': 'Denmark.jpg',
      'SE': 'Sweden.jpg',
      'BEL': 'Belgium.jpg',
      'Belgium': 'Belgium.jpg',
      'BE': 'Belgium.jpg',
      'BE/NE': 'Netherlands.jpg',
      'NE': 'Netherlands.jpg',
      'CAN': 'Canada.jpg',
      'Canada': 'Canada.jpg',
      'POL': 'Poland.jpg',
      'USSR': 'USSR.jpg',
      'GDR': 'GDR.jpg'
    };
    
    // For composite nationalities like "NE/CAN" or "BE/NE", the aircraft's own
    // nation from the database is more accurate for roundel selection than the
    // table's nationality group code. aircraftData.nation is set by
    // convertAircraftData() which prioritizes the JSON nation over the table code.
    const roundelImage = roundelMap[nationCode] || roundelMap[aircraftData.nation] || 'USAF.jpg';

    // Use configurable base path for roundel images (allows shared designer to override)
    const roundelBase = this.moduleConfig?.print?.roundelBasePath || '../../../shared/assets/roundels';

    console.log('[ROUNDEL] Nation code:', nationCode);
    console.log('[ROUNDEL] Aircraft nation:', aircraftData.nation);
    console.log('[ROUNDEL] Selected roundel:', roundelImage);

    // Add page break style if this is the last NATO flight
    const pageBreakStyle = applyPageBreak ? ' style="page-break-after: always !important;" class="page-break-after-nato"' : '';
    console.log(`[PAGE BREAK] Regular card - applyPageBreak: ${applyPageBreak}, aircraft: ${aircraftType}`);

    let html = `
  <div class="flight-card"${pageBreakStyle}>
    <!-- Flight-level information -->
    <div class="flight-info-section">
      <div class="flight-header">
        <div class="roundel-box-header">
          <img src="${roundelBase}/${roundelImage}" alt="${nationCode || aircraftData.nation || 'Unknown'} Roundel">
        </div>
        <div class="field">
          <div class="field-label">Aircraft</div>
          <div class="field-value">${aircraftData.model || aircraftType}</div>
        </div>
        <div class="field">
          <div class="field-label">Callsign</div>
          <div class="field-value"></div>
        </div>
        <div class="field">
          <div class="field-label">Counter</div>
          <div class="field-value"></div>
        </div>
        <div class="field">
          <div class="field-label">Aggr.</div>
          <div class="field-value"></div>
        </div>
      </div>
      
      <div class="tasking-fuel-row">
        <div class="field">
          <div class="field-label">Tasking</div>
          <div class="field-value">${tasking}</div>
        </div>
        ${aircraftData.capabilities && aircraftData.capabilities.includes('CSAR') ? `
        <div class="field">
          <div class="field-label">Fuel</div>
          <div class="field-value"></div>
        </div>
        ` : `
        <div class="fuel-box">
          <div class="fuel-label-value">
            <span class="field-label">Fuel</span>
            <span class="fuel-value">${aircraftData.fuel || 18}</span>
          </div>
          <div class="fuel-circles-container">
            ${typeof aircraftData.fuel === 'number' ? `
            <div class="fuel-circles-row">
              ${Array(Math.ceil(aircraftData.fuel / 2)).fill(0).map(() => 
                `<div class="fuel-circle"></div>`
              ).join('')}
            </div>
            <div class="fuel-circles-row">
              ${Array(Math.floor(aircraftData.fuel / 2)).fill(0).map(() => 
                `<div class="fuel-circle"></div>`
              ).join('')}
            </div>
            ` : ''}
          </div>
        </div>
        `}
        <div class="field">
          <div class="field-label">Notes</div>
          <div class="field-value">${aircraftData.notes || ''}</div>
        </div>
      </div>
      
      <div class="flight-weapons-row">
        <div class="weapons-display">
          ${aircraftData.gun ? `<div class="weapon-item">
            <span class="weapon-label">Gun:</span>
            <span>${aircraftData.gun}</span>
          </div>` : ''}
          ${aircraftData.irm ? `<div class="weapon-item">
            <span class="weapon-label">IRM:</span>
            <span>${aircraftData.irm}</span>
          </div>` : ''}
          ${aircraftData.rhm ? `<div class="weapon-item">
            <span class="weapon-label">RHM:</span>
            <span>${aircraftData.rhm}</span>
          </div>` : ''}
        </div>
        ${aircraftData.crew || aircraftData.rwy ? `<div style="display: flex; gap: 10px; font-size: 7pt;">
          ${aircraftData.crew ? `<div><strong>Crew:</strong> ${aircraftData.crew}</div>` : ''}
          ${aircraftData.rwy ? `<div><strong>Rwy:</strong> ${aircraftData.rwy}</div>` : ''}
        </div>` : ''}
      </div>
      
      ${aircraftData.ordnance || aircraftData.aam || aircraftData.bomb || (aircraftData.sight && aircraftData.sight !== '-') ? `<div style="padding: 1px 3px; background: #f5f5f5; font-size: 7pt; margin-bottom: 1px; line-height: 1.05;">
        ${aircraftData.aam ? `<strong>AAM:</strong> ${aircraftData.aam}` : ''}${(aircraftData.aam && aircraftData.ordnance && !airToGroundNoneTasks.includes(tasking)) ? ' | ' : ''}${aircraftData.ordnance && !airToGroundNoneTasks.includes(tasking) ? `<strong>Ordnance:</strong> ${aircraftData.ordnance}` : ''}${((aircraftData.aam || aircraftData.ordnance) && aircraftData.bomb && !airToGroundNoneTasks.includes(tasking)) ? ' | ' : ''}${aircraftData.bomb && !airToGroundNoneTasks.includes(tasking) ? `<strong>Bomb:</strong> ${aircraftData.bomb}` : ''}${((aircraftData.aam || aircraftData.ordnance || aircraftData.bomb) && aircraftData.sight && aircraftData.sight !== '-' && !airToGroundNoneTasks.includes(tasking)) ? ' | ' : ''}${aircraftData.sight && aircraftData.sight !== '-' && !airToGroundNoneTasks.includes(tasking) ? `<strong>Sight:</strong> ${aircraftData.sight}` : ''}
      </div>` : ''}
      
      ${aircraftData.radar || aircraftData.surfaceRadar || aircraftData.rwr || aircraftData.jam || aircraftData.standoffJammingStrength ? `<div style="padding: 1px 3px; background: #f5f5f5; font-size: 7pt; margin-bottom: 1px; line-height: 1.05;">
        ${aircraftData.radar ? `<strong>Radar:</strong> ${aircraftData.radar} ${aircraftData.radarModifier || ''}` : ''}
        ${aircraftData.radar && aircraftData.surfaceRadar ? ' | ' : ''}
        ${aircraftData.surfaceRadar ? `${aircraftData.surfaceRadar}` : ''}
        ${(aircraftData.radar || aircraftData.surfaceRadar) && aircraftData.rwr ? ' | ' : ''}
        ${aircraftData.rwr ? `<strong>RWR:</strong> ${aircraftData.rwr}` : ''}
        ${(aircraftData.radar || aircraftData.surfaceRadar || aircraftData.rwr) && aircraftData.jam ? ' | ' : ''}
        ${aircraftData.jam ? `<strong>Jam:</strong> ${aircraftData.jam}` : ''}
        ${(aircraftData.radar || aircraftData.surfaceRadar || aircraftData.rwr || aircraftData.jam) && aircraftData.standoffJammingStrength ? ' | ' : ''}
        ${aircraftData.standoffJammingStrength ? `<strong>Standoff Jamming:</strong> ${aircraftData.standoffJammingStrength}` : ''}
      </div>` : ''}
      
      ${aircraftData.capabilities || (aircraftData.specialRules && aircraftData.specialRules.length > 0) ? `<div style="padding: 1px 3px; background: #f5f5f5; font-size: 7pt; margin-bottom: 1px; line-height: 1.05;">
        ${aircraftData.capabilities ? `<strong>Capabilities:</strong> ${aircraftData.capabilities}` : ''}${aircraftData.capabilities && aircraftData.specialRules && aircraftData.specialRules.length > 0 ? ' | ' : ''}${aircraftData.specialRules && aircraftData.specialRules.length > 0 ? `<strong>Notes:</strong> ${aircraftData.specialRules.join('; ')}` : ''}
      </div>` : ''}
      
      ${showLaden ? `
      <table class="speed-table">
        <tr>
          <th rowspan="2">Alt</th>
          <th colspan="3">Clean</th>
          <th colspan="3">Laden</th>
        </tr>
        <tr>
          <th>C</th>
          <th>D</th>
          <th>M</th>
          <th>C</th>
          <th>D</th>
          <th>M</th>
        </tr>
        ${Object.keys(aircraftData.speedsClean).filter(alt => {
          if (alt === 'VH') {
            const cleanValues = aircraftData.speedsClean[alt];
            const ladenValues = aircraftData.speedsLaden[alt];
            const isInvalid = (val) => val === '-' || val === 'N/A';
            return !(isInvalid(cleanValues.combat) && isInvalid(cleanValues.dash) && isInvalid(cleanValues.maneuver) &&
                     isInvalid(ladenValues.combat) && isInvalid(ladenValues.dash) && isInvalid(ladenValues.maneuver));
          }
          return true;
        }).map(alt => `
          <tr>
            <td><strong>${alt}</strong></td>
            <td>${aircraftData.speedsClean[alt].combat}</td>
            <td>${aircraftData.speedsClean[alt].dash}</td>
            <td>${aircraftData.speedsClean[alt].maneuver}</td>
            <td>${aircraftData.speedsLaden[alt].combat}</td>
            <td>${aircraftData.speedsLaden[alt].dash}</td>
            <td>${aircraftData.speedsLaden[alt].maneuver}</td>
          </tr>
        `).join('')}
      </table>
      ` : aircraftData.speeds && Object.keys(aircraftData.speeds).length > 0 ? `
      <table class="speed-table">
        <tr>
          <th>Alt</th>
          <th>C</th>
          <th>D</th>
          <th>M</th>
        </tr>
        ${Object.entries(aircraftData.speeds).filter(([alt, speeds]) => {
          if (alt === 'VH') {
            const isInvalid = (val) => val === '-' || val === 'N/A';
            return !(isInvalid(speeds.combat) && isInvalid(speeds.dash) && isInvalid(speeds.maneuver));
          }
          return true;
        }).map(([alt, speeds]) => `
          <tr>
            <td><strong>${alt}</strong></td>
            <td>${speeds.combat}</td>
            <td>${speeds.dash}</td>
            <td>${speeds.maneuver}</td>
          </tr>
        `).join('')}
      </table>
      ` : ''}
    </div>
    
    <!-- Individual aircraft boxes -->
    <div class="aircraft-grid">
      ${Array(parseInt(flightSize)).fill(0).map((_, i) => `
        <div class="aircraft-box">
          <div class="aircraft-header">
            <div class="aircraft-number">${i + 1}</div>
            <div class="damage-boxes">
              <div class="damage-column">
                ${aircraftData.capabilities && aircraftData.capabilities.includes('CSAR') ? `
                <div class="damage-row">
                  <div class="damage-label">Damaged</div>
                  <div class="damage-checkbox"></div>
                </div>
                <div class="damage-row">
                  <div class="damage-label">Shot down</div>
                  <div class="damage-checkbox"></div>
                </div>
                ` : `
                <div class="damage-row">
                  <div class="damage-label">Damaged</div>
                  <div class="damage-checkbox"></div>
                </div>
                <div class="damage-row">
                  <div class="damage-label">Crippled</div>
                  <div class="damage-checkbox"></div>
                </div>
                <div class="damage-row">
                  <div class="damage-label">Destroyed</div>
                  <div class="damage-checkbox"></div>
                </div>
                `}
              </div>
            </div>
          </div>
          <div class="ordnance-area-small">
            <div class="ordnance-label-small">Ordnance</div>
            ${rolledOrdnance ? (() => {
              const items = rolledOrdnance.split('+').filter(item => item.trim().length > 0);
              return items.map(item => `<div style="font-size: 6pt; padding: 1px 3px; text-align: left; line-height: 1.1;">+${item.trim()}</div>`).join('');
            })() : ''}
          </div>
        </div>
      `).join('')}
    </div>
  </div>
    `;
    
    return html;
  }

  /**
   * Generate a compact half-width card for CSAR helicopters
   * @param {string} aircraftType - Aircraft model name
   * @param {object} aircraftData - Aircraft data from database
   * @param {number} flightSize - Number of aircraft in flight
   * @param {string} nationCode - Nation code for roundel
   * @param {string} tasking - Mission tasking
   * @param {string} faction - NATO or WP
   * @param {boolean} applyPageBreak - Whether to apply page break
   * @returns {string} HTML for compact CSAR card
   */
  generateCompactCSARCard(aircraftType, aircraftData, flightSize, nationCode, tasking, faction, applyPageBreak = false) {
    if (!aircraftData) {
      aircraftData = {
        model: aircraftType,
        capabilities: 'CSAR'
      };
    }
    
    const roundelMap = this.moduleConfig?.print?.roundels || {
      'US': 'USAF.jpg',
      'USAF': 'USAF.jpg',
      'USN': 'USAF.jpg',
      'USMC': 'USAF.jpg',
      'UK': 'UK.jpg',
      'UK(RAF)': 'UK.jpg',
      'UK(RN)': 'UK.jpg',
      'FRG': 'FRG.jpg',
      'FRG/DK': 'FRG.jpg',
      'DK': 'Denmark.jpg',
      'SE': 'Sweden.jpg',
      'BEL': 'Belgium.jpg',
      'Belgium': 'Belgium.jpg',
      'BE': 'Belgium.jpg',
      'BE/NE': 'Netherlands.jpg',
      'NE': 'Netherlands.jpg',
      'CAN': 'Canada.jpg',
      'Canada': 'Canada.jpg',
      'POL': 'Poland.jpg',
      'USSR': 'USSR.jpg',
      'GDR': 'GDR.jpg'
    };
    
    const roundelImage = roundelMap[nationCode] || roundelMap[aircraftData.nation] || 'USAF.jpg';

    // Use configurable base path for roundel images (allows shared designer to override)
    const roundelBase = this.moduleConfig?.print?.roundelBasePath || '../../../shared/assets/roundels';

    // Don't apply page break to individual compact cards - the container handles it
    const pageBreakStyle = '';

    let html = `
  <div class="compact-csar-card"${pageBreakStyle}>
    <div class="compact-csar-header">
      <div class="roundel-box-compact">
        <img src="${roundelBase}/${roundelImage}" alt="${nationCode || aircraftData.nation || 'Unknown'} Roundel">
      </div>
      <div class="field">
        <div class="field-label">Aircraft</div>
        <div class="field-value">${aircraftData.model || aircraftType}</div>
      </div>
      <div class="field">
        <div class="field-label">Callsign</div>
        <div class="field-value"></div>
      </div>
    </div>
    
    <div class="compact-csar-info">
      <div class="field">
        <div class="field-label">Tasking</div>
        <div class="field-value">${tasking}</div>
      </div>
    </div>
    
    <div class="compact-aircraft-grid">
      ${Array(flightSize).fill(0).map((_, i) => `
        <div class="compact-aircraft-box">
          <div class="aircraft-number-compact">${i + 1}</div>
          <div class="compact-damage-checks">
            <div class="compact-damage-item">
              <span class="compact-damage-label">Damaged</span>
              <div class="damage-checkbox-compact"></div>
            </div>
            <div class="compact-damage-item">
              <span class="compact-damage-label">Shot down</span>
              <div class="damage-checkbox-compact"></div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
    `;
    
    return html;
  }

  /**
   * Generate complete HTML document with designer styles for flight sheets
   * @param {string} flightCardsHTML - HTML for all flight cards
   * @returns {string} Complete HTML document
   */
  generateDesignerSheetHTML(flightCardsHTML) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Red Storm - Flight Sheets</title>
  <style>
    /* Base / Reset */
    *, *::before, *::after { box-sizing: border-box; }
    * { margin: 0; padding: 0; }
    html, body { margin: 0; padding: 0; background: #fff; color: #000; font-family: Arial, sans-serif; }
    body { padding: 5px; background: #f5f5f5; }
    @page { size: letter; margin: 0.25in; }
    @media print { .flight-card { break-inside: avoid; page-break-inside: avoid; } }
    
    .page-title { text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 6px; border-bottom: 2px solid black; padding-bottom: 2px; color: black; }
    .flight-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px; margin-bottom: 3px; }
    
    /* Flight Card Shell */
    .flight-card { border: 2px solid black; padding: 4px; background: white; color: black; display: flex; flex-direction: column; margin-bottom: 3px; height: 240pt; gap: 3px; }
    
    /* Compact CSAR Card Styles */
    .csar-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; margin-bottom: 3px; grid-column: 1 / -1; }
    .compact-csar-card { border: 2px solid black; padding: 4px; page-break-inside: avoid; background: white; color: black; display: flex; flex-direction: column; width: 100%; height: 125pt; box-sizing: border-box; font-size: 7pt; line-height: normal; }
    .compact-csar-header { display: grid; grid-template-columns: 24px 1fr 1fr; gap: 2px; margin-bottom: 1px; align-items: stretch; }
    .compact-csar-header .field { display: flex; flex-direction: column; justify-content: space-between; height: 100%; font-size: 5.5pt; }
    .roundel-box-compact { border: none; padding: 1px; display: flex; align-items: center; justify-content: center; background: white; width: 24px; height: 24px; overflow: hidden; }
    .roundel-box-compact img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .compact-csar-info { display: flex; gap: 2px; margin-bottom: 1px; border-bottom: 1px solid #666; padding-bottom: 1px; }
    .compact-csar-info .field { flex: 1; font-size: 5.5pt; }
    .compact-aircraft-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; padding: 0; flex: 1; }
    .compact-aircraft-box { border: 1px solid #666; padding: 1px; display: flex; flex-direction: column; align-items: center; gap: 1px; height: 100%; justify-content: flex-start; }
    .aircraft-number-compact { font-size: 5.5pt; font-weight: bold; text-align: center; padding: 1px; border: 1px solid #666; min-width: 12px; margin-bottom: 1px; }
    .compact-damage-checks { display: flex; flex-direction: column; gap: 2px; width: 100%; align-items: center; }
    .compact-damage-item { display: flex; justify-content: space-between; align-items: center; gap: 2px; width: 100%; padding: 0 1px; }
    .compact-damage-label { font-size: 6pt; line-height: 1; text-align: left; white-space: nowrap; flex: 1; }
    .damage-checkbox-compact { min-width: 12px; min-height: 12px; width: 12px; height: 12px; border: 1px solid #666; background: white; flex-shrink: 0; }
    
    .flight-info-section { border-bottom: 2px solid black; padding-bottom: 3px; margin-bottom: 3px; }
    .flight-header { display: grid; grid-template-columns: 50px auto 1.2fr 50px 0.8fr; gap: 3px; margin-bottom: 3px; align-items: stretch; }
    .roundel-box-header { border: none; padding: 2px; display: flex; align-items: center; justify-content: center; background: white; min-height: 18px; max-height: 28px; }
    .roundel-box-header img { max-width: 100%; height: 28px; width: auto; object-fit: contain; }
    .flight-weapons-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; padding: 2px; background: #f5f5f5; }
    .weapons-display { display: flex; gap: 15px; font-size: 7pt; }
    .weapon-item { display: flex; gap: 3px; }
    .weapon-item .weapon-label { font-weight: bold; }
    
    /* Aircraft Grid */
    .aircraft-grid { flex: 1 1 auto; min-height: 0; padding-bottom: 3px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; overflow: hidden; box-sizing: border-box; }
    .aircraft-box { border: 1px solid #666; padding: 3px; display: flex; flex-direction: column; align-items: center; position: relative; box-sizing: border-box; overflow: hidden; }
    .aircraft-header { display: flex; flex-direction: row; gap: 3px; margin-bottom: 3px; width: 100%; }
    .aircraft-number { border: 1px solid #666; width: 16px; height: 16px; background: white; box-sizing: border-box; display: flex; align-items: center; justify-content: center; font-size: 7pt; font-weight: bold; flex-shrink: 0; }
    .damage-boxes { display: flex; flex-direction: row; gap: 2px; }
    .damage-column { display: flex; flex-direction: column; gap: 1px; }
    .damage-row { display: flex; gap: 2px; align-items: center; }
    .damage-label { border: 1px solid #666; padding: 1px 3px; height: 16px; font-size: 6pt; background: white; display: flex; align-items: center; width: 42px; box-sizing: border-box; }
    .damage-checkbox { border: 1px solid #666; width: 16px; height: 16px; background: white; box-sizing: border-box; }
    .ordnance-area-small { border: none; border-top: 1px solid #666; padding: 6px 0 4px 0; min-height: 24px; width: 100%; background: white; flex: 1; overflow: hidden; font-size: 7pt; }
    .ordnance-label-small { font-size: 7pt; color: #999; font-style: italic; }
    .fuel-box { border: 1px solid #666; padding: 2px 4px; display: flex; align-items: center; gap: 4px; }
    .fuel-circles-row { display: flex; gap: 2px; }
    .fuel-circle { width: 10px; height: 10px; border: 1px solid #666; border-radius: 50%; background: white; }
    .field { border: 1px solid #666; padding: 2px 4px; min-height: 18px; max-height: 28px; overflow: hidden; white-space: nowrap; }
    .field-label { font-size: 7pt; color: #999; font-style: italic; }
    .field-value { font-weight: bold; font-size: 7pt; }
    .tasking-fuel-row { display: grid; grid-template-columns: 0.7fr 0.9fr 0.8fr; gap: 3px; margin-bottom: 3px; align-items: stretch; }
    .tasking-fuel-row .field { display: flex; flex-direction: column; min-height: 100%; }
    .fuel-label-value { display: flex; flex-direction: column; align-items: center; gap: 1px; font-size: 7pt; white-space: nowrap; }
    .fuel-label-value .field-label { margin: 0; }
    .fuel-label-value .fuel-value { font-weight: bold; font-size: 7pt; }
    .fuel-circles-container { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .speed-table { border: 1px solid #666; border-collapse: collapse; width: 100%; font-size: 6pt; margin-top: 2px; }
    .speed-table th, .speed-table td { border: 1px solid #666; padding: 1px 2px; text-align: center; }
    .speed-table th { background: #e0e0e0; font-weight: bold; }
    
    @media print {
      body { background: white; padding: 0; }
      .flight-card { page-break-inside: avoid; margin-bottom: 5px; }
      .flight-grid { page-break-inside: auto; }
      .page-break-after { page-break-after: always; }
      .page-break-after-nato { 
        page-break-after: always !important; 
        break-after: page !important;
        display: contents; /* Allow grid children to participate in parent grid */
      }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="flight-grid">
    ${flightCardsHTML}
  </div>
  <div class="no-print" style="text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px;">
    <p>Red Storm Tools Suite - Flight Sheets</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <button onclick="window.print()" style="margin-top: 10px; padding: 8px 20px; font-size: 14px; cursor: pointer;">Print Flight Sheets</button>
  </div>
</body>
</html>`;
  }

  /**
   * Load all required data files
   * @returns {Promise<Object>} Object containing loaded data
   */
  /**
   * Look up surface radar data for an aircraft
   * @param {string} aircraftName - Aircraft name to look up
   * @param {string} aircraftKey - Original aircraft key (optional)
   * @returns {object|null} Surface radar data or null
   */
  lookupSurfaceRadar(aircraftName, aircraftKey = null) {
    if (!this.surfaceRadarData) return null;
    
    // Try the provided name first
    if (this.surfaceRadarData[aircraftName]) {
      return this.surfaceRadarData[aircraftName];
    }
    
    // Try the original aircraft key if different
    if (aircraftKey && aircraftKey !== aircraftName && this.surfaceRadarData[aircraftKey]) {
      return this.surfaceRadarData[aircraftKey];
    }
    
    return null;
  }

  /**
   * Build an ID index for aircraft lookup by aircraftId
   * @param {object} aircraftDB - Aircraft database keyed by name
   * @returns {object} Map of aircraftId to { key, data }
   */
  buildAircraftIdIndex(aircraftDB) {
    const index = {};
    if (!aircraftDB || typeof aircraftDB !== 'object') return index;
    for (const [key, value] of Object.entries(aircraftDB)) {
      if (key.startsWith('_')) continue;
      if (value && value.id) {
        index[value.id] = { key, data: value };
      }
    }
    return index;
  }

  async loadDataFiles() {
    console.log('Loading merged data files for print generation...');
    
    // Get data files configuration - check both 'dataFiles' and 'data' properties
    const dataConfig = this.config.dataFiles || this.config.data;
    if (!dataConfig) {
      console.error('No data configuration found in module config');
      return {};
    }
    
    const promises = Object.entries(dataConfig).map(async ([key, path]) => {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          console.warn(`Failed to load ${key} from ${path}: ${response.status}`);
          return [key, {}];
        }
        const data = await response.json();
        return [key, data];
      } catch (error) {
        console.warn(`Error loading ${key} from ${path}:`, error);
        return [key, {}];
      }
    });
    
    const results = await Promise.all(promises);
    const loadedData = Object.fromEntries(results);
    
    // Build surface radar lookup table
    if (loadedData.surfaceRadars && loadedData.surfaceRadars.radars) {
      this.surfaceRadarData = {};
      loadedData.surfaceRadars.radars.forEach(entry => {
        this.surfaceRadarData[entry.aircraft] = entry;
      });
    }

    this.aircraftIdIndex = {
      NATO: this.buildAircraftIdIndex(loadedData.aircraftNATO),
      WP: this.buildAircraftIdIndex(loadedData.aircraftWP)
    };
    
    console.log('Successfully loaded merged data files containing both RS and BA data');
    return loadedData;
  }

  /**
   * Process flight results for print generation.
   *
   * Uses ResultSchema.normalize() to convert any processor result shape
   * (single-flight, multi-tasking, flights-array, combat-rescue) into
   * a canonical { flights: [...] } structure. Falls through to legacy
   * processing if ResultSchema is not loaded or validation fails.
   *
   * @param {Array} results - Raw flight results from processors
   * @returns {Array} Flat array of individual processed flights
   */
  processFlights(results) {
    const processedFlights = [];

    for (const flight of results) {
      // ---- New path: use ResultSchema adapter if available ----
      if (typeof ResultSchema !== 'undefined') {
        const normalized = ResultSchema.normalize(flight, flight.faction, flight.table || flight.sourceTable);
        const errors = ResultSchema.validate(normalized, normalized.table || 'unknown');

        if (errors.length === 0) {
          for (const f of normalized.flights) {
            processedFlights.push({
              ...f,
              faction: normalized.faction,
              table: normalized.table,
              raidType: normalized.raidType,
            });
          }
          continue;
        }
        // Fall through to legacy processing if validation failed
      }

      // ---- Legacy path (kept as fallback) ----
      // Handles cases where ResultSchema is not loaded or produced
      // validation errors. This block is the original processFlights logic.

      const flightsArray = flight.flights
        || (flight.result && typeof flight.result === 'object' && flight.result.flights);

      const taskingsArray = flight.taskings
        || (flight.result && typeof flight.result === 'object' && flight.result.taskings);

      if (flightsArray && Array.isArray(flightsArray)) {
        for (const individualFlight of flightsArray) {
          processedFlights.push({
            ...flight,
            ...individualFlight,
            flights: null,
            taskings: null,
            result: individualFlight.text || individualFlight.result || flight.text || flight.result,
            faction: flight.faction || individualFlight.faction || 'NATO'
          });
        }
      } else if (taskingsArray && Array.isArray(taskingsArray)) {
        for (const tasking of taskingsArray) {
          processedFlights.push({
            ...flight,
            ...tasking,
            flights: null,
            taskings: null,
            result: tasking.text,
            faction: flight.faction || tasking.faction || 'NATO'
          });
        }
      } else {
        processedFlights.push({
          ...flight,
          faction: flight.faction || 'NATO'
        });
      }
    }

    return processedFlights;
  }

  /**
   * Sort flights for print display (NATO first, then WP; CSAR at end of each faction)
   * @param {Array} flights - Processed flights
   * @returns {Object} Object with natoRegular, natoCSAR, wpRegular, wpCSAR arrays
   */

  sortFlights(flights) {
    const natoRegular = [];
    const natoCSAR = [];
    const wpRegular = [];
    const wpCSAR = [];
    
    for (const flight of flights) {
      const tasking = (flight.tasking || '').toUpperCase().trim();
      const isCSAR = tasking === 'CSAR';
      
      if (flight.faction === 'NATO') {
        if (isCSAR) {
          natoCSAR.push(flight);
        } else {
          natoRegular.push(flight);
        }
      } else {
        if (isCSAR) {
          wpCSAR.push(flight);
        } else {
          wpRegular.push(flight);
        }
      }
    }
    
    return { natoRegular, natoCSAR, wpRegular, wpCSAR };
  }


  /**
   * Create print window
   * @returns {Window|null} Print window or null if blocked
   */
  createPrintWindow() {
    return window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
  }

  /**
   * Write HTML content to print window
   * @param {Window} printWindow - Print window
   * @param {string} htmlContent - HTML content to write
   */
  writeToPrintWindow(printWindow, htmlContent) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Focus and trigger print dialog
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 100);
  }
}

// Export for global use
window.PrintGenerator = PrintGenerator;

console.log('OOB Generator: Shared print-generator.js framework loaded');
