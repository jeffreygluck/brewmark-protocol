# The BrewMark Protocol

Version 0.1 (draft for comment), October 2026.

A recipe that says "18 clicks on a Comandante" is useless to someone holding a
Baratza Encore. Every grinder has its own private number scale, so every app,
roaster and AI assistant that wants to give grind advice has to keep its own
table, and most get it wrong.

The protocol fixes that with three parts:

| Part | What it is | Where |
| --- | --- | --- |
| One scale | The **BrewMark Grind Index (BGI)**, 0 to 100, that every grinder's dial is mapped onto | [bgi.md](bgi.md) |
| One file | The **Open Brew Profile**, a recipe that names a grind *target* on the BGI instead of a grinder setting | [open-brew-profile.md](open-brew-profile.md), [schema](schema/open-brew-profile-0.1.json), [examples](examples/) |
| One lookup | **translate**: a BGI target to a setting on a named grinder | `GET /api/v1/translate` below |

## Try it

```
GET https://brewmark.io/api/v1/translate?bgi=38&grinder=fellow-ode-gen-2
```

```json
{
  "spec": "brewmark.obp/0.1",
  "grinder": { "slug": "fellow-ode-gen-2", "brand": "Fellow", "name": "Ode Gen 2", "scale": "Numbered dial", "unit": "NUMBER", "dial": { "min": 1, "max": 11 } },
  "bgi": 38,
  "grindIndex": 38,
  "setting": 6.6,
  "settingLabel": "6.2",
  "between": ["6.1", "6.2"],
  "provenance": "maker",
  "method": "https://brewmark.io/developers/api-docs"
}
```

`settingLabel` is written the way the dial prints it: on the Ode, "6.2" is the
second mark after 6. Post a whole profile to get its grind translated:

```
POST https://brewmark.io/api/v1/translate
Content-Type: application/json

{ "grinder": "baratza-encore", "profile": { …an Open Brew Profile… } }
```

The response is `{ "profile": …, "grind": …the translation above… }`. Errors:
400 for a missing or invalid parameter or profile (with a list of `issues`),
404 for an unknown grinder, 422 for a grinder whose settings BrewMark withholds
(the response says why).

Grinder slugs are the last part of a grinder page's URL on brewmark.io
(`/grinders/fellow-ode-gen-2`).

## Provenance

Every translation says how the grinder's curve is known. One vocabulary is used
everywhere in the protocol, strongest claim first:

| Value | Meaning | Produced today by |
| --- | --- | --- |
| `measured` | Read off ground coffee with a stated method (laser diffraction, sieves, image analysis) | Nothing yet. Reserved. |
| `maker` | The grinder's maker publishes a brew-method chart for it, and the curve is fitted to that chart | Grinders with a maker chart on BrewMark |
| `community` | Owners' readings | Nothing yet. Reserved. |
| `estimated` | Placed by comparison with grinders whose makers publish a chart | Every other grinder, including those whose only published source is a third-party table |

`provenance` describes the curve from BGI to setting. It says nothing about how
a dial's steps were established; BrewMark records those separately, each with a
source.

## Licence

This repository is MIT-licensed (see [LICENSE](LICENSE)). Anyone may read,
write, validate and build on Open Brew Profiles without asking. The grinder
data behind translate is BrewMark's.

## Changing the spec

0.1 is a draft. Comments, corrections and implementations are welcome as
issues on this repository, or at hello@brewmark.io. Version 1.0 will fix the field names; after that, changes
are additive within a major version, and a profile states the version it was
written against in `spec`.

## Files here

- `bgi.md`, `open-brew-profile.md`: the specifications.
- `schema/open-brew-profile-0.1.json`: JSON Schema (draft 2020-12), also served at
  https://brewmark.io/protocol/schema/open-brew-profile-0.1.json.
- `examples/*.json`: BrewMark's starting point for each brew method, as profiles.

The schema and examples are generated from BrewMark's code and copied here, so
a fix to them lands in the next release rather than by editing the files
directly. Open an issue describing the change.
