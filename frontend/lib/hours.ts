/**
 * The contract's opening_hours reader (contracts/hours_fix.py: parse_hours / hours_text), ported line for line so the
 * app can show how HoursFix reads a value before anything is sent.
 */

export const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
type Week = [number, number][][];

const DAY_RE = "(?:Mo|Tu|We|Th|Fr|Sa|Su)";
const DAYSEL_RE = new RegExp(`^${DAY_RE}(?:-${DAY_RE})?(?:,${DAY_RE}(?:-${DAY_RE})?)*$`);
const TIME_RE = /^([01]\d|2[0-4]):([0-5]\d)-([01]\d|2[0-4]):([0-5]\d)$/;

function daysOf(sel: string): number[] {
  const out: number[] = [];
  for (const part of sel.split(",")) {
    if (part.includes("-")) {
      const a = DAYS.indexOf(part.slice(0, 2) as (typeof DAYS)[number]);
      const b = DAYS.indexOf(part.slice(3, 5) as (typeof DAYS)[number]);
      let i = a;
      for (;;) {
        out.push(i);
        if (i === b) break;
        i = (i + 1) % 7;
      }
    } else out.push(DAYS.indexOf(part as (typeof DAYS)[number]));
  }
  return out;
}

function merge(spans: [number, number][]): [number, number][] {
  const sorted = spans.filter((s) => s[1] > s[0]).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const merged: [number, number][] = [];
  for (const [a, b] of sorted) {
    if (merged.length && a <= merged[merged.length - 1][1]) merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], b);
    else merged.push([a, b]);
  }
  return merged;
}

export function parseHours(input: string | undefined | null): Week | null {
  const text = String(input ?? "").replace(/\s+/g, " ").trim().replace(/;$/, "").trim();
  if (!text || text.length > 255) return null;
  if (text === "24/7") return Array.from({ length: 7 }, () => [[0, 1440]] as [number, number][]);
  const week: [number, number][][] = Array.from({ length: 7 }, () => []);
  const rules: [string, boolean][] = [];
  for (const rule of text.replace(/\|\|/g, ";").split(";").map((r) => r.trim()).filter(Boolean)) {
    const parts = rule.split(new RegExp(`,\\s+(?=${DAY_RE}|PH|SH)`));
    rules.push([parts[0], false]);
    for (const p of parts.slice(1)) rules.push([p, true]);
  }
  for (const [rule, additional] of rules) {
    const sp = rule.indexOf(" ");
    const tokens = sp < 0 ? [rule] : [rule.slice(0, sp), rule.slice(sp + 1)];
    if (tokens[0] === "PH" || tokens[0] === "SH" || /^(PH|SH)(,|\s|$)/.test(rule)) continue;
    let days: number[];
    let rest: string;
    if (DAYSEL_RE.test(tokens[0])) {
      days = daysOf(tokens[0]);
      rest = tokens.length > 1 ? tokens[1].trim() : "";
    } else {
      days = [0, 1, 2, 3, 4, 5, 6];
      rest = rule.trim();
    }
    let spans: [number, number][];
    if (rest === "off" || rest === "closed") spans = [];
    else if (rest === "24/7" || rest === "00:00-24:00") spans = [[0, 1440]];
    else {
      spans = [];
      for (const t of rest.split(",").map((x) => x.trim())) {
        const m = TIME_RE.exec(t);
        if (!m) return null;
        const a = Number(m[1]) * 60 + Number(m[2]);
        const b = Number(m[3]) * 60 + Number(m[4]);
        if (a > 1440 || b > 1440) return null;
        spans.push(b > a ? [a, b] : [a, b + 1440]);
      }
    }
    if (!additional) for (const d of days) week[d] = [];
    for (const d of days)
      for (const [a, b] of spans) {
        if (b <= 1440) week[d].push([a, b]);
        else {
          week[d].push([a, 1440]);
          week[(d + 1) % 7].push([0, b - 1440]);
        }
      }
  }
  return week.map(merge);
}

export function hoursText(week: Week | null): string {
  if (!week) return "";
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const groups: [number, number, string][] = [];
  for (let d = 0; d < 7; d++) {
    const key = week[d].map(([a, b]) => `${fmt(a)}-${fmt(b)}`).join(",") || "off";
    const last = groups[groups.length - 1];
    if (last && last[2] === key && last[1] === d - 1) last[1] = d;
    else groups.push([d, d, key]);
  }
  return groups.map(([a, b, key]) => `${a === b ? DAYS[a] : `${DAYS[a]}-${DAYS[b]}`} ${key}`).join("; ");
}

/** One row per day for display: "07:30–20:00", "closed". */
export function weekRows(week: Week | null): { day: string; text: string }[] {
  if (!week) return [];
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  return DAYS.map((day, i) => ({ day, text: week[i].length ? week[i].map(([a, b]) => `${fmt(a)}–${fmt(b)}`).join(", ") : "closed" }));
}
