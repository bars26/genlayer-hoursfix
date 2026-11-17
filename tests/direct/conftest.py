"""Shared helpers for direct mode tests.

The same tests run against both sources: contracts/hours_fix.py (GenLayer Studio runner) by default, and
contracts/hours_fix.bradbury.py (Bradbury Phase 2 runner) when HOURSFIX_NETWORK=bradbury, which needs
genlayer-test 0.30 and GENVM_VERSION=v0.6.0-rc10 (set below).
"""

import json
import os

BRADBURY = os.environ.get("HOURSFIX_NETWORK") == "bradbury"
if BRADBURY:
    os.environ.setdefault("GENVM_VERSION", "v0.6.0-rc10")

CONTRACT_PATH = "contracts/hours_fix.bradbury.py" if BRADBURY else "contracts/hours_fix.py"


def llm_json(obj):
    """An LLM mock answering JSON. The 0.30 harness parses string mocks into dicts, which the Bradbury runtime
    rejects (it expects text), so there the answer is passed as bytes."""
    text = json.dumps(obj)
    return text.encode() if BRADBURY else text


def to_hex(addr_bytes):
    """Checksummed hex of an address, matching Address.as_hex in the contract. Call after direct_deploy."""
    if hasattr(addr_bytes, "as_hex"):
        return addr_bytes.as_hex
    try:
        from genlayer.types import Address
    except ImportError:
        from genlayer.py.types import Address
    return Address(addr_bytes).as_hex
