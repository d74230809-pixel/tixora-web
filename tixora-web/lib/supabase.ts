import { createClient } from '@supabase/supabase-js';

function getClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

let _client: ReturnType<typeof createClient> | null = null;

export const db = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    if (!_client) _client = getClient();
    return (_client as Record<string | symbol, unknown>)[prop];
  },
});

export type Guild = {
  guild_id: string;
  premium: boolean;
  premium_expires_at: string | null;
  log_channel_id: string | null;
  transcript_channel_id: string | null;
  bot_token_override: string | null;
  prefix: string;
  name: string | null;
  icon: string | null;
  member_count: number | null;
  owner_id: string | null;
  created_at: string;
};

export type Panel = {
  id: string;
  guild_id: string;
  channel_id: string | null;
  message_id: string | null;
  embed_json: Record<string, unknown>;
  buttons_json: unknown[];
  is_template: boolean;
  share_code: string | null;
  template_name: string | null;
  template_desc: string | null;
  template_uses: number;
  form_id: string | null;
  name: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  guild_id: string;
  name: string;
  target_channel_id: string | null;
  form_id: string | null;
  default_priority_id: string | null;
  staff_roles_json: string[];
  created_at: string;
};

export type Form = {
  id: string;
  guild_id: string;
  name: string;
  questions_json: unknown[];
  created_at: string;
};

export type PriorityLevel = {
  id: string;
  guild_id: string;
  name: string;
  color_hex: string;
  sort_order: number;
  created_at: string;
};

export type StaffRole = {
  id: string;
  guild_id: string;
  role_id: string;
  permissions_json: Record<string, boolean>;
  created_at: string;
};

export type Ticket = {
  id: string;
  guild_id: string;
  channel_id: string | null;
  opener_id: string;
  category_id: string | null;
  priority_id: string | null;
  status: 'open' | 'closed' | 'deleted';
  claimed_by: string | null;
  tags_json: string[];
  form_answers_json: Record<string, string> | null;
  opened_at: string;
  closed_at: string | null;
  close_reason: string | null;
  last_activity_at: string;
};

export type TicketAction = {
  id: string;
  ticket_id: string;
  actor_id: string;
  action_type: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export type Transcript = {
  id: string;
  ticket_id: string;
  messages_json: TranscriptMessage[];
  created_at: string;
};

export type TranscriptMessage = {
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  attachments: string[];
  timestamp: string;
};

export type AiSummary = {
  id: string;
  ticket_id: string;
  summary_text: string;
  model_used: string;
  generated_at: string;
};

export type TicketRating = {
  id: string;
  ticket_id: string;
  guild_id: string;
  rating: number;
  feedback_text: string | null;
  rated_by: string;
  rated_at: string;
};

export type TicketTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  config_json: Record<string, unknown>;
  is_public: boolean;
  share_code: string | null;
  guild_id: string | null;
  uses: number;
  author_discord_id: string | null;
  created_at: string;
};

export type Changelog = {
  id: string;
  version: string;
  title: string;
  body_md: string;
  published_at: string;
};

export type StatusIncident = {
  id: string;
  title: string;
  description: string | null;
  severity: 'operational' | 'degraded' | 'outage';
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
};
