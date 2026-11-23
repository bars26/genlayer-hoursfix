// Live run of HoursFix v2 on Bradbury testnet (Phase 2): five independent validators read OpenStreetMap and the
// business's own page (its visible text and its schema.org opening hours).
//
//   node scripts/demo-bradbury.mjs <contract-address>      # writes docs/bradbury/demo-run.json
//
// Test wallets (keys outside the repo, in ~/.config/genlayer-demos/): a sponsor, a scout and a disputer, funded from the
// GenLayer testnet faucet. The call is a demo; the edits, mappers and pages are real (© OpenStreetMap contributors).
//
// Bradbury reports each transaction's decision, execution result and votes, not the contract's return value, so every
// result below is read back from the contract. A round where the leader ran out of time changes nothing and is sent
// again (up to three times).

import { mkdirSync, writeFileSync } from "fs";
import { accountFrom, balance, clientFor, gen, keyFile, read, write } from "./bradbury.mjs";

const [CONTRACT] = process.argv.slice(2);
if (!CONTRACT) {
  console.error("usage: node scripts/demo-bradbury.mjs <contract-address>");
  process.exit(1);
}
const GEN = 10n ** 18n;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wallets = {
  sponsor: accountFrom(keyFile("fieldcall-bradbury-sponsor.json")),
  scout: accountFrom(keyFile("payclear-bradbury-auditor-a.json")),
  disputer: accountFrom(keyFile("payclear-bradbury-auditor-b.json")),
};
const C = Object.fromEntries(Object.entries(wallets).map(([k, a]) => [k, clientFor(a)]));
const log = [];
const plain = (o) => JSON.parse(JSON.stringify(o instanceof Map ? Object.fromEntries(o) : o, (k, v) => (typeof v === "bigint" ? v.toString() : v instanceof Map ? Object.fromEntries(v) : v)));

async function send(who, functionName, args = [], opts = {}) {
  const { expect = "ok", ...rest } = opts;
  const extra = functionName === "withdraw" ? { payee: wallets[who].address, leader: 120n, validator: 120n } : {};
  const r = await write(C[who], CONTRACT, functionName, args, { ...extra, ...rest });
  const row = { who, call: `${functionName}(${args.map((a) => JSON.stringify(typeof a === "bigint" ? a.toString() : a)).join(", ")})`, value: gen(rest.value ?? 0n), ...r };
  log.push(row);
  console.log(`${who.padEnd(8)} ${row.call.slice(0, 74).padEnd(74)} ${r.status} ${r.execution} [${r.votes.join("/")}] ${r.seconds}s ${r.hash}`);
  if (expect === "ok" && !r.ok) throw new Error(`${functionName} did not complete: ${r.status} ${r.execution}`);
  if (expect === "refused" && r.execution !== "FINISHED_WITH_ERROR") throw new Error(`${functionName} was expected to be refused, got ${r.status} ${r.execution}`);
  return r;
}

const reconciliations = [];
async function reconcile(label) {
  // A withdraw's transfer leaves the contract about a minute after the withdraw finalizes.
  for (let i = 0; i < 12; i++) {
    const t = JSON.parse(await read(CONTRACT, "totals"));
    const onChain = await balance(C.sponsor, CONTRACT);
    if (BigInt(t.expected_balance) === onChain || i === 11) {
      const ok = BigInt(t.expected_balance) === onChain;
      reconciliations.push({ label, pots: t.pots, reserved: t.reserved, held: t.held, owed: t.owed, expected: t.expected_balance, balance: onChain.toString(), ok });
      console.log(`  reconcile (${label}): expected ${gen(t.expected_balance)} GEN; contract balance ${gen(onChain)} GEN ${ok ? "OK" : "MISMATCH"}`);
      if (!ok) throw new Error("balance mismatch");
      return;
    }
    await sleep(15000);
  }
}

const first = (await read(CONTRACT, "get_calls", [0, 200])).length;
let next = (await read(CONTRACT, "get_fixes", [0, 200])).length;
const cid = `call_${first}`;
console.log("contract", CONTRACT);
for (const [k, a] of Object.entries(wallets)) console.log(k.padEnd(8), a.address, gen(await balance(C.sponsor, a.address)), "GEN");

await send("sponsor", "deposit", [], { value: GEN, leader: 120n, validator: 120n });
// Refused before any reading: a box larger than one degree.
await send("sponsor", "open_call", ["Too big", "51.0", "-1.0", "52.5", "0.5", "shop", "2026-10-20", "2026-12-31", GEN / 4n, 1, 1, GEN / 2n], { expect: "refused", tries: 1, leader: 120n, validator: 120n });
await send("sponsor", "open_call", ["Central & East London opening hours (Bradbury)", "51.47", "-0.16", "51.54", "0.0", "shop,amenity,leisure", "2026-10-20", "2026-12-31", GEN / 4n, 1, 1, GEN / 2n], { leader: 120n, validator: 120n });
await reconcile("call open: 0.5 GEN pot, 0.5 GEN still credited to the sponsor");

const cases = [
  ["node", "299523381", 26, "PizzaExpress, Baker Street: page text and schema.org state the same week"],
  ["node", "11042163878", 6, "Gantry Climbing, Rotherhithe: hours and website added by the same edit"],
];
const ids = {};
for (const [kind, id, version, what] of cases) {
  await send("scout", "submit", [cid, kind, id, version]);
  const fixId = `fix_${next++}`;
  ids[fixId] = what;
  const f = plain(await read(CONTRACT, "get_fix", [fixId]));
  console.log(`  -> ${fixId} ${what}: ${f.verdict} (${f.code}) ${f.why}`);
}
const pizza = Object.keys(ids)[0];
await reconcile("an eligible fix reserved from the pot");

// A disputer stakes 10% of the reward: validators read the element and the page again at once.
await send("disputer", "deposit", [], { value: GEN / 20n, leader: 120n, validator: 120n });
await send("disputer", "dispute", [pizza]);
console.log("  -> dispute:", plain(await read(CONTRACT, "get_fix", [pizza])).dispute_json);
await reconcile("after the dispute");
await send("scout", "confirm", [pizza]);
await send("scout", "claim", [pizza], { expect: "refused", tries: 1 }); // no GenLayer wallet on the mapper's OSM profile
await reconcile("confirmed: the scout credited, the mapper's share held");
await send("scout", "withdraw", []);
await send("sponsor", "withdraw", []);
await reconcile("end of run, after the withdrawals");

const out = { network: "bradbury", version: "v2", contract: CONTRACT, accounts: Object.fromEntries(Object.entries(wallets).map(([k, a]) => [k, a.address])),
  call: plain(await read(CONTRACT, "get_call", [cid])), fixes: {}, labels: ids, reconciliations, log };
for (const id of Object.keys(ids)) out.fixes[id] = plain(await read(CONTRACT, "get_fix", [id]));
mkdirSync(new URL("../docs/bradbury/", import.meta.url), { recursive: true });
writeFileSync(new URL("../docs/bradbury/demo-run.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("wrote docs/bradbury/demo-run.json");
