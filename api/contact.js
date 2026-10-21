const limits = {name:100,email:254,subject:150,message:5000};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeHtml = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).json({error:'Method not allowed.'});
  }
  if (Number(req.headers['content-length'] || 0) > 12000) return res.status(413).json({error:'Message is too long.'});
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
  if (body.website) return res.status(200).json({ok:true});
  const data = {};
  for (const key of Object.keys(limits)) {
    if (typeof body[key] !== 'string') return res.status(400).json({error:'Please complete every field.'});
    data[key] = body[key].trim();
    if (!data[key] || data[key].length > limits[key]) return res.status(400).json({error:'Please check the fields and try again.'});
  }
  if (!emailPattern.test(data.email) || /[\r\n]/.test(data.email)) return res.status(400).json({error:'Enter a valid email address.'});
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || process.env.CONTACT_NOTIFICATION_FROM;
  const to = process.env.CONTACT_TO_EMAIL || process.env.CONTACT_NOTIFICATION_TO || 'admin@ravon.dev';
  if (!apiKey || !from) return res.status(503).json({error:'The contact form is temporarily unavailable. Please email admin@ravon.dev directly.'});
  const html = `<h2>New message from ravon.dev</h2><p><strong>Name:</strong> ${escapeHtml(data.name)}</p><p><strong>Email:</strong> ${escapeHtml(data.email)}</p><p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p><p><strong>Message:</strong></p><p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>`;
  try {
    const response = await fetch('https://api.resend.com/emails',{
      method:'POST',
      signal:AbortSignal.timeout(10000),
      headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        from,
        to:[to],
        reply_to:data.email,
        subject:`Ravon.dev contact: ${data.subject}`,
        html,
        text:`New message from ravon.dev\n\nName: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject}\n\n${data.message}`
      })
    });
    if (!response.ok) {
      console.error('Resend delivery failed',response.status);
      return res.status(502).json({error:'The message could not be delivered. Please email admin@ravon.dev directly.'});
    }
    return res.status(200).json({ok:true});
  } catch (error) {
    console.error('Contact delivery error',error instanceof Error ? error.message : 'Unknown error');
    return res.status(502).json({error:'The message could not be delivered. Please email admin@ravon.dev directly.'});
  }
}
