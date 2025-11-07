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
- Performance data (speeds at different altitudes)
- Weapons loadout (guns, missiles)
- Electronic warfare systems (RWR, Jamming)
- Crew size and runway requirements
- Special capabilities and notes

### Step 4: Aircraft Note Processing

Many aircraft have **note codes** (letters A-Z) that modify their characteristics based on mission tasking or require dice rolls. The generator automatically applies these notes:

#### Data-Modifying Notes (Applied Automatically)

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

#### Display Notes (Printed as Reminders)

These notes provide important rules that players must follow during gameplay:

**Examples:**
- **Defensive Wheel**: "May enter Defensive Wheel formation [7.1]"
- **Spot Jamming**: "May Spot Jam [19.34] one/two radar(s)"
- **Multirole Aircraft**: "Multirole aircraft [8.37]"
- **Zoom Climb Restrictions**: "Zoom Climb [6.33] not allowed"
- **Special Capabilities**: SAR recon, laser designation, toss bombing, etc.

Display notes are shown in the **Capabilities/Notes** section of the flight card and do **NOT** modify the printed stats. They remind players of special rules during gameplay.

#### CAP Flight Filtering

Ground attack-specific notes are automatically hidden for CAP (Combat Air Patrol) missions since they're not relevant:
- Rocket pod substitutions
- Bomb load information
- Toss bombing capabilities
- Internal bay usage
- Defensive wheel formations (ground attack specific)

## Design Decisions

### VH Altitude Row Omission

**Why**: Very few aircraft operate at VH (Very High) altitude - primarily high-altitude interceptors like the MiG-25 and reconnaissance variants.

**Implementation**: The generator checks if all VH speed values are "-" (dash). If so, the entire VH row is omitted from the speed table.

**Benefit**: Saves vertical space on flight sheets, allowing them to fit better in the 2x3 grid layout. This is especially important for aircraft with longer capability descriptions or multiple special notes.

**Example**: Most fighters, ground attack aircraft, and bombers will display only H/M/L/D altitude bands.

### BVR Rating Display

Missiles are displayed in the format: **+X/+Y** or **+X/NA**

- **+X**: Standard rating modifier
- **+Y**: BVR (Beyond Visual Range) rating modifier
- **NA**: Missile has no BVR capability (e.g., early AIM-9 variants)

**Examples:**
- AIM-9J: +0/NA (no dogfight bonus, no BVR capability)
- AIM-9L: +3/+0 (good dogfight rating, can engage at BVR but no modifier)
- AIM-7F: +3/+1 (excellent missile with BVR bonus)

### Weapons Database Integration

The generator uses a centralized **weapons.json** database for all weapon statistics. This ensures:
- **Consistency**: All weapon ratings come from a single authoritative source
- **Maintainability**: Changes to weapon stats only need to be made in one place
- **Accuracy**: Notes that reference weapons (like gun pod rolls) dynamically look up current stats

### Clean vs Laden Speed Formatting

Aircraft with different performance profiles for clean and laden configurations display a **split table**:
- Left columns: Clean speeds (no external stores)
- Right columns: Laden speeds (with bombs/missiles)

Aircraft with only one speed profile display a **single table** for simplicity.

## Understanding Your Flight Sheet

### Header Section
- **Aircraft Type**: Model and nation
- **Callsign/Counter/Aggression**: Fill in during game setup
- **Tasking**: Mission type (auto-filled from table roll)
- **Fuel**: 18 boxes to track fuel consumption

### Stats Section
- **Gun/IRM/RHM/AAM/Ordnance/Bomb/Sight**: Weapons and sensors
- **Crew/Rwy**: Crew size and runway requirements
- **RWR/Jam/Radar**: Electronic warfare systems
- **Capabilities**: Special abilities and note reminders

### Speed Table
- **Alt**: Altitude band (VH/H/M/L/D)
- **C/D/M**: Combat/Dash/Maneuver speeds
- Omits VH row if aircraft can't reach that altitude

### Individual Aircraft Boxes

Each aircraft in the flight has:
- **Number**: Position in formation
- **Damage Status**: Checkboxes for Damaged/Crippled/Destroyed
- **Ordnance Box**: Lists additional ordnance options from bombing table rolls

## Tips for Use

### Printing Recommendations
- **Flight sheets** are optimized for 2x3 grid printing (6 flights per page)
- Print at actual size (100% scale) for best results
- Consider printing on cardstock for durability

### Multiple Flights
When a table result produces multiple flights (e.g., "4 x {2}"), the generator automatically creates separate cards for each flight. You don't need to manually duplicate anything.

### Note Interpretation
- **Bold rule references** in notes (e.g., [7.1], [19.34]) point to specific rules in the Red Storm rulebook
- Notes marked with dice rolls have already been resolved - the printed values reflect the roll results
- Display notes remind you of special rules but don't change the printed statistics

### Digital vs Physical Play
The generator works for both:
- **Digital**: Use the generated sheets on screen/tablet
- **Physical**: Print sheets and mark fuel/damage during play
- **Hybrid**: Print reference cards, track state digitally

## Nation-Specific Notes

### US Air Force (19 notes: A-S)
Extensive notes covering Wild Weasel operations, advanced missiles, specialized pods, and multi-role capabilities.

### UK Royal Air Force (15 notes: A-O)
Focus on specialized weapons (JP233, Skyflash), internal bays, laser designation, and reconnaissance restrictions.

### FRG Luftwaffe (9 notes: A-I)
Notes for multirole operations, munitions dispensers (MW-1), and operational restrictions.

### BE/CA/NE (Belgium/Canada/Netherlands) (5 notes: A-E)
Shared note system for smaller NATO air forces with simplified rule set.

### USSR Air Forces (23 notes: A-W)
Most extensive note set covering Soviet doctrine, missile variety, large aircraft, and specialized systems.

### GDR Luftstreitkräfte (10 notes: A-J)
East German air force notes focusing on Soviet equipment variants.

## Future Enhancements

Planned improvements to the OOB generator:
- **Modular note system**: Refactor notes into separate JavaScript module for easier maintenance
- **Custom OOB tables**: Allow users to create and save custom probability tables
- **Campaign tracking**: Save and reload OOB results across multiple game sessions
- **Export options**: Additional formats (PDF, CSV) for different workflows

## Questions or Issues?

If you encounter any problems or have suggestions:
1. Check that your browser is up to date (Chrome, Firefox, Edge recommended)
2. Verify you're using the latest version of the generator
3. Report issues via the GitHub repository

---

**Version**: 1.0  
**Last Updated**: November 7, 2025  
**Maintained by**: Red Storm Tools Suite Development Team
