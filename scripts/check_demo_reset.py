"""Manual check: reset the demo and inspect aggregate milestone state."""

import os
import sys
import tempfile
import traceback

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

if "--scratch" in sys.argv:
    os.environ["WORKFLOW_DB_PATH"] = os.path.join(
        tempfile.gettempdir(), "sp-demo-scratch.db"
    )
    if os.path.exists(os.environ["WORKFLOW_DB_PATH"]):
        os.remove(os.environ["WORKFLOW_DB_PATH"])

from app.workflow import demo_service, store  # noqa: E402

try:
    result = demo_service.reset("review_pending")
    print("OK", result["scenario"])
    print("counts", result["counts"])
    print("milestones", [(m["seq"], m["status"]) for m in store.find("milestones")])
    print("decisions", store.scalar("SELECT COUNT(*) FROM review_decisions"))
    print("reports", store.scalar("SELECT COUNT(*) FROM verification_reports"))
    print("queue_cases", len(store.find("verification_reports")))
except Exception:
    traceback.print_exc()
    raise SystemExit(1)
