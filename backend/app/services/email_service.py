"""Common Twilio SendGrid email service.

Usage:
    from app.services.email_service import send_email, send_organisation_invite
"""

import logging
from typing import Optional

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

from app.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    to_name: Optional[str] = None,
) -> bool:
    """Send a transactional email via Twilio SendGrid.

    Returns True on success, False on failure (logs the error).
    """
    if not settings.sendgrid_api_key:
        logger.error("SENDGRID_API_KEY is not configured — email not sent to %s", to_email)
        return False

    try:
        message = Mail(
            from_email=Email(settings.email_from_address, settings.email_from_name),
            to_emails=To(to_email, to_name or to_email),
            subject=subject,
            html_content=Content("text/html", html_content),
        )

        sg = SendGridAPIClient(settings.sendgrid_api_key)
        response = sg.send(message)
        logger.info(
            "Email sent to %s | subject=%r | status=%s",
            to_email,
            subject,
            response.status_code,
        )
        return response.status_code in (200, 202)

    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc, exc_info=True)
        return False


def send_organisation_invite(
    admin_email: str,
    admin_name: str,
    organisation_name: str,
    temp_password: str,
    login_url: str,
) -> bool:
    """Send an organisation invitation email with login credentials."""
    subject = f"You're invited to join {organisation_name} on HSE Intelligence"
    html_content = _build_invite_html(
        admin_name=admin_name,
        organisation_name=organisation_name,
        email=admin_email,
        temp_password=temp_password,
        login_url=login_url,
    )
    return send_email(to_email=admin_email, subject=subject, html_content=html_content, to_name=admin_name)


def _build_invite_html(
    admin_name: str,
    organisation_name: str,
    email: str,
    temp_password: str,
    login_url: str,
) -> str:
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Organisation Invitation</title>
</head>
<body style="margin:0;padding:0;background:#F3F7FF;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F7FF;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;border:1px solid #D6E4FF;
                      box-shadow:0 4px 20px rgba(0,0,0,0.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0B3D91,#1D4ED8);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                HSE Intelligence
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                Health, Safety &amp; Environment Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#0A0A0A;font-size:20px;font-weight:600;">
                Welcome, {admin_name}!
              </h2>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                You have been invited to set up and manage
                <strong style="color:#0B3D91;">{organisation_name}</strong>
                on the HSE Intelligence platform.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#F0F4FF;border:1px solid #C7D7FD;border-radius:8px;
                            margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 4px;color:#6B7280;font-size:12px;
                               font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                      Your Login Credentials
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                      <tr>
                        <td style="padding:6px 0;color:#374151;font-size:14px;width:130px;">
                          <strong>Login URL</strong>
                        </td>
                        <td style="padding:6px 0;">
                          <a href="{login_url}"
                             style="color:#1D4ED8;font-size:14px;text-decoration:none;">
                            {login_url}
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#374151;font-size:14px;">
                          <strong>Email</strong>
                        </td>
                        <td style="padding:6px 0;color:#0A0A0A;font-size:14px;">
                          {email}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#374151;font-size:14px;">
                          <strong>Password</strong>
                        </td>
                        <td style="padding:6px 0;">
                          <code style="background:#E0E7FF;color:#1D4ED8;padding:3px 8px;
                                       border-radius:4px;font-size:14px;font-weight:600;">
                            {temp_password}
                          </code>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;color:#6B7280;font-size:13px;line-height:1.5;">
                For security, please change your password after your first login.
                This invitation was sent by the HSE Intelligence Super Admin team.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="border-radius:8px;overflow:hidden;">
                    <a href="{login_url}"
                       style="display:inline-block;background:linear-gradient(135deg,#0B3D91,#1D4ED8);
                              color:#ffffff;text-decoration:none;padding:14px 32px;
                              font-size:15px;font-weight:600;border-radius:8px;">
                      Access HSE Intelligence
                    </a>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 24px;" />
              <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.5;">
                If you did not expect this invitation, please ignore this email or contact
                <a href="mailto:support@hse-intelligence.com"
                   style="color:#1D4ED8;text-decoration:none;">support@hse-intelligence.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;
                        padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;">
                &copy; 2026 HSE Intelligence. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
