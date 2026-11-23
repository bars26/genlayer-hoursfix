/** Types and display helpers for the HoursFix contract. */

type Num = string | number | bigint;

export type FixState = "held" | "paid" | "awaiting_wallet" | "reverted" | "disputed" | "returned" | "refused";
export type Verdict = "ELIGIBLE" | "INELIGIBLE" | "UNCLEAR";

export interface Call {
  id: string;
  sponsor: string;
  title: string;
  box_json: string;
  keys_json: string;
  since: string;
  ends: string;
  reward: Num;
  per_mapper: Num;
  survival_days: Num;
  pot: Num;
  reserved: Num;
  paid_total: Num;
  returned_total: Num;
  n_submitted: Num;
  n_eligible: Num;
  state: "open" | "closed";
  history_json: string;
}

export interface Fix {
  id: string;
  call_id: string;
  element: string;
  version: Num;
  scout: string;
  mapper_uid: string;
  mapper: string;
  mapper_wallet: string;
  edited_at: string;
  verdict: Verdict;
  code: string;
  why: string;
  state: FixState;
  held_until: string;
  reward: Num;
  mapper_share: Num;
  scout_share: Num;
  reading_json: string;
  confirm_json: string;
  submitted_at: string;
  /** v2: who disputed the fix (once per fix), the re-reading, and a dismissed dispute's stake added to the reward. */
  disputed_by?: string;
  dispute_json?: string;
  bonus?: Num;
}

export interface Reading {
  facts?: {
    element: string;
    version: number;
    edited_at: string;
    mapper: string;
    mapper_uid: string;
    changeset: string;
    name: string;
    new: string;
    old: string;
    old_at: string;
    previous: string;
    website: string;
    edit_website?: string;
    address?: string;
    lat?: number;
    lon?: number;
  };
  site?: { found: boolean; opening_hours: string; quote: string; text_sha256: string; chars: number; structured?: string; visible?: string; sources?: string[] };
  /** v2: `visible` is the model's reading of the page text, `structured` the page's schema.org hours parsed in code. */
  weeks?: { new: string; old: string; site: string; visible?: string; structured?: string };
  read_at?: string;
  packet_sha256?: string;
}

/** What the app's checker (no validators, no model) finds for an OSM element. */
export interface ElementPreview {
  element: string;
  name: string;
  website: string;
  latest: number;
  lat: number | null;
  lon: number | null;
  edits: { version: number; at: string; user: string; uid: string; changeset: string; before: string; after: string; siteBefore: string; siteAfter: string }[];
}

export const MIN_REWARD_WEI = 10n ** 16n;
export const SCOUT_PERCENT = 10;
/** A dispute stakes a tenth of the fix's reward from the disputer's credit. */
export const STAKE_DIVISOR = 10n;

export interface DisputeReading {
  same: boolean;
  hours_same: boolean;
  authority_same: boolean;
  current: string;
  authority_now: string;
  site_state: string;
  site_week: string;
  structured?: string;
  read_at?: string;
}

export function wei(v: Num | undefined): bigint {
  try {
    return BigInt(String(v ?? "0").split(".")[0]);
  } catch {
    return 0n;
  }
}

export function formatGen(v: Num | undefined, digits = 2): string {
  const n = Number(wei(v)) / 1e18;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function parseGen(input: string): bigint | null {
  const t = input.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(t)) return null;
  const [whole, frac = ""] = t.split(".");
  return BigInt(whole) * 10n ** 18n + BigInt((frac + "0".repeat(18)).slice(0, 18));
}

export function parseJson<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export const sameAddress = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
export const todayUtc = () => new Date().toISOString().slice(0, 10);
export function addDays(day: string, n: number): string {
  const t = Date.parse(`${day}T00:00:00Z`);
  return Number.isNaN(t) ? "" : new Date(t + n * 86_400_000).toISOString().slice(0, 10);
}
export const nowIso = () => new Date().toISOString().slice(0, 19);
export const boxOf = (c: Call) => parseJson<number[]>(c.box_json, [0, 0, 0, 0]);
export const keysOf = (c: Call) => parseJson<string[]>(c.keys_json, []);
export const readingOf = (f: Fix) => parseJson<Reading>(f.reading_json, {});
export const osmUrl = (element: string) => `https://www.openstreetmap.org/${element}`;
export const osmHistoryUrl = (element: string) => `https://www.openstreetmap.org/${element}/history`;
export const osmUserUrl = (name: string) => `https://www.openstreetmap.org/user/${encodeURIComponent(name)}`;
export const embedUrl = (box: number[]) =>
  `https://www.openstreetmap.org/export/embed.html?bbox=${box[1]},${box[0]},${box[3]},${box[2]}&layer=mapnik`;

export const VERDICT_STYLE: Record<Verdict, { label: string; cls: string }> = {
  ELIGIBLE: { label: "Matches the page", cls: "bg-[#E4F1E8] text-[#2D6B45] border-[#BCDAC6]" },
  INELIGIBLE: { label: "Not a fix", cls: "bg-[#F8E4DE] text-[#9B3B24] border-[#EEC3B6]" },
  UNCLEAR: { label: "Could not check", cls: "bg-[#F1EEE6] text-[#5C5A52] border-[#DDD8CB]" },
};

export const STATE_TEXT: Record<FixState, string> = {
  held: "Reward reserved until the edit has stood its survival period",
  paid: "Paid: 90% to the mapper's wallet, 10% to whoever submitted it",
  awaiting_wallet: "Confirmed: the scout's 10% is paid, the mapper's 90% waits for a GenLayer wallet on their OSM profile",
  reverted: "The hours changed again before confirmation: the reward went back to the call",
  disputed: "Disputed and upheld: the disputer got their stake back plus 10%, the rest went back to the call",
  returned: "Never claimed: the mapper's share went back to the sponsor",
  refused: "Nothing reserved",
};

export const CODE_LABEL: Record<string, string> = {
  matches_site: "new hours match the business's page",
  outside_dates: "edit outside the call's dates",
  no_hours: "version sets no opening_hours",
  no_change: "version did not change the week",
  wrong_kind: "not a kind this call pays for",
  no_location: "no location",
  outside_area: "outside the call's area",
  new_unparsed: "new value outside the compared syntax",
  no_prior_website: "no page named before the call's window (an edit cannot bring its own source)",
  geometry_changed: "way's nodes changed after the edit",
  way_too_large: "way too large to locate",
  site_unreadable: "business page could not be read",
  no_hours_on_site: "page states no weekly hours",
  does_not_match_site: "new hours differ from the page",
  sources_disagree: "the page's visible hours and its schema.org hours differ",
  already_correct: "hours already matched the page before the call",
  mapper_cap: "mapper reached the call's limit",
};
