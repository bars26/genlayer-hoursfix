"""Direct-mode tests for the HoursFix contract: rewards for OpenStreetMap opening-hours fixes that match the business's
own web page and survive."""

import json
import re
from datetime import datetime, timedelta, timezone

import pytest

from tests.direct.conftest import CONTRACT_PATH, llm_json, to_hex

GEN = 10**18
OSM = "https://api.openstreetmap.org/api/0.6"
REWARD = GEN // 2
POT = 3 * GEN
# London: south, west, north, east
BOX = ("51.49", "-0.16", "51.53", "-0.07")
SITE = "https://www.superdrug.com/store/london-cheapside"
SITE_HOURS = "Mo-Fr 07:30-20:00; Sa 09:00-18:00; Su 12:00-18:00"
PAGE = ("<html><body><nav>Menu</nav><h1>Superdrug Cheapside</h1><h2>Store opening hours</h2>"
        "<p>Monday 07:30 - 20:00 Tuesday 07:30 - 20:00 Wednesday 07:30 - 20:00 Thursday 07:30 - 20:00 Friday 07:30 - 20:00 "
        "Saturday 09:00 - 18:00 Sunday 12:00 - 18:00</p><script>track()</script></body></html>")
MAPPER_UID = 4242


def _day(n):
    return (datetime.now(timezone.utc) + timedelta(days=n)).strftime("%Y-%m-%d")


