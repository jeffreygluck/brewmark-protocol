# Grind measurement: the image method, 0.1

How an owner measures their own grinder's particle size from one photo, so that
two people following it get comparable numbers. The reference implementation is
the tool at https://brewmark.io/tools/measure-grind. It runs in the browser; the photo is
never uploaded.

A reading is `community` provenance (README.md, "Provenance"). It is stored as
pending and reviewed before it counts towards any grinder's curve.

## What a reading is

| Field | Meaning |
| --- | --- |
| `grinder` | The grinder's slug, e.g. `fellow-ode-gen-2` |
| `setting` | The setting in catalogue units, as the dial is read (on a Fellow Ode, "4.2" is the second mark after 4: 4.667) |
| `d10Microns`, `d50Microns`, `d90Microns` | Diameters below which 10%, 50% and 90% of the coffee **by volume** lies, in µm |
| `method` | `image` for this method. `sieve` and `laser` are reserved for readings made those ways |
| `particles` | Particles counted. At least 200 for an image reading |
| `note` | Optional: burr age, anything unusual about the unit |

Submitted with `POST /api/v1/measurements`. D50 must be 50–3000 µm, and
D10 ≤ D50 ≤ D90.

## Setup

1. Grind a few grams at one setting.
2. Sprinkle a pinch thinly over plain white paper, so that particles sit apart.
   A few hundred particles is the minimum; more helps if they stay separate.
3. Lay a reference object of known diameter flat on the paper, beside the
   grounds rather than among them. A coin is the usual choice. Coins differ by
   country, so the user names theirs or types its diameter. The tool offers:

   | Coin | Diameter | Source |
   | --- | --- | --- |
   | US quarter | 24.26 mm | US Mint, coin specifications: https://www.usmint.gov/learn/coin-and-medal-programs/coin-specifications (the live page refuses automated requests; read from the Internet Archive copy of 2023-01-03) |
   | €1 coin | 23.25 mm | European Central Bank, euro coins: https://www.ecb.europa.eu/euro/coins/common/html/index.en.html |
   | UK £1 coin | 23.43 mm, point to point | Royal Mint: https://www.royalmint.com/new-pound-coin/ ("a maximum diameter (point to point) of 23.43mm") |

   The £1 coin has twelve sides. Its 23.43 mm is corner to opposite corner, so
   the line must be drawn between two opposite corners; drawn across the flats
   it is shorter and every size would read too large. Checked 2026-10-29.
4. Photograph straight down, so the paper is not foreshortened, in bright even
   light without hard shadows or flash, close enough that the paper fills the
   frame.

## Scale

The user draws a line across the reference's diameter on the photo. The scale is

    µm per pixel = diameter (mm) × 1000 / line length (pixels)

The photo is analysed at no more than 3000 pixels on its long side, and the
line is drawn on that same image. A reading is refused when:

- there is no reference line;
- the line is shorter than 100 pixels (the scale would be worse than ~1%);
- the scale is coarser than 80 µm per pixel (a 400 µm particle would be five
  pixels across).

## Finding particles

1. **Grayscale**, Rec. 601 luma.
2. **Dark-area check.** If more than 35% of the photo is darker than 60% of the
   paper's brightness (the 90th-percentile gray), the reading is refused: the
   grounds are too dense, or the paper does not fill the frame.
3. **Flat field.** Each pixel is divided by the mean of a square window around
   it, scaled so paper reads about 240. The window's half-width is the larger
   of 1/16 of the long side and 6 mm at the photo's scale, so it is always
   several times wider than the coarsest real particle. This removes the
   gradient a phone photo has from one side to the other.
4. **Threshold.** Otsu's method on the flattened image; dark is `≤ t`. Where a
   range of levels separates the two classes equally (an empty stretch between
   grounds and paper), the middle of the range. The threshold is capped at 210,
   so paper texture is never counted on a photo with few particles.
5. **Connected components**, 8-connected.
6. **Left out:**
   - anything whose bounding box meets a circle on the reference line's
     midpoint with 1.15 times its half-length as radius (the reference, its rim
     and shadow, and grounds touching it);
   - anything touching the edge of the photo (it may be cut off);
   - anything under 4 pixels (noise and paper texture);
   - clumps: anything over 4000 µm, or with a long-to-short axis ratio over 3
     from its second moments (touching particles in a chain).

## Sizing and the distribution

Each particle's size is its **equivalent circular diameter**: the diameter of a
circle of the same area, `2 × √(area / π)` in pixels, times the scale.

D10, D50 and D90 are percentiles of the **volume-weighted** distribution: each
particle counts in proportion to its diameter cubed. This is what laser
diffraction reports, and close to what a sieve stack reports (it weighs mass),
so image readings can be set beside readings made those ways. A
number-weighted median is dominated by fines, and moves with how well the
camera resolves them, so it is shown for reference only and not submitted.
Percentiles interpolate linearly between neighbouring particles in the sorted
list.

The tool also shows a histogram of volume share and particle count in bands of
100 µm up to 1000 µm, then wider bands up to 4000 µm.

## The 200-particle floor

Fewer than 200 particles counted, after everything above is left out, and the
reading is refused. With volume weighting the coarsest few particles carry
much of the weight, and below a few hundred the D90 in particular moves from
one sprinkle to the next.

## Known limits

- **Fines are undercounted.** A particle needs about two pixels across (4
  pixels of area) to be counted. The tool reports this floor in µm for each
  photo. Coffee's fines (under ~100 µm) carry little volume, so D50 and D90
  are affected less than D10.
- **Overlapping and touching particles** merge into one larger blob. Chains and
  outsized blobs are set aside; a touching pair can still slip through and
  read as one coarser particle. Sprinkling thinly is the remedy.
- **Lighting.** Hard shadows add to a particle's outline; glare and translucent
  edges take away from it. Diffuse light is best.
- **Projection.** A photo sees each particle's outline from above. Flat flakes
  lie flat, so they read larger than their sieve size.
- **Lens and angle.** A photo taken at an angle stretches one direction; wide
  phone lenses distort near the corners. Straight down, with the grounds
  towards the middle of the frame, keeps both small.

## Validation

BrewMark's test suite draws synthetic photos (discs of known
diameter on paper, with a coin, uneven light, noise, clumps and particles cut
off by the frame) and checks that D50 comes back within 8%, and that each
refusal fires. Synthetic discs are not coffee: these tests check the
arithmetic, not the method's agreement with sieves or laser diffraction.
