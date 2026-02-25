# OOB Table — Scan vs JSON Comparison

Compared all Red Storm and Baltic Approaches OOB tables against physical game scans.
- RS: RS_OOB1-5.pdf
- BA: BA_OOB1-5.jpg
Date: 2026-02-24 (RS), 2026-02-25 (BA)

## Status Legend
- MATCH = JSON matches scan exactly
- FIXED = Corrected in this session
- MISMATCH = Aircraft names, ranges, or nation assignments differ from scan

---

## NATO Tables (A-F)

### Table A — QRA Flight
**Status:** MATCH

All 4 variants verified against scan (2ATAF pre/post, 4ATAF pre/post). Every nation range and aircraft entry matches exactly.

### Table B — CAP Flight
**Status:** MATCH

All 4 variants verified against scan (2ATAF pre/post, 4ATAF pre/post). Every nation range and aircraft entry matches exactly.

### Table C — Bombing Raid
**Status:** FIXED

| Section | Issue | Fix Applied |
|---------|-------|-------------|
| SEAD post FRG aircraft | Had extra `"8-9": Alpha Jet` causing overlap | Removed — Alpha Jet only belongs in Bombing section |
| CAP | Appears to match scan | -- |
| Bombing | Appears to match scan | -- |

### Table D — Deep Strike Raid
**Status:** MATCH

All 5 taskings verified against scan (Escort Jamming, CAP, SEAD, Bombing, Recon). Every nation range and aircraft entry matches exactly.

### Table E — Combat Rescue
**Status:** MATCH

All three nationalities verified against scan:
- US: 1-6 A-10A, 7-10 A-7D, CSAR H-53 -- MATCH
- UK: 1-8 Harrier GR3, 9-10 Jaguar GR1A, CSAR Puma -- MATCH
- FRG: 1-5 Alpha Jet, 6-10 F-4F, CSAR CH-53 -- MATCH

### Table F — Special Missions
**Status:** FIXED (2 issues)

| Section | Issue | Fix Applied |
|---------|-------|-------------|
| Fast FAC | MATCH | None needed |
| Standoff Jamming nations | Missing `"10": UK/FRG` entry (Falcon 20F / HFB 320 Hansa Jet) | Added UK/FRG nation |
| Tactical Recon nations | Completely wrong ranges: JSON had 1-6 US, 7-8 UK, 9-10 FRG. Scan shows 1-3 US, 4-5 UK, 6-9 FRG, 10 BE/NE | Corrected all nation ranges and added BE/NE |
| Tactical Recon US aircraft | JSON had RF-4C + F-16C(R); Scan shows only RF-4C | Corrected to RF-4C only |

---

## WP Tables (G-L)

### Table G — QRA Flights
**Status:** FIXED (7 aircraft entries corrected)

**Nation ranges match:** 1-3 USSR, 4-10 GDR -- MATCH

**USSR aircraft — FIXED:**

| Roll | Scan | Old JSON | Fix Applied |
|------|------|----------|-------------|
| 1-2 | MiG-21bis | MiG-21bis | No change needed |
| 3-4 | MiG-23M | MiG-23M | No change needed |
| 5-6 | MiG-23MLA | MiG-23ML | Changed to MiG-23MLA |
| 7-8 | MiG-23MLD | MiG-29A | Changed to MiG-23MLD |
| 9-10 | MiG-29A | MiG-25PD/Su-27S | Changed to MiG-29A |

**GDR aircraft — FIXED:**

| Roll | Scan | Old JSON | Fix Applied |
|------|------|----------|-------------|
| 1-6 | MiG-21MF | MiG-21bis | Changed to MiG-21MF |
| 7 | MiG-21SPS | (merged into 7-10) | Added as separate entry |
| 8-10 | MiG-21bis | MiG-23ML | Changed to MiG-21bis |

GDR section restructured from 2 entries to 3 entries to match scan.

### Table H — Fighter Sweep
**Status:** FIXED (7 aircraft entries corrected)

**Nation ranges match:** 1-7 USSR, 8-10 GDR -- MATCH

**USSR aircraft — FIXED:**

