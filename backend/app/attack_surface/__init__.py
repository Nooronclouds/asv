"""Attack Surface pipeline.

A forward-only pipeline that turns a small set of authorized seeds into a
ranked list of externally-visible exposures:

    seeds -> discovery -> probe -> fingerprint -> scoring -> datastore -> diff

Each stage is an independent module. Stages only ever pass data *forward*
(as plain dataclasses defined in `types.py`), never reach back into a previous
stage, and never talk to the datastore directly -- persistence is the
orchestrator's job. That keeps a partial/failed scan recoverable and every
stage testable in isolation with plain inputs and outputs.
"""
