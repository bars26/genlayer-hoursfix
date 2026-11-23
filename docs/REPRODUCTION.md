# HoursFix v2: reproduction

Every ruling below was made by GenLayer validators on GenLayer Studio, reading OpenStreetMap's public API and the
businesses' own web pages. Contract `0x9DF30BE0de55b619abb5f3A210bAB09BA931cb96` ([explorer](https://explorer-studio.genlayer.com/address/0x9DF30BE0de55b619abb5f3A210bAB09BA931cb96)); `node scripts/verify-code.mjs 0x9DF30BE0de55b619abb5f3A210bAB09BA931cb96`
checks that the deployed code is byte-identical to `contracts/hours_fix.py`.

The call is a **demo call** funded by a test wallet with Studio test GEN, not an offer to these mappers. The edits, mappers
and pages are real (OpenStreetMap data © OpenStreetMap contributors, ODbL).

## The call

`call_0` "Central & East London opening hours (v2)": box south 51.47, west -0.16, north 51.54, east 0; places with
shop, amenity, leisure; fixes made since 2026-10-20, submitted by 2026-12-31; 0.5 GEN per fix
(90% mapper, 10% scout); at most 1 paid fix per mapper; an edit must stand 1 day.
Now: pot 3.5 GEN, reserved 0 GEN, paid 0.05 GEN, 1 eligible of 5 submitted.

## Every fix

"When the call opened" is the element's hours on the last version before 2026-10-20, and the page read is the one the
element named on that version; every value is shown as the week HoursFix reads (`check_hours`). v2 reads the page twice, its visible text (the
model) and its schema.org opening hours (code); when both exist they must agree. The v1.1 run is in
[`docs/v1.1/`](v1.1/REPRODUCTION.md), v1's in [`docs/v1/`](v1/).

