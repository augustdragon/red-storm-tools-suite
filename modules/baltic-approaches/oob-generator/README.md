
# Baltic Approaches — OOB Generator (Naval Reference)

This module contains the Naval Reference and Additional Data pages used by the Baltic Approaches OOB generator and reference tools.

Summary of implemented features
- Naval Reference page: searchable/filterable tables for NATO and Warsaw Pact naval units.
- SSM tooltips: hover (or tap) over SSM names in the Capabilities column to view full SSM specifications inline.
- Data files: JSON datasets for NATO / WP naval units and SSM specs.
- Theme support: consistent light/dark mode styling matching the Aircraft Reference pages.

Where to find the files
- `naval-reference.html` — Main reference page (loads naval-data-nato.json, naval-data-wp.json, and ssm-data-*.json).
- `naval-additional-data.html` — Additional data (SSM tables, sub-target damage table, notes).
- `data/naval-data-nato.json` — NATO naval unit data (ships, stats, capabilities).
- `data/naval-data-wp.json` — WP naval unit data.
- `data/naval-note-rules.json` — Note definitions used by tooltips.
- `data/ssm-data-nato.json` — NATO SSM specifications used by tooltips.
- `data/ssm-data-wp.json` — WP SSM specifications used by tooltips.

Data schema notes
- `SAM` values in the ship entries are now flexible: they can be a string (single SAM) or an array of strings (multiple SAM systems). Rendering code (`naval-reference.html`) handles both formats.
- `capabilities` object includes:
  - `SSM`: (string) name of SSM type that references an SSM JSON entry
  - `Ammo`: (number) missile load
  - `Helo`: (string|null) helicopter type if present

Extending data
- To add or update SSM specs, edit `data/ssm-data-nato.json` or `data/ssm-data-wp.json` using the same keys used in `capabilities.SSM` for ships.
- To add new ships, follow the structure in `data/naval-data-nato.json` and `data/naval-data-wp.json`. Use either a string or an array for `SAM` values.

Developer notes
- Tooltip behavior: hover on desktop, tap to reveal on touch devices. If a ship's `capabilities.SSM` cannot be matched to an SSM entry, the plain SSM name is shown.
- Styling: faction-specific headers use NATO/ WP colors; the sub-target damage table uses a neutral gray scheme to be visible in both themes.

If you'd like, I can add an API-style schema file (JSON Schema) or automated tests to validate new data entries.
