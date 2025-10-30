/**
 * OOB Generator - Main Application Controller
 * 
 * Purpose:
 * - Initialize and coordinate all application modules
 * - Set up event listeners and UI bindings
 * - Manage application lifecycle
 * - Load and manage table data from JSON files
 * 
 * Phase 2 Implementation:
 * - Load table data from JSON files
 * - Provide data access for existing functions
 * - Maintain backward compatibility
 * 
 * Dependencies:
 * - nato-tables.json - NATO table data
 * - wp-tables.json - Warsaw Pact table data
 * - table-metadata.json - Table metadata
 */

class OOBApp {
  constructor() {
    this.natoTables = null;
    this.wpTables = null;
    this.tableMetadata = null;
    this.isDataLoaded = false;
    // Detect base path for GitHub Pages
    this.basePath = this.getBasePath();
  }

  getBasePath() {
    // Get the directory of the current page
    const path = window.location.pathname;
    if (path.includes('/oob-generator/')) {
      // If we're in the oob-generator directory, use relative paths
      return './';
    }
    // Fallback to relative path
    return './';
  }

  async initialize() {
    console.log('OOB Generator: Initializing...');
    console.log('Base path:', this.basePath);
    
    try {
      await this.loadTableData();
      this.setupDataBridge();
      console.log('OOB Generator: Initialization complete');
    } catch (error) {
      console.error('OOB Generator: Initialization failed:', error);
      // Fallback to embedded data in index.html
      console.log('OOB Generator: Falling back to embedded data');
    }
  }

  async loadTableData() {
    console.log('OOB Generator: Loading table data from JSON files...');
    
    try {
      const [natoResponse, wpResponse, metadataResponse] = await Promise.all([
        fetch(this.basePath + 'data/nato-tables.json'),
        fetch(this.basePath + 'data/wp-tables.json'), 
        fetch(this.basePath + 'data/table-metadata.json')
      ]);

      if (!natoResponse.ok || !wpResponse.ok || !metadataResponse.ok) {
        throw new Error(`Failed to load data files - NATO: ${natoResponse.status}, WP: ${wpResponse.status}, Metadata: ${metadataResponse.status}`);
      }

      this.natoTables = await natoResponse.json();
      this.wpTables = await wpResponse.json();
      this.tableMetadata = await metadataResponse.json();
      
      this.isDataLoaded = true;
      console.log('OOB Generator: Table data loaded successfully');
      console.log('NATO tables:', Object.keys(this.natoTables));
      console.log('WP tables:', Object.keys(this.wpTables));
    } catch (error) {
      console.error('Failed to load JSON data:', error);
      this.isDataLoaded = false;
      throw error;
    }
  }

  setupDataBridge() {
    // Create global oobTables object to maintain compatibility
    // with existing code in index.html
    if (this.isDataLoaded && typeof window !== 'undefined') {
      const jsonTables = this.getCombinedTables();
      
      // Make JSON data available globally
      window.oobTables = jsonTables;
      
      console.log('OOB Generator: Data bridge established - JSON data now globally available');
      console.log('Tables loaded:', Object.keys(jsonTables));
    }
  }

  getCombinedTables() {
    if (!this.isDataLoaded) return null;
    
    // Combine NATO and WP tables into single object
    // matching the original oobTables structure
    return {
      ...this.natoTables,
      ...this.wpTables
    };
  }

  getTableData(tableId) {
    if (!this.isDataLoaded) return null;
    
    // Remove metadata prefix if present
    const cleanTableId = tableId.replace(/^[A-L]$/, tableId);
    
    return this.natoTables[cleanTableId] || this.wpTables[cleanTableId] || null;
  }
}

// Initialize the app when DOM is ready
let oobApp = null;

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    oobApp = new OOBApp();
    await oobApp.initialize();
    
    // Make app globally available
    window.oobApp = oobApp;
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OOBApp;
}

console.log('OOB Generator: app.js module loaded (Phase 2 - Data Loading)');
