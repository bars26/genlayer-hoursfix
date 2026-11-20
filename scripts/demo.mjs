// Live end-to-end demo of HoursFix on GenLayer Studio, on real OpenStreetMap edits and the businesses' own pages.
//
//   DEMO_KEYS=<file> node scripts/demo.mjs <contract-address>      # writes docs/demo-run.json
//
// The call is a DEMO call funded by a test wallet with Studio test GEN, not an offer from anyone to these mappers.
// The edits, the mappers and the business pages it checks are real (OpenStreetMap data © OpenStreetMap contributors).

import { writeFileSync } from "fs";
import { createAccount, generatePrivateKey } from "genlayer-js";
import { GEN, client, field, fund, log, read, reconcile, reconciliations, setContract, sleep, write } from "./studio.mjs";

const [CONTRACT] = process.argv.slice(2);
if (!CONTRACT) {
  console.error("usage: node scripts/demo.mjs <contract-address>");
  process.exit(1);
}
setContract(CONTRACT);
const keys = { sponsor: generatePrivateKey(), scout: generatePrivateKey(), keeper: generatePrivateKey() };
if (process.env.DEMO_KEYS) writeFileSync(process.env.DEMO_KEYS, JSON.stringify(keys));
const acct = Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, createAccount(v)]));
const C = Object.fromEntries(Object.entries(acct).map(([k, a]) => [k, client(a)]));
console.log("contract  ", CONTRACT);
for (const [k, a] of Object.entries(acct)) console.log(k.padEnd(10), a.address);
await fund(acct.sponsor.address, 20n);
await fund(acct.scout.address, 1n);
await fund(acct.keeper.address, 1n);
await sleep(3000);

const firstFix = (await read(C.sponsor, "get_fixes", [0, 200])).length;
const firstCall = (await read(C.sponsor, "get_calls", [0, 100])).length;
const callId = `call_${firstCall}`;
let next = firstFix;
const fixes = {};
const submit = async (label, kind, id, version, opts) => {
  const row = await write(C.scout, "scout", "submit", [callId, kind, id, version], 0n, opts);
  if (opts?.expectError) return null;
  const fixId = `fix_${next++}`;
  const f = await read(C.sponsor, "get_fix", [fixId]);
  console.log(`  -> ${fixId} ${label}: ${field(f, "verdict")} ${field(f, "code")}. ${field(f, "why")}`);
  fixes[fixId] = label;
  return fixId;
};

// A sponsor funds a call for Central and East London: shops, cafés, restaurants, pubs and leisure centres; fixes made
// since 20 October; 0.5 GEN per fix; at most one paid fix per mapper; an edit must stand one day.
await write(C.sponsor, "sponsor", "deposit", [], 4n * GEN);
await write(C.sponsor, "sponsor", "open_call", ["Central & East London opening hours", "51.47", "-0.16", "51.54", "-0.02", "shop,amenity,leisure", "2026-10-20", "2026-12-31", GEN / 2n, 1, 1, 4n * GEN]);
// Refused before any reading: a box larger than one degree.
await write(C.sponsor, "sponsor", "open_call", ["Too big", "51.0", "-1.0", "52.5", "0.5", "shop", "2026-10-20", "2026-12-31", GEN / 2n, 1, 1, GEN], 0n, { expectError: true });
await reconcile(C.sponsor, "the 4 GEN pot taken from the deposit");

// Real edits, as they are on OpenStreetMap today.
const signal = await submit("The Signal Box, Euston (hours added 16 Nov; site named since July)", "node", "6381240591", 10);
const pizza = await submit("PizzaExpress, Baker Street (hours added 15 Nov; site named since August)", "node", "299523381", 26);
// The edit replaced the cafe's website with a new one and set hours matching the new site: the page validators read is
// the one the place named before the window opened, not the one the edit brought.
await submit("Pitfield, Hoxton (the edit also changed the website)", "node", "4895959823", 11);
await submit("Wavelengths Leisure Centre, Deptford (way created inside the window)", "way", "1579773881", 2);
await submit("Superdrug, Cheapside (website added by the same edit)", "way", "517030126", 6);
await submit("Pizza Pilgrims, Victoria (an edit that did not change the week)", "node", "5215406428", 11);
await submit("Petit Pret, Marylebone (outside the call's box)", "node", "1251964294", 22);
// Refused before a fix is stored: the same element again.
await submit("The Signal Box again", "node", "6381240591", 10, { expectError: true });
await reconcile(C.sponsor, "eligible fixes reserved from the pot");

// After the one-day survival period anyone confirms: validators read each element again, check it still names the
// same page, and read that page again.
for (const fixId of [signal, pizza]) await write(C.keeper, "keeper", "confirm", [fixId]);
// No mapper publishes a GenLayer wallet on their OSM profile yet: their 90% is held, and a claim is refused.
await write(C.keeper, "keeper", "claim", [signal], 0n, { expectError: true });
// The call runs until 31 December: closing it now is refused.
await write(C.keeper, "keeper", "close_call", [callId], 0n, { expectError: true });
await reconcile(C.sponsor, "two fixes confirmed: scouts paid, mapper shares held");
await write(C.scout, "scout", "withdraw", []);
await write(C.keeper, "keeper", "withdraw", [], 0n, { expectError: true }); // nothing credited to the keeper
await reconcile(C.sponsor, "end of run, after the withdrawal");

const plain = (m) => JSON.parse(JSON.stringify(m instanceof Map ? Object.fromEntries(m) : m, (k, v) => (typeof v === "bigint" ? v.toString() : v)));
const out = { network: "studio", contract: CONTRACT, accounts: Object.fromEntries(Object.entries(acct).map(([k, a]) => [k, a.address])),
  call: plain(await read(C.sponsor, "get_call", [callId])), fixes: {}, labels: fixes, reconciliations, log };
for (const id of Object.keys(fixes)) out.fixes[id] = plain(await read(C.sponsor, "get_fix", [id]));
writeFileSync(new URL("../docs/demo-run.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("wrote docs/demo-run.json");
