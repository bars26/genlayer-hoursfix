# HoursFix v1.1: reproduction

Every ruling below was made by GenLayer validators on GenLayer Studio, reading OpenStreetMap's public API and the
businesses' own web pages. Contract `0xc2B033fC1d4Ee51D9D85b3F80ece3aA534F2D885` ([explorer](https://explorer-studio.genlayer.com/address/0xc2B033fC1d4Ee51D9D85b3F80ece3aA534F2D885)); `node scripts/verify-code.mjs 0xc2B033fC1d4Ee51D9D85b3F80ece3aA534F2D885`
checks that the deployed code is byte-identical to `contracts/hours_fix.py`.

The call is a **demo call** funded by a test wallet with Studio test GEN, not an offer to these mappers. The edits, mappers
and pages are real (OpenStreetMap data © OpenStreetMap contributors, ODbL).

## The call

`call_0` "Central & East London opening hours": box south 51.47, west -0.16, north 51.54, east -0.02; places with
shop, amenity, leisure; fixes made since 2026-10-20, submitted by 2026-12-31; 0.5 GEN per fix
(90% mapper, 10% scout); at most 1 paid fix per mapper; an edit must stand 1 day.
Now: pot 3 GEN, reserved 0 GEN, paid 0.1 GEN, 2 eligible of 7 submitted.

## Every fix

"When the call opened" is the element's hours on the last version before 2026-10-20, and the page read is the one the
element named on that version; every value is shown as the week HoursFix reads (`check_hours`). v1's run is in
[`docs/v1/`](v1/).