| Fix | Place, edit | When the call opened | After the edit | The business's page | Ruling | State |
|---|---|---|---|---|---|---|
| fix_0 | PizzaExpress [node/299523381 v26](https://www.openstreetmap.org/node/299523381/history) by JackGilmore, 2026-11-15 | (none) | Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30 | Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30<br>text: `Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30`<br>schema.org: `Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30`<br>*"Opening hours Monday 11:30 - 22:00 Tuesday 11:30 - 22:00 Wednesday 11:30 - 22:00 Thursday 11:30 - 22:30 Friday 11:30 - 23:00 Saturday 11:30 "* | **ELIGIBLE** matches_site | awaiting_wallet, 0.5 GEN |
| fix_1 | The Signal Box [node/6381240591 v10](https://www.openstreetmap.org/node/6381240591/history) by CyrlNish, 2026-11-16 | (none) | Mo-Sa 08:00-22:00; Su 09:00-21:00 | **the two readings differ**<br>text: `Mo-Sa 08:00-22:00; Su 09:00-21:00`<br>schema.org: `Mo-Sa 08:00-21:00; Su 09:00-20:00`<br>*"Monday 08:00 - 22:00 Tuesday 08:00 - 22:00 Wednesday 08:00 - 22:00 Thursday 08:00 - 22:00 Friday 08:00 - 22:00 Saturday 08:00 - 22:00 Sunday"* | **UNCLEAR** sources_disagree | refused |
| fix_2 | OMA [node/12477919501 v4](https://www.openstreetmap.org/node/12477919501/history) by pxtrxik, 2026-11-14 | (none) | Mo-Fr 12:00-15:00,17:30-23:00; Sa 12:00-23:00; Su 12:00-22:00 | no weekly hours found<br>text: `none`<br>schema.org: `none` | **UNCLEAR** no_hours_on_site | refused |
| fix_3 | Waitrose [node/1708718478 v23](https://www.openstreetmap.org/node/1708718478/history) by thenela, 2026-11-06 | Mo-Th 07:00-22:00;Sa 08:00-21:00;Su 12:00-18:00 | Mo-Fr 07:00-22:00; Sa 08:00-21:00; Su 12:00-18:00 | — | **UNCLEAR** site_unreadable | refused |
| fix_4 | Gantry Climbing [node/11042163878 v6](https://www.openstreetmap.org/node/11042163878/history) by GeorgeHoneywood, 2026-11-20 | (none) | Mo-Fr 10:00-22:00; Sa-Su 09:00-19:00 | — | **INELIGIBLE** no_change | refused |

- **fix_0** (PizzaExpress, Baker Street: page text and schema.org state the same week): ELIGIBLE: The new hours match the hours on the business's own page, and the hours they replaced did not. node/299523381 v26 (PizzaExpress) by JackGilmore on 2026-11-15: '(none)' -> 'Mo-We 11:30-22:00; Th,Su 11:30-22:30; Fr-Sa 11:30-23:00'. The page says Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30. Reading at 2026-11-23T12:11:24 UTC, packet sha256 `ed9856017474be0e97d94963d73696d55370364874aa4df25a9e5fd4f0856873`, page text sha256 `3530e0a37b34728e196ecf98dbac97a88a49f41b0e12e636136e32d6c9c6e584` (2782 characters read from https://www.pizzaexpress.com/london-baker-street). Confirmed at 2026-11-23T12:17:26 UTC: latest version v26, hours unchanged (`Mo-We 11:30-22:00; Th,Su 11:30-22:30; Fr-Sa 11:30-23:00`), page unchanged, page read again: Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30; mapper wallet not published; scout 0.05 GEN, mapper 0.5 GEN. **Disputed** by `0xc71f5d3869b31fa9a15b653c9cdd5cbb3a44a317` at 2026-11-23T12:16:07 UTC: DISMISSED (hours unchanged, page unchanged, page read again: Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30, schema.org Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30); the stake, 0.05 GEN, joined the mapper's reward.
- **fix_1** (The Signal Box, Euston: page text and schema.org state different weeks): UNCLEAR: The business's page contradicts itself: its visible hours and its schema.org hours differ. node/6381240591 v10 (The Signal Box) by CyrlNish on 2026-11-16: '(none)' -> 'Mo-Sa 08:00-22:00; Su 09:00-21:00'. Reading at 2026-11-23T12:13:27 UTC, packet sha256 `23167b86f25605d238a50596572603c80d2132644275e006aaee47e93f5a5454`, page text sha256 `3284527621bc57a528579b66852f99831943a6524a06a568ccc06b3d6cad7d42` (4983 characters read from https://www.signalboxeuston.co.uk/).
- **fix_2** (Oma, Borough: hours added 14 Nov; the page shows no weekly hours to validators): UNCLEAR: The business's page does not state regular weekly hours. node/12477919501 v4 (OMA) by pxtrxik on 2026-11-14: '(none)' -> 'Mo-Fr 12:00-15:00, 17:30-23:00; Sa 12:00-23:00; Su 12:00-22:00'. Reading at 2026-11-23T12:14:01 UTC, packet sha256 `e5f07ec6a0d59e73f63a76c9a6b43a89800c2888707c2800bb217861b0b5354f`, page text sha256 `a5faa022cb492c96d8f7b562e424f480287257d4a98e93e507ca4cda108bf11c` (303 characters read from https://www.oma.london/).
- **fix_3** (Waitrose, Canary Wharf: Friday fixed 6 Nov; store page): UNCLEAR: The business's page could not be read. node/1708718478 v23 (Waitrose) by thenela on 2026-11-06: 'Mo-Th 07:00-22:00;Sa 08:00-21:00;Su 12:00-18:00' -> 'Mo-Fr 07:00-22:00; Sa 08:00-21:00; Su 12:00-18:00'. Reading at 2026-11-23T12:14:29 UTC, packet sha256 `a76f646129866236ed6f7f2299139dae42f3c3e0039fb9ce2384eac985f85edc`.
- **fix_4** (Gantry Climbing, Rotherhithe: a later edit that did not change the week): INELIGIBLE: This version did not change the week the version before it described. node/11042163878 v6 (Gantry Climbing) by GeorgeHoneywood on 2026-11-20: '(none)' -> 'Mo-Fr 10:00-22:00; Sa-Su 09:00-19:00'. Reading at 2026-11-23T12:14:44 UTC, packet sha256 `b8d4bac4e4c163178cfb3a434a676f545ed734f7710e048d0f2d7fffeff225a4`. The edit switched the place's page to https://gantryclimbing.com/; the page read was the one named before the window, (none).

Check an edit yourself: `curl -s https://api.openstreetmap.org/api/0.6/node/6381240591/history.json`.

## Wallet test from the live app

MetaMask test of HoursFix v2 from the production app (hoursfix-bars26.vercel.app/?network=bradbury) on Bradbury testnet, contract 0x17BC5f1522b6286c1AA336Ff022EEAf10FafEc17, five validators per transaction, 2026-11-23 12:28-12:36 UTC. The tester funded their own Central London call, submitted a real edit, disputed it with a stake, confirmed it and withdrew the scout's share. Every transaction was accepted by a majority; a validator that ran out of time or disagreed is shown. Wallet `0x4F80B5c475fcEd34fc9A07FfCcF39E1Adc1406bf`, on Bradbury testnet.

| Step | GEN sent | Result | Tx |
|---|---|---|---|
| Deposit 0.3 GEN (sent by the app before opening the call) | 0.3 GEN | credited to the tester; 4/5 returned (timeout) | [0x6113db4b…](https://explorer-bradbury.genlayer.com/tx/0x6113db4bf52811b45a79c0e76f85d2cc2c5f775b9555ea288aa25fd66ee309c9) |
| Open a call: Central London, shops/amenities/leisure, fixes since 2026-10-20, 0.1 GEN per fix, pot 0.3 GEN from the deposit, survival 1 day |  | call_1 open; 4/5 returned (timeout) | [0x9a7904fd…](https://explorer-bradbury.genlayer.com/tx/0x9a7904fd7c9ab42c855c30cb6879c7ea2820dc3e5dee37d10c9a70964d372fbd) |
| Submit PizzaExpress, Baker Street (node/299523381 v26) to call_1 |  | fix_2 ELIGIBLE matches_site: page text and schema.org both Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30; 0.1 GEN reserved; 4/5 returned (disagree) | [0xa2c0b432…](https://explorer-bradbury.genlayer.com/tx/0xa2c0b4329eff3715b0ae39a51b5abb0f5036caa08d57610d110de8ef855b8f6a) |
| Deposit the 0.01 GEN dispute stake (sent by the app before the dispute) | 0.01 GEN | credited; 5/5 returned | [0x6a635134…](https://explorer-bradbury.genlayer.com/tx/0x6a6351346c5a893b60b149cd8521e80c00c927e35204ab205965ca43b173e391) |
| Dispute fix_2 (stake 10% of the reward) |  | DISMISSED: element, page and both page readings unchanged; the 0.01 GEN stake joined the mapper's reward; 3/5 returned (timeout, disagree) | [0x03944f0e…](https://explorer-bradbury.genlayer.com/tx/0x03944f0e4c8d06292e31581159ab9dc17a0715972f69b3b05db6ee1155faf094) |
| Confirm fix_2 |  | awaiting_wallet: 0.01 GEN credited to the tester as scout, the mapper's 0.09 + 0.01 GEN held for a wallet on JackGilmore's OSM profile; 3/5 returned (disagree, timeout) | [0x6cd7ba2c…](https://explorer-bradbury.genlayer.com/tx/0x6cd7ba2c9f2678b7448f90953f4e45129ba134cefb1a8efc9aef6cd429b98d46) |
| Withdraw |  | 0.01 GEN sent to the tester; 4/5 returned (timeout) | [0xc084241e…](https://explorer-bradbury.genlayer.com/tx/0xc084241e10cfb0dd18793a69972b9b84cae931254a463039fe1d73bb7c5a39b5) |

## The same contract on Bradbury testnet

Contract `0x17BC5f1522b6286c1AA336Ff022EEAf10FafEc17` ([explorer](https://explorer-bradbury.genlayer.com/address/0x17BC5f1522b6286c1AA336Ff022EEAf10FafEc17)), generated from `contracts/hours_fix.py` by
`scripts/bradbury_source.py` and checked byte-identical by `node scripts/verify-code-bradbury.mjs 0x17BC5f1522b6286c1AA336Ff022EEAf10FafEc17`. Five
independent Bradbury validators read OpenStreetMap and the business's page. Bradbury reports each decision, the execution
result and the votes, not return values, so every ruling below was read back from the contract.

| Fix | Place | Ruling | State | Dispute |
|---|---|---|---|---|
| fix_0 | PizzaExpress, Baker Street: page text and schema.org state the same week | **ELIGIBLE** matches_site | awaiting_wallet | DISMISSED, read again: Mo-We 11:30-22:00; Th 11:30-22:30; Fr-Sa 11:30-23:00; Su 11:30-22:30 |
| fix_1 | Gantry Climbing, Rotherhithe: a later edit that did not change the week | **INELIGIBLE** no_change | refused |  |

| Who | Call | GEN sent | Decision | Execution | Votes | Seconds | Tx |
|---|---|---|---|---|---|---|---|
| sponsor | `deposit()` | 1.0000 | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/RETURN/RETURN/RETURN | 38 | [0xeaeab22a…](https://explorer-bradbury.genlayer.com/tx/0xeaeab22aad09ae89caaf952aadb6939db6c14a18a30203f1aa3dff4e8859f30c) |
| sponsor | `open_call("Too big", "51.0", "-1.0", "52.5", "0.5", "shop", "2026-10-20", "2026-12-31", "2` |  | ACCEPTED | FINISHED_WITH_ERROR | ERROR/ERROR/TIMEOUT/ERROR/ERROR | 42 | [0x9bb6c31e…](https://explorer-bradbury.genlayer.com/tx/0x9bb6c31e93f7d3e10ed9c096c9eba3a357bbde678c70481f1f6f68fa9b741ff1) |
| sponsor | `open_call("Central & East London opening hours (Bradbury)", "51.47", "-0.16", "51.54", "0.` |  | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/RETURN/RETURN/TIMEOUT | 33 | [0xe67b6eff…](https://explorer-bradbury.genlayer.com/tx/0xe67b6eff840ae06fe494710f0c589b6047e14751b40230cb1ff5508d8e48bebc) |
| scout | `submit("call_0", "node", "299523381", 26)` |  | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/RETURN/RETURN/RETURN | 65 | [0x8e2cdc77…](https://explorer-bradbury.genlayer.com/tx/0x8e2cdc77e060e18485a0f086147e1c41f63e902f94099c4625749d3b6d29e093) |
| scout | `submit("call_0", "node", "11042163878", 6)` |  | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/RETURN/RETURN/TIMEOUT | 31 | [0x685a3662…](https://explorer-bradbury.genlayer.com/tx/0x685a3662dd8e8efda789d8d9227e72dd3c879a33390bb528c80abd5020283c1b) |
| disputer | `deposit()` | 0.0500 | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/TIMEOUT/RETURN/RETURN | 30 | [0x59631036…](https://explorer-bradbury.genlayer.com/tx/0x5963103689cbfb65356502d0dfd9a696cf18227f3f26e6694e5767d93d4d61d0) |
| disputer | `dispute("fix_0")` |  | ACCEPTED | FINISHED_WITH_RETURN | NONDET_DISAGREE/TIMEOUT/RETURN/RETURN/RETURN | 56 | [0x2b672d0d…](https://explorer-bradbury.genlayer.com/tx/0x2b672d0d60edc63cf5dce580e98e5fd682bb2362aafd9425b749c7f88a9397f8) |
| scout | `confirm("fix_0")` |  | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/TIMEOUT/RETURN/TIMEOUT | 39 | [0x796ba7d3…](https://explorer-bradbury.genlayer.com/tx/0x796ba7d3619cad1504f9580ae0ac733916db9106998ba2c0d192ffe5a3c51e82) |
| scout | `claim("fix_0")` |  | ACCEPTED | FINISHED_WITH_ERROR | ERROR/ERROR/TIMEOUT/ERROR/ERROR | 31 | [0xef82f1ec…](https://explorer-bradbury.genlayer.com/tx/0xef82f1ec850b76c597ac42f970c2026129ed013544c4fc7e8856b16476b444de) |
| scout | `withdraw()` |  | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/RETURN/RETURN/RETURN | 33 | [0xb79c6293…](https://explorer-bradbury.genlayer.com/tx/0xb79c6293bb5ac175a767c9e2dec2c82f48623817831e9c06e25a94cba1b85e8e) |
| sponsor | `withdraw()` |  | ACCEPTED | FINISHED_WITH_RETURN | RETURN/RETURN/RETURN/TIMEOUT/RETURN | 29 | [0x66507d2b…](https://explorer-bradbury.genlayer.com/tx/0x66507d2bd05f0f4ac4857da7a802b6efa9b19e7132ef05e3ccea5279f9f8a301) |

| When | Expected (pots + reserved + held + credited) | On-chain balance | |
|---|---|---|---|
| call open: 0.5 GEN pot, 0.5 GEN still credited to the sponsor | 1 GEN | 1 GEN | match |
| an eligible fix reserved from the pot | 1 GEN | 1 GEN | match |
| after the dispute | 1.05 GEN | 1.05 GEN | match |
| confirmed: the scout credited, the mapper's share held | 1.05 GEN | 1.05 GEN | match |
| end of run, after the withdrawals | 0.525 GEN | 0.525 GEN | match |

Accounts: sponsor `0x8A52cD7EE73EA27BFA45BD908607860a24E661F8`, scout `0x1cfF3f6F0E1aeA4665D1E133372171637e6f0Fc2`, disputer `0x463Dc91Ce7fFDDade35866d89E0a4EbA410f62d6`.

## Every transaction on Studio

A refused call is still ACCEPTED by consensus; the contract outcome is the `exec` column (`ERROR` = refused, on purpose here).

| Who | Call | GEN sent | Consensus | exec | Returned / refused | Tx |
|---|---|---|---|---|---|---|
| sponsor | `deposit()` | 4 | ACCEPTED | SUCCESS | 4000000000000000000 | [0x21746e4d…](https://explorer-studio.genlayer.com/tx/0x21746e4d34f429b5a9fdaf69b20445037311e3c1bea175bbf2f86701345e3dd6) |
| sponsor | `open_call("Central & East London opening hours (v2)", "51.47", "-0.16", "51.54", "0.0", "shop,amenity,leisure", "2026-10-20", "2026-12-31", 0.5 GEN, 1, 1, 4 GEN)` |  | ACCEPTED | SUCCESS | call_0 | [0x1ac08a43…](https://explorer-studio.genlayer.com/tx/0x1ac08a43a5682733c0a270990df4433694a765ac7938a8d2ac6f58a7b9746f0e) |
| sponsor | `open_call("Too big", "51.0", "-1.0", "52.5", "0.5", "shop", "2026-10-20", "2026-12-31", 0.5 GEN, 1, 1, 1 GEN)` |  | ACCEPTED | ERROR | refused: the box must have south < north and west < east, at most 1.0 degree a side | [0x3bf64dad…](https://explorer-studio.genlayer.com/tx/0x3bf64dad745a2b7bba69afe5de16986c80e9a51ce594fc21c37f1fab4d487367) |
| scout | `submit("call_0", "node", "299523381", 26)` |  | ACCEPTED | SUCCESS | fix_0 | [0xf6b6d119…](https://explorer-studio.genlayer.com/tx/0xf6b6d11948eca74b7be5e98391cd82b0689f8de098fcdea5f46bf01b6317f152) |
| scout | `submit("call_0", "node", "6381240591", 10)` |  | ACCEPTED | SUCCESS | fix_1 | [0x8e6d23a3…](https://explorer-studio.genlayer.com/tx/0x8e6d23a341175d80a4357ebd8979f4c96b0f1abee0c9dd5f3522fad706aa5157) |
| scout | `submit("call_0", "node", "12477919501", 4)` |  | ACCEPTED | SUCCESS | fix_2 | [0x24350ebe…](https://explorer-studio.genlayer.com/tx/0x24350ebe0324381ee7e342e981aef9b061a11eba640e75d114b7a259090b317e) |
| scout | `submit("call_0", "node", "1708718478", 23)` |  | ACCEPTED | SUCCESS | fix_3 | [0x7f6406e2…](https://explorer-studio.genlayer.com/tx/0x7f6406e2258d2e5143fc0504c3203b65185c92fba7b573c6e64feb129f23da5a) |
| scout | `submit("call_0", "node", "11042163878", 6)` |  | ACCEPTED | SUCCESS | fix_4 | [0xea4cbc5c…](https://explorer-studio.genlayer.com/tx/0xea4cbc5c9187beea6d82b515db8f720304a9ca84aeab62b8f03c1d04a7c55146) |
| scout | `submit("call_0", "node", "299523381", 26)` |  | ACCEPTED | ERROR | refused: node/299523381 already has an eligible fix in this call (fix_0) | [0x3cec18c7…](https://explorer-studio.genlayer.com/tx/0x3cec18c7a29578e5d7937931defc2dbcce5b852c1f498d0a19d5dcb9b4ea7e92) |
| keeper | `deposit()` | 0.1 | ACCEPTED | SUCCESS | 100000000000000000 | [0x0366a161…](https://explorer-studio.genlayer.com/tx/0x0366a16170f10ec80c9954e60ff8ac61494644af31fceb7e5a3550c8abe595fd) |
| keeper | `dispute("fix_0")` |  | ACCEPTED | SUCCESS | DISMISSED | [0x1cf740ba…](https://explorer-studio.genlayer.com/tx/0x1cf740ba2f229bfe6b0f55cf321a32f77f8d3809131f653a07f083fd903fa672) |
| keeper | `dispute("fix_0")` |  | ACCEPTED | ERROR | refused: This fix has been disputed already | [0xc57a6b9b…](https://explorer-studio.genlayer.com/tx/0xc57a6b9b87d3d211e4871da69372e3f783489cede60f3a4b30455af8486d530e) |
| keeper | `confirm("fix_0")` |  | ACCEPTED | SUCCESS | awaiting_wallet | [0x95e93705…](https://explorer-studio.genlayer.com/tx/0x95e93705583d3faa18b8ed05ddcad2cb96cd22c7259b7877f143f4338116e68c) |
| keeper | `confirm("fix_2")` |  | ACCEPTED | ERROR | refused: This fix is not waiting for confirmation | [0x04e991d2…](https://explorer-studio.genlayer.com/tx/0x04e991d2354f28edb07b9728315e11e90d64fe02bc3fd18c385d5526fd8b8cb5) |
| keeper | `dispute("fix_0")` |  | ACCEPTED | ERROR | refused: Only a fix waiting for confirmation can be disputed | [0x19f961be…](https://explorer-studio.genlayer.com/tx/0x19f961bea17ec4724d46a3cad1b35d4e6aff35b304612a13008abd641782543a) |
| keeper | `claim("fix_0")` |  | ACCEPTED | ERROR | refused: JackGilmore's OpenStreetMap profile does not publish one GenLayer wallet yet | [0xb180268a…](https://explorer-studio.genlayer.com/tx/0xb180268a1e63d24d1f7d66d7cdee0e8d0084bec5afbcce8ddd22c97bc4e27d1a) |
| keeper | `close_call("call_0")` |  | ACCEPTED | ERROR | refused: The call takes submissions until 2026-12-31 | [0x53bd6f1e…](https://explorer-studio.genlayer.com/tx/0x53bd6f1eb28c972462ee044db98ee413d5beaa69c92b2246dd2854c63062d68f) |
| scout | `withdraw()` |  | ACCEPTED | SUCCESS | 50000000000000000 | [0x8f3e1eee…](https://explorer-studio.genlayer.com/tx/0x8f3e1eeee7747e8317ce701336e22d2641ca8be7dcdb446ae32cc6af938c9653) |
| keeper | `withdraw()` |  | ACCEPTED | SUCCESS | 50000000000000000 | [0x2a3df4d4…](https://explorer-studio.genlayer.com/tx/0x2a3df4d4671b23168526dc80100f144a74e274b4a37f507c857c5e29b9560361) |

Accounts: sponsor `0x2E023a9a1546c798CfFea231a42565Ac3367Cb10`, scout `0xC045405230dCcd317e7AB9e43bf4276F42B8c271`, keeper `0xc71f5D3869B31fA9a15b653C9cdd5cBb3a44A317`.

## Balance reconciliation

`totals()` keeps running totals (unreserved pots, reserved rewards, mapper shares held for a wallet, GEN credited but
not withdrawn); their sum must equal the contract's GEN balance on chain.

| When | Reserved | Pots | Held | Credited | Expected | On-chain balance | |
|---|---|---|---|---|---|---|---|
| the 4 GEN pot taken from the deposit | 0 GEN | 4 GEN | 0 GEN | 0 GEN | 4 GEN | 4 GEN | match |
| eligible fixes reserved from the pot | 0.5 GEN | 3.5 GEN | 0 GEN | 0 GEN | 4 GEN | 4 GEN | match |
| a dismissed dispute: the stake reserved for the mapper | 0.55 GEN | 3.5 GEN | 0 GEN | 0.05 GEN | 4.1 GEN | 4.1 GEN | match |
| the fix confirmed: scout credited, mapper share (with the stake) held | 0 GEN | 3.5 GEN | 0.5 GEN | 0.1 GEN | 4.1 GEN | 4.1 GEN | match |
| end of run, after the withdrawals | 0 GEN | 3.5 GEN | 0.5 GEN | 0 GEN | 4 GEN | 4 GEN | match |
| now (when this file was generated) | 0 GEN | 3.5 GEN | 0.5 GEN | 0 GEN | 4 GEN | 4 GEN | match |
