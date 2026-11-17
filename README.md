# HoursFix

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/license/mit/)

<img src="assets/hoursfix-logo.png" alt="HoursFix logo" width="96" align="right" />

**Rewards for OpenStreetMap opening-hours fixes, checked by GenLayer validators against the business's own web page,
paid only once the fix has stood.**

Map apps built on OpenStreetMap tell you a shop is open when it closed an hour ago. The `opening_hours` tag is kept
up to date by volunteers: nobody pays for that work and nobody checks it against the source. A sponsor who would happily
pay for correct hours in an area (a city, a business association, a map or delivery app) has no way to pay per fix
without someone checking each one by hand.

HoursFix makes the check and the payment a contract:

1. A **sponsor** funds a **call**: a box on the map (at most 1° a side), the kinds of places (OSM keys like
   `shop,amenity`), a window (fixes made since a date, submitted by a date), a **reward per fix**, a cap of paid fixes
   per mapper, and a **survival period**. The pot comes from the sponsor's deposit.
2. A **mapper** corrects a place's `opening_hours` on OpenStreetMap. **Anyone** (the mapper, or a scout who spots the
   fix) submits it: the element and the version that set the hours.
3. **Every validator** reads the element's full history from the OSM API and decides **in code**: the version was made
   in the window and inside the box, carries one of the call's keys, and actually changed the week the version before
   it described. Then it reads the **business's own page** (the `website` or `opening_hours:url` tag; rendered in a
   browser if a plain fetch is refused) and the model writes that page's regular weekly hours in `opening_hours`
   syntax. All values become weeks of time ranges, compared in code: the new week must **equal the page's**, and the
   week the place had **when the call's window opened** must not (otherwise there was nothing to fix, and breaking
   hours after a call opens to "fix" them earns nothing).
4. An eligible fix **reserves** the reward. After the survival period anyone **confirms** it: validators read the
   element again. Same week: **90% to the mapper, 10% to whoever submitted it**. Changed or deleted: the reward goes
   back to the pot.
5. The mapper's 90% goes to the GenLayer wallet the mapper publishes on their **OSM profile** (a line such as
   `GenLayer wallet: 0x…`); until they do, it is **held** for them and anyone can send it once the line appears. After
   the call ends the unreserved pot returns to the sponsor; a share never claimed returns 90 days later. Every share is
   credited; GEN leaves the contract only through `withdraw()`, to the caller.

**Live app:** [hoursfix-bars26.vercel.app](https://hoursfix-bars26.vercel.app). Paste any OSM node or way (or pick an
example) to see, without a wallet, every edit that changed its opening hours, the week HoursFix reads from each, and
the business page validators would check. Funding a call or submitting a fix needs MetaMask on GenLayer Studio (chain
61999) and **Test GEN** from the header.

