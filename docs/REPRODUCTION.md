# HoursFix: reproduction

Every ruling below was made by GenLayer validators on GenLayer Studio, reading OpenStreetMap's public API and the
businesses' own web pages. Contract `0xf3e17409dae4e00f94162eF8a2C8C449ba33284D` ([explorer](https://explorer-studio.genlayer.com/address/0xf3e17409dae4e00f94162eF8a2C8C449ba33284D)); `node scripts/verify-code.mjs 0xf3e17409dae4e00f94162eF8a2C8C449ba33284D`
checks that the deployed code is byte-identical to `contracts/hours_fix.py`.

The call is a **demo call** funded by a test wallet with Studio test GEN, not an offer to these mappers. The edits, mappers
and pages are real (OpenStreetMap data © OpenStreetMap contributors, ODbL).

## The call

`call_0` "Central & East London opening hours": box south 51.47, west -0.16, north 51.54, east -0.02; places with
shop, amenity, leisure; fixes made since 2026-10-20, submitted by 2026-12-31; 0.5 GEN per fix
(90% mapper, 10% scout); at most 1 paid fix per mapper; an edit must stand 1 day.
Now: pot 2.5 GEN, reserved 0.5 GEN, paid 0.1 GEN, 3 eligible of 7 submitted.

## Every fix

"When the call opened" is the element's hours on the last version before 2026-10-20; every value is shown as the week
HoursFix reads (`check_hours`).

