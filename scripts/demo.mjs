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

// A sponsor funds a call for Central and East London (to the Greenwich meridian): shops, cafés, restaurants, pubs and
// leisure centres; fixes made since 20 October; 0.5 GEN per fix; at most one paid fix per mapper; an edit must stand one day.
await write(C.sponsor, "sponsor", "deposit", [], 4n * GEN);
await write(C.sponsor, "sponsor", "open_call", ["Central & East London opening hours (v2)", "51.47", "-0.16", "51.54", "0.0", "shop,amenity,leisure", "2026-10-20", "2026-12-31", GEN / 2n, 1, 1, 4n * GEN]);
await write(C.sponsor, "sponsor", "open_call", ["Too big", "51.0", "-1.0", "52.5", "0.5", "shop", "2026-10-20", "2026-12-31", GEN / 2n, 1, 1, GEN], 0n, { expectError: true });
await reconcile(C.sponsor, "the 4 GEN pot taken from the deposit");

// v2 reads the page twice: its visible text (the model writes the week) and its schema.org opening hours (parsed in code).
// Both present and the same week: eligible. Both present and different: sources_disagree, nothing reserved.
const pizza = await submit("PizzaExpress, Baker Street: page text and schema.org state the same week", "node", "299523381", 26);
await submit("The Signal Box, Euston: page text and schema.org state different weeks", "node", "6381240591", 10);
const oma = await submit("Oma, Borough: hours added 14 Nov; the page shows no weekly hours to validators", "node", "12477919501", 4);
await submit("Waitrose, Canary Wharf: Friday fixed 6 Nov; store page", "node", "1708718478", 23);
await submit("Gantry Climbing, Rotherhithe: a later edit that did not change the week", "node", "11042163878", 6);
await submit("PizzaExpress again", "node", "299523381", 26, { expectError: true });
await reconcile(C.sponsor, "eligible fixes reserved from the pot");

// v2: anyone may dispute a held fix before it is confirmed, staking 10% of its reward. Validators read the element
// and both page sources again at once. Here the fix still stands: the dispute is dismissed and the stake joins the
// mapper's reward. A second dispute of the same fix is refused.
await write(C.keeper, "keeper", "deposit", [], GEN / 10n);
await write(C.keeper, "keeper", "dispute", [pizza]);
await write(C.keeper, "keeper", "dispute", [pizza], 0n, { expectError: true });
await reconcile(C.sponsor, "a dismissed dispute: the stake reserved for the mapper");

await write(C.keeper, "keeper", "confirm", [pizza]);
await write(C.keeper, "keeper", "confirm", [oma], 0n, { expectError: true }); // UNCLEAR: nothing was reserved, nothing to confirm
await write(C.keeper, "keeper", "dispute", [pizza], 0n, { expectError: true }); // confirmed: no longer disputable
await write(C.keeper, "keeper", "claim", [pizza], 0n, { expectError: true }); // no wallet on the mapper's profile
await write(C.keeper, "keeper", "close_call", [callId], 0n, { expectError: true });
await reconcile(C.sponsor, "fixes confirmed: scouts credited, mapper shares (with the stake) held");
await write(C.scout, "scout", "withdraw", []);
await write(C.keeper, "keeper", "withdraw", []); // the unstaked half of the deposit; the stake went to the mapper
await reconcile(C.sponsor, "end of run, after the withdrawal");

const plain = (m) => JSON.parse(JSON.stringify(m instanceof Map ? Object.fromEntries(m) : m, (k, v) => (typeof v === "bigint" ? v.toString() : v)));
const out = { network: "studio", version: "v2", contract: CONTRACT, accounts: Object.fromEntries(Object.entries(acct).map(([k, a]) => [k, a.address])),
  call: plain(await read(C.sponsor, "get_call", [callId])), fixes: {}, labels: fixes, reconciliations, log };
for (const id of Object.keys(fixes)) out.fixes[id] = plain(await read(C.sponsor, "get_fix", [id]));
writeFileSync(new URL("../docs/demo-run.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("wrote docs/demo-run.json");
