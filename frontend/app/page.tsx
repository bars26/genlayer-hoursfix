"use client";

import { useState } from "react";
import { CalendarClock, Globe, Loader2, MapPin, RefreshCw, Wallet } from "lucide-react";
import { CallCard } from "@/components/CallCard";
import { EditCheck } from "@/components/EditCheck";
import { Navbar } from "@/components/Navbar";
import { OpenCallModal } from "@/components/OpenCallModal";
import { OwedCard } from "@/components/OwedCard";
import { TransactionPanel } from "@/components/TransactionPanel";
import { Button } from "@/components/ui/button";
import { formatGen, wei } from "@/lib/contracts/types";
import { useRegistry } from "@/lib/hooks/useHoursFix";

const STEPS = [
  { icon: MapPin, title: "Fund an area", body: "A sponsor (a city, a map app, a business association) funds a call: a box on the map, the kinds of places, a reward per fix." },
  { icon: CalendarClock, title: "A mapper fixes hours", body: "Someone corrects a shop's opening_hours on OpenStreetMap. Anyone submits that edit: the element and its version." },
  { icon: Globe, title: "Validators check the source", body: "They read the edit's history and the business's own web page, write the page's hours as a week, and compare the weeks in code." },
  { icon: Wallet, title: "Paid once it stands", body: "After the survival period the edit is read again. Unchanged: 90% to the mapper's wallet on their OSM profile, 10% to whoever submitted it." },
];

export default function HomePage() {
  const { calls, fixes, isLoading, isError, error, isFetching, refetch, fetchedAt } = useRegistry();
  const [modal, setModal] = useState(false);
  const ordered = [...calls].sort((a, b) => Number(b.id.split("_")[1]) - Number(a.id.split("_")[1]));
  const funded = calls.filter((c) => c.state === "open").reduce((t, c) => t + wei(c.pot) + wei(c.reserved), 0n);
  const eligible = fixes.filter((f) => f.verdict === "ELIGIBLE").length;
  const paid = calls.reduce((t, c) => t + wei(c.paid_total), 0n);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpen={() => setModal(true)} />
      <main className="flex-grow pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-10">
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4 lg:pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C97A12]">OpenStreetMap opening hours, paid when right</p>
              <h1 className="display text-5xl md:text-6xl leading-[1.02]">Is it open right now?</h1>
              <p className="text-lg text-muted-foreground">
                Maps tell you a shop is open when it closed an hour ago. The fix is volunteer work nobody pays for and nobody checks. HoursFix pays for it,
                and GenLayer validators check every fix against the business&apos;s own page before a single GEN moves.
              </p>
              <dl className="flex gap-8 pt-1">
                <div>
                  <dt className="text-xs text-muted-foreground">GEN in open calls</dt>
                  <dd className="display text-3xl">{formatGen(funded, 1)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">fixes that match</dt>
                  <dd className="display text-3xl">{eligible}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">GEN paid</dt>
                  <dd className="display text-3xl">{formatGen(paid, 2)}</dd>
                </div>
              </dl>
            </div>
            <div className="lg:col-span-7">
              <EditCheck calls={calls} />
            </div>
          </section>

          <section>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="rounded-2xl border border-border bg-white/60 p-4">
                  <div className="flex items-center gap-2">
                    <span className="display flex h-7 w-7 items-center justify-center rounded-full bg-[#1D2B3A] text-sm text-white">{i + 1}</span>
                    <Icon className="w-4 h-4 text-[#C97A12]" />
                    <span className="font-semibold">{title}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              Looking needs no wallet. To fund a call or submit a fix, connect MetaMask and press Test GEN for free GenLayer Studio tokens. The calls below
              are demo calls funded by test wallets with test GEN; the edits, mappers and business pages they check are real.
            </p>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="display text-3xl">Calls</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {fetchedAt && <span>updated {new Date(fetchedAt).toLocaleTimeString()}</span>}
                  <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh">
                    {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              {isLoading && <p className="text-sm text-muted-foreground">Reading the calls from GenLayer Studio…</p>}
              {isError && <p className="rounded-xl border border-[#EEC3B6] bg-[#FBEFEA] p-3 text-sm">Could not read the calls: {error?.message}. Try Refresh in a minute.</p>}
              {!isLoading && !isError && ordered.length === 0 && <p className="text-sm text-muted-foreground">No call is funded yet. Fund the first one.</p>}
              {ordered.map((c) => (
                <div id={c.id} key={c.id}>
                  <CallCard call={c} fixes={fixes.filter((f) => f.call_id === c.id)} />
                </div>
              ))}
            </div>
            <aside className="lg:col-span-4 space-y-6">
              <div className="brand-card p-5 space-y-3 text-sm">
                <h3 className="display text-xl">How a fix is checked</h3>
                <p>
                  <strong>The edit, from OpenStreetMap.</strong> Validators read the element&apos;s full history: who made the version, when, what
                  opening_hours it set, and what the place had when the call&apos;s window opened. The version must change the week, be made in the
                  window, and lie inside the call&apos;s box.
                </p>
                <p>
                  <strong>The source, from the business.</strong> They fetch the place&apos;s own web page (rendered in a browser if needed) and write
                  its regular weekly hours in opening_hours syntax.
                </p>
                <p>
                  <strong>The comparison, in code.</strong> All three values become a week of time ranges. The new week must equal the page&apos;s,
                  and the week before the call must not. Breaking hours after a call opens and &ldquo;fixing&rdquo; them earns nothing.
                </p>
                <p>
                  <strong>It must stand.</strong> The reward is reserved, then paid only if a fresh reading after the survival period still shows the
                  same week. Reverted or vandalised fixes return to the pot.
                </p>
                <p>
                  <strong>Pull payments.</strong> The mapper&apos;s 90% goes to the GenLayer wallet on their OSM profile (a line like
                  &ldquo;GenLayer wallet: 0x…&rdquo;), held until they add one; only Withdraw sends GEN.
                </p>
              </div>
              <OwedCard />
              <TransactionPanel />
            </aside>
          </section>
        </div>
      </main>
      <footer className="border-t border-border py-4 px-4 text-center text-sm text-muted-foreground">
        Data: OpenStreetMap ©{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
          OpenStreetMap contributors
        </a>
        , ODbL · business pages as published ·{" "}
        <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
          Built on GenLayer
        </a>
        {" · "}
        <a href="https://github.com/bars26/genlayer-hoursfix" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
          Source
        </a>
      </footer>
      <OpenCallModal open={modal} onOpenChange={setModal} />
    </div>
  );
}
