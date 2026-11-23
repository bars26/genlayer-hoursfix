// Finishes a scripts/demo.mjs run that stopped part-way, from its console log: rebuilds the transaction log and the
// reconciliations from the lines it printed, then sends the steps that were not sent yet.
//
//   DEMO_KEYS=<file> node scripts/demo-resume.mjs <contract-address> <console-log> <call-id>
//
// Every transaction it rebuilds is still on the explorer; nothing is sent twice (a step is skipped if its line exists).

import { readFileSync, writeFileSync } from "fs";
import { createAccount } from "genlayer-js";
import { GEN, client, log, read, reconcile, reconciliations, setContract, write } from "./studio.mjs";

const [CONTRACT, LOG, CALL] = process.argv.slice(2);
setContract(CONTRACT);
const keys = JSON.parse(readFileSync(process.env.DEMO_KEYS, "utf8"));
const acct = Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, createAccount(v)]));
const C = Object.fromEntries(Object.entries(acct).map(([k, a]) => [k, client(a)]));
const VALUES = { "sponsor deposit": "4", "keeper deposit": "0.1" };
const wei = (s) => { const [w, f = ""] = s.split("."); return (BigInt(w) * GEN + BigInt((f + "0".repeat(18)).slice(0, 18))).toString(); };

const lines = readFileSync(LOG, "utf8").split("\n");
const labels = {};
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  const tx = l.match(/^(\w+)\s+(\w+\(.*\))\s+(ACCEPTED|FINALIZED|UNDETERMINED)\s+(SUCCESS|ERROR|UNDETERMINED|\?)\s+(0x[0-9a-f]{64})(?:  -> (.*))?$/);
  if (tx) {
    const [, who, call, status, exec, hash, returned] = tx;
    const fn = call.split("(")[0];
    const row = { who, call, value: VALUES[`${who} ${fn}`] ?? "0", hash, status, exec, returned };
    const next = lines[i + 1] || "";
    const refused = next.match(/^  -> refused as designed: (.*)$/);
    if (refused) row.refused = refused[1];
    else if (exec === "ERROR") {
      const t = await C.sponsor.getTransaction({ hash });
      const lr = t?.consensus_data?.leader_receipt;
      const first = Array.isArray(lr) ? lr[0] : lr;
      row.refused = typeof first?.result?.payload === "string" ? first.result.payload : "refused";
    }
    log.push(row);
    continue;
  }
  const rec = l.match(/^  reconcile \((.*)\): pots ([\d.]+) \+ reserved ([\d.]+) \+ held ([\d.]+) \+ credited ([\d.]+) = ([\d.]+) GEN; contract balance ([\d.]+) GEN (OK|MISMATCH)$/);
  if (rec) {
    const [, label, pots, reserved, held, owed, expected, balance, ok] = rec;
    reconciliations.push({ label, pots: wei(pots), reserved: wei(reserved), held: wei(held), owed: wei(owed), expected: wei(expected), balance: wei(balance), ok: ok === "OK" });
    continue;
  }
  const fix = l.match(/^  -> (fix_\d+) (.*?): (ELIGIBLE|INELIGIBLE|UNCLEAR) /);
  if (fix) labels[fix[1]] = fix[2];
}
console.log(`rebuilt ${log.length} transactions, ${reconciliations.length} reconciliations, fixes ${Object.keys(labels).join(", ")}`);

const sent = (who, fn, arg) => log.some((r) => r.who === who && r.call.startsWith(`${fn}(`) && (arg === undefined || r.call.includes(JSON.stringify(arg))));
const pizza = Object.keys(labels).find((k) => labels[k].startsWith("PizzaExpress"));
if (!sent("keeper", "confirm", pizza)) await write(C.keeper, "keeper", "confirm", [pizza]);
await write(C.keeper, "keeper", "dispute", [pizza], 0n, { expectError: true }); // confirmed: no longer disputable
await write(C.keeper, "keeper", "claim", [pizza], 0n, { expectError: true }); // no wallet on the mapper's profile
await write(C.keeper, "keeper", "close_call", [CALL], 0n, { expectError: true });
await reconcile(C.sponsor, "the fix confirmed: scout credited, mapper share (with the stake) held");
await write(C.scout, "scout", "withdraw", []);
await write(C.keeper, "keeper", "withdraw", []); // the unstaked half of the deposit; the stake went to the mapper
await reconcile(C.sponsor, "end of run, after the withdrawals");

const plain = (m) => JSON.parse(JSON.stringify(m instanceof Map ? Object.fromEntries(m) : m, (k, v) => (typeof v === "bigint" ? v.toString() : v)));
const out = { network: "studio", version: "v2", contract: CONTRACT, accounts: Object.fromEntries(Object.entries(acct).map(([k, a]) => [k, a.address])),
  call: plain(await read(C.sponsor, "get_call", [CALL])), fixes: {}, labels, reconciliations, log };
for (const id of Object.keys(labels)) out.fixes[id] = plain(await read(C.sponsor, "get_fix", [id]));
writeFileSync(new URL("../docs/demo-run.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("wrote docs/demo-run.json");
