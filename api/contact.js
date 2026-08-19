const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'proledengineeringservices@gmail.com';
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'PROLED Website <onboarding@resend.dev>';
const MAX_BODY_LENGTH = 50000;

function json(res, status, payload) {
  return res.status(status).json(payload);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }
  return String(value ?? '').trim();
}

function normalizePayload(body) {
  return Object.fromEntries(
    Object.entries(body && typeof body === 'object' ? body : {})
      .map(([key, value]) => [key, normalizeValue(value)])
  );
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

function getSubject(payload) {
  return payload.formType === 'project-inquiry'
    ? 'New Project Inquiry from PROLED Website'
    : 'New General Inquiry from PROLED Website';
}

function buildEmail(payload) {
  const labels = {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    company: 'Company',
    service: 'Service of Interest',
    services: 'Services Required',
    location: 'Project Location',
    start_date: 'Estimated Start Date',
    duration: 'Estimated Duration',
    budget: 'Approximate Budget Range',
    message: 'Message',
    description: 'Project Description',
    standards: 'Standards or Specifications',
    source: 'How They Heard About PROLED',
  };

  const fields = Object.entries(payload)
    .filter(([key, value]) => !['formType', 'subject', 'bot-field'].includes(key) && value)
    .map(([key, value]) => ({
      label: labels[key] || key,
      value: Array.isArray(value) ? value.join(', ') : value,
    }));

  const text = fields.map(({ label, value }) => `${label}: ${value}`).join('\n');
  const html = fields
    .map(({ label, value }) => `<p><strong>${escapeHtml(label)}</strong><br>${escapeHtml(value).replace(/\n/g, '<br>')}</p>`)
    .join('');

  return { text, html };
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return json(response, 405, { error: 'Method not allowed.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return json(response, 503, { error: 'Email service is not configured yet.' });
  }

  const rawBody = JSON.stringify(request.body || {});
  if (rawBody.length > MAX_BODY_LENGTH) {
    return json(response, 413, { error: 'Your submission is too large.' });
  }

  const payload = normalizePayload(request.body);

  // Quietly accept honeypot submissions without sending them.
  if (payload['bot-field']) {
    return json(response, 200, { ok: true });
  }

  const isProjectInquiry = payload.formType === 'project-inquiry';
  const requiredFields = isProjectInquiry
    ? ['name', 'company', 'phone', 'email', 'location', 'description']
    : ['name', 'email', 'message'];
  const missingField = requiredFields.find((field) => !payload[field]);

  if (missingField) {
    return json(response, 400, {
      error: `Please provide your ${missingField.replace(/_/g, ' ')}.`,
    });
  }

  if (!isValidEmail(payload.email)) {
    return json(response, 400, { error: 'Please provide a valid email address.' });
  }

  const { text, html } = buildEmail(payload);
  let resendResponse;

  try {
    resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [CONTACT_TO_EMAIL],
        reply_to: payload.email,
        subject: getSubject(payload),
        text,
        html: `<h2>${escapeHtml(getSubject(payload))}</h2>${html}`,
      }),
    });
  } catch (error) {
    console.error('Unable to reach Resend:', error);
    return json(response, 502, {
      error: 'We could not send your message right now. Please call or email us directly.',
    });
  }

  if (!resendResponse.ok) {
    console.error('Resend rejected the email:', await resendResponse.text());
    return json(response, 502, {
      error: 'We could not send your message right now. Please call or email us directly.',
    });
  }

  return json(response, 200, { ok: true });
}
