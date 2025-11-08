# OOB Generator User Guide

## Overview

The Red Storm OOB Generator automates the process of creating Order of Battle (OOB) flight sheets for Red Storm: The Air War Over Central Germany, 1987. This guide explains how the generator works "behind the scenes" and important design decisions that affect your game experience.

## How Flight Generation Works

### Step 1: Table Roll and Flight Composition

When you click "Roll!" for a table, the generator:
1. **Rolls the dice** for the selected OOB table (NATO or Warsaw Pact)
2. **Determines the result** based on the table's probability distribution
3. **Parses the flight composition** including:
   - Number of flights (e.g., "4 x {2}" means 4 separate flights)
   - Aircraft per flight (the number in braces)
   - Aircraft type
   - Mission tasking (CAP, SEAD, Bombing, etc.)
   - Nation/air force

### Step 2: Ordnance Rolls (Tables C & I Only)

For **Bombing Raid tables (NATO Table C and WP Table I)**, an additional automated roll determines available ordnance for each flight:

- **Base ordnance** is always "Bombs/CBU/Rockets"
- **Additional rolls** may add specialized munitions:
  - EOGM (Electro-Optical Guided Missiles)
  - ARM (Anti-Radiation Missiles)
  - LGB/EOGB (Laser/Electro-Optical Guided Bombs)
  
The generator displays these additions in each aircraft's **Ordnance box** (e.g., "EOGM", "ARM") as a note to players about available weapon options. The base bomb load is implied and not printed.

### Step 3: Aircraft Data Lookup

The generator looks up the selected aircraft in the appropriate database (NATO or Warsaw Pact) to retrieve:
- Performance data (speed/altitude)
- Weapons loadout
- Radar information
- EW ratings (RWR, Jamming)
- Crew size and runway requirements
- Special capabilities and notes

### Step 4: Aircraft Note Processing

Many aircraft have **note codes** (letters A-Z) that modify their characteristics based on mission tasking or require dice rolls. The generator automatically applies these notes:

#### Nation and aircraft-specific notes

These notes change the aircraft's stats without player input:

**US Notes:**
- **Note C**: Reduces bomb load to lower value when generated from Table D (Deep Strike Raids)
- **Note J**: Rolls to determine specific missile types (AIM-7E-2 vs AIM-7F) and updates AAM field with the actual missile names rolled
- **Note S**: Rolls for SUU-23 gun pod availability (1-5 = equipped with +2 {4} gun rating)

**UK Notes:**
- **Note A**: Removes IRM missiles for Bombing/SEAD/Rescue Support missions
- **Note D**: Rolls for SUU-23 gun pod (same as US Note S)
- **Note H**: Reduces bomb load to lower value for Table D missions
- **Note M**: Rolls for radar degradation (1-3 = normal, 4-10 = range reduced to [12] with 8+: -2 modifier)
- **Note N**: Removes IRM missiles for Recon missions

**FRG Notes:**
- **Note A**: Changes IRM depletion to {6} for Bombing/SEAD/Rescue Support missions
- **Note E**: Reduces bomb load to lower value for Table D missions (same as US Note C)
- **Note G**: Removes IRM missiles for Bombing/SEAD/Rescue Support missions
- **Note H**: Shows "Multirole aircraft [8.37]" for SEAD and Chaff Laying missions only

**USSR Notes:**
- **Note C**: Rolls to determine R-60M vs R-73 missile type and updates AAM field
- **Note D**: Rolls to determine R-60 vs R-60M missile type and updates AAM field
- **Note I**: Adjusts bomb load based on mission profile - lower value for deep strikes (Table J Bombing/SEAD), higher value for normal missions
- **Note Q**: Shows "Multirole aircraft [8.37]" for SEAD and Chaff Laying missions only

**GDR Notes:**
- **Note C**: Rolls to determine R-60 vs R-60M missile type and updates AAM field
- **Note D**: Adjusts bomb load based on mission profile - lower value for deep strikes (Table J Bombing/SEAD), higher value for normal missions
- **Note J**: Shows "Multirole aircraft [8.37]" for SEAD and Chaff Laying missions only

**BE/CA/NE Notes:**
- **Note E**: Shows "Multirole aircraft [8.37]" for SEAD and Chaff Laying missions only

#### Display Notes (Printed as Reminders)

These notes provide important rules that players must follow during gameplay:

**Examples:**
- **Defensive Wheel**: "May enter Defensive Wheel formation [7.1]"
- **Spot Jamming**: "May Spot Jam [19.34] one/two radar(s)"
- **Multirole Aircraft**: "Multirole aircraft [8.37]"
- **Zoom Climb Restrictions**: "Zoom Climb [6.33] not allowed"
- **Special Capabilities**: SAR recon, laser designation, toss bombing, etc.

Display notes are shown in the **Capabilities/Notes** section of the flight card and do **NOT** modify the printed stats. They remind players of special rules during gameplay.

#### Air-to-Air Mission Filtering

Ground attack-specific information is automatically hidden for air-to-air missions since it's not relevant. This applies to all of these taskings:
- **CAP** (Combat Air Patrol)
- **Close Escort**
- **Recon**
- **Escort Jamming**
- **Standoff Jamming**
- **CSAR**
- **Transport**
- **Laser Designation**
- **Chaff Laying**
- **Fast FAC**

**What's hidden for these missions:**
- Ordnance listings
- Bomb load values
- Sight modifiers
- Rocket pod substitutions
- Toss bombing capabilities
- Internal bay usage

