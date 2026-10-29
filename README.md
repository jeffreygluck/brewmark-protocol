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

## The grinder feed, the OpenAPI document and the SDK

`GET https://brewmark.io/api/v1/grinders` lists every grinder BrewMark
publishes: its dial (range, step, how settings are written), the five anchor
points of its curve, its setting for each brew method (the same numbers as its
page on brewmark.io), its provenance, and links to its page and buying guide.
`?q=fellow` filters; `/api/v1/grinders/<slug>` gives one. Grinders whose
settings BrewMark withholds are listed with `settingsWithheld: true` and no
numbers. The feed carries no prices and no retailer or affiliate links.

## The code on the bag

A roaster publishes a profile with `POST /api/v1/profiles` (key required) and
gets a six-character code back, with a short link (`https://brewmark.io/p/<code>`)
and a QR code of it (`/api/v1/profiles/<code>/qr.svg`) to print. Anyone can
read it at `/api/v1/profiles/<code>`. The short link itself answers with the
profile JSON when asked with `Accept: application/json`, and with a page for
people otherwise, so one printed link serves a brewer's app and a phone camera.
Only the publishing key can change (`PUT`) or withdraw (`DELETE`) a profile.

`POST /api/v1/ratings` records how a first cup tasted (`sour`, `good` or
`bitter`) on a grinder, against a profile code or a method and BGI. Ratings
are anonymous. The publisher sees them per grinder, in aggregate only, at
`/api/v1/profiles/<code>/insights`.

## Keys, the OpenAPI document and the SDK

Keys are optional for every lookup. Request one with `POST /api/v1/keys` (it is
emailed, never returned) and send it as `Authorization: Bearer bm_live_…`: it
raises the rate limit and counts your calls (`GET /api/v1/keys/usage`). A key
that is sent but not recognised is refused with 401 rather than ignored.

The whole API is described in OpenAPI 3.1 at
https://brewmark.io/api/v1/openapi.json ([copy](openapi.json)).

[`sdk/`](sdk/) is a typed TypeScript client with no dependencies
(`@brewmark/protocol`, not yet on npm).

## Values and fingerprints

`settingLabel` is what to show. The unrounded `setting` in a response made
with an API key carries a variation of a few millionths that identifies the
key, so data copied from the API can be traced. It never changes a label or
any value at the precision of a dial. Responses without a key carry none.

## Provenance

Every translation says how the grinder's curve is known. One vocabulary is used
everywhere in the protocol, strongest claim first:

| Value | Meaning | Produced today by |
| --- | --- | --- |
| `measured` | Read off ground coffee with a stated method (laser diffraction, sieves, image analysis) | Nothing yet. Reserved. |
| `maker` | The grinder's maker publishes a brew-method chart for it, and the curve is fitted to that chart | Grinders with a maker chart on BrewMark |
| `community` | Owners' readings | Not in any curve yet. Owners can submit particle-size readings with the image method (`measurement.md`); they are held as pending until reviewed. |
| `estimated` | Placed by comparison with grinders whose makers publish a chart | Every other grinder, including those whose only published source is a third-party table |

`provenance` describes the curve from BGI to setting. It says nothing about how
a dial's steps were established; BrewMark records those separately, each with a
source.

## Licence

This repository is MIT-licensed (see [LICENSE](LICENSE)). Anyone may read, write, validate and build on Open Brew
Profiles without asking. The grinder data behind translate is BrewMark's.

## Changing the spec

0.1 is a draft. Comments, corrections and implementations are welcome as
issues on this repository, or at hello@brewmark.io. Version 1.0 will fix the field names; after that, changes
are additive within a major version, and a profile states the version it was
written against in `spec`.


## Files here

- `bgi.md`, `open-brew-profile.md`: the specifications.
- `measurement.md`: the image method for measuring a grinder's particle size from a photo, and the
  reading it produces (`POST /api/v1/measurements`).
- `schema/open-brew-profile-0.1.json`: JSON Schema (draft 2020-12), also served at
  https://brewmark.io/protocol/schema/open-brew-profile-0.1.json.
- `examples/*.json`: BrewMark's starting point for each brew method, as profiles.
- `openapi.json`: the OpenAPI 3.1 document for https://brewmark.io/api/v1.
- `sdk/`: the TypeScript client.

The schema, examples and OpenAPI document are generated from BrewMark's code and
copied here on each release, so propose changes as issues rather than edits to
the generated files.
