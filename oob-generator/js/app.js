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
  }

  async initialize() {
    console.log('OOB Generator: Initializing...');
    
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
    
    const [natoResponse, wpResponse, metadataResponse] = await Promise.all([
      fetch('./data/nato-tables.json'),
      fetch('./data/wp-tables.json'), 
      fetch('./data/table-metadata.json')
    ]);

    if (!natoResponse.ok || !wpResponse.ok || !metadataResponse.ok) {
      throw new Error('Failed to load one or more data files');
    }

    this.natoTables = await natoResponse.json();
    this.wpTables = await wpResponse.json();
    this.tableMetadata = await metadataResponse.json();
    
    this.isDataLoaded = true;
    console.log('OOB Generator: Table data loaded successfully');
  }

  setupDataBridge() {
    // Create global oobTables object to maintain compatibility
    // with existing code in index.html
    if (this.isDataLoaded && typeof window !== 'undefined') {
      window.oobTablesFromJSON = this.getCombinedTables();
      console.log('OOB Generator: Data bridge established');
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
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OOBApp;
}

console.log('OOB Generator: app.js module loaded (Phase 2 - Data Loading)');
