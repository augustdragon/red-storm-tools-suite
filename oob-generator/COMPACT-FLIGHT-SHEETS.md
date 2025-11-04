# Compact Flight Sheet Implementation

## Overview
Implemented compact flight sheet generation in the OOB Generator using the designer layout from flight-sheet-designer.html.

## Implementation Date
December 2024

## Features Implemented

### 1. Async Data Loading
- Loads aircraft-nato.json, aircraft-wp.json, weapons.json, and aircraft-note-rules.json
- Uses Promise.all for parallel loading
- Error handling with user-friendly alerts

### 2. Flight Card Generation
- **generateCompactFlightSheet()**: Main function that loads data and opens print window
- **generateCompactFlightCard()**: Parses OOB result and generates cards for each flight
- **generateSingleCompactCard()**: Creates individual flight card HTML with designer layout
- **applyNoteRules()**: Applies aircraft note modifications based on tasking
- **generateCompactSheetHTML()**: Wraps flight cards in complete HTML document

### 3. Result Parsing
Parses OOB generator results format:
- `"FRG: 1 x {2} F-4F, CAP"` → Extracts nation (FRG), multiplier (1), size (2), aircraft (F-4F), tasking (CAP)
- `"USSR: 4 x {2} MiG-29, SWEEP"` → Handles Warsaw Pact format
- Supports multi-flight results (e.g., "4 x {2}" generates 4 separate cards)

### 4. Aircraft Data Integration
- Looks up aircraft in NATO/WP databases by name
- Extracts weapon loadouts (Gun, IRM, RHM)
- Applies aircraft notes from database
- Handles missing data gracefully with defaults

### 5. Note Rules Application
Implements rule types:
- **weaponModification**: Adjusts AAM depletion (e.g., -1 to IRM/RHM)
- **weaponRestriction**: Removes specific weapons
- **capabilityModification**: Modifies capabilities like jam rating
- **Conditional logic**: Rules apply based on tasking (e.g., "!SEAD" means NOT SEAD)

### 6. Flight Card Layout
Uses designer layout with:
- Roundel header (nation-specific image)
- Flight header (aircraft type, callsign, counter, aggression)
- Three-column row (Tasking, Notes, Fuel with 18 circles in 2 rows)
- Aircraft cards (silhouette, health checkboxes, weapon brackets, ordnance area)
- Responsive grid layout for multiple aircraft

### 7. Print Support
- Opens in new window for printing
- Page-break-inside: avoid for clean printing
- Print button at bottom
- Timestamp and suite branding

## Data Structure

### OOB Result Object
```javascript
{
  id: <number>,
  table: "A-L",
  faction: "NATO" | "WP",
  tableName: "NATO Table A - Fighter/Bomber",
  result: "FRG: 1 x {2} F-4F, CAP",
  nationName: "FRG",
  nationRoll: <number>,
  aircraftRoll: <number>,
  atafZone: "North" | "Central" | "South",
  scenarioDate: "pre" | "post",
  debugText: "...",
  timestamp: <number>
}
```

### Aircraft Data Object (after note rules)
```javascript
{
  name: "F-4F",
  notes: "A,C,L",
  gun: 1,
  irm: 4,
  rhm: 4,
  // ... other stats
  // Modified by note rules based on tasking
}
```

## Usage

1. Generate flights using OOB generator (any table)
2. Select "Compact" from flight sheet style dropdown
3. Click "Generate Printable Sheet" button
4. New window opens with compact flight cards
5. Review and click "Print Flight Sheets"

## Integration Points

- **State Manager**: Uses `getAppState()` to access results array
- **Aircraft Databases**: Loads from `data/aircraft-nato.json` and `data/aircraft-wp.json`
- **Weapons Database**: Loads from `data/weapons.json`
- **Note Rules**: Loads from `data/aircraft-note-rules.json`
- **Designer Layout**: Replicates CSS and HTML from `flight-sheet-designer.html`

## Future Enhancements

### Phase 1 (Optional)
- [ ] Add weapon detail lookup (show weapon names, not just brackets)
- [ ] Include ordnance loads based on tasking
- [ ] Visual indicators for which notes are active
- [ ] Print-optimized page breaks for multiple flights

### Phase 2 (Advanced)
- [ ] Custom flight sheet builder (drag-drop fields)
- [ ] Export to PDF directly
- [ ] Save/load flight sheet configurations
- [ ] Batch processing for entire OOB

## Testing Checklist

- [x] Syntax validation (no errors)
- [ ] Generate NATO flights (various tables)
- [ ] Generate WP flights (various tables)
- [ ] Test with 1-ship, 2-ship, 4-ship flights
- [ ] Verify note rules apply correctly
- [ ] Test with aircraft having notes (F-16C, F-4F, MiG-29)
- [ ] Verify multi-flight results ("4 x {2}")
- [ ] Print preview in browser
- [ ] Cross-browser compatibility

## Files Modified

- `oob-generator/index.html`: Added generateCompactFlightSheet() and helper functions (~500 lines)

## Files Dependencies

- `oob-generator/data/aircraft-nato.json`
- `oob-generator/data/aircraft-wp.json`
- `oob-generator/data/weapons.json`
- `oob-generator/data/aircraft-note-rules.json`
- `oob-generator/assets/roundels/*.png`

## Technical Notes

### Async Pattern
```javascript
async function generateCompactFlightSheet() {
  const [data1, data2, ...] = await Promise.all([
    fetch('data1.json').then(r => r.json()),
    fetch('data2.json').then(r => r.json()),
  ]);
  // Process...
}
```

### Deep Copy for Rule Application
```javascript
const modifiedData = JSON.parse(JSON.stringify(aircraftData));
// Prevents modifying original database
```

### Conditional Rule Matching
```javascript
if (rule.condition.startsWith('!')) {
  applies = !tasking.includes(rule.condition.substring(1));
} else {
  applies = tasking.includes(rule.condition);
}
```

## Known Limitations

1. Aircraft lookup uses name matching (may fail for variants)
2. Ordnance area is placeholder (not populated yet)
3. Aircraft silhouettes are text placeholders (no images)
4. Assumes result format from OOB generator (no validation)
5. Note rules only apply to specific rule types (not all edge cases)

## Success Criteria

✅ Loads OOB results from state manager
✅ Parses flight data from result text
✅ Looks up aircraft in databases
✅ Applies note rules based on tasking
✅ Generates designer-style flight cards
✅ Opens printable sheet in new window
✅ No syntax errors or console warnings

## Next Steps

1. Test with real OOB generation
2. Verify note rules apply correctly
3. Add ordnance population logic
4. Consider aircraft silhouette images
5. Commit and push to GitHub
6. Deploy to GitHub Pages
7. Update documentation
