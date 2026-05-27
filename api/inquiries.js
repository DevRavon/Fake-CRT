import { createClient } from '@supabase/supabase-js';

const DEFAULT_TABLE_NAME = 'crt_contact_requests';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function normalizeString(value) {
    return String(value ?? '').trim();
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

        return res.status(200).json({ ok: true, id: data?.id || null });
    } catch (error) {
        console.error('Contact submission failed:', error);
        return res.status(500).json({
            error: 'Unable to save your request right now. Please try again shortly.'
        });
    }
}
