import { createClient } from '@supabase/supabase-js';

const DEFAULT_TABLE_NAME = 'crt_contact_requests';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_NOTIFICATION_TO = 'rg@ravon.dev';

function getRequiredEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function getSupabaseAdminClient() {
    return createClient(
        getRequiredEnv('SUPABASE_URL'),
        getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    );
}

function getOptionalEnv(name) {
    return normalizeString(process.env[name]);
}

function normalizeString(value) {
    return String(value ?? '').trim();
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function validatePayload(payload) {
    const name = normalizeString(payload.name);
    const contact = normalizeString(payload.contact);
    const details = normalizeString(payload.details);
    const submittedAt = normalizeString(payload.submittedAt);

    if (name.length < 2 || name.length > 120) {
        return { error: 'Please enter your name.' };
    }

    if (contact.length < 5 || contact.length > 160) {
        return { error: 'Please enter a valid email address or phone number.' };
    }

    const digits = contact.replace(/\D/g, '');
    const looksLikeEmail = EMAIL_PATTERN.test(contact);
    const looksLikePhone = digits.length >= 7 && digits.length <= 20;
    if (!looksLikeEmail && !looksLikePhone) {
        return { error: 'Please enter a valid email address or phone number.' };
    }

    if (details.length < 8 || details.length > 2000) {
        return { error: 'Please share a few details about your request.' };
    }

    return {
        data: {
            name,
            contact,
            details,
            submitted_at_client: submittedAt || null
        }
    };
}

function isNotificationConfigured() {
    return Boolean(getOptionalEnv('RESEND_API_KEY') && getOptionalEnv('CONTACT_NOTIFICATION_FROM'));
}

function buildNotificationEmail({ submissionId, payload, ipAddress, userAgent }) {
    const contactIsEmail = EMAIL_PATTERN.test(payload.contact);
    const replyTo = contactIsEmail ? [payload.contact] : undefined;
    const submittedAt = new Date().toISOString();
    const subject = `New ravon.dev contact: ${payload.name}`;
    const text = [
        'New contact submission from ravon.dev',
        '',
        `Reference ID: ${submissionId}`,
        `Name: ${payload.name}`,
        `Contact: ${payload.contact}`,
        `Submitted at: ${submittedAt}`,
        `Client submitted at: ${payload.submitted_at_client || 'not provided'}`,
        `IP address: ${ipAddress || 'not available'}`,
        `User agent: ${userAgent || 'not available'}`,
        '',
        'Details:',
        payload.details
    ].join('\n');
    const html = `
        <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; line-height: 1.6; color: #111827;">
            <h2 style="margin: 0 0 16px;">New contact submission from ravon.dev</h2>
            <p style="margin: 0 0 16px;"><strong>Reference ID:</strong> ${escapeHtml(submissionId)}</p>
            <table style="border-collapse: collapse; margin-bottom: 16px;">
                <tr><td style="padding: 4px 12px 4px 0;"><strong>Name</strong></td><td>${escapeHtml(payload.name)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0;"><strong>Contact</strong></td><td>${escapeHtml(payload.contact)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0;"><strong>Submitted at</strong></td><td>${escapeHtml(submittedAt)}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0;"><strong>Client submitted at</strong></td><td>${escapeHtml(payload.submitted_at_client || 'not provided')}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0;"><strong>IP address</strong></td><td>${escapeHtml(ipAddress || 'not available')}</td></tr>
                <tr><td style="padding: 4px 12px 4px 0;"><strong>User agent</strong></td><td>${escapeHtml(userAgent || 'not available')}</td></tr>
            </table>
            <div style="margin-bottom: 8px;"><strong>Details</strong></div>
            <pre style="white-space: pre-wrap; margin: 0; padding: 16px; background: #f3f4f6; border-radius: 8px;">${escapeHtml(payload.details)}</pre>
        </div>
    `.trim();

    return { subject, text, html, replyTo };
}

async function sendNotificationEmail({ submissionId, payload, ipAddress, userAgent }) {
    if (!isNotificationConfigured()) {
        return { sent: false, skipped: true, reason: 'email notification env is incomplete' };
    }

    const apiKey = getOptionalEnv('RESEND_API_KEY');
    const from = getOptionalEnv('CONTACT_NOTIFICATION_FROM');
    const to = getOptionalEnv('CONTACT_NOTIFICATION_TO') || DEFAULT_NOTIFICATION_TO;
    const { subject, text, html, replyTo } = buildNotificationEmail({
        submissionId,
        payload,
        ipAddress,
        userAgent
    });

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `contact-submission-${submissionId}`
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject,
            text,
            html,
            reply_to: replyTo
        })
    });

    const responseBody = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = responseBody?.message || responseBody?.error || `Resend request failed with ${response.status}`;
        throw new Error(message);
    }

    return {
        sent: true,
        id: responseBody?.id || null
    };
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    let body;
    try {
        body = req.body || {};
    } catch (_) {
        return res.status(400).json({ error: 'Invalid request body.' });
    }

    const validation = validatePayload(body);
    if (validation.error) {
        return res.status(400).json({ error: validation.error });
    }

    try {
        const supabase = getSupabaseAdminClient();
        const tableName = process.env.SUPABASE_INQUIRIES_TABLE || DEFAULT_TABLE_NAME;
        const forwardedFor = req.headers['x-forwarded-for'];
        const ipAddress = Array.isArray(forwardedFor)
            ? forwardedFor[0]
            : String(forwardedFor || '').split(',')[0].trim() || null;

        const { data, error } = await supabase
            .from(tableName)
            .insert([
                {
                    ...validation.data,
                    source: 'fake-crt',
                    source_page: 'https://www.ravon.dev',
                    ip_address: ipAddress,
                    user_agent: req.headers['user-agent'] || null
                }
            ])
            .select('id')
            .single();

        if (error) {
            console.error('Supabase insert failed:', error);
            return res.status(502).json({
                error: 'Unable to save your request right now. Please try again shortly.'
            });
        }

        let notification = { sent: false, skipped: true, reason: 'not attempted' };
        try {
            notification = await sendNotificationEmail({
                submissionId: data?.id || 'unknown',
                payload: validation.data,
                ipAddress,
                userAgent: req.headers['user-agent'] || null
            });
        } catch (notificationError) {
            notification = {
                sent: false,
                skipped: false,
                reason: notificationError.message
            };
            console.error('Contact notification email failed:', notificationError);
        }

        return res.status(200).json({
            ok: true,
            id: data?.id || null,
            notificationSent: Boolean(notification.sent)
        });
    } catch (error) {
        console.error('Contact submission failed:', error);
        return res.status(500).json({
            error: 'Unable to save your request right now. Please try again shortly.'
        });
    }
}