def _ts(days):
    return (datetime.now(timezone.utc) + timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")


SINCE, ENDS = _day(-30), _day(30)


def _get(direct_vm, url, body, status=200, raw=None):
    payload = raw.encode() if raw is not None else json.dumps(body).encode()
    direct_vm.mock_web("^" + re.escape(url) + "$", {"method": "GET", "response": {
        "status": status, "headers": {"Content-Type": b"application/json"}, "body": payload}})


def _version(v, ts, oh=None, uid=MAPPER_UID, user="mapper_a", tags=None, lat=51.5144, lon=-0.0945):
    t = {"shop": "chemist", "name": "Superdrug", "website": SITE, "addr:street": "Cheapside"}
    if oh is not None:
        t["opening_hours"] = oh
    t.update(tags or {})
    t = {k: v for k, v in t.items() if v is not None}
    return {"type": "node", "id": 1001, "version": v, "timestamp": ts, "uid": uid, "user": user, "changeset": 900 + v,
            "lat": lat, "lon": lon, "tags": t}


def _history(direct_vm, versions, kind="node", eid=1001, status=200):
    _get(direct_vm, f"{OSM}/{kind}/{eid}/history.json", {"elements": versions}, status)


def _user(direct_vm, description="", uid=MAPPER_UID):
    _get(direct_vm, f"{OSM}/user/{uid}.json", {"user": {"id": uid, "display_name": "mapper_a", "description": description,
                                                          "account_created": "2019-01-01T00:00:00Z"}})


def _page(direct_vm, page=PAGE, status=200, url=SITE):
    _get(direct_vm, url, None, status, raw=page)


def _llm(direct_vm, found=True, oh=SITE_HOURS, raw=None):
    direct_vm.mock_llm(r".*", raw if raw is not None else llm_json({"found": found, "opening_hours": oh, "quote": "Monday 07:30 - 20:00 …"}))


# The default case: the hours were missing for months, the mapper added them 3 days ago, and they match the page.
DEFAULT = [_version(1, _ts(-200)), _version(2, _ts(-3), oh=SITE_HOURS)]


def _setup(direct_vm, versions=None, page=PAGE, page_status=200, found=True, oh=SITE_HOURS, llm_raw=None, history_status=200, description=""):
    direct_vm.clear_mocks()
    _history(direct_vm, DEFAULT if versions is None else versions, status=history_status)
    _page(direct_vm, page, page_status)
    _user(direct_vm, description)
    _llm(direct_vm, found, oh, llm_raw)


def _deposit(direct_vm, contract, who, amount):
    if amount:
        direct_vm.sender, direct_vm.value = who, amount
        contract.deposit()
        direct_vm.value = 0


def _owed(contract, who):
    return int(contract.owed_to(to_hex(who).lower()))


def _open(direct_vm, direct_deploy, sponsor, deposit=POT, expect=None, **terms):
    direct_vm.sender = sponsor
    contract = direct_deploy(CONTRACT_PATH)
    _deposit(direct_vm, contract, sponsor, deposit)
    args = dict(title="London opening hours", south=BOX[0], west=BOX[1], north=BOX[2], east=BOX[3], keys="shop,amenity",
                since=SINCE, ends=ENDS, reward=REWARD, per_mapper=2, survival_days=1, pot=POT)
    args.update(terms)
    direct_vm.sender = sponsor
    if expect:
        with direct_vm.expect_revert(expect):
            contract.open_call(*args.values())
        return contract, None
    return contract, contract.open_call(*args.values())


def _submit(direct_vm, contract, call_id, scout, kind="node", eid="1001", version=2, expect=None, **setup):
    _setup(direct_vm, **setup)
    direct_vm.sender = scout
    if expect:
        with direct_vm.expect_revert(expect):
            contract.submit(call_id, kind, eid, version)
        return None
    return contract.submit(call_id, kind, eid, version)


def _balance(contract):
    t = json.loads(contract.totals())
    assert int(t["expected_balance"]) == sum(int(t[k]) for k in ("pots", "reserved", "held", "owed"))
    return t


def _ripen(contract, fix_id):
    contract.fixes[fix_id].held_until = "2000-01-01T00:00:00"


# --- the opening_hours parser ----------------------------------------------------------------------------------------


@pytest.mark.parametrize("text, week", [
    ("Mo-Fr 07:30-20:00; Sa 09:00-18:00; Su 12:00-18:00", "Mo-Fr 07:30-20:00; Sa 09:00-18:00; Su 12:00-18:00"),
    ("Mo-Su 11:30-22:00; Fr,Sa 11:30-23:00", "Mo-Th 11:30-22:00; Fr-Sa 11:30-23:00; Su 11:30-22:00"),
    ("Mo-Fr 06:30-22:00, Sa-Su 08:00-18:00", "Mo-Fr 06:30-22:00; Sa-Su 08:00-18:00"),
    ("07:30-16:00", "Mo-Su 07:30-16:00"),
    ("24/7", "Mo-Su 00:00-24:00"),
    ("Mo-Fr 11:00-00:00", "Mo-Fr 11:00-24:00; Sa-Su off"),
    ("Fr-Sa 22:00-03:00; PH off", "Mo-Th off; Fr 22:00-24:00; Sa 00:00-03:00,22:00-24:00; Su 00:00-03:00"),
    ("Mo-Fr 09:00-12:00,13:00-17:00; Sa off", "Mo-Fr 09:00-12:00,13:00-17:00; Sa-Su off"),
    ("Su-Tu 10:00-12:00", "Mo-Tu 10:00-12:00; We-Sa off; Su 10:00-12:00"),
    ("Mon-Sat 9:30-18:00", ""),
    ("Mo-Fr 6:30-22:00", ""),
    ("Jan-Mar Mo-Fr 09:00-17:00", ""),
    ("sunrise-sunset", ""),
])
def test_check_hours(direct_vm, direct_deploy, direct_alice, text, week):
    contract, _ = _open(direct_vm, direct_deploy, direct_alice)
    assert contract.check_hours(text) == week


# --- calls ------------------------------------------------------------------------------------------------------------


def test_open_call_takes_the_pot_from_the_deposit(direct_vm, direct_deploy, direct_alice):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice)
    c = contract.get_call(call_id)
    assert (call_id, c.state, int(c.pot), int(c.reward), json.loads(c.keys_json)) == ("call_0", "open", POT, REWARD, ["shop", "amenity"])
    assert json.loads(c.box_json) == [51.49, -0.16, 51.53, -0.07]
    assert _owed(contract, direct_alice) == 0
    assert int(_balance(contract)["pots"]) == POT