| Fix | Place, edit | When the call opened | After the edit | The business's page | Ruling | State |
|---|---|---|---|---|---|---|
| fix_0 | The Signal Box [node/6381240591 v10](https://www.openstreetmap.org/node/6381240591/history) by CyrlNish, 2026-11-16 | (none) | Mo-Sa 08:00-22:00; Su 09:00-21:00 | Mo-Sa 08:00-22:00; Su 09:00-21:00<br>*"Monday 08:00 - 22:00 Tuesday 08:00 - 22:00 Wednesday 08:00 - 22:00 Thursday 08:00 - 22:00 Friday 08:00 - 22:00 Saturday 08:00 - 22:00 Sunday"* | **ELIGIBLE** matches_site | awaiting_wallet, 0.5 GEN |
| fix_1 | PizzaExpress [node/299523381 v26](https://www.openstreetmap.org/node/299523381/history) by JackGilmore, 2026-11-15 | (none) | Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30 | Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30<br>*"Monday 11:30 - 22:00 Tuesday 11:30 - 22:00 Wednesday 11:30 - 22:00 Thursday 11:30 - 22:30 Friday 11:30 - 23:00 Saturday 11:30 - 23:00 Sunday"* | **ELIGIBLE** matches_site | awaiting_wallet, 0.5 GEN |
| fix_2 | Pitfield [node/4895959823 v11](https://www.openstreetmap.org/node/4895959823/history) by okwithmydecay, 2026-11-16 | (none) | Mo-Su 07:30-16:00 | no weekly hours found | **UNCLEAR** no_hours_on_site | refused |
| fix_3 | Wavelengths Leisure Centre [way/1579773881 v2](https://www.openstreetmap.org/way/1579773881/history) by BaguetteYeeter, 2026-11-16 | (none) | Mo-Fr 06:30-22:00, Sa-Su 08:00-18:00 | — | **INELIGIBLE** no_prior_website | refused |
| fix_4 | Superdrug [way/517030126 v6](https://www.openstreetmap.org/way/517030126/history) by osmscstuff, 2026-11-17 | (none) | Mo-Fr 07:30-20:00; Sa 09:00-18:00; Su 12:00-18:00 | — | **INELIGIBLE** no_prior_website | refused |
| fix_5 | Pizza Pilgrims [node/5215406428 v11](https://www.openstreetmap.org/node/5215406428/history) by DrWaluigi, 2026-11-15 | (none) | Mo-We 11:30-22:30; Th-Sa 11:30-23:00; Su 12:00-21:00 | — | **INELIGIBLE** no_change | refused |
| fix_6 | Petit Pret [node/1251964294 v22](https://www.openstreetmap.org/node/1251964294/history) by BaguetteYeeter, 2026-11-16 | (none) | Mo-Fr 05:30-21:30; Sa 06:30-20:00; Su 07:00-20:00 | — | **INELIGIBLE** outside_area | refused |

- **fix_0** (The Signal Box, Euston (hours added 16 Nov; site named since July)): ELIGIBLE: The new hours match the hours on the business's own page, and the hours they replaced did not. node/6381240591 v10 (The Signal Box) by CyrlNish on 2026-11-16: '(none)' -> 'Mo-Sa 08:00-22:00; Su 09:00-21:00'. The page says Mo-Sa 08:00-22:00; Su 09:00-21:00. Reading at 2026-11-20T13:46:10 UTC, packet sha256 `5cbb5d24c93369f0e1d0f0681ad538f45086d1704816c3a3cb657c88a767cd1e`, page text sha256 `3284527621bc57a528579b66852f99831943a6524a06a568ccc06b3d6cad7d42` (4983 characters read from https://www.signalboxeuston.co.uk/). Confirmed at 2026-11-20T13:51:05 UTC: latest version v10, hours unchanged (`Mo-Sa 08:00-22:00; Su 09:00-21:00`), page unchanged, page read again: Mo-Sa 08:00-22:00; Su 09:00-21:00; mapper wallet not published; scout 0.05 GEN, mapper 0.45 GEN.
- **fix_1** (PizzaExpress, Baker Street (hours added 15 Nov; site named since August)): ELIGIBLE: The new hours match the hours on the business's own page, and the hours they replaced did not. node/299523381 v26 (PizzaExpress) by JackGilmore on 2026-11-15: '(none)' -> 'Mo-We 11:30-22:00; Th,Su 11:30-22:30; Fr-Sa 11:30-23:00'. The page says Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30. Reading at 2026-11-20T13:46:32 UTC, packet sha256 `74d7ca3b152bb113017f2ddc7b512a9ddf1eb18fc310c3745a3a6c19042c0eb9`, page text sha256 `c4ba5cd29dadbc0aacd49988e1b72b67bbc60f20fef032a31b510e461a35b2bc` (2782 characters read from https://www.pizzaexpress.com/london-baker-street). Confirmed at 2026-11-20T13:51:26 UTC: latest version v26, hours unchanged (`Mo-We 11:30-22:00; Th,Su 11:30-22:30; Fr-Sa 11:30-23:00`), page unchanged, page read again: Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30; mapper wallet not published; scout 0.05 GEN, mapper 0.45 GEN.
- **fix_2** (Pitfield, Hoxton (the edit also changed the website)): UNCLEAR: The business's page does not state regular weekly hours. node/4895959823 v11 (Pitfield) by okwithmydecay on 2026-11-16: '(none)' -> '07:30-16:00'. Reading at 2026-11-20T13:48:05 UTC, packet sha256 `799d77783a92c4fe5ae0d2dfc513f68f65c26cf4fb05fd1505f2d8835daf8a17`, page text sha256 `41de52b99b36569a001124608b9cc365622c70dc79c9a9dae323a7d92aff4795` (1640 characters read from https://www.friendsofourscafe.com/). The edit switched the place's page to https://pitfieldsocial.co.uk/; the page read was the one named before the window, https://www.friendsofourscafe.com/.
- **fix_3** (Wavelengths Leisure Centre, Deptford (way created inside the window)): INELIGIBLE: The element named no web page before the call's window opened; an edit cannot bring its own source. way/1579773881 v2 (Wavelengths Leisure Centre) by BaguetteYeeter on 2026-11-16: '(none)' -> 'Mo-Fr 06:30-22:00, Sa-Su 08:00-18:00'. Reading at 2026-11-20T13:49:10 UTC, packet sha256 `7dd26fccebe084be1f5b432720711b36a3e09e4d74053a28ddb0cf87431e56dc`. The edit switched the place's page to https://www.better.org.uk/leisure-centre/london/lewisham/wavelengths-leisure-centre; the page read was the one named before the window, (none).
- **fix_4** (Superdrug, Cheapside (website added by the same edit)): INELIGIBLE: The element named no web page before the call's window opened; an edit cannot bring its own source. way/517030126 v6 (Superdrug) by osmscstuff on 2026-11-17: '(none)' -> 'Mo-Fr 07:30-20:00; Sa 09:00-18:00; Su 12:00-18:00'. Reading at 2026-11-20T13:49:26 UTC, packet sha256 `f4887ee2acdb8989afe0896849da838383c742e4e75252da5ffa3a81a005a117`. The edit switched the place's page to https://www.superdrug.com/store/london-cheapside; the page read was the one named before the window, (none).
- **fix_5** (Pizza Pilgrims, Victoria (an edit that did not change the week)): INELIGIBLE: This version did not change the week the version before it described. node/5215406428 v11 (Pizza Pilgrims) by DrWaluigi on 2026-11-15: '(none)' -> 'Mo-We 11:30-22:30; Th-Sa 11:30-23:00; Su 12:00-21:00'. Reading at 2026-11-20T13:49:41 UTC, packet sha256 `afe1e40f68617266845c0c7cfa997fd26017a631db0ebdac1eeaab4b902faef3`. The edit switched the place's page to https://www.pizzapilgrims.co.uk/pizzerias/victoria/; the page read was the one named before the window, (none).
- **fix_6** (Petit Pret, Marylebone (outside the call's box)): INELIGIBLE: The element is outside the call's area. node/1251964294 v22 (Petit Pret) by BaguetteYeeter on 2026-11-16: '(none)' -> 'Mo-Fr 05:30-21:30; Sa 06:30-20:00; Su 07:00-20:00'. Reading at 2026-11-20T13:49:56 UTC, packet sha256 `0201ee9e1ad9c1dfdddc21ebc0ed7e40661724de62ac7393a9c93e182ee9f113`.

Check an edit yourself: `curl -s https://api.openstreetmap.org/api/0.6/node/6381240591/history.json`.

## Every transaction

A refused call is still ACCEPTED by consensus; the contract outcome is the `exec` column (`ERROR` = refused, on purpose here).

| Who | Call | GEN sent | Consensus | exec | Returned / refused | Tx |
|---|---|---|---|---|---|---|
| sponsor | `deposit()` | 4 | ACCEPTED | SUCCESS | 4000000000000000000 | [0x7f9f4e7b…](https://explorer-studio.genlayer.com/tx/0x7f9f4e7b7265a786478556b83d7c9cd750e2269bdad9ca77c5e4c6915875c010) |
| sponsor | `open_call("Central & East London opening hours", "51.47", "-0.16", "51.54", "-0.02", "shop,amenity,leisure", "2026-10-20", "2026-12-31", 0.5 GEN, 1, 1, 4 GEN)` |  | ACCEPTED | SUCCESS | call_0 | [0x3008ba16…](https://explorer-studio.genlayer.com/tx/0x3008ba164ae51f419679f76780997e16867f057796dbf92078e6dcee6f53f3ef) |
| sponsor | `open_call("Too big", "51.0", "-1.0", "52.5", "0.5", "shop", "2026-10-20", "2026-12-31", 0.5 GEN, 1, 1, 1 GEN)` |  | ACCEPTED | ERROR | refused: the box must have south < north and west < east, at most 1.0 degree a side | [0x3bbeec83…](https://explorer-studio.genlayer.com/tx/0x3bbeec83d79b113a7a7d4d1efb50696fb29258bef13768015f5515c78d02f36a) |
| scout | `submit("call_0", "node", "6381240591", 10)` |  | ACCEPTED | SUCCESS | fix_0 | [0xea23989b…](https://explorer-studio.genlayer.com/tx/0xea23989b29f2b0c065fb32d21dbfbeb1336435a8021cd28572491700ee603625) |
| scout | `submit("call_0", "node", "299523381", 26)` |  | ACCEPTED | SUCCESS | fix_1 | [0xd0f40de0…](https://explorer-studio.genlayer.com/tx/0xd0f40de0b7805c3777de0fcc32bce0d13a2be4fb476c018f5448d8ac0d24af0e) |
| scout | `submit("call_0", "node", "4895959823", 11)` |  | ACCEPTED | SUCCESS | fix_2 | [0xaaddf862…](https://explorer-studio.genlayer.com/tx/0xaaddf8625228b1539d79bf09ae11b19be45106323067774752a35c0e07457a20) |
| scout | `submit("call_0", "way", "1579773881", 2)` |  | ACCEPTED | SUCCESS | fix_3 | [0x61e6b596…](https://explorer-studio.genlayer.com/tx/0x61e6b59680dbdbf34002ba8cd6f0a038712beacde387efb14cb222f278a9dc24) |
| scout | `submit("call_0", "way", "517030126", 6)` |  | ACCEPTED | SUCCESS | fix_4 | [0x4f803c19…](https://explorer-studio.genlayer.com/tx/0x4f803c192e7ee16846ea3d6500d3a77e494216391c51ecb28364769fb35a97c4) |
| scout | `submit("call_0", "node", "5215406428", 11)` |  | ACCEPTED | SUCCESS | fix_5 | [0x24c094c7…](https://explorer-studio.genlayer.com/tx/0x24c094c794ce0e00bea8c55c23e2ed625108a49d6bb3817c154d34beba205bc9) |
| scout | `submit("call_0", "node", "1251964294", 22)` |  | ACCEPTED | SUCCESS | fix_6 | [0x715744b3…](https://explorer-studio.genlayer.com/tx/0x715744b330bc186752b303da3eacf4a140558096a59b9e4be5b23df0866b5f05) |
| scout | `submit("call_0", "node", "6381240591", 10)` |  | ACCEPTED | ERROR | refused: node/6381240591 already has an eligible fix in this call (fix_0) | [0xcf029ce7…](https://explorer-studio.genlayer.com/tx/0xcf029ce7f2e9db0a7138ca59572041356afa2a1f9b1eb8b44c306813029b3735) |
| keeper | `confirm("fix_0")` |  | ACCEPTED | SUCCESS | awaiting_wallet | [0xbca10e62…](https://explorer-studio.genlayer.com/tx/0xbca10e621e205932c81a56e81d4b936358cb5627514cee7a4993b9caae7f75e4) |
| keeper | `confirm("fix_1")` |  | ACCEPTED | SUCCESS | awaiting_wallet | [0x570b5be1…](https://explorer-studio.genlayer.com/tx/0x570b5be1573544c85cbf2620e8a1551b6799c65eef4f946fb02a0c190dbd5b1a) |
| keeper | `claim("fix_0")` |  | ACCEPTED | ERROR | refused: CyrlNish's OpenStreetMap profile does not publish one GenLayer wallet yet | [0x07b1efd6…](https://explorer-studio.genlayer.com/tx/0x07b1efd665a0c2f18370ab577004a88d6ab0b797587847ac1213fc50e9c76b47) |
| keeper | `close_call("call_0")` |  | ACCEPTED | ERROR | refused: The call takes submissions until 2026-12-31 | [0x6be3ad2e…](https://explorer-studio.genlayer.com/tx/0x6be3ad2e3bfc24e43d433e36f9497c6a030c5894892e4cff4e48e1f88f7d2bc0) |
| scout | `withdraw()` |  | ACCEPTED | SUCCESS | 100000000000000000 | [0x5d0fb25d…](https://explorer-studio.genlayer.com/tx/0x5d0fb25d554b89f41adf7836b57d79d872c9c881fa62684e887486389627c265) |
| keeper | `withdraw()` |  | ACCEPTED | ERROR | refused: Nothing to withdraw | [0xcb5bdc44…](https://explorer-studio.genlayer.com/tx/0xcb5bdc4413cff1fc9b2da89121364f868d6a117f2c9c89a4fa2788d213f4ec91) |

Accounts: sponsor `0x19759c7f72B8C6614Fb75861699BEe0e7015f044`, scout `0x1D130eAA9A48086E6CD61E1D712C7D75187DeA61`, keeper `0x8cf967abd2773D9717198D2Ec4E0040f4012e954`.

## Balance reconciliation

`totals()` keeps running totals (unreserved pots, reserved rewards, mapper shares held for a wallet, GEN credited but
not withdrawn); their sum must equal the contract's GEN balance on chain.

| When | Reserved | Pots | Held | Credited | Expected | On-chain balance | |
|---|---|---|---|---|---|---|---|
| the 4 GEN pot taken from the deposit | 0 GEN | 4 GEN | 0 GEN | 0 GEN | 4 GEN | 4 GEN | match |
| eligible fixes reserved from the pot | 1 GEN | 3 GEN | 0 GEN | 0 GEN | 4 GEN | 4 GEN | match |
| two fixes confirmed: scouts paid, mapper shares held | 0 GEN | 3 GEN | 0.9 GEN | 0.1 GEN | 4 GEN | 4 GEN | match |
| end of run, after the withdrawal | 0 GEN | 3 GEN | 0.9 GEN | 0 GEN | 3.9 GEN | 3.9 GEN | match |
| now (when this file was generated) | 0 GEN | 3 GEN | 0.9 GEN | 0 GEN | 3.9 GEN | 3.9 GEN | match |
