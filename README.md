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
   it described (for a way, its location is where its nodes were at the edit). Then it reads the **business's own
   page**: the `opening_hours:url` or `website` the place named **before the call's window opened**, so an edit that adds
   or swaps the page cannot bring its own source (rendered in a browser if a plain fetch is refused). The model writes
   that page's regular weekly hours in `opening_hours` syntax. All values become weeks of time ranges, compared in code: the new week must **equal the page's**, and the
   week the place had **when the call's window opened** must not (otherwise there was nothing to fix, and breaking
   hours after a call opens to "fix" them earns nothing).
4. An eligible fix **reserves** the reward. After the survival period anyone **confirms** it: validators read the
   element again, check that it still names the same page, and **read that page again**. Same week on both: **90% to
   the mapper, 10% to whoever submitted it**. Hours changed, page changed, the page now states another week, or the
   element deleted: the reward goes back to the pot, or straight to the sponsor if the call has closed.
5. The mapper's 90% goes to the GenLayer wallet the mapper publishes on their **OSM profile** (a line such as
   `GenLayer wallet: 0x…`); until they do, it is **held** for them and anyone can send it once the line appears. After
   the call ends the unreserved pot returns to the sponsor; a share never claimed returns 90 days later. Every share is
   credited; GEN leaves the contract only through `withdraw()`, to the caller.

**Live app:** [hoursfix-bars26.vercel.app](https://hoursfix-bars26.vercel.app). Paste any OSM node or way (or pick an
example) to see, without a wallet, every edit that changed its opening hours, the week HoursFix reads from each, and
the business page validators would check. Funding a call or submitting a fix needs MetaMask on GenLayer Studio (chain
61999) and **Test GEN** from the header.

