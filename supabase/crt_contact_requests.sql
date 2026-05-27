create extension if not exists pgcrypto;

create table if not exists public.crt_contact_requests (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    contact text not null,
    details text not null,
    source text not null default 'fake-crt',
    source_page text not null default 'https://www.ravon.dev',
    submitted_at_client timestamptz,
    ip_address text,
    user_agent text,
    created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists crt_contact_requests_created_at_idx
    on public.crt_contact_requests (created_at desc);

alter table public.crt_contact_requests enable row level security;

revoke all on public.crt_contact_requests from anon;
revoke all on public.crt_contact_requests from authenticated;
grant all on public.crt_contact_requests to service_role;
