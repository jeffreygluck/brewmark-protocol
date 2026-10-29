/**
 * @brewmark/protocol: a typed client for the BrewMark API (https://brewmark.io/api/v1).
 *
 * Zero dependencies. Uses the global fetch, so it runs in Node 18+, Deno, Bun,
 * browsers and edge runtimes. The full contract is the OpenAPI document at
 * https://brewmark.io/api/v1/openapi.json; the types here mirror it.
 *
 *   const bm = new BrewMark();
 *   const t = await bm.translate({ bgi: 38, grinder: 'fellow-ode-gen-2' });
 *   t.settingLabel; // "6.2"
 *
 * MIT-licensed, like the rest of the protocol.
 */

// ------------------------------------------------------------ Open Brew Profile

/** Where a curve or a number came from, strongest claim first. */
export type Provenance = 'measured' | 'maker' | 'community' | 'estimated';

export type BrewMethod =
  | 'pour_over'
  | 'drip'
  | 'batch_brew'
  | 'french_press'
  | 'immersion'
  | 'aeropress'
  | 'espresso'
  | 'moka'
  | 'cold_brew';

export type RoastLevel = 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark';

export type BrewStep = {
  /** When the step starts, from the first water. */
  atSeconds: number;
  action: 'bloom' | 'pour' | 'stir' | 'swirl' | 'steep' | 'press' | 'drawdown' | 'serve';
  /** Total water in the brewer by the end of this step. */
  waterGrams?: number;
  note?: string;
};

/**
 * An Open Brew Profile 0.1: a recipe that names a grind target on the BrewMark
 * Grind Index instead of a grinder setting. The JSON Schema is
 * https://brewmark.io/protocol/schema/open-brew-profile-0.1.json.
 */
export type OpenBrewProfile = {
  spec: 'brewmark.obp/0.1';
  id?: string;
  name?: string;
  method: BrewMethod;
  coffee?: {
    roaster?: string;
    name?: string;
    origin?: string;
    process?: string;
    roast?: RoastLevel;
    /** YYYY-MM-DD. */
    roastDate?: string;
  };
  brewer?: {
    /** e.g. "cone", "flat-bottom", "immersion", "espresso-machine". */
    family?: string;
    model?: string;
  };
  grind: {
    /** 0 espresso fine, 40 filter medium, 100 very coarse. */
    bgi: number;
    label?: string;
    d50Microns?: number;
  };
  /** The water the recipe was dialed in with. Hardness and alkalinity in mg/L as CaCO3. */
  water?: { name?: string; tdsMgL?: number; hardnessMgL?: number; alkalinityMgL?: number };
  /** Grams of water per gram of coffee; for espresso, drink out per gram in. */
  ratio: number;
  doseGrams?: number;
  waterGrams?: number;
  temperatureC?: number;
  /** Total brew time. */
  timeSeconds?: number;
  steps?: BrewStep[];
  author?: { type: 'roaster' | 'brewmark' | 'person' | 'machine'; name?: string };
  source?: string;
  /** Vendor fields. Keys start with "x-"; readers ignore keys they do not know. */
  extensions?: Record<string, unknown>;
};

// ------------------------------------------------------------ responses

export type SettingUnit = 'NUMBER' | 'CLICKS' | 'ROTATIONS';

export type TranslatedGrinder = {
  slug: string;
  brand: string;
  name: string;
  /** "Numbered dial", "Clicks" or "Rotations". */
  scale: string;
  unit: SettingUnit;
  dial: { min: number; max: number };
};

export type Translation = {
  spec: 'brewmark.obp/0.1';
  grinder: TranslatedGrinder;
  bgi: number;
  grindIndex: number;
  /** Position on the dial curve, before snapping to the dial's marks. */
  setting: number;
  /** The setting as the dial prints it. */
  settingLabel: string;
  /** On a stepped dial whose curve falls between two marks: those marks, finer first. */
  between?: [string, string];
  provenance: Provenance;
  warning?: string;
};

export type TranslatedProfile = { profile: OpenBrewProfile; grind: Translation };

export type ConvertSide = TranslatedGrinder & { setting: number; settingLabel: string };

export type Conversion = {
  from: ConvertSide;
  to: ConvertSide;
  grindIndex: number;
  warning?: string;
};

export type GrinderDial = {
  min: number;
  max: number;
  unit: SettingUnit;
  scale: string;
  /** null when unknown, which is not the same as stepless. */
  adjustment: 'stepped' | 'stepless' | null;
  step: number | null;
  /** plain "18"; marks "4.2" (second mark after 4); macro-micro "5M"; rotation-position "2+3". */
  notation: 'plain' | 'marks' | 'macro-micro' | 'rotation-position';
};

