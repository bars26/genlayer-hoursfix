"use client";

import { useState } from "react";
import { Clock, ExternalLink, Loader2, Search } from "lucide-react";
import { osmHistoryUrl, osmUrl, todayUtc, type Call, type ElementPreview } from "@/lib/contracts/types";
import { useWallet } from "@/lib/genlayer/wallet";
import { useHoursWrite } from "@/lib/hooks/useHoursFix";
import { hoursText, parseHours, weekRows } from "@/lib/hours";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const EXAMPLES = [
  { q: "node/6381240591", label: "The Signal Box" },
  { q: "way/517030126", label: "Superdrug Cheapside" },
  { q: "node/299523381", label: "PizzaExpress" },
];

/** Look up an OSM element's opening-hours edits and submit one to a call; no wallet needed to look. */
export function EditCheck({ calls }: { calls: Call[] }) {
  const { isConnected } = useWallet();
  const { writeAsync, pending } = useHoursWrite();
  const [q, setQ] = useState(EXAMPLES[0].q);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ElementPreview | null>(null);
  const open = calls.filter((c) => c.state === "open" && todayUtc() <= c.ends);
  const [callId, setCallId] = useState<string>("");
  const chosen = callId || open[open.length - 1]?.id || "";

  const read = async (value = q) => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/element?q=${encodeURIComponent(value)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setData(body as ElementPreview);
    } catch (e: any) {
      setData(null);
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="brand-card p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="display text-2xl flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#C97A12]" /> Look at a place&apos;s hours edits
        </h2>
        <span className="text-xs text-muted-foreground">no wallet needed</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((x) => (
          <button
            key={x.q}
            type="button"
            onClick={() => {
              setQ(x.q);
              read(x.q);
            }}
            className={`rounded-full border px-3 py-1 text-xs ${q === x.q ? "border-[#1D2B3A] bg-[#1D2B3A] text-white" : "border-border bg-white hover:bg-muted"}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="node/6381240591 or an openstreetmap.org link" />
        <Button variant="outline" onClick={() => read()} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Read
        </Button>
      </div>
      {err && <p className="rounded-xl border border-[#EEC3B6] bg-[#FBEFEA] p-3 text-sm">{err}</p>}
      {data && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm">
            <a href={osmUrl(data.element)} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
              {data.name || data.element} <ExternalLink className="inline w-3 h-3" />
            </a>{" "}
            <span className="text-muted-foreground">
              {data.element} · v{data.latest}
              {data.lat != null ? ` · ${data.lat.toFixed(4)}, ${data.lon?.toFixed(4)}` : ""} ·{" "}
              <a href={osmHistoryUrl(data.element)} target="_blank" rel="noopener noreferrer" className="underline">
                history
              </a>
            </span>
          </p>
          <p className="text-sm">
            Business page:{" "}
            {data.website ? (
              <a href={data.website} target="_blank" rel="noopener noreferrer nofollow" className="underline break-all">
                {data.website}
              </a>
            ) : (
              <span className="text-[#9B3B24]">none on OSM (validators would have nothing to check against)</span>
            )}
          </p>
          {data.edits.length === 0 && <p className="text-sm text-muted-foreground">No version of this element set or changed opening_hours.</p>}
          {data.edits.slice(0, 3).map((e) => {
            const after = parseHours(e.after);
            const before = parseHours(e.before);
            const same = !!before && !!after && hoursText(before) === hoursText(after);
            return (
              <div key={e.version} className="rounded-xl border border-border bg-[#FAF9F5] p-3 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="mono font-semibold">v{e.version}</span> by {e.user} on {e.at.replace("T", " ")} UTC
                  </span>
                  {isConnected && open.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select className="field h-8 w-auto text-xs" value={chosen} onChange={(ev) => setCallId(ev.target.value)}>
                        {open.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.id}: {c.title}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        disabled={!!pending || !chosen}
                        onClick={() => {
                          const [type, id] = data.element.split("/");
                          writeAsync({ kind: "submit", callId: chosen, type, id, version: e.version }).catch(() => {});
                        }}
                      >
                        {pending?.startsWith("submit") && <Loader2 className="w-4 h-4 animate-spin" />} Submit v{e.version}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground">before</p>
                    <p className="mono break-words">{e.before || "(none)"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">after</p>
                    <p className="mono break-words">{e.after}</p>
                  </div>
                </div>
                {after ? (
                  <table className="w-full text-[11px]">
                    <tbody>
                      {weekRows(after).map((r) => (
                        <tr key={r.day}>
                          <td className="w-8 font-semibold">{r.day}</td>
                          <td>{r.text}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-[#9B3B24]">HoursFix does not read this value (outside the compared syntax), so it would not be paid.</p>
                )}
                {same && <p className="text-[#9B3B24]">This version describes the same week as the one before it: not a change.</p>}
                {e.siteAfter !== e.siteBefore && (
                  <p className="text-[#9B3B24]">
                    This edit also changed the place&apos;s web page ({e.siteBefore || "none"} → {e.siteAfter || "none"}). Validators read the page the place
                    named before the call&apos;s window opened, never one an edit brings.
                  </p>
                )}
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Validators compare the new week with the page the place named before the call&apos;s window opened, and with the hours as they stood
            then. Once the edit has stood the survival period they read the element and that page again; the mapper earns 90%, whoever submits it 10%.
          </p>
        </div>
      )}
    </div>
  );
}
