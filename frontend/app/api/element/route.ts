import type { ElementPreview } from "@/lib/contracts/types";

/**
 * Every version of an OpenStreetMap element that changed its opening_hours, read from the OSM API's history (no key),
 * so a visitor can pick the version to submit. No validators and no model: the contract makes the real reading.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const OSM = "https://api.openstreetmap.org/api/0.6";
const HEADERS = { accept: "application/json", "user-agent": "HoursFix/1.0 (github.com/bars26/genlayer-hoursfix)" };

/** "node/123", "way 456", or an openstreetmap.org link. */
function parseElement(input: string): { kind: string; id: string } | null {
  const m = input.trim().match(/(node|way)[/\s:#]+(\d{1,12})/i);
  return m ? { kind: m[1].toLowerCase(), id: m[2] } : null;
}

export async function GET(request: Request) {
  const el = parseElement(new URL(request.url).searchParams.get("q") ?? "");
  if (!el) return Response.json({ error: "Paste an OpenStreetMap node or way, like node/6381240591 or its openstreetmap.org link" }, { status: 400 });
  try {
    const res = await fetch(`${OSM}/${el.kind}/${el.id}/history.json`, { headers: HEADERS, cache: "no-store" });
    if (res.status === 404 || res.status === 410) return Response.json({ error: `OpenStreetMap has no ${el.kind}/${el.id}` }, { status: 404 });
    if (!res.ok) throw new Error(`OpenStreetMap answered ${res.status}`);
    const versions: any[] = ((await res.json())?.elements ?? []).sort((a: any, b: any) => a.version - b.version);
    const latest = versions[versions.length - 1] ?? {};
    const tags = latest.tags ?? {};
    let lat: number | null = latest.lat ?? null;
    let lon: number | null = latest.lon ?? null;
    if (el.kind === "way") {
      const full = await fetch(`${OSM}/way/${el.id}/full.json`, { headers: HEADERS, cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
      const nodes = (full?.elements ?? []).filter((e: any) => e.type === "node" && "lat" in e);
      if (nodes.length) {
        lat = nodes.reduce((t: number, n: any) => t + n.lat, 0) / nodes.length;
        lon = nodes.reduce((t: number, n: any) => t + n.lon, 0) / nodes.length;
      }
    }
    const edits: ElementPreview["edits"] = [];
    for (let i = 0; i < versions.length; i++) {
      const before = String(versions[i - 1]?.tags?.opening_hours ?? "");
      const after = String(versions[i]?.tags?.opening_hours ?? "");
      if (after && after !== before)
        edits.push({ version: versions[i].version, at: String(versions[i].timestamp ?? "").slice(0, 19), user: String(versions[i].user ?? ""), uid: String(versions[i].uid ?? ""), changeset: String(versions[i].changeset ?? ""), before, after });
    }
    const preview: ElementPreview = {
      element: `${el.kind}/${el.id}`,
      name: String(tags.name ?? ""),
      website: String(tags["opening_hours:url"] ?? tags.website ?? tags["contact:website"] ?? ""),
      latest: latest.version ?? 0,
      lat,
      lon,
      edits: edits.reverse().slice(0, 12),
    };
    return Response.json(preview, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? String(err) }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
