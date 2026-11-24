"""SponsorPlay workflow layer — the product spine.

This package implements the human-in-the-loop workflow described in
``SPEC_WORKFLOW_V1.md``: AI drafts, a human decides, the system enforces.

It is intentionally self-contained. The legacy routers and the in-memory store
keep working for the old prototype frontend; the new endpoints in
``app.api.workflow`` are the contract the product frontend is built against.
"""
