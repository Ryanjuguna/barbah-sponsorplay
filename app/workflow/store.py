"""SQLite persistence for the workflow layer.

Deliberately dependency-free (stdlib ``sqlite3``). The demo needs state to
survive a restart; a pilot swaps this module for Postgres without touching the
services above it.

Every table stores money as integer minor units and structured data as JSON
text. Timestamps are ISO-8601 UTC strings.
"""

import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional

from app.workflow.security import hash_password

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_DB_PATH = os.path.join(ROOT, "data", "workflow.db")
DB_PATH = os.environ.get("WORKFLOW_DB_PATH", DEFAULT_DB_PATH)

SCHEMA = """
CREATE TABLE IF NOT EXISTS orgs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kra_pin TEXT,
    billing_email TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    org_id TEXT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    password_hash TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    org_id TEXT,
    creator_id TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS creators (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gamer_tag TEXT,
    type TEXT,
    primary_game TEXT,
    platform TEXT,
    channel_url TEXT,
    location TEXT,
    monthly_reach INTEGER DEFAULT 0,
    base_rate_minor INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    brand_safety_score REAL DEFAULT 0,
    payout_method TEXT,
    payout_ref TEXT,
    tax_profile_status TEXT DEFAULT 'UNVERIFIED',
    channel_verified INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    brief_text TEXT,
    target_audience TEXT,
    objective TEXT,
    kpi TEXT,
    geography TEXT,
    budget_minor INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    starts_at TEXT,
    ends_at TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS match_runs (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    agent_version TEXT,
    model TEXT,
    result_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS syndicates (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    title TEXT NOT NULL,
    rationale TEXT,
    expected_reach INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS syndicate_members (
    id TEXT PRIMARY KEY,
    syndicate_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    role_in_syndicate TEXT,
    allocation_pct REAL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    org_id TEXT NOT NULL,
    syndicate_id TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    total_minor INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    fx_rate REAL NOT NULL DEFAULT 130.0,
    platform_fee_minor INTEGER NOT NULL DEFAULT 0,
    creator_pool_minor INTEGER NOT NULL DEFAULT 0,
    withholding_minor INTEGER NOT NULL DEFAULT 0,
    net_creator_minor INTEGER NOT NULL DEFAULT 0,
    legal_clauses_json TEXT,
    created_by TEXT,
    approved_by TEXT,
    approved_at TEXT,
    sent_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL,
    seq INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount_minor INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    due_at TEXT,
    evidence_requirements_json TEXT,
    acceptance_criteria_json TEXT,
    review_sla_hours INTEGER DEFAULT 48,
    revision_window_hours INTEGER DEFAULT 72,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    allocation_minor INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'INVITED',
    token_hash TEXT,
    token_expires_at TEXT,
    sent_at TEXT,
    viewed_at TEXT,
    accepted_at TEXT,
    declined_at TEXT,
    decline_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS counter_offers (
    id TEXT PRIMARY KEY,
    offer_id TEXT NOT NULL,
    amount_minor INTEGER NOT NULL,
    scope_json TEXT,
    dates_json TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    milestone_id TEXT NOT NULL,
    offer_id TEXT,
    uploaded_by TEXT,
    kind TEXT NOT NULL,
    label TEXT,
    original_filename TEXT,
    content_type TEXT,
    size_bytes INTEGER DEFAULT 0,
    sha256 TEXT,
    storage_key TEXT,
    captured_at TEXT,
    submitted_at TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_reports (
    id TEXT PRIMARY KEY,
    milestone_id TEXT NOT NULL,
    offer_id TEXT,
    agent_version TEXT,
    model TEXT,
    started_at TEXT,
    completed_at TEXT,
    checks_json TEXT,
    metrics_json TEXT,
    limitations_json TEXT,
    recommended_decision TEXT,
    summary TEXT,
    evidence_refs_json TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_decisions (
    id TEXT PRIMARY KEY,
    milestone_id TEXT NOT NULL,
    offer_id TEXT,
    reviewer_id TEXT NOT NULL,
    decision TEXT NOT NULL,
    reason TEXT,
    overrode_recommendation INTEGER DEFAULT 0,
    decided_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS funding_commitments (
    id TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL,
    amount_minor INTEGER NOT NULL,
    currency TEXT NOT NULL,
    provider TEXT,
    provider_ref TEXT,
    status TEXT NOT NULL DEFAULT 'CREATED',
    idempotency_key TEXT UNIQUE,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id TEXT PRIMARY KEY,
    account TEXT NOT NULL,
    direction TEXT NOT NULL,
    amount_minor INTEGER NOT NULL,
    currency TEXT NOT NULL,
    ref_type TEXT,
    ref_id TEXT,
    description TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    milestone_id TEXT,
    proposal_id TEXT,
    invoice_type TEXT NOT NULL,
    amount_minor INTEGER NOT NULL,
    tax_minor INTEGER DEFAULT 0,
    currency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ISSUED',
    etims_ref TEXT,
    issued_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_intents (
    id TEXT PRIMARY KEY,
    milestone_id TEXT NOT NULL,
    offer_id TEXT,
    amount_minor INTEGER NOT NULL,
    currency TEXT NOT NULL,
    idempotency_key TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'INTENT_CREATED',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payouts (
    id TEXT PRIMARY KEY,
    intent_id TEXT NOT NULL,
    provider TEXT,
    provider_ref TEXT,
    status TEXT NOT NULL DEFAULT 'PROCESSING',
    failure_reason TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    thread_type TEXT NOT NULL,
    thread_id TEXT NOT NULL,
    sender_id TEXT,
    sender_role TEXT,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    recipient TEXT NOT NULL,
    channel TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    status TEXT NOT NULL DEFAULT 'QUEUED',
    ref_type TEXT,
    ref_id TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    actor_id TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    before_json TEXT,
    after_json TEXT,
    request_id TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_proposals_campaign ON proposals(campaign_id);
CREATE INDEX IF NOT EXISTS idx_milestones_proposal ON milestones(proposal_id);
CREATE INDEX IF NOT EXISTS idx_offers_proposal ON offers(proposal_id);
CREATE INDEX IF NOT EXISTS idx_offers_token ON offers(token_hash);
CREATE INDEX IF NOT EXISTS idx_evidence_milestone ON evidence(milestone_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ledger_ref ON ledger_entries(ref_type, ref_id);
"""


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init() -> None:
    with connection() as conn:
        conn.executescript(SCHEMA)
    seed()


