"""Scope enforcement -- the single authorization gate.

This is the most important module in the package. Everything else is plumbing;
this is what keeps the tool on the right side of "authorized scanning". Every
target, at every stage, must pass through `ScopeGuard.allows()` before a packet
leaves the process. There is exactly one gate so that authorization cannot be
"forgotten" in a new stage: a stage that skips the guard is a review-visible
omission, not a silent one.

Design choices:

* Default-deny. An empty or malformed scope allows *nothing*. The failure mode
  we refuse to have is "scanned something we shouldn't have"; scanning too
  little is merely unhelpful, scanning too much is a legal incident.

* Scope is expressed as apex domains + explicit CIDR ranges the operator
  asserted they own. A discovered subdomain is in scope only if it falls under
  an authorized apex; a discovered IP only if it sits in an authorized CIDR.
  Discovery can therefore surface names outside scope (useful signal), but the
  probe stage will refuse to *touch* them.

* We normalise inputs (lowercase, strip trailing dot, reject wildcards) so that
  `Example.COM.` and `example.com` are the same authority and cannot be used to
  smuggle a target past the check.
"""

from __future__ import annotations

import ipaddress
from dataclasses import dataclass
from typing import Iterable


def _norm_host(host: str) -> str:
    return host.strip().lower().rstrip(".")


@dataclass
class ScopeGuard:
    apex_domains: frozenset      # e.g. {"example.com"}
    cidrs: tuple                 # tuple[ipaddress.ip_network]

    @classmethod
    def from_operator_input(
        cls, domains: Iterable[str], ip_ranges: Iterable[str]
    ) -> "ScopeGuard":
        apex = set()
        for d in domains or []:
            d = _norm_host(d)
            # A wildcard or empty label is never a valid *authorization* -- you
            # cannot consent to "everything". Reject rather than interpret.
            if not d or "*" in d:
                continue
            apex.add(d)

        nets = []
        for r in ip_ranges or []:
            try:
                nets.append(ipaddress.ip_network(r.strip(), strict=False))
            except (ValueError, TypeError):
                # A malformed CIDR authorizes nothing; drop it loudly upstream,
                # silently here -- default-deny means a bad range just doesn't
                # widen scope.
                continue

        return cls(apex_domains=frozenset(apex), cidrs=tuple(nets))

    def allows_domain(self, host: str) -> bool:
        host = _norm_host(host)
        # Reject anything that isn't a plausible hostname before matching. A
        # wildcard or whitespace target must never satisfy scope via a suffix
        # match (e.g. "*.example.com" endswith ".example.com" would otherwise
        # slip through). Defence in depth: discovery also strips these.
        if not host or "*" in host or any(c.isspace() for c in host):
            return False
        # In scope iff it *is* an authorized apex or is a subdomain of one.
        # The dot prefix check prevents "notexample.com" matching "example.com".
        return any(
            host == apex or host.endswith("." + apex) for apex in self.apex_domains
        )

    def allows_ip(self, ip: str) -> bool:
        try:
            addr = ipaddress.ip_address(ip.strip())
        except (ValueError, TypeError):
            return False
        return any(addr in net for net in self.cidrs)

    def allows(self, target: str) -> bool:
        """The one call every stage makes before touching a target."""
        try:
            ipaddress.ip_address(target.strip())
            return self.allows_ip(target)
        except ValueError:
            return self.allows_domain(target)

    def is_empty(self) -> bool:
        return not self.apex_domains and not self.cidrs
