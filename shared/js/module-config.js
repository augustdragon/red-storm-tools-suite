/**
 * Module Configuration System
 * 
 * Defines all game modules (Red Storm, Baltic Approaches, future expansions)
 * and their specific configurations including table structures, nations, and data paths.
 */

const MODULES = {
  'red-storm': {
    id: 'red-storm',
    name: 'Red Storm',
    fullName: 'Red Storm: The Air War Over Central Germany, 1987',
    description: 'The base game covering NATO vs Warsaw Pact air operations over Central Europe',
    basePath: './oob-generator',
    
    // OOB Table Configuration
    tables: {
      nato: {
        prefix: '',  // Tables A-F
        range: ['A', 'B', 'C', 'D', 'E', 'F'],
        dataPath: './data/nato-tables.json'
      },
      wp: {
        prefix: '',  // Tables G-L
        range: ['G', 'H', 'I', 'J', 'K', 'L'],
        dataPath: './data/wp-tables.json'
      }
    },
    
    // Nation Configuration
    nations: {
      nato: [
        { code: 'US', name: 'United States', roundel: '../../../shared/assets/roundels/icons/US.png' },
        { code: 'UK', name: 'United Kingdom', roundel: '../../../shared/assets/roundels/icons/UK.png' },
        { code: 'FRG', name: 'West Germany', roundel: '../../../shared/assets/roundels/icons/FRG.png' },
        { code: 'BEL', name: 'Belgium', roundel: '../../../shared/assets/roundels/icons/Belgium.png' },
        { code: 'CAN', name: 'Canada', roundel: '../../../shared/assets/roundels/icons/Canada.png' },
        { code: 'HOL', name: 'Netherlands', roundel: '../../../shared/assets/roundels/icons/Netherlands.png' }
      ],
      wp: [
        { code: 'USSR', name: 'Soviet Union', roundel: '../../../shared/assets/roundels/icons/USSR.png' },
        { code: 'GDR', name: 'East Germany', roundel: '../../../shared/assets/roundels/icons/GDR.png' }
      ]
    },
    
    // Data Files
    data: {
      aircraftNATO: '../../../shared/data/aircraft-nato.json',
      aircraftWP: '../../../shared/data/aircraft-wp.json',
      weapons: '../../../shared/data/weapons.json',
      noteRules: '../../../shared/data/aircraft-note-rules.json',
      nameMapping: '../../../shared/data/aircraft-name-mapping.json'
    },
    
    // Print Generation Configuration
    print: {
      // Data structure mapping for aircraft databases
      dataStructure: {
        weaponPaths: {
          gun: 'weapons.gun',
          gunDepletion: 'weapons.gunDepletion',
          irm: 'weapons.irm', 
          irmDepletion: 'weapons.irmDepletion',
          rhm: 'weapons.rhm',
          rhmDepletion: 'weapons.rhmDepletion'
        },
        speedPaths: {
          clean: 'speeds.clean',
          laden: 'speeds.laden'
        },
        basicFields: {
          name: 'name',
          model: 'model',
          crew: 'crew',
          runway: 'runway',
          fuel: 'fuel',
          notes: 'notes',
          nation: 'nation'
        }
      },
      // Aircraft data conversion settings
      conversion: {
        speedFormat: 'separated',  // 'separated' (L/M/H/VH) vs 'simple' (single values)
        speedOrder: 'LMHVH',       // Red Storm uses L/M/H/VH order (same as Baltic Approaches)
        weaponFormat: 'complex',   // 'complex' (nested objects) vs 'simple' (direct properties)
        useNameMapping: true
      },
      // Roundel configuration
      roundels: {
        'US': 'USAF.jpg',
        'UK': 'UK.jpg', 
        'FRG': 'FRG.jpg',
        'BEL': 'Belgium.jpg',
        'Belgium': 'Belgium.jpg',
        'BE': 'Belgium.jpg',
        'CAN': 'Canada.jpg',
        'Canada': 'Canada.jpg',
        'HOL': 'Netherlands.jpg',
        'NE': 'Netherlands.jpg',
        'USSR': 'USSR.jpg',
        'GDR': 'GDR.jpg'
      }
    },
    
    // Features and Scenario Configuration
    features: {
      ships: false,
      scenarioDate: true  // Pre/Post June 1987
    },
    
    // Scenario Date Configuration
    scenarioDates: {
      'pre': {
        id: 'pre',
        label: 'Pre-6/1/87',
        buttonId: 'preDate',
        description: 'Before June 1, 1987'
      },
      'post': {
        id: 'post',
        label: '6/1/87 or later',
        buttonId: 'postDate',
        description: 'June 1, 1987 or later'
      }
    }
  },
  
  'baltic-approaches': {
    id: 'baltic-approaches',
    name: 'Baltic Approaches',
    fullName: 'Red Storm: Baltic Approaches',
    description: 'Northern European theater expansion covering Denmark, Sweden, and the Baltic Sea',
    basePath: './oob-generator',
    
    // OOB Table Configuration
    tables: {
      nato: {
        prefix: '2',  // Tables A2-F2
        range: ['A2', 'B2', 'C2', 'D2', 'E2', 'F2'],
        dataPath: './data/nato-tables.json'
      },
      wp: {
        prefix: '2',  // Tables G2-L2
        range: ['G2', 'H2', 'I2', 'J2', 'K2', 'L2'],
        dataPath: './data/wp-tables.json'
      }
    },
    
    // Nation Configuration
    nations: {
      nato: [
        { code: 'USA', name: 'United States', roundel: '../../../shared/assets/roundels/USAF.jpg' },
        { code: 'UK', name: 'United Kingdom', roundel: '../../../shared/assets/roundels/UK.jpg' },
        { code: 'FRG', name: 'West Germany', roundel: '../../../shared/assets/roundels/FRG.jpg' },
        { code: 'DK', name: 'Denmark', roundel: '../../../shared/assets/roundels/Denmark.jpg' },
        { code: 'SE', name: 'Sweden', roundel: '../../../shared/assets/roundels/Sweden.jpg' },
        { code: 'NE', name: 'Netherlands', roundel: '../../../shared/assets/roundels/Netherlands.jpg' }
      ],
      wp: [
        { code: 'USSR', name: 'Soviet Union', roundel: '../../../shared/assets/roundels/USSR.jpg' },
        { code: 'GDR', name: 'East Germany', roundel: '../../../shared/assets/roundels/GDR.jpg' },
        { code: 'POL', name: 'Poland', roundel: '../../../shared/assets/roundels/Poland.jpg' }
      ]
    },
    
    // Data Files
    data: {
      aircraftNATO: '../../../shared/data/aircraft-nato.json',
      aircraftWP: '../../../shared/data/aircraft-wp.json',
      weapons: '../../../shared/data/weapons.json',
      noteRules: '../../../shared/data/aircraft-note-rules.json',
      nameMapping: '../../../shared/data/aircraft-name-mapping.json',
      surfaceRadars: './data/surface-search-radars.json',
      shipsNATO: '../data/ships-nato.json',
      shipsWP: '../data/ships-wp.json'
    },
    
    // Print Generation Configuration
    print: {
      // Data structure mapping for Baltic Approaches aircraft databases
      dataStructure: {
        weaponPaths: {
          gun: 'weapons.gun',              // Nested structure like Red Storm
          gunDepletion: 'weapons.gunDepletion',
          irm: 'weapons.irm',
          irmDepletion: 'weapons.irmDepletion', 
          rhm: 'weapons.rhm',
          rhmDepletion: 'weapons.rhmDepletion'
        },
        speedPaths: {
          clean: 'speeds.clean',   // Baltic has complex speeds like Red Storm
          laden: 'speeds.laden'    // Baltic also has laden speeds
        },
        basicFields: {
          name: 'name',
          model: 'name',           // Baltic uses 'name' for model
          crew: 'crew',
          runway: 'rwy',           // Baltic uses 'rwy' field
          fuel: 'fuel',
          notes: 'notes',
          nation: 'nation'
        }
      },
      // Aircraft data conversion settings
      conversion: {
        speedFormat: 'separated',  // Baltic uses L/M/H/VH format like Red Storm
        speedOrder: 'LMHVH',       // Baltic order: L/M/H/VH vs Red Storm VH/H/M/L
        weaponFormat: 'complex',   // Baltic has nested weapon structure
        useNameMapping: true
      },
      // Roundel configuration
      roundels: {
        'USA': 'USAF.jpg',
        'US': 'USAF.jpg',
        'UK': 'UK.jpg',
        'FRG': 'FRG.jpg', 
        'DK': 'Denmark.jpg',
        'SE': 'Sweden.jpg',
        'NE': 'Netherlands.jpg',
        'USSR': 'USSR.jpg',
        'GDR': 'GDR.jpg',
        'POL': 'Poland.jpg'
      }
    },
    
    // Features and Scenario Configuration
    features: {
      ships: true,
      scenarioDate: true
    },
    
    // Scenario Date Configuration
    scenarioDates: {
      'may-early': {
        id: 'may-early',
        label: '15-20 May',
        buttonId: 'mayEarly',
        description: 'Early campaign period'
      },
      'may-late': {
        id: 'may-late',
        label: '21-31 May',
        buttonId: 'mayLate', 
        description: 'Mid campaign period'
      },
      'june-early': {
        id: 'june-early',
        label: '1-15 June',
        buttonId: 'juneEarly',
        description: 'Later campaign period'
      }
    }
  }
};