**What's still shown:**
- Gun ratings
- IRM/RHM missiles
- AAM (Air-to-Air Missiles)
- Radar and EW systems

## Design Decisions

### VH Altitude Row Omission

**Why**: Very few aircraft operate at VH (Very High) altitude - primarily high-altitude interceptors like the MiG-25 and reconnaissance variants.

**Implementation**: The generator checks if all VH speed values are "-" (dash). If so, the entire VH row is omitted from the speed table.

**Benefit**: Saves vertical space on flight sheets, allowing them to fit better in the 2x3 grid layout. This is especially important for aircraft with longer capability descriptions or multiple special notes.

### BVR Rating Display

Missiles are displayed in the format: **+X/+Y** or **+X/NA**

- **+X**: Standard rating modifier
- **+Y**: BVR (Beyond Visual Range) rating modifier
- **NA**: Missile has no BVR capability (e.g., early AIM-9 variants)

**Examples:**
- AIM-9J: +0/NA 
- AIM-9L: +3/+0 
- AIM-7F: +3/+1 

### Weapons Database Integration

The generator uses a centralized **weapons.json** database for all weapon statistics. This ensures:
- **Consistency**: All weapon ratings come from a single authoritative source
- **Maintainability**: Changes to weapon stats only need to be made in one place
- **Accuracy**: Notes that reference weapons (like gun pod rolls) dynamically look up current stats

### Clean vs Laden Speed Formatting

Aircraft with different performance profiles for clean and laden configurations display a **split table** showing:
- **Left columns** (Clean): Performance with no external stores
- **Right columns** (Laden): Performance with bombs/missiles

**Important**: Laden speeds only appear on flight cards when the aircraft:
1. Has laden speed data in the database, AND
2. Is carrying air-to-ground ordnance (bombs or ground-attack missiles), AND
3. Has a ground-attack tasking (not CAP, Close Escort, Recon, etc.)

Aircraft with only one speed profile display a **single table** for simplicity.

### Dual Bomb Load Logic

Some aircraft show dual bomb loads in the database (e.g., "5/3" or "3/2"). The generator automatically selects the appropriate value based on mission context:

- **Higher value (first number)**: Used for normal-range missions from Table I (Bombing Raid)
- **Lower value (second number)**: Used for extended-range deep strike missions from Table J (Deep Strike Raid)

## Understanding The Flight Sheets

### Header Section
- **Aircraft Type**: Model and nation
- **Callsign/Counter/Aggression**: Complete during game setup
- **Tasking**: Mission type (auto-filled from OOB table roll)
- **Fuel**: Aircraft-specific 

### Stats Section
- **Gun/IRM/RHM/AAM/Ordnance/Bomb/Sight**: Weapons and ordnance data from ADC
- **Crew/Rwy**: Crew size and runway requirements
- **RWR/Jam/Radar**: EW and Radar data
- **Capabilities**: Special abilities and note reminders

### Speed Table
- **Alt**: Altitude band (VH/H/M/L/D)
- **C/D/M**: Combat/Dash/Maneuver speeds
- Omits VH row if no value for that altitude

### Individual Aircraft Boxes

Each aircraft in the flight has:
- **Number**: Aircraft in flight (for combat rolls)
- **Damage Status**: Checkboxes for Damaged/Crippled/Destroyed
- **Ordnance Box**: Lists additional ordnance options from table rolls

### CSAR Flight Card Layout

**Combat Search and Rescue (CSAR)** flights receive a special compact card design optimized for their simplified requirements:

- **Compact Size**: CSAR cards are quarter-size (50% width × 50% height of regular cards)
- **4 Cards Per Row**: Four CSAR cards fit across the page width
- **Simplified Information**: Only displays roundel, aircraft type, callsign, tasking, and aircraft damage status
- **No Unnecessary Fields**: Omits fuel, counter, aggression, capabilities, notes, and ordnance boxes since CSAR helicopters don't need these for gameplay

**CSAR Flight Sorting**:
When multiple flights are generated, they are automatically organized for easy reference:
1. **Regular flights appear first** (by faction: NATO, then Warsaw Pact)
2. **CSAR flights appear after regular flights** (also grouped by faction)
3. **Page breaks** separate NATO flights from Warsaw Pact flights

This grouping makes it easy to track your combat flights separately from your rescue helicopters during gameplay.

## Tips for Use

### Printing Recommendations
- **Flight sheets** are optimized for 2x3 grid printing (6 flights per page)
- Print at actual size (100% scale) for best results

### Multiple Flights
When a table result produces multiple flights (e.g., "4 x {2}"), the generator automatically creates separate cards for each flight. You don't need to manually duplicate anything.

### Multirole Aircraft Note
The "Multirole aircraft [8.37]" note only appears for aircraft on **SEAD** or **Chaff Laying** missions, as these are the only taskings where the multirole rules apply per game rule 8.37.

### Note Interpretation
- **Bold rule references** in notes (e.g., [7.1], [19.34]) point to specific rules in the Red Storm rulebook
- Notes marked with dice rolls have already been resolved - the printed values reflect the roll results
- Display notes remind you of special rules to reduce lookups on aid cards

## Questions or Issues?

If you encounter any problems or have suggestions:
1. Check that your browser is up to date (Chrome, Firefox, Edge recommended)
2. Verify you're using the latest version of the generator
3. Report issues via the GitHub repository

---

**Version**: 1.0  
**Last Updated**: November 7, 2025  
**Maintained by**: Red Storm Tools Suite Development Team
