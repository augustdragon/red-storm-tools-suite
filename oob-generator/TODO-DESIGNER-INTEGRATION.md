# TODO: Proper Designer Integration

## Problem
Current "compact" flight sheet implementation does NOT match the detailed flight-sheet-designer.html layout. It's missing:
- Speed tables (Clean vs Laden across altitude bands)
- Radar/RWR/Jam system details
- Capabilities (Night, TFR, etc.)
- Proper aircraft grid with damage checkboxes
- Equipment details (AAM, Ordnance, Bomb, Sight)

## Solution
Copy the EXACT layout from flight-sheet-designer.html into OOB generator.

## Files to Copy From Designer

### 1. CSS (flight-sheet-designer.html lines 100-500)
Copy these style classes into `generateDesignerSheetHTML()`:
- `.flight-card` - Main card container
- `.flight-info-section` - Flight-level info wrapper
- `.flight-header` - 5-column grid (roundel, aircraft, callsign, counter, aggr)
- `.tasking-fuel-row` - 3-column grid with fuel circles
- `.flight-weapons-row` - Weapons display with crew/rwy info
- `.speed-table` - Clean/Laden speed table styling
- `.aircraft-grid` - Grid for 1-4 individual aircraft
- `.aircraft-box` - Individual aircraft container
- `.damage-boxes` - Damage tracking checkboxes
- `.ordnance-area-small` - Per-aircraft ordnance section

### 2. Data Conversion Function (lines 800-940)
Copy `convertAircraftData(jsonData)` function:
```javascript
function convertAircraftData(jsonData, nationCode) {
  // Extract gun display (+3 {2} format)
  // Extract IRM/RHM displays
  // Build radar string with modifiers
  // Extract speeds for each altitude band
  // Build capabilities string
  // Return designer-formatted object
}
```

### 3. Card Generation Logic (lines 1050-1340)
Copy the HTML structure from `createFlightCard()`:
```html
<div class="flight-card">
  <div class="flight-info-section">
    <div class="flight-header">...</div>
    <div class="tasking-fuel-row">...</div>
    <div class="flight-weapons-row">...</div>
    <!-- Equipment rows -->
    <!-- Speed table -->
  </div>
  <div class="aircraft-grid">
    <!-- Individual aircraft boxes -->
  </div>
</div>
```

## Implementation Steps

### Step 1: Add convertAircraftData Function
```javascript
function convertAircraftData(jsonData, nationCode) {
  // Parse weapon objects to display strings
  const gunDisplay = jsonData.gun ? 
    `${jsonData.gun.modifier || ''} {${jsonData.gun.attacks || 1}}`.trim() : null;
  
  // Similar for IRM, RHM
  
  // Extract speeds by altitude band
  const speeds = {};
  if (jsonData.speeds && jsonData.speeds.clean) {
    ['VH', 'H', 'M', 'L/D'].forEach((band, idx) => {
      speeds[band] = {
        combat: extractSpeedForBand(jsonData.speeds.clean.combat, idx),
        dash: extractSpeedForBand(jsonData.speeds.clean.dash, idx),
        maneuver: extractSpeedForBand(jsonData.speeds.clean.maneuver, idx)
      };
    });
  }
  
  // Build laden speeds if present
  let speedsLaden = null;
  if (jsonData.speeds && jsonData.speeds.laden) {
    // Same extraction logic
  }
  
  return {
    model: jsonData.name,
    nation: nationCode,
    crew: jsonData.crew,
    rwy: jsonData.runway,
    fuel: jsonData.fuel,
    notes: jsonData.notes,
    gun: gunDisplay,
    irm: irmDisplay,
    rhm: rhmDisplay,
    rwr: jsonData.rwr,
    jam: jsonData.jam,
    radar: radarDisplay,
    radarModifier: radarModifier,
    ordnance: ordnanceStr,
    aam: jsonData.aam,
    bomb: jsonData.bomb,
    sight: jsonData.sight,
    capabilities: capabilitiesStr,
    speeds: speeds,
    speedsClean: speeds,
    speedsLaden: speedsLaden,
    hasCleanLaden: speedsLaden !== null
  };
}
```

### Step 2: Rewrite generateSingleDesignerCard
Match the exact HTML from `createFlightCard()` in designer:
- Roundel header with nation image
- 5-column flight header
- Tasking/Fuel/Notes row with fuel circles
- Weapons row with Gun/IRM/RHM displays
- Equipment rows (conditional based on data)
- Speed table (Clean only or Clean/Laden)
- Aircraft grid with damage checkboxes

### Step 3: Update applyDesignerNoteRules
Work with converted data format:
- Modify gun/irm/rhm strings (parse "{2}" and adjust)
- Update jam ratings
- Remove weapons by setting to null

### Step 4: Copy Designer CSS
In `generateDesignerSheetHTML()`, include ALL designer CSS so formatting matches exactly.

## Testing Plan

1. Generate NATO Table A flight (multi-nation)
2. Verify speed tables show Clean/Laden correctly
3. Check radar/RWR/jam display
4. Confirm capabilities list appears
5. Verify aircraft grid shows correct number
6. Test damage checkboxes render
7. Print preview to check page breaks
8. Test with 1-ship, 2-ship, 4-ship
9. Verify note rules apply (F-16C notes A,C,L,M,P)
10. Test WP flights (MiG-29, Su-27)

## Current Blockers

- Need to extract speeds from L/M/H/VH format strings
- Need to parse weapon objects with modifiers and attacks
- Need to build radar display strings with modifiers
- Need to handle Clean vs Laden speed tables
- Need to generate correct number of aircraft boxes

## Estimated Effort

- Copy CSS: 30 minutes
- Implement convertAircraftData: 1 hour
- Rewrite card generation: 2 hours
- Update note rules: 30 minutes
- Testing and fixes: 1 hour
- **Total: ~5 hours**

## Priority

HIGH - User specifically built this detailed layout and expects it in OOB output.

## Notes

- Designer uses 7pt fonts throughout for density
- Fuel circles calculated from aircraft.fuel value (divide by 2 for rows)
- Speed tables conditional: show Clean/Laden if laden exists, otherwise just speeds
- Equipment rows only show if data exists (ordnance, radar, capabilities)
- Aircraft grid uses repeat(4, 1fr) for up to 4 aircraft
- Roundel images from ../assets/ relative to oob-generator/

## References

- Source: `flight-sheet-designer.html` (working example)
- Target: `oob-generator/index.html` lines 1617-2300
- Data: `data/aircraft-nato.json`, `data/aircraft-wp.json`
- Rules: `data/aircraft-note-rules.json`