@pytest.mark.parametrize("terms, reason", [
    (dict(title="x"), "title must be 3 to 80 characters"),
    (dict(north="51.40"), "the box must have south < north"),
    (dict(east="1.5"), "at most 1.0 degree a side"),
    (dict(south="abc"), "south must be a number"),
    (dict(keys="Shop!"), "keys must be up to 6 OSM keys"),
    (dict(since=_day(-120)), "since must be at most 90 days back"),
    (dict(since=_day(40)), "since must be at most 90 days back and not after ends"),
    (dict(ends=_day(-1)), "ends must be today or later"),
    (dict(ends="2026-02-30"), "ends must be a real calendar date"),
    (dict(reward=10), "reward must be a whole number"),
    (dict(pot=REWARD - 1), "pot must be a whole number"),
    (dict(survival_days=0), "survival_days must be a whole number from 1 to 60"),
    (dict(pot=5 * GEN), "deposit first: 5 GEN needed, 3 GEN credited"),
])
def test_invalid_calls_are_refused(direct_vm, direct_deploy, direct_alice, terms, reason):
    contract, _ = _open(direct_vm, direct_deploy, direct_alice, expect=reason, **terms)
    assert _owed(contract, direct_alice) == POT


# --- submissions ------------------------------------------------------------------------------------------------------


def test_an_eligible_fix_reserves_the_reward(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice)
    fix_id = _submit(direct_vm, contract, call_id, direct_bob)
    f = contract.get_fix(fix_id)
    assert (f.verdict, f.code, f.state, f.element, int(f.version), f.mapper, f.mapper_uid) == (
        "ELIGIBLE", "matches_site", "held", "node/1001", 2, "mapper_a", str(MAPPER_UID))
    assert int(f.reward) == REWARD and to_hex(f.scout) == to_hex(direct_bob)
    r = json.loads(f.reading_json)
    assert r["weeks"] == {"new": SITE_HOURS, "old": "", "site": SITE_HOURS}
    assert r["site"]["found"] and r["facts"]["website"] == SITE and len(r["packet_sha256"]) == 64
    assert "match the hours on the business's own page" in f.why and "'(none)' -> '" in f.why
    c = contract.get_call(call_id)
    assert (int(c.pot), int(c.reserved), int(c.n_eligible)) == (POT - REWARD, REWARD, 1)
    t = _balance(contract)
    assert (int(t["pots"]), int(t["reserved"])) == (POT - REWARD, REWARD)


def _way(direct_vm, nodes, node_rows):
    """A way (id 77) whose version 2 is the fix; `node_rows` is what OSM returns for its nodes today."""
    way = [dict(v, type="way", id=77, nodes=nodes) for v in DEFAULT]
    for v in way:
        v.pop("lat"), v.pop("lon")
    direct_vm.clear_mocks()
    _history(direct_vm, way, kind="way", eid=77)
    ids = ",".join(sorted(set(str(n) for n in nodes)))
    _get(direct_vm, f"{OSM}/nodes.json?nodes={ids}", {"elements": node_rows})
    _page(direct_vm)
    _user(direct_vm)
    _llm(direct_vm)


def test_a_way_is_located_where_its_nodes_were_at_the_edit(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice)
    _way(direct_vm, [1, 2, 1], [{"type": "node", "id": 1, "lat": 51.514, "lon": -0.095, "timestamp": _ts(-300)},
                                {"type": "node", "id": 2, "lat": 51.516, "lon": -0.093, "timestamp": _ts(-300)}])
    direct_vm.sender = direct_bob
    fix_id = contract.submit(call_id, "way", "77", 2)
    f = json.loads(contract.get_fix(fix_id).reading_json)["facts"]
    assert (contract.get_fix(fix_id).verdict, f["lat"], f["lon"]) == ("ELIGIBLE", 51.515, -0.094)


