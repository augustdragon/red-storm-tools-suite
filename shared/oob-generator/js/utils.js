/**
 * OOB Generator - Utility Functions
 * 
 * Purpose:
 * - Common helper functions used throughout the application
 * - Data parsing and manipulation utilities
 * - HTML escaping and safety functions
 * - Data source management
 * 
 * Dependencies: None (pure utility functions)
 */

/**
 * Parse a range string (e.g., "1-4" or "5") into min/max values
 * @param {string} range - Range string to parse
 * @returns {number[]} Array with [min, max] values
 */
function parseRange(range) {
  if (range.includes('-')) {
    const [min, max] = range.split('-').map(num => parseInt(num));
    return [min, max];
  } else {
    const num = parseInt(range);
    return [num, num];
  }
}

/**
 * Escape HTML characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get the table data source (JSON or embedded fallback)
 * @returns {object} Table data object
 */
function getTableDataSource() {
  // Phase 3: Enhanced data source selection with module support
  // Prefer JSON data, fallback to embedded data seamlessly
  
  if (window.oobTables && Object.keys(window.oobTables).length > 0) {
    // Check if we have actual table data (not just placeholders)
    // Try both Red Storm (A) and Baltic Approaches (A2) table formats
    const firstTableRS = window.oobTables['A'];
    const firstTableBA = window.oobTables['A2'];
    
    if ((firstTableRS && firstTableRS.name) || (firstTableBA && firstTableBA.name)) {
      console.log('Using hybrid JSON + embedded data source');
      return window.oobTables;
    }
  }
  
  // If no valid data in window.oobTables, check if embedded oobTables exists
  if (typeof oobTables !== 'undefined') {
    console.log('Checking embedded data source...');
    const firstTableRS = oobTables['A'];
    const firstTableBA = oobTables['A2'];
    
    if ((firstTableRS && firstTableRS.name) || (firstTableBA && firstTableBA.name)) {
      console.log('Using embedded data source (fallback)');
      return oobTables;
    } else {
      console.log('Embedded data contains only placeholders, need JSON loading');
    }
  }
  
  console.error('No data source available - JSON not loaded and no embedded fallback');
  return {};
}

/**
 * Test function to verify data extraction
 */
function testDataExtraction() {
  const dataSource = getTableDataSource();
  console.log('=== Complete Data Extraction Test ===');
  console.log('Available tables:', Object.keys(dataSource));
  
  // Test all tables A-L
  const tableIds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  let successCount = 0;
  
  for (const tableId of tableIds) {
    try {
      const table = dataSource[tableId];
      if (table && table.name) {
        console.log(`✅ Table ${tableId}: ${table.name}`);
        successCount++;
      } else {
        console.error(`❌ Table ${tableId}: Missing or invalid`);
      }
    } catch (error) {
      console.error(`❌ Table ${tableId}: Error -`, error.message);
    }
  }
  
  console.log(`=== Results: ${successCount}/12 tables loaded successfully ===`);
  return successCount === 12;
}

// Make functions globally available for use throughout the application
window.parseRange = parseRange;
window.escapeHtml = escapeHtml;
window.getTableDataSource = getTableDataSource;
window.testDataExtraction = testDataExtraction;

console.log('OOB Generator: utils.js module loaded (Phase 4 - Component Extraction)');