def reset() -> None:
    """Drop every row, then reseed. Used by the demo reset endpoint."""
    tables = [
        "audit_events", "notifications", "messages", "payouts", "payment_intents",
        "invoices", "ledger_entries", "funding_commitments", "review_decisions",
        "verification_reports", "evidence", "counter_offers", "offers",
        "milestones", "proposals", "syndicate_members", "syndicates",
        "match_runs", "campaigns", "creators", "sessions", "users", "orgs",
    ]
    with connection() as conn:
        for table in tables:
            conn.execute(f"DELETE FROM {table}")
    seed()


# --------------------------------------------------------------------------
# Generic helpers
# --------------------------------------------------------------------------

def insert(table: str, data: Dict[str, Any]) -> Dict[str, Any]:
    cols = ", ".join(data.keys())
    marks = ", ".join("?" for _ in data)
    with connection() as conn:
        conn.execute(f"INSERT INTO {table} ({cols}) VALUES ({marks})", tuple(data.values()))
    return data


def update(table: str, row_id: str, data: Dict[str, Any], id_col: str = "id") -> None:
    if not data:
        return
    assignments = ", ".join(f"{k} = ?" for k in data)
    with connection() as conn:
        conn.execute(
            f"UPDATE {table} SET {assignments} WHERE {id_col} = ?",
            tuple(data.values()) + (row_id,),
        )


def get(table: str, row_id: str, id_col: str = "id") -> Optional[Dict[str, Any]]:
    with connection() as conn:
        row = conn.execute(f"SELECT * FROM {table} WHERE {id_col} = ?", (row_id,)).fetchone()
    return dict(row) if row else None


def find_one(table: str, where: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    clause = " AND ".join(f"{k} = ?" for k in where)
    with connection() as conn:
        row = conn.execute(f"SELECT * FROM {table} WHERE {clause}", tuple(where.values())).fetchone()
    return dict(row) if row else None


def find(
    table: str,
    where: Optional[Dict[str, Any]] = None,
    order_by: str = "created_at ASC",
    limit: Optional[int] = None,
) -> List[Dict[str, Any]]:
    sql = f"SELECT * FROM {table}"
    params: tuple = ()
    if where:
        sql += " WHERE " + " AND ".join(f"{k} = ?" for k in where)
        params = tuple(where.values())
    sql += f" ORDER BY {order_by}"
    if limit:
        sql += f" LIMIT {int(limit)}"
    with connection() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [dict(r) for r in rows]


def execute(sql: str, params: Iterable[Any] = ()) -> None:
    with connection() as conn:
        conn.execute(sql, tuple(params))


def scalar(sql: str, params: Iterable[Any] = ()) -> Any:
    with connection() as conn:
        row = conn.execute(sql, tuple(params)).fetchone()
    return row[0] if row else None


# --------------------------------------------------------------------------
# JSON helpers
# --------------------------------------------------------------------------

def dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, default=str)