| Roll | Scan | Old JSON | Fix Applied |
|------|------|----------|-------------|
| 1-2 | MiG-23M | MiG-21bis | Changed to MiG-23M (removed MiG-21bis) |
| 3-4 | MiG-23MLA | MiG-23M | Changed to MiG-23MLA |
| 5-6 | MiG-23MLD | MiG-23MLA | Changed to MiG-23MLD |
| 7-9 | MiG-29A | MiG-29A | No change needed |
| 10 | MiG-25PD/Su-27S | MiG-25PD/Su-27S | No change needed |

Root cause: MiG-21bis was erroneously inserted at 1-2, shifting all other aircraft down and pushing MiG-23MLD off the table.

**GDR aircraft — FIXED:**

| Roll | Scan | Old JSON | Fix Applied |
|------|------|----------|-------------|
| 1-5 | MiG-21MF | MiG-21bis | Changed to MiG-21MF |
| 6 | MiG-21SPS | (merged into 6-10) | Added as separate entry |
| 7-9 | MiG-21bis | (merged into 6-10 MiG-23ML) | Added as separate entry |
| 10 | MiG-23MF/ML | (merged into 6-10 MiG-23ML) | Changed to MiG-23MF/ML (sub-roll) |

GDR section restructured from 2 entries to 4 entries to match scan.

### Table I — Bombing Raid
**Status:** MATCH

All aircraft verified for both USSR and GDR across all three taskings (Close Escort, SEAD, Bombing). Every entry matches the scan exactly.

### Table J — Deep Strike Raid
**Status:** FIXED (Bombing aircraft names)

| Tasking | Status |
|---------|--------|
| Escort Jamming | MATCH |
| Chaff Laying | MATCH |
| Close Escort | MATCH |
| Recon | MATCH |
| **Bombing** | **FIXED** — JSON had `1-4 Su-24M` and `5-8 Su-24M4`. Scan shows `1-4 Su-24` and `5-8 Su-24M`. Both corrected. |

### Table K — Combat Rescue
**Status:** FIXED (GDR section)

**USSR — MATCH:**
- Rescue Support: 1-5 Su-25, 6-8 Su-17M4, 9-10 MiG-21bis -- MATCH
- CSAR: Mi-8 -- MATCH

**GDR — FIXED:**

| Roll | Scan | Old JSON | Fix Applied |
|------|------|----------|-------------|
| 1-5 | MiG-21SPS | MiG-21bis | Changed to MiG-21SPS |
| 6-10 | MiG-21MF | MiG-23BN | Changed to MiG-21MF |

Both GDR rescue support aircraft were completely wrong and have been corrected.

### Table L — Special Missions
**Status:** FIXED (3 issues)

**Standoff Jamming — FIXED:**

| Issue | Fix Applied |
|-------|-------------|
| JSON had `"1-5": USSR, "6-10": GDR (An-26)` | Removed GDR nation. Changed USSR to `"1-10"`. Standoff Jamming is USSR-only. |

**Tactical Recon — FIXED:**

| Nation | Roll | Scan | Old JSON | Fix Applied |
|--------|------|------|----------|-------------|
| USSR | 3-4 | Su-17M3 | Su-17M3R | Removed R suffix |
| GDR | 1-5 | MiG-21M | MiG-21R | Changed to MiG-21M (different variant) |
| GDR | 6-10 | Su-22M4 | Su-22M4R | Removed R suffix |

USSR aircraft 1-2 (MiG-21R), 5-7 (Su-24MR), and 8-10 (MiG-25RB) were already correct — these legitimately have R-suffixes in the game data.

**RS Tables G, H, and K had the most significant errors** — completely wrong aircraft assignments that would have given players incorrect flight sheets. All have been corrected to match the physical game scans.

---

## BA NATO Tables (A2-F2)

### Table A2 — QRA Flight
**Status:** MATCH

All 3 date periods verified (15-20 May, 21-31 May, 1-15 June). Nation ranges (DK, FRG, NE) and aircraft (F-16A, F-4F) match exactly.

### Table A2-SE — SE QRA Flight
**Status:** MATCH

Sweden: 1-5 J-35F2, 6-10 JA-37 — matches exactly.

### Table B2 — CAP Flight
**Status:** MATCH

All 3 date periods verified. Nation ranges shift across dates (more US in later periods, F-14A appears in June). All aircraft entries match.

