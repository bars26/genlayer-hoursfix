// Renders docs/REPRODUCTION.md from docs/demo-run.json (written by scripts/demo.mjs), the fixes as the contract reports
// them now, docs/bradbury/demo-run.json (scripts/demo-bradbury.mjs) and, when present, docs/ui-test.json (a MetaMask
// run from the live app). The v1.1 run is kept in docs/v1.1/.
//
//   node scripts/reproduction.mjs

import { readFileSync, writeFileSync } from "fs";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const run = JSON.parse(readFileSync(new URL("../docs/demo-run.json", import.meta.url), "utf8"));
const client = createClient({ chain: studionet, endpoint: "https://studio.genlayer.com/api" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function read(functionName, args = []) {
  for (let i = 0; ; i++) {
    try {
      return await client.readContract({ address: run.contract, functionName, args });
    } catch (err) {
      if (i >= 5) throw err;
      await sleep(20000);
    }
  }
}
const plain = (o) => JSON.parse(JSON.stringify(o instanceof Map ? Object.fromEntries(o) : o, (k, v) => (typeof v === "bigint" ? v.toString() : v instanceof Map ? Object.fromEntries(v) : v)));
const EXPLORER = "https://explorer-studio.genlayer.com";
const tx = (h) => (h ? `[${h.slice(0, 10)}…](${EXPLORER}/tx/${h})` : "");
const gen = (w) => `${(Number(w) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 4 })} GEN`;
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const osm = (el, v) => `[${el} v${v}](https://www.openstreetmap.org/${el}/history)`;

const fixes = {};
for (const id of Object.keys(run.fixes)) fixes[id] = plain(await read("get_fix", [id]));
const call = plain(await read("get_call", [run.call.id]));
const totals = JSON.parse(await read("totals"));
const balance = BigInt(await client.getBalance({ address: run.contract }));

const rows = Object.values(fixes).map((f) => {
  const r = JSON.parse(f.reading_json || "{}");
  const w = r.weeks || {};
  const both = w.visible !== undefined ? `<br>text: \`${esc(w.visible) || "none"}\`<br>schema.org: \`${esc(w.structured) || "none"}\`` : "";
  const site = r.site ? `${esc(w.site) || (r.site.found ? "" : "no weekly hours found")}${both}${r.site.quote ? `<br>*"${esc(r.site.quote).slice(0, 140)}"*` : ""}` : "—";
  return `| ${f.id} | ${esc(r.facts?.name)} ${osm(f.element, f.version)} by ${esc(f.mapper)}, ${f.edited_at.slice(0, 10)} | ${esc(w.old || r.facts?.old || "(none)")} | ${esc(w.new || r.facts?.new)} | ${site} | **${f.verdict}** ${f.code} | ${f.state}${Number(f.reward) ? `, ${gen(f.reward)}` : ""} |`;
});
const details = Object.values(fixes).map((f) => {
  const r = JSON.parse(f.reading_json || "{}");
  const conf = f.confirm_json ? JSON.parse(f.confirm_json) : null;
  const disp = f.dispute_json ? JSON.parse(f.dispute_json) : null;
  return `- **${f.id}** (${esc(run.labels[f.id] || f.element)}): ${esc(f.why)} Reading at ${r.read_at} UTC, packet sha256 \`${r.packet_sha256}\`${r.site?.text_sha256 ? `, page text sha256 \`${r.site.text_sha256}\` (${r.site.chars} characters read from ${esc(r.facts?.website)})` : ""}.${r.facts?.edit_website && r.facts.edit_website !== r.facts.website ? ` The edit switched the place's page to ${esc(r.facts.edit_website)}; the page read was the one named before the window, ${esc(r.facts.website) || "(none)"}.` : ""}${conf ? ` Confirmed at ${conf.read_at} UTC: latest version v${conf.version}, hours ${conf.hours_same ? "unchanged" : "changed"} (\`${esc(conf.current)}\`), page ${conf.authority_same ? "unchanged" : `changed to ${esc(conf.authority_now)}`}${conf.site_week ? `, page read again: ${esc(conf.site_week)}` : ""}; mapper wallet ${conf.wallet || "not published"}; scout ${gen(f.scout_share)}, mapper ${gen(f.mapper_share)}.` : ""}${disp ? ` **Disputed** by \`${f.disputed_by}\` at ${disp.read_at} UTC: ${disp.same ? "DISMISSED" : "UPHELD"} (hours ${disp.hours_same ? "unchanged" : "changed"}, page ${disp.authority_same ? "unchanged" : "changed"}, page read again: ${esc(disp.site_week) || "—"}${disp.structured ? `, schema.org ${esc(disp.structured)}` : ""})${Number(f.bonus) ? `; the stake, ${gen(f.bonus)}, joined the mapper's reward` : ""}.` : ""}`;
});
const log = run.log.map((r) => `| ${r.who} | \`${esc(r.call)}\` | ${r.value === "0" ? "" : r.value} | ${r.status} | ${r.exec} | ${esc(r.refused ? `refused: ${r.refused}` : r.returned ?? "").slice(0, 160)} | ${tx(r.hash)} |`);
const recon = [
  ...run.reconciliations,
  { label: "now (when this file was generated)", pots: totals.pots, held: totals.held, owed: totals.owed, expected: totals.expected_balance, balance: balance.toString(), ok: BigInt(totals.expected_balance) === balance, reserved: totals.reserved },
].map((r) => `| ${r.label} | ${gen(r.reserved ?? (BigInt(r.expected) - BigInt(r.pots) - BigInt(r.held) - BigInt(r.owed)).toString())} | ${gen(r.pots)} | ${gen(r.held)} | ${gen(r.owed)} | ${gen(r.expected)} | ${gen(r.balance)} | ${r.ok ? "match" : "MISMATCH"} |`);

let uiTest = "";
try {
  const ui = JSON.parse(readFileSync(new URL("../docs/ui-test.json", import.meta.url), "utf8"));
  uiTest = `## Wallet test from the live app

${ui.note} Wallet \`${ui.wallet}\`${ui.network === "bradbury" ? ", on Bradbury testnet" : ""}.

| Step | GEN sent | Result | Tx |
|---|---|---|---|
${ui.steps.map(([step, value, result, hash]) => `| ${esc(step)} | ${value} | ${esc(result)} | ${ui.network === "bradbury" ? (hash ? `[${hash.slice(0, 10)}…](https://explorer-bradbury.genlayer.com/tx/${hash})` : "") : tx(hash)} |`).join("\n")}

`;
} catch {
  // no wallet test recorded
}

const box = JSON.parse(call.box_json);
let bradbury = "";
try {
  const b = JSON.parse(readFileSync(new URL("../docs/bradbury/demo-run.json", import.meta.url), "utf8"));
  const BX = "https://explorer-bradbury.genlayer.com";
  const btx = (h) => (h ? `[${h.slice(0, 10)}…](${BX}/tx/${h})` : "");
  bradbury = `## The same contract on Bradbury testnet

Contract \`${b.contract}\` ([explorer](${BX}/address/${b.contract})), generated from \`contracts/hours_fix.py\` by
\`scripts/bradbury_source.py\` and checked byte-identical by \`node scripts/verify-code-bradbury.mjs ${b.contract}\`. Five
independent Bradbury validators read OpenStreetMap and the business's page. Bradbury reports each decision, the execution
result and the votes, not return values, so every ruling below was read back from the contract.

| Fix | Place | Ruling | State | Dispute |
|---|---|---|---|---|
${Object.values(b.fixes).map((f) => { const d = f.dispute_json ? JSON.parse(f.dispute_json) : null; return `| ${f.id} | ${esc(b.labels[f.id])} | **${f.verdict}** ${f.code} | ${f.state} | ${d ? `${d.same ? "DISMISSED" : "UPHELD"}, read again: ${esc(d.site_week)}` : ""} |`; }).join("\n")}

| Who | Call | GEN sent | Decision | Execution | Votes | Seconds | Tx |
|---|---|---|---|---|---|---|---|
${b.log.map((r) => `| ${r.who} | \`${esc(r.call).slice(0, 90)}\` | ${r.value === "0.0000" ? "" : r.value} | ${r.status} | ${r.execution} | ${r.votes.join("/")} | ${r.seconds} | ${btx(r.hash)} |`).join("\n")}

| When | Expected (pots + reserved + held + credited) | On-chain balance | |
|---|---|---|---|
${b.reconciliations.map((r) => `| ${r.label} | ${gen(r.expected)} | ${gen(r.balance)} | ${r.ok ? "match" : "MISMATCH"} |`).join("\n")}

Accounts: ${Object.entries(b.accounts).map(([k, a]) => `${k} \`${a}\``).join(", ")}.

`;
} catch {
  // no Bradbury run recorded
}

const md = `# HoursFix v2: reproduction

Every ruling below was made by GenLayer validators on GenLayer Studio, reading OpenStreetMap's public API and the
businesses' own web pages. Contract \`${run.contract}\` ([explorer](${EXPLORER}/address/${run.contract})); \`node scripts/verify-code.mjs ${run.contract}\`
checks that the deployed code is byte-identical to \`contracts/hours_fix.py\`.

The call is a **demo call** funded by a test wallet with Studio test GEN, not an offer to these mappers. The edits, mappers
and pages are real (OpenStreetMap data © OpenStreetMap contributors, ODbL).

## The call

\`${call.id}\` "${esc(call.title)}": box south ${box[0]}, west ${box[1]}, north ${box[2]}, east ${box[3]}; places with
${JSON.parse(call.keys_json).join(", ")}; fixes made since ${call.since}, submitted by ${call.ends}; ${gen(call.reward)} per fix
(90% mapper, 10% scout); at most ${call.per_mapper} paid fix per mapper; an edit must stand ${call.survival_days} day.
Now: pot ${gen(call.pot)}, reserved ${gen(call.reserved)}, paid ${gen(call.paid_total)}, ${call.n_eligible} eligible of ${call.n_submitted} submitted.

## Every fix

"When the call opened" is the element's hours on the last version before ${call.since}, and the page read is the one the
element named on that version; every value is shown as the week HoursFix reads (\`check_hours\`). v2 reads the page twice, its visible text (the
model) and its schema.org opening hours (code); when both exist they must agree. The v1.1 run is in
[\`docs/v1.1/\`](v1.1/REPRODUCTION.md), v1's in [\`docs/v1/\`](v1/).

| Fix | Place, edit | When the call opened | After the edit | The business's page | Ruling | State |
|---|---|---|---|---|---|---|
${rows.join("\n")}

${details.join("\n")}

Check an edit yourself: \`curl -s https://api.openstreetmap.org/api/0.6/node/6381240591/history.json\`.

${uiTest}${bradbury}## Every transaction on Studio

A refused call is still ACCEPTED by consensus; the contract outcome is the \`exec\` column (\`ERROR\` = refused, on purpose here).

| Who | Call | GEN sent | Consensus | exec | Returned / refused | Tx |
|---|---|---|---|---|---|---|
${log.join("\n")}

Accounts: ${Object.entries(run.accounts).map(([k, a]) => `${k} \`${a}\``).join(", ")}.

## Balance reconciliation

\`totals()\` keeps running totals (unreserved pots, reserved rewards, mapper shares held for a wallet, GEN credited but
not withdrawn); their sum must equal the contract's GEN balance on chain.

| When | Reserved | Pots | Held | Credited | Expected | On-chain balance | |
|---|---|---|---|---|---|---|---|
${recon.join("\n")}
`;
writeFileSync(new URL("../docs/REPRODUCTION.md", import.meta.url), md);
console.log(`wrote docs/REPRODUCTION.md (${run.log.length} transactions)`);
