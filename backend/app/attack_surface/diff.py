"""Diff stage: compare this run against the previous one.

Change is the signal that matters most. A static list of exposures gets read
once and ignored; "three assets appeared since last week, one of them an admin
panel" is what makes someone act. This module produces that delta.

It works on identity *keys*, not object equality. Two findings are "the same
finding" if they share (asset_value, title) -- the same problem on the same
host -- even if incidental evidence differs. That definition is the whole
design: too loose and you miss real regressions; too strict (hashing the whole
object) and a changed latency number reports as a brand-new finding every run,
drowning the user in false churn. We pick the stable identity a human would use.

Kept pure and DB-free: it takes two plain collections (previous, current) and
returns a structured delta. The orchestrator is responsible for loading the
previous run's rows from the datastore and passing them in. That keeps diff
trivially testable and lets the same logic diff findings, assets, or services.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Hashable, Sequence, TypeVar

from .types import Finding

T = TypeVar("T")


@dataclass
class Delta:
    added: list = field(default_factory=list)      # in current, not in previous
    removed: list = field(default_factory=list)    # in previous, not in current
    persisting: list = field(default_factory=list)  # in both

    @property
    def summary(self) -> dict:
        return {
            "added": len(self.added),
            "removed": len(self.removed),
            "persisting": len(self.persisting),
        }


def diff_by_key(
    previous: Sequence[T],
    current: Sequence[T],
    key: Callable[[T], Hashable],
) -> Delta:
    """Generic key-based set diff. Returns current-side objects for added/
    persisting (they carry fresh data) and previous-side objects for removed."""
    prev_index = {key(p): p for p in previous}
    curr_index = {key(c): c for c in current}

    prev_keys = set(prev_index)
    curr_keys = set(curr_index)

    return Delta(
        added=[curr_index[k] for k in curr_keys - prev_keys],
        removed=[prev_index[k] for k in prev_keys - curr_keys],
        persisting=[curr_index[k] for k in curr_keys & prev_keys],
    )


def finding_key(f: Finding) -> Hashable:
    """Stable identity for a finding: same problem, same host. Deliberately
    excludes severity and evidence so a re-scored severity change doesn't read
    as add+remove -- that would hide the fact that it's the *same* issue."""
    return (f.asset_value, f.title)


def diff_findings(previous: Sequence[Finding], current: Sequence[Finding]) -> Delta:
    return diff_by_key(previous, current, finding_key)