### Table C2 — CAS Raid
**Status:** MATCH

Both SEAD and Bombing taskings across all 3 date periods verified. All nation ranges and aircraft match, including superscript-2 SEAD variants and USMC F/A-18A in June.

### Table D2 — Deep Strike Raid
**Status:** MATCH

All 5 taskings verified (Escort Jamming, CAP, SEAD, Bombing, Recon). FRG and US nation ranges and aircraft all match.

### Table D3 — Naval Strike Raid
**Status:** MATCH

All 4 nationality groups across both date periods verified:
- 15-31 May: FRG/DK (1-4), UK/RAF (5-7), USAF (8-10)
- 1-15 June: FRG/DK (1-3), UK/RN (4), USN (5-7), USMC (8-10)

All aircraft, flight sizes, and flight counts match.

### Table E2 — Combat Rescue
**Status:** MATCH

All three nationalities verified:
- FRG: 1-8 Alpha Jet, 9-10 F-4F, CSAR CH-53/Mk41 Sea King -- MATCH
- DK: S-61 CSAR -- MATCH
- SE: HKP-4D CSAR -- MATCH

### Table F2 — Maritime Patrol
**Status:** MATCH

All 4 nations verified: 1 US P-3C, 2-3 NE P-3C Orion, 4-7 FRG BR.1150 Atlantic 2, 8-10 UK Nimrod MR2.

---

## BA WP Tables (G2-L2)

### Table G2 — QRA Flight
**Status:** FIXED (significant — 21-31 May and 1-15 June aircraft/nation ranges corrected)

**15-20 May — MATCH:**
- 1-3 USSR: 1-5 MiG-23MLD, 6-8 MiG-29A, 9-10 MiG-25PD
- 4-6 POL: 1-5 MiG-21bis, 6-10 MiG-23MF
- 7-10 GDR: 1-4 MiG-21MF, 5-9 MiG-23ML, 10 MiG-23MF

**21 May+ — FIXED:**

Scan shows `21 May+: 1-4 USSR; 5-7 POL; 8-10 GDR` — only nation ranges change; aircraft within each nation stay the same as 15-20 May.

| Period | Nation | Issue | Fix Applied |
|--------|--------|-------|-------------|
| 21-31 May | USSR | Had fabricated aircraft: 1-4 MiG-23MLD, 5-7 MiG-23ML, 8-9 MiG-29A, 10 MiG-25PD | Corrected to match 15-20 May: 1-5 MiG-23MLD, 6-8 MiG-29A, 9-10 MiG-25PD |
| 21-31 May | GDR | Had 1-6 MiG-21MF, 7-10 MiG-23ML (missing MiG-23MF) | Corrected to match 15-20 May: 1-4 MiG-21MF, 5-9 MiG-23ML, 10 MiG-23MF |
| 1-15 June | All | Wrong nation ranges: 1-5 USSR, 6-8 POL, 9-10 GDR | Corrected to 1-4 USSR, 5-7 POL, 8-10 GDR |
| 1-15 June | USSR | Had 1-5 MiG-23MLD, 6-9 MiG-29A, 10 Su-27S | Corrected to match 15-20 May: 1-5 MiG-23MLD, 6-8 MiG-29A, 9-10 MiG-25PD |
| 1-15 June | GDR | Had 1-10 MiG-23ML | Corrected to match 15-20 May: 1-4 MiG-21MF, 5-9 MiG-23ML, 10 MiG-23MF |

Root cause: JSON was fabricated with 3 different date periods with unique aircraft configurations, but the scan shows the aircraft stay constant — only nation probability ranges change after 21 May.

### Table H2 — Fighter Sweep
**Status:** FIXED (1 aircraft entry corrected)

**Nation ranges match for both periods.**

**1-15 June — MATCH:**
- 1-7 USSR: 1-5 MiG-23MLD, 6-9 MiG-21bis, 10 Su-27S
- 8-9 POL: 1-5 MiG-21bis, 6-10 MiG-23MF
- 10 GDR: MiG-23ML

**15-31 May — FIXED:**

