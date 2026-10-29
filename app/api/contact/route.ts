import { NextRequest, NextResponse } from 'next/server';

interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  /** Milliseconds between the form mounting and the submit. */
  elapsedMs?: number;
}

/** Humans can't fill five fields faster than this. */
const MIN_FILL_MS = 3000;

/**
 * True when the request comes from a page on this same host. Browsers always send Origin
 * on a POST; many scripts don't. Comparing to the request's own host (rather than a
 * hardcoded domain) keeps localhost, www and preview deployments working.
 */
function isSameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELASTIC_EMAIL_API_KEY;
  const fromEmail = 'contact@ning-xin.com';
  const toEmail = 'ningxin1007@hotmail.com';

  if (!apiKey) {
    return NextResponse.json({ error: 'Server email config missing' }, { status: 500 });
  }

  let body: ContactPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { elapsedMs } = body;
  if (!body.name || !body.email || !body.phone || !body.subject || !body.message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Bot checks. A missing elapsedMs also counts — scripts that POST straight to this
  // route never ran the form. Reply 200 so the bot sees no difference to tune against.
  const sameOrigin = isSameOrigin(req);
  if (!sameOrigin || typeof elapsedMs !== 'number' || elapsedMs < MIN_FILL_MS) {
    console.warn('Contact spam dropped:', { origin: req.headers.get('origin'), sameOrigin, elapsedMs });
    return NextResponse.json({ success: true });
  }

  const name    = escapeHtml(body.name);
  const email   = escapeHtml(body.email);
  const phone   = escapeHtml(body.phone);
  const subject = escapeHtml(body.subject);
  const message = escapeHtml(body.message);

  const htmlBody = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f1923;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1923;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#152030;border-radius:12px;overflow:hidden;border:1px solid #1e3a52;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d2137,#0a3d5c);padding:32px 40px;border-bottom:1px solid #1e3a52;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#00d4ff;opacity:0.7;">NING-XIN.COM</p>
            <h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:700;">New Contact Message</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:20px;border-bottom:1px solid #1e3a52;">
                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#00d4ff;opacity:0.6;">FROM</p>
                  <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">${name}</p>
                </td>
              </tr>

              <tr>
                <td style="padding:20px 0;border-bottom:1px solid #1e3a52;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="50%" style="padding-right:16px;">
                        <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#00d4ff;opacity:0.6;">EMAIL</p>
                        <p style="margin:0;font-size:14px;color:#a8c5da;">${email}</p>
                      </td>
                      <td width="50%">
                        <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#00d4ff;opacity:0.6;">PHONE</p>
                        <p style="margin:0;font-size:14px;color:#a8c5da;">${phone}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:20px 0;border-bottom:1px solid #1e3a52;">
                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#00d4ff;opacity:0.6;">SUBJECT</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#ffffff;">${subject}</p>
                </td>
              </tr>

              <tr>
                <td style="padding-top:20px;">
                  <p style="margin:0 0 10px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#00d4ff;opacity:0.6;">MESSAGE</p>
                  <p style="margin:0;font-size:14px;color:#a8c5da;line-height:1.7;white-space:pre-wrap;">${message}</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#0d1e2d;border-top:1px solid #1e3a52;">
            <p style="margin:0;font-size:11px;color:#4a7a9b;">Reply directly to this email to respond to ${name}.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  const params = new URLSearchParams({
    apikey: apiKey,
    from: fromEmail,
    fromName: 'Xin Ning Personal Website',
    to: toEmail,
    subject: `[Contact Form] ${body.subject}`,
    bodyHtml: htmlBody,
    replyTo: body.email,
  });

  const res = await fetch('https://api.elasticemail.com/v2/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const rawText = await res.text();
  console.error('Elastic Email raw:', res.status, rawText);

  let data: Record<string, unknown>;
  try { data = JSON.parse(rawText); } catch {
    return NextResponse.json({ error: 'Failed to send email', detail: rawText }, { status: 502 });
  }

  if (!data.success) {
    return NextResponse.json({ error: 'Failed to send email', detail: data.error ?? rawText }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