/**
 * Get module configuration by ID
 * @param {string} moduleId - Module identifier
 * @returns {object|null} Module configuration or null if not found
 */
function getModuleConfig(moduleId) {
  return MODULES[moduleId] || null;
}

/**
 * Get all available modules
 * @returns {array} Array of module configurations
 */
function getAllModules() {
  return Object.values(MODULES);
}

/**
 * Get nation configuration for a module
 * @param {string} moduleId - Module identifier
 * @param {string} faction - 'nato' or 'wp'
 * @returns {array} Array of nation objects
 */
function getModuleNations(moduleId, faction) {
  const module = MODULES[moduleId];
  if (!module || !module.nations[faction]) {
    return [];
  }
  return module.nations[faction];
}

/**
 * Get roundel path for a nation code
 * @param {string} moduleId - Module identifier
 * @param {string} nationCode - Nation code (e.g., 'US', 'USSR')
 * @returns {string|null} Path to roundel image or null
 */
function getNationRoundel(moduleId, nationCode) {
  const module = MODULES[moduleId];
  if (!module) return null;
  
  // Search both NATO and WP nations
  const allNations = [...module.nations.nato, ...module.nations.wp];
  const nation = allNations.find(n => n.code === nationCode);
  
  return nation ? nation.roundel : null;
}

