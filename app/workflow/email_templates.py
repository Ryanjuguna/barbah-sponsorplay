"""Offer email templates.

Rendered HTML is stored with the notification so the demo inbox can show
exactly what was sent. No external email service is required for the demo;
SMTP is used when configured.
"""

import os
from typing import Any, Dict, List

from app.workflow.money import format_minor


def public_base_url() -> str:
    return os.environ.get("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")


def offer_link(raw_token: str) -> str:
    return f"{public_base_url()}/offer/{raw_token}"


def render_offer_email(
    *,
    brand_name: str,
    creator_name: str,
    gross_minor: int,
    currency: str,
    net_creator_minor: int,
    withholding_minor: int,
    milestones: List[Dict[str, Any]],
    link: str,
    expires_at: str,
) -> Dict[str, str]:
    subject = f"{brand_name} sponsorship offer — {format_minor(net_creator_minor, currency)}"

    rows = "".join(
        f"""
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e7e2d8;color:#8a7f6d;font-size:12px;">M{m['seq']}</td>
          <td style="padding:10px;border-bottom:1px solid #e7e2d8;">
            <strong style="color:#2d2a24;">{m['title']}</strong><br>
            <span style="color:#8a7f6d;font-size:12px;">{m.get('description') or ''}</span>
          </td>
          <td style="padding:10px;border-bottom:1px solid #e7e2d8;text-align:right;font-weight:700;color:#2d2a24;">
            {format_minor(m['amount_minor'], currency)}
          </td>
        </tr>
        """
        for m in milestones
    )

    html = f"""<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f6f2ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#2d2a24;">
  <div style="max-width:620px;margin:0 auto;background:#fffdf9;border:1px solid #e7e2d8;border-radius:16px;overflow:hidden;">
    <div style="background:#2d2a24;padding:24px;">
      <div style="color:#f6f2ea;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">SponsorPlay</div>
      <h1 style="color:#fffdf9;font-size:22px;margin:10px 0 4px;">You have a sponsorship offer</h1>
      <p style="color:#c9bfae;font-size:13px;margin:0;">{brand_name}</p>
    </div>
    <div style="padding:24px;">
      <p style="font-size:15px;">Hello {creator_name},</p>
      <p style="font-size:14px;color:#5c5548;line-height:1.6;">
        {brand_name} has put together a campaign with you in mind. Review the scope and the
        milestone payments below. Nothing is final until you accept.
      </p>

      <div style="background:#f6f2ea;border-radius:12px;padding:18px;margin:18px 0;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8a7f6d;">Your net payout</div>
        <div style="font-size:28px;font-weight:800;color:#2d2a24;margin:6px 0;">{format_minor(net_creator_minor, currency)}</div>
        <div style="font-size:12px;color:#8a7f6d;">
          Gross offer {format_minor(gross_minor, currency)} ·
          withholding tax {format_minor(withholding_minor, currency)}
        </div>
      </div>

      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#8a7f6d;">Milestones</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tbody>{rows}</tbody>
      </table>

      <p style="font-size:13px;color:#5c5548;line-height:1.6;margin-top:18px;">
        Each milestone is paid after you submit the required evidence and Barbah ops approves it.
        Funds are held by SponsorPlay as a committed balance and released per approved milestone.
      </p>

      <div style="text-align:center;margin:26px 0 10px;">
        <a href="{link}" style="display:inline-block;background:#b4552d;color:#fffdf9;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">
          Review the offer
        </a>
      </div>
      <p style="text-align:center;font-size:11px;color:#8a7f6d;">
        This link expires {expires_at}. If it has expired, ask the brand to resend.
      </p>
      <p style="text-align:center;font-size:11px;color:#a89d8a;">
        Tax documents in this environment are simulated and are not valid KRA tax invoices.
      </p>
    </div>
  </div>
</body></html>"""

    text = (
        f"{brand_name} has sent you a sponsorship offer.\n\n"
        f"Net payout: {format_minor(net_creator_minor, currency)}\n"
        f"Review it here: {link}\n\n"
        f"Link expires {expires_at}."
    )
    return {"subject": subject, "html": html, "text": text}