| Fix | Place, edit | When the call opened | After the edit | The business's page | Ruling | State |
|---|---|---|---|---|---|---|
| fix_0 | The Signal Box [node/6381240591 v10](https://www.openstreetmap.org/node/6381240591/history) by CyrlNish, 2026-11-16 | (none) | Mo-Sa 08:00-22:00; Su 09:00-21:00 | Mo-Sa 08:00-22:00; Su 09:00-21:00<br>*"Monday 08:00 - 22:00 Tuesday 08:00 - 22:00 Wednesday 08:00 - 22:00 Thursday 08:00 - 22:00 Friday 08:00 - 22:00 Saturday 08:00 - 22:00 Sunday"* | **ELIGIBLE** matches_site | awaiting_wallet, 0.5 GEN |
| fix_1 | PizzaExpress [node/299523381 v26](https://www.openstreetmap.org/node/299523381/history) by JackGilmore, 2026-11-15 | (none) | Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30 | Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30<br>*"Monday 11:30 - 22:00 Tuesday 11:30 - 22:00 Wednesday 11:30 - 22:00 Thursday 11:30 - 22:30 Friday 11:30 - 23:00 Saturday 11:30 - 23:00 Sunday"* | **ELIGIBLE** matches_site | awaiting_wallet, 0.5 GEN |
| fix_2 | Wavelengths Leisure Centre [way/1579773881 v2](https://www.openstreetmap.org/way/1579773881/history) by BaguetteYeeter, 2026-11-16 | (none) | Mo-Fr 06:30-22:00; Sa-Su 08:00-18:00 | Mo-Fr 06:30-22:00; Sa-Su 08:00-18:00<br>*"Centre Mon - Fri 06:30 - 22:00 Sat - Sun 08:00 - 18:00"* | **ELIGIBLE** matches_site | held, 0.5 GEN |
| fix_3 | Dr Alter [node/14362459727 v2](https://www.openstreetmap.org/node/14362459727/history) by BaguetteYeeter, 2026-11-16 | (none) | Mo-Fr 09:00-19:00; Sa 10:00-17:00; Su off | Mo-Fr 09:00-19:00; Sa 10:00-17:00; Su off<br>*"Monday to Friday: 09:00 - 19:00 \| Saturday: 10:00 - 17:00 \| Sunday: Closed"* | **INELIGIBLE** mapper_cap | refused |
| fix_4 | Pizza Pilgrims [node/5215406428 v11](https://www.openstreetmap.org/node/5215406428/history) by DrWaluigi, 2026-11-15 | (none) | Mo-We 11:30-22:30; Th-Sa 11:30-23:00; Su 12:00-21:00 | — | **INELIGIBLE** no_change | refused |
| fix_5 | Superdrug [way/517030126 v6](https://www.openstreetmap.org/way/517030126/history) by osmscstuff, 2026-11-17 | (none) | Mo-Fr 07:30-20:00; Sa 09:00-18:00; Su 12:00-18:00 | — | **UNCLEAR** site_unreadable | refused |
| fix_6 | Petit Pret [node/1251964294 v22](https://www.openstreetmap.org/node/1251964294/history) by BaguetteYeeter, 2026-11-16 | (none) | Mo-Fr 05:30-21:30; Sa 06:30-20:00; Su 07:00-20:00 | — | **INELIGIBLE** outside_area | refused |

- **fix_0** (The Signal Box, Euston (hours added 16 Nov)): ELIGIBLE: The new hours match the hours on the business's own page, and the hours they replaced did not. node/6381240591 v10 (The Signal Box) by CyrlNish on 2026-11-16: '(none)' -> 'Mo-Sa 08:00-22:00; Su 09:00-21:00'. The page says Mo-Sa 08:00-22:00; Su 09:00-21:00. Reading at 2026-11-17T21:08:35 UTC, packet sha256 `40ed1123da99f081a3d655915671d3d83dca8b64344e9e10855fb3eead26cc10`, page text sha256 `3284527621bc57a528579b66852f99831943a6524a06a568ccc06b3d6cad7d42` (4983 characters read from https://www.signalboxeuston.co.uk/). Confirmed at 2026-11-17T21:12:26 UTC: latest version v10, hours unchanged (`Mo-Sa 08:00-22:00; Su 09:00-21:00`); mapper wallet not published; scout 0.05 GEN, mapper 0.45 GEN.
- **fix_1** (PizzaExpress, Baker Street (hours added 15 Nov)): ELIGIBLE: The new hours match the hours on the business's own page, and the hours they replaced did not. node/299523381 v26 (PizzaExpress) by JackGilmore on 2026-11-15: '(none)' -> 'Mo-We 11:30-22:00; Th,Su 11:30-22:30; Fr-Sa 11:30-23:00'. The page says Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30. Reading at 2026-11-17T21:08:56 UTC, packet sha256 `b51666c4c4bebbda1212de5a0636a161f7df51185bd2230cbd81b1faeed41dc2`, page text sha256 `c4ba5cd29dadbc0aacd49988e1b72b67bbc60f20fef032a31b510e461a35b2bc` (2782 characters read from https://www.pizzaexpress.com/london-baker-street). Confirmed at 2026-11-17T21:12:47 UTC: latest version v26, hours unchanged (`Mo-We 11:30-22:00; Th,Su 11:30-22:30; Fr-Sa 11:30-23:00`); mapper wallet not published; scout 0.05 GEN, mapper 0.45 GEN.
- **fix_2** (Wavelengths Leisure Centre, Deptford (hours rewritten 16 Nov)): ELIGIBLE: The new hours match the hours on the business's own page, and the hours they replaced did not. way/1579773881 v2 (Wavelengths Leisure Centre) by BaguetteYeeter on 2026-11-16: '(none)' -> 'Mo-Fr 06:30-22:00, Sa-Su 08:00-18:00'. The page says Mo-Fr 06:30-22:00; Sa-Su 08:00-18:00. Reading at 2026-11-17T21:09:25 UTC, packet sha256 `7350b840b7e7d6177e90d60e0166b8a6668b75f7182579022053cfc555fb51a1`, page text sha256 `67ca06210a11fb3ee27c2b9d06525c6b7859a8bfb854d98fa50dd696e4ca07af` (3835 characters read from https://www.better.org.uk/leisure-centre/london/lewisham/wavelengths-leisure-centre).
- **fix_3** (Dr Alter, Tottenham Court Road (same mapper, second fix)): INELIGIBLE: This mapper has reached the call's limit of paid fixes. node/14362459727 v2 (Dr Alter) by BaguetteYeeter on 2026-11-16: '(none)' -> 'Mo-Fr 09:00-19:00; Sa 10:00-17:00'. The page says Mo-Fr 09:00-19:00; Sa 10:00-17:00; Su off. Reading at 2026-11-17T21:09:59 UTC, packet sha256 `f62c06a104129608d0af83ed357a5908dbfdee23e5f6a57d70598b3c4642a5a1`, page text sha256 `a5f4ebc5c46fdcc0508daef8491dd5204c000fc4ebd1222370c0af73edfda5a3` (1704 characters read from https://thedralter.uk/).
- **fix_4** (Pizza Pilgrims, Victoria (an edit that did not change the week)): INELIGIBLE: This version did not change the week the version before it described. node/5215406428 v11 (Pizza Pilgrims) by DrWaluigi on 2026-11-15: '(none)' -> 'Mo-We 11:30-22:30; Th-Sa 11:30-23:00; Su 12:00-21:00'. Reading at 2026-11-17T21:10:33 UTC, packet sha256 `e4412c50872d8d4b908b9705cc7bcf9c55e19000467b41292a862e1570dacf98`.
- **fix_5** (Superdrug, Cheapside (site refuses automated readers)): UNCLEAR: The business's page could not be read. way/517030126 v6 (Superdrug) by osmscstuff on 2026-11-17: '(none)' -> 'Mo-Fr 07:30-20:00; Sa 09:00-18:00; Su 12:00-18:00'. Reading at 2026-11-17T21:10:49 UTC, packet sha256 `8c54162d5af42ad6388ffb84ec6d5b4928dc975f7edf600258f3d4d6897b52d2`.
- **fix_6** (Petit Pret, Marylebone (outside the call's box)): INELIGIBLE: The element is outside the call's area. node/1251964294 v22 (Petit Pret) by BaguetteYeeter on 2026-11-16: '(none)' -> 'Mo-Fr 05:30-21:30; Sa 06:30-20:00; Su 07:00-20:00'. Reading at 2026-11-17T21:11:04 UTC, packet sha256 `3f32ef92f05b2d3881ff3a5f62c2f5e93d2b1f46f2896113688fccc0b4c74d47`.

Check an edit yourself: `curl -s https://api.openstreetmap.org/api/0.6/node/6381240591/history.json`.

## Every transaction

A refused call is still ACCEPTED by consensus; the contract outcome is the `exec` column (`ERROR` = refused, on purpose here).

| Who | Call | GEN sent | Consensus | exec | Returned / refused | Tx |
|---|---|---|---|---|---|---|
| sponsor | `deposit()` | 4 | ACCEPTED | SUCCESS | 4000000000000000000 | [0x0372969f…](https://explorer-studio.genlayer.com/tx/0x0372969fd3ec3a6b62f95fb17de21698a5644d1b97a16d4ab0a587f2de4223fb) |
| sponsor | `open_call("Central & East London opening hours", "51.47", "-0.16", "51.54", "-0.02", "shop,amenity,leisure", "2026-10-20", "2026-12-31", 0.5 GEN, 1, 1, 4 GEN)` |  | ACCEPTED | SUCCESS | call_0 | [0x891f0178…](https://explorer-studio.genlayer.com/tx/0x891f0178d04929976c6b82978e19ea829860da473ac056fb475af515c808ab81) |
| sponsor | `open_call("Too big", "51.0", "-1.0", "52.5", "0.5", "shop", "2026-10-20", "2026-12-31", 0.5 GEN, 1, 1, 1 GEN)` |  | ACCEPTED | ERROR | refused: the box must have south < north and west < east, at most 1.0 degree a side | [0x8a04a03f…](https://explorer-studio.genlayer.com/tx/0x8a04a03f6b1ece6994491f2846fa3d5a5bea7e90a6e0a0f5583d5b438dd85f50) |
| scout | `submit("call_0", "node", "6381240591", 10)` |  | ACCEPTED | SUCCESS | fix_0 | [0x4b5896ee…](https://explorer-studio.genlayer.com/tx/0x4b5896ee27ab41a64fd5213220ec40998acdad6e7840177ce9ca6b0e1fb826ee) |
| scout | `submit("call_0", "node", "299523381", 26)` |  | ACCEPTED | SUCCESS | fix_1 | [0x0a1dc434…](https://explorer-studio.genlayer.com/tx/0x0a1dc43400b43f133d3506207a5392554132e03a127bdf4bacbe7e30688a33a0) |
| scout | `submit("call_0", "way", "1579773881", 2)` |  | ACCEPTED | SUCCESS | fix_2 | [0x573c674f…](https://explorer-studio.genlayer.com/tx/0x573c674f4213ba6108b47e98cb286a0dc5bcda27ab441ac8a1d65e8f6d4151e9) |
| scout | `submit("call_0", "node", "14362459727", 2)` |  | ACCEPTED | SUCCESS | fix_3 | [0xd1af0653…](https://explorer-studio.genlayer.com/tx/0xd1af06533dcbf6f95e8bc962209affd55c6bf760e6a96b4f56d3952320db0dfc) |
| scout | `submit("call_0", "node", "5215406428", 11)` |  | ACCEPTED | SUCCESS | fix_4 | [0x241dcc61…](https://explorer-studio.genlayer.com/tx/0x241dcc619f28aea1204dd85cc2810bec1899fa465b59252223b16bf8e6a6fd8b) |
| scout | `submit("call_0", "way", "517030126", 6)` |  | ACCEPTED | SUCCESS | fix_5 | [0x1c54b9be…](https://explorer-studio.genlayer.com/tx/0x1c54b9be86cbc087e8a2287a3af8f454b446ebcc708ec015d075a633ec355733) |
| scout | `submit("call_0", "node", "1251964294", 22)` |  | ACCEPTED | SUCCESS | fix_6 | [0x62eb5299…](https://explorer-studio.genlayer.com/tx/0x62eb5299043c7b32836da89a2f531855f1b1bc92948355c1082be3ecabde7fd6) |
| scout | `submit("call_0", "node", "6381240591", 10)` |  | ACCEPTED | ERROR | refused: node/6381240591 already has an eligible fix in this call (fix_0) | [0xe96264aa…](https://explorer-studio.genlayer.com/tx/0xe96264aa384c385fa8c88200b6a0f8f7c2f4b550a0843ee3969d09364e5c9572) |
| scout | `submit("call_0", "node", "6381240591", 99)` |  | ACCEPTED | ERROR | refused: node/6381240591 already has an eligible fix in this call (fix_0) | [0x11eeccc7…](https://explorer-studio.genlayer.com/tx/0x11eeccc797c4991bc116bead0a13786b0c6fa3202e009bb0349e139e9a1aacd9) |
| keeper | `confirm("fix_0")` |  | ACCEPTED | SUCCESS | awaiting_wallet | [0xb2324b61…](https://explorer-studio.genlayer.com/tx/0xb2324b616e1b94f055db5f4dc90e0a4d8309e84b2da64c5accb6fb784830658c) |
| keeper | `confirm("fix_1")` |  | ACCEPTED | SUCCESS | awaiting_wallet | [0x2a991505…](https://explorer-studio.genlayer.com/tx/0x2a991505ffd1a8601c4e50c29ae619f3265412fbc9bf86095277fb5e89993cb1) |
| keeper | `claim("fix_0")` |  | ACCEPTED | ERROR | refused: CyrlNish's OpenStreetMap profile does not publish one GenLayer wallet yet | [0x66f30e10…](https://explorer-studio.genlayer.com/tx/0x66f30e10a8b8115cd6c0ff441543457714047516ace6aa8ac975dcebd548b036) |
| keeper | `close_call("call_0")` |  | ACCEPTED | ERROR | refused: The call takes submissions until 2026-12-31 | [0xc99273c9…](https://explorer-studio.genlayer.com/tx/0xc99273c9ecedb71a1106a072d2eaa8acf21a15a52cc4f0fbc245122bae442842) |
| scout | `withdraw()` |  | ACCEPTED | SUCCESS | 100000000000000000 | [0x650b6fd3…](https://explorer-studio.genlayer.com/tx/0x650b6fd3ce5bef9216e7ae25b219b16582d4aeb9adc087ed17a30e970a91915f) |
| keeper | `withdraw()` |  | ACCEPTED | ERROR | refused: Nothing to withdraw | [0x8cb5d2fa…](https://explorer-studio.genlayer.com/tx/0x8cb5d2fa22ce895016d1207fb0a3efd0b4a019cbd70f6489f1fef021f35bfdd4) |

Accounts: sponsor `0x026E437928437F9C69B64AdF914730E8340a4Bf5`, scout `0xd68D4994B6A4C8d757E9BA08FfCc83D5071d11FB`, keeper `0x8E2EDf0da98b0BB7A6c1407837EeC83Bb411fF61`.

## Balance reconciliation

`totals()` keeps running totals (unreserved pots, reserved rewards, mapper shares held for a wallet, GEN credited but
not withdrawn); their sum must equal the contract's GEN balance on chain.

| When | Reserved | Pots | Held | Credited | Expected | On-chain balance | |
|---|---|---|---|---|---|---|---|
| the 4 GEN pot taken from the deposit | 0 GEN | 4 GEN | 0 GEN | 0 GEN | 4 GEN | 4 GEN | match |
| eligible fixes reserved from the pot | 1.5 GEN | 2.5 GEN | 0 GEN | 0 GEN | 4 GEN | 4 GEN | match |
| two fixes confirmed: scouts paid, mapper shares held | 0.5 GEN | 2.5 GEN | 0.9 GEN | 0.1 GEN | 4 GEN | 4 GEN | match |
| end of run, after the withdrawal | 0.5 GEN | 2.5 GEN | 0.9 GEN | 0 GEN | 3.9 GEN | 3.9 GEN | match |
| now (when this file was generated) | 0.5 GEN | 2.5 GEN | 0.9 GEN | 0 GEN | 3.9 GEN | 3.9 GEN | match |
