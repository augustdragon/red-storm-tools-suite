# Aircraft canonical ID strategy

This note captures a pragmatic ID scheme that uses the combination of aircraft name and nationality as the primary unique key and appends a numeric suffix for deterministic, schema-friendly identifiers. The goal is to keep regex as a narrowly scoped fallback while moving lookups to structured fields.

## ID shape
- **Base key**: normalized aircraft name + nationality code (e.g., `F-16C` + `US`).
- **ID format**: `<nationCode>-<normalizedName>-<index>` where the index is stable for variants (e.g., block or loadout differences) under the same name/nation pair.
- **Normalization rules**: uppercase, trim whitespace, replace spaces and punctuation with `-`, and collapse repeats. This keeps regex usage limited to optional legacy name matching.

## Application across the pipeline
- **Data sources**: add `id` fields to aircraft JSON records using the ID format above. Name/nation remain for display but lookups and references use `id`.
- **Table references**: embed `aircraftId` alongside display names in table JSON so table processors can emit structured results without re-parsing names.
- **Generators/printing**: resolve aircraft by `aircraftId` first; only fall back to regex-based alias resolution when an ID is missing (legacy data) or when a free-form string must be matched.

## Benefits
- Stronger uniqueness without abandoning existing naming conventions.
- Regex becomes an edge-case helper rather than the primary lookup mechanism.
- Easier downstream validation and schema enforcement because IDs are deterministic and structured.
