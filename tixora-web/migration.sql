-- Tixora Database Migration — run in Supabase SQL Editor
  -- Schema aligned with tixora-bot types (discord.js v14 ticket bot)

  -- ── Guilds ───────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS guilds (
    guild_id                TEXT PRIMARY KEY,
    premium                 BOOLEAN NOT NULL DEFAULT FALSE,
    log_channel_id          TEXT,
    transcript_channel_id   TEXT,
    bot_token_override      TEXT,
    prefix                  TEXT NOT NULL DEFAULT '!',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- ── Priority Levels ──────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS priority_levels (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    guild_id    TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    color_hex   TEXT NOT NULL DEFAULT '#808080',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_priority_levels_guild ON priority_levels(guild_id);

  -- ── Forms ────────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS forms (
    id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    guild_id       TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    questions_json JSONB NOT NULL DEFAULT '[]',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_forms_guild ON forms(guild_id);

  -- ── Categories ───────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS categories (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    guild_id            TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    target_channel_id   TEXT,
    form_id             TEXT REFERENCES forms(id) ON DELETE SET NULL,
    default_priority_id TEXT REFERENCES priority_levels(id) ON DELETE SET NULL,
    staff_roles_json    JSONB NOT NULL DEFAULT '[]',
    -- Web dashboard extras (not used by bot, ignored if NULL)
    welcome_message     TEXT,
    naming_scheme       TEXT NOT NULL DEFAULT 'ticket-{username}',
    max_open_per_user   INTEGER NOT NULL DEFAULT 1,
    private_thread      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_categories_guild ON categories(guild_id);

  -- ── Panels ───────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS panels (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    guild_id        TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
    name            TEXT NOT NULL DEFAULT 'Untitled Panel',
    embed_json      JSONB NOT NULL DEFAULT '{"title":"Support","description":"Click a button below to open a ticket.","color":7419530}',
    buttons_json    JSONB NOT NULL DEFAULT '[]',
    channel_id      TEXT,
    message_id      TEXT,
    -- Template / sharing (web only)
    is_template     BOOLEAN NOT NULL DEFAULT FALSE,
    share_code      TEXT UNIQUE,
    template_name   TEXT,
    template_desc   TEXT,
    template_uses   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_panels_guild ON panels(guild_id);
  CREATE INDEX IF NOT EXISTS idx_panels_share_code ON panels(share_code) WHERE share_code IS NOT NULL;

  -- ── Staff Roles (web dashboard permissions) ──────────────────────────────────
  CREATE TABLE IF NOT EXISTS staff_roles (
    id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    guild_id         TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
    role_id          TEXT NOT NULL,
    permissions_json JSONB NOT NULL DEFAULT '{"view":true,"close":true,"claim":true,"reopen":false,"manage":false,"blacklist":false,"delete":false}',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (guild_id, role_id)
  );
  CREATE INDEX IF NOT EXISTS idx_staff_roles_guild ON staff_roles(guild_id);

  -- ── Tickets ───────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS tickets (
    id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    guild_id          TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
    channel_id        TEXT,
    opener_id         TEXT NOT NULL,
    category_id       TEXT REFERENCES categories(id) ON DELETE SET NULL,
    priority_id       TEXT REFERENCES priority_levels(id) ON DELETE SET NULL,
    status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','deleted')),
    claimed_by        TEXT,
    tags_json         JSONB NOT NULL DEFAULT '[]',
    form_answers_json JSONB,
    opened_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at         TIMESTAMPTZ,
    close_reason      TEXT,
    last_activity_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_tickets_guild ON tickets(guild_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_tickets_opener ON tickets(opener_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_opened_at ON tickets(opened_at DESC);

  -- ── Ticket Members ────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS ticket_members (
    ticket_id  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL,
    added_by   TEXT NOT NULL,
    PRIMARY KEY (ticket_id, user_id)
  );

  -- ── Ticket Actions ────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS ticket_actions (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    ticket_id     TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    actor_id      TEXT NOT NULL,
    action_type   TEXT NOT NULL,
    metadata_json JSONB NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_ticket_actions_ticket ON ticket_actions(ticket_id);

  -- ── Transcripts ───────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS transcripts (
    ticket_id     TEXT PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
    messages_json JSONB NOT NULL DEFAULT '[]'
  );

  -- ── AI Summaries ──────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS ai_summaries (
    ticket_id   TEXT PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    model_used  TEXT NOT NULL DEFAULT 'meta/llama-3.1-8b-instruct'
  );

  -- ── Ticket Ratings ────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS ticket_ratings (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    ticket_id     TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    guild_id      TEXT NOT NULL,
    rated_by      TEXT NOT NULL,
    rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_ratings_guild ON ticket_ratings(guild_id);

  -- ── Blacklist ─────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS blacklist (
    id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    guild_id   TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL,
    created_by TEXT NOT NULL,
    reason     TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (guild_id, user_id)
  );
  CREATE INDEX IF NOT EXISTS idx_blacklist_guild ON blacklist(guild_id);

  -- ── Changelogs (web admin only) ───────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS changelogs (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    version      TEXT NOT NULL,
    title        TEXT NOT NULL,
    body_md      TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- ── Ticket Templates (web community gallery) ──────────────────────────────────
  CREATE TABLE IF NOT EXISTS ticket_templates (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name        TEXT NOT NULL,
    description TEXT,
    panel_data  JSONB NOT NULL,
    author_id   TEXT NOT NULL,
    uses        INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- ── Seed: sample changelog ────────────────────────────────────────────────────
  INSERT INTO changelogs (version, title, body_md) VALUES
    ('1.0.0', 'Tixora Launch', '## Tixora 1.0.0\n\nInitial release. Full ticket management system for Discord servers.\n\n**Features**\n- Panels with custom embeds and buttons\n- Forms with up to 5 questions\n- Categories with staff role routing\n- Ticket transcripts and AI summaries\n- Dashboard web app at tixora.app')
  ON CONFLICT DO NOTHING;
  