@pytest.mark.parametrize("nodes, rows, code", [
    # a node moved (or was edited) after the edit: where the way was at the edit cannot be shown
    ([1, 2], [{"type": "node", "id": 1, "lat": 51.514, "lon": -0.095, "timestamp": _ts(-300)},
              {"type": "node", "id": 2, "lat": 48.85, "lon": 2.35, "timestamp": _ts(-1)}], "geometry_changed"),
    ([1, 2], [{"type": "node", "id": 1, "lat": 51.514, "lon": -0.095, "timestamp": _ts(-300)}], "geometry_changed"),
    (list(range(1, 202)), [], "way_too_large"),
])
def test_ways_whose_location_at_the_edit_cannot_be_shown_are_not_eligible(direct_vm, direct_deploy, direct_alice, direct_bob, nodes, rows, code):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice)
    _way(direct_vm, nodes, rows)
    direct_vm.sender = direct_bob
    fix_id = contract.submit(call_id, "way", "77", 2)
    assert (contract.get_fix(fix_id).verdict, contract.get_fix(fix_id).code) == ("INELIGIBLE", code)


@pytest.mark.parametrize("setup, verdict, code", [
    (dict(versions=[_version(1, _ts(-200)), _version(2, _ts(-40), oh=SITE_HOURS)]), "INELIGIBLE", "outside_dates"),
    (dict(versions=[_version(1, _ts(-200), oh=SITE_HOURS), _version(2, _ts(-3))]), "INELIGIBLE", "no_hours"),
    (dict(versions=[_version(1, _ts(-200)), _version(2, _ts(-5), oh=SITE_HOURS.replace("; ", ", ")), _version(3, _ts(-3), oh=SITE_HOURS)], version=3), "INELIGIBLE", "no_change"),
    (dict(versions=[_version(1, _ts(-200)), _version(2, _ts(-3), oh=SITE_HOURS, tags={"shop": None, "office": "lawyer"})]), "INELIGIBLE", "wrong_kind"),
    (dict(versions=[_version(1, _ts(-200)), _version(2, _ts(-3), oh=SITE_HOURS, lat=48.85, lon=2.35)]), "INELIGIBLE", "outside_area"),
    (dict(versions=[_version(1, _ts(-200)), _version(2, _ts(-3), oh="Mon-Fri 9-5")]), "INELIGIBLE", "new_unparsed"),
    (dict(oh="Mo-Fr 08:00-20:00; Sa 09:00-18:00; Su 12:00-18:00"), "INELIGIBLE", "does_not_match_site"),
    (dict(versions=[_version(1, _ts(-200), oh=SITE_HOURS), _version(2, _ts(-5), oh="Mo-Fr 01:00-02:00"), _version(3, _ts(-3), oh=SITE_HOURS)], version=3), "INELIGIBLE", "already_correct"),
    (dict(versions=[_version(1, _ts(-200), tags={"website": None}), _version(2, _ts(-3), oh=SITE_HOURS)]), "INELIGIBLE", "no_prior_website"),
    (dict(versions=[_version(2, _ts(-3), oh=SITE_HOURS)]), "INELIGIBLE", "no_prior_website"),  # created inside the window
    (dict(page_status=403, page=""), "UNCLEAR", "site_unreadable"),
    (dict(found=False, oh=""), "UNCLEAR", "no_hours_on_site"),
    (dict(oh="Mon to Fri 7.30am to 8pm"), "UNCLEAR", "no_hours_on_site"),
])
def test_rulings(direct_vm, direct_deploy, direct_alice, direct_bob, setup, verdict, code):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice)
    setup = dict(setup)
    fix_id = _submit(direct_vm, contract, call_id, direct_bob, version=setup.pop("version", 2), **setup)
    f = contract.get_fix(fix_id)
    assert (f.verdict, f.code, f.state, int(f.reward)) == (verdict, code, "refused", 0)
    c = contract.get_call(call_id)
    assert (int(c.pot), int(c.reserved), int(c.n_submitted)) == (POT, 0, 1)