**Contract (GenLayer Studio, v1.1):** [`0xc2B033fC1d4Ee51D9D85b3F80ece3aA534F2D885`](https://explorer-studio.genlayer.com/address/0xc2B033fC1d4Ee51D9D85b3F80ece3aA534F2D885).
v1 ([`0xf3e1…284D`](https://explorer-studio.genlayer.com/address/0xf3e17409dae4e00f94162eF8a2C8C449ba33284D)) and its run are in [`docs/v1/`](docs/v1/).

### What v1.1 changes (after review)

| Review point | v1 | v1.1 |
|---|---|---|
| A rewarded edit could supply its own authority | the page read was the one the **edit** named, so an edit could point `website` at a page its author wrote | the page read is the one the place named **before the call's window opened**; a place with none is `no_prior_website`, never paid. In the live run, Pitfield's edit swapped the café's website and set hours matching the new one; v1 paid it, v1.1 reads the earlier page |
| Confirmation did not recheck that authority | confirmation re-read only the element's hours | confirmation also checks the element still names the same page and **reads the page again**; the week must still match. An unreadable page decides nothing (the fix stays held) |
| Ways were located by today's geometry | `way/full.json` (current nodes) | the **submitted version's** node list; those nodes are used only if none changed after the edit (so today's positions are the positions at the edit), otherwise `geometry_changed`; more than 200 nodes is `way_too_large` |
| A reward reverted after the call closed stayed in the closed pot | credited to `pot`, which a closed call never returns | credited straight to the sponsor (`returned_total`); tested in `test_a_reverted_fix_after_the_call_closed_returns_to_the_sponsor` |

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

`scripts/demo.mjs` ran HoursFix v1.1 on GenLayer Studio with a demo call (a test wallet, test GEN; not an offer to these
mappers) over real OpenStreetMap edits made in Central and East London in November 2026. Every transaction, ruling,
page quote and reconciliation is in [`docs/REPRODUCTION.md`](docs/REPRODUCTION.md); the v1 run is in [`docs/v1/`](docs/v1/).

| Fix | Place (real OSM edit) | Page read (named before the window) | Ruling |
|---|---|---|---|
| `fix_0` | The Signal Box, Euston (node/6381240591 v10): none → `Mo-Sa 08:00-22:00; Su 09:00-21:00` | signalboxeuston.co.uk, named since July: the same week | **ELIGIBLE**; confirmed a day later after the element and the page were read again |
| `fix_1` | PizzaExpress, Baker Street (node/299523381 v26): none → `Mo-We 11:30-22:00; Th,Su 11:30-22:30; Fr-Sa 11:30-23:00` | pizzaexpress.com/london-baker-street, named since August: the same week | **ELIGIBLE**; confirmed |
| `fix_2` | Pitfield, Hoxton (node/4895959823 v11): none → `07:30-16:00`, **and the edit swapped the website** | friendsofourscafe.com (the earlier page), not the new pitfieldsocial.co.uk | UNCLEAR: the earlier page states no weekly hours. v1 paid this fix from the page the edit brought |
| `fix_3` | Wavelengths Leisure Centre (way/1579773881 v2), created inside the window | none | INELIGIBLE: no page before the window (way located from its 30 unchanged nodes) |
| `fix_4` | Superdrug, Cheapside (way/517030126 v6): hours **and website** added by the same edit | none | INELIGIBLE: no page before the window |
| `fix_5` | Pizza Pilgrims, Victoria (node/5215406428 v11) | — | INELIGIBLE: the version did not change the week |
| `fix_6` | Petit Pret, Marylebone (node/1251964294 v22) | — | INELIGIBLE: outside the call's box |

- **Confirmed** (`fix_0`, `fix_1`): a day after the edits, validators read each element and its page again; both
  still showed the same week. Each paid 0.05 GEN to the scout; each mapper's 0.45 GEN is held until they publish a
  GenLayer wallet on their OSM profile (a claim for The Signal Box's mapper was refused: *"CyrlNish's OpenStreetMap
  profile does not publish one GenLayer wallet yet"*).
- **Refused, taking nothing:** a call box larger than one degree, the same element submitted again, closing the call
  before its last day, and a withdrawal with nothing credited.
- `totals()` matched the contract's on-chain balance at **four points**, the last after the scout's withdrawal.
- **A MetaMask test of v1.1 from the live app**, the same steps reviewers are given: the tester funded their own Central
  London call, submitted The Signal Box's edit (`fix_7`, ELIGIBLE against the page named since July), confirmed it (the
  page read again showed the same week) and withdrew the scout's 0.05 GEN. In `docs/ui-test.json` and REPRODUCTION.
- The path where a fix is reverted after its call closed (the reward goes straight to the sponsor) is covered by
  `test_a_reverted_fix_after_the_call_closed_returns_to_the_sponsor`; it needs a call to end, which a same-day live run cannot show.

## Who can do what (and the attacks this blocks)

| Rule | Why |
|---|---|
| Only versions made in the call's window, inside its box, on places with its keys count | The sponsor pays for the area and the kinds of places it chose |
| The version must change the week the previous version described | Re-saving or reformatting someone else's fix earns nothing |
| The hours as they stood when the window opened must not already match the page | Nobody can break hours after a call opens and then "fix" them |
| The page compared is the one the place named before the window opened | An edit cannot bring, or point to, its own source |
| A way is located where its nodes were at the edit; if a node changed since, it is not eligible | The box is checked against the place as edited, not as moved later |
| The new week must equal the page's, compared in code | The model reads the page; it never decides the outcome |
| One eligible fix per element per call; a cap per mapper | No double payouts; no single mapper drains a call |
| The reward is reserved, then paid only if, after the survival period, the element shows the same week, names the same page, and that page still states that week | Fixes reverted as wrong, vandalism, or a source that changed are not paid |
| A reward reverted after the call closed goes straight to the sponsor | A closed call never strands GEN |
| The mapper is paid only at the wallet on their own OSM profile; two different addresses count as none | Nobody can redirect a mapper's reward |
| Sites that cannot be read, or state no weekly hours, are `UNCLEAR`: nothing reserved, and the fix can be submitted again | An unreadable source never decides a payout |
| Pots come from a deposit; every share is credited; only `withdraw` sends GEN | No GEN rides on a reading, and no payout can fail halfway |
| `totals()` keeps running totals that must equal the contract's balance | Anyone can reconcile the books |

## Run it

```bash
python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
genvm-lint check contracts/hours_fix.py
python -m pytest tests/direct -q                         # 77 direct-mode tests
npm install
node scripts/deploy.mjs                                  # deploys to GenLayer Studio, prints the address
node scripts/demo.mjs <address>                          # the live demo; writes docs/demo-run.json
node scripts/reproduction.mjs                            # renders docs/REPRODUCTION.md
node scripts/verify-code.mjs <address>                   # checks the deployed code is byte-identical
cd frontend && npm run dev                               # the app on localhost:3000
```

## Limits

- A place that had no web page on OSM before a call opened cannot be paid in that call, even if the edit that adds the
  page is honest; and a business that legitimately moves to a new site will be checked against the old one until a
  call opens after the change.
- Some business sites refuse automated readers (Superdrug and Specsavers did, from GenLayer Studio's validators,
  even rendered); their fixes are `UNCLEAR` and cannot be paid until the page can be read.
- Only the regular week is compared: public holidays, seasonal hours, month or date rules are outside the parser, and
  a fix that uses them is not paid.
- The page is the business's own claim; if it is out of date, a fix that matches it is still paid.
- Mappers do not publish GenLayer wallets on their OSM profiles yet, so mapper shares are held; the demo shows the held
  state, and the claim path is covered by the tests.
- GenLayer Studio only. The source carries the Bradbury testnet header switch used by our other projects.

OpenStreetMap data © OpenStreetMap contributors, available under the Open Database License.
