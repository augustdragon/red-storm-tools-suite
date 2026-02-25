# Unified Manual Flight Sheet Generator — Assessment & Implementation Plan

## Table of Contents
1. [Project Goal](#1-project-goal)
2. [Discovery & Assessment](#2-discovery--assessment)
   - [Existing Flight Sheet Designers](#existing-flight-sheet-designers)
   - [Aircraft Data Architecture](#aircraft-data-architecture)
   - [Shared Infrastructure](#shared-infrastructure)
   - [PrintGenerator Class](#printgenerator-class)
   - [Module Configuration System](#module-configuration-system)
   - [Existing Shared Tool Patterns](#existing-shared-tool-patterns)
3. [Key Technical Findings](#3-key-technical-findings)
4. [Implementation Plan](#4-implementation-plan)
5. [Verification Plan](#5-verification-plan)

---

## 1. Project Goal

Create a single unified manual flight sheet generator that includes aircraft from both the Red Storm (RS) and Baltic Approaches (BA) modules. Users will be able to browse, filter, preview, queue, and print flight cards for any aircraft from either module in one tool — eliminating the need to switch between two separate generators.

---

## 2. Discovery & Assessment

### Existing Flight Sheet Designers

There are currently two separate flight sheet designers, one per module:

#### Red Storm Designer
- **Location:** `modules/red-storm/oob-generator/flight-sheet-designer.html` (~1683 lines)
- **Architecture:** Fully standalone — all logic embedded inline (no external JS dependencies beyond base CSS)
- **Data sources:** Loads from local module-specific files: `data/aircraft-nato.json`, `data/aircraft-wp.json`, `data/weapons.json`, `data/aircraft-note-rules.json`
- **Key functions (all inline):**
  - `createFlightCard()` (~lines 1179-1417) — generates HTML flight card from aircraft data
  - `convertAircraftData()` (~lines 984-1110) — transforms JSON aircraft entry into display format
  - `populateAircraftDropdown()` — filters aircraft by selected nation
  - `exportDesign()` — exports current queue to standalone HTML file
  - `printQueue()` — generates print-ready HTML in new window
- **Nation options:** US, UK, FRG, BEL, CAN, HOL (NATO) / USSR, GDR (WP)
- **Theme:** Dark green (`#2d3d2d` body, `#1a2a1a` header)
- **Key limitation:** Uses legacy weapon field names (`gunAmmo`, `irmAmmo`, `rhmAmmo`) that don't match the shared data format

#### Baltic Approaches Designer
- **Location:** `modules/baltic-approaches/oob-generator/flight-sheet-designer.html` (~1542 lines)
- **Architecture:** Hybrid — uses `PrintGenerator` class for print/export, but still has inline code for preview rendering
- **External dependencies:**
  - `shared/js/module-config.js` (module configuration)
  - `shared/oob-generator/js/print-generator.js` (print engine)
- **Data sources:** Local module-specific files (same pattern as RS)
- **Key functions:**
  - `printQueue()` (lines 922-1002) — delegates to PrintGenerator for card generation
  - `exportDesign()` (lines 1004-1099) — delegates to PrintGenerator, then embeds roundel images as base64
  - `loadDatabases()` — loads local BA aircraft data
  - `populateAircraftSelector()` — filters by nation
- **Nation options:** USA, UK, FRG, DK, SE (NATO) / USSR, POL (WP)
- **Theme:** Blue-gray (`#4a5d6d` body, `#2a3a4a` header)
- **Advantage:** Already integrates with PrintGenerator, making it the more modern and reusable implementation

#### Comparison Summary

| Aspect | Red Storm | Baltic Approaches |
|--------|-----------|-------------------|
| Lines of code | ~1683 | ~1542 |
| Uses PrintGenerator | No (all inline) | Yes (for print/export) |
| Uses module-config.js | No | Yes |
| Weapon field names | `gunAmmo` (legacy) | `gunDepletion` (current) |
| Nation codes | US, UK, FRG, BEL, CAN, HOL, USSR, GDR | USA, UK, FRG, DK, SE, USSR, POL |
| Theme | Green | Blue-gray |

**Assessment:** The BA designer is the better starting template because it already uses PrintGenerator and module-config.js. The RS designer would require significantly more work to modernize.

---

### Aircraft Data Architecture

Aircraft data exists at three levels:

#### Module-Specific Data (used by each module's own tools)
- `modules/red-storm/oob-generator/data/aircraft-nato.json` — 43 NATO aircraft
- `modules/red-storm/oob-generator/data/aircraft-wp.json` — 37 WP aircraft
- `modules/baltic-approaches/oob-generator/data/aircraft-nato.json` — 26 NATO aircraft
- `modules/baltic-approaches/oob-generator/data/aircraft-wp.json` — 16 WP aircraft

#### Shared/Merged Data (already combined from both modules)
- `shared/data/aircraft-nato.json` (2997 lines) — all 67+ NATO aircraft from both modules
- `shared/data/aircraft-wp.json` (2237 lines) — all 50+ WP aircraft from both modules
- `shared/data/weapons.json` — merged weapons database
- `shared/data/aircraft-note-rules.json` — merged note rules
- `shared/data/aircraft-name-mapping.json` — name alias mappings
- `shared/data/surface-search-radars.json` — surface radar data (BA naval aircraft)

#### Aircraft Entry Schema
Every aircraft entry follows this consistent structure:
```json
{
  "F-15C Eagle": {
    "name": "F-15C Eagle",
    "id": "US-F-15C-1",
    "model": "F-15C Eagle",
    "nation": "US",
    "module": "RS",
    "crew": 1,
    "rwy": 3,
    "fuel": 10,
    "notes": "A, C, I, P",
    "weapons": {
      "gun": "20mm M61A1",
      "gunDepletion": 3,
      "irm": "AIM-9M",
      "irmDepletion": 4,
      "rhm": "AIM-7M",
      "rhmDepletion": 4
    },
    "bomb": null,
    "sight": "+1",
    "rwr": "A",
    "jam": "3d",
    "radar": {
      "name": "APG-63",
      "type": "PD",
      "range": 20,
      "modifier": null
    },
    "speeds": {
      "clean": { "combat": "5/5/6/-", "dash": "6/7/8/-", "maneuver": "7/7/7/-" },
      "laden": { "combat": "4/4/5/-", "dash": "5/5/6/-", "maneuver": "3/4/4/-" }
    },
    "ordnance": [ { "type": "Mk-82", "quantity": 12 }, ... ],
    "capabilities": [ "BVR", "Look-Down" ],
    "aam": "AIM-9M, AIM-7M"
  }
}
```

**Key field: `"module"`** — Present on every aircraft in the shared data files. Values are `"RS"` (Red Storm) or `"BA"` (Baltic Approaches). This is the field we'll use for module filtering.

#### Aircraft ID Convention
Format: `NATION-MODEL-VARIANT-INSTANCE`
Examples: `US-F-15C-1`, `UK-TORNADO-GR-1A-1`, `GDR-MIG-23MF-1`, `POL-SU-22M4-1`, `DK-F-35XD-DRAKEN-1`

#### Nation Codes in Shared Data
All aircraft in the shared data use these normalized nation codes:
- **NATO:** US, UK, FRG, Belgium, Canada, NE (Netherlands), DK (Denmark), SE (Sweden)
- **WP:** USSR, GDR, POL (Poland)

Note: The BA module-specific data uses "USA" but the shared merged data normalizes to "US".

#### Module Breakdown by Nation

| Nation | Module | Faction | Aircraft Count (approx) |
|--------|--------|---------|------------------------|
| US | RS | NATO | 30 (USAF fighters, bombers, support) |
| US | BA | NATO | 10 (USN/USMC naval aviation) |
| UK | RS | NATO | 8 (RAF fighters, bombers) |
| UK | BA | NATO | 4 (FAA naval, Nimrod) |
| FRG | RS | NATO | 5 (Luftwaffe) |
| FRG | BA | NATO | 2 (Marineflieger) |
| Belgium | RS | NATO | 3 |
| Canada | RS | NATO | 3 |
| NE | RS | NATO | 2 |
| DK | BA | NATO | 3 (Danish air force) |
| SE | BA | NATO | 5 (Swedish air force) |
| USSR | RS | WP | 29 (VVS/PVO) |
| USSR | BA | WP | 8 (AVMF naval) |
| GDR | RS | WP | 8 (LSK) |
| POL | BA | WP | 8 (Polish air force) |

**Total: ~117 unique aircraft across both modules**

---

### Shared Infrastructure

#### CSS Architecture
- **Base:** `shared/css/red-storm.css` (1079 lines) — dark green theme, standard component classes
- **BA Override:** `modules/baltic-approaches/oob-generator/css/ba-theme.css` — blue-gray overrides using `!important`
- **Pattern:** All shared tools embed their own CSS inline (not using module-specific overrides)

#### Roundel Images
Located at `shared/assets/roundels/` with these files:
- USAF.jpg, UK.jpg, FRG.jpg, Belgium.jpg, Canada.jpg, Netherlands.jpg
- Denmark.jpg, Sweden.jpg, USSR.jpg, GDR.jpg, Poland.jpg
- Also: nato.jpg, wp.jpg, cover.jpg, ba-cover.jpg

#### Navigation Pattern
All module tools include a back-link to the module index:
```html
<a href="../index.html" class="back-link">← Back to Baltic Approaches Tools Suite</a>
```
Shared tools link back to module selection:
```html
<a href="../index.html">← Back to Module Selection</a>
```

Module index pages link to the flight sheet designers:
- RS: `modules/red-storm/index.html` line 206 → `oob-generator/flight-sheet-designer.html`
- BA: `modules/baltic-approaches/index.html` lines 233/236 → `oob-generator/flight-sheet-designer.html`

---

### PrintGenerator Class

**Location:** `shared/oob-generator/js/print-generator.js` (~1478 lines)

This is the shared engine that generates printable flight cards. The BA designer already uses it; the RS designer does not.

#### Key Methods
| Method | Purpose |
|--------|---------|
| `constructor(moduleConfig)` | Accepts a module config object |
| `loadDataFiles()` | Fetches all JSON data files using paths from config's `data` property |
| `processFlights(results)` | Transforms raw results into flight objects |
| `sortFlights(processedFlights)` | Separates into NATO regular/CSAR and WP regular/CSAR |
| `generateDesignerFlightCard(flight, ...)` | Generates a single flight card HTML |
| `convertAircraftData(jsonData, nationCode, weaponsData, aircraftKey)` | Transforms JSON into display format |
| `generateSingleDesignerCard(...)` | Builds the HTML layout for one flight card |
| `generateCompactCSARCard(...)` | Builds compact CSAR card layout |
| `generateDesignerSheetHTML(allCardsHTML)` | Wraps all cards in a complete HTML document |
| `buildAircraftIdIndex(aircraftDB)` | Creates lookup index by aircraft ID |

#### Data Loading
`loadDataFiles()` reads file paths from the config's `data` (or `dataFiles`) property:
```javascript
const dataConfig = this.config.dataFiles || this.config.data;
const promises = Object.entries(dataConfig).map(async ([key, path]) => {
    const response = await fetch(path);
    return [key, await response.json()];
});
```

Both module configs currently point to the same shared data:
```javascript
data: {
    aircraftNATO: '../../../shared/data/aircraft-nato.json',
    aircraftWP: '../../../shared/data/aircraft-wp.json',
    weapons: '../../../shared/data/weapons.json',
    noteRules: '../../../shared/data/aircraft-note-rules.json',
    nameMapping: '../../../shared/data/aircraft-name-mapping.json'
}
```

#### Roundel Path Issue
The PrintGenerator has hardcoded roundel paths at two locations:
- **Line 836** in `generateSingleDesignerCard()`:
  ```javascript
  `<img src="../../../shared/assets/roundels/${roundelImage}" ...>`
  ```
- **Line 1099** in `generateCompactCSARCard()`:
  ```javascript
  `<img src="../../../shared/assets/roundels/${roundelImage}" ...>`
  ```

These paths are relative to module OOB generator directories (`modules/red-storm/oob-generator/` or `modules/baltic-approaches/oob-generator/`). A tool at `shared/flight-sheet-designer.html` would need `assets/roundels/` instead.

**This is the only blocking issue** requiring a change to PrintGenerator.

---

### Module Configuration System

**Location:** `shared/js/module-config.js` (381 lines)

Provides structured configuration for each module including nation lists, data file paths, print settings, and roundel mappings.

#### Key Config Properties (per module)
```javascript
{
    id: 'red-storm',
    name: 'Red Storm',
    nations: {
        nato: ['US', 'UK', 'FRG', 'BEL', 'CAN', 'HOL'],
        wp: ['USSR', 'GDR']
    },
    data: { aircraftNATO: '...path...', ... },
    print: {
        dataStructure: { weaponPaths: {...}, speedPaths: {...}, basicFields: {...} },
        conversion: { speedFormat: 'separated', speedOrder: 'LMHVH', ... },
        roundels: { 'US': 'USAF.jpg', 'UK': 'UK.jpg', ... }
    }
}
```

#### Helper Functions
- `getModuleConfig(moduleId)` — returns full config for a module
- `getModuleNations(moduleId, faction)` — returns nation list
- `getNationRoundel(moduleId, nationCode)` — returns roundel filename
- `getCurrentModule()` — detects current module from URL hash or localStorage

#### Roundel Mappings
- **RS:** US→USAF.jpg, UK→UK.jpg, FRG→FRG.jpg, BEL→Belgium.jpg, CAN→Canada.jpg, HOL→Netherlands.jpg, USSR→USSR.jpg, GDR→GDR.jpg
- **BA:** USA→USAF.jpg, UK→UK.jpg, FRG→FRG.jpg, DK→Denmark.jpg, SE→Sweden.jpg, NE→Netherlands.jpg, USSR→USSR.jpg, GDR→GDR.jpg, POL→Poland.jpg

---

### Existing Shared Tool Patterns

#### Aircraft Data Reference (`shared/aircraft-data-reference.html`)
The closest precedent for what we're building. Key patterns:

1. **Data loading:** Fetches from `data/` relative to `shared/`:
   ```javascript
   fetch('data/aircraft-nato.json')
   fetch('data/aircraft-wp.json')
   fetch('data/aircraft-note-rules.json')
   fetch('data/surface-search-radars.json')
   ```

2. **Module filtering:** Uses `aircraft.module` field ("RS" or "BA") on each row:
   ```javascript
   row.dataset.module = aircraft.module || '';
   // Filter dropdown with 'RS', 'BA', or '' (all) values
   ```

3. **Structure:** Standalone HTML with all CSS and JS embedded inline. No module-specific theme — uses its own CSS variables with a dark/light theme toggle.

4. **Nation filtering:** Dynamic, populated from the loaded data.

This tool proves that the shared data files and module field filtering approach works well.

---

## 3. Key Technical Findings

### Finding 1: Shared data already exists and is complete
The merged `shared/data/aircraft-*.json` files contain all aircraft from both modules with a `"module"` field for filtering. No new data files need to be created.

### Finding 2: Weapon field naming
The shared data uses `gunDepletion`/`irmDepletion`/`rhmDepletion` (current convention). The RS designer's inline code uses `gunAmmo`/`irmAmmo`/`rhmAmmo` (legacy). The unified tool must use the current naming.

### Finding 3: PrintGenerator needs one small change
The hardcoded roundel image path (`../../../shared/assets/roundels/`) prevents PrintGenerator from working correctly when called from `shared/`. Making this configurable via a `roundelBasePath` config property is a backward-compatible 2-spot change.

### Finding 4: BA designer is the better template
It already uses PrintGenerator and module-config.js. The RS designer is entirely self-contained with duplicated logic. Starting from the BA designer minimizes work.

### Finding 5: Nation code normalization
The shared data uses `"US"` (not `"USA"`), so the unified tool's nation dropdown must use the shared data's codes. The roundel map needs to merge entries from both modules to cover all nation codes.

### Finding 6: No duplicate aircraft expected
Per the user's statement, although modules may share some airframes, the specific models (aircraft keys) are unique across modules. The shared data confirms this — each key appears once with a single `module` tag.

---

## 4. Implementation Plan

### Step 1: Modify PrintGenerator — configurable roundel path

**File:** `shared/oob-generator/js/print-generator.js`

Add support for a `roundelBasePath` config property. Two spots to change:

**Line ~836** in `generateSingleDesignerCard()`:
```javascript
// Before:
`<img src="../../../shared/assets/roundels/${roundelImage}" ...>`

// After:
const roundelBase = this.moduleConfig?.print?.roundelBasePath || '../../../shared/assets/roundels';
`<img src="${roundelBase}/${roundelImage}" ...>`
```

**Line ~1099** in `generateCompactCSARCard()`:
```javascript
// Same pattern — use configurable base path with backward-compatible default
```

This is backward-compatible: existing module configs don't have `roundelBasePath`, so they'll use the default path that already works for them.

### Step 2: Create the unified flight sheet designer

**File:** `shared/flight-sheet-designer.html` (new)

**Template:** Based on `modules/baltic-approaches/oob-generator/flight-sheet-designer.html`

#### 2a. HTML Structure

```
<head>
  - Title: "Flight Sheet Generator - Red Storm Tools Suite"
  - Favicon: ../favicon.svg
  - Stylesheet: css/red-storm.css
  - Script: js/module-config.js
  - Script: oob-generator/js/print-generator.js
  - Inline <style> with neutral dark theme
</head>
<body>
  <div class="designer-container">
    <div class="header">
      <h1>Flight Sheet Generator</h1>
      <p>Generate and print flight sheets for Red Storm and Baltic Approaches</p>
    </div>
    <a href="../index.html" class="back-link">← Back to Module Selection</a>

    <div class="controls">
      <!-- Row 1: Filters -->
      Module: [All Modules / Red Storm / Baltic Approaches]
      Nation: [All Nations / dynamically populated]

      <!-- Row 2: Selection -->
      Aircraft: [dynamically populated, shows module tag]
      Flight Size: [1-ship / 2-ship / 4-ship]

      <!-- Row 3: Actions -->
      [Add to Queue] [Print All Flights] [Export HTML] [Clear Preview]
    </div>

    <div class="queue-panel">...</div>
    <div class="preview-frame">...</div>
  </div>
</body>
```

#### 2b. Theme Colors (neutral dark slate)
```css
body { background-color: #3a3a4a; }
.header { background-color: #2a2a3a; border-bottom: 2px solid #5a5a6a; }
.controls { background-color: #4a4a5a; }
.controls select { background-color: #2a2a3a; border: 2px solid #5a5a6a; }
.controls button { background-color: #4a4a5a; border: 1px solid #6a6a7a; }
.add-to-queue { background-color: #4a5a7a; }
.print-queue { background-color: #5a5a7a; }
```

#### 2c. Data Loading
```javascript
async function loadDatabases() {
    const [natoResp, wpResp, weaponsResp, noteRulesResp, surfRadarResp] = await Promise.all([
        fetch('data/aircraft-nato.json'),
        fetch('data/aircraft-wp.json'),
        fetch('data/weapons.json'),
        fetch('data/aircraft-note-rules.json'),
        fetch('data/surface-search-radars.json')
    ]);

    const aircraftNato = await natoResp.json();
    const aircraftWp = await wpResp.json();
    weaponsDatabase = await weaponsResp.json();
    noteRulesDatabase = await noteRulesResp.json();
    surfaceRadarDatabase = await surfRadarResp.json();

    // Merge NATO + WP, strip metadata keys
    aircraftDatabase = { ...aircraftNato, ...aircraftWp };
    Object.keys(aircraftDatabase)
        .filter(k => k.startsWith('_'))
        .forEach(k => delete aircraftDatabase[k]);

    populateNationSelector();
    populateAircraftSelector();
}
```

#### 2d. Cascading Filter Logic
```javascript
function onModuleFilterChange() {
    populateNationSelector();  // Rebuild nation list for selected module
    populateAircraftSelector(); // Rebuild aircraft list
    clearPreview();
}

function onNationFilterChange() {
    populateAircraftSelector(); // Rebuild aircraft list for selected nation
    clearPreview();
}

function populateNationSelector() {
    const moduleFilter = document.getElementById('moduleFilter').value; // 'all', 'RS', 'BA'
    const nationSet = {};

    for (const [key, aircraft] of Object.entries(aircraftDatabase)) {
        if (key.startsWith('_') || !aircraft) continue;
        if (moduleFilter !== 'all' && aircraft.module !== moduleFilter) continue;
        if (aircraft.nation) {
            nationSet[aircraft.nation] = NATION_DISPLAY_NAMES[aircraft.nation] || aircraft.nation;
        }
    }

    // Sort by display name, rebuild dropdown
    // ...
}

function populateAircraftSelector() {
    const moduleFilter = document.getElementById('moduleFilter').value;
    const nationFilter = document.getElementById('nationSelector').value;

    const entries = Object.entries(aircraftDatabase)
        .filter(([key, a]) => {
            if (key.startsWith('_') || !a) return false;
            if (moduleFilter !== 'all' && a.module !== moduleFilter) return false;
            if (nationFilter && a.nation !== nationFilter) return false;
            return true;
        })
        .sort((a, b) => (a[1].name || a[0]).localeCompare(b[1].name || b[0]));

    // Each option shows: "F-15C Eagle (US) [RS]"
    for (const [key, a] of entries) {
        const moduleTag = a.module ? ` [${a.module}]` : '';
        option.textContent = `${a.name || key} (${a.nation})${moduleTag}`;
        option.value = key;
    }
}
```

#### 2e. PrintGenerator Integration (Print/Export)
```javascript
function getUnifiedPrintConfig() {
    const rsConfig = window.ModuleConfig.getModuleConfig('red-storm');
    const baConfig = window.ModuleConfig.getModuleConfig('baltic-approaches');

    return {
        id: 'unified',
        name: 'Red Storm / Baltic Approaches',
        data: {
            aircraftNATO: 'data/aircraft-nato.json',
            aircraftWP: 'data/aircraft-wp.json',
            weapons: 'data/weapons.json',
            noteRules: 'data/aircraft-note-rules.json',
            nameMapping: 'data/aircraft-name-mapping.json',
            surfaceRadars: 'data/surface-search-radars.json'
        },
        print: {
            dataStructure: rsConfig.print.dataStructure,
            conversion: rsConfig.print.conversion,
            roundelBasePath: 'assets/roundels',
            roundels: { ...rsConfig.print.roundels, ...baConfig.print.roundels }
        }
    };
}

async function printQueue() {
    // Convert queue items to flight result format
    const results = flightQueue.map(f => ({
        aircraftType: f.aircraftKey,
        nationCode: aircraftDatabase[f.aircraftKey]?.nation,
        tasking: 'Manual',
        faction: WP_NATIONS.includes(aircraftDatabase[f.aircraftKey]?.nation) ? 'WP' : 'NATO',
        flightSize: f.size,
        numFlights: 1
    })).filter(Boolean);

    const printGen = new PrintGenerator(getUnifiedPrintConfig());
    const dataFiles = await printGen.loadDataFiles();
    const processedFlights = printGen.processFlights(results);
    const sorted = printGen.sortFlights(processedFlights);

    // Generate NATO cards, then WP cards (same pattern as BA designer)
    // Open in new window or download as HTML
}
```

#### 2f. Inline Preview Card
Keep the BA designer's inline `createFlightCard()` function adapted for:
- Shared data field names (`gunDepletion` not `gunAmmo`)
- Roundel path: `assets/roundels/${roundelFilename}`
- Merged roundel map from both modules

#### 2g. Roundel Mapping (unified)
```javascript
const ROUNDEL_MAP = {
    'US': 'USAF.jpg',
    'UK': 'UK.jpg',
    'FRG': 'FRG.jpg',
    'Belgium': 'Belgium.jpg',
    'Canada': 'Canada.jpg',
    'NE': 'Netherlands.jpg',
    'DK': 'Denmark.jpg',
    'SE': 'Sweden.jpg',
    'USSR': 'USSR.jpg',
    'GDR': 'GDR.jpg',
    'POL': 'Poland.jpg'
};
```

#### 2h. Nation Display Names
```javascript
const NATION_DISPLAY_NAMES = {
    'US': 'United States',
    'UK': 'United Kingdom',
    'FRG': 'West Germany',
    'Belgium': 'Belgium',
    'Canada': 'Canada',
    'NE': 'Netherlands',
    'DK': 'Denmark',
    'SE': 'Sweden',
    'USSR': 'Soviet Union',
    'GDR': 'East Germany',
    'POL': 'Poland'
};
```

#### 2i. WP Nation Detection
```javascript
const WP_NATIONS = ['USSR', 'GDR', 'POL'];
```

### Step 3: Update module index navigation

**File:** `modules/red-storm/index.html` (line 206)
```html
<!-- Change from: -->
<a href="oob-generator/flight-sheet-designer.html" class="tool-button">Launch Generator</a>
<!-- Change to: -->
<a href="../../shared/flight-sheet-designer.html" class="tool-button">Launch Generator</a>
```

**File:** `modules/baltic-approaches/index.html` (lines 233, 236)
```html
<!-- Change onclick and href from: -->
<div class="tool-card" onclick="window.location.href='oob-generator/flight-sheet-designer.html'">
    <a href="oob-generator/flight-sheet-designer.html" class="tool-button">Open Generator</a>
<!-- Change to: -->
<div class="tool-card" onclick="window.location.href='../../shared/flight-sheet-designer.html'">
    <a href="../../shared/flight-sheet-designer.html" class="tool-button">Open Generator</a>
```

### Step 4: Sync rs-tools-hosted

After all changes are complete, synchronize the modified files to the `rs-tools-hosted` folder.

---

## 5. Verification Plan

### Functional Tests
1. **Data loading:** Open the page — console should show ~117 aircraft loaded
2. **Module filter "All":** All nations visible, all aircraft listed
3. **Module filter "Red Storm":** Only RS nations (US, UK, FRG, Belgium, Canada, NE, USSR, GDR) and their aircraft
4. **Module filter "Baltic Approaches":** Only BA nations (US, UK, FRG, DK, SE, NE, USSR, GDR, POL) and their aircraft
5. **Nation filter:** Selecting a nation filters aircraft list to that nation only
6. **Cascading resets:** Changing module filter resets nation filter and aircraft list
7. **Preview card:** Select any aircraft → preview card shows with correct roundel, speeds, weapons, ordnance
8. **Queue management:** Add, remove individual, clear all — all work correctly
9. **Print All:** Generates flight cards in new window with correct roundels and data for aircraft from both modules
10. **Export HTML:** Downloads standalone HTML with base64-embedded roundel images

### Regression Tests
11. **RS OOB generator print:** Go to Red Storm OOB generator, generate flights, print — roundels still appear correctly (verifies PrintGenerator backward compatibility)
12. **BA OOB generator print:** Same for Baltic Approaches OOB generator
13. **Navigation:** Both module index pages link to the unified tool; back link returns to module selection

### Edge Cases
14. **Mixed queue:** Queue flights from both RS and BA modules, print together — all cards render correctly
15. **Surface radar aircraft:** Select a BA naval aircraft with surface radar (e.g., Sea Harrier FRS.1) — radar data displays in preview
16. **CSAR aircraft:** Select CSAR-capable aircraft (H-53, Puma, Mi-8) — compact card format used in print