def test_a_fix_made_in_two_edits_is_compared_with_the_hours_before_the_call(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice)
    versions = [_version(1, _ts(-200), oh="Mo-Sa 09:00-17:00"), _version(2, _ts(-5), oh="Mo-Fr 07:30-20:00"), _version(3, _ts(-3), oh=SITE_HOURS)]
    fix_id = _submit(direct_vm, contract, call_id, direct_bob, version=3, versions=versions)
    r = json.loads(contract.get_fix(fix_id).reading_json)
    assert contract.get_fix(fix_id).verdict == "ELIGIBLE"
    assert (r["facts"]["old"], r["facts"]["previous"]) == ("Mo-Sa 09:00-17:00", "Mo-Fr 07:30-20:00")


def test_the_source_is_the_page_named_before_the_window_not_one_the_edit_brings(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice)
    evil = "https://hours-i-wrote.example/superdrug"
    versions = [_version(1, _ts(-200)), _version(2, _ts(-3), oh=SITE_HOURS, tags={"website": evil, "opening_hours:url": evil})]
    _setup(direct_vm, versions=versions)
    _page(direct_vm, url=evil, page="<p>Monday to Sunday 07:30 - 20:00 (we promise)</p>")
    direct_vm.sender = direct_bob
    fix_id = contract.submit(call_id, "node", "1001", 2)
    f = json.loads(contract.get_fix(fix_id).reading_json)["facts"]
    assert (f["website"], f["edit_website"]) == (SITE, evil)  # the page read is the one named before the window


def test_a_page_that_refuses_a_plain_fetch_is_rendered(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice)
    fix_id = _submit(direct_vm, contract, call_id, direct_bob, page_status=403)  # the browser render still reads it
    assert contract.get_fix(fix_id).verdict == "ELIGIBLE"


def test_a_fix_that_corrects_wrong_hours_is_eligible(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice)
    fix_id = _submit(direct_vm, contract, call_id, direct_bob, versions=[
        _version(1, _ts(-300), oh="Mo-Fr 09:00-20:00; Sa 10:00-20:00; Su 12:00-18:00"), _version(2, _ts(-2), oh=SITE_HOURS)])
    r = json.loads(contract.get_fix(fix_id).reading_json)
    assert contract.get_fix(fix_id).verdict == "ELIGIBLE"
    assert r["weeks"]["old"] == "Mo-Fr 09:00-20:00; Sa 10:00-20:00; Su 12:00-18:00"


@pytest.mark.parametrize("setup, reason", [
    (dict(history_status=404), "OpenStreetMap has no node/1001"),
    (dict(history_status=503), "could not be read right now"),
    (dict(llm_raw="not json at all"), "not usable"),
])
def test_failed_readings_change_nothing(direct_vm, direct_deploy, direct_alice, direct_bob, setup, reason):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice)
    _submit(direct_vm, contract, call_id, direct_bob, expect=reason, **setup)
    assert int(contract.fix_count) == 0 and int(contract.get_call(call_id).pot) == POT


def test_a_missing_version_is_refused(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice)
    _submit(direct_vm, contract, call_id, direct_bob, version=9, expect="OpenStreetMap has no node/1001 version 9")


def test_bad_submissions_are_refused_before_reading(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice)
    _submit(direct_vm, contract, call_id, direct_bob, kind="relation", expect="element_type must be node or way")
    _submit(direct_vm, contract, call_id, direct_bob, eid="12a", expect="element_type must be node or way")
    _submit(direct_vm, contract, call_id, direct_bob, version=0, expect="version must be a whole number")
    with direct_vm.expect_revert("No call with id call_9"):
        contract.submit("call_9", "node", "1001", 2)


def test_one_eligible_fix_per_element_and_a_cap_per_mapper(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice, per_mapper=1)
    _submit(direct_vm, contract, call_id, direct_bob)
    _submit(direct_vm, contract, call_id, direct_bob, expect="node/1001 already has an eligible fix in this call (fix_0)")
    other = [dict(v, id=2002) for v in DEFAULT]
    _setup(direct_vm)
    _history(direct_vm, other, eid=2002)
    direct_vm.sender = direct_bob
    fix_id = contract.submit(call_id, "node", "2002", 2)
    assert (contract.get_fix(fix_id).verdict, contract.get_fix(fix_id).code) == ("INELIGIBLE", "mapper_cap")