**Contract (GenLayer Studio):** [`0xf3e17409dae4e00f94162eF8a2C8C449ba33284D`](https://explorer-studio.genlayer.com/address/0xf3e17409dae4e00f94162eF8a2C8C449ba33284D)

## Why GenLayer

- **Reading the source.** A business page says "Mon - Fri 06:30 - 22:00, Sat - Sun 08:00 - 18:00", "Monday to Friday:
  09:00 - 19:00 | Saturday: 10:00 - 17:00 | Sunday: Closed" or a table of days. Turning that into a week is a judgement
  on free text; validators each read the page and must agree on the resulting week exactly.
- **Nothing reported by an interested party.** The edit, its author, its date, the hours before the call, and later
  whether the fix still stands, are all read by every validator from OpenStreetMap itself.
- **Comparison in code.** The model never decides "match": it only writes the page's week. The `opening_hours`
  parser (weekday ranges and lists, several time ranges a day, past midnight, `off`, `24/7`, `;` and additional `,`
  rules; holidays ignored) and the comparison are deterministic, and the app ships the same parser so anyone can see how
  a value is read (`check_hours` in the contract).

## Verified live, on real London edits

`scripts/demo.mjs` ran HoursFix on GenLayer Studio with a demo call (a test wallet, test GEN; not an offer to these
mappers) over real OpenStreetMap edits made in Central and East London in November 2026. Every transaction, ruling,
page quote and reconciliation is in [`docs/REPRODUCTION.md`](docs/REPRODUCTION.md).

| Fix | Place (real OSM edit) | When the call opened → after the edit | The business's page | Ruling |
|---|---|---|---|---|
| `fix_0` | The Signal Box, Euston (node/6381240591 v10, 16 Nov) | none → `Mo-Sa 08:00-22:00; Su 09:00-21:00` | Monday–Saturday 08:00–22:00, Sunday 09:00–21:00 | **ELIGIBLE**, confirmed a day later |
| `fix_1` | PizzaExpress, Baker Street (node/299523381 v26) | none → `Mo-We 11:30-22:00; Th,Su 11:30-22:30; Fr-Sa 11:30-23:00` | the same week, day by day | **ELIGIBLE**, confirmed |
| `fix_2` | Wavelengths Leisure Centre, Deptford (way/1579773881 v2) | none → `Mo-Fr 06:30-22:00, Sa-Su 08:00-18:00` | Mon - Fri 06:30 - 22:00, Sat - Sun 08:00 - 18:00 | **ELIGIBLE**, held for its survival period |
| `fix_3` | Dr Alter, Tottenham Court Road (node/14362459727 v2) | matches the page (Sunday closed) | Mo-Fr 09:00-19:00; Sa 10:00-17:00; Su closed | INELIGIBLE: same mapper as `fix_2`, cap of one |
| `fix_4` | Pizza Pilgrims, Victoria (node/5215406428 v11) | the version did not change the week | — | INELIGIBLE: no change |
| `fix_5` | Superdrug, Cheapside (way/517030126 v6) | none → a full week | the site refused GenLayer's readers | UNCLEAR: nothing reserved, can be resubmitted |
| `fix_6` | Petit Pret, Marylebone (node/1251964294 v22) | — | — | INELIGIBLE: outside the call's box |

- **Confirmed** (`fix_0`, `fix_1`): a fresh reading a day after the edits showed the same weeks. Each paid 0.05 GEN to the
  scout who submitted it; each mapper's 0.45 GEN is held until they publish a GenLayer wallet on their OSM profile (a
  claim for The Signal Box's mapper was refused: *"CyrlNish's OpenStreetMap profile does not publish one GenLayer wallet yet"*).
- **Refused, taking nothing:** a call box larger than one degree, the same element submitted twice more, closing the
  call before its last day, and a withdrawal with nothing credited.
- `totals()` matched the contract's on-chain balance at **four points**, the last after the scout's withdrawal.

## Who can do what (and the attacks this blocks)

| Rule | Why |
|---|---|
| Only versions made in the call's window, inside its box, on places with its keys count | The sponsor pays for the area and the kinds of places it chose |
| The version must change the week the previous version described | Re-saving or reformatting someone else's fix earns nothing |
| The hours as they stood when the window opened must not already match the page | Nobody can break hours after a call opens and then "fix" them |
| The new week must equal the page's, compared in code | The model reads the page; it never decides the outcome |
| One eligible fix per element per call; a cap per mapper | No double payouts; no single mapper drains a call |
| The reward is reserved, then paid only if a fresh reading after the survival period shows the same week | Fixes reverted as wrong, or vandalism, are not paid |
| The mapper is paid only at the wallet on their own OSM profile; two different addresses count as none | Nobody can redirect a mapper's reward |
| Sites that cannot be read, or state no weekly hours, are `UNCLEAR`: nothing reserved, and the fix can be submitted again | An unreadable source never decides a payout |
| Pots come from a deposit; every share is credited; only `withdraw` sends GEN | No GEN rides on a reading, and no payout can fail halfway |
| `totals()` keeps running totals that must equal the contract's balance | Anyone can reconcile the books |

## Run it

```bash
python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
genvm-lint check contracts/hours_fix.py
python -m pytest tests/direct -q                         # 67 direct-mode tests
npm install
node scripts/deploy.mjs                                  # deploys to GenLayer Studio, prints the address
node scripts/demo.mjs <address>                          # the live demo; writes docs/demo-run.json
node scripts/reproduction.mjs                            # renders docs/REPRODUCTION.md
node scripts/verify-code.mjs <address>                   # checks the deployed code is byte-identical
cd frontend && npm run dev                               # the app on localhost:3000
```

## Limits

- Some business sites refuse automated readers (Superdrug and Specsavers did, from GenLayer Studio's validators,
  even rendered); their fixes are `UNCLEAR` and cannot be paid until the page can be read.
- Only the regular week is compared: public holidays, seasonal hours, month or date rules are outside the parser, and
  a fix that uses them is not paid.
- The page is the business's own claim; if it is out of date, a fix that matches it is still paid.
- Mappers do not publish GenLayer wallets on their OSM profiles yet, so mapper shares are held; the demo shows the held
  state, and the claim path is covered by the tests.
- GenLayer Studio only. The source carries the Bradbury testnet header switch used by our other projects.

OpenStreetMap data © OpenStreetMap contributors, available under the Open Database License.