export type GrinderMethodSetting = {
  key: string;
  label: string;
  bgi: number;
  bgiRange: [number, number];
  setting: string;
  range: string | null;
  basis: 'maker' | 'estimated';
};

type GrinderBase = {
  slug: string;
  brand: string;
  name: string;
  burrType: 'FLAT' | 'CONICAL' | 'HYBRID' | null;
  power: 'hand' | 'electric' | null;
  page: string;
  buyingGuide: string | null;
};

export type Grinder = GrinderBase & {
  settingsWithheld: false;
  provenance: Provenance;
  dial: GrinderDial;
  anchors: { bgi: number; setting: number; settingLabel: string }[];
  settings: GrinderMethodSetting[];
};

/** A grinder BrewMark lists but publishes no settings for. */
export type WithheldGrinder = GrinderBase & { settingsWithheld: true; reason: string };

export type GrinderEntry = Grinder | WithheldGrinder;

export type KeyKind = 'developer' | 'roaster' | 'brewer' | 'agent';

export type KeyUsage = {
  key: {
    prefix: string;
    kind: KeyKind;
    plan: string;
    /** What the key may do: "read", and "publish" for bag codes and insights. */
    scopes: ('read' | 'publish')[];
    /** Calls allowed per UTC day, all routes. */
    dailyQuota: number;
    usedToday: number;
    createdAt: string;
    lastUsedAt: string | null;
  };
  /** Calls per UTC day and route, for the last 30 days. */
  days: { day: string; route: string; count: number }[];
  total: number;
};

/** A published profile's links. `url` is the short link to print on a bag. */
export type ProfileLinks = { code: string; url: string; json: string; qr: string };

export type PublishedProfile = ProfileLinks & { profile: OpenBrewProfile; updatedAt: string };

export type PublishedProfileSummary = ProfileLinks & {
  name: string | null;
  method: string;
  bgi: number;
  /** "active", or "withdrawn". */
  status: string;
  createdAt: string;
};

export type RatingResult = 'sour' | 'good' | 'bitter';

/** One anonymous first-cup rating: a profile `code`, or `method` and `bgi`. */
export type Rating = {
  grinder: string;
  result: RatingResult;
  code?: string;
  method?: BrewMethod;
  bgi?: number;
  /** The setting brewed at, in the grinder's own units. */
  setting?: number;
  source?: 'web' | 'machine';
};

/**
 * An owner's particle-size reading for one grinder at one setting, in µm,
 * volume-weighted (protocol/measurement.md). Numbers only: no photo.
 */
export type Measurement = {
  grinder: string;
  /** In the grinder's catalogue units; must be on its dial. */
  setting: number;
  d50Microns: number;
  d10Microns?: number;
  d90Microns?: number;
  method: 'image' | 'sieve' | 'laser';
  /** Particles counted; at least 200 for "image". */
  particles?: number;
  note?: string;
  /** The device that read the sizes, e.g. "difluid-omni". */
  instrument?: string;
};

/** Every reading is held as pending until reviewed. */
export type MeasurementRecorded = { id: number; status: 'pending' };

export type ProfileInsights = {
  code: string;
  minRatingsForSuggestion: number;
  total: number;
  grinders: { grinderSlug: string; total: number; sour: number; good: number; bitter: number; suggestion: string | null }[];
};

/** The body the API sends with an error status. */
export type BrewMarkErrorBody = {
  error: string;
  parameter?: string;
  example?: string;
  issues?: { path: string; message: string }[];
  /** Set on 422: BrewMark knows the grinder but publishes no settings for it. */
  settingsWithheld?: true;
  reason?: string;
  explanation?: string[];
  dialIn?: string[];
  page?: string;
  [key: string]: unknown;
};

// ------------------------------------------------------------ client

/** A non-2xx answer from the API, with its status and body. */
export class BrewMarkError extends Error {
  readonly status: number;
  readonly body: BrewMarkErrorBody;

  constructor(status: number, body: BrewMarkErrorBody) {
    super(body.error || `BrewMark API error ${status}`);
    this.name = 'BrewMarkError';
    this.status = status;
    this.body = body;
  }

  /** True when the grinder exists but BrewMark publishes no settings for it (422). */
  get settingsWithheld(): boolean {
    return this.body.settingsWithheld === true;
  }
}

export type BrewMarkOptions = {
  /** Optional. Sent as "Authorization: Bearer <key>". */
  apiKey?: string;
  /** Defaults to https://brewmark.io. */
  baseUrl?: string;
  /** Defaults to the global fetch. */
  fetch?: typeof fetch;
};