def test_a_fully_reserved_pot_and_an_ended_call_refuse_submissions(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice, pot=REWARD)
    _submit(direct_vm, contract, call_id, direct_bob)
    _submit(direct_vm, contract, call_id, direct_bob, eid="2002", expect="pot is fully reserved")
    contract.calls[call_id].ends = _day(-1)
    _submit(direct_vm, contract, call_id, direct_bob, eid="2002", expect="took submissions until")


# --- confirmation, wallets, payouts -------------------------------------------------------------------------------------


def _eligible(direct_vm, direct_deploy, sponsor, scout, **terms):
    contract, call_id = _open(direct_vm, direct_deploy, sponsor, **terms)
    fix_id = _submit(direct_vm, contract, call_id, scout)
    return contract, call_id, fix_id


def test_confirm_waits_for_the_survival_period(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id = _open(direct_vm, direct_deploy, direct_alice, survival_days=7)
    fix_id = _submit(direct_vm, contract, call_id, direct_bob)
    with direct_vm.expect_revert("The fix is confirmed from"):
        contract.confirm(fix_id)


def test_confirm_pays_the_scout_and_the_mapper_wallet(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, call_id, fix_id = _eligible(direct_vm, direct_deploy, direct_alice, direct_bob)
    _ripen(contract, fix_id)
    _setup(direct_vm, description=f"I map shops in the City. GenLayer wallet: {to_hex(direct_charlie)}")
    direct_vm.sender = direct_alice
    assert contract.confirm(fix_id) == "paid"
    f = contract.get_fix(fix_id)
    assert (int(f.scout_share), int(f.mapper_share), f.mapper_wallet) == (REWARD // 10, REWARD - REWARD // 10, to_hex(direct_charlie).lower())
    assert _owed(contract, direct_bob) == REWARD // 10 and _owed(contract, direct_charlie) == REWARD - REWARD // 10
    c = contract.get_call(call_id)
    assert (int(c.reserved), int(c.paid_total)) == (0, REWARD)
    assert json.loads(f.confirm_json)["same"] is True
    direct_vm.sender = direct_charlie
    assert contract.withdraw() == str(REWARD - REWARD // 10)
    t = _balance(contract)
    assert (int(t["reserved"]), int(t["withdrawn"])) == (0, REWARD - REWARD // 10)


def test_equivalent_hours_written_differently_still_count(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id, fix_id = _eligible(direct_vm, direct_deploy, direct_alice, direct_bob)
    _ripen(contract, fix_id)
    _setup(direct_vm, versions=DEFAULT + [_version(3, _ts(-1), oh="Mo-Fr 07:30-20:00, Sa 09:00-18:00, Su 12:00-18:00")])
    assert contract.confirm(fix_id) == "awaiting_wallet"


def test_a_mapper_without_a_wallet_is_held_then_claimed(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, call_id, fix_id = _eligible(direct_vm, direct_deploy, direct_alice, direct_bob)
    _ripen(contract, fix_id)
    _setup(direct_vm)
    assert contract.confirm(fix_id) == "awaiting_wallet"
    share = REWARD - REWARD // 10
    assert int(_balance(contract)["held"]) == share and _owed(contract, direct_bob) == REWARD // 10
    with direct_vm.expect_revert("profile does not publish one GenLayer wallet yet"):
        contract.claim(fix_id)
    _setup(direct_vm, description=f"genlayer wallet: {to_hex(direct_charlie)} and also GenLayer: {to_hex(direct_bob)}")
    with direct_vm.expect_revert("does not publish one GenLayer wallet yet"):
        contract.claim(fix_id)  # two different addresses count as none
    _setup(direct_vm, description=f"GenLayer wallet: {to_hex(direct_charlie)}")
    assert contract.claim(fix_id) == to_hex(direct_charlie).lower()
    assert _owed(contract, direct_charlie) == share and contract.get_fix(fix_id).state == "paid"
    assert int(_balance(contract)["held"]) == 0
    with direct_vm.expect_revert("not waiting for a wallet"):
        contract.claim(fix_id)


@pytest.mark.parametrize("latest", [
    _version(3, _ts(-1), oh="Mo-Fr 08:00-20:00; Sa 09:00-18:00; Su 12:00-18:00"),
    _version(3, _ts(-1)),
    {"type": "node", "id": 1001, "version": 3, "timestamp": _ts(-1), "uid": 1, "user": "x", "visible": False},
])
def test_a_changed_or_deleted_fix_returns_the_reward_to_the_pot(direct_vm, direct_deploy, direct_alice, direct_bob, latest):
    contract, call_id, fix_id = _eligible(direct_vm, direct_deploy, direct_alice, direct_bob)
    _ripen(contract, fix_id)
    _setup(direct_vm, versions=DEFAULT + [latest])
    assert contract.confirm(fix_id) == "reverted"
    c = contract.get_call(call_id)
    assert (int(c.pot), int(c.reserved), _owed(contract, direct_bob)) == (POT, 0, 0)
    with direct_vm.expect_revert("not waiting for confirmation"):
        contract.confirm(fix_id)
    _balance(contract)


@pytest.mark.parametrize("setup, why", [
    (dict(oh="Mo-Fr 09:00-17:00"), "the page now states another week"),
    (dict(versions=DEFAULT + [_version(3, _ts(-1), oh=SITE_HOURS, tags={"website": "https://elsewhere.example/"})]), "the element names another page"),
])
def test_confirm_rechecks_the_source(direct_vm, direct_deploy, direct_alice, direct_bob, setup, why):
    contract, call_id, fix_id = _eligible(direct_vm, direct_deploy, direct_alice, direct_bob)
    _ripen(contract, fix_id)
    _setup(direct_vm, **setup)
    assert contract.confirm(fix_id) == "reverted", why
    r = json.loads(contract.get_fix(fix_id).confirm_json)
    assert r["same"] is False and r["authority"] == SITE
    assert int(contract.get_call(call_id).pot) == POT and _owed(contract, direct_bob) == 0


def test_an_unreadable_source_at_confirmation_changes_nothing(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id, fix_id = _eligible(direct_vm, direct_deploy, direct_alice, direct_bob)
    _ripen(contract, fix_id)
    _setup(direct_vm, page="", page_status=503)
    with direct_vm.expect_revert("page could not be read right now"):
        contract.confirm(fix_id)
    _setup(direct_vm, found=False, oh="")
    with direct_vm.expect_revert("did not show its weekly hours"):
        contract.confirm(fix_id)
    assert contract.get_fix(fix_id).state == "held" and int(contract.get_call(call_id).reserved) == REWARD


def test_validators_accept_a_confirmation_quoted_differently(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id, fix_id = _eligible(direct_vm, direct_deploy, direct_alice, direct_bob)
    _ripen(contract, fix_id)
    _setup(direct_vm)
    contract.confirm(fix_id)
    r = json.loads(contract.get_fix(fix_id).confirm_json)
    r.pop("read_at")
    assert direct_vm.run_validator(leader_result=json.dumps(dict(r, site_quote="Mon-Fri 7.30am-8pm …"), sort_keys=True))
    assert not direct_vm.run_validator(leader_result=json.dumps(dict(r, same=False), sort_keys=True))
    assert not direct_vm.run_validator(leader_result=json.dumps(dict(r, site_week="Mo-Su 07:30-20:00"), sort_keys=True))


def test_a_reverted_fix_after_the_call_closed_returns_to_the_sponsor(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id, fix_id = _eligible(direct_vm, direct_deploy, direct_alice, direct_bob)
    contract.calls[call_id].ends = _day(-1)
    assert contract.close_call(call_id) == str(POT - REWARD)
    _ripen(contract, fix_id)
    _setup(direct_vm, versions=DEFAULT + [_version(3, _ts(-1), oh="Mo-Su 10:00-16:00")])
    assert contract.confirm(fix_id) == "reverted"
    c = contract.get_call(call_id)
    assert (int(c.pot), int(c.reserved), int(c.returned_total)) == (0, 0, POT)
    assert _owed(contract, direct_alice) == POT  # the closed call's pot and the reverted reward
    t = _balance(contract)
    assert (int(t["pots"]), int(t["reserved"]), int(t["owed"])) == (0, 0, POT)
    assert "to" in c.history_json and '"sponsor"' in c.history_json


def test_close_returns_the_unreserved_pot(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id, fix_id = _eligible(direct_vm, direct_deploy, direct_alice, direct_bob)
    with direct_vm.expect_revert("takes submissions until"):
        contract.close_call(call_id)
    contract.calls[call_id].ends = _day(-1)
    assert contract.close_call(call_id) == str(POT - REWARD)
    assert _owed(contract, direct_alice) == POT - REWARD and contract.get_call(call_id).state == "closed"
    _ripen(contract, fix_id)
    _setup(direct_vm)
    assert contract.confirm(fix_id) == "awaiting_wallet"  # a reserved reward survives the close
    t = _balance(contract)
    assert (int(t["pots"]), int(t["reserved"])) == (0, 0)


def test_an_unclaimed_share_goes_back_after_the_holding_period(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id, fix_id = _eligible(direct_vm, direct_deploy, direct_alice, direct_bob)
    _ripen(contract, fix_id)
    _setup(direct_vm)
    contract.confirm(fix_id)
    with direct_vm.expect_revert("held until"):
        contract.reclaim(fix_id)
    contract.calls[call_id].ends = _day(-100)
    assert contract.reclaim(fix_id) == str(REWARD - REWARD // 10)
    assert contract.get_fix(fix_id).state == "returned" and _owed(contract, direct_alice) == REWARD - REWARD // 10
    assert int(_balance(contract)["held"]) == 0


# --- validators -----------------------------------------------------------------------------------------------------------


def _leader(contract, fix_id):
    r = json.loads(contract.get_fix(fix_id).reading_json)
    for k in ("read_at", "packet_sha256"):
        r.pop(k)
    return r


def test_validators_accept_the_same_reading_in_other_words(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id, fix_id = _eligible(direct_vm, direct_deploy, direct_alice, direct_bob)
    leader = _leader(contract, fix_id)
    leader["site"]["quote"] = "Mon-Fri 7.30am-8pm, Sat 9-6, Sun 12-6"
    leader["site"]["opening_hours"] = "Mo-Fr 07:30-20:00, Sa 09:00-18:00, Su 12:00-18:00"
    assert direct_vm.run_validator(leader_result=json.dumps(leader, sort_keys=True))


@pytest.mark.parametrize("change", [
    lambda r: r.update(verdict="INELIGIBLE", code="does_not_match_site"),
    lambda r: r["weeks"].update(site="Mo-Su 07:30-20:00"),
    lambda r: r["facts"].update(mapper_uid="1"),
    lambda r: r["site"].update(found=False),
    lambda r: r.update(state="error"),
])
def test_validators_reject_a_different_reading(direct_vm, direct_deploy, direct_alice, direct_bob, change):
    contract, call_id, fix_id = _eligible(direct_vm, direct_deploy, direct_alice, direct_bob)
    leader = _leader(contract, fix_id)
    change(leader)
    assert not direct_vm.run_validator(leader_result=json.dumps(leader, sort_keys=True))


def test_lists(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, call_id, fix_id = _eligible(direct_vm, direct_deploy, direct_alice, direct_bob)
    assert [c.id for c in contract.get_calls(0, 100)] == [call_id]
    assert [f.id for f in contract.get_fixes(0, 200)] == [fix_id]
    with direct_vm.expect_revert("No fix with id fix_7"):
        contract.get_fix("fix_7")