| Roll | Scan | Old JSON | Fix Applied |
|------|------|----------|-------------|
| 1-5 | MiG-23MLD | MiG-23MLD | No change needed |
| 6-9 | MiG-21bis | MiG-23MLD | Changed to MiG-21bis |
| 10 | Su-27S | Su-27S | No change needed |

The JSON had MiG-23MLD for both 1-5 and 6-9 ranges — duplicate aircraft that masked a data error. Corrected 6-9 to MiG-21bis per user verification of scan.

### Table I2 — Bombing Raid
**Status:** MATCH

All 3 nationalities (GDR, POL, USSR) verified across all taskings (Close Escort, SEAD, Bombing). Every aircraft entry matches.

### Table J2 — Deep Strike Raid
**Status:** MATCH

All 4 taskings verified (Escort Jamming, Close Escort, Deep Strike, Recon). All USSR aircraft match exactly.

### Table J3 — Naval Strike Raid
**Status:** FIXED (1 GDR aircraft entry)

**USSR — MATCH.** All 4 flight types verified.
**POL — MATCH.** All 4 flight types verified.

**GDR Recon — FIXED:**

| Item | Scan | Old JSON | Fix Applied |
|------|------|----------|-------------|
| GDR Recon aircraft | MiG-21M | MiG-21RF | Changed to MiG-21M (aircraftId: GDR-MIG-21M-1) |

Note: The JSON result string already said "[MiG-21M]" but the aircraft data entry said "MiG-21RF". The result string was correct; the aircraft data was wrong. POL Recon correctly uses MiG-21RF — these are different aircraft for different nations.

### Table K2 — Combat Rescue
**Status:** FIXED (minor naming)

**GDR Land — FIXED:**

| Item | Scan | Old JSON | Fix Applied |
|------|------|----------|-------------|
| Rescue Support 1-5 | MiG-21SPS | MiG-21SP | Corrected name to MiG-21SPS |

Rescue Support 6-10 MiG-21MF — MATCH.
CSAR Mi-8 — MATCH.

**GDR Naval — MATCH:**
Rescue Support Su-22M4 and CSAR Mi-14 both match.

### Table L2 — Special Missions
**Status:** MATCH

Both mission types verified:
- Standoff Jamming: 1-4 An-12PP, 5-7 Su-24MP, 8-10 Tu-16P — MATCH
- Maritime Patrol: 1-4 Tu-22RD, 5-8 IL-38, 9-10 Tu-95RT — MATCH

---

## Full Summary

### Red Storm Module (Tables A-L)

| Table | Status | Action Needed |
|-------|--------|---------------|
| A | **MATCH** | None |
| B | **MATCH** | None |
| C | **FIXED** | Done |
| D | **MATCH** | None |
| E | **MATCH** | None |
| F | **FIXED** | Done |
| G | **FIXED** | Done — 7 aircraft entries corrected |
| H | **FIXED** | Done — 7 aircraft entries corrected |
| I | **MATCH** | None |
| J | **FIXED** | Done — Bombing Su-24M/Su-24M4 corrected to Su-24/Su-24M |
| K | **FIXED** | Done — 2 GDR aircraft entries corrected |
| L | **FIXED** | Done — Removed GDR Standoff Jamming, corrected Tactical Recon names |

### Baltic Approaches Module (Tables A2-L2)

| Table | Status | Action Needed |
|-------|--------|---------------|
| A2 | **MATCH** | None |
| A2-SE | **MATCH** | None |
| B2 | **MATCH** | None |
| C2 | **MATCH** | None |
| D2 | **MATCH** | None |
| D3 | **MATCH** | None |
| E2 | **MATCH** | None |
| F2 | **MATCH** | None |
| G2 | **FIXED** | Done — 21-31 May and 1-15 June aircraft/nation ranges corrected |
| H2 | **FIXED** | Done — 15-31 May USSR 6-9 MiG-23MLD corrected to MiG-21bis |
| I2 | **MATCH** | None |
| J2 | **MATCH** | None |
| J3 | **FIXED** | Done — GDR Recon MiG-21RF corrected to MiG-21M |
| K2 | **FIXED** | Done — MiG-21SP corrected to MiG-21SPS |
| L2 | **MATCH** | None |

**RS Module:** 6 MATCH, 6 FIXED. All verified.
**BA Module:** 11 MATCH, 4 FIXED. All verified.
