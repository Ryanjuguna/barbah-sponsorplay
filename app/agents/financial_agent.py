"""
Barbah SponsorPlay - Agent 4: Financial Milestone Ledger & Tax Orchestration Agent
PayPal AI Hackathon - Track 02: Sponsor Play
"""

from typing import Dict, Any, Optional
from app.models.schemas import Proposal, Milestone, ProofOfPlayCertificate, eTIMSInvoice
from app.integrations.paypal_client import paypal_client
from app.integrations.etims_client import etims_client
from app.models.database import db

class FinancialAgent:
    def __init__(self):
        self.name = "Financial Milestone Ledger & Tax Orchestrator Agent"
        self.version = "2.0.0-milestone-ledger"

    def initialize_escrow_order(self, proposal: Proposal) -> Dict[str, Any]:
        """
        Initializes PayPal Orders v2 with platform fee split.
        Funds are secured in the Programmatic Milestone Ledger.
        """
        order_resp = paypal_client.create_multiparty_order(
            reference_id=proposal.id,
            gross_amount_usd=proposal.total_budget_usd,
            platform_fee_usd=proposal.platform_fee_usd,
            beneficiary_email="marketplace-treasury@barbahgames.com",
            campaign_title=f"{proposal.brand_name} Esports Campaign"
        )

        db.paypal_orders[order_resp["id"]] = {
            "order": order_resp,
            "proposal_id": proposal.id,
            "escrow_status": "COMMITTED_IN_LEDGER"
        }

        # Issue Barbah Platform Fee eTIMS Invoice
        platform_tax_inv = etims_client.generate_platform_fee_invoice(
            buyer_pin="P051234567A",  # Sponsor KRA PIN
            buyer_name=proposal.brand_name,
            fee_amount_kes=proposal.platform_fee_kes
        )
        db.save_invoice(platform_tax_inv)

        return order_resp

    def release_milestone_funds(
        self,
        proposal_id: str,
        milestone_id: str,
        certificate: ProofOfPlayCertificate,
        override_recipient_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Releases committed funds for a verified milestone deliverable:
        1. Validates proof certificate (Confidence >= 90%).
        2. Generates KRA eTIMS Tax Invoice (OSCU or BII) satisfying Section 16.
        3. Executes PayPal Payout to creator with 5% WHT accounted for.
        """
        proposal = db.get_proposal(proposal_id)
        if not proposal:
            raise ValueError(f"Proposal {proposal_id} not found")

        milestone = next((m for m in proposal.milestones if m.id == milestone_id), None)
        if not milestone:
            raise ValueError(f"Milestone {milestone_id} not found")

        creator = next((c for c in proposal.creators if c.id == certificate.creator_id), proposal.creators[0])

        if certificate.overall_confidence_percent < 90.0:
            return {
                "status": "HELD_IN_MILESTONE_LEDGER",
                "reason": "Verification confidence below 90% threshold. Creator remedy window active."
            }

        # 1. Generate KRA eTIMS Tax Invoice (BII if creator is unregistered)
        tax_invoice = etims_client.generate_invoice(
            buyer_pin="P051234567A",
            buyer_name=proposal.brand_name,
            supplier_pin=creator.kra_pin,
            supplier_name=creator.name,
            is_supplier_etims_registered=creator.etims_registered,
            gross_amount_kes=milestone.amount_kes,
            description=f"SponsorPlay Milestone: {milestone.title}"
        )
        db.save_invoice(tax_invoice)

        # 2. Execute PayPal Payout
        net_payout_usd = round(milestone.amount_usd * 0.95, 2)  # Net of 5% WHT
        target_payout_email = (override_recipient_email.strip() if override_recipient_email and override_recipient_email.strip() else creator.paypal_email)

        payout_resp = paypal_client.disburse_payout(
            milestone_id=milestone.id,
            recipient_email=target_payout_email,
            amount_usd=net_payout_usd,
            note=f"Net Payout for {milestone.title}. KRA eTIMS CU Ref: {tax_invoice.cu_invoice_number}"
        )

        milestone.status = "DISBURSED"
        db.save_proposal(proposal)

        return {
            "status": "DISBURSED_SUCCESSFULLY",
            "milestone_id": milestone.id,
            "creator_id": creator.id,
            "gross_amount_kes": milestone.amount_kes,
            "withholding_tax_kes": tax_invoice.withholding_tax_kes,
            "net_paid_kes": tax_invoice.net_payable_kes,
            "net_paid_usd": net_payout_usd,
            "paypal_payout_id": payout_resp["payout_item_id"],
            "payout_recipient": target_payout_email,
            "payout_mode": payout_resp.get("mode", "PAYPAL_SANDBOX"),
            "etims_cu_invoice_number": tax_invoice.cu_invoice_number,
            "qr_code_url": tax_invoice.qr_code_url,
            "tax_compliance_certified": True
        }

financial_agent = FinancialAgent()
