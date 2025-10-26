# OOB Generator - Directory Structure

This directory contains the Order of Battle Generator tool for Red Storm.

## 📁 Directory Structure

```
oob-generator/
├── index.html                 # Main HTML file (entry point)
├── css/                       # Stylesheets
│   └── oob-generator.css     # Component-specific styles
├── js/                        # JavaScript modules
│   ├── app.js                # Main application controller
│   ├── state-manager.js      # State management
│   ├── dice-roller.js        # Roll logic & probability
│   ├── table-processor.js    # Table lookup & resolution
│   ├── ui-controller.js      # DOM manipulation
│   ├── print-generator.js    # Print sheet generation
│   └── utils.js              # Helper functions
├── data/                      # Data files
│   ├── nato-tables.json      # NATO OOB Tables (A-F)
│   ├── wp-tables.json        # Warsaw Pact Tables (G-L)
│   └── table-metadata.json   # Table properties/descriptions
├── assets/                    # Static assets
│   ├── nato.jpg              # NATO aircraft silhouette
│   └── wp.jpg                # WP aircraft silhouette
└── README.md                  # This file
```

## 📝 Module Purposes

### CSS Modules

- **oob-generator.css**: Component-specific styles for the OOB Generator. Currently a placeholder, will contain styles specific to this tool that aren't in the shared stylesheet.

### JavaScript Modules

- **app.js**: Main application controller that initializes and coordinates all modules
- **state-manager.js**: Manages application state (selected table, scenario date, results, etc.)
- **dice-roller.js**: Handles random number generation and probability calculations
- **table-processor.js**: Processes OOB table lookups and resolves results
- **ui-controller.js**: Manages DOM manipulation and UI updates
- **print-generator.js**: Generates printable flight sheets
- **utils.js**: Common helper functions and utilities

### Data Files

- **nato-tables.json**: Contains all NATO table data (Tables A-F)
- **wp-tables.json**: Contains all Warsaw Pact table data (Tables G-L)
- **table-metadata.json**: Table properties, descriptions, and metadata

## 🎯 Current Status

**Phase 1: Structure Establishment (Current)**
- ✅ Directory structure created
- ✅ Placeholder files with documentation
- ✅ README documenting purposes
- ⏳ Logic still in index.html (no functionality changes)

## 🔄 Future Refactoring Phases

### Phase 2: Extract Table Data
- Move table data from JavaScript to JSON files
- Implement JSON loading mechanism
- Validate data structure

### Phase 3: Extract JavaScript Logic
- Move state management to state-manager.js
- Extract dice rolling to dice-roller.js
- Separate UI logic to ui-controller.js
- Move table processing to table-processor.js
- Extract print generation to print-generator.js
- Move utilities to utils.js

### Phase 4: Modularization
- Implement ES6 modules
- Set up proper imports/exports
- Remove global variables
- Establish clean module boundaries

### Phase 5: Testing
- Add unit tests for each module
- Test table data integrity
- Validate roll probability distributions
- Test UI interactions

## 🧪 Testing Strategy

Future test coverage will include:
- **dice-roller.js**: Random distribution tests, range validation
- **table-processor.js**: Table lookup correctness, edge cases
- **state-manager.js**: State mutation tests, validation
- **ui-controller.js**: DOM update tests, event handling
- **print-generator.js**: HTML generation tests
- **utils.js**: Utility function tests

## 📖 Development Guidelines

### Adding New Features
1. Determine which module should contain the logic
2. Add function/class to appropriate module
3. Update dependencies in app.js if needed
4. Document the change in this README

### Modifying Table Data
1. Edit appropriate JSON file (nato-tables.json or wp-tables.json)
2. Validate JSON structure
3. Update table-metadata.json if properties change
4. Test table lookups still work correctly

### Styling Changes
1. Component-specific styles go in oob-generator.css
2. Shared styles go in ../shared/red-storm.css
3. Follow existing naming conventions
4. Test responsive behavior

## 🔍 Code Organization Principles

1. **Separation of Concerns**: Each module has a single, well-defined responsibility
2. **Modularity**: Modules should be loosely coupled and highly cohesive
3. **Testability**: Logic should be easily testable in isolation
4. **Maintainability**: Code should be easy to understand and modify
5. **Documentation**: All modules and functions should be well-documented

## 📚 Dependencies

- **Shared Resources**: Uses `../shared/red-storm.css` for common styling
- **Assets**: References images from `./assets/` directory
- **External**: No external JavaScript libraries currently

## 🚀 Getting Started

To work on this tool:
1. Open `index.html` in a browser (or use GitHub Pages)
2. All functionality currently works as before
3. Placeholder modules are loaded but don't affect functionality
4. Future refactoring will gradually move logic to modules

## 📝 Notes

- This refactoring establishes structure without changing functionality
- All logic remains in index.html for now
- Placeholder files document future responsibilities
- This enables incremental refactoring in future PRs
- No breaking changes to existing functionality

## 🔗 Related Files

- Main project README: `../README.md`
- Shared styles: `../shared/red-storm.css`
- Chit Pull tool: `../chit-pull/`

---

*Last Updated: 2025-10-26*
*Refactoring Status: Phase 1 Complete (Structure Establishment)*