export class BrewMark {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: BrewMarkOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? 'https://brewmark.io').replace(/\/+$/, '');
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
  }

  /** A BGI target to a setting on one grinder. */
  translate(args: { bgi: number; grinder: string }): Promise<Translation> {
    return this.request('GET', '/translate', { bgi: String(args.bgi), grinder: args.grinder });
  }

  /** An Open Brew Profile's grind, translated to one grinder. */
  translateProfile(profile: OpenBrewProfile, grinder: string): Promise<TranslatedProfile> {
    return this.request('POST', '/translate', undefined, { grinder, profile });
  }

  /** A setting on one grinder to the same grind on another. `setting` as the source dial prints it. */
  convert(args: { from: string; setting: number | string; to: string }): Promise<Conversion> {
    return this.request('GET', '/convert', { from: args.from, setting: String(args.setting), to: args.to });
  }

  /** Every published grinder, optionally filtered on brand, name or slug. */
  async grinders(q?: string): Promise<GrinderEntry[]> {
    const body = await this.request<{ grinders: GrinderEntry[] }>('GET', '/grinders', q ? { q } : undefined);
    return body.grinders;
  }

  /** One grinder. Throws BrewMarkError 404 for an unknown slug, 422 for a withheld grinder. */
  async grinder(slug: string): Promise<Grinder> {
    const body = await this.request<{ grinder: Grinder }>('GET', `/grinders/${encodeURIComponent(slug)}`);
    return body.grinder;
  }

  /** Request an API key. It is emailed to `email`, never returned. */
  /** Request API access. A person reviews it; the key is emailed if approved, never returned here. */
  requestKey(args: {
    email: string;
    org: string;
    site: string;
    kind: KeyKind;
    useCase: string;
    volume: 'low' | 'medium' | 'high';
  }): Promise<{ ok: true; status: 'pending'; sentTo: string }> {
    return this.request('POST', '/keys', undefined, args);
  }

  /** Calls made with this client's key, per day and route, for 30 days. Needs `apiKey`. */
  usage(): Promise<KeyUsage> {
    return this.request('GET', '/keys/usage');
  }

  /** Publish a profile under a new short code, for a bag. Needs `apiKey`. */
  publishProfile(profile: OpenBrewProfile): Promise<ProfileLinks> {
    return this.request('POST', '/profiles', undefined, { profile });
  }

  /** The profiles this client's key published, newest first. Needs `apiKey`. */
  async listProfiles(): Promise<PublishedProfileSummary[]> {
    const body = await this.request<{ profiles: PublishedProfileSummary[] }>('GET', '/profiles');
    return body.profiles;
  }

  /** A published profile by code (any case). Public. */
  getProfile(code: string): Promise<PublishedProfile> {
    return this.request('GET', `/profiles/${encodeURIComponent(code)}`);
  }

  /** Replace a profile this key published. The printed code keeps working. Needs `apiKey`. */
  updateProfile(code: string, profile: OpenBrewProfile): Promise<ProfileLinks> {
    return this.request('PUT', `/profiles/${encodeURIComponent(code)}`, undefined, { profile });
  }

  /** Withdraw a profile this key published; its code then answers 404. Needs `apiKey`. */
  async withdrawProfile(code: string): Promise<void> {
    await this.request<undefined>('DELETE', `/profiles/${encodeURIComponent(code)}`);
  }

  /** The URL of a profile's QR code (SVG, for print). Makes no request. */
  qrUrl(code: string): string {
    return `${this.baseUrl}/api/v1/profiles/${encodeURIComponent(code)}/qr.svg`;
  }

  /** Record how a first cup tasted. Anonymous; a key is optional. */
  async rate(rating: Rating): Promise<void> {
    await this.request('POST', '/ratings', undefined, rating);
  }

  /** Submit a particle-size reading. Stored as pending for review; a key is optional. */
  submitMeasurement(measurement: Measurement): Promise<MeasurementRecorded> {
    return this.request('POST', '/measurements', undefined, measurement);
  }

  /** How a profile's first cups rated, per grinder. Needs the `apiKey` that published it. */
  insights(code: string): Promise<ProfileInsights> {
    return this.request('GET', `/profiles/${encodeURIComponent(code)}/insights`);
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    query?: Record<string, string>,
    body?: unknown
  ): Promise<T> {
    const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    const res = await this.fetchImpl(`${this.baseUrl}/api/v1${path}${qs}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = undefined;
    }
    if (!res.ok) {
      const errBody =
        parsed && typeof parsed === 'object' && typeof (parsed as { error?: unknown }).error === 'string'
          ? (parsed as BrewMarkErrorBody)
          : { error: text || `BrewMark API error ${res.status}` };
      throw new BrewMarkError(res.status, errBody);
    }
    if (res.status === 204) return undefined as T;
    if (parsed === undefined) throw new BrewMarkError(res.status, { error: 'Response was not JSON' });
    return parsed as T;
  }
}

export default BrewMark;
