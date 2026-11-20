"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import {
  CODE_LABEL,
  STATE_TEXT,
  VERDICT_STYLE,
  boxOf,
  embedUrl,
  formatGen,
  keysOf,
  osmHistoryUrl,
  osmUserUrl,
  readingOf,
  todayUtc,
  type Call,
  type Fix,
} from "@/lib/contracts/types";
import { useWallet } from "@/lib/genlayer/wallet";
import { useHoursWrite } from "@/lib/hooks/useHoursFix";
import { useNow } from "@/lib/hooks/useNow";
import { addressUrl, currentNetwork } from "@/lib/network";
import { Button } from "./ui/button";

const short = (a: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

function FixRow({ fix: f }: { fix: Fix }) {
  const now = useNow(30_000);
  const { isConnected } = useWallet();
  const { write, pending } = useHoursWrite();
  const r = readingOf(f);
  const v = VERDICT_STYLE[f.verdict] ?? VERDICT_STYLE.UNCLEAR;
  const ripe = f.state === "held" && new Date(now).toISOString().slice(0, 19) >= f.held_until;
  const busy = (k: string) => pending === `${k}:${f.id}`;
  return (
    <li className="rounded-xl border border-border p-3 space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="mono text-muted-foreground">{f.id}</span>
        <span className={`rounded-full border px-2 py-0.5 font-medium ${v.cls}`}>{v.label}</span>
        <span className="text-muted-foreground">{CODE_LABEL[f.code] ?? f.code}</span>
        <span className="ml-auto font-medium">{f.state.replace("_", " ")}</span>
      </div>
      <p className="font-semibold">
        {r.facts?.name || f.element}{" "}
        <a href={osmHistoryUrl(f.element)} target="_blank" rel="noopener noreferrer" className="text-xs font-normal text-muted-foreground hover:underline">
          {f.element} v{String(f.version)} <ExternalLink className="inline w-3 h-3" />
        </a>
      </p>
      {r.weeks && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg bg-muted/60 p-2">
            <p className="text-muted-foreground">when the call opened</p>
            <p className="mono break-words">{r.weeks.old || "(none)"}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-2">
            <p className="text-muted-foreground">after the edit</p>
            <p className="mono break-words">{r.weeks.new}</p>
          </div>
          <div className="rounded-lg bg-[#FFF6E5] p-2">
            <p className="text-muted-foreground">on the business&apos;s page</p>
            <p className="mono break-words">{r.weeks.site || "—"}</p>
          </div>
        </div>
      )}
      {r.site?.quote && <p className="text-xs text-muted-foreground">Page says: &ldquo;{r.site.quote}&rdquo;</p>}
      {r.facts?.website && (
        <p className="text-xs text-muted-foreground break-all">
          Source (named before the window): {r.facts.website}
          {r.facts.edit_website && r.facts.edit_website !== r.facts.website ? ` · the edit switched it to ${r.facts.edit_website}, which is not used` : ""}
        </p>
      )}
      <p className="text-xs">
        Mapper{" "}
        <a href={osmUserUrl(f.mapper)} target="_blank" rel="noopener noreferrer" className="underline">
          {f.mapper}
        </a>
        {f.mapper_wallet ? ` (wallet ${short(f.mapper_wallet)})` : ""} · edited {f.edited_at.replace("T", " ")} UTC · submitted by{" "}
        <span className="mono">{short(f.scout)}</span>
        {Number(f.reward) > 0 ? ` · reward ${formatGen(f.reward, 3)} GEN` : ""}
      </p>
      <p className="text-xs text-muted-foreground">
        {STATE_TEXT[f.state]}
        {f.state === "held" ? ` (from ${f.held_until.replace("T", " ")} UTC)` : ""}.
      </p>
      {isConnected && (
        <div className="flex flex-wrap gap-2">
          {ripe && (
            <Button size="sm" onClick={() => write({ kind: "confirm", fixId: f.id })} disabled={!!pending}>
              {busy("confirm") && <Loader2 className="w-4 h-4 animate-spin" />} Confirm (validators read it again)
            </Button>
          )}
          {f.state === "awaiting_wallet" && (
            <Button size="sm" variant="outline" onClick={() => write({ kind: "claim", fixId: f.id })} disabled={!!pending}>
              {busy("claim") && <Loader2 className="w-4 h-4 animate-spin" />} Send to the wallet on the mapper&apos;s OSM profile
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export function CallCard({ call: c, fixes }: { call: Call; fixes: Fix[] }) {
  const { isConnected } = useWallet();
  const { write, pending } = useHoursWrite();
  const box = boxOf(c);
  const keys = keysOf(c);
  const net = currentNetwork();
  const ordered = [...fixes].sort((a, b) => Number(b.id.split("_")[1]) - Number(a.id.split("_")[1]));
  return (
    <article className="brand-card overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-5">
        <iframe
          title={`Area of ${c.title}`}
          src={embedUrl(box)}
          className="h-48 w-full md:h-full md:col-span-2 border-0 bg-muted"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="md:col-span-3 p-5 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="mono text-muted-foreground">{c.id}</span>
            <span className={`rounded-full border px-2 py-0.5 font-medium ${c.state === "open" ? "bg-[#E4F1E8] text-[#2D6B45] border-[#BCDAC6]" : "bg-muted text-muted-foreground"}`}>
              {c.state === "open" ? (todayUtc() <= c.ends ? "taking fixes" : "ended") : "closed"}
            </span>
          </div>
          <h3 className="display text-2xl leading-tight">{c.title}</h3>
          <p className="text-sm text-muted-foreground">
            Fixes made since {c.since}, submitted by {c.ends} · {keys.length ? keys.join(", ") : "any kind of place"} · stands{" "}
            {String(c.survival_days)} day{Number(c.survival_days) === 1 ? "" : "s"} · at most {String(c.per_mapper)} per mapper
          </p>
          <dl className="grid grid-cols-3 gap-2 text-xs pt-1">
            <div className="rounded-lg bg-muted/60 p-2">
              <dt className="text-muted-foreground">per fix</dt>
              <dd className="display text-xl">{formatGen(c.reward, 3)} GEN</dd>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <dt className="text-muted-foreground">pot left / reserved</dt>
              <dd className="display text-xl">
                {formatGen(c.pot, 2)} / {formatGen(c.reserved, 2)}
              </dd>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <dt className="text-muted-foreground">eligible / submitted</dt>
              <dd className="display text-xl">
                {String(c.n_eligible)} / {String(c.n_submitted)}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Sponsor{" "}
            <a href={addressUrl(net, c.sponsor)} target="_blank" rel="noopener noreferrer" className="mono hover:underline">
              {short(c.sponsor)}
            </a>{" "}
            · paid {formatGen(c.paid_total, 3)} GEN · box {box.join(", ")}
          </p>
          {isConnected && c.state === "open" && todayUtc() > c.ends && (
            <Button size="sm" variant="outline" onClick={() => write({ kind: "close", callId: c.id })} disabled={!!pending}>
              {pending === `close:${c.id}` && <Loader2 className="w-4 h-4 animate-spin" />} Close and return the unreserved pot
            </Button>
          )}
        </div>
      </div>
      <div className="border-t border-border p-5">
        {ordered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fix submitted yet. Look up a place above and submit its edit.</p>
        ) : (
          <ul className="space-y-3">
            {ordered.map((f) => (
              <FixRow key={f.id} fix={f} />
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}


