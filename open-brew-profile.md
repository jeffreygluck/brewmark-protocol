# Open Brew Profile

Version 0.1 (draft for comment), October 2026. Spec identifier:
`brewmark.obp/0.1`. JSON Schema: [schema/open-brew-profile-0.1.json](schema/open-brew-profile-0.1.json).

An Open Brew Profile is a coffee recipe as JSON, with the grind given as a
target on the [BrewMark Grind Index](bgi.md) instead of a setting on one
grinder. Any reader can turn the target into a setting on the reader's own
grinder with translate.

## Example

```json
{
  "spec": "brewmark.obp/0.1",
  "id": "brewmark-pour-over",
  "name": "Pour Over: BrewMark starting point",
  "method": "pour_over",
  "grind": { "bgi": 38, "label": "Medium-fine" },
  "ratio": 16.7,
  "temperatureC": 96,
  "timeSeconds": 180,
  "author": { "type": "brewmark", "name": "BrewMark" },
  "source": "https://brewmark.io/methods/pour-over"
}
```

## Fields

Required fields are marked. Everything else is optional. Unknown fields are an
error; vendor data goes under `extensions`.

| Field | Type | Meaning |
| --- | --- | --- |
| `spec` (required) | `"brewmark.obp/0.1"` | The version the profile was written against |
| `method` (required) | string | `pour_over`, `drip`, `batch_brew`, `french_press`, `immersion`, `aeropress`, `espresso`, `moka` or `cold_brew` |
| `grind` (required) | object | The grind target, below |
| `ratio` (required) | number | Grams of water per gram of coffee. For espresso, grams of drink out per gram of coffee |
| `id` | string, ≤ 64 | The author's identifier for the profile |
| `name` | string, ≤ 120 | |
| `coffee` | object | `roaster`, `name`, `origin`, `process`, `roast` (`light`, `medium-light`, `medium`, `medium-dark`, `dark`), `roastDate` (YYYY-MM-DD) |
| `brewer` | object | `family` (e.g. `cone`, `flat-bottom`, `immersion`, `espresso-machine`), `model` |
| `doseGrams` | number | Coffee in |
| `waterGrams` | number | Water in |
| `temperatureC` | number, 0–100 | Water temperature |
| `timeSeconds` | number | Total brew time |
| `steps` | array, ≤ 40 | Each: `atSeconds`, `action` (`bloom`, `pour`, `stir`, `swirl`, `steep`, `press`, `drawdown`, `serve`), optional `waterGrams` (total in the brewer by the end of the step), optional `note` |
| `author` | object | `type` (`roaster`, `brewmark`, `person`, `machine`), `name` |
| `source` | URL | Where the recipe is published |
| `water` | object | The water the recipe was dialed in with, below |
| `extensions` | object | Vendor fields, keys starting `x-` (e.g. `"x-aiden": { "pulses": 3 }`). Readers ignore keys they don't know |

### `grind`

| Field | Type | Meaning |
| --- | --- | --- |
| `bgi` (required) | number, 0–100 | Target on the BrewMark Grind Index |
| `label` | string, ≤ 40 | How the author describes the grind, e.g. "Medium-fine" |
| `d50Microns` | number | Target median particle size, when the author has measured it |

### `water`

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | string, ≤ 80 | A named water recipe or product, e.g. "Third Wave Water Classic" |
| `tdsMgL` | number, mg/L | Total dissolved solids |
| `hardnessMgL` | number, mg/L as CaCO₃ | General hardness (calcium and magnesium) |
| `alkalinityMgL` | number, mg/L as CaCO₃ | Alkalinity, which buffers acidity |

Water is optional and describes the author's water; translate doesn't adjust the grind for it yet. Two cups at the same grind taste different on very hard and very soft water, so a reader whose water differs a lot should expect to adjust.

A profile never carries a grinder setting. That is the point of the format: the
setting depends on the reader's grinder and is produced by translate.

## Units and names

Field names are camelCase with the unit in the name (`doseGrams`,
`temperatureC`), matching BrewMark's API. Weights are grams, temperatures
Celsius, times seconds.

## Validating

Validate against the JSON Schema with any draft 2020-12 validator, or post the
profile to `POST /api/v1/translate`, which returns the problems as a list of
`issues` with a path and message each.
