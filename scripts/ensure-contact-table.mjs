import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_PATH = path.join(__dirname, '..', 'supabase', 'crt_contact_requests.sql');
const POSTGREST_RELOAD_SQL = "notify pgrst, 'reload schema';";

const getConnectionString = () =>
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    '';

async function main() {
    const connectionString = getConnectionString();

    if (!connectionString) {
        console.log('[db-bootstrap] POSTGRES_URL not set; skipping contact table bootstrap.');
        return;
    }

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const baseSql = await fs.readFile(SQL_PATH, 'utf8');
    const bootstrapSql = `${baseSql.trim()}\n\n${POSTGREST_RELOAD_SQL}\n`;

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false,
        },
    });

    await client.connect();

    try {
        await client.query(bootstrapSql);
        console.log('[db-bootstrap] Ensured public.crt_contact_requests exists and reloaded schema cache.');
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error('[db-bootstrap] Failed to bootstrap contact table:', error);
    process.exit(1);
});