def loads(value: Optional[str], default: Any = None) -> Any:
    if not value:
        return default
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return default


# --------------------------------------------------------------------------
# Seeding
# --------------------------------------------------------------------------

DEMO_ORGS = [
    {
        "id": "org-safaricom",
        "name": "Safaricom 5G Home Gaming",
        "kra_pin": "P051234567A",
        "billing_email": "brand@sponsorplay.ke",
    },
    {
        "id": "org-apex",
        "name": "Apex Gaming Lounge",
        "kra_pin": "P059876543C",
        "billing_email": "partnerships@apexgaming.co.ke",
    },
    {
        "id": "org-savanna",
        "name": "Savanna Sports Network",
        "kra_pin": "P054561237D",
        "billing_email": "sponsors@savannasports.co.ke",
    },
]

DEMO_USERS = [
    {
        "id": "user-brand-safaricom",
        "org_id": "org-safaricom",
        "email": "brand@sponsorplay.ke",
        "name": "Safaricom Brand Team",
        "role": "BRAND_ADMIN",
        "password": "Password123!",
        "creator_id": None,
    },
    {
        "id": "user-brand-apex",
        "org_id": "org-apex",
        "email": "partnerships@apexgaming.co.ke",
        "name": "Apex Partnerships",
        "role": "BRAND_ADMIN",
        "password": "Password123!",
        "creator_id": None,
    },
    {
        "id": "user-ops",
        "org_id": None,
        "email": "ops@sponsorplay.ke",
        "name": "Barbah Ops",
        "role": "OPS_ADMIN",
        "password": "Password123!",
        "creator_id": None,
    },
    {
        "id": "user-creator-001",
        "org_id": None,
        "email": "creator@sponsorplay.ke",
        "name": "Brian 'The Beast' Diang'a",
        "role": "CREATOR",
        "password": "Password123!",
        "creator_id": "creator-001",
    },
]


def seed() -> None:
    """Idempotent seed of orgs, users and creators."""
    now = utcnow()
    with connection() as conn:
        for org in DEMO_ORGS:
            conn.execute(
                "INSERT OR IGNORE INTO orgs (id, name, kra_pin, billing_email, created_at) VALUES (?,?,?,?,?)",
                (org["id"], org["name"], org["kra_pin"], org["billing_email"], now),
            )
        for user in DEMO_USERS:
            conn.execute(
                "INSERT OR IGNORE INTO users (id, org_id, email, name, role, password_hash, created_at) "
                "VALUES (?,?,?,?,?,?,?)",
                (
                    user["id"], user["org_id"], user["email"], user["name"],
                    user["role"], hash_password(user["password"]), now,
                ),
            )

        existing = conn.execute("SELECT COUNT(*) FROM creators").fetchone()[0]
        if existing:
            return

        seed_file = os.path.join(ROOT, "data", "seed_creators.json")
        if not os.path.exists(seed_file):
            return
        with open(seed_file, "r", encoding="utf-8") as fh:
            creators = json.load(fh)

        for c in creators:
            rate_minor = int(round(float(c.get("base_rate_usd", 0)) * 100))
            conn.execute(
                "INSERT OR IGNORE INTO creators ("
                "id, name, gamer_tag, type, primary_game, platform, channel_url, location,"
                "monthly_reach, base_rate_minor, currency, brand_safety_score, payout_method,"
                "payout_ref, tax_profile_status, channel_verified, created_at"
                ") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (
                    c.get("id"), c.get("name"), c.get("gamer_tag"), c.get("type"),
                    c.get("primary_game"), c.get("platform"), c.get("channel_url"),
                    c.get("location"), int(c.get("monthly_reach", 0)), rate_minor, "USD",
                    float(c.get("brand_safety_score", 0)), "PAYPAL",
                    c.get("paypal_email"), "VERIFIED" if c.get("etims_registered") else "UNVERIFIED",
                    1 if c.get("channel_url") else 0, now,
                ),
            )


# Create the schema on import so the first request has a usable store.
init()
