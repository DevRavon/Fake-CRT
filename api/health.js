// Minimal health endpoint to verify serverless env is wired.
// Does NOT expose the key; just reports if it exists.

export default function handler(req, res) {
    const configured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    const table = process.env.SUPABASE_INQUIRIES_TABLE || 'crt_contact_requests';
    const notificationConfigured = Boolean(
        process.env.RESEND_API_KEY &&
        process.env.CONTACT_NOTIFICATION_FROM &&
        (process.env.CONTACT_NOTIFICATION_TO || 'rg@ravon.dev')
    );
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true, configured, table, notificationConfigured });
}
