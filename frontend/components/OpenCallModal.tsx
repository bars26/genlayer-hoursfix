"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { MIN_REWARD_WEI, addDays, parseGen, todayUtc } from "@/lib/contracts/types";
import { useWallet } from "@/lib/genlayer/wallet";
import { useHoursWrite } from "@/lib/hooks/useHoursFix";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const AREAS = [
  { label: "Central London", box: ["51.49", "-0.16", "51.53", "-0.07"] },
  { label: "Kadıköy, Istanbul", box: ["40.97", "29.01", "41.00", "29.06"] },
  { label: "Berlin-Mitte", box: ["52.50", "13.36", "52.54", "13.43"] },
];

export function OpenCallModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { isConnected } = useWallet();
  const { writeAsync, pending } = useHoursWrite();
  const [f, setF] = useState({
    title: "Central London opening hours",
    south: "51.49",
    west: "-0.16",
    north: "51.53",
    east: "-0.07",
    keys: "shop,amenity,leisure",
    since: "",
    ends: "",
    reward: "0.5",
    perMapper: "3",
    survival: "1",
    pot: "2",
  });
  useEffect(() => {
    if (open) setF((x) => ({ ...x, since: x.since || addDays(todayUtc(), -30), ends: x.ends || addDays(todayUtc(), 30) }));
  }, [open]);
  const reward = parseGen(f.reward);
  const pot = parseGen(f.pot);
  const nums = [f.south, f.west, f.north, f.east].map(Number);
  const problems = [
    !(f.title.trim().length >= 3 && f.title.trim().length <= 80) && "Give the call a title (3 to 80 characters).",
    (nums.some((n) => Number.isNaN(n)) || !(nums[0] < nums[2] && nums[1] < nums[3]) || nums[2] - nums[0] > 1 || nums[3] - nums[1] > 1) &&
      "The box needs south < north and west < east, at most 1 degree a side.",
    (f.since < addDays(todayUtc(), -90) || f.since > f.ends) && "Since is at most 90 days back and not after the last day.",
    (f.ends < todayUtc() || f.ends > addDays(todayUtc(), 180)) && "The last day is today or within 180 days.",
    (!reward || reward < MIN_REWARD_WEI) && "The reward per fix is at least 0.01 GEN.",
    (!pot || !reward || pot < reward) && "The pot covers at least one reward.",
    !(Number(f.survival) >= 1 && Number(f.survival) <= 60) && "Survival is 1 to 60 days.",
    !(Number(f.perMapper) >= 1 && Number(f.perMapper) <= 1000) && "Per mapper is 1 to 1000.",
  ].filter(Boolean) as string[];
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    try {
      await writeAsync({
        kind: "open",
        input: {
          title: f.title.trim(),
          south: f.south,
          west: f.west,
          north: f.north,
          east: f.east,
          keys: f.keys.replace(/\s+/g, ""),
          since: f.since,
          ends: f.ends,
          reward: reward!,
          perMapper: Number(f.perMapper),
          survivalDays: Number(f.survival),
          pot: pot!,
        },
      });
      onOpenChange(false);
    } catch {
      // the toast and the transaction panel explain it
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="brand-card max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="display text-2xl">Fund a call for opening-hours fixes</DialogTitle>
          <DialogDescription>
            Every OpenStreetMap edit in your area that sets hours matching the business&apos;s own page earns the reward once it has stood the survival
            period: 90% to the mapper, 10% to whoever submits it. What is not reserved comes back to you when the call ends.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <button
              key={a.label}
              type="button"
              className="rounded-full border border-border bg-white px-3 py-1 text-xs hover:bg-muted"
              onClick={() => setF({ ...f, title: `${a.label} opening hours`, south: a.box[0], west: a.box[1], north: a.box[2], east: a.box[3] })}
            >
              {a.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label htmlFor="oc-title">Title</Label>
            <Input id="oc-title" value={f.title} onChange={set("title")} />
          </div>
          {(["south", "west", "north", "east"] as const).map((k) => (
            <div key={k} className="space-y-1">
              <Label htmlFor={`oc-${k}`}>{k[0].toUpperCase() + k.slice(1)} (degrees)</Label>
              <Input id={`oc-${k}`} value={f[k]} onChange={set(k)} inputMode="decimal" />
            </div>
          ))}
          <div className="col-span-2 space-y-1">
            <Label htmlFor="oc-keys">OSM keys a place must have (empty = any)</Label>
            <Input id="oc-keys" value={f.keys} onChange={set("keys")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="oc-since">Fixes made since</Label>
            <Input id="oc-since" type="date" value={f.since} onChange={set("since")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="oc-ends">Submitted by</Label>
            <Input id="oc-ends" type="date" value={f.ends} onChange={set("ends")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="oc-reward">Reward per fix (GEN)</Label>
            <Input id="oc-reward" value={f.reward} onChange={set("reward")} inputMode="decimal" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="oc-pot">Pot (GEN)</Label>
            <Input id="oc-pot" value={f.pot} onChange={set("pot")} inputMode="decimal" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="oc-surv">Edit must stand (days)</Label>
            <Input id="oc-surv" value={f.survival} onChange={set("survival")} inputMode="numeric" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="oc-cap">Paid fixes per mapper</Label>
            <Input id="oc-cap" value={f.perMapper} onChange={set("perMapper")} inputMode="numeric" />
          </div>
        </div>
        {problems.length > 0 && (
          <ul className="list-disc pl-5 text-xs text-[#9B3B24]">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        <Button className="w-full" disabled={!isConnected || problems.length > 0 || pending === "open"} onClick={submit}>
          {pending === "open" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isConnected ? `Deposit and open (${f.pot || 0} GEN)` : "Connect a wallet first"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
