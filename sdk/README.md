# @brewmark/protocol

A typed client for the BrewMark API: grind settings across coffee grinders, on
one shared scale (the [BrewMark Grind Index](../bgi.md)).

No dependencies. Uses the global `fetch`, so it runs in Node 18+, Deno, Bun,
browsers and edge runtimes. Not yet published to npm; copy `src/index.ts` or
build this folder (`npm run build`).

## Usage

```ts
import { BrewMark, BrewMarkError } from '@brewmark/protocol';

const bm = new BrewMark(); // or new BrewMark({ apiKey: 'bm_live_…' })

// A grind target to a setting on one grinder
const t = await bm.translate({ bgi: 38, grinder: 'fellow-ode-gen-2' });
t.settingLabel; // "6.2", written the way the dial prints it
t.provenance;   // "maker" or "estimated"

// A whole Open Brew Profile
const { grind } = await bm.translateProfile(profile, 'baratza-encore');

// A setting on one grinder to the same grind on another
const c = await bm.convert({ from: 'comandante-c40-mk4', setting: 18, to: 'baratza-encore' });
c.to.settingLabel;

// The grinder catalogue: dial, anchors and per-method settings
const fellows = await bm.grinders('fellow');
const ode = await bm.grinder('fellow-ode-gen-2');
ode.settings.find((s) => s.key === 'v60')?.setting;

// Keys: emailed, never returned. Optional for everything above.
await bm.requestKey({ email: 'you@example.com', kind: 'developer' });
const { total, days } = await bm.usage(); // needs apiKey
```

### The code on the bag (needs `apiKey`)

```ts
const roaster = new BrewMark({ apiKey: 'bm_live_…' });

const { code, url } = await roaster.publishProfile(profile); // url: https://brewmark.io/p/<code>
roaster.qrUrl(code);                     // SVG to print; no request
await roaster.listProfiles();
await roaster.updateProfile(code, { ...profile, grind: { bgi: 36 } }); // the printed code keeps working
await roaster.insights(code);            // first-cup ratings per grinder, aggregated
await roaster.withdrawProfile(code);     // the code then 404s

// Anyone, no key:
const { profile: p } = await bm.getProfile(code);
await bm.rate({ code, grinder: 'fellow-ode-gen-2', result: 'sour' });

// An owner's particle-size reading (protocol/measurement.md), held for review:
await bm.submitMeasurement({
  grinder: 'baratza-encore', setting: 14, method: 'image', particles: 640,
  d10Microns: 380, d50Microns: 720, d90Microns: 1050,
}); // { id, status: 'pending' }
```

The short link `https://brewmark.io/p/<code>` also answers with the profile
JSON when requested with `Accept: application/json`.

Grinders whose settings BrewMark withholds appear in `grinders()` with
`settingsWithheld: true` and a `reason`, and no numbers. Asking for one by slug
throws:

```ts
try {
  await bm.translate({ bgi: 40, grinder: 'kafatek-monolith-flat-max' });
} catch (e) {
  if (e instanceof BrewMarkError) {
    e.status;            // 400, 404, 422, 503
    e.body.error;        // what went wrong
    e.settingsWithheld;  // true on 422: the grinder exists, its settings are not published
    e.body.dialIn;       // on 422: how to find a starting point on your own unit
  }
}
```

## Options

| Option | Default | |
| --- | --- | --- |
| `apiKey` | none | Optional. Sent as `Authorization: Bearer <key>`. |
| `baseUrl` | `https://brewmark.io` | |
| `fetch` | global `fetch` | For tests or runtimes without one. |

## Reference

The full contract is the OpenAPI document at
https://brewmark.io/api/v1/openapi.json ([copy](../openapi.json)). The types in
`src/index.ts` mirror it, and `OpenBrewProfile` mirrors the
[Open Brew Profile schema](../schema/open-brew-profile-0.1.json).

MIT-licensed, like the rest of the protocol.
