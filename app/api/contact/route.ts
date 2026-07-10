import { NextRequest, NextResponse } from 'next/server';

interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELASTIC_EMAIL_API_KEY;
  const fromEmail = 'jxnx888@gmail.com';
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

  const { name, email, phone, subject, message } = body;
  if (!name || !email || !phone || !subject || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const htmlBody = `
    <h2>Name:</h2><p>${name}</p>
    <h2>Email:</h2><p>${email}</p>
    <h2>Phone:</h2><p>${phone}</p>
    <h2>Subject:</h2><p>${subject}</p>
    <h2>Message:</h2><p>${message}</p>
  `;

  const params = new URLSearchParams({
    apikey: apiKey,
    from: fromEmail,
    fromName: 'Xin Ning Personal Website',
    to: toEmail,
    subject: `[Contact Form] ${subject}`,
    bodyHtml: htmlBody,
    replyTo: email,
  });

  const res = await fetch('https://api.elasticemail.com/v2/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json();

  if (!data.success) {
    console.error('Elastic Email error:', data.error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
