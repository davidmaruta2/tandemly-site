// api/contact.js - Vercel serverless function for the Tandemly splash page's
// contact/early-access form. Same pattern as
// supabase/functions/send-support-message/index.ts in the main app repo:
// RESEND_API_KEY only ever lives server-side, never faked success.
//
// Setup on Vercel:
//   1. Add this file at api/contact.js in the site's repo root.
//   2. In the Vercel project settings, add an environment variable
//      RESEND_API_KEY with the same key already used by the app.
//   3. Deploy - Vercel wires POST /api/contact to this handler automatically.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_ADDRESS = 'admin@luxfordinteractive.com';
const FROM_ADDRESS = 'Tandemly Website <hello@tandemly.uk>'; // update once tandemly.uk email is set up; falls back to luxfordinteractive.com sender until then

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTH = 4000;

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY is not set');
    res.status(500).json({ error: 'Not configured yet. Please email admin@luxfordinteractive.com directly.' });
    return;
  }

  const { name, email, message } = req.body || {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim() : '';
  const cleanMessage = typeof message === 'string' ? message.trim() : '';

  if (!cleanName) return res.status(400).json({ error: 'Please enter your name.' });
  if (!EMAIL_RE.test(cleanEmail)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!cleanMessage || cleanMessage.length > MAX_LENGTH) {
    return res.status(400).json({ error: cleanMessage ? 'Message is too long.' : 'Please enter a message.' });
  }

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [TO_ADDRESS],
      reply_to: cleanEmail,
      subject: `[Tandemly website] Message from ${cleanName}`,
      html:
        `<p><strong>Name:</strong> ${escapeHtml(cleanName)}</p>` +
        `<p><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>` +
        `<p><strong>Message:</strong></p><p>${escapeHtml(cleanMessage).replace(/\n/g, '<br/>')}</p>`,
    }),
  });

  if (!resendResponse.ok) {
    const detail = await resendResponse.text().catch(() => '');
    console.error('[contact] Resend send failed', resendResponse.status, detail);
    res.status(502).json({ error: "We couldn't send that just now. Please try again in a moment." });
    return;
  }

  res.status(200).json({ ok: true });
}
