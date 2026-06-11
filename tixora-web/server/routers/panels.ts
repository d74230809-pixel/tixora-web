import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError, router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { getDiscordUserGuilds, postToChannel, editMessage, deleteMessage } from "../discord";
import { ButtonStyle } from "../_core/buttonStyle";

async function assertGuildAccess(accessToken: string, guildId: string) {
  const userGuilds = await getDiscordUserGuilds(accessToken);
  const MANAGE_GUILD = BigInt(0x20);
  const guild = userGuilds.find((g) => g.id === guildId);
  if (!guild) throw new TRPCError({ code: "FORBIDDEN" });
  if (!guild.owner && (BigInt(guild.permissions) & MANAGE_GUILD) !== MANAGE_GUILD)
    throw new TRPCError({ code: "FORBIDDEN" });
}

const PanelButtonSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(80),
  emoji: z.string().optional().nullable(),
  style: z.number().min(1).max(4).default(1),
  category_id: z.string().nullable().optional(),
  form_id: z.string().nullable().optional(),
});

const PanelEmbedSchema = z.object({
  title: z.string().max(256).default("Support Ticket"),
  description: z.string().max(4096).default("Click a button below to open a ticket."),
  color: z.number().default(0x7c3aed),
  footer: z.string().max(2048).optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
});

export const panelsRouter = router({
  list: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertGuildAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data, error } = await db
        .from("panels")
        .select("*")
        .eq("guild_id", input.guildId)
        .order("created_at", { ascending: false });
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data ?? [];
    }),

  create: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        name: z.string().min(1).max(100),
        embed: PanelEmbedSchema,
        buttons: z.array(PanelButtonSchema).min(1).max(5),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertGuildAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data, error } = await db
        .from("panels")
        .insert({
          guild_id: input.guildId,
          name: input.name,
          embed_json: input.embed,
          buttons_json: input.buttons,
          is_template: false,
        })
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        guildId: z.string(),
        name: z.string().min(1).max(100).optional(),
        embed: PanelEmbedSchema.optional(),
        buttons: z.array(PanelButtonSchema).min(1).max(5).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertGuildAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.name !== undefined) updates.name = input.name;
      if (input.embed !== undefined) updates.embed_json = input.embed;
      if (input.buttons !== undefined) updates.buttons_json = input.buttons;
      const { data, error } = await db
        .from("panels")
        .update(updates)
        .eq("id", input.id)
        .eq("guild_id", input.guildId)
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string(), guildId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertGuildAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      // Try to delete the Discord message first
      const { data: panel } = await db.from("panels").select("channel_id,message_id").eq("id", input.id).single();
      if (panel?.channel_id && panel?.message_id) {
        await deleteMessage(panel.channel_id, panel.message_id).catch(() => null);
      }
      const { error } = await db.from("panels").delete().eq("id", input.id).eq("guild_id", input.guildId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),

  post: protectedProcedure
    .input(z.object({ panelId: z.string(), guildId: z.string(), channelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertGuildAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { data: panel, error: fetchErr } = await db
        .from("panels")
        .select("*")
        .eq("id", input.panelId)
        .eq("guild_id", input.guildId)
        .single();
      if (fetchErr || !panel) throw new TRPCError({ code: "NOT_FOUND", message: "Panel not found" });

      const embed = panel.embed_json as Record<string, unknown>;
      const buttons = (panel.buttons_json as unknown[]).map((b) => {
        const btn = b as Record<string, unknown>;
        const customId = btn.category_id
          ? `panel_open:${btn.category_id}`
          : btn.form_id
          ? `panel_form:${btn.form_id}`
          : `panel_open:null`;
        return {
          type: 2,
          style: (btn.style as number) || 1,
          label: btn.label as string,
          custom_id: customId,
          emoji: btn.emoji ? { name: btn.emoji as string } : undefined,
        };
      });

      const discordEmbed: Record<string, unknown> = {
        title: embed.title,
        description: embed.description,
        color: embed.color,
        footer: { 
          text: embed.footer || 'Tixora Support • tixora.app', 
          icon_url: 'https://tixora.up.railway.app/favicon.ico' 
        },
      };
      if (embed.thumbnail_url) discordEmbed.thumbnail = { url: embed.thumbnail_url };
      if (embed.image_url) discordEmbed.image = { url: embed.image_url };

      const payload = {
        embeds: [discordEmbed],
        components: [{ type: 1, components: buttons.slice(0, 5) }],
      };

      let message: Record<string, unknown>;
      if (panel.message_id && panel.channel_id === input.channelId) {
        // Edit existing message
        message = await editMessage(panel.channel_id, panel.message_id, payload).catch(async () => {
          return postToChannel(input.channelId, payload);
        });
      } else {
        // Delete old message if in different channel
        if (panel.channel_id && panel.message_id) {
          await deleteMessage(panel.channel_id, panel.message_id).catch(() => null);
        }
        message = await postToChannel(input.channelId, payload);
      }

      await db
        .from("panels")
        .update({ channel_id: input.channelId, message_id: String(message.id), updated_at: new Date().toISOString() })
        .eq("id", input.panelId);

      return { success: true, messageId: String(message.id) };
    }),

  share: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        guildId: z.string(),
        templateName: z.string().min(2).max(80),
        templateDesc: z.string().max(300).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertGuildAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const shareCode = nanoid(10);
      const { data, error } = await db
        .from("panels")
        .update({
          is_template: true,
          share_code: shareCode,
          template_name: input.templateName,
          template_desc: input.templateDesc ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("guild_id", input.guildId)
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  withdraw: protectedProcedure
    .input(z.object({ id: z.string(), guildId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertGuildAccess(ctx.user.accessToken, input.guildId);
      const db = getDb();
      const { error } = await db
        .from("panels")
        .update({ is_template: false, share_code: null, template_name: null, template_desc: null, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("guild_id", input.guildId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { success: true };
    }),
});
