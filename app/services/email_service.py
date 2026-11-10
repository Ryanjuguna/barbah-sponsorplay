"""
Barbah SponsorPlay - Beneficiary Proposal Email Dispatch Service
PayPal AI Hackathon - Track 02: Sponsor Play
Sends automated, professional HTML sponsorship proposals to creators and team captains.
Supports live SMTP (Gmail, Outlook, SendGrid) with seamless resilient local store fallback.
"""

import os
import uuid
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional, Dict, Any

from app.config import settings
from app.models.schemas import Proposal, EmailDispatchRecord
from app.models.database import db

class EmailService:
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.sender_name = settings.SMTP_SENDER_NAME
        self.sender_email = settings.SMTP_SENDER_EMAIL or "proposals@barbahgames.com"

    def is_smtp_configured(self) -> bool:
        return bool(self.smtp_username and self.smtp_password and not self.smtp_password.startswith("placeholder"))

    def generate_proposal_html(self, proposal: Proposal, recipient_name: str = "Creator / Esports Captain") -> str:
        """
        Generates an elite, co-branded HTML sponsorship proposal email template.
        """
        brand_name = proposal.brand_name
        proposal_id = proposal.id
        budget_usd = f"${proposal.total_budget_usd:,.2f}"
        budget_kes = f"KES {proposal.total_budget_kes:,.2f}"
        net_usd = f"${proposal.net_creator_disbursement_usd:,.2f}"
        net_kes = f"KES {proposal.net_creator_disbursement_kes:,.2f}"
        wht_usd = f"${proposal.withholding_tax_usd:,.2f}"
        wht_kes = f"KES {proposal.withholding_tax_kes:,.2f}"
        platform_fee_usd = f"${proposal.platform_fee_usd:,.2f}"

        creators_list_html = "".join([
            f"""
            <div style="background: #111827; border: 1px solid #374151; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                <div style="color: #10b981; font-weight: bold; font-size: 14px;">{c.name} <span style="color: #9ca3af; font-weight: normal;">(@{c.gamer_tag})</span></div>
                <div style="color: #d1d5db; font-size: 12px; margin-top: 4px;">Role: {c.type} | Game: {c.primary_game} | Location: {c.location}</div>
                <div style="color: #9ca3af; font-size: 11px; margin-top: 2px;">Monthly Reach: {c.monthly_reach:,} | Safety Score: {c.brand_safety_score}%</div>
            </div>
            """
            for c in proposal.creators
        ])

        milestones_html = "".join([
            f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #374151; color: #10b981; font-weight: bold; font-family: monospace;">Phase {m.milestone_number} ({m.percentage}%)</td>
                <td style="padding: 10px; border-bottom: 1px solid #374151; color: #f3f4f6;">
                    <strong>{m.title}</strong><br>
                    <span style="color: #9ca3af; font-size: 12px;">{m.description}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #374151; color: #38bdf8; font-weight: bold; font-family: monospace; text-align: right;">${m.amount_usd:,.2f}</td>
            </tr>
            """
            for m in proposal.milestones
        ])

        review_url = f"http://{settings.HOST}:{settings.PORT}/?proposal={proposal_id}"

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sponsorship Proposal from {brand_name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f9fafb;">
    <div style="max-width: 650px; margin: 30px auto; background-color: #0b0f19; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #065f46 0%, #064e3b 50%, #022c22 100%); padding: 30px 24px; border-bottom: 2px solid #10b981;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 18px; font-weight: 800; letter-spacing: 1px; color: #ffffff;">BARBAH SPONSORPLAY</span>
                <span style="background: #10b981; color: #064e3b; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase;">Official Offer</span>
            </div>
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 16px 0 4px 0;">New Sponsorship Contract Offer</h1>
            <p style="color: #a7f3d0; font-size: 14px; margin: 0;">from <strong>{brand_name}</strong> via PayPal AI Hackathon Track 02</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 24px;">
            <p style="font-size: 15px; color: #e5e7eb; line-height: 1.6; margin-top: 0;">
                Hello <strong>{recipient_name}</strong>,
            </p>
            <p style="font-size: 14px; color: #9ca3af; line-height: 1.6;">
                Congratulations! <strong>{brand_name}</strong> has scouted your gaming profile via Barbah SponsorPlay's Talent Intelligence Radar and drafted an official sponsorship agreement for your upcoming esports broadcasts and community activations.
            </p>

            <!-- Financial Highlight Card -->
            <div style="background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 18px; margin: 20px 0;">
                <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px;">Total Guaranteed Sponsorship Budget</div>
                <div style="font-size: 28px; font-weight: 800; color: #10b981; margin: 6px 0;">{budget_usd} <span style="font-size: 16px; color: #9ca3af; font-weight: normal;">({budget_kes})</span></div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid #1f2937; font-size: 12px;">
                    <div>
                        <span style="color: #9ca3af;">Net Creator Payout (95%):</span><br>
                        <strong style="color: #38bdf8; font-size: 14px;">{net_usd}</strong> <span style="color: #6b7280;">({net_kes})</span>
                    </div>
                    <div>
                        <span style="color: #9ca3af;">KRA 5% WHT Remitted:</span><br>
                        <strong style="color: #f87171; font-size: 14px;">{wht_usd}</strong> <span style="color: #6b7280;">(Section 16 Compliant)</span>
                    </div>
                </div>
            </div>

            <!-- Beneficiary Team / Creator -->
            <h3 style="color: #f3f4f6; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Designated Beneficiary Talent</h3>
            {creators_list_html}

            <!-- Milestone Schedule Table -->
            <h3 style="color: #f3f4f6; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 24px; margin-bottom: 10px;">Programmatic Milestone Schedule</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; background: #0f172a; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background: #1e293b; color: #9ca3af; text-transform: uppercase; font-size: 11px;">
                        <th style="padding: 10px;">Phase</th>
                        <th style="padding: 10px;">Scope & Deliverables</th>
                        <th style="padding: 10px; text-align: right;">Payout</th>
                    </tr>
                </thead>
                <tbody>
                    {milestones_html}
                </tbody>
            </table>

            <!-- Funded Milestones & Milestone Ledger Note -->
            <div style="background: #022c22; border: 1px solid #065f46; border-radius: 8px; padding: 14px; margin-top: 20px; font-size: 12px; color: #a7f3d0; line-height: 1.6;">
                <strong>PayPal Programmatic Milestone Ledger:</strong> 100% of campaign milestone funds are committed by {brand_name} into a PayPal Orders v2 Milestone Ledger with delayed programmatic release. Disbursements are executed directly to your registered PayPal account via the PayPal Payouts API once OpenCV Computer Vision verifies stream deliverables.
            </div>

            <!-- Beneficiary Action Section -->
            <div style="margin: 28px 0 10px 0; background: #111827; border: 1px dashed #374151; border-radius: 12px; padding: 20px; text-align: center;">
                <span style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #38bdf8; letter-spacing: 1px; display: block; margin-bottom: 6px;">Action Required from Beneficiary Talent</span>
                <p style="font-size: 13px; color: #d1d5db; margin: 0 0 16px 0; line-height: 1.5;">
                    As the scouted creator or clan captain, click below to review milestone deliverables, confirm schedule availability, and countersign your acceptance.
                </p>
                <a href="{review_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #042f2e; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);">
                    Creator Action: Review & Countersign Agreement &rarr;
                </a>
            </div>
            <p style="text-align: center; font-size: 11px; color: #6b7280; margin-top: 8px;">
                Proposal ID: <code style="color: #10b981;">{proposal_id}</code> | Powered by Barbah Games Kenya
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #030712; padding: 18px 24px; border-top: 1px solid #1f2937; text-align: center; font-size: 11px; color: #6b7280;">
            <p style="margin: 0 0 6px 0;">Barbah Games Limited &bull; The Greenhouse, Ngong Road, Nairobi, Kenya</p>
            <p style="margin: 0;">Track 02: Sponsor Play &bull; PayPal Global AI Hackathon 2026</p>
        </div>
    </div>
</body>
</html>
        """
        return html

    def send_proposal_email(
        self,
        proposal: Proposal,
        override_recipients: Optional[List[str]] = None,
        custom_note: Optional[str] = None
    ) -> EmailDispatchRecord:
        """
        Sends the formatted proposal notification to all creator beneficiaries.
        If SMTP is configured, sends via smtplib; otherwise safely saves to the in-app
        email repository and generates an interactive preview.
        """
        recipients: List[str] = []
        if override_recipients:
            for r in override_recipients:
                if r and "@" in r:
                    recipients.append(r.strip())

        # Collect creator registered emails if no valid overrides
        if not recipients:
            for c in proposal.creators:
                if c.paypal_email and "@" in c.paypal_email:
                    recipients.append(c.paypal_email.strip())

        # Fallback default beneficiary email
        if not recipients:
            recipients = [settings.BENEFICIARY_DEFAULT_EMAIL]

        recipient_name = proposal.creators[0].name if proposal.creators else "Kenyan Esports Creator"
        subject = f"Official Sponsorship Proposal: {proposal.brand_name} - ${proposal.total_budget_usd:,.2f} USD"
        html_content = self.generate_proposal_html(proposal, recipient_name=recipient_name)

        email_id = f"EMAIL-{uuid.uuid4().hex[:8].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()
        status = "DISPATCHED_TO_BENEFICIARY"

        # Attempt live SMTP sending if configured
        if self.is_smtp_configured():
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{self.sender_name} <{self.sender_email}>"
                msg["To"] = ", ".join(recipients)
                part = MIMEText(html_content, "html")
                msg.attach(part)

                with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=10) as server:
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                    server.sendmail(self.sender_email, recipients, msg.as_string())
                status = "DELIVERED_SMTP"
                print(f"[EmailService] Real SMTP proposal email delivered to: {recipients}")
            except Exception as e:
                print(f"[EmailService] SMTP delivery failed ({e}). Fallback to local store.")
                status = f"SMTP_ATTEMPTED_FALLBACK: {str(e)[:30]}"
        else:
            print(f"[EmailService] Proposal notification generated for: {recipients} (Saved in local store)")

        record = EmailDispatchRecord(
            email_id=email_id,
            proposal_id=proposal.id,
            recipients=recipients,
            subject=subject,
            status=status,
            sent_at=now_iso,
            html_preview_url=f"/api/v1/notifications/email-preview/{email_id}",
            rendered_html=html_content
        )

        # Update and save proposal metadata
        proposal.beneficiary_emails = recipients
        proposal.email_dispatch_id = email_id
        db.save_proposal(proposal)

        # Save to database
        db.save_email(record)
        return record

email_service = EmailService()