/**
 * Get data file path for a module
 * @param {string} moduleId - Module identifier
 * @param {string} dataType - Type of data (e.g., 'aircraftNATO', 'weapons')
 * @returns {string|null} Path to data file or null
 */
function getModuleDataPath(moduleId, dataType) {
  const module = MODULES[moduleId];
  if (!module || !module.data[dataType]) {
    return null;
  }
  return module.data[dataType];
}

/**
 * Determine current module from URL or localStorage
 * @returns {string} Module ID
 */
function getCurrentModule() {
  // Check URL hash first (e.g., #red-storm or #baltic-approaches)
  const hash = window.location.hash.substring(1);
  if (hash && MODULES[hash]) {
    return hash;
  }
  
  // Check localStorage for last selected module
  const stored = localStorage.getItem('selectedModule');
  if (stored && MODULES[stored]) {
    return stored;
  }
  
  // Default to Red Storm
  return 'red-storm';
}

/**
 * Set current module (saves to localStorage and updates URL)
 * @param {string} moduleId - Module identifier
 */
function setCurrentModule(moduleId) {
  if (!MODULES[moduleId]) {
    console.error(`Invalid module ID: ${moduleId}`);
    return;
  }
  
  localStorage.setItem('selectedModule', moduleId);
  window.location.hash = moduleId;
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MODULES,
    getModuleConfig,
    getAllModules,
    getModuleNations,
    getNationRoundel,
    getModuleDataPath,
    getCurrentModule,
    setCurrentModule
  };
}

// Browser global
if (typeof window !== 'undefined') {
  window.ModuleConfig = {
    MODULES,
    getModuleConfig,
    getAllModules,
    getModuleNations,
    getNationRoundel,
    getModuleDataPath,
    getCurrentModule,
    setCurrentModule
  };
}

console.log('Module Configuration System loaded');
