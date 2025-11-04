# Flight Sheet Designer Integration with OOB Generator

## Overview
Integrate the detailed flight-sheet-designer.html layout into the OOB Generator's "Compact" flight sheet output.

## Implementation Date
December 2024

## Current Status
⚠️ WORK IN PROGRESS - Initial implementation used wrong layout. Need to use actual designer format.

## Correct Designer Layout

The flight-sheet-designer.html uses this detailed format:

### Flight Card Structure
1. **Roundel Header** - Nation-specific roundel image
2. **Flight Header Grid** - 5 columns: Roundel | Aircraft | Callsign | Counter | Aggression
3. **Tasking/Fuel/Notes Row** - 3 columns with fuel circles
4. **Weapons Row** - Gun, IRM, RHM with modifiers | Crew & Runway info
5. **Equipment Rows** - AAM, Ordnance, Bomb, Sight details
6. **Systems Row** - Radar, RWR, Jam ratings
7. **Capabilities Row** - Night, TFR, etc.
8. **Speed Table** - Clean/Laden speeds across altitude bands (VH, H, M, L/D)
9. **Aircraft Grid** - Individual aircraft boxes with damage tracking and ordnance

### Key Features from Designer
- Compact 7pt font sizing for dense information
- Speed tables with Clean vs Laden columns
- Full radar/RWR/jam system display
- Capabilities list (Night, TFR, Radar, etc.)
- Ordnance details per aircraft
- Damage tracking (Damaged, Crippled, Destroyed checkboxes)
- Fuel circles in 2 rows based on aircraft fuel capacity

## Required Changes

### 1. Copy Designer CSS
Need to copy ALL CSS from flight-sheet-designer.html lines 100-500:
- `.flight-card` with proper borders
- `.speed-table` with clean/laden columns
- `.aircraft-grid` for 1-4 aircraft layout
- `.damage-boxes` with checkboxes
- All field styling (7pt fonts, borders, padding)

### 2. Rewrite Card Generation
Replace `generateSingleDesignerCard()` to match `createFlightCard()` from designer:
- Use exact same HTML structure
- Include all equipment rows (ordnance, radar, capabilities)
- Generate speed tables from aircraft data
- Create aircraft grid with damage checkboxes

### 3. Add Aircraft Data Conversion
Copy `convertAircraftData()` function from designer (lines 800-900):
- Converts JSON format to designer display format
- Extracts speeds for each altitude band
- Builds weapon display strings ("+3 {2}" format)
- Handles radar modifiers

### 4. Apply Note Rules to Designer Format
Modify `applyDesignerNoteRules()` to work with converted data:
- Apply to gun/irm/rhm strings ("+3 {2}" format)
- Modify jam ratings
- Remove weapons based on rules

## Files to Reference

### Source (Designer)
- `flight-sheet-designer.html` lines 100-500: CSS
- `flight-sheet-designer.html` lines 800-900: convertAircraftData()
- `flight-sheet-designer.html` lines 1000-1350: createFlightCard()

### Target (OOB Generator)
- `oob-generator/index.html` lines 1617-2300: Compact flight sheet functions

## Implementation Steps

1. ✅ Load aircraft databases (aircraft-nato.json, aircraft-wp.json)
2. ✅ Parse OOB results to extract flight data
3. ⏳ Convert aircraft JSON to designer format
4. ⏳ Generate designer-style HTML with all sections
5. ⏳ Apply note rules to designer format data
6. ⏳ Copy designer CSS for print styling
7. ⏳ Test with real OOB generation

## Next Actions

1. Copy `convertAircraftData()` from designer
2. Rewrite `generateSingleDesignerCard()` to match designer HTML exactly
3. Copy designer CSS into `generateDesignerSheetHTML()`
4. Test with F-16C, F-4F, MiG-29 (aircraft with full data)
5. Verify speed tables display correctly
6. Commit working version

## Notes

- Designer uses 2-column grid for flight cards (side-by-side)
- Speed tables show Clean vs Laden when aircraft has both
- Ordnance area is per-aircraft, not per-flight
- Fuel circles calculated from aircraft.fuel value
- Roundel images from `assets/` directory (USAF.jpg, UK.jpg, etc.)

## Success Criteria

✅ Loads and parses OOB results
✅ Finds aircraft in databases
⏳ Displays full speed tables (Clean/Laden)
⏳ Shows all equipment (radar, RWR, jam, capabilities)
⏳ Individual aircraft boxes with damage tracking
⏳ Proper 7pt font sizing throughout
⏳ Matches designer layout exactly
⏳ Applies note rules correctly
⏳ Prints cleanly on letter-size paper
