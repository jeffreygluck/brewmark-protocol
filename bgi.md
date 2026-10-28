# BrewMark Grind Index (BGI)

Version 0.1 (draft for comment), October 2026.

The BGI is one 0–100 scale for grind size that every grinder's own dial is
mapped onto. A recipe written as "BGI 38" means the same grind on any grinder
BrewMark can translate. This document describes exactly how BrewMark computes
it today.

## What the BGI is, and is not

The BGI orders grinds from finest (0) to coarsest (100) through five fixed
reference points. It is **not** a particle size: BGI 40 is "filter medium on
this grinder's curve", not a number of microns. Tying each reference point to a
measured median particle size is the next step for the protocol, and arrives
with `measured` provenance.

## The five anchors

Each grinder is described by its setting at five points on the index:

| BGI | Anchor | Field | Required |
| --- | --- | --- | --- |
| 0 | Espresso fine | `espressoAnchor` | yes |
| 15 | Moka pot | `mokaAnchor` | no |
| 40 | Filter medium | `filterAnchor` | yes |
| 70 | French press | `frenchPressAnchor` | no |
| 100 | Very coarse | `coarseAnchor` | yes |

Settings are in the grinder's own units: the number on a numbered dial, clicks
from zero, or rotations (see `unit`). A grinder also has a dial range,
`minSetting` to `maxSetting`.

When an optional anchor is missing it is filled in on a straight line:

- moka = espresso + (15 / 40) × (filter − espresso)
- French press = filter + (30 / 60) × (coarse − filter)

## From BGI to setting

1. Clamp the BGI to 0–100.
2. Interpolate between the anchors:
   - **Conical burrs:** a Fritsch–Carlson monotone cubic spline through the five
     anchors. It never overshoots between anchors, so a finer BGI never gives a
     coarser setting.
   - **Flat burrs, hybrid burrs, or burr type unknown:** straight lines between
     neighbouring anchors.
3. Round to one decimal and clamp to the dial's range. This is `setting`.
4. Write the setting as the dial prints it. On a dial with recorded steps, snap
   to the nearest step (ties go coarser), and use the maker's notation: "6.2"
   for the second mark after 6 on a Fellow Ode, "4R" on a Baratza Forte. On a
   stepless dial, or one whose steps are not yet recorded, one decimal. This is
   `settingLabel`.
5. On a stepped dial where the curve falls between two marks, report both,
   finer first. This is `between`.

## From setting to BGI

The inverse, used when a recipe arrives as a setting on a known grinder:

- **Linear:** find the segment between two anchors whose settings contain the
  value and interpolate back. A setting beyond the end anchors maps to 0 or 100.
- **Conical:** start from the linear answer and refine with Newton–Raphson on the
  spline (numerical derivative over 0.01 BGI; at most 10 iterations; stop when
  within 0.001 of the setting).

The result is clamped to 0–100 and rounded to one decimal.

## Converting between two grinders

Setting on grinder A → BGI → setting on grinder B. This is what
`/api/v1/convert` does, and translate is its second half.

## Brew methods

Methods sit at fixed points that BrewMark uses as starting points (the profiles
in `examples/`): espresso 5, AeroPress 25, pour over 38, immersion 48, drip 50,
batch brew 52, French press 72, cold brew 88. A recipe may use any value.

When a recipe's method is one a grinder's maker says it is not made for, the
translation is still given, with a warning. Methods are grouped for that check:

| Method | Group |
| --- | --- |
| espresso | espresso |
| moka | moka |
| pour_over, drip, batch_brew, aeropress | filter |
| french_press, immersion | French press |
| cold_brew | cold brew |

## Changes from here

- Each anchor gains a measured median particle size and spread, with the method
  used, and `measured` provenance.
- Hybrid burrs may get their own interpolation once there is data to justify one.
- Burr wear: how a grinder's curve drifts with use.
