/**
 * TableProcessorFactory - Factory for creating table processor instances
 * 
 * Purpose:
 * - Centralized processor instantiation
 * - Load and cache table data from JSON
 * - Route tableId to correct processor class
 * - Provide unified interface for processing any table
 * 
 * Usage:
 * const factory = new TableProcessorFactory();
 * const result = factory.processTable('A', { atafZone: '2ATAF', scenarioDate: 'pre' });
 */

class TableProcessorFactory {
  constructor() {
    this.processors = {};
    this.tableData = null;
  }

  /**
   * Load table data from the data source
   * Uses the existing getTableDataSource() function
   */
  loadTableData() {
    if (!this.tableData) {
      this.tableData = getTableDataSource();
    }
    return this.tableData;
  }

  /**
   * Get or create processor instance for a table
   * 
   * @param {string} tableId - Table identifier (A-L)
   * @returns {BaseTableProcessor} Processor instance
   */
  getProcessor(tableId) {
    // Return cached processor if exists
    if (this.processors[tableId]) {
      return this.processors[tableId];
    }

    // Load table data
    const allTables = this.loadTableData();
    const tableData = allTables[tableId];

    if (!tableData) {
      console.error(`Table ${tableId} not found in data source`);
      return null;
    }

    // Create processor based on tableId
    let processor = null;

    switch (tableId) {
      case 'A':
        processor = new NATOTableA(tableData);
        break;
      case 'B':
        processor = new NATOTableB(tableData);
        break;
      case 'C':
        processor = new NATOTableC(tableData);
        break;
      case 'D':
        processor = new NATOTableD(tableData);
        break;
      case 'E':
        processor = new NATOTableE(tableData);
        break;
      case 'F':
        processor = new NATOTableF(tableData);
        break;
      case 'G':
        processor = new WPTableG(tableData);
        break;
      case 'H':
        processor = new WPTableH(tableData);
        break;
      case 'I':
        processor = new WPTableI(tableData);
        break;
      case 'J':
        processor = new WPTableJ(tableData);
        break;
      case 'K':
        processor = new WPTableK(tableData);
        break;
      case 'L':
        processor = new WPTableL(tableData);
        break;
      default:
        console.error(`Unknown table ID: ${tableId}`);
        return null;
    }

    // Cache the processor
    this.processors[tableId] = processor;
    return processor;
  }

  /**
   * Process a table with the appropriate processor
   * 
   * @param {string} tableId - Table identifier (A-L)
   * @param {object} params - Processing parameters (varies by table)
   * @returns {object} Processing result
   */
  processTable(tableId, params = {}) {
    const processor = this.getProcessor(tableId);

    if (!processor) {
      return {
        error: `Processor not found for table ${tableId}`,
        text: `Error: Unable to process table ${tableId}`,
        debugText: '[ERROR: Processor not found]'
      };
    }

    try {
      return processor.process(params);
    } catch (error) {
      console.error(`Error processing table ${tableId}:`, error);
      return {
        error: error.message,
        text: `Error: ${error.message}`,
        debugText: `[ERROR: ${error.message}]`
      };
    }
  }

  /**
   * Clear cached processors (useful for testing or hot-reload)
   */
  clearCache() {
    this.processors = {};
    this.tableData = null;
  }

  /**
   * Get list of all available tables
   * 
   * @returns {string[]} Array of table IDs
   */
  getAvailableTables() {
    const allTables = this.loadTableData();
    return Object.keys(allTables);
  }
}

// Create global factory instance
let tableProcessorFactory = null;

/**
 * Get the global table processor factory instance
 * 
 * @returns {TableProcessorFactory} Factory instance
 */
function getTableProcessorFactory() {
  if (!tableProcessorFactory) {
    tableProcessorFactory = new TableProcessorFactory();
  }
  return tableProcessorFactory;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TableProcessorFactory, getTableProcessorFactory };
}

console.log('TableProcessorFactory loaded');
